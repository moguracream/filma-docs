# 使用例

### cURLでの使用例

#### サーバー用APIキー認証を使用した例

`readonly` / `fullaccess` のキーをサーバーから `X-Api-Key` ヘッダーで送信します。`show_all=true` や削除には `fullaccess` が必要です。`embedded` では以下の一般APIを呼び出せません。

Storage APIの `12345` はFilmaFile ID、Player・DASH・HLSの `12345` はMediafile IDです。それぞれ実際のIDに置き換えてください。

```bash
# ファイル一覧取得（1ページ目、10件ずつ、公開ファイルのみ）
curl -H "X-Api-Key: YOUR_READONLY_KEY" "https://filma.biz/filmaapi/storage?page=1&per_page=10"

# ファイル一覧取得（全ファイル表示 - fullaccess権限のみ）
curl -H "X-Api-Key: YOUR_FULLACCESS_KEY" "https://filma.biz/filmaapi/storage?page=1&per_page=10&show_all=true"

# ファイル再生情報取得（公開ファイルのみ）
curl -H "X-Api-Key: YOUR_READONLY_KEY" "https://filma.biz/filmaapi/storage/12345"

# ファイル再生情報取得（全ファイル表示 - fullaccess権限のみ）
curl -H "X-Api-Key: YOUR_FULLACCESS_KEY" "https://filma.biz/filmaapi/storage/12345?show_all=true"

# ファイルメタデータ取得（公開ファイルのみ）
curl -H "X-Api-Key: YOUR_READONLY_KEY" "https://filma.biz/filmaapi/storage/metadata/12345"

# ファイルメタデータ取得（全ファイル表示 - fullaccess権限のみ）
curl -H "X-Api-Key: YOUR_FULLACCESS_KEY" "https://filma.biz/filmaapi/storage/metadata/12345?show_all=true"

# フォルダ一覧取得
curl -H "X-Api-Key: YOUR_READONLY_KEY" "https://filma.biz/filmaapi/storage/folders"

# フォルダ詳細取得
curl -H "X-Api-Key: YOUR_READONLY_KEY" "https://filma.biz/filmaapi/storage/folders/100"

# ファイル削除
curl -H "X-Api-Key: YOUR_FULLACCESS_KEY" -X DELETE "https://filma.biz/filmaapi/storage/12345"

# プレイヤー表示（公開ファイルのみ - デフォルト）
curl -H "X-Api-Key: YOUR_READONLY_KEY" "https://filma.biz/filmaapi/player/12345"

# プレイヤー表示（全ファイル表示 - fullaccess権限のみ）
curl -H "X-Api-Key: YOUR_FULLACCESS_KEY" "https://filma.biz/filmaapi/player/12345?show_all=true"

# DASH配信（公開ファイルのみ）
curl -H "X-Api-Key: YOUR_READONLY_KEY" "https://filma.biz/filmaapi/dash/12345"

# DASH配信（全ファイル表示 - fullaccess権限のみ）
curl -H "X-Api-Key: YOUR_FULLACCESS_KEY" "https://filma.biz/filmaapi/dash/12345?show_all=true"
```

#### サーバー用キーから取得したJWTを使用する例

以下は `readonly` / `fullaccess` のJWT向けです。ブラウザに渡す場合は、最初のJWT取得処理をサーバー側で実行してください。

```bash
# 1. サーバー側で汎用JWTを取得（mediafile_idを省略）
curl -X POST "https://filma.biz/filmaapi/token" \
  -H "X-Api-Key: YOUR_READONLY_KEY" \
  -H "Content-Type: application/json"

# 2. 発行されたJWTトークンを使用してAPIアクセス（Authorization header）
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage?page=1&per_page=10"

# 2-2. または、取得したJWTをCookieに明示してアクセス
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

# 8. 有効期間内のトークンをリフレッシュ（embeddedは不可）
curl -X POST "https://filma.biz/filmaapi/token/refresh" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json"

# 9. トークン情報取得（embeddedは不可）
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/token"
```

#### 管理画面での自動JWT認証（Cookie）

```bash
curl -H "Cookie: filmajwt=eyJhbGciOiJIUzI1NiJ9..." \
  "https://filma.biz/filmaapi/storage"
```

#### embeddedキーで公開動画を再生する例

```bash
# 1. 公開動画のMediafile IDを指定して再生JWTを取得
curl -X POST "https://filma.biz/filmaapi/token?api_key=YOUR_EMBEDDED_KEY" \
  -d "mediafile_id=12345&playback_token=true"

# 2. 応答のtokenを使ってプレイヤーを取得
curl "https://filma.biz/filmaapi/player/12345?jwt=YOUR_PLAYBACK_JWT"
```

`embedded` では `expires_in`、`jwt_expires_at`、`show_all` を指定できません。JWTはCookieに設定されず、ファイル一覧・メタデータ取得やJWT更新にも使用できません。管理画面で生成される埋め込みHTMLは、対応するプレイヤーがキーをJWTへ交換します。APIキー付きの古いiframe URLを直接使う方式とは異なります。

### JavaScriptでの使用例

#### サーバー側でJWTを取得

以下はfetchを使えるサーバー環境向けです。`apiKey` にはサーバーで保管した `readonly` キーを渡し、取得したJWTを必要な利用者に返します。会員認証や視聴権の確認はアプリケーションの要件に合わせて行ってください。

```javascript
function getFilmaToken(apiKey) {
  return fetch('https://filma.biz/filmaapi/token', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey }
  }).then(response => {
    if (!response.ok) {
      throw new Error(`JWT取得に失敗しました: ${response.status}`);
    }
    return response.json(); // token、expires_atなどを返す
  });
}
```

#### ブラウザ側でJWTを使用

`showFiles` にアプリケーションのサーバーから受け取ったJWTを渡します。埋め込み用JWTでは一覧取得できません。

```javascript
function showFiles(token) {
  const apiBase = 'https://filma.biz/filmaapi';
  const headers = { Authorization: `Bearer ${token}` };

  function getJson(path) {
    return fetch(`${apiBase}${path}`, { headers }).then(response => {
      if (!response.ok) {
        throw new Error(`API呼び出しに失敗しました: ${response.status}`);
      }
      return response.json();
    });
  }

  return getJson('/storage?page=1&per_page=20').then(list => {
    console.log('総件数:', list.pagination.total_count);

    // 12345はFilmaFile ID、100はフォルダIDに置き換える
    return Promise.all([
      getJson('/storage/12345'),
      getJson('/storage/metadata/12345'),
      getJson('/storage/folders'),
      getJson('/storage/folders/100')
    ]);
  }).then(([player, metadata, folders, folder]) => {
    // player.urlには動画限定JWTが含まれる。既存のiframeに設定する例
    const frame = document.getElementById('filma-player');
    if (frame) {
      frame.src = player.url;
    }
    return { player, metadata, folders, folder };
  });
}
```

`<iframe id="filma-player" title="動画プレイヤー" allowfullscreen></iframe>` をページに配置すると、取得した再生URLを設定できます。iframeには認証ヘッダーを追加できないため、JWT付きURLを使用します。JWTも有効期間内は認証情報となるので、URLやトークンを不用意に共有・記録しないでください。

[JWTサンプル](https://docs.filma.biz/template-jwt/) は、動作確認のためにブラウザ内で `readonly` キーを使ってJWTを取得しています。通常の運用ではキーをサーバーに保管し、JWT取得処理をサーバーへ移してください。取得したJWTを使う一覧表示・再生処理は、その構成でも利用できます。

[動画埋め込みサンプル](https://docs.filma.biz/template-no-auth/) は埋め込みHTMLの使用例です。`template-no-auth` という公開URLは維持していますが、以前のAPI一覧取得コードは廃止しています。
