/* ==========================================================
   VIVA EVENTS SYDNEY
   OFFICIAL SHARED WEBSITE COMPONENTS

   Designed & Developed by Kemya Askari
   Website: https://vivaeventss.com.au
   File: public/components.js
   Version: 2.0

   Copyright © 2026 Viva Events Sydney.
   All Rights Reserved.

   FEATURES:
   - Shared header and footer loading
   - Responsive mobile navigation
   - Accessible dropdown navigation
   - Active page highlighting
   - Header scroll effects
   - Automatic copyright year
   - Cookie consent management
   - Privacy preference dialog
   - Back-to-top button
   - Safe external links
   - Component loading error handling
   - Admin page exclusion

   Compatible with components.css Version 2.0
   ========================================================== */

"use strict";

(() => {

  /* ========================================================
     01. CONFIGURATION
     ======================================================== */

  const CONFIG = Object.freeze({

    headerPath: "/header.html",
    footerPath: "/footer.html",

    mobileBreakpoint: 1100,

    cookieKey: "viva_cookie_preferences_v1",
    cookieVersion: 1,

    scrollThreshold: 20,
    backToTopThreshold: 450,

    componentTimeout: 10000,

    businessName: "Viva Events Sydney",
    businessEmail: "vivaeventssydney@gmail.com",
    businessPhone: "0403 945 324",
    businessPhoneLink: "+61403945324",
    businessWebsite: "https://vivaeventss.com.au"

  });


  /* ========================================================
     02. PREVENT DUPLICATE INITIALISATION
     ======================================================== */

  if (window.__vivaComponentsStarted) {
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

  window.__vivaComponentsStarted = true;


  /* ========================================================
     03. DOM UTILITIES
     ======================================================== */

  const $ = (selector, root = document) => {
    return root.querySelector(selector);
  };

  const $$ = (selector, root = document) => {
    return Array.from(root.querySelectorAll(selector));
  };

  const byId = id => {
    return document.getElementById(id);
  };

  const mobileScreen = window.matchMedia(
    `(max-width: ${CONFIG.mobileBreakpoint}px)`
  );

  const reducedMotion = () => {
    return window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  };

  function emitEvent(name, detail = {}) {

    document.dispatchEvent(
      new CustomEvent(name, {
        detail
      })
    );

  }

  function normalisePath(path) {

    return path
      .replace(/\/index\.html$/i, "/")
      .replace(/\/+$/, "") || "/";

  }

  function getEventElement(event) {

    return event.target instanceof Element
      ? event.target
      : null;

  }


  /* ========================================================
     04. SAFE LOCAL STORAGE
     ======================================================== */

  const safeStorage = {

    get(key) {

      try {

        return window.localStorage.getItem(key);

      } catch (error) {

        console.warn(
          "Viva Events: Local storage is unavailable."
        );

        return null;

      }

    },

    set(key, value) {

      try {

        window.localStorage.setItem(key, value);

        return true;

      } catch (error) {

        console.warn(
          "Viva Events: Preferences could not be saved permanently."
        );

        return false;

      }

    },

    remove(key) {

      try {

        window.localStorage.removeItem(key);

        return true;

      } catch {

        return false;

      }

    }

  };


  /* ========================================================
     05. APPLICATION STATE
     ======================================================== */

  const state = {

    started: false,

    headerLoaded: false,
    footerLoaded: false,

    headerInitialised: false,
    backToTopInitialised: false,
    cookiesInitialised: false,

    cookiePreferences: null,
    cookieTrigger: null

  };


  /* ========================================================
     06. FETCH SHARED COMPONENTS
     ======================================================== */

  async function fetchComponent(path) {

    const controller = new AbortController();

    const timeout = window.setTimeout(() => {

      controller.abort();

    }, CONFIG.componentTimeout);

    try {

      const response = await fetch(path, {

        method: "GET",

        credentials: "same-origin",

        cache: "no-cache",

        signal: controller.signal,

        headers: {

          Accept: "text/html"

        }

      });

      if (!response.ok) {

        throw new Error(
          `Unable to load ${path}. HTTP ${response.status}`
        );

      }

      const html = await response.text();

      if (!html.trim()) {

        throw new Error(
          `Component ${path} is empty.`
        );

      }

      return html;

    } finally {

      window.clearTimeout(timeout);

    }

  }


  /* ========================================================
     07. INSERT TRUSTED COMPONENT HTML
     ======================================================== */

  function insertComponent(container, html, selector) {

    if (!container) {

      return false;

    }

    /*
      Only insert trusted, developer-owned static HTML
      from header.html and footer.html.

      Never pass customer-submitted HTML into this function.
    */

    const template = document.createElement("template");

    template.innerHTML = html.trim();

    const component = template.content.querySelector(
      selector
    );

    if (!component) {

      throw new Error(
        `Expected component ${selector} was not found.`
      );

    }

    container.replaceChildren(
      component.cloneNode(true)
    );

    return true;

  }


  /* ========================================================
     08. FALLBACK HEADER
     ======================================================== */

  function renderFallbackHeader(container) {

    if (!container) return;

    container.innerHTML = `

      <header
        class="ve-header"
        id="vivaSharedHeader"
      >

        <div class="ve-topbar">

          <div class="ve-header-container ve-topbar-inner">

            <span class="ve-topbar-message">
              Sydney, NSW · Australia
            </span>

            <div class="ve-topbar-contact">

              <a href="tel:+61403945324">
                0403 945 324
              </a>

              <span
                class="ve-topbar-divider"
                aria-hidden="true"
              ></span>

              <a href="mailto:vivaeventssydney@gmail.com">
                vivaeventssydney@gmail.com
              </a>

            </div>

          </div>

        </div>

        <div class="ve-header-container ve-header-main">

          <a
            class="ve-brand"
            href="/index.html"
            aria-label="Viva Events Sydney home"
          >

            <span class="ve-brand-text">

              <span class="ve-brand-name">
                Viva Events
              </span>

              <span class="ve-brand-subtitle">
                Sydney · Event Styling
              </span>

            </span>

          </a>

          <button
            type="button"
            class="ve-menu-toggle"
            id="veMenuToggle"
            aria-controls="veMainNav"
            aria-expanded="false"
            aria-label="Open navigation menu"
          >

            <span></span>
            <span></span>
            <span></span>

          </button>

          <nav
            class="ve-nav"
            id="veMainNav"
            aria-label="Main navigation"
          >

            <a class="ve-nav-link" href="/index.html">
              Home
            </a>

            <a class="ve-nav-link" href="/about.html">
              About Us
            </a>

            <a class="ve-nav-link" href="/services.html">
              Services
            </a>

            <a class="ve-nav-link" href="/packages.html">
              Packages
            </a>

            <a class="ve-nav-link" href="/gallery.html">
              Gallery
            </a>

            <a class="ve-nav-link" href="/gift-boxes.html">
              Gift Boxes
            </a>

            <a class="ve-nav-link" href="/faq.html">
              FAQ
            </a>

            <a class="ve-nav-cta" href="/contact.html">
              Request a Quote
            </a>

            <div class="ve-mobile-contact">

              <span class="ve-mobile-contact-title">
                Let's Plan Your Celebration
              </span>

              <a href="tel:+61403945324">
                0403 945 324
              </a>

              <a href="mailto:vivaeventssydney@gmail.com">
                vivaeventssydney@gmail.com
              </a>

            </div>

          </nav>

        </div>

      </header>

    `;

  }


  /* ========================================================
     09. FALLBACK FOOTER
     ======================================================== */

  function renderFallbackFooter(container) {

    if (!container) return;

    container.innerHTML = `

      <footer
        class="ve-footer"
        id="vivaSharedFooter"
      >

        <div class="ve-footer-container ve-footer-grid">

          <div>

            <h3>Viva Events Sydney</h3>

            <p>
              Professional event decoration, wedding
              styling and personalised gift boxes.
            </p>

            <p class="ve-footer-note">
              Sydney, NSW, Australia.
            </p>

          </div>

          <div>

            <h3>Explore</h3>

            <ul class="ve-footer-links">

              <li>
                <a href="/index.html">Home</a>
              </li>

              <li>
                <a href="/about.html">About Us</a>
              </li>

              <li>
                <a href="/services.html">Our Services</a>
              </li>

              <li>
                <a href="/packages.html">Packages</a>
              </li>

              <li>
                <a href="/gallery.html">Gallery</a>
              </li>

              <li>
                <a href="/gift-boxes.html">Gift Boxes</a>
              </li>

            </ul>

          </div>

          <div>

            <h3>Customer Information</h3>

            <ul class="ve-footer-links">

              <li>
                <a href="/faq.html">
                  Frequently Asked Questions
                </a>
              </li>

              <li>
                <a href="/contact.html">Contact Us</a>
              </li>

              <li>
                <a href="/privacy.html">Privacy Policy</a>
              </li>

              <li>
                <a href="/terms.html">
                  Terms &amp; Conditions
                </a>
              </li>

              <li>
                <a href="/cookies.html">Cookie Policy</a>
              </li>

              <li>
                <a
                  href="#cookie-preferences"
                  data-cookie-settings
                >
                  Cookie Preferences
                </a>
              </li>

            </ul>

          </div>

          <div>

            <h3>Get in Touch</h3>

            <div class="ve-footer-contact">

              <a href="tel:+61403945324">
                0403 945 324
              </a>

              <a href="mailto:vivaeventssydney@gmail.com">
                vivaeventssydney@gmail.com
              </a>

              <a href="https://vivaeventss.com.au">
                vivaeventss.com.au
              </a>

            </div>

          </div>

        </div>

        <div class="ve-footer-container ve-footer-bottom">

          <span class="ve-footer-copyright">

            &copy;
            <span class="ve-current-year">2026</span>

            Viva Events Sydney.
            All rights reserved.

          </span>

          <span class="ve-footer-tagline">

            Beautiful Events. Lasting Memories.

          </span>

          <span class="ve-developer-credit">

            Designed &amp; Developed by
            <strong>Kemya Askari</strong>

          </span>

        </div>

      </footer>

    `;

  }


  /* ========================================================
     10. LOAD HEADER AND FOOTER
     ======================================================== */

  async function loadHeader() {

    const container = byId("site-header");

    if (!container) {

      return false;

    }

    container.setAttribute("aria-busy", "true");

    try {

      const html = await fetchComponent(
        CONFIG.headerPath
      );

      insertComponent(
        container,
        html,
        "#vivaSharedHeader"
      );

      state.headerLoaded = true;

    } catch (error) {

      console.error(
        "Viva Events: Header loading failed.",
        error
      );

      renderFallbackHeader(container);

      state.headerLoaded = false;

    } finally {

      container.removeAttribute("aria-busy");

    }

    initialiseHeader();
    highlightActiveLinks();

    return state.headerLoaded;

  }

  async function loadFooter() {

    const container = byId("site-footer");

    if (!container) {

      return false;

    }

    container.setAttribute("aria-busy", "true");

    try {

      const html = await fetchComponent(
        CONFIG.footerPath
      );

      insertComponent(
        container,
        html,
        "#vivaSharedFooter"
      );

      state.footerLoaded = true;

    } catch (error) {

      console.error(
        "Viva Events: Footer loading failed.",
        error
      );

      renderFallbackFooter(container);

      state.footerLoaded = false;

    } finally {

      container.removeAttribute("aria-busy");

    }

    updateCopyright();
    highlightActiveLinks();

    return state.footerLoaded;

  }

  async function loadComponents() {

    await Promise.allSettled([

      loadHeader(),
      loadFooter()

    ]);

    updateCopyright();
    highlightActiveLinks();
    initialiseExternalLinks();

    emitEvent("viva:components-loaded", {

      headerLoaded: state.headerLoaded,
      footerLoaded: state.footerLoaded,

      headerAvailable: Boolean(
        byId("vivaSharedHeader")
      ),

      footerAvailable: Boolean(
        byId("vivaSharedFooter")
      )

    });

  }


  /* ========================================================
     11. HEADER INITIALISATION
     ======================================================== */

  function initialiseHeader() {

    const header = byId("vivaSharedHeader");

    if (!header) return;

    if (header.dataset.veInitialised === "true") {

      return;

    }

    header.dataset.veInitialised = "true";

    initialiseHeaderScroll(header);
    initialiseNavigation(header);

    state.headerInitialised = true;

  }


  /* ========================================================
     12. HEADER SCROLL EFFECT
     ======================================================== */

  function initialiseHeaderScroll(header) {

    let scheduled = false;

    function updateHeader() {

      if (header.isConnected) {

        header.classList.toggle(

          "is-scrolled",

          window.scrollY > CONFIG.scrollThreshold

        );

      }

      scheduled = false;

    }

    window.addEventListener(

      "scroll",

      () => {

        if (scheduled) return;

        scheduled = true;

        window.requestAnimationFrame(
          updateHeader
        );

      },

      { passive: true }

    );

    updateHeader();

  }


  /* ========================================================
     13. ACCESSIBLE DROPDOWN NAVIGATION
     ======================================================== */

  function initialiseDropdowns(header) {

    const dropdowns = $$(

      ".nav-dropdown, [data-dropdown]",

      header

    );

    const controllers = [];

    dropdowns.forEach((dropdown, index) => {

      const toggle = $(

        ".nav-dropdown-toggle, [data-dropdown-toggle]",

        dropdown

      );

      const menu = $(

        ".nav-dropdown-menu, [data-dropdown-menu]",

        dropdown

      );

      if (!toggle || !menu) {

        return;

      }

      if (!menu.id) {

        menu.id = `vivaDropdown-${index + 1}`;

      }

      toggle.setAttribute(
        "aria-controls",
        menu.id
      );

      toggle.setAttribute(
        "aria-expanded",
        "false"
      );

      if (toggle.tagName === "BUTTON") {

        toggle.type = "button";

      }

      function isOpen() {

        return toggle.getAttribute(
          "aria-expanded"
        ) === "true";

      }

      function setOpen(open) {

        dropdown.classList.toggle(
          "is-open",
          open
        );

        toggle.setAttribute(
          "aria-expanded",
          String(open)
        );

        menu.hidden = !open;

      }

      const controller = {

        dropdown,
        toggle,
        menu,
        isOpen,
        setOpen

      };

      controllers.push(controller);

      toggle.addEventListener("click", event => {

        event.preventDefault();

        const shouldOpen = !isOpen();

        controllers.forEach(item => {

          if (item !== controller) {

            item.setOpen(false);

          }

        });

        setOpen(shouldOpen);

      });

      toggle.addEventListener("keydown", event => {

        if (event.key !== "ArrowDown") {

          return;

        }

        event.preventDefault();

        controllers.forEach(item => {

          if (item !== controller) {

            item.setOpen(false);

          }

        });

        setOpen(true);

        const firstLink = $(

          'a[href], button:not([disabled])',

          menu

        );

        firstLink?.focus();

      });

      dropdown.addEventListener("keydown", event => {

        if (event.key !== "Escape" || !isOpen()) {

          return;

        }

        event.preventDefault();
        event.stopPropagation();

        setOpen(false);

        toggle.focus();

      });

      dropdown.addEventListener("focusout", event => {

        if (
          event.relatedTarget &&
          !dropdown.contains(event.relatedTarget)
        ) {

          setOpen(false);

        }

      });

      setOpen(false);

    });

    function closeAll() {

      controllers.forEach(controller => {

        controller.setOpen(false);

      });

    }

    document.addEventListener("click", event => {

      controllers.forEach(controller => {

        if (
          !controller.dropdown.contains(event.target)
        ) {

          controller.setOpen(false);

        }

      });

    });

    return {

      closeAll

    };

  }


  /* ========================================================
     14. RESPONSIVE MOBILE NAVIGATION

     Matches components.css:
     Desktop: above 1100px
     Tablet and mobile: 1100px and below
     ======================================================== */

  function initialiseNavigation(header) {

    const toggle = byId("veMenuToggle");

    const navigation = byId("veMainNav");

    const dropdowns = initialiseDropdowns(header);

    if (!toggle || !navigation) {

      console.warn(
        "Viva Events: Mobile navigation elements are missing."
      );

      return;

    }

    toggle.type = "button";

    toggle.setAttribute(
      "aria-controls",
      navigation.id
    );

    function isMenuOpen() {

      return toggle.getAttribute(
        "aria-expanded"
      ) === "true";

    }

    function setMenu(open, restoreFocus = false) {

      const shouldOpen = Boolean(open)
        && mobileScreen.matches;

      navigation.classList.toggle(

        "is-open",

        shouldOpen

      );

      toggle.classList.toggle(

        "is-active",

        shouldOpen

      );

      toggle.setAttribute(

        "aria-expanded",

        String(shouldOpen)

      );

      toggle.setAttribute(

        "aria-label",

        shouldOpen

          ? "Close navigation menu"

          : "Open navigation menu"

      );

      navigation.hidden =

        mobileScreen.matches && !shouldOpen;

      if (!shouldOpen) {

        dropdowns.closeAll();

      }

      if (
        restoreFocus &&
        mobileScreen.matches
      ) {

        toggle.focus();

      }

    }


    /* Open and close hamburger menu */

    toggle.addEventListener("click", () => {

      setMenu(!isMenuOpen());

    });


    /* Close menu after selecting a navigation link */

    navigation.addEventListener("click", event => {

      const target = getEventElement(event);

      if (!target) return;

      const link = target.closest("a[href]");

      if (!link) return;

      if (
        link.matches(
          ".nav-dropdown-toggle, [data-dropdown-toggle]"
        )
      ) {

        return;

      }

      const href = link.getAttribute("href");

      if (!href || href === "#") {

        return;

      }

      setMenu(false);

    });


    /* Close menu when clicking outside */

    document.addEventListener("click", event => {

      if (!header.isConnected) return;

      if (
        mobileScreen.matches &&
        isMenuOpen() &&
        !header.contains(event.target)
      ) {

        setMenu(false);

      }

    });


    /* Close when keyboard focus leaves the header */

    header.addEventListener("focusout", event => {

      if (
        mobileScreen.matches &&
        isMenuOpen() &&
        event.relatedTarget &&
        !header.contains(event.relatedTarget)
      ) {

        setMenu(false);

      }

    });


    /* Close menu using Escape */

    document.addEventListener("keydown", event => {

      if (
        event.key === "Escape" &&
        mobileScreen.matches &&
        isMenuOpen()
      ) {

        event.preventDefault();

        setMenu(false, true);

      }

    });


    /* Reset only when crossing the CSS breakpoint */

    function handleBreakpointChange() {

      const focusInsideNavigation = navigation.contains(
        document.activeElement
      );

      setMenu(

        false,

        mobileScreen.matches && focusInsideNavigation

      );

    }

    if (
      typeof mobileScreen.addEventListener === "function"
    ) {

      mobileScreen.addEventListener(

        "change",

        handleBreakpointChange

      );

    } else if (
      typeof mobileScreen.addListener === "function"
    ) {

      mobileScreen.addListener(
        handleBreakpointChange
      );

    }


    /* Reset navigation when returning from browser history */

    window.addEventListener("pageshow", () => {

      setMenu(false);

    });


    /* Initial state */

    setMenu(false);

  }


  /* ========================================================
     15. ACTIVE PAGE HIGHLIGHTING
     ======================================================== */

  function highlightActiveLinks() {

    const currentPage = normalisePath(

      window.location.pathname

    );

    const links = $$(

      "#site-header a[href], #site-footer a[href]"

    );

    links.forEach(link => {

      const href = link.getAttribute("href");

      if (

        !href ||

        href.startsWith("#") ||

        href.startsWith("mailto:") ||

        href.startsWith("tel:")

      ) {

        return;

      }

      let url;

      try {

        url = new URL(

          href,

          window.location.href

        );

      } catch {

        return;

      }

      if (
        url.origin !== window.location.origin
      ) {

        return;

      }

      const isActive =

        normalisePath(url.pathname) === currentPage;

      link.classList.toggle(

        "is-active",

        isActive

      );

      if (isActive) {

        link.setAttribute(

          "aria-current",

          "page"

        );

      } else {

        link.removeAttribute(

          "aria-current"

        );

      }

    });

  }


  /* ========================================================
     16. AUTOMATIC COPYRIGHT YEAR
     ======================================================== */

  function updateCopyright() {

    const year = String(

      new Date().getFullYear()

    );

    $$(

      "[data-current-year], " +

      "#currentYear, " +

      ".current-year, " +

      ".ve-current-year"

    ).forEach(element => {

      element.textContent = year;

    });

  }


  /* ========================================================
     17. BACK-TO-TOP BUTTON
     ======================================================== */

  function initialiseBackToTop() {

    if (state.backToTopInitialised) {

      return;

    }

    state.backToTopInitialised = true;

    let button = $(

      ".back-to-top, [data-back-to-top]"

    );

    if (!button) {

      button = document.createElement("button");

      button.type = "button";

      button.className = "back-to-top";

      button.setAttribute(

        "data-back-to-top",

        ""

      );

      button.setAttribute(

        "aria-label",

        "Back to top"

      );

      button.setAttribute(

        "title",

        "Back to top"

      );

      button.innerHTML = `

        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >

          <path d="m18 15-6-6-6 6"></path>

        </svg>

      `;

      document.body.appendChild(button);

    }

    if (button.tagName === "BUTTON") {

      button.type = "button";

    }

    let scheduled = false;

    function update() {

      const visible =

        window.scrollY > CONFIG.backToTopThreshold;

      button.classList.toggle(

        "is-visible",

        visible

      );

      button.tabIndex = visible ? 0 : -1;

      button.setAttribute(

        "aria-hidden",

        String(!visible)

      );

      scheduled = false;

    }

    button.addEventListener("click", event => {

      event.preventDefault();

      window.scrollTo({

        top: 0,

        left: 0,

        behavior: reducedMotion()

          ? "instant"

          : "smooth"

      });

      const main = byId("main-content");

      if (main) {

        if (!main.hasAttribute("tabindex")) {

          main.setAttribute("tabindex", "-1");

        }

        main.focus({

          preventScroll: true

        });

      } else {

        button.blur();

      }

    });

    window.addEventListener(

      "scroll",

      () => {

        if (scheduled) return;

        scheduled = true;

        window.requestAnimationFrame(update);

      },

      { passive: true }

    );

    update();

  }


  /* ========================================================
     18. COOKIE PREFERENCE VALIDATION
     ======================================================== */

  function validateCookiePreferences(value) {

    return Boolean(

      value &&

      typeof value === "object" &&

      value.version === CONFIG.cookieVersion &&

      value.essential === true &&

      typeof value.analytics === "boolean" &&

      typeof value.advertising === "boolean"

    );

  }


  /* ========================================================
     19. READ SAVED COOKIE PREFERENCES
     ======================================================== */

  function readCookiePreferences() {

    const raw = safeStorage.get(

      CONFIG.cookieKey

    );

    if (!raw) {

      return null;

    }

    try {

      const value = JSON.parse(raw);

      if (!validateCookiePreferences(value)) {

        return null;

      }

      return value;

    } catch {

      return null;

    }

  }


  /* ========================================================
     20. DEFAULT COOKIE PREFERENCES

     Optional technologies are denied until the visitor
     makes an affirmative selection.
     ======================================================== */

  function defaultCookiePreferences() {

    return {

      version: CONFIG.cookieVersion,

      essential: true,

      analytics: false,

      advertising: false,

      updatedAt: null

    };

  }


  /* ========================================================
     21. APPLY CONSENT STATE

     This publishes consent preferences for other scripts.

     Analytics and advertising integrations must check
     these preferences before loading optional technologies.

     This is not a certified consent management platform.
     ======================================================== */

  function applyCookiePreferences(preferences) {

    const value = Object.freeze({

      ...preferences

    });

    state.cookiePreferences = value;

    document.documentElement.dataset.analyticsConsent =

      value.analytics ? "granted" : "denied";

    document.documentElement.dataset.advertisingConsent =

      value.advertising ? "granted" : "denied";

    emitEvent(

      "viva:consent-updated",

      { ...value }

    );

  }


  /* ========================================================
     22. SAVE COOKIE PREFERENCES
     ======================================================== */

  function saveCookiePreferences(preferences) {

    const value = {

      version: CONFIG.cookieVersion,

      essential: true,

      analytics: preferences.analytics === true,

      advertising: preferences.advertising === true,

      updatedAt: new Date().toISOString()

    };

    const persisted = safeStorage.set(

      CONFIG.cookieKey,

      JSON.stringify(value)

    );

    applyCookiePreferences(value);

    return {

      preferences: value,

      persisted

    };

  }


  /* ========================================================
     23. CREATE COOKIE CONSENT BANNER
     ======================================================== */

  function createCookieBanner() {

    const existing = byId("cookie-consent");

    if (existing) {

      return existing;

    }

    const banner = document.createElement("section");

    banner.id = "cookie-consent";

    banner.className = "cookie-consent";

    banner.hidden = true;

    banner.setAttribute(

      "aria-labelledby",

      "cookie-consent-title"

    );

    banner.innerHTML = `

      <div class="cookie-consent-inner">

        <div class="cookie-consent-copy">

          <strong id="cookie-consent-title">

            Your privacy matters

          </strong>

          <p>

            We use essential storage to operate this
            website and remember your privacy choices.

            With your permission, we may also use
            analytics and advertising technologies.

            You can change your preferences at any time.

            Read our

            <a href="/cookies.html">
              Cookie Policy
            </a>

            and

            <a href="/privacy.html">
              Privacy Policy
            </a>.

          </p>

        </div>

        <div class="cookie-consent-actions">

          <button
            type="button"
            id="cookie-reject"
            class="cookie-button cookie-button-outline"
          >

            Reject Optional

          </button>

          <button
            type="button"
            id="cookie-settings"
            class="cookie-button cookie-button-outline"
            aria-haspopup="dialog"
            aria-controls="cookie-preferences"
          >

            Customise

          </button>

          <button
            type="button"
            id="cookie-accept"
            class="cookie-button cookie-button-primary"
          >

            Accept All

          </button>

        </div>

      </div>

    `;

    document.body.appendChild(banner);

    return banner;

  }


  /* ========================================================
     24. CREATE COOKIE PREFERENCES DIALOG
     ======================================================== */

  function createCookiePreferencesDialog() {

    const existing = byId("cookie-preferences");

    if (existing) {

      return existing;

    }

    const dialog = document.createElement("dialog");

    dialog.id = "cookie-preferences";

    dialog.className = "cookie-preferences-dialog";

    dialog.setAttribute(

      "aria-labelledby",

      "cookie-preferences-title"

    );

    dialog.setAttribute(

      "aria-describedby",

      "cookie-preferences-description"

    );

    dialog.innerHTML = `

      <div class="cookie-preferences-header">

        <h2 id="cookie-preferences-title">

          Privacy Preferences

        </h2>

        <button
          type="button"
          id="cookie-close"
          aria-label="Close cookie preferences"
        >

          &times;

        </button>

      </div>

      <p id="cookie-preferences-description">

        Choose which optional technologies you allow.

        Essential storage remains enabled to support
        website functionality and remember your choices.

      </p>

      <form id="cookie-preferences-form">

        <div class="cookie-preference-item">

          <div>

            <strong>

              Essential

            </strong>

            <p id="essential-description">

              Required for essential website functions
              and remembering your privacy preferences.

            </p>

          </div>

          <input
            type="checkbox"
            checked
            disabled
            aria-label="Essential storage always enabled"
            aria-describedby="essential-description"
          >

        </div>

        <div class="cookie-preference-item">

          <div>

            <label for="consent-analytics">

              <strong>

                Analytics

              </strong>

            </label>

            <p id="analytics-description">

              Helps us understand how visitors use
              our website and improve its performance.

            </p>

          </div>

          <input
            type="checkbox"
            id="consent-analytics"
            name="analytics"
            aria-describedby="analytics-description"
          >

        </div>

        <div class="cookie-preference-item">

          <div>

            <label for="consent-advertising">

              <strong>

                Advertising

              </strong>

            </label>

            <p id="advertising-description">

              Allows optional advertising technologies,
              subject to our privacy practices.

            </p>

          </div>

          <input
            type="checkbox"
            id="consent-advertising"
            name="advertising"
            aria-describedby="advertising-description"
          >

        </div>

        <p
          id="cookie-preferences-status"
          role="status"
          aria-live="polite"
          hidden
        ></p>

        <div class="cookie-preferences-actions">

          <button
            type="button"
            id="cookie-preferences-reject"
            class="cookie-button cookie-button-outline"
          >

            Reject Optional

          </button>

          <button
            type="submit"
            id="cookie-save"
            class="cookie-button cookie-button-primary"
          >

            Save Preferences

          </button>

        </div>

      </form>

    `;

    document.body.appendChild(dialog);

    return dialog;

  }


  /* ========================================================
     25. COOKIE CONSENT INITIALISATION
     ======================================================== */

  function initialiseCookies() {

    if (state.cookiesInitialised) {

      return;

    }

    state.cookiesInitialised = true;

    const banner = createCookieBanner();

    const dialog = createCookiePreferencesDialog();

    const analytics = byId("consent-analytics");

    const advertising = byId("consent-advertising");

    const form = byId("cookie-preferences-form");

    const status = byId("cookie-preferences-status");

    const nativeDialog =

      typeof dialog.showModal === "function" &&

      typeof dialog.close === "function";


    /* ------------------------------------------------------
       Banner visibility
       ------------------------------------------------------ */

    function hideBanner() {

      banner.hidden = true;

    }

    function showBanner() {

      banner.hidden = false;

    }


    /* ------------------------------------------------------
       Dialog visibility
       ------------------------------------------------------ */

    function isDialogOpen() {

      return nativeDialog

        ? dialog.open

        : !dialog.hidden;

    }


    /* ------------------------------------------------------
       Restore keyboard focus
       ------------------------------------------------------ */

    function restoreFocus() {

      const trigger = state.cookieTrigger;

      state.cookieTrigger = null;

      if (

        trigger instanceof HTMLElement &&

        trigger.isConnected &&

        !trigger.closest("[hidden]") &&

        trigger.getClientRects().length > 0

      ) {

        trigger.focus({

          preventScroll: true

        });

      } else {

        const main = byId("main-content");

        if (main) {

          if (!main.hasAttribute("tabindex")) {

            main.setAttribute("tabindex", "-1");

          }

          main.focus({

            preventScroll: true

          });

        }

      }

    }


    /* ------------------------------------------------------
       Close preferences dialog
       ------------------------------------------------------ */

    function closeDialog() {

      if (!isDialogOpen()) {

        return;

      }

      if (nativeDialog) {

        dialog.close();

      } else {

        dialog.hidden = true;

        restoreFocus();

      }

    }


    /* ------------------------------------------------------
       Open preferences dialog
       ------------------------------------------------------ */

    function openDialog(trigger = document.activeElement) {

      if (isDialogOpen()) {

        return;

      }

      state.cookieTrigger = trigger;

      const existing =

        state.cookiePreferences ||

        readCookiePreferences() ||

        defaultCookiePreferences();

      if (analytics) {

        analytics.checked = existing.analytics;

      }

      if (advertising) {

        advertising.checked = existing.advertising;

      }

      if (status) {

        status.hidden = true;

        status.textContent = "";

      }

      dialog.hidden = false;

      if (nativeDialog) {

        dialog.showModal();

      } else {

        dialog.setAttribute(

          "role",

          "dialog"

        );

        dialog.setAttribute(

          "aria-modal",

          "true"

        );

      }

      byId("cookie-close")?.focus();

    }


    /* ------------------------------------------------------
       Complete visitor selection
       ------------------------------------------------------ */

    function finish(preferences) {

      const result = saveCookiePreferences(

        preferences

      );

      if (!result.persisted) {

        console.warn(

          "Viva Events: Cookie preferences apply to " +

          "this page but could not be saved for future visits."

        );

      }

      hideBanner();

      if (isDialogOpen()) {

        closeDialog();

      } else {

        restoreFocus();

      }

    }


    /* ------------------------------------------------------
       Accept all optional technologies
       ------------------------------------------------------ */

    byId("cookie-accept")?.addEventListener(

      "click",

      () => {

        finish({

          analytics: true,

          advertising: true

        });

      }

    );


    /* ------------------------------------------------------
       Reject optional technologies
       ------------------------------------------------------ */

    byId("cookie-reject")?.addEventListener(

      "click",

      () => {

        finish({

          analytics: false,

          advertising: false

        });

      }

    );


    /* ------------------------------------------------------
       Open preferences from banner
       ------------------------------------------------------ */

    byId("cookie-settings")?.addEventListener(

      "click",

      event => {

        openDialog(event.currentTarget);

      }

    );


    /* ------------------------------------------------------
       Close preferences dialog
       ------------------------------------------------------ */

    byId("cookie-close")?.addEventListener(

      "click",

      closeDialog

    );


    /* ------------------------------------------------------
       Reject optional technologies from dialog
       ------------------------------------------------------ */

    byId("cookie-preferences-reject")?.addEventListener(

      "click",

      () => {

        finish({

          analytics: false,

          advertising: false

        });

      }

    );


    /* ------------------------------------------------------
       Save customised preferences
       ------------------------------------------------------ */

    form?.addEventListener(

      "submit",

      event => {

        event.preventDefault();

        finish({

          analytics: analytics?.checked === true,

          advertising: advertising?.checked === true

        });

      }

    );


    /* Support older HTML without a preferences form */

    if (!form) {

      byId("cookie-save")?.addEventListener(

        "click",

        event => {

          event.preventDefault();

          finish({

            analytics: analytics?.checked === true,

            advertising: advertising?.checked === true

          });

        }

      );

    }


    /* ------------------------------------------------------
       Open preferences from any public page or footer

       Delegated event handling supports dynamically
       loaded footer.html.
       ------------------------------------------------------ */

    document.addEventListener("click", event => {

      const target = getEventElement(event);

      if (!target) return;

      const trigger = target.closest(

        "#openCookiePreferences, " +

        "[data-cookie-settings], " +

        'a[href="#cookie-preferences"]'

      );

      if (!trigger) {

        return;

      }

      event.preventDefault();

      openDialog(trigger);

    });


    /* ------------------------------------------------------
       Native dialog close handling
       ------------------------------------------------------ */

    if (nativeDialog) {

      dialog.addEventListener(

        "close",

        restoreFocus

      );

      dialog.addEventListener("cancel", event => {

        event.preventDefault();

        closeDialog();

      });

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

          closeDialog();

        }

      });

    } else {

      dialog.hidden = true;

      dialog.addEventListener("click", event => {

        if (event.target === dialog) {

          closeDialog();

        }

      });


      /* Keyboard support for non-native dialog containers */

      document.addEventListener("keydown", event => {

        if (!isDialogOpen()) {

          return;

        }

        if (event.key === "Escape") {

          event.preventDefault();

          closeDialog();

          return;

        }

        if (event.key !== "Tab") {

          return;

        }

        const focusable = $$(

          'a[href], ' +

          'button:not([disabled]), ' +

          'input:not([disabled]), ' +

          'select:not([disabled]), ' +

          'textarea:not([disabled]), ' +

          '[tabindex]:not([tabindex="-1"])',

          dialog

        ).filter(element => {

          return element.getClientRects().length > 0;

        });

        if (!focusable.length) {

          event.preventDefault();

          return;

        }

        const first = focusable[0];

        const last = focusable[focusable.length - 1];

        if (

          event.shiftKey &&

          document.activeElement === first

        ) {

          event.preventDefault();

          last.focus();

        } else if (

          !event.shiftKey &&

          document.activeElement === last

        ) {

          event.preventDefault();

          first.focus();

        }

      });

    }


    /* ------------------------------------------------------
       Synchronise preferences between browser tabs
       ------------------------------------------------------ */

    window.addEventListener("storage", event => {

      if (

        event.key !== CONFIG.cookieKey &&

        event.key !== null

      ) {

        return;

      }

      const existing = readCookiePreferences();

      applyCookiePreferences(

        existing || defaultCookiePreferences()

      );

      if (existing) {

        hideBanner();

      } else {

        showBanner();

      }

      if (isDialogOpen()) {

        if (analytics) {

          analytics.checked = existing?.analytics ?? false;

        }

        if (advertising) {

          advertising.checked = existing?.advertising ?? false;

        }

      }

    });


    /* ------------------------------------------------------
       Initial consent state
       ------------------------------------------------------ */

    const existing = readCookiePreferences();

    applyCookiePreferences(

      existing || defaultCookiePreferences()

    );

    if (existing) {

      hideBanner();

    } else {

      showBanner();

    }


    /* ------------------------------------------------------
       Public consent interface for future integrations
       ------------------------------------------------------ */

    window.VivaConsent = Object.freeze({

      getPreferences() {

        return {

          ...state.cookiePreferences

        };

      },

      hasConsent(category) {

        if (category === "essential") {

          return true;

        }

        if (

          category !== "analytics" &&

          category !== "advertising"

        ) {

          return false;

        }

        return state.cookiePreferences?.[category] === true;

      },

      openPreferences() {

        openDialog();

      },

      resetPreferences() {

        safeStorage.remove(

          CONFIG.cookieKey

        );

        applyCookiePreferences(

          defaultCookiePreferences()

        );

        closeDialog();

        showBanner();

      }

    });

  }


  /* ========================================================
     26. SAFE EXTERNAL LINKS
     ======================================================== */

  function initialiseExternalLinks() {

    $$('a[target="_blank"]').forEach(link => {

      const rel = new Set(

        (link.getAttribute("rel") || "")

          .split(/\s+/)

          .filter(Boolean)

      );

      rel.add("noopener");

      rel.add("noreferrer");

      link.setAttribute(

        "rel",

        Array.from(rel).join(" ")

      );

    });

  }


  /* ========================================================
     27. IMAGE ERROR HANDLING

     Does not replace images with unrelated stock images.
     ======================================================== */

  function initialiseImageHandling() {

    const images = $$(

      "#site-header img, #site-footer img"

    );

    images.forEach(image => {

      if (image.dataset.veImageInitialised === "true") {

        return;

      }

      image.dataset.veImageInitialised = "true";

      function handleError() {

        console.warn(

          "Viva Events: Image could not be loaded.",

          image.getAttribute("src")

        );

        const brandMark = image.closest(

          ".ve-brand-mark"

        );

        if (brandMark) {

          brandMark.hidden = true;

        }

      }

      image.addEventListener(

        "error",

        handleError,

        { once: true }

      );

      if (

        image.complete &&

        image.naturalWidth === 0

      ) {

        handleError();

      }

    });

  }


  /* ========================================================
     28. MAIN WEBSITE INITIALISATION
     ======================================================== */

  async function initialise() {

    if (state.started) {

      return;

    }

    state.started = true;

    /*
      Initialise privacy preferences before loading
      shared header and footer components.
    */

    try {

      initialiseCookies();

    } catch (error) {

      console.error(

        "Viva Events: Cookie interface initialisation failed.",

        error

      );

    }

    try {

      initialiseBackToTop();

    } catch (error) {

      console.error(

        "Viva Events: Back-to-top initialisation failed.",

        error

      );

    }

    try {

      await loadComponents();

      initialiseImageHandling();

    } catch (error) {

      console.error(

        "Viva Events: Shared component initialisation failed.",

        error

      );

    }

    updateCopyright();

    highlightActiveLinks();

    initialiseExternalLinks();

    emitEvent("viva:ready", {

      headerLoaded: state.headerLoaded,

      footerLoaded: state.footerLoaded,

      cookiesInitialised: state.cookiesInitialised,

      backToTopInitialised: state.backToTopInitialised

    });

  }


  /* ========================================================
     29. START WHEN DOCUMENT IS READY
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

