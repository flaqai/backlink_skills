# SPD V1 Batch status model

## Required campaign controls

- SPD version: `V1 Batch`
- Campaign ID and last-updated timestamp
- Product canonical ID and canonical URL
- Source-list reference
- Batch authorization reference
- Execution-shard size and maximum active tabs
- Host platform and UI environment
- Available control capabilities
- Browser-routing policy
- Credential and evidence policy
- Duplicate and ambiguous-outcome policy

## Required site fields

- Queue ID
- Website and platform domain
- Route and account alias
- Idempotency key
- Execution shard
- Platform capability result
- Requested browser constraint
- Selected browser surface
- Execution backend/session alias
- Backend selection reason
- Legitimacy gate
- Authorization reference
- Status
- Verification preflight
- Fields entered and omitted
- Agreements and subscriptions
- Submit timestamp
- Exact result
- Evidence reference
- Last checked
- Follow-up

## Canonical statuses

- `not attempted`
- `form in progress`
- `draft saved`
- `submitted`
- `submission outcome unknown`
- `awaiting approval`
- `awaiting email verification`
- `published`
- `blocked — manual verification`
- `blocked — missing verified data`
- `blocked — account or email policy`
- `unavailable`
- `paid-only`
- `ineligible`
- `duplicate — no action`
- `terminated by user`

## Verification states

- `not checked`
- `automatic verification passed`
- `awaiting manual verification`
- `manual verification completed`
- `verification unavailable before form`
- `verification expired/reset`
- `no verification presented`
- `deferred by user`

## Invariants

- Use `submitted` only with a submit timestamp, exact server acknowledgment, and evidence reference.
- Use `published` only after checking a public listing URL.
- Use `submission outcome unknown` after an ambiguous final action; do not retry until backend, mailbox, and public-page checks are recorded.
- Keep `not attempted` free of entered listing fields, agreements, and submit timestamps.
- Do not start or complete a form while verification is unresolved unless the site exposes verification only after mandatory form fields and the exception is recorded.
- Do not execute a failed legitimacy gate or missing/expired authorization.
- Keep idempotency keys unique across the campaign.
- Use only `windows`, `macos`, `linux`, or `other` for Host platform. A desktop backend must declare support for that platform; otherwise use another compatible route or handoff.
- Treat registration, login, draft save, navigation, a click, or a generic thank-you page as insufficient evidence of submission.
- Never store secrets, raw contact data, private session IDs, or tokenized authentication URLs in the shareable record.

## Audit commands

```bash
python3 scripts/audit_submission_record.py path/to/record.md
python3 scripts/audit_submission_record.py path/to/record.md --json
```
