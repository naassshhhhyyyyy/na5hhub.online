// ======================
// Loader: always show 3 seconds
// ======================
const loader = document.getElementById('loader');
setTimeout(() => {
  loader.classList.add('hidden'); // smooth fade out
}, 3000);

// ======================
// Random Quote
// ======================
const quotes = [
  "Keep experimenting 🚀", 
  "Build cool things 💻", 
  "Stay creative 🎨", 
  "Make it happen ⚡"
];
document.getElementById('quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];

// ======================
// Theme Toggle
// ======================
const toggle = document.getElementById('toggle');

function toggleTheme() {
  document.body.classList.toggle('light');
  toggle.classList.toggle('rotate');

  const icon = toggle.querySelector('i');
  icon.className = document.body.classList.contains('light') ? 'fas fa-sun' : 'fas fa-moon';

  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

// Load saved theme immediately
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  toggle.querySelector('i').className = 'fas fa-sun';
}
