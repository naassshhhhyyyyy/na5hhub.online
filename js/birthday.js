// ========== STATE ==========
let currentPage = 1;
const totalPages = 6;
let typingFlags = { 3: false, 5: false, 6: false };
let cakeClicked = false;
let activeTypingInterval = null;

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

// ========== HELPER: PAGE TRANSITION ==========
function goToNextPage() {
  if (currentPage >= totalPages) return;

  // Remove active from current
  const currentPageDiv = document.getElementById(`page${currentPage}`);
  currentPageDiv.classList.remove('active');
  currentPageDiv.classList.add('prev');

  currentPage++;
  const nextPageDiv = document.getElementById(`page${currentPage}`);
  nextPageDiv.classList.add('active');

  // Trigger page-specific actions
  if (currentPage === 3 && !typingFlags[3]) {
    startTypingEffect('message3', 
      "Happy 19th Birthday 💖 Wishing you a day filled with laughter, love, and unforgettable memories. May this year bring you endless joy, exciting adventures, and dreams coming true ✨",
      'nextMsg3Btn', 3);
  }
  else if (currentPage === 5 && !typingFlags[5]) {
    startTypingEffect('typing',
      "Eden Ira, you are one of the most amazing people I’ve ever known.\n\nYour smile lights up every room, your kindness touches every heart, and your energy makes life feel magical. At 19, I know incredible adventures, love, laughter, and growth are all waiting for you. Keep shining, keep dreaming, and never forget how much you are loved and cherished. You make the world a brighter place just by being in it, and I feel so lucky to celebrate this special day with you.\n\nHappy Birthday! 💖✨🎉",
      'nextTypingBtn', 5);
  }
  else if (currentPage === 4) {
    // Re-check gallery scroll status each time page 4 appears
    setTimeout(checkGalleryScroll, 80);
  }
}

// ========== COUNTDOWN with FIX (no infinite loop) ==========
function startCountdown() {
  let count = 3;
  countEl.textContent = count;
  const interval = setInterval(() => {
    count--;
    if (count >= 0) {
      countEl.textContent = count;
    }
    if (count < 0) {
      clearInterval(interval);
      // after countdown finishes, move to page 2 (cake)
      goToNextPage();
    }
  }, 1000);
}

// ========== TYPING ENGINE ==========
function startTypingEffect(elementId, fullMessage, btnId, flagKey) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // clear any previous inner content
  element.textContent = "";
  let index = 0;
  
  function typeCharacter() {
    if (index < fullMessage.length) {
      element.textContent += fullMessage.charAt(index);
      index++;
      setTimeout(typeCharacter, 28);
    } else {
      // typing finished
      if (btnId) {
        const btn = document.getElementById(btnId);
        if (btn) btn.disabled = false;
      }
      typingFlags[flagKey] = true;
      
      // special case for gift page (flagKey 6) -> show spotify after text completes
      if (flagKey === 6 && spotifyContainer) {
        spotifyContainer.classList.add('show');
      }
    }
  }
  
  typeCharacter();
}

// ========== CAKE CLICK & SONG ==========
function handleCakeClick() {
  if (cakeDiv.textContent === "🧁") {
    cakeDiv.textContent = "🎂";
    if (nextCakeBtn) nextCakeBtn.disabled = false;
    
    if (!cakeClicked) {
      // play birthday song
      if (birthdaySong) {
        birthdaySong.play().catch(e => console.log("Audio play blocked until user interaction"));
      }
      cakeClicked = true;
    }
  }
}

// ========== GALLERY SCROLL VALIDATION ==========
function checkGalleryScroll() {
  if (!gallery || !nextGalleryBtn) return;
  
  const maxScrollLeft = gallery.scrollWidth - gallery.clientWidth;
  // if gallery has no overflow, enable button immediately
  if (maxScrollLeft <= 1) {
    nextGalleryBtn.disabled = false;
    return;
  }
  // reached end? (allow small threshold)
  const atEnd = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 8;
  nextGalleryBtn.disabled = !atEnd;
}

// ========== GIFT FLY + TYPING ==========
function handleGiftOpen() {
  if (!giftBox) return;
  // Prevent multiple triggers
  if (giftBox.classList.contains('flyAway')) return;
  
  giftBox.classList.add('flyAway');
  
  // After animation, hide gift and start typing message
  giftBox.addEventListener('animationend', () => {
    giftBox.style.display = 'none';
    if (giftTitle) giftTitle.textContent = "Hope you loved your surprise! 💕";
    if (!typingFlags[6]) {
      startTypingEffect('giftText', 
        "Surprise! 🎉 You are truly special and loved 💕 Every moment with you is a treasure. May this year overflow with happiness and everything you wish for! 🌟",
        null, 6);
      typingFlags[6] = true;
    }
  }, { once: true });
}

// ========== DARK MODE TOGGLE ==========
function toggleTheme() {
  document.body.classList.toggle('dark');
  const toggleBtn = document.getElementById('themeToggle');
  if (document.body.classList.contains('dark')) {
    toggleBtn.textContent = "☀️";
  } else {
    toggleBtn.textContent = "🌙";
  }
}

// ========== SWIPE GESTURE (touch) ==========
let touchStartX = 0;
function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
}
function handleTouchEnd(e) {
  if (currentPage >= totalPages) return;
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchStartX - touchEndX;
  if (diff > 55) {  // swipe left → next page
    goToNextPage();
  }
}

// ========== EVENT LISTENERS ==========
function bindEvents() {
  if (cakeDiv) cakeDiv.addEventListener('click', handleCakeClick);
  if (nextCakeBtn) nextCakeBtn.addEventListener('click', goToNextPage);
  if (nextMsg3Btn) nextMsg3Btn.addEventListener('click', goToNextPage);
  if (nextGalleryBtn) nextGalleryBtn.addEventListener('click', goToNextPage);
  if (nextTypingBtn) nextTypingBtn.addEventListener('click', goToNextPage);
  if (giftBox) giftBox.addEventListener('click', handleGiftOpen);
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Gallery scroll detection
  if (gallery) {
    gallery.addEventListener('scroll', checkGalleryScroll);
    // also observe resize or image loads
    window.addEventListener('resize', () => setTimeout(checkGalleryScroll, 100));
  }
  
  // Swipe events
  document.addEventListener('touchstart', handleTouchStart);
  document.addEventListener('touchend', handleTouchEnd);
  
  // Prevent accidental double navigation from next buttons while typing (buttons disabled until ready)
}

// ========== ADDITIONAL: ensure gallery button on page 4 is rechecked if images lazy load ==========
function observeGallery() {
  if (!gallery) return;
  const observer = new ResizeObserver(() => {
    if (currentPage === 4) checkGalleryScroll();
  });
  observer.observe(gallery);
  // also check when DOM fully ready
  if (currentPage === 4) setTimeout(checkGalleryScroll, 150);
}

// ========== FIX: Preload first page, countdown works, no redirects ==========
// We removed any redirect / sessionStorage logic because it blocked countdown.
// Just pure birthday experience.

window.addEventListener('DOMContentLoaded', () => {
  // Ensure page1 active, others hidden properly
  pages.forEach((page, idx) => {
    if (idx === 0) {
      page.classList.add('active');
      page.classList.remove('prev');
    } else {
      page.classList.remove('active');
      page.classList.remove('prev');
    }
  });
  
  // set initial state for buttons
  nextCakeBtn.disabled = true;
  nextMsg3Btn.disabled = true;
  nextGalleryBtn.disabled = true;
  nextTypingBtn.disabled = true;
  
  bindEvents();
  observeGallery();
  // start countdown after a tiny delay to ensure render
  setTimeout(() => {
    startCountdown();
  }, 50);
});

// Ensure that if someone clicks next too quickly (disabled), it's fine.
// Also add fallback for gallery check if scrollWidth changes
window.addEventListener('load', () => {
  if (currentPage === 4) checkGalleryScroll();
  // Preload song interaction hint: user must click cake to play audio (respects browser policies)
});

// manually fix any leftover next button for gallery
setInterval(() => {
  if (currentPage === 4 && gallery && nextGalleryBtn) {
    checkGalleryScroll();
  }
}, 400);
    // If no scroll needed → enable button immediately
    if (maxScroll <= 0) {
        nextGalleryBtn.disabled = false;
        return;
    }

    // Enable only when user reaches end
    nextGalleryBtn.disabled = gallery.scrollLeft < maxScroll - 1;
}

// Run on scroll
gallery.addEventListener("scroll", checkGalleryScroll);

// Run once when page loads
window.addEventListener("load", checkGalleryScroll);

// Generic typing function
function startTypingMessage(elId,message,btnId,flagId){
    const el = document.getElementById(elId);
    const btn = btnId ? document.getElementById(btnId) : null;
    el.textContent = "";
    let i=0;
    function type(){
        if(i<message.length){
            el.textContent += message.charAt(i);
            i++;
            setTimeout(type,30);
        } else {
            if(btn) btn.disabled=false;
            typingFlags[flagId] = true;
            if(elId==='giftText'){
                document.getElementById('spotify').classList.add('show');
            }
        }
    }
    type();
}

// Gift fly-away and start typing after fly-away
function openGift(){
    const giftBox = document.getElementById("giftBox");
    const giftTitle = document.getElementById("giftTitle");
    giftBox.classList.add("flyAway");

    giftBox.addEventListener("animationend", ()=>{
        giftBox.style.display="none"; 
        giftTitle.textContent = "Hope you loved your surprise! 💕";
        startTypingMessage('giftText','Surprise! 🎉 You are truly special and loved 💕','',6);
    }, { once:true });
}

// Toggle dark mode
function toggleTheme(){document.body.classList.toggle("dark");}

// Swipe to next page
let startX = 0;
document.addEventListener("touchstart", e => startX = e.touches[0].clientX);
document.addEventListener("touchend", e => {
    let endX = e.changedTouches[0].clientX;
    if(startX - endX > 60 && currentPage < totalPages) nextPage();
});

window.onload = startCountdown;

window.addEventListener("DOMContentLoaded", () => {
    const gallery = document.getElementById("gallery");
    const nextGalleryBtn = document.getElementById("nextGalleryBtn");

    if (!gallery || !nextGalleryBtn) return;

    function checkGalleryScroll() {
        const maxScroll = gallery.scrollWidth - gallery.clientWidth;

        if (maxScroll <= 0) {
            nextGalleryBtn.disabled = false;
            return;
        }

        nextGalleryBtn.disabled = gallery.scrollLeft < maxScroll - 1;
    }

    gallery.addEventListener("scroll", checkGalleryScroll);
    checkGalleryScroll();
});

// Check if user is authenticated
  if (sessionStorage.getItem("authenticated") !== "true") {
    window.location.href = "/passcode"; // not authenticated → redirect
  }

  // Detect page reload
  if (performance.getEntriesByType("navigation")[0].type === "reload") {
    // Page refreshed → force passcode again
    sessionStorage.removeItem("authenticated");
    window.location.href = "/passcode";
  }

  // Optional: clear authentication on tab close
  window.addEventListener("beforeunload", () => {
    sessionStorage.removeItem("authenticated");
  });
