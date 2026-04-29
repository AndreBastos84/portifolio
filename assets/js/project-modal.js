(() => {
  "use strict";

  const MODAL_PRINTING_DELAY = 650;
  const DEFAULT_PROJECT_MODAL_DATA = {
    title: "Preview do projeto",
    description: "",
    stack: "HTML \u2022 CSS \u2022 JS",
    type: "WEBSITE",
    status: "ONLINE",
    image: "",
    link: "#",
  };

  const state = {
    isBound: false,
    isOpen: false,
    activeId: null,
    lastFocusedElement: null,
    printingTimeoutId: null,
  };

  const els = {
    modal: null,
    screen: null,
    image: null,
    title: null,
    stack: null,
    status: null,
    type: null,
    description: null,
    link: null,
    printing: null,
    closeButton: null,
    closeTargets: [],
    body: document.body,
  };

  function cacheDom() {
    els.modal = document.getElementById("project-modal");

    if (!els.modal) {
      return;
    }

    els.screen = els.modal.querySelector(".project-modal__screen");
    els.image = els.modal.querySelector(".project-modal__image");
    els.title = els.modal.querySelector(".project-modal__title");
    els.stack = els.modal.querySelector("[data-modal-stack]");
    els.status = els.modal.querySelector("[data-modal-status]");
    els.type = els.modal.querySelector("[data-modal-type]");
    els.description = els.modal.querySelector("[data-modal-description]");
    els.link = els.modal.querySelector("[data-modal-link]");
    els.printing = els.modal.querySelector(".project-modal__printing");
    els.closeButton = els.modal.querySelector(".project-modal__close");
    els.closeTargets = Array.from(els.modal.querySelectorAll("[data-modal-close]"));
  }

  function hasRequiredElements() {
    return Boolean(
      els.modal &&
        els.screen &&
        els.image &&
        els.title &&
        els.stack &&
        els.status &&
        els.type &&
        els.description &&
        els.link &&
        els.printing,
    );
  }

  function getProjectsData() {
    return window.PROJECTS_DATA && typeof window.PROJECTS_DATA === "object"
      ? window.PROJECTS_DATA
      : {};
  }

  function clearPrintingTimeout() {
    if (!state.printingTimeoutId) {
      return;
    }

    window.clearTimeout(state.printingTimeoutId);
    state.printingTimeoutId = null;
  }

  function resetModalContent() {
    if (!hasRequiredElements()) {
      return;
    }

    els.screen.hidden = false;
    els.image.removeAttribute("src");
    els.image.setAttribute("alt", "");
    els.title.textContent = "Nome do Projeto";
    els.stack.textContent = "";
    els.status.textContent = "";
    els.type.textContent = "";
    els.description.textContent = "";
    els.link.setAttribute("href", "#");
  }

  function getProjectData(projectId) {
    return {
      ...DEFAULT_PROJECT_MODAL_DATA,
      ...(getProjectsData()[projectId] || {}),
    };
  }

  function renderProject(data) {
    if (!hasRequiredElements()) {
      return;
    }

    const title = data.title || DEFAULT_PROJECT_MODAL_DATA.title;
    const description = data.description || DEFAULT_PROJECT_MODAL_DATA.description;
    const stack = data.stack || DEFAULT_PROJECT_MODAL_DATA.stack;
    const status = data.status || DEFAULT_PROJECT_MODAL_DATA.status;
    const type = data.type || DEFAULT_PROJECT_MODAL_DATA.type;
    const image = data.image || "";
    const link = data.link || image || "#";

    els.title.textContent = title;
    els.stack.textContent = stack;
    els.status.textContent = status;
    els.type.textContent = type;
    els.description.textContent = description;
    els.link.setAttribute("href", link);

    if (image) {
      els.screen.hidden = false;
      els.image.setAttribute("src", image);
      els.image.setAttribute("alt", title);
      return;
    }

    els.screen.hidden = true;
    els.image.removeAttribute("src");
    els.image.setAttribute("alt", "");
  }

  function lockScroll() {
    els.body?.classList.add("is-modal-open");
  }

  function unlockScroll() {
    els.body?.classList.remove("is-modal-open");
  }

  function restoreFocus() {
    if (state.lastFocusedElement instanceof HTMLElement) {
      state.lastFocusedElement.focus();
    }
  }

  function showModal() {
    if (!els.modal) {
      return;
    }

    els.modal.hidden = false;
    els.modal.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      els.modal?.classList.add("is-active");
    });
  }

  function hideModal() {
    if (!els.modal) {
      return;
    }

    els.modal.classList.remove("is-active", "is-printing");
    els.modal.hidden = true;
    els.modal.setAttribute("aria-hidden", "true");
  }

  function startPrintingEffect() {
    if (!els.modal) {
      return;
    }

    clearPrintingTimeout();
    els.modal.classList.remove("is-active");
    els.modal.classList.add("is-printing");

    state.printingTimeoutId = window.setTimeout(() => {
      els.modal?.classList.remove("is-printing");
      els.closeButton?.focus();
      state.printingTimeoutId = null;
    }, MODAL_PRINTING_DELAY);
  }

  function openProjectModal(projectId, trigger) {
    if (!hasRequiredElements() || !projectId) {
      return;
    }

    state.activeId = projectId;
    state.isOpen = true;
    state.lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;

    renderProject(getProjectData(projectId));
    lockScroll();
    startPrintingEffect();
    showModal();
  }

  function closeProjectModal() {
    if (!els.modal) {
      return;
    }

    clearPrintingTimeout();
    state.isOpen = false;
    state.activeId = null;

    hideModal();
    unlockScroll();
    resetModalContent();
    restoreFocus();
  }

  function handleTriggerClick(event) {
    const trigger = event.target.closest("[data-modal-open]");

    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const projectId = trigger.getAttribute("data-modal-open");

    if (!projectId) {
      return;
    }

    openProjectModal(projectId, trigger);
  }

  function handleCloseClick(event) {
    if (!state.isOpen || !els.modal) {
      return;
    }

    const closeTarget = event.target.closest("[data-modal-close]");

    if (!(closeTarget instanceof HTMLElement) || !els.modal.contains(closeTarget)) {
      return;
    }

    closeProjectModal();
  }

  function handleTriggerKeydown(event) {
    const trigger = event.target.closest("[data-modal-open]");

    if (!(trigger instanceof HTMLElement) || trigger.tagName === "BUTTON") {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const projectId = trigger.getAttribute("data-modal-open");

    if (!projectId) {
      return;
    }

    event.preventDefault();
    openProjectModal(projectId, trigger);
  }

  function handleEscapeKey(event) {
    if (event.key === "Escape" && state.isOpen) {
      closeProjectModal();
    }
  }

  function bindEvents() {
    if (state.isBound) {
      return;
    }

    state.isBound = true;

    document.addEventListener("click", handleCloseClick);
    document.addEventListener("click", handleTriggerClick);
    document.addEventListener("keydown", handleTriggerKeydown);
    window.addEventListener("keydown", handleEscapeKey);
  }

  function init() {
    cacheDom();

    if (!hasRequiredElements()) {
      return;
    }

    els.image.decoding = "async";
    els.modal.setAttribute("aria-hidden", els.modal.hidden ? "true" : "false");
    bindEvents();
  }

  window.ProjectModal = {
    init,
    open: openProjectModal,
    close: closeProjectModal,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
