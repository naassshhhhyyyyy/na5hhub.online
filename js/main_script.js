// Loader
window.addEventListener('load',()=>{
  document.getElementById('loader').classList.add('hidden');
});

// Quotes
const quotes=["Keep experimenting 🚀","Build cool things 💻","Stay creative 🎨","Make it happen ⚡"];
document.getElementById('quote').innerText=
  quotes[Math.floor(Math.random()*quotes.length)];

// Theme Toggle
function toggleTheme(){
  document.body.classList.toggle('light');
  document.getElementById('toggle').classList.toggle('rotate');

  const icon=document.querySelector('.toggle i');
  if(document.body.classList.contains('light')){
    icon.className='fas fa-sun';
  }else{
    icon.className='fas fa-moon';
  }

  localStorage.setItem('theme',document.body.classList.contains('light')?'light':'dark');
}

// Load saved theme
if(localStorage.getItem('theme')==='light'){
  document.body.classList.add('light');
  document.querySelector('.toggle i').className='fas fa-sun';
}

// Visitor Counter (total visits)
fetch('https://api.countapi.xyz/hit/na5hhub/visits')
.then(res=>res.json())
.then(data=>{
  document.getElementById('counter').innerText=`Visitors: ${data.value}`;
});

// Live Viewers (approximate)
fetch('https://api.countapi.xyz/hit/na5hhub/online')
.then(res=>res.json())
.then(data=>{
  const liveEl = document.createElement('p');
  liveEl.className = 'counter';
  liveEl.id = 'live';
  liveEl.innerText = `Live now: ${data.value}`;
  document.querySelector('.container').appendChild(liveEl);
});

// decrement when leaving page
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('https://api.countapi.xyz/update/na5hhub/online?amount=-1');
});
