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
