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
1. `make iphone-dev` で HTTPS 開発サーバーを起動（ジャイロ API は Secure Context 必須）
2. Mac の IP を確認: `ifconfig | grep 192`
3. iPhone の Safari で `https://192.168.x.x:5173` を開く
   - 自己署名証明書の警告が出るので「詳細を表示」→「このWebサイトを閲覧」で承認
4. Mac Safari → **開発** → iPhone 名 → 対象ページを選択
5. コンソールタブで `console.log` が確認できる

> **Note**: `make iphone-dev` は `HTTPS=1 yarn dev --host` を実行する。
> `@vitejs/plugin-basic-ssl` が自己署名証明書を自動生成し、HTTPS で配信する。
> 通常の `make dev` / `yarn dev` は HTTP のまま変わらない。

### GitHub Pages のデバッグ
1. `make build` でビルド & デプロイ
2. iPhone の Safari で GitHub Pages の URL を開く
3. Mac Safari → **開発** → iPhone 名 → 対象ページを選択

## Chrome DevTools でジャイロをエミュレートする

1. Chrome で `yarn dev` のページを開く
2. DevTools を開く (Cmd+Opt+I)
3. **⋮ (More tools)** → **Sensors** パネルを開く
4. **Orientation** セクションでデバイスの向きをエミュレートできる
   - **alpha**: 方位角 (0–360)
   - **beta**: 前後の傾き (-180–180) → キューブの x 軸回転に使用
   - **gamma**: 左右の傾き (-90–90) → キューブの y 軸回転に使用
5. スライダーを動かすと `DeviceOrientationEvent` が発火し、キューブが回転する
