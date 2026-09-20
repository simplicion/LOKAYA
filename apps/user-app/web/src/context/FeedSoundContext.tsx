'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface FeedSoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

const FeedSoundContext = createContext<FeedSoundContextType>({
  isMuted: true,
  toggleMute: () => {},
  setMuted: () => {},
});

export function FeedSoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Initialize from localStorage safely
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lokaya_feed_muted');
      if (saved !== null) {
        setIsMuted(saved === 'true');
      }
    } catch {}
  }, []);

  const setMuted = (muted: boolean) => {
    setIsMuted(muted);
    try {
      localStorage.setItem('lokaya_feed_muted', String(muted));
    } catch {}
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('lokaya_feed_muted', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <FeedSoundContext.Provider value={{ isMuted, toggleMute, setMuted }}>
      {children}
    </FeedSoundContext.Provider>
  );
}

export function useFeedSound() {
  return useContext(FeedSoundContext);
}
