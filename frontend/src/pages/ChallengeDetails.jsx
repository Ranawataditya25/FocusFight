import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { challengeApi, usageApi } from '../api';
import { AppIcon } from '../components/AppIcon';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getUserFromToken } from '../auth';
import { Clipboard } from '@capacitor/clipboard';
import PrizePoolPreview from '../components/PrizePoolPreview';

const ChallengeDetails = () => {
  const { code } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
  const navigate = useNavigate();
  const currentUser = getUserFromToken();

  useEffect(() => {
    challengeApi.getByInviteCode(code)
      .then((res) => {
        setChallenge(res.challenge);
        return usageApi.history(res.challenge._id);
      })
      .then((res) => setRecords(res.records))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="py-24 text-center text-slate-400">Loading details...</div>;
  if (!challenge) return <div className="py-24 text-center text-rose-300">Challenge not found.</div>;

  const formatSeconds = (sec) => {
    if (!sec) return '0 sec';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s} sec`;
  };

  const chartData = challenge ? challenge.apps.map(appName => {
    // find latest record for this app
    const record = records.find(r => r.user === currentUser?.id && r.appName === appName);
    return {
      name: appName,
      minutes: record ? Math.floor(record.secondsUsed / 60) : 0
    };
  }) : [];

  const copyCode = async () => {
    try {
      await Clipboard.write({ string: challenge.inviteCode });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await challengeApi.delete(challenge._id);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to delete challenge');
    }
  };

  const handleLeave = async () => {
    try {
      await challengeApi.delete(challenge._id);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to leave challenge');
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    try {
      const res = await challengeApi.removeParticipant(challenge._id, participantId);
      setChallenge(res.challenge);
      setShowRemoveConfirm(null);
    } catch (err) {
      console.error(err);
      alert('Failed to remove participant');
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-4 sm:p-8 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{challenge.title}</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">{challenge.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                {challenge.status === 'pending' ? 'Starts when joined' : `Ends ${new Date(challenge.endDate).toLocaleDateString()}`}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">Status {challenge.status}</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Invite Code</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={challenge.inviteCode}
                className="w-full sm:w-40 text-center text-xl font-bold tracking-widest rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center justify-center rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy code'}
              </button>
            {currentUser && currentUser.id === challenge.creator._id && (
              <div className="mt-2 flex gap-2 w-full">
                <button onClick={() => setShowDeleteConfirm(true)} className="rounded-3xl border border-rose-400 w-full sm:w-auto px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10">Delete</button>
              </div>
            )}
            {currentUser && currentUser.id !== challenge.creator._id && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => setShowLeaveConfirm(true)} className="rounded-3xl border border-slate-300 px-4 py-2 text-sm">Leave</button>
              </div>
            )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <PrizePoolPreview durationType={challenge.durationType} durationValue={challenge.durationValue} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {challenge.apps.map((app) => (
            <span key={app} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <AppIcon name={app} size={22} />
              {app}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Participant summary</h2>
          <div className="mt-5 space-y-3">
            {challenge.participants.map((participant) => (
              <div key={participant.user._id} className="flex items-center justify-between rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {participant.user.name} 
                    {currentUser && participant.user._id === currentUser.id && (
                      <span className="ml-2 text-brand-500 text-xs font-bold uppercase tracking-wider bg-brand-500/10 px-2 py-0.5 rounded-full">(You)</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{participant.accepted ? 'Accepted' : 'Pending'}</div>
                  {currentUser && currentUser.id === challenge.creator._id && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">{participant.user.email}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{formatSeconds(participant.usageSeconds)}</span>
                  {currentUser && currentUser.id === challenge.creator._id && participant.user._id !== currentUser.id && (
                    <button
                      onClick={() => setShowRemoveConfirm(participant.user._id)}
                      className="rounded-2xl border border-rose-400 px-3 py-1 text-xs text-rose-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Usage trend</h2>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#ced4da" strokeDasharray="4 4" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="#868e96" 
                  interval={0} 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fill: '#868e96', fontSize: 12 }} 
                />
                <YAxis stroke="#868e96" />
                <Tooltip wrapperClassName="bg-white/95 rounded-3xl border border-slate-200 shadow-soft dark:bg-slate-900" />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200/50 bg-white p-6 shadow-xl dark:border-slate-700/50 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Challenge?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This action cannot be undone. All participants will lose their progress, and the challenge will be permanently removed.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-3xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-3xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200/50 bg-white p-6 shadow-xl dark:border-slate-700/50 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Leave Challenge?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              You will no longer participate in this challenge and your usage will not be tracked.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="rounded-3xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                className="rounded-3xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-rose-500 hover:text-white dark:border-slate-600 dark:bg-slate-800"
              >
                Leave challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200/50 bg-white p-6 shadow-xl dark:border-slate-700/50 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Remove Participant?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to kick this player from the challenge?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="rounded-3xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveParticipant(showRemoveConfirm)}
                className="rounded-3xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                Remove player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeDetails;
