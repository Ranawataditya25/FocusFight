const express = require('express');
const Challenge = require('../models/Challenge');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/:inviteCode', async (req, res) => {
  const challenge = await Challenge.findOne({ inviteCode: req.params.inviteCode }).populate('creator', 'name email');
  if (!challenge) return res.status(404).json({ message: 'Invite not found' });
  return res.json({ challenge });
});

router.post('/:inviteCode/share', auth, async (req, res) => {
  const challenge = await Challenge.findOne({ inviteCode: req.params.inviteCode, creator: req.user.id });
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  return res.json({ shareUrl: `${process.env.CLIENT_URL}/invite/${challenge.inviteCode}` });
});

module.exports = router;
