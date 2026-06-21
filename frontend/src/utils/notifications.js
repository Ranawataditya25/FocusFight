import { LocalNotifications } from '@capacitor/local-notifications';

export const requestNotificationPermission = async () => {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch (err) {
    console.warn("Failed to request notification permissions", err);
    return false;
  }
};

export const immediateAlert = async (title, body, id = Math.floor(Math.random() * 1000000)) => {
  try {
    const hasPerm = await requestNotificationPermission();
    if (!hasPerm) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
          sound: null,
          attachments: null,
          actionTypeId: '',
          extra: null,
        },
      ],
    });
  } catch (err) {
    console.error("Failed to send immediate local notification", err);
  }
};

export const scheduleChallengeEndAlert = async (challenge) => {
  if (!challenge.endDate) return;
  
  const endDateTime = new Date(challenge.endDate).getTime();
  const now = Date.now();
  
  if (endDateTime <= now) return; // Already ended

  try {
    const hasPerm = await requestNotificationPermission();
    if (!hasPerm) return;

    // Use a hash of the challenge ID for a consistent int32 ID
    const notificationId = hashStringToId(challenge._id);

    // Cancel existing scheduled notification for this challenge just in case
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });

    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Challenge Ended!',
          body: `Your challenge "${challenge.title}" has officially ended. Check out the results!`,
          id: notificationId,
          schedule: { at: new Date(endDateTime) },
          sound: null,
          attachments: null,
          actionTypeId: '',
          extra: { challengeId: challenge._id },
        },
      ],
    });
  } catch (err) {
    console.error("Failed to schedule challenge end notification", err);
  }
};

const hashStringToId = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash); // Absolute positive value for Capacitor ID
};
