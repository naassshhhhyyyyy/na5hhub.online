// ======================
// Loader: always show 3 seconds
// ======================
const loader = document.getElementById('loader');

// Start loader immediately
loader.style.opacity = '1';
loader.style.pointerEvents = 'all';

// Hide loader after exactly 3 seconds
setTimeout(() => {
  loader.classList.add('hidden'); // uses your CSS fade-out
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
const quoteElement = document.getElementById('quote');
quoteElement.innerText = quotes[Math.floor(Math.random() * quotes.length)];

// ======================
// Theme Toggle
// ======================
const toggle = document.getElementById('toggle');

function toggleTheme() {
  document.body.classList.toggle('light');
  toggle.classList.toggle('rotate');

  const icon = toggle.querySelector('i');
  if (document.body.classList.contains('light')) {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }

  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

// Load saved theme immediately
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  toggle.querySelector('i').className = 'fas fa-sun';
}
