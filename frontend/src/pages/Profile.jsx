import { useEffect } from 'react';

const Profile = ({ user, onLogout, refreshUser }) => {
  useEffect(() => {
    if (refreshUser) refreshUser();
  }, [refreshUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Your profile</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Manage account info, credits, and app access from one place.</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-6 flex w-full justify-center items-center gap-2 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/20 bg-slate-50 p-6 text-slate-700 shadow-soft dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-300">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Name</p>
          <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{user?.name}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/20 bg-slate-50 p-6 text-slate-700 shadow-soft dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-300">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Email</p>
          <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{user?.email}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Credits</h2>
        <p className="mt-3 text-3xl font-semibold text-brand-500 dark:text-brand-300">{user?.credits ?? 0}</p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Earn credits for challenge wins and healthy tracking habits.</p>
      </div>
    </div>
  );
};

export default Profile;
