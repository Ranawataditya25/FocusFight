import { usageApi } from '../api';
import { registerPlugin, Capacitor } from '@capacitor/core';

const UsageStats = registerPlugin('UsageStats');
const getUsageStatsPlugin = () => UsageStats;

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
  if (!Capacitor.isNativePlatform()) return true;
  
  try {
    const plugin = getUsageStatsPlugin();
    if (plugin?.hasUsagePermission) {
      const result = await plugin.hasUsagePermission();
      return result?.granted ?? false;
    }
  } catch (err) {
    console.warn("UsageStats plugin not available:", err);
  }
  return false;
};

export const requestUsagePermission = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log("Mocking permission request on Web...");
    return { granted: true };
  }

  try {
    const plugin = getUsageStatsPlugin();
    if (plugin?.requestUsagePermission) {
      return await plugin.requestUsagePermission();
    }
  } catch (err) {
    console.warn("UsageStats plugin not available:", err);
  }
  return { granted: false };
};

export const getAndroidUsageStats = async (startTime = null) => {
  if (!Capacitor.isNativePlatform()) {
    console.log("Generating mock usage data for Web...");
    return Object.values(PACKAGE_TO_APP_MAP).map(appName => ({
      appName,
      secondsUsed: Math.floor(Math.random() * 3600),
      recordedAt: new Date().toISOString()
    }));
  }

  try {
    const plugin = getUsageStatsPlugin();
    if (plugin?.queryUsageStats) {
      // Default to the start of the current calendar day if no startTime provided
      const defaultStart = new Date();
      defaultStart.setHours(0, 0, 0, 0);
      const queryStart = startTime ? startTime : defaultStart.getTime();

      const result = await plugin.queryUsageStats({ start: queryStart });
      if (result && result.stats) {
        return result.stats
          .filter(stat => PACKAGE_TO_APP_MAP[stat.packageName])
          .map(stat => ({
            appName: PACKAGE_TO_APP_MAP[stat.packageName],
            secondsUsed: Math.round(stat.milliseconds / 1000),
            recordedAt: new Date().toISOString()
          }));
      }
    }
  } catch (e) {
    console.warn('Failed to fetch native usage stats', e);
  }
  
  return [];
};

export const syncAllChallengesUsage = async (activeChallenges) => {
  try {
    for (const challenge of activeChallenges) {
      // Use challenge start date (or created date) as the baseline
      const startTime = new Date(challenge.startDate || challenge.createdAt).getTime();
      const stats = await getAndroidUsageStats(startTime);
      
      if (stats.length === 0) continue;

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
