const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const playerRoutes = require('./routes/players');
const skillRatingRoutes = require('./routes/skill-ratings');
const developmentRoutes = require('./routes/development');
const scheduleRoutes = require('./routes/schedule');
const teamAccessRoutes = require('./routes/team-access');
const videoRoutes = require('./routes/videos');
const statisticsRoutes = require('./routes/statistics');
const commentRoutes = require('./routes/comments');
const attendanceRoutes = require('./routes/attendance');
const availabilityRoutes = require('./routes/availability');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/skill-ratings', skillRatingRoutes);
app.use('/api/development', developmentRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/team-access', teamAccessRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/availability', availabilityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    service: 'Volleyball Coach API'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Only start server if not being required as a module (for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🏐 Volleyball Coach API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`CORS origin: ${process.env.CORS_ORIGIN}`);
  });
}

module.exports = app;
