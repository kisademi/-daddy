let audioCtx: AudioContext | null = null;
let muted = false;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const isMuted = () => muted;

export const setMuted = (value: boolean) => {
  muted = value;
};

export const toggleMute = () => {
  muted = !muted;
  return muted;
};

export const playSound = (
  type: 'jump' | 'success' | 'fail' | 'click' | 'alert' | 'pop' | 'coin' | 'shield' | 'heart'
) => {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case 'jump':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
      break;
    case 'success':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.34);
      osc.start(now);
      osc.stop(now + 0.34);
      break;
    case 'fail':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.28);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
      break;
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    case 'alert':
      osc.type = 'square';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.setValueAtTime(420, now + 0.11);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.26);
      osc.start(now);
      osc.stop(now + 0.26);
      break;
    case 'pop':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
      break;
    case 'coin':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.06);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
      break;
    case 'shield':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(840, now + 0.14);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
      break;
    case 'heart':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.09);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
      break;
  }
};
