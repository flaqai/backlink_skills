from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts" / "audit_submission_record.py"
SPEC = importlib.util.spec_from_file_location("lean_audit_under_test", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def record(blocks: str, authorization: str = "authorized", scope: str = "shareable") -> str:
    return f"""# Batch

## Campaign controls

- Record format: SPD lean 1
- Campaign ID: batch-test
- Canonical URL: https://product.test/
- Batch authorization reference: auth-batch
- Automation authorization: {authorization}
- Record scope: {scope}

{blocks}
"""


def site(status: str = "submitted", extra: str = "", duplicate: str = "cleared",
         queue: str = "Q1", website: str = "https://directory.test/submit") -> str:
    return f"""## {queue} — Directory

- Queue ID: {queue}
- Website: {website}
- Status: {status}
- Duplicate check: {duplicate}
- Exact result: Native receipt or observed blocker; controlled evidence has the actual text
- Evidence reference: ev-current-action
- Last checked: 2026-10-09T12:00:00+08:00
{extra}
"""


class LeanRecordTests(unittest.TestCase):
    def test_prefill_only_allows_filling_but_rejects_an_automated_submit(self):
        prepared = site("form in progress", extra="- Fields entered: name and URL")
        completed = site(extra="- Form submit attempts: 1/1")
        prepared_record = record(prepared).replace(
            "- Automation authorization: authorized",
            "- Automation authorization: authorized\n- Form authorization: prefill only",
        )
        completed_record = record(completed).replace(
            "- Automation authorization: authorized",
            "- Automation authorization: authorized\n- Form authorization: prefill only",
        )
        self.assertTrue(MODULE.audit(prepared_record)["valid"])
        result = MODULE.audit(completed_record)
        self.assertFalse(result["valid"])
        self.assertTrue(any("prefill only" in error for error in result["errors"]))

    def test_prefill_only_accepts_receipt_after_the_user_submits(self):
        block = site(extra="- Form submitted by: user")
        text = record(block).replace(
            "- Automation authorization: authorized",
            "- Automation authorization: authorized\n- Form authorization: prefill only",
        )
        result = MODULE.audit(text)
        self.assertTrue(result["valid"], result["errors"])
        self.assertEqual(result["status_counts"], {"submitted": 1})
        contradictory = text + "\n- Form submit attempts: 1/1\n"
        self.assertFalse(MODULE.audit(contradictory)["valid"])

    def test_user_report_does_not_require_an_automation_attempt(self):
        block = site("submitted — user reported", duplicate="not checked").replace(
            "Native receipt or observed blocker; controlled evidence has the actual text",
            "User reported submitting this listing; no receipt checked",
        ).replace("ev-current-action", "user-message-001")
        result = MODULE.audit(record(block, authorization="not authorized"))
        self.assertTrue(result["valid"], result["errors"])
        self.assertEqual(result["status_counts"], {"submitted — user reported": 1})

    def test_user_report_and_site_receipt_count_separately(self):
        reported = site("submitted — user reported", queue="Q2",
                        website="https://other-directory.test/submit").replace(
            "Native receipt or observed blocker; controlled evidence has the actual text",
            "User reported submitting this listing",
        ).replace("ev-current-action", "user-message-002")
        result = MODULE.audit(record(site(extra="- Form submit attempts: 1/1") + reported))
        self.assertTrue(result["valid"], result["errors"])
        self.assertEqual(result["status_counts"], {"submitted": 1, "submitted — user reported": 1})

    def test_user_report_cannot_claim_a_verified_public_listing(self):
        block = site("submitted — user reported",
                     extra="- Public listing URL: https://directory.test/product/tool")
        result = MODULE.audit(record(block))
        self.assertFalse(result["valid"])
        self.assertTrue(any("verified public listing" in e for e in result["errors"]))

    def test_target_subpage_is_optional_and_not_the_directory_entry(self):
        block = site(extra="- Form submit attempts: 1/1")
        selected = block + "- Target URL: https://product.test/tools/image-tool\n"
        result = MODULE.audit(record(selected))
        self.assertTrue(result["valid"], result["errors"])
        self.assertTrue(MODULE.audit(record(block))["valid"])
        for value in ("javascript:alert(1)", "/tools/image-tool",
                      "https://user:secret@product.test/tools/image-tool"):
            invalid = block + f"- Target URL: {value}\n"
            self.assertFalse(MODULE.audit(record(invalid))["valid"])

    def test_same_page_receipt_does_not_require_three_signals_or_backend(self):
        result = MODULE.audit(record(site(extra="- Form submit attempts: 1/1")))
        self.assertTrue(result["valid"], result["errors"])

    def test_form_retry_and_login_link_are_separately_counted(self):
        block = site(extra="""- Form submit attempts: 2/3
- Retry authorization: user-site-specific-three-submits
- Login-link requests: 1/1

### Attempt log

- 12:00 | form submit 1 | no clear receipt | ev-first
- 12:01 | login-link request 1 | authenticated | ev-login
- 12:02 | form submit 2 | received for review; stopped | ev-second
""")
        result = MODULE.audit(record(block))
        self.assertTrue(result["valid"], result["errors"])
        for modified in (
            block.replace("2/3", "4/3"),
            block.replace("- Retry authorization: user-site-specific-three-submits", ""),
        ):
            self.assertFalse(MODULE.audit(record(modified))["valid"])

    def test_login_request_does_not_prove_directory_submission(self):
        block = site(extra="""- Login-link requests: 1/1

### Attempt log

- 12:00 | login-link request 1 | email requested | ev-login
""")
        self.assertFalse(MODULE.audit(record(block))["valid"])

    def test_incomplete_search_can_proceed_only_with_existing_authorization(self):
        block = site(duplicate="inconclusive", extra="""- Form submit attempts: 1/1
- Direct-attempt authorization: auth-batch-direct-attempt
""")
        self.assertTrue(MODULE.audit(record(block))["valid"])
        self.assertFalse(MODULE.audit(record(
            block.replace("- Direct-attempt authorization: auth-batch-direct-attempt", "")
        ))["valid"])
        self.assertFalse(MODULE.audit(record(block, authorization="not authorized"))["valid"])

    def test_human_handover_requires_preserved_page_and_prefill(self):
        block = site("blocked — manual verification", duplicate="inconclusive", extra="""- Handover page: retained tab; current submission form
- Fields entered: name, URL, description, logo
- Follow-up: user completes reCAPTCHA
""")
        self.assertTrue(MODULE.audit(record(block))["valid"])
        self.assertFalse(MODULE.audit(record(
            block.replace("- Fields entered: name, URL, description, logo", "")
        ))["valid"])
        inaccessible = block.replace(
            "- Fields entered: name, URL, description, logo",
            "- Prefill limitation: verification wall blocks every listing field",
        )
        self.assertTrue(MODULE.audit(record(inaccessible))["valid"])

    def test_unknown_outcome_accepts_useful_checks_without_fixed_rounds(self):
        block = site("submission outcome unknown", extra="""- Form submit attempts: 1/1
- Handover page: preserved original form
- Outcome checks: current page and account status checked; no decisive receipt
""")
        self.assertTrue(MODULE.audit(record(block))["valid"])
        self.assertFalse(MODULE.audit(record(
            block.replace("- Handover page: preserved original form", "")
        ))["valid"])

    def test_content_editor_never_becomes_submission_or_handoff(self):
        block = site("ineligible", extra="- Content surface: long post — no action")
        self.assertTrue(MODULE.audit(record(block))["valid"])
        self.assertFalse(MODULE.audit(record(
            block + "- Fields entered: title and article\n"
        ))["valid"])
        self.assertFalse(MODULE.audit(record(
            block + "- Handover page: editor ready for human publication\n"
        ))["valid"])

    def test_published_requires_public_listing_evidence(self):
        block = site("published", extra="- Form submit attempts: 1/1")
        self.assertFalse(MODULE.audit(record(block))["valid"])
        self.assertTrue(MODULE.audit(record(
            block + "- Public listing URL: https://directory.test/tool/product\n"
        ))["valid"])

    def test_official_contact_email_is_independent_and_single_send(self):
        block = site("email sent — awaiting reply", extra="""- Action channel: official contact email
- Email authorization: auth-email
- Account alias: sender-alias
- Recipient contact alias: official-contact
- Contact-source evidence: ev-official-contact-page
- Mailbox pre-send check: cleared
- Email send attempts: 1/1
""")
        self.assertTrue(MODULE.audit(record(block))["valid"])
        self.assertFalse(MODULE.audit(record(block.replace("1/1", "2/2")))["valid"])
        self.assertFalse(MODULE.audit(record(block.replace("- Email authorization: auth-email", "")))["valid"])
        other = block.replace("Q1", "Q2").replace(
            "https://directory.test/submit", "https://www.directory.test/contact"
        )
        self.assertFalse(MODULE.audit(record(block + "\n" + other))["valid"])

    def test_sensitive_data_is_rejected_without_printing_the_value(self):
        text = record(site(extra="- Form submit attempts: 1/1")) + "- Password: private-sentinel\n"
        result = MODULE.audit(text)
        self.assertFalse(result["valid"])
        self.assertNotIn("private-sentinel", str(result["errors"]))
        if "record_scope" in MODULE.audit.__code__.co_varnames:
            local = text.replace("- Record scope: shareable", "- Record scope: local-controlled")
            local_result = MODULE.audit(local, "local-controlled")
            self.assertTrue(local_result["valid"], local_result["errors"])
            self.assertTrue(local_result["warnings"])

    def test_duplicate_queue_and_unknown_format_do_not_bypass_audit(self):
        block = site(extra="- Form submit attempts: 1/1")
        self.assertFalse(MODULE.audit(record(block + "\n" + block))["valid"])
        self.assertFalse(MODULE.audit(record(block).replace("SPD lean 1", "SPD future"))["valid"])


if __name__ == "__main__":
    unittest.main()
