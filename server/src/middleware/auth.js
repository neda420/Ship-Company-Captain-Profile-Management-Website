import jwt from 'jsonwebtoken';

class ConfigurationError extends Error {}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ConfigurationError('JWT_SECRET is not configured');
  }
  return secret;
}

export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof ConfigurationError) {
      return res.status(500).json({ message: 'Authentication service misconfigured' });
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '8h' });
  return token;
}

