#!/usr/bin/env python3
"""Turn a note saved in the Notes editor artifact into a site source file.

    python3 scripts/import_editor_note.py path/to/note.json [images_dir]

note.json is the editor's saved file. images_dir holds the note's images,
each saved under its asset id (e.g. 3f2a...e1.png) as downloaded from the
artifact. Images are copied to uploads/notes/<slug>/ and the body's image
links rewritten to point there. Writes notes/_src/<date>-<slug>.md with
format: html, then run scripts/build_notes.py.
"""
import html
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def slugify(t):
    s = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)[:60].strip("-") or "note"


def main():
    note = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    imgdir = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else None
    for k in ("title", "date", "description", "bodyHtml"):
        if not (note.get(k) or "").strip():
            raise SystemExit(f"note is missing {k}")
    slug = note.get("slug") or slugify(note["title"])
    body = note["bodyHtml"]
    out_dir = ROOT / "uploads" / "notes" / slug

    def swap(m):
        src = m.group(1)
        mid = re.search(r"([0-9a-f]{32})", src)
        if not (mid and imgdir):
            raise SystemExit(f"image {src} has no downloaded file")
        found = sorted(imgdir.glob(mid.group(1) + ".*"))
        if not found:
            raise SystemExit(f"image {mid.group(1)} not found in {imgdir}")
        out_dir.mkdir(parents=True, exist_ok=True)
        dest = out_dir / found[0].name
        shutil.copyfile(found[0], dest)
        return f'src="/uploads/notes/{slug}/{dest.name}"'

    body = re.sub(r'src="([^"]+)"', swap, body)
    body = body.replace("<img ", '<img loading="lazy" ')
    fm = ["---", f"title: {note['title']}", f"date: {note['date']}", f"slug: {slug}",
          f"description: {' '.join(note['description'].split())}", "format: html"]
    if note.get("linkedin"):
        fm.append(f"source: {note['linkedin']}")
    fm.append("---")
    path = ROOT / "notes" / "_src" / f"{note['date']}-{slug}.md"
    path.write_text("\n".join(fm) + "\n\n" + body.strip() + "\n", encoding="utf-8")
    print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
