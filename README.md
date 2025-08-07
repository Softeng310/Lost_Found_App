# Lost & Found App

A full-stack web application for managing lost and found items using React frontend, Express backend, and Firebase Firestore database.

## 🚀 Features

- **Frontend**: React with Vite, Tailwind CSS
- **Backend**: Express.js server with ES modules
- **Database**: Firebase Firestore for real-time data
- **CRUD Operations**: Create, Read, Update, Delete lost/found items
- **Search & Filter**: Search by keywords, filter by type (lost/found)

## 📁 Project Structure

```
Lost_Found_App/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── firebase/        # Firebase configuration and functions
│   │   │   ├── config.js    # Firebase configuration
│   │   │   └── firestore.js # Firestore CRUD operations
│   │   ├── App.jsx          # Main React component
│   │   └── index.css        # Global styles with Tailwind
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
├── backend/                  # Express.js backend server
│   ├── server.js            # Main server file
│   └── package.json         # Backend dependencies
└── README.md                # This file
```

## 🛠️ Prerequisites

- Node.js (v20+ recommended)
- npm or yarn
- Firebase account and project

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Lost_Found_App
```

### 2. Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Firestore Database

2. **Get Firebase Configuration**:
   - In Firebase Console → Project Settings → General
   - Scroll to "Your apps" section
   - Click "Add app" → Web app
   - Copy the configuration object

3. **Update Firebase Config**:
   - Open `frontend/src/firebase/config.js`
   - Replace the placeholder values with your actual Firebase config

4. **Set Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /items/{itemId} {
         allow read, write: if true; // For development
       }
     }
   }
   ```

### 3. Backend Setup

```bash
cd backend
npm install
```

**Start Backend Server**:
```bash
npm run dev    # Development mode with nodemon
# or
npm start      # Production mode
```

The backend server will run on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend
npm install
```

**Start Frontend Development Server**:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔧 Available Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

