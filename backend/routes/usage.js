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

  let totalSeconds = 0;
  for (const record of records) {
    totalSeconds += record.secondsUsed || 0;
    
    await UsageRecord.findOneAndUpdate(
      { user: req.user.id, challenge: challengeId, appName: record.appName },
      { $set: { secondsUsed: record.secondsUsed, recordedAt: record.recordedAt ? new Date(record.recordedAt) : new Date() } },
      { upsert: true }
    );
  }

  // Update the participant's usageSeconds in the Challenge document directly
  await Challenge.updateOne(
    { _id: challenge._id, 'participants.user': req.user.id },
    { $set: { 'participants.$.usageSeconds': totalSeconds } }
  );

  return res.json({ message: 'Usage synced', totalSeconds });
});

router.get('/challenge/:challengeId', auth, async (req, res) => {
  const records = await UsageRecord.find({ challenge: req.params.challengeId }).sort({ recordedAt: -1 });
  return res.json({ records });
});

module.exports = router;
