import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { challengeApi, usageApi } from '../api';
import { AppIcon } from '../components/AppIcon';
import { LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Line } from 'recharts';
import { getUserFromToken } from '../auth';

const ChallengeDetails = () => {
  const { code } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
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

  const shareLink = `${window.location.origin}/invite/${challenge.inviteCode}`;
  const chartData = records.map((item) => ({ name: item.appName, seconds: item.secondsUsed }));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this challenge? This will remove it for all participants.')) return;
    try {
      await challengeApi.delete(challenge._id);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to delete challenge');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this challenge?')) return;
    try {
      await challengeApi.delete(challenge._id);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to leave challenge');
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!confirm('Remove this participant?')) return;
    try {
      const res = await challengeApi.removeParticipant(challenge._id, participantId);
      setChallenge(res.challenge);
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
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">Ends {new Date(challenge.endDate).toLocaleDateString()}</span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">Status {challenge.status}</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Invite link</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={shareLink}
                className="min-w-0 flex-1 rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center justify-center rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            {currentUser && currentUser.id === challenge.creator._id && (
              <div className="mt-2 flex gap-2">
                <button onClick={handleDelete} className="rounded-3xl border border-rose-400 px-4 py-2 text-sm text-rose-600">Delete</button>
              </div>
            )}
            {currentUser && currentUser.id !== challenge.creator._id && (
              <div className="mt-2 flex gap-2">
                <button onClick={handleLeave} className="rounded-3xl border border-slate-300 px-4 py-2 text-sm">Leave</button>
              </div>
            )}
            </div>
          </div>
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
                  <div className="font-semibold text-slate-900 dark:text-white">{participant.user.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{participant.accepted ? 'Accepted' : 'Pending'}</div>
                  {currentUser && currentUser.id === challenge.creator._id && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">{participant.user.email}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{participant.usageSeconds ?? 0} sec</span>
                  {currentUser && currentUser.id === challenge.creator._id && participant.user._id !== currentUser.id && (
                    <button
                      onClick={() => handleRemoveParticipant(participant.user._id)}
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
              <LineChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#ced4da" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#868e96" />
                <YAxis stroke="#868e96" />
                <Tooltip wrapperClassName="bg-white/95 rounded-3xl border border-slate-200 shadow-soft dark:bg-slate-900" />
                <Line type="monotone" dataKey="seconds" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetails;
