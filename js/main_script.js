const quotes = [
  "Keep experimenting 🚀", 
  "Build cool things 💻", 
  "Stay creative 🎨", 
  "Make it happen ⚡"
];

document.getElementById('quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];
