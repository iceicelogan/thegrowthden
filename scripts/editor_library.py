#!/usr/bin/env python3
"""Export every live note as library.json for the Notes editor's "Open a note" menu.

    python3 scripts/editor_library.py > library.json

Then publish library.json into the Notes editor artifact as a file.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build_notes as b  # noqa: E402


def main():
    out = []
    for n in b.load():
        body = n["body"] if n.get("format") == "html" else b.md_to_html(n["body"])
        # images that came from the editor keep their asset id as the file name,
        # so point them back at the editor's stored copy (the editor can't load
        # images from the live site)
        body = re.sub(r'src="/uploads/notes/[^/"]+/([0-9a-f]{32})\.[a-z]+"', r'src="/_blob/\1"', body)
        body = body.replace(' loading="lazy"', "")
        out.append({"slug": n["slug"], "title": n["title"], "date": n["date"],
                    "description": n["description"], "linkedin": n.get("source", ""),
                    "bodyHtml": body})
    json.dump(out, sys.stdout, indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
