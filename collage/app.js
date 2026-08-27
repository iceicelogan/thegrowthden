/* ============ Collage Den — app ============ */
(function () {
  "use strict";

  /* ---------------- helpers ---------------- */
  const $ = (sel) => document.querySelector(sel);
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rad = (deg) => (deg * Math.PI) / 180;

  // Route remote images through images.weserv.nl so they arrive with CORS
  // headers (needed for PNG export) and get resized on the way.
  function prox(url, w) {
    if (!url || url.startsWith("data:")) return url;
    let u = "https://images.weserv.nl/?url=" + encodeURIComponent(url);
    if (w) u += "&w=" + w + "&h=" + w + "&fit=inside";
    return u;
  }

  let toastTimer;
  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), ms);
  }

  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = () => rej(new Error("Image failed to load"));
      img.src = src;
    });
  }

  /* ---------------- state ---------------- */
  const STORE_KEY = "collageDen.v1";

  let state = defaultState();
  let selId = null;
  let fit = 1;
  const nodeById = new Map();

  function defaultState() {
    return {
      w: 1080,
      h: 1080,
      bg: { kind: "color", color: "#ffffff" },
      layers: [],
    };
  }

  /* -------- undo / redo / persistence -------- */
  const undoStack = [];
  const redoStack = [];
  let lastSnap = null;

  const snap = () => JSON.stringify(state);

  function commit() {
    if (lastSnap !== null && lastSnap !== snap()) {
      undoStack.push(lastSnap);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
    }
    lastSnap = snap();
    updateHistoryButtons();
    saveSoon();
  }

  function restore(json) {
    state = JSON.parse(json);
    lastSnap = json;
    selId = null;
    renderBoard();
    updateHistoryButtons();
    saveSoon();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snap());
    restore(undoStack.pop());
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snap());
    restore(redoStack.pop());
  }
  function updateHistoryButtons() {
    $("#btnUndo").disabled = !undoStack.length;
    $("#btnRedo").disabled = !redoStack.length;
  }

  let saveTimer;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, snap());
      } catch (e) {
        /* storage full (big uploads) — keep working without autosave */
      }
    }, 400);
  }

  /* ---------------- board rendering ---------------- */
  const board = $("#board");
  const boardWrap = $("#boardWrap");
  const stage = $("#stage");

  function refit() {
    const pad = 8;
    const availW = stage.clientWidth - pad * 2;
    const availH = stage.clientHeight - pad * 2;
    if (availW <= 0 || availH <= 0) return;
    fit = Math.min(availW / state.w, availH / state.h);
    board.style.width = state.w + "px";
    board.style.height = state.h + "px";
    board.style.transform = `scale(${fit})`;
    board.style.setProperty("--inv", (1 / fit).toFixed(4));
    boardWrap.style.width = state.w * fit + "px";
    boardWrap.style.height = state.h * fit + "px";
  }

  function applyBg() {
    if (state.bg.kind === "pattern") {
      board.style.background = "";
      board.style.backgroundColor = "#fff";
      board.style.backgroundImage = `url("${state.bg.uri}")`;
      board.style.backgroundSize = state.bg.size + "px " + state.bg.size + "px";
    } else {
      board.style.backgroundImage = "none";
      board.style.background = state.bg.color;
    }
  }

  function layerNode(L) {
    const el = document.createElement("div");
    el.className = "layer" + (L.flat ? " flat" : "");
    el.dataset.id = L.id;
    const img = document.createElement("img");
    img.draggable = false;
    img.alt = L.name || "";
    img.src = L.src;
    el.appendChild(img);

    const rot = document.createElement("div");
    rot.className = "handle rot";
    rot.textContent = "⟳";
    const sc = document.createElement("div");
    sc.className = "handle scale";
    sc.textContent = "⤡";
    el.appendChild(rot);
    el.appendChild(sc);

    el.addEventListener("pointerdown", (ev) => onLayerDown(ev, L.id));
    rot.addEventListener("pointerdown", (ev) => onHandleDown(ev, L.id, "rotate"));
    sc.addEventListener("pointerdown", (ev) => onHandleDown(ev, L.id, "scale"));

    positionNode(el, L);
    return el;
  }

  function positionNode(el, L) {
    el.style.left = L.x + "px";
    el.style.top = L.y + "px";
    el.style.width = L.w * L.scale + "px";
    el.style.height = L.h * L.scale + "px";
    el.style.transform = `translate(-50%,-50%) rotate(${L.rot}deg)`;
    el.style.opacity = L.opacity;
    el.querySelector("img").style.transform = L.flip ? "scaleX(-1)" : "";
  }

  function renderBoard() {
    refit();
    applyBg();
    board.innerHTML = "";
    nodeById.clear();
    for (const L of state.layers) {
      const el = layerNode(L);
      nodeById.set(L.id, el);
      board.appendChild(el);
    }
    if (!state.layers.length) {
      const hint = document.createElement("div");
      hint.className = "board-hint";
      hint.innerHTML = "Your board is empty ✨<br>Tap anything in the panel to clip it here.";
      board.appendChild(hint);
    }
    updateSelection();
  }

  function getLayer(id) {
    return state.layers.find((l) => l.id === id);
  }

  function updateSelection() {
    for (const [id, el] of nodeById) el.classList.toggle("sel", id === selId);
    const bar = $("#layerBar");
    const L = selId && getLayer(selId);
    bar.classList.toggle("hidden", !L);
    if (L) bar.querySelector('[data-act="alpha"]').value = Math.round(L.opacity * 100);
  }

  function select(id) {
    selId = id;
    updateSelection();
  }

  /* ---------------- adding layers ---------------- */
  function addLayer({ src, name, w, h, flat = false, rot = 0, frac = 0.42 }) {
    const base = Math.min(state.w, state.h) * frac;
    const s = base / Math.max(w, h);
    const jx = (Math.random() - 0.5) * state.w * 0.14;
    const jy = (Math.random() - 0.5) * state.h * 0.14;
    const L = {
      id: uid(),
      src,
      name: name || "",
      x: state.w / 2 + jx,
      y: state.h / 2 + jy,
      w: w * s,
      h: h * s,
      scale: 1,
      rot,
      flip: false,
      opacity: 1,
      flat,
    };
    state.layers.push(L);
    renderBoard();
    select(L.id);
    commit();
    if (window.innerWidth <= 760) $("#panel").classList.add("collapsed");
  }

  async function addImageLayer(src, name, opts = {}) {
    toast("Adding…", 1200);
    try {
      const img = await loadImage(src);
      addLayer({ src, name, w: img.naturalWidth, h: img.naturalHeight, ...opts });
    } catch (e) {
      toast("Couldn't load that image 😞 — try another one.");
    }
  }

  /* ---------------- pointer interactions ---------------- */
  const pointers = new Map(); // pointerId -> {x, y}
  let gesture = null; // {mode, id, ...refs}

  function boardXY(ev) {
    const r = board.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / fit, y: (ev.clientY - r.top) / fit };
  }

  function onLayerDown(ev, id) {
    if (ev.target.classList.contains("handle")) return;
    ev.preventDefault();
    ev.stopPropagation();
    select(id);
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const L = getLayer(id);
    if (pointers.size === 2 && gesture && gesture.id === id) {
      startPinch(L);
    } else if (pointers.size === 1) {
      const p = boardXY(ev);
      gesture = { mode: "move", id, dx: L.x - p.x, dy: L.y - p.y };
    }
  }

  function startPinch(L) {
    const [a, b] = [...pointers.values()];
    gesture = {
      mode: "pinch",
      id: L.id,
      d0: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      a0: Math.atan2(b.y - a.y, b.x - a.x),
      scale0: L.scale,
      rot0: L.rot,
      cx0: L.x,
      cy0: L.y,
      mid0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  }

  function onHandleDown(ev, id, mode) {
    ev.preventDefault();
    ev.stopPropagation();
    select(id);
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const L = getLayer(id);
    const r = board.getBoundingClientRect();
    const cx = r.left + L.x * fit;
    const cy = r.top + L.y * fit;
    if (mode === "rotate") {
      gesture = {
        mode, id, cx, cy,
        a0: Math.atan2(ev.clientY - cy, ev.clientX - cx),
        rot0: L.rot,
      };
    } else {
      gesture = {
        mode, id, cx, cy,
        d0: Math.hypot(ev.clientX - cx, ev.clientY - cy) || 1,
        scale0: L.scale,
      };
    }
  }

  function onPointerMove(ev) {
    if (!pointers.has(ev.pointerId)) return;
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (!gesture) return;
    const L = getLayer(gesture.id);
    if (!L) return;

    if (gesture.mode === "move" && pointers.size === 1) {
      const p = boardXY(ev);
      L.x = clamp(p.x + gesture.dx, -state.w * 0.2, state.w * 1.2);
      L.y = clamp(p.y + gesture.dy, -state.h * 0.2, state.h * 1.2);
    } else if (gesture.mode === "pinch" && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      L.scale = clamp(gesture.scale0 * (d / gesture.d0), 0.05, 25);
      L.rot = gesture.rot0 + ((ang - gesture.a0) * 180) / Math.PI;
      L.x = gesture.cx0 + (mid.x - gesture.mid0.x) / fit;
      L.y = gesture.cy0 + (mid.y - gesture.mid0.y) / fit;
    } else if (gesture.mode === "rotate") {
      const a = Math.atan2(ev.clientY - gesture.cy, ev.clientX - gesture.cx);
      let deg = gesture.rot0 + ((a - gesture.a0) * 180) / Math.PI;
      const snapTo = Math.round(deg / 45) * 45;
      if (Math.abs(deg - snapTo) < 4) deg = snapTo;
      L.rot = deg;
    } else if (gesture.mode === "scale") {
      const d = Math.hypot(ev.clientX - gesture.cx, ev.clientY - gesture.cy);
      L.scale = clamp(gesture.scale0 * (d / gesture.d0), 0.05, 25);
    }
    const el = nodeById.get(L.id);
    if (el) positionNode(el, L);
  }

  function onPointerUp(ev) {
    if (!pointers.has(ev.pointerId)) return;
    pointers.delete(ev.pointerId);
    if (gesture && gesture.mode === "pinch" && pointers.size === 1) {
      // Drop back to a plain move with the remaining finger.
      const L = getLayer(gesture.id);
      const [p] = [...pointers.values()];
      const r = board.getBoundingClientRect();
      gesture = {
        mode: "move",
        id: gesture.id,
        dx: L.x - (p.x - r.left) / fit,
        dy: L.y - (p.y - r.top) / fit,
      };
      return;
    }
    if (!pointers.size && gesture) {
      gesture = null;
      commit();
    }
  }

  board.addEventListener("pointerdown", (ev) => {
    if (ev.target === board || ev.target.classList.contains("board-hint")) {
      // Second finger anywhere on the board joins a pinch on the dragged layer.
      if (gesture && gesture.mode === "move" && pointers.size === 1) {
        ev.preventDefault();
        pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        startPinch(getLayer(gesture.id));
        return;
      }
      select(null);
    }
  });
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  /* ---------------- layer toolbar ---------------- */
  $("#layerBar").addEventListener("click", (ev) => {
    const act = ev.target.dataset.act;
    if (!act || !selId) return;
    const idx = state.layers.findIndex((l) => l.id === selId);
    if (idx < 0) return;
    const L = state.layers[idx];
    if (act === "del") {
      state.layers.splice(idx, 1);
      selId = null;
    } else if (act === "dup") {
      const copy = { ...L, id: uid(), x: L.x + 36, y: L.y + 36 };
      state.layers.splice(idx + 1, 0, copy);
      selId = copy.id;
    } else if (act === "flip") {
      L.flip = !L.flip;
    } else if (act === "front" && idx < state.layers.length - 1) {
      state.layers.splice(idx, 1);
      state.layers.splice(idx + 1, 0, L);
    } else if (act === "back" && idx > 0) {
      state.layers.splice(idx, 1);
      state.layers.splice(idx - 1, 0, L);
    }
    renderBoard();
    commit();
  });

  $('#layerBar [data-act="alpha"]').addEventListener("input", (ev) => {
    const L = selId && getLayer(selId);
    if (!L) return;
    L.opacity = ev.target.value / 100;
    const el = nodeById.get(L.id);
    if (el) positionNode(el, L);
  });
  $('#layerBar [data-act="alpha"]').addEventListener("change", commit);

  /* ---------------- keyboard ---------------- */
  window.addEventListener("keydown", (ev) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
      ev.preventDefault();
      ev.shiftKey ? redo() : undo();
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "y") {
      ev.preventDefault();
      redo();
      return;
    }
    const L = selId && getLayer(selId);
    if (!L) return;
    const step = ev.shiftKey ? 20 : 4;
    let handled = true;
    switch (ev.key) {
      case "Delete":
      case "Backspace":
        state.layers = state.layers.filter((l) => l.id !== selId);
        selId = null;
        renderBoard();
        break;
      case "ArrowLeft": L.x -= step; break;
      case "ArrowRight": L.x += step; break;
      case "ArrowUp": L.y -= step; break;
      case "ArrowDown": L.y += step; break;
      default: handled = false;
    }
    if (handled) {
      ev.preventDefault();
      const el = nodeById.get(selId);
      if (el) positionNode(el, getLayer(selId));
      commit();
    }
  });

  /* ---------------- top bar ---------------- */
  $("#btnUndo").addEventListener("click", undo);
  $("#btnRedo").addEventListener("click", redo);

  $("#btnNew").addEventListener("click", () => {
    if (state.layers.length && !confirm("Start a new collage? The current board will be cleared.")) return;
    const { w, h } = state;
    state = defaultState();
    state.w = w;
    state.h = h;
    selId = null;
    renderBoard();
    commit();
  });

  $("#boardSize").addEventListener("change", (ev) => {
    const [w, h] = ev.target.value.split("x").map(Number);
    state.w = w;
    state.h = h;
    renderBoard();
    commit();
  });

  $("#btnExport").addEventListener("click", exportPNG);

  async function exportPNG() {
    const btn = $("#btnExport");
    btn.disabled = true;
    toast("Rendering your collage…", 4000);
    try {
      const c = document.createElement("canvas");
      c.width = state.w;
      c.height = state.h;
      const ctx = c.getContext("2d");

      if (state.bg.kind === "pattern") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        const tile = await loadImage(state.bg.uri);
        const t = document.createElement("canvas");
        t.width = t.height = state.bg.size;
        t.getContext("2d").drawImage(tile, 0, 0, state.bg.size, state.bg.size);
        ctx.fillStyle = ctx.createPattern(t, "repeat");
        ctx.fillRect(0, 0, c.width, c.height);
      } else {
        ctx.fillStyle = state.bg.color;
        ctx.fillRect(0, 0, c.width, c.height);
      }

      for (const L of state.layers) {
        const img = await loadImage(L.src);
        const W = L.w * L.scale;
        const H = L.h * L.scale;
        ctx.save();
        ctx.globalAlpha = L.opacity;
        ctx.translate(L.x, L.y);
        ctx.rotate(rad(L.rot));
        if (!L.flat) {
          ctx.shadowColor = "rgba(45,42,38,.28)";
          ctx.shadowBlur = 9;
          ctx.shadowOffsetY = 4;
        }
        if (L.flip) ctx.scale(-1, 1);
        ctx.drawImage(img, -W / 2, -H / 2, W, H);
        ctx.restore();
      }

      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      if (!blob) throw new Error("export failed");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "collage-den.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast("Saved! Check your downloads 🎉");
    } catch (e) {
      toast("Export hit a snag with one of the images — try removing the most recent one.");
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------------- tabs & panel ---------------- */
  const loadedTabs = new Set();
  document.querySelectorAll("#tabs .tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#tabs .tab").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".tab-page").forEach((p) =>
        p.classList.toggle("active", p.id === "page-" + btn.dataset.tab));
      $("#panel").classList.remove("collapsed");
      lazyLoadTab(btn.dataset.tab);
    });
  });

  $("#panelHandle").addEventListener("click", () => $("#panel").classList.toggle("collapsed"));

  function lazyLoadTab(tab) {
    if (loadedTabs.has(tab)) return;
    loadedTabs.add(tab);
    if (tab === "fashion") initShop("fashion");
    if (tab === "home") initShop("home");
  }

  /* ---------------- shop tabs (DummyJSON) ---------------- */
  const SHOPS = {
    fashion: {
      chips: "#fashionChips",
      grid: "#fashionGrid",
      cats: [
        ["womens-dresses", "Dresses"],
        ["tops", "Tops"],
        ["mens-shirts", "Shirts"],
        ["womens-shoes", "Shoes ♀"],
        ["mens-shoes", "Shoes ♂"],
        ["womens-bags", "Bags"],
        ["womens-jewellery", "Jewellery"],
        ["sunglasses", "Sunglasses"],
        ["womens-watches", "Watches ♀"],
        ["mens-watches", "Watches ♂"],
      ],
    },
    home: {
      chips: "#homeChips",
      grid: "#homeGrid",
      cats: [
        ["furniture", "Furniture"],
        ["home-decoration", "Decor"],
        ["kitchen-accessories", "Kitchen"],
      ],
    },
  };
  const shopCache = new Map();

  function initShop(key) {
    const shop = SHOPS[key];
    const chipsEl = $(shop.chips);
    chipsEl.innerHTML = "";
    shop.cats.forEach(([cat, label], i) => {
      const b = document.createElement("button");
      b.className = "chip" + (i === 0 ? " active" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        chipsEl.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b));
        loadShopCategory(key, cat);
      });
      chipsEl.appendChild(b);
    });
    loadShopCategory(key, shop.cats[0][0]);
  }

  async function loadShopCategory(key, cat) {
    const grid = $(SHOPS[key].grid);
    if (shopCache.has(cat)) {
      renderProducts(grid, shopCache.get(cat));
      return;
    }
    grid.innerHTML = '<p class="loading">Loading pieces…</p>';
    try {
      const r = await fetch(
        `https://dummyjson.com/products/category/${cat}?limit=30&select=title,price,thumbnail,images`
      );
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      shopCache.set(cat, data.products || []);
      renderProducts(grid, data.products || []);
    } catch (e) {
      grid.innerHTML =
        '<div class="error-note">Couldn\'t reach the catalog — check your connection.<br><button class="ghost-btn">Retry</button></div>';
      grid.querySelector("button").addEventListener("click", () => loadShopCategory(key, cat));
    }
  }

  function renderProducts(grid, products) {
    grid.innerHTML = "";
    if (!products.length) {
      grid.innerHTML = '<p class="hint pad">Nothing in this rack right now.</p>';
      return;
    }
    for (const p of products) {
      const full = (p.images && p.images[0]) || p.thumbnail;
      const card = document.createElement("div");
      card.className = "item-card";
      card.title = p.title;
      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = prox(p.thumbnail || full, 200);
      img.alt = p.title;
      const cap = document.createElement("div");
      cap.className = "cap";
      cap.innerHTML = `<span class="price">$${p.price}</span> ${p.title}`;
      card.appendChild(img);
      card.appendChild(cap);
      card.addEventListener("click", () => addImageLayer(prox(full, 1000), p.title));
      grid.appendChild(card);
    }
  }

  /* ---------------- backgrounds tab ---------------- */
  function initBackgrounds() {
    const colors = $("#bgColors");
    ASSETS.solids.forEach((c) => {
      const s = document.createElement("button");
      s.className = "swatch";
      s.style.background = c;
      s.title = c;
      s.addEventListener("click", () => {
        state.bg = { kind: "color", color: c };
        applyBg();
        commit();
      });
      colors.appendChild(s);
    });

    const pats = $("#bgPatterns");
    ASSETS.patterns.forEach((p) => {
      const t = document.createElement("button");
      t.className = "bg-tile";
      t.title = p.name;
      t.style.backgroundImage = `url("${p.uri}")`;
      t.style.backgroundSize = p.size + "px";
      t.addEventListener("click", () => {
        state.bg = { kind: "pattern", uri: p.uri, size: p.size, id: p.id };
        applyBg();
        commit();
      });
      pats.appendChild(t);
    });
  }

  /* ---------------- craft tab ---------------- */
  function craftCard(asset, onAdd) {
    const card = document.createElement("div");
    card.className = "craft-card";
    card.title = asset.name;
    const img = document.createElement("img");
    img.src = asset.uri;
    img.alt = asset.name;
    card.appendChild(img);
    card.addEventListener("click", onAdd);
    return card;
  }

  function initCraft() {
    ASSETS.tapes.forEach((t) => {
      $("#tapeGrid").appendChild(
        craftCard(t, () =>
          addLayer({
            src: t.uri, name: t.name, w: t.w, h: t.h,
            flat: true, frac: 0.4,
            rot: (Math.random() - 0.5) * 40,
          })
        )
      );
    });
    ASSETS.papers.forEach((p) => {
      $("#paperGrid").appendChild(
        craftCard(p, () => addLayer({ src: p.uri, name: p.name, w: p.w, h: p.h, frac: 0.5 }))
      );
    });
    ASSETS.stickers.forEach((s) => {
      $("#stickerGrid").appendChild(
        craftCard(s, () =>
          addLayer({
            src: s.uri, name: s.name, w: s.w, h: s.h,
            frac: 0.22, rot: (Math.random() - 0.5) * 24,
          })
        )
      );
    });
  }

  /* ---------------- search tab (Openverse) ---------------- */
  const SEARCH_IDEAS = ["flowers", "vintage magazine", "butterfly", "lace texture", "disco ball", "clouds", "pearls", "cowboy boots", "matcha", "old postcard"];

  function initSearch() {
    const chips = $("#searchChips");
    SEARCH_IDEAS.forEach((q) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = q;
      b.addEventListener("click", () => {
        $("#searchInput").value = q;
        runSearch(q);
      });
      chips.appendChild(b);
    });
    $("#searchForm").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const q = $("#searchInput").value.trim();
      if (q) runSearch(q);
    });
  }

  async function runSearch(q) {
    const grid = $("#searchGrid");
    grid.innerHTML = '<p class="loading">Searching the open web…</p>';
    try {
      const r = await fetch(
        "https://api.openverse.org/v1/images/?page_size=24&mature=false&q=" + encodeURIComponent(q)
      );
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      grid.innerHTML = "";
      if (!data.results || !data.results.length) {
        grid.innerHTML = '<p class="hint pad">No results for that — try another word.</p>';
        return;
      }
      for (const item of data.results) {
        const card = document.createElement("div");
        card.className = "item-card";
        card.title = item.title || q;
        const img = document.createElement("img");
        img.loading = "lazy";
        img.src = item.thumbnail || prox(item.url, 200);
        img.alt = item.title || q;
        const cap = document.createElement("div");
        cap.className = "cap";
        cap.textContent = item.license ? "CC " + item.license.toUpperCase() : "";
        card.appendChild(img);
        card.appendChild(cap);
        card.addEventListener("click", () => addImageLayer(prox(item.url, 1200), item.title || q));
        grid.appendChild(card);
      }
    } catch (e) {
      grid.innerHTML =
        '<div class="error-note">Search is unavailable right now (rate limit or connection). Try again in a minute.<br><button class="ghost-btn">Retry</button></div>';
      grid.querySelector("button").addEventListener("click", () => runSearch(q));
    }
  }

  /* ---------------- my stuff tab ---------------- */
  const recent = [];

  function pushRecent(src, name) {
    recent.unshift({ src, name });
    if (recent.length > 12) recent.pop();
    const grid = $("#recentGrid");
    grid.innerHTML = "";
    for (const r of recent) {
      const card = document.createElement("div");
      card.className = "item-card";
      const img = document.createElement("img");
      img.src = r.src;
      img.alt = r.name;
      card.appendChild(img);
      card.addEventListener("click", () => addImageLayer(r.src, r.name));
      grid.appendChild(card);
    }
  }

  function fileToDataURL(file) {
    // Downscale big photos so localStorage autosave stays workable.
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = rej;
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1400;
          let { width: w, height: h } = img;
          if (Math.max(w, h) <= MAX && file.size < 500 * 1024) return res(fr.result);
          const k = Math.min(1, MAX / Math.max(w, h));
          const c = document.createElement("canvas");
          c.width = Math.round(w * k);
          c.height = Math.round(h * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          const isPng = /png|webp|gif/i.test(file.type);
          res(c.toDataURL(isPng ? "image/png" : "image/jpeg", 0.85));
        };
        img.onerror = rej;
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  function initMine() {
    $("#fileInput").addEventListener("change", async (ev) => {
      for (const file of ev.target.files) {
        try {
          const url = await fileToDataURL(file);
          await addImageLayer(url, file.name);
          pushRecent(url, file.name);
        } catch (e) {
          toast("Couldn't read " + file.name);
        }
      }
      ev.target.value = "";
    });

    $("#urlForm").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const url = $("#urlInput").value.trim();
      if (!url) return;
      const src = prox(url, 1200);
      addImageLayer(src, "pasted image").then(() => pushRecent(src, "pasted image"));
      $("#urlInput").value = "";
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) state = JSON.parse(saved);
    } catch (e) {
      state = defaultState();
    }
    const sizeVal = state.w + "x" + state.h;
    const sizeSel = $("#boardSize");
    if ([...sizeSel.options].some((o) => o.value === sizeVal)) sizeSel.value = sizeVal;

    initBackgrounds();
    initCraft();
    initSearch();
    initMine();
    lazyLoadTab("fashion");

    renderBoard();
    lastSnap = snap();
    updateHistoryButtons();

    new ResizeObserver(refit).observe(stage);
    window.addEventListener("orientationchange", () => setTimeout(refit, 250));
  }

  boot();
})();
