// Configure API host and key in one place
const API_HOST = 'filma-dev.xcream.net';
const API_KEY = 'e47aad55d7fb4f152603b91b';

// Run page-specific scripts after DOM is ready
// Load file list on index.html
function loadFileList(listElement) {
  if (!listElement) return;

  // Fetch file list from the configured Filma API
  const url = `https://${API_HOST}/filmaapi/storage?api_key=${encodeURIComponent(API_KEY)}`;
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

        // Each file name links to the player page
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

// Load video by ID on video.html
function loadVideo(element) {
  const player = element
  if (!player) return;

  const metadataContainer = document.getElementById('metadata');

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || params.get('video');
  if (!id) return;

  const playerUrl = `https://${API_HOST}/filmaapi/storage/${encodeURIComponent(id)}?api_key=${encodeURIComponent(API_KEY)}`;
  const metaUrl = `https://${API_HOST}/filmaapi/storage/metadata/${encodeURIComponent(id)}?api_key=${encodeURIComponent(API_KEY)}`;

  // Fetch player embedding info
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

  // Fetch metadata separately
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
    })
    .catch(err => {
      if (metadataContainer) {
        metadataContainer.textContent = `Failed to load metadata: ${err.message}`;
      }
      console.error('Error fetching file metadata:', err);
    });
}

function buildMetadataHtml(data) {
  const fields = [
    ['ID', data.id],
    ['Filename', data.filename || data.name],
    ['Folder', data.folder_name],
    ['Created', data.created_at],
    ['Updated', data.updated_at],
    ['Creator', data.creator],
    ['Updater', data.updater]
  ];

  let html = '<h2 class="h4 mb-3">File Metadata</h2><ul class="list-group mb-3">';
  fields.forEach(([label, value]) => {
    if (value !== undefined && value !== null) {
      html += `<li class="list-group-item"><strong>${label}:</strong> ${value}</li>`;
    }
  });
  html += '</ul>';

  if (Array.isArray(data.player_data) && data.player_data.length) {
    html += '<h3 class="h5">Player Data</h3><ul class="list-group">';
    data.player_data.forEach(item => {
      const res = item.resolution_string || '';
      const url = item.player_url || '';
      html += `<li class="list-group-item"><a href="${url}" target="_blank" rel="noopener">${res}</a></li>`;
    });
    html += '</ul>';
  }
  return html;
}

function initializeVideoPlayer(id, host, api_key) {
  let elem = document.getElementById('video-' + id);
  if (!elem) return;
  if (isSafari()) {
    elem.dataset.src = `https://${host}/filmaapi/hls/${id}.m3u8?api_key=${api_key}`;
  } else {
    elem.dataset.src = `https://${host}/filmaapi/dash/${id}.mpd?api_key=${api_key}`;
  }
  init_xcream_player('video-' + id);
}
