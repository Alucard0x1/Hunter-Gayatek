"use strict";

const menuAssetNames = ["start", "newstart_button"];
const gameAssetNames = assetNames.filter((name) => !menuAssetNames.includes(name));
let gameAssetsLoaded = false;
let gameAssetsLoading = false;
let pendingGameStart = null;

function load() {
  loadImages(menuAssetNames, showMenu);
}

function loadImages(names, done) {
  let left = names.length;
  names.forEach((name) => {
    const img = new Image();
    img.onload = () => { if (--left === 0) done(); };
    img.onerror = () => {
      img.onerror = null;
      img.src = `${gfx}${name}.png`;
    };
    img.src = `${gfx}${name}.webp`;
    imgs[name] = img;
  });
}

function loadGameAssets(done) {
  if (gameAssetsLoaded) {
    done();
    return;
  }
  pendingGameStart = done;
  if (gameAssetsLoading) return;
  gameAssetsLoading = true;
  statusEl.textContent = "Loading game assets...";
  loadImages(gameAssetNames, () => {
    gameAssetsLoaded = true;
    gameAssetsLoading = false;
    const start = pendingGameStart;
    pendingGameStart = null;
    if (start) start();
  });
}

function play(name) {
  if (muted) return;
  const snd = sounds[name];
  snd.currentTime = 0;
  snd.play().catch(() => {});
}
