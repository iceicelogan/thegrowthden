/* ============================================================
   The Auction, In Human Terms · The Growth Den Lab
   Scrollytelling explainer of Meta's ad auction, powered by
   matter.js physics scenes. Fully static — no APIs, no accounts.
   ============================================================ */
(function () {
'use strict';

const M = window.Matter || null;   // pinned 0.19.0 via cdnjs; page degrades gracefully without it
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const rand = Math.random;
const dual = (kid, cmo) => '<span class="kid">' + kid + '</span><span class="cmo">' + cmo + '</span>';

const C = {
  accent: '#fe7c2b', gold: '#ffc545', cream: '#fcf3d6', white: '#fefefe',
  deep: '#1a1025', purple: '#341f44', blue: '#256493', red: '#e5340b',
  rival: '#7d74a0', rivalDim: '#5a527a', good: '#8fd694', sky: '#7fc8f0',
  muted: 'rgba(252,243,214,.6)',
};

/* ---------------- mode toggle ---------------- */
const PREF_KEY = 'gd-auction-mode';
function setMode(mode) {
  document.body.classList.toggle('mode-kid', mode === 'kid');
  document.body.classList.toggle('mode-cmo', mode === 'cmo');
  $('modeKidBtn').classList.toggle('active', mode === 'kid');
  $('modeCmoBtn').classList.toggle('active', mode === 'cmo');
  try { localStorage.setItem(PREF_KEY, mode); } catch (e) { }
}
$('modeKidBtn').addEventListener('click', () => setMode('kid'));
$('modeCmoBtn').addEventListener('click', () => setMode('cmo'));
try { setMode(localStorage.getItem(PREF_KEY) === 'kid' ? 'kid' : 'cmo'); } catch (e) { setMode('cmo'); }

/* ---------------- shared drawing ---------------- */
function ball(ctx, x, y, r, fill, glow) {
  ctx.save();
  if (glow) { ctx.shadowColor = fill; ctx.shadowBlur = glow; }
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,.55)');
  g.addColorStop(0.25, fill);
  g.addColorStop(1, fill);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
  ctx.restore();
}
function label(ctx, text, x, y, size, color, weight) {
  ctx.fillStyle = color || C.cream;
  ctx.font = (weight || 600) + ' ' + size + 'px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}
function magnet(ctx, x, y, s, angle, strength) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  ctx.scale(s, s);
  ctx.lineWidth = 13; ctx.lineCap = 'butt';
  ctx.strokeStyle = C.red;
  ctx.beginPath(); ctx.arc(0, 0, 16, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = C.red;
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-16, 16); ctx.moveTo(16, 0); ctx.lineTo(16, 16); ctx.stroke();
  ctx.strokeStyle = '#e9e9f2';
  ctx.beginPath(); ctx.moveTo(-16, 16); ctx.lineTo(-16, 26); ctx.moveTo(16, 16); ctx.lineTo(16, 26); ctx.stroke();
  if (strength > 0.02) {
    ctx.strokeStyle = 'rgba(254,124,43,' + (0.25 + strength * 0.5) + ')';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 30, 14 + i * 12 * (0.6 + strength), 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function person(ctx, x, y, s, tint, bored) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = tint;
  ctx.beginPath(); ctx.arc(0, -10, 6.5, 0, 6.29); ctx.fill();       // head
  ctx.beginPath();                                                   // body
  ctx.moveTo(-7, 12); ctx.quadraticCurveTo(-8, -4, 0, -2);
  ctx.quadraticCurveTo(8, -4, 7, 12); ctx.closePath(); ctx.fill();
  if (bored) label(ctx, 'z z', 12, -16, 10, 'rgba(252,243,214,.55)', 600);
  ctx.restore();
}

/* ---------------- scene framework ---------------- */
const scenes = {};      // name -> scene object
const running = new Set();

function makeScene(section, factory) {
  const stage = section.querySelector('.stage') || section.querySelector('.arena-wrap');
  const canvas = stage.querySelector('canvas');
  const capEl = section.querySelector('.scene-caption');
  const ctx = canvas.getContext('2d');
  const sc = {
    section, canvas, ctx, capEl, w: 0, h: 0, dpr: 1, capKey: '',
    progress: 0, t: 0, ready: false,
    setCap(key, kid, cmo) {
      if (key === this.capKey || !this.capEl) return;
      this.capKey = key;
      this.capEl.innerHTML = dual(kid, cmo);
    },
    resize() {
      const r = stage.getBoundingClientRect();
      if (r.width < 10) return;
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.w = r.width; this.h = r.height;
      canvas.width = Math.round(r.width * this.dpr);
      canvas.height = Math.round(r.height * this.dpr);
      this.build(this.w, this.h);
      this.ready = true;
    },
    frame(dt) {
      if (!this.ready) { this.resize(); if (!this.ready) return; }
      this.t += dt;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      this.tick(dt, this.t);
    },
    build() { }, tick() { }, poke() { },
  };
  factory(sc);
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    sc.poke(e.clientX - r.left, e.clientY - r.top, 1);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      const r = canvas.getBoundingClientRect();
      sc.poke(e.clientX - r.left, e.clientY - r.top, 0.12);
    }
  });
  return sc;
}

function engineOf(sc, gravY) {
  if (!M) return null;
  const eng = M.Engine.create();
  eng.gravity.y = gravY === undefined ? 1 : gravY;
  sc.engine = eng;
  return eng;
}
function pokeBodies(sc, bodies, x, y, power) {
  if (!M) return;
  bodies.forEach((b) => {
    if (b.isStatic) return;
    const dx = b.position.x - x, dy = b.position.y - y;
    const d = Math.hypot(dx, dy);
    if (d < 90) {
      const f = 0.02 * power * b.mass / Math.max(d, 12);
      M.Body.applyForce(b, b.position, { x: dx * f, y: dy * f - 0.008 * power * b.mass });
    }
  });
}
function noMatterNote(sc) {
  label(sc.ctx, 'physics module could not load — the words above still tell the whole story', sc.w / 2, sc.h / 2, 13, C.muted, 400);
}

/* ============================================================
   SCENE 1 · the seesaw — total value vs highest bid
   ============================================================ */
function seesawScene(sc) {
  let plank, big, you, chipM = null, chipW = null, pivot;
  sc.build = function (w, h) {
    if (!M) return;
    const eng = engineOf(sc, 1.3);
    const world = eng.world;
    M.World.clear(world, false);
    pivot = { x: w / 2, y: h * 0.68 };
    const pw = Math.min(w * 0.72, 480);
    const mk = (x, y, ww, hh, opt) => M.Bodies.rectangle(x, y, ww, hh, opt);
    const main = mk(pivot.x, pivot.y, pw, 14, {});
    const lipL = mk(pivot.x - pw / 2 + 6, pivot.y - 16, 10, 22, {});
    const lipR = mk(pivot.x + pw / 2 - 6, pivot.y - 16, 10, 22, {});
    const midL = mk(pivot.x - 26, pivot.y - 16, 10, 22, {});
    const midR = mk(pivot.x + 26, pivot.y - 16, 10, 22, {});
    plank = M.Body.create({ parts: [main, lipL, lipR, midL, midR], friction: 0.9, restitution: 0 });
    M.World.add(world, plank);
    M.World.add(world, M.Constraint.create({
      pointA: pivot, bodyB: plank, pointB: { x: 0, y: 0 }, stiffness: 1, length: 0,
    }));
    // rotation stops
    M.World.add(world, [
      M.Bodies.rectangle(pivot.x - pw * 0.42, pivot.y + 64, 60, 16, { isStatic: true }),
      M.Bodies.rectangle(pivot.x + pw * 0.42, pivot.y + 64, 60, 16, { isStatic: true }),
    ]);
    big = M.Bodies.circle(pivot.x - pw * 0.3, pivot.y - 70, 42, { density: 0.004, friction: 0.9, restitution: 0 });
    you = M.Bodies.circle(pivot.x + pw * 0.3, pivot.y - 60, 20, { density: 0.004, friction: 0.9, restitution: 0 });
    M.World.add(world, [big, you]);
    chipM = null; chipW = null;
    this.pw = pw;
  };
  function addChip(which) {
    const off = which === 'M' ? 0.34 : 0.22;
    const chip = M.Bodies.rectangle(pivot.x + sc.pw * off, pivot.y - 150, 30, 26, {
      density: 0.02, friction: 0.9, restitution: 0, angle: (rand() - 0.5) * 0.4,
    });
    M.World.add(sc.engine.world, chip);
    return chip;
  }
  sc.tick = function (dt, t) {
    const ctx = this.ctx, w = this.w, h = this.h, p = this.progress;
    if (!M) { noMatterNote(this); return; }
    if (p > 0.36 && !chipM) chipM = addChip('M');
    if (p < 0.30 && chipM) { M.World.remove(this.engine.world, chipM); chipM = null; }
    if (p > 0.62 && !chipW) chipW = addChip('W');
    if (p < 0.56 && chipW) { M.World.remove(this.engine.world, chipW); chipW = null; }
    M.Engine.update(this.engine, Math.min(dt, 0.033) * 1000);

    // fulcrum
    ctx.fillStyle = C.deep;
    ctx.strokeStyle = 'rgba(252,243,214,.35)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(pivot.x - 34, h * 0.92);
    ctx.lineTo(pivot.x + 34, h * 0.92);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(252,243,214,.12)';
    ctx.fillRect(0, h * 0.92, w, h * 0.08);

    // plank
    ctx.save();
    ctx.translate(plank.position.x, plank.position.y);
    ctx.rotate(plank.angle);
    ctx.fillStyle = '#4a3a5e';
    ctx.strokeStyle = 'rgba(252,243,214,.4)'; ctx.lineWidth = 2;
    const pw = this.pw;
    ctx.beginPath(); ctx.roundRect(-pw / 2, -7, pw, 14, 7); ctx.fill(); ctx.stroke();
    ctx.fillRect(-pw / 2 + 1, -27, 10, 20); ctx.fillRect(pw / 2 - 11, -27, 10, 20);
    ctx.fillRect(-31, -27, 10, 20); ctx.fillRect(21, -27, 10, 20);
    ctx.restore();

    // balls
    ball(ctx, big.position.x, big.position.y, 42, C.rivalDim, 0);
    label(ctx, 'BIG BID', big.position.x, big.position.y - 4, 13, C.cream, 700);
    label(ctx, '$9', big.position.x, big.position.y + 14, 15, C.gold, 700);
    ball(ctx, you.position.x, you.position.y, 20, C.accent, 18);
    label(ctx, 'YOU · $3', you.position.x, you.position.y - 30, 12, C.accent, 700);

    // chips
    [[chipM, '🧲', 'action rate'], [chipW, '🌬️', 'quality']].forEach(([chip, ico, txt]) => {
      if (!chip) return;
      ctx.save();
      ctx.translate(chip.position.x, chip.position.y);
      ctx.rotate(chip.angle);
      ctx.fillStyle = C.deep;
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-16, -14, 32, 28, 7); ctx.fill(); ctx.stroke();
      ctx.font = '15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ico, 0, 5);
      ctx.restore();
      label(ctx, txt, chip.position.x, chip.position.y + 28, 10.5, C.muted, 500);
    });

    // crown over the winning (lower) side
    if (Math.abs(plank.angle) > 0.05) {
      const side = plank.angle > 0 ? 1 : -1;   // angle>0 = right side down
      const winner = side === 1 ? you : big;
      const wx = winner.position.x, wy = winner.position.y - (winner === big ? 66 : 46);
      label(ctx, '👑', wx, wy, 24, C.gold, 700);
      label(ctx, 'WINS THE SEAT', wx, wy - 26, 11, C.gold, 700);
    }

    if (p < 0.36) this.setCap('a',
      'The big-money ball sits down first. Looks unbeatable…',
      'Bid alone: the incumbent weight on the scale.');
    else if (p < 0.62) this.setCap('b',
      '…but your side gets the magnet chip: “people will actually <b>like</b> this ad.”',
      'Add estimated action rate — predicted response is weight you don’t pay for.');
    else this.setCap('c',
      'The wind chip hops on too — and now <b>your</b> side wins the seat!',
      'Add quality. Highest <b>total value</b> takes the impression — not highest bid.');
  };
  sc.poke = function (x, y, pow) { if (M) pokeBodies(this, [big, you, chipM, chipW].filter(Boolean), x, y, pow); };
}

/* ============================================================
   SCENE 2 · three forces — bid mass, magnet, wind
   ============================================================ */
function forcesScene(sc) {
  let you, floorY, winY;
  const gusts = [];
  sc.build = function (w, h) {
    if (!M) return;
    const eng = engineOf(sc, 1);
    M.World.clear(eng.world, false);
    floorY = h * 0.9; winY = 74;
    M.World.add(eng.world, [
      M.Bodies.rectangle(w / 2, floorY + 30, w * 2, 60, { isStatic: true }),
      M.Bodies.rectangle(-20, h / 2, 40, h * 2, { isStatic: true }),
      M.Bodies.rectangle(w + 20, h / 2, 40, h * 2, { isStatic: true }),
      M.Bodies.rectangle(w / 2, -40, w * 2, 60, { isStatic: true }),
    ]);
    you = M.Bodies.circle(w / 2, floorY - 40, 24, { density: 0.003, restitution: 0.35, frictionAir: 0.03 });
    M.World.add(eng.world, you);
    gusts.length = 0;
    for (let i = 0; i < 26; i++) gusts.push({ x: rand() * w, y: rand() * h, v: 30 + rand() * 60, s: rand() });
  };
  sc.tick = function (dt, t) {
    const ctx = this.ctx, w = this.w, h = this.h, p = this.progress;
    if (!M) { noMatterNote(this); return; }
    const pa = clamp(p / 0.3, 0, 1);
    const pb = clamp((p - 0.33) / 0.3, 0, 1);
    const pc = clamp((p - 0.66) / 0.34, 0, 1);
    const windGood = Math.sin(t * 0.55);           // oscillates: nice ad ↔ annoying ad
    // spring toward a target altitude built from the three terms
    const liftFrac = clamp(pb * 0.62 + pc * 0.34 * windGood, -0.1, 1.06);
    const targetY = floorY - 24 - liftFrac * (floorY - winY - 20);
    const k = 3.2 * you.mass;
    M.Body.applyForce(you, you.position, {
      x: (w / 2 - you.position.x) * 0.00035 * you.mass,
      y: pb > 0.02 ? (targetY - you.position.y) * 0.00035 * k - you.velocity.y * 0.004 * you.mass : 0,
    });
    M.Engine.update(this.engine, Math.min(dt, 0.033) * 1000);

    // floor + win line
    ctx.fillStyle = 'rgba(252,243,214,.12)';
    ctx.fillRect(0, floorY - 10, w, h);
    ctx.strokeStyle = C.gold; ctx.setLineDash([10, 8]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, winY); ctx.lineTo(w - 20, winY); ctx.stroke(); ctx.setLineDash([]);
    label(ctx, 'WIN LINE', w - 62, winY - 10, 11, C.gold, 700);

    // wind particles (phase C)
    if (pc > 0.02) {
      ctx.strokeStyle = windGood > 0 ? 'rgba(143,214,148,.5)' : 'rgba(229,52,11,.45)';
      ctx.lineWidth = 2;
      gusts.forEach((g) => {
        g.x += g.v * dt; g.y -= windGood * 46 * dt * pc;
        if (g.x > w + 20) { g.x = -20; g.y = rand() * h; }
        if (g.y < -10) g.y = h + 10; if (g.y > h + 10) g.y = -10;
        ctx.globalAlpha = 0.3 + g.s * 0.5;
        ctx.beginPath(); ctx.moveTo(g.x, g.y);
        ctx.quadraticCurveTo(g.x + 9, g.y - windGood * 5, g.x + 18, g.y - windGood * 9 * pc);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    // magnet (phase B)
    if (pb > 0.02) {
      magnet(ctx, w / 2, 40, 1 + pb * 0.5, Math.PI, pb);
      if (w >= 640) label(ctx, dualText('sky-magnet: “will people click?”', 'estimated action rate'), w / 2 + 150, 44, 11, C.accent, 600);
      else label(ctx, dualText('sky-magnet: “will people click?”', 'estimated action rate'), w / 2, 92, 10.5, C.accent, 600);
      // field line to ball
      ctx.strokeStyle = 'rgba(254,124,43,' + (0.15 + pb * 0.3) + ')';
      ctx.setLineDash([3, 7]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w / 2, 60); ctx.lineTo(you.position.x, you.position.y - 26); ctx.stroke();
      ctx.setLineDash([]);
    }

    // your ball, with $-weight rings from phase A
    const r = 24 + pa * 8;
    ball(ctx, you.position.x, you.position.y, r, C.accent, 22);
    label(ctx, '$', you.position.x, you.position.y + 6, 15 + pa * 6, C.white, 800);
    if (pa > 0.15) {
      ctx.strokeStyle = 'rgba(255,197,69,' + pa * 0.8 + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(you.position.x, you.position.y, r + 5, 0, 6.29); ctx.stroke();
    }
    label(ctx, 'your ad', you.position.x, you.position.y - r - 10, 11.5, C.accent, 700);

    // total-value meter
    const meterH = floorY - winY - 20;
    const val = clamp((floorY - 24 - you.position.y) / meterH, 0, 1.05);
    ctx.fillStyle = 'rgba(252,243,214,.12)';
    ctx.beginPath(); ctx.roundRect(w - 30, winY, 10, meterH, 5); ctx.fill();
    ctx.fillStyle = val >= 0.99 ? C.gold : C.accent;
    ctx.beginPath(); ctx.roundRect(w - 30, winY + meterH * (1 - clamp(val, 0, 1)), 10, meterH * clamp(val, 0, 1), 5); ctx.fill();
    label(ctx, 'total', w - 25, winY + meterH + 16, 9.5, C.muted, 500);
    label(ctx, 'value', w - 25, winY + meterH + 27, 9.5, C.muted, 500);
    if (val >= 0.99) label(ctx, '✨ WINNING ✨', w / 2, winY - 26, 14, C.gold, 700);

    if (p < 0.33) this.setCap('a',
      'Your <b>bid</b> = how heavy your ball is. Money buys weight — and that is <i>all</i> it buys.',
      '<b>Bid</b>: the purchased term. Necessary, nowhere near sufficient.');
    else if (p < 0.66) this.setCap('b',
      'The sky-magnet switches on: Meta’s guess that people will <b>click</b>. Strong ad, strong pull — free.',
      '<b>Estimated action rate</b>: per-person probability of your optimization event. It <i>multiplies</i> your bid.');
    else if (windGood > 0) this.setCap('c1',
      'Nice, honest ad → the wind lifts you over the win line!',
      'Positive <b>quality</b> adds value — over the line with zero extra spend.');
    else this.setCap('c2',
      'Tricky, annoying ad → the wind shoves you back down.',
      'Low-quality attributes (bait, sensationalism) subtract — quality can go <i>negative</i>.');
  };
  sc.poke = function (x, y, pow) { if (M) pokeBodies(this, [you], x, y, pow); };
}
// small helper: caption-free inline dual text for canvas labels (mode read live)
function dualText(kid, cmo) {
  return document.body.classList.contains('mode-kid') ? kid : cmo;
}

/* ============================================================
   SCENE 3 · the discount — pay the minimum to win
   ============================================================ */
function discountScene(sc) {
  let you, floorY;
  sc.build = function (w, h) {
    floorY = h * 0.88;
    if (!M) return;
    const eng = engineOf(sc, 1);
    M.World.clear(eng.world, false);
    you = M.Bodies.circle(w * 0.32, h * 0.3, 22, { density: 0.003, restitution: 0.5, frictionAir: 0.02 });
    M.World.add(eng.world, you);
  };
  sc.tick = function (dt, t) {
    const ctx = this.ctx, w = this.w, h = this.h, p = this.progress;
    const colX = w * 0.32, colW = Math.min(120, w * 0.2);
    const rivX = w * 0.7, rivW = colW;
    const rivH = (floorY - 60) * 0.55;
    const need = rivH * 1.07;                                   // just above the runner-up
    const liftFrac = lerp(0.18, 0.78, p);                       // creative's share grows with scroll
    const liftH = need * liftFrac;
    const cashH = need - liftH;
    const platY = floorY - need;
    const pay = lerp(12.4, 3.9, p);

    ctx.fillStyle = 'rgba(252,243,214,.12)';
    ctx.fillRect(0, floorY, w, h - floorY);

    // runner-up tower
    ctx.fillStyle = C.rivalDim;
    ctx.beginPath(); ctx.roundRect(rivX - rivW / 2, floorY - rivH, rivW, rivH, [10, 10, 0, 0]); ctx.fill();
    ball(ctx, rivX, floorY - rivH - 18, 16, C.rival, 0);
    label(ctx, dualText('2nd place', 'runner-up'), rivX, floorY - rivH - 46, 11.5, C.muted, 600);
    label(ctx, dualText('their score', 'their total value'), rivX, floorY - rivH / 2, 11, 'rgba(252,243,214,.75)', 500);

    // beat-this line
    ctx.strokeStyle = C.gold; ctx.setLineDash([8, 7]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(24, floorY - need); ctx.lineTo(w - 24, floorY - need); ctx.stroke(); ctx.setLineDash([]);
    label(ctx, dualText('beat this line — that’s ALL', 'clearing threshold'), w / 2, floorY - need - 10, 11.5, C.gold, 700);

    // your stack: creative lift (bottom, accent) + cash (top, gold)
    ctx.fillStyle = 'rgba(254,124,43,.85)';
    ctx.beginPath(); ctx.roundRect(colX - colW / 2, floorY - liftH, colW, liftH, [0, 0, 0, 0]); ctx.fill();
    ctx.fillStyle = 'rgba(255,197,69,.9)';
    ctx.beginPath(); ctx.roundRect(colX - colW / 2, platY, colW, cashH, [10, 10, 0, 0]); ctx.fill();
    if (liftH > 34) label(ctx, dualText('🧲 free lift', '🧲 rate × quality'), colX, floorY - liftH / 2 + 4, 11.5, C.white, 700);
    if (cashH > 30) label(ctx, dualText('💵 money part', '💵 cash you pay'), colX, platY + cashH / 2 + 4, 11.5, C.deep, 700);

    // your ball bobbing on the stack
    if (M) {
      const targetY = platY - 24;
      M.Body.applyForce(you, you.position, {
        x: (colX - you.position.x) * 0.0006 * you.mass,
        y: (targetY - you.position.y) * 0.0012 * you.mass - you.velocity.y * 0.006 * you.mass,
      });
      M.Engine.update(this.engine, Math.min(dt, 0.033) * 1000);
      ball(ctx, you.position.x, you.position.y, 22, C.accent, 20);
      label(ctx, 'your ad', you.position.x, you.position.y - 32, 11.5, C.accent, 700);
    } else {
      ball(ctx, colX, platY - 24, 22, C.accent, 20);
    }

    // price tag
    const tagX = colX + colW / 2 + 14, tagY = platY + Math.max(cashH / 2, 20);
    ctx.fillStyle = C.white;
    ctx.beginPath(); ctx.roundRect(tagX, tagY - 20, 108, 40, 9); ctx.fill();
    ctx.fillStyle = C.deep;
    label(ctx, dualText('you pay', 'eff. CPM'), tagX + 54, tagY - 5, 10, '#6b5f78', 600);
    label(ctx, '$' + pay.toFixed(2), tagX + 54, tagY + 13, 17, C.red, 800);

    if (p < 0.45) this.setCap('a',
      'To win, you only need to reach <b>just above</b> the gray tower. Money promised above that? Never charged.',
      'Second-price on total value: clear the runner-up by ε. Surplus bid is never billed.');
    else this.setCap('b',
      'Watch: as your ad gets better, the free lift grows — and the money part <b>shrinks</b>. Same win, smaller allowance.',
      'Better creative → higher action rate → cash displaced from the clearing price. Identical impression, lower CPM.');
  };
  sc.poke = function (x, y, pow) { if (M) pokeBodies(this, [you], x, y, pow); };
}

/* ============================================================
   SCENE 4 · learning phase — the calibrating magnet
   ============================================================ */
function learningScene(sc) {
  const people = [];
  let sparks = [];
  sc.build = function (w, h) {
    people.length = 0;
    for (let i = 0; i < 7; i++) {
      people.push({ x: rand() * w, y: h * (0.5 + rand() * 0.34), v: 34 + rand() * 30, tint: C.rival, ph: rand() * 6.28 });
    }
    sparks = [];
  };
  sc.tick = function (dt, t) {
    const ctx = this.ctx, w = this.w, h = this.h, p = this.progress;
    // events derived from progress → scrub-safe
    let events, edited = false;
    if (p < 0.62) events = Math.round((p / 0.62) * 50);
    else if (p < 0.72) events = 50;
    else { edited = true; events = Math.round(((p - 0.72) / 0.28) * 18); }
    const steady = clamp(events / 50, 0, 1);
    const wobbleAmp = lerp(0.85, 0.05, steady);
    const aim = Math.sin(t * 2.1) * wobbleAmp + Math.sin(t * 3.7) * wobbleAmp * 0.5;

    // mount + magnet
    const mx = w / 2, my = 34;
    ctx.strokeStyle = 'rgba(252,243,214,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, my - 8); ctx.stroke();
    magnet(ctx, mx, my, 1.35, Math.PI + aim, steady);

    // aim beam
    const beamLen = h * 0.85;
    const bx = mx + Math.sin(aim) * beamLen, by = my + Math.cos(aim) * beamLen;
    const grad = ctx.createLinearGradient(mx, my, bx, by);
    grad.addColorStop(0, 'rgba(254,124,43,.5)');
    grad.addColorStop(1, 'rgba(254,124,43,0)');
    ctx.strokeStyle = grad; ctx.lineWidth = lerp(26, 12, steady);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(mx, my + 20); ctx.lineTo(bx, by); ctx.stroke();

    // people stream
    people.forEach((pe) => {
      pe.x += pe.v * dt;
      if (pe.x > w + 20) { pe.x = -20; pe.y = h * (0.5 + rand() * 0.34); }
      const py = pe.y + Math.sin(t * 2 + pe.ph) * 4;
      const hit = Math.abs(pe.x - (mx + Math.sin(aim) * (py - my))) < 26;
      person(ctx, pe.x, py, 1.35, hit && steady > 0.35 ? C.accent : C.rival, false);
      if (hit && steady > 0.35 && rand() < 0.05) {
        sparks.push({ x: pe.x, y: py - 20, life: 0.7 });
      }
    });
    sparks.forEach((s) => { s.y -= 60 * dt; s.life -= dt; });
    sparks = sparks.filter((s) => s.life > 0);
    sparks.forEach((s) => label(ctx, '⚡', s.x, s.y, 15, C.gold, 700));

    // events counter
    ctx.fillStyle = 'rgba(26,16,37,.8)';
    ctx.beginPath(); ctx.roundRect(14, 14, 190, 54, 12); ctx.fill();
    ctx.strokeStyle = events >= 50 ? C.gold : 'rgba(252,243,214,.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(14, 14, 190, 54, 12); ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = C.muted; ctx.font = '500 10.5px Poppins, sans-serif';
    ctx.fillText(dualText('successes the magnet learned from', 'optimization events'), 26, 33);
    ctx.fillStyle = events >= 50 ? C.gold : C.cream; ctx.font = '700 20px Poppins, sans-serif';
    ctx.fillText(events + ' / 50' + (events >= 50 ? '  ✓ locked on' : ''), 26, 57);

    // edit stamp
    if (edited) {
      ctx.save();
      ctx.translate(w / 2, h * 0.24);
      ctx.rotate(-0.09);
      ctx.strokeStyle = C.red; ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(229,52,11,.14)';
      ctx.beginPath(); ctx.roundRect(-130, -26, 260, 52, 10); ctx.fill(); ctx.stroke();
      label(ctx, dualText('YOU EDITED THE AD!', 'SIGNIFICANT EDIT'), 0, 7, 17, C.red, 800);
      ctx.restore();
    }

    if (edited) this.setCap('c',
      'You changed the ad — so the magnet thinks it’s brand new. Wobble city, all over again.',
      'Significant edits (creative, targeting, optimization event, big budget moves) <b>reset learning</b>.');
    else if (events >= 50) this.setCap('b',
      'About 50 successes later: <b>locked on</b>. The magnet barely misses now.',
      '~50 optimization events within a week → exits learning; delivery and CPA stabilize.');
    else this.setCap('a',
      'Brand-new ad: the magnet is guessing. It points everywhere, and mostly misses.',
      'Learning phase: the system is exploring who converts. Volatile delivery and hot CPAs are expected.');
  };
  sc.poke = function (x, y) {
    people.forEach((pe) => { if (Math.abs(pe.x - x) < 50) pe.v = 90 + rand() * 60; });
    setTimeout(() => people.forEach((pe) => { pe.v = 34 + rand() * 30; }), 700);
  };
}

/* ============================================================
   SCENE 5 · pacing — the budget valve
   ============================================================ */
function pacingScene(sc) {
  let drops = [], buckets = [], tDay = 0, budget = 1, caught = 0, spent = 0, lastMode = '';
  const DAY = 11;   // seconds per simulated day
  sc.build = function (w, h) {
    drops = []; buckets = []; tDay = 0; budget = 1; caught = 0; spent = 0;
    if (M) {
      engineOf(sc, 1.1);
    }
  };
  function resetDay() {
    if (M && sc.engine) drops.forEach((d) => M.World.remove(sc.engine.world, d.body));
    drops = []; budget = 1; caught = 0; spent = 0;
    buckets = [];
    for (let i = 0; i < 5; i++) buckets.push({ x: sc.w * (0.18 + i * 0.19), jit: (rand() - 0.5) * 0.22 });
  }
  sc.tick = function (dt, t) {
    const ctx = this.ctx, w = this.w, h = this.h, p = this.progress;
    const mode = p < 0.5 ? 'burst' : 'paced';
    if (mode !== lastMode) { lastMode = mode; resetDay(); tDay = 0; }
    tDay += dt / DAY;
    if (tDay >= 1) { tDay = 0; resetDay(); }

    const floorY = h * 0.9;
    // sun arc = time of day
    const sx = lerp(130, w - 30, tDay), sy = 46 - Math.sin(tDay * Math.PI) * 26;
    ball(ctx, sx, sy, 13, C.gold, 16);
    label(ctx, tDay < 0.33 ? dualText('morning', '9am') : tDay < 0.66 ? dualText('midday', '1pm') : dualText('dinner time', '7pm'), sx, sy + 30, 10.5, C.muted, 500);

    // tank + valve
    const tx = 34, ty = 60, tw = 54, th = h * 0.34;
    ctx.strokeStyle = 'rgba(252,243,214,.5)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 10); ctx.stroke();
    ctx.fillStyle = 'rgba(37,100,147,.8)';
    const wl = th * budget;
    ctx.beginPath(); ctx.roundRect(tx + 3, ty + th - wl + 2, tw - 6, Math.max(wl - 5, 0), 7); ctx.fill();
    label(ctx, dualText('your $20', 'daily budget'), tx + tw / 2, ty - 10, 11, C.cream, 600);
    // valve
    const vx = tx + tw / 2, vy = ty + th + 12;
    const open = mode === 'burst' ? (tDay < 0.22 ? 1 : 0) : 0.28;
    ctx.fillStyle = open > 0 ? C.accent : '#5a527a';
    ctx.beginPath(); ctx.roundRect(vx - 10, vy - 10, 20, 20, 5); ctx.fill();
    label(ctx, open > 0.6 ? dualText('WIDE OPEN', 'unconstrained') : open > 0 ? dualText('drip… drip…', 'paced delivery') : dualText('empty!', 'budget exhausted'), vx + 76, vy + 4, 11, open > 0 ? C.accent : C.red, 700);

    // spawn droplets
    if (budget > 0.005 && open > 0) {
      const rate = open * 26;
      if (rand() < rate * dt) {
        const bod = M ? M.Bodies.circle(vx + (rand() - 0.5) * 8, vy + 16, 5, { restitution: 0.15, frictionAir: 0.01 }) : null;
        if (bod) { M.Body.setVelocity(bod, { x: (rand() - 0.5) * 1.5, y: 2 }); M.World.add(sc.engine.world, bod); }
        drops.push({ body: bod, x: vx, y: vy + 16 });
        budget = Math.max(0, budget - (mode === 'burst' ? 0.045 : 0.012));
      }
    }
    if (M && this.engine) M.Engine.update(this.engine, Math.min(dt, 0.033) * 1000);

    // a constant parade of auctions drifts by; seats get cheaper as the day goes on
    buckets.forEach((b) => {
      b.x -= 55 * dt;
      if (b.x < -40) { b.x = w + 40; b.jit = (rand() - 0.5) * 0.22; }
    });
    buckets.forEach((b) => {
      const price = clamp(1.55 - tDay * 1.05 + b.jit, 0.35, 1.7);
      b.price = price;
      const cheap = price < 0.8;
      ctx.strokeStyle = cheap ? C.good : C.red; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.x - 22, floorY - 30); ctx.lineTo(b.x - 16, floorY); ctx.lineTo(b.x + 16, floorY); ctx.lineTo(b.x + 22, floorY - 30);
      ctx.stroke();
      label(ctx, '$' + price.toFixed(2), b.x, floorY + 16, 10.5, cheap ? C.good : C.red, 700);
      label(ctx, dualText(cheap ? 'bargain seat' : 'pricey seat', 'auction'), b.x, floorY - 38, 9.5, C.muted, 500);
    });

    // droplets: draw + catch
    const toRemove = [];
    drops.forEach((d) => {
      // the delivery system aims each dollar at an auction: steer toward the nearest seat,
      // leading it slightly since the parade keeps moving left
      if (d.body && d.body.position.y > h * 0.35) {
        let best = null, bd = 1e9;
        buckets.forEach((b) => {
          const lead = b.x - 28;
          const dx = Math.abs(lead - d.body.position.x);
          if (dx < bd) { bd = dx; best = lead; }
        });
        if (best !== null && bd < 240) M.Body.setVelocity(d.body, {
          x: lerp(d.body.velocity.x, clamp((best - d.body.position.x) * 0.08, -3.6, 3.6), 0.15),
          y: d.body.velocity.y,
        });
      }
      const x = d.body ? d.body.position.x : d.x, y = d.body ? d.body.position.y : (d.y += 120 * dt);
      ctx.fillStyle = 'rgba(127,200,240,.95)';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.29); ctx.fill();
      if (y > floorY - 12) {
        const hit = buckets.find((b) => Math.abs(b.x - x) < 24);
        if (hit) { caught++; spent += hit.price; }
        toRemove.push(d);
      }
    });
    toRemove.forEach((d) => {
      if (d.body && M) M.World.remove(this.engine.world, d.body);
      drops.splice(drops.indexOf(d), 1);
    });
    ctx.fillStyle = 'rgba(252,243,214,.12)'; ctx.fillRect(0, floorY, w, h - floorY);

    // scoreboard
    ctx.fillStyle = 'rgba(26,16,37,.8)';
    ctx.beginPath(); ctx.roundRect(w - 196, 14, 182, 56, 12); ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = C.muted; ctx.font = '500 10.5px Poppins, sans-serif';
    ctx.fillText(mode === 'burst' ? dualText('“spend it NOW” day', 'accelerated delivery') : dualText('“slow valve” day', 'discount pacing'), w - 184, 33);
    ctx.fillStyle = C.cream; ctx.font = '700 16px Poppins, sans-serif';
    ctx.fillText(caught + dualText(' seats · avg $', ' results · avg $') + (caught ? (spent / caught).toFixed(2) : '—'), w - 184, 57);

    if (mode === 'burst') this.setCap('a',
      'Whole jug at breakfast… empty by lunch, while the <b>bargain seats</b> float past untouched.',
      'Front-loaded spend buys expensive early auctions, then goes dark for the cheap late inventory.');
    else this.setCap('b',
      'The valve drips all day — and catches the cheap dinner seats too. Same money, more wins.',
      'Discount pacing: deliberately skip winnable-but-pricey auctions to buy comparable results cheaper across the schedule.');
  };
  sc.poke = function (x, y, pow) {
    if (M && this.engine) pokeBodies(this, drops.map((d) => d.body).filter(Boolean), x, y, pow);
  };
}

/* ============================================================
   SCENE 6 · fatigue — the magnet wears out per person
   ============================================================ */
function fatigueScene(sc) {
  const folks = [];
  let freshAt = -1;
  sc.build = function (w, h) {
    folks.length = 0;
    for (let i = 0; i < 9; i++) folks.push({ a: (i / 9) * 6.283, seen: 0, kick: 0 });
    freshAt = -1;
  };
  sc.tick = function (dt, t) {
    const ctx = this.ctx, w = this.w, h = this.h, p = this.progress;
    const cx = w / 2, cy = h * 0.52;
    const rx = Math.min(w * 0.38, 300), ry = Math.min(h * 0.34, 190);
    const fresh = p > 0.82;
    if (fresh && freshAt < 0) { freshAt = t; folks.forEach((f) => { f.seen = 0; }); }
    if (!fresh) freshAt = -1;

    // your ad, center
    const adColor = fresh && t - freshAt < 1.2 ? C.gold : C.accent;
    ball(ctx, cx, cy, 30, adColor, 26);
    magnet(ctx, cx, cy - 3, 0.85, 0, 0.6);
    label(ctx, fresh ? dualText('NEW ad!', 'new creative') : 'your ad', cx, cy + 52, 12, adColor, 700);

    let totalSeen = 0;
    folks.forEach((f, i) => {
      f.a += dt * 0.5;
      const prevNear = f.near;
      // position on orbit
      const px0 = cx + Math.cos(f.a) * rx, py0 = cy + Math.sin(f.a) * ry;
      // attraction window near the top of the orbit closest pass
      const d = Math.hypot(px0 - cx, py0 - cy);
      const pull = 42 / (1 + f.seen * 1.3);
      const near = Math.cos(f.a) > 0.55;          // passing the ad's side
      f.near = near;
      if (near && !prevNear) { f.seen++; f.kick = 1; }
      f.kick = Math.max(0, f.kick - dt * 1.4);
      const inX = (cx - px0) / d * pull * (near ? 1 : 0.15);
      const inY = (cy - py0) / d * pull * (near ? 1 : 0.15);
      const px = px0 + inX, py = py0 + inY;
      const boredom = clamp((f.seen - 1) / 4, 0, 1);
      const tint = fresh ? C.rival : blend(C.rival, '#3c3552', boredom);
      person(ctx, px, py, 1.25, tint, boredom > 0.7);
      if (f.kick > 0.3 && pull > 12) {
        ctx.strokeStyle = 'rgba(254,124,43,' + f.kick * 0.5 + ')';
        ctx.lineWidth = 2; ctx.setLineDash([2, 5]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
      }
      if (near && f.seen <= 1) label(ctx, dualText('ooh!', '+view'), px, py - 26, 11, C.gold, 700);
      totalSeen += f.seen;
    });
    const freq = totalSeen / folks.length;

    // frequency HUD
    ctx.fillStyle = 'rgba(26,16,37,.8)';
    ctx.beginPath(); ctx.roundRect(14, 14, 176, 56, 12); ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = C.muted; ctx.font = '500 10.5px Poppins, sans-serif';
    ctx.fillText(dualText('times each person has seen it', 'frequency'), 26, 33);
    ctx.fillStyle = freq > 3.5 ? C.red : C.cream; ctx.font = '700 20px Poppins, sans-serif';
    ctx.fillText(freq.toFixed(1) + '×', 26, 57);

    if (fresh) this.setCap('d',
      'Fresh ad! Everyone’s curious again — full-strength tugs, like day one.',
      'New creative resets the per-user prediction. Reach re-opens at prior cost.');
    else if (freq < 1.4) this.setCap('a',
      'First lap past your ad: <i>“ooh!”</i> The magnet gives every person a big tug.',
      'Low frequency: action-rate predictions at full strength, quality intact.');
    else if (freq < 3.2) this.setCap('b',
      'Third time past… smaller tug. They’ve <i>seen</i> it already.',
      'Frequency climbing: per-user estimated action rates decay; your total value erodes.');
    else this.setCap('c',
      'Five times?! Barely a twitch — and winning them now costs extra. Time for a NEW ad.',
      'Saturated audience: same people, rising CPM. Creative refresh is scheduled maintenance.');
  };
  sc.poke = function (x, y) {
    folks.forEach((f) => { f.kick = 1; });
  };
}
function blend(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const bl = Math.round(lerp(a & 255, b & 255, t));
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

/* ============================================================
   SCENE 7 · the sandbox — a playable auction floor
   ============================================================ */
function sandboxScene(sc) {
  let bodies = [], rivals = [], youBody = null;
  let spot = null;                       // the impression up for auction
  let lastContestants = new Set();       // which rivals entered the last auction
  const S = { auctions: 0, wins: 0, paySum: 0, fresh: 1, running: false };

  function rollRivals() {
    // stratified: a guaranteed spread from pushover to heavyweight, so every
    // random draw is playable — but the top tier takes real creative to beat
    const tiers = [2, 4, 6, 7, 9, 11, 14, 18];   // target bid×creative products
    rivals = tiers.map((t) => {
      const prod = t * (0.85 + rand() * 0.3);
      const creative = clamp(2 + Math.round(rand() * 10) / 2, 2, 7);
      return {
        bid: clamp(prod / creative, 0.5, 5),
        creative,
        fresh: 0.6 + rand() * 0.4,
      };
    }).sort(() => rand() - 0.5);
  }
  rollRivals();

  sc.build = function (w, h) {
    if (!M) return;
    const eng = engineOf(sc, 0.32);
    M.World.clear(eng.world, false);
    const wall = { isStatic: true, restitution: 0.9 };
    M.World.add(eng.world, [
      M.Bodies.rectangle(w / 2, h + 28, w * 2, 60, wall),
      M.Bodies.rectangle(w / 2, -28, w * 2, 60, wall),
      M.Bodies.rectangle(-28, h / 2, 60, h * 2, wall),
      M.Bodies.rectangle(w + 28, h / 2, 60, h * 2, wall),
    ]);
    bodies = [];
    rivals.forEach((r, i) => {
      const b = M.Bodies.circle(60 + rand() * (w - 120), 60 + rand() * (h - 120), 13 + r.bid * 2,
        { restitution: 0.85, frictionAir: 0.012, density: 0.002 });
      b.plugin = { rival: r, idx: i };
      bodies.push(b);
    });
    youBody = M.Bodies.circle(w / 2, h / 2, 16, { restitution: 0.85, frictionAir: 0.012, density: 0.002 });
    youBody.plugin = { you: true };
    bodies.push(youBody);
    M.World.add(eng.world, bodies);
  };

  function you() {
    return {
      bid: parseFloat($('ctlBid').value),
      creative: parseFloat($('ctlCreative').value),
      fresh: S.fresh,
    };
  }
  function tv(c, noise) { // total value: bid × action rate + quality
    const ar = 0.012 * c.creative * c.fresh;
    return (c.bid * ar * 1000 + c.creative * c.fresh * 6) * noise;
  }

  function runOne(animate) {
    const Y = you();
    // not every rival contests every impression — each auction draws 4 of the 8
    // (they're chasing other audiences too), plus you
    const idxs = rivals.map((_, i) => i).sort(() => rand() - 0.5).slice(0, 4);
    const all = idxs.map((i) => { const n = 0.85 + rand() * 0.3; return { c: rivals[i], v: tv(rivals[i], n), i }; });
    const yn = 0.85 + rand() * 0.3;
    all.push({ c: Y, v: tv(Y, yn), you: true });
    lastContestants = new Set(idxs);
    all.sort((a, b) => b.v - a.v);
    const win = all[0], second = all[1];
    S.auctions++;
    S.fresh = Math.max(0.5, S.fresh * 0.99);
    let toastMsg;
    if (win.you) {
      S.wins++;
      const yourAR = 0.012 * Y.creative * Y.fresh * yn;
      const needed = clamp((second.v - Y.creative * Y.fresh * 6 * yn) / (yourAR * 1000), 0.05, Y.bid);
      S.paySum += needed;
      toastMsg = dualText('🎉 You won the seat! You pay $' + needed.toFixed(2) + ' (you promised $' + Y.bid.toFixed(2) + ')',
                          '🎉 Won. Cleared at $' + needed.toFixed(2) + ' CPM (bid $' + Y.bid.toFixed(2) + ')');
    } else {
      toastMsg = dualText('😮 Rival #' + (win.i + 1) + ' won — their total score beat yours',
                          'Lost to rival #' + (win.i + 1) + ' — total value ' + win.v.toFixed(0) + ' vs your ' + all.find((a) => a.you).v.toFixed(0));
    }
    updateStats();
    if (animate) animateAuction(win, toastMsg);
    return { win, toastMsg };
  }

  let animT = 0, winnerBody = null;
  function animateAuction(win, msg) {
    if (!M || !sc.ready) { toast(msg); return; }
    spot = { x: sc.w / 2, y: sc.h * 0.3, life: 1.4 };
    animT = 1.4;
    winnerBody = win.you ? youBody : bodies.find((b) => b.plugin.rival && b.plugin.idx === win.i);
    toast(msg);
  }
  function toast(msg) {
    const el = $('arenaToast');
    el.innerHTML = msg;
    el.classList.add('show');
    clearTimeout(toast.tm);
    toast.tm = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function updateStats() {
    $('stAuctions').textContent = S.auctions;
    $('stWins').textContent = S.wins + ' · ' + (S.auctions ? Math.round((S.wins / S.auctions) * 100) : 0) + '%';
    $('stCpm').textContent = S.wins ? '$' + (S.paySum / S.wins).toFixed(2) : '—';
    $('freshFill').style.width = Math.round(S.fresh * 100) + '%';
  }
  function resetStats(note) {
    S.auctions = 0; S.wins = 0; S.paySum = 0;
    updateStats();
    if (note) $('deckNote').innerHTML = dual('You changed something — the scoreboard starts fresh so you can see what it did.',
                                            'Settings changed — tallies reset for a clean read.');
  }

  sc.tick = function (dt, t) {
    const ctx = this.ctx, w = this.w, h = this.h;
    if (!M) { noMatterNote(this); return; }
    const Y = you();
    // idle drift + auction lunge
    bodies.forEach((b) => {
      if (rand() < 0.02) M.Body.applyForce(b, b.position, { x: (rand() - 0.5) * 0.0015 * b.mass, y: (rand() - 0.5) * 0.0015 * b.mass });
      if (spot && animT > 0.4 && (b.plugin.you || lastContestants.has(b.plugin.idx))) {
        const cfg = b.plugin.you ? Y : b.plugin.rival;
        const pull = tv(cfg, 1) * 0.0000032 * b.mass;
        M.Body.applyForce(b, b.position, { x: (spot.x - b.position.x) * pull, y: (spot.y - b.position.y) * pull });
      }
    });
    if (animT > 0) animT -= dt;
    if (spot) { spot.life -= dt; if (spot.life <= 0) spot = null; }
    M.Engine.update(this.engine, Math.min(dt, 0.033) * 1000);
    // auction lunges can be violent — never let a ball tunnel out of the arena
    bodies.forEach((b) => {
      const r = b.circleRadius, x = b.position.x, y = b.position.y;
      if (x < r || x > w - r || y < r || y > h - r) {
        M.Body.setPosition(b, { x: clamp(x, r + 2, w - r - 2), y: clamp(y, r + 2, h - r - 2) });
        M.Body.setVelocity(b, { x: b.velocity.x * -0.3, y: b.velocity.y * -0.3 });
      }
      const sp = Math.hypot(b.velocity.x, b.velocity.y);
      if (sp > 22) M.Body.setVelocity(b, { x: b.velocity.x * 22 / sp, y: b.velocity.y * 22 / sp });
    });

    // impression spot
    if (spot) {
      ctx.strokeStyle = 'rgba(255,197,69,.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(spot.x, spot.y, 26 + Math.sin(t * 8) * 3, 0, 6.29); ctx.stroke(); ctx.setLineDash([]);
      person(ctx, spot.x, spot.y, 1.4, C.gold, false);
      label(ctx, dualText('one empty seat!', '1 impression'), spot.x, spot.y - 34, 11, C.gold, 700);
    }

    // bodies
    bodies.forEach((b) => {
      if (b.plugin.you) {
        const r = 12 + Y.bid * 2;
        if (Math.abs(b.circleRadius - r) > 1) M.Body.scale(b, r / b.circleRadius, r / b.circleRadius);
        ball(ctx, b.position.x, b.position.y, r, C.accent, 12 + Y.creative * 2.6);
        label(ctx, 'YOU', b.position.x, b.position.y + 4, 11, C.white, 800);
      } else {
        const rv = b.plugin.rival;
        ctx.globalAlpha = 0.55 + rv.fresh * 0.45;
        ball(ctx, b.position.x, b.position.y, b.circleRadius, C.rival, rv.creative * 2);
        ctx.globalAlpha = 1;
        label(ctx, '#' + (b.plugin.idx + 1), b.position.x, b.position.y + 4, 10, 'rgba(252,243,214,.85)', 600);
      }
      if (b === winnerBody && spot) {
        ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.circleRadius + 7, 0, 6.29); ctx.stroke();
      }
    });
  };
  sc.poke = function (x, y, pow) { if (M) pokeBodies(this, bodies, x, y, pow); };

  /* ---- controls ---- */
  function refreshVals() {
    $('valBid').textContent = '$' + parseFloat($('ctlBid').value).toFixed(2);
    $('valCreative').textContent = parseFloat($('ctlCreative').value);
  }
  $('ctlBid').addEventListener('input', () => { refreshVals(); resetStats(true); });
  $('ctlCreative').addEventListener('input', () => { refreshVals(); resetStats(true); });
  $('btnRefresh').addEventListener('click', () => {
    S.fresh = 1; updateStats();
    toast(dualText('✨ Brand-new ad — everyone’s curious again!', '✨ Creative refreshed — freshness back to 100%'));
  });
  $('btnReroll').addEventListener('click', () => {
    rollRivals(); sc.build(sc.w, sc.h); resetStats(false);
    toast(dualText('🎲 Eight brand-new rivals rolled up!', '🎲 Competitor set re-randomized'));
  });
  $('btnRun1').addEventListener('click', () => { if (!S.running) runOne(true); });
  $('btnRun20').addEventListener('click', () => {
    if (S.running) return;
    S.running = true;
    let n = 0, lastWin = null;
    const iv = setInterval(() => {
      const res = runOne(false);
      if (res.win.you) lastWin = res;
      if (++n >= 20) {
        clearInterval(iv);
        S.running = false;
        animateAuction(res.win, dualText(
          '⚡ 20 contests done — you won ' + S.wins + ' of ' + S.auctions + ' (see the price box!)',
          '⚡ Batch complete — ' + S.wins + '/' + S.auctions + ' won · eCPM $' + (S.wins ? (S.paySum / S.wins).toFixed(2) : '—')));
      }
    }, 70);
  });
  $('deckNote').innerHTML = dual(
    'Tip: watch the orange price box. More <b>money</b> can’t shrink it. More <b>goodness</b> can.',
    'Clearing price ≈ runner-up value ÷ your action rate. Bid↑ ⇒ win-rate↑, CPM flat. Creative↑ ⇒ both improve.');
  refreshVals();
  updateStats();
}

/* ============================================================
   orchestration: scroll, pinning progress, rail, run-loop
   ============================================================ */
const factories = {
  seesaw: seesawScene, forces: forcesScene, discount: discountScene,
  learning: learningScene, pacing: pacingScene, fatigue: fatigueScene, sandbox: sandboxScene,
};
const steps = Array.from(document.querySelectorAll('.step'));
steps.forEach((sec) => {
  const name = sec.dataset.scene;
  scenes[name] = makeScene(sec, factories[name]);
});

const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    const name = en.target.dataset.scene;
    if (en.isIntersecting) running.add(name); else running.delete(name);
  });
}, { rootMargin: '120px 0px' });
steps.forEach((s) => io.observe(s));

const railDots = Array.from(document.querySelectorAll('#railDots li'));
railDots.forEach((li) => li.addEventListener('click', () => {
  const target = $(li.dataset.target);
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}));

function onScroll() {
  const vh = window.innerHeight;
  const sy = window.scrollY;
  // per-step progress for pinned sections
  steps.forEach((sec) => {
    const name = sec.dataset.scene;
    if (!running.has(name)) return;
    if (sec.classList.contains('sandbox')) return;
    const top = sec.offsetTop, hgt = sec.offsetHeight;
    scenes[name].progress = clamp((sy - top) / (hgt - vh), 0, 1);
  });
  // rail
  const doc = document.documentElement;
  $('railFill').style.height = clamp(sy / (doc.scrollHeight - vh), 0, 1) * 100 + '%';
  const mid = sy + vh * 0.5;
  let active = -1;
  steps.forEach((sec, i) => {
    if (mid >= sec.offsetTop && mid < sec.offsetTop + sec.offsetHeight) active = i;
  });
  railDots.forEach((li, i) => li.classList.toggle('active', i === active));
}
window.addEventListener('scroll', onScroll, { passive: true });

let lastT = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  running.forEach((name) => scenes[name].frame(dt));
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

let rsTm;
window.addEventListener('resize', () => {
  clearTimeout(rsTm);
  rsTm = setTimeout(() => { Object.values(scenes).forEach((s) => { s.ready = false; }); onScroll(); }, 150);
});
onScroll();
})();
