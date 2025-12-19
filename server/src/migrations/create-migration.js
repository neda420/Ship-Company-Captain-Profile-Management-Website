import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get user input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Create a new migration file
async function createMigration() {
  const migrationName = await askQuestion('Enter migration name (e.g., add_new_column): ');
  
  if (!migrationName || !migrationName.trim()) {
    console.error('Migration name is required');
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `migration_${timestamp}_${migrationName}.sql`;
  const filePath = path.join(__dirname, '..', '..', fileName);
  
  const template = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}
-- Description: [Describe what this migration does]

-- Example: Add a new column
-- ALTER TABLE captains ADD COLUMN new_field VARCHAR(255) NULL;

-- Example: Create a new table
-- CREATE TABLE IF NOT EXISTS new_table (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(255) NOT NULL
-- ) ENGINE=InnoDB;

-- Write your migration SQL below:

`;

  fs.writeFileSync(filePath, template);
  console.log(`Migration file created: ${fileName}`);
  console.log(`Edit the file to add your migration SQL`);
}

// Run if called directly
const isMainModule = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith(__filename.replace(/\\/g, '/'));

if (isMainModule) {
  createMigration().catch(console.error);
}

export { createMigration };

