/* ============================================================
   Creative Is the Targeting · The Growth Den Lab
   ~2,000 dots = people with hidden traits. The creative you
   assemble emits a signal; the matching crowd assembles itself.
   Fully static, no libraries, no APIs, no data collected.
   ============================================================ */
(function () {
'use strict';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const rand = Math.random;
const dual = (kid, cmo) => '<span class="kid">' + kid + '</span><span class="cmo">' + cmo + '</span>';

/* ---------------- mode toggle (shared with /lab/the-auction/) ---------------- */
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

/* ---------------- trait model ---------------- */
// interest bits
const PARENT = 1, GADGET = 2, ORAL = 4, DESIGN = 8, SKEPTIC = 16, BUDGET = 32, HUMOR = 64, HEALTH = 128;
const AGE_LABELS = ['18–27', '28–44', '45–65'];
const NAMES = ['Sam', 'Priya', 'Marcus', 'Elena', 'Jo', 'Tariq', 'Maya', 'Dev', 'Rosa', 'Kenji', 'Ash', 'Nadia',
  'Leo', 'Fatima', 'Casey', 'Iris', 'Owen', 'Zara', 'Miles', 'Anya', 'Theo', 'Bex', 'Noor', 'Gus'];

const INT_TIP = {
  [PARENT]:  { kid: 'kid fights the toothbrush', cmo: 'parenting' },
  [GADGET]:  { kid: 'reads gadget reviews for fun', cmo: 'gadgets' },
  [ORAL]:    { kid: 'teeth have been complaining', cmo: 'oral-care struggles' },
  [DESIGN]:  { kid: 'loves pretty satisfying things', cmo: 'design/aesthetics' },
  [SKEPTIC]: { kid: '“prove it” type', cmo: 'skeptical evaluator' },
  [BUDGET]:  { kid: 'hunts for deals', cmo: 'price-sensitive' },
  [HUMOR]:   { kid: 'here for the jokes', cmo: 'humor-responsive' },
  [HEALTH]:  { kid: 'takes health seriously', cmo: 'health-conscious' },
};
const AWARE_TIP = [
  { kid: "doesn't know they need it yet", cmo: 'unaware' },
  { kid: 'knows something’s wrong', cmo: 'problem-aware' },
  { kid: 'already shopping around', cmo: 'solution-aware' },
];

/* ---------------- the creative chips ---------------- */
// spec = specificity: how sharply this fragment selects for someone in particular.
// flat chips (the generic ones) speak to everyone equally — which is to say, no one.
const CHIPS = [
  // HOOK
  { cat: 'hook', label: '“My dentist yelled at me”', spec: .85, ages: [.5, .6, .75], ints: { [ORAL]: .95, [HEALTH]: .6, [SKEPTIC]: .3 }, aware: [.3, .95, .7] },
  { cat: 'hook', label: '“POV: your kid actually brushes”', spec: .9, ages: [.15, .95, .35], ints: { [PARENT]: .98, [HUMOR]: .5 }, aware: [.35, .95, .6] },
  { cat: 'hook', label: '“I tested 5 of these so you don’t have to”', spec: .8, ages: [.85, .7, .4], ints: { [GADGET]: .95, [SKEPTIC]: .85, [DESIGN]: .5 }, aware: [.4, .6, .95] },
  { cat: 'hook', label: '“This changed my mornings ✨”', spec: .3, ages: [.6, .6, .5], ints: { [DESIGN]: .4 }, aware: [.5, .55, .5] },
  { cat: 'hook', label: '“The best toothbrush. Period.”', spec: .08, flat: true },
  // VISUAL
  { cat: 'visual', label: 'founder talking to camera', spec: .7, ages: [.5, .7, .7], ints: { [SKEPTIC]: .7, [BUDGET]: .4 }, aware: [.4, .7, .7] },
  { cat: 'visual', label: 'messy-bathroom kid demo', spec: .9, ages: [.1, .95, .3], ints: { [PARENT]: .95, [HUMOR]: .6 }, aware: [.4, .9, .6] },
  { cat: 'visual', label: 'bristle macro / ASMR texture', spec: .75, ages: [.9, .6, .3], ints: { [DESIGN]: .9, [GADGET]: .7 }, aware: [.5, .5, .8] },
  { cat: 'visual', label: 'before / after smile', spec: .8, ages: [.5, .6, .7], ints: { [ORAL]: .9, [HEALTH]: .7 }, aware: [.3, .9, .7] },
  { cat: 'visual', label: 'stock smiling family', spec: .1, flat: true },
  // TONE
  { cat: 'tone', label: 'funny', spec: .6, ages: [.9, .7, .35], ints: { [HUMOR]: .9, [PARENT]: .5 }, aware: [.6, .6, .5] },
  { cat: 'tone', label: 'clinical', spec: .7, ages: [.3, .5, .9], ints: { [SKEPTIC]: .8, [HEALTH]: .8 }, aware: [.3, .6, .9] },
  { cat: 'tone', label: 'confessional', spec: .75, ages: [.6, .75, .6], ints: { [ORAL]: .7, [PARENT]: .5 }, aware: [.35, .95, .6] },
  { cat: 'tone', label: 'professional™', spec: .1, flat: true },
  // PROOF
  { cat: 'proof', label: '4,132 five-star reviews', spec: .6, ages: [.6, .7, .6], ints: { [SKEPTIC]: .85, [BUDGET]: .6 }, aware: [.4, .7, .8] },
  { cat: 'proof', label: 'dentist-approved study', spec: .7, ages: [.35, .55, .9], ints: { [HEALTH]: .85, [SKEPTIC]: .6 }, aware: [.3, .7, .85] },
  { cat: 'proof', label: 'live plaque-reveal demo', spec: .85, ages: [.6, .7, .5], ints: { [ORAL]: .9, [GADGET]: .6 }, aware: [.3, .95, .7] },
  { cat: 'proof', label: '“trust us”', spec: .05, flat: true },
];
const CATS = ['hook', 'visual', 'tone', 'proof'];
const PRESET_SPECIFIC = [1, 6, 10, 16];   // POV kid + kid demo + funny + plaque reveal
const PRESET_GENERIC = [4, 9, 13, 17];    // all the beige
const PRESET_B = [2, 7, 11, 14];          // gadget reviewer
const PRESET_C = [0, 8, 12, 15];          // dentist confession

/* ---------------- the town ---------------- */
const canvas = $('field');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1, N = 0;
const P = [];             // particles
let scoreSPEC, scoreGEN, scoreA, scoreB, scoreC, scoreBUILD, fitRef;
let wrongCount = 0, missedCount = 0;

function makePerson() {
  const ar = rand();
  const age = ar < .35 ? 0 : ar < .75 ? 1 : 2;
  let ints = 0;
  if (rand() < (age === 1 ? .5 : .18)) ints |= PARENT;
  if (rand() < (age === 0 ? .45 : .25)) ints |= GADGET;
  if (rand() < .25) ints |= ORAL;
  if (rand() < .2) ints |= DESIGN;
  if (rand() < .3) ints |= SKEPTIC;
  if (rand() < .25) ints |= BUDGET;
  if (rand() < (age === 0 ? .55 : .35)) ints |= HUMOR;
  if (rand() < (age === 2 ? .45 : .25)) ints |= HEALTH;
  const aw = rand();
  const aware = (ints & ORAL) ? (aw < .25 ? 0 : aw < .75 ? 1 : 2) : (aw < .55 ? 0 : aw < .85 ? 1 : 2);
  return {
    x: rand(), y: rand(), vx: 0, vy: 0,
    z: .45 + rand() * .55, tw: rand() * 6.28, col: Math.floor(rand() * 3),
    age, ints, aware,
    name: NAMES[Math.floor(rand() * NAMES.length)] + ', ' + (19 + age * 13 + Math.floor(rand() * 12)),
    declP: (ints & PARENT) ? rand() < .62 : rand() < .12,
    declO: (ints & ORAL) ? rand() < .55 : rand() < .08,
    declA: age === 1 ? rand() < .8 : rand() < .12,
    offR: .35 + rand() * .65, offA: rand() * 6.28,
    glow: 0, gTarget: 0, gCol: 0, sx: 0, sy: 0,
  };
}

function chipScore(chip, p) {
  if (chip.flat) return .48 + (((p.ints * 7 + p.age * 13) % 10) / 10 - .5) * .06; // everyone, mildly; no one, really
  let iW = .15;
  for (const bit in chip.ints) if (p.ints & bit) iW = Math.max(iW, chip.ints[bit]);
  return .35 * chip.ages[p.age] + .45 * iW + .2 * chip.aware[p.aware];
}
function scoreAll(chipIdxs) {
  const arr = new Float32Array(N);
  if (!chipIdxs.length) return arr;
  for (let i = 0; i < N; i++) {
    let s = 0;
    chipIdxs.forEach((ci) => { s += chipScore(CHIPS[ci], P[i]); });
    arr[i] = s / chipIdxs.length;
  }
  return arr;
}
function signalOf(chipIdxs) {
  if (!chipIdxs.length) return 0;
  const spec = chipIdxs.reduce((s, ci) => s + CHIPS[ci].spec, 0) / chipIdxs.length;
  return spec * (.45 + .55 * chipIdxs.length / 4);
}
const MATCH_T = .66;
const GLOW_SPAN = .22;   // score above threshold → full glow over this span

/* ---------------- sprites ---------------- */
function makeSprite(color, glow) {
  const s = document.createElement('canvas');
  const r = 24; s.width = s.height = r * 2;
  const c = s.getContext('2d');
  const g = c.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, color);
  g.addColorStop(glow ? .25 : .45, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, r * 2, r * 2);
  return s;
}
const SPR = {
  base: [makeSprite('rgba(232,222,240,.85)'), makeSprite('rgba(190,200,235,.8)'), makeSprite('rgba(247,238,214,.8)')],
  glow: [makeSprite('rgba(254,124,43,1)', true), makeSprite('rgba(255,197,69,1)', true), makeSprite('rgba(127,200,240,1)', true), makeSprite('rgba(229,52,11,.95)', true)],
};

/* ---------------- field state ---------------- */
let mode = 'idle', modeProg = 0, t = 0, parallax = 1, scrollYNow = 0;
let ripples = [], rippleTimer = 0;
let selected = { hook: -1, visual: -1, tone: -1, proof: -1 };
let builderSignal = 0, builderDirty = true;

const isMobile = () => W < 900;
const anchor = () => ({ x: isMobile() ? .5 : .66, y: isMobile() ? .3 : .46 });
const BEACONS3 = () => {
  const a = anchor(), s = isMobile() ? .8 : 1;
  return [
    { x: a.x - .17 * s, y: a.y - .13 * s, col: 0 },
    { x: a.x + .16 * s, y: a.y - .1 * s, col: 1 },
    { x: a.x, y: a.y + .17 * s, col: 2 },
  ];
};
const CIRCLES = () => {
  const a = anchor(), s = isMobile() ? .8 : 1;
  return [
    { x: a.x - .1 * s, y: a.y - .1 * s, r: .15 * s, label: dualT('“parents”', '“parenting”') },
    { x: a.x + .12 * s, y: a.y + .02 * s, r: .13 * s, label: dualT('“teeth people”', '“oral care”') },
    { x: a.x - .02 * s, y: a.y + .15 * s, r: .11 * s, label: '“25–34”' },
  ];
};
function dualT(kid, cmo) { return document.body.classList.contains('mode-kid') ? kid : cmo; }

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  const target = clamp(Math.round(W * H / 550), 450, 2000);
  while (P.length < target) P.push(makePerson());
  P.length = target;
  N = target;
  recomputeStatic();
}

function recomputeStatic() {
  scoreSPEC = scoreAll(PRESET_SPECIFIC);
  scoreGEN = scoreAll(PRESET_GENERIC);
  scoreA = scoreSPEC;
  scoreB = scoreAll(PRESET_B);
  scoreC = scoreAll(PRESET_C);
  fitRef = new Uint8Array(N);
  wrongCount = 0; missedCount = 0;
  for (let i = 0; i < N; i++) {
    fitRef[i] = scoreSPEC[i] >= MATCH_T ? 1 : 0;
    const p = P[i];
    const declared = p.declP || p.declO || p.declA;
    if (declared && !fitRef[i]) wrongCount++;
    if (!declared && fitRef[i]) missedCount++;
  }
  builderDirty = true;
}

/* ---------------- per-frame targets by mode ---------------- */
function retarget() {
  const sigSpec = signalOf(PRESET_SPECIFIC);
  for (let i = 0; i < N; i++) {
    const p = P[i];
    p.pull = 0; p.gTarget = 0; p.gCol = 0; p.circleIdx = -1;
    if (mode === 'circles') {
      const declared = p.declP || p.declO || p.declA;
      if (declared && modeProg > .08) {
        p.pull = clamp((modeProg - .08) / .3, 0, 1) * .9;
        p.circleIdx = p.declP ? 0 : p.declO ? 1 : 2;
        if (modeProg > .45 && !fitRef[i]) { p.gTarget = .5; p.gCol = 3; }        // wrong person captured
      } else if (!declared && fitRef[i] && modeProg > .45) {
        p.gTarget = .45 + Math.sin(t * 3 + p.tw) * .2; p.gCol = 1;              // right person missed
      }
    } else if (mode === 'signal') {
      const g = clamp((scoreSPEC[i] - MATCH_T) / GLOW_SPAN, 0, 1);
      const ramp = clamp((modeProg - .1) / .5, 0, 1);
      p.gTarget = g * ramp; p.gCol = 0;
      p.pull = g * ramp * sigSpec * 1.2;
    } else if (mode === 'bland') {
      // nobody clears the bar; the fog just churns
      p.gTarget = 0; p.pull = 0;
    } else if (mode === 'multi') {
      const s = [scoreA[i], scoreB[i], scoreC[i]];
      let best = 0; if (s[1] > s[best]) best = 1; if (s[2] > s[best]) best = 2;
      const g = clamp((s[best] - MATCH_T) / GLOW_SPAN, 0, 1);
      const ramp = clamp((modeProg - .05) / .45, 0, 1);
      p.gTarget = g * ramp; p.gCol = best; p.beacon = best;
      p.pull = g * ramp;
    } else if (mode === 'builder') {
      if (builderDirty) break; // handled after recompute
      const g = clamp((scoreBUILD[i] - MATCH_T) / GLOW_SPAN, 0, 1) * clamp(builderSignal * 1.7, 0, 1);
      p.gTarget = g; p.gCol = 0;
      p.pull = g * clamp(builderSignal * 1.4, 0, 1);
    }
  }
}

/* ---------------- update + draw ---------------- */
function frame(dt) {
  t += dt;
  const parTarget = mode === 'idle' ? 1 : 0;
  parallax = lerp(parallax, parTarget, dt * 2.5);

  if (mode === 'builder' && builderDirty) {
    scoreBUILD = scoreAll(selectedIdxs());
    builderSignal = signalOf(selectedIdxs());
    builderDirty = false;
    updateReadout();
  }
  retarget();

  const a = anchor();
  const beacons = BEACONS3();
  const circles = CIRCLES();
  const spread = mode === 'builder'
    ? lerp(.34, .1, builderSignal)
    : lerp(.3, .11, signalOf(PRESET_SPECIFIC) * clamp(modeProg * 2, 0, 1));

  for (let i = 0; i < N; i++) {
    const p = P[i];
    // brownian drift
    p.vx += (rand() - .5) * .012 * dt * 60;
    p.vy += (rand() - .5) * .012 * dt * 60;
    p.vx *= .92; p.vy *= .92;
    const drift = mode === 'bland' ? 1.8 : 1;   // bland = agitated scatter
    p.x += p.vx * dt * .06 * drift;
    p.y += p.vy * dt * .06 * drift;

    // gather toward the signal
    if (p.pull > 0.01) {
      let tx, ty, rr;
      if (mode === 'circles') {
        const c = circles[p.circleIdx];
        tx = c.x + Math.cos(p.offA) * c.r * .8 * p.offR;
        ty = c.y + Math.sin(p.offA) * c.r * .8 * p.offR;
      } else if (mode === 'multi') {
        const b = beacons[p.beacon];
        rr = lerp(.16, .05, p.gTarget) * p.offR + .025;
        tx = b.x + Math.cos(p.offA) * rr;
        ty = b.y + Math.sin(p.offA) * rr;
      } else {
        rr = spread * p.offR + .02;
        tx = a.x + Math.cos(p.offA) * rr;
        ty = a.y + Math.sin(p.offA) * rr * (isMobile() ? .7 : .85);
      }
      const k = clamp(p.pull * dt * 2.2, 0, .2);
      p.x += (tx - p.x) * k;
      p.y += (ty - p.y) * k;
    }
    // wrap
    if (p.x < -.02) p.x += 1.04; if (p.x > 1.02) p.x -= 1.04;
    if (p.y < -.02) p.y += 1.04; if (p.y > 1.02) p.y -= 1.04;

    p.glow = lerp(p.glow, p.gTarget, dt * 3);
  }

  draw(circles, beacons, a);
}

function draw(circles, beacons, a) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // ripples
  const sig = mode === 'builder' ? builderSignal : mode === 'bland' ? .12 : signalOf(PRESET_SPECIFIC);
  if (mode === 'signal' || mode === 'bland' || mode === 'builder' || mode === 'multi') {
    rippleTimer -= 1 / 60;
    const period = lerp(3.2, 1.3, sig);
    if (rippleTimer <= 0 && (mode !== 'builder' || selectedIdxs().length)) {
      rippleTimer = period;
      if (mode === 'multi') beacons.forEach((b, bi) => ripples.push({ x: b.x, y: b.y, r: 0, life: 1, col: bi }));
      else ripples.push({ x: a.x, y: a.y, r: 0, life: 1, col: 0 });
    }
    ripples.forEach((r) => { r.r += (1 / 60) * lerp(.06, .16, sig); r.life -= (1 / 60) / lerp(3.4, 1.9, sig); });
    ripples = ripples.filter((r) => r.life > 0);
    const rcols = ['254,124,43', '255,197,69', '127,200,240'];
    ripples.forEach((r) => {
      ctx.strokeStyle = 'rgba(' + rcols[r.col] + ',' + (r.life * lerp(.1, .45, sig)) + ')';
      ctx.lineWidth = lerp(1, 2.5, sig);
      ctx.beginPath();
      ctx.arc(r.x * W, r.y * H, r.r * Math.min(W, H) * 2.2, 0, 6.29);
      ctx.stroke();
    });
  }

  // interest circles (beat 1)
  if (mode === 'circles') {
    const growth = clamp(modeProg / .35, 0, 1);
    ctx.setLineDash([7, 8]);
    circles.forEach((c, i) => {
      const g = clamp(growth * 3 - i, 0, 1);
      if (g <= 0) return;
      ctx.strokeStyle = 'rgba(252,243,214,.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const R = c.r * Math.min(W, H) * 1.6 * g;
      for (let k = 0; k <= 40; k++) {
        const ang = (k / 40) * 6.283;
        const wob = 1 + Math.sin(ang * 5 + i * 2) * .03;
        const px = c.x * W + Math.cos(ang) * R * wob;
        const py = c.y * H + Math.sin(ang) * R * wob;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      if (g > .9) {
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(252,243,214,.75)';
        ctx.font = '600 13px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.label, c.x * W, c.y * H - R - 10);
        ctx.setLineDash([7, 8]);
      }
    });
    ctx.setLineDash([]);
  }

  // beacons (the creative "ad card")
  function drawBeacon(bx, by, colIdx, s) {
    const bob = Math.sin(t * 2 + colIdx) * 3;
    const x = bx * W, y = by * H + bob;
    const cols = ['#fe7c2b', '#ffc545', '#7fc8f0'];
    ctx.fillStyle = 'rgba(26,16,37,.95)';
    ctx.strokeStyle = cols[colIdx];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - 21 * s, y - 15 * s, 42 * s, 30 * s, 7 * s);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = cols[colIdx];
    ctx.beginPath();
    ctx.moveTo(x - 5 * s, y - 7 * s); ctx.lineTo(x + 8 * s, y); ctx.lineTo(x - 5 * s, y + 7 * s);
    ctx.closePath(); ctx.fill();
  }
  if (mode === 'signal' || (mode === 'builder' && selectedIdxs().length) || mode === 'bland') drawBeacon(a.x, a.y, 0, 1);
  if (mode === 'multi') beacons.forEach((b, i) => drawBeacon(b.x, b.y, i, .8));

  // people
  for (let i = 0; i < N; i++) {
    const p = P[i];
    const par = parallax * (1 - p.glow);
    let sy = p.y * H - scrollYNow * .05 * (1 - p.z) * par;
    sy = ((sy % H) + H) % H;
    const sx = p.x * W;
    p.sx = sx; p.sy = sy;
    const size = (1.7 + p.z * 2.7) * (1 + p.glow * .9);
    const alpha = (.4 + p.z * .45) * (1 + Math.sin(t * 1.4 + p.tw) * .18);
    ctx.globalAlpha = clamp(alpha, .1, 1);
    ctx.drawImage(SPR.base[p.col], sx - size, sy - size, size * 2, size * 2);
    if (p.glow > .04) {
      ctx.globalAlpha = clamp(p.glow, 0, 1);
      const gs = size * 1.9;
      ctx.drawImage(SPR.glow[p.gCol], sx - gs, sy - gs, gs * 2, gs * 2);
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------------- scroll orchestration ---------------- */
const beats = Array.from(document.querySelectorAll('.beat'));
const railDots = Array.from(document.querySelectorAll('#railDots li'));
railDots.forEach((li) => li.addEventListener('click', () => {
  const el = $(li.dataset.target);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}));

function onScroll() {
  scrollYNow = window.scrollY;
  const vh = window.innerHeight;
  const mid = scrollYNow + vh * .5;
  let act = beats[0], actIdx = 0;
  beats.forEach((b, i) => {
    if (mid >= b.offsetTop) { act = b; actIdx = i; }
  });
  const newMode = act.dataset.mode;
  if (newMode !== mode) { mode = newMode; if (mode === 'builder') builderDirty = true; }
  modeProg = clamp((mid - act.offsetTop) / act.offsetHeight, 0, 1);
  const doc = document.documentElement;
  $('railFill').style.height = clamp(scrollYNow / (doc.scrollHeight - vh), 0, 1) * 100 + '%';
  railDots.forEach((li, i) => li.classList.toggle('active', i === actIdx));

  // live DOM bits
  if (mode === 'circles') {
    const reveal = clamp((modeProg - .4) / .3, 0, 1);
    $('cWrong').textContent = Math.round(wrongCount * reveal);
    $('cMissed').textContent = Math.round(missedCount * reveal);
  }
  if (mode === 'bland') {
    const cost = lerp(6.5, 18, clamp(modeProg * 1.7, 0, 1));
    $('blandCost').textContent = '$' + cost.toFixed(2);
    $('blandBar').style.width = lerp(24, 96, clamp(modeProg * 1.7, 0, 1)) + '%';
  }
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------------- the builder ---------------- */
function selectedIdxs() {
  return CATS.map((c) => selected[c]).filter((i) => i >= 0);
}
function buildChips() {
  CATS.forEach((cat) => {
    const row = document.querySelector('.chip-group[data-cat="' + cat + '"] .chip-row');
    CHIPS.forEach((chip, idx) => {
      if (chip.cat !== cat) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (chip.flat ? ' generic' : '');
      b.textContent = chip.label;
      b.addEventListener('click', () => {
        selected[cat] = selected[cat] === idx ? -1 : idx;
        syncChips(); builderDirty = true;
      });
      b.dataset.idx = idx;
      row.appendChild(b);
    });
  });
}
function syncChips() {
  document.querySelectorAll('.chip').forEach((b) => {
    const idx = parseInt(b.dataset.idx, 10);
    b.classList.toggle('selected', CATS.some((c) => selected[c] === idx));
  });
}
function applyPreset(idxs) {
  selected = { hook: -1, visual: -1, tone: -1, proof: -1 };
  idxs.forEach((i) => { selected[CHIPS[i].cat] = i; });
  syncChips(); builderDirty = true;
}
$('btnSpecific').addEventListener('click', () => applyPreset(PRESET_SPECIFIC));
$('btnGeneric').addEventListener('click', () => applyPreset(PRESET_GENERIC));
$('btnClear').addEventListener('click', () => applyPreset([]));

const PERSONA = {
  [PARENT]:  { kid: 'moms & dads whose kids fight the toothbrush', cmo: 'parents of picky brushers' },
  [ORAL]:    { kid: 'people whose teeth have been yelling at them', cmo: 'oral-care strugglers' },
  [GADGET]:  { kid: 'gadget nerds who read reviews for fun', cmo: 'research-heavy gadget buyers' },
  [DESIGN]:  { kid: 'people who love pretty, satisfying things', cmo: 'aesthetics-led buyers' },
  [SKEPTIC]: { kid: 'the “prove it to me” crowd', cmo: 'skeptical evaluators' },
  [HEALTH]:  { kid: 'the health-careful folks', cmo: 'health-conscious buyers' },
  [HUMOR]:   { kid: 'people here for a laugh', cmo: 'entertainment-first scrollers' },
  [BUDGET]:  { kid: 'careful spenders', cmo: 'value-driven buyers' },
};
const AWARE_RO = [
  { kid: 'who don’t know they need it yet', cmo: 'unaware' },
  { kid: 'who already know something’s wrong', cmo: 'problem-aware' },
  { kid: 'who are already shopping', cmo: 'solution-aware' },
];

function updateReadout() {
  const idxs = selectedIdxs();
  const roN = $('roCount'), roT = $('roTight'), roC = $('roCost'), roP = $('roPersona'), note = $('roNote');
  if (!idxs.length) {
    roP.innerHTML = dual('pick some chips and see…', 'select chips to resolve a cohort…');
    roN.textContent = '—'; roT.style.width = '0%'; roC.textContent = '—';
    note.innerHTML = '';
    return;
  }
  let matched = 0;
  const intTally = {}, ageTally = [0, 0, 0], awTally = [0, 0, 0];
  const popInt = {}, popAw = [0, 0, 0];
  for (let i = 0; i < N; i++) {
    const p = P[i];
    for (const bit in PERSONA) if (p.ints & bit) popInt[bit] = (popInt[bit] || 0) + 1;
    popAw[p.aware]++;
    if (scoreBUILD[i] < MATCH_T) continue;
    matched++;
    for (const bit in PERSONA) if (p.ints & bit) intTally[bit] = (intTally[bit] || 0) + 1;
    ageTally[p.age]++; awTally[p.aware]++;
  }
  roN.textContent = matched;
  const tight = Math.round(clamp(builderSignal, 0, 1) * 100);
  roT.style.width = tight + '%';
  const cost = lerp(18, 4.5, builderSignal);
  roC.textContent = '$' + cost.toFixed(2);

  if (matched >= Math.max(8, N * .008)) {
    // the defining trait is the one most over-represented vs. the town, not the most common
    const lift = (bit) => ((intTally[bit] || 0) / matched) / Math.max((popInt[bit] || 1) / N, .02);
    const topInt = Object.keys(PERSONA)
      .filter((bit) => (intTally[bit] || 0) / matched > .3)
      .sort((a, b) => lift(b) - lift(a))[0] || Object.keys(intTally).sort((a, b) => intTally[b] - intTally[a])[0];
    const topAge = ageTally.indexOf(Math.max(...ageTally));
    const awLift = (i) => (awTally[i] / matched) / Math.max(popAw[i] / N, .02);
    const topAw = [0, 1, 2].filter((i) => awTally[i] / matched > .25).sort((a, b) => awLift(b) - awLift(a))[0]
      ?? awTally.indexOf(Math.max(...awTally));
    const per = PERSONA[topInt] || PERSONA[PARENT];
    roP.innerHTML = dual(
      per.kid + ', ' + AGE_LABELS[topAge] + ', ' + AWARE_RO[topAw].kid,
      per.cmo + ', ' + AGE_LABELS[topAge] + ', ' + AWARE_RO[topAw].cmo);
  } else {
    roP.innerHTML = dual('…nobody in particular showed up.', '…no resolvable cohort.');
  }

  if (builderSignal < .28) note.innerHTML = dual(
    'See? A boring whistle empties the street. Add something only <b>some</b> people would love.',
    'Sub-threshold signal: expect broad exploration, slow learning, premium CPAs. Sharpen a dimension.');
  else if (builderSignal < .6) note.innerHTML = dual(
    'Getting warmer — a little crowd is forming. Make it weirder. More specific!',
    'Partial resolution. Push specificity on the weakest slot; coherence beats coverage.');
  else note.innerHTML = dual(
    'Look at them huddle! This ad knows <b>exactly</b> who it’s for.',
    'Tight cohort, high-resolution signal. Ship it — then build the next concept for a different pocket.');
}

/* ---------------- tap a dot, meet a person ---------------- */
const tip = $('dotTip');
let tipTimer = null;
canvas.addEventListener('pointerdown', (e) => {
  let best = null, bd = 1e9;
  for (let i = 0; i < N; i++) {
    const dx = P[i].sx - e.clientX, dy = P[i].sy - e.clientY;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = P[i]; }
  }
  if (!best || bd > 40 * 40) { tip.hidden = true; return; }
  const intBits = Object.keys(INT_TIP).filter((b) => best.ints & b);
  const pick2 = intBits.slice(0, 2).map((b) => INT_TIP[b]);
  tip.innerHTML = '<b>' + best.name + '</b><br>' + dual(
    (pick2.map((x) => x.kid).join(' · ') || 'just vibing') + '<br><i>' + AWARE_TIP[best.aware].kid + '</i>',
    (pick2.map((x) => x.cmo).join(' · ') || 'no strong interests') + ' · ' + AWARE_TIP[best.aware].cmo);
  tip.style.left = clamp(e.clientX, 10, W - 240) + 'px';
  tip.style.top = clamp(e.clientY - 8, 70, H - 20) + 'px';
  tip.hidden = false;
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { tip.hidden = true; }, 2800);
  // little hello nudge
  best.vx += (rand() - .5) * 3; best.vy -= 2;
});

/* ---------------- run ---------------- */
buildChips();
resize();
onScroll();
let rsTm;
window.addEventListener('resize', () => { clearTimeout(rsTm); rsTm = setTimeout(() => { resize(); onScroll(); }, 150); });

let lastT = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - lastT) / 1000);
  lastT = now;
  frame(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})();
