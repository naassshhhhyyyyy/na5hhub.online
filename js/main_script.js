// Loader: show exactly 3 seconds then hide smoothly
const loader = document.getElementById('loader');
setTimeout(() => {
  loader.classList.add('hidden'); // triggers CSS transition
}, 3000); // 3 seconds

// Quotes
const quotes = [
  "Keep experimenting 🚀", 
  "Build cool things 💻", 
  "Stay creative 🎨", 
  "Make it happen ⚡"
];
document.getElementById('quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];

// Theme Toggle
function toggleTheme() {
  document.body.classList.toggle('light');
  document.getElementById('toggle').classList.toggle('rotate');

  const icon = document.querySelector('.toggle i');
  if (document.body.classList.contains('light')) {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }

  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  document.querySelector('.toggle i').className = 'fas fa-sun';
}
