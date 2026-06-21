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
    const { title, description, apps, durationType, durationValue, maxParticipants = 10, entryFee = 0, payoutStructure = 'top_3' } = req.body;
    
    const creatorUser = await User.findById(req.user.id);
    if (entryFee > 0 && creatorUser.credits < entryFee) {
      return res.status(400).json({ message: 'Insufficient credits to create this challenge' });
    }

    if (entryFee > 0) {
      creatorUser.credits -= entryFee;
      await creatorUser.save();
    }

    const inviteCode = crypto.randomBytes(8).toString('hex');
    const challenge = await Challenge.create({
      title,
      description,
      creator: req.user.id,
      apps,
      durationType,
      durationValue,
      maxParticipants,
      entryFee,
      payoutStructure,
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
  
  if (accepted && !existing) {
    if (challenge.participants.length >= challenge.maxParticipants) {
      return res.status(400).json({ message: 'This challenge is already full.' });
    }
    
    const joinerUser = await User.findById(req.user.id);
    if (challenge.entryFee > 0 && joinerUser.credits < challenge.entryFee) {
      return res.status(400).json({ message: `Insufficient credits. You need ${challenge.entryFee} credits to join.` });
    }

    if (challenge.entryFee > 0) {
      joinerUser.credits -= challenge.entryFee;
      await joinerUser.save();
    }
  }

  if (existing) {
    // If they previously rejected and are now accepting, or vice versa, handle fee (edge case). 
    // For simplicity, we assume they can only accept once directly.
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
    
    const validParticipantsCount = sorted.length;
    let fallbackDays = 1;
    if (challenge.durationType === 'week') fallbackDays = 7;
    else if (challenge.durationType === 'month') fallbackDays = 30;
    else if (challenge.durationType === 'custom') fallbackDays = challenge.durationValue || 7;

    const totalPrizePool = challenge.entryFee > 0 ? (challenge.entryFee * validParticipantsCount) : (fallbackDays * 10 * validParticipantsCount);
    const payoutStructure = challenge.payoutStructure || 'top_3';
    
    let effectivePayoutStructure = payoutStructure;
    if (validParticipantsCount <= 2) {
      effectivePayoutStructure = 'winner_takes_all';
    } else if (validParticipantsCount === 3 && payoutStructure === 'top_half') {
      effectivePayoutStructure = 'top_3';
    }
    
    let rankPercentages = [];
    if (effectivePayoutStructure === 'winner_takes_all') {
      rankPercentages = [1.0];
    } else if (effectivePayoutStructure === 'top_3') {
      rankPercentages = [0.5, 0.3, 0.2];
    } else if (effectivePayoutStructure === 'top_half') {
      const winnersCount = Math.max(1, Math.floor(validParticipantsCount / 2));
      const split = 1.0 / winnersCount;
      rankPercentages = Array(winnersCount).fill(split);
    }

    const calculateCredits = (index) => {
      if (index >= rankPercentages.length) return 0;
      
      // If this is the last percentage rank, give it the remainder to avoid flooring loss
      if (index === rankPercentages.length - 1) {
        let totalGiven = 0;
        for (let j = 0; j < index; j++) {
          totalGiven += Math.floor(totalPrizePool * rankPercentages[j]);
        }
        return totalPrizePool - totalGiven;
      }
      return Math.floor(totalPrizePool * rankPercentages[index]);
    };

    const updates = sorted.map((p, index) => {
      return User.findByIdAndUpdate(p.user._id, { $inc: { credits: calculateCredits(index) } });
    });
    await Promise.all(updates);
    
    await challenge.save();

    const formatTime = (sec) => {
      if (!sec) return '0m';
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    };

    // Send personalized rank notifications
    if (winner && winner.user) {
      const winnerName = formatUser(winner.user);
      const winnerTime = formatTime(winner.usageSeconds);

      await Promise.all(sorted.map((p, index) => {
        const creditsToAward = calculateCredits(index);

        const pTime = formatTime(p.usageSeconds);
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

      const creatorInParticipants = sorted.some(p => p.user && p.user._id && p.user._id.toString() === challenge.creator.toString());
      if (!creatorInParticipants) {
        await Notification.create({
          user: challenge.creator,
          challenge: challenge._id,
          challengeTitle: challenge.title,
          message: `Your challenge ${challenge.title} has finished! Winner: ${winnerName} with ${winnerTime}.`,
          actorName: 'FocusFight System',
          actorEmail: 'system@focusfight.com',
          type: 'challenge',
        }).catch(() => null);
      }
    } else {
      await Notification.create({
        user: challenge.creator,
        challenge: challenge._id,
        challengeTitle: challenge.title,
        message: `Your challenge ${challenge.title} has finished, but no valid participants were found.`,
        actorName: 'FocusFight System',
        actorEmail: 'system@focusfight.com',
        type: 'challenge',
      }).catch(() => null);
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
