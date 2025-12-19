import mysql from 'mysql2/promise';

async function fixDatabase() {
    console.log('Starting Database Fix...');

    // Standalone connection setup using defaults from db.js
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'global shipping company',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    const query = async (sql, params) => {
        try {
            const [result] = await pool.execute(sql, params);
            return result;
        } catch (err) {
            console.error('[DB Error]', err.message);
            throw err;
        }
    };

    try {
        // 1. Create document_types table
        console.log('Creating document_types table...');
        await query(`
      CREATE TABLE IF NOT EXISTS document_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doc_key VARCHAR(100) NOT NULL UNIQUE,
        label VARCHAR(255) NOT NULL,
        category ENUM('important', 'other') NOT NULL DEFAULT 'other',
        requires_expiry_date TINYINT(1) DEFAULT 0,
        expiry_date_field VARCHAR(100) NULL,
        is_required TINYINT(1) DEFAULT 0,
        description TEXT NULL,
        display_order INT DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_doc_key (doc_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // 2. Insert Default Document Types
        console.log('Inserting default document types...');
        const docTypes = [
            ['passportScan', 'Passport Scan', 'important', 1, 'passportExpiryDate', 1, 1],
            ['visaDocument', 'Visa Document', 'other', 1, 'visaExpiryDate', 0, 2],
            ['passportPhoto', 'Passport Photo', 'important', 0, null, 1, 3],
            ['certificateOfCompetency', 'Certificate of Competency (CoC)', 'important', 1, 'cocExpiryDate', 1, 4],
            ['flagStateEndorsement', 'Flag State Endorsement', 'important', 1, 'flagStateEndorsementExpiryDate', 1, 5],
            ['gmdssCertificate', 'GMDSS Certificate', 'important', 0, null, 1, 6],
            ['basicSafetyTrainingCertificate', 'Basic Safety Training Certificate', 'other', 0, null, 0, 7],
            ['advancedFireFightingCertificate', 'Advanced Fire Fighting Certificate', 'other', 0, null, 0, 8],
            ['medicalCareOnboardCertificate', 'Medical Care Onboard Certificate', 'other', 0, null, 0, 9],
            ['shipSecurityOfficerCertificate', 'Ship Security Officer Certificate', 'other', 0, null, 0, 10],
            ['ecdisCertificate', 'ECDIS Certificate', 'important', 0, null, 1, 11],
            ['bridgeResourceManagementCertificate', 'Bridge Resource Management Certificate', 'other', 0, null, 0, 12],
            ['medicalCertificateENG1', 'Medical Certificate (ENG1)', 'important', 1, 'medicalCertificateExpiryDate', 1, 13],
            ['drugAlcoholTestResults', 'Drug & Alcohol Test Results', 'other', 0, null, 0, 14],
            ['vaccinationRecord', 'Vaccination Record', 'other', 0, null, 0, 15],
            ['seamanDischargeBookScans', 'Seaman\\'s Discharge Book Scans', 'other', 0, null, 0, 16],
            ['referenceLetters', 'Reference Letters', 'other', 0, null, 0, 17],
                ['currentCVResume', 'Current CV / Resume', 'important', 0, null, 1, 18],
                ['employmentContractSEA', 'Employment Contract (SEA)', 'important', 0, null, 1, 19],
                ['signedCodeOfConduct', 'Signed Code of Conduct', 'other', 0, null, 0, 20],
                ['signedNDA', 'Signed NDA', 'other', 0, null, 0, 21]
            ];

        for (const doc of docTypes) {
            await query(`
        INSERT INTO document_types 
        (doc_key, label, category, requires_expiry_date, expiry_date_field, is_required, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE label=VALUES(label)
      `, doc);
        }

        // 3. Create captain_documents table
        console.log('Creating captain_documents table...');
        await query(`
      CREATE TABLE IF NOT EXISTS captain_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        captain_id INT NOT NULL,
        document_type_id INT NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NULL,
        file_type VARCHAR(50) NULL,
        uploaded_by INT NULL,
        uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
        version INT DEFAULT 1,
        is_active TINYINT(1) DEFAULT 1,
        notes TEXT NULL,
        UNIQUE KEY unique_captain_document_type (captain_id, document_type_id),
        CONSTRAINT fk_cd_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE,
        CONSTRAINT fk_cd_document_type FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE RESTRICT,
        CONSTRAINT fk_cd_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_captain_id (captain_id),
        INDEX idx_document_type_id (document_type_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        console.log('Database Fix Complete!');
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('Database Fix Failed:', err);
        await pool.end();
        process.exit(1);
    }
}

fixDatabase();
