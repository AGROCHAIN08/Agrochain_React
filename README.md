# AGROCHAIN: Digital Agriculture Supply Chain Platform

This project is a full-stack web application built to digitize the agricultural supply chain, connecting **Farmers**, **Dealers**, and **Retailers**.

The backend is built with **Node.js, Express, and MongoDB**.  
The frontend is a **React** single-page application (SPA).

---

## 📂 Project Structure

```
AGROCHAIN/
├── backend/                  # Node.js, Express, MongoDB API
│   ├── node_modules/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── .env                  # (You must create this)
│   ├── app.js
│   └── package.json
└── frontend-react/           # React.js App
    ├── node_modules/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   ├── services/
    │   ├── App.js
    │   └── index.js
    ├── .env                  # (You must create this)
    └── package.json
```

---

## 🧩 Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18.0 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/try/download/community)  
  (You can use a free cloud instance from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) or a local installation)

---

## 🚀 How to Run the Application

You must run both the **Backend** and **Frontend** servers simultaneously in two separate terminals.

---

### 1️⃣ Backend Setup (API Server)

**Terminal 1:**

```bash
# 1. Navigate to the backend directory
cd AGROCHAIN_REACT/backend

# 2. Install all required dependencies
npm install
```

#### 3. Create the Backend Environment File

Create a file named `.env` in the `AGROCHAIN/backend` directory.  
This file stores your secret keys and database connection string.

Copy the following content and replace placeholder values:

```bash
# Server Port
PORT=3000

# Your MongoDB Connection String (from MongoDB Atlas or local)
# Replace <username>, <password>, and database name
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/agrochain?retryWrites=true&w=majority

# Nodemailer (for sending OTPs)
# Use a Gmail "App Password" here, not your regular password
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

#### 4. Run the Backend Server

To run the server once:

```bash
node index.js
```

Or, if you have **nodemon** installed (recommended for development):

```bash
nodemon index.js
```

✅ The backend server should now be running at:  
**http://localhost:3000**

---

### 2️⃣ Frontend Setup (React App)

**Terminal 2:**

```bash
# 1. Navigate to the frontend directory
cd Agrochain_React/frontend/agrochain-client

# 2. Install all required dependencies
npm install react-scripts@latest
npm install react-router-dom axios
npm install chart.js react-chartjs-2 @react-oauth/google
npm install @reduxjs/toolkit react-redux
```

#### 3. Create the Frontend Environment File

Create a file named `.env` in the `AGROCHAIN/frontend-react` directory.  
Add this line to prevent port conflicts with the backend:

```bash
PORT=3001
```

#### 4. Run the Frontend App

```bash
npm start
```

✅ The React application will automatically open in your browser.

Access it at:  
**http://localhost:3001**

---

### 🎯 Summary

| Component  | Directory               | Command           | Runs On              |
|-------------|------------------------|-------------------|----------------------|
| Backend API | `AGROCHAIN/backend`    | `npm start`       | http://localhost:3000 |
| Frontend UI | `AGROCHAIN/frontend-react` | `npm start`    | http://localhost:3001 |

---

## Testing

Unit tests now cover the backend middleware and app behavior, plus the frontend Redux business logic.

Generate all test reports from the repository root:

```bash
node scripts/run-all-tests.mjs
```

Run each side individually if needed:

```bash
node scripts/run-backend-tests.mjs
node scripts/run-frontend-tests.mjs
```

Generated artifacts:

- `reports/backend/junit.xml`
- `reports/backend/test-report.html`
- `reports/backend/coverage/raw/`
- `reports/frontend/test-report.html`
- `reports/frontend/coverage/lcov-report/index.html`
- `reports/index.html`

If you prefer package scripts on Windows PowerShell, use `npm.cmd run test:report`.

---

## Docker

The project is now containerized with:

- `backend/Dockerfile` for the Node/Express API
- `frontend/agrochain-client/Dockerfile` for the React app served by Nginx
- `docker-compose.yml` for the full stack

The frontend container proxies `/api` to the backend container, so the browser only needs to talk to `http://localhost:3001`.

From the repository root:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api-docs`

Notes:

- Compose reads backend environment variables from `backend/.env`.
- Redis is included as an internal cache service.
- MongoDB still comes from your configured `MONGO_URI`.

To stop everything:

```bash
docker compose down
```

---

## Deployment

### Frontend on Vercel

The frontend is ready for Vercel from `frontend/agrochain-client`.

Files added for deployment:

- `frontend/agrochain-client/vercel.json`
- `frontend/agrochain-client/.env.example`

Use these Vercel settings:

- Framework preset: `Create React App`
- Root directory: `frontend/agrochain-client`
- Build command: `npm run build`
- Output directory: `build`

Add these environment variables in Vercel:

- `REACT_APP_API_URL=https://your-backend.onrender.com/api`
- `REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id`

### Backend on Render

The backend is ready for Render from `backend`.

Files added for deployment:

- `render.yaml`
- `backend/.env.example`

Use these Render settings if you create the service manually:

- Runtime: `Node`
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm run start`

Important Render environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `GOOGLE_CLIENT_ID`
- `FRONTEND_URL=https://your-frontend.vercel.app`
- `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
- `REDIS_URL` if you connect Render Redis

Notes:

- Backend CORS now reads `ALLOWED_ORIGINS` and `FRONTEND_URL` instead of relying only on hardcoded URLs.
- Swagger now uses `PUBLIC_API_URL` or Render's public URL automatically when available.
- The frontend Google OAuth client id can now be supplied through `REACT_APP_GOOGLE_CLIENT_ID`.

---

## Performance Report

To generate the optimization report for database indexing, query planning, and Redis cache speedup:

```bash
docker compose up -d redis
node backend/scripts/generate-optimization-report.js
```

Generated artifact:

- `reports/performance/optimization-report.md`
- `reports/performance/optimization-report.html`

This report uses the current MongoDB data and a running Redis instance to show:

- which index MongoDB chose for the search query
- how many documents/keys were examined
- average uncached MongoDB time vs cached Redis time

Open the reports here:

- `reports/performance/optimization-report.html`
- `reports/index.html`

---

**Developed by AgroChain team using Node.js, Express, MongoDB, and React.**
