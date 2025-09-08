# JWT 認証付きサンプル

このフォルダには Filma API を JWT 認証で利用する簡単な例を収めています。`jwt_token.js` ではデモのためにブラウザ上で API キーから JWT を取得していますが、実際の運用ではセキュリティを確保するため、 API キーは可能な限り公開せずサーバー側で JWT を発行することをおすすめします。

- `index.html` : カテゴリ一覧から動画を選択するトップページ
- `video.html` : 選択した動画をプレーヤーで再生するページ

GitHub Pages など静的ホスティング環境でも動作確認できるよう、クライアント側のみで JWT を生成しています。

## 以下で実際に動作が確認できます
https://moguracream.github.io/filma-docs/template-jwt/index.html
