import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { challengeApi } from '../api';
import { getToken, getUserFromToken } from '../auth';
import PrizePoolPreview from '../components/PrizePoolPreview';
import { RealAppIcon } from '../components/AppIcon';
import { useChallenges } from '../context/ChallengeContext';

const InvitePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { fetchChallenges } = useChallenges();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const currentUser = getUserFromToken();

  useEffect(() => {
    if (!getToken()) {
      navigate(`/login?redirect=/invite/${code}`);
      return;
    }

    challengeApi.getByInviteCode(code)
      .then((result) => setChallenge(result.challenge))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code, navigate]);

  const respond = async (accepted) => {
    try {
      if (accepted) setIsAccepting(true);
      else setIsRejecting(true);
      
      await challengeApi.respond(code, accepted);
      fetchChallenges(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      if (accepted) setIsAccepting(false);
      else setIsRejecting(false);
    }
  };

  if (loading) return <div className="py-24 text-center text-slate-400">Loading invite...</div>;
  if (error) return <div className="py-24 text-center text-rose-300">{error}</div>;

  const currentUserId = currentUser?.id || currentUser?._id;
  const isCreator = currentUserId && challenge.creator?._id === currentUserId;
  const participant = challenge.participants?.find((p) => p.user?._id === currentUserId || p.user === currentUserId);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Challenge Invite</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">{challenge.description || 'Join a FocusFight challenge to keep each other accountable with app usage tracking.'}</p>
      <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Challenge</p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{challenge.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* <span className="text-slate-300 mr-2">Tracking:</span> */}
          {challenge.apps.map((app) => (
            <span key={app} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <RealAppIcon appName={app} />
              {app}
            </span>
          ))}
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Ends: {challenge.status === 'pending' ? 'Starts when you join' : new Date(challenge.endDate).toLocaleString()}
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Duration: {challenge.durationType === 'custom' ? `${challenge.durationValue} days` : challenge.durationType === 'week' ? '7 days' : challenge.durationType === 'month' ? '30 days' : '1 day'}
        </p>
        <p className="text-sm text-slate-500">Created by {challenge.creator?.name || challenge.creator?.email}</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 py-4 border-y border-slate-200 my-4 dark:border-slate-800">
          {/* Future feature: Real money/credits entry fee
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Entry Fee</p>
            <p className="mt-1 font-bold text-brand-400">{challenge.entryFee > 0 ? `${challenge.entryFee} Credits` : 'Free'}</p>
          </div>
          */}
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Max Players</p>
            <p className="mt-1 font-bold text-slate-900 dark:text-slate-200">{challenge.maxParticipants}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-wider text-slate-500">Structure</p>
            <p className="mt-1 font-bold text-slate-900 dark:text-slate-200">
              {challenge.payoutStructure === 'winner_takes_all' ? 'Winner Takes All' : 
               challenge.payoutStructure === 'top_half' ? 'Top Half Split' : 'Top 3 Tiered'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Participants ({challenge.participants.length})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {challenge.participants.map((p, idx) => (
              <span key={idx} className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {p.user?.name || 'A player'}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <PrizePoolPreview 
          durationType={challenge.durationType} 
          durationValue={challenge.durationValue} 
          maxParticipants={challenge.maxParticipants}
          entryFee={challenge.entryFee}
          payoutStructure={challenge.payoutStructure}
          currentParticipants={challenge.participants.length}
        />
      </div>

      {isCreator ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
          <p className="text-lg font-semibold">You created this challenge.</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Head to your dashboard to manage participants and challenge settings.</p>
        </div>
      ) : participant ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
          <p className="text-lg font-semibold">
            {participant.accepted ? 'You have already accepted this challenge.' : 'You have already rejected this challenge.'}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {participant.accepted ? 'Good luck with your focus challenge!' : 'You will not be added to this challenge.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button 
            onClick={() => respond(true)} 
            disabled={isAccepting || isRejecting}
            className="inline-flex items-center justify-center rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAccepting ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            {isAccepting ? 'Accepting...' : 'Accept challenge'}
          </button>
          <button 
            onClick={() => respond(false)} 
            disabled={isAccepting || isRejecting}
            className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm text-slate-700 transition hover:border-rose-500 hover:text-rose-600 disabled:opacity-70 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-rose-500 dark:hover:text-white"
          >
            {isRejecting ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            {isRejecting ? 'Rejecting...' : 'Reject challenge'}
          </button>
        </div>
      )}
    </div>
  );
};

export default InvitePage;
