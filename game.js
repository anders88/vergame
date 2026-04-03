'use strict';

// --- Config ---
const GAME_DURATION = 60;       // seconds
const POINTS_PER_LEVEL = 80;   // score needed to advance one level

const LEVELS = [
  // { spawnInterval ms, speedPx/s, size px, maxSquares }
  { spawnInterval: 2000, speed: 120, size: 60, max: 4 },  // 1
  { spawnInterval: 1800, speed: 140, size: 58, max: 5 },  // 2
  { spawnInterval: 1600, speed: 160, size: 54, max: 5 },  // 3
  { spawnInterval: 1400, speed: 185, size: 50, max: 6 },  // 4
  { spawnInterval: 1200, speed: 210, size: 46, max: 6 },  // 5
  { spawnInterval: 1000, speed: 240, size: 42, max: 7 },  // 6
  { spawnInterval:  850, speed: 270, size: 38, max: 7 },  // 7
  { spawnInterval:  700, speed: 305, size: 34, max: 8 },  // 8
  { spawnInterval:  580, speed: 345, size: 32, max: 9 },  // 9
  { spawnInterval:  500, speed: 390, size: 30, max: 10 }, // 10
];

const COLORS = ['#e94560', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8', '#55efc4', '#fdcb6e', '#74b9ff'];

// --- State ---
let squares = [];
let score = 0;
let level = 1;
let timeLeft = GAME_DURATION;
let lastTimestamp = null;
let spawnTimer = 0;
let levelTimer = 0;
let gameRunning = false;
let rafId = null;
let gameAreaWidth = 0;
let gameAreaHeight = 0;
let squareIdCounter = 0;

// --- DOM refs ---
const startScreen   = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const hudEl         = document.getElementById('hud');
const gameArea      = document.getElementById('game-area');
const scoreEl       = document.getElementById('score');
const levelEl       = document.getElementById('level');
const timerEl       = document.getElementById('timer');
const finalScoreEl  = document.getElementById('final-score');
const finalLevelEl  = document.getElementById('final-level');

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

gameArea.addEventListener('pointerdown', onGameAreaClick);
window.addEventListener('resize', updateDimensions);

// --- Init ---
function updateDimensions() {
  gameAreaWidth  = gameArea.clientWidth;
  gameAreaHeight = gameArea.clientHeight;
}

function startGame() {
  // Reset state
  squares.forEach(s => s.element.remove());
  squares = [];
  score = 0;
  level = 1;
  timeLeft = GAME_DURATION;
  lastTimestamp = null;
  spawnTimer = 0;
  levelTimer = 0;
  squareIdCounter = 0;

  // UI
  startScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  hudEl.classList.remove('hidden');
  gameArea.classList.remove('hidden');

  updateDimensions();
  updateHUD();

  gameRunning = true;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  cancelAnimationFrame(rafId);

  squares.forEach(s => s.element.remove());
  squares = [];

  hudEl.classList.add('hidden');
  gameArea.classList.add('hidden');

  finalScoreEl.textContent = score;
  finalLevelEl.textContent = level;
  gameoverScreen.classList.remove('hidden');
}

// --- Game loop ---
function gameLoop(timestamp) {
  if (!gameRunning) return;

  if (lastTimestamp === null) lastTimestamp = timestamp;
  const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1); // seconds, capped
  lastTimestamp = timestamp;

  timeLeft -= delta;
  if (timeLeft <= 0) {
    timeLeft = 0;
    updateHUD();
    endGame();
    return;
  }

  // Level progression: one level per POINTS_PER_LEVEL score
  const newLevel = Math.min(Math.floor(score / POINTS_PER_LEVEL) + 1, LEVELS.length);
  if (newLevel !== level) {
    level = newLevel;
  }

  const cfg = LEVELS[level - 1];

  // Spawn timer
  spawnTimer -= delta * 1000;
  if (spawnTimer <= 0 && squares.length < cfg.max) {
    spawnSquare(cfg);
    spawnTimer = cfg.spawnInterval + (Math.random() - 0.5) * 200;
  }

  // Move squares
  for (let i = squares.length - 1; i >= 0; i--) {
    const s = squares[i];
    s.x += s.vx * delta;
    s.y += s.vy * delta;
    s.element.style.transform = `translate(${s.x}px, ${s.y}px)`;

    // Remove if off screen
    const margin = s.size * 2;
    if (s.x < -margin || s.x > gameAreaWidth + margin ||
        s.y < -margin || s.y > gameAreaHeight + margin) {
      s.element.remove();
      squares.splice(i, 1);
    }
  }

  updateHUD();
  rafId = requestAnimationFrame(gameLoop);
}

// --- Spawning ---
function spawnSquare(cfg) {
  const size = cfg.size + Math.floor(Math.random() * 8) - 4;
  const speed = cfg.speed + Math.floor(Math.random() * 40) - 20;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  // Pick random edge: 0=left, 1=right, 2=top, 3=bottom
  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const drift = (Math.random() - 0.5) * speed * 0.4;

  switch (edge) {
    case 0: // left → right
      x = -size; y = Math.random() * (gameAreaHeight - size);
      vx = speed; vy = drift;
      break;
    case 1: // right → left
      x = gameAreaWidth; y = Math.random() * (gameAreaHeight - size);
      vx = -speed; vy = drift;
      break;
    case 2: // top → bottom
      x = Math.random() * (gameAreaWidth - size); y = -size;
      vx = drift; vy = speed;
      break;
    case 3: // bottom → top
      x = Math.random() * (gameAreaWidth - size); y = gameAreaHeight;
      vx = drift; vy = -speed;
      break;
  }

  const el = document.createElement('div');
  el.className = 'square';
  el.style.width  = `${size}px`;
  el.style.height = `${size}px`;
  el.style.backgroundColor = color;
  el.style.transform = `translate(${x}px, ${y}px)`;

  const id = squareIdCounter++;
  el.dataset.id = id;

  gameArea.appendChild(el);

  squares.push({ id, element: el, x, y, vx, vy, size, spawnTime: performance.now() });
}

// --- Click handling ---
function onGameAreaClick(e) {
  if (!gameRunning) return;

  const el = e.target.closest('.square');
  if (!el) return;

  const id = parseInt(el.dataset.id, 10);
  const idx = squares.findIndex(s => s.id === id);
  if (idx === -1) return;

  const sq = squares[idx];
  const reactionTime = performance.now() - sq.spawnTime;
  const bonus = Math.round(Math.max(0, 500 - reactionTime) / 50);
  const points = 10 + bonus;

  score += points;
  squares.splice(idx, 1);

  // Hit animation then remove
  el.classList.add('hit');
  el.style.pointerEvents = 'none';
  setTimeout(() => el.remove(), 150);

  // Score popup
  showPopup(e.clientX, e.clientY - gameArea.getBoundingClientRect().top, `+${points}`);
}

function showPopup(x, y, text) {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = text;
  popup.style.left = `${x - 16}px`;
  popup.style.top  = `${y - 16}px`;
  gameArea.appendChild(popup);
  setTimeout(() => popup.remove(), 700);
}

// --- HUD ---
function updateHUD() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  timerEl.textContent = Math.ceil(timeLeft);
}
