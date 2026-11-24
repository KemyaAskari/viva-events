
/* ==========================================================
   VIVA EVENTS SYDNEY
   ADMIN DASHBOARD JAVASCRIPT
   File: public/admin.js
   Version: 1.0

   Requires protected backend APIs.
   Never store passwords or sensitive customer records
   in localStorage or expose database credentials.
========================================================== */

"use strict";

(() => {
  const API = "/api/admin";

  const state = {
    user: null,
    csrfToken: null,
    section: "dashboard",
    data: {
      enquiries: [],
      bookings: [],
      giftOrders: [],
      customers: [],
      packages: [],
      gallery: [],
      reports: null,
      settings: null
    },
    busy: false
  };

  const SECTIONS = [
    "dashboard",
    "enquiries",
    "bookings",
    "gift-orders",
    "customers",
    "packages",
    "gallery",
    "reports",
    "settings"
  ];

  const SECTION_TITLES = {
    dashboard: "Dashboard",
    enquiries: "Enquiries",
    bookings: "Event Bookings",
    "gift-orders": "Gift Box Orders",
    customers: "Customers",
    packages: "Packages",
    gallery: "Gallery",
    reports: "Reports",
    settings: "Settings"
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const id = value => document.getElementById(value);

  const setText = (element, value) => {
    if (element) element.textContent = String(value ?? "");
  };

  const money = value =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD"
    }).format(Number(value) || 0);

  const normalise = value =>
    String(value ?? "").toLowerCase().trim();

  const formatDate = value => {
    if (!value) return "—";

    const raw = String(value);

    const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(`${raw}T12:00:00`)
      : new Date(raw);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
    );
  }

  function safeImagePath(value) {
    if (typeof value !== "string") return "";

    try {
      const url = new URL(value, location.origin);

      if (
        url.origin !== location.origin ||
        !url.pathname.startsWith("/assets/")
      ) {
        return "";
      }

      return url.pathname;
    } catch {
      return "";
    }
  }

  function status(element, message, error = false) {
    if (!element) return;

    element.textContent = message;
    element.dataset.state = error ? "error" : "success";
  }

  function toast(message, type = "success") {
    const container = id("adminToastContainer");

    if (!container) return;

    const item = document.createElement("div");

    item.className = `admin-toast admin-toast-${type}`;
    item.setAttribute("role", type === "error" ? "alert" : "status");
    item.textContent = message;

    container.appendChild(item);

    window.setTimeout(() => item.remove(), 4500);
  }

  function loading(visible) {
    const overlay = id("adminLoadingOverlay");

    if (overlay) overlay.hidden = !visible;
  }

  /* ========================================================
     API CLIENT
  ======================================================== */

  async function request(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();

    const headers = new Headers(options.headers || {});

    headers.set("Accept", "application/json");

    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    if (
      !["GET", "HEAD", "OPTIONS"].includes(method) &&
      state.csrfToken
    ) {
      headers.set("X-CSRF-Token", state.csrfToken);
    }

    let response;

    try {
      response = await fetch(`${API}${path}`, {
        ...options,
        method,
        headers,
        credentials: "same-origin",
        cache: "no-store"
      });
    } catch {
      throw new Error(
        "Unable to connect to the server. Check your internet connection."
      );
    }

    let result = null;

    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      result = await response.json();
    }

    if (response.status === 401) {
      state.user = null;
      state.csrfToken = null;
      showLogin();

      throw new Error("Your session has expired. Please sign in again.");
    }

    if (!response.ok) {
      throw new Error(
        result?.error ||
        result?.message ||
        `Request failed (${response.status}).`
      );
    }

    return result;
  }

  /* ========================================================
     AUTHENTICATION
  ======================================================== */

  function showLogin() {
    const app = id("adminApp");
    const login = id("adminLoginScreen");

    if (app) app.hidden = true;
    if (login) login.hidden = false;

    setText(id("adminSystemStatus"), "Signed out");
  }

  function showDashboard() {
    const app = id("adminApp");
    const login = id("adminLoginScreen");

    if (app) app.hidden = false;
    if (login) login.hidden = true;

    setText(id("adminSystemStatus"), "Connected");

    setText(
      id("adminProfileName"),
      state.user?.name || "Administrator"
    );

    setText(
      id("adminProfileRole"),
      state.user?.role || "Admin"
    );
  }

  async function checkSession() {
    try {
      const result = await request("/session");

      if (!result?.authenticated || !result?.user) {
        showLogin();
        return;
      }

      state.user = result.user;
      state.csrfToken = result.csrfToken || null;

      showDashboard();

      await navigate(
        location.hash.replace("#", "") || "dashboard"
      );
    } catch {
      showLogin();
    }
  }

  function initialiseLogin() {
    const form = id("adminLoginForm");

    if (!form) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const email = id("adminEmail")?.value.trim();
      const password = id("adminPassword")?.value;

      const submit = id("adminLoginSubmit");

      if (submit) submit.disabled = true;

      status(id("adminLoginStatus"), "Signing in...");

      try {
        const result = await request("/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            password
          })
        });

        if (!result?.authenticated || !result?.user) {
          throw new Error("Sign-in was not successful.");
        }

        state.user = result.user;
        state.csrfToken = result.csrfToken || null;

        form.reset();

        showDashboard();

        toast("Successfully signed in.");

        await navigate("dashboard");
      } catch (error) {
        status(
          id("adminLoginStatus"),
          error.message,
          true
        );
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  async function logout() {
    try {
      await request("/logout", {
        method: "POST"
      });
    } catch (error) {
      toast(error.message, "error");
    } finally {
      state.user = null;
      state.csrfToken = null;

      state.data = {
        enquiries: [],
        bookings: [],
        giftOrders: [],
        customers: [],
        packages: [],
        gallery: [],
        reports: null,
        settings: null
      };

      showLogin();
    }
  }

  /* ========================================================
     NAVIGATION
  ======================================================== */

  function closeSidebar() {
    const sidebar = id("adminSidebar");
    const toggle = id("adminMenuToggle");

    sidebar?.classList.remove("is-open");

    toggle?.setAttribute("aria-expanded", "false");

    document.body.classList.remove("admin-menu-open");
  }

  function initialiseSidebar() {
    const sidebar = id("adminSidebar");
    const toggle = id("adminMenuToggle");

    toggle?.addEventListener("click", () => {
      const open = !sidebar?.classList.contains("is-open");

      sidebar?.classList.toggle("is-open", open);

      toggle.setAttribute(
        "aria-expanded",
        String(open)
      );

      document.body.classList.toggle(
        "admin-menu-open",
        open
      );
    });

    id("adminSidebarClose")?.addEventListener(
      "click",
      closeSidebar
    );

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeSidebar();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 992) closeSidebar();
    });
  }

  async function navigate(section) {
    if (!state.user) return;

    if (!SECTIONS.includes(section)) {
      section = "dashboard";
    }

    state.section = section;

    $$(".admin-section").forEach(element => {
      const active = element.dataset.section === section;

      element.hidden = !active;
      element.classList.toggle("is-active", active);
    });

    $$("[data-admin-section]").forEach(link => {
      const active =
        link.dataset.adminSection === section;

      link.classList.toggle("is-active", active);

      if (link.matches("a")) {
        if (active) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      }
    });

    setText(
      id("adminCurrentPage"),
      SECTION_TITLES[section]
    );

    if (location.hash !== `#${section}`) {
      history.replaceState(null, "", `#${section}`);
    }

    closeSidebar();

    await loadSection(section);
  }

  function initialiseNavigation() {
    document.addEventListener("click", event => {
      const link = event.target.closest(
        "[data-admin-section]"
      );

      if (!link) return;

      event.preventDefault();

      navigate(link.dataset.adminSection).catch(
        error => toast(error.message, "error")
      );
    });

    window.addEventListener("hashchange", () => {
      const section = location.hash.slice(1);

      if (SECTIONS.includes(section)) {
        navigate(section).catch(
          error => toast(error.message, "error")
        );
      }
    });
  }

  /* ========================================================
     DATA LOADING
  ======================================================== */

  async function loadSection(section) {
    loading(true);

    try {
      switch (section) {
        case "dashboard":
          await loadDashboard();
          break;

        case "enquiries":
          await loadEnquiries();
          break;

        case "bookings":
          await loadBookings();
          break;

        case "gift-orders":
          await loadGiftOrders();
          break;

        case "customers":
          await loadCustomers();
          break;

        case "packages":
          await loadPackages();
          break;

        case "gallery":
          await loadGallery();
          break;

        case "reports":
          await loadReports();
          break;

        case "settings":
          await loadSettings();
          break;
      }
    } catch (error) {
      toast(error.message, "error");
    } finally {
      loading(false);
    }
  }

  function rows(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.items)) return result.items;
    return [];
  }

  /* ========================================================
     DASHBOARD
  ======================================================== */

  async function loadDashboard() {
    const result = await request("/dashboard");

    const stats = result?.stats || {};

    setText(id("statBookings"), stats.bookings ?? "—");
    setText(id("statEnquiries"), stats.enquiries ?? "—");
    setText(id("statGiftOrders"), stats.giftOrders ?? "—");

    setText(
      id("statRevenue"),
      stats.revenue == null ? "—" : money(stats.revenue)
    );

    setText(
      id("sidebarEnquiryCount"),
      stats.enquiries ?? 0
    );

    setText(
      id("adminNotificationCount"),
      stats.enquiries ?? 0
    );

    const notification = id("adminNotificationCount");

    if (notification) {
      notification.hidden = !(Number(stats.enquiries) > 0);
    }

    const enquiries = rows(result?.recentEnquiries);

    const tbody = id("dashboardEnquiries");

    if (tbody) {
      tbody.innerHTML = enquiries.length
        ? enquiries.map(item => `
          <tr>
            <td>${escapeHTML(item.customerName)}</td>
            <td>${escapeHTML(item.service)}</td>
            <td>
              <span class="admin-status admin-status-${escapeHTML(item.status)}">
                ${escapeHTML(item.status)}
              </span>
            </td>
          </tr>
        `).join("")
        : `<tr><td colspan="3">No recent enquiries.</td></tr>`;
    }

    const events = rows(result?.upcomingEvents);

    const container = id("dashboardUpcomingEvents");

    if (container) {
      container.innerHTML = events.length
        ? events.map(item => `
          <div class="admin-upcoming-event">
            <div class="admin-event-date">
              ${escapeHTML(formatDate(item.eventDate))}
            </div>
            <div>
              <strong>${escapeHTML(item.eventType)}</strong>
              <p>${escapeHTML(item.customerName)}</p>
              <small>${escapeHTML(item.location)}</small>
            </div>
          </div>
        `).join("")
        : `<div class="admin-empty-state">
             <p>No upcoming events.</p>
           </div>`;
    }
  }

  /* ========================================================
     ENQUIRIES
  ======================================================== */

  async function loadEnquiries() {
    const result = await request("/enquiries");

    state.data.enquiries = rows(result);

    renderEnquiries();
  }

  function renderEnquiries() {
    const query = normalise(id("enquirySearch")?.value);

    const filter =
      id("enquiryStatusFilter")?.value || "all";

    const items = state.data.enquiries.filter(item => {
      const matchesSearch = normalise([
        item.customerName,
        item.email,
        item.service,
        item.reference
      ].join(" ")).includes(query);

      const matchesStatus =
        filter === "all" || item.status === filter;

      return matchesSearch && matchesStatus;
    });

    const tbody = id("enquiriesTableBody");

    if (!tbody) return;

    tbody.innerHTML = items.length
      ? items.map(item => `
        <tr>
          <td>${escapeHTML(item.reference || item.id)}</td>
          <td>
            <strong>${escapeHTML(item.customerName)}</strong>
            <small>${escapeHTML(item.email)}</small>
          </td>
          <td>${escapeHTML(item.service)}</td>
          <td>${escapeHTML(formatDate(item.eventDate))}</td>
          <td>
            <span class="admin-status">
              ${escapeHTML(item.status)}
            </span>
          </td>
          <td>
            <button
              type="button"
              class="admin-table-action"
              data-action="view-enquiry"
              data-id="${escapeHTML(item.id)}"
            >View</button>
          </td>
        </tr>
      `).join("")
      : `<tr><td colspan="6">No matching enquiries.</td></tr>`;

    setText(
      id("enquiryResultsCount"),
      `${items.length} enquiries`
    );
  }

  /* ========================================================
     BOOKINGS
  ======================================================== */

  async function loadBookings() {
    const result = await request("/bookings");

    state.data.bookings = rows(result);

    renderBookings();
  }

  function renderBookings() {
    const query = normalise(id("bookingSearch")?.value);

    const filter =
      id("bookingStatusFilter")?.value || "all";

    const items = state.data.bookings.filter(item => {
      const matchesSearch = normalise([
        item.id,
        item.customerName,
        item.eventType,
        item.location
      ].join(" ")).includes(query);

      return matchesSearch &&
        (filter === "all" || item.status === filter);
    });

    const tbody = id("bookingsTableBody");

    if (!tbody) return;

    tbody.innerHTML = items.length
      ? items.map(item => `
        <tr>
          <td>${escapeHTML(item.reference || item.id)}</td>
          <td>${escapeHTML(item.customerName)}</td>
          <td>${escapeHTML(item.eventType)}</td>
          <td>${escapeHTML(formatDate(item.eventDate))}</td>
          <td>${escapeHTML(item.location)}</td>
          <td>${money(item.totalAmount)}</td>
          <td>
            <span class="admin-status">
              ${escapeHTML(item.status)}
            </span>
          </td>
          <td>
            <button
              type="button"
              class="admin-table-action"
              data-action="view-booking"
              data-id="${escapeHTML(item.id)}"
            >View</button>
          </td>
        </tr>
      `).join("")
      : `<tr><td colspan="8">No matching bookings.</td></tr>`;

    setText(
      id("bookingResultsCount"),
      `${items.length} bookings`
    );
  }

  /* ========================================================
     GIFT ORDERS
  ======================================================== */

  async function loadGiftOrders() {
    const result = await request("/gift-orders");

    state.data.giftOrders = rows(result);

    renderGiftOrders();
  }

  function renderGiftOrders() {
    const query = normalise(id("giftOrderSearch")?.value);

    const filter =
      id("giftOrderStatusFilter")?.value || "all";

    const items = state.data.giftOrders.filter(item => {
      const matchesSearch = normalise([
        item.id,
        item.customerName,
        item.occasion
      ].join(" ")).includes(query);

      return matchesSearch &&
        (filter === "all" || item.status === filter);
    });

    const tbody = id("giftOrdersTableBody");

    if (!tbody) return;

    tbody.innerHTML = items.length
      ? items.map(item => `
        <tr>
          <td>${escapeHTML(item.reference || item.id)}</td>
          <td>${escapeHTML(item.customerName)}</td>
          <td>${escapeHTML(item.occasion)}</td>
          <td>${escapeHTML(item.quantity)}</td>
          <td>${escapeHTML(item.deliveryState)}</td>
          <td>${money(item.total)}</td>
          <td>
            <span class="admin-status">
              ${escapeHTML(item.status)}
            </span>
          </td>
          <td>
            <button
              type="button"
              class="admin-table-action"
              data-action="view-gift-order"
              data-id="${escapeHTML(item.id)}"
            >View</button>
          </td>
        </tr>
      `).join("")
      : `<tr><td colspan="8">No matching orders.</td></tr>`;

    setText(
      id("giftOrderResultsCount"),
      `${items.length} orders`
    );
  }

  /* ========================================================
     CUSTOMERS
  ======================================================== */

  async function loadCustomers() {
    const result = await request("/customers");

    state.data.customers = rows(result);

    renderCustomers();
  }

  function renderCustomers() {
    const query = normalise(id("customerSearch")?.value);

    const items = state.data.customers.filter(item =>
      normalise([
        item.name,
        item.email,
        item.phone,
        item.location
      ].join(" ")).includes(query)
    );

    const tbody = id("customersTableBody");

    if (!tbody) return;

    tbody.innerHTML = items.length
      ? items.map(item => `
        <tr>
          <td><strong>${escapeHTML(item.name)}</strong></td>
          <td>${escapeHTML(item.email)}</td>
          <td>${escapeHTML(item.phone)}</td>
          <td>${escapeHTML(item.location)}</td>
          <td>
            <button
              type="button"
              class="admin-table-action"
              data-action="view-customer"
              data-id="${escapeHTML(item.id)}"
            >View</button>
          </td>
        </tr>
      `).join("")
      : `<tr><td colspan="5">No matching customers.</td></tr>`;

    setText(
      id("customerResultsCount"),
      `${items.length} customers`
    );
  }

  /* ========================================================
     PACKAGES
  ======================================================== */

  async function loadPackages() {
    const result = await request("/packages");

    state.data.packages = rows(result);

    const container = id("adminPackagesGrid");

    if (!container) return;

    container.innerHTML = state.data.packages.length
      ? state.data.packages.map(item => `
        <article class="admin-package-card">
          <div class="admin-package-card-content">
            <span class="admin-eyebrow">
              ${escapeHTML(item.category)}
            </span>

            <h3>${escapeHTML(item.name)}</h3>

            <p>${escapeHTML(item.description)}</p>

            <strong>
              ${
                item.startingPrice == null
                  ? "Custom Quote"
                  : `From ${money(item.startingPrice)}`
              }
            </strong>

            <p>Status: ${escapeHTML(item.visibility)}</p>

            <button
              type="button"
              class="admin-button admin-button-outline"
              data-action="view-package"
              data-id="${escapeHTML(item.id)}"
            >View Package</button>
          </div>
        </article>
      `).join("")
      : `<div class="admin-empty-state">
           <p>No packages available.</p>
         </div>`;
  }

  /* ========================================================
     GALLERY
  ======================================================== */

  async function loadGallery() {
    const result = await request("/gallery");

    state.data.gallery = rows(result);

    renderGallery();
  }

  function renderGallery() {
    const filter =
      id("galleryCategoryFilter")?.value || "all";

    const items = state.data.gallery.filter(item =>
      filter === "all" || item.category === filter
    );

    const container = id("adminGalleryGrid");

    if (!container) return;

    container.innerHTML = items.length
      ? items.map(item => {
        const src = safeImagePath(item.imageUrl);

        return `
          <article class="admin-gallery-card">
            ${
              src
                ? `<img
                    src="${escapeHTML(src)}"
                    alt="${escapeHTML(item.alt || item.title)}"
                    loading="lazy"
                  >`
                : `<div class="admin-image-placeholder">
                     No image
                   </div>`
            }

            <div class="admin-gallery-card-content">
              <strong>${escapeHTML(item.title)}</strong>
              <small>${escapeHTML(item.category)}</small>
              <small>${escapeHTML(item.visibility)}</small>

              <button
                type="button"
                class="admin-table-action"
                data-action="view-gallery"
                data-id="${escapeHTML(item.id)}"
              >View Details</button>
            </div>
          </article>
        `;
      }).join("")
      : `<div class="admin-empty-state">
           <p>No gallery images found.</p>
         </div>`;
  }

  /* ========================================================
     REPORTS
  ======================================================== */

  async function loadReports() {
    const result = await request("/reports");

    state.data.reports = result;

    setText(
      id("reportEnquiries"),
      result?.enquiries ?? "—"
    );

    setText(
      id("reportBookings"),
      result?.bookings ?? "—"
    );

    setText(
      id("reportGiftOrders"),
      result?.giftOrders ?? "—"
    );

    setText(
      id("reportRevenue"),
      result?.revenue == null
        ? "—"
        : money(result.revenue)
    );

    renderBarChart(
      id("revenueChart"),
      rows(result?.revenueByMonth),
      "label",
      "amount",
      true
    );

    renderBarChart(
      id("bookingChart"),
      rows(result?.bookingsByCategory),
      "label",
      "count",
      false
    );
  }

  function renderBarChart(
    container,
    items,
    labelKey,
    valueKey,
    currency
  ) {
    if (!container) return;

    if (!items.length) {
      container.textContent = "No report data available.";
      return;
    }

    const max = Math.max(
      1,
      ...items.map(item => Number(item[valueKey]) || 0)
    );

    container.innerHTML = `
      <div class="admin-bar-chart">
        ${items.map(item => {
          const value = Number(item[valueKey]) || 0;

          const percent = Math.max(
            0,
            Math.min(100, (value / max) * 100)
          );

          return `
            <div class="admin-bar-row">
              <span>${escapeHTML(item[labelKey])}</span>

              <div class="admin-bar-track">
                <div
                  class="admin-bar-fill"
                  style="width:${percent}%"
                ></div>
              </div>

              <strong>
                ${currency ? money(value) : value}
              </strong>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function exportReports() {
    const report = state.data.reports;

    if (!report) {
      toast("Load reports before exporting.", "error");
      return;
    }

    const lines = [
      ["Metric", "Value"],
      ["Total Enquiries", report.enquiries ?? ""],
      ["Confirmed Bookings", report.bookings ?? ""],
      ["Gift Orders", report.giftOrders ?? ""],
      ["Recorded Revenue AUD", report.revenue ?? ""]
    ];

    const csv = lines.map(row =>
      row.map(value => {
        const escaped = String(value)
          .replace(/"/g, '""');

        return `"${escaped}"`;
      }).join(",")
    ).join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csv],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "viva-events-report.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  /* ========================================================
     SETTINGS
  ======================================================== */

  async function loadSettings() {
    const result = await request("/settings");

    state.data.settings = result;

    const fields = {
      settingBusinessName: result?.businessName,
      settingBusinessEmail: result?.businessEmail,
      settingBusinessPhone: result?.businessPhone,
      settingBusinessWebsite: result?.businessWebsite,
      settingBusinessLocation: result?.businessLocation,
      settingCurrency: result?.currency
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = id(fieldId);

      if (field && value != null) {
        field.value = value;
      }
    });
  }

  /* ========================================================
     MODALS
  ======================================================== */

  function openModal(modalId) {
    if (!state.user) return;

    const dialog = id(modalId);

    if (!dialog || typeof dialog.showModal !== "function") {
      return;
    }

    if (!dialog.open) dialog.showModal();
  }

  function closeModal(modalId) {
    const dialog = id(modalId);

    if (dialog?.open) dialog.close();
  }

  function initialiseModals() {
    document.addEventListener("click", event => {
      const open = event.target.closest(
        "[data-open-modal]"
      );

      if (open) {
        event.preventDefault();
        openModal(open.dataset.openModal);
      }

      const close = event.target.closest(
        "[data-close-modal]"
      );

      if (close) {
        event.preventDefault();
        closeModal(close.dataset.closeModal);
      }
    });

    $$(".admin-modal").forEach(dialog => {
      dialog.addEventListener("click", event => {
        if (event.target === dialog) {
          dialog.close();
        }
      });
    });
  }

  /* ========================================================
     FORM SUBMISSIONS
  ======================================================== */

  function formObject(form) {
    const result = {};

    const data = new FormData(form);

    for (const [key, value] of data.entries()) {
      if (value instanceof File) continue;

      result[key] = typeof value === "string"
        ? value.trim()
        : value;
    }

    return result;
  }

  function initialiseForm({
    formId,
    endpoint,
    statusId,
    modalId,
    refreshSection
  }) {
    const form = id(formId);

    if (!form) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const submit = $('button[type="submit"]', form);

      if (submit) submit.disabled = true;

      status(id(statusId), "Saving...");

      try {
        await request(endpoint, {
          method: "POST",
          body: JSON.stringify(formObject(form))
        });

        toast("Saved successfully.");

        form.reset();

        closeModal(modalId);

        if (state.section === refreshSection) {
          await loadSection(refreshSection);
        } else if (state.section === "dashboard") {
          await loadDashboard();
        }
      } catch (error) {
        status(
          id(statusId),
          error.message,
          true
        );

        toast(error.message, "error");
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  function initialiseGalleryUpload() {
    const form = id("adminGalleryForm");

    if (!form) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const file = id("galleryImageFile")?.files?.[0];

      if (!file) {
        status(
          id("galleryFormStatus"),
          "Please select an image.",
          true
        );
        return;
      }

      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (!allowed.includes(file.type)) {
        status(
          id("galleryFormStatus"),
          "Only JPEG, PNG and WebP images are accepted.",
          true
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        status(
          id("galleryFormStatus"),
          "Image must be 5 MB or smaller.",
          true
        );
        return;
      }

      const submit = $('button[type="submit"]', form);

      if (submit) submit.disabled = true;

      try {
        const data = new FormData(form);

        await request("/gallery", {
          method: "POST",
          body: data
        });

        toast("Gallery image uploaded.");

        form.reset();

        closeModal("galleryModal");

        if (state.section === "gallery") {
          await loadGallery();
        }
      } catch (error) {
        status(
          id("galleryFormStatus"),
          error.message,
          true
        );
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  function initialiseSettingsForm() {
    const form = id("adminSettingsForm");

    if (!form) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      try {
        await request("/settings", {
          method: "PUT",
          body: JSON.stringify(formObject(form))
        });

        status(
          id("settingsStatus"),
          "Settings saved successfully."
        );

        toast("Business settings updated.");
      } catch (error) {
        status(
          id("settingsStatus"),
          error.message,
          true
        );
      }
    });
  }

  /* ========================================================
     RECORD DETAILS
  ======================================================== */

  function showRecordDetails(type, recordId) {
    const collection = {
      "view-enquiry": state.data.enquiries,
      "view-booking": state.data.bookings,
      "view-gift-order": state.data.giftOrders,
      "view-customer": state.data.customers,
      "view-package": state.data.packages,
      "view-gallery": state.data.gallery
    }[type];

    if (!collection) return;

    const record = collection.find(
      item => String(item.id) === String(recordId)
    );

    if (!record) {
      toast("Record not found.", "error");
      return;
    }

    /*
      This is a read-only detail viewer.
      It does not edit or delete records.
    */

    const existing = id("adminRecordDialog");

    existing?.remove();

    const dialog = document.createElement("dialog");

    dialog.id = "adminRecordDialog";
    dialog.className = "admin-modal";

    const title = document.createElement("h2");
    title.textContent = "Record Details";

    const list = document.createElement("dl");
    list.className = "admin-record-details";

    Object.entries(record).forEach(([key, value]) => {
      if (
        value !== null &&
        typeof value === "object"
      ) {
        return;
      }

      const term = document.createElement("dt");
      const description = document.createElement("dd");

      term.textContent = key.replace(
        /([A-Z])/g,
        " $1"
      );

      description.textContent = String(value ?? "—");

      list.append(term, description);
    });

    const close = document.createElement("button");

    close.type = "button";
    close.className =
      "admin-button admin-button-primary";

    close.textContent = "Close";

    close.addEventListener("click", () => {
      dialog.close();
    });

    dialog.addEventListener("close", () => {
      dialog.remove();
    });

    dialog.append(title, list, close);

    document.body.appendChild(dialog);

    dialog.showModal();
  }

  /* ========================================================
     EVENTS AND FILTERS
  ======================================================== */

  function initialiseFilters() {
    const filters = [
      ["enquirySearch", "input", renderEnquiries],
      ["enquiryStatusFilter", "change", renderEnquiries],
      ["bookingSearch", "input", renderBookings],
      ["bookingStatusFilter", "change", renderBookings],
      ["giftOrderSearch", "input", renderGiftOrders],
      ["giftOrderStatusFilter", "change", renderGiftOrders],
      ["customerSearch", "input", renderCustomers],
      ["galleryCategoryFilter", "change", renderGallery]
    ];

    filters.forEach(([elementId, eventName, callback]) => {
      id(elementId)?.addEventListener(
        eventName,
        callback
      );
    });

    document.addEventListener("click", event => {
      const action = event.target.closest("[data-action]");

      if (!action) return;

      const type = action.dataset.action;

      if (type.startsWith("view-")) {
        showRecordDetails(type, action.dataset.id);
      }
    });
  }

  function initialiseButtons() {
    id("adminLogout")?.addEventListener(
      "click",
      logout
    );

    id("refreshDashboard")?.addEventListener(
      "click",
      () => loadSection("dashboard")
    );

    id("refreshEnquiries")?.addEventListener(
      "click",
      () => loadSection("enquiries")
    );

    id("exportReports")?.addEventListener(
      "click",
      exportReports
    );

    id("adminNotifications")?.addEventListener(
      "click",
      () => navigate("enquiries")
    );

    id("changeAdminPassword")?.addEventListener(
      "click",
      () => {
        toast(
          "Password changes require a secure backend endpoint.",
          "error"
        );
      }
    );
  }

  /* ========================================================
     INITIALISATION
  ======================================================== */

  function initialise() {
    initialiseLogin();
    initialiseSidebar();
    initialiseNavigation();
    initialiseModals();
    initialiseFilters();
    initialiseButtons();
    initialiseSettingsForm();
    initialiseGalleryUpload();

    initialiseForm({
      formId: "adminBookingForm",
      endpoint: "/bookings",
      statusId: "bookingFormStatus",
      modalId: "bookingModal",
      refreshSection: "bookings"
    });

    initialiseForm({
      formId: "adminGiftOrderForm",
      endpoint: "/gift-orders",
      statusId: "giftOrderFormStatus",
      modalId: "giftOrderModal",
      refreshSection: "gift-orders"
    });

    initialiseForm({
      formId: "adminCustomerForm",
      endpoint: "/customers",
      statusId: "customerFormStatus",
      modalId: "customerModal",
      refreshSection: "customers"
    });

    initialiseForm({
      formId: "adminPackageForm",
      endpoint: "/packages",
      statusId: "packageFormStatus",
      modalId: "packageModal",
      refreshSection: "packages"
    });

    checkSession();
  }

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
