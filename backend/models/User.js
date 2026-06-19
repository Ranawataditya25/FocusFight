const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  credits: { type: Number, default: 0 },
  avatar: { type: String, default: '' },
  settings: {
    darkMode: { type: Boolean, default: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
