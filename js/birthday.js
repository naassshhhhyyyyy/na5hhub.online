// ========== STATE ==========
let currentPage = 1;
const pages = document.querySelectorAll('.page');
const totalPages = pages.length;

let typingFlags = { 3: false, 5: false, 6: false };
let cakeClicked = false;

// DOM elements
const countEl = document.getElementById('count');
const cakeDiv = document.getElementById('cake');
const nextCakeBtn = document.getElementById('nextCakeBtn');
const nextMsg3Btn = document.getElementById('nextMsg3Btn');
const nextTypingBtn = document.getElementById('nextTypingBtn');
const giftBox = document.getElementById('giftBox');
const giftTitle = document.getElementById('giftTitle');
const spotifyContainer = document.getElementById('spotifyContainer');
const birthdaySong = document.getElementById('birthdaySong');
const themeToggleBtn = document.getElementById('themeToggle');

// ========== PAGE TRANSITION ==========
function goToPage(pageNum) {
  if (pageNum > totalPages) return;

  // Hide all pages safely
  pages.forEach(page => {
    page.classList.remove('active');
    page.classList.add('prev');
  });

  const newPage = pages[pageNum - 1];
  if (!newPage) return;

  newPage.classList.remove('prev');
  newPage.classList.add('active');

  currentPage = pageNum;

  // Page-specific actions
  if (currentPage === 3 && !typingFlags[3]) {
    startTyping(
      'message3',
      "Happy 19th Birthday 💖 Wishing you a day filled with laughter, love, and unforgettable memories. May this year bring you endless joy, exciting adventures, and dreams coming true ✨",
      'nextMsg3Btn',
      3
    );
  }

  else if (currentPage === 4 && !typingFlags[5]) {
    startTyping(
      'typing',
      "Eden Ira, you are one of the most amazing people I've ever known.\n\nYour smile lights up every room, your kindness touches every heart, and your energy makes life feel magical. At 19, I know incredible adventures, love, laughter, and growth are all waiting for you. Keep shining, keep dreaming, and never forget how much you are loved and cherished. You make the world a brighter place just by being in it, and I feel so lucky to celebrate this special day with you.\n\nHappy Birthday! 💖✨🎉",
      'nextTypingBtn',
      5
    );
  }
}

// Next page
function nextPage() {
  goToPage(currentPage + 1);
}

// ========== COUNTDOWN ==========
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
      if (btnId) {
        const btn = document.getElementById(btnId);
        if (btn) btn.disabled = false;
      }

      typingFlags[flagKey] = true;

      if (flagKey === 5 && spotifyContainer) {
        spotifyContainer.classList.add('show');
      }
    }
  }

  typeChar();
}

// ========== CAKE CLICK ==========
function handleCakeClick(e) {
  e.stopPropagation();

  if (cakeDiv.textContent === "🧁") {
    cakeDiv.textContent = "🎂";
    nextCakeBtn.disabled = false;

    if (!cakeClicked) {
      birthdaySong.play().catch(() => {
        document.body.addEventListener('click', function playOnce() {
          birthdaySong.play().catch(() => {});
          document.body.removeEventListener('click', playOnce);
        }, { once: true });
      });

      cakeClicked = true;
    }
  }
}

// ========== GIFT OPEN ==========
function handleGiftOpen(e) {
  e.stopPropagation();

  if (!giftBox || giftBox.classList.contains('flyAway')) return;

  giftBox.classList.add('flyAway');

  giftBox.addEventListener('animationend', () => {
    giftBox.style.display = 'none';
    giftTitle.textContent = "Hope you loved your surprise! 💕";

    if (!typingFlags[6]) {
      startTyping(
        'giftText',
        "Surprise! 🎉 You are truly special and loved 💕 Every moment with you is a treasure. May this year overflow with happiness! 🌟",
        null,
        6
      );
      typingFlags[6] = true;
    }
  }, { once: true });
}

// ========== DARK MODE ==========
function toggleTheme() {
  document.body.classList.toggle('dark');
  themeToggleBtn.textContent =
    document.body.classList.contains('dark') ? "☀️" : "🌙";
}

// ========== SWIPE ==========
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

// ========== KEYBOARD ==========
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault();
  }

  if (e.key === 'ArrowRight' && currentPage < totalPages) {
    let canProceed = true;

    if (currentPage === 2 && nextCakeBtn.disabled) canProceed = false;
    if (currentPage === 3 && nextMsg3Btn.disabled) canProceed = false;
    if (currentPage === 4 && nextTypingBtn.disabled) canProceed = false;

    if (canProceed) nextPage();
  }
});

// ========== EVENTS ==========
if (cakeDiv) {
  cakeDiv.addEventListener('click', handleCakeClick);
  cakeDiv.addEventListener('touchstart', handleCakeClick);
}

if (nextCakeBtn) nextCakeBtn.addEventListener('click', nextPage);
if (nextMsg3Btn) nextMsg3Btn.addEventListener('click', nextPage);
if (nextTypingBtn) nextTypingBtn.addEventListener('click', nextPage);

if (giftBox) {
  giftBox.addEventListener('click', handleGiftOpen);
  giftBox.addEventListener('touchstart', handleGiftOpen);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', toggleTheme);
}

// ========== INITIALIZE ==========
pages.forEach((page, index) => {
  if (index === 0) {
    page.classList.add('active');
    page.classList.remove('prev');
  } else {
    page.classList.remove('active');
    page.classList.add('prev');
  }
});

// Start countdown
startCountdown();

// Enable audio preload
document.body.addEventListener('click', function () {
  if (birthdaySong && birthdaySong.paused && !cakeClicked) {
    birthdaySong.load();
  }
}, { once: true });

console.log("Ready! Click the cupcake 🧁 to start the party!");
