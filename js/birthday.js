let currentPage = 1;
let totalPages = 6;
let typingFlags = {3:false,5:false,6:false};
let cakeClicked = false;

// Countdown
function startCountdown(){
    let count = 3;
    let el = document.getElementById("count");
    let i = setInterval(()=>{
        el.textContent = count--;
        if(count < 0){
            clearInterval(i);
            nextPage();
        }
    },1000);
}

// Page navigation
function nextPage(){
    document.getElementById("page"+currentPage).classList.remove("active");
    document.getElementById("page"+currentPage).classList.add("prev");
    currentPage++;
    if(currentPage <= totalPages){
        document.getElementById("page"+currentPage).classList.add("active");
        if(currentPage === 3 && !typingFlags[3]){
            startTypingMessage('message3','Happy 19th Birthday 💖 Wishing you a day filled with laughter, love, and unforgettable memories. May this year bring you endless joy, exciting adventures, and dreams coming true ✨','nextMsg3Btn',3);
        }
        if(currentPage === 5 && !typingFlags[5]){
            startTypingMessage('typing',`Eden Ira, you are one of the most amazing people I’ve ever known. 
Your smile lights up every room, your kindness touches every heart, and 
your energy makes life feel magical. At 19, I know incredible adventures, 
love, laughter, and growth are all waiting for you. Keep shining, keep dreaming, 
and never forget how much you are loved and cherished. You make the world 
a brighter place just by being in it, and I feel so lucky to celebrate this 
special day with you. Happy Birthday! 💖✨🎉`,'nextTypingBtn',5);
        }
    }
}

// Cake click
function changeCake(){
    const cake = document.getElementById("cake");
    cake.textContent = "🎂";
    document.getElementById("nextCakeBtn").disabled = false;

    if (!cakeClicked) {
        const song = document.getElementById('birthdaySong');
        song.play();
        cakeClicked = true;
    }
}

// Gallery scroll check
const gallery = document.getElementById("gallery");
const nextGalleryBtn = document.getElementById("nextGalleryBtn");
gallery.addEventListener("scroll", ()=>{
    const scrollLeft = gallery.scrollLeft;
    const maxScroll = gallery.scrollWidth - gallery.clientWidth;
    nextGalleryBtn.disabled = scrollLeft < maxScroll - 3;
});

const gallery = document.getElementById("gallery");
const nextGalleryBtn = document.getElementById("nextGalleryBtn");

function checkGalleryScroll() {
    const maxScroll = gallery.scrollWidth - gallery.clientWidth;

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
