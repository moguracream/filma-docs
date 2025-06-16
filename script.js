// Optional: enable horizontal scrolling with mouse wheel
const rows = document.querySelectorAll('.thumbnail-row');
rows.forEach(row => {
  row.addEventListener('wheel', evt => {
    evt.preventDefault();
    row.scrollLeft += evt.deltaY;
  });
});

// Fetch file list from the API and display it
document.addEventListener('DOMContentLoaded', () => {
  const listElement = document.getElementById('file-list');
  if (!listElement) return;

  // Customize these values for your environment
  const apiHost = 'filma-dev.xcream.net';
  const apiKey = 'e47aad55d7fb4f152603b91b';
  const url = `https://${apiHost}/filmaapi/storage?api_key=${encodeURIComponent(apiKey)}`;
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
});
