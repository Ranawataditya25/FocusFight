const Settings = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/20 bg-white/80 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Adjust preferences for dark mode, notifications, and tracking behavior.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/20 bg-slate-50 p-6 shadow-soft dark:border-slate-700/60 dark:bg-slate-900">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Interface mode</p>
          <p className="mt-3 text-lg text-slate-900 dark:text-slate-200">{user?.settings?.darkMode ? 'Dark' : 'Light'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/20 bg-slate-50 p-6 shadow-soft dark:border-slate-700/60 dark:bg-slate-900">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Usage access</p>
          <p className="mt-3 text-lg text-slate-900 dark:text-slate-200">Android Usage Access required for tracking challenges.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
