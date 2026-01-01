/* ======================================================
   Viva Events – Global UI Script (FINAL & CLEAN)
====================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  /* ================= PARTIAL LOADER ================= */
  async function loadPartial(id, file) {
    const el = document.getElementById(id);
    if (!el) return;

    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(file + " not found");
      el.innerHTML = await res.text();
    } catch (err) {
      console.error("Partial load error:", err);
    }
  }

  // Load header & footer first
  await loadPartial("site-header", "partials/header.html");
  await loadPartial("site-footer", "partials/footer.html");

  /* ================= THEME TOGGLE (FINAL) ================= */
  function initThemeToggle() {
    const root = document.documentElement;
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    const icon = btn.querySelector("i");

    // Load saved theme
    const savedTheme = localStorage.getItem("ve_theme") || "dark";
    root.setAttribute("data-theme", savedTheme);

    icon.className =
      savedTheme === "light"
        ? "fa-solid fa-moon"
        : "fa-solid fa-sun";

    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";

      root.setAttribute("data-theme", next);
      localStorage.setItem("ve_theme", next);

      icon.className =
        next === "light"
          ? "fa-solid fa-moon"
          : "fa-solid fa-sun";
    });
  }

  initThemeToggle();

  /* ================= MOBILE MENU ================= */
  const menuBtn = document.querySelector("[data-menu-btn]");
  const mobilePanel = document.querySelector("[data-mobile-panel]");

  if (menuBtn && mobilePanel) {
    menuBtn.addEventListener("click", () => {
      mobilePanel.classList.toggle("hidden");
      menuBtn.setAttribute(
        "aria-expanded",
        !mobilePanel.classList.contains("hidden")
      );
    });
  }

  /* ================= CONTACT FORM ================= */
  const form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const data = new FormData(form);

      const subject = encodeURIComponent(
        `Viva Events Enquiry — ${data.get("eventType") || "Event"}`
      );

      const body = encodeURIComponent(`
Hello Viva Events,

Name: ${data.get("name") || ""}
Email: ${data.get("email") || ""}
Phone: ${data.get("phone") || ""}

Event Type: ${data.get("eventType") || ""}
Event Date: ${data.get("date") || ""}
Location: ${data.get("location") || ""}
Budget: ${data.get("budget") || ""}

Message:
${data.get("message") || ""}
      `);

      window.location.href =
        `mailto:vivaeventss@example.com?subject=${subject}&body=${body}`;
    });
  }

  /* ================= GALLERY LIGHTBOX ================= */
  const galleryLinks = document.querySelectorAll("[data-lightbox]");
  if (galleryLinks.length) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.8);
      display:none;
      place-items:center;
      z-index:9999;
      padding:24px;
    `;

    const img = document.createElement("img");
    img.style.cssText = `
      max-width:95vw;
      max-height:85vh;
      border-radius:18px;
      box-shadow:0 20px 50px rgba(0,0,0,.5);
    `;

    overlay.appendChild(img);
    overlay.addEventListener("click", () => {
      overlay.style.display = "none";
    });

    document.body.appendChild(overlay);

    galleryLinks.forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        img.src = link.href;
        overlay.style.display = "grid";
      });
    });
  }

  /* ================= FOOTER REVEAL ================= */
  const footer = document.querySelector(".site-footer-bar");
  if (footer) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) footer.classList.add("reveal");
      },
      { threshold: 0.15 }
    );
    observer.observe(footer);
  }

});
