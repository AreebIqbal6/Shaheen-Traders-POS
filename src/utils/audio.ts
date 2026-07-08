// A clean, minimalistic double-chime generated via Web Audio API. No assets needed.
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Minimalistic double chime (e.g. Ding-Ding)
    oscillator.type = 'sine';
    
    // First chime (A5)
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    // Second chime (C#6)
    oscillator.frequency.setValueAtTime(1108.73, audioCtx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.9);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
