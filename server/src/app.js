import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { query } from './db.js';

import authRoutes from './routes/auth.js';
import captainsRoutes from './routes/captains.js';
import documentsRoutes from './routes/documents.js';
import usersRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import { runMigrations } from './migrations/migrate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === 'production';

function validateRuntimeConfig() {
  const missingEnv = [];

  if (!process.env.JWT_SECRET) {
    missingEnv.push('JWT_SECRET');
  }

  if (process.env.ENABLE_SETUP_ROUTES === 'true' && !process.env.SETUP_ADMIN_TOKEN) {
    missingEnv.push('SETUP_ADMIN_TOKEN');
  }

  if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check with database connection test
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await query('SELECT 1 as test');
    res.json({ 
      status: 'ok', 
      message: 'Global Shipping backend is running',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      ...(IS_PROD ? {} : { error: error.message })
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/captains', captainsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : (err.message || 'Request failed'),
    ...(!IS_PROD && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server with database connection check and automatic migrations
async function startServer() {
  try {
    validateRuntimeConfig();

    // Test database connection
    console.log('Testing database connection...');
    await query('SELECT 1 as test');
    console.log('Database connected successfully');
    
    // Run automatic migrations
    try {
      await runMigrations();
    } catch (migrationError) {
      console.error('Migration warning:', migrationError.message);
      if (migrationError.stack) {
        console.error('Stack:', migrationError.stack);
      }
      console.error('Migrations will be retried on next startup');
      // Continue anyway - migrations are non-critical for startup
      // Server can still run even if migrations fail
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Backend API server running on http://localhost:${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
      console.log(`Database: ${process.env.DB_NAME || 'global shipping company'}`);
    });

    // Handle server errors (like port already in use)
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error('\nTo fix this, run one of these commands:');
        console.error(`\n  Windows PowerShell:`);
        console.error(`    .\\kill-port.ps1`);
        console.error(`\n  Or manually:`);
        console.error(`    $port = Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue`);
        console.error(`    if ($port) { Stop-Process -Id $port.OwningProcess -Force }`);
        console.error(`\n  Windows CMD:`);
        console.error(`    netstat -ano | findstr :${PORT}`);
        console.error(`    taskkill /F /PID <PID_NUMBER>`);
        console.error(`\n  Or change the port in .env file: PORT=4001`);
      } else {
        console.error('Server error:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error('Make sure:');
    console.error('   1. MySQL/XAMPP is running');
    console.error('   2. Database "global shipping company" exists');
    console.error('   3. .env file is configured correctly');
    process.exit(1);
  }
}

startServer();
