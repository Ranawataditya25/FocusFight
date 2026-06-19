import { useState } from 'react';

const Profile = ({ user }) => {
  const [profile] = useState(user);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Your profile</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Manage account info, credits, and app access from one place.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/20 bg-slate-50 p-6 text-slate-700 shadow-soft dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-300">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Name</p>
          <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{profile?.name}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/20 bg-slate-50 p-6 text-slate-700 shadow-soft dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-300">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Email</p>
          <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{profile?.email}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Credits</h2>
        <p className="mt-3 text-3xl font-semibold text-brand-500 dark:text-brand-300">{profile?.credits ?? 0}</p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Earn credits for challenge wins and healthy tracking habits.</p>
      </div>
    </div>
  );
};

export default Profile;
