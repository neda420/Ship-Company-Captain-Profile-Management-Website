# How to Run the Schema File

## Method 1: phpMyAdmin (Recommended - Easiest)

1. **Open phpMyAdmin** in your browser (usually `http://localhost/phpmyadmin`)

2. **Select or Create Database:**
   - If database doesn't exist: Click "New" → Enter database name: `global shipping company` → Select collation: `utf8mb4_unicode_ci` → Click "Create"
   - If database exists: Click on `global shipping company` in the left sidebar

3. **Run the SQL file:**
   - Click the **"SQL"** tab at the top
   - Open the file `server/schema_normalized.sql` in a text editor
   - Copy **ALL** the contents (Ctrl+A, Ctrl+C)
   - Paste into the SQL text area in phpMyAdmin
   - Click **"Go"** button (or press Ctrl+Enter)

4. **Verify:**
   - You should see "15 queries executed successfully"
   - Check the left sidebar - you should see 15 tables created

---

## Method 2: MySQL Command Line (PowerShell)

**⚠️ Note:** PowerShell doesn't support `<` redirection. Use one of these methods:

### Option A: Using Get-Content (PowerShell)

1. **Open PowerShell**

2. **Navigate to your project:**
   ```powershell
   cd c:\vite-project
   ```

3. **Run MySQL command with Get-Content:**
   ```powershell
   Get-Content server\schema_normalized.sql | mysql -u root -p "global shipping company"
   ```

4. **Enter your MySQL password when prompted**

### Option B: Using cmd.exe (Windows Command Prompt)

1. **Open Command Prompt (cmd.exe)** - NOT PowerShell

2. **Navigate to your project:**
   ```cmd
   cd c:\vite-project
   ```

3. **Run MySQL command:**
   ```cmd
   mysql -u root -p "global shipping company" < server\schema_normalized.sql
   ```

4. **Enter your MySQL password when prompted**

### Option C: Using MySQL source command (Interactive)

1. **Open PowerShell or Command Prompt**

2. **Login to MySQL:**
   ```bash
   mysql -u root -p
   ```

3. **Select database:**
   ```sql
   USE `global shipping company`;
   ```

4. **Run the schema file:**
   ```sql
   source c:/vite-project/server/schema_normalized.sql
   ```
   
   **Note:** Use forward slashes `/` in the path, not backslashes `\`

---

## Method 3: MySQL Command Line (Interactive)

1. **Open Command Prompt or Terminal**

2. **Login to MySQL:**
   ```bash
   mysql -u root -p
   ```

3. **Select database:**
   ```sql
   USE `global shipping company`;
   ```

4. **Run the schema file:**
   ```sql
   source c:/vite-project/server/schema_normalized.sql
   ```
   
   Or copy-paste the entire SQL file content directly

---

## Method 4: Using Node.js Script (If you have the backend running)

You can also use the migration script:

```bash
cd server
npm run check-tables
```

This will show you which tables exist and which are missing.

---

## Troubleshooting

### If you get foreign key errors:
- The schema file already handles this with `SET FOREIGN_KEY_CHECKS = 0` at the start
- Make sure you're running the **entire** file, not just parts of it

### If database doesn't exist:
Run this first in phpMyAdmin SQL tab:
```sql
CREATE DATABASE `global shipping company` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### If tables already exist:
The SQL uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times. Existing tables won't be affected.

---

## Expected Result

After running the schema, you should have **15 tables**:

1. users
2. captains
3. captain_personal_identity
4. captain_professional_info
5. vessel_types
6. captain_vessel_types
7. captain_medical_info
8. captain_expiry_dates
9. document_types
10. captain_documents
11. document_history
12. certificates
13. sea_service_history
14. skills
15. captain_skills

Plus the `document_types` table will be populated with 21 default document types.
