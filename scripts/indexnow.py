#!/usr/bin/env python3
"""Tell Bing (and other IndexNow engines) that pages changed.

    python3 scripts/indexnow.py            # every URL in sitemap.xml
    python3 scripts/indexnow.py /mer-target/ /fractional-head-of-growth/

Run it after a change is merged and live: the key file /f80e91ab7097faa7441fe86b63bf1d4d.txt must already be
served from thegrowthden.com, or the engines reject the ping. Bing's index feeds
ChatGPT search and Copilot. One submission per change is plenty; don't loop it.
"""
import json
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOST = "thegrowthden.com"
KEY = "f80e91ab7097faa7441fe86b63bf1d4d"


def main():
    if len(sys.argv) > 1:
        urls = [f"https://{HOST}" + (a if a.startswith("/") else "/" + a) for a in sys.argv[1:]]
    else:
        urls = re.findall(r"<loc>([^<]+)</loc>", (ROOT / "sitemap.xml").read_text(encoding="utf-8"))
    body = json.dumps({"host": HOST, "key": KEY, "keyLocation": f"https://{HOST}/{KEY}.txt", "urlList": urls}).encode()
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body,
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(req, timeout=30) as r:
        print(r.status, f"submitted {len(urls)} URL(s)")


if __name__ == "__main__":
    main()
