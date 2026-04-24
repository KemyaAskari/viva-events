// Viva Events - Final JavaScript

const menuBtn = document.getElementById("menuBtn");
const menuCloseBtn = document.getElementById("menuCloseBtn");
const nav = document.getElementById("nav");
const overlay = document.getElementById("menuOverlay");
const header = document.querySelector(".header");

// MOBILE MENU
function openMenu() {
  nav.classList.add("open");
  overlay.classList.add("active");
  document.body.classList.add("menu-open");
  menuBtn.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  nav.classList.remove("open");
  overlay.classList.remove("active");
  document.body.classList.remove("menu-open");
  menuBtn.setAttribute("aria-expanded", "false");
}

if (menuBtn && nav && overlay) {
  menuBtn.addEventListener("click", openMenu);
}

if (menuCloseBtn) {
  menuCloseBtn.addEventListener("click", closeMenu);
}

if (overlay) {
  overlay.addEventListener("click", closeMenu);
}

document.querySelectorAll(".nav a").forEach(function (link) {
  link.addEventListener("click", closeMenu);
});

// HEADER SCROLL EFFECT
window.addEventListener("scroll", function () {
  if (!header) return;

  if (window.scrollY > 20) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// HERO IMAGE SLIDER
const slides = document.querySelectorAll(".image-slider .slide");
let currentSlide = 0;

if (slides.length > 0) {
  setInterval(function () {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add("active");
  }, 3000);
}

// GALLERY LIGHTBOX
function openLightbox(src) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  if (lightbox && lightboxImg) {
    lightboxImg.src = src;
    lightbox.style.display = "flex";
  }
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");

  if (lightbox) {
    lightbox.style.display = "none";
  }
}

// CONTACT FORM EMAIL ALERT
const quoteForm = document.getElementById("quoteForm");

if (quoteForm) {
  quoteForm.addEventListener("submit", function () {
    alert("Thank you. Your email app will open to send your request.");
  });
}