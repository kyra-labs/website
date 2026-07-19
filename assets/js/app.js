(function () {
  "use strict";

  // Belt-and-braces: the inline <head> script sets this before first paint;
  // this covers pages that don't include it (e.g. privacy.html).
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // Nav hairline/shadow once the page is scrolled
  if (nav) {
    var scrollTicking = false;
    var updateNav = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 4);
      scrollTicking = false;
    };
    window.addEventListener("scroll", function () {
      if (!scrollTicking) {
        scrollTicking = true;
        window.requestAnimationFrame(updateNav);
      }
    }, { passive: true });
    updateNav();
  }

  // Count-up for the Spenzia figures (₹18,240 and 62%).
  // The HTML ships with the final numbers, so no-JS and reduced-motion
  // visitors always see the real values; we only animate from zero when
  // motion is allowed.
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var duration = 950;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = Math.round(target * eased).toLocaleString("en-IN");
      if (t < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  // Scroll-triggered reveals — one observer drives the section reveal,
  // child stagger (CSS transition delays), the budget-ring sweep (CSS),
  // and the number count-ups (JS).
  var revealTargets = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    // Prime counters at zero so the count-up has somewhere to go.
    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = "0";
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            entry.target.querySelectorAll("[data-count]").forEach(countUp);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
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

      function showStatus(message, isError) {
        if (!status) return;
        status.textContent = message;
        status.classList.add("is-shown");
        status.classList.toggle("is-error", !!isError);
      }

      if (!isValid) {
        showStatus("Please enter a valid email address.", true);
        return;
      }

      showStatus("Thanks — you're on the list. We'll email you at launch.", false);
      form.classList.remove("is-success");
      // Restart the success pop if it's submitted twice.
      void form.offsetWidth;
      form.classList.add("is-success");
      form.reset();
    });
  });
})();
