(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var nav = document.querySelector(".nav-pill");
  var toggle = document.querySelector(".nav-toggle");

  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll(".nav-links a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealTargets = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

    revealTargets.forEach(function (element) {
      observer.observe(element);
    });
  } else {
    revealTargets.forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  document.querySelectorAll("[data-waitlist-form]").forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button[type="submit"]');
    var status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = input.value.trim();
      var isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      status.classList.remove("is-error", "is-success");
      button.classList.remove("is-error", "is-success");
      form.classList.remove("is-loading", "is-error", "is-success");

      if (!isValid) {
        input.setAttribute("aria-invalid", "true");
        status.textContent = "Enter a valid email address.";
        status.classList.add("is-error");
        button.classList.add("is-error");
        form.classList.add("is-error");
        input.focus();
        return;
      }

      input.removeAttribute("aria-invalid");
      button.setAttribute("aria-busy", "true");
      button.disabled = true;
      button.textContent = "Adding…";
      form.classList.add("is-loading");

      window.setTimeout(function () {
        status.textContent = "You’re on the list. We’ll write when something ships.";
        status.classList.add("is-success");
        button.removeAttribute("aria-busy");
        button.disabled = false;
        button.textContent = "Added";
        button.classList.add("is-success");
        form.classList.remove("is-loading");
        form.classList.add("is-success");
        form.reset();
      }, 450);
    });

    input.addEventListener("input", function () {
      input.removeAttribute("aria-invalid");
      status.classList.remove("is-error");
      button.classList.remove("is-error", "is-success");
      form.classList.remove("is-error", "is-success");
      if (button.textContent === "Added") button.textContent = "Notify me";
    });
  });
})();
