<?php
declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

$config = require __DIR__ . '/contact-config.php';

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function normalizedLength(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function normalizeInlineText($value): string
{
    $value = trim((string) $value);
    $value = str_replace(["\r", "\n", "\t"], ' ', $value);
    $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
    return trim($value);
}

function normalizeMessage($value): string
{
    $value = (string) $value;
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/\x00/u', '', $value) ?? $value;
    $value = preg_replace("/\n{3,}/", "\n\n", $value) ?? $value;
    return trim($value);
}

function sanitizeHeaderValue(string $value): string
{
    $value = str_replace(["\r", "\n"], ' ', $value);
    $value = preg_replace('/[<>]+/', '', $value) ?? $value;
    $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
    return trim($value);
}

function getCurrentHost(): string
{
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    return preg_replace('/:\d+$/', '', $host) ?? $host;
}

function isSameOriginRequest(): bool
{
    $host = getCurrentHost();
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    $referer = (string) ($_SERVER['HTTP_REFERER'] ?? '');

    if ($origin !== '') {
        $originHost = parse_url($origin, PHP_URL_HOST);
        return is_string($originHost) && $originHost === $host;
    }

    if ($referer !== '') {
        $refererHost = parse_url($referer, PHP_URL_HOST);
        return is_string($refererHost) && $refererHost === $host;
    }

    return true;
}

function buildCryptoMethod(): int
{
    $method = 0;

    $candidates = [
        'STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT',
        'STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT',
        'STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT',
        'STREAM_CRYPTO_METHOD_TLSv1_0_CLIENT',
        'STREAM_CRYPTO_METHOD_TLS_CLIENT',
    ];

    foreach ($candidates as $constantName) {
        if (defined($constantName)) {
            $method |= constant($constantName);
        }
    }

    return $method !== 0 && is_int($method) ? $method : STREAM_CRYPTO_METHOD_TLS_CLIENT;
}

function smtpRead($socket): array
{
    $response = '';
    $code = 0;

    while (!feof($socket)) {
        $line = fgets($socket, 515);

        if ($line === false) {
            break;
        }

        $response .= $line;

        if (preg_match('/^(\d{3})([ -])/', $line, $matches)) {
            $code = (int) $matches[1];

            if ($matches[2] === ' ') {
                break;
            }
        }
    }

    return [$code, trim($response)];
}

function smtpExpect($socket, array $expectedCodes, string $context): array
{
    [$code, $response] = smtpRead($socket);

    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException($context . ': ' . ($response !== '' ? $response : 'resposta SMTP inválida.'));
    }

    return [$code, $response];
}

function smtpCommand($socket, string $command, array $expectedCodes, string $context): array
{
    $written = fwrite($socket, $command . "\r\n");

    if ($written === false) {
        throw new RuntimeException($context . ': falha ao enviar comando SMTP.');
    }

    return smtpExpect($socket, $expectedCodes, $context);
}

function encodeHeaderText(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function smtpSendMail(array $config, string $replyToName, string $replyToEmail, string $subject, string $body): void
{
    $host = (string) ($config['smtp_host'] ?? '');
    $port = (int) ($config['smtp_port'] ?? 587);
    $username = (string) ($config['smtp_user'] ?? '');
    $password = (string) ($config['smtp_pass'] ?? '');
    $timeout = (int) ($config['smtp_timeout'] ?? 15);
    $fromEmail = (string) ($config['from_email'] ?? '');
    $fromName = (string) ($config['from_name'] ?? '');
    $mailTo = (string) ($config['mail_to'] ?? '');

    if ($host === '' || $username === '' || $password === '' || $fromEmail === '' || $mailTo === '') {
        throw new RuntimeException('Configuração SMTP incompleta.');
    }

    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'allow_self_signed' => false,
            'peer_name' => $host,
        ],
    ]);

    $socket = @stream_socket_client(
        sprintf('tcp://%s:%d', $host, $port),
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!is_resource($socket)) {
        throw new RuntimeException('Não foi possível conectar ao servidor SMTP.');
    }

    stream_set_timeout($socket, $timeout);

    try {
        smtpExpect($socket, [220], 'Conexão SMTP');

        $ehloHost = getCurrentHost();
        if ($ehloHost === '') {
            $ehloHost = 'localhost';
        }

        smtpCommand($socket, 'EHLO ' . $ehloHost, [250], 'EHLO');
        smtpCommand($socket, 'STARTTLS', [220], 'STARTTLS');

        $cryptoEnabled = @stream_socket_enable_crypto($socket, true, buildCryptoMethod());

        if ($cryptoEnabled !== true) {
            throw new RuntimeException('Não foi possível iniciar a criptografia TLS.');
        }

        smtpCommand($socket, 'EHLO ' . $ehloHost, [250], 'EHLO pós-TLS');
        smtpCommand($socket, 'AUTH LOGIN', [334], 'AUTH LOGIN');
        smtpCommand($socket, base64_encode($username), [334], 'Usuário SMTP');
        smtpCommand($socket, base64_encode($password), [235], 'Senha SMTP');
        smtpCommand($socket, 'MAIL FROM:<' . $fromEmail . '>', [250], 'MAIL FROM');
        smtpCommand($socket, 'RCPT TO:<' . $mailTo . '>', [250, 251], 'RCPT TO');
        smtpCommand($socket, 'DATA', [354], 'DATA');

        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'From: ' . encodeHeaderText($fromName) . ' <' . $fromEmail . '>',
            'To: <' . $mailTo . '>',
            'Reply-To: ' . encodeHeaderText($replyToName) . ' <' . $replyToEmail . '>',
            'Subject: ' . encodeHeaderText($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            'X-Mailer: PHP/' . PHP_VERSION,
        ];

        $message = implode("\r\n", $headers)
            . "\r\n\r\n"
            . chunk_split(base64_encode($body), 76, "\r\n")
            . "\r\n.";

        $written = fwrite($socket, $message . "\r\n");

        if ($written === false) {
            throw new RuntimeException('Falha ao transmitir a mensagem.');
        }

        smtpExpect($socket, [250], 'Envio SMTP');
        smtpCommand($socket, 'QUIT', [221], 'QUIT');
    } finally {
        fclose($socket);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(405, [
        'success' => false,
        'message' => 'Método não permitido.',
    ]);
}

if (!isSameOriginRequest()) {
    respond(403, [
        'success' => false,
        'message' => 'Origem não autorizada.',
    ]);
}

$requestedWith = strtolower((string) ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''));

if ($requestedWith !== 'xmlhttprequest') {
    respond(400, [
        'success' => false,
        'message' => 'Solicitação inválida.',
    ]);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);

if ($contentLength > 12000) {
    respond(413, [
        'success' => false,
        'message' => 'A mensagem enviada é maior do que o permitido.',
    ]);
}

$honeypot = trim((string) ($_POST['website'] ?? ''));

if ($honeypot !== '') {
    respond(200, [
        'success' => true,
        'message' => 'Mensagem enviada com sucesso.',
    ]);
}

$now = time();
$lastSubmit = (int) ($_SESSION['contact_last_submit'] ?? 0);

if ($lastSubmit > 0 && ($now - $lastSubmit) < 20) {
    respond(429, [
        'success' => false,
        'message' => 'Aguarde alguns segundos antes de enviar uma nova mensagem.',
    ]);
}

$nome = normalizeInlineText($_POST['nome'] ?? '');
$email = strtolower(normalizeInlineText($_POST['email'] ?? ''));
$mensagem = normalizeMessage($_POST['mensagem'] ?? '');

$errors = [];

if ($nome === '') {
    $errors['nome'] = 'Informe seu nome.';
} elseif (normalizedLength($nome) < 2) {
    $errors['nome'] = 'Use pelo menos 2 caracteres.';
} elseif (normalizedLength($nome) > 80) {
    $errors['nome'] = 'Use no máximo 80 caracteres.';
}

if ($email === '') {
    $errors['email'] = 'Informe seu e-mail.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Digite um e-mail válido.';
} elseif (normalizedLength($email) > 160) {
    $errors['email'] = 'Use no máximo 160 caracteres.';
}

if ($mensagem === '') {
    $errors['mensagem'] = 'Escreva sua mensagem.';
} elseif (normalizedLength($mensagem) < 12) {
    $errors['mensagem'] = 'A mensagem precisa ter pelo menos 12 caracteres.';
} elseif (normalizedLength($mensagem) > 2000) {
    $errors['mensagem'] = 'Use no máximo 2000 caracteres.';
}

if ($errors !== []) {
    respond(422, [
        'success' => false,
        'message' => 'Revise os campos destacados e tente novamente.',
        'errors' => $errors,
    ]);
}

$replyToName = sanitizeHeaderValue($nome);
$replyToEmail = sanitizeHeaderValue($email);
$remoteAddress = sanitizeHeaderValue((string) ($_SERVER['REMOTE_ADDR'] ?? 'não informado'));
$userAgent = sanitizeHeaderValue((string) ($_SERVER['HTTP_USER_AGENT'] ?? 'não informado'));

$subject = 'Novo contato via site';
$body = implode("\n", [
    'Novo contato recebido pelo formulário do site.',
    '',
    'Nome: ' . $nome,
    'E-mail: ' . $email,
    'IP: ' . $remoteAddress,
    'User-Agent: ' . $userAgent,
    'Data: ' . date('d/m/Y H:i:s'),
    '',
    'Mensagem:',
    $mensagem,
]);

try {
    smtpSendMail($config, $replyToName, $replyToEmail, $subject, $body);
} catch (Throwable $exception) {
    error_log('[contact.php] ' . $exception->getMessage());

    respond(500, [
        'success' => false,
        'message' => 'Não foi possível concluir o envio agora. Tente novamente em instantes.',
    ]);
}

$_SESSION['contact_last_submit'] = $now;

respond(200, [
    'success' => true,
    'message' => 'Mensagem enviada com sucesso.',
]);
