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
  const eventCountRef = useRef(0);

  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      eventCountRef.current++;
      const count = eventCountRef.current;

      // Log first 5 events, then every 100th
      if (count <= 5 || count % 100 === 0) {
        console.log(`[GYRO] event #${count}`, {
          enabled: enabledRef.current,
          alpha: e.alpha,
          beta: e.beta,
          gamma: e.gamma,
          absolute: e.absolute,
        });
      }

      if (!enabledRef.current) {
        if (count <= 5) console.log('[GYRO] event ignored: not enabled');
        return;
      }

      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;

      if (!baseOrientation.current) {
        baseOrientation.current = { beta, gamma };
        console.log('[GYRO] base orientation set:', { beta, gamma });
      }

      const base = baseOrientation.current;
      const sensitivity = settings.gyro.sensitivity;
      const maxAngle = settings.gyro.maxAngle;

      const deltaBeta = Math.max(-maxAngle, Math.min(maxAngle, (beta - base.beta) * sensitivity));
      const deltaGamma = Math.max(
        -maxAngle,
        Math.min(maxAngle, (gamma - base.gamma) * sensitivity),
      );

      if (count <= 5 || count % 100 === 0) {
        console.log(`[GYRO] delta #${count}`, { deltaBeta, deltaGamma, sensitivity, maxAngle });
      }

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
    console.log('[GYRO] toggle called', {
      permitted: state.permitted,
      enabled: enabledRef.current,
    });

    // Already permitted — just toggle enabled on/off
    if (state.permitted) {
      setState((prev) => {
        if (prev.enabled) {
          console.log('[GYRO] toggling OFF');
          return { ...prev, enabled: false, beta: 0, gamma: 0 };
        }
        console.log('[GYRO] toggling ON (re-enable)');
        baseOrientation.current = null;
        return { ...prev, enabled: true };
      });
      return;
    }

    // First time: request permission
    console.log('[GYRO] requesting permission for the first time');
    setState((prev) => ({ ...prev, requesting: true }));
    try {
      const DeviceOrientationEvt = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      console.log('[GYRO] requestPermission available?', !!DeviceOrientationEvt.requestPermission);

      if (DeviceOrientationEvt.requestPermission) {
        const permission = await DeviceOrientationEvt.requestPermission();
        console.log('[GYRO] permission result:', permission);
        if (permission === 'granted') {
          setState((prev) => ({ ...prev, permitted: true, enabled: true, requesting: false }));
          window.addEventListener('deviceorientation', handleOrientation);
          console.log('[GYRO] listener added (iOS path)');
        } else {
          console.log('[GYRO] permission denied');
          setState((prev) => ({ ...prev, requesting: false }));
        }
      } else {
        console.log('[GYRO] no requestPermission — adding listener directly');
        setState((prev) => ({ ...prev, permitted: true, enabled: true, requesting: false }));
        window.addEventListener('deviceorientation', handleOrientation);
        console.log('[GYRO] listener added (non-iOS path)');
      }
    } catch (err) {
      console.error('[GYRO] permission error:', err);
      setState((prev) => ({ ...prev, requesting: false }));
    }
  }, [state.permitted, handleOrientation]);

  const resetBase = useCallback(() => {
    console.log('[GYRO] resetBase called');
    baseOrientation.current = null;
  }, []);

  useEffect(() => {
    console.log('[GYRO] cleanup effect: handleOrientation ref changed');
    return () => {
      console.log('[GYRO] removing listener (cleanup)');
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [handleOrientation]);

  // Log state changes
  useEffect(() => {
    console.log('[GYRO] state:', {
      permitted: state.permitted,
      enabled: state.enabled,
      requesting: state.requesting,
      beta: state.beta.toFixed(2),
      gamma: state.gamma.toFixed(2),
    });
  }, [state.permitted, state.enabled, state.requesting, state.beta, state.gamma]);

  return {
    beta: state.beta,
    gamma: state.gamma,
    enabled: state.enabled,
    requesting: state.requesting,
    toggle,
    resetBase,
  };
}
