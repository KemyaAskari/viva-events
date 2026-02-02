/* ======================================================
   Viva Events – Global UI Script (FINAL & MOBILE FIXED)
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

  await loadPartial("site-header", "partials/header.html");
  await loadPartial("site-footer", "partials/footer.html");

  /* ================= THEME STATE ================= */
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("ve_theme", theme);

    document.querySelectorAll(".theme-toggle i").forEach(icon => {
      icon.className =
        theme === "dark"
          ? "fa-solid fa-moon"
          : "fa-solid fa-sun";
    });
  }

  // Load saved theme (default = dark)
  const savedTheme = localStorage.getItem("ve_theme") || "dark";
  applyTheme(savedTheme);

  /* ================= THEME TOGGLE (DESKTOP + MOBILE) ================= */
  // 🔥 EVENT DELEGATION — WORKS EVEN IF BUTTON LOADS LATER
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".theme-toggle");
    if (!toggle) return;

    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  });

  /* ================= MOBILE MENU ================= */
document.addEventListener("click", (e) => {
  const mobileMenu = document.getElementById("mobileMenu");
  const hamburger = e.target.closest(".hamburger");

  // helper to close menu safely
  const closeMenu = () => {
    const menu = document.getElementById("mobileMenu");
    const btn = document.querySelector(".hamburger");
    if (menu) menu.classList.remove("is-open");
    if (btn) {
      btn.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
    }
    document.body.style.overflow = "";
  };

  // open/close by clicking hamburger
  if (hamburger && mobileMenu) {
    const isOpen = mobileMenu.classList.toggle("is-open");
    hamburger.classList.toggle("active", isOpen);
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.style.overflow = isOpen ? "hidden" : "";
    return;
  }

  // ✅ close when clicking Exit button
  if (e.target.closest("#menuCloseBtn")) {
    closeMenu();
    return;
  }

  // close when clicking a mobile menu link
  if (e.target.closest("#mobileMenu a")) {
    closeMenu();
    return;
  }

  // close when clicking outside the 3D box (overlay area)
  if (mobileMenu && mobileMenu.classList.contains("is-open") && e.target === mobileMenu) {
    closeMenu();
    return;
  }
});


});
