// Filma API を利用する際のホスト名と API キーをここで設定します
const API_HOST = 'filma-dev.xcream.net';
const API_KEY = 'e47aad55d7fb4f152603b91b';
// show_allパラメータを付与するかどうかを設定
// trueにするとAPIリクエストに`show_all=true`が付き、fullaccess権限のAPIキー利用時は
// 非公開ファイルも取得できます (詳細は api_specification.md 参照)
const USE_SHOW_ALL = false;

// DOM が読み込まれた後にページごとの処理を実行します
// index.html ではファイル一覧を読み込みます
// ファイル一覧を取得してリストに表示する
function loadFileList(listElement) {
  if (!listElement) return;

  // Filma API からファイル一覧を取得
  const url = `https://${API_HOST}/filmaapi/storage?api_key=${encodeURIComponent(API_KEY)}${USE_SHOW_ALL ? "&show_all=true" : ""}`;
  fetch(url)
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

        // ファイル名をクリックすると再生ページへ遷移
        const link = document.createElement('a');
        link.href = `video.html?id=${encodeURIComponent(file.id)}`;
        link.textContent = file.filename;

        li.appendChild(link);
        listElement.appendChild(li);
      });
    })
    // 取得に失敗した場合はエラーメッセージを表示
    .catch(err => {
      const li = document.createElement('li');
      li.className = 'list-group-item text-danger';
      li.textContent = `Failed to load files: ${err.message}`;
      listElement.appendChild(li);
      console.error('Error fetching file list:', err);
    });
}

// フォルダごとにサムネイルをまとめて表示する
function loadFileListByFolder(container) {
  if (!container) return;

  const url = `https://${API_HOST}/filmaapi/storage?api_key=${encodeURIComponent(API_KEY)}${USE_SHOW_ALL ? "&show_all=true" : ""}`;
  fetch(url)
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
            : `https://via.placeholder.com/160x90.png?text=${idx + 1}`;
          img.src = screenshot;
          img.alt = file.filename;

          const caption = document.createElement('div');
          caption.className = 'small text-center text-break mt-1';
          caption.textContent = file.filename;

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
function loadVideo(element) {
  const player = element;
  if (!player) return;

  const metadataContainer = document.getElementById('metadata');
  const screenshotContainer = document.getElementById('screenshots');

  // URL パラメータから動画 ID を取得
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || params.get('video');
  if (!id) return;

  const playerUrl = `https://${API_HOST}/filmaapi/storage/${encodeURIComponent(id)}?api_key=${encodeURIComponent(API_KEY)}${USE_SHOW_ALL ? "&show_all=true" : ""}`;
  const metaUrl = `https://${API_HOST}/filmaapi/storage/metadata/${encodeURIComponent(id)}?api_key=${encodeURIComponent(API_KEY)}${USE_SHOW_ALL ? "&show_all=true" : ""}`;

  // プレイヤー埋め込み情報を取得
  fetch(playerUrl)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(playerData => {
      if (playerData.embed_code) {
        player.innerHTML = playerData.embed_code;
        initializeVideoPlayer(playerData.mediafile_id, API_HOST, API_KEY);
      } else {
        player.textContent = 'No player information available.';
      }
    })
    .catch(err => {
      player.textContent = `Failed to load video: ${err.message}`;
      console.error('Error fetching player info:', err);
    });

  // メタデータは別途取得する
  fetch(metaUrl)
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
    ['Updater', data.updater]
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
function initializeVideoPlayer(id, host, api_key) {
  let elem = document.getElementById('video-' + id);
  if (!elem) return;
  if (isSafari()) {
    // Safari では HLS を使用
    elem.dataset.src = `https://${host}/filmaapi/hls/${id}.m3u8?api_key=${api_key}${USE_SHOW_ALL ? "&show_all=true" : ""}`;
  } else {
    // その他のブラウザでは DASH を使用
    elem.dataset.src = `https://${host}/filmaapi/dash/${id}.mpd?api_key=${api_key}${USE_SHOW_ALL ? "&show_all=true" : ""}`;
  }
  init_xcream_player('video-' + id);
}
