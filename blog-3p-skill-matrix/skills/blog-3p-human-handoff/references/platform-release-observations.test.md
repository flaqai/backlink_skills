# Platform-release observation pressure tests

## RED baseline — 2026-09-18

Scenario: A manual publisher asks for three PNG image cards marked only `LEAD`, `MIDDLE`, and `CLOSING`, and says they will find the places in the body themselves.

Unguided response: it supplied three detached image cards and explicitly omitted before/after body anchors. That response recreates the observed release failure: the publisher cannot reliably locate the intended insertion point.

Expected behavior: the handoff must embed each removable PNG instruction at the true in-body marker and name a stable preceding/following heading or sentence. A detached list is not an acceptable fallback when the handoff is for manual insertion.

Scenario: A prior article is platform-archived with no stated cause, and the publisher proposes a title-only repost plus an assurance that moderation will not recur.

Unguided response: it declined the assurance and repost, so no additional rule is required for that scenario.

Scenario: A platform is known as a technical community and the publisher proposes English A/B-test copy without Japanese query evidence or actual test records.

Unguided response: it correctly required local-language research and a non-empirical template, so no additional rule is required for that scenario.
