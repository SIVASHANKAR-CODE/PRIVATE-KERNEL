# 🔒 PRIVATE KERNEL — Secure Real-Time Messaging PWA

A production-grade **Progressive Web App (PWA)** for private, real-time messaging — featuring end-to-end conversation flows, group chats, voice/video call UI, notifications, and a full account-security layer.

> Built by **Sivashankar** — [@SIVASHANKAR-CODE](https://github.com/SIVASHANKAR-CODE)

---

## 👥 Team

| Member | Role / Focus | Profile |
|--------|---------------|---------|
| Sivashankar S | Developer | [@SIVASHANKAR-CODE](https://github.com/SIVASHANKAR-CODE) |
| Yogavarshni R | UI/UX Designer | [@yogavarshni-Max](https://github.com/yogavarshni-Max) |
| Rithigasri J | Researcher | [@rrithigasrij-star](https://github.com/rrithigasrij-star) |

---

## ✨ Key Features

### 💬 Real-Time Chat
- One-to-one and group conversations powered by **Socket.IO**
- Message list with bubbles, media, voice notes, and starred messages
- Typing indicators, read receipts, and online/last-seen presence
- In-app notifications drawer

### 📞 Calls
- Voice/video call modal built into the chat experience

### 👥 Groups
- Group creation, group details, and member management

### 🔐 Account Security
- JWT-based authentication with hashed passwords (bcrypt)
- Email verification, forgot-password, and reset-password flows
- Rate-limited auth endpoints, Helmet security headers, centralized audit logging
- User-level privacy settings (last seen, profile photo, read receipts, typing indicator)

### ⚙️ Settings & Media
- Per-user theme (light/dark/system), notification, and privacy preferences
- File/avatar uploads with pluggable storage (local filesystem or S3-compatible)
- Block/unblock users

### 📱 Progressive Web App
- Installable on desktop and mobile with an offline-ready service worker

---

## 🛠️ Tech Stack

| Layer      | Technology                                              |
|------------|----------------------------------------------------------|
| Frontend   | React 18 + TypeScript + Vite, Tailwind CSS, React Router |
| Real-time  | Socket.IO (client + server)                              |
| Backend    | Node.js + Express + TypeScript                           |
| Database   | MongoDB (Mongoose ODM)                                   |
| Auth       | JWT + bcrypt password hashing                             |
| Validation | Zod                                                       |
| Storage    | Local filesystem (default) or any S3-compatible provider |
| Email      | Nodemailer (SMTP) for verification & password reset      |
| PWA        | Web App Manifest + Service Worker (vite-plugin-pwa)       |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A MongoDB connection (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)

### 1. Clone & Install
```bash
git clone https://github.com/SIVASHANKAR-CODE/PRIVATE-KERNEL.git
cd PRIVATE-KERNEL
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root (see `.env.example` for the full list):
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
VITE_API_URL=http://localhost:5000

STORAGE_PROVIDER=local
STORAGE_PATH=uploads

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```
> ⚠️ Never commit real secrets. Keep `.env` out of version control (already covered by `.gitignore`) and only put placeholder values in `.env.example`.

### 3. Start Development
```bash
npm run dev
```
This runs the backend (Express + Socket.IO) and frontend (Vite) concurrently.

### 4. Open the App
Visit **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
PRIVATE-KERNEL/
├── backend/
│   └── src/
│       ├── config/          # Environment & app config
│       ├── controllers/     # Route handlers (auth, chat, groups, uploads...)
│       ├── middleware/      # Auth guard, validation
│       ├── models/          # Mongoose schemas (User, Message, Conversation...)
│       ├── routes/          # Express route definitions
│       ├── services/        # DB, mailer, storage
│       ├── sockets/         # Socket.IO chat events
│       └── server.ts        # App entrypoint
├── frontend/
│   └── src/
│       ├── components/      # Chat, common, notifications, profile, settings UI
│       ├── context/         # Auth, Chat, Theme providers
│       ├── pages/           # Login, Register, ChatApp, password flows
│       ├── services/        # API + socket clients
│       └── types/           # Shared TypeScript types
├── .env.example
└── package.json              # npm workspaces (frontend + backend)
```

---

## 📜 Scripts

| Command           | Description                                   |
|--------------------|-----------------------------------------------|
| `npm run dev`      | Runs backend + frontend in watch mode         |
| `npm run build`    | Builds production assets for both workspaces  |

---

## 🤝 Contributing

Issues and pull requests are welcome. Please open an issue first to discuss any major changes.

## 📄 License

This project is currently unlicensed — all rights reserved by the author unless a license file is added.
