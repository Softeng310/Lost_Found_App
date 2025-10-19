# Lost & Found Community Platform – Lost No More

Welcome to the **Lost & Found Community Platform**, developed by the **Lost No More** team for the University of Auckland's **SOFTENG 310: Software Evolution and Maintenance** course.

## What is this project?

The Lost & Found Community Platform (Lost No More) is a web application that helps the University of Auckland community report, search for, and recover lost and found items. Users can register, post item listings with photos and locations, search and filter listings, and communicate with other users to arrange returns.

## Why is this project useful?

- Centralises lost & found reports in a searchable, shareable platform.
- Speeds up item recovery with location tagging and user communication.
- Provides a community-driven approach to item recovery.

## Prerequisites

- Node.js 16+ (LTS recommended)
- npm 8+ (or yarn)
- Git

---

## 🌟 Features

### Core Functionality
- 📸 **Item Reporting**: Upload photos and details of lost or found items with location tracking
- 📰 **Item Feed**: Browse all reported lost and found items on campus
- 🔍 **Search & Filtering**: Search listings by type, location, and status
- 🗺️ **Interactive Maps**: View and select locations using Leaflet maps with coordinates
- 🧾 **User Profiles**: User profiles with lost/found item history and contact information
- 📢 **Campus Announcements**: Post and view campus-wide announcements (staff/admin only)
- 💬 **Messaging System**: Direct messaging between users for item recovery coordination
- 🔔 **Notification System**: Notification bell component for user updates
- ⚙️ **Notification Settings**: Notification preferences page for users

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern React with hooks, routing (React Router DOM 6.30.1), and UI components (Lucide React 0.540.0)
- **Tailwind CSS 3.4.17** - Utility-first CSS framework for responsive design
- **Leaflet 1.9.4 + React Leaflet 4.2.1** - Interactive maps for location services
- **Firebase 12.0.0** - Client-side Firebase SDK for authentication and data

### Backend
- **Node.js 16+ + Express 4.21.2** - JavaScript runtime and web framework
- **Firebase Admin 13.4.0** - Server-side Firebase SDK for admin operations
- **Cloudinary 2.7.0** - Cloud-based image and video management
- **Express Middleware** - Multer (file uploads), CORS, UUID generation

### Database & Storage
- **Firebase** - Firestore (NoSQL database), Authentication, and data
- **Cloudinary** - Cloud storage and image transformation service

### Development & Testing
- **Jest + React Testing Library** - Testing framework
- **Development Tools** - ESLint (linting), PostCSS + Autoprefixer (CSS processing), Nodemon (auto-restart)

### Code Quality & Analysis
- **SonarQube/SonarCloud** - Code quality analysis and technical debt tracking
- **React Quality Tools** - PropTypes validation and enhanced test utilities

---

## 🚀 Getting Started

1. **Clone this repository**  
   git clone https://github.com/Softeng310/Lost_Found_App.git

---

## ▶️ Running the Application

This project has a separate backend (Node.js/Express) and frontend (React) that must be started individually.

### 1. Install Dependencies

Open a terminal and run the following commands:

#### Backend
```sh
cd backend
npm install
```

#### Frontend
```sh
cd frontend
npm install
```

### 2. Start the Servers

#### Start the Backend
```sh
cd backend
npm start
```
The backend will run on [http://localhost:5876](http://localhost:5876)

#### Start the Frontend
Open a new terminal window/tab and run:
```sh
cd frontend
npm start
```
The frontend will run on [http://localhost:3000](http://localhost:3000)

You can now access the Lost & Found Community Platform in your browser at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing

### Test Coverage
The project includes test coverage with **Jest** and **React Testing Library**:

#### Frontend Tests
- **Home Page** - Hero section, navigation, and feature rendering
- **Feed Page** - Item listing, filtering, search, and updates
- **Item Detail** - Item display, user interactions, and error handling
- **Report Page** - Form submission, validation, and image upload
- **Profile Pages** - User profile display and editing functionality
- **Sign Up** - User registration and form validation
- **Announcements** - CRUD operations and role-based access (Add, Edit, List)
- **Notification System** - Bell component and notification settings

#### Test Features
- **Mock Data Management** - Centralized mock data and test utilities
- **Firebase Mocking** - Firebase services mocking for isolated testing
- **Router Testing** - Navigation and routing behavior validation
- **Accessibility Testing** - ARIA compliance and keyboard navigation
- **Error Handling** - Error state testing
- **Form Validation** - Input validation and submission testing

#### Running Tests
```bash
# Run all tests
cd frontend
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

#### Test Utilities
- **Enhanced Test Utils** - Centralized testing helpers and mock setup
- **Firebase Mocks** - Firebase service mocking
- **Router Helpers** - Navigation testing utilities
- **Mock Data Generators** - Consistent test data creation


## 📊 Project Status & Development Progress

### Current Status: **Active Development** 🚀

The Lost & Found Community Platform is in active development with a robust foundation and feature set.

### Completed Features ✅
- **Core Platform** - Lost and found item management system
- **User Authentication** - Firebase-based user registration and login
- **Item Management** - CRUD operations for lost/found items with image uploads
- **Item Feed** - Display of all reported items with Firebase Firestore
- **Interactive Maps** - Leaflet-based location selection and display
- **Search & Filtering** - Search with filter options by type and location
- **User Profiles** - User profile management and item history
- **Messaging System** - Direct messaging between users
- **Notification System** - Notification bell component and settings page
- **Campus Announcements** - Staff/admin announcement system
- **Responsive Design** - Mobile-first responsive interface
- **Testing** - Test suite across 10 major components
- **Code Quality** - SonarQube analysis applied with documented improvements

### Development Metrics 📈
- **Test Coverage**: Test suite across 10 major components
- **Code Quality**: SonarQube analysis applied with documented improvements
- **Code Organization**: Enhanced test utilities and centralized mock data
- **Development Standards**: PropTypes validation and accessibility improvements

### Recent Improvements 🆕
- **Enhanced Test Utilities** - Centralized testing helpers and mock data
- **SonarQube Analysis** - Code quality issues identified and documented fixes applied
- **PropTypes Validation** - Runtime type checking for React components
- **Accessibility Improvements** - ARIA compliance and keyboard navigation
- **Error Handling** - Error states and user feedback
- **Code Organization** - Improved test structure and reduced code duplication

---

## Support & Getting Help

- For bugs and feature requests, open an Issue: https://github.com/Softeng310/Lost_Found_App/issues
- For general questions, open an Issue and tag @Softeng310

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines, code of conduct, and development workflow.

## Acknowledgements & Contributors

- Course / Project: SOFTENG 310 – Lost No More
- Repo lead: Softeng310
- Major contributors:  Manan Patel(mpat501), Nadia Askari(nask472), Jerry Kim (pkim777), Rudra Patel (rpat943), Soham Kulkarni(skul970), Liam Byrne (lbyr117)
- Tech stack highlight: React, Tailwind CSS, Firebase (Auth, Firestore, Storage), Node.js, Express, Cloudinary, Multer

For a full list of contributors, see the GitHub contributors graph:
https://github.com/Softeng310/Lost_Found_App/graphs/contributors

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for full text.

In short: you may use, copy, modify, and distribute this software under the MIT terms; it is provided "as is", without warranty.
