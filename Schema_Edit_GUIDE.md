

## Overview

The database has been redesigned with a fully normalized relational structure to ensure data integrity, prevent duplicates, and enable better tracking of all information including documents.

## Key Changes

### 1. **Document Types Table**
- All document types are now stored in a `document_types` table
- Each document type has metadata (category, expiry requirements, display order)
- Prevents typos and ensures consistency

### 2. **Normalized Document Storage**
- `captain_documents` table now references `document_types` via foreign key
- Unique constraint prevents duplicate document types per captain
- Tracks file metadata (name, size, type, upload date, version)
- Tracks who uploaded each document

### 3. **Document History**
- New `document_history` table tracks all document changes
- Maintains version history when documents are replaced
- Enables audit trail

### 4. **Additional Normalized Tables**
- `vessel_types` - Normalized vessel type storage
- `captain_vessel_types` - Many-to-many relationship
- `certificates` - Separate table for certificate tracking
- `sea_service_history` - Normalized sea service records
- `skills` - Normalized skills catalog
- `captain_skills` - Many-to-many with proficiency levels

## Migration Steps

### Option 1: Fresh Installation (Recommended for New Databases)

1. **Backup existing data** (if any)
   ```sql
   mysqldump -u root "global shipping company" > backup.sql
   ```

2. **Drop existing database** (if starting fresh)
   ```sql
   DROP DATABASE IF EXISTS `global shipping company`;
   ```

3. **Create new database**
   ```sql
   CREATE DATABASE `global shipping company` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE `global shipping company`;
   ```

4. **Run the normalized schema**
   ```bash
   mysql -u root "global shipping company" < server/schema_normalized.sql
   ```

5. **Create admin user** (if needed)
   ```bash
   curl -X POST http://localhost:4000/api/auth/create-admin \
     -H "Content-Type: application/json" \
     -d '{"username":"Admin","email":"nadim015582@gmail.com","password":"nadimnaim01","fullName":"Md Nadimul Islam"}'
   ```

### Option 2: Migrate Existing Database

1. **Backup existing data**
   ```sql
   mysqldump -u root "global shipping company" > backup_before_migration.sql
   ```

2. **Run migration script**
   ```bash
   mysql -u root "global shipping company" < server/migration_to_normalized.sql
   ```

3. **Verify migration**
   ```sql
   -- Check document_types were created
   SELECT COUNT(*) FROM document_types;
   
   -- Check documents were migrated
   SELECT COUNT(*) FROM captain_documents WHERE document_type_id IS NOT NULL;
   ```

## Database Schema Structure

```
users
├── id (PK)
└── ... (user fields)

captains (Main entity)
├── id (PK)
└── ... (captain basic info)

captain_personal_identity
├── captain_id (PK, FK → captains.id)
└── ... (personal info fields)

captain_professional_info
├── captain_id (PK, FK → captains.id)
└── ... (professional info fields)

captain_medical_info
├── captain_id (PK, FK → captains.id)
└── ... (medical info fields)

captain_expiry_dates
├── captain_id (PK, FK → captains.id)
└── ... (expiry date fields)

document_types (NEW)
├── id (PK)
├── doc_key (UNIQUE)
├── label
├── category
├── requires_expiry_date
└── ... (metadata)

captain_documents (UPDATED)
├── id (PK)
├── captain_id (FK → captains.id)
├── document_type_id (FK → document_types.id) [UNIQUE with captain_id]
├── file_url
├── file_name
├── file_size
├── uploaded_by (FK → users.id)
├── uploaded_at
├── version
└── ... (tracking fields)

document_history (NEW)
├── id (PK)
├── captain_document_id (FK → captain_documents.id)
├── file_url
├── version
└── ... (history fields)

vessel_types (NEW)
├── id (PK)
└── name (UNIQUE)

captain_vessel_types (NEW)
├── captain_id (FK → captains.id)
├── vessel_type_id (FK → vessel_types.id)
└── PRIMARY KEY (captain_id, vessel_type_id)

certificates (NEW)
├── id (PK)
├── captain_id (FK → captains.id)
└── ... (certificate fields)

sea_service_history (NEW)
├── id (PK)
├── captain_id (FK → captains.id)
└── ... (service fields)

skills (NEW)
├── id (PK)
└── name (UNIQUE)

captain_skills (NEW)
├── captain_id (FK → captains.id)
├── skill_id (FK → skills.id)
└── PRIMARY KEY (captain_id, skill_id)
```

## Features Enabled

### 1. **Duplicate Prevention**
- Database-level unique constraint prevents duplicate document types per captain
- Frontend validation warns before replacing existing documents
- Backend returns 409 Conflict if duplicate attempted

### 2. **Document Tracking**
- Every document upload tracks:
  - Who uploaded it (user_id)
  - When it was uploaded
  - File metadata (name, size, type)
  - Version number
  - Active status

### 3. **Document History**
- All document replacements are logged
- Previous versions preserved in `document_history`
- Audit trail for compliance

### 4. **Data Integrity**
- Foreign key constraints ensure referential integrity
- Cascade deletes maintain consistency
- Normalized structure reduces redundancy

## API Changes

### Document Upload
```javascript
// Before
POST /api/captains/:id/documents
Body: { docKey: "passportScan", file: File }

// After (same endpoint, enhanced)
POST /api/captains/:id/documents
Body: { docKey: "passportScan", file: File, replace: false }
Response: { document: {...}, replaced: false }
```

### Check Document Exists
```javascript
// New endpoint
GET /api/documents/captain/:captainId/type/:docKey
Response: { exists: true, document: {...} }
```

### Get Document Types
```javascript
// New endpoint
GET /api/documents/types
Response: [{ id, doc_key, label, category, ... }]
```

## Frontend Changes

### Document Upload Flow
1. **User must select document type first** (required)
2. **System checks for existing document** (warns if exists)
3. **User confirms replacement** (if replacing)
4. **Upload proceeds** with duplicate prevention

### Duplicate Prevention
- Document type dropdown shows "(Already uploaded)" for uploaded types
- Warning message displayed if trying to upload duplicate
- Confirmation dialog before replacement

## Testing Checklist

- [ ] Database schema created successfully
- [ ] Document types inserted correctly
- [ ] Can upload new document
- [ ] Cannot upload duplicate document type (409 error)
- [ ] Can replace existing document (with replace=true)
- [ ] Document history tracked correctly
- [ ] All captain data saves properly
- [ ] Frontend shows uploaded documents correctly
- [ ] Document type selection works
- [ ] Duplicate warnings appear correctly

## Rollback Plan

If migration fails:

1. **Restore backup**
   ```bash
   mysql -u root "global shipping company" < backup_before_migration.sql
   ```

2. **Use old schema**
   ```bash
   mysql -u root "global shipping company" < server/schema_normalized.sql
   ```

## Support

If you encounter issues:
1. Check database logs
2. Verify foreign key constraints
3. Ensure all document_types are inserted
4. Check backend console for errors
5. Verify frontend API calls

