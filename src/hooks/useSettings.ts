import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import React from 'react';
import type { Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  gyro: {
    sensitivity: 1.0,
    maxAngle: 90,
  },
  shake: {
    threshold: 15,
    cooldown: 600,
  },
  swipe: {
    minDistance: 20,
    animationDuration: 300,
  },
  f2l: {
    eoBonus: 30,
    backSlotBonus: 30,
    visibilityBothBonus: 40,
    visibilityCornerOnlyBonus: 20,
    visibilityEdgeOnlyBonus: 10,
  },
};

const STORAGE_KEY = 'rubiks-cube-settings';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return {
        gyro: { ...DEFAULT_SETTINGS.gyro, ...parsed.gyro },
        shake: { ...DEFAULT_SETTINGS.shake, ...parsed.shake },
        swipe: { ...DEFAULT_SETTINGS.swipe, ...parsed.swipe },
        f2l: { ...DEFAULT_SETTINGS.f2l, ...parsed.f2l },
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next: Settings = {
        gyro: { ...prev.gyro, ...patch.gyro },
        shake: { ...prev.shake, ...patch.shake },
        swipe: { ...prev.swipe, ...patch.swipe },
        f2l: { ...prev.f2l, ...patch.f2l },
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const defaults = { ...DEFAULT_SETTINGS };
    setSettings(defaults);
    saveSettings(defaults);
  }, []);

  return React.createElement(
    SettingsContext.Provider,
    { value: { settings, updateSettings, resetSettings } },
    children,
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
