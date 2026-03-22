const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let tileSize, rows, cols;
let snake, food, direction, score, level, speed, gameInterval;
let gameRunning = false;
const levelSpeeds = [150,100,70];

// UI Elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const scoreDiv = document.getElementById('score');
const levelDiv = document.getElementById('level');
const levelSelect = document.getElementById('levelSelect');
const gameContainer = document.getElementById('gameContainer');
const menuDiv = document.getElementById('menuDiv');
const arrowControls = document.getElementById('arrowControls');
const infoBar = document.querySelector('.info-bar');

function resizeCanvas(){
  const container = document.getElementById('gameContainer');
  const size = Math.min(container.clientWidth, window.innerHeight*0.6);
  canvas.width = size;
  canvas.height = size;
  tileSize = Math.floor(size / 20);
  rows = Math.floor(size / tileSize);
  cols = rows;
}

function initGame(resetSpeed=true){
  resizeCanvas();
  snake = [{x: Math.floor(cols/2), y: Math.floor(rows/2)}];
  direction = 'right';
  score = 0;
  scoreDiv.innerText='Score: '+score;

  level = parseInt(levelSelect.value);
  if(resetSpeed) speed = levelSpeeds[level-1];
  levelDiv.innerText='Level: '+level;

  spawnFood();
  clearInterval(gameInterval);
  if(gameRunning) gameInterval=setInterval(gameLoop,speed);
}

function spawnFood(){
  food={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows)};
  if(snake.some(seg=>seg.x===food.x && seg.y===food.y)) spawnFood();
}

function changeDirection(newDir){
  const opposite={up:'down',down:'up',left:'right',right:'left'};
  if(newDir!==opposite[direction]) direction=newDir;
}

function gameLoop(){
  const head={...snake[0]};
  if(direction==='up') head.y--;
  if(direction==='down') head.y++;
  if(direction==='left') head.x--;
  if(direction==='right') head.x++;

  if(head.x<0) head.x=cols-1;
  if(head.x>=cols) head.x=0;
  if(head.y<0) head.y=rows-1;
  if(head.y>=rows) head.y=0;

  if(snake.some(seg=>seg.x===head.x && seg.y===head.y)){
    gameRunning=false;
    clearInterval(gameInterval);
    pauseBtn.style.display='none';
    restartBtn.style.display='inline-block';
    menuBtn.style.display='inline-block';
    alert('Game Over! Score: '+score);
    return;
  }

  snake.unshift(head);

  if(head.x===food.x && head.y===food.y){
    score++;
    scoreDiv.innerText='Score: '+score;
    if(score%5===0 && speed>30){
      speed-=10;
      clearInterval(gameInterval);
      if(gameRunning) gameInterval=setInterval(gameLoop,speed);
    }
    spawnFood();
  } else snake.pop();

  draw();
}

function draw(){
  ctx.fillStyle='#111';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  snake.forEach((seg,index)=>{
    const green=Math.min(255,50+index*15);
    ctx.fillStyle=`rgb(0,${green},0)`;
    ctx.fillRect(seg.x*tileSize,seg.y*tileSize,tileSize-1,tileSize-1);
  });

  ctx.fillStyle='#f00';
  ctx.fillRect(food.x*tileSize,food.y*tileSize,tileSize-1,tileSize-1);
}

// Keyboard
window.addEventListener('keydown', e=>{
  switch(e.key){
    case 'ArrowUp': case 'w': case 'W': changeDirection('up'); break;
    case 'ArrowDown': case 's': case 'S': changeDirection('down'); break;
    case 'ArrowLeft': case 'a': case 'A': changeDirection('left'); break;
    case 'ArrowRight': case 'd': case 'D': changeDirection('right'); break;
  }
});

// Swipe
let touchStartX=0,touchStartY=0;
canvas.addEventListener('touchstart',e=>{ const t=e.touches[0]; touchStartX=t.clientX; touchStartY=t.clientY; });
canvas.addEventListener('touchend',e=>{
  const t=e.changedTouches[0];
  const dx=t.clientX-touchStartX, dy=t.clientY-touchStartY;
  if(Math.abs(dx)>Math.abs(dy)){ dx>0?changeDirection('right'):changeDirection('left'); }
  else{ dy>0?changeDirection('down'):changeDirection('up'); }
});

// Buttons
startBtn.addEventListener('click',()=>{
  gameRunning=true;
  menuDiv.style.display='none';
  gameContainer.style.display='flex';
  infoBar.style.display='flex';
  arrowControls.style.display='flex';
  startBtn.style.display='none';
  pauseBtn.style.display='inline-block';
  menuBtn.style.display='inline-block';
  levelSelect.disabled=true;
  initGame();
});

pauseBtn.addEventListener('click',()=>{
  if(gameRunning){
    gameRunning=false;
    clearInterval(gameInterval);
    pauseBtn.innerText='Resume';
  } else {
    gameRunning=true;
    gameInterval=setInterval(gameLoop,speed);
    pauseBtn.innerText='Pause';
  }
});

restartBtn.addEventListener('click',()=>{
  gameRunning=true;
  restartBtn.style.display='none';
  menuBtn.style.display='inline-block';
  pauseBtn.style.display='inline-block';
  pauseBtn.innerText='Pause';
  initGame();
});

menuBtn.addEventListener('click',()=>{
  gameRunning=false;
  clearInterval(gameInterval);
  gameContainer.style.display='none';
  infoBar.style.display='none';
  arrowControls.style.display='none';
  menuDiv.style.display='flex';
  startBtn.style.display='inline-block';
  pauseBtn.style.display='none';
  restartBtn.style.display='none';
  menuBtn.style.display='none';
  levelSelect.disabled=false;
});

window.addEventListener('resize',()=>{ initGame(false); });

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
