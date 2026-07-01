"use strict";

function loop(t) {
  update(Math.min((t - last) / 1000 || 0, .05));
  last = t;
  draw();
  requestAnimationFrame(loop);
}

function hit(a, b, pad = 0) {
  return a.x + pad < b.x + b.w && a.x + a.w - pad > b.x && a.y + pad < b.y + b.h && a.y + a.h - pad > b.y;
}

function lineHitsBox(from, to, box, radius = 0) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((cx - from.x) * dx + (cy - from.y) * dy) / len2));
  const px = from.x + dx * t;
  const py = from.y + dy * t;
  return Math.hypot(cx - px, cy - py) <= Math.max(box.w, box.h) / 2 + radius;
}

function angleTo(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
