# エラーレスポンス

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

