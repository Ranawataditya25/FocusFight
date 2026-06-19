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

import { usageApi } from '../api';

export const syncUsageData = async (data) => {
  return usageApi.sync(data);
};
