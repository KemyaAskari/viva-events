/* ==========================================
   GOOGLE ANALYTICS EVENT TRACKING
========================================== */

/* Track "Our Services" button */
document.querySelector(".btn-primary")?.addEventListener("click", () => {
  gtag("event", "services_clicked", {
    event_category: "navigation",
    event_label: "Our Services Button",
  });
});

/* Track "Book Consultation" button */
document.querySelector(".btn-secondary")?.addEventListener("click", () => {
  gtag("event", "consultation_clicked", {
    event_category: "navigation",
    event_label: "Book Consultation Button",
  });
});

/* Track Call Button */
document.getElementById("show-call")?.addEventListener("click", () => {
  gtag("event", "call_clicked", {
    event_category: "contact",
    event_label: "Phone Call Button",
  });
});

/* Track Send Enquiry Button */
document.getElementById("show-enquiry")?.addEventListener("click", () => {
  gtag("event", "enquiry_clicked", {
    event_category: "contact",
    event_label: "Send Enquiry Button",
  });
});

/* Track Form Submission */
document.querySelector("#inquiry-form form")?.addEventListener("submit", () => {
  gtag("event", "form_submitted", {
    event_category: "contact",
    event_label: "Web3Forms Submission",
  });
});


/* ==========================================
   GALLERY IMAGE CLICK TRACKING
========================================== */
document.querySelectorAll(".gallery-grid img").forEach(img => {
  img.addEventListener("click", () => {
    gtag("event", "gallery_image_clicked", {
      event_category: "gallery",
      event_label: img.src.split("/").pop()
    });
  });
});


/* ==========================================
   PHONE + EMAIL DIRECT LINK TRACKING
========================================== */
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener("click", () => {
    gtag("event", "phone_link_clicked", {
      event_category: "contact",
      event_label: link.href
    });
  });
});

document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
  link.addEventListener("click", () => {
    gtag("event", "email_link_clicked", {
      event_category: "contact",
      event_label: link.href
    });
  });
});


/* ==========================================
   EMOJI CATEGORY TRACKING (🍾 🏛 🎨)
========================================== */
document.querySelectorAll(".cat-item").forEach(item => {
  item.addEventListener("click", () => {
    gtag("event", "category_clicked", {
      event_category: "hero_categories",
      event_label: item.innerText.trim()
    });
  });
});


/* ==========================================
   SCROLL SECTION VIEW TRACKING
========================================== */

// Avoid double counting
let seenSections = {
  hero: false,
  services: false,
  gallery: false,
  contact: false
};

function trackSectionView(sectionName) {
  if (!seenSections[sectionName]) {
    seenSections[sectionName] = true;
    gtag("event", "section_viewed", {
      event_category: "scroll_tracking",
      event_label: sectionName
    });
  }
}

const hero = document.querySelector(".hero");
const services = document.querySelector("#services");
const gallery = document.querySelector("#gallery");
const contact = document.querySelector("#contact");

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY + window.innerHeight;

  if (hero && scrollY >= hero.offsetTop + 200) trackSectionView("hero");
  if (services && scrollY >= services.offsetTop + 200) trackSectionView("services");
  if (gallery && scrollY >= gallery.offsetTop + 200) trackSectionView("gallery");
  if (contact && scrollY >= contact.offsetTop + 200) trackSectionView("contact");
});


/* ==========================================
   MOBILE MENU TOGGLE
========================================== */
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});


/* ==========================================
   CONTACT BUTTON LOGIC
========================================== */
const hiddenInfo = document.getElementById("hidden-info");
const inquiryForm = document.getElementById("inquiry-form");
const showCall = document.getElementById("show-call");
const showEnquiry = document.getElementById("show-enquiry");

// Hide on load
hiddenInfo.style.display = "none";
inquiryForm.style.display = "none";

// Call
showCall.addEventListener("click", () => {
  hiddenInfo.style.display = "none";
  inquiryForm.style.display = "none";
  window.location.href = "tel:+61451505109";
});

// Enquiry
showEnquiry.addEventListener("click", () => {
  hiddenInfo.style.display = "none";
  inquiryForm.style.display = "block";
  inquiryForm.scrollIntoView({ behavior: "smooth" });
});

// Success alert
document.querySelector("#inquiry-form form")?.addEventListener("submit", () => {
  setTimeout(() => {
    alert("Thank you! Your message has been sent.");
  }, 500);
});
