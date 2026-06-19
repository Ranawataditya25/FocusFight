import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { challengeApi } from '../api';
import StatsCard from '../components/StatsCard';

const Dashboard = ({ user }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    challengeApi.list()
      .then((result) => setChallenges(result.challenges))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Welcome back</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{user?.name || 'Focus fighter'}</h1>
          </div>
          <Link className="rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400" to="/create">
            New challenge
          </Link>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total challenges" value={challenges.length} meta="Active, pending, etc" />
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
                  <span>Ends {new Date(challenge.endDate).toLocaleDateString()}</span>
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
