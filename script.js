/* ===============================
   GOOGLE ANALYTICS EVENT TRACKING
=============================== */

// Track "Our Services" button
document.querySelector(".btn-primary")?.addEventListener("click", () => {
  gtag("event", "services_clicked", {
    event_category: "navigation",
    event_label: "Our Services Button",
  });
});

// Track "Book Consultation" button
document.querySelector(".btn-secondary")?.addEventListener("click", () => {
  gtag("event", "consultation_clicked", {
    event_category: "navigation",
    event_label: "Book Consultation Button",
  });
});

// Track Call Button
document.getElementById("show-call")?.addEventListener("click", () => {
  gtag("event", "call_clicked", {
    event_category: "contact",
    event_label: "Phone Call Button",
  });
});

// Track Send Enquiry Button
document.getElementById("show-enquiry")?.addEventListener("click", () => {
  gtag("event", "enquiry_clicked", {
    event_category: "contact",
    event_label: "Send Enquiry Button",
  });
});

// Track Form Submission
document.querySelector("#inquiry-form form")?.addEventListener("submit", () => {
  gtag("event", "form_submitted", {
    event_category: "contact",
    event_label: "Web3Forms Submission",
  });
});


/* ===============================
   MOBILE MENU TOGGLE
=============================== */
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


/* ===============================
   CONTACT BUTTON LOGIC
=============================== */

const hiddenInfo = document.getElementById("hidden-info");
const inquiryForm = document.getElementById("inquiry-form");
const showCall = document.getElementById("show-call");
const showEnquiry = document.getElementById("show-enquiry");

// Hide both on load
hiddenInfo.style.display = "none";
inquiryForm.style.display = "none";

// CALL BUTTON → direct call
showCall.addEventListener("click", () => {
  hiddenInfo.style.display = "none";
  inquiryForm.style.display = "none";
  window.location.href = "tel:+61451505109";
});

// SEND ENQUIRY BUTTON → show form
showEnquiry.addEventListener("click", () => {
  hiddenInfo.style.display = "none";
  inquiryForm.style.display = "block";
  inquiryForm.scrollIntoView({ behavior: "smooth" });
});

// SUCCESS ALERT
document.querySelector("#inquiry-form form")?.addEventListener("submit", () => {
  setTimeout(() => {
    alert("Thank you! Your message has been sent.");
  }, 500);
});
