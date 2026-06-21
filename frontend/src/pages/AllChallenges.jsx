import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { challengeApi } from '../api';

const AllChallenges = ({ user }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    challengeApi.list()
      .then((result) => setChallenges(result.challenges || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">All challenges</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">View all your active, pending, and completed challenges.</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex shrink-0 h-12 w-12 items-center justify-center rounded-2xl transition ${showFilters ? 'bg-brand-500 text-white shadow-md' : 'border border-slate-200/50 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            aria-label="Toggle filters"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0 w-12 sm:w-auto">Status</span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'completed', label: 'Completed' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setStatusFilter(opt.id)}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
                      statusFilter === opt.id
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'bg-white/80 text-slate-600 border border-slate-200/50 hover:bg-white dark:bg-slate-900/80 dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0 w-12 sm:w-auto">Role</span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'creator', label: 'Created' },
                    { id: 'participant', label: 'Joined' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setRoleFilter(opt.id)}
                      className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
                        roleFilter === opt.id
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                          : 'bg-white/80 text-slate-600 border border-slate-200/50 hover:bg-white dark:bg-slate-900/80 dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0 w-12 sm:w-auto">Sort</span>
                <button
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-white dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${sortOrder === 'newest' ? 'rotate-0' : 'rotate-180'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">Loading challenges...</div>
      ) : (() => {
        const filtered = challenges.filter(c => {
          if (statusFilter !== 'all' && c.status !== statusFilter) return false;
          const isCreator = c.creator && c.creator._id === user.id;
          if (roleFilter === 'creator' && !isCreator) return false;
          if (roleFilter === 'participant' && isCreator) return false;
          return true;
        }).sort((a, b) => {
          const tA = new Date(a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt || 0).getTime();
          return sortOrder === 'newest' ? tB - tA : tA - tB;
        });

        if (filtered.length === 0) {
          return <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">No challenges found.</div>;
        }

        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((challenge) => {
              const isCreator = challenge.creator && challenge.creator._id === user.id;
              return (
                <Link key={challenge._id} to={`/challenge/${challenge.inviteCode}`} className="block w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-500 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white break-words line-clamp-2">{challenge.title}</h3>
                        {isCreator && (
                          <span className="shrink-0 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 mt-1">Creator</span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{challenge.apps.join(', ')}</p>
                    </div>
                    <span className="shrink-0 w-fit rounded-full bg-slate-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">{challenge.status}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{new Date(challenge.createdAt).toLocaleDateString()}</span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {challenge.participants.length} players
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default AllChallenges;
