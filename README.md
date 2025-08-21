# Lost & Found Community Platform – Lost No More

Welcome to the **Lost & Found Community Platform**, developed by the **Lost No More** team for the University of Auckland's **SOFTENG 310: Software Evolution and Maintenance** course.

## What is this project?

The Lost & Found Community Platform (Lost No More) is a web application that helps the University of Auckland community report, search for, and recover lost and found items. Users can register, post item listings with photos and locations, search and filter listings, and message other users to arrange returns.

## Why is this project useful?

- Centralises lost & found reports in a searchable, shareable platform.
- Speeds up item recovery with notifications and location tagging.
- Provides moderation controls and privacy-conscious features to reduce misuse.

## Prerequisites

- Node.js 16+ (LTS recommended)
- npm 8+ (or yarn)
- Git

---

## 🌟 Features (Assignment 1 - A1)

- 📸 **Item Reporting**: Upload photos and details of lost or found items.
- 📰 **Lost Items Feed**: Browse a real-time feed of all reported lost items on campus.
- 🔍 **Search & Filtering**: Search listings by type, date, or location quickly.
- 🧾 **User Profiles**: Track your lost/found and claimed item history.
- 📢 **Campus Notices**: Post alerts and policy updates.

---

## 🛠️ Tech Stack

- **Frontend**: React + Tailwind CSS
- **Auth / Database / Storage**: Firebase — the app uses Firebase Authentication for user sign-in, Cloud Firestore for application data, and Firebase Storage for item images.
- **Backend**: Node.js + Express — a lightweight API server is included (health endpoints). The frontend currently communicates directly with Firebase; the backend contains minimal Express code and `firebase-admin` is available in package.json for optional server-side admin tasks.
- **Image Uploads**: Cloudinary — used for efficient image storage, transformation, and delivery. Item images are uploaded to Cloudinary before being referenced in the app.
- **Image Upload API**: The backend uses Cloudinary and Multer to handle secure image uploads. Images are uploaded from the frontend to the backend API, which processes them with Multer and stores them in Cloudinary. The resulting Cloudinary URLs are saved in Firestore and referenced in item listings.
- **CI/CD / Analysis / Security**: GitHub Actions, SonarLint/SonarCloud, and Snyk are listed as tooling that can be used for CI and quality checks.

> Note: PostgreSQL + PostGIS, Elasticsearch, AWS S3, and a JWT-based authentication backend are mentioned in earlier planning notes but are not implemented in this repository's current codebase — the project presently relies on Firebase for auth, data, and storage. These components remain possible future alternatives.

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

## Testing / Smoke tests

This repository does not include an automated test suite yet. Manual smoke test steps:

1. Start backend and frontend.
2. Open http://localhost:3000
3. Sign up a user, create a lost/found listing with an image, search for it, and view details.

If you want, I can add unit and integration tests (Jest + React Testing Library for frontend; a small mocha/jest test for the backend health endpoint).

## Versions / Releases

This project uses Git for versioning. There is only 1 release with A1 features present.

## Support & Getting Help

- For bugs and feature requests, open an Issue: https://github.com/Softeng310/Lost_Found_App/issues
- For general questions, open an Issue and tag @Softeng310

## Contributing

 ([CONTRIBUTING.md](CONTRIBUTING.md)) for contribution guidelines, the code of conduct, and development workflow.

## Acknowledgements & Contributors

- Course / Project: SOFTENG 310 – Lost No More
- Repo lead: Softeng310
- Major contributors:  Manan Patel(mpat501), Nadia Askari(nask472), Jerry Kim (pkim777), Rudra Patel (rpat943), Soham Kulkarni(skul970), Liam Byrne (lbyr117)
- Tech stack highlight: React, Tailwind CSS, Firebase (Auth, Firestore, Storage), Node.js, Express, Cloudinary, Multer

For a full list of contributors, see the GitHub contributors graph:
https://github.com/Softeng310/Lost_Found_App/graphs/contributors

## License

This project is licensed under the MIT License — see ([LICENSE](LICENSE)) for full text.

In short: you may use, copy, modify, and distribute this software under the MIT terms; it is provided "as is", without warranty.
