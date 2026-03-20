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
