import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateChallenge from './pages/CreateChallenge';
import InvitePage from './pages/Invite';
import ChallengeDetails from './pages/ChallengeDetails';
import Analytics from './pages/Analytics';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingNav from './components/FloatingNav';
import TopNav from './components/TopNav';
import { authApi, notificationApi } from './api';
import { getToken, removeToken, setToken } from './auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem('focusfight_theme');
    if (stored) return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const refreshUnreadNotifications = async () => {
    if (!getToken()) {
      setUnreadCount(0);
      return;
    }
    try {
      const result = await notificationApi.list();
      const unread = result.notifications.filter((item) => !item.read).length;
      setUnreadCount(unread);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then((result) => {
        setUser(result.user);
        refreshUnreadNotifications();
      })
      .catch(() => {
        removeToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.dataset.theme = theme;
    localStorage.setItem('focusfight_theme', theme);
  }, [theme]);

  const handleAuthSuccess = (token, userData) => {
    setToken(token);
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    navigate('/');
  };

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {user && <TopNav theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />}
      <div className={`mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 ${user ? 'pt-20 sm:pt-24' : 'py-6'} pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-6 lg:px-8`}>
        <Routes>
          <Route path="/" element={<Landing user={user} theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/login" element={<Login onAuth={handleAuthSuccess} theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/register" element={<Register onAuth={handleAuthSuccess} theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/invite/:code" element={<InvitePage />} />
          <Route element={<ProtectedRoute user={user} loading={loading} />}>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/create" element={<CreateChallenge user={user} />} />
            <Route path="/challenge/:code" element={<ChallengeDetails />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/notifications" element={<Notifications onUnreadCountChange={setUnreadCount} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/settings" element={<Settings user={user} />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {user && <FloatingNav theme={theme} onToggleTheme={toggleTheme} user={user} onLogout={handleLogout} unreadCount={unreadCount} />}
    </div>
  );
}

export default App;
