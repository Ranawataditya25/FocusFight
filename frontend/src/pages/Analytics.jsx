import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { challengeApi, authApi } from '../api';
import { getUserFromToken } from '../auth';
import StatsCard from '../components/StatsCard';
import { RealAppIcon } from '../components/AppIcon';
import { formatSeconds } from '../utils/timeFormat';
import { useChallenges } from '../context/ChallengeContext';

const Analytics = () => {
  const navigate = useNavigate();
  const { challenges, loading } = useChallenges();
  const currentUser = getUserFromToken();

  const [dailyStats, setDailyStats] = useState({ loading: true, highestApp: null, dailyTotalSeconds: 0 });

  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);

  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    authApi.leaderboard()
      .then(res => setGlobalLeaderboard(res.leaderboard || []))
      .catch(() => setGlobalLeaderboard([]))
      .finally(() => setLeaderboardLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !challenges) return;

    const fetchUsage = async () => {
      try {
        const { getAndroidUsageStats } = await import('../utils/usageTracker');
        const stats = await getAndroidUsageStats();
        
        const challengeApps = new Set();
        challenges.forEach(c => c.apps.forEach(app => challengeApps.add(app)));
        
        if (challengeApps.size === 0 || stats.length === 0) {
          setDailyStats({ loading: false, highestApp: null, dailyTotalSeconds: 0 });
          return;
        }

        const dailyTracked = stats.filter(stat => challengeApps.has(stat.appName));
        let maxApp = null;
        let total = 0;
        
        dailyTracked.forEach(stat => {
          total += stat.secondsUsed;
          if (!maxApp || stat.secondsUsed > maxApp.secondsUsed) {
            maxApp = stat;
          }
        });
        
        setDailyStats({ loading: false, highestApp: maxApp, dailyTotalSeconds: total });
      } catch(err) {
        console.error("Failed to fetch daily stats", err);
        setDailyStats({ loading: false, highestApp: null, dailyTotalSeconds: 0 });
      }
    };
    fetchUsage();
  }, [challenges, loading]);

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
    const validChallenges = active + completed;
    const completionRate = validChallenges > 0 ? Math.round((completed / validChallenges) * 100) : 0;

    return {
      cards: [
        { title: 'Total tracking', value: challenges.length, meta: 'All challenges joined or created' },
        { title: 'Total participants', value: totalParticipants, meta: 'Across all your challenges' },
        { title: 'Active challenges', value: active, meta: 'Currently running right now' },
        { title: 'Completed', value: completed, meta: 'Challenges successfully finished' },
      ],
      under20MinsCount,
      avgText,
      completionRate
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
      
      {loading || leaderboardLoading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">Loading analytics...</div>
      ) : (
        <>
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.cards.map((item) => (
              <StatsCard key={item.title} title={item.title} value={item.value} meta={item.meta} />
            ))}
            <StatsCard 
              title="Highest used app today" 
              value={
                dailyStats.loading ? '...' : 
                dailyStats.highestApp ? (
                  <div className="flex items-center gap-3">
                    <RealAppIcon appName={dailyStats.highestApp.appName} />
                    <span>{dailyStats.highestApp.appName}</span>
                  </div>
                ) : '-'
              } 
              meta={dailyStats.loading ? 'Loading...' : (dailyStats.highestApp ? formatSeconds(dailyStats.highestApp.secondsUsed) : 'Nothing to show')} 
            />
            <StatsCard 
              title="Daily screen time" 
              value={dailyStats.loading ? '...' : formatSeconds(dailyStats.dailyTotalSeconds)} 
              meta="Tracked apps today" 
            />
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
            <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85 self-start">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Global Leaderboard</h2>
                <button onClick={() => navigate('/leaderboard')} className="text-sm font-semibold text-brand-500 hover:text-brand-400">View all</button>
              </div>
              {globalLeaderboard.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No participant data available yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {globalLeaderboard.slice(0, 3).map((user, i) => (
                    <div key={user._id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' : i === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500'}`}>
                          #{i + 1}
                        </div>
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {user.name || user.email}
                          {currentUser && (user._id === currentUser.id || user._id === currentUser._id) && (
                            <span className="ml-3 shrink-0 text-xs font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-2 py-1 rounded-full">(You)</span>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 whitespace-nowrap rounded-3xl bg-brand-500/10 px-3 py-1.5 text-sm font-bold text-brand-600 dark:text-brand-300">
                        {user.credits || 0} cr
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
