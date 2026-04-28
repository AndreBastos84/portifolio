const root = document.documentElement;
const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const MOBILE_NAV_BREAKPOINT = 1167;
const sections = Array.from(navLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const revealItems = document.querySelectorAll("[data-reveal]");
const yearTarget = document.getElementById("current-year");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const carousels = document.querySelectorAll("[data-carousel]");
const modalTriggers = document.querySelectorAll("[data-modal-open]");
const projectModal = document.getElementById("project-modal");
const projectModalImage = projectModal?.querySelector(".project-modal__image");
const projectModalTitle = projectModal?.querySelector(".project-modal__title");
const projectModalStack = projectModal?.querySelector("[data-modal-stack]");
const projectModalStatus = projectModal?.querySelector("[data-modal-status]");
const projectModalType = projectModal?.querySelector("[data-modal-type]");
const projectModalDescription = projectModal?.querySelector("[data-modal-description]");
const projectModalLink = projectModal?.querySelector("[data-modal-link]");
const projectModalPrinting = projectModal?.querySelector(".project-modal__printing");
const projectModalCloseTargets = projectModal?.querySelectorAll("[data-modal-close]") || [];
const projectModalCloseButton = projectModal?.querySelector(".project-modal__close");

const getTopbarOffset = () => {
  if (!topbar) {
    return 0;
  }

  const stickyTop = Number.parseFloat(window.getComputedStyle(topbar).top) || 0;
  const gap = window.innerWidth <= MOBILE_NAV_BREAKPOINT ? 16 : 24;

  return Math.ceil(topbar.getBoundingClientRect().height + stickyTop + gap);
};

const updateTopbarOffset = () => {
  const offset = getTopbarOffset();
  root.style.setProperty("--topbar-offset", `${offset}px`);
  return offset;
};

const setActiveLink = () => {
  if (!sections.length) {
    return;
  }

  const currentPosition = window.scrollY + getTopbarOffset();
  let activeId = sections[0].id;

  sections.forEach((section) => {
    if (section.offsetTop <= currentPosition) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const isCurrent = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", isCurrent);
  });
};

const scrollToTarget = (target, updateHash = true) => {
  if (!target) {
    return;
  }

  const offset = updateTopbarOffset();
  const top = target.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: Math.max(top, 0),
    behavior: "smooth",
  });

  if (updateHash) {
    window.history.pushState(null, "", `#${target.id}`);
  }

  window.requestAnimationFrame(setActiveLink);
};

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("is-open");
    updateTopbarOffset();
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const target = href ? document.querySelector(href) : null;

      if (!target) {
        return;
      }

      event.preventDefault();

      if (window.innerWidth <= MOBILE_NAV_BREAKPOINT) {
        menuToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }

      window.requestAnimationFrame(() => {
        scrollToTarget(target);
      });
    });
  });
} else {
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const target = href ? document.querySelector(href) : null;

      if (!target) {
        return;
      }

      event.preventDefault();
      scrollToTarget(target);
    });
  });
}

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -40px 0px",
  },
);

revealItems.forEach((item) => {
  revealObserver.observe(item);
});

let isTicking = false;

window.addEventListener(
  "scroll",
  () => {
    if (isTicking) {
      return;
    }

    isTicking = true;

    window.requestAnimationFrame(() => {
      setActiveLink();
      isTicking = false;
    });
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  updateTopbarOffset();
  setActiveLink();
});

window.addEventListener("load", () => {
  updateTopbarOffset();
  setActiveLink();

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);

    if (target) {
      window.requestAnimationFrame(() => {
        scrollToTarget(target, false);
      });
    }
  }
});

const setupCarousel = (carousel) => {
  const viewport = carousel.querySelector("[data-carousel-viewport]");
  const cards = Array.from(carousel.querySelectorAll(".project-card"));
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");

  if (!viewport || !cards.length || !prevButton || !nextButton) {
    return;
  }

  let currentPage = 0;
  let isCarouselTicking = false;

  const getCarouselEdge = () => {
    const edge = window.getComputedStyle(carousel).getPropertyValue("--carousel-edge");
    return Number.parseFloat(edge) || 0;
  };

  const getCardStep = () => {
    if (cards.length < 2) {
      return cards[0]?.getBoundingClientRect().width || viewport.clientWidth;
    }

    return cards[1].offsetLeft - cards[0].offsetLeft;
  };

  const getCardsPerView = () =>
    Math.max(
      1,
      Math.min(
        cards.length,
        Number.parseInt(window.getComputedStyle(carousel).getPropertyValue("--projects-per-view"), 10) || 1,
      ),
    );

  const getPageCount = () => Math.max(1, Math.ceil(cards.length / getCardsPerView()));

  const getPageFromScroll = () => {
    const step = getCardStep();

    if (!step) {
      return 0;
    }

    const activeIndex = Math.round((viewport.scrollLeft + getCarouselEdge()) / step);
    return Math.min(getPageCount() - 1, Math.floor(activeIndex / getCardsPerView()));
  };

  const scrollToPage = (page, behavior = "smooth") => {
    const pageCount = getPageCount();
    const cardsPerView = getCardsPerView();
    const safePage = Math.max(0, Math.min(page, pageCount - 1));
    const targetIndex = Math.min(
      safePage * cardsPerView,
      Math.max(cards.length - cardsPerView, 0),
    );
    const targetCard = cards[targetIndex];

    if (!targetCard) {
      return;
    }

    viewport.scrollTo({
      left: Math.max(targetCard.offsetLeft - getCarouselEdge(), 0),
      behavior,
    });
  };

  const setPage = (page, behavior = "smooth") => {
    currentPage = Math.max(0, Math.min(page, getPageCount() - 1));
    scrollToPage(currentPage, behavior);
    window.requestAnimationFrame(updateCarouselState);
  };

  const updateCarouselState = () => {
    currentPage = getPageFromScroll();
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage >= getPageCount() - 1;
  };

  const syncCarouselLayout = () => {
    setPage(currentPage, "auto");
  };

  prevButton.addEventListener("click", () => {
    setPage(currentPage - 1);
  });

  nextButton.addEventListener("click", () => {
    setPage(currentPage + 1);
  });

  viewport.addEventListener(
    "scroll",
    () => {
      if (isCarouselTicking) {
        return;
      }

      isCarouselTicking = true;

      window.requestAnimationFrame(() => {
        updateCarouselState();
        isCarouselTicking = false;
      });
    },
    { passive: true },
  );

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPage(currentPage - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPage(currentPage + 1);
    }
  });

  window.addEventListener("resize", syncCarouselLayout);
  syncCarouselLayout();
};

carousels.forEach((carousel) => {
  setupCarousel(carousel);
});

if (
  projectModal &&
  projectModalImage &&
  projectModalTitle &&
  projectModalStack &&
  projectModalStatus &&
  projectModalType &&
  projectModalDescription &&
  projectModalLink &&
  projectModalPrinting
) {
  let lastFocusedElement = null;
  let printingTimeoutId = null;

  const projectModalData = {
    "project-01": {
      type: "WEBSITE",
      status: "ONLINE",
      url: "assets/img/projects/full/projeto-01.webp",
    },
    "project-02": {
      type: "WORDPRESS",
      status: "ONLINE",
      url: "assets/img/projects/full/projeto-02.webp",
    },
    "project-03": {
      type: "LANDING PAGE",
      status: "ONLINE",
      url: "assets/img/projects/full/projeto-03.webp",
    },
    "project-04": {
      type: "CONTENT HUB",
      status: "ONLINE",
      url: "assets/img/projects/full/projeto-04.webp",
    },
    "project-05": {
      type: "SUPPORT",
      status: "ONLINE",
      url: "assets/img/projects/full/projeto-05.webp",
    },
    "project-06": {
      type: "WEBSITE",
      status: "ONLINE",
      url: "assets/img/projects/full/projeto-06.webp",
    },
  };

  const buildProjectAssetName = (modalId) => modalId.replace(/^project-/, "projeto-");
  const buildProjectImagePath = (modalId) =>
    `assets/img/projects/full/${buildProjectAssetName(modalId)}.webp`;

  const clearPrintingTimeout = () => {
    if (printingTimeoutId) {
      window.clearTimeout(printingTimeoutId);
      printingTimeoutId = null;
    }
  };

  const closeProjectModal = () => {
    clearPrintingTimeout();
    projectModal.classList.remove("is-active", "is-printing");
    projectModal.hidden = true;
    document.body.classList.remove("is-modal-open");
    projectModalImage.setAttribute("src", "");
    projectModalImage.setAttribute("alt", "");
    projectModalTitle.textContent = "Nome do Projeto";
    projectModalStack.textContent = "";
    projectModalStatus.textContent = "";
    projectModalType.textContent = "";
    projectModalDescription.textContent = "";
    projectModalLink.setAttribute("href", "#");

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  const openProjectModal = (modalId, trigger) => {
    const card = trigger.closest(".project-card");
    const title = card?.querySelector("h3")?.textContent?.trim() || "Preview do projeto";
    const description =
      Array.from(card?.querySelectorAll("p") || []).find(
        (paragraph) => !paragraph.classList.contains("project-card__index"),
      )?.textContent?.trim() || "";
    const stack = Array.from(card?.querySelectorAll(".project-card__tags li") || [])
      .map((item) => item.textContent?.trim())
      .filter(Boolean)
      .join(" • ");
    const metadata = projectModalData[modalId] || {
      type: "WEBSITE",
      status: "ONLINE",
      url: buildProjectImagePath(modalId),
    };

    lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;

    clearPrintingTimeout();
    projectModal.classList.remove("is-active");
    projectModal.classList.add("is-printing");
    projectModalTitle.textContent = title;
    projectModalStack.textContent = stack || "HTML • CSS • JS";
    projectModalStatus.textContent = metadata.status;
    projectModalType.textContent = metadata.type;
    projectModalDescription.textContent = description;
    projectModalLink.setAttribute("href", metadata.url);
    projectModalImage.setAttribute("src", buildProjectImagePath(modalId));
    projectModalImage.setAttribute("alt", title);
    projectModal.hidden = false;
    document.body.classList.add("is-modal-open");

    window.requestAnimationFrame(() => {
      projectModal.classList.add("is-active");
    });

    printingTimeoutId = window.setTimeout(() => {
      projectModal.classList.remove("is-printing");
      projectModalCloseButton?.focus();
    }, 300);
  };

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const modalId = trigger.getAttribute("data-modal-open");

      if (!modalId) {
        return;
      }

      openProjectModal(modalId, trigger);
    });

    if (trigger.tagName !== "BUTTON") {
      trigger.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();

        const modalId = trigger.getAttribute("data-modal-open");

        if (!modalId) {
          return;
        }

        openProjectModal(modalId, trigger);
      });
    }
  });

  projectModalCloseTargets.forEach((target) => {
    target.addEventListener("click", closeProjectModal);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !projectModal.hidden) {
      closeProjectModal();
    }
  });
}

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const project = String(formData.get("project") || "").trim();

    if (!name || !email || !project) {
      formStatus.textContent =
        "Preencha nome, e-mail e resumo do projeto para gerar o briefing.";
      return;
    }

    const briefing = [
      "BRIEFING DE CONTATO",
      `NOME: ${name}`,
      `E-MAIL: ${email}`,
      `EMPRESA: ${company || "NAO INFORMADA"}`,
      `PROJETO: ${project}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(briefing);
      formStatus.textContent =
        "Briefing preparado e copiado. Agora ele pode ser enviado pelo canal de contato preferido.";
    } catch (error) {
      formStatus.textContent =
        "Briefing preparado. Copie os dados do formulario para enviar pelo canal de contato preferido.";
    }

    contactForm.reset();
  });
}
