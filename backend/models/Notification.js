const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
  challengeTitle: { type: String },
  message: { type: String, required: true },
  actorName: { type: String },
  actorEmail: { type: String },
  read: { type: Boolean, default: false },
  type: { type: String, default: 'challenge' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
