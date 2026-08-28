/* ============================================================
   Lemonade Economy · The Growth Den Lab
   A 14-day lemonade-stand summer inside a simulated town of
   ~120 agent customers. Secretly a real economics lesson.
   Fully static: no accounts, no network, state in localStorage.
   ============================================================ */
(function () {
'use strict';

/* ---------------- tiny helpers ---------------- */
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = Math.random;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const money = (cents) => (cents < 0 ? '-$' : '$') + (Math.abs(cents) / 100).toFixed(2);
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
// dual-mode text: kid mode and CMO mode both live in the DOM, CSS shows one
const dual = (kid, cmo) => '<span class="kid">' + kid + '</span><span class="cmo">' + cmo + '</span>';

const SAVE_KEY = 'lemonade-economy-save-v1';
const PREF_KEY = 'lemonade-economy-prefs-v1';

function storeGet(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function storeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode etc. — play on without saving */ }
}
function storeDel(key) {
  try { localStorage.removeItem(key); } catch (e) { }
}

/* ---------------- game constants ---------------- */
const DAYS = 14;
const TOWN_SIZE = 120;
const RIVAL_DAY = 7;      // rival stand opens across the street
const HEAT_DAY = 5;       // guaranteed heatwave
const SOCCER_DAY = 11;    // big soccer game crowd
const SIGN_COST = 200;    // cents per day
const RECIPES = {
  cheap: { cost: 20, label: 'Cheap mix' },
  fresh: { cost: 50, label: 'Fresh-squeezed' },
};
const WEATHER = {
  sun:   { icon: '☀️', thirst: 1.0,  traffic: 0.40, kid: 'Sunny and warm',            cmo: 'Sunny — baseline demand' },
  cloud: { icon: '⛅', thirst: 0.65, traffic: 0.33, kid: 'Cloudy and cool-ish',        cmo: 'Overcast — demand softens' },
  rain:  { icon: '🌧', thirst: 0.30, traffic: 0.16, kid: 'Rainy — bring an umbrella!', cmo: 'Rain — traffic and intent both drop' },
  heat:  { icon: '🥵', thirst: 1.55, traffic: 0.52, kid: 'HEATWAVE! Super duper hot!', cmo: 'Heat spike — peak seasonal demand' },
};

/* ---------------- sound ---------------- */
let audioCtx = null;
let muted = false;
function beep(freqs, dur, type, gainAmt) {
  if (muted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime;
    freqs.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type || 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + i * 0.07);
      g.gain.linearRampToValueAtTime(gainAmt || 0.12, t0 + i * 0.07 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.07 + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t0 + i * 0.07); o.stop(t0 + i * 0.07 + dur + 0.05);
    });
  } catch (e) { /* no audio — fine */ }
}
const sfx = {
  chaching: () => beep([880, 1320], 0.28, 'triangle', 0.14),
  tap:      () => beep([520], 0.08, 'sine', 0.06),
  open:     () => beep([392, 523, 659], 0.25, 'triangle', 0.1),
  night:    () => beep([523, 392, 330], 0.3, 'sine', 0.08),
  fanfare:  () => beep([523, 659, 784, 1046], 0.4, 'triangle', 0.12),
};

/* ---------------- world generation ---------------- */
function makeWeather() {
  const days = [];
  for (let i = 0; i < DAYS; i++) {
    const r = rand();
    days.push(r < 0.26 ? 'rain' : r < 0.56 ? 'cloud' : 'sun');
  }
  days[0] = 'sun';                 // gentle start
  days[HEAT_DAY - 1] = 'heat';
  days[SOCCER_DAY - 1] = 'sun';
  days[DAYS - 1] = 'sun';          // nice finale
  // make sure the rain lesson happens at least twice
  const free = [1, 3, 5, 7, 8, 9, 11, 12].filter((i) => days[i] !== 'heat');
  while (days.filter((w) => w === 'rain').length < 2) {
    days[pick(free)] = 'rain';
  }
  // …but a kid's summer shouldn't be half washouts either
  while (days.filter((w) => w === 'rain').length > 3) {
    days[days.indexOf('rain')] = 'cloud';
  }
  // imperfect forecast: ~72% right, heatwave always warned about
  const forecast = days.map((w) => {
    if (w === 'heat') return 'heat';
    if (rand() < 0.72) return w;
    return pick(['sun', 'cloud', 'rain'].filter((x) => x !== w));
  });
  return { days, forecast };
}

function makeAgents() {
  const agents = [];
  for (let i = 0; i < TOWN_SIZE; i++) {
    agents.push({
      // economics
      maxPrice: Math.round(60 + Math.pow(rand(), 1.6) * 220),  // cents; willingness to pay, skewed low
      sens: 0.6 + rand() * 0.8,          // price sensitivity (softness of the cutoff)
      sweetTooth: 0.7 + rand() * 0.6,    // personal thirst multiplier
      loyalty: rand() * 0.5,             // resistance to the rival stand
      aware: 0.25 + rand() * 0.25,       // do they even know your stand exists?
      qAff: 0,                           // quality affinity: fresh lemonade builds it, cheap mix erodes it
      bought: 0,                         // lifetime cups
      // looks (stable so regulars are recognizable)
      skin: pick(['#f7d3b0', '#eab98b', '#c98d5e', '#8d5a3b', '#6e4428']),
      shirt: pick(['#e5340b', '#fe7c2b', '#ffc545', '#256493', '#7c4fa8', '#3e8e4e', '#e05a7a']),
      kidSize: rand() < 0.45,
      hat: rand() < 0.25,
    });
  }
  return agents;
}

function newGame() {
  const w = makeWeather();
  return {
    v: 1,
    day: 1,                 // 1-based
    phase: 'morning',       // morning | evening | report
    price: 100,             // cents
    recipe: 'cheap',
    sign: false,
    cash: 0,                // cumulative profit in cents
    weather: w.days,
    forecast: w.forecast,
    rivalPrice: 75,
    agents: makeAgents(),
    history: [],            // one record per finished day
  };
}

let G = null;          // game state
let dayPlan = null;    // today's precomputed simulation (animation script + totals)

function saveGame() { if (G) storeSet(SAVE_KEY, G); }

/* ---------------- the day simulation ----------------
   Everything is decided up front, so the animation, the evening
   numbers and a skipped day always agree. */
function planDay(g) {
  const dayIdx = g.day - 1;
  const wKey = g.weather[dayIdx];
  const w = WEATHER[wKey];
  const rivalOpen = g.day >= RIVAL_DAY;
  const soccer = g.day === SOCCER_DAY;
  const price = g.price;
  const recipeCost = RECIPES[g.recipe].cost;

  const walkers = [];
  let traffic = w.traffic + (g.sign ? 0.08 : 0);

  // townspeople who happen to walk down your street today
  g.agents.forEach((a, idx) => {
    if (rand() < traffic * (0.8 + rand() * 0.4)) walkers.push({ a, idx, visitor: false });
  });
  // the soccer game brings a one-time crowd of strangers
  if (soccer) {
    for (let i = 0; i < 26; i++) {
      walkers.push({
        a: {
          maxPrice: Math.round(70 + Math.pow(rand(), 1.5) * 210),
          sens: 0.6 + rand() * 0.8, sweetTooth: 0.8 + rand() * 0.6,
          loyalty: 0, aware: 0.85, qAff: 0, bought: 0,
          skin: pick(['#f7d3b0', '#eab98b', '#c98d5e', '#8d5a3b']),
          shirt: '#256493', kidSize: rand() < 0.5, hat: rand() < 0.5,
        },
        idx: -1, visitor: true,
      });
    }
  }

  const stats = { walkers: walkers.length, cups: 0, revenue: 0, repeat: 0, priced: 0, rival: 0, unnoticed: 0, newFaces: 0 };
  const events = []; // animation script

  walkers.forEach((wk) => {
    const a = wk.a;
    let outcome = 'pass';
    let bubble = null;

    const noticeP = clamp(a.aware + (g.sign ? 0.35 : 0), 0, 0.97);
    const sawSign = g.sign && a.aware < 0.5 && rand() < 0.5;
    if (rand() > noticeP) {
      outcome = 'pass';
      stats.unnoticed++;
    } else {
      const effMax = a.maxPrice * (1 + 0.25 * a.qAff);  // loved lemonade is worth more to them
      const desire = a.sweetTooth * w.thirst;
      // the rival undercuts: disloyal, price-driven folks defect
      if (rivalOpen && g.rivalPrice < price && a.qAff < 0.6) {
        let defectP = clamp(0.5 - a.loyalty * 0.6 - a.qAff * 0.4 + (price - g.rivalPrice) / 400, 0.04, 0.9);
        if (wk.visitor) defectP *= 0.35; // game-day crowds buy from whoever's in front of them

        if (rand() < defectP * clamp(desire, 0, 1)) {
          outcome = 'rival';
          stats.rival++;
          bubble = 'rival';
        }
      }
      if (outcome === 'pass') {
        const buyP = clamp(desire, 0, 0.96) * sigmoid(((effMax - price) / 100) * (2 + a.sens * 2));
        if (rand() < buyP) {
          outcome = 'buy';
          stats.cups++;
          stats.revenue += price;
          if (a.bought > 0) { stats.repeat++; if (a.qAff > 0.2 && rand() < 0.5) bubble = 'repeat'; }
          else { stats.newFaces++; if (sawSign && rand() < 0.6) bubble = 'sign'; }
          if (!bubble) {
            if (wKey === 'heat' && rand() < 0.35) bubble = 'hot';
            else if (g.recipe === 'cheap' && rand() < 0.12) bubble = 'watery';
            else if (rand() < 0.18) bubble = 'yum';
          }
        } else {
          if (price > effMax) { stats.priced++; if (rand() < 0.3) bubble = 'price'; }
          else if (wKey === 'rain' && rand() < 0.2) bubble = 'rain';
        }
      }
    }

    events.push({
      t: 0.5 + rand() * 19,              // arrival second (day lasts ~26s at 1×)
      dir: rand() < 0.5 ? 1 : -1,
      lane: outcome === 'rival' ? 1 : (rand() < 0.75 ? 0 : 1), // 0 = your sidewalk, 1 = far side
      speed: 55 + rand() * 35,           // px per second
      outcome, bubble,
      look: { skin: a.skin, shirt: a.shirt, kidSize: a.kidSize, hat: a.hat },
      idx: wk.idx,
    });
  });
  events.sort((x, y) => x.t - y.t);

  const cost = stats.cups * recipeCost + (g.sign ? SIGN_COST : 0);
  const profit = stats.revenue - cost;
  return { wKey, soccer, rivalOpen, price, stats, events, cost, profit, recipe: g.recipe, sign: g.sign };
}

/* the day actually happened: update the town and the books */
function applyDay(g, plan) {
  plan.events.forEach((ev) => {
    if (ev.idx < 0) return; // soccer visitors leave town again
    const a = g.agents[ev.idx];
    if (ev.outcome === 'buy') {
      a.aware = 1;
      a.bought++;
      a.loyalty = clamp(a.loyalty + 0.06, 0, 1);
      if (plan.recipe === 'fresh') a.qAff = clamp(a.qAff + 0.28, -0.6, 1);
      else a.qAff = clamp(a.qAff - 0.1, -0.6, 1);
    } else if (ev.outcome !== 'pass' || rand() < 0.5) {
      a.aware = clamp(Math.max(a.aware, 0.55), 0, 1); // they at least saw you today
    }
  });
  // a sign gets talked about at dinner tables
  if (plan.sign) {
    for (let i = 0; i < 22; i++) {
      const a = pick(g.agents);
      a.aware = clamp(a.aware + 0.25, 0, 1);
    }
  }
  // happy fresh-squeezed customers tell a friend
  if (plan.recipe === 'fresh' && plan.stats.cups > 4) {
    for (let i = 0; i < Math.min(12, plan.stats.cups); i++) pick(g.agents).aware = clamp(pick(g.agents).aware + 0.12, 0, 1);
  }

  g.cash += plan.profit;
  g.history.push({
    day: g.day, weather: plan.wKey, price: plan.price, recipe: plan.recipe, sign: plan.sign,
    cups: plan.stats.cups, revenue: plan.stats.revenue, cost: plan.cost, profit: plan.profit,
    walkers: plan.stats.walkers, repeat: plan.stats.repeat, priced: plan.stats.priced,
    rival: plan.stats.rival, unnoticed: plan.stats.unnoticed, soccer: plan.soccer,
    insight: pickInsight(plan, g),
  });
  // competitive response: tomorrow the rival prices 25¢ under you (floor 50¢)
  g.rivalPrice = clamp(plan.price - 25, 50, 150);
  g.phase = 'evening';
  saveGame();
}

/* ---------------- insights (the actual lesson) ---------------- */
function pickInsight(plan, g) {
  const s = plan.stats;
  if (g.day === RIVAL_DAY) return 'rival';
  const last = g.history.length ? g.history[g.history.length - 1].insight : null;
  const c = [];
  if (plan.wKey === 'rain') c.push('rain');
  if (plan.wKey === 'heat') c.push('heat');
  if (plan.soccer) c.push('soccer');
  if (s.rival >= 5) c.push('rival');
  if (s.walkers > 0 && s.priced / s.walkers > 0.22) c.push('priced');
  if (plan.price <= 50 && s.cups >= 10) c.push('margin');
  if (plan.recipe === 'fresh' && s.repeat >= 5) c.push('fresh');
  if (s.walkers > 0 && s.unnoticed / s.walkers > 0.4 && !plan.sign) c.push('sign');
  c.push({ rain: 'rain', heat: 'heat', cloud: 'cloud', sun: 'sunny' }[plan.wKey]);
  // don't teach the same lesson two evenings in a row if there's another to give
  return c.find((k) => k !== last) || c[0];
}

const INSIGHTS = {
  rain: {
    kid: (h) => 'It rained today, so almost nobody wanted a cold drink — only ' + h.cups + ' cups. Rainy days are just bad for lemonade. It\'s not your fault! Save your sign money for sunny days.',
    cmo: (h) => 'Rain suppressed both foot traffic and purchase intent — ' + h.cups + ' units. That\'s seasonality: an external demand driver no pricing move fully offsets. Cut variable spend (the sign) on low-demand days.',
  },
  heat: {
    kid: (h) => 'A HEATWAVE! Everybody was thirsty, so you sold ' + h.cups + ' cups. On super hot days people really, really want lemonade — some would even pay more for it!',
    cmo: (h) => 'Heat spike: demand surged to ' + h.cups + ' units. Willingness to pay rises with need — peak-demand days are when you have the most pricing power.',
  },
  rival: {
    kid: (h) => 'Uh oh — Riley\'s stand across the street is cheaper, and ' + h.rival + ' people went there instead! You could lower your price… or make YOUR lemonade so yummy they come back anyway.',
    cmo: (h) => 'Competitive response: the rival undercuts you by ~25¢ and captured ' + h.rival + ' buyers. You can compete on price (margin war) or differentiate on quality and hold price. Loyalty is your moat.',
  },
  soccer: {
    kid: (h) => 'The big soccer game brought a giant crowd — ' + h.walkers + ' people walked by! When lots of people pass your stand, you sell lots more cups.',
    cmo: (h) => 'Event-driven traffic: ' + h.walkers + ' passersby. Volume days convert even at higher prices — location and timing are distribution.',
  },
  priced: {
    kid: (h) => 'Lots of people said "too pricey!" and walked away (' + h.priced + ' of them). When the price is high you make more on each cup, but fewer people buy one. Maybe try a bit lower tomorrow?',
    cmo: (h) => h.priced + ' prospects were priced out — you\'re on the steep part of the demand curve. Revenue = price × volume; test 25¢ lower and watch whether volume more than compensates.',
  },
  margin: {
    kid: (h) => 'You sold ' + h.cups + ' cups — wow! But your price was so low you only kept a tiny bit of money from each one. Selling LOTS isn\'t the same as making lots of money.',
    cmo: (h) => 'High volume, thin margin: ' + h.cups + ' units but unit economics near break-even. Optimize for contribution margin × volume, not units.',
  },
  fresh: {
    kid: (h) => h.repeat + ' people came back today because your fresh-squeezed lemonade is SO good. Good lemonade costs more to make, but it turns strangers into regulars!',
    cmo: (h) => h.repeat + ' repeat purchases — quality COGS buying retention. Higher unit cost, but repeat customers arrive pre-converted: acquisition cost ~$0. That\'s LTV compounding.',
  },
  sign: {
    kid: (h) => h.unnoticed + ' people walked right past without even noticing your stand! A big colorful sign would help them spot you.',
    cmo: (h) => h.unnoticed + ' passersby never entered the funnel — an awareness problem, not a conversion problem. That\'s what the $2 sign (marketing reach) fixes.',
  },
  cloud: {
    kid: (h) => 'Kind of a gray day — people weren\'t super thirsty, so you sold ' + h.cups + ' cups. Not bad! Weather changes how much people want lemonade.',
    cmo: (h) => 'Overcast: demand softened to ' + h.cups + ' units. Track weather like a demand index — it should drive your daily price and spend decisions.',
  },
  sunny: {
    kid: (h) => 'A nice sunny day — ' + h.cups + ' cups sold and ' + money(h.profit) + ' kept in your pocket. The sun does half the selling for you!',
    cmo: (h) => 'Baseline conditions: ' + h.cups + ' units, ' + money(h.profit) + ' contribution. Use days like this as your control group when reading price tests.',
  },
};

/* ---------------- bubbles / ticker lines ---------------- */
const BUBBLES = {
  price:  { text: 'Too pricey! 💸',            kid: 'Someone thought it was too pricey!',        cmo: 'Priced above willingness to pay.' },
  rival:  { text: 'Cheaper over there! 🏃',    kid: 'Someone went to Riley\'s cheaper stand…',   cmo: 'Lost to competitor undercut.' },
  repeat: { text: 'Back for the good stuff! 😋', kid: 'A regular came back for more!',            cmo: 'Repeat purchase — retention working.' },
  sign:   { text: 'Ooh, I saw the sign! 🪧',   kid: 'Your sign brought someone new!',            cmo: 'Acquired via marketing reach.' },
  hot:    { text: 'SOOO hot! 🥵',              kid: 'The heat is making everyone thirsty!',      cmo: 'Heat-driven demand spike.' },
  rain:   { text: 'Too rainy for me ☔',       kid: 'The rain is keeping people away…',          cmo: 'Weather suppressing demand.' },
  watery: { text: 'Hmm… kinda watery 🤨',      kid: 'Someone thought the cheap mix was watery…', cmo: 'Quality gap — churn risk.' },
  yum:    { text: 'Yum!! 🍋',                  kid: 'Someone loved their lemonade!',             cmo: 'Clean conversion.' },
};

/* ---------------- screens ---------------- */
const SCREENS = ['title', 'morning', 'midday', 'evening', 'report'];
function show(name) {
  SCREENS.forEach((s) => $('screen-' + s).classList.toggle('active', s === name));
  window.scrollTo(0, 0);
  if (name !== 'midday') stopAnim();
}

/* ---------------- morning ---------------- */
function renderMorning() {
  const d = G.day;
  $('mDayNum').textContent = 'Day ' + d;
  const dots = $('dayDots');
  dots.innerHTML = '';
  for (let i = 1; i <= DAYS; i++) {
    const s = document.createElement('span');
    if (i < d) s.className = 'done';
    if (i === d) s.className = 'today';
    dots.appendChild(s);
  }

  const fKey = G.forecast[d - 1];
  const f = WEATHER[fKey];
  $('newsWeatherIcon').textContent = f.icon;
  $('newsWeatherText').innerHTML = dual(f.kid + ' <i>(probably!)</i>', f.cmo);

  // event news
  const evRow = $('newsEventRow');
  let evIcon = '📣', evHtml = null;
  if (d === 1) evHtml = dual('Grand opening! Sunnyville can\'t wait to meet your lemonade stand.', 'Day 1: cold start. Awareness is near zero — most of the town doesn\'t know you exist yet.');
  else if (d === HEAT_DAY) { evIcon = '🔥'; evHtml = dual('HEATWAVE WARNING! Tomorrow\'s news says today will be the hottest day of the summer!', 'Heat advisory: expect a demand spike and elevated willingness to pay.'); }
  else if (d === RIVAL_DAY) { evIcon = '😱'; evHtml = dual('BIG NEWS: Riley opened a lemonade stand ACROSS THE STREET… and it\'s cheap! Only ' + money(G.rivalPrice) + ' a cup!', 'A competitor entered at ' + money(G.rivalPrice) + ' — a classic undercut. Compete on price, or differentiate on quality.'); }
  else if (d > RIVAL_DAY) { evIcon = '🥤'; evHtml = dual('Riley\'s stand is selling cups for ' + money(G.rivalPrice) + ' today.', 'Competitor priced at ' + money(G.rivalPrice) + ' (they shadow you at −25¢ — a reactive pricing strategy).'); }
  if (d === SOCCER_DAY) { evIcon = '⚽'; evHtml = dual('The BIG soccer game is today — a huge crowd will walk right past your stand!', 'Event day: foot traffic will spike. Volume days reward being ready (and priced right).'); }
  if (evHtml) { evRow.style.display = 'flex'; $('newsEventIcon').textContent = evIcon; $('newsEventText').innerHTML = evHtml; }
  else evRow.style.display = 'none';

  $('priceSlider').value = G.price;
  updatePriceUI();
  updateRecipeUI();
  updateSignUI();
  $('piggyBank').textContent = money(G.cash);
  show('morning');
}

function updatePriceUI() {
  $('priceDisplay').textContent = money(G.price);
  const cost = RECIPES[G.recipe].cost;
  const m = G.price - cost;
  $('marginLine').innerHTML = m >= 0
    ? dual('Each cup: you get ' + money(G.price) + ', lemons cost ' + money(cost) + ' → you keep <b>' + money(m) + '</b>! 🎉',
           'Unit margin: ' + money(m) + ' (' + Math.round((m / G.price) * 100) + '%) · COGS ' + money(cost) + '/unit')
    : dual('Uh oh — each cup costs MORE to make than you\'re charging! 😬', 'Negative unit margin: ' + money(m) + '/unit. You lose money on every sale.');
}
function updateRecipeUI() {
  $('recipeCheap').classList.toggle('selected', G.recipe === 'cheap');
  $('recipeFresh').classList.toggle('selected', G.recipe === 'fresh');
  updatePriceUI();
}
function updateSignUI() {
  $('signToggle').classList.toggle('selected', G.sign);
  $('signCheck').textContent = G.sign ? '✓' : '＋';
}

/* ---------------- evening ---------------- */
function renderEvening() {
  const h = G.history[G.history.length - 1];
  $('eDayNum').textContent = 'Day ' + h.day;
  $('evCups').textContent = h.cups;
  $('evRevenue').textContent = money(h.revenue);
  $('evCost').textContent = money(h.cost);
  const pv = $('evProfit');
  pv.textContent = money(h.profit);
  pv.classList.toggle('up', h.profit >= 0);
  pv.classList.toggle('down', h.profit < 0);

  $('cmoTraffic').textContent = h.walkers;
  $('cmoConv').textContent = h.walkers ? Math.round((h.cups / h.walkers) * 100) + '%' : '—';
  $('cmoRepeat').textContent = h.repeat;
  $('cmoPriced').textContent = h.priced;
  $('cmoRival').textContent = h.rival;

  const ins = INSIGHTS[h.insight];
  $('insightText').innerHTML = dual(ins.kid(h), ins.cmo(h));

  $('btnNextDay').textContent = h.day >= DAYS ? '🎓 See my summer report card!' : '😴 Go to sleep → Day ' + (h.day + 1);
  show('evening');
}

/* ---------------- report card ---------------- */
function renderReport() {
  const H = G.history;
  const total = G.cash;
  const cups = H.reduce((s, h) => s + h.cups, 0);
  const repeat = H.reduce((s, h) => s + h.repeat, 0);
  const best = H.reduce((b, h) => (h.profit > b.profit ? h : b), H[0]);
  const rainDays = H.filter((h) => h.weather === 'rain');
  const rainAvg = rainDays.length ? Math.round(rainDays.reduce((s, h) => s + h.cups, 0) / rainDays.length) : 0;
  const sunDays = H.filter((h) => h.weather === 'sun' || h.weather === 'heat');
  const sunAvg = sunDays.length ? Math.round(sunDays.reduce((s, h) => s + h.cups, 0) / sunDays.length) : 0;

  const rp = $('rpProfit');
  rp.textContent = money(total);
  rp.classList.toggle('down', total < 0);
  $('rpBadge').textContent =
    total >= 6000 ? '🍋 LEMONADE LEGEND' :
    total >= 3000 ? '⭐ SUPER SELLER' :
    total >= 1000 ? '👍 SOLID STAND' :
    total >= 0    ? '🌱 SPROUTING' : '🎢 WILD SUMMER';

  $('rpCups').textContent = cups;
  $('rpRepeat').textContent = repeat;
  $('rpBestDay').textContent = 'Day ' + best.day;
  $('rpRainAvg').textContent = rainDays.length ? rainAvg + ' vs ' + sunAvg + ' ☀️' : '—';

  $('rpBestDecision').innerHTML = bestDecision(H);

  drawDemandCurve(H);
  show('report');
  sfx.fanfare();
}

function bestDecision(H) {
  const freshDays = H.filter((h) => h.recipe === 'fresh');
  const cheapDays = H.filter((h) => h.recipe === 'cheap');
  const avg = (arr) => (arr.length ? arr.reduce((s, h) => s + h.profit, 0) / arr.length : -1e9);
  const signDays = H.filter((h) => h.sign);
  const noSignDays = H.filter((h) => !h.sign);
  const best = H.reduce((b, h) => (h.profit > b.profit ? h : b), H[0]);
  const totalRepeat = H.reduce((s, h) => s + h.repeat, 0);

  if (freshDays.length >= 4 && avg(freshDays) > avg(cheapDays) && totalRepeat >= 15) {
    return dual(
      'Making <b>fresh-squeezed lemonade</b>! It cost more, but ' + totalRepeat + ' times someone came BACK for more. Regulars are the best customers.',
      '<b>Investing in product quality.</b> Fresh-squeezed days out-earned powder days on average, and drove ' + totalRepeat + ' repeat purchases — retention beat the extra COGS.');
  }
  if (signDays.length >= 3 && noSignDays.length >= 3 && avg(signDays) > avg(noSignDays) + 100) {
    return dual(
      'Painting the <b>big sign</b>! On sign days, way more people noticed your stand — and more noticing means more selling.',
      '<b>Marketing spend.</b> Sign days averaged ' + money(Math.round(avg(signDays) - avg(noSignDays))) + ' more profit — awareness was your binding constraint.');
  }
  if (best.weather === 'heat' && best.price >= 125) {
    return dual(
      'Charging <b>' + money(best.price) + ' on the heatwave day</b>! When everyone is super thirsty, your lemonade is worth more — and Day ' + best.day + ' was your best day of the whole summer.',
      '<b>Dynamic pricing.</b> You held ' + money(best.price) + ' into peak demand on Day ' + best.day + ' and it produced your best contribution of the season. Pricing power lives on high-demand days.');
  }
  const prices = H.map((h) => h.price);
  if (Math.max(...prices) - Math.min(...prices) >= 75) {
    return dual(
      '<b>Trying different prices!</b> You experimented instead of guessing — that\'s how you found out what people would really pay.',
      '<b>Price testing.</b> You explored a ' + money(Math.min(...prices)) + '–' + money(Math.max(...prices)) + ' range — which is exactly why your demand curve below has real signal in it.');
  }
  return dual(
    '<b>Not giving up on the rainy days!</b> Every stand has bad days — the trick is showing up again tomorrow.',
    '<b>Consistency.</b> You traded through the down days without panic-pricing. Survivorship is an underrated growth strategy.');
}

/* ---------------- the demand curve, from THEIR data ---------------- */
const WCOLOR = { sun: '#ffc545', cloud: '#9aa2b1', rain: '#256493', heat: '#e5340b' };
function drawDemandCurve(H) {
  const cv = $('curveCanvas');
  const ctx = cv.getContext('2d');
  const W = cv.width, Hh = cv.height;
  const padL = 64, padR = 24, padT = 26, padB = 58;
  ctx.clearRect(0, 0, W, Hh);

  const pts = H.map((h) => ({ p: h.price, q: h.cups, w: h.weather }));
  const maxQ = Math.max(10, ...pts.map(function (d) { return d.q; })) * 1.15;
  const minP = 25, maxP = 300;
  const X = (p) => padL + ((p - minP) / (maxP - minP)) * (W - padL - padR);
  const Y = (q) => Hh - padB - (q / maxQ) * (Hh - padT - padB);

  // wobbly hand-drawn axes
  ctx.strokeStyle = '#341f44'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  wobblyLine(ctx, padL, padT, padL, Hh - padB);
  wobblyLine(ctx, padL, Hh - padB, W - padR, Hh - padB);
  ctx.fillStyle = '#341f44';
  ctx.font = '700 16px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('price of one cup →', (padL + W - padR) / 2, Hh - 14);
  ctx.save();
  ctx.translate(20, (padT + Hh - padB) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('cups sold →', 0, 0);
  ctx.restore();
  ctx.font = '600 13px Nunito, sans-serif';
  [50, 100, 150, 200, 250, 300].forEach((p) => ctx.fillText('$' + (p / 100).toFixed(2).replace('.00', ''), X(p), Hh - padB + 20));

  // best-fit line (their personal demand curve)
  const n = pts.length;
  const mx = pts.reduce((s, d) => s + d.p, 0) / n;
  const my = pts.reduce((s, d) => s + d.q, 0) / n;
  let num = 0, den = 0;
  pts.forEach((d) => { num += (d.p - mx) * (d.q - my); den += (d.p - mx) * (d.p - mx); });
  const varied = den > 100;
  if (varied) {
    const slope = num / den, icpt = my - slope * mx;
    ctx.strokeStyle = '#fe7c2b'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
    const y1 = clamp(slope * minP + icpt, 0, maxQ), y2 = clamp(slope * maxP + icpt, 0, maxQ);
    wobblyLine(ctx, X(minP), Y(y1), X(maxP), Y(y2));
    ctx.setLineDash([]);
    const elast = my > 0 ? (slope * mx / my) : 0;
    $('curveCaption').innerHTML = dual(
      'Every dot is one day of YOUR summer: how much a cup cost, and how many cups sold. See how the dots slide down as the price goes up? <b>Cheaper lemonade = more buyers. Pricier lemonade = fewer buyers.</b> Grown-ups call that picture a <b>demand curve</b> — and you just drew one with real lemonade! (Blue dots are rainy days — low no matter the price!)',
      'A real demand curve fit to your 14 days (colored by weather: gold sun, blue rain, red heat — that vertical scatter is seasonality noise). Estimated slope ' + slope.toFixed(2) + ' cups/¢; point elasticity at your mean price ≈ <b>' + elast.toFixed(2) + '</b>. ' + (Math.abs(elast) > 1 ? 'Demand was elastic: price cuts grew revenue.' : 'Demand was relatively inelastic around your price point: you had room to charge more.'));
  } else {
    $('curveCaption').innerHTML = dual(
      'Every dot is one day: your price, and how many cups sold. You kept the price the same almost every day, so the dots stack up in a line! Next summer, try lots of different prices — you\'ll draw a cool downhill picture called a <b>demand curve</b>.',
      'Insufficient price variance to estimate a slope — you never really A/B tested price. Next run, spread your price points; without variation there\'s no curve to learn from.');
  }

  // dots (lemon-ish)
  pts.forEach((d) => {
    ctx.beginPath();
    ctx.fillStyle = WCOLOR[d.w];
    ctx.strokeStyle = '#341f44'; ctx.lineWidth = 2.5;
    ctx.arc(X(d.p) + (rand() - 0.5) * 6, Y(d.q), 8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  });
}
function wobblyLine(ctx, x1, y1, x2, y2) {
  const segs = 14;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    ctx.lineTo(x1 + (x2 - x1) * t + (rand() - 0.5) * 3, y1 + (y2 - y1) * t + (rand() - 0.5) * 3);
  }
  ctx.stroke();
}

/* ============================================================
   MIDDAY — the street comes alive
   ============================================================ */
const DAY_LEN = 26; // seconds at 1× speed
let anim = null;    // running animation state

function startMidday() {
  $('dDayNum').textContent = 'Day ' + G.day;
  $('hudCups').textContent = '0';
  $('hudMoney').textContent = '$0.00';
  setTicker(dual('Ding ding! The stand is open!', 'Doors open — watching the funnel…'));
  show('midday');
  const h = G.history[G.history.length - 1]; // already applied
  anim = {
    plan: dayPlan, rec: h,
    t: 0, speed: 1, last: performance.now(),
    cups: 0, revenue: 0,
    walkers: [], floats: [], bubble: null, bubbleUntil: 0,
    nextEvent: 0, raf: 0, done: false,
    seed: rand() * 1000,
  };
  $('btnSpeed').textContent = '⏩ 2× speed';
  anim.raf = requestAnimationFrame(tick);
}
function stopAnim() {
  if (anim) { cancelAnimationFrame(anim.raf); anim = null; }
}
function setTicker(html) { $('ticker').innerHTML = html; }

function tick(now) {
  if (!anim) return;
  const dt = Math.min(0.1, (now - anim.last) / 1000) * anim.speed;
  anim.last = now;
  anim.t += dt;
  const plan = anim.plan;

  // spawn walkers whose time has come
  while (anim.nextEvent < plan.events.length && plan.events[anim.nextEvent].t <= anim.t) {
    const ev = plan.events[anim.nextEvent++];
    spawnWalker(ev);
  }
  // advance walkers
  anim.walkers.forEach((w) => stepWalker(w, dt));
  anim.walkers = anim.walkers.filter((w) => !w.gone);
  anim.floats.forEach((f) => { f.y -= dt * 30; f.life -= dt; });
  anim.floats = anim.floats.filter((f) => f.life > 0);

  draw();

  if (anim.t >= DAY_LEN + 2 && anim.walkers.length === 0 && !anim.done) {
    anim.done = true;
    setTicker(dual('The sun is setting… time to count the money!', 'End of trading — closing the till.'));
    setTimeout(() => { if (anim) { stopAnim(); sfx.night(); renderEvening(); } }, 900 / (anim ? anim.speed : 1));
  }
  if (anim) anim.raf = requestAnimationFrame(tick);
}

const STAND_X = 620, FRONT_Y = 402, BACK_Y = 246, RIVAL_X = 170;
function spawnWalker(ev) {
  const laneY = ev.lane === 0 ? FRONT_Y + rand() * 34 : BACK_Y + rand() * 10;
  const fromLeft = ev.dir === 1;
  const stopsAtYours = ev.outcome === 'buy';
  const stopsAtRival = ev.outcome === 'rival';
  anim.walkers.push({
    x: fromLeft ? -30 : 830, dir: ev.dir, y: laneY,
    speed: ev.speed, look: ev.look, outcome: ev.outcome, bubbleKey: ev.bubble,
    stopX: stopsAtYours ? STAND_X - 45 + rand() * 20 : (stopsAtRival ? RIVAL_X + 40 : null),
    stopFor: stopsAtYours || stopsAtRival ? 1.7 : 0,
    stopped: 0, didSale: false, phase: rand() * 6.28, gone: false,
    bubbleShown: false,
  });
}
function stepWalker(w, dt) {
  if (w.stopX !== null && !w.didSale) {
    const dist = (w.stopX - w.x) * w.dir;
    if (dist <= 0) {
      // arrived at a stand
      w.stopped += dt;
      maybeBubble(w);
      if (w.stopped >= w.stopFor) {
        w.didSale = true;
        if (w.outcome === 'buy') {
          anim.cups++; anim.revenue += anim.plan.price;
          $('hudCups').textContent = anim.cups;
          $('hudMoney').textContent = money(anim.revenue);
          anim.floats.push({ x: STAND_X, y: 330, txt: '+' + money(anim.plan.price), life: 1.3 });
          sfx.chaching();
        }
      }
      return;
    }
  }
  if (!w.didSale && w.bubbleKey && !w.bubbleShown && w.stopX === null && Math.abs(w.x - 400) < 40) {
    maybeBubble(w); // non-buyers muse mid-street
  }
  w.x += w.dir * w.speed * dt;
  if (w.x < -50 || w.x > 850) w.gone = true;
}
function maybeBubble(w) {
  if (!w.bubbleKey || w.bubbleShown) return;
  const now = anim.t;
  if (anim.bubble && now < anim.bubbleUntil) return; // one at a time
  w.bubbleShown = true;
  const b = BUBBLES[w.bubbleKey];
  anim.bubble = { w, text: b.text };
  anim.bubbleUntil = now + 2.4;
  setTicker(dual('💭 ' + b.kid, '💭 ' + b.cmo));
}

/* ---------------- drawing the storybook street ---------------- */
const HOUSES = [
  { x: 40,  w: 110, h: 78, c: '#e5906b', roof: '#e5340b' },
  { x: 265, w: 96,  h: 70, c: '#8fb8d8', roof: '#256493' },
  { x: 465, w: 120, h: 84, c: '#d8c07c', roof: '#b8860b' },
  { x: 660, w: 100, h: 72, c: '#b9a0d0', roof: '#7c4fa8' },
];
function draw() {
  const cv = $('street');
  const ctx = cv.getContext('2d');
  const plan = anim.plan;
  const w = WEATHER[plan.wKey];
  const t = anim.t;
  const prog = clamp(t / DAY_LEN, 0, 1);

  // sky
  const skyCol = plan.wKey === 'heat' ? '#ffd9a0' : plan.wKey === 'rain' ? '#a8b6c8' : plan.wKey === 'cloud' ? '#c6d8e2' : '#bfe8f7';
  ctx.fillStyle = skyCol;
  ctx.fillRect(0, 0, 800, 210);

  // sun arcs across the day
  if (plan.wKey !== 'rain') {
    const sx = 60 + prog * 680;
    const sy = 120 - Math.sin(prog * Math.PI) * 80;
    ctx.fillStyle = plan.wKey === 'heat' ? '#ff8c2b' : '#ffc545';
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(sx, sy, plan.wKey === 'heat' ? 30 : 24, 0, 6.29); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + t * 0.25;
      const r1 = (plan.wKey === 'heat' ? 38 : 31), r2 = r1 + 9 + Math.sin(t * 3 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
      ctx.lineTo(sx + Math.cos(a) * r2, sy + Math.sin(a) * r2);
      ctx.stroke();
    }
  }
  // clouds
  if (plan.wKey === 'cloud' || plan.wKey === 'rain') {
    ctx.fillStyle = plan.wKey === 'rain' ? '#7d8da0' : '#f2f6f8';
    [[150, 60, 1], [420, 40, 1.3], [650, 70, 0.9]].forEach(function (c, i) {
      const cx = (c[0] + t * 6) % 900 - 50;
      blob(ctx, cx, c[1], 40 * c[2]);
    });
  }

  // grass + houses
  ctx.fillStyle = '#b5dd8d';
  ctx.fillRect(0, 200, 800, 40);
  HOUSES.forEach((h) => {
    ctx.fillStyle = h.c;
    ctx.fillRect(h.x, 210 - h.h, h.w, h.h);
    ctx.fillStyle = h.roof;
    ctx.beginPath();
    ctx.moveTo(h.x - 10, 210 - h.h);
    ctx.lineTo(h.x + h.w / 2, 210 - h.h - 34);
    ctx.lineTo(h.x + h.w + 10, 210 - h.h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3d0';
    ctx.fillRect(h.x + 14, 210 - h.h + 18, 22, 22);
    ctx.fillRect(h.x + h.w - 36, 210 - h.h + 18, 22, 22);
  });

  // far sidewalk, road, near sidewalk
  ctx.fillStyle = '#e8dcc0'; ctx.fillRect(0, 240, 800, 24);
  ctx.fillStyle = '#c9b8a0'; ctx.fillRect(0, 264, 800, 76);
  ctx.strokeStyle = '#fffdf4'; ctx.lineWidth = 4; ctx.setLineDash([26, 20]);
  ctx.beginPath(); ctx.moveTo(0, 302); ctx.lineTo(800, 302); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#efe3c6'; ctx.fillRect(0, 340, 800, 110);

  // soccer banner
  if (plan.soccer) {
    ctx.font = '26px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚽', 400, 232);
    ctx.fillStyle = '#341f44'; ctx.font = '700 15px Caveat, cursive';
    ctx.fillText('BIG GAME TODAY →', 400, 252);
  }

  // rival stand (far side) once open
  if (plan.rivalOpen) drawStand(ctx, RIVAL_X, 240, '#e05a7a', '#c74463', "RILEY'S", money(G.rivalPrice), 0.8);

  // far-lane walkers behind your stand
  anim.walkers.filter((x) => x.y < 300).sort((a, b) => a.y - b.y).forEach((x) => drawPerson(ctx, x, t));

  // your stand (near side)
  drawStand(ctx, STAND_X, FRONT_Y - 6, '#ffc545', '#fe7c2b', 'LEMONADE', money(plan.price), 1.15);
  if (plan.sign) {
    ctx.save();
    ctx.translate(STAND_X - 118, FRONT_Y - 40);
    ctx.rotate(-0.08 + Math.sin(t * 2) * 0.02);
    ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = '#341f44'; ctx.lineWidth = 3;
    ctx.beginPath(); rrect(ctx, -34, -46, 68, 52, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 34); ctx.stroke();
    ctx.fillStyle = '#e5340b'; ctx.font = '700 17px Caveat, cursive'; ctx.textAlign = 'center';
    ctx.fillText('ICE COLD', 0, -26);
    ctx.fillText('LEMONADE!', 0, -8);
    ctx.restore();
  }

  // near-lane walkers in front
  anim.walkers.filter((x) => x.y >= 300).sort((a, b) => a.y - b.y).forEach((x) => drawPerson(ctx, x, t));

  // rain
  if (plan.wKey === 'rain') {
    ctx.strokeStyle = 'rgba(80,110,150,.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      const rx = (i * 137 + t * 260) % 820 - 10;
      const ry = (i * 71 + t * 420) % 460;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 12); ctx.stroke();
    }
  }
  // heat shimmer
  if (plan.wKey === 'heat') {
    ctx.strokeStyle = 'rgba(255,120,40,.35)'; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      for (let x = 0; x <= 60; x += 6) ctx.lineTo(120 + i * 180 + x / 3 + Math.sin(t * 5 + x / 8 + i) * 4, 330 - x);
      ctx.stroke();
    }
  }

  // floating money
  ctx.font = '900 20px Nunito, sans-serif'; ctx.textAlign = 'center';
  anim.floats.forEach((f) => {
    ctx.fillStyle = 'rgba(62,142,78,' + clamp(f.life, 0, 1) + ')';
    ctx.fillText(f.txt, f.x, f.y);
  });

  // thought bubble
  if (anim.bubble && anim.t < anim.bubbleUntil) {
    const b = anim.bubble;
    if (!b.w.gone) drawBubble(ctx, b.w.x, b.w.y - (b.w.look.kidSize ? 58 : 74), b.text);
    else anim.bubble = null;
  }
}
function blob(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, 0, 6.29);
  ctx.arc(x + r * 0.5, y + 4, r * 0.5, 0, 6.29);
  ctx.arc(x - r * 0.5, y + 5, r * 0.45, 0, 6.29);
  ctx.fill();
}
function rrect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function drawStand(ctx, x, groundY, topColor, stripeColor, label, priceTxt, scale) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#341f44'; ctx.lineWidth = 3;
  // counter
  ctx.fillStyle = '#f0e0b8';
  ctx.beginPath(); rrect(ctx, -55, -46, 110, 46, 6); ctx.fill(); ctx.stroke();
  // stripes
  ctx.fillStyle = stripeColor;
  for (let i = -55; i < 55; i += 22) ctx.fillRect(i, -46, 11, 46);
  // counter top
  ctx.fillStyle = '#fffdf4';
  ctx.beginPath(); rrect(ctx, -62, -54, 124, 12, 5); ctx.fill(); ctx.stroke();
  // posts + roof
  ctx.beginPath(); ctx.moveTo(-52, -54); ctx.lineTo(-52, -108); ctx.moveTo(52, -54); ctx.lineTo(52, -108); ctx.stroke();
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(-70, -104);
  ctx.quadraticCurveTo(0, -132, 70, -104);
  ctx.lineTo(62, -88); ctx.lineTo(-62, -88);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // pitcher + cup
  ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🍋', -28, -60);
  ctx.fillText('🥤', 26, -60);
  // label + price tag
  ctx.fillStyle = '#341f44'; ctx.font = '700 16px Caveat, cursive';
  ctx.fillText(label, 0, -93);
  ctx.fillStyle = '#fffdf4';
  ctx.beginPath(); rrect(ctx, -26, -80, 52, 20, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e5340b'; ctx.font = '800 14px Nunito, sans-serif';
  ctx.fillText(priceTxt, 0, -65);
  ctx.restore();
}
function drawPerson(ctx, p, t) {
  const s = p.look.kidSize ? 0.72 : 1;
  const bobbing = p.stopped > 0 && !p.didSale ? 0 : Math.sin(t * 9 + p.phase) * 2.5;
  const x = p.x, y = p.y + bobbing * 0.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.dir === 1 ? 1 : -1, 1);
  ctx.scale(s, s);
  ctx.strokeStyle = '#341f44'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  // legs
  const step = p.stopped > 0 && !p.didSale ? 0 : Math.sin(t * 9 + p.phase) * 7;
  ctx.beginPath();
  ctx.moveTo(0, -26); ctx.lineTo(step, 0);
  ctx.moveTo(0, -26); ctx.lineTo(-step, 0);
  ctx.stroke();
  // body
  ctx.fillStyle = p.look.shirt;
  ctx.beginPath(); rrect(ctx, -10, -52, 20, 28, 9); ctx.fill(); ctx.stroke();
  // arm (raises a cup after buying)
  ctx.beginPath();
  if (p.didSale && p.outcome === 'buy') { ctx.moveTo(8, -46); ctx.lineTo(18, -58); }
  else { ctx.moveTo(8, -46); ctx.lineTo(14 + step * 0.4, -34); }
  ctx.stroke();
  if (p.didSale && p.outcome === 'buy') { ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🥤', 21, -58); }
  // head
  ctx.fillStyle = p.look.skin;
  ctx.beginPath(); ctx.arc(0, -63, 11, 0, 6.29); ctx.fill(); ctx.stroke();
  // face
  ctx.fillStyle = '#341f44';
  ctx.beginPath(); ctx.arc(4, -65, 1.6, 0, 6.29); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -65, 1.6, 0, 6.29); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -60, 3, 0.2, Math.PI - 0.2); ctx.stroke();
  // hat
  if (p.look.hat) {
    ctx.fillStyle = p.look.shirt;
    ctx.beginPath(); ctx.arc(0, -71, 10, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -72); ctx.lineTo(16, -72); ctx.stroke();
  }
  ctx.restore();
}
function drawBubble(ctx, x, y, text) {
  ctx.save();
  ctx.font = '700 15px Nunito, sans-serif';
  const wTxt = ctx.measureText(text).width;
  const bw = wTxt + 26, bh = 32;
  let bx = clamp(x - bw / 2, 8, 800 - bw - 8);
  const by = clamp(y - bh - 14, 8, 450);
  ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = '#341f44'; ctx.lineWidth = 3;
  ctx.beginPath(); rrect(ctx, bx, by, bw, bh, 14); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, by + bh + 8, 4, 0, 6.29); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + (x > bx + bw / 2 ? -6 : 6), by + bh + 16, 2.5, 0, 6.29); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#341f44'; ctx.textAlign = 'center';
  ctx.fillText(text, bx + bw / 2, by + 21);
  ctx.restore();
}

/* ============================================================
   wiring
   ============================================================ */
function setMode(mode) {
  document.body.classList.toggle('mode-kid', mode === 'kid');
  document.body.classList.toggle('mode-cmo', mode === 'cmo');
  $('modeKidBtn').classList.toggle('active', mode === 'kid');
  $('modeCmoBtn').classList.toggle('active', mode === 'cmo');
  const prefs = storeGet(PREF_KEY) || {};
  prefs.mode = mode;
  storeSet(PREF_KEY, prefs);
}
function setMuted(m) {
  muted = m;
  $('muteBtn').textContent = m ? '🔇' : '🔊';
  const prefs = storeGet(PREF_KEY) || {};
  prefs.muted = m;
  storeSet(PREF_KEY, prefs);
}

function beginNewGame() {
  G = newGame();
  saveGame();
  renderMorning();
}
function resumeGame() {
  if (G.phase === 'report') renderReport();
  else if (G.phase === 'evening') renderEvening();
  else renderMorning();
}

function init() {
  // prefs
  const prefs = storeGet(PREF_KEY) || {};
  setMode(prefs.mode === 'cmo' ? 'cmo' : 'kid');
  setMuted(!!prefs.muted);

  // saved summer?
  const saved = storeGet(SAVE_KEY);
  if (saved && saved.v === 1 && Array.isArray(saved.agents) && saved.day >= 1) {
    G = saved;
    $('btnContinue').classList.remove('hidden');
    $('btnResetTitle').classList.remove('hidden');
    $('btnNewGame').textContent = '🍋 Start a new summer instead';
    $('btnContinue').textContent = '▶️ Keep playing — Day ' + Math.min(G.day, DAYS);
  }

  // top bar
  $('modeKidBtn').addEventListener('click', () => { sfx.tap(); setMode('kid'); });
  $('modeCmoBtn').addEventListener('click', () => { sfx.tap(); setMode('cmo'); });
  $('muteBtn').addEventListener('click', () => setMuted(!muted));

  // title
  $('btnNewGame').addEventListener('click', () => { sfx.open(); beginNewGame(); });
  $('btnContinue').addEventListener('click', () => { sfx.tap(); resumeGame(); });
  $('btnResetTitle').addEventListener('click', function () {
    if (this.dataset.armed) { storeDel(SAVE_KEY); location.reload(); }
    else { this.dataset.armed = '1'; this.textContent = '⚠️ Tap again to really erase your summer'; }
  });

  // morning controls
  $('priceSlider').addEventListener('input', function () {
    G.price = parseInt(this.value, 10);
    updatePriceUI();
  });
  $('priceSlider').addEventListener('change', () => { sfx.tap(); saveGame(); });
  $('recipeCheap').addEventListener('click', () => { sfx.tap(); G.recipe = 'cheap'; updateRecipeUI(); saveGame(); });
  $('recipeFresh').addEventListener('click', () => { sfx.tap(); G.recipe = 'fresh'; updateRecipeUI(); saveGame(); });
  $('signToggle').addEventListener('click', () => { sfx.tap(); G.sign = !G.sign; updateSignUI(); saveGame(); });
  $('btnOpenStand').addEventListener('click', () => {
    sfx.open();
    dayPlan = planDay(G);
    applyDay(G, dayPlan);   // books are settled up front; the animation replays it
    startMidday();
  });

  // midday
  $('btnSpeed').addEventListener('click', function () {
    if (!anim) return;
    sfx.tap();
    anim.speed = anim.speed === 1 ? 2 : anim.speed === 2 ? 4 : 1;
    this.textContent = anim.speed === 1 ? '⏩ 2× speed' : anim.speed === 2 ? '⏩⏩ 4× speed' : '▶️ 1× speed';
  });
  $('btnSkipDay').addEventListener('click', () => { sfx.night(); stopAnim(); renderEvening(); });

  // evening
  $('btnNextDay').addEventListener('click', () => {
    sfx.tap();
    if (G.day >= DAYS) { G.phase = 'report'; saveGame(); renderReport(); return; }
    G.day++;
    G.sign = false;         // the sign is a daily choice
    G.phase = 'morning';
    saveGame();
    renderMorning();
  });

  // report
  $('btnNewSummer').addEventListener('click', () => { sfx.open(); storeDel(SAVE_KEY); beginNewGame(); });

  show('title');
}

document.addEventListener('DOMContentLoaded', init);
})();
