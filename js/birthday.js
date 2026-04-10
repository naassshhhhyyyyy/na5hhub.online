// ========== STATE ==========
let currentPage = 1;
const totalPages = 6;
let typingFlags = { 3: false, 5: false, 6: false };
let cakeClicked = false;

// DOM elements
const pages = document.querySelectorAll('.page');
const countEl = document.getElementById('count');
const cakeDiv = document.getElementById('cake');
const nextCakeBtn = document.getElementById('nextCakeBtn');
const nextMsg3Btn = document.getElementById('nextMsg3Btn');
const nextGalleryBtn = document.getElementById('nextGalleryBtn');
const nextTypingBtn = document.getElementById('nextTypingBtn');
const gallery = document.getElementById('gallery');
const giftBox = document.getElementById('giftBox');
const giftTitle = document.getElementById('giftTitle');
const giftTextPara = document.getElementById('giftText');
const spotifyContainer = document.getElementById('spotifyContainer');
const birthdaySong = document.getElementById('birthdaySong');
const themeToggleBtn = document.getElementById('themeToggle');

// ========== SIMPLIFIED PAGE TRANSITION (FIXED) ==========
function goToPage(pageNum) {
  if (pageNum > totalPages) return;
  
  // Hide all pages
  for (let i = 1; i <= totalPages; i++) {
    const page = document.getElementById(`page${i}`);
    page.classList.remove('active');
    page.classList.add('prev');
  }
  
  // Show new page
  const newPage = document.getElementById(`page${pageNum}`);
  newPage.classList.remove('prev');
  newPage.classList.add('active');
  
  currentPage = pageNum;
  
  // Trigger page-specific actions
  if (currentPage === 3 && !typingFlags[3]) {
    startTyping('message3', 
      "Happy 19th Birthday 💖 Wishing you a day filled with laughter, love, and unforgettable memories. May this year bring you endless joy, exciting adventures, and dreams coming true ✨",
      'nextMsg3Btn', 3);
  }
  else if (currentPage === 5 && !typingFlags[5]) {
    startTyping('typing',
      "Eden Ira, you are one of the most amazing people I've ever known.\n\nYour smile lights up every room, your kindness touches every heart, and your energy makes life feel magical. At 19, I know incredible adventures, love, laughter, and growth are all waiting for you. Keep shining, keep dreaming, and never forget how much you are loved and cherished. You make the world a brighter place just by being in it, and I feel so lucky to celebrate this special day with you.\n\nHappy Birthday! 💖✨🎉",
      'nextTypingBtn', 5);
  }
  else if (currentPage === 4) {
    setTimeout(checkGalleryScroll, 100);
  }
}

function nextPage() {
  goToPage(currentPage + 1);
}

// ========== COUNTDOWN - FIXED (hindi na stuck) ==========
function startCountdown() {
  let count = 3;
  countEl.textContent = count;
  
  const timer = setInterval(() => {
    count--;
    
    if (count >= 0) {
      countEl.textContent = count;
    }
    
    if (count < 0) {
      clearInterval(timer);
      // Move to cake page (page 2)
      goToPage(2);
    }
  }, 1000);
}

// ========== TYPING EFFECT ==========
function startTyping(elementId, message, btnId, flagKey) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.textContent = "";
  let i = 0;
  
  function typeChar() {
    if (i < message.length) {
      element.textContent += message.charAt(i);
      i++;
      setTimeout(typeChar, 30);
    } else {
      // Typing done
      if (btnId) {
        const btn = document.getElementById(btnId);
        if (btn) btn.disabled = false;
      }
      typingFlags[flagKey] = true;
      
      // For gift page, show Spotify
      if (flagKey === 6 && spotifyContainer) {
        spotifyContainer.classList.add('show');
      }
    }
  }
  
  typeChar();
}

// ========== CAKE CLICK ==========
function handleCakeClick() {
  if (cakeDiv.textContent === "🧁") {
    cakeDiv.textContent = "🎂";
    nextCakeBtn.disabled = false;
    
    if (!cakeClicked) {
      birthdaySong.play().catch(e => console.log("Click first to play audio"));
      cakeClicked = true;
    }
  }
}

// ========== GALLERY SCROLL ==========
function checkGalleryScroll() {
  if (!gallery || !nextGalleryBtn) return;
  
  const maxScroll = gallery.scrollWidth - gallery.clientWidth;
  
  if (maxScroll <= 5) {
    nextGalleryBtn.disabled = false;
    return;
  }
  
  const atEnd = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 10;
  nextGalleryBtn.disabled = !atEnd;
}

// ========== GIFT OPEN ==========
function handleGiftOpen() {
  if (!giftBox || giftBox.classList.contains('flyAway')) return;
  
  giftBox.classList.add('flyAway');
  
  giftBox.addEventListener('animationend', () => {
    giftBox.style.display = 'none';
    giftTitle.textContent = "Hope you loved your surprise! 💕";
    
    if (!typingFlags[6]) {
      startTyping('giftText', 
        "Surprise! 🎉 You are truly special and loved 💕 Every moment with you is a treasure. May this year overflow with happiness! 🌟",
        null, 6);
      typingFlags[6] = true;
    }
  }, { once: true });
}

// ========== DARK MODE ==========
function toggleTheme() {
  document.body.classList.toggle('dark');
  themeToggleBtn.textContent = document.body.classList.contains('dark') ? "☀️" : "🌙";
}

// ========== SWIPE GESTURE ==========
let touchStart = 0;
document.addEventListener('touchstart', (e) => {
  touchStart = e.touches[0].clientX;
});

document.addEventListener('touchend', (e) => {
  if (currentPage >= totalPages) return;
  const touchEnd = e.changedTouches[0].clientX;
  if (touchStart - touchEnd > 55) {
    nextPage();
  }
});

// ========== EVENT LISTENERS ==========
cakeDiv.addEventListener('click', handleCakeClick);
nextCakeBtn.addEventListener('click', nextPage);
nextMsg3Btn.addEventListener('click', nextPage);
nextGalleryBtn.addEventListener('click', nextPage);
nextTypingBtn.addEventListener('click', nextPage);
giftBox.addEventListener('click', handleGiftOpen);
themeToggleBtn.addEventListener('click', toggleTheme);

if (gallery) {
  gallery.addEventListener('scroll', checkGalleryScroll);
  window.addEventListener('resize', () => setTimeout(checkGalleryScroll, 100));
}

// ========== INITIALIZE ==========
// Make sure page 1 is active
for (let i = 1; i <= totalPages; i++) {
  const page = document.getElementById(`page${i}`);
  if (i === 1) {
    page.classList.add('active');
    page.classList.remove('prev');
  } else {
    page.classList.remove('active');
    page.classList.add('prev');
  }
}

// Start countdown immediately
startCountdown();
