const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { DatabaseMonitor } = require('./monitor');

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Redis connection
const redis = new Redis(process.env.REDIS_URL);

// Monitor instance
const monitor = new DatabaseMonitor({
  redis,
  apiEndpoint: process.env.API_ENDPOINT
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// API Routes
app.post('/api/monitor/start', authenticateToken, async (req, res) => {
  try {
    await monitor.initialize();
    monitor.start();
    res.json({ status: 'success', message: 'Monitor started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/monitor/stop', authenticateToken, (req, res) => {
  monitor.stop();
  res.json({ status: 'success', message: 'Monitor stopped' });
});

app.get('/api/monitor/status', authenticateToken, async (req, res) => {
  try {
    const metrics = await monitor.getMetrics();
    res.json({
      status: 'success',
      metrics,
      isRunning: monitor.isRunning
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhooks', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;
    await monitor.addWebhook(url);
    res.json({ status: 'success', message: 'Webhook added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/webhooks', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;
    await monitor.removeWebhook(url);
    res.json({ status: 'success', message: 'Webhook removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
