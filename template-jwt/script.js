// Filma API を利用するホスト名と JWT 発行用 API キーを設定
const API_HOST = 'filma-dev.xcream.net';
// この API キーは JWT 発行時のみ使用します
const API_KEY = 'e47aad55d7fb4f152603b91b';
// 取得した JWT を保持
let JWT_TOKEN = null;
let JWT_TOKEN_PROMISE = null;

// JWT を取得する。既に取得済みで有効な場合はそのまま返す。
async function getJwtToken() {
  if (JWT_TOKEN) {
    return JWT_TOKEN;
  }
  if (JWT_TOKEN_PROMISE) {
    return JWT_TOKEN_PROMISE;
  }
  JWT_TOKEN_PROMISE = (async () => {
    const url = `https://${API_HOST}/filmaapi/token?api_key=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      JWT_TOKEN_PROMISE = null;
      throw new Error(`Failed to obtain JWT: HTTP ${res.status}`);
    }
    const data = await res.json();
    JWT_TOKEN = data.token;
    JWT_TOKEN_PROMISE = null;
    return JWT_TOKEN;
  })();
  return JWT_TOKEN_PROMISE;
}
// show_allパラメータを付与するかどうかを設定
// trueにするとAPIリクエストに`show_all=true`が付き、fullaccess権限のAPIキー利用時は
// 非公開ファイルも取得できます (詳細は api_specification.md 参照)
const USE_SHOW_ALL = false;

let METADATA_OPTIONS = null;
let METADATA_OPTIONS_PROMISE = null;

// メタデータオプションを取得
async function fetchMetadataOptions() {
  if (METADATA_OPTIONS) {
    return METADATA_OPTIONS;
  }
  if (METADATA_OPTIONS_PROMISE) {
    return METADATA_OPTIONS_PROMISE;
  }
  METADATA_OPTIONS_PROMISE = (async () => {
    const token = await getJwtToken();
    const url = `https://${API_HOST}/filmaapi/storage/metadata_options`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      METADATA_OPTIONS_PROMISE = null;
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    const meta = {};
    if (data && data.metadata_keys) {
      const keys = data.metadata_keys;
      if (keys.category && Array.isArray(keys.category.unique_values)) {
        meta.category = keys.category.unique_values;
      }
      if (keys.tags && Array.isArray(keys.tags.unique_values)) {
        meta.tags = keys.tags.unique_values;
      }
    }
    METADATA_OPTIONS = meta;
    METADATA_OPTIONS_PROMISE = null;
    return METADATA_OPTIONS;
  })();
  return METADATA_OPTIONS_PROMISE;
}

// カテゴリ一覧を取得して<select>要素に追加
async function loadCategoryOptions(select) {
  if (!select) return;
  try {
    const options = await fetchMetadataOptions();
    const list = Array.isArray(options.category) ? options.category : [];
    select.innerHTML = '<option value="">All</option>';
    list.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
}

// タグ一覧を取得して<select>要素に追加
async function loadTagOptions(select) {
  if (!select) return;
  try {
    const options = await fetchMetadataOptions();
    const list = Array.isArray(options.tags) ? options.tags : [];
    select.innerHTML = '<option value="">All</option>';
    list.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error fetching tags:', err);
  }
}

// DOM が読み込まれた後にページごとの処理を実行します
// index.html ではファイル一覧を読み込みます
// ファイル一覧を取得してリストに表示する
async function loadFileList(listElement) {
  if (!listElement) return;

  const token = await getJwtToken();
  const url = `https://${API_HOST}/filmaapi/storage${USE_SHOW_ALL ? "?show_all=true" : ""}`;

  fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(storage => {
      storage.items.forEach(file => {
        const li = document.createElement('li');
        li.className = 'list-group-item';

        const link = document.createElement('a');
        link.href = `video.html?id=${encodeURIComponent(file.id)}`;
        link.textContent = file.filename;

        li.appendChild(link);
        listElement.appendChild(li);
      });
    })
    .catch(err => {
      const li = document.createElement('li');
      li.className = 'list-group-item text-danger';
      li.textContent = `Failed to load files: ${err.message}`;
      listElement.appendChild(li);
      console.error('Error fetching file list:', err);
    });
}

// フォルダごとにサムネイルをまとめて表示する
async function loadFileListByFolder(container, options = {}) {
  if (!container) return;

  const token = await getJwtToken();
  const params = new URLSearchParams();
  if (USE_SHOW_ALL) params.set('show_all', 'true');
  if (options.category) params.set('category', options.category);
  if (options.tag) params.append('tags', options.tag);
  const url = `https://${API_HOST}/filmaapi/storage${params.toString() ? `?${params.toString()}` : ''}`;
  fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(storage => {
      // フォルダ名ごとに動画をグループ化
      const groups = {};
      storage.items.forEach(file => {
        const folder = file.folder_name || 'Uncategorized';
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(file);
      });

      Object.entries(groups).forEach(([folder, files]) => {
        const section = document.createElement('div');
        section.className = 'category mb-5';

        const heading = document.createElement('h2');
        heading.className = 'h4 mb-3';
        heading.textContent = folder;

        const row = document.createElement('div');
        row.className = 'thumbnail-row row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3';

        files.forEach((file, idx) => {
          const col = document.createElement('div');
          col.className = 'col';

          const link = document.createElement('a');
          link.href = `video.html?id=${encodeURIComponent(file.id)}`;

          const img = document.createElement('img');
          img.className = 'img-thumbnail img-fluid w-100';
          // サムネイルに使用する画像を選択
          const screenshots = Array.isArray(file.screen_shots)
            ? file.screen_shots
            : [];
          const screenshot = screenshots.length
            ? screenshots[Math.floor(Math.random() * screenshots.length)]
            : `https://placehold.jp/160x90.png?text=no image ${idx + 1}`;
          img.src = screenshot;
          img.alt = file.filename;

        const caption = document.createElement('div');
        caption.className = 'small text-center text-break mt-1';
        const meta = [];
        if (file.user_metadata && file.user_metadata.category) {
          meta.push(file.user_metadata.category);
        }
        if (file.user_metadata && Array.isArray(file.user_metadata.tags)) {
          meta.push(...file.user_metadata.tags);
        }
        caption.innerHTML = `${file.filename}<br><span class="text-muted">${meta.join(', ')}</span>`;

          link.classList.add('d-block', 'text-decoration-none');
          link.appendChild(img);
          link.appendChild(caption);
          col.appendChild(link);
          row.appendChild(col);
        });

        section.appendChild(heading);
        section.appendChild(row);
        container.appendChild(section);
      });
    })
    // 読み込みに失敗した場合はエラー表示
    .catch(err => {
      const div = document.createElement('div');
      div.className = 'text-danger';
      div.textContent = `Failed to load files: ${err.message}`;
      container.appendChild(div);
      console.error('Error fetching file list:', err);
    });
}

// video.html で ID から動画を読み込む
async function loadVideo(element) {
  const player = element;
  if (!player) return;

  const metadataContainer = document.getElementById('metadata');
  const screenshotContainer = document.getElementById('screenshots');

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || params.get('video');
  if (!id) return;

  const token = await getJwtToken();
  const playerUrl = `https://${API_HOST}/filmaapi/storage/${encodeURIComponent(id)}${USE_SHOW_ALL ? '?show_all=true' : ''}`;
  const metaUrl = `https://${API_HOST}/filmaapi/storage/metadata/${encodeURIComponent(id)}${USE_SHOW_ALL ? '?show_all=true' : ''}`;

  // プレイヤー埋め込み情報を取得
  fetch(playerUrl, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(playerData => {
      if (playerData.simple_embed_code) {
        player.innerHTML = playerData.simple_embed_code;
        initializeVideoPlayer(playerData.mediafile_id, API_HOST, token);
      } else {
        player.textContent = 'No player information available.';
      }
    })
    .catch(err => {
      player.textContent = `Failed to load video: ${err.message}`;
      console.error('Error fetching player info:', err);
    });

  // メタデータは別途取得する
  fetch(metaUrl, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (metadataContainer) {
        metadataContainer.innerHTML = buildMetadataHtml(data);
      }
      if (screenshotContainer) {
        screenshotContainer.innerHTML = buildScreenshotsHtml(data.screen_shots);
        setupScreenshotViewer(screenshotContainer);
      }
    })
    // メタデータ取得失敗時の処理
    .catch(err => {
      if (metadataContainer) {
        metadataContainer.textContent = `Failed to load metadata: ${err.message}`;
      }
      console.error('Error fetching file metadata:', err);
    });
}

// メタデータ表示用の HTML を生成
function buildMetadataHtml(data) {
  // 画面に表示するメタデータ項目
  const fields = [
    ['ID', data.id],
    ['Filename', data.filename || data.name],
    ['Folder', data.folder_name],
    ['Created', data.created_at],
    ['Updated', data.updated_at],
    ['Creator', data.creator],
    ['Updater', data.updater],
    ['Category', data.user_metadata && data.user_metadata.category],
    ['Tags', Array.isArray(data.user_metadata && data.user_metadata.tags) ? data.user_metadata.tags.join(', ') : null]
  ];

  // HTML を組み立てていく
  let html = '<h2 class="h4 mb-3">File Metadata</h2><ul class="list-group mb-3">';
  // 取得したメタデータをリスト化
  fields.forEach(([label, value]) => {
    if (value !== undefined && value !== null) {
      html += `<li class="list-group-item"><strong>${label}:</strong> ${value}</li>`;
    }
  });
  html += '</ul>';

  if (Array.isArray(data.player_data) && data.player_data.length) {
    html += '<h3 class="h5">Player Data</h3><ul class="list-group">';
    // 解像度ごとの再生 URL を表示
    data.player_data.forEach(item => {
      const res = item.resolution_string || '';
      const url = item.player_url || '';
      html += `<li class="list-group-item"><a href="${url}" target="_blank" rel="noopener">${res}</a></li>`;
    });
    html += '</ul>';
  }
  // 完成した HTML を返す
  return html;
}

// スクリーンショット一覧表示用の HTML を生成
function buildScreenshotsHtml(urls) {
  if (!Array.isArray(urls) || !urls.length) {
    return '';
  }

  let html = '<h2 class="h4 mb-3">Screenshots</h2>';
  html += '<div class="thumbnail-row row row-cols-2 row-cols-sm-3 row-cols-md-4 g-2">';

  urls.forEach(url => {
    html += `<div class="col"><img src="${url}" alt="Screenshot" class="img-thumbnail img-fluid w-100"></div>`;
  });
  html += '</div>';
  return html;
}

// スクリーンショットのクリックでモーダル表示を行う
function setupScreenshotViewer(container) {
  container.addEventListener('click', event => {
    const target = event.target;
    if (target.tagName === 'IMG') {
      const src = target.dataset.fullSrc || target.src;
      const modalImg = document.getElementById('screenshotModalImg');
      if (modalImg) {
        modalImg.src = src;
        const modalElement = document.getElementById('screenshotModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      }
    }
  });
}

// 埋め込みプレイヤーを初期化
function initializeVideoPlayer(id, host, jwt) {
  let elem = document.getElementById('video-' + id);
  if (!elem) return;
  if (isSafari()) {
    // Safari では HLS を使用
    elem.dataset.src = `https://${host}/filmaapi/hls/${id}.m3u8?jwt=${jwt}${USE_SHOW_ALL ? "&show_all=true" : ""}`;
  } else {
    // その他のブラウザでは DASH を使用
    elem.dataset.src = `https://${host}/filmaapi/dash/${id}.mpd?jwt=${jwt}${USE_SHOW_ALL ? "&show_all=true" : ""}`;
  }
  init_xcream_player('video-' + id);
}
