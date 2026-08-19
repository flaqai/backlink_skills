# Compliance-gated directory workflow

## Campaign preflight

1. Record campaign purpose as product discovery, profile accuracy, referral traffic, and/or listing durability. Set `Ranking manipulation prohibited: yes`.
2. Create independent authorization entries for every required action. Include approver, approval time, domain scope, and expiry.
3. Store approved product/contact/assets in controlled sources. Put only aliases and hashes in the public record.
4. Normalize source URLs by lowercasing hostnames, removing fragments, removing default ports, sorting required parameters, and dropping tracking parameters such as `utm_*`, `gclid`, `fbclid`, and `msclkid`.
5. Derive `platform domain | product canonical ID | account alias | route` as the idempotency key.
6. Apply [browser-control-routing.md](browser-control-routing.md). Detect `windows`, `macos`, `linux`, or `other`; detect desktop, remote, or headless UI availability; inventory compatible control capabilities; then record the requested browser constraint, selected surface, backend/session aliases, and selection reason without storing local paths or secret session data.

## Pass A — read-only research and verification

Visit each source without entering product-listing fields.

1. Confirm the route is supported by SPD.
2. Inspect topic/audience relevance, genuine discovery value, governance or editorial review, paid/ranking-link offers, directory/network quality, automation terms, reciprocal-link requirements, eligibility, cost, duplicates, and claim conditions.
3. Set `Quality gate: passed` only when every mandatory quality check satisfies [seo-quality-gate.md](seo-quality-gate.md).
4. Record `ineligible` plus structured evidence for failed gates. Do not continue merely because the site is free, dofollow, high-DA/DR, or easy to automate.
5. Reuse or create an account only under a current authorization scoped to that domain.
6. Expose the earliest native verification. Preserve interactive challenges in their original tabs and add them to one manual queue.
7. Keep `Status: not attempted`. Account registration and verification do not count as listing-form work.

## Manual checkpoint

Present one ordered queue with platform, normalized route, profile alias, challenge type, exact prompt, required user action, timestamp, and expiry risk. Reinspect every preserved tab after user action. Do not start form work while an actionable challenge is unresolved.

## Pass B — authorized form work

1. Recheck source-list membership, idempotency, quality, duplicate/claim state, verification validity, and authorization.
2. Set `Phase: form` and `Status: form in progress` when the first product field is entered.
3. Append immutable events for inspection, form filling, account creation, native email verification, agreement acceptance, final submission, claims, payments, or site changes. Never rewrite a prior event; append a corrective event.
4. Use only approved facts and assets. Leave optional unknowns and subscriptions blank.
5. Before a final action, verify plan, cost, brand, canonical URL, contact alias, category, price, assets, agreements, relationship disclosures, and verification state.
6. Execute only actions with a matching `allowed` authorization valid for the domain and event time.
7. Capture exact response, evidence type, opaque evidence-store ID, capture time, retention date, and resulting URL.

The selected runtime's confirmation and handoff policy remains authoritative at action time. An `allowed` campaign entry cannot waive a required confirmation or user handoff.

## Outcome and retry

- Receipt acknowledgment: `submitted`.
- Explicit editorial queue: `awaiting approval`.
- Native confirmation email required: `awaiting email verification`.
- Public non-preview listing verified: `published`.
- Explicit rejection, bounce, or reliable business failure: `submission failed`.
- Final action with uncertain receipt: `submission outcome unknown`.

For an unknown outcome, check application history/backend, authorized mailbox, site search, and public pages. Record all three check classes and the next review time. Do not repeat the final action until non-receipt is established and recorded as a later event.

## Privacy and evidence

Keep evidence in an access-controlled store. The campaign record contains only opaque aliases and IDs. Never record raw email addresses, phone numbers, credentials, authentication URLs/parameters, cookies, session IDs, recovery material, or private absolute paths. Apply the campaign retention deadline.

## Closeout

Audit the record, resolve every error, reconcile public evidence, and report qualified publication rate, referral traffic/conversion, profile accuracy, and listing survival separately. Do not report backlink or dofollow volume as campaign success.
