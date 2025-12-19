import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

function ensureAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// GET /api/users
router.get('/', authRequired, ensureAdmin, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, username, email, full_name AS fullName, role, permissions_json, avatar_url AS avatarUrl, created_at AS createdAt, last_login AS lastLogin, is_active AS isActive FROM users'
    );
    const users = rows.map(u => ({
      ...u,
      permissions: JSON.parse(u.permissions_json || '[]'),
    }));
    return res.json(users);
  } catch (err) {
    console.error('[Users Route] Error:', err);
    console.error('[Users Route] Error stack:', err.stack);
    console.error('[Users Route] Request body:', JSON.stringify(req.body, null, 2));
    
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

// POST /api/users
router.post('/', authRequired, ensureAdmin, async (req, res) => {
  const { username, email, fullName, password, permissions = [] } = req.body;

  if (!username || !email || !fullName || !password) {
    return res.status(400).json({ message: 'username, email, fullName, password are required' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (username, password_hash, email, full_name, role, permissions_json, is_active)
       VALUES (?, ?, ?, ?, 'user', ?, 1)`,
      [username, passwordHash, email, fullName, JSON.stringify(permissions)]
    );

    return res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('[Users Route] Error:', err);
    console.error('[Users Route] Error stack:', err.stack);
    console.error('[Users Route] Request body:', JSON.stringify(req.body, null, 2));
    
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

// PUT /api/users/:id
router.put('/:id', authRequired, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, fullName, password, permissions, isActive } = req.body;

  try {
    const fields = ['username = ?', 'email = ?', 'full_name = ?', 'permissions_json = ?', 'is_active = ?'];
    const params = [username, email, fullName, JSON.stringify(permissions || []), isActive ? 1 : 0];

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      fields.push('password_hash = ?');
      params.push(passwordHash);
    }

    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    return res.json({ message: 'User updated' });
  } catch (err) {
    console.error('[Users Route] Error:', err);
    console.error('[Users Route] Error stack:', err.stack);
    console.error('[Users Route] Request body:', JSON.stringify(req.body, null, 2));
    
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

// DELETE /api/users/:id
router.delete('/:id', authRequired, ensureAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent deleting self or any admin
    const rows = await query('SELECT role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (rows[0].role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('[Users Route] Error:', err);
    console.error('[Users Route] Error stack:', err.stack);
    console.error('[Users Route] Request body:', JSON.stringify(req.body, null, 2));
    
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


