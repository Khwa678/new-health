const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ─────────────────────────────────────────────
// ✅ CORS (fix for your frontend error)
// ─────────────────────────────────────────────
app.use(cors({
  origin: "http://localhost:5174", // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ─────────────────────────────────────────────
// ✅ Middleware
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────────
// ✅ Rate Limiting
// ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 50,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─────────────────────────────────────────────
// ✅ MongoDB Connection
// ─────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

// ─────────────────────────────────────────────
// ✅ ROUTES
// ─────────────────────────────────────────────

// 🔐 AUTH (IMPORTANT — fixes your login/register issue)
app.use('/api/auth', require('./routes/auth'));

// Existing routes
app.use('/api/chat', require('./routes/chat'));
app.use('/api/research', require('./routes/research'));
app.use('/api/sessions', require('./routes/sessions'));

// ─────────────────────────────────────────────
// ✅ Health Check
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    llmProvider: process.env.LLM_PROVIDER || 'ollama',
  });
});

// ─────────────────────────────────────────────
// ✅ Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ─────────────────────────────────────────────
// 🚀 START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📄 Health: http://localhost:${PORT}/api/health\n`);
});