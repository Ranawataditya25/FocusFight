const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !name.trim() || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email, password: hashedPassword });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, credits: user.credits, avatar: user.avatar, settings: user.settings } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, credits: user.credits, avatar: user.avatar, settings: user.settings } });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  return res.json({ user });
});

router.get('/leaderboard', auth, async (req, res) => {
  try {
    const users = await User.find().sort({ credits: -1 }).limit(50).select('name email credits');
    return res.json({ leaderboard: users });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
});

module.exports = router;
