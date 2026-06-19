import { Link } from 'react-router-dom';

const Landing = ({ user, theme, toggleTheme }) => {
  return (
    <main className="space-y-4 flex-1">
      <section className="rounded-[2rem] glass-panel p-4">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-200">Digital wellbeing challenge</p>
            <h1 className="text-4xl font-semibold sm:text-5xl">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">FocusFight</span> helps groups beat distraction and build healthy app habits.
            </h1>
            <p className="max-w-xl text-slate-700 dark:text-slate-300">Create shared challenges, track Android app usage, compare results, and reward the most focused participants.</p>
            <div className="flex flex-wrap gap-4">
              <Link className="rounded-2xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400" to={user ? '/dashboard' : '/register'}>
                Start a challenge
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem]">
            <div className="rounded-3xl bg-gradient-to-br from-slate-50/60 to-white/60 p-6 dark:from-slate-800/60 dark:to-slate-950/60 glass-panel">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Why FocusFight</h2>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-400">Turn accountability into a friendly challenge—reduce distracting app time together and celebrate improvements.</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Create group challenges and invite friends instantly</li>
                <li>• Track app usage on Android with UsageStats integration</li>
                <li>• See participant details, analytics, and leaderboards</li>
                <li>• Remove participants or delete challenges as creator</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl glass-panel p-4">
          <h3 className="font-semibold">Problem solved</h3>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">FocusFight helps groups reduce time spent in attention-draining social apps by creating social incentives to stay off feeds.</p>
        </div>
        <div className="rounded-2xl glass-panel p-4">
          <h3 className="font-semibold">Who it's for</h3>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Friends, study groups, and teams who want mutual accountability without intrusive tracking.</p>
        </div>
        <div className="rounded-2xl glass-panel p-4">
          <h3 className="font-semibold">Get started</h3>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Sign up, create a challenge, invite friends via link, and monitor analytics on the hub.</p>
        </div>
      </section>
      
      {!user && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-30 w-[min(700px,calc(100%-16px))] sm:w-[min(700px,calc(100%-32px))] -translate-x-1/2 rounded-3xl border border-slate-200/20 bg-white/90 px-3 sm:px-4 py-2 sm:py-3 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="pl-1 sm:pl-0">
              <span className="text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">FocusFight</span>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/90 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-950/90 dark:text-slate-200 dark:hover:bg-slate-900"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></svg>
                )}
              </button>
              <Link className="rounded-2xl border border-brand-500/20 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20" to="/login">Login</Link>
              <Link className="rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400" to="/register">Register</Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Landing;
