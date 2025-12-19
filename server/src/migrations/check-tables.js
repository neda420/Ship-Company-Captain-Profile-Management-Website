import { query } from '../db.js';

// Check which tables exist in the database
async function checkTables() {
  try {
    const tables = await query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    
    console.log('\nDatabase Tables:');
    console.log('='.repeat(50));
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.TABLE_NAME}`);
    });
    console.log('='.repeat(50));
    console.log(`\nTotal: ${tables.length} table(s)\n`);
    
    // Expected tables
    const expectedTables = [
      'users',
      'captains',
      'captain_personal_identity',
      'captain_professional_info',
      'vessel_types',
      'captain_vessel_types',
      'captain_medical_info',
      'captain_expiry_dates',
      'document_types',
      'captain_documents',
      'document_history',
      'certificates',
      'sea_service_history',
      'skills',
      'captain_skills',
      'migrations'
    ];
    
    const existingTableNames = tables.map(t => t.TABLE_NAME);
    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log('Missing tables:');
      missingTables.forEach(table => console.log(`   - ${table}`));
    } else {
      console.log('All expected tables are present!');
    }
    
    return tables;
  } catch (err) {
    console.error('Failed to check tables:', err);
    throw err;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkTables()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

export { checkTables };

