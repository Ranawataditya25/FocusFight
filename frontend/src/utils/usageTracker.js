const getUsageStatsPlugin = () => window.Capacitor?.Plugins?.UsageStats;

export const hasUsagePermission = async () => {
  const plugin = getUsageStatsPlugin();
  if (plugin?.hasUsagePermission) {
    const result = await plugin.hasUsagePermission();
    return result?.granted ?? false;
  }
  return false;
};

export const requestUsagePermission = async () => {
  const plugin = getUsageStatsPlugin();
  if (plugin?.requestUsagePermission) {
    return plugin.requestUsagePermission();
  }
  return { granted: false };
};

export const syncUsageData = async (data) => {
  return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/usage/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('focusfight_token')}`,
    },
    body: JSON.stringify(data),
  }).then((response) => response.json());
};
