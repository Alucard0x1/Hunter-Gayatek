"use strict";

function update(dt) {
  if (desktopBlocked || state !== "game") return;
  const h = game.hunter;
  let vx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  let vy = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
  if (h.slowTimer > 0) h.slowTimer = Math.max(0, h.slowTimer - dt);
  if (h.rootTimer > 0) h.rootTimer = Math.max(0, h.rootTimer - dt);
  if (h.caughtTimer > 0) {
    moveTarget = null;
    aimTarget = null;
    h.caughtTimer -= dt;
    if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);
    if (h.caughtTimer <= 0) loseLife();
    return;
  }
  if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);
  if (h.shootTimer > 0) h.shootTimer -= dt;
  if (game.shot && (game.shot.t -= dt) <= 0) game.shot = null;
  if (game.noAmmo > 0) game.noAmmo = Math.max(0, game.noAmmo - dt);
  updateChakram(dt);
  if (updateHunterThrow(dt)) {
    updateGays(dt);
    return;
  }
  if (moveTarget && Math.hypot(moveTarget.x - (h.x + h.w / 2), moveTarget.y - (h.y + h.h / 2)) < 8) {
    moveTarget = null;
  }
  if (moveTarget) {
    vx = moveTarget.x - (h.x + h.w / 2);
    vy = moveTarget.y - (h.y + h.h / 2);
  }
  if (h.rootTimer > 0) {
    vx = 0;
    vy = 0;
    moveTarget = null;
  }
  const len = Math.hypot(vx, vy);
  if (len) {
    const speedMod = h.slowTimer > 0 ? .5 : 1;
    h.x += (vx / len) * 125 * speedMod * dt;
    h.y += (vy / len) * 125 * speedMod * dt;
    if (!h.spin.active) h.rot = Math.atan2(vx, -vy);
    h.mode = h.shootTimer > 0 ? "shoot" : "go";
  } else if (h.shootTimer <= 0) {
    h.mode = "stay";
  }
  updateSpinShot(dt);
  clampOrWin();
  updateGays(dt);
  collectBullets();
}

function updateHunterThrow(dt) {
  const h = game.hunter;
  if (!h.throwArc) return false;
  const a = h.throwArc;
  a.t = Math.min(a.duration, a.t + dt);
  const p = a.t / a.duration;
  h.x = a.fromX + (a.toX - a.fromX) * p;
  h.y = a.fromY + (a.toY - a.fromY) * p;
  h.airY = Math.sin(p * Math.PI) * a.height;
  h.mode = "go";
  moveTarget = null;
  aimTarget = null;
  if (p >= 1) {
    h.x = a.toX;
    h.y = a.toY;
    h.airY = 0;
    h.throwArc = null;
    h.rootTimer = .25;
  }
  return true;
}

function castChakram() {
  if (state !== "game" || game.chakram.cooldown > 0 || game.hunter.caughtTimer > 0) return;
  game.chakram.active = 2.5;
  game.chakram.cooldown = CHAKRAM_COOLDOWN;
  game.chakram.angle = 0;
}

function activateSpinShot() {
  const h = game.hunter;
  if (state !== "game" || !game.perfect || game.lives !== 7 || h.spin.used || h.caughtTimer > 0 || h.throwArc || h.rootTimer > 0) return;
  h.spin = { active: 4, used: true, angle: h.rot, fireTimer: 0 };
  h.shootTimer = 4;
  h.mode = "shoot";
}

function updateSpinShot(dt) {
  const h = game.hunter;
  if (!h.spin.active) return;
  h.spin.active = Math.max(0, h.spin.active - dt);
  h.spin.angle += dt * Math.PI * 5;
  h.rot = h.spin.angle;
  h.mode = "shoot";
  h.shootTimer = Math.max(h.shootTimer, .08);
  h.spin.fireTimer -= dt;
  if (h.spin.fireTimer <= 0) {
    h.spin.fireTimer = .09;
    spinShot(h.spin.angle);
  }
}

function spinShot(angle) {
  const h = game.hunter;
  const from = shotOrigin(angle);
  const to = { x: from.x + Math.sin(angle) * 800, y: from.y - Math.cos(angle) * 800 };
  game.shot = { from, to, t: .12 };
  play("shoot");
  game.gays.forEach((g) => {
    if (g.state !== "killed" && g.state !== "caught" && lineHitsBox(from, to, g, 28)) {
      g.state = "killed";
      game.kills.push({ x: g.x - 40, y: g.y - 30, rot: angle, t: .55 });
      game.score += 200;
      play("gay_killed");
    }
  });
}

function updateChakram(dt) {
  const c = game.chakram;
  if (c.cooldown > 0) c.cooldown = Math.max(0, c.cooldown - dt);
  if (c.active <= 0) return;
  c.active -= dt;
  c.angle += dt * 8;
  const h = game.hunter;
  const shield = { x: h.x - 38, y: h.y - 34, w: h.w + 76, h: h.h + 68 };
  game.gays.forEach((g) => {
    if (g.state !== "killed" && g.state !== "caught" && hit(shield, g, 0)) {
      g.state = "killed";
      game.kills.push({ x: g.x - 40, y: g.y - 30, rot: c.angle, t: .55 });
      game.score += 200;
      play("gay_killed");
    }
  });
}

function updateGays(dt) {
  const h = game.hunter;
  game.gays.forEach((g) => {
    if (g.state === "killed" || g.state === "caught") return;
    const seen = h.x + (g.type === "brute" ? 300 : 220) >= g.x && Math.abs(h.y - g.y) < (g.type === "brute" ? 340 : 260);
    if (g.state === "stay" && seen) {
      g.state = "wake";
      g.aiTimer = g.wakeDelay;
    }
    if (g.state === "wake") {
      g.aiTimer -= dt;
      if (g.aiTimer <= 0) {
        g.state = g.behavior === "ambush" ? "ambush" : g.behavior === "lasso" ? "lasso" : Math.random() < .55 ? "patrol" : "go";
        g.aiTimer = .8 + Math.random() * 1.2;
      }
      return;
    }
    if (g.state === "stay") return;

    g.aiTimer -= dt;
    if (g.aiTimer <= 0) {
      g.state = g.behavior === "ambush" ? "ambush" : g.behavior === "lasso" ? "lasso" : g.behavior === "flank" && Math.random() < .65 ? "flank" : "go";
      g.aiTimer = .7 + Math.random() * 1.3;
      if (Math.random() < .35) g.strafe *= -1;
    }

    let tx = h.x;
    let ty = h.y;
    if (g.lassoCooldown > 0) g.lassoCooldown = Math.max(0, g.lassoCooldown - dt);
    if (g.throwCooldown > 0) g.throwCooldown = Math.max(0, g.throwCooldown - dt);
    if (g.lassoTime > 0) {
      g.lassoTime = Math.max(0, g.lassoTime - dt);
      const dxh = g.x - h.x;
      const dyh = g.y - h.y;
      const dist = Math.hypot(dxh, dyh) || 1;
      if (!h.throwArc && dist < 350) {
        h.x += (dxh / dist) * 210 * dt;
        h.y += (dyh / dist) * 210 * dt;
      }
    }

    if (g.state === "patrol") {
      tx = g.homeX + Math.cos(performance.now() / 450 + g.homeX) * 62;
      ty = g.homeY + Math.sin(performance.now() / 520 + g.homeY) * 44;
    } else if (g.state === "flank") {
      const dxh = h.x - g.x;
      const dyh = h.y - g.y;
      const lenh = Math.hypot(dxh, dyh) || 1;
      tx = h.x + (-dyh / lenh) * 115 * g.strafe;
      ty = h.y + (dxh / lenh) * 115 * g.strafe;
    } else if (g.state === "ambush") {
      const lead = Math.hypot(h.x - g.x, h.y - g.y) > 140 ? 42 : 0;
      tx = h.x + Math.sin(h.rot) * lead;
      ty = h.y - Math.cos(h.rot) * lead;
    } else if (g.state === "lasso") {
      const dxh = h.x - g.x;
      const dyh = h.y - g.y;
      const dist = Math.hypot(dxh, dyh) || 1;
      if (dist > 250) {
        tx = h.x;
        ty = h.y;
      } else {
        tx = g.x - (dxh / dist) * 40;
        ty = g.y - (dyh / dist) * 40;
      }
      if (dist > 90 && dist < 330 && g.lassoCooldown <= 0) {
        g.lassoTime = .75;
        g.lassoCooldown = 4.2;
        if (g.type === "lassoRoot") {
          if (h.rootTimer <= 0) spawnExecutorGayatek(g);
          h.rootTimer = 3;
          h.slowTimer = 0;
        } else {
          h.slowTimer = 3;
        }
      }
    }

    const dx = tx - g.x;
    const dy = ty - g.y;
    const len = Math.hypot(dx, dy) || 1;
    g.x += (dx / len) * g.speed * dt;
    g.y += (dy / len) * g.speed * dt;
    g.x = Math.max(24, Math.min(W - g.w - 24, g.x));
    g.y = Math.max(24, Math.min(H - g.h - 24, g.y));
    g.frame += dt * 6;
    if (h.throwArc) return;
    if (hit(h, g, 24)) {
      if (g.type === "brute" && (g.throwCooldown || 0) <= 0) {
        throwHunterToGayatekArea(g);
        return;
      }
      g.state = "caught";
      h.mode = "caught";
      h.caughtTimer = 2.4;
      shakeTime = .55;
      play("catched");
    }
  });
}

function throwHunterToGayatekArea(brute) {
  const h = game.hunter;
  const targets = game.gays.filter((g) => g !== brute && g.type !== "brute" && g.state !== "killed" && g.state !== "caught");
  const target = targets[Math.floor(Math.random() * targets.length)];
  let toX;
  let toY;
  if (target) {
    const a = Math.random() * Math.PI * 2;
    toX = Math.max(24, Math.min(W - h.w - 24, target.x + target.w / 2 + Math.cos(a) * 90 - h.w / 2));
    toY = Math.max(24, Math.min(H - h.h - 24, target.y + target.h / 2 + Math.sin(a) * 70 - h.h / 2));
    if (target.state === "stay") target.state = "wake";
    target.aiTimer = Math.min(target.aiTimer || .25, .25);
  } else {
    toX = rand(80, W - h.w - 80);
    toY = rand(60, H - h.h - 60);
  }
  brute.throwCooldown = 2.5;
  h.throwArc = { fromX: h.x, fromY: h.y, toX, toY, t: 0, duration: .75, height: 115 };
  h.rot = Math.atan2(toX - h.x, -(toY - h.y));
  h.mode = "go";
  h.rootTimer = .85;
  h.slowTimer = 0;
  moveTarget = null;
  aimTarget = null;
  shakeTime = .45;
  play("catched");
}

function spawnExecutorGayatek(source) {
  const h = game.hunter;
  const side = h.x < W / 2 ? 1 : -1;
  game.gays.push({
    x: Math.max(24, Math.min(W - 69, h.x + side * 150)),
    y: Math.max(24, Math.min(H - 75, h.y + rand(-60, 60))),
    homeX: source.x,
    homeY: source.y,
    w: 45,
    h: 51,
    type: "executor",
    state: "go",
    frame: 0,
    wakeDelay: 0,
    behavior: "direct",
    aiTimer: 1,
    strafe: 1,
    speed: 230 + Math.min(game.level, 7) * 10,
    lassoCooldown: 0,
    lassoTime: 0,
  });
}

function shoot(target = aimTarget) {
  const h = game.hunter;
  if (h.caughtTimer > 0 || h.mode === "caught") return;
  if (h.shootTimer > 0) return;
  if (game.bullets <= 0) {
    play("no_bullets");
    game.noAmmo = .8;
    h.shootTimer = .25;
    return;
  }
  game.bullets--;
  h.shootTimer = .45;
  h.mode = "shoot";
  const center = { x: h.x + h.w / 2, y: h.y + h.h / 2 };
  const aim = target || { x: center.x + Math.sin(h.rot) * 800, y: center.y - Math.cos(h.rot) * 800 };
  h.rot = Math.atan2(aim.x - center.x, -(aim.y - center.y));
  const from = shotOrigin(h.rot);
  const to = target || { x: from.x + Math.sin(h.rot) * 800, y: from.y - Math.cos(h.rot) * 800 };
  game.shot = { from, to, t: .45 };
  play("shoot");
  game.gays.forEach((g) => {
    if (g.state !== "killed" && g.state !== "caught" && lineHitsBox(from, to, g, 28)) {
      g.state = "killed";
      game.kills.push({ x: g.x - 40, y: g.y - 30, rot: h.rot, t: .55 });
      game.score += 200;
      play("gay_killed");
    }
  });
}

function shotOrigin(angle) {
  const h = game.hunter;
  return {
    x: h.x + h.w / 2 + Math.sin(angle) * 46,
    y: h.y + h.h / 2 - Math.cos(angle) * 46,
  };
}

function collectBullets() {
  game.cartridges.forEach((b) => {
    if (b.visible && hit(game.hunter, { ...b, w: 42, h: 43 }, 24)) {
      b.visible = false;
      game.bullets += b.n;
      play("got_bullets");
    }
  });
}

function clampOrWin() {
  const h = game.hunter;
  if (h.x < 24) h.x = 24;
  if (h.y < 24) h.y = 24;
  if (h.y + h.h > H - 24) h.y = H - h.h - 24;
  const atRightExit = h.x + h.w > W - 24 && h.y > 210 && h.y < 320;
  const atTopExit = h.y <= 24 && h.x > 520 && h.x < 650 && game.map > 1;
  const atBottomExit = h.y + h.h >= H - 24 && h.x > 430 && h.x < 570 && (game.map === 2 || game.map === 4);
  if (atRightExit || atTopExit || atBottomExit) return winLevel();
  if (h.x + h.w > W - 24) h.x = W - h.w - 24;
}
