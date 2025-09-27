# NourishNet - Tiffin Service Platform

[![Node.js](https://img.shields.io/badge/Node.js-16+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-blue)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18+-blueviolet)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-brightgreen)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange)](https://firebase.google.com/)

> **🍽️ Dual User System**: NourishNet is a comprehensive SaaS platform that digitizes tiffin services supporting **two distinct user types** - **Vendors** 🏪 and **Customers** 🛒. Each user type has unique dashboards, features, and management systems while sharing the same secure authentication infrastructure.

## 🍽️ System Overview

The dual user system allows users to choose their role in the tiffin ecosystem:
- **Vendors** manage subscribers, menu items, delivery areas with business analytics
- **Customers** browse vendors, manage subscriptions, track orders with real-time updates
- Both types share secure Firebase authentication with separate MongoDB collections
- AI-powered route optimization for efficient deliveries
- Real-time order tracking and flexible subscription management

A fullstack tiffin service platform using **Firebase Auth**, **Express.js**, **MongoDB**, and **React** with comprehensive business management features.

---

## 🚀 Workflow

1. **Choose Role** → Select Vendor 🏪 or Customer 🛒 user type
2. **Register/Login** → Firebase Authentication with type validation
3. **Sync** → Backend stores user in appropriate MongoDB collection
4. **JWT** → Issued for secure API calls with role-based access
5. **Frontend** → Context manages auth state + type-specific protected routes

## 🎯 Dual User System Features

### 🏪 Vendor System
- **Subscriber Management**: Track and manage active tiffin subscribers
- **Menu Management**: Create and update daily menu items and offerings
- **Delivery Areas**: Define and manage service coverage areas
- **Analytics Dashboard**: Track sales, subscriber growth, and performance metrics
- **Vendor Tiers**: Progress from Starter → Growing → Established → Premium → Enterprise

### 🛒 Customer System  
- **Vendor Discovery**: Browse and search local tiffin service providers
- **Subscription Management**: Subscribe to multiple vendors with flexible plans
- **Order Tracking**: Real-time tracking of current orders and deliveries
- **Favorite Vendors**: Save and manage preferred tiffin services
- **Customer Levels**: Progress from New → Regular → Loyal → Premium → VIP

### 🔒 Cross-Type Protection
- Users cannot create accounts as both Vendors and Customers
- Role-based dashboard routing and access control
- Separate MongoDB collections for each user type
- Type-specific business features and customer management

---

## 🛡 Security

* JWT with expiration  
* Firebase token verification in backend  
* Protected routes in frontend  
* Graceful error handling  

---

## ▶️ Quick Start

### Backend Setup

1. Create a `.env` file in `backend/`:

```env
MONGO_URL=your-mongo-url
JWT_SECRET=nourishnet_secret_key_2024_secure_token
PORT=5000
```

2. Install dependencies and start the backend:

```bash
cd backend
npm install
npm start
```

### Frontend Setup

1. Create a `.env` file in `frontend/`:

```env
VITE_API_KEY=YOUR_API_KEY
VITE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_PROJECT_ID=YOUR_PROJECT_ID
VITE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_APP_ID=YOUR_APP_ID
VITE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
VITE_BACKEND_URL=http://localhost:5000

# Admin Panel Credentials (Frontend Only Validation)
# Default values: admin / nourishnet2024 - Change these to any values you prefer
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=nourishnet2024
```

2. Install dependencies and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## ✨ Features

* Google OAuth and Email/Password authentication
* JWT-secured API endpoints
* MongoDB integration for user persistence
* React context-based state management
* Protected frontend routes
* Graceful error handling for better user experience
* **🛡️ Admin Panel** with user management and analytics

---

## 🔐 Admin Panel

### Access the Admin Dashboard

Navigate to `/admin/auth` to access the admin panel.

**Default Credentials:**
- Username: `admin`
- Password: `nourishnet2024`

> **Note:** Admin authentication is currently frontend-only validation for demonstration purposes. The credentials are stored in environment variables and can be changed by updating `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD` in your `.env` file.

### Admin Features

- **📊 Dashboard Overview**: Real-time statistics and user activity
- **👥 User Management**: View, edit, and remove users from the system
- **🔍 Search & Filter**: Find users by name, email, or vendor tier
- **📈 Analytics**: Business metrics and platform insights
- **⚙️ Settings**: Platform configuration options

### Admin Routes

- `/admin/auth` - Admin login page
- `/admin/dashboard` - Main admin dashboard

> **Security Note:** For production use, implement proper server-side admin authentication and role-based access control.

---

## 📂 Folder Structure

```
project-root/
│
├─ backend/
│  ├─ Controllers/
│  │  └─ authControllersUnified.js
│  ├─ Models/
│  │  ├─ user1.js (Vendor users)
│  │  └─ user2.js (Customer users)
│  ├─ Routes/
│  │  └─ authRoutesUnified.js
│  ├─ .env
│  └─ server.js
│
└─ frontend/
   |─ context/
   |    └─ UserContextSimplified.jsx
   ├─ src/
   │  ├─ components/
   │  │  ├─ ui/ (Reusable UI components)
   │  │  ├─ Landing/ (Landing page sections)
   │  │  ├─ motion-primitives/ (Animation components)
   │  │  └─ core/ (Core animation effects)
   │  ├
   │  │  
   │  ├─ pages/
   │  │  ├─ Auth.jsx (Login/Register with user type selection)
   │  │  ├─ Dashboard.jsx (General dashboard)
   │  │  ├─ User1/ (Vendor-specific pages)
   │  │  ├─ User2/ (Customer-specific pages)
   │  │  └─ Admin/ (Admin panel)
   │  └─ App.jsx
   └─ .env
```

## 🍽️ About NourishNet

NourishNet addresses the challenges faced by India's tiffin service industry by providing:

- **Digital Transformation**: Moving from manual processes to modern digital workflows
- **Route Optimization**: AI-powered delivery route planning to reduce costs and delays  
- **Customer Experience**: Real-time tracking, flexible subscriptions, and easy payments
- **Business Analytics**: Data-driven insights for vendors to grow their business
- **Scalability**: Supporting tiffin services from startup to enterprise level

The platform serves as a bridge between traditional home-cooked meal providers and modern urban customers who value convenience and quality.