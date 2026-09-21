#!/usr/bin/env python3
"""Regression coverage for campaign-G batch contract acceptance."""
from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

try:  # support both unittest discovery and direct module invocation
    from manual_release_fixture import configure_confirmed_human_release_map
except ModuleNotFoundError:  # pragma: no cover - discovery normally takes the first branch
    from tests.manual_release_fixture import configure_confirmed_human_release_map


ROOT = Path(__file__).resolve().parents[1]
HARNESS_PATH = ROOT / "skills/blog-3p-harness/scripts/harnessctl.py"
SPEC = importlib.util.spec_from_file_location("blog_3p_harnessctl", HARNESS_PATH)
assert SPEC is not None and SPEC.loader is not None
HARNESS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HARNESS)


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value), encoding="utf-8")


def article_root(workspace: Path, article_id: str = "A1") -> Path:
    """Return the schema-2.13 root for one article's disjoint artifacts."""
    root = workspace / "articles" / article_id
    root.mkdir(parents=True, exist_ok=True)
    return root


class BatchGateControlPlaneTests(unittest.TestCase):
    def run_harness(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(HARNESS_PATH), *args], cwd=ROOT, text=True,
            capture_output=True, check=False,
        )

    def build_ready_batch_workspace(self, workspace: Path) -> tuple[Path, dict]:
        initialized = self.run_harness(
            "init", "--workspace", str(workspace), "--campaign-id", "batch-gate-regression",
        )
        self.assertEqual(initialized.returncode, 0, initialized.stdout + initialized.stderr)

        item = {
            "article_id": "A1",
            "language": "en",
            "market": "US",
            "focus_keyword": "batch gate workflow",
            "reader_value_promise": "Explain the workflow before the secondary recommendation.",
            "cta": {
                "mode": "SECONDARY_RECOMMENDATION",
                "anchor_text": "Try Example Product",
                "product_name": "Example Product",
                "product_destination_url": "https://example.com/product",
                "product_evidence_path": "research/evidence-pack.json#/claims/example-product",
                "reader_task_relevance": "It is a relevant option after the standalone answer.",
                "relationship_disclosure": "NOT_APPLICABLE",
            },
        }
        campaign_path = workspace / "campaign.json"
        campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
        campaign["articles"] = [item]
        campaign_path.write_text(json.dumps(campaign), encoding="utf-8")
        configure_confirmed_human_release_map(
            workspace, HARNESS, campaign_id="batch-gate-regression", article=item,
            confirmation_id="OWNER-BATCH-001",
        )

        plan_path = workspace / "prewrite-plan.json"
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        plan["campaign_summary"] = {
            section: f"confirmed {section}"
            for section in HARNESS.MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS
        }
        plan["article_plans"] = [{
            "article_id": "A1",
            "evidence_refs": ["research/evidence-pack.json"],
            **{
                section: f"confirmed {section}"
                for section in HARNESS.MODEL_FIRST_PREWRITE_PLAN_SECTIONS
            },
            "topic_slot": {
                "slot_id": "A1-TOPIC",
                "reader_task": "Help the reader complete the batch-gate workflow.",
                "core_intent": "Practical instructional workflow.",
                "market": item["market"],
                "differentiation_angle": "A bounded batch-gate example.",
                "forbidden_deviations": ["Do not make unsupported performance claims."],
            },
            "frozen_delivery_mapping": {
                "article_language": item["language"], "market": item["market"],
                "platform": "ExamplePlatform", "account": "ACCOUNT-A1",
                "fit_mode": "PRIMARY_AUDIENCE_MATCH", "cross_language_exception": None,
            },
            "evidence_posture": {
                "mode": "METHOD_TEMPLATE_NO_EXECUTION", "empirical_claims_allowed": False,
                "claim_boundary": "The article gives a reader-run method, not test results.",
                "evidence_paths": [],
            },
            "review_effort": copy.deepcopy(HARNESS.STANDARD_REVIEW_EFFORT),
        }]
        plan_path.write_text(json.dumps(plan), encoding="utf-8")
        synced = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
        self.assertEqual(synced.returncode, 0, synced.stdout + synced.stderr)
        receipt = workspace / "evidence/owner-confirmations/owner-confirmation.md"
        receipt.write_text("OWNER_PREWRITE_PLAN_CONFIRMED\n", encoding="utf-8")
        confirmed = self.run_harness(
            "confirm-prewrite-plan", "--workspace", str(workspace),
            "--confirmation-id", "OWNER-BATCH-001", "--receipt-file", str(receipt),
            "--receipt-type", "OWNER_MESSAGE", "--source-locator", "test-owner-message-batch-001",
        )
        self.assertEqual(confirmed.returncode, 0, confirmed.stdout + confirmed.stderr)

        root = article_root(workspace)
        canonical = root / "canonical/article.html"
        canonical.parent.mkdir(parents=True, exist_ok=True)
        canonical.write_text("# Batch gate workflow\n\nUseful answer.\n", encoding="utf-8")
        evidence = root / "research/evidence-pack.json"
        write_json(evidence, {"schema_version": "1.0", "claims": []})
        metadata = root / "canonical/metadata.json"
        write_json(metadata, {
            "canonical_title": "Batch gate workflow",
            "platform_title": "Batch gate workflow",
            "seo_title": "Batch gate workflow guide",
            "tags": ["example"],
            "description": "A useful batch gate workflow.",
        })
        visual_manifest = root / "canonical/visual-manifest.json"
        write_json(visual_manifest, {"schema_version": "1.0", "assets": []})
        handoff = root / "handoff/handoff-manifest.json"
        write_json(handoff, {"schema_version": "1.0", "article_id": "A1"})
        trace = root / "requirements-traceability.md"
        trace.write_text("REQ-SEO-001 -> canonical/article.html\n", encoding="utf-8")

        context = root / "context/article-contract.json"
        built_context = self.run_harness(
            "build-article-context", "--workspace", str(workspace),
            "--article-id", "A1", "--output", str(context),
        )
        self.assertEqual(built_context.returncode, 0, built_context.stdout + built_context.stderr)
        index = root / "reviews/review-index.json"
        built_index = self.run_harness(
            "build-review-index", "--workspace", str(workspace),
            "--article-contract", str(context), "--output", str(index),
        )
        self.assertEqual(built_index.returncode, 0, built_index.stdout + built_index.stderr)

        review_report = root / "reviews/review-1.md"
        review_report.parent.mkdir(parents=True, exist_ok=True)
        review_report.write_text("R: full review approved.\n", encoding="utf-8")
        index_data = json.loads(index.read_text(encoding="utf-8"))
        index_data["latest_full_review"].update({
            "status": "APPROVED",
            "report_path": "articles/A1/reviews/review-1.md",
            "report_sha256": HARNESS.sha256_file(review_report),
            "reviewer_agent_id": "R-A1",
            "canonical_sha256": HARNESS.sha256_file(canonical),
            "evidence_pack_sha256": HARNESS.sha256_file(evidence),
        })
        write_json(index, index_data)

        package = root / "article-package.json"
        write_json(package, {
            "schema_version": "1.4",
            "article_id": "A1",
            "canonical_path": "canonical/article.html",
            "canonical_sha256": HARNESS.sha256_file(canonical),
            "reader_value_promise": item["reader_value_promise"],
            "cta": copy.deepcopy(item["cta"]),
            "title_transfer_mode": "SEPARATE_TITLE_FIELD",
            "artifact_sources": {
                "evidence_pack": {
                    "path": "research/evidence-pack.json",
                    "sha256": HARNESS.sha256_file(evidence),
                    "role": "ARTICLE_CLAIM_AND_SEO_DECISION_INDEX",
                },
                "visual_manifest": {
                    "path": "canonical/visual-manifest.json",
                    "sha256": HARNESS.sha256_file(visual_manifest),
                    "role": "SINGLE_SOURCE_FOR_IMAGE_ASSETS_ALT_CAPTIONS_AND_PLACEMENT",
                },
                "metadata": {
                    "path": "canonical/metadata.json",
                    "sha256": HARNESS.sha256_file(metadata),
                    "role": "SINGLE_SOURCE_FOR_TITLE_AND_SEO_METADATA",
                },
                "manual_retelling": "PROHIBITED",
            },
        })

        state_path = workspace / "state.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["orchestration"]["campaign_gatekeeper_agent_id"] = "G-CAMPAIGN"
        state["orchestration"]["article_workspaces"] = {
            "A1": {
                "root_role": "ARTICLE_WRITER_REVIEWER_PAIR",
                "role_bundle": {
                    "campaign_gatekeeper_agent": "G-CAMPAIGN",
                    "writer_agent": "W-A1",
                    "reviewer_agent": "R-A1",
                },
                "isolation": "MAIN_SESSION_PATH_ISOLATED",
                "artifact_root": "articles/A1",
            },
        }
        state["orchestration"]["tasks"] = [{
            "article_id": "A1",
            "role": "ARTICLE_LANGUAGE_REVIEWER",
            "agent_id": "R-A1",
            "workflow_stage": "FULL_REVIEW",
            "result": "APPROVED",
            "result_path": "articles/A1/reviews/review-1.md",
            "status": "COMPLETED",
        }, {
            "role": "CAMPAIGN_GATEKEEPER",
            "agent_id": "G-CAMPAIGN",
            "workflow_stage": "BATCH_GATE_ACCEPTANCE",
            "result_path": "gate/batch-gate-report.json",
            "article_ids": ["A1"],
            "status": "COMPLETED",
        }]
        write_json(state_path, state)

        full_review = index_data["latest_full_review"]
        report = {
            "schema_version": "1.0",
            "campaign_id": "batch-gate-regression",
            "workflow_stage": "BATCH_GATE_ACCEPTANCE",
            "gatekeeper_agent_id": "G-CAMPAIGN",
            "batch_scope": {
                "batch_id": "BATCH-G-001",
                "article_ids": ["A1"],
                "prewrite_confirmation_id": "OWNER-BATCH-001",
                "requirements_contract_sha256": HARNESS.sha256_file(workspace / "requirements-contract.md"),
            },
            "aggregate_status": "READY",
            "rows": [{
                "article_id": "A1",
                "status": "HUMAN_RELEASE_READY",
                "article_contract": {"path": "context/article-contract.json", "sha256": HARNESS.sha256_file(context)},
                "review_index": {"path": "reviews/review-index.json", "sha256": HARNESS.sha256_file(index)},
                "article_package": {"path": "article-package.json", "sha256": HARNESS.sha256_file(package)},
                "handoff_manifest": {"path": "handoff/handoff-manifest.json", "sha256": HARNESS.sha256_file(handoff)},
                "requirements_traceability": {"path": "requirements-traceability.md", "sha256": HARNESS.sha256_file(trace)},
                "full_review": {
                    field: full_review[field]
                    for field in ("status", "reviewer_agent_id", "report_path", "report_sha256")
                },
                "requirement_finding_ids": [],
            }],
        }
        report_path = workspace / "gate/batch-gate-report.json"
        write_json(report_path, report)
        return report_path, report

    def test_campaign_gatekeeper_accepts_one_r_approved_article_in_one_batch(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir) / "campaign"
            report_path, _ = self.build_ready_batch_workspace(workspace)
            checked = self.run_harness(
                "check-batch-gate", "--workspace", str(workspace),
                "--report", str(report_path),
            )
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            self.assertIn("BATCH_GATE_CHECK_PASSED", checked.stdout)

    def test_batch_gate_rejects_an_unregistered_gatekeeper_identity(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir) / "campaign"
            report_path, report = self.build_ready_batch_workspace(workspace)
            report["gatekeeper_agent_id"] = "G-IMPOSTOR"
            write_json(report_path, report)
            rejected = self.run_harness(
                "check-batch-gate", "--workspace", str(workspace),
                "--report", str(report_path),
            )
            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn("must use the registered campaign gatekeeper", rejected.stdout)


if __name__ == "__main__":
    unittest.main()
