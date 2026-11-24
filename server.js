/* ==========================================================
   VIVA EVENTS SYDNEY
   OFFICIAL BACKEND SERVER

   Designed & Developed by Kemya Askari
   Website: https://vivaeventss.com.au
   File: server.js
   Version: 2.0

   Copyright © 2026 Viva Events Sydney.
   All Rights Reserved.
   ========================================================== */

import "dotenv/config";

import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";

import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";


/* ==========================================================
   01. SERVER CONFIGURATION
   ========================================================== */

const app = express();

const ROOT = path.dirname(
  fileURLToPath(import.meta.url)
);

const PUBLIC_DIR = path.join(ROOT, "public");

const DATA_DIR = path.join(ROOT, "data");

const PORT = Number(process.env.PORT || 3000);

const PROD = process.env.NODE_ENV === "production";

const ADMIN_EMAIL = String(
  process.env.ADMIN_EMAIL || ""
).trim().toLowerCase();

const ADMIN_PASSWORD = String(
  process.env.ADMIN_PASSWORD || ""
);

const SESSION_COOKIE = "viva_session";

const SESSION_DURATION = 8 * 60 * 60 * 1000;

const WEBSITE = "https://vivaeventss.com.au";

const BUSINESS_NAME = "Viva Events Sydney";

const BUSINESS_EMAIL = "vivaeventssydney@gmail.com";

const BUSINESS_PHONE = "0403 945 324";


/* ==========================================================
   02. ENVIRONMENT VALIDATION
   ========================================================== */

function validEmail(value) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

}

if (
  !Number.isInteger(PORT) ||
  PORT < 1 ||
  PORT > 65535
) {

  throw new Error("Invalid server port.");

}

if (!validEmail(ADMIN_EMAIL)) {

  throw new Error(
    "Set a valid ADMIN_EMAIL in your .env file."
  );

}

if (
  ADMIN_PASSWORD.length < 12 ||
  Buffer.byteLength(ADMIN_PASSWORD, "utf8") > 72
) {

  throw new Error(
    "ADMIN_PASSWORD must contain at least 12 characters " +
    "and no more than 72 UTF-8 bytes."
  );

}

if (!fs.existsSync(PUBLIC_DIR)) {

  throw new Error("The public folder is missing.");

}


/* ==========================================================
   03. DATABASE CONFIGURATION
   ========================================================== */

fs.mkdirSync(DATA_DIR, {
  recursive: true,
  mode: 0o700
});

const db = new DatabaseSync(
  path.join(DATA_DIR, "viva.sqlite")
);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);


/* ==========================================================
   04. DATABASE TABLES
   ========================================================== */

db.exec(`

  CREATE TABLE IF NOT EXISTS users (

    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at TEXT NOT NULL

  );

  CREATE TABLE IF NOT EXISTS enquiries (

    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    occasion TEXT,
    event_date TEXT,
    location TEXT,
    guests INTEGER,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New',
    created_at TEXT NOT NULL

  );

  CREATE TABLE IF NOT EXISTS records (

    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    client TEXT,
    status TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    details TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL

  );

  CREATE TABLE IF NOT EXISTS audit (

    id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    created_at TEXT NOT NULL

  );

  CREATE TABLE IF NOT EXISTS sessions (

    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    csrf_token TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE

  );

  CREATE TABLE IF NOT EXISTS settings (

    key TEXT PRIMARY KEY,
    value TEXT NOT NULL

  );

  CREATE INDEX IF NOT EXISTS idx_enquiries_status
    ON enquiries(status);

  CREATE INDEX IF NOT EXISTS idx_enquiries_created
    ON enquiries(created_at);

  CREATE INDEX IF NOT EXISTS idx_records_kind
    ON records(kind);

  CREATE INDEX IF NOT EXISTS idx_records_updated
    ON records(updated_at);

  CREATE INDEX IF NOT EXISTS idx_sessions_expiry
    ON sessions(expires_at);

  CREATE INDEX IF NOT EXISTS idx_audit_created
    ON audit(created_at);

`);


/* ==========================================================
   05. GENERAL UTILITIES
   ========================================================== */

const now = () => new Date().toISOString();

const uid = () => crypto.randomUUID();

function clean(value, max = 200) {

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {

    return "";

  }

  return String(value)
    .trim()
    .slice(0, max);

}

function hashToken(token) {

  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

}

function randomToken() {

  return crypto
    .randomBytes(32)
    .toString("hex");

}

function parseJSON(value, fallback = {}) {

  try {

    return JSON.parse(value);

  } catch {

    return fallback;

  }

}

function validDate(value) {

  if (!value) return true;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {

    return false;

  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );

}

function todaySydney() {

  const parts = new Intl.DateTimeFormat("en-AU", {

    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"

  }).formatToParts(new Date());

  const get = type =>
    parts.find(part => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;

}

function validAmount(value) {

  return (
    Number.isSafeInteger(value) &&
    Math.abs(value) <= 10000000000
  );

}

function dollarsToCents(value) {

  if (value === "" || value == null) return 0;

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {

    return NaN;

  }

  return Math.round(amount * 100);

}

function validDetails(value) {

  return (

    value !== null &&

    typeof value === "object" &&

    !Array.isArray(value) &&

    JSON.stringify(value).length <= 12000

  );

}

function audit(actor, action, target) {

  db.prepare(`
    INSERT INTO audit (
      id,
      actor,
      action,
      target,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(

    uid(),
    clean(actor, 254),
    clean(action, 150),
    clean(target, 150),
    now()

  );

}

function transaction(callback) {

  db.exec("BEGIN IMMEDIATE");

  try {

    const result = callback();

    db.exec("COMMIT");

    return result;

  } catch (error) {

    db.exec("ROLLBACK");

    throw error;

  }

}


/* ==========================================================
   06. CREATE ADMIN ACCOUNT
   ========================================================== */

const existingAdmin = db.prepare(`
  SELECT id
  FROM users
  WHERE email = ?
`).get(ADMIN_EMAIL);

if (!existingAdmin) {

  const passwordHash = bcrypt.hashSync(
    ADMIN_PASSWORD,
    12
  );

  db.prepare(`
    INSERT INTO users (
      id,
      email,
      password_hash,
      role,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(

    uid(),
    ADMIN_EMAIL,
    passwordHash,
    "owner",
    now()

  );

  console.log(
    "Viva Events: Administrator account created."
  );

}

const dummyPasswordHash = bcrypt.hashSync(
  randomToken(),
  12
);


/* ==========================================================
   07. DEFAULT BUSINESS SETTINGS
   ========================================================== */

const defaultSettings = {

  businessName: BUSINESS_NAME,

  businessEmail: BUSINESS_EMAIL,

  businessPhone: BUSINESS_PHONE,

  businessWebsite: WEBSITE,

  businessLocation: "Sydney, NSW, Australia",

  currency: "AUD"

};

const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value)
  VALUES (?, ?)
`);

for (const [key, value] of Object.entries(defaultSettings)) {

  insertSetting.run(key, value);

}

function getSettings() {

  const rows = db.prepare(`
    SELECT key, value
    FROM settings
  `).all();

  return {

    ...defaultSettings,

    ...Object.fromEntries(
      rows.map(row => [row.key, row.value])
    )

  };

}


/* ==========================================================
   08. EXPRESS SECURITY
   ========================================================== */

app.disable("x-powered-by");

/*
  Set TRUST_PROXY=1 only when the application is
  behind exactly one trusted reverse proxy.
*/

if (process.env.TRUST_PROXY === "1") {

  app.set("trust proxy", 1);

}

app.use(

  helmet({

    contentSecurityPolicy: {

      directives: {

        defaultSrc: ["'self'"],

        scriptSrc: ["'self'"],

        scriptSrcAttr: ["'none'"],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],

        imgSrc: [
          "'self'",
          "data:",
          "blob:"
        ],

        connectSrc: ["'self'"],

        objectSrc: ["'none'"],

        frameAncestors: ["'none'"],

        baseUri: ["'self'"],

        formAction: [
          "'self'",
          "mailto:"
        ],

        upgradeInsecureRequests:
          PROD ? [] : null

      }

    },

    strictTransportSecurity:
      PROD ? undefined : false,

    crossOriginEmbedderPolicy: false

  })

);

app.use(

  express.json({

    limit: "120kb",

    strict: true

  })

);

app.use("/api", (req, res, next) => {

  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  next();

});


/* ==========================================================
   09. RATE LIMITING
   ========================================================== */

const apiLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  limit: 300,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {

    error: "Too many requests. Please try again later."

  }

});

const loginLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {

    error: "Too many login attempts. Please try again later."

  }

});

const enquiryLimiter = rateLimit({

  windowMs: 60 * 60 * 1000,

  limit: 8,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {

    error: "Too many enquiries. Please try again later."

  }

});

app.use("/api", apiLimiter);


/* ==========================================================
   10. SAME-ORIGIN REQUEST PROTECTION
   ========================================================== */

app.use("/api", (req, res, next) => {

  if (
    ["GET", "HEAD", "OPTIONS"].includes(req.method)
  ) {

    return next();

  }

  const fetchSite = req.get("Sec-Fetch-Site");

  if (
    fetchSite === "cross-site" ||
    fetchSite === "same-site"
  ) {

    return res.status(403).json({

      error: "Cross-origin request rejected."

    });

  }

  const origin = req.get("Origin");

  if (origin) {

    const expectedOrigin = PROD

      ? process.env.APP_ORIGIN || WEBSITE

      : `${req.protocol}://${req.get("host")}`;

    if (origin !== expectedOrigin) {

      return res.status(403).json({

        error: "Invalid request origin."

      });

    }

  }

  next();

});


/* ==========================================================
   11. COOKIE UTILITIES
   ========================================================== */

const cookieOptions = {

  httpOnly: true,

  secure: PROD,

  sameSite: "strict",

  path: "/"

};

function getCookie(req, name) {

  const cookies = String(
    req.headers.cookie || ""
  ).split(";");

  const match = cookies
    .map(value => value.trim())
    .find(value => value.startsWith(`${name}=`));

  return match
    ? match.slice(name.length + 1)
    : null;

}

function clearSessionCookie(res) {

  res.clearCookie(
    SESSION_COOKIE,
    cookieOptions
  );

}


/* ==========================================================
   12. SECURE SESSION MANAGEMENT
   ========================================================== */

function createSession(user, res) {

  const token = randomToken();

  const csrfToken = randomToken();

  const createdAt = Date.now();

  db.prepare(`
    INSERT INTO sessions (
      token_hash,
      user_id,
      csrf_token,
      created_at,
      expires_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(

    hashToken(token),

    user.id,

    csrfToken,

    createdAt,

    createdAt + SESSION_DURATION

  );

  res.cookie(

    SESSION_COOKIE,

    token,

    {

      ...cookieOptions,

      maxAge: SESSION_DURATION

    }

  );

  return csrfToken;

}

function readSession(req) {

  const token = getCookie(
    req,
    SESSION_COOKIE
  );

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {

    return null;

  }

  return db.prepare(`

    SELECT

      sessions.token_hash,
      sessions.csrf_token,
      sessions.expires_at,
      users.id,
      users.email,
      users.role

    FROM sessions

    INNER JOIN users
      ON users.id = sessions.user_id

    WHERE sessions.token_hash = ?
      AND sessions.expires_at > ?

  `).get(

    hashToken(token),

    Date.now()

  ) || null;

}

function publicUser(user) {

  return {

    id: user.id,

    name: "Viva Events Administrator",

    email: user.email,

    role: user.role

  };

}


/* ==========================================================
   13. AUTHENTICATION MIDDLEWARE
   ========================================================== */

function auth(req, res, next) {

  const session = readSession(req);

  if (!session) {

    clearSessionCookie(res);

    return res.status(401).json({

      error: "Please sign in."

    });

  }

  if (!["owner", "admin"].includes(session.role)) {

    return res.status(403).json({

      error: "Access denied."

    });

  }

  req.session = session;

  req.user = publicUser(session);

  next();

}


/* ==========================================================
   14. CSRF PROTECTION
   ========================================================== */

function csrf(req, res, next) {

  if (
    ["GET", "HEAD", "OPTIONS"].includes(req.method)
  ) {

    return next();

  }

  const supplied = String(
    req.get("X-CSRF-Token") || ""
  );

  const expected = String(
    req.session?.csrf_token || ""
  );

  if (

    !/^[a-f0-9]{64}$/.test(supplied) ||

    !/^[a-f0-9]{64}$/.test(expected) ||

    !crypto.timingSafeEqual(

      Buffer.from(supplied),

      Buffer.from(expected)

    )

  ) {

    return res.status(403).json({

      error: "Invalid security token. Please sign in again."

    });

  }

  next();

}


/* ==========================================================
   15. LOGIN
   ========================================================== */

app.post(

  ["/api/login", "/api/admin/login"],

  loginLimiter,

  async (req, res, next) => {

    try {

      const email = clean(
        req.body?.email,
        254
      ).toLowerCase();

      const password = req.body?.password;

      if (

        !validEmail(email) ||

        typeof password !== "string" ||

        !password ||

        Buffer.byteLength(password, "utf8") > 72

      ) {

        return res.status(400).json({

          error: "Enter a valid email and password."

        });

      }

      const user = db.prepare(`
        SELECT *
        FROM users
        WHERE email = ?
      `).get(email);

      const matches = await bcrypt.compare(

        password,

        user?.password_hash || dummyPasswordHash

      );

      if (!user || !matches) {

        return res.status(401).json({

          error: "Incorrect email or password."

        });

      }

      if (!["owner", "admin"].includes(user.role)) {

        return res.status(403).json({

          error: "Access denied."

        });

      }

      const previous = readSession(req);

      if (previous) {

        db.prepare(`
          DELETE FROM sessions
          WHERE token_hash = ?
        `).run(previous.token_hash);

      }

      const csrfToken = createSession(
        user,
        res
      );

      audit(
        user.email,
        "login",
        "dashboard"
      );

      res.json({

        authenticated: true,

        user: publicUser(user),

        email: user.email,

        role: user.role,

        csrfToken

      });

    } catch (error) {

      next(error);

    }

  }

);


/* ==========================================================
   16. CHECK LOGIN SESSION
   ========================================================== */

app.get(

  ["/api/me", "/api/admin/session"],

  auth,

  (req, res) => {

    res.json({

      authenticated: true,

      user: req.user,

      ...req.user,

      csrfToken: req.session.csrf_token

    });

  }

);


/* ==========================================================
   17. LOGOUT
   ========================================================== */

app.post(

  ["/api/logout", "/api/admin/logout"],

  auth,

  csrf,

  (req, res) => {

    db.prepare(`
      DELETE FROM sessions
      WHERE token_hash = ?
    `).run(req.session.token_hash);

    audit(
      req.user.email,
      "logout",
      "dashboard"
    );

    clearSessionCookie(res);

    res.json({

      ok: true

    });

  }

);


/* ==========================================================
   18. REMOVE EXPIRED SESSIONS
   ========================================================== */

function removeExpiredSessions() {

  db.prepare(`
    DELETE FROM sessions
    WHERE expires_at <= ?
  `).run(Date.now());

}

removeExpiredSessions();

const sessionCleanup = setInterval(

  removeExpiredSessions,

  60 * 60 * 1000

);

sessionCleanup.unref();


/* ==========================================================
   19. PUBLIC CUSTOMER ENQUIRIES
   ========================================================== */

app.post(

  "/api/enquiries",

  enquiryLimiter,

  (req, res) => {

    const body = req.body || {};

    const name = clean(
      body.name ?? body.customerName,
      120
    );

    const email = clean(
      body.email ?? body.customerEmail,
      254
    );

    const phone = clean(
      body.phone ?? body.customerPhone,
      60
    );

    const occasion = clean(
      body.occasion ?? body.service,
      100
    );

    const eventDate = clean(
      body.event_date ?? body.eventDate,
      10
    );

    const location = clean(
      body.location,
      160
    );

    const message = clean(
      body.message,
      3000
    );

    const guests =

      body.guests === "" ||
      body.guests == null

        ? null

        : Number(body.guests);

    if (

      name.length < 2 ||

      !validEmail(email) ||

      message.length < 10

    ) {

      return res.status(400).json({

        error:

          "Please enter your name, a valid email " +

          "and a message of at least 10 characters."

      });

    }

    if (

      !validDate(eventDate) ||

      (eventDate && eventDate < todaySydney())

    ) {

      return res.status(400).json({

        error: "Please select a valid future event date."

      });

    }

    if (

      guests !== null &&

      (

        !Number.isSafeInteger(guests) ||

        guests < 0 ||

        guests > 100000

      )

    ) {

      return res.status(400).json({

        error: "Invalid number of guests."

      });

    }

    const id = uid();

    db.prepare(`

      INSERT INTO enquiries (

        id,
        name,
        email,
        phone,
        occasion,
        event_date,
        location,
        guests,
        message,
        status,
        created_at

      )

      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    `).run(

      id,

      name,

      email,

      phone,

      occasion,

      eventDate || null,

      location,

      guests,

      message,

      "New",

      now()

    );

    res.status(201).json({

      ok: true,

      reference: id.slice(0, 8).toUpperCase(),

      message:

        "Your enquiry has been received. " +

        "Your booking is not yet confirmed."

    });

  }

);


/* ==========================================================
   20. ADMIN API ROUTER
   ========================================================== */

const admin = express.Router();

admin.use(auth);

admin.use(csrf);

app.use("/api/admin", admin);


/* ==========================================================
   21. ADMIN ENQUIRY MANAGEMENT
   ========================================================== */

function mapEnquiry(row) {

  return {

    ...row,

    reference: row.id.slice(0, 8).toUpperCase(),

    customerName: row.name,

    customerEmail: row.email,

    customerPhone: row.phone,

    service: row.occasion,

    eventDate: row.event_date,

    createdAt: row.created_at

  };

}

function listEnquiries() {

  return db.prepare(`
    SELECT *
    FROM enquiries
    ORDER BY created_at DESC
    LIMIT 500
  `).all();

}

admin.get("/enquiries", (req, res) => {

  res.json({

    items: listEnquiries().map(mapEnquiry)

  });

});

app.get("/api/enquiries", auth, (req, res) => {

  res.json(listEnquiries());

});

function updateEnquiry(req, res) {

  const status = clean(
    req.body?.status,
    30
  );

  const allowed = [

    "New",

    "Contacted",

    "Quoted",

    "Booked",

    "Closed"

  ];

  if (!allowed.includes(status)) {

    return res.status(400).json({

      error: "Invalid enquiry status."

    });

  }

  const result = transaction(() => {

    const updated = db.prepare(`
      UPDATE enquiries
      SET status = ?
      WHERE id = ?
    `).run(

      status,

      req.params.id

    );

    if (updated.changes) {

      audit(

        req.user.email,

        "update enquiry",

        req.params.id

      );

    }

    return updated;

  });

  if (!result.changes) {

    return res.status(404).json({

      error: "Enquiry not found."

    });

  }

  res.json({

    ok: true

  });

}

admin.patch(
  "/enquiries/:id",
  updateEnquiry
);

app.patch(

  "/api/enquiries/:id",

  auth,

  csrf,

  updateEnquiry

);


/* ==========================================================
   22. BUSINESS RECORD TYPES
   ========================================================== */

const KINDS = Object.freeze([

  "booking",

  "quote",

  "invoice",

  "order",

  "project",

  "task",

  "client",

  "inventory",

  "equipment",

  "supplier",

  "food_batch",

  "packing_check",

  "expense",

  "staff",

  "design",

  "venue",

  "package",

  "gallery"

]);


/* ==========================================================
   23. RECORD UTILITIES
   ========================================================== */

function mapRecord(row) {

  const details = parseJSON(
    row.details,
    {}
  );

  return {

    ...details,

    ...row,

    details,

    reference: row.id.slice(0, 8).toUpperCase(),

    createdAt: row.created_at,

    updatedAt: row.updated_at,

    amount: row.amount_cents / 100

  };

}

function getRecords(kind = "") {

  const rows = kind

    ? db.prepare(`

        SELECT *

        FROM records

        WHERE kind = ?

        ORDER BY updated_at DESC

        LIMIT 1000

      `).all(kind)

    : db.prepare(`

        SELECT *

        FROM records

        ORDER BY updated_at DESC

        LIMIT 1500

      `).all();

  return rows.map(mapRecord);

}

function createRecord(data, actor) {

  const id = uid();

  const time = now();

  transaction(() => {

    db.prepare(`

      INSERT INTO records (

        id,
        kind,
        title,
        client,
        status,
        amount_cents,
        due_date,
        details,
        created_at,
        updated_at

      )

      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    `).run(

      id,

      data.kind,

      data.title,

      data.client || "",

      data.status || "Draft",

      data.amount_cents || 0,

      data.due_date || null,

      JSON.stringify(data.details || {}),

      time,

      time

    );

    audit(

      actor,

      `create ${data.kind}`,

      id

    );

  });

  return id;

}


/* ==========================================================
   24. GENERAL RECORD MANAGEMENT
   ========================================================== */

const recordsRouter = express.Router();

recordsRouter.get("/", (req, res) => {

  const kind = clean(
    req.query.kind,
    40
  );

  if (kind && !KINDS.includes(kind)) {

    return res.status(400).json({

      error: "Invalid record type."

    });

  }

  res.json(getRecords(kind));

});

recordsRouter.post("/", (req, res) => {

  const body = req.body || {};

  const kind = clean(body.kind, 40);

  const title = clean(body.title, 180);

  const client = clean(body.client, 180);

  const status = clean(
    body.status || "Draft",
    60
  );

  const amount = Number(
    body.amount_cents ?? 0
  );

  const dueDate = clean(
    body.due_date,
    10
  );

  const details = body.details ?? {};

  if (

    !KINDS.includes(kind) ||

    title.length < 2 ||

    !status ||

    !validAmount(amount) ||

    !validDate(dueDate) ||

    !validDetails(details)

  ) {

    return res.status(400).json({

      error: "Invalid business record information."

    });

  }

  const id = createRecord({

    kind,

    title,

    client,

    status,

    amount_cents: amount,

    due_date: dueDate,

    details

  }, req.user.email);

  res.status(201).json({

    ok: true,

    id

  });

});

recordsRouter.patch("/:id", (req, res) => {

  const old = db.prepare(`
    SELECT *
    FROM records
    WHERE id = ?
  `).get(req.params.id);

  if (!old) {

    return res.status(404).json({

      error: "Record not found."

    });

  }

  const body = req.body || {};

  const title = clean(
    body.title ?? old.title,
    180
  );

  const client = clean(
    body.client ?? old.client,
    180
  );

  const status = clean(
    body.status ?? old.status,
    60
  );

  const amount = Number(
    body.amount_cents ?? old.amount_cents
  );

  const dueDate = clean(
    body.due_date ?? old.due_date,
    10
  );

  const details = body.details === undefined

    ? parseJSON(old.details)

    : body.details;

  if (

    title.length < 2 ||

    !status ||

    !validAmount(amount) ||

    !validDate(dueDate) ||

    !validDetails(details)

  ) {

    return res.status(400).json({

      error: "Invalid record information."

    });

  }

  transaction(() => {

    db.prepare(`

      UPDATE records

      SET

        title = ?,

        client = ?,

        status = ?,

        amount_cents = ?,

        due_date = ?,

        details = ?,

        updated_at = ?

      WHERE id = ?

    `).run(

      title,

      client,

      status,

      amount,

      dueDate || null,

      JSON.stringify(details),

      now(),

      req.params.id

    );

    audit(

      req.user.email,

      `update ${old.kind}`,

      req.params.id

    );

  });

  res.json({

    ok: true

  });

});

recordsRouter.delete("/:id", (req, res) => {

  const record = db.prepare(`
    SELECT kind
    FROM records
    WHERE id = ?
  `).get(req.params.id);

  if (!record) {

    return res.status(404).json({

      error: "Record not found."

    });

  }

  transaction(() => {

    db.prepare(`
      DELETE FROM records
      WHERE id = ?
    `).run(req.params.id);

    audit(

      req.user.email,

      `delete ${record.kind}`,

      req.params.id

    );

  });

  res.json({

    ok: true

  });

});

admin.use("/records", recordsRouter);

app.use(

  "/api/records",

  auth,

  csrf,

  recordsRouter

);


/* ==========================================================
   25. ADMIN BOOKINGS
   ========================================================== */

function mapBooking(record) {

  return {

    ...record,

    customerName:

      record.details.customerName ||

      record.client,

    eventType:

      record.details.eventType ||

      record.title,

    eventDate:

      record.details.eventDate ||

      record.due_date,

    location:

      record.details.location || "",

    totalAmount:

      record.amount_cents / 100

  };

}

admin.get("/bookings", (req, res) => {

  res.json({

    items: getRecords("booking").map(mapBooking)

  });

});

admin.post("/bookings", (req, res) => {

  const body = req.body || {};

  const customerName = clean(
    body.customerName,
    120
  );

  const customerEmail = clean(
    body.customerEmail,
    254
  );

  const eventType = clean(
    body.eventType,
    100
  );

  const eventDate = clean(
    body.eventDate,
    10
  );

  const amount = dollarsToCents(
    body.totalAmount
  );

  const deposit = dollarsToCents(
    body.deposit
  );

  if (

    customerName.length < 2 ||

    !validEmail(customerEmail) ||

    !eventType ||

    !eventDate ||

    !validDate(eventDate) ||

    !validAmount(amount) ||

    !validAmount(deposit) ||

    deposit > amount

  ) {

    return res.status(400).json({

      error: "Please enter valid booking information."

    });

  }

  const id = createRecord({

    kind: "booking",

    title: eventType,

    client: customerName,

    status: clean(body.status, 60) || "Pending",

    amount_cents: amount,

    due_date: eventDate,

    details: {

      customerName,

      customerEmail,

      customerPhone: clean(
        body.customerPhone,
        60
      ),

      eventType,

      eventDate,

      eventTime: clean(
        body.eventTime,
        20
      ),

      location: clean(
        body.eventLocation ?? body.location,
        200
      ),

      guestCount: clean(
        body.guestCount,
        20
      ),

      package: clean(
        body.package,
        150
      ),

      deposit: deposit / 100,

      notes: clean(
        body.notes,
        3000
      )

    }

  }, req.user.email);

  res.status(201).json({

    ok: true,

    id

  });

});


/* ==========================================================
   26. GIFT BOX ORDER MANAGEMENT
   ========================================================== */

function mapGiftOrder(record) {

  return {

    ...record,

    customerName:

      record.details.customerName ||

      record.client,

    occasion:

      record.details.occasion ||

      record.title,

    quantity:

      record.details.quantity || 1,

    deliveryState:

      record.details.deliveryState || "",

    total:

      record.amount_cents / 100

  };

}

admin.get("/gift-orders", (req, res) => {

  res.json({

    items: getRecords("order").map(mapGiftOrder)

  });

});

admin.post("/gift-orders", (req, res) => {

  const body = req.body || {};

  const customerName = clean(
    body.customerName,
    120
  );

  const customerEmail = clean(
    body.customerEmail,
    254
  );

  const occasion = clean(
    body.occasion,
    100
  );

  const quantity = Number(body.quantity);

  const amount = dollarsToCents(body.total);

  const requiredDate = clean(
    body.requiredDate,
    10
  );

  const postcode = clean(
    body.postcode,
    10
  );

  if (

    customerName.length < 2 ||

    !validEmail(customerEmail) ||

    !occasion ||

    !Number.isSafeInteger(quantity) ||

    quantity < 1 ||

    quantity > 100000 ||

    !validAmount(amount) ||

    !validDate(requiredDate) ||

    (postcode && !/^\d{4}$/.test(postcode))

  ) {

    return res.status(400).json({

      error: "Invalid gift box order information."

    });

  }

  const id = createRecord({

    kind: "order",

    title: occasion,

    client: customerName,

    status: clean(body.status, 60) || "Pending",

    amount_cents: amount,

    due_date: requiredDate,

    details: {

      customerName,

      customerEmail,

      customerPhone: clean(
        body.customerPhone,
        60
      ),

      occasion,

      boxSize: clean(
        body.boxSize,
        100
      ),

      quantity,

      deliveryState: clean(
        body.deliveryState,
        100
      ),

      postcode,

      requiredDate,

      contents: clean(
        body.contents,
        2000
      ),

      notes: clean(
        body.notes,
        3000
      )

    }

  }, req.user.email);

  res.status(201).json({

    ok: true,

    id

  });

});


/* ==========================================================
   27. CUSTOMER MANAGEMENT
   ========================================================== */

admin.get("/customers", (req, res) => {

  const items = getRecords("client").map(record => ({

    ...record,

    name: record.details.name || record.title,

    email: record.details.email || "",

    phone: record.details.phone || "",

    location: record.details.location || ""

  }));

  res.json({

    items

  });

});

admin.post("/customers", (req, res) => {

  const body = req.body || {};

  const name = clean(body.name, 120);

  const email = clean(body.email, 254);

  if (

    name.length < 2 ||

    !validEmail(email)

  ) {

    return res.status(400).json({

      error: "Enter a valid customer name and email."

    });

  }

  const id = createRecord({

    kind: "client",

    title: name,

    client: name,

    status: "Active",

    details: {

      name,

      email,

      phone: clean(
        body.phone,
        60
      ),

      location: clean(
        body.location,
        200
      ),

      notes: clean(
        body.notes,
        3000
      )

    }

  }, req.user.email);

  res.status(201).json({

    ok: true,

    id

  });

});


/* ==========================================================
   28. PACKAGE MANAGEMENT
   ========================================================== */

admin.get("/packages", (req, res) => {

  const items = getRecords("package").map(record => ({

    ...record,

    name: record.title,

    category: record.details.category || "",

    description: record.details.description || "",

    startingPrice: record.amount_cents / 100,

    visibility: record.details.visibility || "Hidden"

  }));

  res.json({

    items

  });

});

admin.post("/packages", (req, res) => {

  const body = req.body || {};

  const name = clean(body.name, 150);

  const category = clean(body.category, 100);

  const description = clean(
    body.description,
    3000
  );

  const amount = dollarsToCents(
    body.startingPrice
  );

  const visibility = clean(
    body.visibility,
    30
  ) || "Hidden";

  if (

    name.length < 2 ||

    !category ||

    !validAmount(amount) ||

    !["Visible", "Hidden", "Published", "Draft"]
      .includes(visibility)

  ) {

    return res.status(400).json({

      error: "Invalid package information."

    });

  }

  const id = createRecord({

    kind: "package",

    title: name,

    status: visibility,

    amount_cents: amount,

    details: {

      category,

      description,

      visibility,

      features: clean(
        body.features,
        3000
      )

    }

  }, req.user.email);

  res.status(201).json({

    ok: true,

    id

  });

});


/* ==========================================================
   29. GALLERY MANAGEMENT

   Gallery records can be listed.

   Secure multipart image uploads require a separate
   upload implementation with server-side file validation.
   ========================================================== */

admin.get("/gallery", (req, res) => {

  const items = getRecords("gallery").map(record => ({

    ...record,

    title: record.title,

    category: record.details.category || "",

    imageUrl: record.details.imageUrl || "",

    alt: record.details.alt || record.title,

    visibility: record.details.visibility || "Hidden"

  }));

  res.json({

    items

  });

});

admin.post("/gallery", (req, res) => {

  res.status(501).json({

    error:

      "Gallery image uploads have not been configured. " +

      "Please use existing website assets for now."

  });

});


/* ==========================================================
   30. BUSINESS STATISTICS
   ========================================================== */

function getStatistics() {

  const counts = Object.fromEntries(

    KINDS.map(kind => [

      kind,

      db.prepare(`
        SELECT COUNT(*) AS n
        FROM records
        WHERE kind = ?
      `).get(kind).n

    ])

  );

  const enquiryCount = db.prepare(`
    SELECT COUNT(*) AS n
    FROM enquiries
  `).get().n;

  const newEnquiries = db.prepare(`
    SELECT COUNT(*) AS n
    FROM enquiries
    WHERE status = 'New'
  `).get().n;

  const invoiced = db.prepare(`

    SELECT COALESCE(SUM(amount_cents), 0) AS n

    FROM records

    WHERE kind = 'invoice'

      AND status IN ('Sent', 'Paid')

  `).get().n;

  const paidRevenue = db.prepare(`

    SELECT COALESCE(SUM(amount_cents), 0) AS n

    FROM records

    WHERE kind = 'invoice'

      AND status = 'Paid'

  `).get().n;

  return {

    counts,

    enquiryCount,

    newEnquiries,

    invoiced,

    paidRevenue

  };

}

app.get("/api/stats", auth, (req, res) => {

  res.json(getStatistics());

});

admin.get("/stats", (req, res) => {

  res.json(getStatistics());

});


/* ==========================================================
   31. ADMIN DASHBOARD
   ========================================================== */

admin.get("/dashboard", (req, res) => {

  const stats = getStatistics();

  const recentEnquiries = listEnquiries()

    .slice(0, 5)

    .map(mapEnquiry);

  const upcomingEvents = db.prepare(`

    SELECT *

    FROM records

    WHERE kind = 'booking'

      AND due_date >= ?

      AND LOWER(status) NOT IN (

        'cancelled',

        'canceled',

        'completed'

      )

    ORDER BY due_date ASC

    LIMIT 10

  `).all(todaySydney())

    .map(mapRecord)

    .map(mapBooking);

  res.json({

    stats: {

      bookings: stats.counts.booking,

      enquiries: stats.enquiryCount,

      newEnquiries: stats.newEnquiries,

      giftOrders: stats.counts.order,

      revenue: stats.paidRevenue / 100

    },

    recentEnquiries: {

      items: recentEnquiries

    },

    upcomingEvents: {

      items: upcomingEvents

    }

  });

});


/* ==========================================================
   32. BUSINESS REPORTS
   ========================================================== */

admin.get("/reports", (req, res) => {

  const stats = getStatistics();

  const revenueByMonth = db.prepare(`

    SELECT

      SUBSTR(updated_at, 1, 7) AS label,

      SUM(amount_cents) / 100.0 AS amount

    FROM records

    WHERE kind = 'invoice'

      AND status = 'Paid'

    GROUP BY SUBSTR(updated_at, 1, 7)

    ORDER BY label ASC

  `).all();

  const bookingsByCategory = db.prepare(`

    SELECT

      title AS label,

      COUNT(*) AS count

    FROM records

    WHERE kind = 'booking'

    GROUP BY title

    ORDER BY count DESC

  `).all();

  res.json({

    enquiries: stats.enquiryCount,

    bookings: stats.counts.booking,

    giftOrders: stats.counts.order,

    revenue: stats.paidRevenue / 100,

    revenueByMonth: {

      items: revenueByMonth

    },

    bookingsByCategory: {

      items: bookingsByCategory

    }

  });

});


/* ==========================================================
   33. BUSINESS SETTINGS
   ========================================================== */

admin.get("/settings", (req, res) => {

  res.json(getSettings());

});

admin.put("/settings", (req, res) => {

  const body = req.body || {};

  const current = getSettings();

  const updated = {};

  for (const key of Object.keys(defaultSettings)) {

    updated[key] = clean(

      body[key] ?? current[key],

      254

    );

  }

  let websiteValid = false;

  try {

    const url = new URL(
      updated.businessWebsite
    );

    websiteValid = url.protocol === "https:";

  } catch {

    websiteValid = false;

  }

  if (

    updated.businessName.length < 2 ||

    !validEmail(updated.businessEmail) ||

    !updated.businessPhone ||

    !websiteValid ||

    updated.currency !== "AUD"

  ) {

    return res.status(400).json({

      error: "Invalid business settings."

    });

  }

  transaction(() => {

    const statement = db.prepare(`

      INSERT INTO settings (key, value)

      VALUES (?, ?)

      ON CONFLICT(key)

      DO UPDATE SET value = excluded.value

    `);

    for (const [key, value] of Object.entries(updated)) {

      statement.run(key, value);

    }

    audit(

      req.user.email,

      "update business settings",

      "settings"

    );

  });

  res.json({

    ok: true,

    settings: getSettings()

  });

});


/* ==========================================================
   34. ADMIN PASSWORD CHANGE
   ========================================================== */

admin.post(

  "/change-password",

  loginLimiter,

  async (req, res, next) => {

    try {

      const currentPassword =
        req.body?.currentPassword;

      const newPassword =
        req.body?.newPassword;

      if (

        typeof currentPassword !== "string" ||

        typeof newPassword !== "string" ||

        newPassword.length < 12 ||

        Buffer.byteLength(newPassword, "utf8") > 72 ||

        Buffer.byteLength(currentPassword, "utf8") > 72 ||

        currentPassword === newPassword

      ) {

        return res.status(400).json({

          error:

            "Choose a different password with at least " +

            "12 characters and no more than 72 UTF-8 bytes."

        });

      }

      const user = db.prepare(`
        SELECT *
        FROM users
        WHERE id = ?
      `).get(req.user.id);

      if (

        !user ||

        !await bcrypt.compare(

          currentPassword,

          user.password_hash

        )

      ) {

        return res.status(400).json({

          error: "Current password is incorrect."

        });

      }

      const passwordHash = await bcrypt.hash(
        newPassword,
        12
      );

      transaction(() => {

        db.prepare(`
          UPDATE users
          SET password_hash = ?
          WHERE id = ?
        `).run(

          passwordHash,

          req.user.id

        );

        db.prepare(`
          DELETE FROM sessions
          WHERE user_id = ?
        `).run(req.user.id);

        audit(

          req.user.email,

          "change password",

          req.user.id

        );

      });

      clearSessionCookie(res);

      res.json({

        ok: true,

        message:

          "Password changed successfully. Please sign in again."

      });

    } catch (error) {

      next(error);

    }

  }

);


/* ==========================================================
   35. AUDIT LOG
   ========================================================== */

function getAuditLog(req, res) {

  const rows = db.prepare(`

    SELECT *

    FROM audit

    ORDER BY created_at DESC

    LIMIT 100

  `).all();

  res.json(rows);

}

admin.get("/audit", getAuditLog);

app.get(

  "/api/audit",

  auth,

  getAuditLog

);


/* ==========================================================
   36. SERVER HEALTH CHECK
   ========================================================== */

app.get("/api/health", (req, res) => {

  res.json({

    status: "online",

    service: BUSINESS_NAME

  });

});


/* ==========================================================
   37. UNKNOWN API ROUTES
   ========================================================== */

app.use("/api", (req, res) => {

  res.status(404).json({

    error: "API endpoint not found."

  });

});


/* ==========================================================
   38. ADMIN PAGE
   ========================================================== */

app.get(

  ["/admin", "/admin.html"],

  (req, res) => {

    res.setHeader(

      "X-Robots-Tag",

      "noindex, nofollow"

    );

    res.setHeader(

      "Cache-Control",

      "no-store"

    );

    res.sendFile(

      path.join(PUBLIC_DIR, "admin.html")

    );

  }

);


/* ==========================================================
   39. PUBLIC WEBSITE FILES
   ========================================================== */

app.use(

  express.static(PUBLIC_DIR, {

    extensions: ["html"],

    dotfiles: "deny",

    index: "index.html",

    maxAge: PROD ? "1h" : 0,

    etag: true,

    lastModified: true,

    setHeaders(res, filePath) {

      if (filePath.endsWith(".html")) {

        res.setHeader(

          "Cache-Control",

          "no-cache"

        );

      }

    }

  })

);


/* ==========================================================
   40. WEBSITE 404 PAGE
   ========================================================== */

app.use((req, res) => {

  const errorPage = path.join(

    PUBLIC_DIR,

    "404.html"

  );

  if (fs.existsSync(errorPage)) {

    return res.status(404).sendFile(errorPage);

  }

  res.status(404).type("html").send(`

    <!DOCTYPE html>

    <html lang="en-AU">

    <head>

      <meta charset="UTF-8">

      <meta name="viewport"
            content="width=device-width, initial-scale=1">

      <title>Page Not Found | Viva Events Sydney</title>

      <style>

        body {

          margin: 0;

          min-height: 100vh;

          display: grid;

          place-items: center;

          background: #101e31;

          color: #ffffff;

          font-family: Arial, sans-serif;

          text-align: center;

        }

        main {

          max-width: 600px;

          padding: 30px;

        }

        h1 {

          color: #c5a16a;

          font-size: 70px;

          margin: 0;

        }

        p {

          line-height: 1.8;

        }

        a {

          display: inline-block;

          padding: 14px 24px;

          background: #c5a16a;

          color: #101e31;

          text-decoration: none;

          border-radius: 6px;

          font-weight: bold;

        }

        footer {

          margin-top: 40px;

          font-size: 12px;

          color: #dce3eb;

        }

      </style>

    </head>

    <body>

      <main>

        <h1>404</h1>

        <h2>Page Not Found</h2>

        <p>

          The page you are looking for may have

          been moved or is no longer available.

        </p>

        <a href="/">Return to Homepage</a>

        <footer>

          Viva Events Sydney

          <p>Designed &amp; Developed by Kemya Askari</p>

        </footer>

      </main>

    </body>

    </html>

  `);

});


/* ==========================================================
   41. CENTRAL ERROR HANDLING
   ========================================================== */

app.use((error, req, res, next) => {

  if (res.headersSent) {

    return next(error);

  }

  if (error.type === "entity.too.large") {

    return res.status(413).json({

      error: "The submitted information is too large."

    });

  }

  if (error.type === "entity.parse.failed") {

    return res.status(400).json({

      error: "Invalid JSON request."

    });

  }

  console.error(

    "Viva Events server error:",

    error.code || error.name || "Unknown error"

  );

  res.status(500).json({

    error:

      "An unexpected server error occurred. " +

      "Please try again later."

  });

});


/* ==========================================================
   42. START SERVER
   ========================================================== */

const server = app.listen(PORT, () => {

  console.log("");

  console.log("========================================");

  console.log("       VIVA EVENTS SYDNEY");

  console.log("========================================");

  console.log(`Server: http://localhost:${PORT}`);

  console.log(`Admin:  http://localhost:${PORT}/admin`);

  console.log(`Mode:   ${PROD ? "Production" : "Development"}`);

  console.log("Database: Connected");

  console.log("Security: Enabled");

  console.log("Designed & Developed by Kemya Askari");

  console.log("========================================");

  console.log("");

});

server.on("error", error => {

  console.error(

    "Unable to start Viva Events server:",

    error.message

  );

  clearInterval(sessionCleanup);

  db.close();

  process.exitCode = 1;

});


/* ==========================================================
   43. GRACEFUL SERVER SHUTDOWN
   ========================================================== */

let shuttingDown = false;

function shutdown(signal) {

  if (shuttingDown) return;

  shuttingDown = true;

  console.log(`Received ${signal}. Closing server.`);

  clearInterval(sessionCleanup);

  const timeout = setTimeout(() => {

    process.exit(1);

  }, 10000);

  timeout.unref();

  server.close(() => {

    try {

      db.close();

      clearTimeout(timeout);

      console.log("Viva Events server closed.");

      process.exit(0);

    } catch {

      process.exit(1);

    }

  });

}

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));
