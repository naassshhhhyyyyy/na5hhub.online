const SPOTIFY_API = 'https://spotify-auth-g08f.onrender.com/api/spotify';
const QUEUE_API = 'https://spotify-auth-g08f.onrender.com/api/queue';
const REFRESH_INTERVAL = 5000;

const coverImage = document.getElementById('cover');
const coverGlow = document.getElementById('coverGlow');
const titleElement = document.getElementById('title');
const artistElement = document.getElementById('artist');
const albumElement = document.getElementById('album');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');
const currentTime = document.getElementById('currentTime');
const durationTime = document.getElementById('durationTime');
const spotifyLink = document.getElementById('spotifyLink');
const copyLinkButton = document.getElementById('copyLink');
const stateMessage = document.getElementById('stateMessage');
const queueList = document.getElementById('queueList');
const queueSection = document.querySelector('.queue-shell');
const titleContainer = document.getElementById('titleContainer');

let trackState = {
  playing: false,
  progressMs: 0,
  durationMs: 0,
  updatedAt: Date.now(),
  spotifyUrl: '',
};
let refreshTimer = null;
let progressAnimation = null;
let currentTrackId = null;

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function setStatus(text, variant = 'live') {
  statusText.textContent = text;
  statusBadge.className = `status-badge ${variant}`;
}

function setStateMessage(text) {
  stateMessage.textContent = text;
}

function updateMarquee() {
  if (titleElement.scrollWidth > titleContainer.offsetWidth) {
    titleElement.style.animation = 'marquee 12s linear infinite';
  } else {
    titleElement.style.animation = 'none';
  }
}

function updateProgress(currentMs, durationMs) {
  const ratio = durationMs ? Math.min((currentMs / durationMs) * 100, 100) : 0;
  progressBar.style.width = `${ratio}%`;
  currentTime.textContent = formatTime(currentMs);
  durationTime.textContent = formatTime(durationMs);
}

function stopProgress() {
  if (progressAnimation) {
    cancelAnimationFrame(progressAnimation);
    progressAnimation = null;
  }
}

function startProgressLoop() {
  stopProgress();
  const startTime = Date.now();
  const baseProgress = trackState.progressMs;

  function animate() {
    if (!trackState.playing) return;
    const elapsed = Date.now() - startTime;
    const currentMs = Math.min(baseProgress + elapsed, trackState.durationMs);
    updateProgress(currentMs, trackState.durationMs);
    if (currentMs < trackState.durationMs) {
      progressAnimation = requestAnimationFrame(animate);
    }
  }
  progressAnimation = requestAnimationFrame(animate);
}

function getDominantColor(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 20;
  const height = 20;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  let r = 0,
    g = 0,
    b = 0,
    count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 64) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count += 1;
    }
  }
  if (!count) return 'rgba(29, 185, 84, 0.18)';
  return `rgba(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}, 0.22)`;
}

function setBackgroundColor(color) {
  document.body.style.background = `radial-gradient(circle at top left, ${color}, transparent 18%),
    radial-gradient(circle at 80% 10%, rgba(104, 138, 255, 0.12), transparent 20%),
    linear-gradient(180deg, #050607 0%, #0c1115 45%, #080909 100%)`;
}

function updateCover(imageUrl) {
  const tempImage = new Image();
  tempImage.crossOrigin = 'Anonymous';
  tempImage.src = imageUrl;
  tempImage.onload = () => {
    coverImage.classList.remove('fade-in');
    coverImage.src = imageUrl;
    coverImage.onload = () => {
      coverImage.classList.add('fade-in');
      const dominant = getDominantColor(coverImage);
      coverGlow.style.background = `radial-gradient(circle at 35% 35%, ${dominant}, transparent 45%)`;
      setBackgroundColor(dominant);
    };
  };
  tempImage.onerror = () => {
    coverImage.src = imageUrl;
    coverGlow.style.background = 'radial-gradient(circle at 35% 35%, rgba(29, 185, 84, 0.2), transparent 45%)';
  };
}

function normalizeArtistNames(artists) {
  if (!artists) return [];
  if (typeof artists === 'string') return [artists];
  if (!Array.isArray(artists)) return [];
  return artists.map((artist) => {
    if (!artist) return 'Unknown artist';
    if (typeof artist === 'string') return artist;
    return artist.name || artist.username || 'Unknown artist';
  });
}

function normalizeQueueData(items) {
  if (!items) return [];
  if (items.data) items = items.data;
  if (Array.isArray(items)) {
    return items.map((item) => ({
      song: item.song || item.name || item.track?.name,
      artists:
        normalizeArtistNames(item.artists) ||
        normalizeArtistNames(item.track?.artists) ||
        [],
      albumImage:
        item.albumImage ||
        item.track?.album?.images?.[0]?.url ||
        item.album?.images?.[0]?.url ||
        item.image ||
        item.track?.album?.image ||
        '',
      duration_ms: item.duration_ms || item.track?.duration_ms || 0,
    }));
  }
  const payload = Array.isArray(items.queue)
    ? items.queue
    : Array.isArray(items.tracks)
    ? items.tracks
    : Array.isArray(items.items)
    ? items.items
    : [];
  return payload.map((item) => ({
    song: item.song || item.name || item.track?.name,
    artists:
      normalizeArtistNames(item.artists) ||
      normalizeArtistNames(item.track?.artists) ||
      [],
    albumImage:
      item.albumImage ||
      item.track?.album?.images?.[0]?.url ||
      item.album?.images?.[0]?.url ||
      item.image ||
      item.track?.album?.image ||
      '',
    duration_ms: item.duration_ms || item.track?.duration_ms || 0,
  }));
}

function renderQueue(items) {
  const queueItems = normalizeQueueData(items);
  queueList.innerHTML = '';
  if (!queueItems.length) {
    queueList.innerHTML = '<p class="queue-empty">No upcoming tracks found. Queue will appear here.</p>';
    return;
  }
  queueItems.slice(0, 5).forEach((item) => {
    const queueItem = document.createElement('div');
    queueItem.className = 'queue-item';
    queueItem.innerHTML = `
      <img class="queue-thumb" src="${item.albumImage || 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg'}" alt="${item.song || 'Queued track'} album artwork" loading="lazy" />
      <div class="queue-labels">
        <p class="queue-track">${item.song || 'Unknown track'}</p>
        <p class="queue-artist">${item.artists?.join(', ') || 'Unknown artist'}</p>
      </div>
      <span class="queue-duration">${formatTime(item.duration_ms || 0)}</span>
    `;
    queueList.appendChild(queueItem);
  });
}

function renderIdleState() {
  setStatus('🔴 Offline', 'error');
  titleElement.textContent = 'No track playing';
  artistElement.textContent = 'Spotify is offline or paused';
  albumElement.textContent = 'No playback record available.';
  coverImage.src = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
  coverImage.alt = 'Spotify Album';
  spotifyLink.href = '#';
  spotifyLink.setAttribute('aria-label', 'Spotify unavailable');
  spotifyLink.setAttribute('aria-disabled', 'true');
  spotifyLink.classList.add('disabled');
  spotifyLink.innerHTML = '<span class="button-icon" aria-hidden="true">⚠</span>Cannot open — no track playing';
  copyLinkButton.disabled = true;
  copyLinkButton.setAttribute('aria-disabled', 'true');
  copyLinkButton.classList.add('disabled');
  copyLinkButton.innerHTML = '<span class="button-icon" aria-hidden="true">🔗</span>Copy unavailable';
  setStateMessage('Spotify is not playing. Queue is unavailable until playback resumes.');
  updateProgress(0, 0);
  queueSection.classList.add('hidden');
  currentTrackId = null;
  renderDevice(null);
  stopProgress();
}

function renderErrorState(message) {
  setStatus('⚠ Spotify Offline', 'error');
  titleElement.textContent = 'Spotify Offline';
  artistElement.textContent = 'Unable to connect.';
  albumElement.textContent = message;
  coverImage.src = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
  coverImage.alt = 'Spotify error';
  spotifyLink.href = '#';
  spotifyLink.setAttribute('aria-label', 'Spotify unavailable');
  copyLinkButton.disabled = true;
  setStateMessage('Retrying automatically every 5 seconds.');
  updateProgress(0, 0);
  renderQueue([]);
  renderDevice(null);
  stopProgress();
}

async function fetchQueue() {
  try {
    const response = await fetch(QUEUE_API, { cache: 'no-store' });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Queue fetch error:', error);
    return [];
  }
}

function renderPlayingState(data) {
  const trackId = `${data.song}-${data.album}`;
  setStatus(data.playing ? '🟢 Listening Now' : '🟡 Paused', data.playing ? 'live' : 'paused');
  titleElement.textContent = data.song || 'Unknown track';
  artistElement.textContent = normalizeArtistNames(data.artists).join(', ') || 'Unknown artist';
  albumElement.textContent = data.album || 'Unknown album';
  spotifyLink.href = data.spotifyUrl || 'https://open.spotify.com';
  spotifyLink.setAttribute('aria-label', `Open ${data.song} in Spotify`);
  spotifyLink.removeAttribute('aria-disabled');
  spotifyLink.classList.remove('disabled');
  spotifyLink.innerHTML = '<span class="button-icon" aria-hidden="true">♬</span>Open in Spotify';
  const canCopy = Boolean(data.spotifyUrl);
  copyLinkButton.disabled = !canCopy;
  copyLinkButton.removeAttribute('aria-disabled');
  copyLinkButton.classList.toggle('disabled', !canCopy);
  copyLinkButton.innerHTML = canCopy
    ? '<span class="button-icon" aria-hidden="true">🔗</span>Copy Link'
    : '<span class="button-icon" aria-hidden="true">🔗</span>Copy unavailable';
  trackState = {
    playing: Boolean(data.playing),
    progressMs: data.progress_ms || 0,
    durationMs: data.duration_ms || 0,
    updatedAt: Date.now(),
    spotifyUrl: data.spotifyUrl || '',
  };
  if (trackId !== currentTrackId) {
    currentTrackId = trackId;
    updateCover(data.albumImage || 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg');
  }
  updateProgress(trackState.progressMs, trackState.durationMs);
  updateMarquee();
  if (trackState.playing) {
    startProgressLoop();
  } else {
    stopProgress();
  }
  setStateMessage('Live listening activity is displayed here.');
}

async function refreshAll() {
  try {
    const response = await fetch(SPOTIFY_API, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Server responded ${response.status}`);
    }
    const data = await response.json();
    renderDevice(data.device || null);
    if (!data.playing) {
      renderIdleState();
    } else {
      renderPlayingState(data);
      queueSection.classList.remove('hidden');
      const queue = await fetchQueue();
      renderQueue(queue);
    }
  } catch (error) {
    console.error('Spotify fetch error:', error);
    renderErrorState(error.message || 'Unable to load Spotify data.');
  }
}

function scheduleRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  refreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
}

copyLinkButton.addEventListener('click', async () => {
  const url = trackState.spotifyUrl;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    setStateMessage('Track link copied to clipboard.');
  } catch (error) {
    setStateMessage('Unable to copy link. Try again.');
  }
});

function getDeviceIcon(type) {
  switch (type) {
    case 'Computer':
      return '💻';
    case 'Smartphone':
      return '📱';
    case 'Speaker':
      return '🔊';
    case 'TV':
      return '📺';
    case 'Game Console':
      return '🎮';
    case 'Cast Video':
      return '📺';
    case 'Cast Audio':
      return '🔈';
    case 'AVR':
      return '📻';
    default:
      return '🎧';
  }
}

function getDeviceLabel(device) {
  if (!device) return 'Unknown device';
  const name = device.name?.trim();
  const type = device.type?.trim();
  const hasName = name && !/^unknown/i.test(name);
  const hasType = type && !/^unknown/i.test(type);
  const typeLabel = hasType ? type.charAt(0).toUpperCase() + type.slice(1) : '';

  if (hasType && hasName) {
    if (name.toLowerCase().includes(type.toLowerCase())) {
      return name;
    }
    return `${typeLabel} — ${name}`;
  }
  if (hasType) {
    return typeLabel;
  }
  if (hasName) {
    return name;
  }
  return 'Unknown device';
}

function renderDevice(device) {
  const deviceElement = document.getElementById('device');
  if (!device || (!device.name && !device.type)) {
    deviceElement.innerHTML = '🎧 Unknown device';
    return;
  }

  const icon = getDeviceIcon(device.type || '');
  const label = getDeviceLabel(device);
  deviceElement.innerHTML = `
    <span class="device-icon">${icon}</span>
    <span>Playing on <strong>${label}</strong></span>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  refreshAll();
  scheduleRefresh();
});
