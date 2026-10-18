# Tasknotes - Full Project Setup & Architecture Guide

This document serves as the complete operational manual for **Tasknotes**. Keep this file handy when reinstalling Antigravity, switching machines, or onboarding a new development session.

---

## 1. Project Overview & Features

**Tasknotes** is a modern, all-in-one productivity suite built with Next.js 16 (Turbopack, React 19), Tailwind CSS v4, and Firebase.

### Key Capabilities:
- **Unified Workspace Dashboard (`/`):**
  - Split-pane layout with notes sidebar on the left and Kanban boards or Calendar in the center.
  - Seamless drag-and-drop between notes, boards, and calendar (drag a note onto a board column to convert it to a task, or drag a task back to notes).
- **Kanban Boards (`/boards`):**
  - Multi-column boards (To Do, In Progress, Done, or custom columns).
  - Add/delete columns, custom column colors, and instant task reordering.
  - "+ New Board" creation directly from both the board page and dashboard.
- **Rich Text Notes & Notepad (`/notes`):**
  - Powered by TipTap editor.
  - Google Docs / Word style hierarchy dropdown (Title, Subtitle, Headings 1-6, Body).
  - Multi-column layouts (1 Column standard, 2 Columns Docs/Word, 3 Columns Magazine).
  - 5x5 interactive table grid selector with add/delete row and column controls.
  - Task checklists, bulleted/numbered lists, text highlighting, and link insertions.
  - 11 Google Keep color palettes (Default, Coral, Peach, Sand, Mint, Sage, Fog, Storm, Dusk, Blossom, Clay).
- **Calendar View (`/calendar`):**
  - Full monthly calendar view.
  - Due date assignment for tasks with colored circle markings on dates containing scheduled items.
- **Dark / Light Theme:**
  - Full theme toggle stored in user preferences.
  - High-contrast, tailored dark palette for all components and note color cards.
- **Authentication & Cloud Storage:**
  - Firebase Auth (Google Sign-In and Email/Password).
  - Cloud Firestore user-scoped real-time persistence.

---

## 2. Repository & Workspace Paths

- **Local Path:** `c:\Users\Ledrick Suriaga\OneDrive\Desktop\WEB DEV\Tasknotes\productivity-app`
- **GitHub Repository:** `https://github.com/suriagaledrick/tasknotes.git`
- **Default Branch:** `main`

---

## 3. Quick Setup Instructions (After Antigravity Reinstall)

### Step 1: Open Folder
Open Antigravity and select:
```
c:\Users\Ledrick Suriaga\OneDrive\Desktop\WEB DEV\Tasknotes\productivity-app
```

### Step 2: Verify Prerequisites
Ensure Node.js (v18+ or v20+ LTS recommended) and Git are accessible:
```bash
node -v
npm -v
git --version
```

### Step 3: Install Dependencies
Inside `productivity-app/`:
```bash
npm install
```

### Step 4: Environment Variables (`.env.local`)
Create or verify `.env.local` inside `productivity-app/`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCYQS9286WMe3gas9mXIv7PxVbVM4rMd2g
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tasknotes-8de2a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tasknotes-8de2a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tasknotes-8de2a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1064762961214
NEXT_PUBLIC_FIREBASE_APP_ID=1:1064762961214:web:e65b374bb6c86d82c5506f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-GG16D2PH5K
```

### Step 5: Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Verify Build
```bash
npm run build
```

---

## 4. Firebase Configuration Checklist

Firebase Console: [https://console.firebase.google.com/](https://console.firebase.google.com/) -> Project: `tasknotes-8de2a`

1. **Authentication:**
   - Go to **Build -> Authentication -> Sign-in method**.
   - Ensure **Email/Password** and **Google** are enabled.
   - Go to **Settings -> Authorized Domains**:
     - `localhost` (for local development).
     - `tasknotes-8de2a.firebaseapp.com`
     - Your Netlify production domain (e.g. `your-app.netlify.app`).
2. **Firestore Database:**
   - Security Rules should allow read/write for authenticated users under their own UID:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

---

## 5. Deployment (Netlify & GitHub)

- The project includes `netlify.toml` pre-configured:
  ```toml
  [build]
    command = "npm run build"
    publish = ".next"

  [build.environment]
    SECRETS_SCAN_OMIT_KEYS = "NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID,NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
  ```
  *(This prevents Netlify's secret scanner from falsely blocking public client-side Firebase keys).*

### Manual Git Push Commands:
```bash
git add .
git commit -m "Your update message"
git push origin main
```
Any push to `main` will automatically trigger a Netlify deployment if continuous deployment is connected.

---

## 6. Critical Technical Notes for AI Assistants & Developers

1. **Tailwind CSS v4 Token Extraction Rule:**
   - Tailwind v4 extracts utility classes via static code scanning.
   - **Never** dynamically concatenate class prefixes like `dark:${color}`.
   - Always define complete literal classes (e.g. `"dark:bg-neutral-900"`, `"dark:bg-stone-900"`) in `src/types/note.ts` and apply them directly.
2. **TipTap Styling:**
   - Global typography and dark mode overrides for TipTap reside in `src/app/globals.css` under `.dark .tiptap`.
3. **Drag and Drop (`@hello-pangea/dnd`):**
   - Requires client-side only mounting (`isMounted` state) to avoid Next.js SSR hydration warnings.
