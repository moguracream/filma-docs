# エラーレスポンス

### HTTPステータスコード

| HTTPステータス | 説明 |
|---|---|
| 400 | パラメータ不正（embeddedでの必須ID未指定・禁止パラメータ指定など） |
| 401 | 認証エラー（APIキー/JWTトークンが無効または未指定） |
| 403 | 権限エラー（キー・JWTの用途制限、URL認証の禁止、IP・ドメイン制限、fullaccess権限不足など） |
| 404 | リソースが見つからない |
| 500 | サーバー内部エラー |

### APIキー・埋め込みJWTの制限エラー

JSONの `error` に以下のコードが返されます。

| HTTP | error | 原因と対処 |
|---|---|---|
| 400 | `mediafile_id_required` | embeddedのJWT発行に正の整数のMediafile IDが必要です。FilmaFile IDとは区別してください |
| 400 | `embedded_token_parameter_not_allowed` | embeddedで `expires_in`、`jwt_expires_at`、`show_all` を指定しています。falseなどの値でも拒否されるため、パラメータ自体を削除してください |
| 403 | `api_key_query_auth_disabled` | サーバー用キーのURL認証が許可されていません。`X-Api-Key` ヘッダーへ変更してください |
| 403 | `api_key_ip_access_denied` | サーバー用キーの許可IP範囲外です。接続元不明・保存された許可リストの不正も含みます |
| 403 | `embedded_key_token_only` | embeddedキーは `POST /filmaapi/token` のみ利用できます。再生には取得したJWTを使用してください |
| 403 | `embedded_token_playback_only` | embeddedのJWTで一般API・ダウンロード・トークン情報取得・再発行・更新を呼び出しています |
| 403 | `invalid_embedded_token` | embeddedに必要な用途・組織・動画IDなどの条件を満たしていません。種類変更前のJWTではなく、embeddedキーで再取得してください |
| 403 | `embedded_key_disabled` | embeddedのキーに対応するユーザーまたは組織が無効です。管理画面で状態を確認してください |

`api_key_query_auth_disabled` と `api_key_ip_access_denied` は、有効なJWTを同時に渡しても回避できません。詳細は [認証](02-authentication.md) を参照してください。

レスポンス例:

```json
{
  "error": "api_key_query_auth_disabled",
  "message": "Use the X-Api-Key header for this API key"
}
```

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

期限切れのJWTは `POST /filmaapi/token/refresh` では更新できません。`readonly` / `fullaccess` ではサーバー側でAPIキーを使って再取得してください。embeddedの再生JWTは有効期間内でもリフレッシュできず、再取得にはembeddedキーと `mediafile_id` が必要です。
