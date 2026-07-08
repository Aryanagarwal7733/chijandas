# Chijandas Grocery Mall 🛒

A modern, full-stack inventory management system and customer storefront built using the **MERN** stack (MongoDB, Express, React, Node.js). 

This application features a premium administrative control center with live analytics charts for revenue and stock, role-based access control, a frictionless customer checkout experience featuring automatic Indian pincode geolocation auto-fill, and dual transactional email notifications.

---

## 🎙️ 1. Project Pitch & Overview

Chijandas Grocery Mall is designed as a resilient, production-ready full-stack web application. A key highlight is the system's resilience: **I implemented a database adapter pattern that automatically falls back to local JSON file storage if the database server goes offline**, ensuring 100% uptime for critical storefront operations.

---

## 🛠️ 2. Core Tech Stack

* **Frontend**: React (Vite), CSS3, Recharts (Live Data Visualization), Lucide React (Icons), `@emailjs/browser` (Client-side transactional email triggers).
* **Backend**: Node.js, Express.js, JSON Web Tokens (JWT) for authentication, `bcryptjs` for password hashing security.
* **Database**: MongoDB (Atlas Cloud for production, Local for development) with a custom JSON database fallback layer.

---

## 🚀 3. Key Technical Features

### 🔄 Robust Dual-Database Fallback Mode
On server startup, the database manager automatically attempts a connection to MongoDB. If the DB server is offline, it gracefully falls back to a JSON-based database (`fallback_db.json`) without crashing, maintaining identical REST API endpoint structures.

### 🛡️ Role-Based Access Control (RBAC) & Security
User accounts are strictly separated into roles (`admin` vs `user`). Public registration is restricted strictly to standard customer accounts. Backend endpoints are protected using custom JWT verification middleware, and passwords are encrypted using `bcryptjs` before storage.

### 📍 Indian Pincode Auto-Fill Integration
Entering a 6-digit Pincode triggers an asynchronous call to the Indian Postal API, auto-detecting and pre-filling the customer's City and State using a custom fuzzy matching script.

### ✉️ Transactional Email Notification System (EmailJS)
Client-side triggers fire two concurrent email operations on checkout completion: a customer invoice receipt and a separate high-priority admin alert template.

---

## 📁 4. Project Directory Structure

```text
chijandas/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx            # Secure Sign In / Register
│   │   │   ├── UserDashboard.jsx    # Store Catalog & Checkout Form
│   │   │   └── AdminDashboard.jsx   # Metrics, Recharts & CRUD Modals
│   │   ├── App.jsx                  # Root Component (Session handler)
│   │   └── index.css                # Custom Emerald UI Design System
│   └── package.json
│
├── server/                 # Express Backend API
│   ├── config/
│   │   ├── db.js                    # DB Connection logic
│   │   └── dbManager.js             # Unified MongoDB / JSON DB Adapter
│   ├── middleware/
│   │   └── auth.js                  # JWT Authentication Middleware
│   ├── models/
│   │   ├── Product.js               # Mongoose Schema for Products
│   │   ├── Transaction.js           # Mongoose Schema for Transactions
│   │   └── User.js                  # Mongoose Schema for User accounts
│   ├── routes/
│   │   ├── auth.js                  # Register / Login API endpoints
│   │   └── products.js              # Catalog management & orders APIs
│   ├── services/
│   │   └── emailService.js          # Fallback Nodemailer service
│   ├── seed.js                      # DB Seeding Script
│   ├── server.js                    # API entry point
│   └── package.json
```

---

## 🚀 5. How to Run Locally

### Prerequisites
- Node.js installed.
- Local MongoDB running on `mongodb://127.0.0.1:27017` (Optional: falls back to JSON file automatically).

### Setup & Launch
1. Clone the repository:
   ```bash
   git clone https://github.com/Aryanagarwal7733/chijandas.git
   cd chijandas
   ```
2. Run the concurrent dev server command in the root folder:
   ```bash
   npm run dev
   ```
3. Open your browser to [http://localhost:5173](http://localhost:5173) and explore!

---

## 💬 6. Technical Interview Q&A

### Q1: Why did you choose MongoDB instead of a Relational Database like MySQL?
> **Answer**: *"I chose MongoDB because of its flexible document-based structure. In a grocery mall catalog, products can have highly dynamic attributes (e.g. expiration dates for food products vs warranties for kitchen utensils). Storing products as flexible documents fits this model much better than rigid SQL tables. Additionally, MongoDB Atlas provides a free, highly scalable cloud tier which made hosting the production database seamless."*

### Q2: What was the most challenging part of this project, and how did you solve it?
> **Answer**: *"The most challenging part was ensuring the backend API routes remained identical regardless of whether the system was running in MongoDB mode or fallback JSON mode. To solve this, I designed a unified `dbManager` interface that exposes standard database actions (like findOne, create, and findByIdAndUpdate). The rest of the API routes simply call dbManager, completely unaware of the underlying database type. This kept the router files extremely clean and modular."*

### Q3: How did you handle security in the authentication flow?
> **Answer**: *"On the backend, user passwords are never stored in plaintext—they are hashed using bcrypt before database insertion. For sessions, I chose JWT tokens stored in the browser's `localStorage` and sent in the Authorization header. On the API side, I created a custom middleware that validates the JWT token, fetches the user's role, and authorizes admin-only requests (like adding or deleting products) while rejecting unauthorized clients with a 403 Forbidden status."*

---

## 📈 7. Future Roadmap & Enhancements
1. **Multi-Item Shopping Cart**: Expand from single-item checkouts to a complete cart checkout system.
2. **Stripe Payment Gateway**: Integrate credit card processing alongside UPI/COD.
3. **Automated Stock Alerts**: Connect Twilio or Slack API to notify the administrator of low inventory levels.
