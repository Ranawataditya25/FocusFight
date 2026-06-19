import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { challengeApi } from '../api';
import { getToken, getUserFromToken } from '../auth';

const InvitePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      await challengeApi.respond(code, accepted);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="py-24 text-center text-slate-400">Loading invite...</div>;
  if (error) return <div className="py-24 text-center text-rose-300">{error}</div>;

  const currentUserId = currentUser?.id || currentUser?._id;
  const isCreator = currentUserId && challenge.creator?._id === currentUserId;
  const participant = challenge.participants?.find((p) => p.user?._id === currentUserId || p.user === currentUserId);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-8 shadow-soft">
      <h1 className="text-3xl font-semibold text-white">Challenge Invite</h1>
      <p className="mt-3 text-slate-400">{challenge.description || 'Join a FocusFight challenge to keep each other accountable with app usage tracking.'}</p>
      <div className="mt-8 space-y-4 rounded-3xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Challenge</p>
        <h2 className="text-2xl font-semibold text-white">{challenge.title}</h2>
        <p className="text-slate-300">Tracking: {challenge.apps.join(', ')}</p>
        <p className="text-slate-400">
          Ends: {challenge.status === 'pending' ? 'Starts when you join' : new Date(challenge.endDate).toLocaleString()}
        </p>
        <p className="text-slate-400">
          Duration: {challenge.durationType === 'custom' ? `${challenge.durationValue} days` : challenge.durationType === 'week' ? '7 days' : challenge.durationType === 'month' ? '30 days' : '1 day'}
        </p>
        <p className="text-sm text-slate-500">Created by {challenge.creator?.name || challenge.creator?.email}</p>
        <div className="pt-2 border-t border-slate-800">
          <p className="text-sm text-slate-400">Participants ({challenge.participants.length})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {challenge.participants.map((p, idx) => (
              <span key={idx} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {p.user?.name || 'A player'}
              </span>
            ))}
          </div>
        </div>
      </div>
      {isCreator ? (
        <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-950 p-6 text-slate-200">
          <p className="text-lg font-semibold">You created this challenge.</p>
          <p className="mt-2 text-sm text-slate-400">Head to your dashboard to manage participants and challenge settings.</p>
        </div>
      ) : participant ? (
        <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-950 p-6 text-slate-200">
          <p className="text-lg font-semibold">
            {participant.accepted ? 'You have already accepted this challenge.' : 'You have already rejected this challenge.'}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {participant.accepted ? 'Good luck with your focus challenge!' : 'You will not be added to this challenge.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => respond(true)} className="rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
            Accept challenge
          </button>
          <button onClick={() => respond(false)} className="rounded-3xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm text-slate-200 transition hover:border-rose-500 hover:text-white">
            Reject challenge
          </button>
        </div>
      )}
    </div>
  );
};

export default InvitePage;
