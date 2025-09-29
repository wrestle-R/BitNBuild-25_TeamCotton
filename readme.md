<div align="center">

# NourishNet

[![Food Delivery](https://img.shields.io/badge/Food%20Delivery-Platform-ff6b6b?style=for-the-badge&logo=deliveroo)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)
[![Hackathon](https://img.shields.io/badge/BitNBuild-2025-4ecdc4?style=for-the-badge&logo=trophy)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)
[![Team Cotton](https://img.shields.io/badge/Team-Cotton-95e1d3?style=for-the-badge&logo=team)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)

![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg?style=flat-square)

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

## ![Overview](https://img.shields.io/badge/Project-Overview-FF6B6B?style=flat-square&logo=info-circle) Overview

**NourishNet** is a comprehensive food delivery and meal subscription platform that connects customers with local vendors while providing efficient delivery management. The platform features a multi-tiered architecture with dedicated applications for customers, vendors, drivers, and administrators.

### ![Features](https://img.shields.io/badge/Key-Features-4ECDC4?style=flat-square&logo=star) Key Features

- ![Customer](https://img.shields.io/badge/Customer-Experience-FF9F43?style=flat-square&logo=user) **Browse vendors, view meal plans, subscribe to services, and track deliveries**
- ![Vendor](https://img.shields.io/badge/Vendor-Management-6C5CE7?style=flat-square&logo=store) **Manage menus, plans, orders, and business analytics**
- ![Driver](https://img.shields.io/badge/Driver-Operations-00B894?style=flat-square&logo=truck) **Real-time delivery tracking, route optimization, and earnings management**
- ![Admin](https://img.shields.io/badge/Admin-Dashboard-E17055?style=flat-square&logo=dashboard) **Platform oversight, user management, and analytics**
- ![Payments](https://img.shields.io/badge/Secure-Payments-00CEC9?style=flat-square&logo=credit-card) **Integrated Razorpay payment processing**
- ![Tracking](https://img.shields.io/badge/Live-Tracking-A29BFE?style=flat-square&logo=map-marker) **Real-time location services and delivery updates**
- ![Notifications](https://img.shields.io/badge/Push-Notifications-FD79A8?style=flat-square&logo=bell) **Expo-powered notifications for order updates**

## ![Architecture](https://img.shields.io/badge/System-Architecture-2D3436?style=flat-square&logo=sitemap) Architecture

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

## ![Quick Start](https://img.shields.io/badge/Quick-Start-FF6B6B?style=flat-square&logo=rocket) Quick Start

### ![Prerequisites](https://img.shields.io/badge/Prerequisites-Required-orange?style=flat-square&logo=checklist) Prerequisites

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white) Node.js (v18 or higher)  
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20or%20Local-47A248?style=flat-square&logo=mongodb&logoColor=white) MongoDB (local or MongoDB Atlas)  
![Expo CLI](https://img.shields.io/badge/Expo-CLI-000020?style=flat-square&logo=expo&logoColor=white) Expo CLI (`npm install -g @expo/cli`)  
![Firebase](https://img.shields.io/badge/Firebase-Authentication-FFCA28?style=flat-square&logo=firebase&logoColor=black) Firebase Project with Authentication enabled  
![Razorpay](https://img.shields.io/badge/Razorpay-Account-3395FF?style=flat-square&logo=razorpay&logoColor=white) Razorpay Account (for payments)  
![Cloudinary](https://img.shields.io/badge/Cloudinary-Account-3448C5?style=flat-square&logo=cloudinary&logoColor=white) Cloudinary Account (for image uploads)

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

## ![Application Features](https://img.shields.io/badge/Application-Features-4ECDC4?style=flat-square&logo=mobile) Application Features

### ![Customer App](https://img.shields.io/badge/Customer-App-FF9F43?style=for-the-badge&logo=user) Customer App (`userApp/`)
- ![Auth](https://img.shields.io/badge/Authentication-Sign%20up%2Flogin%20with%20email%20or%20Google-blue?style=flat-square&logo=google)
- ![Discovery](https://img.shields.io/badge/Vendor%20Discovery-Browse%20local%20food%20vendors%20by%20location-green?style=flat-square&logo=map-marker)
- ![Menu](https://img.shields.io/badge/Menu%20Browsing-View%20detailed%20menus%20and%20meal%20plans-orange?style=flat-square&logo=restaurant)
- ![Subscription](https://img.shields.io/badge/Subscription-Subscribe%20to%20weekly%2Fmonthly%20meal%20plans-purple?style=flat-square&logo=calendar)
- ![Tracking](https://img.shields.io/badge/Order%20Tracking-Real--time%20delivery%20tracking%20with%20maps-red?style=flat-square&logo=truck)
- ![Payment](https://img.shields.io/badge/Payment-Secure%20payments%20via%20Razorpay-teal?style=flat-square&logo=credit-card)
- ![Notifications](https://img.shields.io/badge/Notifications-Order%20updates%20and%20delivery%20notifications-pink?style=flat-square&logo=bell)

### ![Driver App](https://img.shields.io/badge/Driver-App-00B894?style=for-the-badge&logo=truck) Driver App (`driverApp/`)
- ![Registration](https://img.shields.io/badge/Driver%20Registration-Complete%20profile%20setup%20with%20vehicle%20details-blue?style=flat-square&logo=id-card)
- ![Management](https://img.shields.io/badge/Delivery%20Management-Accept%2Freject%20delivery%20requests-green?style=flat-square&logo=clipboard-check)
- ![Optimization](https://img.shields.io/badge/Route%20Optimization-GPS%20navigation%20and%20optimal%20route%20suggestions-orange?style=flat-square&logo=route)
- ![Location](https://img.shields.io/badge/Live%20Location-Real--time%20location%20sharing%20with%20customers-purple?style=flat-square&logo=map)
- ![Earnings](https://img.shields.io/badge/Earnings%20Tracking-View%20daily%2Fweekly%20earnings%20and%20statistics-red?style=flat-square&logo=chart-line)
- ![Status](https://img.shields.io/badge/Status%20Management-Toggle%20availability%20for%20deliveries-teal?style=flat-square&logo=toggle-on)

### ![Admin Dashboard](https://img.shields.io/badge/Admin-Dashboard-E17055?style=for-the-badge&logo=dashboard) Admin Dashboard (`frontend/`)
- ![User Management](https://img.shields.io/badge/User%20Management-Manage%20customers%2C%20vendors%2C%20and%20drivers-blue?style=flat-square&logo=users)
- ![Analytics](https://img.shields.io/badge/Analytics%20Dashboard-Revenue%2C%20orders%2C%20and%20performance%20metrics-green?style=flat-square&logo=chart-bar)
- ![Oversight](https://img.shields.io/badge/Vendor%20Oversight-Approve%20vendor%20registrations%20and%20monitor%20activity-orange?style=flat-square&logo=eye)
- ![Orders](https://img.shields.io/badge/Order%20Management-View%20and%20manage%20all%20platform%20orders-purple?style=flat-square&logo=list)
- ![Payments](https://img.shields.io/badge/Payment%20Tracking-Monitor%20transactions%20and%20payouts-red?style=flat-square&logo=money-bill)
- ![Configuration](https://img.shields.io/badge/System%20Configuration-Manage%20platform%20settings%20and%20policies-teal?style=flat-square&logo=cog)

## ![API Documentation](https://img.shields.io/badge/API-Documentation-2D3436?style=flat-square&logo=swagger) API Documentation

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

## ![Configuration](https://img.shields.io/badge/System-Configuration-6C5CE7?style=flat-square&logo=cog) Configuration

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

## ![Deployment](https://img.shields.io/badge/Cloud-Deployment-FF6B6B?style=flat-square&logo=cloud) Deployment

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

## ![Testing](https://img.shields.io/badge/Quality-Testing-4ECDC4?style=flat-square&logo=test-tube) Testing

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

## ![Contributing](https://img.shields.io/badge/Community-Contributing-95E1D3?style=flat-square&logo=handshake) Contributing

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

## ![License](https://img.shields.io/badge/Legal-License-blue?style=flat-square&logo=balance-scale) License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ![Support](https://img.shields.io/badge/Help%20%26-Support-FF6B6B?style=flat-square&logo=support) Support

For support and queries, please reach out to:

<div align="center">

[![Email](https://img.shields.io/badge/Email-teamcotton%40bnb2025.com-red?style=for-the-badge&logo=gmail&logoColor=white)](mailto:teamcotton@bnb2025.com)
[![Issues](https://img.shields.io/badge/GitHub-Issues-black?style=for-the-badge&logo=github&logoColor=white)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton/issues)
[![Wiki](https://img.shields.io/badge/Project-Wiki-blue?style=for-the-badge&logo=wikipedia&logoColor=white)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton/wiki)

</div>

## ![Acknowledgments](https://img.shields.io/badge/Special-Acknowledgments-FD79A8?style=flat-square&logo=heart) Acknowledgments

<div align="center">

![BitNBuild](https://img.shields.io/badge/BitNBuild%202025-Opportunity%20to%20Innovate-4ECDC4?style=flat-square&logo=trophy)
![Firebase](https://img.shields.io/badge/Firebase-Authentication%20Services-FFCA28?style=flat-square&logo=firebase)
![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Processing-3395FF?style=flat-square&logo=razorpay)
![Expo](https://img.shields.io/badge/Expo-React%20Native%20Development-000020?style=flat-square&logo=expo)
![MongoDB](https://img.shields.io/badge/MongoDB%20Atlas-Cloud%20Database-47A248?style=flat-square&logo=mongodb)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image%20Management-3448C5?style=flat-square&logo=cloudinary)

</div>

---

<div align="center">

**Built with 💙 by Team Cotton for BitNBuild 2025**

[![Team Cotton](https://img.shields.io/badge/Made%20by-Team%20Cotton-95E1D3?style=for-the-badge&logo=team)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)

</div>

## ![Team Cotton](https://img.shields.io/badge/Meet-Team%20Cotton-95E1D3?style=flat-square&logo=users) Team Cotton

<div align="center">

| ![Developer](https://img.shields.io/badge/Full%20Stack-Developer-blue?style=flat-square&logo=code) | ![Developer](https://img.shields.io/badge/Backend-Developer-green?style=flat-square&logo=server) | ![Developer](https://img.shields.io/badge/Full%20Stack-Developer-purple?style=flat-square&logo=react) | ![Developer](https://img.shields.io/badge/Mobile-Developer-orange?style=flat-square&logo=mobile) |
|:---:|:---:|:---:|:---:|
| **[Gavin Soares](https://github.com/gavin100305)** | **[Romeiro Fernandes](https://github.com/romeirofernandes)** | **[Russel Daniel Paul](https://github.com/wrestle-R)** | **[Aditya Dabreo](https://github.com/Adityadab10)** |
| [![GitHub](https://img.shields.io/badge/GitHub-gavin100305-black?style=flat-square&logo=github)](https://github.com/gavin100305) | [![GitHub](https://img.shields.io/badge/GitHub-romeirofernandes-black?style=flat-square&logo=github)](https://github.com/romeirofernandes) | [![GitHub](https://img.shields.io/badge/GitHub-wrestle--R-black?style=flat-square&logo=github)](https://github.com/wrestle-R) | [![GitHub](https://img.shields.io/badge/GitHub-Adityadab10-black?style=flat-square&logo=github)](https://github.com/Adityadab10) |

</div>

<div align="center">

---

![GitHub Stars](https://img.shields.io/github/stars/wrestle-R/BitNBuild-25_TeamCotton?style=social)
![GitHub Forks](https://img.shields.io/github/forks/wrestle-R/BitNBuild-25_TeamCotton?style=social)
![GitHub Watchers](https://img.shields.io/github/watchers/wrestle-R/BitNBuild-25_TeamCotton?style=social)

[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)
[![Hackathon 2025](https://img.shields.io/badge/Hackathon-BitNBuild%202025-4ECDC4.svg)](https://github.com/wrestle-R/BitNBuild-25_TeamCotton)

</div>
