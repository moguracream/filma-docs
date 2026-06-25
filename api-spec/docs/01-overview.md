# 概要

Filma APIは動画ファイルの管理、配信、エンコーディングを行うためのRESTful APIです。

### この仕様書で扱う範囲

- 動画ファイル管理: `Storage API`
- 再生・配信: `Player API` / `DASH API` / `HLS API` / `DRMライセンス API`
- 会員・視聴権管理: `Customers API` / `Entitlements API`

### 基本仕様

- ベースURL: `https://filma.biz/filmaapi`
- レスポンス形式: JSON
- 日時形式: ISO 8601（例: `2024-12-31T23:59:59Z`）
- ページング: `per_page` は最大100件（既定値はエンドポイントごとに記載）

### はじめに読む推奨順

1. [認証](02-authentication.md)
2. [エンドポイント](04-endpoints.md)
3. [使用例](07-examples.md)
4. [注意事項](08-cautions.md)

### 注意事項（要点）

- すべてのリクエストで認証が必要です（APIキー認証またはJWT認証）
- `fullaccess` 権限が必要な操作はエンドポイントごとに明記されています
- ドメインアクセス制限は APIキー認証時のみ適用され、JWT認証には適用されません
- ページングは1リクエストあたり最大100件です
- エラー時はHTTPステータスコードとJSONエラーレスポンスを返します

詳細は [注意事項](08-cautions.md) を参照してください。
