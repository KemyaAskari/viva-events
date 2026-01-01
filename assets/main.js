/* ======================================================
   Viva Events – Global UI Script (FINAL & FIXED)
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

  /* ================= THEME TOGGLE ================= */
  function initThemeToggle() {
    const root = document.documentElement;
    const toggles = document.querySelectorAll(".theme-toggle");

    const savedTheme = localStorage.getItem("ve_theme") || "dark";
    root.setAttribute("data-theme", savedTheme);

    toggles.forEach(btn => {
      const icon = btn.querySelector("i");
      if (icon) {
        icon.className =
          savedTheme === "light"
            ? "fa-solid fa-moon"
            : "fa-solid fa-sun";
      }

      btn.addEventListener("click", () => {
        const current = root.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";

        root.setAttribute("data-theme", next);
        localStorage.setItem("ve_theme", next);

        toggles.forEach(b => {
          const i = b.querySelector("i");
          if (i) {
            i.className =
              next === "light"
                ? "fa-solid fa-moon"
                : "fa-solid fa-sun";
          }
        });
      });
    });
  }

  initThemeToggle();

  /* ================= MOBILE MENU ================= */
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      hamburger.classList.toggle("active");
    });
  }

});
