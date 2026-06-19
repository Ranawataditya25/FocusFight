import { usageApi } from '../api';

const getUsageStatsPlugin = () => window.Capacitor?.Plugins?.UsageStats;

const PACKAGE_TO_APP_MAP = {
  'com.instagram.android': 'Instagram',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.snapchat.android': 'Snapchat',
  'com.twitter.android': 'X (Twitter)',
  'com.facebook.katana': 'Facebook',
  'com.reddit.frontpage': 'Reddit',
  'com.google.android.youtube': 'YouTube',
  'com.netflix.mediaclient': 'Netflix',
  'com.whatsapp': 'WhatsApp',
};

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

export const getAndroidUsageStats = async () => {
  const plugin = getUsageStatsPlugin();
  if (plugin?.queryUsageStats) {
    try {
      const result = await plugin.queryUsageStats({ start: Date.now() - 1000 * 60 * 60 * 24 });
      if (result && result.stats) {
        // Map package names to our readable app names
        return result.stats
          .map(stat => ({
            appName: PACKAGE_TO_APP_MAP[stat.packageName] || stat.packageName,
            secondsUsed: Math.round(stat.milliseconds / 1000),
            recordedAt: new Date().toISOString()
          }))
          .filter(stat => PACKAGE_TO_APP_MAP[stat.packageName]); // Only keep known apps to save bandwidth
      }
    } catch (e) {
      console.error('Failed to fetch usage stats', e);
    }
  }
  return [];
};

export const syncAllChallengesUsage = async (activeChallenges) => {
  try {
    const stats = await getAndroidUsageStats();
    if (stats.length === 0) return;

    for (const challenge of activeChallenges) {
      // Filter stats to only the apps this challenge cares about
      const challengeStats = stats.filter(stat => challenge.apps.includes(stat.appName));
      if (challengeStats.length > 0) {
        await usageApi.sync({ challengeId: challenge._id, records: challengeStats });
      }
    }
  } catch (err) {
    console.error('Failed to sync background usage', err);
  }
};
