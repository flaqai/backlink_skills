# Legacy per-article public QA report — {{ARTICLE_ID}}

> Only use this template for schema-2.3 through schema-2.6 workspaces. Schema-2.7+ uses `public-qa-batch-report.json`, with one independently hash-bound entry per returned article.

- Existing lane G agent ID: `{{ARTICLE_LANE_GATEKEEPER_ID}}`
- Public URL: `{{PUBLIC_URL}}`
- Human return receipt: `{{RETURN_RECEIPT_PATH}}`
- Normalized public snapshot: `{{PUBLIC_SNAPSHOT_PATH}}`
- Attempt: `{{ATTEMPT}}`
- Scope: only the accepted canonical/payload's reader-visible contract; not a fresh SEO or prose review.

## Result

Select exactly one:

- Selected result: `{{PUBLIC_QA_RESULT}}`
- Owner request ID: `{{OWNER_REQUEST_ID_OR_NOT_APPLICABLE}}`

- [ ] `PUBLIC_QA_PASSED`
- [ ] `PUBLIC_QA_PASSED_WITH_LIMITATION`
- [ ] `HUMAN_TRANSPORT_FIX_REQUIRED`
- [ ] `PUBLIC_QA_UNVERIFIED`
- [ ] `CANONICAL_CHANGE_REQUESTED` — requires `{{OWNER_REQUEST_ID}}`; only this result may reopen W → R → G.

## Bounded reader-page comparison

| Contract item | Expected / frozen source | Public observation / snapshot key | Result |
| --- | --- | --- | --- |
| Page title | `article-package.json` | `observed_transport.document_title` | |
| Reader-visible body | canonical fingerprint | public text fingerprint / targeted evidence | |
| Links and required CTA | package CTA anchor, href, disclosure | `observed_transport.links.required_cta` | |
| Images, observable Alt/caption | image manifest | `observed_transport.images` | |
| Visual title / section / subsection hierarchy | canonical structure intent | rendered screenshot only | |

## Visual evidence boundary

State whether the rendered public page visibly distinguishes and orders its page title, sections and subsections. Do not infer this from editor HTML/DOM, public source, Feed markup or local payload markup. Missing/inconclusive rendered evidence is `PUBLIC_QA_UNVERIFIED`.

## Limitation or transport repair

For a platform limitation, retain its full platform/account-or-site/editor-or-theme/locale/date/evidence scope and `not_generalizable: true`. `PUBLIC_QA_PASSED_WITH_LIMITATION` is allowed only when every reader-visible contract item still passes. For a transport defect, provide one consolidated human repair checklist; the publisher repairs it on the platform, then this same lane G rechecks. Do not invoke W or R.
