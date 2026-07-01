"use strict";

const sounds = Object.fromEntries(["start", "game", "shoot", "gay_killed", "catched", "got_bullets", "no_bullets"]
  .map((name) => {
    const audio = new Audio(`${mfx}${name}.mp3`);
    audio.preload = "none";
    return [name, audio];
  }));
sounds.game.loop = true;
sounds.start.loop = true;

const imgs = {};
let muted = false;
let state = "loading";
let record = Number(localStorage.gayatekRecord || 0);
let lastScore = 0;
let keys = {};
let moveTarget = null;
let aimTarget = null;
let last = 0;
let message = "";
let shakeTime = 0;

const game = {
  level: 1,
  lives: 7,
  perfect: true,
  score: 0,
  bullets: 6,
  map: 1,
  hunter: { x: 0, y: 160, w: 48, h: 56, rot: Math.PI, mode: "stay", shootTimer: 0, caughtTimer: 0, slowTimer: 0, rootTimer: 0, airY: 0, throwArc: null, spin: { active: 0, used: false, angle: 0, fireTimer: 0 } },
  shot: null,
  chakram: { active: 0, cooldown: 0, angle: 0 },
  gays: [],
  bushes: [],
  fakeBushes: [],
  smallBush: null,
  cartridges: [],
  kills: [],
  noAmmo: 0,
};
