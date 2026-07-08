export const playNotificationSound = () => {
  try {
    const audio = new Audio('/iphone_notification.mp3');
    audio.play().catch(e => console.error("Audio playback failed", e));
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
