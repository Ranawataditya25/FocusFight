const express = require('express');
const UsageRecord = require('../models/UsageRecord');
const Challenge = require('../models/Challenge');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/sync', auth, async (req, res) => {
  const { challengeId, records } = req.body;
  if (!challengeId || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Missing usage data' });
  }

  const challenge = await Challenge.findById(challengeId);
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

  const docs = records.map((record) => ({
    challenge: challenge._id,
    user: req.user.id,
    appName: record.appName,
    secondsUsed: record.secondsUsed,
    recordedAt: record.recordedAt ? new Date(record.recordedAt) : new Date(),
  }));

  await UsageRecord.insertMany(docs);

  const totals = await UsageRecord.aggregate([
    { $match: { challenge: challenge._id, user: req.user._id } },
    { $group: { _id: '$user', totalSeconds: { $sum: '$secondsUsed' } } },
  ]);

  const totalSeconds = totals[0]?.totalSeconds || 0;
  
  // Update the participant's usageSeconds in the Challenge document
  await Challenge.updateOne(
    { _id: challenge._id, 'participants.user': req.user._id },
    { $set: { 'participants.$.usageSeconds': totalSeconds } }
  );

  return res.json({ message: 'Usage synced', totals });
});

router.get('/challenge/:challengeId', auth, async (req, res) => {
  const records = await UsageRecord.find({ challenge: req.params.challengeId }).sort({ recordedAt: -1 });
  return res.json({ records });
});

module.exports = router;
