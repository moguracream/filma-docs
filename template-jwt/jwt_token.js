// 注意: API の動作確認用デモとして readonly キーをブラウザに公開しています。
// 本番利用向けの実装ではありません。実運用では API キーをサーバーに保管し、
// サーバー側で JWT を発行してください。このサンプルは会員認証・視聴権確認を行いません。

const API_HOST = 'filma.biz';
// 公開デモ専用の readonly キーを JWT 発行時のみ使用します（fullaccess は使用しないでください）。
const API_KEY = 'e47aad55d7fb4f152603b91b';
// readonly キーで公開ファイルだけを扱うため、show_all は付与しません。
const USE_SHOW_ALL = false;

function createJwtTokenFetcher(apiHost, apiKey) {
  let jwtToken = null;
  let jwtTokenPromise = null;

  return async function getJwtToken() {
    if (jwtToken) return jwtToken;
    if (jwtTokenPromise) return jwtTokenPromise;

    jwtTokenPromise = (async () => {
      const url = `https://${apiHost}/filmaapi/token`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey }
      });

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
