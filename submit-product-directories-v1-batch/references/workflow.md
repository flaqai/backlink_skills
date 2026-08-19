# SPD V1 Batch workflow

## 1. Preflight the campaign

Create one verified product profile with approved short, medium, and long descriptions; pricing; categories; contact aliases; policy URLs; social handles; and asset references. Separate public facts from credentials and controlled evidence.

Record:

- campaign ID and `SPD version: V1 Batch`;
- product canonical ID and canonical URL;
- source-list reference and authorization reference;
- execution-shard size and maximum active tabs;
- normalized host platform, UI environment, available control capabilities, browser-routing policy, and selected backend/session aliases;
- permitted actions, scope, approver alias, approval time, and expiry;
- prohibited actions, including payment, reciprocal-site modification, and DNS changes unless separately approved.

## 2. Normalize and deduplicate

For every source URL:

1. lowercase the hostname;
2. remove fragments and tracking parameters;
3. preserve route parameters required to reach the form only in controlled evidence;
4. derive `platform domain | product canonical ID | account alias | route`;
5. merge exact and tracking-only duplicates;
6. search existing records and public listings before scheduling a final action.

Assign a stable queue ID. Never renumber existing entries after execution begins.

## 3. Run fast triage

Inspect enough page state to classify the route without entering product fields.

Pass only legitimate, relevant product-directory routes with a usable submission or claim path. Remove or isolate unavailable, paid-link-only, forced-reciprocal, unrelated, unreleased-only, known directory-network, and terms-prohibited routes.

Classify passing routes by operational lane:

- direct form;
- account required;
- registration email required;
- manual verification likely;
- verification unavailable before form;
- unknown interactive route.

## 4. Create execution shards

Split the passing queue by route and browser capacity. Configure shard size explicitly; a practical default may be chosen for local resources, but it is not a search-engine safety threshold.

Before opening the first shard, apply [browser-control-routing.md](browser-control-routing.md). Detect `windows`, `macos`, `linux`, or `other`; detect desktop, remote, or headless UI availability; and inventory compatible control capabilities. Honor an explicit browser choice, use a supported browser runtime when available, use only a desktop UI adapter whose declared target matches the host platform, and hand off rather than silently switching browsers. Store environment-specific identifiers outside the shareable record.

Within each shard:

1. order account and email-verification work first;
2. order short-lived verification tokens immediately before their forms;
3. cap active tabs at the recorded limit;
4. keep one queue cursor and one immutable attempt log;
5. isolate browser profiles when account identity or session ownership differs.
6. keep each site bound to the selected backend and session alias until it reaches a recorded handoff or terminal state.

## 5. Run verification preflight

Visit every site in the shard before form entry. Expose the earliest verification or login boundary. Attempt only ordinary native automatic verification. Preserve interactive challenges in their original tabs and add them to the manual queue.

Record one state:

- `automatic verification passed`;
- `awaiting manual verification`;
- `manual verification completed`;
- `verification unavailable before form`;
- `verification expired/reset`;
- `no verification presented`;
- `deferred by user`.

Do not bypass challenges or move issued challenges between browser profiles.

## 6. Resolve one manual queue

Present site, queue ID, browser tab, challenge type, exact blocker, and required user action. After user completion, immediately re-inspect each tab and record whether the challenge completed, expired, reset, or remained blocked.

Do not keep solved short-lived tokens waiting behind unrelated work.

## 7. Execute form lanes

Process eligible items sequentially within a profile:

1. confirm authorization and idempotency;
2. confirm verification validity;
3. fill approved facts and the nearest truthful category;
4. leave unknown optional fields blank;
5. keep optional subscriptions off;
6. verify free/paid plan and reciprocal requirements;
7. submit only when the final action is allowed;
8. capture exact server text and controlled evidence reference;
9. advance the queue cursor only after the record is saved.

Apply the selected runtime's confirmation and handoff policy at action time. Campaign authorization cannot weaken that policy.

Never retry an ambiguous final action. Mark `submission outcome unknown`, then inspect the account backend, mailbox, and public search before any future attempt.

## 8. Recover without replay

- Re-inspect after navigation, modal changes, user interaction, or page reloads.
- Reacquire accessibility elements instead of using stale identifiers.
- Retry transient loading once in the current tab and once in a fresh tab.
- Resume from the first queue item without a terminal or pending state.
- Never reopen completed idempotency keys for final action.
- Preserve exact error text and distinguish site failure from local browser failure.

## 9. Close the batch

Audit the record, reconcile ambiguous entries, and report:

- total source URLs, normalized routes, duplicates removed, and routes rejected;
- eligible queue size and completed shards;
- submitted, awaiting approval, awaiting email verification, published, unknown outcome, blocked, unavailable, paid-only, and ineligible;
- manual-verification queue size and completion rate;
- operator time, verified submissions per hour, recovery rate, and outstanding queue.

Do not equate `submitted` with `published` or use volume as evidence of SEO value.
