"use strict";

document.addEventListener("keydown", (e) => {
  if (desktopBlocked) return;
  keys[e.key] = true;
  if (e.key === " ") e.preventDefault();
  if (e.code === "KeyC" || e.key.toLowerCase() === "c") {
    e.preventDefault();
    castChakram();
  }
  if (e.code === "KeyV" || e.key.toLowerCase() === "v") {
    e.preventDefault();
    activateSpinShot();
  }
});
document.addEventListener("keyup", (e) => { keys[e.key] = false; });
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("mousedown", (e) => {
  if (e.target !== muteBtn) {
    e.preventDefault();
    canvas.focus();
  }
});
canvas.addEventListener("mousedown", (e) => {
  e.preventDefault();
  if (desktopBlocked) return;
  canvas.focus();
  const p = canvasPoint(e);
  if (state === "menu") {
    startGame(true);
    return;
  }
  if (state !== "game") return;
  if (game.hunter.caughtTimer > 0 || game.hunter.mode === "caught") return;
  if (p.x > W) return;
  if (e.button === 2) {
    moveTarget = p;
  } else if (e.button === 0) {
    aimTarget = p;
    shoot(p);
  }
});
muteBtn.addEventListener("click", () => {
  muted = !muted;
  Object.values(sounds).forEach((s) => s.muted = muted);
  muteBtn.textContent = muted ? "Muted" : "Sound";
});

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * canvas.width / r.width,
    y: (e.clientY - r.top) * H / r.height,
  };
}
