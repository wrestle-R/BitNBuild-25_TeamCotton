# NourishNet 🍽️

**Team Cotton** - BitNBuild 2025 Hackathon Project

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green.svg)](https://mongodb.com/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-orange.svg)](https://firebase.google.com/)

## 🌟 Overview

**NourishNet** is a comprehensive food delivery and meal subscription platform that connects customers with local vendors while providing efficient delivery management. The platform features a multi-tiered architecture with dedicated applications for customers, vendors, drivers, and administrators.

### 🎯 Key Features

- **🛍️ Customer Experience**: Browse vendors, view meal plans, subscribe to services, and track deliveries
- **🏪 Vendor Management**: Manage menus, plans, orders, and business analytics
- **🚗 Driver Operations**: Real-time delivery tracking, route optimization, and earnings management
- **👨‍💼 Admin Dashboard**: Platform oversight, user management, and analytics
- **💳 Secure Payments**: Integrated Razorpay payment processing
- **📍 Live Tracking**: Real-time location services and delivery updates
- **🔔 Push Notifications**: Expo-powered notifications for order updates

## 🏗️ Architecture

The platform follows a microservices architecture with four main components:

```
NourishNet/
├── 🖥️  frontend/          # Admin Web Dashboard (React + Vite)
├── 📱  userApp/           # Customer Mobile App (React Native + Expo)
├── 🚛  driverApp/         # Driver Mobile App (React Native + Expo)
└── ⚙️  backend/           # API Server (Node.js + Express + MongoDB)
```

### Technology Stack

#### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK + JWT
- **Payments**: Razorpay Integration
- **File Upload**: Cloudinary
- **Push Notifications**: Expo Server SDK

#### Frontend (Admin Dashboard)
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

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Expo CLI (`npm install -g @expo/cli`)
- Firebase Project with Authentication enabled
- Razorpay Account (for payments)
- Cloudinary Account (for image uploads)

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

## 📱 Application Features

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

## 📊 API Documentation

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

## 🔧 Configuration

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

## 📦 Deployment

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

## 🧪 Testing

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

## 🤝 Contributing

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team Cotton

- **Project Lead**: [Team Member Name]
- **Backend Developer**: [Team Member Name]
- **Frontend Developer**: [Team Member Name]
- **Mobile Developer**: [Team Member Name]
- **UI/UX Designer**: [Team Member Name]

## 📞 Support

For support and queries, please reach out to:
- **Email**: teamcotton@bnb2025.com
- **GitHub Issues**: [Create an issue](https://github.com/wrestle-R/BitNBuild-25_TeamCotton/issues)
- **Documentation**: [Project Wiki](https://github.com/wrestle-R/BitNBuild-25_TeamCotton/wiki)

## 🙏 Acknowledgments

- **BitNBuild 2025** for the opportunity to innovate
- **Firebase** for authentication services
- **Razorpay** for payment processing
- **Expo** for simplified React Native development
- **MongoDB Atlas** for cloud database services
- **Cloudinary** for image management

---

**Built with ❤️ by Team Cotton for BitNBuild 2025**
