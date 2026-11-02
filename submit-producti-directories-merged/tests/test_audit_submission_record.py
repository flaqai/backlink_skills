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
- Automation authorization: authorized
- Execution-shard size: 20
- Maximum active tabs: 5
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
    route: str = "directory listing",
    account_alias: str = "account-001",
    status: str = "submitted",
    action_channel: str = "web form",
    recipient_contact_alias: str = "not applicable",
    contact_source_evidence: str = "not applicable",
    mailbox_pre_send_check: str = "not applicable",
    mailbox_pre_send_evidence: str = "not applicable",
    email_send_attempts: str = "0",
    gmail_send_receipt: str = "not applicable",
    content_surface: str = "not applicable",
    content_surface_evidence: str = "not applicable",
    verification: str = "no verification presented",
    duplicate_check: str = "cleared",
    duplicate_evidence: str = "ev-dedup-001",
    direct_attempt_authorization: str = "not applicable",
    cdp_retry_decision: str = "not applicable",
    cdp_retry_evidence: str = "not applicable",
    outcome_check_attempts: str = "0",
    handover_page: str = "not applicable",
    legitimacy: str = "passed",
    entered: str = "brand, URL, description",
    agreements: str = "terms accepted; subscriptions none",
    submit_timestamp: str = "2026-08-18T15:30:00+08:00",
    exact_result: str = "Submission received",
    evidence: str = "ev-001",
    mailbox_checked: str = "not applicable",
    extra: str = "",
) -> str:
    return f"""## {name}

- Queue ID: Q-001
- Website: {website}
- Platform domain: directory.test
- Route: {route}
- Account alias: {account_alias}
- Idempotency key: {idem}
- Execution shard: shard-001
- Legitimacy gate: {legitimacy}
- Authorization reference: auth-batch-001
- Status: {status}
- Action channel: {action_channel}
- Recipient contact alias: {recipient_contact_alias}
- Contact-source evidence: {contact_source_evidence}
- Mailbox pre-send check: {mailbox_pre_send_check}
- Mailbox pre-send evidence: {mailbox_pre_send_evidence}
- Email send attempts: {email_send_attempts}
- Gmail send receipt: {gmail_send_receipt}
- Content surface: {content_surface}
- Content-surface evidence: {content_surface_evidence}
- Verification preflight: {verification}
- Duplicate check: {duplicate_check}
- Duplicate evidence: {duplicate_evidence}
- Direct-attempt authorization: {direct_attempt_authorization}
- CDP retry decision: {cdp_retry_decision}
- CDP retry evidence: {cdp_retry_evidence}
- Outcome-check attempts: {outcome_check_attempts}
- Handover page: {handover_page}
- Fields entered: {entered}
- Fields omitted: none
- Agreements/subscriptions: {agreements}
- Submit timestamp: {submit_timestamp}
- Exact result: {exact_result}
- Evidence reference: {evidence}
- Public listing URL: not applicable
- Backend checked: not applicable
- Mailbox checked: {mailbox_checked}
- Public page checked: not applicable
- Last checked: 2026-08-18T15:31:00+08:00
- Follow-up: check approval later
{extra}
"""


class AuditTests(unittest.TestCase):
    def test_valid_submitted_record(self) -> None:
        result = MODULE.audit(record(site()))
        self.assertTrue(result["valid"], result["errors"])

    def test_executed_record_requires_batch_automation_authorization(self) -> None:
        text = record(site()).replace(
            "- Automation authorization: authorized",
            "- Automation authorization: not authorized",
        )
        result = MODULE.audit(text)
        self.assertFalse(result["valid"])
        self.assertIn("Q-001 — Directory: executed without batch automation authorization", result["errors"])

    def test_non_shareable_record_scope_fails(self) -> None:
        text = record(site()).replace(
            "- Ranking manipulation prohibited: yes",
            "- Ranking manipulation prohibited: yes\n- Record scope: restricted",
        )
        result = MODULE.audit(text)
        self.assertFalse(result["valid"])
        self.assertIn("Record scope must be shareable", result["errors"])

    def test_valid_official_contact_email_send(self) -> None:
        block = site(
            website="https://directory.test/contact",
            idem="directory.test|product-001|alias-google-1|contact email backlink request",
            route="contact email backlink request",
            account_alias="alias-google-1",
            status="email sent — awaiting reply",
            action_channel="official contact email",
            recipient_contact_alias="contact-directory-1",
            contact_source_evidence="ev-contact-001",
            mailbox_pre_send_check="cleared",
            mailbox_pre_send_evidence="ev-mailbox-001",
            email_send_attempts="1",
            gmail_send_receipt="Gmail confirmed sent",
            entered="recipient alias; copy-001; canonical URL",
            agreements="none",
            exact_result="Message sent",
            evidence="ev-gmail-001",
        )
        result = MODULE.audit(record(block))
        self.assertTrue(result["valid"], result["errors"])

    def test_prior_contact_outreach_is_duplicate_and_never_resent(self) -> None:
        block = site(
            website="https://directory.test/contact",
            idem="directory.test|product-001|alias-google-1|contact email backlink request",
            route="contact email backlink request",
            account_alias="alias-google-1",
            status="duplicate — no action",
            action_channel="official contact email",
            recipient_contact_alias="contact-directory-1",
            contact_source_evidence="ev-contact-001",
            mailbox_pre_send_check="prior outreach found",
            mailbox_pre_send_evidence="ev-mailbox-002",
            email_send_attempts="0",
            gmail_send_receipt="not applicable",
            entered="none",
            agreements="none",
            submit_timestamp="not submitted",
            exact_result="not attempted",
            evidence="not applicable",
        )
        result = MODULE.audit(record(block))
        self.assertTrue(result["valid"], result["errors"])

        resent = block.replace("- Email send attempts: 0", "- Email send attempts: 1")
        resent_result = MODULE.audit(record(resent))
        self.assertFalse(resent_result["valid"])
        self.assertTrue(any("must not send again" in item for item in resent_result["errors"]))

    def test_contact_email_is_single_per_product_and_platform_root(self) -> None:
        first = site(
            name="Q-001 — Contact",
            website="https://directory.test/contact",
            idem="directory.test|product-001|alias-google-1|contact email backlink request",
            route="contact email backlink request",
            account_alias="alias-google-1",
            status="email sent — awaiting reply",
            action_channel="official contact email",
            recipient_contact_alias="contact-directory-1",
            contact_source_evidence="ev-contact-001",
            mailbox_pre_send_check="cleared",
            mailbox_pre_send_evidence="ev-mailbox-001",
            email_send_attempts="1",
            gmail_send_receipt="Gmail confirmed sent",
            entered="recipient alias; copy-001; canonical URL",
            agreements="none",
            exact_result="Message sent",
            evidence="ev-gmail-001",
        )
        second = site(
            name="Q-002 — Contact",
            website="https://www.directory.test/submit-a-tool",
            idem="www.directory.test|product-001|alias-google-2|contact email backlink request",
            route="contact email backlink request",
            account_alias="alias-google-2",
            status="email sent — awaiting reply",
            action_channel="official contact email",
            recipient_contact_alias="contact-directory-2",
            contact_source_evidence="ev-contact-002",
            mailbox_pre_send_check="cleared",
            mailbox_pre_send_evidence="ev-mailbox-002",
            email_send_attempts="1",
            gmail_send_receipt="sent copy verified",
            entered="recipient alias; copy-002; canonical URL",
            agreements="none",
            exact_result="Message sent",
            evidence="ev-gmail-002",
        ).replace("- Queue ID: Q-001", "- Queue ID: Q-002").replace(
            "- Platform domain: directory.test", "- Platform domain: www.directory.test"
        )
        result = MODULE.audit(record(first + "\n" + second))
        self.assertFalse(result["valid"])
        self.assertTrue(
            any("duplicate official Contact email scope" in item for item in result["errors"])
        )

        unrelated_root = second.replace(
            "- Platform domain: www.directory.test", "- Platform domain: unrelated.test"
        )
        unrelated_result = MODULE.audit(record(unrelated_root))
        self.assertFalse(unrelated_result["valid"])
        self.assertTrue(
            any("Platform domain must match the Website host" in item
                for item in unrelated_result["errors"])
        )

        public_suffix_only = second.replace(
            "- Platform domain: www.directory.test", "- Platform domain: test"
        )
        suffix_result = MODULE.audit(record(public_suffix_only))
        self.assertFalse(suffix_result["valid"])
        self.assertTrue(
            any("requires a public platform root domain" in item
                for item in suffix_result["errors"])
        )

    def test_failed_contact_send_counts_as_one_send(self) -> None:
        block = site(
            website="https://directory.test/contact",
            idem="directory.test|product-001|alias-google-1|contact email backlink request",
            route="contact email backlink request",
            account_alias="alias-google-1",
            status="blocked — account or email policy",
            action_channel="official contact email",
            recipient_contact_alias="contact-directory-1",
            contact_source_evidence="ev-contact-001",
            mailbox_pre_send_check="cleared",
            mailbox_pre_send_evidence="ev-mailbox-001",
            email_send_attempts="0",
            gmail_send_receipt="send failed",
            entered="recipient alias; copy-001; canonical URL",
            agreements="none",
            submit_timestamp="not submitted",
            exact_result="Send failed",
            evidence="ev-gmail-failed-001",
        )
        result = MODULE.audit(record(block))
        self.assertFalse(result["valid"])
        self.assertTrue(any("send failed requires exactly one Gmail Send" in item for item in result["errors"]))

    def test_contact_email_requires_email_specific_status_and_alias(self) -> None:
        block = site(
            website="https://directory.test/contact",
            idem="directory.test|product-001|alias-google-1|contact email backlink request",
            route="contact email backlink request",
            account_alias="alias-google-1",
            status="submitted",
            action_channel="official contact email",
            recipient_contact_alias="contact@example.test",
            contact_source_evidence="ev-contact-001",
            mailbox_pre_send_check="cleared",
            mailbox_pre_send_evidence="ev-mailbox-001",
            email_send_attempts="1",
            gmail_send_receipt="Gmail confirmed sent",
            entered="recipient alias; copy-001; canonical URL",
            agreements="none",
            exact_result="Message sent",
            evidence="ev-gmail-001",
        )
        result = MODULE.audit(record(block))
        self.assertFalse(result["valid"])
        self.assertTrue(any("must not contain a raw email" in item for item in result["errors"]))
        self.assertTrue(any("email-specific outcome status" in item for item in result["errors"]))

    def test_contact_email_unknown_uses_gmail_checks_only(self) -> None:
        block = site(
            website="https://directory.test/contact",
            idem="directory.test|product-001|alias-google-1|contact email backlink request",
            route="contact email backlink request",
            account_alias="alias-google-1",
            status="email send outcome unknown",
            action_channel="official contact email",
            recipient_contact_alias="contact-directory-1",
            contact_source_evidence="ev-contact-001",
            mailbox_pre_send_check="cleared",
            mailbox_pre_send_evidence="ev-mailbox-001",
            email_send_attempts="1",
            gmail_send_receipt="no clear receipt",
            outcome_check_attempts="2",
            handover_page="gmail-tab-001",
            entered="recipient alias; copy-001; canonical URL",
            agreements="none",
            exact_result="Send result unclear",
            evidence="ev-gmail-unknown-001",
            mailbox_checked="compose, Sent, All Mail, Drafts checked twice",
        )
        result = MODULE.audit(record(block))
        self.assertTrue(result["valid"], result["errors"])

    def test_action_channel_cannot_borrow_the_other_channel_outcome(self) -> None:
        email_as_form = site(
            status="email sent — awaiting reply",
            action_channel="web form",
            exact_result="Message sent",
            evidence="ev-gmail-001",
        )
        form_result = MODULE.audit(record(email_as_form))
        self.assertFalse(form_result["valid"])
        self.assertTrue(
            any("web form must not use an email-specific outcome status" in item
                for item in form_result["errors"])
        )

        generic_unknown_as_email = site(
            website="https://directory.test/contact",
            idem="directory.test|product-001|alias-google-1|contact email backlink request",
            route="contact email backlink request",
            account_alias="alias-google-1",
            status="submission outcome unknown",
            action_channel="official contact email",
            recipient_contact_alias="contact-directory-1",
            contact_source_evidence="ev-contact-001",
            mailbox_pre_send_check="cleared",
            mailbox_pre_send_evidence="ev-mailbox-001",
            email_send_attempts="1",
            gmail_send_receipt="no clear receipt",
            outcome_check_attempts="2",
            handover_page="gmail-tab-001",
            entered="recipient alias; copy-001; canonical URL",
            agreements="none",
            exact_result="Send result unclear",
            evidence="ev-gmail-unknown-001",
            mailbox_checked="compose, Sent, All Mail, Drafts checked twice",
        )
        email_result = MODULE.audit(record(generic_unknown_as_email))
        self.assertFalse(email_result["valid"])
        self.assertTrue(
            any("official contact email must use an email-specific outcome status" in item
                for item in email_result["errors"])
        )

    def test_no_action_content_surface_cannot_enter_manual_queue_or_claim_result(self) -> None:
        block = site(
            status="ineligible",
            content_surface="short note — no action",
            content_surface_evidence="ev-content-005",
            verification="awaiting manual verification",
            duplicate_check="not checked",
            duplicate_evidence="not applicable",
            outcome_check_attempts="3",
            entered="none",
            agreements="none",
            submit_timestamp="not submitted",
            exact_result="Posted successfully",
            evidence="not applicable",
        )
        result = MODULE.audit(record(block))
        self.assertFalse(result["valid"])
        self.assertTrue(
            any("must not have unresolved verification" in item for item in result["errors"])
        )
        self.assertTrue(
            any("must not claim a final result" in item for item in result["errors"])
        )
        self.assertNotIn("Q-001 — Directory", result["manual_verification_queue"])

    def test_no_action_content_surface_can_be_recorded_without_execution(self) -> None:
        block = site(
            status="ineligible",
            content_surface="short note — no action",
            content_surface_evidence="ev-content-001",
            verification="not checked",
            duplicate_check="not checked",
            duplicate_evidence="not applicable",
            entered="none",
            agreements="none",
            submit_timestamp="not submitted",
            exact_result="not attempted",
            evidence="not applicable",
        )
        result = MODULE.audit(record(block))
        self.assertTrue(result["valid"], result["errors"])

    def test_no_action_content_surface_cannot_execute_or_prepare_handoff(self) -> None:
        submitted = site(
            content_surface="long post — no action",
            content_surface_evidence="ev-content-002",
        )
        submitted_result = MODULE.audit(record(submitted))
        self.assertFalse(submitted_result["valid"])
        self.assertTrue(
            any("incompatible with Content surface" in item for item in submitted_result["errors"])
        )

        prepared = site(
            status="ineligible",
            content_surface="short note — no action",
            content_surface_evidence="ev-content-003",
            verification="not checked",
            duplicate_check="not checked",
            duplicate_evidence="not applicable",
            entered="brand, URL",
            agreements="terms accepted",
            submit_timestamp="not submitted",
            exact_result="not attempted",
            evidence="not applicable",
            handover_page="tab-001",
        )
        prepared_result = MODULE.audit(record(prepared))
        self.assertFalse(prepared_result["valid"])
        self.assertTrue(
            any("must not have entered fields" in item for item in prepared_result["errors"])
        )
        self.assertTrue(
            any("must not have a handover page" in item for item in prepared_result["errors"])
        )

    def test_legacy_short_note_authorization_is_rejected(self) -> None:
        block = site(
            status="ineligible",
            content_surface="short note — authorized",
            content_surface_evidence="ev-content-004",
            verification="not checked",
            duplicate_check="not checked",
            duplicate_evidence="not applicable",
            entered="none",
            agreements="none",
            submit_timestamp="not submitted",
            exact_result="not attempted",
            evidence="not applicable",
        )
        result = MODULE.audit(record(block))
        self.assertFalse(result["valid"])
        self.assertTrue(any("invalid Content surface" in item for item in result["errors"]))

    def test_duplicate_tracking_variant_fails(self) -> None:
        first = site()
        second = site(
            name="Q-002 — Duplicate",
            website="https://directory.test/submit?utm_source=x",
            idem="directory.test|product-001|account-002|directory listing",
        )
        second = second.replace("- Queue ID: Q-001", "- Queue ID: Q-002")
        result = MODULE.audit(record(first + "\n" + second))
        self.assertFalse(result["valid"])
        self.assertTrue(any("duplicate normalized website" in item for item in result["errors"]))

    def test_duplicate_queue_id_fails(self) -> None:
        first = site()
        second = site(name="Q-002 — Separate", website="https://other.test/submit")
        result = MODULE.audit(record(first + "\n" + second))
        self.assertFalse(result["valid"])
        self.assertTrue(any("duplicate Queue ID" in item for item in result["errors"]))

    def test_website_must_be_public_http_url(self) -> None:
        result = MODULE.audit(record(site(website="javascript:alert(1)")))
        self.assertFalse(result["valid"])
        self.assertTrue(any("Website must be an http(s) URL" in item for item in result["errors"]))

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


if __name__ == "__main__":
    unittest.main()
