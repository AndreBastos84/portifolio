(() => {
  "use strict";

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

  function init() {
    if (menuToggle) {
      menuToggle.addEventListener("click", toggleMenu);
    }

    bindNavigation();
    window.addEventListener("resize", handleResize);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
