import { query } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create migrations table if it doesn't exist
async function ensureMigrationsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (err) {
    console.error('Failed to create migrations table:', err);
    throw err;
  }
}

// Get list of applied migrations
async function getAppliedMigrations() {
  try {
    const rows = await query('SELECT name FROM migrations ORDER BY applied_at ASC');
    return rows.map(row => row.name);
  } catch (err) {
    console.error('Failed to get applied migrations:', err);
    return [];
  }
}

// Mark migration as applied
async function markMigrationApplied(name) {
  try {
    await query('INSERT INTO migrations (name) VALUES (?)', [name]);
  } catch (err) {
    // Ignore duplicate key errors
    if (err.code !== 'ER_DUP_ENTRY') {
      console.error(`Failed to mark migration ${name} as applied:`, err);
      throw err;
    }
  }
}

// Load and execute SQL file
async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await query(statement);
        } catch (err) {
          // Ignore "table already exists" and "duplicate key" errors for CREATE TABLE
          if (
            err.code !== 'ER_TABLE_EXISTS_ERROR' &&
            err.code !== 'ER_DUP_ENTRY' &&
            !err.message.includes('Duplicate column name') &&
            !err.message.includes('Duplicate key name')
          ) {
            console.warn(`Warning executing statement: ${statement.substring(0, 50)}...`);
            console.warn(`Error: ${err.message}`);
            // Continue with other statements
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.error(`Failed to execute SQL file ${filePath}:`, err);
    throw err;
  }
}

// Run all pending migrations
async function runMigrationsMain() {
  try {
    console.log('Checking database migrations...');
    
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`Found ${appliedMigrations.length} applied migration(s)`);
    
    // Get schema file
    const schemaPath = path.join(__dirname, '..', '..', 'schema_normalized.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.warn('Schema file not found:', schemaPath);
      return;
    }
    
    const schemaName = 'schema_normalized.sql';
    
    // Check if all required tables exist
    const requiredTables = [
      'users', 'captains', 'captain_personal_identity', 'captain_professional_info',
      'vessel_types', 'captain_vessel_types', 'captain_medical_info', 'captain_expiry_dates',
      'document_types', 'captain_documents', 'document_history', 'certificates',
      'sea_service_history', 'skills', 'captain_skills', 'migrations'
    ];
    
    const existingTables = await query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    const existingTableNames = existingTables.map(t => t.TABLE_NAME);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));
    
    // Check if schema has been applied
    if (!appliedMigrations.includes(schemaName) || missingTables.length > 0) {
      if (missingTables.length > 0) {
        console.log(`Missing ${missingTables.length} table(s): ${missingTables.join(', ')}`);
        console.log('Reapplying complete schema to create missing tables...');
      } else {
        console.log('Applying complete schema (schema_normalized.sql)...');
      }
      console.log('This will create all 16 tables including:');
      console.log('- Core tables (users, captains, etc.)');
      console.log('- Document tables (document_types, captain_documents, document_history)');
      console.log('- Additional tables (certificates, sea_service_history, skills, etc.)');
      await executeSQLFile(schemaPath);
      if (!appliedMigrations.includes(schemaName)) {
        await markMigrationApplied(schemaName);
      }
      console.log('Complete schema applied successfully!');
      console.log('All 16 tables should now exist in your database');
    } else {
      console.log('Schema is up to date - all tables exist');
    }
    
    // Always check for additional migration files (even if schema was already applied)
    const migrationsDir = path.join(__dirname, '..', '..');
    const allFiles = fs.readdirSync(migrationsDir);
    const migrationFiles = allFiles
      .filter(file => file.startsWith('migration_') && file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length > 0) {
      console.log(`Found ${migrationFiles.length} migration file(s): ${migrationFiles.join(', ')}`);
    }
    
    let newMigrationsApplied = 0;
    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        console.log(`Applying migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        await executeSQLFile(filePath);
        await markMigrationApplied(file);
        console.log(`Migration ${file} applied successfully!`);
        newMigrationsApplied++;
      } else {
        console.log(`Migration ${file} already applied (skipping)`);
      }
    }
    
    if (newMigrationsApplied === 0) {
      console.log('All migrations are up to date');
    } else {
      console.log(`Applied ${newMigrationsApplied} new migration(s)!`);
    }
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}

// Export for use in app.js
export async function runMigrations() {
  return runMigrationsMain();
}

// Run if called directly (check if this file is the main module)
// Simple check: if process.argv[1] contains 'migrate.js', we're running directly
if (process.argv[1] && process.argv[1].includes('migrate.js')) {
  runMigrationsMain()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration script failed:', err);
      process.exit(1);
    });
}

