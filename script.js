const canvas = document.getElementById('gameCanvas');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const gameOverPanel = document.getElementById('gameOverPanel');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const watchAdBtn = document.getElementById('watchAdBtn');
const bannerAd = document.getElementById('bannerAd');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
renderer.setClearColor(0x08101f, 1);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, GAME_WIDTH / GAME_HEIGHT, 0.1, 100);
camera.position.set(0, 5.4, 9.5);
camera.lookAt(0, 1.2, 0);

const light = new THREE.DirectionalLight(0xffffff, 1.1);
light.position.set(5, 10, 5);
scene.add(light);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x334155 });
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444 });
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xffe68a });

const lanes = [-2.4, 0, 2.4];

const player = {
  mesh: null,
  lane: 1,
  targetLane: 1,
  speed: 0.12,
  score: 0,
  coins: 0,
  alive: false,
};

const obstacles = [];
const coins = [];
const roadSegments = [];
let distanceTraveled = 0;
let gameRunning = false;

function createScene() {
  const road = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 160), roadMaterial);
  road.position.set(0, -0.05, -60);
  scene.add(road);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 160), wallMaterial);
  leftWall.position.set(-4.1, 1.15, -60);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 160), wallMaterial);
  rightWall.position.set(4.1, 1.15, -60);
  scene.add(rightWall);

  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x334155 });
  for (let z = -8; z > -152; z -= 4) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.02, 0.05), gridMaterial);
    line.position.set(0, 0.01, z);
    scene.add(line);
  }
}

function createPlayer() {
  const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
  player.mesh = new THREE.Mesh(geometry, playerMaterial);
  player.mesh.position.set(lanes[player.lane], 0.7, 2);
  scene.add(player.mesh);
}

function spawnObstacle(z) {
  const lane = Math.floor(Math.random() * lanes.length);
  const obstacle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), obstacleMaterial);
  obstacle.position.set(lanes[lane], 0.65, z);
  obstacle.userData = { lane, type: 'obstacle' };
  scene.add(obstacle);
  obstacles.push(obstacle);
}

function spawnCoin(z) {
  const lane = Math.floor(Math.random() * lanes.length);
  const coin = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.14, 16, 24), coinMaterial);
  coin.position.set(lanes[lane], 1.2, z);
  coin.rotation.x = Math.PI / 2;
  coin.userData = { lane, collected: false, type: 'coin' };
  scene.add(coin);
  coins.push(coin);
}

function clearScene() {
  obstacles.forEach(item => scene.remove(item));
  coins.forEach(item => scene.remove(item));
  obstacles.length = 0;
  coins.length = 0;
}

function updateHUD() {
  scoreEl.textContent = Math.floor(player.score);
  coinsEl.textContent = player.coins;
}

function resetGame() {
  player.lane = 1;
  player.targetLane = 1;
  player.score = 0;
  player.coins = 0;
  distanceTraveled = 0;
  gameRunning = true;
  gameOverPanel.classList.add('hidden');
  clearScene();
  createPlayer();
  for (let i = 0; i < 10; i += 2) {
    spawnObstacle(-20 - i * 8);
    spawnCoin(-24 - i * 8);
  }
  updateHUD();
  animate();
}

function handleInput(event) {
  if (!gameRunning) return;
  let clientX = event.clientX;
  if (event.touches && event.touches[0]) clientX = event.touches[0].clientX;
  const rect = canvas.getBoundingClientRect();
  const normalizedX = (clientX - rect.left) / rect.width;

  if (normalizedX < 0.4) {
    player.targetLane = Math.max(0, player.targetLane - 1);
  } else if (normalizedX > 0.6) {
    player.targetLane = Math.min(lanes.length - 1, player.targetLane + 1);
  }
}

window.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {
    player.targetLane = Math.max(0, player.targetLane - 1);
  }
  if (event.key === 'ArrowRight') {
    player.targetLane = Math.min(lanes.length - 1, player.targetLane + 1);
  }
  if (event.key === 'Enter' && !gameRunning) {
    resetGame();
  }
});

canvas.addEventListener('click', handleInput);
canvas.addEventListener('touchstart', event => {
  event.preventDefault();
  handleInput(event);
});

function endGame() {
  gameRunning = false;
  finalScore.textContent = Math.floor(player.score);
  gameOverPanel.classList.remove('hidden');
}

function animate() {
  if (!gameRunning) return;

  player.mesh.position.x += (lanes[player.targetLane] - player.mesh.position.x) * 0.18;
  player.mesh.position.y += (0.7 - player.mesh.position.y) * 0.1;

  const speed = player.speed + Math.min(0.08, distanceTraveled * 0.0003);
  distanceTraveled += speed;
  player.score = distanceTraveled * 2 + player.coins * 15;

  obstacles.forEach((item, index) => {
    item.position.z += speed;
    if (item.position.z > 6) {
      scene.remove(item);
      obstacles.splice(index, 1);
      spawnObstacle(-120);
    }
    if (Math.abs(item.position.z - 2) < 0.9 && Math.abs(item.position.x - player.mesh.position.x) < 0.9) {
      endGame();
    }
  });

  coins.forEach((item, index) => {
    item.position.z += speed;
    item.rotation.y += 0.16;
    if (item.position.z > 6) {
      scene.remove(item);
      coins.splice(index, 1);
      spawnCoin(-120);
      return;
    }
    if (!item.userData.collected && Math.abs(item.position.z - 2) < 1 && Math.abs(item.position.x - player.mesh.position.x) < 0.9) {
      item.userData.collected = true;
      player.coins += 1;
      player.score += 40;
      scene.remove(item);
      coins.splice(index, 1);
      spawnCoin(-120);
    }
  });

  camera.position.x += (player.mesh.position.x - camera.position.x) * 0.08;
  camera.lookAt(player.mesh.position.x, 1.2, player.mesh.position.z - 6);

  updateHUD();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

restartBtn.addEventListener('click', resetGame);
watchAdBtn.addEventListener('click', () => {
  watchAdBtn.textContent = 'Почекай...';
  watchAdBtn.disabled = true;
  setTimeout(() => {
    player.score += 30;
    gameOverPanel.classList.add('hidden');
    gameRunning = true;
    animate();
    watchAdBtn.textContent = 'Подивитися рекламу і продовжити';
    watchAdBtn.disabled = false;
  }, 1500);
});

createScene();
resetGame();
