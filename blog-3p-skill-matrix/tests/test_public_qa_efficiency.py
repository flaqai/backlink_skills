#!/usr/bin/env python3
"""Regression checks for the same-lane, low-cost public URL return path."""
from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
HARNESS_PATH = ROOT / "skills/blog-3p-harness/scripts/harnessctl.py"
SNAPSHOT_PATH = ROOT / "skills/blog-3p-human-handoff/scripts/capture_public_snapshot.py"
PUBLIC_PAGE = ROOT / "tests/fixtures/public-page.html"
SPEC = importlib.util.spec_from_file_location("blog_3p_public_harnessctl", HARNESS_PATH)
assert SPEC is not None and SPEC.loader is not None
HARNESS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HARNESS)


def article(article_id: str = "A1") -> dict:
    return {
        "article_id": article_id,
        "language": "en",
        "market": "US",
        "focus_keyword": "example task",
        "reader_value_promise": "Explain the reader task before making a secondary recommendation.",
        "cta": {
            "mode": "SECONDARY_RECOMMENDATION",
            "anchor_text": "Try Example Product",
            "product_name": "Example Product",
            "product_destination_url": "https://example.com/product",
            "product_evidence_path": "research/source-ledger.md#example-product",
            "reader_task_relevance": "It is one relevant option after the standalone answer.",
            "relationship_disclosure": "Sponsored recommendation.",
        },
    }


def package_for(item: dict) -> dict:
    return {
        "schema_version": "1.3",
        "article_id": item["article_id"],
        "canonical_path": "canonical/article.md",
        "canonical_sha256": "a" * 64,
        "title": "Example article",
        "cta": copy.deepcopy(item["cta"]),
        "reader_value_promise": item["reader_value_promise"],
        "artifact_sources": {
            "evidence_pack": {"path": "research/evidence-pack.json", "sha256": "PENDING", "role": "ARTICLE_CLAIM_AND_SEO_DECISION_INDEX"},
            "visual_manifest": {"path": "canonical/visual-manifest.json", "sha256": "PENDING", "role": "SINGLE_SOURCE_FOR_IMAGE_ASSETS_ALT_CAPTIONS_AND_PLACEMENT"},
            "handoff_manifest": {"path": "handoff/handoff-manifest.json", "sha256": "PENDING_AFTER_PAYLOAD", "role": "DERIVED_HANDOFF_ARTIFACT_AND_HASH_INDEX"},
            "manual_retelling": "PROHIBITED",
        },
        "final_visual_payload_delta": {
            "precondition": "TEXT_AND_SEO_FIELDS_STABLE",
            "scope": "VISUAL_MANIFEST_ASSETS_AND_COMPILED_PAYLOAD_ONLY",
            "reviewer_result": "PENDING",
            "report_path": "reviews/visual-payload-delta-N.md",
        },
    }


def receipt_for(article_id: str = "A1", human_state: str = "HUMAN_ACCEPTED") -> dict:
    return {
        "schema_version": "1.0",
        "article_id": article_id,
        "public_url": "https://example.com/posts/example-article",
        "human_state": human_state,
        "returned_at": "2026-09-16T00:00:00Z",
        "published_at_or_revision": "UNVERIFIED",
        "public_visual_evidence_paths": [],
        "known_platform_limitations": [],
    }


def public_record(lane_id: str, status: str = "PUBLIC_QA_PASSED") -> dict:
    return {
        "public_url": "https://example.com/posts/example-article",
        "human_state": "HUMAN_ACCEPTED",
        "returned_at": "2026-09-16T00:00:00Z",
        "return_receipt_path": "handoff/public-return-receipt.json",
        "public_snapshot_path": "evidence/public-qa/public-snapshot.json",
        "lane_gatekeeper_agent_id": lane_id,
        "attempt": 1,
        "unverified_retry_count": 0,
        "public_qa_status": status,
        "last_report_path": "gate/public-qa-report-1.md",
        "owner_request_id": None,
        "accepted_platform_limitations": [],
    }


def public_report_for(article_id: str, record: dict) -> str:
    return "\n".join([
        f"# Public QA report — {article_id}",
        f"- Existing lane G agent ID: `{record['lane_gatekeeper_agent_id']}`",
        f"- Public URL: `{record['public_url']}`",
        f"- Human return receipt: `{record['return_receipt_path']}`",
        f"- Normalized public snapshot: `{record['public_snapshot_path']}`",
        f"- Selected result: `{record['public_qa_status']}`",
        f"- Owner request ID: `{record['owner_request_id'] or 'NOT_APPLICABLE'}`",
        "",
    ])


def batch_public_record(article_id: str = "A1", status: str = "PUBLIC_QA_PASSED") -> dict:
    return {
        "public_url": "https://example.com/posts/example-article",
        "human_state": "HUMAN_ACCEPTED",
        "returned_at": "2026-09-16T00:00:00Z",
        "return_receipt_path": "handoff/public-return-receipt.json",
        "public_snapshot_path": "evidence/public-qa/public-snapshot.json",
        "campaign_gatekeeper_agent_id": "G-CAMPAIGN",
        "batch_id": "PUBLIC-QA-BATCH-001",
        "batch_entry_id": f"{article_id}-PUBLIC-001",
        "batch_entry_sha256": "PENDING",
        "attempt": 1,
        "unverified_retry_count": 0,
        "public_qa_status": status,
        "last_report_path": "gate/public-qa-batch-001.json",
        "owner_request_id": None,
        "accepted_platform_limitations": [],
    }


def batch_public_entry(article_id: str, record: dict, workspace: Path, package_path: Path) -> dict:
    return {
        "entry_id": record["batch_entry_id"],
        "article_id": article_id,
        "article_contract": {"path": "context/article-contract.json", "sha256": HARNESS.sha256_file(workspace / "context/article-contract.json")},
        "article_package": {"path": "article-package.json", "sha256": HARNESS.sha256_file(package_path)},
        "handoff_manifest": {"path": "handoff/handoff-manifest.json", "sha256": HARNESS.sha256_file(workspace / "handoff/handoff-manifest.json")},
        "return_receipt": {"path": record["return_receipt_path"], "sha256": HARNESS.sha256_file(workspace / record["return_receipt_path"])},
        "public_snapshot": {"path": record["public_snapshot_path"], "sha256": HARNESS.sha256_file(workspace / record["public_snapshot_path"])},
        "public_url": record["public_url"],
        "human_state": record["human_state"],
        "returned_at": record["returned_at"],
        "visual_evidence_mode": "RENDERED_READER_PAGE",
        "rendered_visual_evidence_paths": ["evidence/public-qa/rendered-page.png"],
        "result": record["public_qa_status"],
        "finding_ids": [],
        "accepted_platform_limitations": record["accepted_platform_limitations"],
        "attempt": record["attempt"],
        "unverified_retry_count": record["unverified_retry_count"],
        "owner_request_id": record["owner_request_id"],
    }


class PublicQaEfficiencyTests(unittest.TestCase):
    def run_script(self, script: Path, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(script), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def initialize(self) -> tuple[tempfile.TemporaryDirectory, Path]:
        temp_dir = tempfile.TemporaryDirectory()
        workspace = Path(temp_dir.name) / "campaign"
        initialized = self.run_script(HARNESS_PATH, "init", "--workspace", str(workspace), "--campaign-id", "public-qa")
        self.assertEqual(initialized.returncode, 0, initialized.stdout + initialized.stderr)
        return temp_dir, workspace

    def prepare_workspace(self, workspace: Path) -> tuple[dict, Path, Path]:
        item = article()
        campaign_path = workspace / "campaign.json"
        campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
        campaign["articles"] = [item]
        campaign_path.write_text(json.dumps(campaign), encoding="utf-8")
        package_path = workspace / "article-package.json"
        package_path.write_text(json.dumps(package_for(item)), encoding="utf-8")
        receipt_path = workspace / "handoff/public-return-receipt.json"
        receipt_path.write_text(json.dumps(receipt_for()), encoding="utf-8")
        return item, package_path, receipt_path

    def test_template_initializer_and_policy_lock_the_streamlined_route(self) -> None:
        template = json.loads((ROOT / "templates/campaign.json").read_text(encoding="utf-8"))
        generated = HARNESS.campaign("REPLACE_ME")
        self.assertEqual(template, generated)
        self.assertEqual(template["schema_version"], "2.14")
        self.assertEqual(template["live_execution_profile"], HARNESS.HUMAN_RELEASE_PROFILE_2_14)
        self.assertEqual(template["orchestration_policy"]["public_qa_policy"], HARNESS.PUBLIC_QA_POLICY_2_7)
        self.assertEqual(template["orchestration_policy"]["batch_gate_policy"], HARNESS.GATE_BATCH_POLICY_2_14)
        self.assertEqual(HARNESS.state("test")["publication"]["articles"], {})
        temp_dir, workspace = self.initialize()
        with temp_dir:
            self.assertTrue((workspace / "evidence/public-qa").is_dir())
            checked = self.run_script(HARNESS_PATH, "check", "--workspace", str(workspace))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)

    def test_policy_rejects_fresh_reviewer_or_automatic_wr_reopen(self) -> None:
        policy = copy.deepcopy(HARNESS.PUBLIC_QA_POLICY_2_7)
        policy["fresh_public_reviewer"] = "ALLOWED"
        self.assertTrue(HARNESS.public_qa_policy_errors(policy, expected=HARNESS.PUBLIC_QA_POLICY_2_7))
        policy = copy.deepcopy(HARNESS.PUBLIC_QA_POLICY_2_7)
        policy["automatic_wr_reopen"] = True
        self.assertTrue(HARNESS.public_qa_policy_errors(policy, expected=HARNESS.PUBLIC_QA_POLICY_2_7))

    def test_receipt_checker_requires_article_mapping_and_scoped_limitation(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            _, package_path, receipt_path = self.prepare_workspace(workspace)
            checked = self.run_script(
                HARNESS_PATH, "check-public-return-receipt", "--workspace", str(workspace),
                "--receipt", str(receipt_path), "--article-package", str(package_path),
            )
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
            receipt["known_platform_limitations"] = [{
                "id": "PLATFORM-LIMITATION-001",
                "observed_behavior": "A visible reader-page limitation.",
                "scope": {"platform": "Example", "account_or_site": "example", "locale_or_market": "US", "observed_at": "2026-09-16"},
                "evidence_paths": ["evidence/public-qa/page.png"],
                "affected_contract_items": ["PUBLIC-VISUAL-HIERARCHY"],
                "owner_acceptance": "PENDING_G_CLASSIFICATION",
                "not_generalizable": True,
            }]
            receipt_path.write_text(json.dumps(receipt), encoding="utf-8")
            invalid = self.run_script(
                HARNESS_PATH, "check-public-return-receipt", "--workspace", str(workspace),
                "--receipt", str(receipt_path), "--article-package", str(package_path),
            )
            self.assertNotEqual(invalid.returncode, 0)
            self.assertIn("editor_or_theme", invalid.stdout)
            bypass_attempt = self.run_script(
                SNAPSHOT_PATH, "--receipt", str(receipt_path), "--article-package", str(package_path),
                "--html-file", str(PUBLIC_PAGE), "--output", str(workspace / "evidence/public-qa/public-snapshot.json"),
            )
            self.assertNotEqual(bypass_attempt.returncode, 0)
            self.assertIn("editor_or_theme", bypass_attempt.stdout)

    def test_snapshot_reports_transport_without_inferring_headings(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            _, package_path, receipt_path = self.prepare_workspace(workspace)
            output = workspace / "evidence/public-qa/public-snapshot.json"
            captured = self.run_script(
                SNAPSHOT_PATH, "--receipt", str(receipt_path), "--article-package", str(package_path),
                "--html-file", str(PUBLIC_PAGE), "--output", str(output),
            )
            self.assertEqual(captured.returncode, 0, captured.stdout + captured.stderr)
            self.assertIn("PUBLIC_SNAPSHOT_CAPTURED", captured.stdout)
            snapshot = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(snapshot["capture_status"], "CAPTURED")
            self.assertEqual(snapshot["observed_transport"]["document_title"], "Example article")
            cta = snapshot["observed_transport"]["links"]["required_cta"]
            self.assertTrue(cta["exact_anchor_href_found"])
            self.assertEqual(cta["relationship_disclosure"], "FOUND")
            self.assertEqual(snapshot["observed_transport"]["images"]["observable_alt_count"], 1)
            self.assertEqual(snapshot["observed_transport"]["images"]["captions"][0]["text"], "A visible image caption.")
            self.assertEqual(snapshot["visual_hierarchy"]["status"], "REQUIRES_RENDERED_VISUAL_EVIDENCE")
            self.assertNotIn("heading_level", json.dumps(snapshot))

    def test_human_needs_fix_skips_snapshot_and_cannot_be_a_public_pass(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            _, package_path, receipt_path = self.prepare_workspace(workspace)
            receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
            receipt["human_state"] = "HUMAN_NEEDS_FIX"
            receipt_path.write_text(json.dumps(receipt), encoding="utf-8")
            output = workspace / "evidence/public-qa/public-snapshot.json"
            skipped = self.run_script(
                SNAPSHOT_PATH, "--receipt", str(receipt_path), "--article-package", str(package_path),
                "--html-file", str(PUBLIC_PAGE), "--output", str(output),
            )
            self.assertEqual(skipped.returncode, 0, skipped.stdout + skipped.stderr)
            self.assertIn("PUBLIC_SNAPSHOT_SKIPPED", skipped.stdout)
            self.assertFalse(output.exists())

    def test_per_article_ledger_reuses_each_registered_lane_and_requires_owner_request_for_canonical_change(self) -> None:
        workspaces = {
            "A1": {"role_bundle": {"lane_gatekeeper_agent": "G-A1"}},
            "A2": {"role_bundle": {"lane_gatekeeper_agent": "G-A2"}},
        }
        publication = {
            "status": "IN_PROGRESS",
            "articles": {"A1": public_record("G-A1"), "A2": public_record("G-A2")},
        }
        self.assertEqual(
            HARNESS.publication_ledger_errors(publication, article_ids={"A1", "A2"}, article_workspaces=workspaces),
            [],
        )
        wrong_lane = copy.deepcopy(publication)
        wrong_lane["articles"]["A2"]["lane_gatekeeper_agent_id"] = "G-A1"
        self.assertTrue(any("registered lane gatekeeper" in error for error in HARNESS.publication_ledger_errors(
            wrong_lane, article_ids={"A1", "A2"}, article_workspaces=workspaces,
        )))
        canonical_change = copy.deepcopy(publication)
        canonical_change["articles"]["A1"]["public_qa_status"] = "CANONICAL_CHANGE_REQUESTED"
        self.assertTrue(any("owner_request_id" in error for error in HARNESS.publication_ledger_errors(
            canonical_change, article_ids={"A1", "A2"}, article_workspaces=workspaces,
        )))
        unbounded_retry = copy.deepcopy(publication)
        unbounded_retry["articles"]["A1"]["public_qa_status"] = "PUBLIC_QA_UNVERIFIED"
        unbounded_retry["articles"]["A1"]["unverified_retry_count"] = 2
        self.assertTrue(any("retry budget" in error for error in HARNESS.publication_ledger_errors(
            unbounded_retry, article_ids={"A1", "A2"}, article_workspaces=workspaces,
        )))

    def test_public_qa_requires_registered_lane_and_blocks_post_return_wr(self) -> None:
        publication = {"status": "IN_PROGRESS", "articles": {"A1": public_record("G-A1")}}
        missing_workspace = HARNESS.publication_ledger_errors(
            publication, article_ids={"A1"}, article_workspaces={},
        )
        self.assertTrue(any("registered article workspace" in error for error in missing_workspace))
        workspaces = {"A1": {"role_bundle": {
            "lane_gatekeeper_agent": "G-A1", "writer_agent": "W-A1", "reviewer_agent": "R-A1",
        }}}
        public_g_turn = {
            "article_id": "A1", "role": "ARTICLE_LANE_GATEKEEPER", "agent_id": "G-A1",
            "workflow_stage": "PUBLIC_QA_READONLY", "result_path": "gate/public-qa-report-1.md",
            "started_at": "2026-09-16T00:00:01Z",
        }
        self.assertEqual(HARNESS.public_qa_task_errors(
            publication, tasks=[public_g_turn], article_workspaces=workspaces,
        ), [])
        fresh_gate = copy.deepcopy(public_g_turn)
        fresh_gate["agent_id"] = "FRESH-G-NOT-REGISTERED"
        self.assertTrue(any("registered agent ID" in error or "registered lane gatekeeper" in error for error in (
            HARNESS.publication_ledger_errors(publication, article_ids={"A1"}, article_workspaces=workspaces)
            + HARNESS.public_qa_task_errors(publication, tasks=[fresh_gate], article_workspaces=workspaces)
        )))
        restarted_reviewer = {
            "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "agent_id": "R-A1",
            "workflow_stage": "REVIEW", "started_at": "2026-09-16T00:00:02Z",
        }
        self.assertTrue(any("post-return W/R is forbidden" in error for error in HARNESS.public_qa_task_errors(
            publication, tasks=[public_g_turn, restarted_reviewer], article_workspaces=workspaces,
        )))
        canonical_reopen = copy.deepcopy(publication)
        canonical_reopen["articles"]["A1"]["public_qa_status"] = "CANONICAL_CHANGE_REQUESTED"
        canonical_reopen["articles"]["A1"]["owner_request_id"] = "OWNER-CHANGE-001"
        approved_reviewer = copy.deepcopy(restarted_reviewer)
        approved_reviewer["workflow_stage"] = "CANONICAL_REOPEN"
        approved_reviewer["owner_request_id"] = "OWNER-CHANGE-001"
        self.assertEqual(HARNESS.public_qa_task_errors(
            canonical_reopen, tasks=[public_g_turn, approved_reviewer], article_workspaces=workspaces,
        ), [])

    def test_public_qa_requires_existing_bound_receipt_snapshot_and_report(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            _, package_path, receipt_path = self.prepare_workspace(workspace)
            snapshot_path = workspace / "evidence/public-qa/public-snapshot.json"
            captured = self.run_script(
                SNAPSHOT_PATH, "--receipt", str(receipt_path), "--article-package", str(package_path),
                "--html-file", str(PUBLIC_PAGE), "--output", str(snapshot_path),
            )
            self.assertEqual(captured.returncode, 0, captured.stdout + captured.stderr)
            record = public_record("G-A1")
            report_path = workspace / record["last_report_path"]
            report_path.parent.mkdir(parents=True, exist_ok=True)
            report_path.write_text(public_report_for("A1", record), encoding="utf-8")
            publication = {"status": "IN_PROGRESS", "articles": {"A1": record}}
            workspaces = {"A1": {"role_bundle": {
                "lane_gatekeeper_agent": "G-A1", "writer_agent": "W-A1", "reviewer_agent": "R-A1",
            }}}
            self.assertEqual(HARNESS.publication_ledger_errors(
                publication, article_ids={"A1"}, article_workspaces=workspaces, workspace=workspace,
            ), [])
            forged_path = copy.deepcopy(publication)
            forged_path["articles"]["A1"]["last_report_path"] = "gate/not-real.md"
            self.assertTrue(any("last_report_path does not exist" in error for error in HARNESS.publication_ledger_errors(
                forged_path, article_ids={"A1"}, article_workspaces=workspaces, workspace=workspace,
            )))
            snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
            snapshot["source"]["requested_url"] = "https://example.com/wrong"
            snapshot_path.write_text(json.dumps(snapshot), encoding="utf-8")
            self.assertTrue(any("public snapshot" in error for error in HARNESS.publication_ledger_errors(
                publication, article_ids={"A1"}, article_workspaces=workspaces, workspace=workspace,
            )))

    def test_one_registered_campaign_g_can_batch_two_public_rows_without_restarting_wr(self) -> None:
        first = batch_public_record("A1")
        second = batch_public_record("A2")
        second["public_url"] = "https://example.com/posts/example-article-two"
        second["returned_at"] = "2026-09-16T00:01:00Z"
        publication = {"status": "IN_PROGRESS", "articles": {"A1": first, "A2": second}}
        workspaces = {
            "A1": {"role_bundle": {"campaign_gatekeeper_agent": "G-CAMPAIGN", "writer_agent": "W-A1", "reviewer_agent": "R-A1"}},
            "A2": {"role_bundle": {"campaign_gatekeeper_agent": "G-CAMPAIGN", "writer_agent": "W-A2", "reviewer_agent": "R-A2"}},
        }
        self.assertEqual(HARNESS.publication_ledger_errors(
            publication, article_ids={"A1", "A2"}, article_workspaces=workspaces,
            batch_mode=True, campaign_gatekeeper_agent_id="G-CAMPAIGN",
        ), [])
        batch_turn = {
            "role": "CAMPAIGN_GATEKEEPER", "agent_id": "G-CAMPAIGN",
            "workflow_stage": "PUBLIC_QA_BATCH_READONLY", "result_path": "gate/public-qa-batch-001.json",
            "article_ids": ["A1", "A2"], "started_at": "2026-09-16T00:02:00Z", "status": "COMPLETED",
        }
        self.assertEqual(HARNESS.public_qa_task_errors(
            publication, tasks=[batch_turn], article_workspaces=workspaces,
            batch_mode=True, campaign_gatekeeper_agent_id="G-CAMPAIGN",
        ), [])
        wrong_agent = copy.deepcopy(publication)
        wrong_agent["articles"]["A2"]["campaign_gatekeeper_agent_id"] = "G-OTHER"
        self.assertTrue(any("registered campaign gatekeeper" in error for error in HARNESS.publication_ledger_errors(
            wrong_agent, article_ids={"A1", "A2"}, article_workspaces=workspaces,
            batch_mode=True, campaign_gatekeeper_agent_id="G-CAMPAIGN",
        )))
        stale_reviewer = {
            "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "agent_id": "R-A1",
            "workflow_stage": "REVIEW", "started_at": "2026-09-16T00:02:01Z",
        }
        self.assertTrue(any("post-return W/R is forbidden" in error for error in HARNESS.public_qa_task_errors(
            publication, tasks=[batch_turn, stale_reviewer], article_workspaces=workspaces,
            batch_mode=True, campaign_gatekeeper_agent_id="G-CAMPAIGN",
        )))
        stale_article_g = {
            "article_id": "A1", "role": "ARTICLE_LANE_GATEKEEPER", "agent_id": "G-A1",
            "workflow_stage": "PUBLIC_QA_READONLY", "started_at": "2026-09-16T00:02:01Z",
        }
        self.assertTrue(any("must not create an article-lane G turn" in error for error in HARNESS.public_qa_task_errors(
            publication, tasks=[batch_turn, stale_article_g], article_workspaces=workspaces,
            batch_mode=True, campaign_gatekeeper_agent_id="G-CAMPAIGN",
        )))

    def test_batch_public_pass_requires_bound_entry_and_rendered_visual_evidence(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            _, package_path, receipt_path = self.prepare_workspace(workspace)
            snapshot_path = workspace / "evidence/public-qa/public-snapshot.json"
            captured = self.run_script(
                SNAPSHOT_PATH, "--receipt", str(receipt_path), "--article-package", str(package_path),
                "--html-file", str(PUBLIC_PAGE), "--output", str(snapshot_path),
            )
            self.assertEqual(captured.returncode, 0, captured.stdout + captured.stderr)
            (workspace / "context/article-contract.json").write_text(json.dumps({"article_id": "A1"}), encoding="utf-8")
            (workspace / "handoff/handoff-manifest.json").write_text("{}", encoding="utf-8")
            rendered = workspace / "evidence/public-qa/rendered-page.png"
            rendered.write_bytes(b"rendered-reader-page-evidence")
            record = batch_public_record()
            entry = batch_public_entry("A1", record, workspace, package_path)
            record["batch_entry_sha256"] = HARNESS.sha256_json(entry)
            report = {
                "schema_version": "1.0", "campaign_id": "public-qa", "batch_id": record["batch_id"],
                "gatekeeper_agent_id": "G-CAMPAIGN", "workflow_stage": "PUBLIC_QA_BATCH_READONLY",
                "entries": [entry],
            }
            report_path = workspace / record["last_report_path"]
            report_path.parent.mkdir(parents=True, exist_ok=True)
            report_path.write_text(json.dumps(report), encoding="utf-8")
            publication = {"status": "IN_PROGRESS", "articles": {"A1": record}}
            workspaces = {"A1": {"role_bundle": {
                "campaign_gatekeeper_agent": "G-CAMPAIGN", "writer_agent": "W-A1", "reviewer_agent": "R-A1",
            }}}
            self.assertEqual(HARNESS.publication_ledger_errors(
                publication, article_ids={"A1"}, article_workspaces=workspaces, workspace=workspace,
                batch_mode=True, campaign_gatekeeper_agent_id="G-CAMPAIGN",
            ), [])
            no_visual = copy.deepcopy(report)
            no_visual["entries"][0]["rendered_visual_evidence_paths"] = []
            record_without_visual = copy.deepcopy(record)
            record_without_visual["batch_entry_sha256"] = HARNESS.sha256_json(no_visual["entries"][0])
            report_path.write_text(json.dumps(no_visual), encoding="utf-8")
            invalid = HARNESS.publication_ledger_errors(
                {"status": "IN_PROGRESS", "articles": {"A1": record_without_visual}},
                article_ids={"A1"}, article_workspaces=workspaces, workspace=workspace,
                batch_mode=True, campaign_gatekeeper_agent_id="G-CAMPAIGN",
            )
            self.assertTrue(any("rendered_visual_evidence_paths" in error for error in invalid))


if __name__ == "__main__":
    unittest.main()
