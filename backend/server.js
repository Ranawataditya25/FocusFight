const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const inviteRoutes = require('./routes/invite');
const notificationRoutes = require('./routes/notifications');
const usageRoutes = require('./routes/usage');

dotenv.config();
const app = express();

connectDB();
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps) or any origin dynamically
    return callback(null, origin || true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/usage', usageRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'FocusFight backend' }));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`FocusFight backend running on port ${port}`));
