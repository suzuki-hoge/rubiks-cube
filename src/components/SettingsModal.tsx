import type { Settings } from '../types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
  onReset: () => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="setting-row">
      <label>{label}</label>
      <div className="setting-slider">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="setting-value">
          {value}
          {unit ?? ''}
        </span>
      </div>
    </div>
  );
}

export function SettingsModal({ open, onClose, settings, onUpdate, onReset }: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2>設定</h2>

        <h3>ジャイロ</h3>
        <Slider
          label="感度"
          value={settings.gyro.sensitivity}
          min={0.1}
          max={3.0}
          step={0.1}
          unit="x"
          onChange={(v) => onUpdate({ gyro: { ...settings.gyro, sensitivity: v } })}
        />
        <Slider
          label="最大角度"
          value={settings.gyro.maxAngle}
          min={5}
          max={90}
          step={5}
          unit="°"
          onChange={(v) => onUpdate({ gyro: { ...settings.gyro, maxAngle: v } })}
        />

        <h3>スワイプ</h3>
        <Slider
          label="判定距離"
          value={settings.swipe.minDistance}
          min={5}
          max={60}
          step={5}
          unit="px"
          onChange={(v) => onUpdate({ swipe: { ...settings.swipe, minDistance: v } })}
        />
        <Slider
          label="アニメーション速度"
          value={settings.swipe.animationDuration}
          min={100}
          max={800}
          step={50}
          unit="ms"
          onChange={(v) => onUpdate({ swipe: { ...settings.swipe, animationDuration: v } })}
        />

        <h3>F2L スコアリング</h3>
        <Slider
          label="EO ボーナス"
          value={settings.f2l.eoBonus}
          min={0}
          max={100}
          step={5}
          onChange={(v) => onUpdate({ f2l: { ...settings.f2l, eoBonus: v } })}
        />
        <Slider
          label="バックスロット"
          value={settings.f2l.backSlotBonus}
          min={0}
          max={100}
          step={5}
          onChange={(v) => onUpdate({ f2l: { ...settings.f2l, backSlotBonus: v } })}
        />
        <Slider
          label="視認性 (両方)"
          value={settings.f2l.visibilityBothBonus}
          min={0}
          max={100}
          step={5}
          onChange={(v) => onUpdate({ f2l: { ...settings.f2l, visibilityBothBonus: v } })}
        />
        <Slider
          label="視認性 (Cのみ)"
          value={settings.f2l.visibilityCornerOnlyBonus}
          min={0}
          max={100}
          step={5}
          onChange={(v) => onUpdate({ f2l: { ...settings.f2l, visibilityCornerOnlyBonus: v } })}
        />
        <Slider
          label="視認性 (Eのみ)"
          value={settings.f2l.visibilityEdgeOnlyBonus}
          min={0}
          max={100}
          step={5}
          onChange={(v) => onUpdate({ f2l: { ...settings.f2l, visibilityEdgeOnlyBonus: v } })}
        />

        <div className="settings-actions">
          <button onClick={onReset}>デフォルトに戻す</button>
          <button onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
