const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// TEMP DEBUG: Check email env vars on startup
console.log('\n📧 [ENV CHECK ON STARTUP]');
console.log(`   EMAIL_USER : "${process.env.EMAIL_USER}"`);
console.log(`   EMAIL_PASS : "${process.env.EMAIL_PASS ? '****' + process.env.EMAIL_PASS.slice(-4) : 'EMPTY/UNDEFINED'}"`);
console.log(`   EMAIL_HOST : "${process.env.EMAIL_HOST}"`);
console.log(`   EMAIL_PORT : "${process.env.EMAIL_PORT}"\n`);

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const materialRoutes = require('./routes/materialRoutes');
const doubtRoutes = require('./routes/doubtRoutes');
const userRoutes = require('./routes/userRoutes');

// Load database models for cron job resets
const Note = require('./models/Note');
const PYQ = require('./models/PYQ');
const Quiz = require('./models/Quiz');

const app = express();

// Database Connection
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded PDFs inline (so the browser renders them, not downloads)
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found.' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fs.createReadStream(filePath).pipe(res);
});

// Routing Mappings
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/users', userRoutes);

// Root index status endpoint
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'CampusHive MERN Backend API running.' });
});

// Reset weekly trending counters every Monday at 00:00 (Midnight)
if (process.env.NODE_ENV !== 'production') {
  cron.schedule('0 0 * * 1', async () => {
    console.log('[Cron Job]: Resetting weekly trending metrics...');
    try {
      const noteRes = await Note.updateMany({}, { weeklyDownloads: 0 });
      const pyqRes = await PYQ.updateMany({}, { weeklyDownloads: 0 });
      const quizRes = await Quiz.updateMany({}, { weeklyAttempts: 0 });
      console.log(`[Cron Job Success]: Note: ${noteRes.modifiedCount}, PYQ: ${pyqRes.modifiedCount}, Quiz: ${quizRes.modifiedCount} records reset.`);
    } catch (error) {
      console.error(`[Cron Job Failure]: ${error.message}`);
    }
  });
}

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
