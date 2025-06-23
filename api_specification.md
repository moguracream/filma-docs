# Filma API 仕様書

## 概要

Filma APIは動画ファイルの管理、配信、エンコーディングを行うためのRESTful APIです。

## 認証

すべてのAPIエンドポイントは認証が必要です。

### APIキー認証

すべてのリクエストには`api_key`パラメータが必要です。

```
GET /filmaapi/storage?api_key=your_api_key_here
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

APIユーザーごとに許可されたドメインからのアクセスのみが可能です。RefererまたはOriginヘッダーで制御されます。

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

**403 Forbidden (domain access denied)**
- アクセス許可ドメインが設定されていない
- 現在のドメインが許可リストに含まれていない

**403 Forbidden (fullaccess required)**
- fullaccess権限が必要な操作をreadonly権限で実行しようとしている

**404 Not Found**
- 公開されていないファイルにアクセスしようとしている（readonly権限の場合）
- 存在しないファイルIDを指定している

## エラーレスポンス

| HTTPステータス | 説明 |
|---|---|
| 401 | 認証エラー（APIキーが無効または未指定） |
| 403 | 権限エラー（fullaccess権限が必要な操作） |
| 404 | リソースが見つからない |
| 500 | サーバー内部エラー |

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
| api_key | string | ✓ | - | APIキー |
| page | integer | - | 1 | ページ番号 |
| per_page | integer | - | 20 | 1ページあたりの件数（最大100） |
| folder_id | integer | - | - | フォルダID（指定時は該当フォルダのファイルのみ取得） |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |

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
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | ファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**注意:**
- デフォルトでは公開されたファイルのみアクセス可能
- `show_all=true`かつfullaccess権限の場合、非公開ファイルもアクセス可能

**レスポンス例:**

```json
{
  "url": "https://example.com/filmaapi/player/12345?api_key=xxx",
  "embed_code": "<script src=\"https://example.com/dash_player/js/xcream_player.min.js\"></script>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"https://example.com/dash_player/css/style.css\">\n<div id=\"video-12345\" class=\"sample-video\" data-drm=\"true\" style=\"width: 100%;\"></div>\n<script>\n  (function() {\n    function initPlayer() {\n      let elem = document.getElementById('video-12345');\n      if (elem == null) {\n        return;\n      }\n      if (isSafari()) {\n        elem.dataset.src = 'https://example.com/filmaapi/hls/12345.m3u8?api_key=xxx';\n      } else {\n        elem.dataset.src = 'https://example.com/filmaapi/dash/12345.mpd?api_key=xxx';\n      }\n      init_xcream_player('video-12345');\n    }\n    \n    // DOMが既に読み込まれている場合は即座に実行、そうでなければイベントを待機\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', initPlayer);\n    } else {\n      initPlayer();\n    }\n  })();\n</script>",
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
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | ファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

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
       "player_embedding_html": "<script src=\"https://example.com/dash_player/js/xcream_player.min.js\"></script>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"https://example.com/dash_player/css/style.css\">\n<div id=\"video-67890\" class=\"sample-video\" data-drm=\"true\" style=\"width: 100%;\"></div>\n<script>\n  (function() {\n    function initPlayer() {\n      let elem = document.getElementById('video-67890');\n      if (elem == null) {\n        return;\n      }\n      if (isSafari()) {\n        elem.dataset.src = 'https://example.com/filmaapi/hls/67890.m3u8?api_key=xxx';\n      } else {\n        elem.dataset.src = 'https://example.com/filmaapi/dash/67890.mpd?api_key=xxx';\n      }\n      init_xcream_player('video-67890');\n    }\n    \n    // DOMが既に読み込まれている場合は即座に実行、そうでなければイベントを待機\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', initPlayer);\n    } else {\n      initPlayer();\n    }\n  })();\n</script>",
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
| api_key | string | ✓ | APIキー |

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
| api_key | string | ✓ | APIキー |

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
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | フォルダID |

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
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | ファイルID |

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
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

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
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

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
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

#### HLSメディア配信

```
GET /filmaapi/hls/{id}/media
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

#### HLSヘッダー取得

```
HEAD /filmaapi/hls/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | エンコードファイルID |
| show_all | boolean | - | 全ファイル表示フラグ（fullaccess権限のみ有効） |

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
| ファイルアップロード | ❌ 未実装 |
| エンコード管理 | ❌ 未実装 |

## 使用例

### cURLでの使用例

```bash
# ファイル一覧取得（1ページ目、10件ずつ、公開ファイルのみ）
curl "https://example.com/filmaapi/storage?api_key=your_api_key&page=1&per_page=10"

# ファイル一覧取得（全ファイル表示 - fullaccess権限のみ）
curl "https://example.com/filmaapi/storage?api_key=your_api_key&page=1&per_page=10&show_all=true"

# ファイル再生情報取得（公開ファイルのみ）
curl "https://example.com/filmaapi/storage/12345?api_key=your_api_key"

# ファイル再生情報取得（全ファイル表示 - fullaccess権限のみ）
curl "https://example.com/filmaapi/storage/12345?api_key=your_api_key&show_all=true"

# ファイルメタデータ取得（公開ファイルのみ）
curl "https://example.com/filmaapi/storage/metadata/12345?api_key=your_api_key"

# ファイルメタデータ取得（全ファイル表示 - fullaccess権限のみ）
curl "https://example.com/filmaapi/storage/metadata/12345?api_key=your_api_key&show_all=true"

# フォルダ一覧取得
curl "https://example.com/filmaapi/storage/folders?api_key=your_api_key"

# フォルダ詳細取得
curl "https://example.com/filmaapi/storage/folders/100?api_key=your_api_key"

# ファイル削除
curl -X DELETE "https://example.com/filmaapi/storage/12345?api_key=your_api_key"

# プレイヤー表示（公開ファイルのみ - デフォルト）
curl "https://example.com/filmaapi/player/12345?api_key=your_api_key"

# プレイヤー表示（全ファイル表示 - fullaccess権限のみ）
curl "https://example.com/filmaapi/player/12345?api_key=your_api_key&show_all=true"

# DASH配信（公開ファイルのみ）
curl "https://example.com/filmaapi/dash/12345?api_key=your_api_key"

# DASH配信（全ファイル表示 - fullaccess権限のみ）
curl "https://example.com/filmaapi/dash/12345?api_key=your_api_key&show_all=true"
```

### JavaScriptでの使用例

```javascript
// ファイル一覧取得（公開ファイルのみ）
const listResponse = await fetch('/filmaapi/storage?api_key=your_api_key&page=1&per_page=20');
const listData = await listResponse.json();

console.log('総件数:', listData.pagination.total_count);
console.log('ファイル一覧:', listData.items);
// 各ファイルのスクリーンショットを表示
listData.items.forEach(file => {
  console.log(`ファイル ${file.filename} のスクリーンショット:`, file.screen_shots);
});

// ファイル一覧取得（全ファイル表示 - fullaccess権限のみ）
const allListResponse = await fetch('/filmaapi/storage?api_key=your_api_key&page=1&per_page=20&show_all=true');
const allListData = await allListResponse.json();

console.log('全ファイル総件数:', allListData.pagination.total_count);
console.log('全ファイル一覧:', allListData.items);

// ファイル再生情報取得（公開ファイルのみ）
const playerResponse = await fetch('/filmaapi/storage/12345?api_key=your_api_key');
const playerData = await playerResponse.json();

console.log('再生URL:', playerData.url);
console.log('埋め込みコード:', playerData.embed_code);
console.log('スクリーンショット:', playerData.screen_shots);

// ファイル再生情報取得（全ファイル表示 - fullaccess権限のみ）
const allPlayerResponse = await fetch('/filmaapi/storage/12345?api_key=your_api_key&show_all=true');
const allPlayerData = await allPlayerResponse.json();

console.log('全ファイル再生URL:', allPlayerData.url);
console.log('全ファイル埋め込みコード:', allPlayerData.embed_code);

// ファイルメタデータ取得（公開ファイルのみ）
const metadataResponse = await fetch('/filmaapi/storage/metadata/12345?api_key=your_api_key');
const metadataData = await metadataResponse.json();

// ファイルメタデータ取得（全ファイル表示 - fullaccess権限のみ）
const allMetadataResponse = await fetch('/filmaapi/storage/metadata/12345?api_key=your_api_key&show_all=true');
const allMetadataData = await allMetadataResponse.json();

console.log('メタデータ:', metadataData);
console.log('スクリーンショット:', metadataData.screen_shots);
console.log('プレイヤーデータ:', metadataData.player_data);

console.log('全ファイルメタデータ:', allMetadataData);
console.log('全ファイルスクリーンショット:', allMetadataData.screen_shots);
console.log('全ファイルプレイヤーデータ:', allMetadataData.player_data);

// フォルダ一覧取得
const foldersResponse = await fetch('/filmaapi/storage/folders?api_key=your_api_key');
const foldersData = await foldersResponse.json();

console.log('フォルダ一覧:', foldersData);

// フォルダ詳細取得
const folderResponse = await fetch('/filmaapi/storage/folders/100?api_key=your_api_key');
const folderData = await folderResponse.json();

console.log('フォルダ詳細:', folderData);

// プレイヤー表示（公開ファイルのみ - デフォルト）
window.open('/filmaapi/player/12345?api_key=your_api_key', '_blank');

// プレイヤー表示（全ファイル表示 - fullaccess権限のみ）
window.open('/filmaapi/player/12345?api_key=your_api_key&show_all=true', '_blank');
```

## 注意事項

- APIキーは各リクエストに必要です
- fullaccess権限が必要な操作は明記されています
- ページングは最大100件まで取得可能です
- エラーが発生した場合は適切なHTTPステータスコードが返されます
