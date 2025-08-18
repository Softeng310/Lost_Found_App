# Lost & Found Community Platform – Lost No More

Welcome to the **Lost & Found Community Platform**, developed by the **Lost No More** team for the University of Auckland's **SOFTENG 310: Software Evolution and Maintenance** course.

This web platform helps students and staff conveniently report, search for, and recover lost and found items on campus. We aim to make the item recovery process easier and more trustworthy for the university community by providing real-time listings, secure messaging, and advanced search and tagging features.

---

## 🌟 Features (Assignment 1 - A1)

- 📸 **Item Reporting**: Upload photos and details of lost or found items.
- 🔍 **Search & Filtering**: Search listings by type, date, or location quickly.
- 🔔 **Notifications**: Get alerts for items that match your lost item.
- 💬 **Secure Messaging**: Communicate safely within the platform.
- ✅ **Claim Process**: Verify ownership through secure Q&A.
- 🗺️ **Location Tagging**: Pin lost/found item locations on a campus map.
- 🧾 **User Profiles**: Track your lost/found and claimed item history.
- 🛡️ **Admin Moderation**: Prevent spam or fraudulent posts.
- 📢 **Campus Notices**: Post alerts and policy updates.

---

## 🛠️ Tech Stack

- **Frontend**: ReactJS + Tailwind CSS
- **Backend**: Node.js + Express.js with JWT-based authentication
- **Database**: PostgreSQL + PostGIS
- **Search Engine**: Elasticsearch
- **Storage**: AWS S3 for image uploads
- **CI/CD**: GitHub Actions
- **Code Analysis**: SonarLint (IDE) + SonarCloud
- **Security**: Snyk for vulnerability detection

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

---

You can now access the Lost & Found Community Platform in your browser at [http://localhost:3000](http://localhost:3000).
