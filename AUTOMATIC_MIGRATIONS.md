# 🚀 Automatic Database Migrations

## Overview

The database schema is now **automatically applied** when the server starts. You no longer need to manually run SQL files!

## How It Works

1. **Server Startup**: When you run `npm run dev`, the server automatically:
   - Checks if the database schema is up to date
   - Applies `schema_normalized.sql` if not already applied
   - Runs any pending migration files (`migration_*.sql`)
   - Tracks all applied migrations in the `migrations` table

2. **Migration Tracking**: The system uses a `migrations` table to remember which migrations have been applied, so:
   - Migrations only run once
   - Safe to restart the server multiple times
   - No duplicate table creation errors

## What You Need to Do

### First Time Setup

1. **Create the database** (empty is fine):
   ```sql
   CREATE DATABASE `global shipping company` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Watch the console** - you'll see:
   ```
   🔄 Checking database migrations...
   📦 Applying schema_normalized.sql...
   ✅ Schema applied successfully!
   ✅ All migrations completed!
   ```

That's it! The schema is automatically applied.

## Updating the Schema

### Option 1: Edit `schema_normalized.sql` Directly

1. Edit `server/schema_normalized.sql`
2. Delete the `migrations` table to reset:
   ```sql
   DROP TABLE IF EXISTS migrations;
   ```
3. Restart the server - it will reapply the schema

### Option 2: Create Incremental Migrations (Recommended)

1. Create a new migration file:
   ```bash
   cd server
   npm run create-migration
   ```

2. Enter a name like: `add_new_feature`

3. Edit the created file `migration_TIMESTAMP_add_new_feature.sql`:
   ```sql
   -- Migration: add_new_feature
   -- Description: Adds a new feature table

   CREATE TABLE IF NOT EXISTS new_feature (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL
   ) ENGINE=InnoDB;
   ```

4. Restart the server - the migration will be applied automatically

## Migration Files

- **`schema_normalized.sql`** - Main schema (applied first, tracked as one migration)
- **`migration_*.sql`** - Incremental changes (applied in order)

## Checking Migration Status

```sql
-- See all applied migrations
SELECT * FROM migrations ORDER BY applied_at DESC;
```

## Manual Migration (if needed)

If you need to run migrations manually:

```bash
cd server
npm run migrate
```

## Best Practices

1. **For schema changes**: Edit `schema_normalized.sql` and reset migrations
2. **For incremental changes**: Create new migration files
3. **Always test** on development database first
4. **Use IF NOT EXISTS** in CREATE statements
5. **Use IF EXISTS** in DROP statements

## Troubleshooting

### "Table already exists" errors
- These are automatically ignored - migrations are idempotent
- If you see these, the migration already ran successfully

### Need to reset everything
```sql
-- Drop all tables and reset migrations
DROP DATABASE `global shipping company`;
CREATE DATABASE `global shipping company` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Then restart server - schema will be reapplied
```

### Migration not running
- Check that the database exists
- Check server console for error messages
- Verify MySQL is running
- Check database connection in `.env` file

## Example: Adding a New Column

1. **Edit `schema_normalized.sql`**:
   ```sql
   -- In the captains table definition, add:
   new_column VARCHAR(255) NULL,
   ```

2. **Reset migrations**:
   ```sql
   DROP TABLE IF EXISTS migrations;
   ```

3. **Restart server** - schema will be reapplied with your changes

Or use incremental migration:

1. **Create migration**:
   ```bash
   npm run create-migration
   # Enter: add_new_column
   ```

2. **Edit the migration file**:
   ```sql
   ALTER TABLE captains 
   ADD COLUMN IF NOT EXISTS new_column VARCHAR(255) NULL;
   ```

3. **Restart server** - migration will be applied automatically

## Benefits

✅ **No manual SQL execution** - everything is automatic  
✅ **Version controlled** - migrations tracked in database  
✅ **Safe to restart** - migrations only run once  
✅ **Easy updates** - just edit files and restart  
✅ **Incremental changes** - add new migrations without touching main schema  

