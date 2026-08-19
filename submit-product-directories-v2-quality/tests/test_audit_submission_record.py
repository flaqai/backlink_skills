from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import re
import unittest


SCRIPT = Path(__file__).parents[1] / "scripts" / "audit_submission_record.py"
SPEC = importlib.util.spec_from_file_location("spd_audit", SCRIPT)
assert SPEC and SPEC.loader
AUDIT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUDIT)


def campaign(sources: list[str], *, decision_overrides: dict[str, str] | None = None, scope: str = "all listed sites") -> str:
    overrides = decision_overrides or {}
    auth_lines = []
    for action in AUDIT.AUTH_ACTIONS:
        decision = overrides.get(action, "allowed")
        if decision == "allowed":
            auth_lines.append(
                f"- {action}: decision=allowed; approved_by=owner-alias; "
                f"approved_at=2026-08-18T09:00:00+08:00; scope={scope}; "
                "expires_at=2026-09-18T09:00:00+08:00"
            )
        else:
            auth_lines.append(
                f"- {action}: decision={decision}; approved_by=not applicable; "
                "approved_at=not applicable; scope=not applicable; expires_at=not applicable"
            )
    source_lines = "\n".join(f"{index}. {url}" for index, url in enumerate(sources, 1))
    return f"""# Test Campaign Product Directory Record

Last updated: 2026-08-18T10:10:00+08:00

## Permanent operating rules

- Public brand: Example Product
- Canonical product URL: https://product.example/
- Product canonical ID: product-example
- Campaign purpose: product discovery; profile accuracy; referral traffic; listing durability
- Ranking manipulation prohibited: yes
- Approved contact reference: contact-main
- Master-data source: master-data-v1
- Evidence store: evidence-vault
- Evidence retention policy: retention-30d
- Execution modes: manual; automated
- Host platform: windows
- UI environment: desktop
- Available control capabilities: connected browser runtime; user handoff
- Browser routing policy: explicit choice; connector/API/CLI; supported browser runtime; OS-matched desktop UI control; user handoff
- Rollout stage: pilot
- Maximum sites this batch: 10
- Per-site approval required: yes
- Anchor policy: brand / product / naked URL only
- KPI policy: qualified publication rate; referral visits; referral conversion; profile accuracy; listing survival

## Authorization matrix

{chr(10).join(auth_lines)}

## Source list

{source_lines}
"""


def site(
    status: str = "not attempted", *, name: str = "Example", url: str = "https://example.com/submit",
    route: str = "directory listing", account_alias: str = "account-main", quality_gate: str | None = None,
    phase: str | None = None, evidence_ref: str | None = None, rel: str = "not observed",
    relationship: str = "none", anchor_type: str = "not observed",
) -> str:
    category = AUDIT.STATUS_CATEGORIES.get(status, "unknown")
    post_submit = category in {
        "submitted", "awaiting_approval", "awaiting_email_verification", "published", "outcome_unknown",
        "submission_failed",
    }
    form_work = category == "in_progress" or post_submit
    final_action = category in {"submitted", "awaiting_approval", "awaiting_email_verification", "outcome_unknown", "submission_failed", "published"}
    if phase is None:
        if category == "in_progress":
            phase = "form"
        elif category in {"submitted", "outcome_unknown", "submission_failed"}:
            phase = "confirmation"
        elif category in {"awaiting_approval", "awaiting_email_verification", "published"}:
            phase = "follow-up"
        else:
            phase = "eligibility"
    if quality_gate is None:
        quality_gate = "failed" if category == "ineligible" else "passed"
    audience = "fail" if quality_gate == "failed" else "pass"
    form_started = "2026-08-18T10:04:00+08:00" if form_work else "not started"
    submitted_at = "2026-08-18T10:05:00+08:00" if final_action else "not submitted"
    fields_entered = "product name; canonical URL" if form_work else "none"
    evidence_required = category in AUDIT.EVIDENCE_REQUIRED
    exact = "Reliable state-specific evidence captured" if evidence_required else "none"
    evidence_type = {
        "published": "public page",
        "submission_failed": "error response",
        "unavailable": "error response",
        "paid_only": "policy page",
        "ineligible": "policy page",
    }.get(category, "server receipt") if evidence_required else "none"
    evidence_ref = evidence_ref or ("ev-example-001" if evidence_required else "none")
    evidence_time = "2026-08-18T10:06:00+08:00" if evidence_required else "not applicable"
    retention = "2026-09-18T10:06:00+08:00" if evidence_required else "not applicable"
    public_url = "https://example.com/products/example" if category == "published" else "not applicable"
    artifact = "public" if category == "published" else "review" if category == "awaiting_approval" else "not applicable"
    next_review = "2026-08-19T10:05:00+08:00" if category == "outcome_unknown" else "not applicable"
    backend = "application history shows no receipt" if category == "outcome_unknown" else "not applicable"
    mailbox = "receipt mailbox checked; no message" if category == "outcome_unknown" else "not applicable"
    public_search = "public directory search checked; no listing" if category == "outcome_unknown" else "not applicable"
    follow_up = "resolve blocker" if category.startswith("blocked_") else "none"
    if category == "published":
        anchor, anchor_type, href, rel, link_checked = (
            "Example Product", "brand", "https://product.example/", "none", "2026-08-18T10:08:00+08:00"
        )
    else:
        anchor, href, link_checked = "not observed", "not observed", "not applicable"
    platform_domain = AUDIT.domain_from_url(url)
    idem = f"{platform_domain}|product-example|{account_alias}|{route}"
    events = [
        "- 2026-08-18T10:00:00+08:00 | event_id=evt-" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") + "-001 | action=inspection | result=completed | evidence=none"
    ]
    if form_work:
        events.append(
            "- 2026-08-18T10:04:00+08:00 | event_id=evt-" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") + "-002 | action=form filling | result=completed | evidence=none"
        )
    if final_action:
        events.append(
            "- 2026-08-18T10:05:00+08:00 | event_id=evt-" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") + "-003 | action=final form submission | result=completed | evidence=ev-final-001"
        )
    return f"""## {name}

- Website: {name}
- Submission URL: {url}
- Platform domain: {platform_domain}
- Product canonical ID: product-example
- Account alias: {account_alias}
- Site approval reference: approval-{re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')}
- Route: {route}
- Idempotency key: {idem}
- Quality gate: {quality_gate}
- Audience relevance: {audience}
- User/discovery value: {audience}
- Editorial/platform governance: pass
- Paid/ranking-link offer: none
- Directory/network quality: {audience}
- Automation/terms compatibility: allowed
- Reciprocal link requirement: none
- Phase: {phase}
- Status: **{status}**
- Listing plan/cost: free
- Execution mode: automated
- Platform capability result: supported
- Requested browser constraint: not specified
- Selected browser surface: connected browser
- Execution backend/profile alias: browser / profile-main
- Backend selection reason: supported structured browser control
- Account/login: account-main
- Credential source: credential-vault
- Verification preflight: no verification presented
- Manual-verification queue: not queued
- Duplicate check: platform search clear
- Fields entered: {fields_entered}
- Fields omitted: none
- Category: product discovery
- Asset reference: none
- Asset SHA-256: not applicable
- Agreements: none
- Subscriptions: none
- CAPTCHA/authentication: not presented
- Artifact stage: {artifact}
- First opened: 2026-08-18T10:00:00+08:00
- Eligibility checked at: 2026-08-18T10:01:00+08:00
- Verification checked at: 2026-08-18T10:02:00+08:00
- Form started at: {form_started}
- Submit action timestamp: {submitted_at}
- Last checked: 2026-08-18T10:10:00+08:00
- Result summary: test state
- Exact result: {exact}
- Public listing URL: {public_url}
- Evidence type: {evidence_type}
- Evidence store reference: {evidence_ref}
- Evidence captured at: {evidence_time}
- Evidence retention until: {retention}
- Backend checked: {backend}
- Mailbox checked: {mailbox}
- Public search checked: {public_search}
- Next review time: {next_review}
- Outbound link anchor: {anchor}
- Outbound link anchor type: {anchor_type}
- Outbound link href: {href}
- Outbound link rel: {rel}
- Commercial relationship: {relationship}
- Link checked at: {link_checked}
- Follow-up: {follow_up}
- Owner: operator-main
- Deadline: not applicable

### Attempt/Event log

{chr(10).join(events)}
"""


def full_record(*sites: str, sources: list[str] | None = None, **campaign_kwargs: object) -> str:
    source_values = sources or [
        re.search(r"^- Submission URL: (.+)$", item, re.MULTILINE).group(1)  # type: ignore[union-attr]
        for item in sites
    ]
    return campaign(source_values, **campaign_kwargs) + "\n" + "\n".join(sites)


class AuditV2Tests(unittest.TestCase):
    def test_all_canonical_statuses_have_valid_examples(self) -> None:
        for status, category in AUDIT.STATUS_CATEGORIES.items():
            with self.subTest(status=status):
                item = site(status)
                report = AUDIT.audit_text(full_record(item))
                self.assertTrue(report["valid"], report["errors"])
                self.assertEqual(report["sites"][0]["category"], category)

    def test_missing_campaign_authorization_and_source_fail(self) -> None:
        text = full_record(site())
        text = re.sub(r"## Authorization matrix.*?(?=^## Source list)", "", text, flags=re.S | re.M)
        text = re.sub(r"## Source list.*?(?=^## Example)", "", text, flags=re.S | re.M)
        report = AUDIT.audit_text(text)
        self.assertFalse(report["valid"])
        self.assertTrue(any("Authorization matrix" in error for error in report["errors"]))
        self.assertTrue(any("Source list" in error for error in report["errors"]))

    def test_pilot_limit_and_per_site_approval_are_enforced(self) -> None:
        items = [site(name=f"Site {index}", url=f"https://site{index}.example/submit") for index in range(1, 12)]
        report = AUDIT.audit_text(full_record(*items))
        self.assertFalse(report["valid"])
        self.assertTrue(any("exceeds" in error for error in report["errors"]))

        item = site().replace("- Site approval reference: approval-example", "- Site approval reference: none")
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("per-site approval" in error for error in report["errors"]))

    def test_executed_action_requires_allowed_scoped_authorization(self) -> None:
        item = site("submitted")
        report = AUDIT.audit_text(full_record(item, decision_overrides={"final form submission": "ask"}))
        self.assertFalse(report["valid"])
        self.assertTrue(any("not allowed" in error for error in report["errors"]))

        report = AUDIT.audit_text(full_record(item, scope="other.example"))
        self.assertFalse(report["valid"])
        self.assertTrue(any("outside authorization scope" in error for error in report["errors"]))

    def test_expired_authorization_fails(self) -> None:
        text = full_record(site())
        text = text.replace(
            "expires_at=2026-09-18T09:00:00+08:00",
            "expires_at=2026-08-18T09:30:00+08:00",
        )
        report = AUDIT.audit_text(text)
        self.assertFalse(report["valid"])
        self.assertTrue(any("expired authorization" in error for error in report["errors"]))

    def test_not_attempted_state_contradictions_fail(self) -> None:
        item = site().replace("- Fields entered: none", "- Fields entered: product name")
        item = item.replace("- Phase: eligibility", "- Phase: confirmation")
        item = item.replace("- Submit action timestamp: not submitted", "- Submit action timestamp: 2026-08-18T10:05:00+08:00")
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("not attempted" in error for error in report["errors"]))

    def test_terminal_exclusions_require_structured_evidence(self) -> None:
        for status in ("paid-only", "ineligible"):
            with self.subTest(status=status):
                item = site(status).replace("- Evidence store reference: ev-example-001", "- Evidence store reference: none")
                report = AUDIT.audit_text(full_record(item))
                self.assertFalse(report["valid"])
                self.assertTrue(any("evidence store reference" in error for error in report["errors"]))

    def test_quality_gate_blocks_form_execution(self) -> None:
        item = site("submitted", quality_gate="failed")
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("Quality gate" in error or "failed quality gate" in error for error in report["errors"]))

    def test_separate_content_route_is_rejected(self) -> None:
        item = site(route="article")
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("separate workflow" in error for error in report["errors"]))

    def test_secret_email_phone_url_token_and_private_path_fail(self) -> None:
        additions = """
- Password: do-not-store
- Notes: user@example.com +44 1234 567890 /Users/example/private
- Authentication URL: https://example.com/confirm?token=secret
"""
        report = AUDIT.audit_text(full_record(site()) + additions)
        self.assertFalse(report["valid"])
        joined = "\n".join(report["errors"])
        self.assertIn("secret fields", joined)
        self.assertIn("email", joined)
        self.assertIn("phone", joined)
        self.assertIn("absolute path", joined)
        self.assertIn("sensitive query", joined)

    def test_json_report_does_not_echo_record_fields(self) -> None:
        report = AUDIT.audit_text(full_record(site()) + "\n- Notes: user@example.com\n")
        payload = json.dumps(AUDIT.redacted_report(report))
        self.assertNotIn("user@example.com", payload)
        self.assertNotIn("credential-vault", payload)

        hostile = full_record(site()).replace("- Status: **not attempted**", "- Status: **user@example.com**")
        hostile_report = AUDIT.audit_text(hostile)
        payload = json.dumps(AUDIT.redacted_report(hostile_report))
        self.assertNotIn("user@example.com", payload)
        self.assertNotIn("user@example.com", "\n".join(hostile_report["errors"]))

    def test_unknown_outcome_requires_all_checks(self) -> None:
        item = site("submission outcome unknown").replace(
            "- Mailbox checked: receipt mailbox checked; no message", "- Mailbox checked: not applicable"
        )
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("mailbox checked" in error for error in report["errors"]))

    def test_paid_public_link_requires_qualified_rel(self) -> None:
        item = site("published", relationship="paid", rel="none")
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("sponsored or nofollow" in error for error in report["errors"]))

    def test_exact_match_commercial_anchor_fails(self) -> None:
        item = site("published").replace("- Outbound link anchor type: brand", "- Outbound link anchor type: exact-match commercial")
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("exact-match" in error for error in report["errors"]))

    def test_timestamp_order_is_enforced(self) -> None:
        item = site("submitted").replace("- Form started at: 2026-08-18T10:04:00+08:00", "- Form started at: 2026-08-18T09:30:00+08:00")
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("timestamp order" in error for error in report["errors"]))

    def test_evidence_retention_cannot_precede_capture(self) -> None:
        item = site("submitted").replace(
            "- Evidence retention until: 2026-09-18T10:06:00+08:00",
            "- Evidence retention until: 2026-08-18T10:05:00+08:00",
        )
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("retention" in error for error in report["errors"]))

    def test_tracking_variants_and_idempotency_duplicates_fail(self) -> None:
        first = site(name="First", url="https://example.com/submit")
        second = site(name="Second", url="https://example.com/submit?utm_source=test")
        report = AUDIT.audit_text(full_record(
            first, second, sources=["https://example.com/submit", "https://example.com/submit?utm_source=test"]
        ))
        self.assertFalse(report["valid"])
        joined = "\n".join(report["errors"])
        self.assertIn("duplicate normalized submission URL", joined)
        self.assertIn("duplicate idempotency key", joined)

    def test_alternate_platform_subdomain_uses_same_idempotency_domain(self) -> None:
        first = site(name="Main", url="https://www.example.com/submit")
        second = site(name="Apply", url="https://apply.example.com/new")
        report = AUDIT.audit_text(full_record(first, second))
        self.assertFalse(report["valid"])
        self.assertTrue(any("duplicate idempotency key" in error for error in report["errors"]))

    def test_duplicate_event_ids_fail(self) -> None:
        first = site(name="One", url="https://example.com/one")
        second = site(name="Two", url="https://example.org/two").replace("evt-two-001", "evt-one-001")
        report = AUDIT.audit_text(full_record(first, second))
        self.assertFalse(report["valid"])
        self.assertTrue(any("duplicate event ID" in error for error in report["errors"]))

    def test_unavailable_platform_capability_blocks_form_work(self) -> None:
        item = site("submitted").replace(
            "- Platform capability result: supported",
            "- Platform capability result: unavailable",
        )
        report = AUDIT.audit_text(full_record(item))
        self.assertFalse(report["valid"])
        self.assertTrue(any("compatible platform capability" in error for error in report["errors"]))


if __name__ == "__main__":
    unittest.main()
