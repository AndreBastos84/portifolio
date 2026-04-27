const root = document.documentElement;
const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const sections = Array.from(navLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const revealItems = document.querySelectorAll("[data-reveal]");
const yearTarget = document.getElementById("current-year");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

const getTopbarOffset = () => {
  if (!topbar) {
    return 0;
  }

  const stickyTop = Number.parseFloat(window.getComputedStyle(topbar).top) || 0;
  const gap = window.innerWidth <= 760 ? 16 : 24;

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

      if (window.innerWidth <= 760) {
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
