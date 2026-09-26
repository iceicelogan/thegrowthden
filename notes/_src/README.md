# Notes from the Den — source files

One Markdown file per newsletter issue, named `YYYY-MM-DD-slug.md`, with front matter:

```
---
title: The issue title
date: 2026-09-15
slug: optional-custom-slug
description: One or two plain sentences about the issue.
---
```

Then run `python3 scripts/build_notes.py`. It rebuilds every issue page, /notes/, the latest-notes blocks on the homepage and seat pages, sitemap.xml and llms.txt.

## From the Notes editor

New issues are written in Logan's Notes editor (a private Claude artifact) and marked "Ready for the site" there. To publish one: read the artifact's `note.json` and any images it uses (each `/_blob/<id>` asset, saved as `<id>.<ext>`), then run

```
python3 scripts/import_editor_note.py note.json <images_dir>
python3 scripts/build_notes.py
```

and open a pull request. Source files with `format: html` keep the editor's HTML body as-is.

When the editor note has a `slug` it's an edit to a live page: the import replaces that note's existing source file. After any publish, refresh the editor's "Open a note" menu with `python3 scripts/editor_library.py > library.json` and publish that file into the editor artifact.
