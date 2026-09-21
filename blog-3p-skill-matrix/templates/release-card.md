# Human release card — {{ARTICLE_ID}}

## Source package

- Canonical routing record: `article-package.json`
- Derived-artifact index: `handoff/handoff-manifest.json`
- Final audit surfaces: `handoff/visual-payload.html` and `handoff/visual-payload.md`

Use the manifest paths and hashes to resolve a disagreement; do not manually restate or alter title, metadata, links, Alt text, captions, CTA, or evidence in this card.

## Manual transfer

1. Open `visual-payload.html` in a browser. Use `visual-payload.md` only as the matching readable fallback and traceability copy; it must carry the same title, body, image cards and SEO fields.
2. Select the visible blog title and paste it into the platform title field.
3. Select the body below it and paste it into the rich-text editor. Each Chinese image annotation sits at that image's exact in-body insertion point; do not move it to another section.
4. Insert the exact local PNG/JPG file named on that card (for example `01-lead-…`, `02-middle-…`, `03-closing-…`). Do not substitute WebP, GIF, SVG, another numbered file or a different visual.
5. Enter the visible Alt text and caption from each annotation into the matching native image fields.
6. Enter the SEO title, tags and description shown below the body into matching native fields when the platform provides them.

The published content must preserve every applicable `LEAD`/`MIDDLE`/`CLOSING` image placement from the single visual manifest. Do not replace the approved visual, alter its localized Alt/caption, or add a different CTA while transferring it.

## Title/body transfer

- Mode: `{{TITLE_TRANSFER_MODE}}`
- The local payload markup is an authoring/copy aid, not platform HTML evidence.

## Human acceptance

- [ ] From the rendered public reader page only: the page title, section headings and subsection headings are visibly distinct, ordered and not visibly duplicated or flattened.
- [ ] No editor HTML/DOM was inspected or edited to force a heading structure.
- [ ] Links are real links and point to the listed hrefs.
- [ ] Every exact-position image annotation has its named PNG/JPG file inserted at the same location, and its localized Alt and caption have been entered into the matching native image fields. The CTA's exact visible anchor text, listed href and applicable visible disclosure are present; do not add a different CTA or promotional copy beyond the approved package.
- [ ] The `handoff/handoff-manifest.json` hashes bind the approved canonical article, metadata, evidence pack, visual manifest, **HTML and Markdown visual payloads**, requirements traceability and review index. For a WQ package, `AUTHOR_QA_READY` covers the completed payload pair and any later reader-visible repair must rerun WQ or escalate to WR. For a WR package, independent `FULL_REVIEW` covers the pair; a bounded same-R delta may review a documented repair and its direct dependencies. G later checks the route-truthful batch credential only; it does not add a per-article editorial review.
- [ ] Copy `templates/public-return-receipt.json` to `handoff/public-return-receipt.json`, then record the public URL, exact `HUMAN_ACCEPTED` or `HUMAN_NEEDS_FIX` state, return time, revision/timestamp or `UNVERIFIED`, rendered-page evidence paths and any known scoped limitation.
- [ ] With `HUMAN_ACCEPTED`, validate the receipt and let the registered campaign G include it in the next bounded, read-only public-QA batch. It does not restart W/R. `HUMAN_NEEDS_FIX` stays a human platform-side repair state; after repair, return a new receipt for the same G batch recheck.
