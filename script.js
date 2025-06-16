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
        li.textContent = file.filename;
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

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || params.get('video');
  if (!id) return;

  const src = `https://${API_HOST}/filmaapi/storage/${encodeURIComponent(id)}?api_key=${encodeURIComponent(API_KEY)}`;
  video.src = src;
}
