from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts" / "audit_submission_record.py"
SPEC = importlib.util.spec_from_file_location("spd_v1_batch_audit", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def record(site_blocks: str) -> str:
    return f"""# Campaign — SPD V1 Batch Record

Last updated: 2026-08-18T16:00:00+08:00

## Campaign controls

- SPD version: V1 Batch
- Campaign ID: campaign-001
- Product canonical ID: product-001
- Canonical URL: https://example-product.test/
- Source-list reference: source-list-001
- Batch authorization reference: auth-batch-001
- Execution-shard size: 20
- Maximum active tabs: 5
- Host platform: linux
- UI environment: desktop
- Available control capabilities: connected browser runtime; user handoff
- Browser-routing policy: explicit choice; connector/API/CLI; supported browser runtime; OS-matched desktop UI control; user handoff
- Credential policy: aliases only; no secrets in record
- Evidence policy: controlled evidence IDs only
- Duplicate policy: never execute a completed or pending idempotency key
- Ambiguous-outcome policy: check before retry
- Ranking manipulation prohibited: yes

## Source list

1. https://directory.test/submit

{site_blocks}
"""


def site(
    name: str = "Q-001 — Directory",
    website: str = "https://directory.test/submit",
    idem: str = "directory.test|product-001|account-001|directory listing",
    status: str = "submitted",
    verification: str = "no verification presented",
    legitimacy: str = "passed",
    entered: str = "brand, URL, description",
    agreements: str = "terms accepted; subscriptions none",
    submit_timestamp: str = "2026-08-18T15:30:00+08:00",
    exact_result: str = "Submission received",
    evidence: str = "ev-001",
    extra: str = "",
) -> str:
    return f"""## {name}

- Queue ID: Q-001
- Website: {website}
- Platform domain: directory.test
- Route: directory listing
- Account alias: account-001
- Idempotency key: {idem}
- Execution shard: shard-001
- Platform capability result: supported
- Requested browser constraint: not specified
- Selected browser surface: connected browser
- Execution backend/session alias: browser-runtime / session-main
- Backend selection reason: supported structured browser control
- Legitimacy gate: {legitimacy}
- Authorization reference: auth-batch-001
- Status: {status}
- Verification preflight: {verification}
- Fields entered: {entered}
- Fields omitted: none
- Agreements/subscriptions: {agreements}
- Submit timestamp: {submit_timestamp}
- Exact result: {exact_result}
- Evidence reference: {evidence}
- Public listing URL: not applicable
- Backend checked: not applicable
- Mailbox checked: not applicable
- Public page checked: not applicable
- Last checked: 2026-08-18T15:31:00+08:00
- Follow-up: check approval later
{extra}
"""


class AuditTests(unittest.TestCase):
    def test_valid_submitted_record(self) -> None:
        result = MODULE.audit(record(site()))
        self.assertTrue(result["valid"], result["errors"])

    def test_duplicate_tracking_variant_fails(self) -> None:
        first = site()
        second = site(
            name="Q-002 — Duplicate",
            website="https://directory.test/submit?utm_source=x",
            idem="directory.test|product-001|account-002|directory listing",
        )
        result = MODULE.audit(record(first + "\n" + second))
        self.assertFalse(result["valid"])
        self.assertTrue(any("duplicate normalized website" in item for item in result["errors"]))

    def test_unresolved_verification_cannot_submit(self) -> None:
        result = MODULE.audit(record(site(verification="awaiting manual verification")))
        self.assertFalse(result["valid"])
        self.assertTrue(any("verification remained unresolved" in item for item in result["errors"]))

    def test_not_attempted_cannot_have_entered_fields(self) -> None:
        block = site(
            status="not attempted",
            verification="not checked",
            entered="brand",
            agreements="none",
            submit_timestamp="not submitted",
            exact_result="not attempted",
            evidence="not applicable",
        )
        result = MODULE.audit(record(block))
        self.assertFalse(result["valid"])
        self.assertTrue(any("listing fields were entered" in item for item in result["errors"]))

    def test_raw_email_fails(self) -> None:
        result = MODULE.audit(record(site(extra="- Password: person@example.com\n")))
        self.assertFalse(result["valid"])
        self.assertTrue(any("raw email" in item for item in result["errors"]))

    def test_invalid_host_platform_fails(self) -> None:
        result = MODULE.audit(record(site()).replace("- Host platform: linux", "- Host platform: solaris"))
        self.assertFalse(result["valid"])
        self.assertTrue(any("Host platform" in item for item in result["errors"]))


if __name__ == "__main__":
    unittest.main()
