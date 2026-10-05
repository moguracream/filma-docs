# 認証

すべてのAPIエンドポイントは認証が必要です。Filma APIはハイブリッド認証システムを採用しており、以下の認証方法をサポートしています。

### ハイブリッド認証システム

Filma APIは2つの認証方法を併用できます：

1. **APIキー認証** - `X-Api-Key`ヘッダー（クエリパラメータはキーの種類・互換設定による制限あり）
2. **JWT認証** - JWTトークンベース認証（Bearer Token、Cookie、クエリパラメータ）

### 認証方法の優先順位

複数の認証情報が提供された場合、以下の優先順位で認証を試行します：

1. **APIキー認証（X-Api-Key header）**: `X-Api-Key: <api_key>`
2. **APIキー認証（query parameter）**: `?api_key=<api_key>`
3. **JWT認証（query parameter）**: `?jwt=<jwt_token>` （APIキー認証が成立しない場合）
4. **JWT認証（Authorization header）**: `Authorization: Bearer <jwt_token>` （APIキー認証が成立しない場合）
5. **JWT認証（Cookie）**: `filmajwt` Cookie （APIキー認証が成立しない場合）

**注意**: 有効なAPIキーで認証できた場合は、ブラウザのCookieに古いJWTが残っていてもAPIキーを採用します。

**認証フロー**:

- APIキー認証に成功した場合：そのキーにドメイン・URL認証・IP・用途の制限を適用。制限で拒否されてもJWT認証には切り替わりません
- APIキーがない、または無効な場合：JWT認証を試行（トークンの選択順はパラメータ → Authorization ヘッダー → Cookie）

### APIキー認証

`readonly` / `fullaccess` はサーバーに保管して利用するキーです。ブラウザで一覧取得や再生を行う場合は、サーバーでこのキーを使ってJWTを取得し、ブラウザへ渡します。ページ埋め込み用の `embedded` は、公開動画の再生JWT取得に用途を限定したキーです。

#### 1. X-Api-Keyヘッダー（推奨）

以下は `readonly` / `fullaccess` による一覧取得の例です。`embedded` では一覧を取得できません。

```bash
curl -H "X-Api-Key: YOUR_READONLY_KEY" \
  "https://filma.biz/filmaapi/storage"
```

#### 2. クエリパラメータ

`readonly` / `fullaccess` では、移行対象として指定された例外組織に限り、キーの互換設定 `legacy_query_auth_enabled=true` の場合だけ利用できます。それ以外の組織は常に禁止です。新規キーの既定値は `false` です。

`embedded` は `POST /filmaapi/token` に限り `?api_key=YOUR_EMBEDDED_KEY` を使用できます。APIキーを付けたプレイヤーURLへの直接アクセスはできません。

### JWT認証

JWTは以下の3つの方法で送信できます。以下の一覧取得例は `readonly` / `fullaccess` のJWT向けです。`embedded` のJWTは再生・配信・DRMにのみ利用できます。

#### 1. Authorization ヘッダー（推奨）

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage"
```

#### 2. Cookie

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

`readonly` / `fullaccess` のキーで、一覧取得などに利用するJWTを発行します。`mediafile_id` を省略すると、特定の動画に限定しないJWTになります。

##### X-Api-Keyヘッダーを使用（推奨）

```bash
curl -X POST "https://filma.biz/filmaapi/token" \
  -H "X-Api-Key: YOUR_READONLY_KEY" \
  -H "Content-Type: application/json"
```

**レスポンス例:**
```json
{
  "token": "JWT_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": 1790899200,
  "user_id": 1,
  "organization_id": 1,
  "api_type": "readonly",
  "auth_method": "api_key",
  "mediafile_id": null,
  "filma_signed_url_id": null
}
```

#### embeddedキーで再生JWTを発行

同じ組織の公開中の動画の `mediafile_id`（Mediafile ID）を指定します。Storage APIのファイルID（FilmaFile ID）とは異なります。

```bash
curl -X POST "https://filma.biz/filmaapi/token?api_key=YOUR_EMBEDDED_KEY" \
  -d "mediafile_id=12345&playback_token=true"
```

返された `token` を `Authorization: Bearer` ヘッダー、またはプレイヤーURLの `jwt` に渡します。Cookieは設定されません。`expires_in`、`jwt_expires_at`、`show_all` は値にかかわらず指定できません。有効期間などの詳細は [JWTトークン発行](04-endpoints.md) を参照してください。

### 権限レベル

- **embedded**: 新規キーのデフォルト。ページ埋め込み専用で、APIキーで許可するのは `POST /filmaapi/token` による公開動画の短期再生JWT発行だけです。`mediafile_id` が必須で、`expires_in`、`jwt_expires_at`、`show_all` は指定できません。
- **readonly**: 読み取り専用権限
- **fullaccess**: 読み取り・書き込み権限

`embedded` のJWTは `api_type: embedded`、`auth_method: embed_key`、`scope: playback`、`organization_id`、`mediafile_id`、`exp` を持ちます。プレイヤー表示・DASH・HLS・DRMにのみ使用でき、storage・会員・視聴権・ダウンロード・JWT発行／更新APIには使用できません。配信処理でも元のJWTと期限を維持します。

既存キーを `embedded` に変更した場合、変更前のJWTも利用できなくなります。現在のプレイヤーは埋め込みHTML中の `api_key` をJWTに交換しますが、古いプレイヤーによるAPIキーの直接再生は拒否されます。変更前にFilma運営へ、APIキーの利用経路と変更による影響の確認を依頼してください。

`readonly`／`fullaccess` は秘密キーとしてサーバーに保管し、`X-Api-Key` ヘッダーを使用します。「API設定編集」の「URLパラメーター認証」選択欄は例外対象の組織にだけ表示され、移行中の既存連携について一時的に許可できます。

- `legacy_query_auth_enabled=false`（新規キーの既定値）: URLの `api_key` での認証はHTTP 403・`api_key_query_auth_disabled` で拒否します。有効なJWTを同時に渡しても、この拒否は回避できません。
- `true`: 例外対象の組織の既存連携だけ許可します。URLはWebサーバー等のログに残るため、`X-Api-Key` への移行後は必ず `false` にしてください。
- 例外対象外の組織は、DB値や送信パラメーターが `true` でもURL認証を許可しません。選択欄を表示せず、API設定保存時も `false` にします。
- APIキーをヘッダーとURLの両方へ指定した場合は、従来どおりヘッダーを採用します。URLへの重複記載は避けてください。
- `embedded` のJWT発行と、JWT自体のURLパラメーター送信はこの設定の対象外です。

### IP／CIDR制限

`readonly` / `fullaccess` では、管理画面の「アクセス許可IP／CIDR」にIPv4／IPv6のIPアドレスまたはCIDRを1行1件で指定できます。空欄は制限なしです。

- JWT発行を含むすべてのAPIキー認証で照合し、どの範囲にも一致しない要求はHTTP 403・`api_key_ip_access_denied` で拒否します。接続元を確定できない場合や、DB内の許可リストが不正な場合も拒否します。
- ヘッダー・URLパラメーターのどちらのAPIキーでも適用します。Referer / Origin の有無による例外はありません。有効なAPIキーが範囲外の場合、同時に有効なJWTを渡しても拒否します。
- `embedded` とJWT認証（Bearer・Cookie・URL）は対象外です。許可されたサーバーが発行したJWTは、別IPのブラウザでも利用できます。
- 接続元は直接接続の `REMOTE_ADDR` だけを採用します。`X-Forwarded-For` 等の転送ヘッダーは参照せず、追加の環境変数設定も不要です。API監査ログの送信元IP識別子も同じ判定を使用します。

### 公開状態による制限

ファイルには公開状態（published）が設定されており、APIキーの権限に応じてアクセス制限が適用されます。

#### アクセス制御ルール

| 権限 | デフォルト | show_all=true指定時 |
|---|---|---|
| readonly | 公開ファイルのみ | 公開ファイルのみ（パラメータ無視） |
| fullaccess | 公開ファイルのみ | 全ファイル（公開・非公開問わず） |
| embedded | 対象動画の再生のみ（一般APIは拒否） | 非公開動画は許可しない（JWT発行時はパラメーター指定を拒否） |

**show_allパラメータ:**

- `show_all=true`: fullaccess権限の場合のみ、非公開ファイルも含めて全てのファイルにアクセス可能
- 未指定またはfalse: 権限に関係なく公開ファイルのみアクセス可能

### ドメインアクセス制限

#### 認証方法別のドメインアクセス制限

1. **APIキー認証**
   - ユーザーの`api_access_domains`に基づいてドメインチェック
   - 設定が空の場合でもFilma APIホストと固定許可ホストからのアクセスは許可
   - RefererまたはOriginヘッダーで制御
   - 両ヘッダーがない要求は許可されるため、ドメイン制限は認証の代わりにはなりません

2. **JWT認証（Cookie・Bearer・クエリ共通）**
   - **ドメインアクセス制限は適用されません**
   - どのドメインからでもアクセス可能
   - セキュリティはJWTトークン自体の有効性で担保

#### ドメイン制限の確認方法（APIキー認証のみ）

RefererまたはOriginヘッダーで制御されます：

```bash
# APIキー認証：許可されたドメインからのアクセス（成功）
curl -H "Referer: https://example.com/video.html" \
     -H "X-Api-Key: YOUR_READONLY_KEY" \
     "https://filma.biz/filmaapi/storage"

# APIキー認証：許可されていないドメインからのアクセス（403エラー）
curl -H "Referer: https://unauthorized.com/video.html" \
     -H "X-Api-Key: YOUR_READONLY_KEY" \
     "https://filma.biz/filmaapi/storage"

# JWT認証：どのドメインからでもアクセス可能
curl -H "Referer: https://any-domain.com/video.html" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "https://filma.biz/filmaapi/player/12345"
```

ローカルHTTPサーバーからAPIキーで動作確認する場合も、この制限が適用されます。`localhost` や `127.0.0.1` など実際に使うホストをアクセス許可ドメインに登録してください。サーバー用キーにIP制限があれば、送信元IPも許可されている必要があります。

### JWTセキュリティ特徴

- **組織分離**: 組織ごとに異なるシークレットキー
- **自動期限切れ**: 通常はデフォルト1時間。embeddedの再生JWTは動画の長さに応じてサーバーが決定
- **ドメイン制限なし**: どのドメインからでもアクセス可能（セキュリティはトークン有効性で担保）
- **トークンリフレッシュ**: 有効なトークンから新しいトークンを発行可能（embeddedは対象外）
- **Cookie設定**: 通常のJWT発行ではHTTPS応答に `HttpOnly; Secure; SameSite=Lax` のCookieを設定（embeddedはJSON応答のみ）。ブラウザからの保存・送信にはCookieポリシーやfetchの設定が適用されるため、外部サイトの埋め込みではJWTを明示的に渡してください
