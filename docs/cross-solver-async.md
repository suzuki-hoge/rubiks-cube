# Cross Solver 非同期アーキテクチャ

## サービスコンセプト

白クロス訓練サービス。ユーザーは以下のループを繰り返す:

1. **シャッフル** — ランダムなスクランブルを生成
2. **自力で解く** — 3Dキューブを操作して白クロスを完成させる
3. **解法確認** — 最適解と自分の手順を比較する

訓練のため、解法はすぐには表示せず「解法を見る」ボタンで明示的に開く。

## UI 状態モデル (4状態)

```
初期表示 ──(シャッフル)──→ 計算中 ──(Worker完了)──→ 解法非表示 ──(ボタン)──→ 解法表示
   ↑                           ↑                         ↑                      ↑
   └──────────────────── 再シャッフルでいつでも「計算中」に戻る ──────────────────┘
```

| 状態 | scramble | solving | solutions | 表示内容 |
|------|----------|---------|-----------|----------|
| 初期表示 | `[]` | `false` | `[]` | 「シャッフルしてください」 |
| 計算中 | `[...]` | `true` | `[]` | スピナー +「計算中...」 |
| 解法非表示 | `[...]` | `false` | `[...]` | タブ +「解法を見る」ボタン |
| 解法表示 | `[...]` | `false` | `[...]` | タブ + 手順 + ◀▶▶▶ |

## 非同期アーキテクチャ

### Web Worker

`src/workers/crossSolver.worker.ts` が IDA* ソルバーをメインスレッド外で実行する。

### requestId による stale 結果排除

```
useCrossSolver hook
├── useEffect(mount) → Worker 生成、onmessage ハンドラ登録
├── useEffect([scrambledState, scramble])
│   ├── requestIdRef++ (インクリメント)
│   ├── setSolving(true), setSolutions([])
│   └── worker.postMessage({ requestId, state, maxSolutions })
└── onmessage
    ├── if (response.requestId !== requestIdRef.current) → 無視
    └── setSolutions(result), setSolving(false)
```

ユーザーが連続シャッフルした場合、古い requestId の結果は無視される。

### レイアウト安定化

`.cross-solution` に `min-height: 120px` を設定。4状態すべてで同じ高さを占有し、状態遷移時のレイアウトシフトを防止。

## 性能ボトルネック

IDA* (深さ上限8, 最大5解) は最悪ケースで約3秒かかる。原因:

- 枝刈りテーブル未使用 (pruning table なし)
- 毎回 `applyMove` で新しい state オブジェクトを生成
- ヒューリスティックが粗い (misplaced edges / 2)

Worker 化により UI フリーズは解消されるが、計算時間自体は変わらない。

## 今後の改善余地

- **Pruning table**: 事前計算した距離テーブルで枝刈りを強化
- **SharedArrayBuffer**: pruning table をメインスレッドと共有
- **WASM**: ソルバーを Rust/C で書いて WASM 化
- **キャッシュ**: 同一スクランブルの結果をキャッシュ
