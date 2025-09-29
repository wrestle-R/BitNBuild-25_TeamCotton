<div align="center">

# NourishNet

[![Food Delivery](https://img.shields.io/badge/Food%20Delivery-Platform-ff6b6b?style=for-the-badge&logo=deliveroo)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)
[![Hackathon](https://img.shields.io/badge/BitNBuild-2025-4ecdc4?style=for-the-badge&logo=trophy)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)
[![Team Cotton](https://img.shields.io/badge/Team-Cotton-95e1d3?style=for-the-badge&logo=team)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)

</div>

---

## Technology Stack

<div align="center">

![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![React Native](https://img.shields.io/badge/React_Native-0.81.4-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-3395FF?style=for-the-badge&logo=razorpay&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

##  Overview

**NourishNet** is a comprehensive food delivery and meal subscription platform that connects customers with local vendors while providing efficient delivery management. The platform features a multi-tiered architecture with dedicated applications for customers, vendors, drivers, and administrators.

### Key Features

- **Browse vendors, view meal plans, subscribe to services, and track deliveries**
- **Manage menus, plans, orders, and business analytics**
- **Real-time delivery tracking, route optimization, and earnings management**
- **Platform oversight, user management, and analytics**
- **Integrated Razorpay payment processing**
- **Real-time location services and delivery updates**
- **Expo-powered notifications for order updates**

## Architecture

The platform follows a microservices architecture with four main components:

```
NourishNet/
├── � frontend/          # Admin Web Dashboard (React + Vite)
├── 📱 userApp/           # Customer Mobile App (React Native + Expo)
├── 🚛 driverApp/         # Driver Mobile App (React Native + Expo)
└── ⚙️ backend/           # API Server (Node.js + Express + MongoDB)
```

<div align="center">

![Frontend](https://img.shields.io/badge/Frontend-React%20+%20Vite-61DAFB?style=for-the-badge&logo=react)
![Mobile](https://img.shields.io/badge/Mobile-React%20Native%20+%20Expo-000020?style=for-the-badge&logo=expo)
![Backend](https://img.shields.io/badge/Backend-Node.js%20+%20Express-339933?style=for-the-badge&logo=node.js)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)

</div>

### Technology Stack

#### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK + JWT
- **Payments**: Razorpay Integration
- **File Upload**: Cloudinary
- **Push Notifications**: Expo Server SDK

#### Frontend
- **Framework**: React 19.1.0 + Vite
- **Styling**: TailwindCSS + Radix UI Components
- **State Management**: React Context API
- **Maps**: Leaflet + React Leaflet
- **Charts**: Recharts
- **Animations**: Framer Motion

#### Mobile Applications
- **Framework**: React Native 0.81.4 + Expo 54
- **Navigation**: Expo Router
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Maps**: React Native Maps + Directions
- **Authentication**: Firebase SDK
- **Payments**: React Native Razorpay
- **Location Services**: Expo Location

## Quick Start

### Prerequisites

Node.js (v18 or higher)  
MongoDB (local or MongoDB Atlas)  
Expo CLI (`npm install -g @expo/cli`)  
Firebase Project with Authentication enabled  
Razorpay Account (for payments)  
Cloudinary Account (for image uploads)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/wrestle-R/BitNBuild-25_TeamCotton.git
   cd BitNBuild-25_TeamCotton
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   echo "
   PORT=8000
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   " > .env
   
   # Start the server
   npm run dev
   ```

3. **Frontend (Admin Dashboard) Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Create .env file
   echo "
   VITE_API_KEY=your_firebase_api_key
   VITE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_PROJECT_ID=your_firebase_project_id
   VITE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_APP_ID=your_firebase_app_id
   VITE_MEASUREMENT_ID=your_firebase_measurement_id
   " > .env
   
   # Start the development server
   npm run dev
   ```

4. **User Mobile App Setup**
   ```bash
   cd ../userApp
   npm install
   
   # Configure Firebase (update firebase.config.js with your credentials)
   # Start Expo development server
   npx expo start
   ```

5. **Driver Mobile App Setup**
   ```bash
   cd ../driverApp
   npm install
   
   # Configure Firebase (update firebase.config.js with your credentials)
   # Start Expo development server
   npx expo start
   ```

## Application Features

### Customer App (`userApp/`)
- **Authentication**: Sign up/login with email or Google
- **Vendor Discovery**: Browse local food vendors by location
- **Menu Browsing**: View detailed menus and meal plans
- **Subscription Management**: Subscribe to weekly/monthly meal plans
- **Order Tracking**: Real-time delivery tracking with maps
- **Payment Integration**: Secure payments via Razorpay
- **Notifications**: Order updates and delivery notifications


### Driver App (`driverApp/`)
- **Driver Registration**: Complete profile setup with vehicle details
- **Delivery Management**: Accept/reject delivery requests
- **Route Optimization**: GPS navigation and optimal route suggestions
- **Live Location**: Real-time location sharing with customers
- **Earnings Tracking**: View daily/weekly earnings and statistics
- **Status Management**: Toggle availability for deliveries

### Admin Dashboard (`frontend/`)
- **User Management**: Manage customers, vendors, and drivers
- **Analytics Dashboard**: Revenue, orders, and performance metrics
- **Vendor Oversight**: Approve vendor registrations and monitor activity
- **Order Management**: View and manage all platform orders
- **Payment Tracking**: Monitor transactions and payouts
- **System Configuration**: Manage platform settings and policies


## API Documentation

The backend provides RESTful APIs for all platform operations:

### Authentication Endpoints
```
POST /api/auth/register           # User registration
POST /api/auth/login             # User login
POST /api/auth/verify-token      # Token validation
```

### Vendor Endpoints
```
GET  /api/vendor/vendors         # Get all vendors
POST /api/vendor/register        # Vendor registration
GET  /api/vendor/:id             # Get vendor details
PUT  /api/vendor/:id             # Update vendor
```

### Customer Endpoints
```
GET  /api/customer/profile       # Get customer profile
PUT  /api/customer/profile       # Update customer profile
POST /api/customer/subscription  # Create subscription
GET  /api/customer/orders        # Get order history
```

### Driver Endpoints
```
POST /api/drivers/register       # Driver registration
GET  /api/drivers/deliveries     # Get assigned deliveries
PUT  /api/drivers/status         # Update delivery status
POST /api/drivers/location       # Update location
```

### Payment Endpoints
```
POST /api/payment/create-order   # Create Razorpay order
POST /api/payment/verify         # Verify payment
GET  /api/payment/history        # Payment history
```

##  Configuration

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password and Google providers
3. Generate service account key for backend
4. Add Firebase configuration to all applications

### Razorpay Setup
1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get API keys from the dashboard
3. Add keys to backend environment variables
4. Configure webhook endpoints for payment verification

### MongoDB Setup
1. Create MongoDB Atlas cluster or use local MongoDB
2. Create database and collections for the application
3. Add connection string to backend environment

##  Deployment

### Backend Deployment (Railway/Heroku/Render)
```bash
# Build and deploy backend
cd backend
npm run build
# Deploy to your preferred platform
```

### Frontend Deployment (Vercel/Netlify)
```bash
# Build and deploy admin dashboard
cd frontend
npm run build
# Deploy build folder to your preferred platform
```

### Mobile App Deployment
```bash
# Build Android APK
cd userApp
npx expo build:android

# Build iOS IPA
npx expo build:ios

# Or use EAS Build for managed workflow
npx eas build --platform all
```

## Testing

### Backend Testing
```bash
cd backend
npm test                    # Run unit tests
npm run test:integration   # Run integration tests
```

### Frontend Testing
```bash
cd frontend
npm run test               # Run component tests
npm run test:e2e          # Run end-to-end tests
```

### Mobile Testing
```bash
cd userApp
npx expo test             # Run mobile app tests
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration for code style
- Write unit tests for new features
- Update documentation for API changes
- Use conventional commit messages

## Support

For support and queries, please reach out to:

<div align="center">

[![Email](https://img.shields.io/badge/Email-teamcotton%40bnb2025.com-red?style=for-the-badge&logo=gmail&logoColor=white)](mailto:teamcotton@bnb2025.com)
[![Issues](https://img.shields.io/badge/GitHub-Issues-black?style=for-the-badge&logo=github&logoColor=white)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton/issues)
[![Wiki](https://img.shields.io/badge/Project-Wiki-blue?style=for-the-badge&logo=wikipedia&logoColor=white)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton/wiki)

</div>

## Acknowledgments

<div align="center">

![BitNBuild](https://img.shields.io/badge/BitNBuild%202025-Opportunity%20to%20Innovate-4ECDC4?style=flat-square&logo=trophy)
![Firebase](https://img.shields.io/badge/Firebase-Authentication%20Services-FFCA28?style=flat-square&logo=firebase)
![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Processing-3395FF?style=flat-square&logo=razorpay)
![Expo](https://img.shields.io/badge/Expo-React%20Native%20Development-000020?style=flat-square&logo=expo)
![MongoDB](https://img.shields.io/badge/MongoDB%20Atlas-Cloud%20Database-47A248?style=flat-square&logo=mongodb)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image%20Management-3448C5?style=flat-square&logo=cloudinary)

</div>

---

## 👥 Team Cotton
**Built with ❤️ by Team Cotton for BitNBuild 2025**
**Team Members:**
- **Gavin Soares** - [GitHub](https://github.com/gavin100305)
- **Romeiro Fernandes** - [GitHub](https://github.com/romeirofernandes)
- **Russel Daniel Paul** - [GitHub](https://github.com/wrestle-R)
- **Aditya Dabreo** - [GitHub](https://github.com/Adityadab10)


<div align="center">

---

![GitHub Stars](https://img.shields.io/github/stars/wrestle-R/BitNBuild-25_TeamCotton?style=social&cacheSeconds=60)
![GitHub Forks](https://img.shields.io/github/forks/wrestle-R/BitNBuild-25_TeamCotton?style=social)

[![Hackathon 2025](https://img.shields.io/badge/Hackathon-BitNBuild%202025-4ECDC4.svg)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)

</div>
