import { Link, useLocation, useNavigate } from 'react-router-dom';

const TopNav = ({ theme, onToggleTheme, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 border-b border-slate-200/20 shadow-sm backdrop-blur-xl dark:bg-slate-950/85 dark:border-slate-800/60 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {!isDashboard && (
            <button
              onClick={() => navigate(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/90 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-950/90 dark:text-slate-200 dark:hover:bg-slate-900"
              aria-label="Go back"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {isDashboard && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">
                FocusFight
              </span>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/90 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-950/90 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
