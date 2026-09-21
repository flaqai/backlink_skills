# In-Scope Platform Style Profiles

This optional, read-only step improves reader fit and hand-off reliability without turning platform samples into SEO evidence or a publication automation. In current schema-2.14 it is `ON_DEMAND_IN_SCOPE_PROFILE`: run it only after the owner has receipt-confirmed G's pre-write plan, the exact `{platform, account}` mapping is owner-confirmed for the required human-release item, **and** there is both no reusable matching profile and a material reader-facing transport risk. It is never a default pre-draft task or a second execution mode.

Read the [shared-evidence cache contract](../skills/blog-3p-harness/references/shared-evidence-cache.md) before reusing an observation. A profile cache reduces repeated public inspection; it does not select a platform, create an account alias, prove account eligibility, replace owner confirmation, or alter the article's locale, reader intent, CTA, or scope.

## Status and boundary

- Use `READY` only when the record contains dated public samples and observable evidence.
- Use `UNVERIFIED` when samples are unavailable, incomplete, private, not comparable, or their signal is uncertain. Continue with a conservative generic structure.
- Do not search for or add platforms, accounts, topics, or alternatives. Do not log in, operate editors, upload, publish, or infer private/editor behavior from public samples.
- A visible featured label or public interaction count may be recorded as a scoped signal; otherwise never describe a sample as popular or successful, and never use any platform sample to establish a keyword, natural variant, search intent, local demand or topic demand.
- Never copy sample titles, prose, structure, argument flow, imagery, interaction statistics, or claims.
- A cache miss without a material title/body, link, image, list, metadata, or reader-visual risk is not a reason to collect samples. Continue with the conservative generic delivery structure.

## Cache classes and refresh boundary

`DURABLE_FORMAT_FACT` may be reused only for a dated, publicly observable, account-independent delivery fact with the same platform public surface, content type and relevant locale. Its record must preserve the source, observation date, scope and recheck/valid-through decision. Examples are reader-page layout or a documented title/body transfer pattern—not an assertion about editor DOM, publishing permission, policy, or account behavior.

`CAMPAIGN_FRESH` facts must be checked again for the current campaign: account/login/OAuth/session state, registration, policy or moderation rules, paid/free limits, price, current platform language or locale support, current account eligibility, theme/editor-specific behavior, and any commercial-link or disclosure restriction. They cannot be inferred from a durable profile, even when the platform name matches.

An observation that names an account, theme, editor, locale, market, or limitation is scoped to those values. A cached limitation remains dated and `not_generalizable: true`; it is not a rule for every user of that platform. Cache miss, stale evidence, or uncertainty is `UNVERIFIED`, not a reason to replace the platform or block a generic canonical draft.

## `format-profile.md`

Use this profile as deterministic delivery input when the evidence supports it.

```md
# Format profile: <platform>

- status: READY | UNVERIFIED
- cache_class: DURABLE_FORMAT_FACT | CAMPAIGN_FRESH
- scope: <platform public surface, locale, content type; account/theme only when observed>
- observed_on: <YYYY-MM-DD>
- recheck_or_valid_through: <date or REQUIRED_ON_NEXT_CAMPAIGN>

## Public samples
| URL | Date observed | Locale/type | Visible signal | Uncertainty |
| --- | --- | --- | --- | --- |

## Observed transport and constraints
- title and metadata fields:
- publicly visible title/section/subsection hierarchy:
- lists:
- links:
- public external-link and commercial-disclosure constraints:
- images/captions/alt:
- other reader-visible constraints:

## Hand-off decision
- title/body transfer guidance:
- public visual hierarchy evidence or uncertainty:
- payload adaptation required:
- unsupported or unknown behavior:
```

Only state a restriction when it is publicly observable or independently verified. Unknown is not a constraint. A durable profile must not contain current account, login, policy, price or locale-support conclusions; put those in a current campaign record instead.

## `editorial-style-profile.md`

This profile is a non-binding W reference. It cannot modify frozen search intent, facts, the required-secondary CTA policy, exact CTA anchor/href/disclosure, canonical structure, image narrative, or platform scope. It is never a template for promotional wording or CTA intensity.

```md
# Editorial style profile: <platform>

- status: READY | UNVERIFIED
- cache_class: ADVISORY_READER_FIT
- scope: <platform public surface, locale, content type>
- observed_on: <YYYY-MM-DD>
- recheck_or_valid_through: <date or REQUIRED_ON_NEXT_CAMPAIGN>

## Evidence-bounded observations
- title tone:
- opening approach:
- paragraph rhythm:
- structure and navigation:
- reader-facing tone:

## Permitted W use
- reader-fit choice actually adopted:
- why it does not override the frozen brief:

## Prohibited inference
- popularity, ranking, policy, keyword, natural-variant, reader-intent, local-demand, or factual-performance claim:
```

## Role hand-off

1. The campaign operations steward creates or refreshes profiles only for frozen scope and only when the on-demand trigger is met. It can reuse a matching durable format fact, but refreshes all `CAMPAIGN_FRESH` facts for the current campaign.
2. W may use an available matching format or advisory profile as non-binding input. A cache miss or `UNVERIFIED` profile does not block its continuous research or drafting; heading observations describe only public visual behavior, never editor HTML/DOM.
3. R checks that cited format constraints appear in the payload when applicable and that W did not copy samples or substitute profile evidence for keyword, factual or localization research.
4. G checks cache scope/provenance and non-blocking status, not prose quality. Neither G nor the steward may use a profile to select, substitute or validate a platform/account pair.
5. The human hand-off loads an available matching format profile. A missing or `UNVERIFIED` editorial profile never blocks compilation.
6. After `PUBLIC_QA_PASSED`, only verified public reader-page behavior may be promoted to a durable platform skill. `PUBLIC_QA_PASSED_WITH_LIMITATION` may contribute only its fully scoped, dated, evidence-linked limitation; preserve `not_generalizable: true` and never generalize it to every account, theme, editor or locale on that platform.
