'use strict';

// --- DOM refs ---
const setupScreen  = document.getElementById('setup-screen');
const gameScreen   = document.getElementById('tr-game-screen');
const resultScreen = document.getElementById('result-screen');
const elapsedEl    = document.getElementById('elapsed-time');
const nextEl       = document.getElementById('next-number');
const gridEl       = document.getElementById('grid');
const finalTimeEl  = document.getElementById('final-time');

document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => startGame(parseInt(btn.dataset.size, 10)));
});
document.getElementById('play-again-btn').addEventListener('click', showSetup);

// --- State ---
let nextNumber    = 1;
let totalNumbers  = 0;
let startTime     = null;
let timerInterval = null;

// --- Flow ---
function showSetup() {
  resultScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  setupScreen.classList.remove('hidden');
}

function startGame(size) {
  totalNumbers = size * size;
  nextNumber   = 1;
  startTime    = null;
  clearInterval(timerInterval);
  elapsedEl.textContent = '0.0';
  nextEl.textContent    = '1';

  buildGrid(size);

  setupScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
}

function buildGrid(size) {
  const numbers = Array.from({ length: size * size }, (_, i) => i + 1);
  shuffle(numbers);

  const wrapper = document.getElementById('grid-wrapper');
  const hud     = document.getElementById('tr-hud');
  const availW  = wrapper.clientWidth - 32;
  const availH  = window.innerHeight - hud.offsetHeight - 32;
  const gridSize = Math.min(availW, availH, 560);
  gridEl.style.width  = gridSize + 'px';
  gridEl.style.height = gridSize + 'px';

  const fontSizes = { 4: '2rem', 5: '1.6rem', 6: '1.2rem' };
  gridEl.style.setProperty('--cell-font-size', fontSizes[size]);
  gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  gridEl.innerHTML = '';

  numbers.forEach(num => {
    const cell = document.createElement('button');
    cell.className   = 'grid-cell';
    cell.textContent = num;
    cell.dataset.num = num;
    cell.addEventListener('click', onCellClick);
    gridEl.appendChild(cell);
  });
}

// --- Click handling ---
function onCellClick(e) {
  const cell = e.currentTarget;
  const num  = parseInt(cell.dataset.num, 10);

  if (num !== nextNumber) {
    // Wrong — restart animation so it triggers even on repeated wrong clicks
    cell.classList.remove('wrong');
    void cell.offsetWidth; // force reflow
    cell.classList.add('wrong');
    return;
  }

  // Correct click
  if (nextNumber === 1) {
    startTime = performance.now();
    timerInterval = setInterval(() => {
      elapsedEl.textContent = ((performance.now() - startTime) / 1000).toFixed(1);
    }, 100);
  }

  cell.classList.add('correct');
  cell.disabled = true;
  nextNumber++;

  if (nextNumber > totalNumbers) {
    finishGame();
  } else {
    nextEl.textContent = nextNumber;
  }
}

function finishGame() {
  clearInterval(timerInterval);
  const elapsed = (performance.now() - startTime) / 1000;
  finalTimeEl.textContent = elapsed.toFixed(2);
  gameScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');
}

// --- Utilities ---
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
