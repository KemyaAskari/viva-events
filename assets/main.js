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
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      hamburger.classList.toggle("active");
    });

    // Optional: close menu when clicking a link
    mobileMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        mobileMenu.classList.remove("open");
        hamburger.classList.remove("active");
      }
    });
  }

});
