# 技術詳細

## ディレクトリ構成

```
rubiks-cube/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.mjs
├── .prettierrc
├── src/
│   ├── main.tsx                    # エントリポイント
│   ├── App.tsx                     # ルートコンポーネント
│   ├── components/
│   │   ├── CubeScene.tsx           # R3F Canvas + シーン
│   │   ├── Cubie.tsx               # 個別キュビーの3Dメッシュ
│   │   ├── CubeGroup.tsx           # 26キュビーの配置・回転アニメ
│   │   ├── ControlBar.tsx          # シャッフル・やり直し・スクランブルボタン
│   │   ├── ScrambleModal.tsx       # スクランブル手順モーダル
│   │   ├── CrossSolution.tsx       # 白クロス解法 (複数パターン + 再生コントロール)
│   │   ├── F2LGuide.tsx            # F2Lペアトグルボタン (優先順表示)
│   │   └── SettingsModal.tsx       # 設定モーダル (⚙ ボタンから開く)
│   ├── hooks/
│   │   ├── useCubeState.ts         # キューブ状態管理 (useReducer)
│   │   ├── useGyroscope.ts         # DeviceOrientationEvent (iOS Safari)
│   │   ├── useSwipeDetection.ts    # スワイプ → 面回転判定 (Raycasting)
│   │   ├── useCrossSolver.ts       # 白クロス最適解算出
│   │   └── useSettings.ts          # 設定値管理 (localStorage 永続化)
│   ├── cube/
│   │   ├── pieces.ts               # ピースベースのキューブ状態表現
│   │   ├── moves.ts                # 全ムーブのピース置換定義
│   │   ├── scrambler.ts            # ランダムスクランブル生成
│   │   ├── colors.ts               # 世界標準配色定義
│   │   ├── convert.ts              # ピース状態 ↔ facelet文字列 変換
│   │   ├── crossSolver.ts          # 白クロスソルバーラッパー
│   │   └── f2lScoring.ts           # F2Lペア検出 + 優先順スコアリング
│   ├── types/
│   │   └── index.ts                # 型定義
│   └── styles/
│       └── index.css               # グローバルスタイル
├── README.md
├── Specification.md
└── Architecture.md
```

## キューブモデル設計

### パーツベース状態表現

54面配列ではなく、パーツ (ピース) ベースで状態を管理する。

**理由**:

- 構造的にありえない盤面状態を排除できる (54面配列だと「コーナーに白が2つ」等の不正状態を表現できてしまう)
- F2L ペア検出が自然 (「白-赤-緑コーナーはどこにいる？」= ピースの位置参照)
- 3D キュビーとの1:1対応 (各キュビー = 1ピース)
- cubejs の内部表現もピースベース (facelet 文字列は I/O フォーマットに過ぎない)

### ピースの種類

| 種類   | 個数 | 属性                                      |
|------|----|-----------------------------------------|
| センター | 6  | 位置固定。面の色を定義する基準                         |
| エッジ  | 12 | 位置 (0-11) + 向き (0: 正, 1: 反転)            |
| コーナー | 8  | 位置 (0-7) + 向き (0: 正, 1: 時計回り, 2: 反時計回り) |

### 状態の構造

```typescript
type CornerPiece = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type EdgePiece = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
type CornerOrientation = 0 | 1 | 2;
type EdgeOrientation = 0 | 1;

interface CubeState {
  cornerPermutation: CornerPiece[];   // 長さ8: 各位置にどのコーナーがいるか
  cornerOrientation: CornerOrientation[];  // 長さ8: 各位置のコーナーの向き
  edgePermutation: EdgePiece[];       // 長さ12: 各位置にどのエッジがいるか
  edgeOrientation: EdgeOrientation[]; // 長さ12: 各位置のエッジの向き
}
```

### ピース番号と色の対応 (固定)

**コーナー** (白面を下として):

| # | 位置  | 色     |
|---|-----|-------|
| 0 | URF | 白-赤-緑 |
| 1 | UFL | 白-緑-橙 |
| 2 | ULB | 白-橙-青 |
| 3 | UBR | 白-青-赤 |
| 4 | DFR | 黄-緑-赤 |
| 5 | DLF | 黄-橙-緑 |
| 6 | DBL | 黄-青-橙 |
| 7 | DRB | 黄-赤-青 |

**エッジ**:

| #  | 位置 | 色   |
|----|----|-----|
| 0  | UR | 白-赤 |  (※ 実際の番号割り当てはcubejsの慣習に合わせて実装時に確定)
| 1  | UF | 白-緑 |
| 2  | UL | 白-橙 |
| 3  | UB | 白-青 |
| 4  | DR | 黄-赤 |
| 5  | DF | 黄-緑 |
| 6  | DL | 黄-橙 |
| 7  | DB | 黄-青 |
| 8  | FR | 緑-赤 |
| 9  | FL | 緑-橙 |
| 10 | BL | 青-橙 |
| 11 | BR | 青-赤 |

### ムーブ実行

- 各ムーブ (R, L, U, D, F, B) はコーナー・エッジそれぞれの置換 + 向き変化として定義
- プライムムーブ (R' 等): 逆置換
- ダブルムーブ (R2 等): 置換の2回適用
- 持ち替え (x, y, z): 全ピースの置換 + 向き変化

### ソルバー連携 (convert.ts)

- ピース状態 → cubejs の facelet 文字列に変換 (ソルバー入力用)
- facelet 文字列 → ピース状態に変換 (ソルバー出力適用用)
- cubejs はブラウザで動作可能

## スワイプ操作の実装

### Raycasting による面特定

1. タッチ開始時に Three.js Raycaster でタッチしたキュビーの面を特定
2. タッチした面のレイヤーを発光エフェクトでハイライト
3. タッチ終了時にスワイプ方向を判定
4. 面 + スワイプ方向 → ムーブを決定

### スワイプ → ムーブのマッピング

**上面 (U面が見えている場合)**:

- 1行目 (奥) 左右スワイプ → U / U'
- 3行目 (手前) 左右スワイプ → D / D' (※ E層を挟むため、3D上の位置で判定)
- 1列目 (左) 上下スワイプ → L / L'
- 3列目 (右) 上下スワイプ → R / R'

**右面 (R面が見えている場合)**:

- 1列目 (手前) 上下スワイプ → F / F'
- 3列目 (奥) 上下スワイプ → B / B'

**持ち替え**:

- センターキューブをスワイプ → 上下左右で x/x'/y/y' 相当の回転

## 設定機能

画面上の ⚙ ボタンからモーダルで設定を開く。設定値は localStorage に永続化し、リロードしても保持される。

### 設定項目

| カテゴリ | 項目               | 型              | 初期値      | 説明                               |
|------|------------------|----------------|----------|----------------------------------|
| ジャイロ | 感度               | number (スライダー) | 1.0      | デバイス傾き → 視点回転の倍率。0.5 で鈍く、2.0 で敏感 |
| ジャイロ | 最大角度             | number (スライダー) | 30 (度)   | 視点回転の上限角度。これ以上傾けても視点は変わらない       |
| スワイプ | 判定距離             | number (スライダー) | 20 (px)  | スワイプと判定する最小ドラッグ距離                |
| スワイプ | アニメーション速度        | number (スライダー) | 300 (ms) | 面回転アニメーションの所要時間                  |
| F2L  | EO ボーナス          | number (スライダー) | 30       | Edge Orientation 正のときの加点         |
| F2L  | バックスロットボーナス      | number (スライダー) | 20       | バックスロット (LB/RB) の加点              |
| F2L  | 視認性ボーナス (両方)     | number (スライダー) | 40       | コーナー・エッジ両方視認可能時の加点               |
| F2L  | 視認性ボーナス (コーナーのみ) | number (スライダー) | 20       | コーナーのみ視認可能時の加点                   |
| F2L  | 視認性ボーナス (エッジのみ)  | number (スライダー) | 10       | エッジのみ視認可能時の加点                    |

### 技術設計

```typescript
interface Settings {
  gyro: {
    sensitivity: number;
    maxAngle: number;
  };
  swipe: {
    minDistance: number;
    animationDuration: number;
  };
  f2l: {
    eoBonus: number;
    backSlotBonus: number;
    visibilityBothBonus: number;
    visibilityCornerOnlyBonus: number;
    visibilityEdgeOnlyBonus: number;
  };
}
```

- `useSettings` hook で管理。Context で全コンポーネントに配信
- 変更は即座に反映 (ジャイロ感度を変えたらその場で挙動が変わる)
- localStorage キー: `rubiks-cube-settings`
- 「デフォルトに戻す」ボタンで全項目を初期値にリセット

## ローカル開発

### 開発サーバー

Vite の HMR (Hot Module Replacement) を利用してリアルタイムにデバッグする。

```bash
yarn dev
```

- Vite dev server が `localhost:5173` で起動
- ファイル保存時に即座にブラウザへ反映 (フルリロード不要)
- React コンポーネントの状態は Fast Refresh で保持される (キューブの状態を維持したまま UI を修正可能)

### ローカル動作確認

Chrome DevTools の Device Mode (iPhone エミュレータ) でレイアウトとスワイプ操作を確認する。ジャイロスコープは HTTPS
が必要なためローカルでは動作しない。

- レイアウト確認: Chrome DevTools → Device Mode → iPhone 選択
- スワイプ操作: DevTools のタッチシミュレーションで確認
- ジャイロ: GitHub Pages デプロイ後に iPhone 実機で確認。設定モーダルで感度・最大角度を調整しながら最適値を探る (
  コード変更・再デプロイ不要)

### Vite 設定のポイント

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: '/rubiks-cube/',  // GitHub Pages のリポジトリ名に合わせる
});
```

- `base`: GitHub Pages デプロイ時のパス
- Three.js / R3F のコンポーネントも HMR 対象。3D シーンの調整 (カメラ角度、ライティング、色) をリアルタイムに確認できる
