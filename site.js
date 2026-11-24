/* ==========================================================
   VIVA EVENTS SYDNEY
   OFFICIAL WEBSITE JAVASCRIPT

   Designed & Developed by Kemya Askari
   Website: https://vivaeventss.com.au
   File: public/site.js
   Version: 2.0

   Copyright © 2026 Viva Events Sydney.
   All Rights Reserved.

   FEATURES:
   - Gallery category filtering
   - Gallery image lightbox
   - Keyboard navigation
   - FAQ search and category filters
   - Contact enquiry form
   - Automatic service and package selection
   - Custom gift box builder
   - Live gift box summary
   - Customer form validation
   - Australian date formatting
   - Accessible status messages
   - Error handling

   SHARED COMPONENTS:
   Header, footer, mobile navigation, cookie consent,
   copyright and back-to-top are managed by components.js.

   IMPORTANT:
   This file prepares email enquiries.
   It does not process payments, save customer records
   to a database or automatically confirm bookings.

   ========================================================== */

"use strict";

(() => {

  /* ========================================================
     01. WEBSITE CONFIGURATION
     ======================================================== */

  const CONFIG = Object.freeze({

    businessName: "Viva Events Sydney",

    email: "vivaeventssydney@gmail.com",

    phone: "0403 945 324",

    website: "https://vivaeventss.com.au",

    locale: "en-AU",

    currency: "AUD",

    maxEmailUrlLength: 1800,

    maxPackageLength: 150

  });


  /* ========================================================
     02. PREVENT DUPLICATE INITIALISATION
     ======================================================== */

  if (window.__vivaSiteStarted) {

    return;

  }

  const currentPath = window.location.pathname
    .replace(/\/+$/, "")
    .toLowerCase();

  if (
    /\/admin(?:\.html)?(?:\/|$)/.test(currentPath)
  ) {

    return;

  }

  window.__vivaSiteStarted = true;


  /* ========================================================
     03. DOM UTILITIES
     ======================================================== */

  const $ = (selector, parent = document) => {

    return parent.querySelector(selector);

  };

  const $$ = (selector, parent = document) => {

    return Array.from(
      parent.querySelectorAll(selector)
    );

  };

  const byId = id => {

    return document.getElementById(id);

  };

  const normalise = value => {

    return String(value ?? "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

  };

  const text = (element, value) => {

    if (element) {

      element.textContent = String(value ?? "");

    }

  };

  const show = element => {

    if (element) {

      element.hidden = false;

    }

  };

  const hide = element => {

    if (element) {

      element.hidden = true;

    }

  };

  function emitEvent(name, detail = {}) {

    document.dispatchEvent(

      new CustomEvent(name, {

        detail

      })

    );

  }


  /* ========================================================
     04. APPLICATION STATE
     ======================================================== */

  const state = {

    started: false,

    galleryInitialised: false,

    lightboxInitialised: false,

    faqInitialised: false,

    contactInitialised: false,

    giftBuilderInitialised: false

  };


  /* ========================================================
     05. ACCESSIBLE STATUS MESSAGES
     ======================================================== */

  function setStatus(

    element,

    message,

    type = "info"

  ) {

    if (!element) return;

    const isError = type === "error";

    element.textContent = message;

    element.hidden = false;

    element.dataset.state = type;

    element.classList.remove(

      "is-success",

      "is-error",

      "is-info"

    );

    element.classList.add(

      `is-${type}`

    );

    element.setAttribute(

      "role",

      isError ? "alert" : "status"

    );

    element.setAttribute(

      "aria-live",

      isError ? "assertive" : "polite"

    );

    element.setAttribute(

      "aria-atomic",

      "true"

    );

  }

  function clearStatus(element) {

    if (!element) return;

    element.textContent = "";

    element.hidden = true;

    delete element.dataset.state;

    element.classList.remove(

      "is-success",

      "is-error",

      "is-info"

    );

  }


  /* ========================================================
     06. AUSTRALIAN DATE UTILITIES
     ======================================================== */

  function formatDate(value) {

    if (!value) {

      return "Not specified";

    }

    const match = String(value).match(

      /^(\d{4})-(\d{2})-(\d{2})$/

    );

    if (!match) {

      return String(value);

    }

    const year = Number(match[1]);

    const month = Number(match[2]);

    const day = Number(match[3]);

    const date = new Date(

      year,

      month - 1,

      day

    );

    if (

      Number.isNaN(date.getTime()) ||

      date.getFullYear() !== year ||

      date.getMonth() !== month - 1 ||

      date.getDate() !== day

    ) {

      return String(value);

    }

    return new Intl.DateTimeFormat(

      CONFIG.locale,

      {

        day: "numeric",

        month: "long",

        year: "numeric"

      }

    ).format(date);

  }

  function getToday() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(

      now.getMonth() + 1

    ).padStart(2, "0");

    const day = String(

      now.getDate()

    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

  }

  function setMinimumDate(field) {

    if (!field || field.type !== "date") {

      return;

    }

    const today = getToday();

    if (!field.min || field.min < today) {

      field.min = today;

    }

  }


  /* ========================================================
     07. FORM UTILITIES
     ======================================================== */

  function getFormField(form, id) {

    const field = byId(id);

    if (!field || !form.contains(field)) {

      return null;

    }

    return field;

  }

  function formValue(

    form,

    id,

    fallback = "Not specified"

  ) {

    const field = getFormField(form, id);

    if (!field) {

      return fallback;

    }

    const value = String(

      field.value ?? ""

    ).trim();

    return value || fallback;

  }

  function selectedText(

    field,

    fallback = "Not selected"

  ) {

    if (!field) {

      return fallback;

    }

    if (field instanceof HTMLSelectElement) {

      const option = field.options[

        field.selectedIndex

      ];

      if (!option || !field.value) {

        return fallback;

      }

      return option.textContent.trim();

    }

    return String(

      field.value ?? ""

    ).trim() || fallback;

  }

  function selectMatchingOption(field, requested) {

    if (

      !(field instanceof HTMLSelectElement) ||

      !requested

    ) {

      return false;

    }

    const requestedValue = normalise(requested);

    const match = Array.from(field.options).find(

      option => {

        return (

          !option.disabled &&

          (

            normalise(option.value) === requestedValue ||

            normalise(option.textContent) === requestedValue

          )

        );

      }

    );

    if (!match) {

      return false;

    }

    field.value = match.value;

    return true;

  }

  function cleanSingleLine(value, maxLength = 200) {

    return String(value ?? "")

      .replace(/[\r\n\t]+/g, " ")

      .replace(/\s+/g, " ")

      .trim()

      .slice(0, maxLength);

  }


  /* ========================================================
     08. CUSTOMER FORM VALIDATION
     ======================================================== */

  function validateForm(form, status) {

    if (!form.checkValidity()) {

      setStatus(

        status,

        "Please complete all required fields correctly.",

        "error"

      );

      form.reportValidity();

      return false;

    }

    const requiredTextFields = $$(

      'input[type="text"][required], ' +

      'input[type="email"][required], ' +

      'input[type="tel"][required], ' +

      'textarea[required]',

      form

    );

    for (const field of requiredTextFields) {

      if (field.disabled) continue;

      if (!field.value.trim()) {

        setStatus(

          status,

          "Please complete all required fields.",

          "error"

        );

        field.focus();

        return false;

      }

    }

    return true;

  }

  function initialiseFormStatus(form, status) {

    if (!form || !status) return;

    status.setAttribute(

      "aria-live",

      "polite"

    );

    form.addEventListener("input", () => {

      clearStatus(status);

    });

    form.addEventListener("change", () => {

      clearStatus(status);

    });

  }


  /* ========================================================
     09. EMAIL ENQUIRY UTILITIES
     ======================================================== */

  function buildEmailUrl(subject, body) {

    const safeSubject = cleanSingleLine(

      subject,

      200

    );

    const safeBody = String(body ?? "")

      .replace(/\r\n|\r|\n/g, "\r\n");

    return (

      `mailto:${CONFIG.email}` +

      `?subject=${encodeURIComponent(safeSubject)}` +

      `&body=${encodeURIComponent(safeBody)}`

    );

  }

  function showEmailFallback(

    status,

    subject,

    body

  ) {

    if (!status) return;

    setStatus(

      status,

      "Your enquiry is ready. Copy the details below " +

      "and email them directly to us.",

      "info"

    );

    const wrapper = document.createElement("div");

    wrapper.className = "enquiry-email-fallback";

    const emailLink = document.createElement("a");

    emailLink.href = `mailto:${CONFIG.email}`;

    emailLink.textContent = CONFIG.email;

    const details = document.createElement("textarea");

    details.className = "enquiry-email-details";

    details.readOnly = true;

    details.rows = 10;

    details.setAttribute(

      "aria-label",

      "Prepared email enquiry"

    );

    details.value =

      `Subject: ${subject}\n\n${body}`;

    const copyButton = document.createElement("button");

    copyButton.type = "button";

    copyButton.className = "enquiry-copy-button";

    copyButton.textContent = "Copy Enquiry";

    const copyStatus = document.createElement("span");

    copyStatus.setAttribute("role", "status");

    copyStatus.setAttribute("aria-live", "polite");

    copyButton.addEventListener("click", async () => {

      try {

        if (!navigator.clipboard?.writeText) {

          throw new Error("Clipboard unavailable");

        }

        await navigator.clipboard.writeText(

          details.value

        );

        copyStatus.textContent =

          "Enquiry copied. Paste it into your email.";

      } catch {

        details.focus();

        details.select();

        copyStatus.textContent =

          "Please copy the selected text manually.";

      }

    });

    wrapper.append(

      emailLink,

      details,

      copyButton,

      copyStatus

    );

    status.appendChild(wrapper);

  }

  function openEmail(subject, body, status) {

    let url;

    try {

      url = buildEmailUrl(subject, body);

    } catch (error) {

      console.error(

        "Viva Events: Email preparation failed.",

        error

      );

      showEmailFallback(

        status,

        subject,

        body

      );

      return false;

    }

    if (url.length > CONFIG.maxEmailUrlLength) {

      showEmailFallback(

        status,

        subject,

        body

      );

      return false;

    }

    setStatus(

      status,

      "Your enquiry is ready. Your email application " +

      "should open now. Please press Send in your email " +

      "application to submit your enquiry. " +

      "Your booking or order is not yet confirmed.",

      "info"

    );

    if (status) {

      const fallbackButton = document.createElement(

        "button"

      );

      fallbackButton.type = "button";

      fallbackButton.className = "enquiry-copy-button";

      fallbackButton.textContent =

        "Email application not opening?";

      fallbackButton.addEventListener("click", () => {

        showEmailFallback(

          status,

          subject,

          body

        );

      });

      status.appendChild(fallbackButton);

    }

    try {

      window.location.href = url;

      return true;

    } catch (error) {

      console.error(

        "Viva Events: Unable to open email application.",

        error

      );

      showEmailFallback(

        status,

        subject,

        body

      );

      return false;

    }

  }


  /* ========================================================
     10. GALLERY CATEGORY FILTERING
     ======================================================== */

  function initialiseGalleryFilters() {

    if (state.galleryInitialised) {

      return;

    }

    const grid = byId("galleryGrid");

    if (!grid) return;

    state.galleryInitialised = true;

    const cards = $$(

      ".gallery-card",

      grid

    );

    const buttons = $$(

      ".gallery-filter[data-filter]"

    );

    const count = byId("galleryResultsCount");

    const empty = byId("galleryEmpty");

    if (count) {

      count.setAttribute(

        "aria-live",

        "polite"

      );

      count.setAttribute(

        "aria-atomic",

        "true"

      );

    }

    function applyFilter(category = "all") {

      const requested = normalise(category);

      const validCategory =

        requested === "all" ||

        buttons.some(button => {

          return normalise(

            button.dataset.filter

          ) === requested;

        });

      const activeCategory = validCategory

        ? requested

        : "all";

      let visible = 0;

      cards.forEach(card => {

        const categories = normalise(

          card.dataset.category

        ).split(/[\s,]+/).filter(Boolean);

        const matches =

          activeCategory === "all" ||

          categories.includes(activeCategory);

        card.hidden = !matches;

        if (matches) {

          visible++;

        }

      });

      buttons.forEach(button => {

        const active = normalise(

          button.dataset.filter

        ) === activeCategory;

        button.classList.toggle(

          "is-active",

          active

        );

        button.setAttribute(

          "aria-pressed",

          String(active)

        );

      });

      text(

        count,

        `${visible} ${visible === 1 ? "image" : "images"} found`

      );

      if (empty) {

        empty.hidden = visible !== 0;

      }

      emitEvent("viva:gallery-filtered", {

        category: activeCategory,

        visible

      });

    }

    buttons.forEach(button => {

      if (button.tagName === "BUTTON") {

        button.type = "button";

      }

      button.addEventListener("click", event => {

        event.preventDefault();

        applyFilter(

          button.dataset.filter || "all"

        );

      });

    });

    const initial = buttons.find(button => {

      return button.getAttribute(

        "aria-pressed"

      ) === "true";

    })?.dataset.filter || "all";

    applyFilter(initial);

  }


  /* ========================================================
     11. GALLERY IMAGE LIGHTBOX
     ======================================================== */

  function initialiseGalleryLightbox() {

    if (state.lightboxInitialised) {

      return;

    }

    const dialog = byId("galleryLightbox");

    if (

      !dialog ||

      typeof dialog.showModal !== "function"

    ) {

      return;

    }

    const image = byId("galleryLightboxImage");

    const caption = byId("galleryLightboxCaption");

    const closeButton = byId("galleryLightboxClose");

    const previous = byId("galleryLightboxPrevious");

    const next = byId("galleryLightboxNext");

    const links = $$("[data-gallery-image]");

    if (!image || !links.length) {

      return;

    }

    state.lightboxInitialised = true;

    let currentIndex = 0;

    let previousFocus = null;

    let previousBodyOverflow = "";

    let scrollLocked = false;

    dialog.setAttribute(

      "aria-label",

      "Event gallery image preview"

    );

    if (caption) {

      caption.setAttribute(

        "aria-live",

        "polite"

      );

    }

    closeButton?.setAttribute(

      "aria-label",

      "Close image preview"

    );

    previous?.setAttribute(

      "aria-label",

      "Previous gallery image"

    );

    next?.setAttribute(

      "aria-label",

      "Next gallery image"

    );


    /* ------------------------------------------------------
       Return only images in the active gallery category
       ------------------------------------------------------ */

    function availableLinks() {

      return links.filter(link => {

        return (

          link.isConnected &&

          !link.closest("[hidden]")

        );

      });

    }


    /* ------------------------------------------------------
       Validate gallery image URL
       ------------------------------------------------------ */

    function getImageSource(link) {

      const source =

        link.dataset.galleryImage ||

        $("img", link)?.getAttribute("src") ||

        link.getAttribute("href");

      if (!source) {

        return null;

      }

      try {

        const url = new URL(

          source,

          window.location.href

        );

        if (

          url.origin !== window.location.origin ||

          !["http:", "https:"].includes(url.protocol)

        ) {

          return null;

        }

        return url.href;

      } catch {

        return null;

      }

    }


    /* ------------------------------------------------------
       Render selected gallery image
       ------------------------------------------------------ */

    function render(index) {

      const items = availableLinks();

      if (!items.length) {

        return false;

      }

      const targetIndex =

        ((index % items.length) + items.length) %

        items.length;

      const link = items[targetIndex];

      const source = getImageSource(link);

      if (!source) {

        return false;

      }

      currentIndex = targetIndex;

      const title =

        link.dataset.title ||

        $("img", link)?.alt ||

        "Event decoration inspiration";

      image.hidden = false;

      image.alt = title;

      image.src = source;

      text(

        caption,

        `${title} — ${currentIndex + 1} of ${items.length}`

      );

      if (previous) {

        previous.disabled = items.length < 2;

      }

      if (next) {

        next.disabled = items.length < 2;

      }

      return true;

    }


    /* ------------------------------------------------------
       Prevent background scrolling
       ------------------------------------------------------ */

    function lockScroll() {

      if (scrollLocked) return;

      previousBodyOverflow =

        document.body.style.overflow;

      document.body.style.overflow = "hidden";

      scrollLocked = true;

    }

    function unlockScroll() {

      if (!scrollLocked) return;

      document.body.style.overflow =

        previousBodyOverflow;

      scrollLocked = false;

    }


    /* ------------------------------------------------------
       Open image preview
       ------------------------------------------------------ */

    function open(link) {

      const items = availableLinks();

      const index = items.indexOf(link);

      if (index < 0) {

        return false;

      }

      if (!render(index)) {

        return false;

      }

      previousFocus = link;

      try {

        if (!dialog.open) {

          dialog.hidden = false;

          dialog.showModal();

        }

        lockScroll();

        closeButton?.focus();

        return true;

      } catch (error) {

        console.error(

          "Viva Events: Gallery preview failed.",

          error

        );

        unlockScroll();

        return false;

      }

    }


    /* ------------------------------------------------------
       Close image preview
       ------------------------------------------------------ */

    function close() {

      if (dialog.open) {

        dialog.close();

      }

    }


    /* ------------------------------------------------------
       Image click handling
       ------------------------------------------------------ */

    links.forEach(link => {

      link.addEventListener("click", event => {

        if (

          event.ctrlKey ||

          event.metaKey ||

          event.shiftKey ||

          event.altKey ||

          event.button !== 0

        ) {

          return;

        }

        if (open(link)) {

          event.preventDefault();

        }

      });

    });


    /* ------------------------------------------------------
       Lightbox navigation buttons
       ------------------------------------------------------ */

    closeButton?.addEventListener(

      "click",

      close

    );

    previous?.addEventListener("click", () => {

      render(currentIndex - 1);

    });

    next?.addEventListener("click", () => {

      render(currentIndex + 1);

    });


    /* ------------------------------------------------------
       Close by clicking outside the dialog
       ------------------------------------------------------ */

    dialog.addEventListener("click", event => {

      if (event.target !== dialog) {

        return;

      }

      const bounds = dialog.getBoundingClientRect();

      const outside =

        event.clientX < bounds.left ||

        event.clientX > bounds.right ||

        event.clientY < bounds.top ||

        event.clientY > bounds.bottom;

      if (outside) {

        close();

      }

    });


    /* ------------------------------------------------------
       Keyboard navigation
       ------------------------------------------------------ */

    dialog.addEventListener("keydown", event => {

      switch (event.key) {

        case "ArrowLeft":

          event.preventDefault();

          render(currentIndex - 1);

          break;

        case "ArrowRight":

          event.preventDefault();

          render(currentIndex + 1);

          break;

        case "Home":

          event.preventDefault();

          render(0);

          break;

        case "End":

          event.preventDefault();

          render(availableLinks().length - 1);

          break;

      }

    });

    dialog.addEventListener("cancel", event => {

      event.preventDefault();

      close();

    });


    /* ------------------------------------------------------
       Handle missing or broken gallery images
       ------------------------------------------------------ */

    image.addEventListener("error", () => {

      if (!dialog.open) return;

      image.hidden = true;

      text(

        caption,

        "This image is currently unavailable. " +

        "Please select another image."

      );

    });


    /* ------------------------------------------------------
       Restore page after closing lightbox
       ------------------------------------------------------ */

    dialog.addEventListener("close", () => {

      unlockScroll();

      image.removeAttribute("src");

      image.alt = "";

      image.hidden = false;

      if (

        previousFocus instanceof HTMLElement &&

        previousFocus.isConnected &&

        !previousFocus.closest("[hidden]")

      ) {

        previousFocus.focus({

          preventScroll: true

        });

      }

      previousFocus = null;

    });


    /* ------------------------------------------------------
       Close if the active gallery category changes
       ------------------------------------------------------ */

    document.addEventListener(

      "viva:gallery-filtered",

      () => {

        if (dialog.open) {

          close();

        }

      }

    );

  }


  /* ========================================================
     12. FAQ SEARCH AND CATEGORY FILTERING
     ======================================================== */

  function initialiseFAQ() {

    if (state.faqInitialised) {

      return;

    }

    const list = byId("faqList");

    if (!list) return;

    state.faqInitialised = true;

    const search = byId("faqSearch");

    const clear = byId("faqSearchClear");

    const buttons = $$(

      ".faq-filter[data-faq-filter]"

    );

    const categories = $$(

      ".faq-category[data-faq-category]",

      list

    );

    const count = byId("faqResultsCount");

    const empty = byId("faqNoResults");

    const reset = byId("faqReset");

    let activeCategory = normalise(

      buttons.find(button => {

        return button.getAttribute(

          "aria-pressed"

        ) === "true";

      })?.dataset.faqFilter || "all"

    );

    if (count) {

      count.setAttribute(

        "aria-live",

        "polite"

      );

      count.setAttribute(

        "aria-atomic",

        "true"

      );

    }


    /* ------------------------------------------------------
       Apply search and category filters
       ------------------------------------------------------ */

    function apply() {

      const query = normalise(search?.value);

      const keywords = query

        .split(/\s+/)

        .filter(Boolean);

      let visibleCount = 0;

      categories.forEach(category => {

        const categoryName = normalise(

          category.dataset.faqCategory

        );

        const categoryMatches =

          activeCategory === "all" ||

          categoryName === activeCategory;

        let categoryVisible = 0;

        const items = $$(

          ".faq-item",

          category

        );

        items.forEach(item => {

          const content = normalise(

            item.textContent

          );

          const matchesSearch = keywords.every(

            keyword => content.includes(keyword)

          );

          const matches =

            categoryMatches && matchesSearch;

          item.hidden = !matches;

          if (matches) {

            visibleCount++;

            categoryVisible++;

          }

        });

        category.hidden = categoryVisible === 0;

      });

      buttons.forEach(button => {

        const active = normalise(

          button.dataset.faqFilter

        ) === activeCategory;

        button.classList.toggle(

          "is-active",

          active

        );

        button.setAttribute(

          "aria-pressed",

          String(active)

        );

      });

      text(

        count,

        `${visibleCount} ${

          visibleCount === 1

            ? "question"

            : "questions"

        } found`

      );

      if (empty) {

        empty.hidden = visibleCount !== 0;

      }

      if (clear) {

        clear.hidden = !query;

      }

    }


    /* ------------------------------------------------------
       Reset all FAQ filters
       ------------------------------------------------------ */

    function resetAll() {

      activeCategory = "all";

      if (search) {

        search.value = "";

      }

      apply();

    }


    /* ------------------------------------------------------
       Live search
       ------------------------------------------------------ */

    search?.addEventListener(

      "input",

      apply

    );

    search?.addEventListener("keydown", event => {

      if (event.key === "Escape") {

        search.value = "";

        apply();

      }

      if (event.key === "Enter") {

        event.preventDefault();

        apply();

      }

    });


    /* ------------------------------------------------------
       Clear search button
       ------------------------------------------------------ */

    clear?.addEventListener("click", event => {

      event.preventDefault();

      if (search) {

        search.value = "";

      }

      apply();

      search?.focus();

    });


    /* ------------------------------------------------------
       Category filter buttons
       ------------------------------------------------------ */

    buttons.forEach(button => {

      if (button.tagName === "BUTTON") {

        button.type = "button";

      }

      button.addEventListener("click", event => {

        event.preventDefault();

        activeCategory = normalise(

          button.dataset.faqFilter

        ) || "all";

        apply();

      });

    });


    /* ------------------------------------------------------
       Reset button
       ------------------------------------------------------ */

    reset?.addEventListener("click", event => {

      event.preventDefault();

      resetAll();

      if (search) {

        search.focus();

      } else {

        buttons[0]?.focus();

      }

    });

    apply();

  }


  /* ========================================================
     13. CONTACT ENQUIRY FORM
     ======================================================== */

  function initialiseContactForm() {

    if (state.contactInitialised) {

      return;

    }

    const form = byId("vivaContactForm");

    if (!form) return;

    state.contactInitialised = true;

    const status = byId("contactStatus");

    const service = getFormField(

      form,

      "contactService"

    );

    const message = getFormField(

      form,

      "contactMessage"

    );

    const eventDate = getFormField(

      form,

      "contactDate"

    );

    initialiseFormStatus(

      form,

      status

    );

    setMinimumDate(eventDate);


    /* ------------------------------------------------------
       Read service and package from URL
       ------------------------------------------------------ */

    const params = new URLSearchParams(

      window.location.search

    );

    const requestedService = cleanSingleLine(

      params.get("service"),

      150

    );

    const requestedPackage = cleanSingleLine(

      params.get("package"),

      CONFIG.maxPackageLength

    );


    /* ------------------------------------------------------
       Automatically select requested service
       ------------------------------------------------------ */

    if (service && requestedService) {

      const matched = selectMatchingOption(

        service,

        requestedService

      );

      if (

        !matched &&

        message &&

        !message.value.trim()

      ) {

        message.value =

          `I would like to enquire about ${requestedService}.`;

      }

    }


    /* ------------------------------------------------------
       Automatically prepare package enquiry
       ------------------------------------------------------ */

    if (

      message &&

      requestedPackage &&

      !message.value.trim()

    ) {

      message.value =

        `I would like to enquire about the ` +

        `${requestedPackage} package.`;

    }


    /* ------------------------------------------------------
       Submit contact enquiry
       ------------------------------------------------------ */

    form.addEventListener("submit", event => {

      event.preventDefault();

      clearStatus(status);

      if (!validateForm(form, status)) {

        return;

      }

      const name = formValue(

        form,

        "contactName"

      );

      const email = formValue(

        form,

        "contactEmail"

      );

      const phone = formValue(

        form,

        "contactPhone"

      );

      const selectedService = selectedText(

        service,

        "Not specified"

      );

      const date = formValue(

        form,

        "contactDate",

        ""

      );

      const location = formValue(

        form,

        "contactLocation"

      );

      const guests = formValue(

        form,

        "contactGuests"

      );

      const budget = selectedText(

        getFormField(form, "contactBudget"),

        "Not specified"

      );

      const preferredContact = selectedText(

        getFormField(form, "contactMethod"),

        "Not specified"

      );

      const source = selectedText(

        getFormField(form, "contactSource"),

        "Not specified"

      );

      const enquiry = formValue(

        form,

        "contactMessage",

        "No additional message."

      );


      /* Validate event date */

      if (date && date < getToday()) {

        setStatus(

          status,

          "Please select today or a future event date.",

          "error"

        );

        eventDate?.focus();

        return;

      }


      /* Prepare email subject */

      const subject =

        `New Viva Events Enquiry - ${selectedService}`;


      /* Prepare complete email body */

      const body = [

        "VIVA EVENTS SYDNEY",

        "CUSTOMER EVENT ENQUIRY",

        "",

        "CUSTOMER INFORMATION",

        `Name: ${name}`,

        `Email: ${email}`,

        `Phone: ${phone}`,

        "",

        "EVENT INFORMATION",

        `Service: ${selectedService}`,

        `Package: ${requestedPackage || "Not specified"}`,

        `Event Date: ${formatDate(date)}`,

        `Event Location: ${location}`,

        `Number of Guests: ${guests}`,

        `Estimated Budget: ${budget}`,

        "",

        "CONTACT PREFERENCES",

        `Preferred Contact Method: ${preferredContact}`,

        `How Customer Found Us: ${source}`,

        "",

        "CUSTOMER MESSAGE",

        enquiry,

        "",

        "IMPORTANT INFORMATION",

        "This is an enquiry only.",

        "Pricing and availability are subject to confirmation.",

        "No booking or payment has been confirmed.",

        "",

        `Website: ${CONFIG.website}`

      ].join("\n");

      openEmail(

        subject,

        body,

        status

      );

    });


    /* ------------------------------------------------------
       Reset form status
       ------------------------------------------------------ */

    form.addEventListener("reset", () => {

      clearStatus(status);

    });

  }


  /* ========================================================
     14. CUSTOM GIFT BOX BUILDER
     ======================================================== */

  function initialiseGiftBoxBuilder() {

    if (state.giftBuilderInitialised) {

      return;

    }

    const form = byId("giftBoxBuilder");

    if (!form) return;

    state.giftBuilderInitialised = true;

    const occasion = getFormField(

      form,

      "giftOccasion"

    );

    const size = getFormField(

      form,

      "giftSize"

    );

    const quantity = getFormField(

      form,

      "giftQuantity"

    );

    const budget = getFormField(

      form,

      "giftBudget"

    );

    const delivery = getFormField(

      form,

      "giftDeliveryState"

    );

    const postcode = getFormField(

      form,

      "giftPostcode"

    );

    const requiredDate = getFormField(

      form,

      "giftRequiredDate"

    );

    const status = byId("giftBuilderStatus");

    initialiseFormStatus(

      form,

      status

    );

    setMinimumDate(requiredDate);


    /* ------------------------------------------------------
       Configure quantity input
       ------------------------------------------------------ */

    if (quantity?.type === "number") {

      if (!quantity.min || Number(quantity.min) < 1) {

        quantity.min = "1";

      }

      quantity.step = "1";

    }


    /* ------------------------------------------------------
       Configure Australian postcode input
       ------------------------------------------------------ */

    if (postcode) {

      postcode.setAttribute(

        "inputmode",

        "numeric"

      );

      postcode.setAttribute(

        "autocomplete",

        "postal-code"

      );

      if (postcode.type === "text") {

        postcode.maxLength = 4;

        postcode.pattern = "[0-9]{4}";

      }

    }


    /* ------------------------------------------------------
       Gift box summary elements
       ------------------------------------------------------ */

    const summary = {

      occasion: byId("giftSummaryOccasion"),

      size: byId("giftSummarySize"),

      contents: byId("giftSummaryContents"),

      quantity: byId("giftSummaryQuantity"),

      budget: byId("giftSummaryBudget"),

      delivery: byId("giftSummaryDelivery"),

      price: byId("giftSummaryPrice")

    };


    /* ------------------------------------------------------
       Read selected gift box contents
       ------------------------------------------------------ */

    function selectedContents() {

      return $$(

        'input[name="contents"]:checked:not(:disabled)',

        form

      ).map(input => {

        return String(input.value).trim();

      }).filter(Boolean);

    }


    /* ------------------------------------------------------
       Validate quantity
       ------------------------------------------------------ */

    function getQuantity() {

      const value = Number(

        quantity?.value ?? 1

      );

      if (

        !Number.isSafeInteger(value) ||

        value < 1

      ) {

        return null;

      }

      return value;

    }


    /* ------------------------------------------------------
       Update live gift box summary
       ------------------------------------------------------ */

    function updateSummary() {

      const contents = selectedContents();

      const selectedQuantity = getQuantity();

      text(

        summary.occasion,

        selectedText(occasion)

      );

      text(

        summary.size,

        selectedText(size)

      );

      text(

        summary.contents,

        contents.length

          ? contents.join(", ")

          : "Not selected"

      );

      text(

        summary.quantity,

        selectedQuantity === null

          ? "Enter a valid quantity"

          : selectedQuantity

      );

      text(

        summary.budget,

        selectedText(budget)

      );

      text(

        summary.delivery,

        selectedText(delivery)

      );

      text(

        summary.price,

        "Custom Quote Required"

      );

    }


    /* ------------------------------------------------------
       Live form updates
       ------------------------------------------------------ */

    form.addEventListener(

      "change",

      updateSummary

    );

    form.addEventListener(

      "input",

      updateSummary

    );


    /* ------------------------------------------------------
       Automatic occasion selection
       ------------------------------------------------------ */

    $$("[data-gift-occasion]").forEach(link => {

      link.addEventListener("click", () => {

        const requested = link.dataset.giftOccasion;

        if (

          selectMatchingOption(

            occasion,

            requested

          )

        ) {

          updateSummary();

        }

      });

    });


    /* ------------------------------------------------------
       Automatic gift box size selection
       ------------------------------------------------------ */

    $$("[data-gift-size]").forEach(link => {

      link.addEventListener("click", () => {

        const requested = link.dataset.giftSize;

        if (

          selectMatchingOption(

            size,

            requested

          )

        ) {

          updateSummary();

        }

      });

    });


    /* ------------------------------------------------------
       Support gift box URL parameters
       ------------------------------------------------------ */

    const params = new URLSearchParams(

      window.location.search

    );

    selectMatchingOption(

      occasion,

      params.get("occasion")

    );

    selectMatchingOption(

      size,

      params.get("size")

    );


    /* ------------------------------------------------------
       Validate gift box enquiry
       ------------------------------------------------------ */

    function validateGiftBox() {

      if (!validateForm(form, status)) {

        return false;

      }

      if (getQuantity() === null) {

        setStatus(

          status,

          "Please enter a valid whole-number quantity " +

          "of at least one gift box.",

          "error"

        );

        quantity?.focus();

        return false;

      }

      const postcodeValue =

        postcode?.value.trim() || "";

      if (

        postcodeValue &&

        !/^\d{4}$/.test(postcodeValue)

      ) {

        setStatus(

          status,

          "Please enter a valid four-digit " +

          "Australian postcode.",

          "error"

        );

        postcode?.focus();

        return false;

      }

      const date = requiredDate?.value || "";

      if (date && date < getToday()) {

        setStatus(

          status,

          "Please select today or a future required date.",

          "error"

        );

        requiredDate?.focus();

        return false;

      }

      return true;

    }


    /* ------------------------------------------------------
       Submit gift box enquiry
       ------------------------------------------------------ */

    form.addEventListener("submit", event => {

      event.preventDefault();

      clearStatus(status);

      if (!validateGiftBox()) {

        return;

      }

      const contents = selectedContents();

      const name = formValue(

        form,

        "giftCustomerName"

      );

      const email = formValue(

        form,

        "giftCustomerEmail"

      );

      const phone = formValue(

        form,

        "giftCustomerPhone"

      );

      const selectedQuantity = getQuantity();

      const subject =

        `Custom Gift Box Enquiry - ${name}`;


      /* Prepare complete gift box enquiry */

      const body = [

        "VIVA EVENTS SYDNEY",

        "CUSTOM GIFT BOX ENQUIRY",

        "",

        "CUSTOMER INFORMATION",

        `Name: ${name}`,

        `Email: ${email}`,

        `Phone: ${phone}`,

        "",

        "GIFT BOX INFORMATION",

        `Occasion: ${selectedText(occasion)}`,

        `Box Size: ${selectedText(size)}`,

        `Quantity: ${selectedQuantity}`,

        `Budget: ${selectedText(budget)}`,

        "",

        "SELECTED CONTENTS",

        contents.length

          ? contents.join(", ")

          : "To be discussed with Viva Events Sydney",

        "",

        "PERSONALISATION",

        `Theme or Colours: ${formValue(

          form,

          "giftTheme"

        )}`,

        `Gift Message: ${formValue(

          form,

          "giftMessage"

        )}`,

        "",

        "DELIVERY INFORMATION",

        `State or Territory: ${selectedText(delivery)}`,

        `Postcode: ${formValue(

          form,

          "giftPostcode"

        )}`,

        `Required Date: ${formatDate(

          formValue(

            form,

            "giftRequiredDate",

            ""

          )

        )}`,

        "",

        "SPECIAL REQUESTS",

        formValue(

          form,

          "giftSpecialRequests",

          "None"

        ),

        "",

        "PRICING AND ORDER INFORMATION",

        "Price: Custom quote required.",

        "Delivery charges are subject to confirmation.",

        "Product availability and ingredients must be confirmed.",

        "Allergen information will be provided before order acceptance.",

        "No payment or order has been confirmed.",

        "",

        `Website: ${CONFIG.website}`

      ].join("\n");

      openEmail(

        subject,

        body,

        status

      );

    });


    /* ------------------------------------------------------
       Reset gift box builder
       ------------------------------------------------------ */

    form.addEventListener("reset", () => {

      clearStatus(status);

      window.requestAnimationFrame(

        updateSummary

      );

    });


    /* ------------------------------------------------------
       Initial summary
       ------------------------------------------------------ */

    updateSummary();

  }


  /* ========================================================
     15. PAGE-SPECIFIC ACCESSIBILITY
     ======================================================== */

  function initialiseAccessibility() {

    const main = byId("main-content");

    if (main && !main.hasAttribute("tabindex")) {

      main.setAttribute(

        "tabindex",

        "-1"

      );

    }

    $$(

      "#galleryResultsCount, " +

      "#faqResultsCount"

    ).forEach(element => {

      element.setAttribute(

        "aria-live",

        "polite"

      );

      element.setAttribute(

        "aria-atomic",

        "true"

      );

    });

    $$(

      "#contactStatus, " +

      "#giftBuilderStatus"

    ).forEach(element => {

      element.setAttribute(

        "aria-live",

        "polite"

      );

      element.setAttribute(

        "aria-atomic",

        "true"

      );

    });

  }


  /* ========================================================
     16. PAGE IMAGE ERROR HANDLING

     Keeps the original image alt text available.
     Does not insert unrelated replacement images.
     ======================================================== */

  function initialiseImageHandling() {

    const images = $$(

      "main img"

    ).filter(image => {

      return image.id !== "galleryLightboxImage";

    });

    images.forEach(image => {

      if (

        image.dataset.vivaImageInitialised === "true"

      ) {

        return;

      }

      image.dataset.vivaImageInitialised = "true";

      function handleError() {

        image.classList.add(

          "image-load-error"

        );

        console.warn(

          "Viva Events: Unable to load image:",

          image.getAttribute("src")

        );

      }

      image.addEventListener(

        "error",

        handleError

      );

      image.addEventListener("load", () => {

        image.classList.remove(

          "image-load-error"

        );

      });

      if (

        image.complete &&

        image.naturalWidth === 0 &&

        image.getAttribute("src")

      ) {

        handleError();

      }

    });

  }


  /* ========================================================
     17. SAFE FEATURE INITIALISATION

     A failure in one feature should not prevent other
     website features from working.
     ======================================================== */

  function initialiseFeature(name, callback) {

    try {

      callback();

    } catch (error) {

      console.error(

        `Viva Events: ${name} initialisation failed.`,

        error

      );

    }

  }


  /* ========================================================
     18. MAIN WEBSITE INITIALISATION
     ======================================================== */

  function initialise() {

    if (state.started) {

      return;

    }

    state.started = true;


    /* Gallery */

    initialiseFeature(

      "Gallery filters",

      initialiseGalleryFilters

    );

    initialiseFeature(

      "Gallery lightbox",

      initialiseGalleryLightbox

    );


    /* Frequently asked questions */

    initialiseFeature(

      "FAQ search",

      initialiseFAQ

    );


    /* Contact enquiries */

    initialiseFeature(

      "Contact form",

      initialiseContactForm

    );


    /* Gift box enquiries */

    initialiseFeature(

      "Gift box builder",

      initialiseGiftBoxBuilder

    );


    /* Accessibility */

    initialiseFeature(

      "Accessibility",

      initialiseAccessibility

    );


    /* Image handling */

    initialiseFeature(

      "Image handling",

      initialiseImageHandling

    );


    /* Website ready event */

    emitEvent("viva:site-ready", {

      gallery: state.galleryInitialised,

      lightbox: state.lightboxInitialised,

      faq: state.faqInitialised,

      contact: state.contactInitialised,

      giftBuilder: state.giftBuilderInitialised

    });

  }


  /* ========================================================
     19. START WHEN DOCUMENT IS READY
     ======================================================== */

  if (document.readyState === "loading") {

    document.addEventListener(

      "DOMContentLoaded",

      initialise,

      { once: true }

    );

  } else {

    initialise();

  }

})();
