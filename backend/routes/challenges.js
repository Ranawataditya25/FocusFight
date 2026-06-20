const express = require('express');
const crypto = require('crypto');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

const getEndDate = (startDate, type, value) => {
  const date = new Date(startDate);
  if (type === 'day') date.setDate(date.getDate() + 1);
  if (type === 'week') date.setDate(date.getDate() + 7);
  if (type === 'month') date.setMonth(date.getMonth() + 1);
  if (type === 'custom') date.setDate(date.getDate() + (value || 7));
  return date;
};

const formatUser = (user) => user.name || user.email;

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, apps, durationType, durationValue } = req.body;
    const inviteCode = crypto.randomBytes(8).toString('hex');
    const challenge = await Challenge.create({
      title,
      description,
      creator: req.user.id,
      apps,
      durationType,
      durationValue,
      inviteCode,
      participants: [{ user: req.user.id, accepted: true, joinedAt: new Date() }],
      status: 'pending',
    });
    return res.status(201).json({ challenge });
  } catch (error) {
    return res.status(500).json({ message: 'Could not create challenge', error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  const challenges = await Challenge.find({ 'participants.user': req.user.id }).populate('creator participants.user', 'name email credits');
  return res.json({ challenges });
});

router.get('/:inviteCode', auth, async (req, res) => {
  const challenge = await Challenge.findOne({ inviteCode: req.params.inviteCode }).populate('creator participants.user', 'name email');
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  return res.json({ challenge });
});

router.post('/:inviteCode/respond', auth, async (req, res) => {
  const { accepted } = req.body;
  const challenge = await Challenge.findOne({ inviteCode: req.params.inviteCode });
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

  const existing = challenge.participants.find((p) => p.user.toString() === req.user.id);
  if (existing) {
    existing.accepted = accepted;
    existing.joinedAt = new Date();
  } else {
    challenge.participants.push({ user: req.user.id, accepted, joinedAt: new Date() });
  }

  if (accepted && challenge.status === 'pending') {
    challenge.status = 'active';
    challenge.startDate = new Date();
    challenge.endDate = getEndDate(challenge.startDate, challenge.durationType, challenge.durationValue);
  }

  await challenge.save();

  await Notification.create({
    user: challenge.creator,
    challenge: challenge._id,
    challengeTitle: challenge.title,
    message: `${formatUser(req.user)} ${accepted ? 'accepted' : 'rejected'} your challenge: ${challenge.title}`,
    actorName: req.user.name,
    actorEmail: req.user.email,
    type: 'challenge',
  });

  return res.json({ challenge });
});

router.post('/:id/complete', auth, async (req, res) => {
  const challenge = await Challenge.findById(req.params.id).populate('participants.user');
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  
  if (challenge.status !== 'completed') {
    challenge.status = 'completed';
    challenge.analytics = req.body.analytics || challenge.analytics;
    
    // Sort participants by lowest usage first
    const sorted = [...challenge.participants].sort((a, b) => (a.usageSeconds || 0) - (b.usageSeconds || 0));
    const winner = sorted[0];
    
    // Calculate days
    let days = 1;
    if (challenge.durationType === 'week') days = 7;
    else if (challenge.durationType === 'month') days = 30;
    else if (challenge.durationType === 'custom') days = challenge.durationValue || 7;
    
    const totalPrize = days * 10;
    
    // Distribute rank-based credits
    const updates = sorted.map((p, index) => {
      let creditsToAward = 0;
      if (index === 0) creditsToAward = totalPrize;
      else if (index === 1) creditsToAward = Math.floor(totalPrize * 0.5);
      else if (index === 2) creditsToAward = Math.floor(totalPrize * 0.25);
      else creditsToAward = Math.floor(totalPrize * 0.1);
      
      return User.findByIdAndUpdate(p.user._id, { $inc: { credits: creditsToAward } });
    });
    await Promise.all(updates);
    
    await challenge.save();

    // Send personalized rank notifications
    if (winner && winner.user) {
      const winnerName = formatUser(winner.user);
      const winnerTime = `${Math.floor((winner.usageSeconds || 0) / 60)}m ${(winner.usageSeconds || 0) % 60}s`;

      await Promise.all(sorted.map((p, index) => {
        let creditsToAward = 0;
        if (index === 0) creditsToAward = totalPrize;
        else if (index === 1) creditsToAward = Math.floor(totalPrize * 0.5);
        else if (index === 2) creditsToAward = Math.floor(totalPrize * 0.25);
        else creditsToAward = Math.floor(totalPrize * 0.1);

        const pTime = `${Math.floor((p.usageSeconds || 0) / 60)}m ${(p.usageSeconds || 0) % 60}s`;
        let rankText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;
        
        const message = index === 0
          ? `🏆 You won 1st place in ${challenge.title} with only ${winnerTime} of usage! +${creditsToAward} credits.`
          : `Challenge ${challenge.title} finished! You placed ${rankText} with ${pTime}. +${creditsToAward} credits. (Winner: ${winnerName} with ${winnerTime})`;

        return Notification.create({
          user: p.user._id,
          challenge: challenge._id,
          challengeTitle: challenge.title,
          message,
          actorName: 'FocusFight System',
          actorEmail: 'system@focusfight.com',
          type: 'challenge',
        }).catch(() => null);
      }));
    }
  }
  
  return res.json({ challenge });
});

// Delete challenge or leave challenge
router.delete('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate('participants.user', 'name email');
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    // If creator, delete for everyone
    if (challenge.creator.toString() === req.user.id) {
      const participantIds = challenge.participants
        .map((p) => p.user._id.toString())
        .filter((id) => id !== req.user.id);

      await Promise.all(participantIds.map((userId) =>
        Notification.create({
          user: userId,
          challenge: challenge._id,
          challengeTitle: challenge.title,
          message: `The challenge ${challenge.title} was deleted by ${formatUser(req.user)}.`,
          actorName: req.user.name,
          actorEmail: req.user.email,
          type: 'challenge',
        }).catch(() => null)
      ));

      await Challenge.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Challenge deleted' });
    }

    const leavingUser = req.user;
    challenge.participants = challenge.participants.filter((p) => p.user._id.toString() !== req.user.id);
    await challenge.save();

    const remainingParticipantIds = challenge.participants.map((p) => p.user._id.toString());
    await Promise.all(remainingParticipantIds.map((userId) =>
      Notification.create({
        user: userId,
        challenge: challenge._id,
        challengeTitle: challenge.title,
        message: `${formatUser(leavingUser)} left the challenge ${challenge.title}.`,
        actorName: leavingUser.name,
        actorEmail: leavingUser.email,
        type: 'challenge',
      }).catch(() => null)
    ));

    return res.json({ challenge });
  } catch (error) {
    return res.status(500).json({ message: 'Could not remove from challenge', error: error.message });
  }
});

// Creator removes a participant by id
router.post('/:id/remove/:participantId', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    if (challenge.creator.toString() !== req.user.id) return res.status(403).json({ message: 'Only creator can remove participants' });

    challenge.participants = challenge.participants.filter((p) => p.user.toString() !== req.params.participantId);
    await challenge.save();

    const creatorName = formatUser(req.user);
    const removedUser = await User.findById(req.params.participantId);

    await Notification.create({
      user: req.params.participantId,
      challenge: challenge._id,
      challengeTitle: challenge.title,
      message: `You were removed from the challenge ${challenge.title} by ${creatorName}.`,
      actorName: req.user.name,
      actorEmail: req.user.email,
      type: 'challenge',
    }).catch(() => null);

    await Promise.all(challenge.participants
      .filter((p) => p.user.toString() !== req.params.participantId)
      .map((p) =>
        Notification.create({
          user: p.user,
          challenge: challenge._id,
          challengeTitle: challenge.title,
          message: `${removedUser ? formatUser(removedUser) : 'A participant'} was removed from ${challenge.title}.`,
          actorName: req.user.name,
          actorEmail: req.user.email,
          type: 'challenge',
        }).catch(() => null)
      )
    );

    return res.json({ challenge });
  } catch (error) {
    return res.status(500).json({ message: 'Could not remove participant', error: error.message });
  }
});

module.exports = router;
