import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { generateToken, authRequired } from '../middleware/auth.js';

const router = express.Router();
const SETUP_ROUTES_ENABLED = process.env.ENABLE_SETUP_ROUTES === 'true';
const SETUP_ADMIN_TOKEN = process.env.SETUP_ADMIN_TOKEN || '';

function setupOnly(req, res, next) {
  if (!SETUP_ROUTES_ENABLED) {
    return res.status(404).json({ message: 'Route not found' });
  }

  const setupToken =
    req.get('x-setup-token') ||
    req.body?.setupToken ||
    req.query?.setupToken;

  if (!setupToken || setupToken !== SETUP_ADMIN_TOKEN) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
}

// GET /api/auth/verify - Verify if token is valid and return current user
router.get('/verify', authRequired, async (req, res) => {
  try {
    // User is already verified by authRequired middleware
    const userId = req.user.id;

    const rows = await query(
      'SELECT id, username, email, full_name, role, permissions_json, is_active FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const user = rows[0];
    return res.json({
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        permissions: JSON.parse(user.permissions_json || '[]')
      }
    });
  } catch (err) {
    console.error('[VERIFY] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Case-insensitive username lookup
    const rows = await query(
      'SELECT id, username, password_hash, email, full_name, role, permissions_json, is_active FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [username]
    );

    console.log('[LOGIN] Attempt:', { username, found: rows.length > 0 });

    if (rows.length === 0) {
      console.log('[LOGIN] User not found:', username);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    console.log('[LOGIN] User found:', { id: user.id, username: user.username, is_active: user.is_active });

    if (!user.is_active) {
      return res.status(403).json({ message: 'User is inactive' });
    }

    // Check if password_hash looks like a bcrypt hash
    if (!user.password_hash || !user.password_hash.startsWith('$2')) {
      console.error('[LOGIN] Invalid password_hash format for user:', user.username);
      return res.status(500).json({ message: 'Server error: Invalid password format' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('[LOGIN] Password match:', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = generateToken(user);

    // Update last_login
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        permissions: JSON.parse(user.permissions_json || '[]')
      }
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Helper used by both GET and POST /api/auth/create-admin
async function handleCreateAdmin(req, res) {
  const { username, password, email } = req.body || {};

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'username, password and email are required' });
  }

  if (String(password).length < 12) {
    return res.status(400).json({ message: 'password must be at least 12 characters' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const permissions = [
      'view_dashboard',
      'view_employees',
      'edit_employees',
      'view_documents',
      'manage_documents',
      'view_settings',
      'manage_users',
      'manage_settings'
    ];

    await query(
      `INSERT INTO users (username, password_hash, email, full_name, role, permissions_json, is_active)
       VALUES (?, ?, ?, ?, 'admin', ?, 1)`,
      [username, passwordHash, email, 'Admin', JSON.stringify(permissions)]
    );

    return res.status(201).json({ message: 'Admin user created', username });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/create-admin  (setup-only helper)
router.post('/create-admin', setupOnly, handleCreateAdmin);

// POST /api/auth/change-password - Change user password
router.post('/change-password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }

  try {
    // Get current user
    const rows = await query(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Verify current password
    if (!user.password_hash || !user.password_hash.startsWith('$2')) {
      return res.status(500).json({ message: 'Server error: Invalid password format' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[CHANGE PASSWORD] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/fix-db-schema', setupOnly, async (req, res) => {
  try {
    // 1. Create document_types
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

    // 2. Insert Defaults
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
      ['seamanDischargeBookScans', 'Seaman\'s Discharge Book Scans', 'other', 0, null, 0, 16],
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

    // 3. Create captain_documents
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

    return res.json({ message: 'DB Fixed Successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;

