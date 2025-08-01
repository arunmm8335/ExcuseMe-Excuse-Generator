# ExcuseMe: Intelligent Excuse Generator

> **A full-stack, AI-powered web application for generating high-quality, believable excuses, featuring real-time streaming, community engagement, moderation tools, and Twilio integration.**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [License](#license)
- [Acknowledgments](#acknowledgments)


---

## Features

- **AI-Powered Excuse Generation**: Real-time streaming from OpenAI GPT models, context-aware, multi-language, and pro-tier API key management.
- **Communication Tools**: Twilio phone call integration, fake call scenarios, proof (fake chat log) generation, and apology crafting.
- **Community & Moderation**: Community wall, like/comment system, user profiles, moderator panel, and content reporting.
- **Modern UI/UX**: Responsive design, dark/light themes, smooth animations, accessibility, and iconography.
- **Security & User Management**: JWT authentication, user tiers (Free/Pro), encrypted API key storage, rate limiting, and input validation.
- **Deployment Ready**: Multi-platform deployment support (Vercel, Render), health checks, and environment-based configuration.

---

## Tech Stack

**Frontend:**
- React 19.1.0
- Vite
- Tailwind CSS, DaisyUI
- React Router DOM
- Axios
- React Hot Toast
- FontAwesome

**Backend:**
- Node.js
- Express.js
- MongoDB, Mongoose
- JWT
- OpenAI API
- Twilio
- CryptoJS

**DevOps & Tooling:**
- Vercel (Frontend Hosting)
- Render (Backend Hosting)
- GitHub Actions (CI/CD ready)
- ESLint, Prettier

---

## Getting Started

### Local Development
```bash
git clone https://github.com/arunmm8335/ExcuseMe-Excuse-Generator.git
cd ExcuseMe-Excuse-Generator

# Backend
cd backend
npm install
npm start

# Frontend
cd ../frontend
npm install
npm run dev
```

---

## Configuration

### Backend `.env` Example
```env
MONGO_URI=mongodb://localhost:27017/excuseme
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE_URL=https://api.openai.com/v1
FREE_TIER_LIMIT=10
ENCRYPTION_SECRET=your-encryption-secret-key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
PORT=5000
NODE_ENV=development
```

### Frontend `.env` Example
```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
VITE_API_URL=https://your-backend-service.onrender.com (for production)
# VITE_API_URL=http://localhost:5000 (for local development)
```

---

## Usage Guide

1. **Register/Login**: Create an account or log in. Free tier: 10 AI calls/day. Upgrade to Pro for unlimited usage.
2. **Generate Excuses**: Enter your situation, select context and urgency, and receive AI-generated excuses in real time.
3. **Advanced Features**: Use phone call, proof generation, and community features. Manage your profile and settings.
4. **Community**: Browse, like, comment, and share excuses. Report inappropriate content.

---

## Project Structure

```
launchizd-excuse-generator/
├── backend/           # Node.js/Express backend
│   ├── config/        # Database config
│   ├── middleware/    # Middleware (AI, auth, error, logger, etc.)
│   ├── models/        # Mongoose models
│   ├── routes/        # API endpoints
│   ├── tests/         # Backend tests
│   └── server.js      # Express server
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## API Endpoints

**Authentication**
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user

**Excuse Generation**
- `POST /api/excuses/generate-stream` — Stream excuse
- `POST /api/excuses/apology` — Generate apology
- `POST /api/excuses/proof` — Generate proof
- `POST /api/excuses/save` — Save excuse

**User Management**
- `GET /api/users/profile` — Get profile
- `PATCH /api/users/profile` — Update profile
- `POST /api/users/upgrade` — Upgrade to Pro
- `POST /api/users/api-key` — Save API key

**Community**
- `GET /api/excuses/community` — Public excuses
- `POST /api/excuses/:id/like` — Like
- `POST /api/excuses/:id/report` — Report
- `POST /api/excuses/:id/comment` — Comment

**Phone Calls**
- `POST /api/calls/trigger` — Trigger fake call

---

## Deployment

### Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/) and sign in with your GitHub account.
2. Click "New Project" and import your repository.
3. Set the project root to the `frontend` directory.
4. Add the required environment variables from the `.env` example above.
5. Set the `VITE_API_URL` to your Render backend URL (e.g., `https://your-backend-service.onrender.com`).
6. Deploy the project. Vercel will provide a live URL for your frontend.

### Backend (Render)
1. Go to [Render](https://render.com/) and sign in with your GitHub account.
2. Click "New Web Service" and connect your repository.
3. Set the project root to the `backend` directory.
4. Set the build command to `npm install` and the start command to `npm start`.
5. Add all required environment variables from the `.env` example above.
6. Add Frontend URI (1 & 2) of vercel domains.
7. Deploy the service. Render will provide a live URL for your backend API.

### Environment Variables
- Set all required environment variables in the respective platform dashboards (Vercel for frontend, Render for backend).
- Ensure the frontend `VITE_API_URL` matches the deployed backend Render URL.

---

## License

This project is licensed under the [MIT License](LICENSE.md).

---

## Acknowledgments
- OpenAI (AI capabilities)
- Twilio (phone integration)
- React, Express.js, MongoDB

---

## Support
- [GitHub Issues](https://github.com/arunmm8335/ExcuseMe-Excuse-Generator/issues)
- [GitHub Discussions](https://github.com/arunmm8335/ExcuseMe-Excuse-Generator/discussions)
- Contact via GitHub profile


---

*Made with ❤️ by the ExcuseMe Team*
