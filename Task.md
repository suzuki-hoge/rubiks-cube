# 実装タスク

## Phase 1: プロジェクトセットアップ

- [ ] `yarn create vite rubiks-cube --template react-ts`
- [ ] Three.js 関連パッケージインストール (`three`, `@react-three/fiber`, `@react-three/drei`)
- [ ] ソルバーパッケージインストール (`cubejs`, `cube-solver`)
- [ ] ESLint 設定 (strict, no-any, @typescript-eslint)
- [ ] Prettier 設定
- [ ] Vite 設定 (GitHub Pages 用 base パス + host)
- [ ] tsconfig.json (strict: true)

## Phase 2: キューブモデル + 3D描画

- [ ] `pieces.ts`: ピースベース状態表現 + 初期状態 + ピース色定義
- [ ] `colors.ts`: 世界標準配色定義 (hex値)
- [ ] `Cubie.tsx`: RoundedBox + 6面カラーマテリアル
- [ ] `CubeGroup.tsx`: 26キュビー配置 (ピース状態から3D位置・回転を算出)
- [ ] `CubeScene.tsx`: R3F Canvas + ライティング + カメラ (3面が見える角度)

## Phase 3: ムーブ実行 + アニメーション

- [ ] `moves.ts`: 全ムーブのピース置換テーブル定義 (コーナー・エッジ置換 + 向き変化)
- [ ] `useCubeState.ts`: useReducer でキューブ状態管理
- [ ] 面回転アニメーション (回転中の9キュビーをグループ化して回転)
- [ ] 持ち替え (x, y, z) 実装

## Phase 4: スワイプ操作

- [ ] `useSwipeDetection.ts`: Raycasting + タッチ方向判定
- [ ] 面タッチ → スワイプ → レイヤー回転
- [ ] センタースワイプ → 持ち替え
- [ ] スワイプ開始時の面ハイライト (発光エフェクト)

## Phase 5: スクランブル + コントロール + 設定

- [ ] `scrambler.ts`: cubejs 連携スクランブル生成
- [ ] `ControlBar.tsx`: シャッフル / やり直し / スクランブル / ⚙ ボタン
- [ ] `ScrambleModal.tsx`: スクランブル手順のモーダル全画面表示
- [ ] `useSettings.ts`: 設定値管理 (Context + localStorage 永続化)
- [ ] `SettingsModal.tsx`: 設定モーダル (スライダーで各パラメータ調整、デフォルトに戻す)

## Phase 6: ジャイロスコープ視点制御

- [ ] `useGyroscope.ts`: DeviceOrientationEvent + requestPermission (iOS Safari)
- [ ] カメラ orbit をデバイス傾きで微調整 (設定の感度・最大角度を参照)

## Phase 7: 白クロスソルバー

- [ ] `convert.ts`: ピース状態 ↔ facelet 文字列変換
- [ ] `crossSolver.ts`: cube-solver 連携で複数パターンの最適解算出
- [ ] `useCrossSolver.ts`: React hook でソルバー呼び出し
- [ ] `CrossSolution.tsx`: 複数解法表示 + 再生コントロール (一手戻す / 一手進む / 一気に)

## Phase 8: F2L ガイド

- [ ] `f2lScoring.ts`: 4ペアの位置検出 + 優先順スコアリング
    - [ ] Edge Orientation 判定
    - [ ] バックスロット判定
    - [ ] ピース視認性判定 (消去法ルール含む)
- [ ] `F2LGuide.tsx`: スコア順にソートされた [1][2][3][4] トグルボタン
- [ ] 3Dキューブ上のグローエフェクト (emissive material)

## Phase 9: 仕上げ

- [ ] iPhone レイアウト最終調整 (safe area, viewport meta)
- [ ] `yarn build` で GitHub Pages 用ビルド確認
- [ ] ドキュメント最終更新
