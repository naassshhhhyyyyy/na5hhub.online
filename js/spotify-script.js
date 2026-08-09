const API_BASE = 'https://spotify-auth-g08f.onrender.com';
const REFRESH_INTERVAL = 2000; // 2 seconds - mabilis na update
const PAUSE_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const ACTION_PASSWORD_STORAGE_KEY = '2007';

let currentAccount = 1;
let refreshTimer = null;
let progressAnimation = null;
let currentTrackId = null;
let pausedSince = null;

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
const accountStatus = document.getElementById('accountStatus');

let trackState = {
  playing: false,
  progressMs: 0,
  durationMs: 0,
  updatedAt: Date.now(),
  spotifyUrl: '',
};

// ========================================
// API URLS WITH CACHE BUSTING
// ========================================

function getSpotifyApiUrl() {
  return `${API_BASE}/api/spotify?account=${currentAccount}&_=${Date.now()}`;
}

function getQueueApiUrl() {
  return `${API_BASE}/api/queue?account=${currentAccount}&_=${Date.now()}`;
}

function getToggleApiUrl() {
  return `${API_BASE}/api/toggle?account=${currentAccount}&_=${Date.now()}`;
}

function getPreviousApiUrl() {
  return `${API_BASE}/api/previous?account=${currentAccount}&_=${Date.now()}`;
}

function getNextApiUrl() {
  return `${API_BASE}/api/next?account=${currentAccount}&_=${Date.now()}`;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatTime(ms) {
  if (!ms || ms < 0) return '0:00';
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

function updatePlayPauseButtonLabel(isPlaying) {
  playPauseButton.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
}

function promptForPassword(actionName) {
  const password = window.prompt(`Enter password to ${actionName}:`);
  if (!password) throw new Error('Password required.');
  localStorage.setItem('2007', password);
  return password;
}

// ========================================
// PROTECTED ACTIONS
// ========================================

async function protectedAction(actionName, endpoint, method = 'POST') {
  const password = promptForPassword(actionName);
  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-action-password': password,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'Action failed.');
  }
  return response.json();
}

// ========================================
// PLAYBACK CONTROLS
// ========================================

async function handlePreviousTrack() {
  try {
    await protectedAction('go to the previous track', getPreviousApiUrl());
    setStateMessage('⏮ Moved to previous track.');
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
    setStateMessage('⏭ Moved to next track.');
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
    if (currentMs < trackState.durationMs) {
      progressAnimation = requestAnimationFrame(animate);
    }
  }
  progressAnimation = requestAnimationFrame(animate);
}

function updateCover(imageUrl) {
  if (!imageUrl) {
    imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
  }
  coverImage.src = imageUrl;
  coverImage.onload = () => {
    coverImage.classList.add('fade-in');
  };
  coverImage.onerror = () => {
    coverImage.src = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
  };
}

function normalizeArtistNames(artists) {
  if (!artists) return [];
  if (typeof artists === 'string') return [artists];
  if (!Array.isArray(artists)) return [];
  return artists.map(a => typeof a === 'string' ? a : a.name || 'Unknown');
}

function renderQueue(items) {
  queueList.innerHTML = '';
  if (!items || !items.length) {
    queueList.innerHTML = '<p class="queue-empty">No upcoming tracks.</p>';
    return;
  }
  items.slice(0, 5).forEach((item) => {
    const div = document.createElement('div');
    div.className = 'queue-item';
    div.innerHTML = `
      <img class="queue-thumb" src="${item.albumImage || 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg'}" alt="Album" loading="lazy" />
      <div class="queue-labels">
        <p class="queue-track">${item.song || 'Unknown'}</p>
        <p class="queue-artist">${item.artists?.join(', ') || 'Unknown'}</p>
      </div>
      <span class="queue-duration">${formatTime(item.duration_ms || 0)}</span>
    `;
    queueList.appendChild(div);
  });
}

function renderDevice(device) {
  const el = document.getElementById('device');
  if (!device) {
    el.innerHTML = '🎧 Unknown device';
    return;
  }
  const icons = { Computer: '💻', Smartphone: '📱', Speaker: '🔊', TV: '📺', 'Game Console': '🎮' };
  const icon = icons[device.type] || '🎧';
  el.innerHTML = `<span>${icon}</span> Playing on <strong>${device.name || 'Unknown'}</strong>`;
}

// ========================================
// RENDER STATES
// ========================================

function renderIdleState() {
  setStatus('💤 Inactive', 'paused');
  titleElement.textContent = 'No track playing';
  artistElement.textContent = 'Playback is inactive';
  albumElement.textContent = 'No playback activity';
  coverImage.src = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
  spotifyLink.href = '#';
  spotifyLink.classList.add('disabled');
  spotifyLink.innerHTML = '⚠ Cannot open';
  copyLinkButton.disabled = true;
  copyLinkButton.classList.add('disabled');
  updatePlayPauseButtonLabel(false);
  updateProgress(0, 0);
  queueSection.classList.add('hidden');
  stopProgress();
  accountStatus.textContent = `Account ${currentAccount} • Idle`;
}

function renderErrorState(message) {
  setStatus('⚠ Offline', 'error');
  titleElement.textContent = 'Spotify Offline';
  artistElement.textContent = 'Unable to connect';
  albumElement.textContent = message;
  coverImage.src = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
  updatePlayPauseButtonLabel(false);
  updateProgress(0, 0);
  accountStatus.textContent = `Account ${currentAccount} • Error`;
}

function renderPlayingState(data) {
  const trackId = data.song + data.album;
  const isNewTrack = trackId !== currentTrackId;
  
  if (isNewTrack) {
    currentTrackId = trackId;
    console.log(`🎵 Now Playing: ${data.song} - ${data.artists?.join(', ')}`);
  }
  
  setStatus(data.playing ? '🟢 Listening Now' : '🟡 Paused', data.playing ? 'live' : 'paused');
  titleElement.textContent = data.song || 'Unknown';
  artistElement.textContent = data.artists?.join(', ') || 'Unknown';
  albumElement.textContent = data.album || 'Unknown';
  
  spotifyLink.href = data.spotifyUrl || '#';
  spotifyLink.classList.remove('disabled');
  spotifyLink.innerHTML = '♬ Open in Spotify';
  
  copyLinkButton.disabled = !data.spotifyUrl;
  copyLinkButton.classList.toggle('disabled', !data.spotifyUrl);
  
  trackState = {
    playing: data.playing || false,
    progressMs: data.progress_ms || 0,
    durationMs: data.duration_ms || 0,
    spotifyUrl: data.spotifyUrl || '',
  };
  
  if (isNewTrack) {
    updateCover(data.albumImage);
    setTimeout(updateMarquee, 100);
  }
  
  updateProgress(trackState.progressMs, trackState.durationMs);
  updatePlayPauseButtonLabel(trackState.playing);
  
  if (trackState.playing) {
    startProgressLoop();
  } else {
    stopProgress();
  }
  
  queueSection.classList.remove('hidden');
  accountStatus.textContent = `Account ${currentAccount} • ${data.playing ? 'Playing' : 'Paused'}`;
}

// ========================================
// FETCH FUNCTIONS
// ========================================

async function fetchQueue() {
  try {
    const res = await fetch(getQueueApiUrl(), { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.queue || data.items || data.tracks || [];
  } catch {
    return [];
  }
}

async function fetchCurrentlyPlaying() {
  const res = await fetch(getSpotifyApiUrl(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ========================================
// MAIN REFRESH - AUTOMATIC!
// ========================================

async function refreshAll() {
  try {
    const data = await fetchCurrentlyPlaying();
    renderDevice(data.device || null);
    
    const queue = await fetchQueue();
    renderQueue(queue);
    
    if (!data.playing) {
      if (data.song) {
        renderPlayingState(data);
      } else {
        renderIdleState();
      }
    } else {
      renderPlayingState(data);
    }
  } catch (error) {
    console.error('Refresh error:', error);
    renderErrorState(error.message);
  }
}

function scheduleRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
}

// ========================================
// ACCOUNT SWITCHING
// ========================================

function switchAccount(account) {
  currentAccount = parseInt(account);
  currentTrackId = null; // Reset para ma-force ang update
  stopProgress();
  accountStatus.textContent = `Account ${currentAccount} • Loading...`;
  refreshAll();
}

// ========================================
// EVENT LISTENERS
// ========================================

copyLinkButton.addEventListener('click', async () => {
  if (!trackState.spotifyUrl) return;
  try {
    await navigator.clipboard.writeText(trackState.spotifyUrl);
    setStateMessage('✅ Link copied!');
  } catch {
    setStateMessage('❌ Copy failed.');
  }
});

previousButton.addEventListener('click', handlePreviousTrack);
playPauseButton.addEventListener('click', handlePlayPause);
nextButton.addEventListener('click', handleNextTrack);

accountSelect.addEventListener('change', (e) => switchAccount(e.target.value));

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const account = params.get('account');
  if (account) {
    currentAccount = parseInt(account);
    accountSelect.value = currentAccount;
  }
  
  refreshAll();
  scheduleRefresh();
});
