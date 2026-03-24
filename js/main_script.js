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
