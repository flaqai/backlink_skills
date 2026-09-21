# Owner Platform Selection Lock

This lock prevents a workflow from treating its own candidate discovery, activation note, configuration, or platform-login evidence as owner authorization.

## Three separate questions

1. **Audience fit:** Does the source-listed platform's primary reader language and market match the frozen article language and market? The matching researcher records public audience evidence; editor/UI language, historical English posts, or the ability to paste English are transport facts, not audience evidence.
2. **Recommendation:** Which source-listed platform best matches the frozen article language, market and format? Only the visible reusable `CAMPAIGN_PLATFORM_MATCHING_RESEARCHER` answers this in `platform-matching-proposal.json`.
3. **Selection:** Which exact `{article_id, platform, account}` pair did the owner confirm from that proposal? Only a receipt in `owner-platform-selection.json` can answer this.
4. **Transport eligibility:** Can that selected platform carry the frozen language and format? Only then may a read-only `locale_platform_validation` record answer this.

G never answers audience fit, recommendation or selection: it creates/resumes the matching subagent, checks its source bounds, and obtains the owner's confirmation. Transport eligibility never answers audience fit, recommendation or selection. A login announcement, OAuth option, registration page, platform preflight, browser recovery result, public sample, prior campaign, or generated configuration is not an owner-selection source.

## Required lock contents

Place each owner-originated input artifact inside `evidence/owner-selection/` and record its SHA-256. Supported source types are `OWNER_XLSX`, `OWNER_TABLE`, and `OWNER_MESSAGE`. Each pair receipt must contain:

- `article_id`, `platform`, and a safe `account` alias;
- the frozen `article_language`, `market`, exact `mapping_confirmation_literal`, and `fit_mode`;
- for `PRIMARY_AUDIENCE_MATCH`, the matching proposal's primary-audience evidence; for `CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED`, the exact exception literal and confirmation ID the owner supplied;
- `source_id`, exact `source_locator`, and the source's platform literal;
- the exact owner-confirmed account-alias wording and an `owner_confirmation_id`;
- `status: EXPLICITLY_CONFIRMED`.

The lock must also reference the matching proposal's path, SHA-256, visible subagent task ID and researcher role. Its proposal row separates `primary_reader_languages` / `primary_reader_markets` / `primary_audience_evidence_path` from `transport_supported_content_languages` / `transport_evidence_path`. Set the lock's `status` to `OWNER_CONFIRMED`, calculate its SHA-256, and place that value in `campaign.json.platform_scope.selection_lock.sha256`. The campaign validator requires the lock hash, each source artifact hash, the proposal hash, the audience/transport distinction, and exact equality between proposal, receipts, `allowed_pairs`, and article assignments.

## Required behavior when a receipt is absent

The matching subagent records `NO_RECOMMENDATION_OWNER_DECISION_REQUIRED`. G does not select a candidate, look for a replacement, infer an account, or write a provisional mapping into `campaign.json`. A wide instruction such as “new languages” or “no duplicate platforms” constrains the subagent's source-bounded research and the owner's later confirmation; it does not create one.
