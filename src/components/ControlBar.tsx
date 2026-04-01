import { TfiReload } from 'react-icons/tfi';
import { RxReload } from 'react-icons/rx';
import { MdEdgesensorHigh, MdGpsFixed, MdSettings } from 'react-icons/md';

interface ControlBarProps {
  onShuffle: () => void;
  onRetry: () => void;
  onShowScramble: () => void;
  onShowSettings: () => void;
  gyroEnabled: boolean;
  onRequestGyro: () => void;
  onGyroReset: () => void;
}

export function ControlBar({
  onShuffle,
  onRetry,
  onShowScramble,
  onShowSettings,
  gyroEnabled,
  onRequestGyro,
  onGyroReset,
}: ControlBarProps) {
  return (
    <div className="control-bar">
      <button onClick={onShuffle} title="シャッフル">
        <TfiReload />
      </button>
      <button onClick={onRetry} title="やり直す">
        <RxReload />
      </button>
      <button onClick={onShowScramble} title="スクランブル" className="scramble-btn">
        R&apos;
      </button>
      <button onClick={onRequestGyro} title="ジャイロ" className="gyro-btn">
        <span className="gyro-icon-wrap">
          <MdEdgesensorHigh />
          {!gyroEnabled && <span className="gyro-slash" />}
        </span>
      </button>
      <button
        onClick={gyroEnabled ? onGyroReset : undefined}
        title="ジャイロリセット"
        className="gyro-reset-btn"
      >
        <span className="gyro-icon-wrap">
          <MdGpsFixed />
          {!gyroEnabled && <span className="gyro-slash" />}
        </span>
      </button>
      <button onClick={onShowSettings} className="settings-btn">
        <MdSettings />
      </button>
    </div>
  );
}
