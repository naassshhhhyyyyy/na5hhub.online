const API_BASE = 'https://spotify-auth-g08f.onrender.com';
const REFRESH_INTERVAL = 5000;
const PAUSE_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const ACTION_PASSWORD_STORAGE_KEY = '2007';

// Account management
let currentAccount = 1;
const MAX_ACCOUNTS = 5;

// DOM Elements
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
const previousButton = document.getElementById('previousButton');
const playPauseButton = document.getElementById('playPauseButton');
const nextButton = document.getElementById('nextButton');
const accountSelect = document.getElementById('accountSelect');
const refreshAccountBtn = document.getElementById('refreshAccountBtn');
const accountStatus = document.getElementById('accountStatus');

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
let pausedSince = null;
let completedTrackKey = null;

// ========================================
// ACCOUNT MANAGEMENT
// ========================================

function getSpotifyApiUrl(account = null) {
  const acc = account || currentAccount;
  return `${API_BASE}/api/spotify?account=${acc}`;
}

function getQueueApiUrl(account = null) {
  const acc = account || currentAccount;
  return `${API_BASE}/api/queue?account=${acc}`;
}

function getToggleApiUrl(account = null) {
  const acc = account || currentAccount;
  return `${API_BASE}/api/toggle?account=${acc}`;
}

function getPreviousApiUrl(account = null) {
  const acc = account || currentAccount;
  return `${API_BASE}/api/previous?account=${acc}`;
}

function getNextApiUrl(account = null) {
  const acc = account || currentAccount;
  return `${API_BASE}/api/next?account=${acc}`;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function setStatus(text, variant = 'live') {
  statusText.textContent = text;
  statusBadge.className = `status-badge ${variant}`;
}

function setStateMessage(text) {
  stateMessage.textContent = text;
}

function updatePlayPauseButtonLabel(isPlaying) {
  playPauseButton.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
}

function promptForPassword(actionName) {
  const password = window.prompt(`Enter password to ${actionName}:`);
  if (!password) {
    throw new Error('Password required.');
  }
  localStorage.setItem(ACTION_PASSWORD_STORAGE_KEY, password);
  return password;
}

// ========================================
// PROTECTED ACTIONS (with account support)
// ========================================

async function protectedAction(actionName, endpoint, method = 'POST', body = null) {
  const password = promptForPassword(actionName);
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-action-password': password,
    },
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(endpoint, options);
  const responseText = await response.text();
  let data = null;
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Action failed.');
  }
  return data;
}

// ========================================
// PLAYBACK CONTROLS
// ========================================

async function handlePreviousTrack() {
  try {
    await protectedAction('go to the previous track', getPreviousApiUrl());
    setStateMessage('⏮ Moved to the previous track.');
    await refreshAll();
  } catch (error) {
    setStateMessage(error.message || 'Unable to change track.');
  }
}

async function handlePlayPause() {
  try {
    await protectedAction('toggle play/pause', getToggleApiUrl(), 'PUT');
    await refreshAll();
    setStateMessage('⏯ Playback toggled.');
  } catch (error) {
    setStateMessage(error.message || 'Unable to toggle playback.');
  }
}

async function handleNextTrack() {
  try {
    await protectedAction('go to the next track', getNextApiUrl());
    setStateMessage('⏭ Moved to the next track.');
    await refreshAll();
  } catch (error) {
    setStateMessage(error.message || 'Unable to change track.');
  }
}

// ========================================
// UI UPDATES
// ========================================

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

    if (currentMs >= trackState.durationMs && trackState.durationMs > 0) {
      trackState.playing = false;
      stopProgress();
      return;
    }

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
  let r = 0, g = 0, b = 0, count = 0;
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
  if (!imageUrl || imageUrl === '') {
    imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
  }
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
    coverImage.src = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
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
      artists: normalizeArtistNames(item.artists) || normalizeArtistNames(item.track?.artists) || [],
      albumImage: item.albumImage || item.track?.album?.images?.[0]?.url || item.album?.images?.[0]?.url || item.image || item.track?.album?.image || '',
      duration_ms: item.duration_ms || item.track?.duration_ms || 0,
    }));
  }
  const payload = Array.isArray(items.queue) ? items.queue : Array.isArray(items.tracks) ? items.tracks : Array.isArray(items.items) ? items.items : [];
  return payload.map((item) => ({
    song: item.song || item.name || item.track?.name,
    artists: normalizeArtistNames(item.artists) || normalizeArtistNames(item.track?.artists) || [],
    albumImage: item.albumImage || item.track?.album?.images?.[0]?.url || item.album?.images?.[0]?.url || item.image || item.track?.album?.image || '',
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

// ========================================
// RENDER STATES
// ========================================

function renderIdleState() {
  setStatus('💤 Inactivity', 'paused');
  titleElement.textContent = 'No track playing';
  artistElement.textContent = 'Playback has been inactive for over 10 minutes';
  albumElement.textContent = 'No playback activity available.';
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
  setStateMessage('Inactivity — no track playing.');
  updatePlayPauseButtonLabel(false);
  updateProgress(0, 0);
  queueSection.classList.add('hidden');
  currentTrackId = null;
  pausedSince = null;
  renderDevice(null);
  stopProgress();
  accountStatus.textContent = `Account ${currentAccount} • Idle`;
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
  updatePlayPauseButtonLabel(false);
  updateProgress(0, 0);
  renderQueue([]);
  renderDevice(null);
  stopProgress();
  accountStatus.textContent = `Account ${currentAccount} • Error`;
}

function renderPlayingState(data, messageOverride = null) {
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
  copyLinkButton.innerHTML = canCopy ? '<span class="button-icon" aria-hidden="true">🔗</span>Copy Link' : '<span class="button-icon" aria-hidden="true">🔗</span>Copy unavailable';
  trackState = {
    playing: Boolean(data.playing),
    progressMs: data.progress_ms || 0,
    durationMs: data.duration_ms || 0,
    updatedAt: Date.now(),
    spotifyUrl: data.spotifyUrl || '',
    song: data.song || 'Unknown track',
    artists: normalizeArtistNames(data.artists),
    album: data.album || 'Unknown album',
    albumImage: data.albumImage || '',
  };
  if (trackId !== currentTrackId) {
    currentTrackId = trackId;
    completedTrackKey = null;
    updateCover(data.albumImage || 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg');
  }
  updateProgress(trackState.progressMs, trackState.durationMs);
  updateMarquee();
  updatePlayPauseButtonLabel(trackState.playing);
  if (trackState.playing) {
    startProgressLoop();
  } else {
    stopProgress();
  }
  setStateMessage(messageOverride || (data.playing ? 'Live listening activity is displayed here.' : 'Playback is paused. The last track stays visible for 10 minutes.'));
  accountStatus.textContent = `Account ${currentAccount} • ${data.playing ? 'Playing' : 'Paused'}`;
}

// ========================================
// FETCH FUNCTIONS
// ========================================

async function fetchQueue() {
  try {
    const response = await fetch(getQueueApiUrl(), { cache: 'no-store' });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Queue fetch error:', error);
    return [];
  }
}

async function fetchCurrentlyPlaying() {
  try {
    const response = await fetch(getSpotifyApiUrl(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Server responded ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// ========================================
// DEVICE RENDER
// ========================================

function getDeviceIcon(type) {
  switch (type) {
    case 'Computer': return '💻';
    case 'Smartphone': return '📱';
    case 'Speaker': return '🔊';
    case 'TV': return '📺';
    case 'Game Console': return '🎮';
    case 'Cast Video': return '📺';
    case 'Cast Audio': return '🔈';
    case 'AVR': return '📻';
    default: return '🎧';
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
  if (hasType) return typeLabel;
  if (hasName) return name;
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

// ========================================
// MAIN REFRESH
// ========================================

async function refreshAll() {
  try {
    const data = await fetchCurrentlyPlaying();
    
    // Update account status
    if (data.account) {
      accountStatus.textContent = `Account ${data.account} • ${data.playing ? 'Playing' : 'Paused'}`;
    }
    
    renderDevice(data.device || null);
    const queue = await fetchQueue();
    renderQueue(queue);

    if (!data.playing) {
      if (data.song) {
        if (!pausedSince) {
          pausedSince = Date.now();
        }
        const remainingMs = PAUSE_IDLE_TIMEOUT_MS - (Date.now() - pausedSince);
        if (remainingMs > 0) {
          renderPlayingState(data, `Paused — switching to inactivity in ${formatCountdown(remainingMs)}.`);
          queueSection.classList.remove('hidden');
        } else {
          renderIdleState();
        }
      } else {
        renderIdleState();
      }
    } else {
      pausedSince = null;
      renderPlayingState(data);
      queueSection.classList.remove('hidden');
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

// ========================================
// ACCOUNT SWITCHING
// ========================================

function switchAccount(account) {
  currentAccount = parseInt(account);
  pausedSince = null;
  stopProgress();
  accountStatus.textContent = `Account ${currentAccount} • Loading...`;
  refreshAll();
}

// ========================================
// EVENT LISTENERS
// ========================================

copyLinkButton.addEventListener('click', async () => {
  const url = trackState.spotifyUrl;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    setStateMessage('✅ Track link copied to clipboard.');
  } catch (error) {
    setStateMessage('❌ Unable to copy link. Try again.');
  }
});

previousButton.addEventListener('click', handlePreviousTrack);
playPauseButton.addEventListener('click', handlePlayPause);
nextButton.addEventListener('click', handleNextTrack);

accountSelect.addEventListener('change', (e) => {
  switchAccount(e.target.value);
});

refreshAccountBtn.addEventListener('click', () => {
  switchAccount(accountSelect.value);
});

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Check URL params for account
  const urlParams = new URLSearchParams(window.location.search);
  const accountParam = urlParams.get('account');
  if (accountParam) {
    currentAccount = parseInt(accountParam);
    accountSelect.value = currentAccount;
  }
  
  accountStatus.textContent = `Account ${currentAccount} • Loading...`;
  refreshAll();
  scheduleRefresh();
});
