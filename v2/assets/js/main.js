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
  const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');

  function closeMenu() {
    if (!menuToggle || !siteNav) {
      return;
    }

    menuToggle.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
  }

  function toggleMenu() {
    if (!menuToggle || !siteNav) {
      return;
    }

    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    siteNav.classList.toggle("is-open", !isExpanded);
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

    const feedback = form.querySelector("[data-contact-feedback]");

    const fields = Array.from(
      form.querySelectorAll("input, textarea"),
    ).filter((field) => field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement);

    const errorMap = {
      "contact-name": {
        valueMissing: "Informe seu nome.",
        tooShort: "Use pelo menos 2 caracteres.",
      },
      "contact-email": {
        valueMissing: "Informe seu e-mail.",
        typeMismatch: "Digite um e-mail válido.",
      },
      "contact-message": {
        valueMissing: "Escreva sua mensagem.",
        tooShort: "A mensagem precisa ter pelo menos 12 caracteres.",
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

      if (minLength && value.length < minLength) {
        return rules.tooShort || `Use pelo menos ${minLength} caracteres.`;
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
    }

    function resetFieldState(field) {
      const errorElement = getErrorElement(field);

      field.classList.remove("is-invalid");
      field.setAttribute("aria-invalid", "false");

      if (errorElement instanceof HTMLElement) {
        errorElement.textContent = "";
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

      form.reset();
      setFeedbackMessage("Mensagem enviada com sucesso.", true);
    });
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
    const projectData = window.PROJECTS_DATA;
    const triggers = document.querySelectorAll("[data-project-trigger]");
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

    function setActiveProject(projectId) {
      const project = projectData[projectId];

      if (!project) {
        return;
      }

      triggers.forEach((trigger) => {
        const isActive = trigger.getAttribute("data-project-id") === projectId;
        trigger.classList.toggle("is-active", isActive);
        trigger.setAttribute("aria-selected", String(isActive));
      });

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

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const projectId = trigger.getAttribute("data-project-id");

        if (!projectId) {
          return;
        }

        setActiveProject(projectId);
      });
    });

    setActiveProject("project-01");
  }

  function init() {
    if (menuToggle) {
      menuToggle.addEventListener("click", toggleMenu);
    }

    bindNavigation();
    initContactForm();
    initProjects();
    window.addEventListener("resize", handleResize);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
