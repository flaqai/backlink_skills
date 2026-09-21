# Campaign shared-evidence contract

Use `evidence/shared/campaign-evidence-pack.json` only when a real, bounded, read-only observation can be reused inside the same confirmed content project. It is an immutable source pack, not a research conclusion, platform-selection authority, or permission to widen scope. Each record retains its ID, source URL/path, observation time, scope, query or page context, content hash when available, and an exact reuse key.

An article that actually uses one or more records declares `campaign_shared_evidence` with the pack `path`, `sha256`, and exact `record_ids`, then records its own `article_delta` with `decision`, `freshness_or_scope_check`, and `additional_evidence_refs`. Do not copy shared conclusions into a new article record. If there is no exact reusable record, omit both declarations and perform ordinary article research; never create an empty shared pack, empty citation, or empty rejection record.

## Exact reuse keys

| Record kind | A hit requires | Article-only work that remains |
| --- | --- | --- |
| `GLOBAL_ENGLISH_TRENDS` | Same `english_concept_id`, English seed/candidate set, observation date, and Trends window. A different concept, candidate set, date, or window is a miss. This optional record is absent when data is insufficient or inconclusive. | Select the long-tail reader problem and record the English-to-target-market rationale. Trends remains global relative-interest context, not local-demand, volume, popularity, commercial-intent, or momentum evidence. |
| `BRAND_SITE_VARIANT` | Same target locale and reader intent, a current public brand page, and a fresh recheck or explicitly valid-through date. | Record adoption or evidence-based rejection for this article's wording. Brand ownership alone does not prove naturalness. |
| `REGIONAL_SERP_VARIANT` | Exact locale, market, reader intent, query context, and dated SERP observation. Any locale, market, intent, query, or stale-observation change is a miss. | Record the selected natural variant, rejected literal translations, and this article's intent rationale. |

## Never-reuse class

Never reuse a record for product capability/availability, price, quota, performance, rankings, comparative results, current policy, moderation outcome, registration/login/OAuth/session state, account eligibility, editor behavior tied to an account or theme, or platform language support. `MODEL_TRANSLATION_FALLBACK` is also always article-specific because it follows that article's two dated regional-SERP no-consensus checks.

When a record is stale, mismatched, inaccessible, contradicted, or lacks a clear scope, mark the proposed use `UNVERIFIED` in the article delta and collect fresh evidence. Do not silently substitute a nearby variant, platform, account, locale, market, or record ID.

## Role boundary and review cost

- G may cite a shared record in the pre-write plan only as known evidence or a research lead. It still needs owner confirmation before an article artifact path is created, and shared evidence can never select, lock, replace, or validate a platform/account pair.
- W verifies the exact key, records only the article-level difference and required freshness check, and gathers all non-reusable or fresh evidence. A cited source never turns into `RESEARCH_READY` by itself.
- R independently judges the receiving article's use. For a cited pack, R reads the exact cited records plus that article's `article_delta`; it does not reload unrelated records from the whole shared pack. This is not a new role, review round, or shared W/R conversation memory.
- G checks only that a declared pack/hash/record-ID reference remains in confirmed scope. A changed shared-pack hash must not silently modify an approved article; only articles that cite the affected record follow the applicable R delta or full-review path.
- The campaign operations steward may reuse only durable public format facts under the platform-profile rules. It refreshes campaign-specific, login/account, policy, price, and locale-support facts for the current project.

## Compact record minimum

Each shared record has `id`, `kind`, `status`, `source`, `observed_at`, `scope`, `query_or_page_context`, `valid_through_or_recheck`, `evidence_path`, and its exact reuse key. The pack itself is hash-bound. A receiving article stores the pack hash and IDs once, not copied source text or a second cache conclusion.
