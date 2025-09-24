# Filma API 仕様書

## 概要

Filma APIは動画ファイルの管理、配信、エンコーディングを行うためのRESTful APIです。

## ユーザーメタデータ

Filma APIでは、管理画面で入力されたカスタムメタデータを `user_metadata` フィールドとして取得できます。

### メタデータの構造

```json
// メタデータが設定されている場合
{
  "user_metadata": {
    "tags": ["製品紹介", "プロモーション", "2024年春"],
    "category": "マーケティング"
  }
}

// 一部のメタデータのみ設定されている場合
{
  "user_metadata": {
    "tags": ["企業紹介"],
    "category": null
  }
}

// メタデータが未設定の場合
{
  "user_metadata": {}
}
```

### 基本フィールド

- **`tags`**: タグの配列（未設定時は `null`）
- **`category`**: カテゴリ（未設定時は `null`）

### 未設定時の動作

- **`user_metadata` 自体が未設定の場合**: 空のオブジェクト `{}` を返す
- **`tags` が未設定の場合**: `null` を返す
- **`category` が未設定の場合**: `null` を返す

### 拡張性

`user_metadata` は管理画面で追加されたすべてのカスタムメタデータを自動的に含むため、将来的に新しいメタデータフィールドが追加されても、APIコードの変更なしに自動的に対応されます。

## 認証

すべてのAPIエンドポイントは認証が必要です。Filma APIはハイブリッド認証システムを採用しており、以下の認証方法をサポートしています。

### ハイブリッド認証システム

Filma APIは2つの認証方法を併用できます：

1. **APIキー認証** - APIキーベース認証（クエリパラメータまたはX-Api-Keyヘッダー）
2. **JWT認証** - JWTトークンベース認証（Bearer Token、Cookie、クエリパラメータ）

### 認証方法の優先順位

複数の認証情報が提供された場合、以下の優先順位で認証を試行します：

1. **APIキー認証（X-Api-Key header）**: `X-Api-Key: <api_key>`
2. **APIキー認証（query parameter）**: `?api_key=<api_key>`
3. **JWT認証（query parameter）**: `?jwt=<jwt_token>` （APIキーがない場合のみ）
4. **JWT認証（Authorization header）**: `Authorization: Bearer <jwt_token>` （APIキーがない場合のみ）
5. **JWT認証（Cookie）**: `filmajwt` Cookie （APIキーがない場合のみ）

**注意**: ブラウザのCookieに古いJWTトークンが残っていても、APIキーがあれば無視されます。期限切れJWTトークンによる認証エラーを防止するための仕様です。

**認証フロー**:
- APIキーが提供された場合：APIキー認証のみを試行（JWTトークンは無視）
- APIキーがない場合：JWT認証を試行（パラメータ → Authorization ヘッダー → Cookie の順）

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

JWTトークンベースの認証システムです。以下の3つの方法でJWTトークンを送信できます：

#### 1. Authorization ヘッダー（推奨）

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage"
```

#### 2. Cookie（自動管理）

```bash
curl -H "Cookie: filmajwt=eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage"
```

#### 3. クエリパラメータ（利便性のため）

```bash
curl "https://filma.biz/filmaapi/storage?jwt=eyJhbGciOiJIUzI1NiJ9..."
```

**注意**: パラメータでのJWT送信はURLに記録される可能性があるため、セキュリティの観点からAuthorizationヘッダーまたはCookieの使用を推奨します。

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

#### 認証方法別のドメインアクセス制限

1. **APIキー認証**
   - ユーザーの`api_access_domains`に基づいてドメインチェック
   - 設定されていない場合はFilma APIホストのみ許可
   - RefererまたはOriginヘッダーで制御

2. **JWT認証（Cookie・Bearer共通）**
   - **ドメインアクセス制限は適用されません**
   - どのドメインからでもアクセス可能
   - セキュリティはJWTトークン自体の有効性で担保

#### ドメイン制限の確認方法（APIキー認証のみ）

RefererまたはOriginヘッダーで制御されます：

```bash
# APIキー認証：許可されたドメインからのアクセス（成功）
curl -H "Referer: https://example.com/video.html" \
     "https://filma.biz/filmaapi/player/12345?api_key=YOUR_API_KEY"

# APIキー認証：許可されていないドメインからのアクセス（403エラー）
curl -H "Referer: https://unauthorized.com/video.html" \
     "https://filma.biz/filmaapi/player/12345?api_key=YOUR_API_KEY"

# JWT認証：どのドメインからでもアクセス可能
curl -H "Referer: https://any-domain.com/video.html" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "https://filma.biz/filmaapi/player/12345"
```

### JWTセキュリティ特徴

- **組織分離**: 組織ごとに異なるシークレットキー
- **自動期限切れ**: デフォルト1時間で無効化
- **ドメイン制限なし**: どのドメインからでもアクセス可能（セキュリティはトークン有効性で担保）
- **トークンリフレッシュ**: 有効なトークンから新しいトークンを発行可能
- **Cookie自動設定**: HTTPS環境でのJWTトークン発行時にCookieが自動設定される
- **CSRF保護**: SameSite=Lax設定により、外部サイトからのPOSTリクエストを自動的に保護

## JWT認証API

### JWTトークン発行 `POST /filmaapi/token`

APIキーを使用してJWTトークンを発行します。発行されたJWTトークンは、JSONレスポンスで返却されると同時に、HTTPS環境では自動的にCookieとしても設定されます。

#### パラメータ

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | ✓ | - | APIキー（X-Api-Keyヘッダーまたはクエリパラメータで指定） |
| expires_in | integer | - | 3600 | JWT有効期限（秒）。最大7日間（604800秒） |
| jwt_expires_at | string | - | - | JWT有効期限をISO 8601形式で指定（expires_inより優先） |
| mediafile_id | integer | - | - | 特定のメディアファイルに限定したJWT発行（セキュリティ強化） |

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

**メディアファイル固有JWT発行**
```bash
curl -X POST "https://filma.biz/filmaapi/token" \
  -H "X-Api-Key: e47aad55d7fb4f152603b91b" \
  -H "Content-Type: application/json" \
  -d '{"mediafile_id": 12345, "expires_in": 7200}'
```

#### レスポンス

**成功時（HTTP 200）**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MDQwMDcyMDAsImlhdCI6MTcwMzkyMDgwMCwibWVkaWFmaWxlX2lkIjoxMjM0NX0.signature",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": 1704007200,
  "user_id": 1,
  "organization_id": 1,
  "api_type": "readonly",
  "mediafile_id": 12345
}
```

**JWTペイロード構造**

発行されたJWTトークンには以下の情報が含まれます：

```json
{
  "user_id": 1,
  "api_type": "readonly",
  "auth_method": "api_key",
  "mediafile_id": 12345,
  "iat": 1703920800,
  "exp": 1704007200
}
```

| フィールド名 | 型 | 説明 |
|---|---|---|
| user_id | integer | ユーザーID |
| api_type | string | API権限レベル（readonly, fullaccess） |
| auth_method | string | 認証方法（api_key, session_login, jwt_refresh等） |
| mediafile_id | integer \| null | メディアファイル固有JWT時のファイルID。指定時はそのファイルのみアクセス可能 |
| iat | integer | トークン発行時刻（UnixTimestamp） |
| exp | integer | トークン有効期限（UnixTimestamp） |

**メディアファイル固有JWT**
- `mediafile_id`を指定してJWTを発行した場合、そのJWTは指定されたメディアファイルのみアクセス可能
- ストリーミングやプレイヤーアクセス時に、JWTのmediafile_idとリクエストされたファイルIDが一致しない場合は403エラー
- セキュリティ強化により不正なアクセスを防止

**JWTトークンCookie設定（HTTPS環境でのみ）**
```
Set-Cookie: filmajwt=eyJhbGciOiJIUzI1NiJ9...; Expires=Mon, 01 Jan 2024 12:00:00 GMT; Path=/; Secure; HttpOnly; SameSite=Lax
```

**Cookieの特徴**
- **自動設定**: JWTトークン発行時にHTTPS環境で自動的にCookieが設定される
- **セキュリティ**: `HttpOnly`でJavaScriptからのアクセスを防止
- **SameSite=Lax**: 外部サイトからのGETリクエストを許可、POSTリクエストを保護
- **期限**: JWTトークンと同じ有効期限
- **利便性**: 次回以降のAPIアクセスでCookie認証が利用可能

**SameSite=Laxの動作**
- **同一サイト**: 全てのリクエストでCookieが送信される
- **外部サイト（GET）**: 動画プレイヤーや埋め込みコンテンツでCookieが送信される
- **外部サイト（POST）**: CSRF攻撃を防止するため、Cookieは送信されない
- **スクリプトからのアクセス**: curl、Python、Node.js等では制限なし

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
- APIキー認証でアクセス許可ドメインが設定されていない
- APIキー認証で現在のドメインが許可リストに含まれていない
- （注：JWT認証ではドメイン制限は適用されません）

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
| 403 | 権限エラー（fullaccess権限が必要な操作、またはAPIキー認証でのドメインアクセス拒否） |
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

### パラメーター表記について

各エンドポイントのパラメーターテーブルで使用される記号の意味：

| 記号 | 意味 | 説明 |
|---|---|---|
| ✓ | 必須 | 必ず指定が必要なパラメーター |
| * | 認証必須 | 認証のため必要だが、複数の認証方法のうちいずれか1つを指定 |
| - | 任意 | 省略可能なパラメーター |

**認証パラメーターについて:**
- `api_key`と`jwt`は両方とも「*」（認証必須）ですが、**どちらか一方のみ**指定すれば認証されます
- 両方を同時に指定した場合は、[認証方法の優先順位](#認証方法の優先順位)に従って処理されます
- 認証ヘッダーまたはCookieを使用する場合は、対応するクエリパラメーターは不要です：
  - `Authorization: Bearer`ヘッダー使用時 → `jwt`パラメーター不要
  - `X-Api-Key`ヘッダー使用時 → `api_key`パラメーター不要
  - `filmajwt` Cookie使用時 → `jwt`パラメーター不要

### Storage API

ファイルの管理と配信を行います。

#### 共通パラメータ

**jwt_expires_at パラメータについて:**

`jwt_expires_at`パラメータは、API応答で返されるプレイヤーURLや埋め込みコードに使用されるJWTトークンの有効期限を指定するためのパラメータです。

| 項目 | 説明 |
|---|---|
| **形式** | ISO 8601形式の日時文字列（例：`2024-12-31T23:59:59Z`） |
| **目的** | 生成されるJWTトークンの有効期限を制御 |
| **デフォルト値** | 未指定時は現在時刻+1時間 |
| **使用場面** | プレイヤーURL、埋め込みコード生成時 |

**使用例:**

```bash
# 2024年12月31日 23:59:59 UTC まで有効なJWTを含むプレイヤーURLを生成
curl -H "X-Api-Key: your_api_key" \
  "https://filma.biz/filmaapi/storage/12345?jwt_expires_at=2024-12-31T23:59:59Z"
```

**動作:**
- 指定された日時まで有効なJWTトークンが自動生成される
- 生成されたJWTは該当メディアファイル専用（mediafile_id付き）
- プレイヤーURLと埋め込みコードに含まれるすべてのJWTトークンに適用
- 無効な日時形式の場合は400エラー

**注意事項:**
- 過去の日時を指定した場合、即座に期限切れとなる
- 最大有効期限は7日間（システム制限）
- JWTトークンの有効期限はストリーミング再生時間を考慮して設定することを推奨

#### ファイル一覧取得

```
GET /filmaapi/storage
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| page | integer | - | 1 | ページ番号 |
| per_page | integer | - | 20 | 1ページあたりの件数（最大100） |
| folder_id | integer | - | - | フォルダID（指定時は該当フォルダのファイルのみ取得） |
| tags | string \| array | - | - | タグフィルタリング（指定時は該当タグを含むファイルのみ取得） |
| category | string | - | - | カテゴリフィルタリング（指定時は該当カテゴリのファイルのみ取得） |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**注意:**
- デフォルトでは公開されたファイルのみ取得
- `show_all=true`かつfullaccess権限の場合、非公開ファイルも含めて全ファイル取得

**フィルタリング機能:**
- **タグフィルタリング**: `tags`パラメータで指定されたタグのいずれかを含むファイルを取得
  - 単一タグ: `?tags=製品紹介`
  - 複数タグ: `?tags[]=製品紹介&tags[]=プロモーション`
- **カテゴリフィルタリング**: `category`パラメータで指定されたカテゴリのファイルを取得
  - 例: `?category=マーケティング`
- **複合フィルタリング**: タグとカテゴリを組み合わせてフィルタリング可能
  - 例: `?tags=製品紹介&category=マーケティング`

**レスポンス例:**

```json
{
  "items": [
    {
      "id": 12345,
      "filename": "sample_video.mp4",
      "mediafile_id": 12345,
      "folder_id": 100,
      "folder_name": "動画フォルダ",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z",
      "creator": "山田太郎",
      "updater": "山田太郎",
      "published": true,
      "published_until": "2024-12-31T23:59:00Z",
      "published_with_expiry": true,
      "published_status_text": "公開（2024/12/31 23:59まで）",
      "screen_shots": [
        "https://example.com/storage/screenshot1.jpg",
        "https://example.com/storage/screenshot2.jpg",
        "https://example.com/storage/screenshot3.jpg"
      ],
      "user_metadata": {
        "tags": ["製品紹介", "プロモーション", "2024年春"],
        "category": "マーケティング"
      }
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
| items[].mediafile_id | integer | メディアファイルID（プレイヤーやストリーミングで使用） |
| items[].folder_id | integer | 所属フォルダのID |
| items[].folder_name | string | 所属フォルダの名前 |
| items[].created_at | string | ファイル作成日時（ISO 8601形式） |
| items[].updated_at | string | ファイル更新日時（ISO 8601形式） |
| items[].creator | string | ファイル作成者名 |
| items[].updater | string | ファイル更新者名 |
| items[].published | boolean | 公開状態（true: 公開設定, false: 非公開設定） |
| items[].published_until | string \| null | 公開期限（ISO 8601形式、nullの場合は期限なし） |
| items[].published_with_expiry | boolean | 公開期限を考慮した実際の公開状態 |
| items[].published_status_text | string | 公開状態の表示文字列（「公開」「公開（期限付き）」「公開期限切れ」「非公開」） |
| items[].screen_shots | array | スクリーンショット画像のURL配列 |
| items[].user_metadata | object | 管理画面で入力されたカスタムメタデータ（未設定時は空オブジェクト `{}`） |
| items[].user_metadata.tags | array \| null | タグの配列（未設定時は `null`） |
| items[].user_metadata.category | string \| null | カテゴリ（未設定時は `null`） |
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

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| id | integer | ✓ | - | ファイルID |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |
| jwt_expires_at | string | - | 現在時刻+1時間 | 生成されるJWTトークンの有効期限をISO 8601形式で指定 |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**注意:**
- デフォルトでは公開されたファイルのみアクセス可能
- `show_all=true`かつfullaccess権限の場合、非公開ファイルもアクセス可能

**レスポンス例:**

```json
{
  "url": "https://example.com/filmaapi/player/12345?jwt=eyJhbGciOiJIUzI1NiJ9...",
  "embed_code": "<script src=\"https://example.com/dash_player/js/xcream_player.min.js\"></script>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"https://example.com/dash_player/css/style.css\">\n<div id=\"video-12345\" class=\"filma-video\" data-drm=\"true\" style=\"width: 100%;\"></div>\n<script>\n  document.addEventListener('DOMContentLoaded', function() {\n    let elem = document.getElementById('video-12345');\n    if (elem == null) {\n      return;\n    }\n    if (isSafari()) {\n      elem.dataset.src = 'https://example.com/filmaapi/hls/12345.m3u8?jwt=eyJhbGciOiJIUzI1NiJ9...';\n    } else {\n      elem.dataset.src = 'https://example.com/filmaapi/dash/12345.mpd?jwt=eyJhbGciOiJIUzI1NiJ9...';\n    }\n    init_xcream_player('video-12345');\n  });\n</script>",
  "simple_embed_code": "<div id=\"video-12345\" class=\"filma-video\" data-drm=\"true\" style=\"width: 100%;\"></div>",
  "mediafile_id": 12345,
  "screen_shots": [
    "https://example.com/storage/screenshot1.jpg",
    "https://example.com/storage/screenshot2.jpg",
    "https://example.com/storage/screenshot3.jpg"
  ],
  "user_metadata": {
    "tags": ["製品紹介", "プロモーション", "2024年春"],
    "category": "マーケティング"
  }
}
```

**レスポンスフィールド詳細:**

| フィールド名 | 型 | 説明 |
|---|---|---|
| url | string | プレイヤーページのURL（JWTトークン付き） |
| embed_code | string | 完全なHTMLプレイヤー埋め込みコード（JS/CSS込み） |
| simple_embed_code | string | シンプルなHTML埋め込みコード（JS/CSSは別途読み込みが必要） |
| mediafile_id | integer | エンコード済みファイルの識別子 |
| screen_shots | array | スクリーンショット画像のURL配列 |
| user_metadata | object | 管理画面で入力されたカスタムメタデータ（未設定時は空オブジェクト `{}`） |
| user_metadata.tags | array \| null | タグの配列（未設定時は `null`） |
| user_metadata.category | string \| null | カテゴリ（未設定時は `null`） |
**補足:**

**完全な埋め込みコード（embed_code）**: スクリプトとCSSが含まれているため、そのままページに貼り付けるだけで動作します。

**シンプルな埋め込みコード（simple_embed_code）**: HTMLの`<div>`要素のみです。以下のJavaScriptとCSSを別途HTMLに読み込む必要があります：

```html
<script src="https://filma.biz/dash_player/js/xcream_player.min.js"></script>
<link rel="stylesheet" type="text/css" href="https://filma.biz/dash_player/css/style.css">
<script>
  // 初期化処理
  document.addEventListener('DOMContentLoaded', function() {
    init_xcream_player('video-12345'); // video-{mediafile_id}を指定
  });
</script>
```

**JWT認証について**: 生成されるプレイヤーURLと埋め込みコードには、リクエストした時点でのユーザー権限に基づいた専用JWTトークンが含まれます。このJWTは該当メディアファイルのみアクセス可能で、セキュリティが強化されています。

#### ファイルメタデータ取得

```
GET /filmaapi/storage/metadata/{id}
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| id | integer | ✓ | - | ファイルID |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |
| jwt_expires_at | string | - | 現在時刻+1時間 | 生成されるJWTトークンの有効期限をISO 8601形式で指定 |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**注意:**
- デフォルトでは公開されたファイルのみアクセス可能
- `show_all=true`かつfullaccess権限の場合、非公開ファイルもアクセス可能

**レスポンス例:**

```json
{
  "id": 12345,
  "mediafile_id": 12345,
  "name": "sample_video.mp4",
  "folder_id": 100,
  "folder_name": "動画フォルダ",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z",
  "creator": "山田太郎",
  "updater": "山田太郎",
  "published": true,
  "published_until": "2024-12-31T23:59:00Z",
  "published_with_expiry": true,
  "published_status_text": "公開（2024/12/31 23:59まで）",
  "screen_shots": [
    "https://example.com/storage/screenshot1.jpg",
    "https://example.com/storage/screenshot2.jpg",
    "https://example.com/storage/screenshot3.jpg"
  ],
  "user_metadata": {
    "tags": ["製品紹介", "プロモーション", "2024年春"],
    "category": "マーケティング"
  },
  "player_data": [
     {
       "mediafile_id": 67890,
       "resolution_string": "HD 1280x720",
       "filesize_megabyte": 150.5,
       "bitrate_human": "2.5 Mbps",
       "player_url": "https://example.com/filmaapi/player/67890?jwt=eyJhbGciOiJIUzI1NiJ9...",
       "player_embedding_html": "<script src=\"https://example.com/dash_player/js/xcream_player.min.js\"></script>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"https://example.com/dash_player/css/style.css\">\n<div id=\"video-67890\" class=\"filma-video\" data-drm=\"true\" style=\"width: 100%;\"></div>\n<script>\n  document.addEventListener('DOMContentLoaded', function() {\n    let elem = document.getElementById('video-67890');\n    if (elem == null) {\n      return;\n    }\n    if (isSafari()) {\n      elem.dataset.src = 'https://example.com/filmaapi/hls/67890.m3u8?jwt=eyJhbGciOiJIUzI1NiJ9...';\n    } else {\n      elem.dataset.src = 'https://example.com/filmaapi/dash/67890.mpd?jwt=eyJhbGciOiJIUzI1NiJ9...';\n    }\n    init_xcream_player('video-67890');\n  });\n</script>",
       "player_embedding_html_simple": "<div id=\"video-67890\" class=\"filma-video\" data-drm=\"true\" style=\"width: 100%;\"></div>",
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
| mediafile_id | integer | メディアファイルID（プレイヤーやストリーミングで使用） |
| name | string | ファイル名 |
| folder_id | integer | 所属フォルダのID |
| folder_name | string | 所属フォルダの名前 |
| created_at | string | ファイル作成日時（ISO 8601形式） |
| updated_at | string | ファイル更新日時（ISO 8601形式） |
| creator | string | ファイル作成者名 |
| updater | string | ファイル更新者名 |
| published | boolean | 公開状態（true: 公開設定, false: 非公開設定） |
| published_until | string \| null | 公開期限（ISO 8601形式、nullの場合は期限なし） |
| published_with_expiry | boolean | 公開期限を考慮した実際の公開状態 |
| published_status_text | string | 公開状態の表示文字列（「公開」「公開（期限付き）」「公開期限切れ」「非公開」） |
| screen_shots | array | ファイル全体のスクリーンショット画像URL配列 |
| user_metadata | object | 管理画面で入力されたカスタムメタデータ（未設定時は空オブジェクト `{}`） |
| user_metadata.tags | array \| null | タグの配列（未設定時は `null`） |
| user_metadata.category | string \| null | カテゴリ（未設定時は `null`） |
| player_data | array | エンコード済みファイル（解像度別）の情報配列 |
| player_data[].mediafile_id | integer | エンコード済みファイルのメディアファイルID |
| player_data[].resolution_string | string | 解像度の表示文字列（例：「HD 1280x720」） |
| player_data[].filesize_megabyte | number | ファイルサイズ（MB） |
| player_data[].bitrate_human | string | ビットレートの人間が読める形式（例：「2.5 Mbps」） |
| player_data[].player_url | string | 該当解像度ファイルのプレイヤーページURL（JWTトークン付き） |
| player_data[].player_embedding_html | string | 該当解像度ファイル用の完全な埋め込みHTMLコード（JS/CSS込み） |
| player_data[].player_embedding_html_simple | string | 該当解像度ファイル用のシンプルな埋め込みHTMLコード（JS/CSSは別途読み込みが必要） |
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

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**レスポンス:**
```json
[]
```

*注: 現在は空の配列を返します。*

#### メタデータオプション取得

```
GET /filmaapi/storage/metadata_options
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

**注意:**
- デフォルトでは公開されたファイルのみ対象
- `show_all=true`かつfullaccess権限の場合、非公開ファイルも含めて全ファイル対象
- メタデータが設定されているファイルのみを対象として集計

**レスポンス例:**

```json
{
  "total_files_with_metadata": 25,
  "metadata_keys": {
    "tags": {
      "count": 15,
      "unique_values": ["製品紹介", "プロモーション", "企業紹介", "2024年春", "マーケティング"],
      "total_unique_values": 5
    },
    "category": {
      "count": 12,
      "unique_values": ["マーケティング", "教育", "エンターテイメント", "技術"],
      "total_unique_values": 4
    },
    "priority": {
      "count": 8,
      "unique_values": ["高", "中", "低"],
      "total_unique_values": 3
    },
    "department": {
      "count": 6,
      "unique_values": ["営業部", "マーケティング部", "開発部"],
      "total_unique_values": 3
    }
  }
}
```

**レスポンスフィールド詳細:**

| フィールド名 | 型 | 説明 |
|---|---|---|
| total_files_with_metadata | integer | メタデータが設定されているファイルの総数 |
| metadata_keys | object | 動的に収集されたメタデータキーの詳細情報 |
| metadata_keys.{key} | object | 各メタデータキーの詳細情報 |
| metadata_keys.{key}.count | integer | そのキーが使用されているファイル数 |
| metadata_keys.{key}.unique_values | array | そのキーのユニークな値の配列（アルファベット順） |
| metadata_keys.{key}.total_unique_values | integer | そのキーのユニークな値の総数 |

#### フォルダ一覧取得

```
GET /filmaapi/storage/folders
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |

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

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| id | integer | ✓ | - | フォルダID |

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

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |

*注: 現在未実装です。*

#### ファイル削除

```
DELETE /filmaapi/storage/{id}
```

**権限:** fullaccess権限が必要

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| id | integer | ✓ | - | ファイルID |

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

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| id | integer | ✓ | - | エンコードファイルID |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |

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
GET /filmaapi/dash/{id}.mpd
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| id | integer | ✓ | - | エンコードファイルID |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |

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
GET /filmaapi/hls/{id}.m3u8
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| id | integer | ✓ | - | エンコードファイルID |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

#### HLSメディア配信

```
GET /filmaapi/hls/media/{id}.m3u8
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| id | integer | ✓ | - | エンコードファイルID |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |

**認証:** APIキー認証、JWT認証、またはCookie認証のいずれか

#### HLSヘッダー取得

```
HEAD /filmaapi/hls/{id}.m3u8
```

**パラメータ:**

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| api_key | string | * | - | APIキー（JWT認証時は不要） |
| jwt | string | * | - | JWTトークン（APIキー認証時は不要） |
| id | integer | ✓ | - | エンコードファイルID |
| show_all | boolean | - | false | 全ファイル表示フラグ（fullaccess権限のみ有効） |

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
   - **公開期限も考慮**: 公開期限が設定されている場合、現在時刻が期限内のファイルのみアクセス可能

### 公開期限機能

- **published_until**: ファイルの公開期限を設定可能（null = 期限なし）
- **published_with_expiry**: 公開期限を考慮した実際の公開状態を返す
- **published_status_text**: 公開状態の表示文字列を返す
  - 「公開」: 期限なしで公開中
  - 「公開（2024/12/31 23:59まで）」: 期限付きで公開中
  - 「公開期限切れ」: 公開設定だが期限切れ
  - 「非公開」: 非公開設定

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
| 公開期限機能 | ✅ 実装済み |
| CORS対応 | ✅ 実装済み |
| ドメインアクセス制限 | ✅ 実装済み |
| 共通エラーハンドリング | ✅ 実装済み |
| **JWT認証システム** | **✅ 実装済み** |
| JWTトークン発行 | ✅ 実装済み |
| JWTトークンリフレッシュ | ✅ 実装済み |
| JWT Cookie自動管理 | ✅ 実装済み |
| ハイブリッド認証（APIキー+JWT） | ✅ 実装済み |
| JWT認証でのドメイン制限なし | ✅ 実装済み |
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
# 1. APIキーでJWTトークンを発行（JWTトークンは自動的にCookieとしても設定される）
curl -X POST "https://filma.biz/filmaapi/token" \
  -H "X-Api-Key: your_api_key" \
  -H "Content-Type: application/json"

# 2. 発行されたJWTトークンを使用してAPIアクセス（Authorization header）
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage?page=1&per_page=10"

# 2-2. または、自動設定されたCookieを使用してアクセス
curl -H "Cookie: filmajwt=eyJhbGciOiJIUzI1NiJ9..." \
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
curl -H "Cookie: filmajwt=eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage"
```

### JavaScriptでの使用例

```javascript
// 1. APIキーでJWTトークンを発行（ブラウザ環境では自動的にCookieが設定される）
const tokenResponse = await fetch('/filmaapi/token', {
  method: 'POST',
  headers: {
    'X-Api-Key': 'your_api_key',
    'Content-Type': 'application/json'
  }
});
const tokenData = await tokenResponse.json();
console.log('発行されたJWTトークン:', tokenData.token);

// 2. JWTトークンを使ってAPIアクセス（Cookie認証 - 自動的に送信される）
const listResponse = await fetch('/filmaapi/storage?page=1&per_page=20', {
  credentials: 'include'  // Cookieを含めて送信
});
const listData = await listResponse.json();

// 3. または、Authorization headerを使用
const listResponseWithHeader = await fetch('/filmaapi/storage?page=1&per_page=20', {
  headers: {
    'Authorization': `Bearer ${tokenData.token}`
  }
});
const listDataWithHeader = await listResponseWithHeader.json();

console.log('総件数:', listData.pagination.total_count);
console.log('ファイル一覧:', listData.items);
// 各ファイルのスクリーンショットを表示
listData.items.forEach(file => {
  console.log(`ファイル ${file.filename} のスクリーンショット:`, file.screen_shots);
  console.log(`公開状態: ${file.published_status_text}`);
  if (file.published_until) {
    console.log(`公開期限: ${file.published_until}`);
  }
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
console.log('公開状態:', metadataData.published_status_text);
console.log('公開期限考慮後の公開状態:', metadataData.published_with_expiry);

console.log('全ファイルメタデータ:', allMetadataData);
console.log('全ファイルスクリーンショット:', allMetadataData.screen_shots);
console.log('全ファイルプレイヤーデータ:', allMetadataData.player_data);
console.log('全ファイル公開状態:', allMetadataData.published_status_text);

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

- APIキー認証またはJWT認証が各リクエストに必要です
- JWT認証は2つの方法（Authorization header、Cookie）で利用可能です
- 管理画面にログインすると、JWTトークンが自動でCookieに設定されます
- fullaccess権限が必要な操作は明記されています
- ページングは最大100件まで取得可能です
- エラーが発生した場合は適切なHTTPステータスコードが返されます
- ドメインアクセス制限はAPIキー認証のみに適用され、JWT認証では制限されません

