# QrParky — Full System Deep Analysis & Gap Report

> **Date:** September 2, 2026  
> **Project:** QrParky (Smart Society Vehicle & Access Management Platform)  
> **Target Environment:** Node.js / Express / MySQL / Sequelize / React (Vite) / TailwindCSS  
> **Repository Root:** `d:\Sadab-Project\Qr Parky`

---

## 1. Understand the Current System

### 1.1 System Purpose
**QrParky** is a residential vehicle access control and gate pass management platform designed for gated residential societies and apartment complexes. It eliminates unauthorized parking, forged gate stickers, and paper visitor logs by providing **AES-256-GCM encrypted QR code windshield stickers** that can be scanned and verified by security guards using standard smartphone cameras without proprietary gate hardware.

---

### 1.2 User Roles & Access Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Super Administrator                      │
│     Role: 1 • Global Platform Oversight & Approvals         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Society Administrator                    │
│     Role: 2 • Housing Society Admin / Committee             │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      Resident Member                        │
│     Role: 3 • Flat / Apartment Resident Vehicle Owner       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     Public / Guard / Guest                  │
│       Role: Public • Registration Links & QR Scanner        │
└─────────────────────────────────────────────────────────────┘
```

- **Super Admin (`role: 1`)**:
  - Global overview across all onboarding housing societies.
  - Reviews, approves, or rejects society onboarding applications.
  - Automatically provisions the initial Society Admin credentials and member invite links upon approval.
  - Monitors system-wide audit logs, revenue, total active vehicles, and orders.
  - Receives alerts for Professional Pass (₹499) orders for physical sticker fulfillment.
- **Society Admin (`role: 2`)**:
  - Manages residents and vehicles within their specific society (`societyId`).
  - Approves or rejects member registration requests.
  - Reviews and approves vehicle registrations (issuing free Regular QR passes or approving ₹499 Professional passes).
  - Inspects full member profiles, contact info, and registered vehicle fleets.
  - Views, downloads (PNG), and shares official vehicle QR passes via WhatsApp.
  - Rotates or revokes member invite links and revokes lost/stolen QR passes.
- **Resident Member (`role: 3`)**:
  - Registers vehicles (2-wheeler, 4-wheeler, EV/Commercial) under their flat.
  - Chooses between Free Regular Pass (instant approval) and Professional Holographic Pass (₹499).
  - Initiates batch checkout via Razorpay integration.
  - Accesses digital QR vault to download printable windshield stickers.
- **Security Guard / Public Visitor (Unauthenticated)**:
  - Submits public society onboarding applications (`/apply-society`).
  - Registers as a resident via valid 24-character invite tokens (`/register/:token`).
  - Scans and verifies encrypted QR vehicle windshield passes via `/public/qr/verify/:token`.

---

### 1.3 System Architecture & Workflows

#### Frontend Structure (`/frontend`)
- **Single Page Application (SPA)** built with React 18, Vite 5, TailwindCSS, and React Router DOM v6.
- **Theme Engine**: `ThemeContext.jsx` provides synchronized dark (`#09090b` obsidian) and light (`#fafaf9` ivory) modes with zero-flash localStorage initialization.
- **Authentication**: `AuthContext.jsx` with Axios interceptors managing JWT access tokens in memory/localStorage and automatic redirection.
- **Route Guarding**: `<ProtectedRoute allowedRoles={[...]} />` enforces strict role boundaries across all private routes.

#### Backend Structure (`/backend`)
- **Express.js API Server** structured by MVC separation of concerns:
  - `src/controllers/`: `auth`, `dashboard`, `society`, `member`, `vehicle`, `order`.
  - `src/middleware/`: `authMiddleware`, `rbacMiddleware`, `rateLimiter`, `validate` (Zod schemas), `errorHandler`.
  - `src/models/`: Sequelize ORM models mapped to MySQL.
  - `src/utils/`: `cryptoUtils` (AES-256-GCM), `qrGenerator`, `razorpay`, `emailService` (Nodemailer), `auditLogger`.

#### Database Schema (`MySQL`)
- **`Users`**: `id, name, email, phone, passwordHash, role, status, societyId, refreshTokenHash, deletedAt`.
- **`Societies`**: `id, name, address, submittedBy (JSON), status, approvedBy, approvedAt, adminUserId, inviteLinkToken, inviteLinkExpiry, deletedAt`.
- **`Vehicles`**: `id, memberId, societyId, vehicleNumber, vehicleType, passType, status, documents (JSON), reviewedBy, reviewedAt, deletedAt`.
- **`QRCodes`**: `id, vehicleId, payloadEncrypted, qrImageUrl (TEXT), isActive, generatedAt, expiresAt, revokedAt`.
- **`Orders`**: `id, memberId, vehicleIds (JSON), amount (paise), razorpayOrderId, idempotencyKey, status`.
- **`Payments`**: `id, orderId, razorpayPaymentId, razorpaySignature, verified, rawWebhookPayload (JSON)`.
- **`AuditLogs`**: `id, actorId, actorRole, action, targetType, targetId, metadata (JSON), ipAddress, userAgent`.

---

## 2. Functionality Gaps Analysis

### Gap 2.1: Missing Dedicated Mobile Camera Scanner UI (`/scan`)
- **Problem**: The backend provides a working `/public/qr/verify/:token` endpoint that decrypts AES tokens, but there is no dedicated camera scanner page on the frontend for security guards.
- **Why it is a problem**: Guards must manually paste the token into a browser or use third-party apps, reducing practical usability at the gate.
- **Recommended Fix**: Build a clean `/scan` route in the frontend using `html5-qrcode` to scan QR codes directly with the phone camera and display instant green/red verification cards.

---

### Gap 2.2: Missing Password Reset / Forgot Password Mechanism
- **Problem**: Neither the backend nor the frontend contains endpoints or forms for password recovery (`/auth/forgot-password`, `/auth/reset-password`).
- **Why it is a problem**: If an admin or member forgets their password, they are locked out and require direct database intervention.
- **Recommended Fix**: Implement time-limited cryptographic reset tokens sent via email through `emailService.js`.

---

### Gap 2.3: Vehicle Document / RC Book File Uploads
- **Problem**: The `Vehicle` model defines a `documents` JSON column, but the frontend registration form does not yet have a drag-and-drop file upload input for vehicle registration certificates.
- **Why it is a problem**: Society Admins cannot visually verify vehicle ownership documents before approving access passes.
- **Recommended Fix**: Add a multipart file upload widget with local/S3 storage integration and preview capabilities in the Society Admin vehicle review modal.

---

### Gap 2.4: Pass Expiry Automated Cron Scheduler
- **Problem**: QR tokens encode a 365-day validity timestamp, but there is no active background cron job to transition vehicle statuses from `active` to `expired` when `expiresAt` is reached.
- **Why it is a problem**: Expired passes remain marked `active` in the database until manually revoked by an admin.
- **Recommended Fix**: Add a lightweight scheduled job (`node-cron`) to run daily at midnight and update expired records.

---

## 3. Authentication & Security Audit

| Check | Status | Severity | Notes / Findings |
| :--- | :---: | :---: | :--- |
| **Password Hashing** | **SECURE** | Low | Bcrypt with 10 salt rounds used for all user passwords. |
| **Token Rotation** | **SECURE** | Low | Refresh tokens are hashed in DB with reuse-detection that revokes compromised sessions. |
| **RBAC Authorization** | **SECURE** | Low | `rbacMiddleware.js` strictly validates role numeric IDs (`1`, `2`, `3`) on all protected routes. |
| **QR Payload Encryption** | **SECURE** | Low | AES-256-GCM cipher with random initialization vector (IV) and authentication tag validation. |
| **Password Reset Endpoint** | **MISSING** | **HIGH** | No forgot/reset password mechanism exists. |
| **LocalStorage Token Storage** | **REVIEW** | **MEDIUM** | JWT access tokens are stored in `localStorage`. While standard for SPAs, storing in HttpOnly cookies provides extra XSS resilience. |
| **Rate Limiting on Scanner** | **OPTIMIZE** | **LOW** | General rate limiter applies. A dedicated permissive limiter (`120 req/min`) is recommended for security gates. |

---

## 4. Database & Data Integrity

### 4.1 Schema Consistency
- All foreign keys (`societyId`, `memberId`, `vehicleId`, `orderId`) are properly indexed with Sequelize constraints.
- Duplicate indexing on MySQL was resolved to prevent exceeding MySQL's 64-index limit per table.
- Soft-deletes (`paranoid: true`) are enabled on `Users`, `Societies`, and `Vehicles` to preserve audit history.

### 4.2 Potential Edge Cases
- **Duplicate Society Names**: Currently constrained by `unique: true` on `Society.name`. Societies in different cities with identical names would collide.  
  *Fix*: Use composite uniqueness on `(name, address)`.
- **License Plate Sanitization**: License plates are normalized to uppercase alphanumeric (`^[A-Z0-9]+$`) both on the client and backend.

---

## 5. Complete Workflow End-to-End Testing

```
[1. Society Onboarding]
   Visitor fills /apply-society -> POST /public/societies/apply -> DB Insert (status: pending) -> Super Admin notified -> PASS

[2. Super Admin Approval]
   Super Admin clicks Approve -> POST /admin/societies/:id/approve -> User created (role: 2) -> Invite token generated -> Email sent -> PASS

[3. Member Onboarding]
   Member opens /register/:token -> POST /public/members/register/:token -> User created (status: pending) -> PASS

[4. Member Approval]
   Society Admin clicks Approve -> POST /society-admin/members/:id/approve -> User status: approved -> PASS

[5. Free Regular Vehicle Registration]
   Member submits vehicle (Regular) -> Society Admin Approves -> AES-256 QR Auto-Generated -> Status: active -> PASS

[6. Pro Pass Vehicle (₹499)]
   Member submits vehicle (Pro) -> Admin Approves -> Member pays via Razorpay -> Webhook verifies HMAC -> QR generated -> Super Admin notified -> PASS

[7. Gate Security Scan]
   Guard scans QR -> GET /public/qr/verify/:token -> Backend decrypts AES payload -> Checks DB status -> Returns Valid/Revoked -> PASS
```

---

## 6. UI & UX Audit

- **Light / Dark Mode**: Fully responsive and synchronous. Transitions are scoped without wildcard layout reflows.
- **Pass Display Modal**: Responsive, constrained within `max-h-[92vh]`, with instant PNG download, WhatsApp dispatch link, and compact token copy.
- **Vehicle Input**: Auto-uppercasing and regex sanitization applied to prevent malformed plate entries.
- **Role Isolation**: Society Admin dashboard strictly filters out admin accounts from resident tables.

---

## 7. API & Backend Quality

- **Zod Validation**: Applied to login, vehicle submission, and society onboarding payloads.
- **Audit Logging**: Comprehensive logging across all sensitive actions (`user_login`, `society_approved`, `vehicle_approved`, `payment_verified`, `qr_revoked`).
- **HTTP Status Codes**: Clean differentiation between `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## 8. Environment & Deployment Readiness

- **Environment Separation**: Clean `.env.example` documenting MySQL, JWT secrets, Razorpay keys, and SMTP credentials.
- **Railway & Render Compatibility**: Prepared for Railway MySQL database deployment and Render backend hosting.
- **Zero Build Errors**: Frontend production build (`vite build`) verified with 0 errors.

---

## 9. Final Prioritized Gap Summary

| Priority | Item | Component | Action Required |
| :--- | :--- | :---: | :--- |
| **HIGH** | **Security Guard Mobile Scanner UI** | Frontend (`/scan`) | Build camera-based scanner page with green/red verification banners. |
| **HIGH** | **Forgot & Reset Password Flow** | Auth / Backend | Implement password recovery tokens and email dispatch. |
| **MEDIUM** | **Vehicle Document / RC Uploads** | Vehicle Module | Add file upload widget for vehicle registration certificates. |
| **MEDIUM** | **Automated Pass Expiry Scheduler** | Backend Cron | Add daily cron job to flag passes older than 365 days. |
| **LOW** | **Composite Society Name Constraint** | Database | Update uniqueness from `name` to `(name, address)`. |

---
*Report generated and validated for QrParky codebase.*
