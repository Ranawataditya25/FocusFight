import { useEffect, useState } from 'react';
import { authApi } from '../api';
import { getUserFromToken } from '../auth';

const Leaderboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getUserFromToken();

  useEffect(() => {
    authApi.leaderboard()
      .then((result) => setEntries(result.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Global Leaderboard</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Compete with focus fighters globally. Rankings are based on total credits earned.</p>
      </div>
      
      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">No fighters found.</div>
      ) : (
        <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
          <div className="grid gap-4">
            {entries.map((item, index) => (
              <div key={item._id} className="flex items-center justify-between gap-4 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' : index === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : index === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'}`}>
                    #{index + 1}
                  </div>
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {item.name || item.email}
                    {currentUser && (item._id === currentUser.id || item._id === currentUser._id) && (
                      <span className="ml-3 shrink-0 text-xs font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-2 py-1 rounded-full">(You)</span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 whitespace-nowrap rounded-3xl bg-brand-500/10 px-3 py-1.5 text-sm font-bold text-brand-600 dark:text-brand-300">
                  {item.credits || 0} cr
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
