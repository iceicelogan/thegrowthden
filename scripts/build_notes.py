#!/usr/bin/env python3
"""Build the Notes from the Den section of thegrowthden.com.

Add a new issue by dropping a Markdown file into notes/_src/ named
YYYY-MM-DD-some-slug.md with this front matter:

    ---
    title: The issue title
    date: 2026-09-15
    slug: some-slug            (optional, defaults to the file name minus the date)
    description: One or two plain sentences about the issue.
    ---

then run:  python3 scripts/build_notes.py

It renders notes/<slug>/index.html for every issue, the notes/index.html
archive, the "latest notes" blocks on the homepage and seat pages, the
sitemap and the Notes section of llms.txt. No dependencies beyond Python 3.
"""
import datetime as dt
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "notes" / "_src"
SITE = "https://thegrowthden.com"
CAL = "https://calendar.app.google/dy8683mNDXyWAkPo9"
SEAT_PAGES = ["fractional-growth-strategy", "fractional-head-of-creative",
              "meta-media-buyer", "marketing-team-builder", "interim-head-of-marketing"]
GTM = """<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TR4S2MZM');</script>"""


# ---------- markdown (small, dependency-free) ----------
def inline(text):
    t = html.escape(text, quote=False)
    t = re.sub(r"!\[([^\]]*)\]\(((?:https?://|/)[^)\s]+)\)", r'<img src="\2" alt="\1" loading="lazy" />', t)
    t = re.sub(r"\[([^\]]+)\]\(((?:https?://|/)[^)\s]+)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    return t


def md_to_html(md):
    out, para, lst = [], [], None

    def flush():
        nonlocal para, lst
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
            para = []
        if lst:
            tag = lst[0]
            out.append(f"<{tag}>" + "".join(f"<li>{inline(i)}</li>" for i in lst[1]) + f"</{tag}>")
            lst = None

    fence = None
    for raw in md.splitlines():
        line = raw.rstrip()
        if line.startswith("```"):
            if fence is None:
                flush()
                fence = []
            else:
                out.append('<pre class="prompt"><code>' + html.escape("\n".join(fence).strip("\n"), quote=False) + "</code></pre>")
                fence = None
            continue
        if fence is not None:
            fence.append(raw.rstrip())
            continue
        m = re.match(r"^(#{2,4})\s+(.*)", line)
        if not line.strip():
            flush()
        elif line.startswith(">"):
            flush()
            out.append("<blockquote><p>" + inline(line.lstrip("> ").strip()) + "</p></blockquote>")
        elif m:
            flush()
            lvl = len(m.group(1))
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>")
        elif re.match(r"^\s*[-*]\s+", line):
            if para:
                flush()
            if not lst or lst[0] != "ul":
                flush()
                lst = ["ul", []]
            lst[1].append(re.sub(r"^\s*[-*]\s+", "", line))
        elif re.match(r"^\s*\d+[.)]\s+", line):
            if para:
                flush()
            if not lst or lst[0] != "ol":
                flush()
                lst = ["ol", []]
            lst[1].append(re.sub(r"^\s*\d+[.)]\s+", "", line))
        else:
            if lst:
                flush()
            para.append(line.strip())
    flush()
    return "\n".join(out)


# ---------- load issues ----------
def load():
    notes = []
    for f in sorted(SRC.glob("*.md")):
        if f.name.lower().startswith("readme"):
            continue
        text = f.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
        if not m:
            raise SystemExit(f"{f.name}: missing front matter")
        meta = {}
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        for k in ("title", "date", "description"):
            if not meta.get(k):
                raise SystemExit(f"{f.name}: front matter needs '{k}'")
        dt.date.fromisoformat(meta["date"])
        meta.setdefault("updated", meta["date"])
        dt.date.fromisoformat(meta["updated"])
        meta.setdefault("slug", re.sub(r"^\d{4}-\d{2}-\d{2}-", "", f.stem))
        meta["body"] = m.group(2).strip()
        rendered = meta["body"] if meta.get("format") == "html" else md_to_html(meta["body"])
        cm = re.search(r'<img[^>]*\ssrc="([^"]+)"', rendered)
        meta["cover"] = cm.group(1) if cm else None
        cam = re.search(r'<img[^>]*\salt="([^"]*)"', rendered) if cm else None
        meta["cover_alt"] = html.unescape(cam.group(1)) if cam else ""
        meta["words"] = len(re.findall(r"\w+", re.sub(r"<[^>]+>", " ", meta["body"])))
        notes.append(meta)
    notes.sort(key=lambda n: n["date"], reverse=True)
    return notes


def nice(d):
    x = dt.date.fromisoformat(d)
    return x.strftime("%B ") + str(x.day) + x.strftime(", %Y")


# ---------- page shell ----------
STYLE = """
  :root { --purple:#341f44; --blue:#256493; --orange:#fe7c2b; --gold:#ffc545; --cream:#fcf3d6; --ink:#1a1025; --muted:#6b5f78; --border:rgba(52,31,68,.12); }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Poppins',sans-serif; font-weight:300; color:var(--ink); background:var(--cream); line-height:1.75; }
  a { color:var(--blue); }
  html { scroll-padding-top:96px; }
  header { background:var(--purple); padding:18px 16px; position:sticky; top:0; z-index:100; box-shadow:0 2px 14px rgba(26,16,37,.25); }
  header .in, main, footer .in { max-width:820px; margin:0 auto; }
  header .in { display:flex; align-items:center; justify-content:space-between; gap:16px; }
  header img { height:40px; display:block; }
  header nav a { color:#fff; font-weight:500; text-decoration:none; font-size:15px; margin-left:18px; }
  header nav a.nav-cta { background:var(--orange); color:#fff; font-weight:600; padding:9px 18px; border-radius:100px; }
  header nav { display:flex; align-items:center; white-space:nowrap; }
  .hamburger { display:none; background:none; border:0; padding:8px; cursor:pointer; width:40px; height:40px; flex-direction:column; justify-content:center; gap:5px; }
  .hamburger span { display:block; height:2px; width:22px; background:#fff; border-radius:2px; transition:transform .2s, opacity .2s; }
  .hamburger[aria-expanded="true"] span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
  .hamburger[aria-expanded="true"] span:nth-child(2) { opacity:0; }
  .hamburger[aria-expanded="true"] span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }
  .site-menu { display:none; }
  @media (max-width:700px) {
    header img { height:30px; }
    header nav { display:none; }
    .hamburger { display:flex; }
    .site-menu:not([hidden]) { display:flex; flex-direction:column; gap:4px; max-width:820px; margin:14px auto 0; padding-top:10px; border-top:1px solid rgba(255,255,255,.15); }
    .site-menu a { color:#fff; font-weight:500; text-decoration:none; font-size:17px; padding:10px 4px; }
    .site-menu a.nav-cta { background:var(--orange); font-weight:600; padding:12px 18px; border-radius:100px; text-align:center; margin-top:8px; }
  }
  main { padding:56px 16px 72px; }
  .tag { font-size:11px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--orange); margin-bottom:12px; }
  h1 { font-size:clamp(30px,5vw,46px); font-weight:700; color:var(--purple); line-height:1.15; margin-bottom:16px; }
  .meta { color:var(--muted); font-size:14px; margin-bottom:36px; }
  .body h2 { font-size:24px; font-weight:600; color:var(--purple); line-height:1.3; margin:44px 0 14px; }
  .body h3 { font-size:19px; font-weight:600; color:var(--purple); margin:32px 0 10px; }
  .body p { margin-bottom:18px; font-size:17px; }
  .body img { display:block; max-width:100%; height:auto; border-radius:12px; margin:8px 0 18px; }
  .body blockquote p { margin:0; }
  .body blockquote { border-left:4px solid var(--orange); padding:4px 0 4px 18px; margin:0 0 18px; font-style:italic; color:var(--purple); }
  .body blockquote cite { display:block; font-style:normal; font-size:14px; color:var(--muted); margin-top:6px; }
  .body blockquote cite a { color:var(--muted); }
  .body ul.evidence { padding-left:0; }
  .body ul.evidence li { background:#fff; border:1px solid var(--border); border-left:5px solid var(--gold); border-radius:12px; padding:12px 16px; list-style:none; margin:0 0 10px; font-size:16px; }
  .body ul.evidence li a { color:var(--blue); }
  .body pre.prompt, .body pre { position:relative; background:#fff; border:1px solid var(--border); border-left:4px solid var(--purple); border-radius:12px; padding:18px 18px 18px 20px; margin:0 0 22px; white-space:pre-wrap; word-wrap:break-word; font-family:'Poppins',sans-serif; font-size:15px; line-height:1.65; color:var(--ink); }
  .body pre code { font-family:inherit; }
  .copy-prompt { position:absolute; top:10px; right:10px; font-family:'Poppins',sans-serif; font-size:12px; font-weight:600; color:var(--purple); background:var(--cream); border:1px solid var(--border); border-radius:100px; padding:5px 12px; cursor:pointer; }
  .copy-prompt:hover { border-color:var(--purple); }
  .body pre.has-copy { padding-top:48px; }
  .body ul, .body ol { padding-left:22px; margin-bottom:18px; }
  .box { background:var(--purple); color:rgba(255,255,255,.85); border-radius:20px; padding:28px; margin-top:48px; }
  .box h2 { color:#fff; font-size:22px; margin-bottom:8px; }
  .box a.cta { display:inline-block; margin-top:14px; background:var(--orange); color:#fff; font-weight:600; padding:12px 26px; border-radius:100px; text-decoration:none; }
  .box a.more { color:var(--gold); margin-left:14px; font-weight:500; }
  .list { list-style:none; padding:0; display:flex; flex-direction:column; gap:14px; }
  .list li { background:#fff; border:1px solid var(--border); border-radius:16px; padding:20px 22px; }
  .list a { color:var(--purple); font-weight:600; font-size:19px; text-decoration:none; }
  .list .d { color:var(--muted); font-size:13px; margin-top:2px; }
  .list p { margin-top:8px; }
  .cards { list-style:none; padding:0; display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:20px; }
  .card a { display:flex; flex-direction:column; height:100%; background:#fff; border:1px solid var(--border); border-radius:18px; overflow:hidden; text-decoration:none; color:var(--ink); transition:transform .18s, box-shadow .18s; }
  .card a:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(52,31,68,.12); }
  .card a:focus-visible { outline:3px solid var(--orange); outline-offset:3px; }
  .cover { display:block; width:100%; aspect-ratio:16/9; object-fit:cover; background:var(--purple); }
  .cover-none { background:var(--purple) url("/uploads/Growth_Den__Illustration_Denny.png") center / auto 62% no-repeat; }
  .card-text { display:flex; flex-direction:column; gap:4px; padding:18px 20px 22px; }
  .card-title { color:var(--purple); font-weight:600; font-size:19px; line-height:1.3; }
  .card .d { color:var(--muted); font-size:13px; }
  .card-desc { margin-top:6px; font-size:15px; line-height:1.6; }
  @media (prefers-reduced-motion: reduce) { .card a { transition:none; } .card a:hover { transform:none; } }
  h2.more-h { font-size:20px; color:var(--purple); font-weight:600; margin:48px 0 14px; }
  .meta a { color:var(--purple); font-weight:500; text-decoration:none; border-bottom:1px solid var(--gold); }
  .author { display:flex; gap:16px; align-items:flex-start; background:#fff; border:1px solid var(--border); border-radius:16px; padding:18px 20px; margin-top:40px; }
  .author img { width:72px; height:72px; border-radius:14px; object-fit:cover; flex-shrink:0; display:block; }
  .author p { margin:0; font-size:15px; }
  .author .author-name { font-weight:600; color:var(--purple); margin-bottom:4px; }
  .author .author-name a { color:var(--purple); text-decoration:none; }
  footer { background:var(--purple); color:rgba(255,255,255,.7); padding:28px 16px; font-size:14px; }
  footer a { color:#fff; }
  footer a.li { display:inline-block; vertical-align:-3px; margin-left:10px; color:#fff; opacity:.85; }
  footer a.li:hover { opacity:1; }
  footer a.li svg { width:16px; height:16px; fill:currentColor; display:block; }
"""


FALLBACK_IMAGE = "/uploads/og-default.png"


def absolute(src):
    return src if src.startswith("http") else SITE + src


def page(title, desc, url, ld, content, image=None):
    img_meta = ""
    if image:
        img_meta = f'<meta property="og:image" content="{absolute(image)}" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:image" content="{absolute(image)}" />\n'

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
<meta property="og:type" content="article" />
<meta property="og:site_name" content="The Growth Den" />
{img_meta}
<link rel="icon" href="/favicon.ico" />
<link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<script type="application/ld+json">
{json.dumps(ld, indent=1)}
</script>
<style>{STYLE}</style>
</head>
<body>
<header><div class="in"><a href="/"><img src="/uploads/Growth_Den__Logo_Horizontal_White.png" alt="The Growth Den" /></a><nav><a href="/#services">Services</a><a href="/#pricing">Pricing</a><a href="/notes/">Notes</a><a href="/logan/">About</a><a class="nav-cta" href="https://calendar.app.google/dy8683mNDXyWAkPo9" target="_blank">Let's Talk</a></nav><button class="hamburger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-menu"><span></span><span></span><span></span></button></div><div class="site-menu" id="site-menu" hidden><a href="/#services">Services</a><a href="/#pricing">Pricing</a><a href="/notes/">Notes</a><a href="/logan/">About</a><a class="nav-cta" href="https://calendar.app.google/dy8683mNDXyWAkPo9" target="_blank">Let's Talk</a></div></header>
<main>
{content}
</main>
<footer><div class="in">© {dt.date.today().year} The Growth Den LLC · Logan Ice, St. Louis, Missouri · <a href="mailto:logan@thegrowthden.com">logan@thegrowthden.com</a><a class="li" href="https://www.linkedin.com/in/loganice" target="_blank" rel="noopener" aria-label="Logan Ice on LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg></a></div></footer>
<script>
document.querySelectorAll(".body pre").forEach(function (pre) {{
  var b = document.createElement("button");
  b.type = "button"; b.className = "copy-prompt"; b.textContent = "Copy prompt";
  b.addEventListener("click", function () {{
    var t = pre.querySelector("code") ? pre.querySelector("code").innerText : pre.innerText;
    var done = function () {{ b.textContent = "Copied"; setTimeout(function () {{ b.textContent = "Copy prompt"; }}, 1800); }};
    if (navigator.clipboard) {{ navigator.clipboard.writeText(t).then(done, function () {{}}); }}
  }});
  pre.classList.add("has-copy"); pre.appendChild(b);
}});
</script>
<script>
(function(){{var b=document.querySelector('.hamburger'),m=document.getElementById('site-menu');if(!b||!m)return;b.addEventListener('click',function(){{var o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',o?'false':'true');b.setAttribute('aria-label',o?'Open menu':'Close menu');m.hidden=o;}});}})();
</script>
<script src="/assets/contact.js" defer></script>
</body>
</html>
"""


ORG = {"@type": "ProfessionalService", "@id": f"{SITE}/#org", "name": "The Growth Den", "url": f"{SITE}/",
       "logo": {"@type": "ImageObject", "url": f"{SITE}/uploads/Growth_Den__Logo_Horizontal_Primary.png"},
       "image": f"{SITE}/uploads/og-default.png",
       "description": "Fractional growth advisory and embedded marketing leadership for growth-stage DTC and e-commerce brands. Strategy and execution from one person, from $7,500 a month.",
       "foundingDate": "2025",
       "founder": {"@id": f"{SITE}/#logan"},
       "address": {"@type": "PostalAddress", "addressLocality": "St. Louis", "addressRegion": "Missouri", "addressCountry": "US"},
       "areaServed": {"@type": "Country", "name": "United States"},
       "email": "logan@thegrowthden.com",
       "priceRange": "From $7,500/month",
       "sameAs": ["https://www.linkedin.com/company/107193591/"]}

PERSON = {"@type": "Person", "@id": f"{SITE}/#logan", "name": "Logan Ice", "url": f"{SITE}/logan/",
          "mainEntityOfPage": f"{SITE}/logan/",
          "image": f"{SITE}/uploads/IMG_6671.JPG",
          "jobTitle": "Founder and Fractional Growth Advisor",
          "description": "St. Louis-based growth advisor for DTC and e-commerce brands. Led growth at Wuffes ($14M to $40M+), Little Passports, Varsity Tutors and P&G.",
          "worksFor": {"@id": f"{SITE}/#org"},
          "address": {"@type": "PostalAddress", "addressLocality": "St. Louis", "addressRegion": "Missouri", "addressCountry": "US"},
          "alumniOf": {"@type": "CollegeOrUniversity", "name": "Washington University in St. Louis"},
          "knowsAbout": ["Direct-to-consumer marketing", "E-commerce growth strategy", "Marketing efficiency ratio (MER)", "Paid social advertising", "Meta Ads", "AI-assisted ad creative", "Marketing team building"],
          "sameAs": ["https://www.linkedin.com/in/loganice/", "https://loganice.medium.com/",
                     "https://www.stlbucketlistshow.com/1932300/episodes/19809221-the-growth-den-the-real-difference-between-demand-generation-and-demand-capture",
                     "https://bestmarketingconference.com/agenda/program/detail/44/standing-out-in-a-sea-of-sameness"]}

AUTHOR = {"@id": f"{SITE}/#logan"}


def build_issue(n, notes):
    url = f"{SITE}/notes/{n['slug']}/"
    post = {"@type": "BlogPosting", "@id": url + "#post", "headline": n["title"],
            "description": n["description"], "datePublished": n["date"], "dateModified": n["updated"],
            "url": url, "mainEntityOfPage": url, "wordCount": n["words"], "author": AUTHOR,
            "publisher": {"@id": f"{SITE}/#org"},
            "isPartOf": {"@type": "Blog", "name": "Notes from the Den", "url": f"{SITE}/notes/"}}
    if n["cover"]:
        post["image"] = absolute(n["cover"])
    ld = {"@context": "https://schema.org", "@graph": [post, PERSON, ORG]}
    others = [o for o in notes if o["slug"] != n["slug"]][:3]
    more = ""
    if others:
        more = '<h2 class="more-h">More from Notes from the Den</h2><ul class="list">' + "".join(
            f'<li><a href="/notes/{o["slug"]}/">{html.escape(o["title"])}</a><div class="d">{nice(o["date"])}</div></li>'
            for o in others) + "</ul>"
    content = f"""  <div class="tag">Notes from the Den</div>
  <h1>{html.escape(n['title'])}</h1>
  <div class="meta">By <a href="/logan/" rel="author">Logan Ice</a> · Published <time datetime="{n['date']}">{nice(n['date'])}</time> · Last updated <time datetime="{n['updated']}">{nice(n['updated'])}</time></div>
  <article class="body">
{n['body'] if n.get('format') == 'html' else md_to_html(n['body'])}
  </article>
  <aside class="author" aria-label="About the author">
    <a href="/logan/"><img src="/uploads/logan-ice-160.webp" alt="Logan Ice" width="72" height="72" loading="lazy" /></a>
    <div>
      <p class="author-name"><a href="/logan/">Logan Ice</a> · Founder and Fractional Growth Advisor, The Growth Den</p>
      <p>Fractional growth advisor for DTC and e-commerce brands, based in St. Louis. Led growth at Wuffes ($14M to $40M+), ran Little Passports at BEGiN, and was on the Varsity Tutors growth team from Series A through C as it went from three cities to an international brand. Studied physics and psychology at WashU. <a href="/logan/">The longer version</a> · <a href="https://www.linkedin.com/in/loganice/" target="_blank" rel="noopener">LinkedIn</a></p>
    </div>
  </aside>
  <div class="box">
    <h2>Work with Logan</h2>
    <p>I'm a fractional growth advisor for growth-stage DTC and e-commerce brands. I handle strategy and take execution off your plate, in whatever seat you need, from $7,500 a month.</p>
    <a class="cta" href="{CAL}" target="_blank">Let's see if we're a fit</a><a class="more" href="/#services">See the services →</a>
  </div>
  {more}"""
    d = ROOT / "notes" / n["slug"]
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(page(n["title"], n["description"], url, ld, content, n["cover"] or FALLBACK_IMAGE), encoding="utf-8")


def build_index(notes):
    url = f"{SITE}/notes/"
    desc = "Notes from the Den is Logan Ice's newsletter on growth marketing, running a business with AI in the loop, and the occasional D&D tangent."
    answers = answer_pages()
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Blog", "@id": url + "#blog", "name": "Notes from the Den", "url": url,
         "description": desc, "author": AUTHOR, "publisher": {"@id": f"{SITE}/#org"},
         "blogPost": [{"@type": "BlogPosting", "headline": n["title"], "url": f"{SITE}/notes/{n['slug']}/",
                       "datePublished": n["date"]} for n in notes]},
        {"@type": "CollectionPage", "@id": url + "#answers", "name": "Straight answers", "url": url + "#straight-answers",
         "hasPart": [{"@type": "Article", "headline": a["h1"], "url": f"{SITE}/{a['slug']}/"} for a in answers]},
        PERSON, ORG]}
    def cover(n):
        if n["cover"]:
            return f'<img class="cover" src="{n["cover"]}" alt="{html.escape(n["cover_alt"])}" loading="lazy" />'
        return '<div class="cover cover-none" aria-hidden="true"></div>'
    items = "".join(
        f'<li class="card"><a href="/notes/{n["slug"]}/">{cover(n)}<div class="card-text"><span class="card-title">{html.escape(n["title"])}</span>'
        f'<span class="d">{nice(n["date"])}</span><span class="card-desc">{html.escape(n["description"])}</span></div></a></li>'
        for n in notes)
    answers_html = "".join(
        f'<li><a href="/{a["slug"]}/">{html.escape(a["h1"])}</a><p>{html.escape(a["description"])}</p></li>' for a in answers)
    content = f"""  <div class="tag">The newsletter</div>
  <h1>Notes from the Den</h1>
  <div class="meta">{html.escape(desc)} Last updated <time datetime="{max(n['updated'] for n in notes)}">{nice(max(n['updated'] for n in notes))}</time>.</div>
  <ul class="cards">{items}</ul>
  <h2 class="more-h" id="straight-answers">Straight answers</h2>
  <p class="meta">Plain answers to the questions DTC founders and marketing leaders ask before hiring a fractional growth lead: how it compares to an agency, when to hire, how to judge one, and how to measure the work.</p>
  <ul class="list">{answers_html}</ul>"""
    (ROOT / "notes").mkdir(exist_ok=True)
    (ROOT / "notes" / "index.html").write_text(page("Notes from the Den", desc, url, ld, content, next((n["cover"] for n in notes if n["cover"]), FALLBACK_IMAGE)), encoding="utf-8")


def replace_block(text, name, new):
    pat = re.compile(rf"(<!-- {name}:START -->).*?(<!-- {name}:END -->)", re.S)
    if not pat.search(text):
        raise SystemExit(f"marker {name} not found")
    return pat.sub(lambda m: m.group(1) + new + m.group(2), text)


def latest_list(notes, cls):
    return "".join(
        f'<li><a href="/notes/{n["slug"]}/">{html.escape(n["title"])}</a> <span class="{cls}">{nice(n["date"])}</span></li>'
        for n in notes[:3])


def update_pages(notes):
    latest = max(n["updated"] for n in notes)
    home = ROOT / "index.html"
    t = home.read_text(encoding="utf-8")
    t = replace_block(t, "NOTES", latest_list(notes, "notes-date"))
    home.write_text(t, encoding="utf-8")
    # Service pages are built by build_answers.py (they read the notes list themselves).


def answer_pages():
    """Straight-answer page metadata (built by build_answers.py), for the /notes/ index."""
    try:
        from build_answers import ANSWER_PAGES, load as load_answer
    except ImportError:
        return []
    out = []
    for slug in ANSWER_PAGES:
        try:
            out.append(load_answer(slug))
        except SystemExit:
            continue
    return out


def answer_urls():
    """Straight-answer pages (built by build_answers.py) for the sitemap."""
    try:
        from build_answers import ANSWER_PAGES, load as load_answer
    except ImportError:
        return []
    out = []
    for slug in ANSWER_PAGES:
        try:
            out.append((f"{slug}/", load_answer(slug)["updated"], "0.8"))
        except SystemExit:
            continue
    return out


def service_urls():
    try:
        from build_answers import SERVICE_PAGES as SP, load as load_answer
        return [(f"{s}/", load_answer(s)["updated"], "0.8") for s in SP]
    except (ImportError, SystemExit):
        return [(f"{s}/", "2026-10-01", "0.8") for s in SEAT_PAGES]


def build_sitemap(notes):
    latest = max(n["updated"] for n in notes)
    urls = [("", latest, "1.0")] + [("logan/", "2026-10-06", "0.8")] + service_urls() + \
           answer_urls() + \
           [("notes/", latest, "0.7")] + [(f"notes/{n['slug']}/", n["updated"], "0.6") for n in notes]
    x = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u, d, pr in urls:
        x += f"  <url>\n    <loc>{SITE}/{u}</loc>\n    <lastmod>{d}</lastmod>\n    <priority>{pr}</priority>\n  </url>\n"
    (ROOT / "sitemap.xml").write_text(x + "</urlset>\n", encoding="utf-8")


def build_llms(notes):
    p = ROOT / "llms.txt"
    t = p.read_text(encoding="utf-8")
    t = t.split("\n## Notes from the Den")[0].rstrip() + "\n\n## Notes from the Den\n"
    t += "".join(f"- [{n['title']}]({SITE}/notes/{n['slug']}/) ({n['date']}): {n['description']}\n" for n in notes)
    p.write_text(t, encoding="utf-8")


def main():
    notes = load()
    if not notes:
        raise SystemExit("no issues in notes/_src")
    for n in notes:
        build_issue(n, notes)
    build_index(notes)
    update_pages(notes)
    build_sitemap(notes)
    build_llms(notes)
    print(f"built {len(notes)} issue(s); latest {notes[0]['slug']} ({notes[0]['date']})")


if __name__ == "__main__":
    main()
