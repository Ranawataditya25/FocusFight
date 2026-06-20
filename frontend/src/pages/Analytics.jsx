import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { challengeApi } from '../api';
import StatsCard from '../components/StatsCard';

const Analytics = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    challengeApi.list()
      .then((result) => setChallenges(result.challenges || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const active = challenges.filter((c) => c.status === 'active').length;
    const completed = challenges.filter((c) => c.status === 'completed').length;
    
    let totalUsageSeconds = 0;
    let validParticipants = 0;
    let under20MinsCount = 0;

    challenges.forEach((c) => {
      c.participants.forEach((p) => {
        if (p.usageSeconds !== undefined && p.usageSeconds !== null) {
          totalUsageSeconds += p.usageSeconds;
          validParticipants++;
          if (p.usageSeconds < 1200) {
            under20MinsCount++;
          }
        }
      });
    });

    const avgSeconds = validParticipants > 0 ? Math.floor(totalUsageSeconds / validParticipants) : 0;
    const avgMinutes = Math.floor(avgSeconds / 60);
    const avgHours = Math.floor(avgMinutes / 60);
    const remainingMins = avgMinutes % 60;
    const avgText = avgHours > 0 ? `${avgHours}h ${remainingMins}m` : `${avgMinutes}m`;

    const totalParticipants = challenges.reduce((sum, c) => sum + c.participants.length, 0);
    const completionRate = challenges.length > 0 ? Math.round((completed / challenges.length) * 100) : 0;

    // Build global top performers
    const allParticipants = [];
    challenges.forEach((c) => {
      c.participants.forEach((p) => {
        if (p.user && p.usageSeconds !== undefined) {
          allParticipants.push({
            name: p.user.name || p.user.email,
            challengeTitle: c.title,
            usageSeconds: p.usageSeconds,
          });
        }
      });
    });
    // Sort by lowest usage (best performers) and grab top 3
    const topPerformers = allParticipants
      .sort((a, b) => a.usageSeconds - b.usageSeconds)
      .slice(0, 3);

    return {
      cards: [
        { title: 'Total tracking', value: challenges.length, meta: 'All challenges joined or created' },
        { title: 'Total participants', value: totalParticipants, meta: 'Across all your challenges' },
        { title: 'Active challenges', value: active, meta: 'Currently running right now' },
        { title: 'Completed', value: completed, meta: 'Challenges successfully finished' },
      ],
      under20MinsCount,
      avgText,
      completionRate,
      topPerformers
    };
  }, [challenges]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Analytics hub</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Review challenge performance, leaderboard scores, and usage habits.</p>
          </div>
          <button onClick={() => navigate('/create')} className="rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
            New challenge
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">Loading analytics...</div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.cards.map((item) => (
              <StatsCard key={item.title} title={item.title} value={item.value} meta={item.meta} />
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Usage Breakdown */}
            <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85 lg:col-span-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Usage breakdown</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-6 dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-transform hover:-translate-y-1">
                  <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Focus windows</p>
                  <p className="mt-3 text-4xl font-bold text-brand-500 dark:text-brand-400">{stats.under20MinsCount}</p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">Total sessions across all participants where usage successfully stayed below 20 minutes.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-6 dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-transform hover:-translate-y-1">
                  <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Avg Social Time</p>
                  <p className="mt-3 text-4xl font-bold text-rose-500 dark:text-rose-400">{stats.avgText}</p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">The average daily usage logged across all tracked users. Lower is better.</p>
                </div>
              </div>
              
              <div className="mt-5 rounded-3xl bg-slate-50 p-6 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Challenge Completion Rate</p>
                  <span className="font-bold text-slate-900 dark:text-white">{stats.completionRate}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-1000 ease-out" style={{ width: `${stats.completionRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Global Top Performers */}
            <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-5">Global Leaderboard</h2>
              {stats.topPerformers.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No participant data available yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.topPerformers.map((user, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 font-bold">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.challengeTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {Math.floor(user.usageSeconds / 60)}m
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
