import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { challengeApi } from '../api';
import StatsCard from '../components/StatsCard';
import { hasUsagePermission, requestUsagePermission, syncAllChallengesUsage } from '../utils/usageTracker';

const Dashboard = ({ user }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/invite/${joinCode.trim()}`);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        let result = await challengeApi.list();
        let active = result.challenges.filter((c) => c.status === 'active');
        
        const now = new Date();
        const finished = active.filter((c) => new Date(c.endDate) <= now);
        if (finished.length > 0) {
          for (const c of finished) {
            try {
              await challengeApi.complete(c._id);
            } catch (err) {
              console.error('Failed to auto-complete challenge', err);
            }
          }
          // Refetch to get updated statuses and credits
          result = await challengeApi.list();
          active = result.challenges.filter((c) => c.status === 'active');
        }

        if (!mounted) return;
        setChallenges(result.challenges);

        if (active.length > 0) {
          const hasPerm = await hasUsagePermission();
          if (!hasPerm) await requestUsagePermission();
          await syncAllChallengesUsage(active);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-4 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Welcome back</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{user?.name || 'Focus fighter'}</h1>
          </div>
          <div className="mt-6 flex flex-col gap-6 sm:mt-0 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Join an existing challenge</p>
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste 8-char code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full sm:w-44 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
                <button type="submit" className="rounded-3xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                  Join
                </button>
              </form>
            </div>

            <div className="hidden h-10 w-px bg-slate-200 dark:bg-slate-700 sm:block"></div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Start a new challenge</p>
              <Link className="flex w-full items-center justify-center rounded-3xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400 whitespace-nowrap" to="/create">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5 h-4 w-4">
                  <path d="M12 5v14m-7-7h14" />
                </svg>
                New Challenge
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total challenges" value={challenges.length} meta="Active, pending" />
        <StatsCard title="Active challenges" value={challenges.filter((item) => item.status === 'active').length} meta="Currently tracking" />
        <StatsCard title="Total participants" value={challenges.reduce((sum, item) => sum + item.participants.length, 0)} meta="Current joined users" />
        <StatsCard title="Credits available" value={user?.credits ?? 0} meta="Redeem on completion" />
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your challenges</h2>
          <Link className="text-sm text-brand-500 hover:text-brand-400 dark:text-brand-300 dark:hover:text-brand-200" to="/leaderboard">View leaderboard</Link>
        </div>
        {loading ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">Loading challenges...</div>
        ) : challenges.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">No challenges created yet.</div>
        ) : (
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Link key={challenge._id} to={`/challenge/${challenge.inviteCode}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-500 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{challenge.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{challenge.apps.join(', ')}</p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">{challenge.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span>{challenge.participants.length} participants</span>
                  <span>{challenge.status === 'pending' ? 'Starts when joined' : `Ends ${new Date(challenge.endDate).toLocaleDateString()}`}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
