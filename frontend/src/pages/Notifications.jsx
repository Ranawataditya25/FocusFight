import { useEffect, useState } from 'react';
import { notificationApi } from '../api';

const Notifications = ({ onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.list();
      setNotifications(res.notifications);
      if (onUnreadCountChange) {
        const unread = res.notifications.filter((item) => !item.read).length;
        onUnreadCountChange(unread);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const unreadNotifications = notifications.filter((item) => !item.read);
  const grouped = notifications.reduce((acc, item) => {
    const key = item.challenge?._id || 'general';
    const title = item.challenge?.title || 'General updates';
    if (!acc[key]) acc[key] = { title, notifications: [] };
    acc[key].notifications.push(item);
    return acc;
  }, {});
  const challengeGroups = Object.entries(grouped).sort((a, b) => b[1].notifications.filter((item) => !item.read).length - a[1].notifications.filter((item) => !item.read).length);

  const ChallengeGroupCard = ({ group, markRead }) => {
    const [expanded, setExpanded] = useState(false);
    const unreadCount = group.notifications.filter((item) => !item.read).length;

    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full px-5 py-4 text-left"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{group.title}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.notifications.length} message{group.notifications.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-rose-500 px-2 text-xs font-semibold text-white">{unreadCount}</span>
              )}
              <span className="text-sm text-slate-500 dark:text-slate-400">{expanded ? 'Collapse' : 'Expand'}</span>
            </div>
          </div>
        </button>
        {expanded && (
          <div className="space-y-3 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
            {group.notifications.map((item) => (
              <div key={item._id} className={`rounded-3xl border p-4 ${item.read ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950' : 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/10'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm leading-6 text-slate-900 dark:text-slate-100">{item.message}</p>
                    {item.actorName && (
                      <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {item.actorName}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      {item.actorEmail && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>{item.actorEmail}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!item.read && (
                      <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-100">New</span>
                    )}
                    <button
                      type="button"
                      onClick={() => markRead(item._id)}
                      className="rounded-2xl border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Mark read
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/85">
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Notifications</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Stay updated on invites, responses, and challenge activity from your group.</p>
        {unreadNotifications.length > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-3xl bg-brand-500/10 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/15 dark:text-brand-100">
            <span className="font-semibold">{unreadNotifications.length} new request{unreadNotifications.length > 1 ? 's' : ''}</span>
            <span>Waiting in your notification feed.</span>
          </div>
        )}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/85">
        {loading ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">No new notifications yet.</div>
        ) : (
          <div className="space-y-4">
            {challengeGroups.map(([groupId, group]) => (
              <ChallengeGroupCard
                key={groupId}
                group={group}
                markRead={markRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
