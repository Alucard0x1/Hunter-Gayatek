"use strict";

const W = 800;
const SCREEN_W = 960;
const H = 480;
const CHAKRAM_COOLDOWN = 5;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const muteBtn = document.getElementById("mute");
const desktopGateEl = document.getElementById("desktopGate");
let desktopBlocked = false;

function setCanvasWidth(width) {
  if (canvas.width === width) return;
  canvas.width = width;
  canvas.style.aspectRatio = width === SCREEN_W ? "2 / 1" : "5 / 3";
}

function isDesktopDevice() {
  const uaMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent);
  const touch = navigator.maxTouchPoints > 1;
  const noMouse = matchMedia("(hover: none), (pointer: coarse)").matches;
  return !uaMobile && !touch && !noMouse;
}

function updateDesktopGate() {
  desktopBlocked = !isDesktopDevice();
  desktopGateEl.hidden = !desktopBlocked;
  if (desktopBlocked) {
    state = "blocked";
    sounds.start.pause();
    sounds.game.pause();
  } else if (state === "blocked") {
    showMenu();
  }
}

const gfx = "assets/gfx/";
const mfx = "assets/mfx/";
const spriteInfo = {
  man_go: [48, 56, 4],
  man_stay: [41, 64, 4],
  man_shoot2: [51, 154, 4],
  gay_go: [45, 51, 4],
  gay_killed2: [122, 105.5, 4],
  catched1: [108, 115, 3],
  catched2: [76, 91, 5],
  lasso: [192, 48, 4],
};
const assetNames = [
  "start", "newstart_button", "newmap_level1", "newmap_level2", "newmap_level3", "newmap_level4", "newmap_level5",
  "man_go", "man_stay", "man_shoot2", "gay_go", "gay_killed2", "catched1",
  "catched2", "newbush_1", "newbush_2", "newbush_small", "bullets", "lives", "gaybg", "chakram", "lasso"
];
