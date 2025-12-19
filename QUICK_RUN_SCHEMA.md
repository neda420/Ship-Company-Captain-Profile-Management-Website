# Quick Guide: Run Schema File

## ✅ EASIEST METHOD: phpMyAdmin

1. **Open phpMyAdmin:** http://localhost/phpmyadmin
2. **Select database:** Click `global shipping company` in left sidebar
3. **Click "SQL" tab** at the top
4. **Open file:** `server\schema_normalized.sql` in Notepad/VS Code
5. **Copy ALL** (Ctrl+A, Ctrl+C)
6. **Paste** into phpMyAdmin SQL box
7. **Click "Go"**

Done! ✅

---

## Alternative: PowerShell (if MySQL is in PATH)

```powershell
Get-Content server\schema_normalized.sql | mysql -u root -p "global shipping company"
```

---

## Alternative: PowerShell with XAMPP MySQL

```powershell
Get-Content server\schema_normalized.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root -p "global shipping company"
```

(Adjust path if your XAMPP is in a different location)

---

## Alternative: Interactive MySQL

```powershell
# Step 1: Login
& "C:\xampp\mysql\bin\mysql.exe" -u root -p

# Step 2: In MySQL prompt:
USE `global shipping company`;
source c:/vite-project/server/schema_normalized.sql;
```

**Note:** Use forward slashes `/` in the path for MySQL `source` command.
