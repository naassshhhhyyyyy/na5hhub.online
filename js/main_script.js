const quotes = [
  "Keep experimenting 🚀",
  "Build cool things 💻",
  "Stay creative 🎨",
  "Make it happen ⚡"
];

document.getElementById('quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];

function randomColor() {
  const r = Math.floor(Math.random()*256);
  const g = Math.floor(Math.random()*256);
  const b = Math.floor(Math.random()*256);
  return `rgb(${r},${g},${b})`;
}

function setRandomGradient() {
  const color1 = randomColor();
  const color2 = randomColor();
  const color3 = randomColor();
  const color4 = randomColor();
  document.body.style.background = `linear-gradient(-45deg, ${color1}, ${color2}, ${color3}, ${color4})`;
}

setRandomGradient();
setInterval(setRandomGradient, 3000);
