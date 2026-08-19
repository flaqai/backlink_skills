---
name: submit-product-directories-v1-batch
description: SPD V1 Batch. Process large, user-supplied sets of legitimate product, software, startup, app, and AI-tool directory URLs across Windows, macOS, and Linux-capable environments through normalization, deduplication, execution sharding, verification-first queues, authorization-controlled form work, idempotent submission, recovery, and truthful throughput reporting. Use when coverage and operational throughput matter more than deep per-site quality analysis. Do not use for ranking manipulation, bulk link spam, invented data, CAPTCHA bypass, paid-link acquisition, forced reciprocal links, or routes prohibited by a site's terms.
---

# SPD V1 Batch — large-batch directory operations

## Version identity

- Canonical name: `SPD V1 Batch`.
- Invocation: `$submit-product-directories-v1-batch`.
- Optimize for queue throughput, repeatability, verification handling, and recovery across large source lists.
- Apply a fast legitimacy gate, not the deeper editorial and referral-value analysis used by `$submit-product-directories-v2-quality`.
- Route campaigns requiring careful site selection, durable-placement analysis, or SEO-quality evidence to V2 Quality.

## Load controls

1. Read the verified product profile, brand rules, contact and credential aliases, approved assets, source list, batch authorization, and existing record.
2. Read [references/workflow.md](references/workflow.md) before planning or browser work.
3. Read [references/status-model.md](references/status-model.md) before writing or auditing records.
4. Read [references/browser-control-routing.md](references/browser-control-routing.md) before any browser or app interaction. Run the Windows/macOS/Linux capability preflight and select the backend from the current environment; do not assume a specific browser, operating system, or Computer Use support.
5. Copy [assets/submission-record-template.md](assets/submission-record-template.md) when no V1 Batch record exists.

Never invent product, company, founder, pricing, address, launch, ownership, contact, or legal facts. Keep optional unknowns blank and block required unknowns.

## Apply the batch legitimacy gate

Reject or separate any route that is irrelevant to the product, unavailable, unreleased-only, paid-link-only, forced-reciprocal, a known low-quality directory network, or prohibited for automated form work. Do not select sites because they promise dofollow links, ranking gains, DA/DR, or backlink volume.

Use only the exact brand, product name, or naked canonical URL as public link text. Never request dofollow treatment or use repeated commercial exact-match anchors.

## Build the queue

1. Normalize hostnames and submission routes. Strip tracking parameters from the record while preserving required route parameters in controlled evidence.
2. Derive an idempotency key from platform domain, product canonical ID, account alias, and route.
3. Deduplicate before opening the browser. Never execute an idempotency key that is already submitted, awaiting approval, published, or outcome unknown.
4. Assign stable queue IDs and execution shards. Treat shard size and maximum active tabs as operational settings, not SEO safety thresholds.
5. Classify every site into `direct form`, `account required`, `manual verification`, `email verification`, `paid/reciprocal`, `unavailable`, `ineligible`, or `unknown`.
6. Use batch-scoped authorization only when it names the allowed actions, source-list scope, approver alias, approval time, and expiry. Payments, reciprocal-site changes, DNS changes, and publication outside a directory require separate authorization.

## Run the verification-first pipeline

1. Run a read-only preflight over each shard before entering product-listing fields.
2. Expose the earliest native CAPTCHA, Turnstile, image code, email check, login, or similar safeguard.
3. Attempt only the site's ordinary native automatic verification. Never bypass, outsource, or weaken a safeguard.
4. Move unresolved items to one manual queue and continue processing eligible sites.
5. After the user completes the queue, recheck token validity and process short-lived tokens first.
6. Do not hold more active challenge tabs than the configured browser capacity.

## Execute forms at scale

1. Process only sites that passed the legitimacy gate, authorization check, duplicate check, and verification prerequisite.
2. Reuse approved field variants by length and category, while preserving exact public brand spelling and truthful meaning.
3. Keep newsletters and optional promotions off unless authorized.
4. Review plan, cost, URL, identity, category, agreements, uploads, and verification immediately before submission.
5. Submit sequentially within a browser profile. Record the result before advancing the queue cursor.
6. Never retry an ambiguous final action. Check the account backend, mailbox, and public page first.
7. Save drafts, transient failures, manual actions, and terminal outcomes as distinct states so the campaign can resume without replaying completed work.

## Protect records

- Store aliases and controlled evidence IDs, not passwords, OTPs, recovery codes, cookies, OAuth parameters, magic links, raw session IDs, raw email addresses, phone numbers, or tokenized URLs.
- Separate the shareable campaign record from controlled evidence.
- Treat a click, registration, draft, cleared form, or generic thank-you URL as insufficient submission evidence.

## Close and measure

Run:

On macOS or Linux:

```bash
python3 scripts/audit_submission_record.py path/to/v1-batch-record.md
python3 scripts/audit_submission_record.py path/to/v1-batch-record.md --json
```

On Windows, use `py -3` or an equivalent Python 3 launcher:

```powershell
py -3 scripts/audit_submission_record.py path\to\v1-batch-record.md
py -3 scripts/audit_submission_record.py path\to\v1-batch-record.md --json
```

Report totals by queue state, verification state, shard, and outcome. Measure queue completion rate, verified submissions per operator hour, duplicate avoidance, recovery rate, and unresolved manual workload. Report published listings separately from submitted forms. Do not report submission volume as proof of SEO value.

## Bundled resources

- [references/workflow.md](references/workflow.md): sharding, verification queues, execution, and recovery.
- [references/status-model.md](references/status-model.md): record schema and state invariants.
- [references/browser-control-routing.md](references/browser-control-routing.md): backend-neutral browser selection, interaction, confirmation, recovery, and evidence rules.
- [assets/submission-record-template.md](assets/submission-record-template.md): privacy-safe V1 Batch template.
- `scripts/audit_submission_record.py`: batch integrity, secret, duplicate, and state auditor.
