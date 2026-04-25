/* =========================================
   VIVA EVENTS — FINAL SCRIPT
========================================= */


/* =============================
   LOAD HEADER + FOOTER
============================= */
function loadPartial(id, file) {
  const el = document.getElementById(id);
  if (!el) return;

  fetch(file)
    .then(res => res.text())
    .then(data => {
      el.innerHTML = data;

      // IMPORTANT: run AFTER header loads
      setupMobileMenu();
      setActiveNavLink();
    })
    .catch(err => console.error("Load error:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  loadPartial("site-header", "header.html");
  loadPartial("site-footer", "footer.html");

  setupHeaderScroll();
  setupSlider();
  setupContactFormEmail();
});


/* =============================
   ACTIVE NAV LINK
============================= */
function setActiveNavLink() {
  const page = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav a").forEach(link => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === page);
  });
}


/* =============================
   MOBILE MENU (FIXED FINAL)
============================= */
function setupMobileMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const menuCloseBtn = document.getElementById("menuCloseBtn");
  const nav = document.getElementById("nav");
  const overlay = document.getElementById("menuOverlay");

  if (!menuBtn || !nav || !overlay) return;

  function openMenu() {
    nav.classList.add("open");
    overlay.classList.add("active");
    menuBtn.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    nav.classList.remove("open");
    overlay.classList.remove("active");
    menuBtn.classList.remove("active");
    document.body.style.overflow = "";
  }

  menuBtn.onclick = () => {
    nav.classList.contains("open") ? closeMenu() : openMenu();
  };

  if (menuCloseBtn) {
    menuCloseBtn.onclick = closeMenu;
  }

  overlay.onclick = closeMenu;

  document.querySelectorAll(".nav a").forEach(link => {
    link.onclick = closeMenu;
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeMenu();
  });
}


/* =============================
   HEADER SCROLL EFFECT
============================= */
function setupHeaderScroll() {
  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (!header) return;

    header.classList.toggle("scrolled", window.scrollY > 20);
  });
}


/* =============================
   HERO IMAGE SLIDER
============================= */
function setupSlider() {
  const slides = document.querySelectorAll(".image-slider .slide");
  if (!slides.length) return;

  let index = 0;
  slides[index].classList.add("active");

  setInterval(() => {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }, 3500);
}


/* =============================
   LIGHTBOX (GALLERY)
============================= */
function openLightbox(src) {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");

  if (!box || !img) return;

  img.src = src;
  box.style.display = "flex";
}

function closeLightbox() {
  const box = document.getElementById("lightbox");
  if (!box) return;

  box.style.display = "none";
}


/* =============================
   CONTACT FORM → EMAIL
============================= */
function setupContactFormEmail() {
  const form = document.getElementById("quoteForm");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();

    const val = id => document.getElementById(id)?.value || "";

    const subject = "New Event Enquiry - Viva Events";

    const body =
      "New Event Enquiry:\n\n" +
      "Name: " + val("name") + "\n" +
      "Phone: " + val("phone") + "\n" +
      "Email: " + val("email") + "\n" +
      "Event Type: " + val("eventType") + "\n" +
      "Event Date: " + val("eventDate") + "\n" +
      "Location: " + val("location") + "\n" +
      "Guests: " + val("guests") + "\n" +
      "Package: " + val("packageType") + "\n" +
      "Budget: " + val("budget") + "\n\n" +
      "Details:\n" + val("message");

    window.location.href =
      "mailto:vivaeventssydney@gmail.com" +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  });
}