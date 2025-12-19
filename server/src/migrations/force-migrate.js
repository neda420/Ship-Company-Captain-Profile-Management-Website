import { query } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force apply the missing tables migration
async function forceApplyMigration() {
  try {
    console.log('🔄 Force applying migration_add_missing_tables.sql...');
    
    const migrationFile = path.join(__dirname, '..', '..', 'migration_add_missing_tables.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error('❌ Migration file not found:', migrationFile);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        if (s.length === 0) return false;
        if (s.startsWith('--')) return false;
        if (s.startsWith('/*')) return false;
        return true;
      });

    console.log(`📦 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          await query(statement);
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        } catch (err) {
          if (
            err.code === 'ER_TABLE_EXISTS_ERROR' ||
            err.message.includes('already exists') ||
            err.message.includes('Duplicate')
          ) {
            console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`   ❌ Statement ${i + 1} failed:`, err.message);
            console.error(`   SQL: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
    
    // Mark as applied
    try {
      await query('INSERT INTO migrations (name) VALUES (?)', ['migration_add_missing_tables.sql']);
      console.log('✅ Migration marked as applied');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  Migration already marked as applied');
      } else {
        console.warn('⚠️  Could not mark migration as applied:', err.message);
      }
    }
    
    console.log('✅ Force migration completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Force migration failed:', err);
    process.exit(1);
  }
}

forceApplyMigration();

