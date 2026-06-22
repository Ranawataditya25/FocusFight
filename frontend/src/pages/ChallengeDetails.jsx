import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { challengeApi, usageApi } from '../api';
import { RealAppIcon } from '../components/AppIcon';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getUserFromToken } from '../auth';
import { Clipboard } from '@capacitor/clipboard';
import PrizePoolPreview from '../components/PrizePoolPreview';
import { useChallenges } from '../context/ChallengeContext';

const CustomTick = (props) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="currentColor" transform="rotate(-45)" className="text-slate-700 dark:text-slate-300 text-xs font-medium">
        {payload.value}
      </text>
    </g>
  );
};

const ChallengeDetails = () => {
  const { code } = useParams();
  const { fetchChallenges } = useChallenges();
  const [challenge, setChallenge] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
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
    if (!sec) return '0 min';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getCreditsForRank = (index) => {
    let fallbackDays = 1;
    if (challenge.durationType === 'week') fallbackDays = 7;
    else if (challenge.durationType === 'month') fallbackDays = 30;
    else if (challenge.durationType === 'custom') fallbackDays = challenge.durationValue || 7;
    
    const participantsCount = challenge.participants.length;
    const entryFee = challenge.entryFee || 0;
    const totalPrizePool = entryFee > 0 ? (entryFee * participantsCount) : (fallbackDays * 10);

    let effectivePayoutStructure = challenge.payoutStructure;
    if (participantsCount <= 2) {
      effectivePayoutStructure = 'winner_takes_all';
    } else if (participantsCount === 3 && challenge.payoutStructure === 'top_half') {
      effectivePayoutStructure = 'top_3';
    }

    let rankPercentages = [];
    if (effectivePayoutStructure === 'winner_takes_all') {
      rankPercentages = [1.0];
    } else if (effectivePayoutStructure === 'top_3') {
      rankPercentages = [0.5, 0.3, 0.2];
    } else if (effectivePayoutStructure === 'top_half') {
      const winnersCount = Math.max(1, Math.floor(participantsCount / 2));
      const split = 1.0 / winnersCount;
      rankPercentages = Array(winnersCount).fill(split);
    }

    if (index >= rankPercentages.length) return 0;
    
    if (index === rankPercentages.length - 1) {
      let totalGiven = 0;
      for (let j = 0; j < index; j++) {
        totalGiven += Math.floor(totalPrizePool * rankPercentages[j]);
      }
      return totalPrizePool - totalGiven;
    }
    return Math.floor(totalPrizePool * rankPercentages[index]);
  };

  const sortedParticipants = challenge ? [...challenge.participants].sort((a, b) => (a.usageSeconds || 0) - (b.usageSeconds || 0)) : [];

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
      setIsDeleting(true);
      await challengeApi.delete(challenge._id);
      fetchChallenges(true);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to delete challenge');
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    try {
      setIsLeaving(true);
      await challengeApi.delete(challenge._id);
      fetchChallenges(true);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to leave challenge');
      setIsLeaving(false);
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
          {challenge.status !== 'completed' && (
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
          )}
        </div>

        <div className="mt-6">
          <PrizePoolPreview 
            durationType={challenge.durationType} 
            durationValue={challenge.durationValue} 
            maxParticipants={challenge.maxParticipants}
            entryFee={challenge.entryFee}
            payoutStructure={challenge.payoutStructure}
            currentParticipants={challenge.participants.length}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {challenge.apps.map((app) => (
            <span key={app} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <RealAppIcon appName={app} />
              {app}
            </span>
          ))}
        </div>
      </div>

      <div className={`grid gap-5 ${challenge.status === 'completed' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
        <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {challenge.status === 'completed' ? 'Final Results' : 'Participant summary'}
          </h2>
          <div className="mt-5 space-y-3">
            {challenge.status === 'completed' ? (
              sortedParticipants.map((participant, index) => {
                const credits = getCreditsForRank(index);
                return (
                  <div key={participant.user._id} className="flex flex-col gap-3 rounded-3xl border border-slate-200/50 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' : index === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : index === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'}`}>
                          #{index + 1}
                        </div>
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {participant.user.name}
                          {currentUser && participant.user._id === currentUser.id && (
                            <span className="ml-2 shrink-0 text-[10px] font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full">(You)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pl-11">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{formatSeconds(participant.usageSeconds)}</span>
                      <div className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${credits > 0 ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        +{credits} cr
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              challenge.participants.map((participant) => (
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
              ))
            )}
          </div>
        </div>
        {challenge.status !== 'completed' && (
          <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Usage trend</h2>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#ced4da" strokeDasharray="4 4" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  interval={0} 
                  height={60} 
                  tick={<CustomTick />} 
                />
                <YAxis stroke="#868e96" />
                <Tooltip 
                  wrapperClassName="bg-white/95 rounded-3xl border border-slate-200 shadow-soft"
                  labelStyle={{ color: 'black', fontWeight: 'bold' }}
                  itemStyle={{ color: 'black', fontWeight: '500' }}
                  formatter={(value) => {
                    if (value >= 60) {
                      return [`${Math.floor(value / 60)}h ${value % 60}m`, 'Usage'];
                    }
                    return [`${value} min`, 'Usage'];
                  }}
                />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}
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
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-3xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                {isDeleting ? 'Deleting...' : 'Delete permanently'}
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
                disabled={isLeaving}
                className="inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-rose-500 hover:text-white dark:border-slate-600 dark:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLeaving ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                {isLeaving ? 'Leaving...' : 'Leave challenge'}
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
