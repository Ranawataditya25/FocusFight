import { NavLink } from 'react-router-dom';

const navItems = [
  {
    label: 'Home',
    path: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z" />
      </svg>
    ),
  },
  {
    label: 'Create',
    path: '/create',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 18h16M7 14V7m5 11V4m5 7v4" />
      </svg>
    ),
  },
  {
    label: 'Alerts',
    path: '/notifications',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22c1.104 0 2-.896 2-2H10c0 1.104.896 2 2 2Zm6-6V11c0-3.314-2.687-6-6-6S6 7.686 6 11v5l-2 2v1h16v-1l-2-2Z" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c4.418 0 8 1.791 8 4v1H4v-1c0-2.209 3.582-4 8-4Z" />
      </svg>
    ),
  },
];

const FloatingNav = ({ unreadCount = 0 }) => {
  return (
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-30 w-fit -translate-x-1/2 rounded-3xl border border-slate-200/20 bg-white/80 px-2 sm:px-3 py-2 sm:py-3 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
      <div className="flex items-center gap-1 sm:gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex min-w-[60px] sm:min-w-[72px] flex-col items-center justify-center gap-1 rounded-2xl px-2 sm:px-3 py-2 text-[10px] sm:text-[11px] font-medium transition ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 dark:bg-brand-600'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  {item.icon}
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default FloatingNav;
