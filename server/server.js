'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Serve static client files ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'client')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', orderRoutes);

// ── Catch-all: serve index.html for any non-API route ─────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// ── Start server (skipped on Vercel serverless) ───────────────────────────────
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`✅  Server running at http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
