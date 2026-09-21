# Blog 3P Skill Matrix

[简体中文](README.zh-CN.md) · Version 0.13.0 · [MIT](LICENSE)

An open-source Skill suite for high-quality, auditable blog production. It turns article work into a recoverable local workflow: establish a campaign and its scope, perform evidence-backed writing, run either integrated author QA or a risk-escalated independent review, compile a visual rich-text package, then complete final contract gating and a human hand-off. It automates content-quality work, not platform publishing.

## At a glance

| This matrix does | This matrix deliberately does not do |
| --- | --- |
| Preserves owner scope, research evidence, a canonical article, route-truthful WQ/WR quality evidence, requirements acceptance, and a copy-ready rich-text hand-off. | Log in, operate a platform editor, upload media, call publishing APIs, publish, delete, roll back, schedule, or alter browser fingerprints. |

Use it only for human-native release handoffs: a human, rather than an automation, owns every platform action. It works with Python 3.9+ and the local filesystem; web, Trends, SERP, and public-page checks are optional read-only evidence capabilities within that one workflow, not alternative execution modes.

## Why this exists

Typical “write an SEO post” flows mix research, drafting, review, platform adaptation, and publication in one conversation. Sources disappear, review becomes self-review, editor experimentation consumes delivery capacity, and the reader page can drift from the local draft.

This project separates those concerns into explicit Skills while keeping one canonical article and a traceable record of reader-visible changes. A visible platform-matching researcher evaluates only owner-supplied candidates before the owner locks a mapping; a harness preserves scope and state; one executable Writer integrates research with drafting and normally performs a documented adversarial author-QA pass; an independent Reviewer is reserved for risk or owner-requested escalation; and a Gatekeeper confirms that the final delivery still honors the owner's frozen task contract. `blog-writer-merged` is an editorial-core reference, not a second Writer workflow. A human uses the platform’s native editor for the final release.

## Operating model

- **G earns the right to dispatch.** Before any article path or quality role exists, the persistent visible controller gathers and reports a complete per-article pre-write research and writing plan, including its frozen WQ or WR route. The current `HUMAN_RELEASE_ONLY_V1` profile binds `OWNER_PREWRITE_PLAN_CONFIRMED` only through a hash-bound owner receipt artifact and local confirmation command. Before dispatch, it also requires every article's owner-confirmed one-to-one platform/account and locale-compatibility mapping. G then records only confirmed owner requirements in `requirements-contract.md`, maintains campaign state and priority, and accepts final contract fidelity. It never becomes an invisible CLI review session.
- **WQ is normal; WR is escalation.** `blog-3p-writer` is the only active Writer role. For ordinary articles it completes research, drafting, visuals, payload and `CANDIDATE_LOCK → ADVERSARIAL_SELF_QA → TARGETED_REPAIR → FINAL_BIND`, producing `AUTHOR_QA_READY`—never an independent approval. Risky or owner-requested articles use `INDEPENDENT_R_ESCALATION`, where a separately registered R completes `FULL_REVIEW`. WQ may escalate one way to WR with stable trigger IDs; it cannot silently downgrade.
- **Path isolation is the default.** `CONTINUOUS_CAMPAIGN_MAIN_SESSION` with `MAIN_SESSION_PATH_ISOLATED` keeps ordinary work in deterministic disjoint article roots. A visible child task is not automatically a Git worktree.
- **Git worktrees are recorded exceptions.** G may create `GIT_WORKTREE` only for `TRUE_CONCURRENT_WRITE`, `HIGH_RISK_REWRITE_OR_ROLLBACK`, or `OWNER_REQUESTED_GIT_ISOLATION`; capacity, a busy main session, and token saving are not reasons. One registered campaign G remains the global requirements, queue, and state controller; it batch-processes compact ready rows instead of spending a G turn per article.
- **Quality and owner intent are distinct checks.** WQ or WR decides whether the article is good according to its frozen route. G accepts the truthful route credential and checks whether any confirmed owner requirement was lost, substituted, weakened, or expanded; G does not redo prose or SEO review.
- **Ordinary turns use a compact evidence index.** At dispatch, campaign G/harness creates an immutable hash-bound article contract. W owns a WQ index/receipt; WR uses the same index for independent findings and deltas. WQ repairs rerun author QA; only WR permits R-Δ. After context compression, roles first reread the [workflow core](docs/workflow-core.md), then the contract, index, and changed artifacts. A full historic reread is necessary only for hash drift, unresolved finding lineage, agent replacement, or escalation; scope conflict is an escalation condition.
- **Reader value comes first; CTA is required but secondary.** Each article has a frozen reader-value promise and must remain useful without relying on its CTA. The owner-required CTA preserves its exact visible anchor text, identifiable product, current destination, claim basis, reader-task relevance, and any applicable relationship disclosure. R judges meaning and commercial balance; G checks declaration-to-delivery fidelity.
- **Images carry a narrative, not a quota.** For substantive guides, tutorials, comparisons, reviews, and long explainers, W plans at least three original information-bearing visuals across `LEAD`, `MIDDLE`, and `CLOSING`. R opens every asset and tests its adjacent claim, legibility, distinct reader job, and non-redundancy; a hero, filename, dimensions, or alt text alone cannot pass.
- **Research stays inside one capable W turn, not a duplicated gate.** After the owner confirms G's directional plan, W continuously establishes long-tail intent, regional-SERP wording and claim evidence, then drafts, creates visuals and compiles the package. Default WQ challenges that whole chain in the same working context. WR independently evaluates it when escalation is warranted; a separate early research challenge exists only within a recorded WR risk route.
- **Models judge; tooling proves only integrity.** W and R decide usefulness, evidence strength, language, SEO and visual fit from the whole article. The default stores one evidence pack and reports only real findings or exceptions—never all-green check tables or duplicate research summaries. Deterministic tools run after creation to catch identity, scope, hash, required-CTA and package-shape drift; they do not score prose by length, keyword count or optional external data.
- **Platform samples are advisory and on demand, not borrowed templates.** The reusable operations steward checks an in-scope public sample only when a reusable profile is absent and a material reader-visible transport risk is known. A shortage is `UNVERIFIED`, uses a conservative generic structure, and never blocks research or drafting.
- **Public QA reuses campaign G in batches.** After humans record URLs, exact `HUMAN_ACCEPTED`/`HUMAN_NEEDS_FIX` states and known limits in structured return receipts, the same registered `CAMPAIGN_GATEKEEPER` receives the currently ready read-only snapshots in one batch. It retains a separate evidence-bound result for every article, does not restart W/R, create a fresh public gate, or redo article SEO/prose review.
- **Heading hierarchy is visual-public only.** Canonical and payload tags help authoring and copy selection, but never prove platform transport. A human does not edit editor HTML/DOM; after `HUMAN_ACCEPTED`, campaign G accepts title, section and subsection hierarchy only from the article's rendered public reader-page evidence. The snapshot can record a visual-evidence path, but cannot infer a hierarchy verdict.
- **Platform matching is delegated, selection is confirmed.** Every current campaign needs a human-release map before W/R dispatch. Until it exists, one visible reusable `CAMPAIGN_PLATFORM_MATCHING_RESEARCHER` may evaluate only owner-supplied candidates against frozen language, market and format needs. G does not rank or choose; it preserves the report and obtains the owner's exact platform/account confirmation.
- **CLI stays mechanical.** It may run deterministic local checks and compilers, but cannot substitute for a reviewer or manufacture evidence.

## Architecture

```text
Owner task and source-bounded candidates
        │
        ▼
G pre-write dossier (one plan per article)
        │
        ▼
OWNER_PREWRITE_PLAN_CONFIRMED + receipt/hash binding
        │
        ▼
Campaign main session / isolated `articles/<article_id>/` path
        ├─ WQ default ─► reusable W: research → draft → visuals → payload → author QA
        │                                                            │
        │                                                            ├─ AUTHOR_QA_READY ───┐
        └─ WR risk/owner route ─► reusable W → independent R FULL_REVIEW ┤
                                                                     ▼
                            one campaign G BATCH_GATE_ACCEPTANCE for current quality-ready rows
                                                                     │
                                       PASS = HUMAN_RELEASE_READY
                                                                     │
                                                                     ▼
                                          Visual rich-text human hand-off
                                                                     │
                                                                     ▼
       Human native publish → return receipts + read-only snapshots → campaign G batch public QA
```

`PASS` never means that a machine published the post. It means that the local editorial artifact is ready for a human to use. Completion is separate: humans save URL/state return receipts, then for `HUMAN_ACCEPTED` the registered campaign G performs a bounded batch reader-page contract check using each article's normalized snapshot plus rendered visual evidence. W/R do not run again for a public mismatch: a transport repair returns to the human and the same G's next batch; only an explicit owner-requested canonical or payload correction reopens that article's W/R.

For `N_WQ` ordinary WQ articles and `N_WR` independently reviewed articles, the baseline is `N_WQ + 2N_WR + E + 2 + B` model turns: one pre-write G, one continuous WQ turn per WQ article, W plus independent R per WR article, `E` genuinely required WR early-research challenges, one batch acceptance G, and `B` URL-return public-QA batches. `B` is the number of owner return cohorts, not the number of articles. This is a stage-count model, not a token-cost promise.

The pre-write dossier is not a shortcut around research. It gives the owner a concise per-article direction, reader-value/CTA boundary and quality route before costly article work begins. After approval, W performs the full source, long-tail and localization research in its continuous creation turn. WQ then self-challenges it in the same context; WR independently reviews it when the frozen route or a documented one-way escalation requires that safeguard. `RESEARCH_APPROVED` is required only for an explicitly elevated WR route.

## Skill matrix

| Skill | Responsibility | Main outputs |
| --- | --- | --- |
| `blog-3p-harness` | Initializes an isolated campaign, records the owner-confirmed pre-write plan, locks scope, resumes safely, and runs structural checks. | `campaign.json`, `state.json`, `prewrite-plan.md/json`, confirmation, checklist |
| `blog-3p-platform-matching` | Visible reusable subagent that researches language/market/format fit within the owner candidate source and recommends one platform per article. | Matching report and pending-owner-confirmation proposal |
| `blog-writer-merged` | Editorial-core reference for evidence, localization, reader value, images, and title quality. It is never a second W lane. | Reusable editorial standards and references |
| `blog-3p-writer` | The sole article-scoped Writer (W): research, draft, repair, payload compilation and default WQ adversarial self-QA. | Article package, fingerprint, author-QA receipt, resolution record |
| `blog-3p-review` | Article-scoped, reusable independent Reviewer (R), invoked only for frozen or escalated WR routes. | `reviews/review-N.md`, WR findings / bounded WR delta |
| `blog-3p-gate` | Persistent campaign Gatekeeper (G) collects and reports the pre-write plan, waits for owner confirmation, then manages scope, queue, owner-contract traceability, compact batch decisions, and batch post-publication checks. | plan binding, `requirements-contract.md`, batch gate rows, batch public-QA rows |
| `blog-3p-human-handoff` | Uses the route-truthfully quality-ready paired payload to create/verify the derived hand-off index and captures bounded return evidence after human release. | quality-bound `handoff/visual-payload.html` + `handoff/visual-payload.md`, return receipt, release card, public snapshot |

The matrix is deliberately modular inside one release boundary: local creation, optional read-only evidence, WQ/WR quality routing, visual payload compilation, human-native release, and read-only public QA each remain separable. Every new current-schema campaign still ends in a human-release handoff; local-only work and connected evidence are not alternative execution profiles.

## Core guarantees

### One canonical article, route-truthful judgment

W writes. In default WQ it also performs a recorded adversarial author QA; in WR an independent R reviews without editing and owns the independent quality decision, including SEO. G owns state and accepts only whether the frozen user contract survived into final delivery; it does not duplicate quality review. Owner requirements use `REQ-*` IDs, while G-only gaps use `REQUIREMENT-*` and quality findings retain IDs such as `SEO-LOCALIZATION-001`.

Every reader-visible change to the canonical article or visual payload updates the canonical fingerprint and takes the applicable WQ or WR/G path again. A reader-page mismatch by itself stays with campaign G's public-QA batch and does not reopen WQ/WR.

### Compact, hash-bound article context

At dispatch, campaign G/harness writes `articles/<article_id>/context/article-contract.json`: a projection of the confirmed article scope, applicable `REQ-*`, reader-value/CTA declaration, language/market, applicable release mapping, and source hashes. It deliberately excludes live findings. The active quality route maintains that article's `reviews/review-index.json`: W writes `latest_author_qa` for WQ; R writes independent-review records for WR. Stable campaign evidence may be reused only through exact `campaign_shared_evidence` record IDs plus the article's `article_delta`; a cache miss creates neither an empty cache nor a fake reference. These records reduce repeated context loading; they cannot alter scope or override source evidence.

For a WQ repair, W reruns author QA and refreshes its hash-bound receipt; WQ never uses `R-Δ`. For WR, W adds `reviews/review-delta-N.json` with the approved independent baseline hashes, exact changed paths and affected claims/requirements/findings. R-Δ reads that capsule, changed artifacts and direct dependencies rather than mechanically re-reading unrelated sections. The current package declares its only permitted sources: `canonical/article.html`, metadata, the evidence pack, and the visual manifest. W compiles both final visual payloads from those hash-bound inputs before final WQ or WR quality binding. Markdown is a mechanically verified readable fallback and becomes a second semantic read only when the checker emits `COMPANION_DUAL_READ_REQUIRED`. Derived hand-off finalization may only repeat byte-identical renders of both payloads and create its manifest; it fails before overwriting either changed payload. Full historical reread is necessary only for hash drift, unresolved or ambiguous lineage, agent replacement, scope conflict or explicit escalation.

### Reader value first; transparent recommendations second

The primary outcome is a high-quality, evidence-bounded answer to the reader's task. Every new schema-`2.2+` article freezes a `reader_value_promise`; the article must still be coherent and useful if its CTA is removed. `cta.mode = NONE` is not valid in a new schema-2.2 campaign.

Every schema-2.2+ article uses `cta.mode = SECONDARY_RECOMMENDATION`. In the current schema-2.14 workflow, `articles/<article_id>/article-package.json` is schema `1.5`: it retains the exact visible anchor text, product identity, current destination URL, claim-evidence path, reader-task relevance, and relationship disclosure or `NOT_APPLICABLE`, then points one way to hash-bound `canonical/article.html`, metadata, evidence pack and visual manifest. Metadata is the only source for platform title and SEO fields; the package cannot duplicate title, SEO, links, images or a hand-off pointer. These fields trace a recommendation; they do not license unsupported claims that a product is independently reliable, best, tested, available or suitable for every reader. WQ or WR—not a count, word-ratio, placement or density check—judges whether the article remains reader-led, balanced and truthful. G only confirms that the frozen declaration survived the final package. Historical schema-2.13 and older package contracts remain readable and checkable, but cannot replace the current single-source path. This reduces avoidable moderation/deletion risk; it never guarantees that a platform will retain a public page.

### Owner-confirmed pre-write plan

Before the matrix creates an article path or starts WQ/WR work, G maintains one canonical schema-`1.8` `prewrite-plan.json` for every configured article. Each compact card states the task/audience, independent reader value and required secondary CTA, a model-led editorial brief, risks and owner decisions, a frozen delivery mapping, a frozen `topic_slot`, an evidence posture, and a WQ/WR `review_effort`. The topic slot fixes the reader task, core intent, market, differentiating angle and prohibited deviations, not the literal keyword or final title. The delivery mapping exposes article language, market, platform, account and audience-fit mode; the posture distinguishes a method template from a documented empirical record. The editorial brief brings together the proposed keyword/localization route, evidence boundary, likely title/outline, visual approach and any known hand-off risk without copying the same fact into many files. G runs `harnessctl.py sync-prewrite-plan` to render the human-readable `prewrite-plan.md`. That Markdown file is deterministic and read-only: never hand-edit both files or use it as a second source of scope truth.

`OWNER_PREWRITE_PLAN_CONFIRMED` is a hard dispatch gate. In schema 2.14, `confirm-prewrite-plan` requires an owner-originated receipt file under `evidence/owner-confirmations/`, its hash, a source locator, and a timezone-aware timestamp; a self-typed status or ID cannot promote a plan. Its ID, article set, report hash, manifest hash, protected scope snapshot and receipt must agree in the state, owner confirmation, requirements contract, and scope lock. The protected snapshot includes language, market, platform, account, fit mode, cross-language exception, topic slot and evidence posture. A change to any of these requires explicit invalidation and renewed owner confirmation; synchronization cannot overwrite the old receipt. The current profile also requires an owner-confirmed distinct platform/account assignment and compatible audience/transport row for every article before WQ/WR dispatch. Until the required bindings are valid, G cannot create an article path, W, a WR-only R, article queue, or article agent. This gives the owner a correction point before parallel work consumes time or tokens without turning G's proposal into a substitute for WQ/WR research.

### Visual narrative coverage

The campaign freezes a `visual_narrative_policy` alongside SEO and scope. The standard policy requires `LEAD`, `MIDDLE`, and `CLOSING` coverage with a minimum of three images for applicable article types. Each manifest entry links an asset to a section anchor, adjacent claim, reader job, rights/source, prompt or brief, localized alt text, caption, and pixel review.

For a uniform no-exception batch, set `all_articles_required: true` before dispatch. This makes the three-image, three-zone rule a hard requirement for every article in that campaign. A policy exception is otherwise owner-confirmed and visible to R; it is never inferred from a missing image. The human hand-off cards show the zone and reader job so a publisher can preserve the intended placement.

### Cross-language SEO without fabricated local evidence

For a frozen multilingual target, wording is selected in this strict order:

```text
CURRENT_BRAND_SITE → REGIONAL_SERP → MODEL_TRANSLATION_FALLBACK
```

- **Current brand site:** a current public brand page for the same locale and reader intent is the highest-priority wording source. This keeps the blog aligned with brand language and its semantic matrix.
- **Regional SERP:** target-region search results establish reader intent and naturally used semantic variants. When usable, Google Trends compares English seeds/candidates only as global relative-interest context and records the English-concept-to-regional-SERP map. Its normalized index is never presented as search volume, low-base/high-momentum proof, local demand, popularity, commercial intent, or model capability.
- **Model translation fallback:** allowed only after two independent regional-SERP checks document that no usable consensus variant exists. The proposed wording, failed checks, rationale, and cultural/legal risk are recorded. It is never labeled as SERP-proven.

A brand-site expression is not copied blindly: it must be rejected with evidence if it is stale, misleading, unnatural, or incompatible with the article’s intent. Regional SERPs are for understanding local intent and phrasing, never for copying competitor text.

### Integrated long-tail research

The matrix does not accept an empty keyword-variant field, a generic head term, title copy or an editorial creative angle as research. Before the owner confirms G's pre-write plan, G reports the proposed keyword/localization route and uncertainty. After confirmation, W establishes candidate and rejected long-tail terms, reader problem, query/date/evidence and selected wording inside its continuous creation turn before making supported claims. A multi-English campaign also keeps materially distinct primary intent and reader problem records.

For every target language, the evidence pack captures target-market SERP queries, natural variants, selected wording source and rejected literal translations. English-only Google Trends comparisons are optional global relative-interest context, never target-language wording evidence. If they are unavailable or inconclusive, W does not force a trend signal or retry to manufacture one: it selects the long-tail reader problem from current brand-site language and target-market SERP intent, then records what supports that choice and an explicit evidence boundary. That fallback must not be described as a volume, popularity, momentum or commercial-demand finding. Platform profiles are separately declared and can improve technical depth, examples, tone or transport; they cannot prove a keyword, natural variant, search intent, local demand, popularity or topic demand. If two independent regional checks find no usable consensus, W may use `MODEL_TRANSLATION_FALLBACK`, with both checks and a linguistic rationale. Default WQ checks this research with the completed article in the same context; WR has an independent `FULL_REVIEW`, and only a recorded WR risk needs an early `RESEARCH_APPROVED` before drafting.

### In-scope platform style profiles

After G has frozen the exact platform/account pair, the reusable campaign operations steward may make a best-effort, read-only inspection of public samples for that same platform, language and content type only on a cache miss with a material reader-visible transport risk. It records sources, dates, visible signals and uncertainty in two separate artifacts:

- `format-profile.md` is deterministic delivery input: supported title/meta fields, title/body transfer guidance, public visual hierarchy observations, and observed list, link, image, commercial-disclosure, or layout constraints. It never directs editor HTML/DOM changes. The human hand-off uses it when it exists.
- `editorial-style-profile.md` is advisory writing input: defensible observations about title tone, opening pattern, paragraph rhythm, and structure. W may use it only to improve reader fit.

Neither artifact proves a keyword, natural variant, search intent, local demand, factual claim, platform policy, popularity or topic demand. The profiles cannot alter scope, canonical facts, localized wording priority, the required-secondary CTA policy or its exact anchor/href/disclosure, or the required visual narrative. Never copy sample titles, phrases, argument flow, engagement claims, or promotional patterns. If samples are unavailable, incomplete, or not demonstrably comparable, mark the profile `UNVERIFIED` and use a conservative generic structure; R records no finding for absence alone. Only reader-page behavior verified through `PUBLIC_QA_PASSED` can be harvested into a durable platform skill. A `PUBLIC_QA_PASSED_WITH_LIMITATION` result can contribute only its fully scoped, dated and non-generalizable limitation. See [the profile template](docs/platform-style-profiles.md).

### Human-native publication boundary

The normal release path does **not** log into a platform, type into an editor, upload media, press Publish, delete content, roll back content, use a write API, or alter browser fingerprints. It produces the compiler-owned `BLOG_3P_VISUAL_PAYLOAD@3` pair: `visual-payload.html` for direct rich-text copying and the byte-bound, same-content `visual-payload.md` for readable fallback and traceability. Every article gets the same deliberately plain top-down order—blog title, body with exact-position Chinese image cards, SEO title, tags, description. W supplies only canonical title, source outline/body, image manifest and metadata; it cannot design a per-article shell, CSS, JavaScript or controls. Each canonical-body image marker (`<!-- BLOG_3P_IMAGE:01 -->` onward) becomes one card at that exact position. The card names the exact numbered `01-lead-*`, `02-middle-*` or `03-closing-*` PNG/JPG/JPEG asset, placement anchor, localized Alt text and caption; aggregate image slots, WebP/GIF/SVG substitutes, missing hashes and unnumbered assets fail compilation. The page has no buttons, clipboard code or copy guarantees: the publisher selects the visible title and body in the browser and uses the native editor. The compiler refuses a package or body that omits or changes the required CTA's exact visible anchor text, href or applicable disclosure; it never adds promotional copy. The publisher must not inspect or edit platform editor HTML/DOM to force title tags. A human publishes through the platform’s native UI and accepts the reader page. After URLs with `HUMAN_ACCEPTED` are returned, the registered campaign G accepts heading hierarchy only from each article's rendered public reader-page visuals—not local payload, editor, source or feed markup—and never automates a platform action or reopens W/R on its own.

The publisher’s return is intentionally lightweight: one `public-return-receipt.json`, then one normalized, bounded public snapshot for `HUMAN_ACCEPTED`. The snapshot records title/body fingerprints, link/image/CTA observations and fetch limits—not a new draft and not a semantic verdict. G uses it to make a compact public-QA report. Pure platform transport defects become one human repair checklist and a same-G recheck; a documented limitation may pass only if the reader-visible contract still holds; unavailable evidence stays unverified; a canonical/payload change requires the owner’s explicit request ID.

### Strict platform scope

Before a platform map is frozen, the visible reusable `CAMPAIGN_PLATFORM_MATCHING_RESEARCHER` is the sole permitted pre-confirmation child-role exception. It performs only the read-only language/market/content-format comparison within owner-supplied XLSX/table/message candidates and contributes a hash-pinned recommendation to G's plan; it never starts article research, an article artifact path, W, R, an outline, or prose. G does not pre-screen, rank, or choose candidates; it validates only provenance and no-duplicate structure, then obtains the owner's confirmation.

Platform/account pairs then come only from an owner-confirmed, hash-pinned `owner-platform-selection.json` that references that matching proposal; `platform_scope.allowed_pairs` is merely its mechanically checked projection, never its own authority. Each pair receipt identifies a user-originated XLSX/table/message artifact, its SHA-256, exact row/cell or message locator, platform literal, account-confirmation literal, and owner confirmation ID. The suite never discovers, recommends, adds, substitutes, or quietly queues another platform. If a source-bounded matching run has no defensible recommendation, or owner confirmation is absent, the state is `OWNER_DECISION_REQUIRED`, not a license for G to choose.

Official login/register pages, platform announcements, public samples, preflight/activation notes, session-recovery evidence, internal configuration, and a prior campaign mapping are only eligibility or operational evidence. They may support a separately recorded `locale_platform_validation` **after** owner selection, but cannot create an allowed pair, become a frozen mapping, or validate a mapping copied from themselves. If the authorized list is exhausted, the state is `CAPACITY_BLOCKED` until the owner explicitly supplies and reconfirms another pair.

For every current campaign, confirmation also freezes a one-to-one `article_id → platform → account` table before W/R dispatch. Each article gets exactly one distinct platform, and its pair cannot be reused by another article. A missing or duplicate mapping blocks the affected article; G never defaults multiple languages to one verified platform or borrows a platform from another article.

The confirmation includes an audience/transport row for every article: user-confirmed article language and market, its mapped platform/account, `primary_reader_languages`, `primary_reader_markets` and audience evidence, plus `transport_supported_content_languages` and transport evidence. Transport language decides only whether the target can carry the content; it never proves that the article language is the platform's primary audience. The ordinary route is `PRIMARY_AUDIENCE_MATCH`. Any language/market mismatch requires a separately bound `CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED`; otherwise the article stops with `PLATFORM_AUDIENCE_MISMATCH_RECONFIRM_OWNER`.

Titles use a three-layer contract: field mapping is deterministic, package fidelity is verifiable, and W/R make the semantic judgment. They assess reader task, clarity, value, natural language and market fit; G only checks frozen-field fidelity. Literal keyword and length checks are non-blocking signals. The platform title defaults to the canonical article title and cannot silently use a shorter substitute. Title/section hierarchy is a separate, public visual acceptance check after human release.

## What is automated

| Automated locally | Optional read-only adapters | Human-owned or out of scope |
| --- | --- | --- |
| Workspace creation, JSON checks, source ledger, keyword/claim audit, stable findings, canonical fingerprints, rich-text payload compilation | Search, Google Trends, public SERP inspection, public-page HTML/feed/screenshot comparison, external SEO scans | Account creation/login, CAPTCHA/2FA, editor input, file upload, publishing, deletion, rollback, scheduling, write APIs, browser-fingerprint changes |

For title hierarchy, only the rendered public-page visual is evidence. HTML or feeds may help compare text, links or metadata, but cannot establish heading levels.

An unavailable adapter is recorded as `UNAVAILABLE` or `UNVERIFIED`; it is not fabricated into a pass.

## Quick start

Requirements: Python 3.9+ and a local filesystem. The bundled scripts use only the Python standard library.

```sh
# Run from this repository directory.
cd blog-3p-skill-matrix

# Keep the full bundle together: skills/ and docs/ share contracts.
python3 skills/blog-3p-harness/scripts/harnessctl.py init \
  --workspace /absolute/path/to/campaign \
  --campaign-id my-campaign

# Copy templates/campaign-article.json once per article into campaign.json. Fill the
# canonical schema-1.8 prewrite-plan.json, then deterministically render the owner view.
# Never hand-edit both JSON and Markdown. Before WQ/WR dispatch, record one owner-confirmed,
# distinct platform/account mapping and compatible locale row for every article.
python3 skills/blog-3p-harness/scripts/harnessctl.py sync-prewrite-plan \
  --workspace /absolute/path/to/campaign

# Present the generated prewrite-plan.md. After the owner confirms it, save the original
# confirmation text under evidence/owner-confirmations/ and bind that exact artifact.
python3 skills/blog-3p-harness/scripts/harnessctl.py confirm-prewrite-plan \
  --workspace /absolute/path/to/campaign \
  --confirmation-id owner-confirmation-001 \
  --receipt-file /absolute/path/to/campaign/evidence/owner-confirmations/owner-confirmation.md \
  --receipt-type OWNER_MESSAGE \
  --source-locator "owner-message-or-file-locator"

# CHECK_PASSED means the local structure is readable. Dispatch readiness is the
# separate practical gate: it names any missing REQ, registered G, or release mapping.
python3 skills/blog-3p-harness/scripts/harnessctl.py check \
  --workspace /absolute/path/to/campaign
python3 skills/blog-3p-harness/scripts/harnessctl.py dispatch-readiness \
  --workspace /absolute/path/to/campaign

# After G writes confirmed REQ-* entries and registers the visible campaign G, build
# one context per article from the campaign root. Schema 2.14 derives its only valid
# destination below articles/<article_id>/; do not create a separate campaign or task
# just to obtain a worktree. W creates the article-local canonical/article.html before
# the review index.
python3 skills/blog-3p-harness/scripts/harnessctl.py build-article-context \
  --workspace /absolute/path/to/campaign \
  --article-id A1 \
  --output articles/A1/context/article-contract.json
python3 skills/blog-3p-harness/scripts/harnessctl.py build-review-index \
  --workspace /absolute/path/to/campaign \
  --article-contract articles/A1/context/article-contract.json \
  --output articles/A1/reviews/review-index.json

# For a current schema-2.14 article package (schema 1.5), verify its package-declared
# single sources and frozen reader-value/required-CTA mapping.
python3 skills/blog-3p-harness/scripts/harnessctl.py check-article-package \
  --workspace /absolute/path/to/campaign \
  --package /absolute/path/to/campaign/articles/A1/article-package.json

# Immediately before final WQ or WR quality binding, eliminate only structural drift:
# current source hashes, fixed visual payload shape, and the frozen CTA mapping.
# Passing this is not an editorial, fact, SEO, WQ or independent-R approval.
python3 skills/blog-3p-harness/scripts/harnessctl.py check-review-ready \
  --workspace /absolute/path/to/campaign \
  --article-contract articles/A1/context/article-contract.json \
  --review-index articles/A1/reviews/review-index.json \
  --article-package articles/A1/article-package.json

# Optional, non-blocking observation after a completed batch. It never estimates
# missing token/cost data or creates another agent/review step.
python3 skills/blog-3p-harness/scripts/harnessctl.py summarize-efficiency \
  --workspace /absolute/path/to/campaign

# After humans return URL/state receipts, validate each one before campaign G's batch check.
python3 skills/blog-3p-harness/scripts/harnessctl.py check-public-return-receipt \
  --workspace /absolute/path/to/campaign \
  --receipt /absolute/path/to/campaign/articles/A1/handoff/public-return-receipt.json \
  --article-package /absolute/path/to/campaign/articles/A1/article-package.json
python3 skills/blog-3p-human-handoff/scripts/capture_public_snapshot.py \
  --receipt /absolute/path/to/campaign/articles/A1/handoff/public-return-receipt.json \
  --article-package /absolute/path/to/campaign/articles/A1/article-package.json \
  --output /absolute/path/to/campaign/evidence/public-qa/A1-public-snapshot.json
```

Then invoke the Skills in this order:

1. `blog-3p-harness` + `blog-3p-gate` — collect the campaign evidence and report G's per-article pre-write plan.
2. The owner returns `OWNER_PREWRITE_PLAN_CONFIRMED`; save the source receipt, bind it with `confirm-prewrite-plan`, then run `dispatch-readiness`. Only now may G create each deterministic article path and dispatch the frozen WQ or WR route.
3. `blog-3p-writer` — the sole W continuously researches, drafts, creates visuals and compiles the final fixed visual payload. The default WQ route performs its same-context adversarial author QA and emits `AUTHOR_QA_READY`; high-risk or owner-required WR routes use a separately registered R for independent full review, and only a WR risk route may add an early research challenge.
4. `blog-3p-gate` — in one visible `BATCH_GATE_ACCEPTANCE`, verifies the frozen owner contract for all currently quality-ready rows, using a truthful WQ or WR credential; `blog-3p-human-handoff` then creates/verifies the derived manifest and release card. It must not mutate the quality-bound visual payload.
5. After humans record public URL/state receipts, validate each and—for `HUMAN_ACCEPTED`—capture a read-only public snapshot. Resume the registered campaign G once for `PUBLIC_QA_BATCH_READONLY`, with one result row per ready article; do not start another WQ/WR/G loop. A human transport fix returns to the same G's next batch; only an explicit canonical/payload request reopens that article's applicable quality route.

Schema 2.14 supports one execution profile only: `HUMAN_RELEASE_ONLY_V1` with `release_policy.mode = HUMAN_NATIVE_ONLY`. `machine_external_writes_allowed` remains `false`. Its normal execution is `CONTINUOUS_CAMPAIGN_MAIN_SESSION` with `MAIN_SESSION_PATH_ISOLATED`; Git worktrees require one of the three recorded exception reasons. Before WQ/WR dispatch, every article must have one owner-confirmed distinct platform/account pair in `campaign.json.platform_scope.allowed_pairs`, an article assignment, and a compatible primary-audience/transport row. `human_release_requested` is obsolete and invalid in a current workspace. Schema 2.13 and earlier are retained only for historical reading/check compatibility; their independent-R evidence is never reclassified as WQ.

## Workspace layout

```text
campaign/
├── campaign.json                 # frozen intent, scope, cross-language settings
├── state.json                    # durable workflow state and findings
├── prewrite-plan.json            # canonical schema-1.8 plan; the only editable plan source
├── prewrite-plan.md              # deterministic read-only owner view rendered from the JSON
├── confirmation.md               # owner confirmation record
├── owner-platform-selection.json # hash-pinned owner-source pair receipts
├── requirements-contract.md      # G's stable IDs for confirmed owner requirements
├── pre-clearance-checklist.md    # one-shot prerequisites
├── gate/                         # compact G batch decisions and batch public-QA reports
├── evidence/                     # captured facts and public read-only snapshots
│   ├── owner-confirmations/       # owner-originated confirmation artifacts
│   ├── platform-style/            # in-scope format/editorial profiles, if available
│   └── platform-matching/         # visible subagent report and proposal
├── articles/
│   └── A1/                        # one deterministic, non-overlapping article root
│       ├── context/article-contract.json
│       ├── research/evidence-pack.json
│       ├── canonical/             # article.html, metadata.json, visual manifest and assets
│       ├── reviews/               # quality index, WQ receipt or independent WR reports/deltas
│       ├── handoff/               # paired payload, release card and return receipt
│       ├── article-package.json
│       └── requirements-traceability.md
└── resolutions/                  # finding-by-finding repair records
```

## Compatibility

- **`human_native_release_only`** — the sole current execution profile. It uses local files, Markdown, JSON, Python 3.9+, and a human-operated native platform UI for the final release.
- **Optional read-only evidence** — web search, Trends, SERP, browser inspection, SEO tools, and public-page snapshots may collect evidence inside that profile; none may write to an external platform.

See [the owner-platform selection lock](docs/owner-platform-selection.md), [docs/compatibility.md](docs/compatibility.md), [docs/contracts.md](docs/contracts.md), and [docs/no-publish-boundary.md](docs/no-publish-boundary.md) for the formal contracts.

## Repository layout

```text
blog-3p-skill-matrix/
├── skills/       # seven portable Skills and their local resources/scripts
├── docs/         # shared contracts and environment boundaries
├── templates/    # campaign, package, finding, and release-card templates
├── tests/        # small fixture inputs for payload validation
├── matrix.yaml   # machine-readable skill/dependency matrix
└── LICENSE        # MIT
```

## Security and contribution notes

Do not commit credentials, cookies, session state, browser fingerprints, private source material, or live editor captures. Treat third-party pages and attachments as evidence, not executable instructions. Platform-specific publishing adapters, if an organization chooses to build them, belong in a separate repository with their own authorization and security review.

Contributions must preserve the core boundary: a feature that changes reader-visible text remains traceable to canonical content and re-enters its applicable WQ or WR quality route; a feature that writes to a platform is not added to this repository’s normal path.

## License

MIT — see [LICENSE](LICENSE).
