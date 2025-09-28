# Goals Feature Setup Guide

## Backend Setup

1. **Install Google AI Package:**
   ```bash
   cd backend
   npm install @google/generative-ai
   ```

2. **Add Environment Variable:**
   Add this to your `.env` file:
   ```
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   ```
   
   Get your API key from: https://makersuite.google.com/app/apikey

## Features Added

### ✅ Backend (Controllers & Routes)
- **goalControllers.js** - Handles all goals logic and AI analysis
- **goalRoutes.js** - API routes for goals functionality
- **server.js** - Updated to include goal routes

### ✅ Frontend 
- **CustomerGoals.jsx** - Main goals page with 3 tabs:
  - **Set Goals Tab**: Form to set nutrition targets
  - **AI Analysis Tab**: Shows nutrition score and recommendations
  - **Progress Tracking Tab**: Charts showing nutrition trends
- **CustomerSidebar.jsx** - Added "Goals" menu item
- **App.jsx** - Added route for `/customer/goals`
- **textarea.jsx** - Created missing UI component

## API Endpoints

- `POST /api/goals/set` - Set/update customer goals
- `GET /api/goals/get` - Get customer goals
- `GET /api/goals/analysis` - Get AI nutrition analysis
- `GET /api/goals/tracking` - Get nutrition tracking data

## How It Works

1. **Customer sets goals**: Daily calories, protein, carbs, fats, health goal, preferred time
2. **AI analyzes current intake**: Based on active meal subscriptions vs goals
3. **Generates insights**: Nutrition score (0-100), macro analysis, recommendations, warnings
4. **Tracks progress**: 30-day charts showing nutrition trends vs targets

## Usage Flow

1. Customer navigates to Goals from sidebar
2. Sets nutrition targets in "Set Goals" tab
3. Views AI analysis in "AI Analysis" tab (requires active subscriptions)
4. Monitors progress in "Progress Tracking" tab

## Google AI Integration

The system uses Google's Gemini Pro model to:
- Analyze nutrition alignment with goals
- Generate personalized recommendations
- Provide warnings for nutritional imbalances
- Calculate nutrition scores

## Dependencies

Make sure these are installed:
- Backend: `@google/generative-ai`
- Frontend: `recharts` (already installed)

## Notes

- Goals are linked to customer via Firebase UID
- Analysis requires active meal subscriptions
- Charts show last 30 days of nutrition data
- All nutrition data comes from Menu items in subscriptions