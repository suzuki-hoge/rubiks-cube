import type { Move } from '../types';

interface ScrambleModalProps {
  scramble: Move[];
  open: boolean;
  onClose: () => void;
}

export function ScrambleModal({ scramble, open, onClose }: ScrambleModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content scramble-modal" onClick={(e) => e.stopPropagation()}>
        <h2>スクランブル</h2>
        <div className="scramble-text">
          {scramble.length > 0 ? scramble.join(' ') : 'シャッフルしてください'}
        </div>
        <button className="modal-close" onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
}
