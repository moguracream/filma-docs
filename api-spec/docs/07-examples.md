# 使用例

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

