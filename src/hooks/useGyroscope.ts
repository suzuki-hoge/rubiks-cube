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
  const lastShakeTime = useRef(0);

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

  // Internal toggle: flip enabled on/off (only when permitted)
  const doToggle = useCallback(() => {
    if (enabledRef.current) {
      // Turning off: immediately block handleOrientation before React renders
      enabledRef.current = false;
      baseOrientation.current = null;
      setState((prev) => ({ ...prev, enabled: false, beta: 0, gamma: 0 }));
    } else {
      // Turning on
      baseOrientation.current = null;
      setState((prev) => {
        if (!prev.permitted) return prev;
        enabledRef.current = true;
        return { ...prev, enabled: true };
      });
    }
  }, []);

  // Shake detection handler
  const handleMotion = useCallback(
    (e: DeviceMotionEvent) => {
      // Prefer acceleration (gravity-free) for cleaner detection
      const acc = e.acceleration ?? e.accelerationIncludingGravity;
      if (!acc) return;
      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      const magnitude = e.acceleration
        ? Math.sqrt(x * x + y * y + z * z)
        : Math.sqrt(x * x + y * y + z * z) - 9.8;
      if (magnitude > settings.shake.threshold) {
        const now = Date.now();
        if (now - lastShakeTime.current > settings.shake.cooldown) {
          lastShakeTime.current = now;
          doToggle();
        }
      }
    },
    [doToggle, settings.shake.threshold, settings.shake.cooldown],
  );

  const toggle = useCallback(async () => {
    // Already permitted — just toggle enabled on/off
    if (state.permitted) {
      doToggle();
      return;
    }

    // First time: request permission
    setState((prev) => ({ ...prev, requesting: true }));
    try {
      const DeviceOrientationEvt = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      const DeviceMotionEvt = DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };

      if (DeviceOrientationEvt.requestPermission) {
        const permission = await DeviceOrientationEvt.requestPermission();
        // Also request DeviceMotion permission for shake detection
        if (DeviceMotionEvt.requestPermission) {
          await DeviceMotionEvt.requestPermission();
        }
        if (permission === 'granted') {
          setState((prev) => ({ ...prev, permitted: true, enabled: true, requesting: false }));
          window.addEventListener('deviceorientation', handleOrientation);
          window.addEventListener('devicemotion', handleMotion);
        } else {
          setState((prev) => ({ ...prev, requesting: false }));
        }
      } else {
        setState((prev) => ({ ...prev, permitted: true, enabled: true, requesting: false }));
        window.addEventListener('deviceorientation', handleOrientation);
        window.addEventListener('devicemotion', handleMotion);
      }
    } catch (err) {
      console.error('[GYRO] permission error:', err);
      setState((prev) => ({ ...prev, requesting: false }));
    }
  }, [state.permitted, handleOrientation, handleMotion, doToggle]);

  const resetBase = useCallback(() => {
    baseOrientation.current = null;
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleOrientation, handleMotion]);

  return {
    beta: state.beta,
    gamma: state.gamma,
    enabled: state.enabled,
    requesting: state.requesting,
    toggle,
    resetBase,
  };
}
