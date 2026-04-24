// Viva Events - Final JavaScript

const menuBtn = document.getElementById("menuBtn");
const menuCloseBtn = document.getElementById("menuCloseBtn");
const nav = document.getElementById("nav");
const overlay = document.getElementById("menuOverlay");

// Open mobile menu
if (menuBtn && nav && overlay) {
  menuBtn.addEventListener("click", function () {
    nav.classList.add("open");
    overlay.classList.add("active");
    document.body.classList.add("menu-open");
    menuBtn.setAttribute("aria-expanded", "true");
  });
}

// Close mobile menu
function closeMenu() {
  if (nav && overlay) {
    nav.classList.remove("open");
    overlay.classList.remove("active");
    document.body.classList.remove("menu-open");

    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
    }
  }
}

if (menuCloseBtn) {
  menuCloseBtn.addEventListener("click", closeMenu);
}

if (overlay) {
  overlay.addEventListener("click", closeMenu);
}

// Close menu when clicking any nav link
const navLinks = document.querySelectorAll(".nav a");

navLinks.forEach(function (link) {
  link.addEventListener("click", closeMenu);
});

// Header shadow on scroll
const header = document.querySelector(".header");

window.addEventListener("scroll", function () {
  if (header) {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
});

// Hero image slider
const slides = document.querySelectorAll(".image-slider .slide");
let currentSlide = 0;

if (slides.length > 0) {
  setInterval(function () {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add("active");
  }, 3000);
}

// Gallery lightbox
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

// Contact form to email
const quoteForm = document.getElementById("quoteForm");

if (quoteForm) {
  quoteForm.addEventListener("submit", function () {
    alert("Thank you. Your email app will open to send your request.");
  });
}