const API_BASE = 'https://spotify-auth-g08f.onrender.com';
const REFRESH_INTERVAL = 2000;
const PAUSE_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const ACTION_PASSWORD_STORAGE_KEY = '2007';

let currentAccount = 1;
let refreshTimer = null;
let progressAnimation = null;
let currentTrackId = null;
let pausedSince = null;

// DOM Elements - with null checks
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
// STATE MESSAGE WITH AUTO-DISMISS
// ========================================

let stateMessageTimeout = null;
let defaultStateMessage = '🎵 Waiting for music to play...';

function setStateMessage(text, autoDismiss = true) {
  if (stateMessageTimeout) {
    clearTimeout(stateMessageTimeout);
    stateMessageTimeout = null;
  }
  
  if (stateMessage) {
    stateMessage.textContent = text;
  }
  
  if (autoDismiss) {
    stateMessageTimeout = setTimeout(() => {
      if (stateMessage) {
        stateMessage.textContent = defaultStateMessage;
      }
      stateMessageTimeout = null;
    }, 5000);
  }
}

function updateDefaultStateMessage(message) {
  defaultStateMessage = message;
  if (!stateMessageTimeout && stateMessage) {
    stateMessage.textContent = message;
  }
}

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
  if (statusText) {
    statusText.textContent = text;
  }
  if (statusBadge) {
    statusBadge.className = `status-badge ${variant}`;
  }
}

function updatePlayPauseButtonLabel(isPlaying) {
  if (playPauseButton) {
    playPauseButton.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
  }
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
    setStateMessage('⏮ Moved to previous track.', true);
    await refreshAll();
  } catch (error) {
    setStateMessage('❌ ' + (error.message || 'Unable to change track.'), true);
  }
}

async function handlePlayPause() {
  try {
    await protectedAction('toggle play/pause', getToggleApiUrl(), 'PUT');
    await refreshAll();
    setStateMessage('⏯ Playback toggled.', true);
  } catch (error) {
    setStateMessage('❌ ' + (error.message || 'Unable to toggle playback.'), true);
  }
}

async function handleNextTrack() {
  try {
    await protectedAction('go to the next track', getNextApiUrl());
    setStateMessage('⏭ Moved to next track.', true);
    await refreshAll();
  } catch (error) {
    setStateMessage('❌ ' + (error.message || 'Unable to change track.'), true);
  }
}

// ========================================
// UI UPDATES
// ========================================

function updateMarquee() {
  if (titleElement && titleContainer) {
    if (titleElement.scrollWidth > titleContainer.offsetWidth) {
      titleElement.style.animation = 'marquee 12s linear infinite';
    } else {
      titleElement.style.animation = 'none';
    }
  }
}

function updateProgress(currentMs, durationMs) {
  if (progressBar) {
    const ratio = durationMs ? Math.min((currentMs / durationMs) * 100, 100) : 0;
    progressBar.style.width = `${ratio}%`;
  }
  if (currentTime) {
    currentTime.textContent = formatTime(currentMs);
  }
  if (durationTime) {
    durationTime.textContent = formatTime(durationMs);
  }
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
  if (!coverImage) return;
  
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
  if (!artists) return ['Unknown'];
  if (typeof artists === 'string') return [artists];
  if (!Array.isArray(artists)) return ['Unknown'];
  return artists.map(a => {
    if (typeof a === 'string') return a;
    if (a && a.name) return a.name;
    return 'Unknown';
  }).filter(Boolean);
}

// ========================================
// RENDER QUEUE - FIXED
// ========================================

function renderQueue(items) {
  if (!queueList) {
    console.warn('⚠ Queue list element not found');
    return;
  }
  
  queueList.innerHTML = '';
  
  if (!items || !items.length) {
    queueList.innerHTML = `
      <div class="queue-empty">
        <p style="margin:0;font-weight:500;">🎵 No upcoming tracks</p>
        <p style="margin:4px 0 0;font-size:0.85rem;color:#6b7a8a;">Queue will appear here when you have songs lined up</p>
      </div>
    `;
    return;
  }
  
  const displayItems = items.slice(0, 5);
  
  displayItems.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'queue-item';
    div.style.animationDelay = `${index * 0.05}s`;
    
    // Get artist names - handle all formats
    let artistNames = 'Unknown Artist';
    
    if (item.artists) {
      if (Array.isArray(item.artists)) {
        // Filter out any null/undefined values and join
        const validArtists = item.artists.filter(a => a && a !== '');
        if (validArtists.length > 0) {
          artistNames = validArtists.join(', ');
        }
      } else if (typeof item.artists === 'string' && item.artists !== '') {
        artistNames = item.artists;
      }
    }
    
    // Also check for artist field if artists is empty
    if (artistNames === 'Unknown Artist' && item.artist) {
      if (typeof item.artist === 'string') {
        artistNames = item.artist;
      }
    }
    
    const songName = item.song || item.name || 'Unknown track';
    const albumImage = item.albumImage || 
                       item.image || 
                       'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
    const duration = item.duration_ms || 0;
    
    div.innerHTML = `
      <img class="queue-thumb" 
           src="${albumImage}" 
           alt="${songName} album artwork" 
           loading="lazy"
           onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg'" />
      <div class="queue-labels">
        <p class="queue-track">${songName}</p>
        <p class="queue-artist">${artistNames}</p>
      </div>
      <span class="queue-duration">${formatTime(duration)}</span>
    `;
    queueList.appendChild(div);
  });
  
  if (items.length > 5) {
    const more = document.createElement('div');
    more.className = 'queue-empty';
    more.style.marginTop = '6px';
    more.style.padding = '10px';
    more.style.fontSize = '0.85rem';
    more.textContent = `+ ${items.length - 5} more tracks in queue`;
    queueList.appendChild(more);
  }
}

// ========================================
// RENDER DEVICE
// ========================================

function renderDevice(device) {
  const el = document.getElementById('device');
  
  if (!el) {
    console.warn('⚠ Device element not found in DOM');
    return;
  }
  
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
  if (titleElement) titleElement.textContent = 'No track playing';
  if (artistElement) artistElement.textContent = 'Playback is inactive';
  if (albumElement) albumElement.textContent = 'No playback activity';
  updateCover(null);
  if (spotifyLink) {
    spotifyLink.href = '#';
    spotifyLink.classList.add('disabled');
    spotifyLink.innerHTML = '⚠ Cannot open';
  }
  if (copyLinkButton) {
    copyLinkButton.disabled = true;
    copyLinkButton.classList.add('disabled');
  }
  updatePlayPauseButtonLabel(false);
  updateProgress(0, 0);
  if (queueSection) queueSection.classList.add('hidden');
  stopProgress();
  if (accountStatus) {
    accountStatus.textContent = `Account ${currentAccount} • Idle`;
  }
  updateDefaultStateMessage('💤 No track playing. Start some music!');
}

function renderErrorState(message) {
  setStatus('⚠ Offline', 'error');
  if (titleElement) titleElement.textContent = 'Spotify Offline';
  if (artistElement) artistElement.textContent = 'Unable to connect';
  if (albumElement) albumElement.textContent = message;
  updateCover(null);
  updatePlayPauseButtonLabel(false);
  updateProgress(0, 0);
  if (accountStatus) {
    accountStatus.textContent = `Account ${currentAccount} • Error`;
  }
  updateDefaultStateMessage('⚠ ' + message);
}

function renderPlayingState(data) {
  const trackId = data.song + data.album;
  const isNewTrack = trackId !== currentTrackId;
  
  if (isNewTrack) {
    currentTrackId = trackId;
    console.log(`🎵 Now Playing: ${data.song} - ${data.artists?.join(', ')}`);
  }
  
  setStatus(data.playing ? '🟢 Listening Now' : '🟡 Paused', data.playing ? 'live' : 'paused');
  if (titleElement) titleElement.textContent = data.song || 'Unknown';
  if (artistElement) artistElement.textContent = data.artists?.join(', ') || 'Unknown';
  if (albumElement) albumElement.textContent = data.album || 'Unknown';
  
  if (spotifyLink) {
    spotifyLink.href = data.spotifyUrl || '#';
    spotifyLink.classList.remove('disabled');
    spotifyLink.innerHTML = '♬ Open in Spotify';
  }
  
  if (copyLinkButton) {
    copyLinkButton.disabled = !data.spotifyUrl;
    copyLinkButton.classList.toggle('disabled', !data.spotifyUrl);
  }
  
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
  
  if (queueSection) queueSection.classList.remove('hidden');
  if (accountStatus) {
    accountStatus.textContent = `Account ${currentAccount} • ${data.playing ? 'Playing' : 'Paused'}`;
  }
  
  if (data.playing) {
    updateDefaultStateMessage(`🎵 Now playing: ${data.song} by ${data.artists?.join(', ') || 'Unknown'}`);
  } else {
    updateDefaultStateMessage(`⏸ Paused: ${data.song}`);
  }
}

// ========================================
// FETCH FUNCTIONS - FIXED QUEUE
// ========================================

async function fetchQueue() {
  try {
    const url = getQueueApiUrl();
    console.log('📋 Fetching queue from:', url);
    
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) {
      console.warn(`Queue API returned ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    console.log('📋 Queue response:', JSON.stringify(data, null, 2));
    
    let queueItems = [];
    
    // ========================================
    // SMART ARTIST EXTRACTION
    // ========================================
    
    function extractArtists(item) {
      // Log what we're looking at for debugging
      console.log('🔍 Extracting artists from:', item);
      
      // Try ALL possible artist formats
      
      // Format 1: artists array with objects { name: "..." }
      if (item.artists && Array.isArray(item.artists) && item.artists.length > 0) {
        const names = item.artists
          .map(a => {
            if (typeof a === 'string' && a) return a;
            if (a && typeof a === 'object' && a.name) return a.name;
            if (a && typeof a === 'object' && a.display_name) return a.display_name;
            return null;
          })
          .filter(Boolean);
        
        if (names.length > 0) {
          console.log('✅ Artists found (format 1):', names);
          return names;
        }
      }
      
      // Format 2: artist is a string or object
      if (item.artist) {
        if (typeof item.artist === 'string' && item.artist) {
          console.log('✅ Artists found (format 2):', [item.artist]);
          return [item.artist];
        }
        if (item.artist.name) {
          console.log('✅ Artists found (format 2b):', [item.artist.name]);
          return [item.artist.name];
        }
      }
      
      // Format 3: track object nested
      if (item.track) {
        if (item.track.artists && Array.isArray(item.track.artists)) {
          const names = item.track.artists
            .map(a => {
              if (typeof a === 'string' && a) return a;
              if (a && a.name) return a.name;
              return null;
            })
            .filter(Boolean);
          
          if (names.length > 0) {
            console.log('✅ Artists found (format 3):', names);
            return names;
          }
        }
        if (item.track.artist) {
          if (typeof item.track.artist === 'string' && item.track.artist) {
            console.log('✅ Artists found (format 3b):', [item.track.artist]);
            return [item.track.artist];
          }
          if (item.track.artist.name) {
            console.log('✅ Artists found (format 3c):', [item.track.artist.name]);
            return [item.track.artist.name];
          }
        }
      }
      
      // Format 4: artists is a string with comma separation
      if (item.artists && typeof item.artists === 'string') {
        const names = item.artists.split(',').map(a => a.trim()).filter(Boolean);
        if (names.length > 0) {
          console.log('✅ Artists found (format 4):', names);
          return names;
        }
      }
      
      // Format 5: artist_names field
      if (item.artist_names) {
        if (Array.isArray(item.artist_names)) {
          const names = item.artist_names.filter(Boolean);
          if (names.length > 0) {
            console.log('✅ Artists found (format 5):', names);
            return names;
          }
        }
        if (typeof item.artist_names === 'string') {
          const names = item.artist_names.split(',').map(a => a.trim()).filter(Boolean);
          if (names.length > 0) {
            console.log('✅ Artists found (format 5b):', names);
            return names;
          }
        }
      }
      
      console.warn('⚠ No artists found in item, returning Unknown Artist');
      return ['Unknown Artist'];
    }
    
    function extractSongName(item) {
      return item.song || 
             item.name || 
             item.title || 
             item.track?.name || 
             item.track?.title || 
             'Unknown Track';
    }
    
    function extractAlbumImage(item) {
      return item.albumImage || 
             item.image || 
             item.album?.images?.[0]?.url || 
             item.track?.album?.images?.[0]?.url ||
             item.album_image ||
             null;
    }
    
    function extractDuration(item) {
      return item.duration_ms || 
             item.duration || 
             item.track?.duration_ms || 
             0;
    }
    
    // ========================================
    // FIND QUEUE ARRAY
    // ========================================
    
    // Try all possible queue locations
    if (data.queue && Array.isArray(data.queue)) {
      queueItems = data.queue;
      console.log('📋 Found queue in data.queue');
    } else if (data.items && Array.isArray(data.items)) {
      queueItems = data.items;
      console.log('📋 Found queue in data.items');
    } else if (data.tracks && Array.isArray(data.tracks)) {
      queueItems = data.tracks;
      console.log('📋 Found queue in data.tracks');
    } else if (data.data && data.data.queue && Array.isArray(data.data.queue)) {
      queueItems = data.data.queue;
      console.log('📋 Found queue in data.data.queue');
    } else if (Array.isArray(data)) {
      queueItems = data;
      console.log('📋 Found queue as direct array');
    } else {
      // Search for any array in the response
      let found = false;
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          const first = data[key][0];
          // Check if it looks like a track item
          if (first && (first.name || first.song || first.track || first.artists)) {
            queueItems = data[key];
            console.log(`📋 Found queue in property: ${key}`);
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        console.warn('⚠ No queue array found in response');
      }
    }
    
    // ========================================
    // NORMALIZE QUEUE ITEMS
    // ========================================
    
    if (queueItems.length > 0) {
      console.log(`📋 Raw queue items: ${queueItems.length}`);
      
      queueItems = queueItems.map((item, index) => {
        const artists = extractArtists(item);
        const song = extractSongName(item);
        const image = extractAlbumImage(item);
        const duration = extractDuration(item);
        
        const normalized = {
          song: song,
          artists: artists,
          albumImage: image,
          duration_ms: duration
        };
        
        console.log(`📋 Item ${index + 1}:`, normalized);
        return normalized;
      });
    }
    
    console.log(`📋 Total queue items: ${queueItems.length}`);
    
    return queueItems;
    
  } catch (error) {
    console.error('Queue fetch error:', error);
    return [];
  }
}

async function fetchCurrentlyPlaying() {
  try {
    const url = getSpotifyApiUrl();
    console.log('🎵 Fetching currently playing from:', url);
    
    const res = await fetch(url, { cache: 'no-store' });
    
    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      console.warn('⚠ Account not configured:', data.error);
      return { 
        playing: false, 
        song: null,
        _error: data.error || 'Account not configured'
      };
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// ========================================
// MAIN REFRESH
// ========================================

async function refreshAll() {
  try {
    const data = await fetchCurrentlyPlaying();
    
    if (data && data._error) {
      setStatus('⚠ Account Issue', 'error');
      setStateMessage(`Account ${currentAccount}: ${data._error}`, false);
      if (accountStatus) {
        accountStatus.textContent = `Account ${currentAccount} • ⚠ Not Configured`;
      }
      updateDefaultStateMessage(`⚠ ${data._error}`);
      return;
    }
    
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
    setStateMessage('❌ ' + error.message, true);
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
  currentTrackId = null;
  stopProgress();
  if (accountStatus) {
    accountStatus.textContent = `Account ${currentAccount} • Loading...`;
  }
  setStateMessage(`🔄 Switching to Account ${currentAccount}...`, true);
  refreshAll();
}

// ========================================
// EVENT LISTENERS
// ========================================

if (copyLinkButton) {
  copyLinkButton.addEventListener('click', async () => {
    if (!trackState.spotifyUrl) return;
    try {
      await navigator.clipboard.writeText(trackState.spotifyUrl);
      setStateMessage('✅ Link copied to clipboard!', true);
    } catch {
      setStateMessage('❌ Copy failed. Please try again.', true);
    }
  });
}

if (previousButton) {
  previousButton.addEventListener('click', handlePreviousTrack);
}

if (playPauseButton) {
  playPauseButton.addEventListener('click', handlePlayPause);
}

if (nextButton) {
  nextButton.addEventListener('click', handleNextTrack);
}

if (accountSelect) {
  accountSelect.addEventListener('change', (e) => switchAccount(e.target.value));
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const account = params.get('account');
  if (account) {
    currentAccount = parseInt(account);
    if (accountSelect) {
      accountSelect.value = currentAccount;
    }
  }
  
  updateDefaultStateMessage('🎵 Loading Spotify...');
  refreshAll();
  scheduleRefresh();
});
