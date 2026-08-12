# Pyramid - Task Management System

A full-stack, high-fidelity Task Management Application built to match Figma design specifications.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons, `next-themes`
- **Backend**: NestJS REST API, TypeScript, Validation Pipes
- **Database**: SQLite with Prisma 6 ORM
- **State & Theme**: Dynamic Light/Dark/System theme persistence across reloads, Guest Auth state management

---

## 🎨 Figma Screen 1 Implementation Details

### Design Fidelity & Visual Hierarchy
- **Pyramid Logo & Branding**: Recreated squircle logo container with Pyramid delta symbol and bold typography.
- **Card Container**: Centered 440px card with 1px border (`border-neutral-200` light / `border-neutral-800` dark), `rounded-2xl`, and subtle soft shadow.
- **Typography & Copy**: Exact font weights, letter spacing, heading (`Let's get back on track`), and subtitle (`Enter your email below to login to your account.`).
- **Pill Buttons**:
  - `Continue as Guest`: Solid primary pill button with hover micro-animations and loading spinner.
  - `Login with Google`: Secondary outline pill button with multi-colored Google 'G' SVG icon.
- **Footer Disclaimer**: Subtitle legal disclaimer text with underlined interactive links for Terms of Service and Privacy Policy.

---

## 🌓 Theme Support
- Supports **Light Mode**, **Dark Mode**, and **System Preference**.
- Managed via `next-themes` and custom CSS variables.
- Selection persists in `localStorage` across page refreshes.

---

## 🚀 Getting Started

### 1. Backend (NestJS)
```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```
*Backend runs on `http://localhost:4000/api`*

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## ⚡ Features
- **Guest Authentication**: Click "Continue as Guest" to immediately enter the task workspace.
- **Task CRUD**: Create, edit, toggle completion status, filter by status (TODO, In Progress, Completed), and search tasks.
- **Priority & Category Badges**: Color-coded badges for Urgent, High, Medium, and Low priorities.
- **Full Backend Sync & Local Fallback**: Syncs with NestJS REST API endpoints with instant local storage fallback.
