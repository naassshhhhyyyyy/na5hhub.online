const quotes = [
  "Keep experimenting 🚀", 
  "Build cool things 💻", 
  "Stay creative 🎨", 
  "Make it happen ⚡"
];
document.getElementById('quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];

const toggle = document.getElementById('toggle');

window.toggleTheme = function() {
  document.body.classList.toggle('light');
  toggle.classList.toggle('rotate');

  const icon = toggle.querySelector('i');
  icon.className = document.body.classList.contains('light') ? 'fas fa-sun' : 'fas fa-moon';

  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
};

if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  toggle.querySelector('i').className = 'fas fa-sun';
}
