# 🏥 MediCare Pro - Pharmacy & Inventory Management System

MediCare Pro is a comprehensive, full-stack web application designed to digitize the medical inventory, pharmacy dispensing workflow, and hospital administration. It streamlines the entire process from a doctor/admin requesting medication to the pharmacy staff dispensing it, all while maintaining real-time stock integrity and an extensive audit trail.

---

## 🚀 Tech Stack & Architecture

The application is built using a modern, scalable, and type-safe architecture:

### Frontend
* **Framework:** React 19 + TypeScript + Vite (Lightning fast HMR & builds)
* **Styling:** Tailwind CSS 4.x (Utility-first, responsive, and custom themes)
* **UI/UX & Icons:** Lucide React (Clean vector icons), Framer Motion (Micro-animations)
* **State Management:** React Context API + Custom Hooks
* **HTTP Client:** Axios (Interceptors for JWT token refresh handling)
* **Utilities:** `xlsx` (Excel import/export), `html2pdf.js` (PDF invoice generation)
* **Testing:** Playwright (End-to-End browser testing), Vitest + React Testing Library (Component tests)

### Backend
* **Framework:** Node.js + Express.js + TypeScript
* **Database ORM:** Prisma ORM
* **Database Engine:** PostgreSQL (Containerized via Docker)
* **Authentication:** JSON Web Tokens (JWT) with secure HTTP-only cookies, robust Refresh Token rotation, and bcrypt password hashing.
* **Security:** Helmet, CORS, Express Rate Limit, Input Sanitization
* **Testing:** Vitest + Supertest (API integration tests)

---

## 📂 Project Structure

```text
medicare-system/
├── backend/                  # Node.js / Express API Server
│   ├── prisma/               # Database schema & migrations (schema.prisma)
│   └── src/
│       ├── middleware/       # JWT Auth verification & Error handling
│       ├── routes/           # API Endpoints (auth, medicines, prescriptions, etc.)
│       └── index.ts          # Server entry point
├── src/                      # React Frontend Application
│   ├── components/           # UI Views (AdminDashboard, MedicineManagement, etc.)
│   ├── context/              # Global State (StateContext.tsx)
│   ├── types/                # TypeScript Interfaces
│   └── App.tsx               # Main routing and layout
├── tests/                    # Playwright E-2-E Tests (login, inventory, prescriptions)
├── public/                   # Static Assets
├── package.json              # Workspace & Frontend Dependencies
└── playwright.config.ts      # End-to-End testing configuration
```

---

## ✨ Core Features & Workflows

### 👥 User Roles & Access Control
* **Admin (System Administrator):** Full access to medicine catalogs, stock management, request generation, staff management, financial ledgers, and system settings.
* **Staff (Pharmacy Dispenser):** Streamlined dashboard dedicated exclusively to verifying prescription tokens and dispensing medication securely.

### 📦 Medicine Catalog & Inventory
* **Real-time Stock Overview:** Visual indicators for healthy, low, and critical stock levels.
* **Dynamic Alerts:** Configurable low-stock thresholds that trigger dashboard notifications.
* **Bulk Import:** Seamlessly import supplier invoices and catalog data via Excel (`.xlsx` / `.xls`) with automatic data mapping and deduplication.

### 📝 Prescription & Dispensing Workflow
1. **Request Generation:** Admin/Doctor creates a new medicine request, adding patients and required drugs. Real-time stock availability is checked during drafting.
2. **Tokenization:** Upon submission, a unique cryptographic token (e.g., `REQ-2026-001`) and invoice are generated.
3. **Fulfillment (Staff Dashboard):** Staff enters or scans the token, previews the exact stock impact (Before vs. After), and confirms the dispense. Stock is instantly decremented.

### 📊 Auditing, Reports & Financials
* **History Log:** Immutable system audit trail tracking imports, stock adjustments, requests, and settings changes.
* **Income Ledger:** Track consultation fees and medicine sales.
* **Reports:** Generate printable PDF summaries for stock and financials.

---

## 🗄️ Database Schema Overview (Prisma)

* `User` / `RefreshToken`: Manages role-based access control and secure sessions.
* `Medicine`: Core inventory table tracking `medicineId`, `qty`, `price`, `supplier`, `expiry`, and `minThreshold`.
* `Prescription`: Tracks the lifecycle of a patient request (`Pending`, `Completed`), storing requested items as a JSON payload.
* `HistoryLog`: System-wide audit trail with categorized events.
* `PharmacySettings`: Global application configurations (currency, thresholds, timezone).

---

## 🔌 API Endpoints

The Express backend exposes RESTful routes under `/api/*`:

* `/api/auth`: Login, Logout, Session validation, Token Refresh.
* `/api/medicines`: CRUD operations for the catalog, bulk import logic, and low-stock queries.
* `/api/prescriptions`: Request creation, token lookup for staff, and dispensing/status updates.
* `/api/stock` & `/api/history`: Real-time adjustment tracking and audit logs.
* `/api/settings` & `/api/reports`: System configuration and analytical data aggregation.

---

## 🛠️ Setup & Installation Instructions

### Prerequisites
* Node.js (v18 or higher)
* Docker Desktop (for PostgreSQL database)

### 1. Install Dependencies
Run the following from the root directory to install frontend and backend dependencies:
```bash
npm install
cd backend && npm install
cd ..
```

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medicare?schema=public"
JWT_SECRET="your_super_secret_jwt_key_change_in_production"
JWT_REFRESH_SECRET="your_super_secret_refresh_key_change_in_production"
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Initialization
Spin up the PostgreSQL container and run migrations/seeds:
```bash
npm run db:up      # Starts Docker compose in background
npm run db:setup   # Runs Prisma migrations and seeds the default Admin user
```
*(Default Login after seed - Username: `admin`, Password: `admin123`)*

### 4. Start Development Servers
Start both the Frontend and Backend concurrently (or in separate terminals):
```bash
# Terminal 1 (Backend - Port 5000)
npm run dev:backend

# Terminal 2 (Frontend - Port 3000)
npm run dev
```

---

## 🧪 Testing

The project is heavily tested to ensure reliability.

### End-to-End (E2E) Testing with Playwright
Playwright is configured to automatically spin up the development servers and run tests synchronously to avoid backend race conditions.
```bash
npx playwright test
```
*Tests cover: Authentication flows, UI snapshots, Stock management workflows, and Prescription generation.*

### Unit & Integration Testing with Vitest
Backend endpoints and utilities are tested using Vitest and Supertest.
```bash
cd backend
npm run test
```

---
*Built with ❤️ for modern healthcare administration.*
