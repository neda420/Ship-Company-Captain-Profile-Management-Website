# Database Migrations

This directory contains the automatic database migration system.

## How It Works

1. **Automatic on Startup**: Migrations run automatically when the server starts
2. **Tracked**: All applied migrations are stored in the `migrations` table
3. **Idempotent**: Running migrations multiple times is safe (won't duplicate)
4. **Schema First**: The main schema (`schema_normalized.sql`) is applied first
5. **Incremental**: Additional migration files (`migration_*.sql`) are applied in order

## Migration Files

- `schema_normalized.sql` - Main database schema (applied first)
- `migration_*.sql` - Incremental migrations (applied in alphabetical order)

## Creating a New Migration

### Option 1: Using the CLI

```bash
cd server
npm run create-migration
```

This will prompt you for a migration name and create a template file.

### Option 2: Manual Creation

Create a file named `migration_TIMESTAMP_description.sql` in the `server/` directory:

```sql
-- Migration: add_new_feature
-- Description: Adds a new feature table

CREATE TABLE IF NOT EXISTS new_feature (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

## Migration Execution

Migrations are automatically executed when:
- Server starts (`npm run dev` or `npm start`)
- The `migrations` table tracks which migrations have been applied
- Only new/unapplied migrations are executed

## Manual Migration (if needed)

```bash
cd server
npm run migrate
```

## Migration Tracking

The system uses a `migrations` table to track applied migrations:

```sql
SELECT * FROM migrations ORDER BY applied_at DESC;
```

## Best Practices

1. **Always test migrations** on a development database first
2. **Use IF NOT EXISTS** for CREATE statements to make migrations idempotent
3. **Use IF EXISTS** for DROP statements
4. **Add comments** explaining what the migration does
5. **Keep migrations small** - one logical change per migration
6. **Never modify** an already-applied migration file

## Example Migration

```sql
-- Migration: add_team_column
-- Description: Adds team column to captains table

ALTER TABLE captains 
ADD COLUMN IF NOT EXISTS team VARCHAR(255) NOT NULL DEFAULT '' AFTER location;
```

## Troubleshooting

### Migration fails on startup
- Check the error message in the console
- Verify SQL syntax is correct
- Check if the migration conflicts with existing data

### Need to reset migrations
```sql
-- WARNING: This will mark all migrations as unapplied
TRUNCATE TABLE migrations;
```

### Check migration status
```sql
SELECT name, applied_at FROM migrations ORDER BY applied_at DESC;
```

