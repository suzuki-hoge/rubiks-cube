# デバッグノウハウ

## iPhone Safari リモートデバッグ

### 前提
- Mac + iPhone を USB ケーブルで接続

### iPhone 側の設定
1. **設定 → Safari → 詳細** → 「Web インスペクタ」をオン
   - ※ Mac の Safari からは有効にできない。必ず iPhone 本体の設定アプリで行う

### Mac 側の設定
1. **Safari → 設定 → 詳細** → 「メニューバーに"開発"メニューを表示」をオン

### ローカル開発サーバへの接続
1. `yarn dev --host` で起動（`--host` がないと iPhone からアクセスできない）
2. Mac の IP を確認: `ifconfig | grep 192`
3. iPhone の Safari で `http://192.168.x.x:5173` を開く
4. Mac Safari → **開発** → iPhone 名 → 対象ページを選択
5. コンソールタブで `console.log` が確認できる

### GitHub Pages のデバッグ
1. `make build` でビルド & デプロイ
2. iPhone の Safari で GitHub Pages の URL を開く
3. Mac Safari → **開発** → iPhone 名 → 対象ページを選択
