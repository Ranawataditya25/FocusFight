import { useEffect, useState, useMemo } from 'react';
import { challengeApi } from '../api';

const Leaderboard = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    challengeApi.list()
      .then((result) => setChallenges(result.challenges || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const entries = useMemo(() => {
    const userMap = {};

    challenges.forEach((c) => {
      if (c.status === 'active') {
        c.participants.forEach((p) => {
          if (p.user && p.usageSeconds !== undefined && p.usageSeconds !== null) {
            const uid = p.user._id;
            if (!userMap[uid]) {
              userMap[uid] = { name: p.user.name || p.user.email, totalUsage: 0, count: 0 };
            }
            userMap[uid].totalUsage += p.usageSeconds;
            userMap[uid].count++;
          }
        });
      }
    });

    const list = Object.values(userMap).map((u) => {
      const avgMinutes = Math.floor((u.totalUsage / u.count) / 60);
      const score = Math.max(0, 100 - avgMinutes);
      const credit = Math.max(0, score * 2);
      return { ...u, score, credit };
    });

    list.sort((a, b) => b.score - a.score);

    return list.map((item, index) => ({ ...item, rank: index + 1 }));
  }, [challenges]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Leaderboard</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Compare performance across active challenges and claim rewards for the lowest app usage.</p>
      </div>
      
      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">No active challenges found.</div>
      ) : (
        <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
          <div className="grid gap-4">
            {entries.map((item) => (
              <div key={item.rank} className="flex items-center justify-between rounded-3xl bg-slate-50 p-5 dark:bg-slate-900">
                <div>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">#{item.rank} {item.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Score: {item.score}</p>
                </div>
                <div className="rounded-3xl bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-300">+{item.credit} credits</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
