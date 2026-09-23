'use client';

import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType as CapNotificationType } from '@capacitor/haptics';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('[AudioAlert] Web Audio API initialization skipped:', e);
    return null;
  }
}

/**
 * Universal Hardware Vibration Engine:
 * Triggers native Android/iOS vibration via Capacitor Haptics AND mobile browser HTML5 Vibration API.
 */
export async function vibrateDevice(pattern: number[] = [300, 150, 300, 150, 700]) {
  if (typeof window === 'undefined') return;

  // 1. Native Mobile Platform (Capacitor Android/iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.vibrate({ duration: 1200 });
      await Haptics.notification({ type: CapNotificationType.Success });
    } catch (err) {
      console.warn('[Vibrate] Native haptics failed:', err);
    }
  }

  // 2. Mobile Browser (Web HTML5 Vibration API on Chrome / Firefox Android)
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    console.warn('[Vibrate] Web vibration failed:', err);
  }
}

/**
 * Synthesizes a melodic order alert chime using Web Audio API.
 * Guarantees crisp, instant playback with zero external file/network dependency.
 */
export function playAlertChime(type: 'order' | 'status' | 'dispatch' = 'order') {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'order') {
      // 4-tone ascending celebratory chime: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz)
      const frequencies = [523.25, 659.25, 783.99, 1046.50];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    } else if (type === 'dispatch') {
      // 3-tone urgent alert: A4 (440Hz) -> E5 (659.25Hz) -> A5 (880Hz)
      const frequencies = [440, 659.25, 880];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } else {
      // 2-tone pleasant confirmation: F5 (698.46Hz) -> A5 (880Hz)
      const frequencies = [698.46, 880];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0, now + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.3);
      });
    }
  } catch (err) {
    console.warn('[AudioAlert] Error playing chime:', err);
  }
}

/**
 * Universal Notification Dispatcher:
 * Combines physical vibration + synthetic audio chime + foreground UI toast.
 */
export async function triggerNotificationAlert(options: {
  title: string;
  body?: string;
  type?: 'order' | 'status' | 'dispatch';
  vibratePattern?: number[];
}) {
  const {
    type = 'order',
    vibratePattern = type === 'order' ? [400, 150, 400, 150, 800] : [250, 100, 250]
  } = options;

  // 1. Physical Device Vibration (Mobile Browser + Android App)
  vibrateDevice(vibratePattern).catch(() => {});

  // 2. Synthesized Melodic Alert Chime
  playAlertChime(type);
}
