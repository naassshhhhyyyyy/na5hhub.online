const clientId = "d987c23e04b64a03952bb01858b6a3e3"; // Your Spotify Client ID
const redirectUri = "https://spotify.com";            // Your redirect URI
const scopes = "user-read-currently-playing";

// Elements
const loginBtn = document.getElementById('login-btn');
const loginSection = document.getElementById('login-section');
const nowPlayingSection = document.getElementById('now-playing');
const trackName = document.getElementById('track-name');
const artistName = document.getElementById('artist-name');
const albumArt = document.getElementById('album-art');
const refreshBtn = document.getElementById('refresh-btn');

// Check if URL has access token
function getAccessTokenFromUrl() {
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  return params.get("access_token");
}

// Login button
loginBtn.addEventListener('click', () => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  window.location = authUrl;
});

// Fetch currently playing track
async function getCurrentlyPlaying(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 204 || response.status > 400) {
      trackName.textContent = "Not playing anything";
      artistName.textContent = "";
      albumArt.src = "";
      return;
    }

    const data = await response.json();
    trackName.textContent = data.item.name;
    artistName.textContent = data.item.artists.map(a => a.name).join(', ');
    albumArt.src = data.item.album.images[0].url;

  } catch (err) {
    console.error(err);
    trackName.textContent = "Error fetching data";
    artistName.textContent = "";
    albumArt.src = "";
  }
}

// Refresh button
refreshBtn.addEventListener('click', () => {
  getCurrentlyPlaying(window.accessToken);
});

// On page load
window.addEventListener('load', () => {
  const token = getAccessTokenFromUrl();
  if (token) {
    window.accessToken = token;
    loginSection.style.display = 'none';
    nowPlayingSection.style.display = 'flex';
    getCurrentlyPlaying(token);
  }
});
