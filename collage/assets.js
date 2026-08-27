/* ============ Collage Den — built-in scrapbook assets ============
   Everything here is generated SVG (no network needed): background
   patterns, washi tape, paper scraps, frames and stickers. */

(function () {
  const uri = (svg) => "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  const wrap = (w, h, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

  /* ---------------- background patterns ---------------- */

  const COLORWAYS = [
    { id: "blush",  bg: "#fdeef2", fg: "#f2a0b6" },
    { id: "butter", bg: "#fdf6e0", fg: "#efc25a" },
    { id: "sky",    bg: "#eaf5fb", fg: "#8cc8e8" },
    { id: "sage",   bg: "#edf4ec", fg: "#9cc4a2" },
    { id: "lilac",  bg: "#f4eefb", fg: "#bfa2e3" },
    { id: "ink",    bg: "#f7f6f2", fg: "#4a463f" },
  ];

  const PATTERN_FNS = {
    zigzag: (bg, fg) => wrap(60, 60,
      `<rect width="60" height="60" fill="${bg}"/>` +
      `<path d="M0 15 L15 0 L30 15 L45 0 L60 15 V27 L45 12 L30 27 L15 12 L0 27 Z" fill="${fg}"/>` +
      `<path d="M0 45 L15 30 L30 45 L45 30 L60 45 V57 L45 42 L30 57 L15 42 L0 57 Z" fill="${fg}"/>`),
    dots: (bg, fg) => wrap(48, 48,
      `<rect width="48" height="48" fill="${bg}"/>` +
      `<circle cx="12" cy="12" r="6" fill="${fg}"/><circle cx="36" cy="36" r="6" fill="${fg}"/>`),
    gingham: (bg, fg) => wrap(48, 48,
      `<rect width="48" height="48" fill="${bg}"/>` +
      `<rect width="24" height="48" fill="${fg}" opacity=".45"/>` +
      `<rect width="48" height="24" fill="${fg}" opacity=".45"/>` +
      `<rect width="24" height="24" fill="${fg}" opacity=".55"/>`),
    stripes: (bg, fg) => wrap(48, 48,
      `<rect width="48" height="48" fill="${bg}"/>` +
      `<path d="M-12 48 L48 -12 L60 0 L0 60 Z M-12 24 L24 -12 L36 0 L0 36 Z" fill="${fg}" opacity=".8"/>` +
      `<path d="M12 60 L60 12 L72 24 L24 72 Z" fill="${fg}" opacity=".8"/>`),
    grid: (bg, fg) => wrap(40, 40,
      `<rect width="40" height="40" fill="${bg}"/>` +
      `<path d="M0 .75 H40 M.75 0 V40" stroke="${fg}" stroke-width="1.5" opacity=".6"/>`),
    hearts: (bg, fg) => wrap(56, 56,
      `<rect width="56" height="56" fill="${bg}"/>` +
      `<g fill="${fg}"><path d="M14 20 c-4 -6 -12 -2 -9 4 c2 4 9 8 9 8 s7 -4 9 -8 c3 -6 -5 -10 -9 -4 Z"/>` +
      `<path d="M42 44 c-3.4 -5 -10 -1.7 -7.6 3.4 c1.7 3.4 7.6 6.8 7.6 6.8 s5.9 -3.4 7.6 -6.8 c2.4 -5.1 -4.2 -8.4 -7.6 -3.4 Z" transform="rotate(-12 42 48)"/></g>`),
    stars: (bg, fg) => wrap(56, 56,
      `<rect width="56" height="56" fill="${bg}"/>` +
      `<g fill="${fg}"><path d="M14 6 l2.6 5.8 6.4 .6 -4.8 4.2 1.4 6.2 -5.6 -3.3 -5.6 3.3 1.4 -6.2 -4.8 -4.2 6.4 -.6 Z"/>` +
      `<path d="M42 32 l2.6 5.8 6.4 .6 -4.8 4.2 1.4 6.2 -5.6 -3.3 -5.6 3.3 1.4 -6.2 -4.8 -4.2 6.4 -.6 Z" transform="rotate(18 42 40)"/></g>`),
    checker: (bg, fg) => wrap(40, 40,
      `<rect width="40" height="40" fill="${bg}"/>` +
      `<rect width="20" height="20" fill="${fg}"/><rect x="20" y="20" width="20" height="20" fill="${fg}"/>`),
    scallop: (bg, fg) => wrap(48, 32,
      `<rect width="48" height="32" fill="${bg}"/>` +
      `<path d="M0 16 a12 12 0 0 1 24 0 a12 12 0 0 1 24 0 V32 H0 Z" fill="${fg}" opacity=".85"/>`),
    confetti: (bg, fg) => wrap(72, 72,
      `<rect width="72" height="72" fill="${bg}"/>` +
      `<g fill="${fg}"><rect x="8" y="10" width="10" height="4" rx="2" transform="rotate(24 13 12)"/>` +
      `<circle cx="52" cy="14" r="4"/>` +
      `<rect x="30" y="34" width="10" height="4" rx="2" transform="rotate(-30 35 36)"/>` +
      `<path d="M14 52 l4 8 h-8 Z"/>` +
      `<rect x="52" y="52" width="10" height="4" rx="2" transform="rotate(60 57 54)"/>` +
      `<circle cx="34" cy="62" r="3"/></g>`),
  };

  // Special fixed-color papers.
  const SPECIAL_PAPERS = [
    { id: "notebook", name: "Notebook", size: 64, svg: wrap(64, 64,
      `<rect width="64" height="64" fill="#ffffff"/>` +
      `<path d="M0 15.5 H64 M0 31.5 H64 M0 47.5 H64 M0 63.5 H64" stroke="#b9d6ef" stroke-width="1.4"/>`) },
    { id: "graph", name: "Graph paper", size: 48, svg: wrap(48, 48,
      `<rect width="48" height="48" fill="#fdfdfb"/>` +
      `<path d="M0 .5 H48 M0 12.5 H48 M0 24.5 H48 M0 36.5 H48 M.5 0 V48 M12.5 0 V48 M24.5 0 V48 M36.5 0 V48" stroke="#cfe0d8" stroke-width="1"/>`) },
    { id: "kraft", name: "Kraft paper", size: 90, svg: wrap(90, 90,
      `<rect width="90" height="90" fill="#d8bd97"/>` +
      `<g fill="#c9ac83" opacity=".7"><circle cx="12" cy="20" r="1.6"/><circle cx="44" cy="8" r="1.2"/><circle cx="74" cy="26" r="1.7"/><circle cx="28" cy="48" r="1.3"/><circle cx="60" cy="56" r="1.6"/><circle cx="10" cy="74" r="1.4"/><circle cx="82" cy="76" r="1.2"/><circle cx="46" cy="82" r="1.6"/></g>` +
      `<g fill="#e5d0af" opacity=".8"><circle cx="22" cy="12" r="1.2"/><circle cx="64" cy="18" r="1.4"/><circle cx="16" cy="42" r="1.5"/><circle cx="52" cy="38" r="1.1"/><circle cx="80" cy="50" r="1.4"/><circle cx="34" cy="66" r="1.5"/><circle cx="68" cy="80" r="1.3"/></g>`) },
    { id: "cork", name: "Cork board", size: 96, svg: wrap(96, 96,
      `<rect width="96" height="96" fill="#c89b6a"/>` +
      `<g fill="#b3854f" opacity=".85"><ellipse cx="16" cy="18" rx="5" ry="3.4" transform="rotate(20 16 18)"/><ellipse cx="58" cy="10" rx="4" ry="2.6" transform="rotate(-14 58 10)"/><ellipse cx="84" cy="30" rx="5.4" ry="3" transform="rotate(30 84 30)"/><ellipse cx="34" cy="44" rx="4.4" ry="2.8" transform="rotate(-24 34 44)"/><ellipse cx="70" cy="58" rx="5" ry="3.2" transform="rotate(12 70 58)"/><ellipse cx="14" cy="70" rx="4.4" ry="2.6" transform="rotate(-8 14 70)"/><ellipse cx="46" cy="84" rx="5.2" ry="3" transform="rotate(26 46 84)"/><ellipse cx="86" cy="86" rx="4" ry="2.4" transform="rotate(-18 86 86)"/></g>` +
      `<g fill="#dbb488" opacity=".9"><ellipse cx="42" cy="22" rx="3.6" ry="2.2" transform="rotate(8 42 22)"/><ellipse cx="10" cy="42" rx="3.4" ry="2" transform="rotate(-20 10 42)"/><ellipse cx="88" cy="8" rx="3" ry="2" transform="rotate(14 88 8)"/><ellipse cx="60" cy="36" rx="3.4" ry="2.2" transform="rotate(-30 60 36)"/><ellipse cx="26" cy="60" rx="3.6" ry="2.1" transform="rotate(18 26 60)"/><ellipse cx="66" cy="74" rx="3.2" ry="2" transform="rotate(-10 66 74)"/></g>`) },
  ];

  const PATTERN_NAMES = {
    zigzag: "Zigzag", dots: "Polka dots", gingham: "Gingham", stripes: "Stripes",
    grid: "Grid", hearts: "Hearts", stars: "Stars", checker: "Checkerboard",
    scallop: "Scallops", confetti: "Confetti",
  };

  function buildPatterns() {
    const out = [];
    for (const pid of Object.keys(PATTERN_FNS)) {
      for (const cw of COLORWAYS) {
        const svg = PATTERN_FNS[pid](cw.bg, cw.fg);
        const m = svg.match(/width="(\d+)" height="(\d+)"/);
        out.push({
          id: `${pid}-${cw.id}`,
          name: `${PATTERN_NAMES[pid]} (${cw.id})`,
          uri: uri(svg),
          size: Number(m[1]),
        });
      }
    }
    for (const p of SPECIAL_PAPERS) {
      out.push({ id: p.id, name: p.name, uri: uri(p.svg), size: p.size });
    }
    return out;
  }

  const SOLID_COLORS = [
    "#ffffff", "#faf5ec", "#f7e8e8", "#fdeef2", "#fdf6e0", "#eaf5fb",
    "#edf4ec", "#f4eefb", "#e8e4dc", "#d8bd97", "#3f3a34", "#1d2a3a",
  ];

  /* ---------------- washi tape ---------------- */

  // Torn / jagged short edges for a strip of tape.
  function tornEdgePath(w, h) {
    const jag = 7, step = h / 4;
    let d = `M${jag} 0 `;
    for (let y = 0, i = 0; y < h; y += step, i++) {
      d += `L${i % 2 ? jag : 0} ${y + step / 2} L${i % 2 ? 0 : jag} ${y + step} `;
    }
    d += `L${w - jag} ${h} `;
    for (let y = h, i = 0; y > 0; y -= step, i++) {
      d += `L${w - (i % 2 ? jag : 0)} ${y - step / 2} L${w - (i % 2 ? 0 : jag)} ${y - step} `;
    }
    return d + "Z";
  }

  function tapeSVG(w, h, deco) {
    const shape = tornEdgePath(w, h);
    return wrap(w, h,
      `<defs><clipPath id="c"><path d="${shape}"/></clipPath></defs>` +
      `<g clip-path="url(#c)">${deco(w, h)}` +
      `<rect width="${w}" height="${h / 4}" fill="#ffffff" opacity=".22"/>` +
      `<rect y="${h - h / 6}" width="${w}" height="${h / 6}" fill="#000000" opacity=".06"/></g>`);
  }

  const solidTape = (color) => (w, h) => `<rect width="${w}" height="${h}" fill="${color}" opacity=".88"/>`;
  const stripeTape = (a, b) => (w, h) => {
    let bars = `<rect width="${w}" height="${h}" fill="${a}" opacity=".9"/>`;
    for (let x = -h; x < w + h; x += 28)
      bars += `<path d="M${x} ${h} L${x + h} 0 L${x + h + 12} 0 L${x + 12} ${h} Z" fill="${b}" opacity=".9"/>`;
    return bars;
  };
  const dotTape = (a, b) => (w, h) => {
    let dots = `<rect width="${w}" height="${h}" fill="${a}" opacity=".9"/>`;
    for (let x = 14; x < w; x += 26)
      for (let y = 12; y < h; y += 22)
        dots += `<circle cx="${x + (Math.floor(y / 22) % 2 ? 13 : 0)}" cy="${y}" r="4.5" fill="${b}" opacity=".95"/>`;
    return dots;
  };
  const ginghamTape = (a, b) => (w, h) => {
    let g = `<rect width="${w}" height="${h}" fill="${a}" opacity=".9"/>`;
    for (let x = 0; x < w; x += 24) g += `<rect x="${x}" width="12" height="${h}" fill="${b}" opacity=".4"/>`;
    for (let y = 0; y < h; y += 24) g += `<rect y="${y}" width="${w}" height="12" fill="${b}" opacity=".4"/>`;
    return g;
  };

  const TAPES = [
    { id: "tape-blush",   name: "Blush tape",    deco: solidTape("#f2a9bc") },
    { id: "tape-butter",  name: "Butter tape",   deco: solidTape("#f5cf6b") },
    { id: "tape-sky",     name: "Sky tape",      deco: solidTape("#93cbe8") },
    { id: "tape-sage",    name: "Sage tape",     deco: solidTape("#a8cbad") },
    { id: "tape-lilac",   name: "Lilac tape",    deco: solidTape("#c5abe4") },
    { id: "tape-craft",   name: "Masking tape",  deco: solidTape("#e5d7b8") },
    { id: "tape-candy",   name: "Candy stripe",  deco: stripeTape("#fef2f4", "#ef7f9b") },
    { id: "tape-navyst",  name: "Navy stripe",   deco: stripeTape("#f2f6fa", "#33557c") },
    { id: "tape-dot",     name: "Dotty tape",    deco: dotTape("#fdf3d8", "#ef9fb4") },
    { id: "tape-dot2",    name: "Mint dots",     deco: dotTape("#e6f4ef", "#57a58a") },
    { id: "tape-ging",    name: "Gingham tape",  deco: ginghamTape("#fdf6f0", "#d96a6a") },
    { id: "tape-ging2",   name: "Picnic tape",   deco: ginghamTape("#f4f8fd", "#5b87c5") },
  ];

  function buildTapes() {
    return TAPES.map((t) => {
      const w = 300, h = 64;
      return { id: t.id, name: t.name, uri: uri(tapeSVG(w, h, t.deco)), w, h, flat: true };
    });
  }

  /* ---------------- paper scraps & frames ---------------- */

  function tornPaper(w, h, fill, rough = 9) {
    // Irregular polygon that reads as hand-torn paper.
    const pts = [];
    const seg = (x1, y1, x2, y2, n) => {
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const wob = (Math.sin(i * 2.7 + w + h) + Math.cos(i * 1.9)) * rough * 0.5;
        const nx = -(y2 - y1), ny = (x2 - x1);
        const len = Math.hypot(nx, ny) || 1;
        pts.push([x1 + (x2 - x1) * t + (nx / len) * wob, y1 + (y2 - y1) * t + (ny / len) * wob]);
      }
    };
    seg(rough, rough, w - rough, rough, 7);
    seg(w - rough, rough, w - rough, h - rough, 5);
    seg(w - rough, h - rough, rough, h - rough, 7);
    seg(rough, h - rough, rough, rough, 5);
    const d = "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L") + "Z";
    return wrap(w, h,
      `<path d="${d}" fill="${fill}"/>` +
      `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".05" stroke-width="3"/>`);
  }

  const PAPERS = [
    { id: "scrap-white", name: "Torn white paper", w: 340, h: 240, svg: () => tornPaper(340, 240, "#fffdf6") },
    { id: "scrap-pink",  name: "Torn pink paper",  w: 320, h: 200, svg: () => tornPaper(320, 200, "#fbdfe7") },
    { id: "scrap-kraft", name: "Torn kraft paper", w: 330, h: 220, svg: () => tornPaper(330, 220, "#dec39c") },
    { id: "scrap-note",  name: "Torn notebook",    w: 340, h: 230, svg: () => {
        const base = tornPaper(340, 230, "#ffffff");
        let lines = "";
        for (let y = 42; y < 210; y += 28) lines += `<path d="M22 ${y} H318" stroke="#b9d6ef" stroke-width="2"/>`;
        lines += `<path d="M52 14 V216" stroke="#efb1b1" stroke-width="2"/>`;
        return base.replace("</svg>", lines + "</svg>");
      } },
    { id: "polaroid", name: "Polaroid frame", w: 320, h: 384, svg: () => wrap(320, 384,
        `<path fill-rule="evenodd" d="M0 0 H320 V384 H0 Z M24 24 H296 V296 H24 Z" fill="#fdfdfa"/>` +
        `<path d="M0 0 H320 V384 H0 Z" fill="none" stroke="#00000014" stroke-width="2"/>`) },
    { id: "frame-scallop", name: "Scallop frame", w: 340, h: 340, svg: () => {
        let ring = "";
        const R = 148, r = 24, cx = 170, cy = 170, n = 16;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          ring += `<circle cx="${(cx + Math.cos(a) * R).toFixed(1)}" cy="${(cy + Math.sin(a) * R).toFixed(1)}" r="${r}"/>`;
        }
        return wrap(340, 340,
          `<g fill="#fbe6a8">${ring}</g>` +
          `<path fill-rule="evenodd" d="M170 22 A148 148 0 1 0 170.01 22 Z M170 62 A108 108 0 1 1 169.99 62 Z" fill="#fbe6a8"/>`);
      } },
    { id: "tag", name: "Gift tag", w: 300, h: 150, svg: () => wrap(300, 150,
        `<path d="M52 8 H286 a8 8 0 0 1 8 8 V134 a8 8 0 0 1 -8 8 H52 L10 75 Z" fill="#f3ead6" stroke="#d8c9a8" stroke-width="3"/>` +
        `<circle cx="46" cy="75" r="10" fill="#fffdf8" stroke="#cbbb95" stroke-width="3"/>`) },
    { id: "corner", name: "Photo corners ×4", w: 90, h: 90, svg: () => wrap(90, 90,
        `<path d="M0 0 H90 L0 90 Z" fill="#3f3a34"/><path d="M8 8 H70 L8 70 Z" fill="#5a544c"/>`) },
  ];

  /* ---------------- stickers ---------------- */

  const STICKERS = [
    { id: "st-heart", name: "Heart", w: 200, h: 190, svg: () => wrap(200, 190,
        `<path d="M100 178 C40 130 8 96 8 58 C8 12 68 4 100 48 C132 4 192 12 192 58 C192 96 160 130 100 178 Z" fill="#ef5f80"/>` +
        `<ellipse cx="60" cy="52" rx="18" ry="12" fill="#fff" opacity=".45" transform="rotate(-24 60 52)"/>`) },
    { id: "st-star", name: "Star", w: 200, h: 200, svg: () => wrap(200, 200,
        `<path d="M100 8 L126 72 L194 78 L142 122 L158 190 L100 152 L42 190 L58 122 L6 78 L74 72 Z" fill="#f7c94b" stroke="#e0a92c" stroke-width="6" stroke-linejoin="round"/>`) },
    { id: "st-flower", name: "Flower", w: 210, h: 210, svg: () => {
        let petals = "";
        for (let i = 0; i < 8; i++)
          petals += `<ellipse cx="105" cy="48" rx="26" ry="44" fill="#f6a8c0" transform="rotate(${i * 45} 105 105)"/>`;
        return wrap(210, 210, petals + `<circle cx="105" cy="105" r="30" fill="#f7c94b"/>`);
      } },
    { id: "st-daisy", name: "Daisy", w: 210, h: 210, svg: () => {
        let petals = "";
        for (let i = 0; i < 10; i++)
          petals += `<ellipse cx="105" cy="52" rx="20" ry="46" fill="#ffffff" stroke="#e8e2d4" stroke-width="2" transform="rotate(${i * 36} 105 105)"/>`;
        return wrap(210, 210, petals + `<circle cx="105" cy="105" r="26" fill="#f2b428"/>`);
      } },
    { id: "st-butterfly", name: "Butterfly", w: 220, h: 190, svg: () => wrap(220, 190,
        `<g fill="#b48ae0"><path d="M110 95 C60 10 -14 26 12 84 C28 120 80 118 110 95 Z"/><path d="M110 95 C160 10 234 26 208 84 C192 120 140 118 110 95 Z"/><path d="M110 95 C70 170 10 172 24 128 C34 98 84 88 110 95 Z" opacity=".85"/><path d="M110 95 C150 170 210 172 196 128 C186 98 136 88 110 95 Z" opacity=".85"/></g>` +
        `<g fill="#f4d35e"><circle cx="52" cy="66" r="10"/><circle cx="168" cy="66" r="10"/></g>` +
        `<rect x="104" y="52" width="12" height="90" rx="6" fill="#4a3f5c"/>` +
        `<path d="M108 54 C96 34 84 30 78 22 M112 54 C124 34 136 30 142 22" stroke="#4a3f5c" stroke-width="5" fill="none" stroke-linecap="round"/>`) },
    { id: "st-rainbow", name: "Rainbow", w: 240, h: 130, svg: () => {
        const cols = ["#ef5f80", "#f2984b", "#f7c94b", "#8cc47e", "#6aa8dc", "#a687d6"];
        let arcs = "";
        cols.forEach((c, i) => {
          const r = 112 - i * 15;
          arcs += `<path d="M${120 - r} 126 A${r} ${r} 0 0 1 ${120 + r} 126" fill="none" stroke="${c}" stroke-width="15"/>`;
        });
        return wrap(240, 130, arcs);
      } },
    { id: "st-sun", name: "Sun", w: 210, h: 210, svg: () => {
        let rays = "";
        for (let i = 0; i < 12; i++)
          rays += `<path d="M105 6 L114 34 L96 34 Z" fill="#f2b428" transform="rotate(${i * 30} 105 105)"/>`;
        return wrap(210, 210, rays + `<circle cx="105" cy="105" r="58" fill="#f7c94b" stroke="#e0a92c" stroke-width="5"/>`);
      } },
    { id: "st-bow", name: "Bow", w: 230, h: 140, svg: () => wrap(230, 140,
        `<g fill="#e86e91"><path d="M115 70 C58 18 6 30 16 74 C24 110 82 104 115 70 Z"/><path d="M115 70 C172 18 224 30 214 74 C206 110 148 104 115 70 Z"/><path d="M96 84 C80 112 68 130 84 134 C96 137 106 116 112 96 Z"/><path d="M134 84 C150 112 162 130 146 134 C134 137 124 116 118 96 Z"/></g>` +
        `<circle cx="115" cy="74" r="18" fill="#c94f72"/>`) },
    { id: "st-sparkle", name: "Sparkle", w: 190, h: 190, svg: () => wrap(190, 190,
        `<path d="M95 6 C102 58 116 74 184 95 C116 116 102 132 95 184 C88 132 74 116 6 95 C74 74 88 58 95 6 Z" fill="#f7d64b" stroke="#e0b52c" stroke-width="4" stroke-linejoin="round"/>`) },
    { id: "st-lightning", name: "Zap", w: 150, h: 220, svg: () => wrap(150, 220,
        `<path d="M92 6 L20 122 H66 L52 214 L132 88 H82 Z" fill="#f7c94b" stroke="#2d2a26" stroke-width="7" stroke-linejoin="round"/>`) },
    { id: "st-smiley", name: "Smiley", w: 200, h: 200, svg: () => wrap(200, 200,
        `<circle cx="100" cy="100" r="92" fill="#f7d64b" stroke="#2d2a26" stroke-width="7"/>` +
        `<circle cx="68" cy="82" r="11" fill="#2d2a26"/><circle cx="132" cy="82" r="11" fill="#2d2a26"/>` +
        `<path d="M56 122 C74 152 126 152 144 122" stroke="#2d2a26" stroke-width="9" fill="none" stroke-linecap="round"/>`) },
    { id: "st-cherry", name: "Cherries", w: 190, h: 210, svg: () => wrap(190, 210,
        `<path d="M96 10 C70 52 46 82 52 132 M96 10 C118 56 136 84 132 138" stroke="#5d8f4e" stroke-width="8" fill="none" stroke-linecap="round"/>` +
        `<path d="M96 10 c18 -6 34 -4 44 6" stroke="#5d8f4e" stroke-width="8" fill="none" stroke-linecap="round"/>` +
        `<circle cx="52" cy="158" r="34" fill="#d6304b"/><circle cx="132" cy="164" r="34" fill="#e84a63"/>` +
        `<ellipse cx="42" cy="146" rx="9" ry="6" fill="#fff" opacity=".5" transform="rotate(-30 42 146)"/>` +
        `<ellipse cx="122" cy="152" rx="9" ry="6" fill="#fff" opacity=".5" transform="rotate(-30 122 152)"/>`) },
    { id: "st-xoxo", name: "xoxo", w: 300, h: 120, svg: () => wrap(300, 120,
        `<text x="150" y="86" text-anchor="middle" font-family="cursive" font-size="92" font-weight="700" fill="#2d2a26" transform="rotate(-4 150 60)">xoxo</text>`) },
    { id: "st-arrow", name: "Doodle arrow", w: 260, h: 120, svg: () => wrap(260, 120,
        `<path d="M12 96 C70 26 170 20 236 52" stroke="#2d2a26" stroke-width="8" fill="none" stroke-linecap="round"/>` +
        `<path d="M208 30 L242 54 L200 70" stroke="#2d2a26" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`) },
    { id: "st-scribble", name: "Scribble", w: 280, h: 90, svg: () => wrap(280, 90,
        `<path d="M10 60 C40 20 60 20 80 55 C100 90 120 90 140 50 C160 15 180 15 200 50 C220 85 245 80 270 35" stroke="#ef5f80" stroke-width="9" fill="none" stroke-linecap="round"/>`) },
  ];

  function buildList(list) {
    return list.map((s) => ({ id: s.id, name: s.name, uri: uri(s.svg()), w: s.w, h: s.h }));
  }

  window.ASSETS = {
    patterns: buildPatterns(),
    solids: SOLID_COLORS,
    tapes: buildTapes(),
    papers: buildList(PAPERS),
    stickers: buildList(STICKERS),
  };
})();
