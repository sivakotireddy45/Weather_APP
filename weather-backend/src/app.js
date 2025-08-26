const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const weatherRoutes = require('./routes/weather.routes');

const app = express();


if (!process.env.MONGO_URI) {
  console.error('❌ Missing MONGO_URI in .env');
  process.exit(1);
}
if (!process.env.OPENWEATHER_API_KEY) {
  console.error('❌ Missing OPENWEATHER_API_KEY in .env');
  process.exit(1);
}


app.use(helmet());
app.use(morgan('dev'));


const allowed = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);            
    if (allowed.length === 0) return cb(null, true); 
    return allowed.includes(origin) ? cb(null, true) : cb(new Error('CORS not allowed'), false);
  }
}));

app.use(express.json({ limit: '100kb' }));

app.set('trust proxy', 1); 
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

app.use('/api', weatherRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).json({ ok: false, error: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message });
});

module.exports = app;
