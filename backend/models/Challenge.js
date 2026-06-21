const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accepted: { type: Boolean, default: false },
  joinedAt: { type: Date },
  usageSeconds: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
});

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  apps: [{ type: String }],
  durationType: { type: String, enum: ['day', 'week', 'month', 'custom'], default: 'week' },
  durationValue: { type: Number, default: 7 },
  maxParticipants: { type: Number, required: true, default: 10, min: 2, max: 100 },
  entryFee: { type: Number, required: true, default: 0 },
  payoutStructure: { type: String, enum: ['winner_takes_all', 'top_3', 'top_half'], default: 'top_3' },
  startDate: { type: Date },
  endDate: { type: Date },
  inviteCode: { type: String, required: true, unique: true },
  participants: [participantSchema],
  status: { type: String, enum: ['draft', 'pending', 'active', 'completed', 'cancelled'], default: 'pending' },
  analytics: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);
