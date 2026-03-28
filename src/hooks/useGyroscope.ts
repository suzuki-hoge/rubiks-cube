import { useState, useEffect, useCallback, useRef } from 'react';
import type { Settings } from '../types';

interface GyroscopeState {
  alpha: number; // rotation around z-axis
  beta: number; // rotation around x-axis (tilt front-back)
  gamma: number; // rotation around y-axis (tilt left-right)
  permitted: boolean;
  requesting: boolean;
}

export function useGyroscope(settings: Settings) {
  const [state, setState] = useState<GyroscopeState>({
    alpha: 0,
    beta: 0,
    gamma: 0,
    permitted: false,
    requesting: false,
  });

  const baseOrientation = useRef<{ beta: number; gamma: number } | null>(null);

  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
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

  const requestPermission = useCallback(async () => {
    setState((prev) => ({ ...prev, requesting: true }));

    try {
      // iOS 13+ requires permission request
      const DeviceOrientationEvt = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (DeviceOrientationEvt.requestPermission) {
        const permission = await DeviceOrientationEvt.requestPermission();
        if (permission === 'granted') {
          setState((prev) => ({ ...prev, permitted: true, requesting: false }));
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setState((prev) => ({ ...prev, requesting: false }));
        }
      } else {
        // Non-iOS or older browsers
        setState((prev) => ({ ...prev, permitted: true, requesting: false }));
        window.addEventListener('deviceorientation', handleOrientation);
      }
    } catch {
      setState((prev) => ({ ...prev, requesting: false }));
    }
  }, [handleOrientation]);

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
    permitted: state.permitted,
    requesting: state.requesting,
    requestPermission,
    resetBase,
  };
}
