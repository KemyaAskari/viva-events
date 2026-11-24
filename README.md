# Viva Events Sydney — Full-stack starter

## What is included
- Public, responsive event-styling homepage with navy/gold branding and the supplied logo.
- Customer enquiry form saved to a SQLite database (no third-party email service connected).
- Login-protected admin dashboard with bookings, projects, design briefs, venue notes, quotes, invoices, gift enquiries/orders, customers, stock, equipment, suppliers, food batches, packing checks, staff, expenses, tasks and audit log.
- CRUD operations backed by SQLite. Passwords hashed with bcrypt; JWT session stored in an HttpOnly SameSite cookie; rate limits on API/login; Helmet HTTP headers.

## Run locally
Requires Node.js 22.13+.

1. Open this folder in VS Code.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set a real `ADMIN_EMAIL`, a unique `ADMIN_PASSWORD` (12+ chars), and a random `JWT_SECRET` (32+ chars). Example secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
5. Run `npm run dev`.
6. Visit `http://localhost:3000` for the public website and `http://localhost:3000/admin` for the admin dashboard.

**Do not use VS Code Live Server** for this version. The Node server must be running for login, enquiries and saved records.

## Before any public deployment
This is a working development starter, **not production-ready business software**. It has not been audited for security, accounting, privacy, food compliance, or financial accuracy. Not included: actual checkout/payments, invoice PDF generation, tax calculations, real calendar syncing, shipping labels, multi-user staff permissions, automated reminders, cloud backups, email notifications, production logging/monitoring, CSRF tokens, production CSP, consent management or verified legal policy text. Admin records use a general notes field rather than a validated food traceability schema. Invoices are records, not tax-compliant issued invoices.

For production: deploy Node to a suitable commercial host with persistent database storage, TLS/HTTPS, secure environment secrets, automated encrypted backups, disaster recovery, separate staging, audit, and CSRF protection. Never commit `.env` or the `data/` folder to GitHub. Do not publish customer data. Use a hosted database for multi-instance deployments; SQLite on an ephemeral platform may lose data. Vercel static hosting alone does not run this persistent SQLite server as-is.

### NSW and Australian compliance work still required
- Verify legal business name/ABN, GST registration status and Australian Consumer Law terms.
- Confirm council/NSW Food Authority notification, premises suitability and food handling rules for opening and repacking nuts, dried fruits and cookies.
- Confirm product labelling (ingredient list, mandatory allergen declarations, weights, date marks, supplier identity and lot identification), traceability and recall procedures. Do not rely on notes alone.
- Verify safe food contact packaging, shelf-life, pest control, cleaning, food handler training, storage, and suitable Australia-wide shipping conditions.
- Check Australian privacy obligations, data retention, customer consent and email marketing compliance. Legal pages are drafts.
- Check advertising and Google AdSense policies only if ads are later added; AdSense approval is not guaranteed.

### Imagery
The site uses illustrative Unsplash-hosted photos; replace with licensed business photography before publishing. Fonts load from Google Fonts. The logo is the user-supplied image.

### Useful next engineering milestones
1. Build structured customer/project/venue tables and per-job task checklists.
2. Add itemised quotes/invoices, GST settings, payments via Stripe/Square, and PDF export.
3. Add granular staff permissions, password reset/MFA, CSRF defence and production CSP.
4. Add inventory transactions, batch-to-order traceability, recall report and allergen label review gates.
5. Add scheduling, notifications, dispatch, integrations and end-to-end tests.
