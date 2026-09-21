# Campaign contract

The harness creates `campaign.json`, `state.json`, `prewrite-plan.json`, generated `prewrite-plan.md`, `confirmation.md` and `requirements-contract.md`. `campaign.json` is structured frozen owner intent; `prewrite-plan.json` is the canonical editable per-article manifest; `prewrite-plan.md` is its deterministic read-only owner-facing rendering created by `sync-prewrite-plan`; `requirements-contract.md` is G's stable-ID record of requirements explicitly confirmed by the owner; `state.json` is durable workflow progress. Never hand-maintain the plan in both JSON and Markdown, and never put credentials, session data, browser fingerprints or access tokens in any of them.

New workspaces use schema `2.14`. The checker may read schema `1.0` through `2.13` under their historical contracts; older workspaces must not be silently relabeled. Schema 2.14 keeps human-native release, owner scope, CTA, topic, shared evidence, single-source payload and path-isolated main-session rules, while adding truthful WQ/WR quality routes. Default WQ is an author same-context QA receipt; WR is a separate independent R full review. Schema 2.13's standard route always meant independent R and remains historical. Each article has deterministic `articles/<article_id>/` artifact root; Git worktrees are recorded exceptions. `cta.mode = NONE` is schema-2.1 historical compatibility only.

## Pre-write plan contract

G begins in `prewrite_planning`. Before any article artifact path, W, R, article queue, outline, prose, image generation, canonical package or article-research role exists, G gathers and reports a pre-write dossier. It is a read-only research protocol and known-evidence summary, not a completed W research package; it must identify uncertainty and may not declare `RESEARCH_READY` or `RESEARCH_APPROVED`.

Canonical `prewrite-plan.json` and generated `prewrite-plan.md` cover every configured `article_id` once. In schema-2.14 the JSON manifest is schema `1.8` and remains the only editable plan source; run `sync-prewrite-plan` after changes. One `campaign_strategy` and each article's four sections (`task_and_audience`, `reader_value_and_secondary_cta`, `editorial_brief`, `risks_and_owner_decisions`) include frozen delivery mapping, `topic_slot`, evidence posture and `review_effort`. The slot freezes reader task, intent, market, angle and prohibited deviations—not literal keyword/title wording. Consolidate keyword/localization, fact boundaries, structure, visual narrative and delivery assumptions. Shared reference only on actual bounded reuse. Default is `AUTHOR_QA_INTEGRATED / WQ_SHARED_CONTEXT / INTEGRATED_IN_AUTHOR_QA` with no risk reason. `INDEPENDENT_R_ESCALATION / WR_INDEPENDENT` requires owner request or concrete risk reason; optional `SEPARATE_RESEARCH_REVIEW_REQUIRED` only for WR pre-draft risk. Schema-2.13 and 2.11/2.12 plans remain manifest schema `1.7` but preserve their own historic route semantics; older manifest versions remain their historical contract. `UNVERIFIED` states the check and risk, never invents evidence.

G presents the dossier and moves to `awaiting_owner_prewrite_confirmation`. Only explicit `OWNER_PREWRITE_PLAN_CONFIRMED` permits article-path provisioning. Preserve the original receipt under `evidence/owner-confirmations/` and use `confirm-prewrite-plan`; bind confirmation ID, exact article IDs, plan hashes, protected scope snapshot/hash, receipt path/hash, locator and timestamp across campaign records. Before WQ/WR editorial dispatch, every article needs an owner-confirmed distinct `{platform, account}` assignment and compatible audience/transport row. Changes to article language, market, platform, account, fit mode, cross-language exception, `topic_slot` or evidence posture invalidate the binding. `sync-prewrite-plan` returns `SCOPE_RECONFIRM_REQUIRED` without overwriting receipt; explicit invalidation returns to owner confirmation. `OWNER_PREWRITE_PLAN_CHANGES_REQUESTED` never authorizes partial dispatch.

This creates no second article-research role. After owner confirmation, W integrates keyword, source and cross-language research with draft, visuals and payload. In WQ, the same W locks candidate, adversarially self-checks evidence and final content, repairs actual findings and binds the final hash receipt as `AUTHOR_QA_READY`; it is not an independent `APPROVED`. In WR, distinct visible R independently reviews article evidence, exact shared citations and final source chain in `FULL_REVIEW`. Before either final quality route, W runs `check-review-ready` to remove only mechanical drift; a pass is not an editorial verdict. HTML is the semantic primary, Markdown joins only on `COMPANION_DUAL_READ_REQUIRED`. Only an explicitly risky WR route adds R's `RESEARCH_APPROVED` before drafting. WQ may only escalate one way with recorded trigger IDs; no role automatically downgrades it.

`blog-3p-writer` is the sole executable W for that integrated research, drafting, packaging and repair. `blog-writer-merged` is an editorial-core reference only; it must not create a second research pass, canonical package or W lane.

## Shared evidence cache

Read [shared-evidence-cache.md](shared-evidence-cache.md) whenever a campaign wants to reuse a read-only observation. Reuse reduces repeated collection; it does not replace the pre-write plan, owner confirmation, W's integrated research, R's independent approval, or article-specific evidence. A current workspace uses an immutable, campaign-local pack only for actual reusable records. The receiving `research/evidence-pack.json` may then declare `campaign_shared_evidence.path`, `.sha256`, `.record_ids` and `article_delta.decision`, `.freshness_or_scope_check`, `.additional_evidence_refs`; if neither object is present, no empty cache is required. When optional `GLOBAL_ENGLISH_TRENDS` context is recorded, only an exact concept/seed/date/window match may be shared; it never becomes demand, popularity, or momentum proof. Brand wording requires the same locale and intent plus freshness; and regional-SERP wording requires the exact locale, market and intent. Volatile claims, policy, login/account state, price, performance and translation fallback are always fresh/article-specific.

Shared platform evidence is never owner-selection authority. Before article lanes begin, the owner still confirms the proposal and exact `{platform, account}` mapping. A durable public format observation may be reused only under the platform-profile cache rules; current campaign policy, login/account and locale-support facts must be refreshed. R reads only the article's cited records plus its delta rather than the whole shared pack; this does not add a role or review round.

Required safety fields:

- `prewrite_plan_policy.mode = CAMPAIGN_G_SCOPE_AND_EDITORIAL_BRIEF`
- `prewrite_plan_policy.required_before_article_dispatch = true`
- `prewrite_plan_policy.owner_confirmation_required = true`
- `prewrite_plan_policy.report_path = prewrite-plan.md`
- `prewrite_plan_policy.manifest_path = prewrite-plan.json`
- `prewrite_plan_policy.canonical_source = prewrite-plan.json`
- `prewrite_plan_policy.owner_view_mode = DETERMINISTIC_RENDERED_READ_ONLY`
- `prewrite_plan_policy.manual_duplicate_entry = PROHIBITED`
- `prewrite_plan_policy.sync_command = sync-prewrite-plan`
- `prewrite_plan_policy.allow_article_roles_before_confirmation = false`
- `prewrite_plan_policy.standalone_article_research_role = PROHIBITED`
- `prewrite_plan_policy.writer_research_remains_required = true`
- `keyword_research_policy.mode = WRITER_CONTINUOUS_LONG_TAIL_AND_REGIONAL_SERP`
- `keyword_research_policy.required_within_writer_continuous_turn_before_claims = true`
- `platform_scope.source = OWNER_SELECTION_LOCK_ONLY`
- `live_execution_profile.mode = HUMAN_RELEASE_ONLY_V1`
- `release_policy.mode = HUMAN_NATIVE_ONLY`
- `release_policy.machine_external_writes_allowed = false`
- `platform_scope.allowed_pairs = exact owner-supplied pairs before W/R dispatch`
- `platform_scope.automatic_discovery_or_expansion = false`
- `release_policy.machine_external_writes_allowed = false`
- `cross_language_seo.variant_priority_order = [CURRENT_BRAND_SITE, REGIONAL_SERP, MODEL_TRANSLATION_FALLBACK]`
- `cross_language_seo.google_trends_seed_language = ENGLISH_ONLY` when optional Google Trends context is recorded; its absence or an inconclusive result does not block the brand-site/region-SERP route.
- `orchestration_policy.delegation_default = VISIBLE_SUBAGENTS`
- `orchestration_policy.visible_task_record_required = true`
- `orchestration_policy.invisible_cli_agent_sessions = PROHIBITED`
- `orchestration_policy.writer_reviewer_pair_mode = REUSABLE_WQ_WR_WITH_ARTICLE_ARTIFACT_ISOLATION`
- `orchestration_policy.cross_article_agent_reuse = CAMPAIGN_WQ_WR_G_REUSE_ALLOWED`
- `orchestration_policy.operations_steward_mode = ONE_REUSABLE_CAMPAIGN_OPERATIONS_STEWARD`
- `orchestration_policy.persistent_requirements_gatekeeper = true`
- `orchestration_policy.fresh_agent_roles = []`
- `orchestration_policy.pair_activation = G_QUEUE_SUBJECT_TO_RUNTIME_CAPACITY`
- `orchestration_policy.execution_session = CONTINUOUS_CAMPAIGN_MAIN_SESSION`
- `orchestration_policy.execution_isolation = MAIN_SESSION_PATH_ISOLATED`
- `orchestration_policy.article_artifact_root_template = articles/{article_id}`
- `orchestration_policy.article_artifact_roots = REQUIRED_DISJOINT`
- `orchestration_policy.worktree_autospawn = EXPLICIT_EXCEPTION_ONLY`
- `orchestration_policy.worktree_dispatch_decision = REQUIRED_FOR_GIT_WORKTREE_ONLY`
- `orchestration_policy.worktree_allowed_reasons = [TRUE_CONCURRENT_WRITE, HIGH_RISK_REWRITE_OR_ROLLBACK, OWNER_REQUESTED_GIT_ISOLATION]`
- `orchestration_policy.worktree_fallback = NOT_APPLICABLE_MAIN_SESSION_PATH_ISOLATED`
- `orchestration_policy.silent_worktree_fallback = false`
- `orchestration_policy.article_worktree_role_bundle = REUSABLE_WQ_WR_PLUS_SHARED_CAMPAIGN_G`
- `orchestration_policy.project_worktree_root_role = ARTICLE_ARTIFACT_ROOT`
- `orchestration_policy.campaign_gatekeeper_scope = PREWRITE_BATCH_CONTRACT_AND_BATCH_PUBLIC_QA`
- `orchestration_policy.article_public_gate_mode = REUSE_REGISTERED_CAMPAIGN_GATEKEEPER_BATCH_READONLY`
- `orchestration_policy.batch_gate_policy.mode = CAMPAIGN_G_BATCH_CONTRACT_ACCEPTANCE`
- `orchestration_policy.batch_gate_policy.input = CURRENT_FINAL_QUALITY_READY_ARTICLE_ROWS_ONLY`
- `orchestration_policy.batch_gate_policy.quality_credential = ROUTE_TRUTHFUL_WQ_OR_WR_RECEIPT`
- `orchestration_policy.public_qa_policy.mode = REUSE_REGISTERED_CAMPAIGN_GATEKEEPER_BATCH_READONLY`
- `orchestration_policy.public_qa_policy.requires_human_acceptance = true`
- `orchestration_policy.public_qa_policy.human_return_receipt = STRUCTURED_REQUIRED`
- `orchestration_policy.public_qa_policy.public_snapshot = NORMALIZED_READONLY_REQUIRED`
- `orchestration_policy.public_qa_policy.fresh_public_reviewer = PROHIBITED`
- `orchestration_policy.public_qa_policy.automatic_wr_reopen = false`
- `orchestration_policy.public_qa_policy.human_transport_fix_recheck = SAME_CAMPAIGN_G_BATCH_ONLY`
- `orchestration_policy.public_qa_policy.canonical_change_reopen = OWNER_EXPLICIT_REQUEST_ID_REQUIRED`
- `orchestration_policy.public_qa_policy.accepted_platform_limitation = EVIDENCE_SCOPED_NOT_GENERALIZABLE`
- `orchestration_policy.public_qa_policy.unverified_retry_budget = 1`
- `orchestration_policy.public_qa_policy.on_mismatch = CLASSIFY_BEFORE_OWNER_DECISION`
- `orchestration_policy.queue_resume_policy = MAIN_SESSION_SEQUENTIAL_OR_SAFE_PATH_BATCH`
- `article_platform_assignment.mode = ONE_ARTICLE_ONE_DISTINCT_PLATFORM`
- `article_platform_assignment.required_before_editorial_dispatch = true`
- `article_platform_assignment.platform_reuse_across_articles = PROHIBITED`
- `article_platform_assignment.pair_reuse_across_articles = PROHIBITED`
- `locale_platform_validation.mode = ARTICLE_LANGUAGE_MARKET_PRIMARY_AUDIENCE_EVIDENCE`
- `locale_platform_validation.required_before_editorial_dispatch = true`
- `locale_platform_validation.article_language_source = USER_CONFIRMED_ARTICLE_LANGUAGE_ONLY`
- `locale_platform_validation.platform_language_role = TRANSPORT_ELIGIBILITY_ONLY_NEVER_REWRITE_LANGUAGE`
- `locale_platform_validation.transport_evidence_is_not_audience_fit = true`
- `locale_platform_validation.cross_language_exception_requires_explicit_owner_confirmation = true`
- `title_quality_policy.mode = MODEL_LED_SEMANTIC_REVIEW`
- `title_quality_policy.required_before_review = true`
- `title_quality_policy.heuristics.non_blocking = true`
- `content_value_policy.mode = READER_VALUE_FIRST`
- `content_value_policy.primary_purpose = STANDALONE_ANSWER_TO_READER_TASK`
- `content_value_policy.cta_role = REQUIRED_SECONDARY_TRANSPARENT_RECOMMENDATION`
- `content_value_policy.cta_must_be_present = true`
- `content_value_policy.cta_requires_identifiable_product_and_claim_basis = true`
- `content_value_policy.cta_requires_relationship_disclosure_when_applicable = true`
- `content_value_policy.cta_must_not_replace_or_dominate_reader_value = true`
- `artifact_optimization_policy.mode = CANONICAL_MANIFESTS_AND_DELTA_CONTEXT`
- `platform_style_research_policy.mode = ON_DEMAND_IN_SCOPE_PROFILE`
- `platform_style_research_policy.attempt_before_drafting = false`
- `platform_style_research_policy.trigger = CACHE_MISS_AND_MATERIAL_READER_TRANSPORT_RISK`
- `artifact_optimization_policy.prewrite_manifest_schema = 1.8`
- `topic_governance_policy.mode = G_FREEZES_TOPIC_SLOT_W_EVIDENCE_BOUNDARY`
- `research_integrity_policy.mode = EVIDENCE_LAYER_SEPARATION_AND_CLAIM_POSTURE`
- `research_integrity_policy.platform_profile_use = TOPIC_FRAMING_OR_FORMAT_ONLY`
- `artifact_optimization_policy.model_owned_research_record = ONE_EVIDENCE_PACK_WITH_DERIVED_VIEWS`
- `artifact_optimization_policy.review_route = AUTHOR_QA_INTEGRATED_UNLESS_WR_ESCALATED`
- `artifact_optimization_policy.quality_routes.default = AUTHOR_QA_INTEGRATED`
- `artifact_optimization_policy.quality_routes.independent_r_escalation = INDEPENDENT_R_ESCALATION`
- `artifact_optimization_policy.quality_routes.author_qa_receipt = reviews/author-qa-N.json`
- `artifact_optimization_policy.quality_routes.wq_late_change = RERUN_AUTHOR_QA_OR_ESCALATE_WR`
- `artifact_optimization_policy.final_artifact_review.default = AUTHOR_QA_COVERS_FINAL_PAYLOAD`
- `artifact_optimization_policy.final_artifact_review.independent = FULL_REVIEW_COVERS_FINAL_PAYLOAD`
- `model_first_execution_policy.mode = MODEL_CONTINUOUS_CREATION_WITH_DUAL_QUALITY_ROUTES`
- `model_first_execution_policy.default_review_tier = AUTHOR_QA_INTEGRATED`
- `model_first_execution_policy.author_qa_protocol = CANDIDATE_LOCK_ADVERSARIAL_SELF_QA_TARGETED_REPAIR_FINAL_BIND`
- `model_first_execution_policy.independent_final_review = REQUIRED_ONLY_FOR_WR`
- `model_first_execution_policy.independent_r_escalation = RISK_OR_OWNER_TRIGGERED_ONLY`
- `model_first_execution_policy.separate_research_review = WR_RISK_TRIGGERED_ONLY`
- `model_first_execution_policy.wq_to_wr_downgrade = PROHIBITED`
- `artifact_optimization_policy.article_context.path = articles/{article_id}/context/article-contract.json`
- `artifact_optimization_policy.review_index.path = articles/{article_id}/reviews/review-index.json`
- `artifact_optimization_policy.review_delta.schema_version = 1.0`

### Historical schema-2.12-and-earlier per-article role/worktree ledger

`state.json.orchestration.tasks[]` is the durable visibility ledger. Each independent role records its visible agent identity, `article_id` where applicable, bounded input paths, expected and actual output paths, timestamps, status and recovery instruction. While the pre-write plan is not `OWNER_PREWRITE_PLAN_CONFIRMED`, it must contain no `ARTICLE_WRITER` or `ARTICLE_LANGUAGE_REVIEWER`; its article queue, article agents, article worktrees and active article pairs must all be empty. In schema 2.9 (historical), the same prohibition holds until every article also has its owner-confirmed distinct platform/account assignment and compatible locale-platform row. `state.json.orchestration.article_agents[article_id]` holds that article's sole `ARTICLE_WRITER` and `ARTICLE_LANGUAGE_REVIEWER`; the pair is reused for the article's drafting, repair, full R and R-Δ only. `reviews/review-index.json` records the frozen review route, dynamic finding lineage, and latest review paths/hashes with that same reviewer ID; frozen `article-contract.json` never carries a live finding snapshot. Before a schema-2.9 hand-off, every route requires R's visible `FULL_REVIEW`; only `ELEVATED_EARLY_CHALLENGE` additionally requires `RESEARCH_REVIEW`. In the standard route, `NOT_REQUIRED / INTEGRATED_IN_FULL_REVIEW` records that research is covered by the full review. The full review binds its report, R ID, canonical article, metadata, visual manifest, visual payload and article-package hashes; it also binds the evidence-pack hash for the standard route. A derived handoff manifest can be finalized after R only when a repeat render is byte-identical to the already reviewed payload; a different candidate must be compiled before its R-Δ/full-R route rather than overwritten during manifest creation. A completed `VISUAL_PAYLOAD_DELTA` row is required only if one of the visual manifest, payload or package changed after that full review; it binds the same final hashes and reviewer. W maintains one per-article `requirements-traceability.md` mapping applicable `REQ-*` IDs to canonical and visual-payload evidence; it is not a verdict. R owns complete article quality, including SEO and title/localization judgment, and verifies those paths exist. Persistent G accepts only the owner-contract mapping after R approval in a `BATCH_GATE_ACCEPTANCE` record with one hash-bound article row; its own findings use `REQUIREMENT-*` and do not duplicate R's quality findings. After a human return, `state.json.publication.articles[article_id]` records URL, human state, timezone-aware return time, campaign-local receipt/snapshot/report paths, the registered campaign-G ID, batch/entry IDs and hash, attempt, bounded `unverified_retry_count`, owner request ID and public-QA outcome. The receipt, snapshot and report must exist and bind the same article/URL; a `PUBLIC_QA_BATCH_READONLY` task row binds the same registered G ID, exact article IDs, timestamp and report. `HUMAN_NEEDS_FIX` is never completion. After `HUMAN_ACCEPTED`, that same campaign G writes a per-article row in `public-qa-batch-report.json`; it does not create a public role or invoke W/R. It classifies `PUBLIC_QA_PASSED`, `PUBLIC_QA_PASSED_WITH_LIMITATION`, `HUMAN_TRANSPORT_FIX_REQUIRED`, `PUBLIC_QA_UNVERIFIED`, or `CANONICAL_CHANGE_REQUESTED`; only the last needs an explicit owner request ID and can reopen W/R. A W/R task after the receipt timestamp is forbidden unless its `workflow_stage` is `CANONICAL_REOPEN` and it carries that same owner request ID. `service_agents.campaign_operations` holds one visible, campaign-scoped `CAMPAIGN_OPERATIONS_STEWARD`, reused for read-only platform readiness, evidence collection, session recovery and bounded technical investigation; it never writes externally, chooses platforms, drafts articles or decides quality. Resume it with its recorded evidence rather than creating phase-named preflight/registration/recovery agents. `article_queue[]` schedules pairs only after the current runtime slots are full. `orchestration.capacity{available_slots,active_article_pairs,active_article_worktrees,spawn_policy,last_dispatch_at}` records dispatch capacity. Local CLI commands may perform deterministic mechanics only; a detached CLI conversation or background agent is never a valid W/R/G/Probe record.

For a historical schema-2.12 record, the preceding compatibility wording is narrowed: every article must additionally have an owner-confirmed primary-audience/transport row and protected scope snapshot. `PRIMARY_AUDIENCE_MATCH` is mandatory unless the selection receipt carries the exact `CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED` wording and ID. A transport-language observation, historical English content, or UI language cannot satisfy the primary-audience condition. The R `FULL_REVIEW` checks the article evidence pack's `topic_slot_alignment`, `reader_intent_basis`, bounded `platform_profile_use` and `evidence_posture`; when shared evidence is present, it checks only the cited `campaign_shared_evidence` records plus `article_delta`. This adds no default review or research task. An unresolved `TOPIC_EVIDENCE_CONFLICT` stops before full review; a resolved `KEEP_SLOT` / `NARROW_WITHIN_SLOT` conflict needs one matching `TOPIC_EVIDENCE_DECISION` in the registered G's existing visible task ledger.

For schema-1.5 `article-package.json`, “visual payload” means the compiler-owned HTML/Markdown pair generated only from package-declared canonical, metadata, evidence pack and visual manifest under `articles/<article_id>/`. Current WQ `AUTHOR_QA_READY` or WR `FULL_REVIEW` binds both hashes; HTML is the semantic primary, Markdown joins only on `COMPANION_DUAL_READ_REQUIRED`. Each image has ordered `<!-- BLOG_3P_IMAGE:NN -->` marker, corresponding HTML/Markdown cards and hash-matched numbered PNG/JPG/JPEG asset. Repeat render must be byte-identical before handoff; package 1.4 is historical compatibility only.

## Current schema-2.14 execution and path-isolation contract

The normal dispatch creates one `article_workspaces[article_id]` record with `isolation: MAIN_SESSION_PATH_ISOLATED` and deterministic `artifact_root: articles/<article_id>`. Its `context`, `research`, `canonical`, `reviews` and `handoff` children are disjoint from other articles. `CONTINUOUS_CAMPAIGN_MAIN_SESSION` allows visible W reuse across ordinary WQ articles; independent R is activated only on WR and never shares the same identity as that article's W. Each route uses its own contract/index/evidence, with WQ `AUTHOR_QA_READY` and WR independent `APPROVED` as distinct credentials. G remains the single campaign control plane.

A record may instead use `isolation: GIT_WORKTREE` only with `worktree_dispatch_decision.reason = TRUE_CONCURRENT_WRITE | HIGH_RISK_REWRITE_OR_ROLLBACK | OWNER_REQUESTED_GIT_ISOLATION`. A worktree cannot be created simply to fill runtime capacity, reduce token use, or compensate for a busy main session. Every normal article path remains valid without a worktree.

### Historical worktree-first behavior (schema-2.12 and earlier)

Three independent properties must never be conflated: a **visible child task** makes work observable, a **reusable W/R article pair** preserves that article's editorial context and decisions, and a **Git project worktree** isolates its files and Git state. The registered campaign G is a separate shared control plane. One property does not imply either of the others.

Only after the pre-write plan is confirmed and hash-bound may an article W/R pair be ready. When the host exposes a Git-project worktree capability and two or more independent article pairs are ready, G must create one visible project-worktree task per article before its first W turn. Its root role is `ARTICLE_WRITER_REVIEWER_PAIR`; W and R never work concurrently on the same article. The campaign G remains the only global owner of frozen scope, campaign queue and consolidated state; it reads the pair's compact contract/review records without repeating article-quality review. A plain child agent in the parent checkout, or a W-only project task, does not satisfy this rule. Register the worktree in `state.json.orchestration.article_workspaces[article_id]` with `isolation: GIT_WORKTREE`, `status: PROVISIONING|READY`, the visible `task_thread_id`, worktree path when exposed, base ref, and a `role_bundle` containing the shared campaign G plus the article W and R IDs. Treat a provisioning-only client identifier as not ready until the host reports a usable task/worktree.

If the host cannot create a project worktree, record `isolation: SHARED_WORKSPACE`, `status: WORKTREE_UNAVAILABLE`, the capability/error reason, and the explicit fallback `VISIBLE_SHARED_WORKSPACE_WITH_PATH_ISOLATION`. That fallback is permitted only when every article has disjoint bounded input/output paths; it must never be described as a worktree. If paths overlap or isolation is needed for conflicting changes, mark the affected article `WORKTREE_ISOLATION_BLOCKED` and queue it rather than risking cross-article changes. When a slot frees, G provisions the next ready article worktree before dispatching its W/R pair.

### Current schema-2.14 release mapping and handoff rules

For every current human-native release, `articles[]` and `article_platform_assignment.assignments[]` must have the same article IDs, exactly once each before W/R dispatch. Each assignment is an object `{article_id, platform, account}` and must exactly match an `allowed_pairs` object. Platform names and platform/account pairs are unique across the batch; no automatic or cross-article reassignment exists.

`locale_platform_validation.rows[]` must likewise cover every current article exactly once before W/R dispatch. A row matches the frozen article `language` and `market` plus its platform/account assignment, records `primary_reader_languages`, `primary_reader_markets` and `primary_audience_evidence_path`, separately records `transport_supported_content_languages` and `transport_evidence_path`, and declares `PRIMARY_AUDIENCE_MATCH` or the exact owner-confirmed `CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED`. Transport language is a rejection/eligibility signal only; it may never prove primary audience fit or rewrite the article language.

Every locked article supplies `focus_keyword` and non-empty `reader_value_promise`; schema `2.2+` also requires `cta.mode = SECONDARY_RECOMMENDATION` with exact visible anchor, product, destination, claim evidence, reader-task relevance and relationship disclosure (`NOT_APPLICABLE` only absent material relationship). In current schema-2.14, `article-package.json@1.5` retains frozen declarations and one-way pointers to canonical, metadata, evidence pack and visual manifest. Metadata alone supplies platform/SEO titles; the package never duplicates them, links, images or outbound handoff pointer. The mechanical checker verifies mappings without scoring prose. These fields never license invented reliability, ranking, tests, availability or outcomes. WQ author-QA or WR independent R judges standalone reader value, truthful/proportionate secondary CTA, and canonical/platform/SEO title quality against task, clarity, distinct value, natural language and market fit. G checks only frozen mapping. No CTA density/count or word-ratio requirement; lengths and literal coverage are advisory. Platform title defaults to canonical title unless a user-approved constraint says otherwise. Public heading hierarchy is judged only from rendered reader-page visuals after `HUMAN_ACCEPTED`. Schema-2.13/1.5 and earlier retain historical independent-R compatibility.

In current schema 2.14, an empty platform list, missing assignment, reused pair, missing audience/transport row or unconfirmed cross-language exception blocks editorial dispatch. A human-native release target matches one exact owner-confirmed allowed pair. Historical schema 2.13 and older data retain their own rules and cannot enter the current dispatch route without explicit migration.
