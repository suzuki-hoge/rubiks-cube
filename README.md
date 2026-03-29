# Rubik's Cube Practice Service

白クロスの脳内ソルブ練習と F2L ペア先読み訓練のための、iPhone (Safari) 向け個人用ルービックキューブ練習サービス。

## URL

https://suzuki-hoge.github.io/rubiks-cube/

## 技術スタック

| 項目        | 選定                                                            |
|-----------|---------------------------------------------------------------|
| フレームワーク   | React 18 + TypeScript (strict, no `any`)                      |
| 3D レンダリング | Three.js via `@react-three/fiber` (R3F) + `@react-three/drei` |
| ビルドツール    | Vite                                                          |
| パッケージ管理   | Yarn                                                          |
| コード品質     | ESLint (`@typescript-eslint`, strict) + Prettier              |
| キューブソルバー  | `cubejs` (状態管理・スクランブル) + `cube-solver` (白クロス最適解)              |
| デプロイ      | GitHub Pages (`make build` → `docs/`)                         |

## 開発コマンド

```bash
yarn dev      # ローカル開発サーバー
yarn build    # プロダクションビルド (dist/)
yarn lint     # ESLint チェック
```
