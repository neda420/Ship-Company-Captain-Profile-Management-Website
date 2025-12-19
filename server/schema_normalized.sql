-- Fully Normalized Relational Database Schema for "global shipping company"
-- In phpMyAdmin or MySQL client, run:
--   CREATE DATABASE `global shipping company` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE `global shipping company`;

-- Disable foreign key checks temporarily to allow creation in any order
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  permissions_json JSON NULL,
  avatar_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CAPTAINS TABLE (Main entity)
-- ============================================
CREATE TABLE IF NOT EXISTS captains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255) NULL,
  status ENUM('Active','Onboard','On Leave','Available') NOT NULL DEFAULT 'Available',
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  team VARCHAR(255) NOT NULL,
  linked_in_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_team (team),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CAPTAIN PERSONAL IDENTITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS captain_personal_identity (
  captain_id INT PRIMARY KEY,
  full_legal_name VARCHAR(255),
  date_of_birth DATE,
  place_of_birth VARCHAR(255),
  nationality VARCHAR(100),
  permanent_home_address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_relationship VARCHAR(100),
  emergency_contact_phone VARCHAR(100),
  emergency_contact_email VARCHAR(255),
  shirt_size VARCHAR(20),
  pant_size VARCHAR(20),
  shoe_size VARCHAR(20),
  hat_size VARCHAR(20),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ci_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CAPTAIN PROFESSIONAL INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS captain_professional_info (
  captain_id INT PRIMARY KEY,
  coc_number VARCHAR(100),
  issuing_country VARCHAR(100),
  capacity VARCHAR(100),
  license_limitations VARCHAR(255),
  total_sea_time VARCHAR(100),
  time_in_rank VARCHAR(100),
  bank_iban VARCHAR(100),
  bank_swift VARCHAR(100),
  currency_preference VARCHAR(20),
  nearest_airport VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pi_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VESSEL TYPES TABLE (Normalized)
-- ============================================
CREATE TABLE IF NOT EXISTS vessel_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CAPTAIN VESSEL TYPES (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS captain_vessel_types (
  captain_id INT NOT NULL,
  vessel_type_id INT NOT NULL,
  PRIMARY KEY (captain_id, vessel_type_id),
  CONSTRAINT fk_cvt_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE,
  CONSTRAINT fk_cvt_vessel_type FOREIGN KEY (vessel_type_id) REFERENCES vessel_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CAPTAIN MEDICAL INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS captain_medical_info (
  captain_id INT PRIMARY KEY,
  blood_type VARCHAR(10),
  known_allergies TEXT,
  dietary_restrictions TEXT,
  corrective_lenses_required TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mi_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CAPTAIN EXPIRY DATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS captain_expiry_dates (
  captain_id INT PRIMARY KEY,
  passport_expiry_date DATE,
  visa_expiry_date DATE,
  coc_expiry_date DATE,
  flag_state_endorsement_expiry_date DATE,
  medical_certificate_expiry_date DATE,
  stcw_training_expiry_date DATE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ed_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DOCUMENT TYPES TABLE (Normalized)
-- ============================================
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

-- ============================================
-- CAPTAIN DOCUMENTS TABLE (Normalized with tracking)
-- ============================================
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
  -- Prevent duplicate document types per captain
  UNIQUE KEY unique_captain_document_type (captain_id, document_type_id),
  CONSTRAINT fk_cd_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE,
  CONSTRAINT fk_cd_document_type FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cd_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_captain_id (captain_id),
  INDEX idx_document_type_id (document_type_id),
  INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DOCUMENT HISTORY TABLE (Track document changes)
-- ============================================
CREATE TABLE IF NOT EXISTS document_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  captain_document_id INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NULL,
  version INT NOT NULL,
  uploaded_by INT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NULL,
  INDEX idx_captain_document_id (captain_document_id),
  INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CERTIFICATES TABLE (Normalized)
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  captain_id INT NOT NULL,
  certificate_name VARCHAR(255) NOT NULL,
  certificate_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  issuing_authority VARCHAR(255),
  file_url VARCHAR(500) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cert_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE,
  INDEX idx_captain_id (captain_id),
  INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEA SERVICE HISTORY TABLE (Normalized)
-- ============================================
CREATE TABLE IF NOT EXISTS sea_service_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  captain_id INT NOT NULL,
  vessel_name VARCHAR(255) NOT NULL,
  vessel_type VARCHAR(100),
  rank VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ssh_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE,
  INDEX idx_captain_id (captain_id),
  INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SKILLS TABLE (Normalized)
-- ============================================
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CAPTAIN SKILLS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS captain_skills (
  captain_id INT NOT NULL,
  skill_id INT NOT NULL,
  proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
  notes TEXT NULL,
  PRIMARY KEY (captain_id, skill_id),
  CONSTRAINT fk_cs_captain FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE CASCADE,
  CONSTRAINT fk_cs_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints to document_history table
-- (Done after table creation to avoid constraint errors)
-- Note: If you get "Duplicate key name" errors, the constraints already exist - that's okay!

-- Drop existing constraints if they exist (allows re-running the script safely)
SET FOREIGN_KEY_CHECKS = 0;

-- Drop fk_dh_captain_document if it exists
SET @constraint_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'document_history' 
    AND CONSTRAINT_NAME = 'fk_dh_captain_document'
);

SET @drop_sql = IF(@constraint_check > 0,
  'ALTER TABLE document_history DROP FOREIGN KEY fk_dh_captain_document',
  'SELECT 1'
);
PREPARE drop_stmt FROM @drop_sql;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;

-- Add fk_dh_captain_document constraint
ALTER TABLE document_history 
  ADD CONSTRAINT fk_dh_captain_document 
  FOREIGN KEY (captain_document_id) 
  REFERENCES captain_documents(id) 
  ON DELETE CASCADE;

-- Drop fk_dh_uploaded_by if it exists
SET @constraint_check2 = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'document_history' 
    AND CONSTRAINT_NAME = 'fk_dh_uploaded_by'
);

SET @drop_sql2 = IF(@constraint_check2 > 0,
  'ALTER TABLE document_history DROP FOREIGN KEY fk_dh_uploaded_by',
  'SELECT 1'
);
PREPARE drop_stmt2 FROM @drop_sql2;
EXECUTE drop_stmt2;
DEALLOCATE PREPARE drop_stmt2;

-- Add fk_dh_uploaded_by constraint
ALTER TABLE document_history 
  ADD CONSTRAINT fk_dh_uploaded_by 
  FOREIGN KEY (uploaded_by) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- ============================================
-- APPLICATION SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS application_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NULL,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT NULL,
  updated_by INT NULL,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key),
  CONSTRAINT fk_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert Default Application Settings
INSERT INTO application_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'Global Cargo Shipping Company', 'string', 'Company name displayed throughout the application'),
('company_email', 'admin@globalcargoshipping.com', 'string', 'Primary company email address'),
('timezone', 'UTC', 'string', 'Default timezone for the application'),
('language', 'en', 'string', 'Default language code'),
('date_format', 'MM/DD/YYYY', 'string', 'Default date format pattern')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
-- Insert Document Types
INSERT INTO document_types (doc_key, label, category, requires_expiry_date, expiry_date_field, is_required, display_order) VALUES
('passportScan', 'Passport Scan', 'important', 1, 'passportExpiryDate', 1, 1),
('visaDocument', 'Visa Document', 'other', 1, 'visaExpiryDate', 0, 2),
('passportPhoto', 'Passport Photo', 'important', 0, NULL, 1, 3),
('certificateOfCompetency', 'Certificate of Competency (CoC)', 'important', 1, 'cocExpiryDate', 1, 4),
('flagStateEndorsement', 'Flag State Endorsement', 'important', 1, 'flagStateEndorsementExpiryDate', 1, 5),
('gmdssCertificate', 'GMDSS Certificate', 'important', 0, NULL, 1, 6),
('basicSafetyTrainingCertificate', 'Basic Safety Training Certificate', 'other', 0, NULL, 0, 7),
('advancedFireFightingCertificate', 'Advanced Fire Fighting Certificate', 'other', 0, NULL, 0, 8),
('medicalCareOnboardCertificate', 'Medical Care Onboard Certificate', 'other', 0, NULL, 0, 9),
('shipSecurityOfficerCertificate', 'Ship Security Officer Certificate', 'other', 0, NULL, 0, 10),
('ecdisCertificate', 'ECDIS Certificate', 'important', 0, NULL, 1, 11),
('bridgeResourceManagementCertificate', 'Bridge Resource Management Certificate', 'other', 0, NULL, 0, 12),
('medicalCertificateENG1', 'Medical Certificate (ENG1)', 'important', 1, 'medicalCertificateExpiryDate', 1, 13),
('drugAlcoholTestResults', 'Drug & Alcohol Test Results', 'other', 0, NULL, 0, 14),
('vaccinationRecord', 'Vaccination Record', 'other', 0, NULL, 0, 15),
('seamanDischargeBookScans', 'Seaman''s Discharge Book Scans', 'other', 0, NULL, 0, 16), -- Fixed comma here
('referenceLetters', 'Reference Letters', 'other', 0, NULL, 0, 17),
('currentCVResume', 'Current CV / Resume', 'important', 0, NULL, 1, 18),
('employmentContractSEA', 'Employment Contract (SEA)', 'important', 0, NULL, 1, 19),
('signedCodeOfConduct', 'Signed Code of Conduct', 'other', 0, NULL, 0, 20),
('signedNDA', 'Signed NDA', 'other', 0, NULL, 0, 21)
ON DUPLICATE KEY UPDATE label=VALUES(label);

