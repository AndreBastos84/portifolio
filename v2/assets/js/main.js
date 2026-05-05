(() => {
  "use strict";

  const PROJECT_SECTION_ICONS = [
    `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15.5 18.25V16.75C15.5 15.6454 14.6046 14.75 13.5 14.75H10.5C9.39543 14.75 8.5 15.6454 8.5 16.75V18.25M15 8.25C15 9.90685 13.6569 11.25 12 11.25C10.3431 11.25 9 9.90685 9 8.25C9 6.59315 10.3431 5.25 12 5.25C13.6569 5.25 15 6.59315 15 8.25Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15.5 18.25V16.75C15.5 15.6454 14.6046 14.75 13.5 14.75H10.5C9.39543 14.75 8.5 15.6454 8.5 16.75V18.25M18.5 18.25V16.75C18.5 15.8174 17.8624 15.0037 17 14.75M15 8.25C15 9.90685 13.6569 11.25 12 11.25C10.3431 11.25 9 9.90685 9 8.25C9 6.59315 10.3431 5.25 12 5.25C13.6569 5.25 15 6.59315 15 8.25ZM18 9.25C18 10.4926 16.9926 11.5 15.75 11.5C14.5074 11.5 13.5 10.4926 13.5 9.25C13.5 8.00736 14.5074 7 15.75 7C16.9926 7 18 8.00736 18 9.25Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8.5 8L4.5 12L8.5 16M15.5 8L19.5 12L15.5 16M13 6L11 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6.75 15.75L4.75 19.25L8.25 17.25L15.5 10L14 8.5L6.75 15.75Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 8.5L15.5 7C16.3284 6.17157 17.6716 6.17157 18.5 7C19.3284 7.82843 19.3284 9.17157 18.5 10L17 11.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
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
    initProjects();
    window.addEventListener("resize", handleResize);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
