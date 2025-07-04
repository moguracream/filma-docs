# Filma API 仕様書

## 概要

Filma APIは動画ファイルの管理、配信、エンコーディングを行うためのRESTful APIです。

## 認証

すべてのAPIエンドポイントは認証が必要です。Filma APIはハイブリッド認証システムを採用しており、以下の認証方法をサポートしています。

### ハイブリッド認証システム

Filma APIは2つの認証方法を併用できます：

1. **APIキー認証** - APIキーベース認証（クエリパラメータまたはX-Api-Keyヘッダー）
2. **JWT認証** - JWTトークンベース認証（Bearer Token、Cookie）

### 認証方法の優先順位

複数の認証情報が提供された場合、以下の優先順位で認証を試行します：

1. **JWT認証（Authorization header）**: `Authorization: Bearer <jwt_token>`
2. **JWT認証（Cookie）**: `filma_jwt_token` Cookie
3. **APIキー認証（X-Api-Key header）**: `X-Api-Key: <api_key>`
4. **APIキー認証（query parameter）**: `?api_key=<api_key>`

### APIキー認証

APIキー認証では、以下の2つの方法でAPIキーを送信できます：

#### 1. X-Api-Keyヘッダー（推奨）

```bash
curl -H "X-Api-Key: your_api_key_here" \
  "https://filma.biz/filmaapi/storage"
```

#### 2. クエリパラメータ

```bash
curl "https://filma.biz/filmaapi/storage?api_key=your_api_key_here"
```

### JWT認証

JWTトークンベースの認証システムです。以下の2つの方法でJWTトークンを送信できます：

#### 1. Authorization ヘッダー（推奨）

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage"
```

#### 2. Cookie（自動管理）

```bash
curl -H "Cookie: filma_jwt_token=eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage"
```

### JWTトークンの発行方法

#### APIキー認証でJWTトークン発行

既存のAPIキーを使用してJWTトークンを発行できます：

##### X-Api-Keyヘッダーを使用（推奨）

```bash
curl -X POST "https://filma.biz/filmaapi/token" \
  -H "X-Api-Key: your_api_key" \
  -H "Content-Type: application/json"
```

##### クエリパラメータを使用

```bash
curl -X POST "https://filma.biz/filmaapi/token?api_key=your_api_key" \
  -H "Content-Type: application/json"
```

**レスポンス例:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJvcmdhbml6YXRpb25faWQiOjEsImV4cCI6MTcwNDAwNzIwMCwiaWF0IjoxNzAzOTIwODAwfQ.signature",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": 1704007200,
  "user_id": 1,
  "organization_id": 1,
  "api_type": "readonly"
}
```

### 権限レベル

- **readonly**: 読み取り専用権限
- **fullaccess**: 読み取り・書き込み権限

### 公開状態による制限

ファイルには公開状態（published）が設定されており、APIキーの権限に応じてアクセス制限が適用されます。

#### アクセス制御ルール

| 権限 | デフォルト | show_all=true指定時 |
|---|---|---|
| readonly | 公開ファイルのみ | 公開ファイルのみ（パラメータ無視） |
| fullaccess | 公開ファイルのみ | 全ファイル（公開・非公開問わず） |

**show_allパラメータ:**
- `show_all=true`: fullaccess権限の場合のみ、非公開ファイルも含めて全てのファイルにアクセス可能
- 未指定またはfalse: 権限に関係なく公開ファイルのみアクセス可能

### ドメインアクセス制限

**重要**: JWT認証でもドメインアクセス制限が適用されます。これにより二重のセキュリティを実現します。

#### 認証方法別のドメインアクセス制限

1. **APIキー認証**
   - ユーザーの`api_access_domains`に基づいてドメインチェック
   - 設定されていない場合はFilma APIホストのみ許可

2. **JWT認証（Cookie・Bearer共通）**
   - **Filma APIホストからのアクセス**: 常に許可（管理画面アクセス含む）
   - **外部ドメインからのアクセス**: ユーザーの`api_access_domains`設定に基づく
   - **一般ユーザー**: 外部ドメインからのアクセス拒否（Filma APIホストのみ許可）今後改善予定
   - **APIキーユーザー**: `api_access_domains`設定に基づく

#### ドメイン制限の確認方法

RefererまたはOriginヘッダーで制御されます：

```bash
# 許可されたドメインからのアクセス（成功）
curl -H "Referer: https://example.com/video.html" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "https://filma.biz/filmaapi/player/12345"

# 許可されていないドメインからのアクセス（403エラー）
curl -H "Referer: https://unauthorized.com/video.html" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "https://filma.biz/filmaapi/player/12345"
```

### JWTセキュリティ特徴

- **組織分離**: 組織ごとに異なるシークレットキー
- **自動期限切れ**: デフォルト24時間で無効化
- **ドメイン制限**: 許可されたドメインからのみアクセス可能
- **トークンリフレッシュ**: 有効なトークンから新しいトークンを発行可能

## JWT認証API

### JWTトークン発行 `POST /filmaapi/token`

APIキーを使用してJWTトークンを発行します。

#### リクエスト

**ヘッダー認証（推奨）**
```bash
curl -X POST "https://filma.biz/filmaapi/token" \
  -H "X-Api-Key: e47aad55d7fb4f152603b91b" \
  -H "Content-Type: application/json"
```

**クエリパラメータ認証**
```bash
curl -X POST "https://filma.biz/filmaapi/token?api_key=e47aad55d7fb4f152603b91b" \
  -H "Content-Type: application/json"
```

#### レスポンス

**成功時（HTTP 200）**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJvcmdhbml6YXRpb25faWQiOjEsImV4cCI6MTcwNDAwNzIwMCwiaWF0IjoxNzAzOTIwODAwfQ.signature",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": 1704007200,
  "user_id": 1,
  "organization_id": 1,
  "api_type": "readonly"
}
```

**エラー時（HTTP 401）**
```json
{
  "error": "api_key_authentication_failed",
  "message": "API認証に失敗しました"
}
```

### JWTトークン情報取得 `GET /filmaapi/token`

現在のJWTトークンの情報を取得します。

#### リクエスト

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "https://filma.biz/filmaapi/token"
```

#### レスポンス

**成功時（HTTP 200）**
```json
{
  "user_id": 1,
  "organization_id": 1,
  "api_type": "readonly",
  "expires_at": 1704007200,
  "issued_at": 1703920800,
  "is_valid": true,
  "time_remaining": 86400
}
```

### JWTトークンリフレッシュ `POST /filmaapi/token/refresh`

有効なJWTトークンを使用して新しいトークンを発行します。

#### リクエスト

```bash
curl -X POST "https://filma.biz/filmaapi/token/refresh" \
  -H "Authorization: Bearer <current_jwt_token>" \
  -H "Content-Type: application/json"
```

#### レスポンス

**成功時（HTTP 200）**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJvcmdhbml6YXRpb25faWQiOjEsImV4cCI6MTcwNDAwNzIwMCwiaWF0IjoxNzAzOTIwODAwfQ.new_signature",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": 1704093600,
  "user_id": 1,
  "organization_id": 1,
  "api_type": "readonly"
}
```

## APIキーの発行方法

FilmaのAPIを利用するには、管理画面でAPIユーザーを作成し、APIキーを発行する必要があります。

### 前提条件

- Filma管理画面へのアクセス権限が必要です
- 組織の管理者権限が必要です

### APIキー発行手順

#### 1. 管理画面にログイン

1. ブラウザでFilma管理画面にアクセス
   ```
   https://filma.biz/filmaadmin/
   ```

2. 管理者アカウントでログイン

#### 2. APIユーザーの作成

1. 管理画面の左側メニューまたはダッシュボードから「**ユーザー一覧**」をクリック

2. 「**新しいユーザーを追加する**」ボタンをクリック

3. ユーザー情報を入力：
   - **e-mail**: 空欄でも可（APIユーザーの場合）
   - **氏名**: API利用用途が分かる名前を入力（例：「外部サイト連携用」「モバイルアプリ用」）
   - **APIユーザー**: ✅ チェックを入れる

4. 「**送信**」ボタンをクリック

#### 3. APIキーの確認とAPI種類の設定

1. ユーザー作成後、自動的にユーザー詳細画面に遷移

2. **APIキー**欄に自動生成されたAPIキーが表示される
   - 例：`a1b2c3d4e5f6789a`
   - このAPIキーをコピーして保存

3. **API種類**を確認：
   - **読取専用 (readonly)**: デフォルト設定
   - **フルアクセス (fullaccess)**: 編集権限が必要な場合

4. API種類を変更する場合は「**編集**」ボタンをクリック

#### 4. ドメインアクセス制限の設定

APIキーを特定のドメインからのみ利用可能にするため、アクセス許可ドメインを設定します。

1. ユーザー詳細画面で「**API設定編集**」ボタンをクリック

2. **アクセス許可ドメイン**に利用するドメインを1行1つずつ入力：
   ```
   example.com
   api.example.com
   mobile-app.example.com
   ```

3. **API種類**を必要に応じて変更：
   - **読み取り専用 (readonly)**: データの取得のみ可能
   - **読み書き可能 (fullaccess)**: データの取得・更新・削除が可能

4. 「**保存**」ボタンをクリック

#### 5. APIキーの利用

発行されたAPIキーを使用してAPIにアクセスできます：

```bash
# 例: ファイル一覧の取得
curl "https://filma.biz/filmaapi/storage?api_key=a1b2c3d4e5f6789a"
```

### 重要な注意事項

1. **APIキーの管理**
   - APIキーは外部に漏らさないよう厳重に管理してください
   - 特にfullaccess権限のAPIキーは細心の注意が必要です

2. **ドメイン制限**
   - アクセス許可ドメインが未設定の場合、他のドメインからのアクセスが拒否されます
   - Filmaのドメインからのアクセスは常に許可されます

3. **権限による機能制限**
   - readonly権限: 公開ファイルの参照のみ
   - fullaccess権限: 全ファイルの参照・編集（`show_all=true`パラメータ使用時）

4. **APIキーの削除・再発行**
   - 必要に応じてユーザー一覧からAPIユーザーを削除できます
   - 新しいAPIキーが必要な場合は新しいAPIユーザーを作成してください

### トラブルシューティング

#### よくあるエラーと対処法

**401 Unauthorized**
- APIキーが正しく指定されていない
- APIキーが無効または削除されている
- JWTトークンが無効または期限切れ

**403 Forbidden (domain access denied)**
- アクセス許可ドメインが設定されていない
- 現在のドメインが許可リストに含まれていない

**403 Forbidden (fullaccess required)**
- fullaccess権限が必要な操作をreadonly権限で実行しようとしている

**404 Not Found**
- 公開されていないファイルにアクセスしようとしている（readonly権限の場合）
- 存在しないファイルIDを指定している

**JWT認証エラー**
- トークンの形式が無効
- トークンの有効期限が切れている
- 組織のシークレットキーが一致しない

## エラーレスポンス

### HTTPステータスコード

| HTTPステータス | 説明 |
|---|---|
| 401 | 認証エラー（APIキー/JWTトークンが無効または未指定） |
| 403 | 権限エラー（fullaccess権限が必要な操作またはドメインアクセス拒否） |
| 404 | リソースが見つからない |
| 500 | サーバー内部エラー |

### JWT認証エラーの詳細レスポンス

JWT認証で期限切れやその他のエラーが発生した場合、詳細なエラー情報がJSON形式で返されます：

```json
{
  "error": "jwt_authentication_failed",
  "message": "JWT認証に失敗しました",
  "details": {
    "timestamp": "2023-12-31T23:59:59Z",
    "request_id": "a1b2c3d4",
    "action_required": "refresh_token",
    "refresh_endpoint": "/filmaapi/token"
  }
}
```

## エンドポイント

### Storage API

ファイルの管理と配信を行います。

#### ファイル一覧取得

```
GET /filmaapi/storage
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| page | integer | - | 1 | ページ番号 |
| per_page | integer | - | 20 | 1ページあたりの件数（最大100） |
| folder_id | integer | - | - | フォルダID（指定時は該当フォルダのファイルのみ取得） |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**注意:**
- デフォルトでは公開されたファイルのみ取得
- `show_all=true`かつfullaccess権限の場合、非公開ファイルも含めて全ファイル取得

**レスポンス例:**

```json
{
  "items": [
    {
      "id": 12345,
      "filename": "sample_video.mp4",
      "folder_id": 100,
      "folder_name": "動画フォルダ",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z",
      "creator": "山田太郎",
      "updater": "山田太郎",
      "screen_shots": [
        "https://example.com/storage/screenshot1.jpg",
        "https://example.com/storage/screenshot2.jpg",
        "https://example.com/storage/screenshot3.jpg"
      ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_count": 150,
    "total_pages": 8
  }
}
```

**レスポンスフィールド詳細:**

| フィールド名 | 型 | 説明 |
|---|---|---|
| items | array | ファイル情報の配列 |
| items[].id | integer | ファイルの一意識別子 |
| items[].filename | string | ファイル名 |
| items[].folder_id | integer | 所属フォルダのID |
| items[].folder_name | string | 所属フォルダの名前 |
| items[].created_at | string | ファイル作成日時（ISO 8601形式） |
| items[].updated_at | string | ファイル更新日時（ISO 8601形式） |
| items[].creator | string | ファイル作成者名 |
| items[].updater | string | ファイル更新者名 |
| items[].screen_shots | array | スクリーンショット画像のURL配列 |
| pagination | object | ページング情報 |
| pagination.current_page | integer | 現在のページ番号 |
| pagination.per_page | integer | 1ページあたりの件数 |
| pagination.total_count | integer | 総ファイル数 |
| pagination.total_pages | integer | 総ページ数 |

#### ファイル再生情報取得

```
GET /filmaapi/storage/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |
| id | integer | ✓ | ファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**注意:**
- デフォルトでは公開されたファイルのみアクセス可能
- `show_all=true`かつfullaccess権限の場合、非公開ファイルもアクセス可能

**レスポンス例:**

```json
{
  "url": "https://example.com/filmaapi/player/12345?api_key=xxx",
  "embed_code": "<script src=\"https://example.com/dash_player/js/xcream_player.min.js"></script>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"https://example.com/dash_player/css/style.css\">\n<div id=\"video-12345\" class=\"sample-video\" data-drm=\"true\" style=\"width: 100%;\"></div>\n<script>\n  (function() {\n    function initPlayer() {\n      let elem = document.getElementById('video-12345');\n      if (elem == null) {\n        return;\n      }\n      if (isSafari()) {\n        elem.dataset.src = 'https://example.com/filmaapi/hls/12345.m3u8?api_key=xxx';\n      } else {\n        elem.dataset.src = 'https://example.com/filmaapi/dash/12345.mpd?api_key=xxx';\n      }\n      init_xcream_player('video-12345');\n    }\n    \n    // DOMが既に読み込まれている場合は即座に実行、そうでなければイベントを待機\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', initPlayer);\n    } else {\n      initPlayer();\n    }\n  })();\n</script>",
  "mediafile_id": 12345,
  "screen_shots": [
    "https://example.com/storage/screenshot1.jpg",
    "https://example.com/storage/screenshot2.jpg",
    "https://example.com/storage/screenshot3.jpg"
  ]
}
```

**レスポンスフィールド詳細:**

| フィールド名 | 型 | 説明 |
|---|---|---|
| url | string | プレイヤーページのURL |
| embed_code | string | HTMLに埋め込み可能なプレイヤーコード |
| mediafile_id | integer | エンコード済みファイルの識別子 |
| screen_shots | array | スクリーンショット画像のURL配列 |
**補足:**
返された`embed_code`をページに貼り付けただけでは再生できません。以下のJavaScriptとCSSをHTMLに読み込んでください。

```html
<script src="https://filma.biz/dash_player/js/xcream_player.min.js"></script>
<link rel="stylesheet" type="text/css" href="https://filma.biz/dash_player/css/style.css">
```

#### ファイルメタデータ取得

```
GET /filmaapi/storage/metadata/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |
| id | integer | ✓ | ファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**注意:**
- デフォルトでは公開されたファイルのみアクセス可能
- `show_all=true`かつfullaccess権限の場合、非公開ファイルもアクセス可能

**レスポンス例:**

```json
{
  "id": 12345,
  "name": "sample_video.mp4",
  "folder_id": 100,
  "folder_name": "動画フォルダ",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z",
  "creator": "山田太郎",
  "updater": "山田太郎",
  "screen_shots": [
    "https://example.com/storage/screenshot1.jpg",
    "https://example.com/storage/screenshot2.jpg",
    "https://example.com/storage/screenshot3.jpg"
  ],
  "player_data": [
     {
       "resolution_string": "HD 1280x720",
       "filesize_megabyte": 150.5,
       "bitrate_human": "2.5 Mbps",
       "player_url": "https://example.com/filmaapi/player/67890?api_key=xxx",
       "player_embedding_html": "<script src=\"https://example.com/dash_player/js/xcream_player.min.js"></script>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"https://example.com/dash_player/css/style.css\">\n<div id=\"video-67890\" class=\"sample-video\" data-drm=\"true\" style=\"width: 100%;\"></div>\n<script>\n  (function() {\n    function initPlayer() {\n      let elem = document.getElementById('video-67890');\n      if (elem == null) {\n        return;\n      }\n      if (isSafari()) {\n        elem.dataset.src = 'https://example.com/filmaapi/hls/67890.m3u8?api_key=xxx';\n      } else {\n        elem.dataset.src = 'https://example.com/filmaapi/dash/67890.mpd?api_key=xxx';\n      }\n      init_xcream_player('video-67890');\n    }\n    \n    // DOMが既に読み込まれている場合は即座に実行、そうでなければイベントを待機\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', initPlayer);\n    } else {\n      initPlayer();\n    }\n  })();\n</script>",
       "screen_shots": [
         "https://example.com/storage/screenshot1.jpg",
         "https://example.com/storage/screenshot2.jpg",
         "https://example.com/storage/screenshot3.jpg"
       ]
     }
   ]
}
```

**レスポンスフィールド詳細:**

| フィールド名 | 型 | 説明 |
|---|---|---|
| id | integer | ファイルの一意識別子 |
| name | string | ファイル名 |
| folder_id | integer | 所属フォルダのID |
| folder_name | string | 所属フォルダの名前 |
| created_at | string | ファイル作成日時（ISO 8601形式） |
| updated_at | string | ファイル更新日時（ISO 8601形式） |
| creator | string | ファイル作成者名 |
| updater | string | ファイル更新者名 |
| screen_shots | array | ファイル全体のスクリーンショット画像URL配列 |
| player_data | array | エンコード済みファイル（解像度別）の情報配列 |
| player_data[].resolution_string | string | 解像度の表示文字列（例：「HD 1280x720」） |
| player_data[].filesize_megabyte | number | ファイルサイズ（MB） |
| player_data[].bitrate_human | string | ビットレートの人間が読める形式（例：「2.5 Mbps」） |
| player_data[].player_url | string | 該当解像度ファイルのプレイヤーページURL |
| player_data[].player_embedding_html | string | 該当解像度ファイル用の埋め込みHTMLコード |
| player_data[].screen_shots | array | 該当解像度ファイルのスクリーンショット画像URL配列 |

**player_dataについて:**
- 音声のみのファイルは含まれません
- 動画ファイルのみが対象となります
- 解像度の低い順から配列に格納されます

#### ストレージ情報取得

```
GET /filmaapi/storage/metadata
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**レスポンス:**
```json
[]
```

*注: 現在は空の配列を返します。*

#### フォルダ一覧取得

```
GET /filmaapi/storage/folders
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**レスポンス例:**

```json
[
  {
    "id": 100,
    "name": "動画フォルダ",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z",
    "creator": "山田太郎",
    "updater": "山田太郎"
  },
  {
    "id": 101,
    "name": "教育動画",
    "created_at": "2024-01-02T11:00:00Z",
    "updated_at": "2024-01-02T11:00:00Z",
    "creator": "佐藤花子",
    "updater": "佐藤花子"
  }
]
```

**レスポンスフィールド詳細:**

| フィールド名 | 型 | 説明 |
|---|---|---|
| id | integer | フォルダの一意識別子 |
| name | string | フォルダ名 |
| created_at | string | フォルダ作成日時（ISO 8601形式） |
| updated_at | string | フォルダ更新日時（ISO 8601形式） |
| creator | string | フォルダ作成者名 |
| updater | string | フォルダ更新者名 |

#### フォルダ詳細取得

```
GET /filmaapi/storage/folders/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |
| id | integer | ✓ | フォルダID |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**レスポンス例:**

```json
{
  "id": 100,
  "name": "動画フォルダ",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z",
  "creator": "山田太郎",
  "updater": "山田太郎"
}
```

**レスポンスフィールド詳細:**

| フィールド名 | 型 | 説明 |
|---|---|---|
| id | integer | フォルダの一意識別子 |
| name | string | フォルダ名 |
| created_at | string | フォルダ作成日時（ISO 8601形式） |
| updated_at | string | フォルダ更新日時（ISO 8601形式） |
| creator | string | フォルダ作成者名 |
| updater | string | フォルダ更新者名 |

#### ファイルアップロード

```
POST /filmaapi/storage
```

**権限:** fullaccess権限が必要

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | ✓ | APIキー |

*注: 現在未実装です。*

#### ファイル削除

```
DELETE /filmaapi/storage/{id}
```

**権限:** fullaccess権限が必要

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |
| id | integer | ✓ | ファイルID |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**レスポンス例:**

```json
{
  "id": 12345,
  "status": "deleted",
  "filename": "sample_video.mp4"
}
```

**レスポンスフィールド詳細:**

| フィールド名 | 型 | 説明 |
|---|---|---|
| id | integer | 削除されたファイルの識別子 |
| status | string | 削除ステータス（常に「deleted」） |
| filename | string | 削除されたファイル名 |

**削除について:**
- ファイルは論理削除され、物理的には削除されません
- 削除されたファイルは通常のAPI呼び出しでは取得できなくなります

### Encode API

動画エンコーディングの管理を行います。

*注: 以下のエンドポイントは現在未実装です。*

#### エンコード状況取得

```
GET /filmaapi/encode/{id}
```

**権限:** fullaccess権限が必要

#### エンコード開始

```
POST /filmaapi/encode
```

**権限:** fullaccess権限が必要

#### エンコード削除

```
DELETE /filmaapi/encode/{id}
```

**権限:** fullaccess権限が必要

### Player API

動画プレイヤーの表示を行います。

#### プレイヤー表示

```
GET /filmaapi/player/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**エンコードファイルIDについて:**
- `GET /filmaapi/storage/{id}`の`mediafile_id`フィールドで取得可能
- ファイルメタデータ取得の`player_data[].player_url`からも確認可能

**レスポンス:**
- HTMLプレイヤー画面

**注意:**
- デフォルトでは公開されたファイルのみアクセス可能
- `show_all=true`かつfullaccess権限の場合、非公開ファイルもアクセス可能

### DASH API

DASH形式での動画配信を行います。

#### DASH配信

```
GET /filmaapi/dash/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**エンコードファイルIDについて:**
- `GET /filmaapi/storage/{id}`の`mediafile_id`フィールドで取得可能
- ファイルメタデータ取得の`player_data[].player_url`からも確認可能

**注意:**
- デフォルトでは公開されたファイルのみアクセス可能
- `show_all=true`かつfullaccess権限の場合、非公開ファイルもアクセス可能

### HLS API

HLS形式での動画配信を行います。

#### HLS配信

```
GET /filmaapi/hls/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

#### HLSメディア配信

```
GET /filmaapi/hls/{id}/media
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

#### HLSヘッダー取得

```
HEAD /filmaapi/hls/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | * | APIキー（JWT認証時は不要） |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**エンコードファイルIDについて（HLS API共通）:**
- `GET /filmaapi/storage/{id}`の`mediafile_id`フィールドで取得可能
- ファイルメタデータ取得の`player_data[].player_url`からも確認可能

**注意（HLS API共通）:**
- デフォルトでは公開されたファイルのみアクセス可能
- `show_all=true`かつfullaccess権限の場合、非公開ファイルもアクセス可能

## API利用時の重要事項

### 公開状態による制御

APIでは以下の条件でファイルの表示・非表示が制御されます：

1. **全ファイル表示**の場合：
   - `show_all=true`パラメータ **かつ** fullaccess権限
   - **または** 管理画面にログイン済み

2. **公開ファイルのみ表示**の場合：
   - 公開設定されたファイルのみアクセス可能

### ページング制限

- `per_page`パラメータは最大100件まで指定可能
- 100件を超える値が指定された場合は、デフォルトの20件に自動調整されます

### フォルダフィルタリング

- `folder_id`パラメータ指定時に該当フォルダが存在しない場合は404エラーが返されます
- フォルダIDが0以下の場合はフィルタリングが適用されません

### エラー処理

- すべてのAPIで統一されたエラーハンドリングが実装されています
- サーバーエラー発生時は500エラーと共に問い合わせ番号（inquiry number）が返されます

### CORS対応

- すべてのAPIでCross-Origin Resource Sharing（CORS）に対応しています
- プリフライトリクエスト（OPTIONS）にも対応
- エラー時はより柔軟なCORS設定が適用されます

## 実装ステータス

| 機能 | ステータス |
|---|---|
| ファイル一覧取得（ページング付き） | ✅ 実装済み |
| ファイル再生情報取得 | ✅ 実装済み |
| ファイルメタデータ取得 | ✅ 実装済み |
| ストレージ情報取得 | ✅ 実装済み（空レスポンス） |
| フォルダ一覧取得 | ✅ 実装済み |
| フォルダ詳細取得 | ✅ 実装済み |
| ファイル削除 | ✅ 実装済み（論理削除） |
| プレイヤー表示 | ✅ 実装済み |
| DASH配信 | ✅ 実装済み |
| HLS配信 | ✅ 実装済み |
| 公開状態チェック機能 | ✅ 実装済み |
| CORS対応 | ✅ 実装済み |
| ドメインアクセス制限 | ✅ 実装済み |
| 共通エラーハンドリング | ✅ 実装済み |
| **JWT認証システム** | **✅ 実装済み** |
| JWTトークン発行 | ✅ 実装済み |
| JWTトークンリフレッシュ | ✅ 実装済み |
| JWT Cookie自動管理 | ✅ 実装済み |
| ハイブリッド認証（APIキー+JWT） | ✅ 実装済み |
| JWT認証でのドメイン制限 | ✅ 実装済み |
| 管理画面JWT自動発行 | ✅ 実装済み |
| ファイルアップロード | ❌ 未実装 |
| エンコード管理 | ❌ 未実装 |

## 使用例

### cURLでの使用例

#### APIキー認証を使用した例

```bash
# ファイル一覧取得（1ページ目、10件ずつ、公開ファイルのみ）
curl "https://filma.biz/filmaapi/storage?api_key=your_api_key&page=1&per_page=10"

# ファイル一覧取得（全ファイル表示 - fullaccess権限のみ）
curl "https://filma.biz/filmaapi/storage?api_key=your_api_key&page=1&per_page=10&show_all=true"

# ファイル再生情報取得（公開ファイルのみ）
curl "https://filma.biz/filmaapi/storage/12345?api_key=your_api_key"

# ファイル再生情報取得（全ファイル表示 - fullaccess権限のみ）
curl "https://filma.biz/filmaapi/storage/12345?api_key=your_api_key&show_all=true"

# ファイルメタデータ取得（公開ファイルのみ）
curl "https://filma.biz/filmaapi/storage/metadata/12345?api_key=your_api_key"

# ファイルメタデータ取得（全ファイル表示 - fullaccess権限のみ）
curl "https://filma.biz/filmaapi/storage/metadata/12345?api_key=your_api_key&show_all=true"

# フォルダ一覧取得
curl "https://filma.biz/filmaapi/storage/folders?api_key=your_api_key"

# フォルダ詳細取得
curl "https://filma.biz/filmaapi/storage/folders/100?api_key=your_api_key"

# ファイル削除
curl -X DELETE "https://filma.biz/filmaapi/storage/12345?api_key=your_api_key"

# プレイヤー表示（公開ファイルのみ - デフォルト）
curl "https://filma.biz/filmaapi/player/12345?api_key=your_api_key"

# プレイヤー表示（全ファイル表示 - fullaccess権限のみ）
curl "https://filma.biz/filmaapi/player/12345?api_key=your_api_key&show_all=true"

# DASH配信（公開ファイルのみ）
curl "https://filma.biz/filmaapi/dash/12345?api_key=your_api_key"

# DASH配信（全ファイル表示 - fullaccess権限のみ）
curl "https://filma.biz/filmaapi/dash/12345?api_key=your_api_key&show_all=true"
```

#### JWT認証を使用した例

```bash
# 1. APIキーでJWTトークンを発行
curl -X POST "https://filma.biz/filmaapi/token" \
  -H "X-Api-Key: your_api_key" \
  -H "Content-Type: application/json"

# 2. 発行されたJWTトークンを使用してAPIアクセス（Authorization header）
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage?page=1&per_page=10"

# 3. ファイル再生情報取得（JWT認証）
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage/12345"

# 4. ファイルメタデータ取得（JWT認証）
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage/metadata/12345"

# 5. プレイヤー表示（JWT認証）
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/player/12345"

# 6. DASH配信（JWT認証）
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/dash/12345"

# 7. HLS配信（JWT認証）
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/hls/12345"

# 8. トークンリフレッシュ
curl -X POST "https://filma.biz/filmaapi/token/refresh" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json"

# 9. トークン情報取得
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/token"
```

#### 管理画面での自動JWT認証（Cookie）

```bash
curl -H "Cookie: filma_jwt_token=eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage"
```

## 注意事項

- APIキー認証またはJWT認証が各リクエストに必要です
- JWT認証は2つの方法（Authorization header、Cookie）で利用可能です
- 管理画面にログインすると、JWTトークンが自動でCookieに設定されます
- fullaccess権限が必要な操作は明記されています
- ページングは最大100件まで取得可能です
- エラーが発生した場合は適切なHTTPステータスコードが返されます
- JWT認証でもドメインアクセス制限が適用されます
