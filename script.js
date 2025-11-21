/* ===============================
   MOBILE MENU TOGGLE
================================*/
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

// Close menu on link click (mobile)
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});


/* ===============================
   CONTACT BUTTON LOGIC (FINAL)
================================*/

// Elements
const hiddenInfo = document.getElementById("hidden-info");
const inquiryForm = document.getElementById("inquiry-form");
const showCall = document.getElementById("show-call");
const showEnquiry = document.getElementById("show-enquiry");

// Hide both on load
hiddenInfo.style.display = "none";
inquiryForm.style.display = "none";

// CALL BUTTON → Direct call, no info shown
showCall.addEventListener("click", () => {
  hiddenInfo.style.display = "none";
  inquiryForm.style.display = "none";
  window.location.href = "tel:+61451505109";
});

// SEND ENQUIRY BUTTON → Show only the form
showEnquiry.addEventListener("click", () => {
  hiddenInfo.style.display = "none";
  inquiryForm.style.display = "block";
  inquiryForm.scrollIntoView({ behavior: "smooth" });
});

// SUCCESS POPUP (Web3Forms)
document.querySelector("#inquiry-form form")
  .addEventListener("submit", () => {
    setTimeout(() => {
      alert("Thank you! Your message has been sent.");
    }, 500);
  });
