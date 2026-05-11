(() => {
  "use strict";

  const PROJECT_SECTION_ICONS = [
    `
      <svg viewBox="0 0 512 512" fill="none" aria-hidden="true">
        <use href="assets/icons/sprite.svg#icon-person-outline"></use>
      </svg>
    `,
    `
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <use href="assets/icons/sprite.svg#icon-flag-outline"></use>
      </svg>
    `,
    `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <use href="assets/icons/sprite.svg#icon-code-outline"></use>
      </svg>
    `,
    `
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <use href="assets/icons/sprite.svg#icon-puzzle-outline"></use>
      </svg>
    `,
  ];

  const STACK_ICON_MAP = {
    wordpress: {
      id: "icon-wordpress",
      className: "project-stack-icon project-stack-icon--wp",
      viewBox: "0 0 48 48",
    },
    html5: {
      id: "icon-html5",
      className: "project-stack-icon project-stack-icon--html",
      viewBox: "0 0 27.17 27.17",
    },
    css3: {
      id: "icon-css3",
      className: "project-stack-icon project-stack-icon--css",
      viewBox: "0 0 32 32",
    },
    javascript: {
      id: "icon-javascript",
      className: "project-stack-icon project-stack-icon--js",
      viewBox: "0 0 32 32",
    },
    php: {
      id: "icon-php",
      className: "project-stack-icon project-stack-icon--php",
      viewBox: "0 0 512 512",
    },
  };

  const menuToggle = document.querySelector(".menu-toggle");
  const siteNav = document.querySelector(".site-nav");
  const siteHeader = document.querySelector(".site-header");
  const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');

  function setMenuState(isOpen) {
    if (!menuToggle || !siteNav) {
      return;
    }

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    siteNav.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
  }

  function closeMenu() {
    if (!menuToggle || !siteNav) {
      return;
    }

    setMenuState(false);
  }

  function toggleMenu() {
    if (!menuToggle || !siteNav) {
      return;
    }

    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";

    setMenuState(!isExpanded);
  }

  function bindNavigation() {
    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        const target = href ? document.querySelector(href) : null;

        if (!(target instanceof HTMLElement)) {
          event.preventDefault();
          closeMenu();
          return;
        }

        closeMenu();
      });
    });
  }

  function handleResize() {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  }

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const endpoint = form.dataset.contactEndpoint || "contact.php";
    const feedback = form.querySelector("[data-contact-feedback]");
    const submitButton = form.querySelector(".contact-form__submit");
    const submitLabel = submitButton?.querySelector("span");

    const fields = Array.from(
      form.querySelectorAll("input, textarea"),
    ).filter((field) => {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
        return false;
      }

      return field.name !== "website";
    });

    const fieldIdByName = {
      nome: "contact-name",
      email: "contact-email",
      mensagem: "contact-message",
      website: "contact-website",
    };

    const errorMap = {
      "contact-name": {
        valueMissing: "Informe seu nome.",
        tooShort: "Use pelo menos 2 caracteres.",
        tooLong: "Use no máximo 80 caracteres.",
      },
      "contact-email": {
        valueMissing: "Informe seu e-mail.",
        typeMismatch: "Digite um e-mail válido.",
        tooLong: "Use no máximo 160 caracteres.",
      },
      "contact-message": {
        valueMissing: "Escreva sua mensagem.",
        tooShort: "A mensagem precisa ter pelo menos 12 caracteres.",
        tooLong: "Use no máximo 2000 caracteres.",
      },
    };

    function getErrorElement(field) {
      return form.querySelector(`[data-error-for="${field.id}"]`);
    }

    function getFieldMessage(field) {
      const rules = errorMap[field.id];

      if (!rules) {
        return "";
      }

      const value = field.value.trim();

      if (field.hasAttribute("required") && !value) {
        return rules.valueMissing || "Preencha este campo.";
      }

      if (field instanceof HTMLInputElement && field.type === "email" && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!emailPattern.test(value)) {
          return rules.typeMismatch || "Digite um e-mail válido.";
        }
      }

      const minLength = Number(field.getAttribute("minlength"));
      const maxLength = Number(field.getAttribute("maxlength"));

      if (minLength && value.length < minLength) {
        return rules.tooShort || `Use pelo menos ${minLength} caracteres.`;
      }

      if (maxLength && value.length > maxLength) {
        return rules.tooLong || `Use no máximo ${maxLength} caracteres.`;
      }

      return "";
    }

    function validateField(field) {
      const errorElement = getErrorElement(field);
      const message = getFieldMessage(field);
      const isValid = !message;

      field.classList.toggle("is-invalid", !isValid);
      field.setAttribute("aria-invalid", String(!isValid));

      if (errorElement instanceof HTMLElement) {
        errorElement.textContent = message;
      }

      return isValid;
    }

    function setFeedbackMessage(message, isSuccess = false) {
      if (!(feedback instanceof HTMLElement)) {
        return;
      }

      feedback.textContent = message;
      feedback.classList.toggle("is-success", isSuccess);
      feedback.classList.toggle("is-error", Boolean(message) && !isSuccess);
    }

    function resetFieldState(field) {
      const errorElement = getErrorElement(field);

      field.classList.remove("is-invalid");
      field.setAttribute("aria-invalid", "false");

      if (errorElement instanceof HTMLElement) {
        errorElement.textContent = "";
      }
    }

    function setSubmittingState(isSubmitting) {
      form.setAttribute("aria-busy", String(isSubmitting));

      if (!(submitButton instanceof HTMLButtonElement)) {
        return;
      }

      submitButton.disabled = isSubmitting;
      submitButton.classList.toggle("is-loading", isSubmitting);

      if (submitLabel instanceof HTMLElement) {
        submitLabel.textContent = isSubmitting ? "Enviando..." : "Enviar mensagem";
      }
    }

    function applyServerErrors(errors = {}) {
      let firstInvalidField = null;

      Object.entries(errors).forEach(([fieldName, message]) => {
        const fieldId = fieldIdByName[fieldName];
        const field = fieldId ? form.querySelector(`#${fieldId}`) : null;
        const errorElement = fieldId ? form.querySelector(`[data-error-for="${fieldId}"]`) : null;

        if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
          return;
        }

        field.classList.add("is-invalid");
        field.setAttribute("aria-invalid", "true");

        if (errorElement instanceof HTMLElement) {
          errorElement.textContent = String(message);
        }

        if (!firstInvalidField) {
          firstInvalidField = field;
        }
      });

      if (firstInvalidField) {
        firstInvalidField.focus();
      }
    }

    fields.forEach((field) => {
      field.addEventListener("blur", () => {
        validateField(field);
      });

      field.addEventListener("input", () => {
        if (feedback instanceof HTMLElement && feedback.textContent) {
          setFeedbackMessage("");
        }

        if (field.classList.contains("is-invalid")) {
          validateField(field);
        }
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const firstInvalidField = fields.find((field) => !validateField(field));

      if (firstInvalidField) {
        setFeedbackMessage("");
        firstInvalidField.focus();
        return;
      }

      fields.forEach((field) => {
        resetFieldState(field);
      });

      setFeedbackMessage("");
      setSubmittingState(true);

      const formData = new FormData(form);

      fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      })
        .then(async (response) => {
          let payload = null;

          try {
            payload = await response.json();
          } catch (error) {
            payload = null;
          }

          if (!response.ok || !payload?.success) {
            const message = payload?.message || "Não foi possível enviar sua mensagem agora.";
            const errors = payload?.errors && typeof payload.errors === "object" ? payload.errors : {};

            applyServerErrors(errors);
            setFeedbackMessage(message, false);
            return;
          }

          fields.forEach((field) => {
            resetFieldState(field);
          });

          form.reset();
          setFeedbackMessage(payload.message || "Mensagem enviada com sucesso.", true);
        })
        .catch(() => {
          setFeedbackMessage("O envio falhou por instabilidade de conexão. Tente novamente.", false);
        })
        .finally(() => {
          setSubmittingState(false);
        });
    });
  }

  function initServiceCards() {
    const cards = Array.from(document.querySelectorAll("[data-service-card]")).filter(
      (card) => card instanceof HTMLElement,
    );

    if (!cards.length) {
      return;
    }

    let expandedCard = cards.find((card) => card.classList.contains("is-expanded")) || null;
    let keyboardInteraction = false;
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    function supportsHoverInteraction() {
      return hoverQuery.matches;
    }

    function syncCardState(card, isExpanded) {
      const details = card.querySelector(".service-card__details");

      card.classList.toggle("is-expanded", isExpanded);
      card.setAttribute("aria-expanded", String(isExpanded));

      if (details instanceof HTMLElement) {
        details.setAttribute("aria-hidden", String(!isExpanded));
      }
    }

    function collapseCard(card) {
      if (!(card instanceof HTMLElement)) {
        return;
      }

      syncCardState(card, false);

      if (expandedCard === card) {
        expandedCard = null;
      }
    }

    function expandCard(card) {
      if (!(card instanceof HTMLElement)) {
        return;
      }

      if (expandedCard && expandedCard !== card) {
        collapseCard(expandedCard);
      }

      syncCardState(card, true);
      expandedCard = card;
    }

    function toggleCard(card) {
      if (card.classList.contains("is-expanded")) {
        collapseCard(card);
        return;
      }

      expandCard(card);
    }

    cards.forEach((card, index) => {
      const details = card.querySelector(".service-card__details");
      const cta = card.querySelector(".service-card__cta");

      if (details instanceof HTMLElement && !details.id) {
        details.id = `service-card-details-${index + 1}`;
        card.setAttribute("aria-controls", details.id);
      }

      syncCardState(card, card.classList.contains("is-expanded"));

      card.addEventListener("mousedown", (event) => {
        const target = event.target;

        if (target instanceof Element && target.closest(".service-card__cta")) {
          return;
        }

        if (supportsHoverInteraction() && event.button === 0) {
          event.preventDefault();
        }
      });

      card.addEventListener("click", (event) => {
        const target = event.target;

        if (target instanceof Element && target.closest(".service-card__cta")) {
          return;
        }

        if (supportsHoverInteraction()) {
          expandCard(card);
          return;
        }

        toggleCard(card);
      });

      card.addEventListener("mouseenter", () => {
        if (!supportsHoverInteraction()) {
          return;
        }

        expandCard(card);
      });

      card.addEventListener("mouseleave", () => {
        if (!supportsHoverInteraction()) {
          return;
        }

        collapseCard(card);
      });

      card.addEventListener("focusin", () => {
        if (!keyboardInteraction) {
          return;
        }

        expandCard(card);
      });

      card.addEventListener("focusout", (event) => {
        if (!keyboardInteraction) {
          return;
        }

        const relatedTarget = event.relatedTarget;

        if (relatedTarget instanceof Node && card.contains(relatedTarget)) {
          return;
        }

        collapseCard(card);
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        const target = event.target;

        if (target instanceof Element && target.closest(".service-card__cta")) {
          return;
        }

        event.preventDefault();
        keyboardInteraction = true;
        toggleCard(card);
      });

      if (cta instanceof HTMLAnchorElement) {
        cta.addEventListener("click", (event) => {
          event.stopPropagation();
        });
      }
    });

    document.addEventListener(
      "keydown",
      () => {
        keyboardInteraction = true;
      },
      true,
    );

    document.addEventListener(
      "pointerdown",
      () => {
        keyboardInteraction = false;
      },
      true,
    );
  }

  function renderProjectSections(container, sections) {
    if (!(container instanceof HTMLElement)) {
      return;
    }

    container.innerHTML = "";

    sections.forEach((section, index) => {
      const card = document.createElement("article");
      card.className = "project-section";

      const icon = document.createElement("span");
      icon.className = "project-section__icon";
      icon.innerHTML = PROJECT_SECTION_ICONS[index] || PROJECT_SECTION_ICONS[0];

      const title = document.createElement("h4");
      title.textContent = section.title;

      const text = document.createElement("p");
      text.textContent = section.text;

      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(text);
      container.appendChild(card);
    });
  }

  function renderProjectTags(container, tags) {
    if (!(container instanceof HTMLElement)) {
      return;
    }

    container.innerHTML = "";

    tags.forEach((tag) => {
      const item = document.createElement("li");
      item.textContent = tag;
      container.appendChild(item);
    });
  }

  function renderProjectStack(container, stack) {
    if (!(container instanceof HTMLElement)) {
      return;
    }

    container.innerHTML = "";

    stack.forEach((itemKey) => {
      const iconData = STACK_ICON_MAP[itemKey];

      if (!iconData) {
        return;
      }

      const icon = document.createElement("span");
      icon.className = iconData.className;
      icon.setAttribute("aria-hidden", "true");

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", iconData.viewBox);

      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", `assets/icons/sprite.svg#${iconData.id}`);

      svg.appendChild(use);
      icon.appendChild(svg);
      container.appendChild(icon);
    });
  }

  function initProjects() {
    const DEFAULT_PROJECT_ID = "osjcg";
    const PROJECT_SWITCH_DURATION = 180;
    const projectData = window.PROJECTS_DATA;
    const triggers = document.querySelectorAll("[data-project-trigger]");
    const layout = document.querySelector(".projects__layout");
    const panel = document.querySelector(".projects-panel");
    const kicker = document.querySelector("[data-project-kicker]");
    const title = document.querySelector("[data-project-title]");
    const summary = document.querySelector("[data-project-summary]");
    const tags = document.querySelector("[data-project-tags]");
    const image = document.querySelector("[data-project-image]");
    const sections = document.querySelector("[data-project-sections]");
    const stack = document.querySelector("[data-project-stack]");
    const type = document.querySelector("[data-project-type]");

    if (!projectData || !triggers.length) {
      return;
    }

    const projectIds = Object.keys(projectData);
    let activeProjectId = null;
    let projectSwitchTimer = null;

    function isValidProjectId(projectId) {
      return projectIds.includes(projectId);
    }

    function getProjectIdFromHash() {
      const hash = window.location.hash.slice(1).trim();

      if (!hash) {
        return null;
      }

      const projectId = decodeURIComponent(hash);
      return isValidProjectId(projectId) ? projectId : null;
    }

    function updateProjectHash(projectId) {
      if (!isValidProjectId(projectId)) {
        return;
      }

      const nextUrl = `${window.location.pathname}${window.location.search}#${projectId}`;
      window.history.replaceState(null, "", nextUrl);
    }

    function getProjectsScrollOffset() {
      const isMobileViewport = window.matchMedia("(max-width: 900px)").matches;

      if (!isMobileViewport) {
        return 0;
      }

      const rootStyle = window.getComputedStyle(document.documentElement);
      const cssOffset = Number.parseInt(
        rootStyle.getPropertyValue("--mobile-header-height"),
        10,
      );

      if (Number.isFinite(cssOffset) && cssOffset > 0) {
        return cssOffset + 12;
      }

      if (siteHeader instanceof HTMLElement) {
        return Math.ceil(siteHeader.getBoundingClientRect().height) + 12;
      }

      return 12;
    }

    function scrollProjectsIntoView(options = {}) {
      const { behavior = "smooth" } = options;
      const scrollTarget = panel instanceof HTMLElement ? panel : layout;

      if (!(scrollTarget instanceof HTMLElement)) {
        return;
      }

      const targetTop =
        scrollTarget.getBoundingClientRect().top +
        window.scrollY -
        getProjectsScrollOffset();

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior,
      });
    }

    function applyProjectContent(project) {
      if (kicker) {
        kicker.textContent = project.kicker;
      }

      if (title) {
        title.textContent = project.title;
      }

      if (summary) {
        summary.textContent = project.summary;
      }

      if (type) {
        type.textContent = project.projectType;
      }

      if (image instanceof HTMLImageElement) {
        image.src = project.image;
        image.alt = `Projeto ${project.title}`;
      }

      renderProjectTags(tags, project.tags);
      renderProjectSections(sections, project.sections);
      renderProjectStack(stack, project.stack);
    }

    function setActiveProject(projectId, options = {}) {
      const { immediate = false, updateHash = true } = options;
      const project = projectData[projectId];

      if (!project) {
        return;
      }

      if (activeProjectId === projectId && !immediate) {
        if (updateHash) {
          updateProjectHash(projectId);
        }
        return;
      }

      triggers.forEach((trigger) => {
        const isActive = trigger.getAttribute("data-project-id") === projectId;
        trigger.classList.toggle("is-active", isActive);
        trigger.setAttribute("aria-selected", String(isActive));
      });

      if (updateHash) {
        updateProjectHash(projectId);
      }

      if (projectSwitchTimer) {
        window.clearTimeout(projectSwitchTimer);
        projectSwitchTimer = null;
      }

      if (immediate || !(panel instanceof HTMLElement)) {
        applyProjectContent(project);
        activeProjectId = projectId;
        panel?.classList.remove("is-switching");
        return;
      }

      panel.classList.add("is-switching");

      projectSwitchTimer = window.setTimeout(() => {
        applyProjectContent(project);
        activeProjectId = projectId;
        projectSwitchTimer = null;

        window.requestAnimationFrame(() => {
          panel.classList.remove("is-switching");
        });
      }, PROJECT_SWITCH_DURATION / 2);
    }

    function syncProjectFromHash(options = {}) {
      const { scroll = false, immediate = true } = options;
      const projectId = getProjectIdFromHash();

      if (!projectId) {
        return false;
      }

      setActiveProject(projectId, {
        immediate,
        updateHash: false,
      });

      if (scroll) {
        scrollProjectsIntoView({
          behavior: immediate ? "auto" : "smooth",
        });
      }

      return true;
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const projectId = trigger.getAttribute("data-project-id");

        if (!projectId) {
          return;
        }

        setActiveProject(projectId);
        scrollProjectsIntoView();
      });
    });

    window.addEventListener("hashchange", () => {
      syncProjectFromHash({
        scroll: true,
        immediate: false,
      });
    });

    if (!syncProjectFromHash({ scroll: true, immediate: true })) {
      setActiveProject(DEFAULT_PROJECT_ID, {
        immediate: true,
        updateHash: false,
      });
    }
  }

  function init() {
    if (menuToggle) {
      menuToggle.addEventListener("click", toggleMenu);
    }

    bindNavigation();
    initContactForm();
    initServiceCards();
    initProjects();
    window.addEventListener("resize", handleResize);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
