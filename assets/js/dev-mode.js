(function () {
  const DEV_MODE_CLASS = "dev-mode-on";
  const MOBILE_BREAKPOINT = 760;
  const MAX_MOBILE_NOTES = 5;
  const VIEWPORT_MARGIN_DESKTOP = 16;
  const VIEWPORT_MARGIN_MOBILE = 12;
  const POSITION_CLASSES = ["dev-note--right", "dev-note--left", "dev-note--top", "dev-note--bottom"];
  const EDGE_CLASSES = ["dev-note-edge-left", "dev-note-edge-right", "dev-note--mobile", "is-hidden"];
  const stateByKey = new Map();

  const getNotesData = () =>
    window.DEV_NOTES && typeof window.DEV_NOTES === "object" ? window.DEV_NOTES : {};

  const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT;
  const getViewportMargin = () =>
    isMobileViewport() ? VIEWPORT_MARGIN_MOBILE : VIEWPORT_MARGIN_DESKTOP;

  const getUrlDevState = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const value = params.get("dev");

      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }
    } catch (_error) {
      return null;
    }

    return null;
  };

  const updateToggleState = (enabled) => {
    const toggle = document.querySelector("[data-dev-mode-toggle]");

    if (!toggle) {
      return;
    }

    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.textContent = enabled ? "[ MODO DEV: ON ]" : "[ MODO DEV: OFF ]";
  };

  const createNoteElement = (key, config) => {
    const note = document.createElement("div");
    const dot = document.createElement("span");
    const line = document.createElement("span");
    const card = document.createElement("div");
    const label = document.createElement("span");
    const title = document.createElement("strong");
    const text = document.createElement("p");

    note.className = "dev-note";
    note.dataset.devNoteId = key;
    note.setAttribute("aria-hidden", "true");

    dot.className = "dev-note__dot";
    line.className = "dev-note__line";
    card.className = "dev-note__card";
    label.className = "dev-note__label";
    title.className = "dev-note__title";
    text.className = "dev-note__text";

    label.textContent = config.label || "DEV";
    title.textContent = config.title || key;
    text.textContent = config.text || "";

    card.append(label, title, text);
    note.append(dot, line, card);

    return note;
  };

  const getOrCreateState = (element, key, config) => {
    let state = stateByKey.get(key);

    if (!state || !state.note || !element.contains(state.note)) {
      const existing = element.querySelector(`:scope > .dev-note[data-dev-note-id="${key}"]`);
      const note = existing || createNoteElement(key, config);

      if (!existing) {
        element.appendChild(note);
      }

      state = {
        key,
        element,
        config,
        note,
      };
      stateByKey.set(key, state);
    } else {
      state.element = element;
      state.config = config;
    }

    return state;
  };

  const cleanupLegacyLayer = () => {
    document.querySelectorAll(".dev-mode-layer").forEach((node) => {
      node.remove();
    });
  };

  const getEntries = () => {
    const notesData = getNotesData();
    const keys = new Set();
    const entries = [];

    document.querySelectorAll("[data-dev-note]").forEach((element) => {
      const key = element.getAttribute("data-dev-note");

      if (!key || keys.has(key)) {
        return;
      }

      const config = notesData[key];

      if (!config) {
        return;
      }

      keys.add(key);
      entries.push({
        key,
        element,
        config: {
          label: config.label || "DEV",
          title: config.title || key,
          text: config.text || "",
          position: config.position || "right",
          offsetX: Number.isFinite(config.offsetX) ? config.offsetX : 0,
          offsetY: Number.isFinite(config.offsetY) ? config.offsetY : 0,
          mobile: Boolean(config.mobile),
          priority: Number.isFinite(config.priority) ? config.priority : 999,
        },
      });
    });

    if (!isMobileViewport()) {
      return entries;
    }

    return entries
      .filter((entry) => entry.config.mobile)
      .sort((a, b) => a.config.priority - b.config.priority)
      .slice(0, MAX_MOBILE_NOTES);
  };

  const hideInactiveNotes = (activeKeys) => {
    stateByKey.forEach((state, key) => {
      if (!state.note) {
        return;
      }

      state.note.classList.toggle("is-hidden", !activeKeys.has(key));
    });
  };

  const applyPositionClasses = (state) => {
    const { note, config } = state;
    const offsetX = isMobileViewport() ? 0 : config.offsetX || 0;
    const offsetY = isMobileViewport() ? 0 : config.offsetY || 0;

    if (!note) {
      return;
    }

    note.classList.remove(...POSITION_CLASSES, ...EDGE_CLASSES);
    note.classList.add(`dev-note--${config.position || "right"}`);
    note.style.setProperty("--dev-note-offset-x", `${offsetX}px`);
    note.style.setProperty("--dev-note-offset-y", `${offsetY}px`);

    if (isMobileViewport()) {
      note.classList.add("dev-note--mobile");
    }
  };

  const applyEdgeClasses = (state) => {
    if (!state.note || !state.note.isConnected) {
      return;
    }

    applyPositionClasses(state);

    if (!document.body.classList.contains(DEV_MODE_CLASS) || isMobileViewport()) {
      return;
    }

    const card = state.note.querySelector(".dev-note__card");

    if (!(card instanceof HTMLElement)) {
      return;
    }

    const margin = getViewportMargin();
    const rect = card.getBoundingClientRect();
    const position = state.config.position || "right";

    if (position === "right" && rect.right > window.innerWidth - margin) {
      state.note.classList.add("dev-note-edge-right");
      return;
    }

    if (position === "left" && rect.left < margin) {
      state.note.classList.add("dev-note-edge-left");
      return;
    }

  };

  const ensureNotes = () => {
    const entries = getEntries();
    const activeKeys = new Set(entries.map((entry) => entry.key));

    entries.forEach((entry) => {
      const state = getOrCreateState(entry.element, entry.key, entry.config);

      if (window.getComputedStyle(entry.element).position === "static") {
        entry.element.classList.add("dev-note-anchor");
      }

      state.note.classList.remove("is-hidden");
      applyPositionClasses(state);
    });

    hideInactiveNotes(activeKeys);

    if (!document.body.classList.contains(DEV_MODE_CLASS)) {
      return;
    }

    entries.forEach((entry) => {
      const state = stateByKey.get(entry.key);

      if (!state) {
        return;
      }

      applyEdgeClasses(state);
    });
  };

  const setDevMode = (enabled) => {
    document.body.classList.toggle(DEV_MODE_CLASS, enabled);
    updateToggleState(enabled);

    if (enabled) {
      ensureNotes();
    }

    return enabled;
  };

  const bindToggle = () => {
    const toggle = document.querySelector("[data-dev-mode-toggle]");

    if (!(toggle instanceof HTMLElement) || toggle.dataset.devModeBound === "true") {
      return;
    }

    toggle.dataset.devModeBound = "true";
    toggle.addEventListener("click", () => {
      window.toggleDevMode();
    });
  };

  const init = () => {
    cleanupLegacyLayer();
    bindToggle();

    window.toggleDevMode = (forceState) => {
      const nextState =
        typeof forceState === "boolean"
          ? forceState
          : !document.body.classList.contains(DEV_MODE_CLASS);

      return setDevMode(nextState);
    };

    ensureNotes();

    const urlState = getUrlDevState();
    const initialState =
      urlState === null ? document.body.classList.contains(DEV_MODE_CLASS) : urlState;

    setDevMode(initialState);

    window.addEventListener("resize", ensureNotes);
    window.addEventListener("orientationchange", ensureNotes);
    window.addEventListener("load", ensureNotes);

    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      document.fonts.ready.then(() => {
        ensureNotes();
      });
    }

    document.querySelectorAll("img").forEach((image) => {
      if (image.complete) {
        return;
      }

      image.addEventListener("load", ensureNotes, { once: true });
      image.addEventListener("error", ensureNotes, { once: true });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
