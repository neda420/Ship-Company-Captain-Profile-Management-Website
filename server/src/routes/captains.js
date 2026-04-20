import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();
const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB || 10);
const MAX_UPLOAD_SIZE_BYTES = Number.isFinite(MAX_UPLOAD_SIZE_MB) && MAX_UPLOAD_SIZE_MB > 0
  ? MAX_UPLOAD_SIZE_MB * 1024 * 1024
  : 10 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']);
const ALLOWED_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

// Helpers for upload paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const avatarDir = path.join(uploadsDir, 'avatars');
const documentsDir = path.join(uploadsDir, 'documents');

for (const dir of [uploadsDir, avatarDir, documentsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'avatar') {
      cb(null, avatarDir);
    } else {
      cb(null, documentsDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext);
    const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'file';
    cb(null, `${safeBase}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedExtension = ALLOWED_FILE_EXTENSIONS.has(ext);
    const isAllowedMimeType = ALLOWED_FILE_MIME_TYPES.has((file.mimetype || '').toLowerCase());

    if (!isAllowedExtension || !isAllowedMimeType) {
      const error = new Error('Unsupported file type');
      error.status = 400;
      return cb(error);
    }

    return cb(null, true);
  }
});

// GET /api/captains
router.get('/', authRequired, async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.*, 
              ci.full_legal_name, ci.date_of_birth, ci.place_of_birth, ci.nationality,
              ci.permanent_home_address, ci.emergency_contact_name, ci.emergency_contact_relationship,
              ci.emergency_contact_phone, ci.emergency_contact_email,
              ci.shirt_size, ci.pant_size, ci.shoe_size, ci.hat_size,
              pi.coc_number, pi.issuing_country, pi.capacity, pi.license_limitations,
              pi.total_sea_time, pi.time_in_rank,
              pi.bank_iban, pi.bank_swift, pi.currency_preference, pi.nearest_airport,
              mi.blood_type, mi.known_allergies, mi.dietary_restrictions, mi.corrective_lenses_required,
              ed.passport_expiry_date, ed.visa_expiry_date, ed.coc_expiry_date,
              ed.flag_state_endorsement_expiry_date, ed.medical_certificate_expiry_date,
              ed.stcw_training_expiry_date
       FROM captains c
       LEFT JOIN captain_personal_identity ci ON ci.captain_id = c.id
       LEFT JOIN captain_professional_info pi ON pi.captain_id = c.id
       LEFT JOIN captain_medical_info mi ON mi.captain_id = c.id
       LEFT JOIN captain_expiry_dates ed ON ed.captain_id = c.id
       ORDER BY c.id DESC`
    );

    // Get documents and vessel types for each captain and transform to frontend format
    const captainsWithDocs = await Promise.all(rows.map(async (captain) => {
      const docs = await query(
        `SELECT dt.doc_key, cd.file_url, cd.file_name, cd.uploaded_at, cd.version
         FROM captain_documents cd
         INNER JOIN document_types dt ON cd.document_type_id = dt.id
         WHERE cd.captain_id = ? AND cd.is_active = 1`,
        [captain.id]
      );
      const documents = {};
      docs.forEach(doc => {
        documents[doc.doc_key] = doc.file_url;
      });

      // Get vessel types from normalized table
      const vesselTypes = await query(
        `SELECT vt.name
         FROM captain_vessel_types cvt
         INNER JOIN vessel_types vt ON cvt.vessel_type_id = vt.id
         WHERE cvt.captain_id = ?`,
        [captain.id]
      );
      const vesselTypesFlown = vesselTypes.map(vt => vt.name);

      // Get certificates
      const certificates = await query(
        'SELECT certificate_name AS certificateName, certificate_number AS certificateNumber, issue_date AS issueDate, expiry_date AS expiryDate, issuing_authority AS issuingAuthority FROM certificates WHERE captain_id = ?',
        [captain.id]
      );

      // Get sea service
      const seaService = await query(
        'SELECT vessel_name AS vesselName, vessel_type AS vesselType, rank, start_date AS startDate, end_date AS endDate FROM sea_service_history WHERE captain_id = ?',
        [captain.id]
      );

      // Get skills
      const skills = await query(
        `SELECT s.name, cs.proficiency_level AS proficiencyLevel 
         FROM captain_skills cs
         JOIN skills s ON cs.skill_id = s.id
         WHERE cs.captain_id = ?`,
        [captain.id]
      );

      // Transform database fields to frontend format
      return {
        id: String(captain.id),
        fullName: captain.full_name,
        title: captain.title,
        avatarUrl: captain.avatar_url || '',
        status: captain.status,
        email: captain.email,
        phone: captain.phone || '',
        location: captain.location || '',
        team: captain.team || '',
        linkedInUrl: captain.linked_in_url || '',
        personalIdentity: {
          fullLegalName: captain.full_legal_name || '',
          dateOfBirth: captain.date_of_birth || '',
          placeOfBirth: captain.place_of_birth || '',
          nationality: captain.nationality || '',
          permanentHomeAddress: captain.permanent_home_address || '',
          emergencyContactName: captain.emergency_contact_name || '',
          emergencyContactRelationship: captain.emergency_contact_relationship || '',
          emergencyContactPhoneNumber: captain.emergency_contact_phone || '',
          emergencyContactEmail: captain.emergency_contact_email || '',
          shirtSize: captain.shirt_size || '',
          pantSize: captain.pant_size || '',
          shoeSize: captain.shoe_size || '',
          hatSize: captain.hat_size || '',
        },
        professionalInfo: {
          cocNumber: captain.coc_number || '',
          issuingCountry: captain.issuing_country || '',
          capacity: captain.capacity || '',
          licenseLimitations: captain.license_limitations || '',
          totalSeaTime: captain.total_sea_time || '',
          timeInRank: captain.time_in_rank || '',
          vesselTypesFlown: vesselTypesFlown,
          bankIBAN: captain.bank_iban || '',
          bankSWIFT: captain.bank_swift || '',
          currencyPreference: captain.currency_preference || '',
          nearestAirport: captain.nearest_airport || '',
        },
        medicalInfo: {
          bloodType: captain.blood_type || '',
          knownAllergies: captain.known_allergies || '',
          dietaryRestrictions: captain.dietary_restrictions || '',
          correctiveLensesRequired: captain.corrective_lenses_required === 1,
        },
        expiryDates: {
          passportExpiryDate: captain.passport_expiry_date || '',
          visaExpiryDate: captain.visa_expiry_date || '',
          cocExpiryDate: captain.coc_expiry_date || '',
          flagStateEndorsementExpiryDate: captain.flag_state_endorsement_expiry_date || '',
          medicalCertificateExpiryDate: captain.medical_certificate_expiry_date || '',
          stcwTrainingExpiryDate: captain.stcw_training_expiry_date || '',
        },
        documents,
        certificates,
        seaServiceHistory: seaService,
        skills,
      };
    }));

    return res.json(captainsWithDocs);
  } catch (err) {
    console.error('[GET /captains] Error:', err);
    console.error('[GET /captains] Error stack:', err.stack);

    const errorResponse = {
      message: 'Server error',
      error: err.message,
    };

    if (err.code) errorResponse.code = err.code;
    if (err.sqlState) errorResponse.sqlState = err.sqlState;
    if (err.sqlMessage) errorResponse.sqlMessage = err.sqlMessage;
    if (err.errno) errorResponse.errno = err.errno;

    return res.status(500).json(errorResponse);
  }
});

// GET /api/captains/:id
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query('SELECT * FROM captains WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Captain not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('[GET /captains] Error:', err);
    console.error('[GET /captains] Error stack:', err.stack);

    const errorResponse = {
      message: 'Server error',
      error: err.message,
    };

    if (err.code) errorResponse.code = err.code;
    if (err.sqlState) errorResponse.sqlState = err.sqlState;
    if (err.sqlMessage) errorResponse.sqlMessage = err.sqlMessage;
    if (err.errno) errorResponse.errno = err.errno;

    return res.status(500).json(errorResponse);
  }
});

// POST /api/captains
router.post('/', authRequired, async (req, res) => {
  const {
    fullName,
    title,
    avatarUrl,
    status,
    email,
    phone,
    location,
    team,
    linkedInUrl,
    personalIdentity,
    professionalInfo,
    medicalInfo,
    expiryDates,
    // New fields
    seaService,
    certificates,
    skills,
    documents // Allow documents metadata if passed directly (optional)
  } = req.body;

  if (!fullName || !title || !email || !team) {
    return res.status(400).json({ message: 'fullName, title, email, and team are required' });
  }

  try {
    // Insert main captain record
    const result = await query(
      `INSERT INTO captains (full_name, title, avatar_url, status, email, phone, location, team, linked_in_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullName, title, avatarUrl || null, status || 'Available', email, phone || '', location || '', team, linkedInUrl || null]
    );

    // Get insertId from result
    const captainId = result.insertId;

    if (!captainId) {
      console.error('[POST /captains] No insertId returned from query:', result);
      return res.status(500).json({ message: 'Failed to create captain record' });
    }

    // Insert personal identity
    if (personalIdentity) {
      await query(
        `INSERT INTO captain_personal_identity 
         (captain_id, full_legal_name, date_of_birth, place_of_birth, nationality, permanent_home_address,
          emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_email,
          shirt_size, pant_size, shoe_size, hat_size)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         full_legal_name = VALUES(full_legal_name),
         date_of_birth = VALUES(date_of_birth),
         place_of_birth = VALUES(place_of_birth),
         nationality = VALUES(nationality),
         permanent_home_address = VALUES(permanent_home_address),
         emergency_contact_name = VALUES(emergency_contact_name),
         emergency_contact_relationship = VALUES(emergency_contact_relationship),
         emergency_contact_phone = VALUES(emergency_contact_phone),
         emergency_contact_email = VALUES(emergency_contact_email),
         shirt_size = VALUES(shirt_size),
         pant_size = VALUES(pant_size),
         shoe_size = VALUES(shoe_size),
         hat_size = VALUES(hat_size)`,
        [captainId, personalIdentity.fullLegalName || null, personalIdentity.dateOfBirth || null,
          personalIdentity.placeOfBirth || null, personalIdentity.nationality || null,
          personalIdentity.permanentHomeAddress || null, personalIdentity.emergencyContactName || null,
          personalIdentity.emergencyContactRelationship || null, personalIdentity.emergencyContactPhoneNumber || null,
          personalIdentity.emergencyContactEmail || null, personalIdentity.shirtSize || null,
          personalIdentity.pantSize || null, personalIdentity.shoeSize || null, personalIdentity.hatSize || null]
      );
    }

    // Insert professional info
    if (professionalInfo) {
      await query(
        `INSERT INTO captain_professional_info 
         (captain_id, coc_number, issuing_country, capacity, license_limitations, total_sea_time,
          time_in_rank, bank_iban, bank_swift, currency_preference, nearest_airport)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         coc_number = VALUES(coc_number),
         issuing_country = VALUES(issuing_country),
         capacity = VALUES(capacity),
         license_limitations = VALUES(license_limitations),
         total_sea_time = VALUES(total_sea_time),
         time_in_rank = VALUES(time_in_rank),
         bank_iban = VALUES(bank_iban),
         bank_swift = VALUES(bank_swift),
         currency_preference = VALUES(currency_preference),
         nearest_airport = VALUES(nearest_airport)`,
        [captainId, professionalInfo.cocNumber || null, professionalInfo.issuingCountry || null,
          professionalInfo.capacity || null, professionalInfo.licenseLimitations || null,
          professionalInfo.totalSeaTime || null, professionalInfo.timeInRank || null,
          professionalInfo.bankIBAN || null, professionalInfo.bankSWIFT || null,
          professionalInfo.currencyPreference || null, professionalInfo.nearestAirport || null]
      );

      // Handle vessel types (normalized structure)
      if (professionalInfo.vesselTypesFlown && Array.isArray(professionalInfo.vesselTypesFlown)) {
        // Delete existing vessel types for this captain
        await query('DELETE FROM captain_vessel_types WHERE captain_id = ?', [captainId]);

        // Insert new vessel types
        for (const vesselTypeName of professionalInfo.vesselTypesFlown) {
          if (vesselTypeName && vesselTypeName.trim()) {
            // Get or create vessel type
            let vesselTypeRows = await query('SELECT id FROM vessel_types WHERE name = ?', [vesselTypeName.trim()]);
            let vesselTypeId;

            if (vesselTypeRows.length === 0) {
              // Create new vessel type
              const insertResult = await query('INSERT INTO vessel_types (name) VALUES (?)', [vesselTypeName.trim()]);
              vesselTypeId = insertResult.insertId;
            } else {
              vesselTypeId = vesselTypeRows[0].id;
            }

            // Link captain to vessel type
            await query(
              'INSERT INTO captain_vessel_types (captain_id, vessel_type_id) VALUES (?, ?)',
              [captainId, vesselTypeId]
            );
          }
        }
      }
    }

    // Insert medical info
    if (medicalInfo) {
      await query(
        `INSERT INTO captain_medical_info 
         (captain_id, blood_type, known_allergies, dietary_restrictions, corrective_lenses_required)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         blood_type = VALUES(blood_type),
         known_allergies = VALUES(known_allergies),
         dietary_restrictions = VALUES(dietary_restrictions),
         corrective_lenses_required = VALUES(corrective_lenses_required)`,
        [captainId, medicalInfo.bloodType || null, medicalInfo.knownAllergies || null,
          medicalInfo.dietaryRestrictions || null, medicalInfo.correctiveLensesRequired ? 1 : 0]
      );
    }



    // Insert certificates
    if (certificates && Array.isArray(certificates)) {
      for (const cert of certificates) {
        await query(
          `INSERT INTO certificates (captain_id, certificate_name, certificate_number, issue_date, expiry_date, issuing_authority)
                 VALUES (?, ?, ?, ?, ?, ?)`,
          [captainId, cert.certificateName, cert.certificateNumber || null, cert.issueDate || null, cert.expiryDate || null, cert.issuingAuthority || null]
        );
      }
    }

    // Insert sea service history
    if (seaService && Array.isArray(seaService)) {
      for (const service of seaService) {
        await query(
          `INSERT INTO sea_service_history (captain_id, vessel_name, vessel_type, rank, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?)`,
          [captainId, service.vesselName, service.vesselType || null, service.rank || null, service.startDate, service.endDate || null]
        );
      }
    }

    // Insert skills
    if (skills && Array.isArray(skills)) {
      for (const skill of skills) {
        // Get or create skill
        let skillRows = await query('SELECT id FROM skills WHERE name = ?', [skill.name.trim()]);
        let skillId;

        if (skillRows.length === 0) {
          const insertResult = await query('INSERT INTO skills (name) VALUES (?)', [skill.name.trim()]);
          skillId = insertResult.insertId;
        } else {
          skillId = skillRows[0].id;
        }

        // Link captain to skill
        await query(
          'INSERT INTO captain_skills (captain_id, skill_id, proficiency_level) VALUES (?, ?, ?)',
          [captainId, skillId, skill.proficiencyLevel || 'Intermediate']
        );
      }
    }

    // Insert expiry dates
    if (expiryDates) {
      await query(
        `INSERT INTO captain_expiry_dates 
         (captain_id, passport_expiry_date, visa_expiry_date, coc_expiry_date,
          flag_state_endorsement_expiry_date, medical_certificate_expiry_date, stcw_training_expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         passport_expiry_date = VALUES(passport_expiry_date),
         visa_expiry_date = VALUES(visa_expiry_date),
         coc_expiry_date = VALUES(coc_expiry_date),
         flag_state_endorsement_expiry_date = VALUES(flag_state_endorsement_expiry_date),
         medical_certificate_expiry_date = VALUES(medical_certificate_expiry_date),
         stcw_training_expiry_date = VALUES(stcw_training_expiry_date)`,
        [captainId, expiryDates.passportExpiryDate || null, expiryDates.visaExpiryDate || null,
          expiryDates.cocExpiryDate || null, expiryDates.flagStateEndorsementExpiryDate || null,
          expiryDates.medicalCertificateExpiryDate || null, expiryDates.stcwTrainingExpiryDate || null]
      );
    }

    const inserted = await query('SELECT * FROM captains WHERE id = ?', [captainId]);
    return res.status(201).json({ id: captainId, ...inserted[0] });
  } catch (err) {
    console.error('[POST /captains] Error:', err);
    console.error('[POST /captains] Error stack:', err.stack);
    console.error('[POST /captains] Request body:', JSON.stringify(req.body, null, 2));

    // Return detailed error information
    const errorResponse = {
      message: 'Server error',
      error: err.message,
    };

    // Add SQL-specific error details if available
    if (err.code) errorResponse.code = err.code;
    if (err.sqlState) errorResponse.sqlState = err.sqlState;
    if (err.sqlMessage) errorResponse.sqlMessage = err.sqlMessage;
    if (err.errno) errorResponse.errno = err.errno;

    return res.status(500).json(errorResponse);
  }
});

// PUT /api/captains/:id
router.put('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const {
    fullName,
    title,
    avatarUrl,
    status,
    email,
    phone,
    location,
    team,
    linkedInUrl,
    personalIdentity,
    professionalInfo,
    medicalInfo,
    expiryDates,

    // New fields
    seaService,
    certificates,
    skills
  } = req.body;

  try {
    // Update main captain record
    await query(
      `UPDATE captains
       SET full_name = ?, title = ?, avatar_url = ?, status = ?, email = ?, phone = ?, location = ?, team = ?, linked_in_url = ?
       WHERE id = ?`,
      [fullName, title, avatarUrl || null, status, email, phone || '', location || '', team || '', linkedInUrl || null, id]
    );

    // Update personal identity
    if (personalIdentity) {
      await query(
        `INSERT INTO captain_personal_identity 
         (captain_id, full_legal_name, date_of_birth, place_of_birth, nationality, permanent_home_address,
          emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_email,
          shirt_size, pant_size, shoe_size, hat_size)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         full_legal_name = VALUES(full_legal_name),
         date_of_birth = VALUES(date_of_birth),
         place_of_birth = VALUES(place_of_birth),
         nationality = VALUES(nationality),
         permanent_home_address = VALUES(permanent_home_address),
         emergency_contact_name = VALUES(emergency_contact_name),
         emergency_contact_relationship = VALUES(emergency_contact_relationship),
         emergency_contact_phone = VALUES(emergency_contact_phone),
         emergency_contact_email = VALUES(emergency_contact_email),
         shirt_size = VALUES(shirt_size),
         pant_size = VALUES(pant_size),
         shoe_size = VALUES(shoe_size),
         hat_size = VALUES(hat_size)`,
        [id, personalIdentity.fullLegalName || null, personalIdentity.dateOfBirth || null,
          personalIdentity.placeOfBirth || null, personalIdentity.nationality || null,
          personalIdentity.permanentHomeAddress || null, personalIdentity.emergencyContactName || null,
          personalIdentity.emergencyContactRelationship || null, personalIdentity.emergencyContactPhoneNumber || null,
          personalIdentity.emergencyContactEmail || null, personalIdentity.shirtSize || null,
          personalIdentity.pantSize || null, personalIdentity.shoeSize || null, personalIdentity.hatSize || null]
      );
    }

    // Update professional info
    if (professionalInfo) {
      await query(
        `INSERT INTO captain_professional_info 
         (captain_id, coc_number, issuing_country, capacity, license_limitations, total_sea_time,
          time_in_rank, bank_iban, bank_swift, currency_preference, nearest_airport)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         coc_number = VALUES(coc_number),
         issuing_country = VALUES(issuing_country),
         capacity = VALUES(capacity),
         license_limitations = VALUES(license_limitations),
         total_sea_time = VALUES(total_sea_time),
         time_in_rank = VALUES(time_in_rank),
         bank_iban = VALUES(bank_iban),
         bank_swift = VALUES(bank_swift),
         currency_preference = VALUES(currency_preference),
         nearest_airport = VALUES(nearest_airport)`,
        [id, professionalInfo.cocNumber || null, professionalInfo.issuingCountry || null,
          professionalInfo.capacity || null, professionalInfo.licenseLimitations || null,
          professionalInfo.totalSeaTime || null, professionalInfo.timeInRank || null,
          professionalInfo.bankIBAN || null, professionalInfo.bankSWIFT || null,
          professionalInfo.currencyPreference || null, professionalInfo.nearestAirport || null]
      );

      // Handle vessel types (normalized structure)
      if (professionalInfo.vesselTypesFlown && Array.isArray(professionalInfo.vesselTypesFlown)) {
        // Delete existing vessel types for this captain
        await query('DELETE FROM captain_vessel_types WHERE captain_id = ?', [id]);

        // Insert new vessel types
        for (const vesselTypeName of professionalInfo.vesselTypesFlown) {
          if (vesselTypeName && vesselTypeName.trim()) {
            // Get or create vessel type
            let vesselTypeRows = await query('SELECT id FROM vessel_types WHERE name = ?', [vesselTypeName.trim()]);
            let vesselTypeId;

            if (vesselTypeRows.length === 0) {
              // Create new vessel type
              const insertResult = await query('INSERT INTO vessel_types (name) VALUES (?)', [vesselTypeName.trim()]);
              vesselTypeId = insertResult.insertId;
            } else {
              vesselTypeId = vesselTypeRows[0].id;
            }

            // Link captain to vessel type
            await query(
              'INSERT INTO captain_vessel_types (captain_id, vessel_type_id) VALUES (?, ?)',
              [id, vesselTypeId]
            );
          }
        }
      }
    }

    // Update medical info
    if (medicalInfo) {
      await query(
        `INSERT INTO captain_medical_info 
         (captain_id, blood_type, known_allergies, dietary_restrictions, corrective_lenses_required)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         blood_type = VALUES(blood_type),
         known_allergies = VALUES(known_allergies),
         dietary_restrictions = VALUES(dietary_restrictions),
         corrective_lenses_required = VALUES(corrective_lenses_required)`,
        [id, medicalInfo.bloodType || null, medicalInfo.knownAllergies || null,
          medicalInfo.dietaryRestrictions || null, medicalInfo.correctiveLensesRequired ? 1 : 0]
      );
    }

    // Update expiry dates
    if (expiryDates) {
      await query(
        `INSERT INTO captain_expiry_dates 
         (captain_id, passport_expiry_date, visa_expiry_date, coc_expiry_date,
          flag_state_endorsement_expiry_date, medical_certificate_expiry_date, stcw_training_expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         passport_expiry_date = VALUES(passport_expiry_date),
         visa_expiry_date = VALUES(visa_expiry_date),
         coc_expiry_date = VALUES(coc_expiry_date),
         flag_state_endorsement_expiry_date = VALUES(flag_state_endorsement_expiry_date),
         medical_certificate_expiry_date = VALUES(medical_certificate_expiry_date),
         stcw_training_expiry_date = VALUES(stcw_training_expiry_date)`,
        [id, expiryDates.passportExpiryDate || null, expiryDates.visaExpiryDate || null,
          expiryDates.cocExpiryDate || null, expiryDates.flagStateEndorsementExpiryDate || null,
          expiryDates.medicalCertificateExpiryDate || null, expiryDates.stcwTrainingExpiryDate || null]
      );

    }

    // Update certificates (Replace all strategy for simplicity, or we'd need IDs)
    if (certificates && Array.isArray(certificates)) {
      await query('DELETE FROM certificates WHERE captain_id = ?', [id]);
      for (const cert of certificates) {
        await query(
          `INSERT INTO certificates (captain_id, certificate_name, certificate_number, issue_date, expiry_date, issuing_authority)
                 VALUES (?, ?, ?, ?, ?, ?)`,
          [id, cert.certificateName, cert.certificateNumber || null, cert.issueDate || null, cert.expiryDate || null, cert.issuingAuthority || null]
        );
      }
    }

    // Update sea service history (Replace all)
    if (seaService && Array.isArray(seaService)) {
      await query('DELETE FROM sea_service_history WHERE captain_id = ?', [id]);
      for (const service of seaService) {
        await query(
          `INSERT INTO sea_service_history (captain_id, vessel_name, vessel_type, rank, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?)`,
          [id, service.vesselName, service.vesselType || null, service.rank || null, service.startDate, service.endDate || null]
        );
      }
    }

    // Update skills (Replace all)
    if (skills && Array.isArray(skills)) {
      await query('DELETE FROM captain_skills WHERE captain_id = ?', [id]);
      for (const skill of skills) {
        let skillRows = await query('SELECT id FROM skills WHERE name = ?', [skill.name.trim()]);
        let skillId;
        if (skillRows.length === 0) {
          const insertResult = await query('INSERT INTO skills (name) VALUES (?)', [skill.name.trim()]);
          skillId = insertResult.insertId;
        } else {
          skillId = skillRows[0].id;
        }
        await query(
          'INSERT INTO captain_skills (captain_id, skill_id, proficiency_level) VALUES (?, ?, ?)',
          [id, skillId, skill.proficiencyLevel || 'Intermediate']
        );
      }
    }

    const updated = await query('SELECT * FROM captains WHERE id = ?', [id]);
    return res.json(updated[0]);
  } catch (err) {
    console.error('[PUT /captains/:id] Error:', err);
    console.error('[PUT /captains/:id] Error stack:', err.stack);
    console.error('[PUT /captains/:id] Request body:', JSON.stringify(req.body, null, 2));

    const errorResponse = {
      message: 'Server error',
      error: err.message,
    };

    if (err.code) errorResponse.code = err.code;
    if (err.sqlState) errorResponse.sqlState = err.sqlState;
    if (err.sqlMessage) errorResponse.sqlMessage = err.sqlMessage;
    if (err.errno) errorResponse.errno = err.errno;

    return res.status(500).json(errorResponse);
  }
});

// DELETE /api/captains/:id
router.delete('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM captains WHERE id = ?', [id]);
    return res.json({ message: 'Captain deleted' });
  } catch (err) {
    console.error('[DELETE /captains/:id] Error:', err);
    console.error('[DELETE /captains/:id] Error stack:', err.stack);

    const errorResponse = {
      message: 'Server error',
      error: err.message,
    };

    if (err.code) errorResponse.code = err.code;
    if (err.sqlState) errorResponse.sqlState = err.sqlState;
    if (err.sqlMessage) errorResponse.sqlMessage = err.sqlMessage;
    if (err.errno) errorResponse.errno = err.errno;

    return res.status(500).json(errorResponse);
  }
});

// POST /api/captains/:id/avatar  (upload profile picture)
router.post('/:id/avatar', authRequired, upload.single('avatar'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const relativePath = `/uploads/avatars/${req.file.filename}`;

  try {
    await query('UPDATE captains SET avatar_url = ? WHERE id = ?', [relativePath, id]);
    return res.json({ message: 'Avatar updated', avatarUrl: relativePath });
  } catch (err) {
    console.error('[POST /captains/:id/avatar] Error:', err);
    console.error('[POST /captains/:id/avatar] Error stack:', err.stack);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/captains/:id/documents  (upload a document for a captain)
router.post('/:id/documents', authRequired, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { docKey, replace } = req.body;
  const userId = req.user?.id; // From auth middleware

  if (!docKey) {
    return res.status(400).json({ message: 'docKey is required in body' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const relativePath = `/uploads/documents/${req.file.filename}`;

  try {
    // Get document type ID
    const docTypes = await query(
      'SELECT id FROM document_types WHERE doc_key = ?',
      [docKey]
    );

    if (docTypes.length === 0) {
      console.error('[POST /captains/:id/documents] Document type not found:', docKey);
      console.error('[POST /captains/:id/documents] Available document types:', await query('SELECT doc_key FROM document_types'));
      return res.status(400).json({
        message: `Invalid document type: ${docKey}. The document_types table may not be populated. Please run the schema file.`,
        docKey,
        error: 'DOCUMENT_TYPE_NOT_FOUND'
      });
    }

    const documentTypeId = docTypes[0].id;

    // Check if document already exists
    const existing = await query(
      'SELECT id, version FROM captain_documents WHERE captain_id = ? AND document_type_id = ? AND is_active = 1',
      [id, documentTypeId]
    );

    if (existing.length > 0 && !replace) {
      return res.status(409).json({
        message: 'Document of this type already exists. Use replace=true to replace it.',
        existingDocument: existing[0]
      });
    }

    if (existing.length > 0 && replace) {
      // Archive old version to history
      const oldDoc = existing[0];
      await query(
        `INSERT INTO document_history (captain_document_id, file_url, file_name, file_size, version, uploaded_by, reason)
         SELECT id, file_url, file_name, file_size, version, uploaded_by, 'Replaced with new version'
         FROM captain_documents WHERE id = ?`,
        [oldDoc.id]
      );

      // Update existing document
      await query(
        `UPDATE captain_documents 
         SET file_url = ?, file_name = ?, file_size = ?, file_type = ?, 
             uploaded_by = ?, uploaded_at = NOW(), version = version + 1, updated_at = NOW()
         WHERE id = ?`,
        [relativePath, req.file.originalname, req.file.size, req.file.mimetype, userId || null, oldDoc.id]
      );

      const updated = await query(
        `SELECT cd.*, dt.doc_key, dt.label, dt.category
         FROM captain_documents cd
         INNER JOIN document_types dt ON cd.document_type_id = dt.id
         WHERE cd.id = ?`,
        [oldDoc.id]
      );

      return res.json({
        message: 'Document replaced',
        docKey,
        fileUrl: relativePath,
        document: updated[0],
        replaced: true
      });
    } else {
      // Insert new document
      const result = await query(
        `INSERT INTO captain_documents 
         (captain_id, document_type_id, file_url, file_name, file_size, file_type, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, documentTypeId, relativePath, req.file.originalname, req.file.size, req.file.mimetype, userId || null]
      );

      const newDoc = await query(
        `SELECT cd.*, dt.doc_key, dt.label, dt.category
         FROM captain_documents cd
         INNER JOIN document_types dt ON cd.document_type_id = dt.id
         WHERE cd.id = ?`,
        [result.insertId]
      );

      return res.json({
        message: 'Document uploaded',
        docKey,
        fileUrl: relativePath,
        document: newDoc[0],
        replaced: false
      });
    }
  } catch (err) {
    console.error('[POST /captains/:id/documents] Error:', err);
    console.error('[POST /captains/:id/documents] Error stack:', err.stack);
    console.error('[POST /captains/:id/documents] Request params:', { id, docKey, replace });

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Document of this type already exists. Use replace=true to replace it.'
      });
    }
    return res.status(err.status || 500).json({
      message: err.status ? err.message : 'Server error'
    });
  }
});

// GET /api/captains/:id/documents
router.get('/:id/documents', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query(
      `SELECT cd.*, dt.doc_key, dt.label, dt.category, dt.requires_expiry_date,
              u.full_name AS uploaded_by_name
       FROM captain_documents cd
       INNER JOIN document_types dt ON cd.document_type_id = dt.id
       LEFT JOIN users u ON cd.uploaded_by = u.id
       WHERE cd.captain_id = ? AND cd.is_active = 1
       ORDER BY dt.display_order ASC, cd.uploaded_at DESC`,
      [id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[GET /captains] Error:', err);
    console.error('[GET /captains] Error stack:', err.stack);

    const errorResponse = {
      message: 'Server error',
      error: err.message,
    };

    if (err.code) errorResponse.code = err.code;
    if (err.sqlState) errorResponse.sqlState = err.sqlState;
    if (err.sqlMessage) errorResponse.sqlMessage = err.sqlMessage;
    if (err.errno) errorResponse.errno = err.errno;

    return res.status(500).json(errorResponse);
  }
});

export default router;

