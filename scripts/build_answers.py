#!/usr/bin/env python3
"""Build the "Straight answers" pages of thegrowthden.com.

Each page is a Markdown file in answers/_src/<slug>.md with front matter:

    ---
    title: Page <title> (also the og:title)
    h1: The on-page headline
    description: One or two plain sentences. Used as the meta description and the lead answer.
    updated: 2026-09-28
    kind: answer | comparison | pricing | checklist | local
    ---

followed by the body. A `## Questions people ask` section is special: every
`### question` under it, with the paragraph(s) that follow, becomes a
<details> block on the page and a Question in the FAQPage schema.

Widgets: a line containing only `<!-- calc:mer -->` or `<!-- calc:fee -->`
is replaced with an inline calculator.

Run:  python3 scripts/build_answers.py
It writes <slug>/index.html for every page, answers/index.html, the
"## Straight answers" section of llms.txt, and the STRAIGHT-ANSWERS block on
the homepage. build_notes.py imports ANSWER_PAGES for the sitemap.
"""
import datetime as dt
import html
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from build_notes import md_to_html, inline, nice, GTM  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "answers" / "_src"
SITE = "https://thegrowthden.com"
CAL = "https://calendar.app.google/dy8683mNDXyWAkPo9"

# Order matters: it is the order on /answers/ and in llms.txt.
ANSWER_PAGES = [
    "fractional-head-of-growth",
    "agency-vs-fractional",
    "pricing",
    "mer-target",
    "when-to-hire",
    "how-to-evaluate-a-fractional-cmo",
    "who-owns-strategy",
    "st-louis",
]

AUTHOR = {"@type": "Person", "@id": f"{SITE}/#logan", "name": "Logan Ice", "url": f"{SITE}/",
          "jobTitle": "Fractional Growth Advisor",
          "worksFor": {"@type": "ProfessionalService", "@id": f"{SITE}/#org", "name": "The Growth Den", "url": f"{SITE}/"}}

STYLE = """
  :root { --purple:#341f44; --blue:#256493; --orange:#fe7c2b; --gold:#ffc545; --cream:#fcf3d6; --ink:#1a1025; --muted:#6b5f78; --border:rgba(52,31,68,.12); }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Poppins',sans-serif; font-weight:300; color:var(--ink); background:var(--cream); line-height:1.75; }
  a { color:var(--blue); }
  header { background:var(--purple); padding:18px 16px; }
  header .in, main, footer .in { max-width:820px; margin:0 auto; }
  header .in { display:flex; align-items:center; justify-content:space-between; gap:16px; }
  header img { height:40px; display:block; }
  header nav a { color:#fff; font-weight:500; text-decoration:none; font-size:15px; margin-left:18px; }
  main { padding:56px 16px 72px; }
  .tag { font-size:11px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--orange); margin-bottom:12px; }
  h1 { font-size:clamp(30px,5vw,46px); font-weight:700; color:var(--purple); line-height:1.15; margin-bottom:16px; }
  .updated { color:var(--muted); font-size:14px; margin-bottom:24px; }
  .answer { font-size:19px; font-weight:400; margin-bottom:8px; }
  .body h2 { font-size:23px; font-weight:600; color:var(--purple); line-height:1.3; margin:44px 0 14px; }
  .body h3 { font-size:18px; font-weight:600; color:var(--purple); margin:28px 0 8px; }
  .body p { margin-bottom:16px; font-size:17px; }
  .body ul, .body ol { padding-left:22px; margin-bottom:18px; display:flex; flex-direction:column; gap:8px; font-size:17px; }
  .body blockquote { border-left:4px solid var(--orange); padding:4px 0 4px 18px; margin:0 0 18px; color:var(--purple); }
  .body blockquote p { margin:0; }
  .body table { width:100%; border-collapse:collapse; margin:8px 0 22px; font-size:15px; background:#fff; border:1px solid var(--border); border-radius:14px; overflow:hidden; }
  .body th, .body td { text-align:left; padding:12px 14px; border-bottom:1px solid var(--border); vertical-align:top; }
  .body th { background:var(--purple); color:#fff; font-weight:600; }
  .body tr:last-child td { border-bottom:none; }
  .table-wrap { overflow-x:auto; margin-bottom:22px; }
  details { background:#fff; border:1px solid var(--border); border-radius:14px; padding:16px 20px; margin-bottom:10px; }
  summary { font-weight:600; color:var(--purple); cursor:pointer; }
  details p { margin-top:10px; }
  .calc { background:#fff; border:1px solid var(--border); border-left:5px solid var(--orange); border-radius:16px; padding:22px 24px; margin:8px 0 26px; }
  .calc h3 { margin:0 0 6px; font-size:18px; color:var(--purple); font-weight:600; }
  .calc .hint { color:var(--muted); font-size:14px; margin-bottom:14px; }
  .calc label { display:block; font-weight:500; font-size:14px; margin:12px 0 4px; }
  .calc input[type=number] { width:100%; max-width:260px; font:inherit; font-size:16px; padding:10px 12px; border:1px solid var(--border); border-radius:10px; background:var(--cream); }
  .calc input[type=range] { width:100%; max-width:420px; accent-color:var(--orange); }
  .calc .out { margin-top:16px; padding:14px 16px; background:var(--cream); border-radius:12px; font-size:16px; }
  .calc .big { font-size:30px; font-weight:700; color:var(--purple); line-height:1.1; }
  .calc .row { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; }
  .cta { display:inline-block; margin-top:32px; background:var(--orange); color:#fff; font-weight:600; padding:14px 30px; border-radius:100px; text-decoration:none; }
  .box { background:var(--purple); color:rgba(255,255,255,.85); border-radius:20px; padding:28px; margin-top:48px; }
  .box h2 { color:#fff; font-size:22px; margin-bottom:8px; }
  .box a.cta { margin-top:14px; padding:12px 26px; }
  .box a.more { color:var(--gold); margin-left:14px; font-weight:500; }
  h2.more-h { font-size:20px; color:var(--purple); font-weight:600; margin:48px 0 14px; }
  .list { list-style:none; padding:0; display:flex; flex-direction:column; gap:12px; }
  .list li { background:#fff; border:1px solid var(--border); border-radius:16px; padding:18px 22px; }
  .list a { color:var(--purple); font-weight:600; font-size:18px; text-decoration:none; }
  .list p { margin-top:6px; font-size:15px; }
  .d { color:var(--muted); font-size:13px; }
  footer { background:var(--purple); color:rgba(255,255,255,.7); padding:28px 16px; font-size:14px; }
  footer a { color:#fff; }
"""

CALC_MER = """<div class="calc" id="calc-mer">
  <h3>Your break-even MER</h3>
  <div class="hint">Contribution margin here means what's left of a dollar of revenue after product cost, shipping, payment fees and any per-order costs, before you spend anything on marketing.</div>
  <label for="cm">Contribution margin before marketing: <strong><span id="cm-v">35</span>%</strong></label>
  <input type="range" id="cm" min="10" max="80" value="35" step="1" />
  <label for="rev">Monthly revenue (optional, for the dollar view)</label>
  <input type="number" id="rev" placeholder="e.g. 800000" min="0" step="1000" />
  <div class="out">
    <div>Break-even MER: <span class="big" id="be">2.86x</span></div>
    <div id="be-line">At a 35% margin, anything under a 2.86 MER is losing money on every marketing dollar, whatever the ad platform says its ROAS is.</div>
    <div id="be-dollars"></div>
  </div>
</div>
<script>
(function(){
  var cm=document.getElementById('cm'),cv=document.getElementById('cm-v'),be=document.getElementById('be'),bl=document.getElementById('be-line'),rev=document.getElementById('rev'),bd=document.getElementById('be-dollars');
  function fmt(n){return '$'+Math.round(n).toLocaleString('en-US');}
  function go(){
    var m=Number(cm.value)/100, x=1/m; cv.textContent=cm.value; be.textContent=x.toFixed(2)+'x';
    bl.textContent='At a '+cm.value+'% margin, anything under a '+x.toFixed(2)+' MER is losing money on every marketing dollar, whatever the ad platform says its ROAS is. A healthy target usually sits 20% to 40% above break-even, so roughly '+(x*1.2).toFixed(1)+'x to '+(x*1.4).toFixed(1)+'x here.';
    var r=Number(rev.value);
    if(r>0){ var maxSpend=r*m; bd.textContent='On '+fmt(r)+' a month you can spend at most '+fmt(maxSpend)+' on all marketing before the month goes negative. A comfortable ceiling that leaves profit is closer to '+fmt(maxSpend*0.7)+'.'; } else { bd.textContent=''; }
  }
  cm.addEventListener('input',go); rev.addEventListener('input',go); go();
})();
</script>"""

CALC_FEE = """<div class="calc" id="calc-fee">
  <h3>Flat retainer or a percentage of spend?</h3>
  <div class="hint">Agencies commonly charge 10% to 20% of ad spend, sometimes with a minimum. Slide your spend and see where a flat fee stops being the expensive option.</div>
  <div class="row">
    <div><label for="spend">Monthly ad spend: <strong><span id="spend-v">$60,000</span></strong></label><input type="range" id="spend" min="10000" max="500000" step="5000" value="60000" /></div>
    <div><label for="pct">Agency fee as % of spend: <strong><span id="pct-v">15</span>%</strong></label><input type="range" id="pct" min="5" max="25" step="1" value="15" /></div>
    <div><label for="flat">Flat monthly retainer</label><input type="number" id="flat" value="7500" min="0" step="500" /></div>
  </div>
  <div class="out">
    <div>Agency fee at this spend: <span class="big" id="afee">$9,000</span></div>
    <div id="fee-line"></div>
  </div>
</div>
<script>
(function(){
  var s=document.getElementById('spend'),sv=document.getElementById('spend-v'),p=document.getElementById('pct'),pv=document.getElementById('pct-v'),f=document.getElementById('flat'),af=document.getElementById('afee'),fl=document.getElementById('fee-line');
  function fmt(n){return '$'+Math.round(n).toLocaleString('en-US');}
  function go(){
    var spend=Number(s.value),pct=Number(p.value)/100,flat=Number(f.value)||0,fee=spend*pct;
    sv.textContent=fmt(spend); pv.textContent=p.value; af.textContent=fmt(fee);
    var be=pct>0?flat/pct:0;
    if(fee>flat){ fl.textContent='That is '+fmt(fee-flat)+' a month more than a '+fmt(flat)+' flat retainer, and the gap grows every time you scale spend. The two cost the same at about '+fmt(be)+' a month in spend.'; }
    else { fl.textContent='At this spend a percentage deal is cheaper than a '+fmt(flat)+' retainer by '+fmt(flat-fee)+' a month. The lines cross at about '+fmt(be)+' in monthly spend; above that the flat fee wins and keeps winning.'; }
  }
  [s,p,f].forEach(function(el){el.addEventListener('input',go);}); go();
})();
</script>"""


def load(slug):
    f = SRC / f"{slug}.md"
    text = f.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        raise SystemExit(f"{f.name}: missing front matter")
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    for k in ("title", "h1", "description", "updated", "kind"):
        if not meta.get(k):
            raise SystemExit(f"{f.name}: front matter needs '{k}'")
    dt.date.fromisoformat(meta["updated"])
    meta["slug"] = slug
    body = m.group(2).strip()
    # split off the FAQ section
    faq = []
    parts = re.split(r"^## Questions people ask\s*$", body, flags=re.M)
    main_md = parts[0].rstrip()
    if len(parts) > 1:
        faq_md = parts[1]
        # anything after the FAQ that starts a new ## goes back to the main body
        tail = re.split(r"^(?=## )", faq_md, flags=re.M)
        faq_md = tail[0]
        extra = "".join(tail[1:])
        for q, a in re.findall(r"^### (.+?)\n(.*?)(?=^### |\Z)", faq_md, flags=re.S | re.M):
            faq.append((q.strip(), a.strip()))
        if extra.strip():
            main_md += "\n\n" + extra.strip()
    meta["faq"] = faq
    meta["main_md"] = main_md
    return meta


def render_body(md):
    # tables: markdown pipe tables (build_notes doesn't do them)
    out, buf = [], []

    def flush_table():
        nonlocal buf
        if not buf:
            return
        rows = [r for r in buf if not re.match(r"^\s*\|?\s*:?-{2,}", r)]
        cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
        t = '<div class="table-wrap"><table><thead><tr>' + "".join(f"<th>{inline(c)}</th>" for c in cells[0]) + "</tr></thead><tbody>"
        for r in cells[1:]:
            t += "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>"
        out.append(("html", t + "</tbody></table></div>"))
        buf = []

    chunk = []

    def flush_chunk():
        nonlocal chunk
        if chunk:
            out.append(("md", "\n".join(chunk)))
            chunk = []

    for line in md.splitlines():
        s = line.strip()
        if s == "<!-- calc:mer -->":
            flush_chunk(); flush_table(); out.append(("html", CALC_MER)); continue
        if s == "<!-- calc:fee -->":
            flush_chunk(); flush_table(); out.append(("html", CALC_FEE)); continue
        if s.startswith("|"):
            flush_chunk(); buf.append(line); continue
        if buf:
            flush_table()
        chunk.append(line)
    flush_chunk(); flush_table()
    return "\n".join(md_to_html(c) if kind == "md" else c for kind, c in out)


def page_shell(title, desc, url, ld, content, kind="article"):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
{GTM}
<title>{html.escape(title)} | The Growth Den</title>
<meta name="description" content="{html.escape(desc)}" />
<link rel="canonical" href="{url}" />
<meta property="og:title" content="{html.escape(title)}" />
<meta property="og:description" content="{html.escape(desc)}" />
<meta property="og:url" content="{url}" />
<meta property="og:type" content="{kind}" />
<meta property="og:image" content="{SITE}/uploads/Growth_Den__Illustration_Denny.png" />
<link rel="icon" href="/favicon.ico" />
<link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<script type="application/ld+json">
{json.dumps(ld, indent=1, ensure_ascii=False)}
</script>
<style>{STYLE}</style>
</head>
<body>
<header><div class="in"><a href="/"><img src="/uploads/Growth_Den__Logo_Horizontal_White.png" alt="The Growth Den" /></a><nav><a href="/answers/">Answers</a><a href="/notes/">Notes</a><a href="/#seats">Seats</a></nav></div></header>
<main>
{content}
</main>
<footer><div class="in">© {dt.date.today().year} The Growth Den LLC · Logan Ice, St. Louis · <a href="mailto:logan@thegrowthden.com">logan@thegrowthden.com</a></div></footer>
</body>
</html>
"""


def build_page(p, pages):
    url = f"{SITE}/{p['slug']}/"
    graph = [{
        "@type": "Article" if p["kind"] != "local" else "WebPage",
        "@id": url + "#article",
        "headline": p["h1"],
        "description": p["description"],
        "url": url,
        "mainEntityOfPage": url,
        "datePublished": "2026-09-28",
        "dateModified": p["updated"],
        "author": AUTHOR,
        "publisher": {"@type": "Organization", "@id": f"{SITE}/#org", "name": "The Growth Den", "url": f"{SITE}/",
                      "logo": {"@type": "ImageObject", "url": f"{SITE}/uploads/Growth_Den__Logo_Horizontal_Primary.png"}},
        "about": {"@type": "Thing", "name": "Fractional growth marketing for DTC and e-commerce brands"},
    }]
    if p["faq"]:
        graph.append({"@type": "FAQPage", "@id": url + "#faq", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", md_to_html(a)).strip()}}
            for q, a in p["faq"]]})
    if p["kind"] == "local":
        graph.append({"@type": "ProfessionalService", "@id": f"{SITE}/#org", "name": "The Growth Den", "url": f"{SITE}/",
                      "image": f"{SITE}/uploads/Growth_Den__Logo_Horizontal_Primary.png",
                      "founder": {"@id": f"{SITE}/#logan"},
                      "address": {"@type": "PostalAddress", "addressLocality": "St. Louis", "addressRegion": "MO", "addressCountry": "US"},
                      "areaServed": [{"@type": "City", "name": "St. Louis"}, {"@type": "State", "name": "Missouri"}, {"@type": "Country", "name": "United States"}],
                      "priceRange": "From $7,500/month",
                      "email": "mailto:logan@thegrowthden.com"})
    if p["kind"] == "pricing":
        graph.append({"@type": "Offer", "@id": url + "#offer", "name": "Fractional growth advisory, any seat",
                      "url": url, "seller": {"@id": f"{SITE}/#org"},
                      "priceSpecification": {"@type": "UnitPriceSpecification", "minPrice": 7500, "priceCurrency": "USD", "unitText": "MONTH"}})
    ld = {"@context": "https://schema.org", "@graph": graph}

    faq_html = ""
    if p["faq"]:
        faq_html = '<h2>Questions people ask</h2>' + "".join(
            f"<details><summary>{html.escape(q)}</summary>{md_to_html(a)}</details>" for q, a in p["faq"])
    others = [o for o in pages if o["slug"] != p["slug"]]
    more = '<h2 class="more-h">More straight answers</h2><ul class="list">' + "".join(
        f'<li><a href="/{o["slug"]}/">{html.escape(o["h1"])}</a></li>' for o in others) + "</ul>"
    content = f"""  <div class="tag">Straight answers · Logan Ice</div>
  <h1>{html.escape(p['h1'])}</h1>
  <p class="updated">Last updated <time datetime="{p['updated']}">{nice(p['updated'])}</time></p>
  <p class="answer">{inline(p['description'])}</p>
  <article class="body">
{render_body(p['main_md'])}
  {faq_html}
  </article>
  <div class="box">
    <h2>Work with Logan</h2>
    <p>I'm a fractional growth advisor for growth-stage DTC and e-commerce brands. I handle strategy and take execution off your plate, in whatever seat you need, from $7,500 a month.</p>
    <a class="cta" href="{CAL}" target="_blank">Let's see if we're a fit</a><a class="more" href="/#seats">See the seats →</a>
  </div>
  {more}"""
    d = ROOT / p["slug"]
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(page_shell(p["title"], p["description"], url, ld, content), encoding="utf-8")


def build_index(pages):
    url = f"{SITE}/answers/"
    desc = "Plain answers to the questions DTC founders and marketing leaders actually ask before hiring a fractional growth lead: what it costs, how it compares to an agency, when to hire, how to judge one, and how to measure the work."
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Straight answers", "url": url,
          "description": desc, "author": AUTHOR,
          "hasPart": [{"@type": "Article", "headline": p["h1"], "url": f"{SITE}/{p['slug']}/"} for p in pages]}
    items = "".join(
        f'<li><a href="/{p["slug"]}/">{html.escape(p["h1"])}</a><p>{html.escape(p["description"])}</p></li>' for p in pages)
    latest = max(p["updated"] for p in pages)
    content = f"""  <div class="tag">Straight answers</div>
  <h1>The questions people ask before they hire someone like me</h1>
  <p class="updated">Last updated <time datetime="{latest}">{nice(latest)}</time></p>
  <p class="answer">{html.escape(desc)}</p>
  <ul class="list" style="margin-top:28px">{items}</ul>"""
    (ROOT / "answers").mkdir(exist_ok=True)
    (ROOT / "answers" / "index.html").write_text(page_shell("Straight answers", desc, url, ld, content, "website"), encoding="utf-8")


def update_llms(pages):
    p = ROOT / "llms.txt"
    t = p.read_text(encoding="utf-8")
    section = "## Straight answers\n" + "".join(f"- [{x['h1']}]({SITE}/{x['slug']}/): {x['description']}\n" for x in pages)
    section += f"- [All straight answers]({SITE}/answers/)\n"
    if "## Straight answers" in t:
        t = re.sub(r"## Straight answers\n(?:- .*\n)*", section, t)
    else:
        t = t.replace("\n## Notes from the Den", "\n" + section + "\n## Notes from the Den", 1)
    p.write_text(t, encoding="utf-8")


def update_home(pages):
    home = ROOT / "index.html"
    t = home.read_text(encoding="utf-8")
    block = "".join(f'<li><a href="/{p["slug"]}/">{html.escape(p["h1"])}</a></li>' for p in pages)
    pat = re.compile(r"(<!-- STRAIGHT-ANSWERS:START -->).*?(<!-- STRAIGHT-ANSWERS:END -->)", re.S)
    if not pat.search(t):
        raise SystemExit("STRAIGHT-ANSWERS marker not found in index.html")
    home.write_text(pat.sub(lambda m: m.group(1) + block + m.group(2), t), encoding="utf-8")


def main():
    pages = [load(s) for s in ANSWER_PAGES]
    for p in pages:
        build_page(p, pages)
    build_index(pages)
    update_llms(pages)
    update_home(pages)
    print(f"built {len(pages)} answer page(s) + /answers/")


if __name__ == "__main__":
    main()
