# Reset Database and Reapply Schema

If you need to reset your database and reapply the complete schema:

## Option 1: Reset Migrations (Recommended)

This will make the system reapply the schema on next server restart:

1. **Open phpMyAdmin**
2. **Select database**: `global shipping company`
3. **Go to SQL tab**
4. **Run this SQL**:
   ```sql
   -- Delete migrations table to reset migration tracking
   DROP TABLE IF EXISTS migrations;
   ```
5. **Restart your server** - it will reapply the complete schema automatically

## Option 2: Full Database Reset

If you want to start completely fresh:

1. **Open phpMyAdmin**
2. **Drop the entire database**:
   ```sql
   DROP DATABASE IF EXISTS `global shipping company`;
   ```
3. **Create new database**:
   ```sql
   CREATE DATABASE `global shipping company` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. **Restart your server** - it will create all tables automatically

## What You'll Get

After resetting and restarting, you'll have **16 tables**:
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
16. migrations (created automatically)

All from a **single file**: `schema_normalized.sql`

