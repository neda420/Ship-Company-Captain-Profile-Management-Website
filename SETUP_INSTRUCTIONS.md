# Setup Instructions

## Prerequisites

1. **XAMPP** must be running with MySQL started
2. **Node.js** installed (v18 or higher)
3. **Database** created: `global shipping company`

## Step 1: Database Setup

1. Open **phpMyAdmin**: `http://localhost/phpmyadmin`
2. Create database: `global shipping company` (if not exists)
3. **That's it!** The schema code will be applied automatically when  start the server

> **Note**: The server automatically runs migrations on startup. Don't need to manually run SQL files anymore!

## Step 2: Create Admin User

Run this SQL in phpMyAdmin (SQL tab):

```sql
DELETE FROM users WHERE username = 'Admin';

INSERT INTO users (username, password_hash, email, full_name, role, permissions_json, is_active)
VALUES (
  'Admin',
  '$2a$10$dJDh4hOqihdm.zvg7VnpSOMy0w3ZBq6LeJpVSz8hbcVezA1ChxJ7G',
  'example@gmail.com',
  'Admin',
  'admin',
  '["view_dashboard","view_employees","edit_employees","view_documents","manage_documents","view_settings","manage_users","manage_settings"]',
  1
);
```

## Step 3: Install Dependencies

```powershell
# Install root dependencies (includes concurrently)
npm install

# Install server dependencies
cd server
npm install
cd ..
```

## Step 4: Configure Environment (Optional)

If you need custom database settings, create `server/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=global shipping company
PORT=4000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key
```

## Step 5: Start the Servers

From the root directory:

```powershell
npm run dev
```

This will start:
- **Backend** on `http://localhost:4000`
- **Frontend** on `http://localhost:5173`

## Step 6: Access the Website

Open your browser:
```
http://localhost:5173
```

Login with:
- **Username**: `Admin`
- **Password**: `nadimnaim01`

## Troubleshooting

### Backend won't start
- Check if MySQL is running in XAMPP
- Verify database exists: `global shipping company`
- Tables are created automatically on server startup
- Check server console for migration messages
- Look at backend console for error messages

### Frontend won't load
- Check if backend is running on port 4000
- Verify Vite is running on port 5173
- Check browser console (F12) for errors

### Login not working
- Verify admin user exists in database
- Check password_hash starts with `$2a$10$`
- Check backend console for login errors
- Make sure username is exactly `Admin` (case-sensitive)

### API calls failing
- Verify backend is running
- Check CORS settings in `server/src/app.js`
- Verify proxy settings in `vite.config.ts`

