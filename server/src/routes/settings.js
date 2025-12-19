import express from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// GET /api/settings - Get all application settings
router.get('/', authRequired, async (req, res) => {
  try {
    const rows = await query(
      'SELECT setting_key, setting_value, setting_type FROM application_settings ORDER BY setting_key'
    );
    
    // Transform to object format for frontend
    const settings = {};
    rows.forEach(row => {
      let value = row.setting_value;
      
      // Parse value based on type
      if (row.setting_type === 'number') {
        value = parseFloat(value) || 0;
      } else if (row.setting_type === 'boolean') {
        value = value === '1' || value === 'true' || value === true;
      } else if (row.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch {
          value = value;
        }
      }
      
      settings[row.setting_key] = value;
    });
    
    return res.json(settings);
  } catch (err) {
    console.error('[SETTINGS GET] Error:', err);
    
    // Check if table doesn't exist
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes("doesn't exist")) {
      return res.status(500).json({ 
        message: 'Settings table not found. Please run the schema file to create the application_settings table.',
        error: err.message 
      });
    }
    
    return res.status(500).json({ 
      message: 'Server error',
      error: err.message,
      code: err.code 
    });
  }
});

// GET /api/settings/:key - Get a specific setting
router.get('/:key', authRequired, async (req, res) => {
  const { key } = req.params;
  try {
    const rows = await query(
      'SELECT setting_key, setting_value, setting_type FROM application_settings WHERE setting_key = ?',
      [key]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    const row = rows[0];
    let value = row.setting_value;
    
    // Parse value based on type
    if (row.setting_type === 'number') {
      value = parseFloat(value) || 0;
    } else if (row.setting_type === 'boolean') {
      value = value === '1' || value === 'true' || value === true;
    } else if (row.setting_type === 'json') {
      try {
        value = JSON.parse(value);
      } catch {
        value = value;
      }
    }
    
    return res.json({ [key]: value });
  } catch (err) {
    console.error('[SETTINGS GET KEY] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/settings - Update settings
router.put('/', authRequired, async (req, res) => {
  const settings = req.body;
  const userId = req.user?.id;
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Settings object is required' });
  }
  
  try {
    // Update each setting
    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      // Determine type
      let settingType = 'string';
      let settingValue = value;
      
      if (typeof value === 'number') {
        settingType = 'number';
        settingValue = String(value);
      } else if (typeof value === 'boolean') {
        settingType = 'boolean';
        settingValue = value ? '1' : '0';
      } else if (typeof value === 'object') {
        settingType = 'json';
        settingValue = JSON.stringify(value);
      } else {
        settingValue = String(value);
      }
      
      // Insert or update setting
      await query(
        `INSERT INTO application_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         setting_type = VALUES(setting_type),
         updated_by = VALUES(updated_by),
         updated_at = NOW()`,
        [key, settingValue, settingType, userId]
      );
      
      updates.push(key);
    }
    
    return res.json({ 
      message: 'Settings updated successfully',
      updated: updates
    });
  } catch (err) {
    console.error('[SETTINGS PUT] Error:', err);
    
    // Check if table doesn't exist
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes("doesn't exist")) {
      return res.status(500).json({ 
        message: 'Settings table not found. Please run the schema file to create the application_settings table.',
        error: err.message 
      });
    }
    
    return res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      code: err.code 
    });
  }
});

export default router;
