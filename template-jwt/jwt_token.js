// 注意: このコードはデモ用途でクライアント側のみで実行しています。
// 実運用ではバックエンドで JWT を発行し、
// API キーをフロントエンドの JavaScript には公開しないでください。

const API_HOST = 'filma-dev.xcream.net';
// この API キーは JWT 発行時のみ使用します
const API_KEY = 'e47aad55d7fb4f152603b91b';
// show_allパラメータを付与するかどうかを設定
// trueにするとAPIリクエストに`show_all=true`が付き、fullaccess権限のAPIキー利用時は
// 非公開ファイルも取得できます (詳細は api_specification.md 参照)
const USE_SHOW_ALL = false;

function createJwtTokenFetcher(apiHost, apiKey) {
  let jwtToken = null;
  let jwtTokenPromise = null;

  return async function getJwtToken() {
    if (jwtToken) return jwtToken;
    if (jwtTokenPromise) return jwtTokenPromise;

    jwtTokenPromise = (async () => {
      const url = `https://${apiHost}/filmaapi/token?api_key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { method: 'POST' });

      if (!res.ok) {
        jwtTokenPromise = null;
        throw new Error(`Failed to obtain JWT: HTTP ${res.status}`);
      }

      const data = await res.json();
      jwtToken = data.token;
      jwtTokenPromise = null;
      return jwtToken;
    })();

    return jwtTokenPromise;
  };
}

const getJwtToken = createJwtTokenFetcher(API_HOST, API_KEY);
