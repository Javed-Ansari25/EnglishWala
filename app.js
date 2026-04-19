import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env
dotenv.config();
const app = express();

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Security Middleware ─────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// ── Body Parser ────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logger ────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Static Files ──────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// ── Health Check ──────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🎓 English Wala API is running!',
  });
});

// ── Routes ────────────────────────────


// ── Global Error Handler ──────────────
import errorMiddleware from './src/middleware/errorMiddleware.js';
app.use(errorMiddleware);

export default app;
