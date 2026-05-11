const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const apiKey = require('./middleware/apiKey');
const errorHandler = require('./middleware/errorHandler');
const empresaRouter = require('./routes/empresa');

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGINS || 'https://kopur.cl,https://www.kopur.cl')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origen no permitido por CORS'));
  },
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes, intenta más tarde' }
  },
});

app.get('/health', (req, res) => {
  res.json({ data: { status: 'ok' }, error: null });
});

app.use('/empresa', limiter, apiKey, empresaRouter);

app.use((req, res) => {
  res.status(404).json({
    data: null,
    error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado' }
  });
});

app.use(errorHandler);

module.exports = app;
