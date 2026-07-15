const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const gameOverPanel = document.getElementById('gameOverPanel');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const watchAdBtn = document.getElementById('watchAdBtn');
const bannerAd = document.getElementById('bannerAd');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

const player = {
  x: GAME_WIDTH / 2 - 22,
  y: GAME_HEIGHT - 100,
  width: 44,
  height: 44,
  vy: 0,
  gravity: 0.9,
  jumpPower: -16,
  grounded: false,
  color: '#fbbf24',
};

let platforms = [];
let coins = [];
let score = 0;
let coinCount = 0;
let gameRunning = false;
let gameOver = false;

function resetGame() {
  player.y = GAME_HEIGHT - 100;
  player.vy = 0;
  platforms = [];
  coins = [];
  score = 0;
  coinCount = 0;
  gameRunning = true;
  gameOver = false;
  gameOverPanel.classList.add('hidden');
  createPlatforms();
  updateHUD();
  loop();
}

function createPlatforms() {
  platforms = [
    { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH, height: 20 },
  ];
  for (let i = 0; i < 5; i++) {
    createPlatform(i);
  }
}

function createPlatform(index) {
  const width = 120;
  const height = 16;
  const x = Math.random() * (GAME_WIDTH - width);
  const y = GAME_HEIGHT - 120 - index * 120;
  platforms.push({ x, y, width, height });
  if (Math.random() > 0.5) {
    coins.push({ x: x + width / 2 - 10, y: y - 28, size: 20, collected: false });
  }
}

function updateHUD() {
  scoreEl.textContent = score;
  coinsEl.textContent = coinCount;
}

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#0369a1';
  drawRoundedRect(player.x, player.y, player.width, player.height, 10);

  ctx.fillStyle = '#334155';
  platforms.forEach(platform => drawRoundedRect(platform.x, platform.y, platform.width, platform.height, 10));

  coins.forEach(coin => {
    if (!coin.collected) {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.fillStyle = '#f8fafc';
  ctx.font = '18px system-ui';
  ctx.fillText('Lucky Jump', 16, 32);
}

function update() {
  player.vy += player.gravity;
  player.y += player.vy;

  platforms.forEach(platform => {
    if (
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width &&
      player.y + player.height > platform.y &&
      player.y + player.height < platform.y + platform.height + 18 &&
      player.vy > 0
    ) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.grounded = true;
    }
  });

  if (player.y > GAME_HEIGHT) {
    endGame();
    return;
  }

  coins.forEach(coin => {
    if (!coin.collected &&
      player.x < coin.x + coin.size &&
      player.x + player.width > coin.x &&
      player.y < coin.y + coin.size &&
      player.y + player.height > coin.y
    ) {
      coin.collected = true;
      coinCount += 1;
      score += 10;
      updateHUD();
    }
  });

  score += 0.05;
  updateHUD();
}

function loop() {
  if (!gameRunning) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

function endGame() {
  gameRunning = false;
  gameOver = true;
  finalScore.textContent = Math.floor(score);
  gameOverPanel.classList.remove('hidden');
}

function jump() {
  if (!gameRunning) {
    resetGame();
    return;
  }
  if (player.grounded || player.y + player.height >= GAME_HEIGHT - 20) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }
}

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  jump();
});

restartBtn.addEventListener('click', resetGame);

watchAdBtn.addEventListener('click', () => {
  watchAdBtn.textContent = 'Почекай...';
  watchAdBtn.disabled = true;
  setTimeout(() => {
    // Тут майбутня інтеграція відеореклами.
    // Замініть setTimeout на виклик рекламного SDK, наприклад AdMob / Unity Ads.
    score += 20;
    gameOverPanel.classList.add('hidden');
    gameRunning = true;
    player.y = GAME_HEIGHT - 100;
    player.vy = 0;
    watchAdBtn.textContent = 'Подивитися рекламу і продовжити';
    watchAdBtn.disabled = false;
    loop();
  }, 1500);
});

resetGame();
