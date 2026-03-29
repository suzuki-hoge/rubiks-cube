import { useState, useEffect, useCallback, useRef } from 'react';
import type { Settings } from '../types';

interface GyroscopeState {
  alpha: number; // rotation around z-axis
  beta: number; // rotation around x-axis (tilt front-back)
  gamma: number; // rotation around y-axis (tilt left-right)
  permitted: boolean;
  enabled: boolean;
  requesting: boolean;
}

export function useGyroscope(settings: Settings) {
  const [state, setState] = useState<GyroscopeState>({
    alpha: 0,
    beta: 0,
    gamma: 0,
    permitted: false,
    enabled: false,
    requesting: false,
  });

  const baseOrientation = useRef<{ beta: number; gamma: number } | null>(null);
  const enabledRef = useRef(false);
  enabledRef.current = state.enabled;

  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      if (!enabledRef.current) return;

      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;

      if (!baseOrientation.current) {
        baseOrientation.current = { beta, gamma };
      }

      const base = baseOrientation.current;
      const sensitivity = settings.gyro.sensitivity;
      const maxAngle = settings.gyro.maxAngle;

      const deltaBeta = Math.max(-maxAngle, Math.min(maxAngle, (beta - base.beta) * sensitivity));
      const deltaGamma = Math.max(
        -maxAngle,
        Math.min(maxAngle, (gamma - base.gamma) * sensitivity),
      );

      setState((prev) => ({
        ...prev,
        alpha: e.alpha ?? 0,
        beta: deltaBeta,
        gamma: deltaGamma,
      }));
    },
    [settings.gyro.sensitivity, settings.gyro.maxAngle],
  );

  const toggle = useCallback(async () => {
    // Already permitted — just toggle enabled on/off
    if (state.permitted) {
      setState((prev) => {
        if (prev.enabled) {
          // Turning off: reset angles to 0
          return { ...prev, enabled: false, beta: 0, gamma: 0 };
        }
        // Turning on: reset base so current orientation becomes neutral
        baseOrientation.current = null;
        return { ...prev, enabled: true };
      });
      return;
    }

    // First time: request permission
    setState((prev) => ({ ...prev, requesting: true }));
    try {
      const DeviceOrientationEvt = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (DeviceOrientationEvt.requestPermission) {
        const permission = await DeviceOrientationEvt.requestPermission();
        if (permission === 'granted') {
          setState((prev) => ({ ...prev, permitted: true, enabled: true, requesting: false }));
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setState((prev) => ({ ...prev, requesting: false }));
        }
      } else {
        setState((prev) => ({ ...prev, permitted: true, enabled: true, requesting: false }));
        window.addEventListener('deviceorientation', handleOrientation);
      }
    } catch {
      setState((prev) => ({ ...prev, requesting: false }));
    }
  }, [state.permitted, handleOrientation]);

  const resetBase = useCallback(() => {
    baseOrientation.current = null;
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [handleOrientation]);

  return {
    beta: state.beta,
    gamma: state.gamma,
    enabled: state.enabled,
    requesting: state.requesting,
    toggle,
    resetBase,
  };
}
