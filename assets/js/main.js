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

const formatCarouselNumber = (value) => String(value).padStart(2, "0");

const setupCarousel = (carousel) => {
  const viewport = carousel.querySelector("[data-carousel-viewport]");
  const cards = Array.from(carousel.querySelectorAll(".project-card"));
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dotsContainer = carousel.querySelector("[data-carousel-dots]");
  const currentPageTarget = carousel.querySelector("[data-carousel-page]");
  const totalPageTarget = carousel.querySelector("[data-carousel-total]");

  if (!viewport || !cards.length || !prevButton || !nextButton) {
    return;
  }

  let currentPage = 0;
  let dots = [];
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

  const rebuildDots = () => {
    if (!dotsContainer) {
      return;
    }

    const pageCount = getPageCount();

    if (dots.length === pageCount) {
      return;
    }

    dotsContainer.innerHTML = "";
    dots = Array.from({ length: pageCount }, (_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "projects-carousel__dot";
      dot.setAttribute("aria-label", `Ir para pagina ${index + 1}`);
      dot.addEventListener("click", () => {
        setPage(index);
      });
      dotsContainer.append(dot);
      return dot;
    });
  };

  const updateCarouselState = () => {
    currentPage = getPageFromScroll();
    rebuildDots();

    if (currentPageTarget) {
      currentPageTarget.textContent = formatCarouselNumber(currentPage + 1);
    }

    if (totalPageTarget) {
      totalPageTarget.textContent = formatCarouselNumber(getPageCount());
    }

    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage >= getPageCount() - 1;

    dots.forEach((dot, index) => {
      const isActive = index === currentPage;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", String(isActive));
    });
  };

  const syncCarouselLayout = () => {
    rebuildDots();
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
