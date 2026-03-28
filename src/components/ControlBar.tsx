interface ControlBarProps {
  onShuffle: () => void;
  onRetry: () => void;
  onShowScramble: () => void;
  onShowSettings: () => void;
  onRequestGyro: () => void;
  gyroPermitted: boolean;
}

export function ControlBar({
  onShuffle,
  onRetry,
  onShowScramble,
  onShowSettings,
  onRequestGyro,
  gyroPermitted,
}: ControlBarProps) {
  return (
    <div className="control-bar">
      <button onClick={onShuffle}>シャッフル</button>
      <button onClick={onRetry}>やり直す</button>
      <button onClick={onShowScramble}>スクランブル</button>
      {!gyroPermitted && <button onClick={onRequestGyro}>ジャイロ</button>}
      <button onClick={onShowSettings} className="settings-btn">
        ⚙
      </button>
    </div>
  );
}
