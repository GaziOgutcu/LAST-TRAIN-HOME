const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const ticketsEl = document.querySelector('#tickets');
const timeEl = document.querySelector('#time');
const energyEl = document.querySelector('#energy');
const scoreEl = document.querySelector('#score');
const overlay = document.querySelector('#overlay');
const startButton = document.querySelector('#startButton');
const controlButtons = document.querySelectorAll('[data-dir]');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PLAYER_SIZE = 28;
const TICKETS_TO_BOARD = 5;
const ROUND_SECONDS = 60;

const keys = new Set();
let game = createGame();
let lastFrame = performance.now();
let animationId;

function createGame() {
  return {
    running: false,
    finished: false,
    message: 'Catch the last train',
    score: 0,
    tickets: 0,
    timeLeft: ROUND_SECONDS,
    player: { x: 92, y: HEIGHT / 2, speed: 258, energy: 100, invulnerable: 0 },
    train: { x: WIDTH - 142, y: HEIGHT / 2 - 92, width: 88, height: 184 },
    ticketsList: makeTickets(),
    shadows: makeShadows(),
    sparks: []
  };
}

function makeTickets() {
  return [
    { x: 245, y: 118 },
    { x: 418, y: 388 },
    { x: 575, y: 146 },
    { x: 698, y: 420 },
    { x: 820, y: 246 }
  ].map((ticket) => ({ ...ticket, collected: false, pulse: Math.random() * Math.PI }));
}

function makeShadows() {
  return [
    { x: 318, y: 252, radius: 28, vx: 95, vy: 42 },
    { x: 552, y: 312, radius: 34, vx: -70, vy: 82 },
    { x: 744, y: 114, radius: 24, vx: 50, vy: 105 }
  ];
}

function startGame() {
  game = createGame();
  game.running = true;
  overlay.classList.add('hidden');
  lastFrame = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function endGame(title, detail) {
  game.running = false;
  game.finished = true;
  game.message = title;
  overlay.querySelector('h2').textContent = title;
  overlay.querySelector('p').textContent = detail;
  startButton.textContent = 'Play again';
  overlay.classList.remove('hidden');
}

function loop(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.033);
  lastFrame = now;

  update(dt);
  draw();
  updateHud();

  if (game.running) animationId = requestAnimationFrame(loop);
}

function update(dt) {
  if (!game.running) return;

  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    endGame('Missed the train', 'The platform clock struck midnight before you reached the door. Try another run.');
    return;
  }

  movePlayer(dt);
  moveShadows(dt);
  collectTickets();
  checkShadowHits(dt);
  checkBoarding();
  updateSparks(dt);
}

function movePlayer(dt) {
  const player = game.player;
  let dx = 0;
  let dy = 0;

  if (keys.has('arrowleft') || keys.has('a') || keys.has('left')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d') || keys.has('right')) dx += 1;
  if (keys.has('arrowup') || keys.has('w') || keys.has('up')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s') || keys.has('down')) dy += 1;

  if (dx || dy) {
    const length = Math.hypot(dx, dy);
    const sprint = keys.has('shift') && player.energy > 0;
    const speed = player.speed * (sprint ? 1.45 : 1);
    player.x += (dx / length) * speed * dt;
    player.y += (dy / length) * speed * dt;
    player.energy = clamp(player.energy + (sprint ? -32 : 10) * dt, 0, 100);
  } else {
    player.energy = clamp(player.energy + 18 * dt, 0, 100);
  }

  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.x = clamp(player.x, PLAYER_SIZE, WIDTH - PLAYER_SIZE);
  player.y = clamp(player.y, PLAYER_SIZE + 54, HEIGHT - PLAYER_SIZE - 28);
}

function moveShadows(dt) {
  for (const shadow of game.shadows) {
    shadow.x += shadow.vx * dt;
    shadow.y += shadow.vy * dt;

    if (shadow.x < 170 || shadow.x > WIDTH - 190) shadow.vx *= -1;
    if (shadow.y < 84 || shadow.y > HEIGHT - 62) shadow.vy *= -1;
  }
}

function collectTickets() {
  for (const ticket of game.ticketsList) {
    if (!ticket.collected && distance(game.player, ticket) < 38) {
      ticket.collected = true;
      game.tickets += 1;
      game.score += 250 + Math.round(game.timeLeft * 4);
      burst(ticket.x, ticket.y, '#ffd166');
    }
  }
}

function checkShadowHits() {
  const player = game.player;
  if (player.invulnerable > 0) return;

  for (const shadow of game.shadows) {
    if (distance(player, shadow) < shadow.radius + PLAYER_SIZE / 2) {
      player.energy = Math.max(0, player.energy - 28);
      player.invulnerable = 1.1;
      game.score = Math.max(0, game.score - 100);
      burst(player.x, player.y, '#ef476f');
      if (player.energy <= 0) {
        endGame('Lost in the dark', 'The shadows drained your energy. Grab tickets quickly and keep moving.');
      }
      return;
    }
  }
}

function checkBoarding() {
  const door = { x: game.train.x + 22, y: game.train.y + 88 };
  if (game.tickets >= TICKETS_TO_BOARD && distance(game.player, door) < 54) {
    const bonus = Math.round(game.timeLeft * 20 + game.player.energy * 8);
    game.score += bonus;
    endGame('You made it home!', `Final score: ${game.score}. The doors closed just as the train pulled away.`);
  }
}

function updateSparks(dt) {
  game.sparks = game.sparks
    .map((spark) => ({ ...spark, life: spark.life - dt, x: spark.x + spark.vx * dt, y: spark.y + spark.vy * dt }))
    .filter((spark) => spark.life > 0);
}

function burst(x, y, color) {
  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16;
    game.sparks.push({ x, y, color, life: 0.45, vx: Math.cos(angle) * 130, vy: Math.sin(angle) * 130 });
  }
}

function draw() {
  drawStation();
  drawTrain();
  drawTickets();
  drawShadows();
  drawPlayer();
  drawSparks();
}

function drawStation() {
  const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#11172b');
  gradient.addColorStop(1, '#060812');
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = 'rgba(255,255,255,0.06)';
  for (let x = -80; x < WIDTH; x += 92) {
    context.fillRect(x, 58, 44, HEIGHT - 112);
  }

  context.fillStyle = '#1d253d';
  context.fillRect(0, HEIGHT - 74, WIDTH, 74);
  context.fillStyle = '#ffd166';
  context.fillRect(0, HEIGHT - 78, WIDTH, 4);

  context.strokeStyle = 'rgba(255,255,255,0.08)';
  context.lineWidth = 2;
  for (let y = 96; y < HEIGHT - 88; y += 54) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(WIDTH, y + 18);
    context.stroke();
  }

  context.fillStyle = 'rgba(255, 209, 102, 0.1)';
  context.fillRect(36, 42, 170, 44);
  context.fillStyle = '#ffd166';
  context.font = '900 18px Inter, sans-serif';
  context.fillText('TRACK 13', 58, 70);
}

function drawTrain() {
  const { x, y, width, height } = game.train;
  context.fillStyle = '#0c1224';
  context.fillRect(x - 10, y - 24, width + 52, height + 48);
  context.fillStyle = '#24304f';
  roundRect(x, y, width, height, 18);
  context.fill();

  context.fillStyle = game.tickets >= TICKETS_TO_BOARD ? '#06d6a0' : '#33405f';
  roundRect(x + 22, y + 58, 44, 86, 10);
  context.fill();

  context.fillStyle = '#93c5fd';
  roundRect(x + 18, y + 20, 52, 28, 8);
  context.fill();

  context.fillStyle = '#f7fbff';
  context.font = '700 14px Inter, sans-serif';
  context.fillText(game.tickets >= TICKETS_TO_BOARD ? 'BOARD' : 'LOCKED', x - 2, y - 10);
}

function drawTickets() {
  for (const ticket of game.ticketsList) {
    if (ticket.collected) continue;
    ticket.pulse += 0.05;
    const bob = Math.sin(ticket.pulse) * 5;
    context.save();
    context.translate(ticket.x, ticket.y + bob);
    context.rotate(-0.15);
    context.fillStyle = '#ffd166';
    roundRect(-18, -12, 36, 24, 5);
    context.fill();
    context.fillStyle = '#11131b';
    context.fillRect(-4, -11, 3, 22);
    context.restore();
  }
}

function drawShadows() {
  for (const shadow of game.shadows) {
    const gradient = context.createRadialGradient(shadow.x, shadow.y, 4, shadow.x, shadow.y, shadow.radius * 1.8);
    gradient.addColorStop(0, 'rgba(239, 71, 111, 0.8)');
    gradient.addColorStop(1, 'rgba(239, 71, 111, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(shadow.x, shadow.y, shadow.radius * 1.8, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#1a1020';
    context.beginPath();
    context.arc(shadow.x, shadow.y, shadow.radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawPlayer() {
  const { x, y, invulnerable } = game.player;
  context.save();
  context.globalAlpha = invulnerable > 0 ? 0.55 + Math.sin(performance.now() / 70) * 0.25 : 1;
  context.fillStyle = '#06d6a0';
  context.beginPath();
  context.arc(x, y, PLAYER_SIZE / 2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f7fbff';
  context.beginPath();
  context.arc(x + 5, y - 4, 4, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawSparks() {
  for (const spark of game.sparks) {
    context.globalAlpha = Math.max(0, spark.life * 2.2);
    context.fillStyle = spark.color;
    context.beginPath();
    context.arc(spark.x, spark.y, 3, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function updateHud() {
  ticketsEl.textContent = `${game.tickets}/${TICKETS_TO_BOARD}`;
  timeEl.textContent = Math.ceil(game.timeLeft).toString();
  energyEl.textContent = `${Math.round(game.player.energy)}%`;
  scoreEl.textContent = game.score.toString();
}

function roundRect(x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

window.addEventListener('keydown', (event) => {
  keys.add(event.key.toLowerCase());
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

for (const button of controlButtons) {
  const direction = button.dataset.dir;
  button.addEventListener('pointerdown', () => keys.add(direction));
  button.addEventListener('pointerup', () => keys.delete(direction));
  button.addEventListener('pointerleave', () => keys.delete(direction));
}

startButton.addEventListener('click', startGame);
draw();
updateHud();
