"use strict";

function draw() {
  ctx.clearRect(0, 0, canvas.width, H);
  if (state === "loading") {
    text("Loading", 400, 240, 42, "#f2cf5a", "center");
  } else if (state === "menu") {
    drawMenu();
  } else {
    applyShake();
    drawGame();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

function drawMenu() {
  const panelX = 800;
  ctx.fillStyle = "#10130c";
  ctx.fillRect(0, 0, SCREEN_W, H);
  ctx.drawImage(imgs.start, 0, 0, W, H);
  ctx.save();
  ctx.fillStyle = "#15190f";
  ctx.fillRect(panelX, 0, SCREEN_W - panelX, H);
  ctx.strokeStyle = "rgba(246, 241, 210, .45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(panelX, 0);
  ctx.lineTo(panelX, H);
  ctx.stroke();
  ctx.restore();
  drawMenuText();
  ctx.drawImage(imgs.newstart_button, 816, 186, 128, 128);
  text("START", 880, 344, 32, "#f2cf5a", "center");
  text("GAME", 880, 382, 32, "#f2cf5a", "center");
}

function applyShake() {
  if (shakeTime <= 0) return;
  const strength = 9 * (shakeTime / .55);
  ctx.translate((Math.random() - .5) * strength, (Math.random() - .5) * strength);
}

function drawMenuText() {
  if (message === "Game over") {
    text("GAME", 880, 62, 30, "#ffffff", "center");
    text("OVER", 880, 96, 30, "#ffffff", "center");
    text("SCORE", 880, 138, 22, "#f2cf5a", "center");
    text(String(lastScore), 880, 168, 24, "#f2cf5a", "center");
    text("RECORD", 880, 420, 20, "#ffef85", "center");
    text(String(record), 880, 448, 24, "#ffef85", "center");
  } else {
    text("RECORD", 880, 82, 24, "#ffef85", "center");
    text(String(record), 880, 118, 28, "#ffef85", "center");
  }
}

function drawGame() {
  ctx.drawImage(imgs[`newmap_level${game.map}`], 0, 0, W, H);
  if (game.smallBush) ctx.drawImage(imgs.newbush_small, game.smallBush.x, game.smallBush.y, 61, 52);
  game.cartridges.forEach((b) => { if (b.visible) ctx.drawImage(imgs.bullets, b.x, b.y); });
  game.gays.forEach((g) => {
    if (g.state !== "stay" && g.state !== "killed" && g.state !== "caught") {
      drawStrip("gay_go", g.x, g.y, g.frame, angleTo(game.hunter, g), g.w, g.h);
    }
  });
  game.kills = game.kills.filter((k) => (k.t -= 1 / 60) > 0);
  game.kills.forEach((k) => drawStrip("gay_killed2", k.x, k.y, (1 - k.t) * 8, k.rot + Math.PI));
  drawLassos();
  drawHunter();
  drawChakram();
  game.fakeBushes.forEach((b) => ctx.drawImage(imgs[b.img], b.x, b.y, b.w, b.h));
  game.bushes.forEach((b) => ctx.drawImage(imgs[b.img], b.x, b.y, b.w, b.h));
  drawShot();
  drawTopHud();
  drawChakramHud();
  drawSpinHud();
  drawHunterStatus();
  drawNoAmmo();
  drawMoveTarget();
}

function drawLassos() {
  const h = game.hunter;
  game.gays.forEach((g) => {
    if (g.lassoTime <= 0 || g.state === "killed" || g.state === "caught") return;
    const from = { x: g.x + g.w / 2, y: g.y + g.h / 2 };
    const to = { x: h.x + h.w / 2, y: h.y + h.h / 2 };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    ctx.save();
    ctx.translate(from.x, from.y);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.globalAlpha = Math.min(1, g.lassoTime * 2.5);
    const [fw, fh, frames] = spriteInfo.lasso;
    const f = Math.floor((.75 - g.lassoTime) * 14) % frames;
    ctx.drawImage(imgs.lasso, f * fw, 0, fw, fh, 0, -14, dist, 28);
    ctx.restore();
  });
}

function drawChakram() {
  if (game.chakram.active <= 0) return;
  const h = game.hunter;
  const cx = h.x + h.w / 2;
  const cy = h.y + h.h / 2;
  ctx.save();
  ctx.globalAlpha = Math.min(1, game.chakram.active * 1.5);
  ctx.strokeStyle = "rgba(242, 207, 90, .55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 66, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = game.chakram.angle + i * Math.PI * 2 / 3;
    const x = cx + Math.cos(a) * 66;
    const y = cy + Math.sin(a) * 66;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-game.chakram.angle * 2);
    ctx.drawImage(imgs.chakram, -24, -24, 48, 48);
    ctx.restore();
  }
  ctx.restore();
}

function drawShot() {
  if (!game.shot) return;
  ctx.save();
  ctx.globalAlpha = Math.max(.25, game.shot.t / .45);
  ctx.strokeStyle = "#f7e36b";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(game.shot.from.x, game.shot.from.y);
  ctx.lineTo(game.shot.to.x, game.shot.to.y);
  ctx.stroke();
  ctx.restore();
}

function drawNoAmmo() {
  if (game.noAmmo <= 0) return;
  text("NO AMMO", 400, 230, 42, "#ff4c2f", "center");
}

function drawHunterStatus() {
  const h = game.hunter;
  if (h.throwArc) {
    text("THROWN", h.x + h.w / 2, h.y - h.airY - 12, 18, "#ffffff", "center");
    return;
  }
  if (h.spin.active > 0) {
    text(`360 SHOT ${Math.ceil(h.spin.active)}s`, h.x + h.w / 2, h.y - 12, 18, "#77e06a", "center");
    return;
  }
  if (h.rootTimer <= 0 && h.slowTimer <= 0) return;
  const label = h.rootTimer > 0 ? `BOUND ${Math.ceil(h.rootTimer)}s` : `SLOWED ${Math.ceil(h.slowTimer)}s`;
  text(label, h.x + h.w / 2, h.y - 12, 18, h.rootTimer > 0 ? "#ff4c2f" : "#f2cf5a", "center");
}

function drawHunter() {
  const h = game.hunter;
  const y = h.y - (h.airY || 0);
  if (h.airY > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(.18, .38 - h.airY / 420);
    ctx.fillStyle = "#050604";
    ctx.beginPath();
    ctx.ellipse(h.x + h.w / 2, h.y + h.h - 4, Math.max(12, 26 - h.airY / 8), 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (h.mode === "caught") {
    drawStrip(h.caughtTimer > 1.4 ? "catched1" : "catched2", h.x, y, (2.4 - h.caughtTimer) * 8, h.rot);
  } else if (h.mode === "shoot") {
    drawStrip("man_shoot2", h.x, y - 90, 0, h.rot);
  } else {
    drawStrip(h.mode === "go" ? "man_go" : "man_stay", h.x, y, performance.now() / 160, h.rot);
  }
}

function drawTopHud() {
  for (let i = 0; i < game.lives; i++) ctx.drawImage(imgs.lives, 5 + i * 48, 5);
  ctx.drawImage(imgs.gaybg, 530, 5);
  ctx.drawImage(imgs.bullets, 537, 17, 28, 17);
  text(String(game.bullets), 575, 35, 38, "#fff");
  ctx.drawImage(imgs.gaybg, 688, 5);
  drawStrip("gay_go", 693, 9, performance.now() / 180, 0, 28, 28);
  text(String(game.gays.filter((g) => g.state !== "killed").length), 736, 35, 38, "#fff");
  text(`L${game.level}  ${game.score}`, 400, 36, 28, "#f2cf5a", "center");
}

function drawChakramHud() {
  const x = 14;
  const y = 420;
  const ready = game.chakram.cooldown <= 0;
  const active = game.chakram.active > 0;
  const fill = active ? 1 : ready ? 1 : 1 - (game.chakram.cooldown / CHAKRAM_COOLDOWN);
  ctx.save();
  ctx.globalAlpha = .88;
  ctx.fillStyle = "rgba(16, 19, 12, .72)";
  ctx.fillRect(x, y, 150, 44);
  ctx.drawImage(imgs.chakram, x + 6, y + 5, 34, 34);
  ctx.strokeStyle = "#f2cf5a";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 48, y + 25, 88, 10);
  ctx.fillStyle = active ? "#ffffff" : ready ? "#77e06a" : "#f2cf5a";
  ctx.fillRect(x + 50, y + 27, 84 * fill, 6);
  text(active ? "ACTIVE" : ready ? "READY" : `${Math.ceil(game.chakram.cooldown)}s`, x + 50, y + 20, 18, active ? "#ffffff" : ready ? "#77e06a" : "#f2cf5a");
  ctx.restore();
}

function drawSpinHud() {
  const h = game.hunter;
  const x = 14;
  const y = 380;
  const ready = game.perfect && game.lives === 7 && !h.spin.used;
  const active = h.spin.active > 0;
  ctx.save();
  ctx.globalAlpha = .88;
  ctx.fillStyle = "rgba(16, 19, 12, .72)";
  ctx.fillRect(x, y, 150, 34);
  ctx.strokeStyle = active ? "#77e06a" : ready ? "#f2cf5a" : "#6f6f6f";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 6, y + 7, 28, 20);
  text("V", x + 14, y + 24, 20, active ? "#77e06a" : ready ? "#f2cf5a" : "#8c8c8c");
  text(active ? `${Math.ceil(h.spin.active)}s` : ready ? "360 READY" : "360 USED", x + 44, y + 23, 18, active ? "#77e06a" : ready ? "#f2cf5a" : "#8c8c8c");
  ctx.restore();
}

function drawMoveTarget() {
  if (!moveTarget) return;
  ctx.strokeStyle = "rgba(242, 207, 90, .9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(moveTarget.x, moveTarget.y, 12, 0, Math.PI * 2);
  ctx.moveTo(moveTarget.x - 18, moveTarget.y);
  ctx.lineTo(moveTarget.x + 18, moveTarget.y);
  ctx.moveTo(moveTarget.x, moveTarget.y - 18);
  ctx.lineTo(moveTarget.x, moveTarget.y + 18);
  ctx.stroke();
}

function drawStrip(name, x, y, frame, rot = 0, dw, dh) {
  const [fw, fh, frames] = spriteInfo[name];
  const f = Math.floor(frame) % frames;
  ctx.save();
  ctx.translate(x + (dw || fw) / 2, y + (dh || fh) / 2);
  ctx.rotate(rot);
  ctx.drawImage(imgs[name], 0, f * fh, fw, fh, -(dw || fw) / 2, -(dh || fh) / 2, dw || fw, dh || fh);
  ctx.restore();
}

function text(str, x, y, size, color, align = "left") {
  ctx.fillStyle = color;
  ctx.font = `${size}px Plok, Georgia, serif`;
  ctx.textAlign = align;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000";
  ctx.strokeText(str, x, y);
  ctx.fillText(str, x, y);
}
