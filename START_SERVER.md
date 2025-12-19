# 🚀 How to Start the Server

## Quick Start

### Prerequisites
1. ✅ **XAMPP MySQL** must be running
2. ✅ **Database** `global shipping company` exists (empty is fine - schema applies automatically!)
3. ✅ **Admin user** created (see SQL below)

### Step 1: Install Dependencies

```powershell
# Install root dependencies
npm install

# Install server dependencies  
cd server
npm install
cd ..
```

### Step 2: Start Both Servers

From root directory (`C:\vite-project`):

```powershell
npm run dev
```

You'll see:
- **Backend** (cyan) running on `http://localhost:4000`
- **Frontend** (magenta) running on `http://localhost:5173`

### Step 3: Access Website

Open browser: **`http://localhost:5173`**

Login:
- Username: `Admin`
- Password: `nadimnaim01`

---

## Setup Database & Admin User

### 1. Create Database (Tables Created Automatically!)

In phpMyAdmin:
1. Create database: `global shipping company` (if not exists)
2. **That's it!** Tables are created automatically when the server starts

### 2. Create Admin User

Run this SQL in phpMyAdmin:

```sql
DELETE FROM users WHERE username = 'Admin';

INSERT INTO users (username, password_hash, email, full_name, role, permissions_json, is_active)
VALUES (
  'Admin',
  '$2a$10$dJDh4hOqihdm.zvg7VnpSOMy0w3ZBq6LeJpVSz8hbcVezA1ChxJ7G',
  'nadim015582@gmail.com',
  'Admin',
  'admin',
  '["view_dashboard","view_employees","edit_employees","view_documents","manage_documents","view_settings","manage_users","manage_settings"]',
  1
);
```

---

## Troubleshooting

### Backend won't start
- ✅ Check MySQL is running in XAMPP
- ✅ Verify database exists: `global shipping company`
- ✅ Tables are created automatically on startup
- ✅ Check server console for "✅ Schema applied successfully!"
- ✅ Look at backend console for specific errors

### Frontend shows blank page
- ✅ Check if backend started successfully (port 4000)
- ✅ Check browser console (F12) for errors
- ✅ Verify Vite is running (port 5173)

### Login fails
- ✅ Verify admin user exists in database
- ✅ Check `password_hash` starts with `$2a$10$`
- ✅ Username must be exactly `Admin` (case-sensitive)
- ✅ Check backend console for login errors

---

## Architecture

- **Frontend**: Vite dev server (port 5173) - React app
- **Backend**: Express API (port 4000) - MySQL database
- **Proxy**: Vite forwards `/api/*` and `/uploads/*` to backend
- **Access**: Only use `http://localhost:5173` - proxy handles the rest!

