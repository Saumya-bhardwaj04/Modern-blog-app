# Modern Blog App (MERN)

A full-stack blogging platform with real-time updates, comments, notifications, and optional AI-assisted writing. The frontend is React + Vite, and the backend is Node.js + Express + MongoDB.

## Features
- Email + Google authentication with email verification
- Create, edit, and delete blogs (drafts supported)
- Rich text editor with images and embeds (Editor.js)
- Tags, search, save/like blogs
- Comments, nested replies, and mentions
- Real-time updates via Socket.IO
- Notifications + optional push (Firebase Cloud Messaging)
- AI blog assistant (Gemini) with daily limit

## Tech Stack
- Frontend: React, Vite, Redux Toolkit, Tailwind CSS, Editor.js, Socket.IO client
- Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO, Cloudinary
- Services: Firebase (Google auth + push), Gemini AI, email provider

## Project Structure
- frontend/ - React app
- backend/ - API server

## Setup (Local)
### 1) Install dependencies
```
cd backend
npm install

cd ../frontend
npm install
```

### 2) Environment variables
Create two files: backend/.env and frontend/.env

backend/.env (example keys)
```
PORT=5000
DB_URL=your_mongodb_url
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

EMAIL_HOST=...
EMAIL_PORT=...
EMAIL_USER=...
EMAIL_PASS=...

FIREBASE_TYPE=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_AUTH_URI=...
FIREBASE_TOKEN_URI=...
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=...
FIREBASE_CLIENT_X509_CERT_URL=...
FIREBASE_UNIVERSAL_DOMAIN=...

GEMINI_API_KEY=...
```

frontend/.env (example keys)
```
VITE_BACKEND_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id

VITE_APIKEY=...
VITE_AUTHDOMAIN=...
VITE_PROJECTID=...
VITE_STORAGEBUCKET=...
VITE_MESSAGINGSENDERID=...
VITE_APPID=...
VITE_FIREBASE_VAPID_KEY=...
```

### 3) Run the app
```
cd backend
npm run dev

cd ../frontend
npm run dev
```

Open the app at http://localhost:5173

## Useful Scripts
frontend
- npm run dev
- npm run build
- npm run preview

backend
- npm run dev
- npm start
