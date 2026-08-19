# State, evidence, and event model

## Phases

```text
eligibility
verification
form
confirmation
follow-up
```

## Canonical statuses

```text
not attempted
form in progress
submitted
awaiting approval
awaiting email verification
published
submission outcome unknown
submission failed
blocked — user action
blocked — missing verified data
blocked — account or email policy
blocked — reciprocal link/site modification
blocked — execution backend failure
unavailable
paid-only
ineligible
terminated by user
```

## Verification states

```text
not checked
automatic verification passed
awaiting manual verification
manual verification completed
verification unavailable before form
verification expired/reset
no verification presented
deferred by user
```

## Compatibility rules

- `not attempted`: only `eligibility` or `verification`; no form fields, form start, or final action.
- `form in progress`: `form`; form-start time and form-filling event required; no final-action time.
- `submitted`: `confirmation` or `follow-up`; final-action event, structured receipt evidence, and submit time required.
- `awaiting approval` and `awaiting email verification`: `confirmation` or `follow-up`; final-action event and exact queue/verification evidence required.
- `published`: `follow-up`; public URL, public-page evidence, link attributes, and link-check time required.
- `submission outcome unknown`: `confirmation` or `follow-up`; one unresolved final action, backend/mailbox/public checks, and next review time required.
- `submission failed`: `confirmation` or `follow-up`; explicit failure evidence required.
- `paid-only`, `ineligible`, and `unavailable`: `eligibility` or `follow-up`; structured evidence and capture time required.

Form and post-submit states require `Quality gate: passed`. An unresolved verification state cannot coexist with form or post-submit execution.

The campaign records normalized host platform (`windows`, `macos`, `linux`, or `other`), UI environment, and available control capabilities. Every site also records its platform capability result, requested browser constraint, selected browser surface, execution backend/profile alias, and backend selection reason. A desktop backend must declare support for the recorded platform; otherwise use another compatible route or handoff. These values are non-secret aliases; local application paths, process arguments, ports, profile IDs, cookies, and authentication URLs are prohibited in the shareable record.

## Evidence fields

For any evidence-backed state record:

- `Evidence type`: `server receipt`, `email receipt`, `public page`, `policy page`, `error response`, or `user confirmation`;
- `Evidence store reference`: opaque ID, never a path, URL token, email address, or session identifier;
- `Evidence captured at`: ISO 8601 with timezone;
- `Evidence retention until`: ISO 8601 with timezone or `campaign policy`.

`submitted`, `awaiting approval`, `awaiting email verification`, `published`, `submission failed`, `submission outcome unknown`, `paid-only`, `ineligible`, and `unavailable` require structured evidence.

## Append-only events

Use this exact syntax under each site:

```text
### Attempt/Event log

- 2026-08-18T10:00:00+08:00 | event_id=evt-example-001 | action=inspection | result=completed | evidence=ev-example-001
```

Event IDs are unique. Times never move backward. Every action must match valid campaign authorization. Do not overwrite an event; append a correction.

## Link attributes

For a published listing record actual anchor, href, `rel`, relationship, and check time. Allowed anchor types are `brand`, `product`, and `naked URL`; `exact-match commercial` is prohibited. Allowed `rel` values are `none`, `nofollow`, `sponsored`, `ugc`, or space-separated combinations of those tokens. Paid or incentivized relationships require `sponsored` or `nofollow`.
