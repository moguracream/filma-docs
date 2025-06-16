// Configure API host and key in one place
const API_HOST = 'filma-dev.xcream.net';
const API_KEY = 'e47aad55d7fb4f152603b91b';

// Optional: enable horizontal scrolling with mouse wheel
const rows = document.querySelectorAll('.thumbnail-row');
rows.forEach(row => {
  row.addEventListener('wheel', evt => {
    evt.preventDefault();
    row.scrollLeft += evt.deltaY;
  });
});

// Run page-specific scripts after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  loadFileList();
  loadVideo();
});

// Load file list on index.html
function loadFileList() {
  const listElement = document.getElementById('file-list');
  if (!listElement) return;

  const url = `https://${API_HOST}/filmaapi/storage?api_key=${encodeURIComponent(API_KEY)}`;
  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(files => {
      files.forEach(file => {
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
function loadVideo() {
  const video = document.getElementById('video');
  if (!video) return;

  const metadataContainer = document.getElementById('metadata');

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || params.get('video');
  if (!id) return;

  const src = `https://${API_HOST}/filmaapi/storage/${encodeURIComponent(id)}?api_key=${encodeURIComponent(API_KEY)}`;
  video.src = src;

  if (metadataContainer) {
    const metaUrl = `https://${API_HOST}/filmaapi/storage/metadata/${encodeURIComponent(id)}?api_key=${encodeURIComponent(API_KEY)}`;
    fetch(metaUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        metadataContainer.innerHTML = buildMetadataHtml(data);
      })
      .catch(err => {
        metadataContainer.textContent = `Failed to load metadata: ${err.message}`;
        console.error('Error fetching file metadata:', err);
      });
  }
}

function buildMetadataHtml(data) {
  const fields = [
    ['ID', data.id],
    ['Filename', data.name],
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
      const bitrate = item.bitrate_human || ''
      const filesize = item.filesize_megabyte || ''
      const url = item.player_url || '';
      html += `<li class="list-group-item"><a href="${url}" target="_blank" rel="noopener">${res}</a> ${bitrate} ${filesize}</li>`;
    });
    html += '</ul>';
  }
  return html;
}
