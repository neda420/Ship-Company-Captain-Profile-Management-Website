# 🔧 Troubleshooting Guide

## Backend Not Connecting

### Symptoms
- Frontend loads but shows blank/empty data
- Console shows "Cannot connect to server"
- API calls fail with network errors

### Solutions

#### 1. Check if Backend is Running
Look for this in your terminal:
```
🚀 Backend API server running on http://localhost:4000
✅ Database connected successfully
```

If you don't see this:
- Backend didn't start
- Check for errors in the backend terminal
- Make sure MySQL/XAMPP is running

#### 2. Check Database Connection
Backend will show:
- ✅ `Database connected successfully` - Good!
- ❌ `Failed to start server` - Database issue

**Fix database issues:**
1. Open XAMPP Control Panel
2. Start MySQL
3. Open phpMyAdmin: `http://localhost/phpmyadmin`
4. Verify database exists: `global shipping company`
5. Check if tables exist (run `server/schema_normalized.sql`)

#### 3. Check Ports
- **Backend**: Must be on port 4000
- **Frontend**: Must be on port 5173
- **MySQL**: Must be on port 3306 (default)

If port 4000 is busy:
```powershell
# Find what's using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

#### 4. Verify Proxy Configuration
Check `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
    secure: false,
  }
}
```

#### 5. Test Backend Directly
Open in browser:
- `http://localhost:4000/api/health` - Should show JSON with `status: "ok"`

If this fails:
- Backend is not running
- Check backend terminal for errors

---

## Frontend Not Loading

### Symptoms
- Blank white page
- Browser console shows errors
- Styles not loading

### Solutions

#### 1. Check if Frontend Server Started
Look for:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

#### 2. Clear Browser Cache
- Press `Ctrl + Shift + Delete`
- Clear cached images and files
- Hard refresh: `Ctrl + F5`

#### 3. Check Browser Console
Press `F12` → Console tab
- Look for red errors
- Common issues:
  - `Failed to fetch` → Backend not running
  - `Module not found` → Missing dependencies
  - `Syntax error` → Code issue

---

## Login Not Working

### Symptoms
- "Invalid username or password"
- Login button does nothing
- Redirects back to login

### Solutions

#### 1. Verify Admin User Exists
Run in phpMyAdmin SQL tab:
```sql
SELECT * FROM users WHERE username = 'Admin';
```

Should return 1 row with:
- `username`: `Admin`
- `password_hash`: Starts with `$2a$10$`
- `is_active`: `1`

#### 2. Recreate Admin User
If password_hash doesn't start with `$2a$10$`:

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

#### 3. Check Backend Logs
Look at backend terminal when logging in:
- Should show: `[LOGIN] Attempt: { username: 'Admin', found: true }`
- Should show: `[LOGIN] Password match: true`

If `found: false`:
- Username is wrong (case-sensitive)
- User doesn't exist in database

If `Password match: false`:
- Password is wrong
- Password hash is incorrect format

---

## Common Errors

### "Cannot GET /api/..."
**Cause**: Route doesn't exist or backend not running  
**Fix**: Check backend routes in `server/src/routes/`

### "ECONNREFUSED"
**Cause**: Backend not running on port 4000  
**Fix**: Start backend: `cd server && npm run dev`

### "ER_ACCESS_DENIED_ERROR"
**Cause**: MySQL credentials wrong  
**Fix**: Check `server/.env` or default credentials (root, no password)

### "ER_BAD_DB_ERROR"
**Cause**: Database doesn't exist  
**Fix**: Create database: `global shipping company`

### "Table doesn't exist"
**Cause**: Tables not created  
**Fix**: Run `server/schema_normalized.sql` in phpMyAdmin

---

## Quick Diagnostic Commands

```powershell
# Check if ports are in use
netstat -ano | findstr ":4000"
netstat -ano | findstr ":5173"

# Check Node processes
tasklist | findstr node

# Test backend health
curl http://localhost:4000/api/health

# Test database connection (from server directory)
cd server
node -e "import('./src/db.js').then(m => m.query('SELECT 1').then(() => console.log('DB OK')).catch(e => console.error('DB Error:', e)))"
```

---

## Still Not Working?

1. **Check all terminals** - Both frontend and backend should be running
2. **Check browser console** (F12) - Look for specific error messages
3. **Check backend terminal** - Look for error messages
4. **Verify MySQL is running** - XAMPP Control Panel
5. **Restart everything**:
   - Stop all terminals (Ctrl+C)
   - Stop MySQL in XAMPP
   - Start MySQL in XAMPP
   - Run `npm run dev` from root directory

