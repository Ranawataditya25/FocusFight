import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { challengeApi } from '../api';
import { appOptions, AppIcon } from '../components/AppIcon';
import { Clipboard } from '@capacitor/clipboard';

const durationOptions = [
  { label: '1 Day', value: 'day', durationValue: 1 },
  { label: '1 Week', value: 'week', durationValue: 7 },
  { label: '1 Month', value: 'month', durationValue: 30 },
  { label: 'Custom', value: 'custom', durationValue: 14 },
];

const CreateChallenge = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    title: '',
    description: '',
    apps: ['Instagram', 'YouTube'],
    durationType: 'week',
    durationValue: 7,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdChallenge, setCreatedChallenge] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [showMoreApps, setShowMoreApps] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const submitRef = useRef(false);
  const createdRef = useRef(null);

  const mainApps = appOptions.slice(0, 8);
  const extraApps = appOptions.slice(8);

  const toggleApp = (app) => {
    setState((prev) => ({
      ...prev,
      apps: prev.apps.includes(app) ? prev.apps.filter((item) => item !== app) : [...prev.apps, app],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || submitted || submitRef.current) return;
    setError('');

    if (!state.title.trim()) {
      setError('Please enter a challenge title.');
      return;
    }
    if (!state.apps.length) {
      setError('Choose at least one app to track.');
      return;
    }
    if (state.durationType === 'custom' && (!state.durationValue || state.durationValue < 1)) {
      setError('Enter a valid custom duration in days.');
      return;
    }

    submitRef.current = true;
    setLoading(true);
    try {
      const payload = {
        title: state.title.trim(),
        description: state.description.trim(),
        apps: state.apps,
        durationType: state.durationType,
        durationValue: state.durationValue,
      };
      const result = await challengeApi.create(payload);
      setCreatedChallenge(result.challenge);
      setShareLink(result.challenge.inviteCode);
      setSubmitted(true);
      setError('');
    } catch (err) {
      setError(err.message);
      submitRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (createdChallenge && createdRef.current) {
      createdRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [createdChallenge]);

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200/20 bg-white/70 p-4 sm:p-8 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Create a challenge</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Select apps, set a duration, and share a challenge link instantly.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-700/60 dark:bg-slate-900/80">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Suggested apps</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {mainApps.map((app) => (
                <button
                  type="button"
                  key={app}
                  onClick={() => toggleApp(app)}
                  className={`group flex items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                    state.apps.includes(app)
                      ? 'border-brand-500 bg-brand-500/10 text-slate-900 dark:text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                  }`}
                >
                  <AppIcon name={app} />
                  <div>
                    <div className="text-sm font-semibold">{app}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Tap to {state.apps.includes(app) ? 'remove' : 'select'}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">{state.apps.length} app{state.apps.length === 1 ? '' : 's'} selected</span>
              {extraApps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMoreApps((prev) => !prev)}
                  className="text-sm font-semibold text-brand-500 hover:text-brand-400"
                >
                  {showMoreApps ? 'Hide apps' : 'Show more'}
                </button>
              )}
            </div>

            {showMoreApps && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {extraApps.map((app) => (
                  <button
                    type="button"
                    key={app}
                    onClick={() => toggleApp(app)}
                    className={`group flex items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                      state.apps.includes(app)
                        ? 'border-brand-500 bg-brand-500/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                    }`}
                  >
                    <AppIcon name={app} />
                    <div>
                      <div className="text-sm font-semibold">{app}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              <span className="mb-2 block">Challenge title</span>
              <input
                value={state.title}
                onChange={(e) => setState({ ...state, title: e.target.value })}
                required
                placeholder="Weekend app reset"
                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              <span className="mb-2 block">Description</span>
              <textarea
                value={state.description}
                onChange={(e) => setState({ ...state, description: e.target.value })}
                rows="4"
                placeholder="Invite friends to avoid feed scrolling for a week."
                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              <span className="mb-2 block">Duration</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={state.durationType}
                  onChange={(e) => {
                    const option = durationOptions.find((item) => item.value === e.target.value);
                    setState({
                      ...state,
                      durationType: option.value,
                      durationValue: option.durationValue,
                    });
                  }}
                  className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {state.durationType === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={state.durationValue}
                    onChange={(e) => setState({ ...state, durationValue: Number(e.target.value) })}
                    placeholder="Days"
                    className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                )}
              </div>
            </label>
          </div>
        </div>

        {error && <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-3xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating challenge...' : 'Create challenge'}
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your custom duration works instantly and is included in each challenge invite.</p>
        </div>
      </form>

      {createdChallenge && (
        <div ref={createdRef} className="mt-10 rounded-3xl border border-slate-200/20 bg-white/85 p-6 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/85">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Invite ready</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Share your challenge code</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Give this 8-character code to anyone you want to join the challenge.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/challenge/${createdChallenge.inviteCode}`)}
              className="rounded-3xl border border-slate-300 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              View challenge
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              readOnly
              value={shareLink}
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-6 py-4 text-center text-xl font-bold tracking-widest text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await Clipboard.write({ string: shareLink });
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch (error) {
                  console.error(error);
                }
              }}
              className="rounded-3xl bg-brand-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-brand-400 whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateChallenge;
