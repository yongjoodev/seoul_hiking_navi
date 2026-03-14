require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mountainsRouter = require('./routes/mountains');
const trailsRouter = require('./routes/trails');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    methods: ['GET'],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Seoul Hiking Navigator API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/mountains', mountainsRouter);
app.use('/api/trails', trailsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: '요청한 경로를 찾을 수 없습니다.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`🏔️  Seoul Hiking Navigator API`);
  console.log(`✅  Server running on http://localhost:${PORT}`);
  console.log(`📍  Mountains API: http://localhost:${PORT}/api/mountains`);
});
