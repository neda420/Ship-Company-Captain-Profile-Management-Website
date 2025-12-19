import express from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// GET /api/documents/types - Get all document types
router.get('/types', authRequired, async (req, res) => {
  try {
    const types = await query(
      'SELECT * FROM document_types ORDER BY display_order ASC, label ASC'
    );
    return res.json(types);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/documents/types/:docKey - Get document type by key
router.get('/types/:docKey', authRequired, async (req, res) => {
  const { docKey } = req.params;
  try {
    const types = await query(
      'SELECT * FROM document_types WHERE doc_key = ?',
      [docKey]
    );
    if (types.length === 0) {
      return res.status(404).json({ message: 'Document type not found' });
    }
    return res.json(types[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/documents/captain/:captainId - Get all documents for a captain
router.get('/captain/:captainId', authRequired, async (req, res) => {
  const { captainId } = req.params;
  try {
    const documents = await query(
      `SELECT cd.*, dt.doc_key, dt.label, dt.category, dt.requires_expiry_date,
              u.full_name AS uploaded_by_name
       FROM captain_documents cd
       INNER JOIN document_types dt ON cd.document_type_id = dt.id
       LEFT JOIN users u ON cd.uploaded_by = u.id
       WHERE cd.captain_id = ? AND cd.is_active = 1
       ORDER BY dt.display_order ASC, cd.uploaded_at DESC`,
      [captainId]
    );
    return res.json(documents);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/documents/captain/:captainId/type/:docKey - Check if document exists
router.get('/captain/:captainId/type/:docKey', authRequired, async (req, res) => {
  const { captainId, docKey } = req.params;
  try {
    const result = await query(
      `SELECT cd.*, dt.label
       FROM captain_documents cd
       INNER JOIN document_types dt ON cd.document_type_id = dt.id
       WHERE cd.captain_id = ? AND dt.doc_key = ? AND cd.is_active = 1`,
      [captainId, docKey]
    );
    return res.json({ exists: result.length > 0, document: result[0] || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
