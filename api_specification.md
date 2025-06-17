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

### ドメインアクセス制限

APIユーザーごとに許可されたドメインからのアクセスのみが可能です。RefererまたはOriginヘッダーで制御されます。

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
      "updater": "山田太郎"
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

#### ファイル再生情報取得

```
GET /filmaapi/storage/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | ファイルID |

**レスポンス例:**

```json
{
  "url": "https://example.com/filmaapi/player/12345?api_key=xxx",
  "embed_code": "<script src=\"https://example.com/dash_player/js/xcream_player.min.js\"></script>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"https://example.com/dash_player/css/style.css\">\n<div id=\"video-12345\" class=\"sample-video\" data-drm=\"true\" style=\"width: 100%;\"></div>\n<script>\n  (function() {\n    function initPlayer() {\n      let elem = document.getElementById('video-12345');\n      if (elem == null) {\n        return;\n      }\n      if (isSafari()) {\n        elem.dataset.src = 'https://example.com/filmaapi/hls/12345.m3u8?api_key=xxx';\n      } else {\n        elem.dataset.src = 'https://example.com/filmaapi/dash/12345.mpd?api_key=xxx';\n      }\n      init_xcream_player('video-12345');\n    }\n    \n    // DOMが既に読み込まれている場合は即座に実行、そうでなければイベントを待機\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', initPlayer);\n    } else {\n      initPlayer();\n    }\n  })();\n</script>"
}
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
  "player_data": [
     {
       "resolution_string": "HD 1280x720",
       "filesize_megabyte": 150.5,
       "bitrate_human": "2.5 Mbps",
       "player_url": "https://example.com/filmaapi/player/67890?api_key=xxx",
       "player_embedding_html": "<script src=\"https://example.com/dash_player/js/xcream_player.min.js\"></script>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"https://example.com/dash_player/css/style.css\">\n<div id=\"video-67890\" class=\"sample-video\" data-drm=\"true\" style=\"width: 100%;\"></div>\n<script>\n  (function() {\n    function initPlayer() {\n      let elem = document.getElementById('video-67890');\n      if (elem == null) {\n        return;\n      }\n      if (isSafari()) {\n        elem.dataset.src = 'https://example.com/filmaapi/hls/67890.m3u8?api_key=xxx';\n      } else {\n        elem.dataset.src = 'https://example.com/filmaapi/dash/67890.mpd?api_key=xxx';\n      }\n      init_xcream_player('video-67890');\n    }\n    \n    // DOMが既に読み込まれている場合は即座に実行、そうでなければイベントを待機\n    if (document.readyState === 'loading') {\n      document.addEventListener('DOMContentLoaded', initPlayer);\n    } else {\n      initPlayer();\n    }\n  })();\n</script>"
     }
   ]
}
```

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

**レスポンス:**
- HTMLプレイヤー画面

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

#### HLSメディア配信

```
GET /filmaapi/hls/{id}/media
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | エンコードファイルID |

#### HLSヘッダー取得

```
HEAD /filmaapi/hls/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| api_key | string | ✓ | APIキー |
| id | integer | ✓ | エンコードファイルID |

## 実装ステータス

| 機能 | ステータス |
|---|---|
| ファイル一覧取得（ページング付き） | ✅ 実装済み |
| ファイル再生情報取得 | ✅ 実装済み |
| ファイルメタデータ取得 | ✅ 実装済み |
| ストレージ情報取得 | ✅ 実装済み（空レスポンス） |
| フォルダ一覧取得 | ✅ 実装済み |
| フォルダ詳細取得 | ✅ 実装済み |
| ファイル削除 | ✅ 実装済み |
| プレイヤー表示 | ✅ 実装済み |
| DASH配信 | ✅ 実装済み |
| HLS配信 | ✅ 実装済み |
| ファイルアップロード | ❌ 未実装 |
| エンコード管理 | ❌ 未実装 |

## 使用例

### cURLでの使用例

```bash
# ファイル一覧取得（1ページ目、10件ずつ）
curl "https://example.com/filmaapi/storage?api_key=your_api_key&page=1&per_page=10"

# ファイル再生情報取得
curl "https://example.com/filmaapi/storage/12345?api_key=your_api_key"

# ファイルメタデータ取得
curl "https://example.com/filmaapi/storage/metadata/12345?api_key=your_api_key"

# フォルダ一覧取得
curl "https://example.com/filmaapi/storage/folders?api_key=your_api_key"

# フォルダ詳細取得
curl "https://example.com/filmaapi/storage/folders/100?api_key=your_api_key"

# ファイル削除
curl -X DELETE "https://example.com/filmaapi/storage/12345?api_key=your_api_key"
```

### JavaScriptでの使用例

```javascript
// ファイル一覧取得
const listResponse = await fetch('/filmaapi/storage?api_key=your_api_key&page=1&per_page=20');
const listData = await listResponse.json();

console.log('総件数:', listData.pagination.total_count);
console.log('ファイル一覧:', listData.items);

// ファイル再生情報取得
const playerResponse = await fetch('/filmaapi/storage/12345?api_key=your_api_key');
const playerData = await playerResponse.json();

console.log('再生URL:', playerData.url);
console.log('埋め込みコード:', playerData.embed_code);

// フォルダ一覧取得
const foldersResponse = await fetch('/filmaapi/storage/folders?api_key=your_api_key');
const foldersData = await foldersResponse.json();

console.log('フォルダ一覧:', foldersData);

// フォルダ詳細取得
const folderResponse = await fetch('/filmaapi/storage/folders/100?api_key=your_api_key');
const folderData = await folderResponse.json();

console.log('フォルダ詳細:', folderData);
```

## 注意事項

- APIキーは各リクエストに必要です
- fullaccess権限が必要な操作は明記されています
- ページングは最大100件まで取得可能です
- エラーが発生した場合は適切なHTTPステータスコードが返されます
- 動画配信系APIはDRMが有効な場合の処理が含まれています
