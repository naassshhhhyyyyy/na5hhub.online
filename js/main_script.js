// Random Quote Widget
const quotes = [
  "Keep experimenting!",
  "Code is fun!",
  "Try new things.",
  "Creativity matters."
];

function generateQuote() {
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById('quote').innerText = random;
}

// Background Color Playground
const colors = ['#ff7e5f','#feb47b','#6a11cb','#2575fc','#43cea2','#185a9d'];
function changeColor() {
  const color = colors[Math.floor(Math.random()*colors.length)];
  document.body.style.background = color;
}

// === Anti Inspect / Anti DevTools ===

// Disable right-click
document.addEventListener('contextmenu', e => e.preventDefault());

// Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
document.addEventListener('keydown', e => {
    // F12
    if (e.key === "F12") e.preventDefault();
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") e.preventDefault();
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "j") e.preventDefault();
    // Ctrl+U (View source)
    if (e.ctrlKey && e.key.toLowerCase() === "u") e.preventDefault();
});

// Detect if DevTools is open (basic)
let devtools = false;
setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    if (widthThreshold || heightThreshold) {
        if (!devtools) {
            devtools = true;
            alert("DevTools detected! Please close it to continue.");
        }
    } else {
        devtools = false;
    }
}, 1000);
