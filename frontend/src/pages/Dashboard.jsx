import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { challengeApi } from '../api';
import StatsCard from '../components/StatsCard';
import { hasUsagePermission, requestUsagePermission, syncAllChallengesUsage } from '../utils/usageTracker';
import { App as CapacitorApp } from '@capacitor/app';
import { RealAppIcon } from '../components/AppIcon';

const Dashboard = ({ user, refreshUser }) => {
  useEffect(() => {
    if (refreshUser) refreshUser();
  }, [refreshUser]);

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [userApps, setUserApps] = useState([]);
  const navigate = useNavigate();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const interceptPermission = async (actionFn) => {
    try {
      const hasPerm = await hasUsagePermission();
      if (!hasPerm) {
        setPendingAction(() => actionFn);
        setShowPermissionModal(true);
      } else {
        if (actionFn) actionFn();
      }
    } catch (err) {
      console.error("Permission intercept failed:", err);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCode.trim()) return;

    // Local validation if user already has it
    const existing = challenges.find(c => c.inviteCode === joinCode.trim());
    if (existing) {
      if (existing.creator._id === user.id) {
        setJoinError("You are the creator of this challenge.");
        return;
      }
      setJoinError("You have already joined this challenge.");
      return;
    }

    try {
      // Pre-check network validation
      const res = await challengeApi.getByInviteCode(joinCode.trim());
      if (!res || !res.challenge) {
        setJoinError("Invalid code. Challenge not found.");
        return;
      }
      if (res.challenge.status === 'completed') {
        setJoinError("This challenge has already ended.");
        return;
      }
      
      interceptPermission(() => navigate(`/invite/${joinCode.trim()}`));
    } catch (err) {
      setJoinError("Invalid code. Challenge not found.");
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    interceptPermission(() => navigate('/create'));
  };

  useEffect(() => {
    let mounted = true;
    // Fetch live usage history for UI
    const fetchLiveUsage = (activeList) => {
      import('../utils/usageTracker').then(async ({ getAndroidUsageStats, hasUsagePermission }) => {
        try {
          const hasPerm = await hasUsagePermission();
          if (!hasPerm) return;

          const activeChallenges = activeList.filter(c => c.status === 'active');
          const earliestStart = activeChallenges.length > 0 
            ? Math.min(...activeChallenges.map(c => new Date(c.startDate || c.createdAt).getTime()))
            : null;

          const stats = await getAndroidUsageStats(earliestStart);
          if (mounted) {
            const trackedApps = [...new Set(activeChallenges.flatMap(c => c.apps))];

            const processed = trackedApps.map(appName => {
              const stat = stats ? stats.find(s => s.appName === appName) : null;
              const totalMinutes = stat ? Math.floor(stat.secondsUsed / 60) : 0;
              let timeString = `${totalMinutes} min`;
              if (totalMinutes >= 60) {
                const hrs = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                timeString = `${hrs} hr ${mins} min`;
              }
              return {
                name: appName,
                minutes: totalMinutes,
                displayTime: timeString
              };
            }).sort((a, b) => b.minutes - a.minutes);
            
            setUserApps(processed);
          }
        } catch (err) {
          console.error("UI Data Load Error:", err);
        }
      });
    };

    const loadData = async () => {
      try {
        let result = await challengeApi.list();
        let active = result.challenges.filter((c) => c.status === 'active');
        
        if (active.length > 0) {
          const hasPerm = await hasUsagePermission();
          if (!hasPerm) {
            setShowPermissionModal(true);
          } else {
            await syncAllChallengesUsage(active);
          }
        }

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
        fetchLiveUsage(result.challenges);

        import('../utils/notifications').then(({ scheduleChallengeEndAlert }) => {
          active.forEach(scheduleChallengeEndAlert);
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    // Listen for when the app comes back to the foreground
    const nativeListener = CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
      if (isActive && mounted) {
        console.log("App became active again! Re-fetching stats...");
        
        const hasPerm = await hasUsagePermission();
        if (!hasPerm) {
           setShowPermissionModal(true);
        } else {
           setShowPermissionModal(false);
           // Attempt sync if they just granted it
           challengeApi.list().then(res => {
             const act = res.challenges.filter(c => c.status === 'active');
             if (act.length > 0) syncAllChallengesUsage(act);
           });
        }

        // Use functional state pattern to get the freshest challenges array
        setChallenges(prev => {
          fetchLiveUsage(prev);
          return prev;
        });
      }
    });

    return () => { 
      mounted = false; 
      nativeListener.then(l => l.remove());
    };
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
                  placeholder="Paste code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full sm:w-44 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
                <button type="submit" className="rounded-3xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                  Join
                </button>
              </form>
              {joinError && <p className="text-xs font-semibold text-rose-500 dark:text-rose-400">{joinError}</p>}
            </div>

            <div className="hidden h-10 w-px bg-slate-200 dark:bg-slate-700 sm:block"></div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Start a new challenge</p>
              <button onClick={handleCreate} className="flex w-full items-center justify-center rounded-3xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400 whitespace-nowrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5 h-4 w-4">
                  <path d="M12 5v14m-7-7h14" />
                </svg>
                New Challenge
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-3xl border border-slate-200/20 bg-white/80 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading overview...</div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total challenges" value={challenges.length} meta="Active, Pending & Completed" />
          <StatsCard title="Active challenges" value={challenges.filter((item) => item.status === 'active').length} meta="Currently tracking" />
          <StatsCard title="Total participants" value={challenges.reduce((sum, item) => sum + item.participants.length, 0)} meta="Current joined users" />
          <StatsCard title="Credits available" value={user?.credits ?? 0} meta="Redeem on completion" />
        </div>
      )}

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
            {challenges.slice(0, 3).map((challenge) => {
              const isCreator = challenge.creator && challenge.creator._id === user?.id;
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
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span>{challenge.participants.length} participants</span>
                  <span>{challenge.status === 'pending' ? 'Starts when joined' : `Ends ${new Date(challenge.endDate).toLocaleDateString()}`}</span>
                </div>
              </Link>
            )})}
            {challenges.length > 3 && (
              <div className="flex justify-center pt-2">
                <Link to="/challenges" className="rounded-3xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                  View all challenges
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Live App Usage History</h2>
        {userApps.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No active app usage found yet. Enable permissions to start tracking live stats.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {userApps.map((app, i) => (
              <div key={i} className="flex min-w-[140px] flex-1 items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <RealAppIcon appName={app.name} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{app.name}</span>
                </div>
                <span className="shrink-0 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {app.displayTime}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Usage Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200/50 bg-white p-6 shadow-xl dark:border-slate-700/50 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-center text-lg font-semibold text-slate-900 dark:text-white">Usage Access Required</h3>
            <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
              FocusFight needs "Usage Access" permission to track your app time and calculate your challenge progress.
            </p>
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <strong>How to enable:</strong>
              <ol className="ml-4 mt-1 list-decimal space-y-1">
                <li>Click the settings button below</li>
                <li>Find and tap <strong>FocusFight</strong></li>
                <li>Toggle <strong>Allow usage tracking</strong></li>
              </ol>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={async () => {
                  await requestUsagePermission();
                  // The appStateChange listener will handle re-verifying when they return
                }}
                className="rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
              >
                Continue to Settings
              </button>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  setPendingAction(null);
                }}
                className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
