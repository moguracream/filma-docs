# 認証無しサンプルコード解説

このディレクトリには、Filma API を用いて認証無しで動画を表示する
サンプルコードが含まれています。ファイル構成と主な役割は次の通り
です。

| ファイル | 説明 |
| --- | --- |
| `index.html` | 動画をフォルダごとに一覧表示するトップページ。ページ読込時に `loadFileListByFolder` を実行して Filma から取得した動画一覧をカテゴリ別にサムネイル表示します。|
| `video.html` | 個別の動画再生ページ。URL パラメータ `id` に指定された動画 ID を `loadVideo` で読み込み、埋め込みプレーヤーとメタデータを表示します。|
| `script.js` | Filma API へのリクエスト処理をまとめた JavaScript。動画一覧取得、動画読み込み、メタデータ表示、サムネイル用の画像表示などを行います。API 接続先 (`API_HOST`) と API キー (`API_KEY`) を冒頭で設定します。|
| `style.css` | サンプルの最小限のスタイル定義。サムネイルの比率調整やモーダル表示のレイアウト調整を行います。|

## 使い方

1. `script.js` の `API_HOST` と `API_KEY` をお手元の Filma 契約情報に合わせて変更します。
2. 任意のウェブサーバーにこれらのファイルを配置し、`index.html` を開くと動画一覧が表示されます。
3. 動画のサムネイルまたはファイル名をクリックすると `video.html` が表示され、埋め込みプレーヤーで再生できます。

## 主な処理の流れ

### 動画一覧の取得

`loadFileListByFolder` 関数では Filma API の `/filmaapi/storage` エンドポイントからファイル情報を取得し、フォルダ名ごとにグループ化してサムネイル一覧を生成します。取得に失敗した場合はエラーを画面に表示します。

### 動画再生ページ

`video.html` では `loadVideo` 関数により、動画 ID を基にプレーヤー埋め込みコードとメタデータを取得します。プレーヤーは `xcream_player.min.js` を使用しており、ブラウザが Safari の場合は HLS、それ以外は DASH を利用してストリーミング再生を行います。

`video.html` の `<head>` には Filma 標準のストリーミングプレーヤーを読み込むため、
以下の 2 つのタグを必ず記述してください。

```html
<script src="https://filma.biz/dash_player/js/xcream_player.min.js"></script>
<link rel="stylesheet" type="text/css" href="https://filma.biz/dash_player/css/style.css">
```

JavaScript ファイルは DASH/HLS 再生を行うプレーヤー本体を提供し、CSS はプレーヤー
のレイアウトとボタン類のデザインを適用します。これらが無いと `loadVideo` 関数で
取得した埋め込みコードが正しく動作しないため、動画を再生できません。

## カスタマイズのヒント

- `USE_SHOW_ALL` を `true` にすると、Full Access 権限の API キー使用時に非公開ファイルも取得できます（詳細は `api_specification.md` を参照）。
- サムネイル表示数やレイアウトは `style.css` と `script.js` の該当箇所を編集することで変更可能です。
- モーダルでスクリーンショットを拡大表示する仕組みは `setupScreenshotViewer` 関数で実装されています。必要に応じて挙動を調整してください。

