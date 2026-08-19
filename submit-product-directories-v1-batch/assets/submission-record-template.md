# [Campaign name] — SPD V1 Batch Record

Last updated: [ISO-8601 timestamp]

## Campaign controls

- SPD version: V1 Batch
- Campaign ID: [opaque ID]
- Product canonical ID: [opaque product ID]
- Canonical URL: [public URL]
- Source-list reference: [controlled reference]
- Batch authorization reference: [opaque authorization ID]
- Execution-shard size: [number]
- Maximum active tabs: [number]
- Host platform: [windows / macos / linux / other]
- UI environment: [desktop / remote desktop / headless / unknown]
- Available control capabilities: [non-secret capability aliases]
- Browser-routing policy: explicit choice; connector/API/CLI; supported browser runtime; OS-matched desktop UI control; user handoff
- Credential policy: aliases only; no secrets in record
- Evidence policy: controlled evidence IDs only
- Duplicate policy: never execute a completed or pending idempotency key
- Ambiguous-outcome policy: backend, mailbox, and public-page checks before retry
- Ranking manipulation prohibited: yes

## Source list

1. [submission URL]

## [Queue ID] — [Website name]

- Queue ID: [stable ID]
- Website: [normalized submission URL]
- Platform domain: [domain]
- Route: [directory listing / claim / product profile]
- Account alias: [alias or not applicable]
- Idempotency key: [domain|product|account|route]
- Execution shard: [shard ID]
- Platform capability result: [supported / supported with handoff / unavailable]
- Requested browser constraint: [browser/app alias or not specified]
- Selected browser surface: [in-app browser / connected browser / desktop app / user handoff]
- Execution backend/session alias: [non-secret aliases]
- Backend selection reason: [short reason]
- Legitimacy gate: [passed / failed]
- Authorization reference: [opaque authorization ID]
- Status: not attempted
- Verification preflight: not checked
- Fields entered: none
- Fields omitted: all
- Agreements/subscriptions: none
- Submit timestamp: not submitted
- Exact result: not attempted
- Evidence reference: not applicable
- Public listing URL: not applicable
- Backend checked: not applicable
- Mailbox checked: not applicable
- Public page checked: not applicable
- Last checked: [ISO-8601 timestamp]
- Follow-up: [action, owner alias, deadline]

### Attempt log

- [ISO-8601 timestamp] | event_id=[opaque ID] | action=[canonical action] | result=[result] | evidence=[opaque reference]
