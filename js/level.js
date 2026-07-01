"use strict";

function showMenu() {
  setCanvasWidth(SCREEN_W);
  state = "menu";
  sounds.game.pause();
  play("start");
  statusEl.textContent = "Click Start Game";
}

function startGame(reset = true) {
  if (desktopBlocked) return;
  if (!gameAssetsLoaded) {
    loadGameAssets(() => startGame(reset));
    return;
  }
  setCanvasWidth(W);
  if (reset) {
    game.level = 1;
    game.lives = 7;
    game.perfect = true;
    game.score = 0;
    game.bullets = 6;
    lastScore = 0;
    game.hunter.spin = { active: 0, used: false, angle: 0, fireTimer: 0 };
  }
  newLevel();
  state = "game";
  sounds.start.pause();
  play("game");
  statusEl.textContent = "Right-click to move. Left-click to shoot. Press C for chakram.";
}

function newLevel(extraBullets = 0, resetLives = true) {
  game.map = game.level === 1 ? 1 : rand(1, 5);
  if (resetLives) {
    game.lives = 7;
    game.perfect = true;
  }
  game.bullets += extraBullets;
  moveTarget = null;
  aimTarget = null;
  game.shot = null;
  game.noAmmo = 0;
  game.chakram = { active: 0, cooldown: 0, angle: 0 };
  const spinUsed = !resetLives && game.hunter.spin && game.hunter.spin.used;
  game.hunter = { x: 0, y: 160, w: 48, h: 56, rot: Math.PI, mode: "stay", shootTimer: 0, caughtTimer: 0, slowTimer: 0, rootTimer: 0, airY: 0, throwArc: null, spin: { active: 0, used: spinUsed, angle: 0, fireTimer: 0 } };
  game.bushes = [];
  game.fakeBushes = [];
  game.gays = [];
  game.kills = [];
  game.smallBush = Math.random() < .5 ? { x: rand(50, 710), y: rand(24, 384) } : null;
  for (let i = 0; i < Math.min(game.level, 2); i++) game.fakeBushes.push(randomBush());
  const enemyCount = enemiesForLevel(game.level);
  for (let i = 0; i < enemyCount; i++) {
    const bush = randomBush();
    const roll = Math.random();
    const lasso = game.level >= 2 && roll < lassoChanceForLevel(game.level);
    const brute = !lasso && game.level >= 2 && roll < lassoChanceForLevel(game.level) + bruteChanceForLevel(game.level);
    const lassoType = lasso && Math.random() < rootLassoChanceForLevel(game.level) ? "lassoRoot" : "lassoSlow";
    game.bushes.push(bush);
    game.gays.push({
      x: bush.x + bush.w / 3,
      y: bush.y + bush.h / 3,
      homeX: bush.x + bush.w / 3,
      homeY: bush.y + bush.h / 3,
      w: brute ? 90 : 45,
      h: brute ? 102 : 51,
      type: lasso ? lassoType : brute ? "brute" : "normal",
      state: "stay",
      frame: 0,
      wakeDelay: brute ? .15 + Math.random() * .25 : lasso ? .25 + Math.random() * .4 : .35 + Math.random() * .75,
      behavior: brute ? "ambush" : lasso ? "lasso" : Math.random() < .45 ? "flank" : "direct",
      aiTimer: 0,
      strafe: Math.random() < .5 ? -1 : 1,
      speed: brute ? 150 + Math.min(game.level, 7) * 8 : lasso ? 88 + Math.min(game.level, 7) * 4 : 78 + Math.min(game.level, 7) * 5 + Math.random() * 18,
      lassoCooldown: 1 + Math.random() * 1.8,
      lassoTime: 0,
      throwCooldown: 0,
    });
  }
  game.cartridges = [];
  const bonus = game.level > 1 ? Math.ceil((game.level * (1 + Math.random())) / 5) : 0;
  for (let i = 0; i < bonus; i++) game.cartridges.push({ x: rand(80, 560), y: rand(0, 336), n: 5, visible: true });
}

function enemiesForLevel(level) {
  return Math.min(12, 4 + Math.floor((level - 1) * 1.35));
}

function bruteChanceForLevel(level) {
  return Math.min(.42, .12 + (level - 2) * .045);
}

function lassoChanceForLevel(level) {
  return level < 2 ? 0 : Math.min(.28, .08 + (level - 2) * .035);
}

function rootLassoChanceForLevel(level) {
  return level < 2 ? 0 : Math.min(.5, .25 + (level - 2) * .04);
}

function randomBush() {
  const large = Math.random() < .5;
  return { x: rand(80, 560), y: rand(0, 336), w: large ? 167 : 113, h: large ? 158 : 112, img: large ? "newbush_1" : "newbush_2" };
}

function winLevel() {
  game.score += 100 + game.gays.filter((g) => g.state === "killed").length * 200;
  record = Math.max(record, game.score);
  localStorage.gayatekRecord = record;
  game.level++;
  message = `Level ${game.level}. Bonus loaded.`;
  newLevel(Math.ceil(game.level * (1 + Math.random())));
}

function loseLife() {
  game.lives--;
  game.perfect = false;
  if (game.lives < 1) {
    message = "Game over";
    lastScore = game.score;
    record = Math.max(record, game.score);
    localStorage.gayatekRecord = record;
    showMenu();
  } else {
    message = "Caught. Try again.";
    newLevel(0, false);
  }
}
