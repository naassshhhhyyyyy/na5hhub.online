const quotes = [
  "Keep experimenting 🚀",
  "Build cool things 💻",
  "Stay creative 🎨",
  "Make it happen ⚡"
];

document.getElementById('quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];

let hue = 0;

function setSmoothRainbowGradient() {
  hue += 0.5; // speed (lower = smoother/slower)

  const color1 = `hsl(${hue}, 80%, 60%)`;
  const color2 = `hsl(${hue + 90}, 80%, 60%)`;
  const color3 = `hsl(${hue + 180}, 80%, 60%)`;
  const color4 = `hsl(${hue + 270}, 80%, 60%)`;

  document.body.style.background = `
    linear-gradient(-45deg, ${color1}, ${color2}, ${color3}, ${color4})
  `;
}

// run smoothly (60fps)
setInterval(setSmoothRainbowGradient, 30);

function updateClock() {
  const now = new Date();

  // Philippine Time options
  const timeOptions = {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };

  const dateOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  };

  const timeString = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
  const dateString = new Intl.DateTimeFormat('en-US', dateOptions).format(now);

  document.getElementById('clock').innerText = `🇵🇭 ${timeString} — ${dateString}`;
}

// update every second
setInterval(updateClock, 1000);
updateClock();

function updateTextColor() {
  // Get computed background from body
  const bg = window.getComputedStyle(document.body).backgroundImage;

  // We'll approximate brightness using the hue (from your rainbow gradient)
  const colorRegex = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/g;
  const matches = [...bg.matchAll(colorRegex)];
  if (matches.length) {
    let totalLightness = 0;
    matches.forEach(m => totalLightness += parseInt(m[3]));
    const avgLightness = totalLightness / matches.length;

    // If light, use dark text, else white text
    document.body.style.color = avgLightness > 60 ? '#000' : '#fff';
  }
}

// Run every time gradient updates
setInterval(() => {
  setSmoothRainbowGradient();
  updateTextColor();
}, 30);
