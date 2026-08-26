---
name: linkedin-writer
description: LinkedIn-native long-form article and newsletter writing workflow for LinkedIn and Google-to-LinkedIn topic discovery, business-depth research, professional thought leadership, evidence-led drafting, final humanization, discussion design, SEO settings, auditing, and publish-ready packaging. Use when creating, outlining, researching, enriching, rewriting, humanizing, auditing, or packaging LinkedIn Articles, LinkedIn newsletters, LinkedIn long-form posts, LinkedIn thought leadership, LinkedIn B2B articles, LinkedIn 长文, LinkedIn 专栏, LinkedIn 话题调研, LinkedIn 商务内容, 去 AI 化编辑, or LinkedIn 发布包.
---

# LinkedIn Writer

## Goal

Turn a topic, product, argument, report, source bundle, or existing draft into a credible LinkedIn-native long-form article that helps a defined professional audience make a decision, understand a change, or improve how they work.

This skill reuses the parent `writer` workflow for fact checking, humanization, image packaging, and optional Cloudflare R2 delivery, but it does not treat LinkedIn as a generic SEO blog host or as Medium with a different publishing button.

LinkedIn-native writing prioritizes:

- a specific professional reader and work context;
- a defensible point of view or useful decision framework;
- current LinkedIn search and conversation signals;
- expertise demonstrated through evidence, examples, and boundaries;
- short, skimmable sections for busy readers;
- a discussion-worthy close rather than a generic sales conclusion;
- a complete native publishing pack, including LinkedIn SEO settings.

Default language follows the user's request. If the user gives no language, use the language of their source material or target audience.

## Format Routing

Use the requested format, not a blended default:

| Destination | Workflow |
|---|---|
| LinkedIn Article or LinkedIn newsletter edition | Use this skill in full |
| LinkedIn short feed post only | Use the short-post rules and publishing pack in this skill; do not force a long article |
| Google-first website article | Use `../SKILL.md` |
| Medium article or third-party editorial essay | Use `../medium-writer/SKILL.md` |
| Chinese WeChat Official Account article | Use `../wechat-writer/SKILL.md` |

If the user says only “LinkedIn article” or “LinkedIn long-form,” default to a native LinkedIn Article. If they already run a newsletter and provide its name or theme, package the piece as a newsletter edition. Do not claim a newsletter was created or published without direct evidence.

## Required References

Read each relevant file completely before acting:

- Topic discovery, LinkedIn search, trend expansion, and current seed topics: `references/linkedin-topic-research.md`
- Google-to-LinkedIn discovery, business-depth enrichment, and final LinkedIn humanization: `references/linkedin-business-depth-and-humanization.md`
- New article, rewrite, or reusable output format: `references/linkedin-article-template.md`
- Article review, scoring, and revision gate: `references/linkedin-review-rubric.md`
- Fact-heavy claims, comparisons, current products, or statistics: `../references/fact-check-and-style.md`
- Final natural-language edit after factual and structural fixes: `../references/humanization.md`
- Images, local paths, file packaging, and optional R2 delivery: `../references/output-packaging.md`
- R2 upload tasks only: `../references/r2-image-upload.md` and `../references/r2-security.md`

Do not load unrelated references merely because they exist.

## Non-Negotiable Boundaries

1. Do not invent professional experience, product testing, customers, interviews, internal data, quotes, results, credentials, or events.
2. First-person events may appear only when the user supplied them for this task or they exist in an approved, attributable source package.
3. Do not turn LinkedIn search result counts, reactions, comments, or repeated phrases into search-volume claims.
4. Do not call a topic “trending,” “viral,” or “hot” without dated evidence. Use “recurring conversation,” “current topic seed,” or similarly bounded language when evidence is directional.
5. Do not mention or tag people and Pages merely to trigger notifications. Every suggested mention must have a content reason.
6. Do not convert a product announcement into disguised thought leadership. State affiliations, recommendations, and commercial relationships when they materially affect trust.
7. Do not use engagement bait such as “Agree?”, forced polls, empty controversy, or unrelated hashtags. Invite a concrete professional response.
8. Do not copy another LinkedIn creator's hook, framework, story, examples, distinctive phrases, or conclusion. Extract only topic signals and questions, then synthesize an original angle.
9. Do not claim publication, indexing, newsletter delivery, reach, or engagement from a completed local package.
10. Writing, generating images, uploading assets, and publishing externally are separate permission levels.

## LinkedIn Article Task Card

Before research or writing, create or infer a task card in 14 lines or fewer and save it as `linkedin-brief.md`:

- Publish as: personal profile / Company Page / unknown.
- Format: standalone Article / newsletter edition / short feed post.
- Professional audience: role, seniority, industry, and work situation.
- Reader decision: what they should understand, compare, decide, or do.
- Core thesis: one sentence the article must establish.
- Expertise basis: supplied experience, verified sources, product knowledge, or editorial analysis.
- Primary topic phrase: one natural phrase for LinkedIn and external search.
- Related topic cluster: 4-8 entities, skills, problems, roles, or outcomes.
- Conversation tension: trade-off, change, misconception, or unresolved question.
- Business context: stakeholders, buying/approval path, economics, implementation, risk, and measurement dimensions that matter.
- Evidence requirement: 3-6 claims that must be checked.
- Target length: normally 900-1,800 words; adjust to the subject, not a platform myth.
- CTA: discussion question, practical next step, subscription prompt, or disclosed product action.

Make conservative assumptions when details are missing. Ask only when audience, thesis, or authority to use personal experience is materially ambiguous.

## Working Modes

### Continuous mode (default)

Run `brief -> LinkedIn and Google-to-LinkedIn research -> business insight map -> evidence -> outline -> draft -> audit -> rewrite -> final humanization -> integrity recheck -> package` without pausing at every step. A request to “write an article” means deliver the reviewed local package.

### Topic-radar mode

When the user asks for hot topics, search ideas, or content planning, stop after the ranked topic map unless they also ask for an article. Do not draft ten shallow articles.

### Interactive mode

Pause at the topic shortlist or outline only when the user explicitly asks to choose first.

### Audit mode

If the user asks only for review, produce findings without overwriting the draft. If they ask to improve, preserve the original and apply fixes before re-auditing.

## End-to-End Workflow

### 1. Create an isolated article directory

Use:

```text
writer/linkedin-writer/output/<article-slug>/
```

This LinkedIn-specific output directory overrides the parent writer's default `writer/output/<article-slug>/` location. Prefer a short ASCII, hyphen-separated slug under 80 characters. Do not mix multiple campaigns in one directory.

Recommended working files:

```text
linkedin-brief.md
linkedin-topic-map.md
linkedin-insight-map.md
source-ledger.md
outline.md
draft.md
article-linkedin.md
linkedin-audit.md
linkedin-publishing-pack.md
image-plan.md
```

Create only the files the task needs. Keep `draft.md` separate from `article-linkedin.md` so an unreviewed draft cannot be mistaken for final copy.

### 2. Research LinkedIn search demand and conversation context

Read `references/linkedin-topic-research.md` completely.

Do not begin with a static list of broad trends. Build a query grid around:

```text
core entity or skill
× audience or role
× work outcome
× tension or decision
× current change or timeframe
```

Use LinkedIn search suggestions and Posts results when available. Filter by recent date, content type, author industry/company, or source type when useful. Triangulate recurring questions with primary reports, official product or policy sources, credible industry research, customer questions, and the user's own content goals.

Then use Google to discover publicly indexed LinkedIn material with exact phrases, date operators, exclusions, and scoped queries such as:

```text
site:linkedin.com/posts "<topic>" "<role or objection>" after:YYYY-MM-DD
site:linkedin.com/pulse "<topic>" "<implementation, ROI, risk, or governance>"
site:linkedin.com/company "<topic>" "<official case or report>"
```

Record Google results separately. Search snippets and LinkedIn creator claims are conversation signals, not automatically verified facts. Open the original page when possible, verify material claims elsewhere, and never copy a creator's hook, framework, structure, anecdote, or conclusion.

Record the exact query, date, filter, observed signal, and interpretation in `linkedin-topic-map.md`. Separate:

- **Observed:** directly visible search suggestion, repeated topic, question, format, or source.
- **Inferred:** a possible reader need or angle derived from the observations.
- **Verified demand:** use this label only when reliable demand data actually supports it.

Never imply that a topic is popular merely because it appears in one post or one search result.

### 3. Expand the topic before outlining

For the selected topic, create a useful professional topic cluster:

- Core concept: the named tool, skill, market shift, or decision.
- Business outcome: time, quality, growth, cost, risk, hiring, retention, or customer value.
- Role impact: what changes for practitioners, managers, executives, buyers, or candidates.
- Implementation: workflow, prerequisites, governance, measurement, and failure modes.
- Trade-off: what the popular framing misses or where the approach breaks.
- Evidence: current data, official documentation, case material, or observable examples.
- Adjacent conversation: 3-5 related topics that deepen the article without causing drift.
- Discussion gap: a question qualified readers can answer from experience.

Reject adjacent topics that do not strengthen the thesis or reader decision. “More keywords” is not the same as more depth.

Read `references/linkedin-business-depth-and-humanization.md` and create `linkedin-insight-map.md`. Enrich the selected topic across the dimensions that materially affect the business decision:

- decision trigger and cost of waiting;
- sponsors, users, approvers, blockers, buyers, and owners;
- cost, budget, ROI, revenue, margin, or option value;
- workflow, data, integration, adoption, and change management;
- baselines, leading indicators, outcome metrics, and guardrails;
- risk, strongest objection, failure mode, and reversibility;
- one attributable or explicitly hypothetical scenario;
- the next artifact, meeting, pilot, or decision the reader should initiate.

For a substantial business article, normally develop at least five relevant dimensions. Do not force irrelevant finance or governance sections into a career essay, but do not omit a material stakeholder, cost, or risk merely to keep the article simple.

### 4. Build the claim-source ledger

Create `source-ledger.md` for any current, factual, comparative, or decision-shaping article.

For each material claim, record:

- claim ID and exact claim;
- claim type: fact / inference / editorial judgment / user-provided experience;
- source title, publisher, date, and URL;
- status: `verified`, `user_provided`, `needs_verification`, `softened`, `removed`, or `unsupported`;
- where it will appear;
- caveat or expiry risk;
- research origin: user material / primary source / LinkedIn conversation / Google-discovered LinkedIn result / editorial synthesis.

Prefer original LinkedIn Help pages for platform behavior, original reports for research claims, official product pages for current capabilities, and authoritative sources for policy or high-risk topics. Search snippets are discovery aids, not final evidence.

### 5. Choose a LinkedIn-native article angle

Select one primary angle:

- Practitioner playbook: a repeatable method for a real work problem.
- Decision guide: criteria and trade-offs for a meaningful choice.
- Evidence-led point of view: a clear thesis supported by current evidence.
- Change analysis: what changed, who it affects, and what to do next.
- Myth or assumption audit: a common belief tested against evidence and practice.
- Case or teardown: an attributable example analyzed for transferable lessons.
- Leadership memo: implications, decisions, risks, and operating questions for leaders.
- Career or skills guide: role change, skill evidence, learning path, and hiring relevance.
- Product or workflow review: strengths, limitations, fit, and implementation conditions.

Avoid a generic “what it is / benefits / future” structure unless the reader is genuinely a beginner and the article adds a practical framework.

### 6. Create the outline

Save `outline.md` with:

- selected headline direction and reader promise;
- opening tension and evidence source;
- TL;DR or “At a Glance” points;
- 3-6 main sections;
- the claim, evidence, example, and professional implication for each section;
- counterargument, limit, or implementation risk;
- stakeholder disagreement, economic implication, implementation dependency, and measurement plan where material;
- one concrete scenario with provenance or an explicit `hypothetical` label;
- where a visual materially helps;
- final takeaway and discussion question.

If the user requested the complete article, continue without waiting for approval.

### 7. Write the draft for LinkedIn reading behavior

Read `references/linkedin-article-template.md` completely and adapt it to the chosen angle.

The opening should establish, within roughly the first 120 words:

- the professional situation or tension;
- the main thesis or surprising implication;
- what the reader will get from continuing.

Then:

- use short and medium paragraphs, usually 1-4 sentences;
- put the point before the explanation;
- use descriptive H2 headings that carry meaning outside the article;
- include concrete checks, examples, decision criteria, or steps;
- name owners, stakeholders, costs, baselines, dependencies, and trade-offs instead of relying on abstract business language;
- connect technical detail to role, team, customer, or business impact;
- distinguish fact, inference, and recommendation through wording;
- include a meaningful counterpoint or limitation;
- keep links contextual and avoid a block of promotional URLs;
- end with a specific takeaway and one answerable professional question.

FAQ is optional. Add it only when search intent or reader follow-up questions justify it. Do not inherit the Google SEO article requirement mechanically.

### 8. Fact-check and disclose

Check all dates, numbers, prices, product features, model names, policy statements, rankings, “most popular” claims, and comparisons.

For each claim:

1. Verify against the best available primary or authoritative source.
2. Preserve the source's scope, geography, population, and date.
3. Attribute research naturally in the body when it changes the argument.
4. Soften or remove claims when evidence is incomplete.
5. Add a concise disclosure for commercial relationships, product ownership, affiliate links, or recommendations when relevant.

Do not overload the article with citations. Include enough source context for trust and maintain a clean source list in the package.

### 9. Audit, revise, and humanize

Read `references/linkedin-review-rubric.md` completely. Score the article across:

- professional relevance;
- thesis and originality;
- evidence and trust;
- usefulness and application;
- LinkedIn readability;
- conversation quality;
- publishing completeness.

Resolve blocking and high-impact issues directly. Then read `../references/humanization.md` and run the shared natural-language edit. After that, read the final-humanization section of `references/linkedin-business-depth-and-humanization.md` and complete the LinkedIn-specific 去 AI 化编辑.

The final pass must make generic business abstraction concrete, remove synthetic LinkedIn performance and template symmetry, retain bounded professional judgment, and verify every first-person signal. It must not add fake experience, deliberate errors, unsupported opinions, or slang, and it must not claim to bypass an AI detector. Recheck facts, citations, links, SEO settings, disclosure, and certainty after the edit, then rerun the deterministic audit.

Run the deterministic audit:

```bash
node writer/linkedin-writer/scripts/audit-linkedin-markdown.mjs \
  writer/linkedin-writer/output/<article-slug>/article-linkedin.md \
  --keyword "<primary topic phrase>"
```

The script checks measurable Markdown and packaging signals only. It cannot verify facts, originality, expertise, audience fit, or whether the article will perform well.

Write the final editorial and mechanical results to `linkedin-audit.md`.

### 10. Create visuals only when they add explanatory value

Prepare at least a cover direction in `image-plan.md`. Generate images when the user asks for a complete visual package or when visuals are an explicit deliverable.

- For newsletter editions, LinkedIn currently recommends a 1920×1080 cover. For a standalone Article, use a 16:9 cover and verify the current editor preview; treat dimensions as publishing guidance rather than a universal hard limit.
- Supporting visuals: normally 1-3, placed after the section they clarify.
- Prefer frameworks, workflows, scenario comparisons, or attributable data visuals over decoration.
- Do not fabricate dashboards, product UI, logos, awards, customer quotes, or measured charts.
- Use concise, descriptive alt text.
- Save local assets beside the article and reference them with relative paths first.

Only upload to R2 when the user needs public URLs and a valid local configuration exists. Missing R2 configuration is not an error.

### 11. Build the LinkedIn publishing pack

Save `linkedin-publishing-pack.md` and append a compact version to the article source after a divider. Include:

- selected article headline;
- optional subtitle/deck;
- publish-as recommendation: profile or Page, with reason;
- format recommendation: standalone Article or newsletter edition;
- SEO title, maximum 60 characters;
- SEO description, target 140-160 characters;
- suggested article URL slug;
- cover filename and alt text;
- 60-150 word feed commentary that adds a reason to read;
- one concrete discussion question;
- 0-5 relevant hashtags, used only when they improve topic labeling;
- relevant mention candidates and why, or `none`;
- disclosure and source notes;
- optional cadence or follow-up angle for a newsletter;
- post-publication measurement plan.

Do not place operational notes, hashtags, or internal audit text inside the public article body.

### 12. Package and hand off

A normal full LinkedIn article package contains:

```text
writer/linkedin-writer/output/<article-slug>/
├── article-linkedin.md
├── linkedin-brief.md
├── linkedin-topic-map.md
├── linkedin-insight-map.md
├── source-ledger.md
├── outline.md
├── linkedin-audit.md
├── linkedin-publishing-pack.md
└── image-plan.md
```

Add `draft.md`, cover/supporting images, `.docx`, or `image-urls.json` only when the task needs them.

The final response should state:

- the selected thesis and target professional audience;
- exact paths to the article, topic map, source ledger, audit, and publishing pack;
- the Google-to-LinkedIn searches used, business dimensions developed, and remaining evidence limitations;
- how many material claims were verified and any remaining limits;
- whether images are generated, planned, or uploaded;
- that the article was not published unless publication was explicitly authorized and verified.

## Article vs Newsletter Decision

Choose a standalone Article when:

- the topic is self-contained;
- there is no established recurring series;
- the user wants one durable thought-leadership asset;
- a consistent future cadence is not yet defined.

Choose or recommend a newsletter edition when:

- the user has a repeatable subject and named audience;
- this article fits an existing newsletter promise;
- future editions can extend the same professional problem space;
- the user can maintain the declared cadence.

Do not create a newsletter merely to make one article seem more important.

## Profile vs Company Page Voice

For a personal profile:

- allow a clear first-person thesis and attributable experience;
- foreground practitioner judgment and professional stakes;
- keep company promotion secondary and disclosed;
- use the author's actual expertise boundary.

For a Company Page:

- use a collective voice only when the organization can support it;
- foreground customer, market, product, or operational insight;
- name the subject-matter expert when their perspective is central;
- avoid pretending the brand has personal experiences or emotions.

## Post-Publication Learning Loop

When the user asks to evaluate a published article, inspect current analytics rather than predicting performance.

Track what is available and relevant:

- article views;
- comments, reactions, reposts, saves, and sends where exposed;
- profile views or followers attributable to the sharing post where exposed;
- viewer job title, industry, seniority, company, or location distributions when available;
- newsletter email sends and estimated open rate when applicable;
- quality of comments: new examples, objections, questions, and buyer or practitioner language.

Treat analytics as estimates and audience signals, not proof of business impact. Use comment language and demographic fit to update the next topic map. Never promise reach or engagement before publication.

## Completion Gate

- The brief names a professional audience, reader decision, thesis, and expertise basis.
- LinkedIn topic research records queries, dates, filters, observations, and inferences separately.
- Google-to-LinkedIn research records scoped queries, result types, author roles, original-page access, and evidence status without treating snippets as proof.
- The insight map develops the relevant stakeholder, economic, workflow, measurement, risk, scenario, and action context.
- Related topics deepen the thesis instead of creating a keyword collage.
- Material facts are verified, softened, or removed in the source ledger.
- The opening earns attention through a real professional tension, not generic hype.
- Each section adds evidence, application, a decision criterion, or a useful implication.
- A counterargument, limitation, or implementation condition is present when relevant.
- First-person experience is attributable and not invented.
- The conclusion gives a specific takeaway and an answerable discussion question.
- SEO title is at most 60 characters and SEO description targets 140-160 characters.
- The publishing pack includes cover, commentary, disclosure, mentions, and measurement notes.
- Editorial review passes the rubric and deterministic checks have been considered.
- Final LinkedIn humanization removes generic/template patterns, preserves provenance and checked meaning, and makes no detector-bypass claim.
- Draft, final article, audit, and operational pack remain separate.
- No external publication or asset upload occurred without authorization.
