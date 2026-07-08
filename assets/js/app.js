(function () {
  "use strict";

  // Mobile nav toggle
  var nav = document.querySelector(".global-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    nav.querySelectorAll(".nav-links a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Subtle scroll reveal (respects prefers-reduced-motion via CSS)
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealTargets = document.querySelectorAll("[data-reveal]");
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Waitlist / contact form — front-end only.
  // NOTE for the developer: wire this up to a real endpoint (Formspree,
  // Buttondown, a Google Sheet via Apps Script, or your own API) before
  // launch. Right now it just confirms locally and offers a mailto fallback.
  document.querySelectorAll("[data-waitlist-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var status = form.parentElement.querySelector("[data-form-status]");
      var email = input ? input.value.trim() : "";
      var isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValid) {
        if (status) status.textContent = "Please enter a valid email address.";
        return;
      }

      if (status) {
        status.textContent = "Thanks — you're on the list. We'll email you at launch.";
      }
      form.reset();
    });
  });
})();
