# Pre-write scope and editorial brief — rendered owner view

Status: PENDING_OWNER_PREWRITE_PLAN_CONFIRMATION

Owner confirmation ID: PENDING

Pre-write manifest SHA-256: PENDING

Protected scope snapshot SHA-256: PENDING

Article IDs: PENDING

Canonical source: [prewrite-plan.json](prewrite-plan.json)

View mode: `DETERMINISTIC_RENDERED_READ_ONLY`

This file is the owner-facing rendering of the structured manifest. Do not manually re-enter, amend, or silently diverge from values here: change the JSON, regenerate this view, then bind both hashes for owner confirmation. It freezes scope and a model-led editorial direction; it is not article prose and does not replace W's integrated evidence research after confirmation. The normal execution path is `CONTINUOUS_CAMPAIGN_MAIN_SESSION` with `MAIN_SESSION_PATH_ISOLATED`: each confirmed article uses only `articles/<article_id>/{context,research,canonical,reviews,handoff}`.

## Campaign strategy

- Shared scope, reader-value and CTA constraints, evidence boundary, parallel article strategy, and owner decisions:

## Per-article plans

Render one compact card for every `article_plans[]` item. Use its `evidence_refs` and the shared evidence-pack ID instead of copying source text, keyword lists, metadata, image Alt/caption detail, or non-contract CTA claim prose into multiple artifacts. The frozen CTA declaration itself remains visible and exact. Mark an unavailable item `UNVERIFIED` with the supporting evidence reference and risk; do not invent it.

### {{ARTICLE_ID}}

1. **Task and audience** — language, market, reader task, content type, and scope boundary. Show the frozen delivery mapping: article language, market, platform, safe account alias, audience-fit mode, and any exact owner-confirmed cross-language exception.
2. **Frozen topic slot** — G freezes the reader task, core intent, market, differentiation angle, and concrete prohibited deviations. It is the boundary for W's evidence-led keyword, natural-variant, and title work; it is not a frozen keyword or headline.
3. **Reader value and secondary CTA** — the useful result a reader receives without relying on the CTA; the required secondary recommendation's exact visible anchor text, product identity/current destination, evidence basis, reader-task relevance, relationship disclosure, and non-claims. Render the frozen declaration exactly.
4. **Model-led editorial brief** — one coherent research-and-writing route: long-tail reader problem and localization hypothesis, source boundary, likely title/outline, visual approach, differentiation from sibling articles, and how the article will remain useful without the CTA. This is a reasoned plan, not nine independently gated form fields.
5. **Research posture** — `METHOD_TEMPLATE_NO_EXECUTION` or `DOCUMENTED_EMPIRICAL_RECORD`, the reader-facing claim boundary, and any required evidence paths. A method template is not an observed test result.
6. **Risks and owner decisions** — unresolved choices, assumptions requiring confirmation, and non-negotiable exclusions.
7. **Quality route** — default `AUTHOR_QA_INTEGRATED / WQ_SHARED_CONTEXT` means the same visible W completes `CANDIDATE_LOCK → ADVERSARIAL_SELF_QA → TARGETED_REPAIR → FINAL_BIND` and records `AUTHOR_QA_READY`; it is not an independent R approval. `INDEPENDENT_R_ESCALATION / WR_INDEPENDENT` requires a separately registered R and a `FULL_REVIEW`; it may add an early research review only when the frozen WR risk requires it. WQ may only escalate to WR with stable trigger IDs; it never silently downgrades.

## Owner decision

- [ ] OWNER_PREWRITE_PLAN_CONFIRMED — permits G to lock requirements, create the article's isolated artifact path, and dispatch the per-article WQ or WR route.
- [ ] OWNER_PREWRITE_PLAN_CHANGES_REQUESTED — revise this dossier; do not dispatch article paths, W, or R.

After a confirmation, save its original message/file under `evidence/owner-confirmations/` and run `confirm-prewrite-plan`. Never set the confirmation status or ID by editing JSON; then use `dispatch-readiness` to distinguish a structurally valid workspace from one that may start WQ or WR.

Git worktree is not the normal dispatch result. Use it only when the recorded `worktree_dispatch_decision` names `TRUE_CONCURRENT_WRITE`, `HIGH_RISK_REWRITE_OR_ROLLBACK`, or `OWNER_REQUESTED_GIT_ISOLATION`; capacity or token-saving alone is never a reason.

The confirmation binds the rendered view, its JSON source, and the protected delivery/topic-slot/claim-posture snapshot. It does not approve article research, canonical prose, images, or a hand-off package.
