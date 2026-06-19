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

    return {
      cards: [
        { title: 'Total tracking', value: challenges.length, meta: 'All challenges joined or created' },
        { title: 'Active challenges', value: active, meta: 'Currently running right now' },
        { title: 'Completed', value: completed, meta: 'Challenges successfully finished' },
      ],
      under20MinsCount,
      avgText
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
          <div className="grid gap-5 md:grid-cols-3">
            {stats.cards.map((item) => (
              <StatsCard key={item.title} title={item.title} value={item.value} meta={item.meta} />
            ))}
          </div>
          <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Usage breakdown</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Focus windows</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{stats.under20MinsCount}</p>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Sessions across all participants where usage stayed below 20 minutes.</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Average social time</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{stats.avgText}</p>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Average daily usage across all tracked participants.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
