// Replace this with your actual Spotify OAuth access token
const accessToken = "BQDp1234xyzABC";

const trackName = document.getElementById('track-name');
const artistName = document.getElementById('artist-name');
const albumArt = document.getElementById('album-art');
const refreshBtn = document.getElementById('refresh-btn');

async function getCurrentlyPlaying() {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 204 || response.status > 400) {
      trackName.textContent = "Not playing anything";
      artistName.textContent = "";
      albumArt.src = "";
      return;
    }

    const data = await response.json();

    trackName.textContent = data.item.name;
    artistName.textContent = data.item.artists.map(artist => artist.name).join(', ');
    albumArt.src = data.item.album.images[0].url;

  } catch (error) {
    console.error(error);
    trackName.textContent = "Error fetching data";
    artistName.textContent = "";
    albumArt.src = "";
  }
}

refreshBtn.addEventListener('click', getCurrentlyPlaying);

// Fetch automatically on load
getCurrentlyPlaying();
