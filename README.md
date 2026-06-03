# Teaching Portal

A lightweight, secure, and modular web application designed for educators to log teaching hours, manage payments, and organize external resource links. Built with a strict **Decoupled Modular Architecture**, this project utilizes native ES modules on the frontend and serverless edge computing on the backend.

## 🏗️ Architecture & Tech Stack

This project strictly adheres to a zero-build-step philosophy.

*   **Frontend:** Vanilla JavaScript (ES Modules), HTML5, CSS3, Tailwind CSS (via CDN), FontAwesome. Hosted on **Cloudflare Pages**.
*   **Backend:** **Cloudflare Workers** (Edge computing API).
*   **Database:** **Cloudflare D1** (Serverless SQLite).

## ✨ Features

*   **🔐 Secure Authentication:** Basic username/password login system.
*   **⏱️ Batch Session Generator:** Quickly log multiple teaching sessions across different universities and colleges. Automatically calculates total earnings based on a standard hourly rate.
*   **📊 Payment Ledger:** View and filter teaching records by "Rendered" or "Paid" status. Generate summaries and mark unpaid hours as paid.
*   **🔗 Resource Manager:** Organize external links into dynamic category tabs. Includes full CRUD functionality with a "soft delete" safety measure to prevent accidental data loss.
*   **👤 Profile Settings:** Update display name, password, and profile avatar.

## 📁 Project Structure

\`\`\`text
├── index.html              # Main entry point and layout shell
├── styles.css              # Custom styles (scrollbar hiding, view transitions)
├── js/                     # Decoupled ES Modules
│   ├── app.js              # Application bootstrapper and state manager
│   ├── auth.js             # Login and session handling
│   ├── components.js       # UI template injection (modals, views, overlays)
│   ├── globals.js          # Centralized configuration and API routing
│   ├── hours-logger.js     # Logic for the Batch Session Generator
│   ├── payment-ledger.js   # Logic for data tables, filtering, and payment states
│   ├── profile.js          # Logic for user profile updates
│   ├── records-viewer.js   # Logic for viewing historical data
│   ├── resources.js        # Logic for resource link tabs, adding, editing, and deleting
│   └── router.js           # Vanilla JS SPA navigation router
└── worker/
    └── worker.js           # Cloudflare Worker API Controller
\`\`\`

## 🚀 Setup & Deployment

### 1. Database Setup (Cloudflare D1)

Create a new D1 database via the Cloudflare Dashboard or Wrangler CLI. You must execute the following SQL schema to create the necessary tables. 

*(Note: The `Resource_Links` table includes the newly added `Is_Deleted` column for soft deletions).*

\`\`\`sql
-- Create Users Table
CREATE TABLE Users (
    User_ID TEXT PRIMARY KEY,
    Username TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    Name TEXT,
    Avatar TEXT
);

-- Insert Default User (Update credentials after first login)
INSERT INTO Users (User_ID, Username, Password, Name, Avatar) 
VALUES ('user-1', 'admin', 'password123', 'Professor', '');

-- Create Teaching Hours Table
CREATE TABLE Teaching_Hours (
    Entry_ID TEXT PRIMARY KEY,
    Date TEXT,
    Start_Time TEXT,
    End_Time TEXT,
    Total_Hours REAL,
    University TEXT,
    College TEXT,
    Subject_Code TEXT,
    Payment_Status TEXT,
    Date_Paid TEXT,
    Total_Earnings REAL
);

-- Create Resource Links Table
CREATE TABLE Resource_Links (
    Resource_ID TEXT PRIMARY KEY,
    Category TEXT,
    Title TEXT,
    URL TEXT,
    Is_Deleted INTEGER DEFAULT 0
);
\`\`\`

### 2. Backend Deployment (Cloudflare Workers)

1. Create a new Cloudflare Worker.
2. Copy the contents of `worker/worker.js` into your worker.
3. Bind your D1 database to the worker with the variable name `DB`.
4. Add an Environment Variable named `ALLOWED_ORIGIN` and set it to your frontend URL (e.g., `https://your-frontend.pages.dev`) for strict CORS enforcement.

### 3. Frontend Deployment (Cloudflare Pages)

1. Update the `CONFIG.API_BASE` in `js/globals.js` to point to your newly deployed Cloudflare Worker URL.
2. Ensure `js/globals.js` includes all endpoint paths:
   \`\`\`javascript
   export const CONFIG = {
       API_BASE: 'https://your-worker-url.workers.dev',
       ENDPOINTS: {
           GET_DATA: '/api/data',
           ACTION: '/api/action'
       }
   };
   \`\`\`
3. Deploy the project folder directly to Cloudflare Pages (Direct Upload or via GitHub integration). **Leave the build command blank.**

## 🛠️ Development Directives

*   **No Build Tools:** Do not introduce Webpack, Vite, or npm scripts.
*   **Native ES Modules:** Maintain standard browser imports/exports.
*   **CORS Enforcement:** The backend must explicitly validate the `ALLOWED_ORIGIN`.
