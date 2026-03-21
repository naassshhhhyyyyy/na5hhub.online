const toggle = document.getElementById('toggle');

// Apply saved theme immediately
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light');
  toggle.querySelector('i').className = 'fas fa-sun';
} else {
  document.body.classList.remove('light');
  toggle.querySelector('i').className = 'fas fa-moon';
}

// Toggle function (global)
window.toggleTheme = function() {
  const isLight = document.body.classList.toggle('light');
  toggle.classList.toggle('rotate');
  toggle.querySelector('i').className = isLight ? 'fas fa-sun' : 'fas fa-moon';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
};

// Random quote
const quotes = [
  "Keep experimenting 🚀", 
  "Build cool things 💻", 
  "Stay creative 🎨", 
  "Make it happen ⚡"
];
document.getElementById('quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];
