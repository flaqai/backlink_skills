"""Regression tests for the smallest repeatable real-work startup path."""
from __future__ import annotations

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
SPEC = importlib.util.spec_from_file_location("blog_3p_harnessctl_live", HARNESS_PATH)
assert SPEC is not None and SPEC.loader is not None
HARNESS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HARNESS)


def article() -> dict:
    return {
        "article_id": "A1",
        "language": "en",
        "market": "US",
        "focus_keyword": "example workflow",
        "reader_value_promise": "Explain the workflow before the secondary recommendation.",
        "cta": {
            "mode": "SECONDARY_RECOMMENDATION",
            "anchor_text": "Try Example Product",
            "product_name": "Example Product",
            "product_destination_url": "https://example.com/product",
            "product_evidence_path": "research/evidence-pack.json#/claims/example-product",
            "reader_task_relevance": "It is relevant after the standalone answer.",
            "relationship_disclosure": "NOT_APPLICABLE",
        },
    }


def topic_slot(item: dict) -> dict:
    return {
        "slot_id": f"{item['article_id']}-TOPIC",
        "reader_task": "Help the reader complete the example workflow.",
        "core_intent": "Practical instructional workflow.",
        "market": item["market"],
        "differentiation_angle": "A bounded, evidence-led practical guide.",
        "forbidden_deviations": ["Do not turn this into a product-performance claim."],
    }


def article_root(workspace: Path, article_id: str = "A1") -> Path:
    """Return the schema-2.13 artifact root for one article fixture."""
    root = workspace / "articles" / article_id
    root.mkdir(parents=True, exist_ok=True)
    return root


class LiveBaselineTests(unittest.TestCase):
    def run_harness(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(HARNESS_PATH), *args], cwd=ROOT,
            text=True, capture_output=True, check=False,
        )

    def initialize_prepared_plan(self) -> tuple[tempfile.TemporaryDirectory[str], Path]:
        temp_dir = tempfile.TemporaryDirectory()
        workspace = Path(temp_dir.name) / "campaign"
        initialized = self.run_harness("init", "--workspace", str(workspace), "--campaign-id", "live")
        self.assertEqual(initialized.returncode, 0, initialized.stdout + initialized.stderr)
        campaign_path = workspace / "campaign.json"
        campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
        item = article()
        campaign["articles"] = [item]
        campaign_path.write_text(json.dumps(campaign), encoding="utf-8")
        plan_path = workspace / "prewrite-plan.json"
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        plan["campaign_summary"] = {section: f"prepared {section}" for section in HARNESS.MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS}
        plan["article_plans"] = [{
            "article_id": "A1",
            "evidence_refs": ["evidence/shared/campaign-evidence-pack.json"],
            **{section: f"prepared {section}" for section in HARNESS.MODEL_FIRST_PREWRITE_PLAN_SECTIONS},
            "topic_slot": topic_slot(item),
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
            "review_effort": dict(HARNESS.STANDARD_REVIEW_EFFORT),
        }]
        plan_path.write_text(json.dumps(plan), encoding="utf-8")
        synced = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
        self.assertEqual(synced.returncode, 0, synced.stdout + synced.stderr)
        state = json.loads((workspace / "state.json").read_text(encoding="utf-8"))
        self.assertEqual(state["phase"], "awaiting_owner_prewrite_confirmation")
        return temp_dir, workspace

    def test_live_confirmation_requires_a_hash_bound_owner_receipt(self) -> None:
        temp_dir, workspace = self.initialize_prepared_plan()
        with temp_dir:
            plan_path = workspace / "prewrite-plan.json"
            plan = json.loads(plan_path.read_text(encoding="utf-8"))
            plan["status"] = "OWNER_PREWRITE_PLAN_CONFIRMED"
            plan["owner_confirmation_id"] = "SELF-TYPED-001"
            plan_path.write_text(json.dumps(plan), encoding="utf-8")
            forged = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
            self.assertNotEqual(forged.returncode, 0)
            self.assertIn("owner confirmation receipt", forged.stdout)

    def test_live_happy_path_has_a_distinct_dispatch_readiness_gate(self) -> None:
        temp_dir, workspace = self.initialize_prepared_plan()
        with temp_dir:
            initially = self.run_harness("dispatch-readiness", "--workspace", str(workspace))
            self.assertNotEqual(initially.returncode, 0)
            self.assertIn("owner confirmation is missing", initially.stdout)
            receipt = workspace / "evidence/owner-confirmations/owner-confirmation.md"
            receipt.write_text("OWNER_PREWRITE_PLAN_CONFIRMED\n", encoding="utf-8")
            configure_confirmed_human_release_map(
                workspace, HARNESS, campaign_id="live", article=article(),
                confirmation_id="OWNER-LIVE-001",
            )
            confirmed = self.run_harness(
                "confirm-prewrite-plan", "--workspace", str(workspace),
                "--confirmation-id", "OWNER-LIVE-001", "--receipt-file", str(receipt),
                "--receipt-type", "OWNER_MESSAGE", "--source-locator", "test-owner-message-live-001",
            )
            self.assertEqual(confirmed.returncode, 0, confirmed.stdout + confirmed.stderr)
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            state = json.loads((workspace / "state.json").read_text(encoding="utf-8"))
            self.assertEqual(state["prewrite_plan"]["owner_confirmation_receipt"]["source_sha256"], HARNESS.sha256_file(receipt))
            campaign = json.loads((workspace / "campaign.json").read_text(encoding="utf-8"))
            self.assertEqual(campaign["scope_lock"]["status"], "LOCKED")
            self.assertEqual(campaign["scope_lock"]["owner_confirmation"], "OWNER_PREWRITE_PLAN_CONFIRMED")
            not_ready = self.run_harness("dispatch-readiness", "--workspace", str(workspace))
            self.assertNotEqual(not_ready.returncode, 0)
            self.assertIn("REQ-<AREA>-NNN", not_ready.stdout)
            requirements = workspace / "requirements-contract.md"
            requirements.write_text(requirements.read_text(encoding="utf-8") + "\n- REQ-SCOPE-001: owner confirmed scope\n", encoding="utf-8")
            state["orchestration"]["campaign_gatekeeper_agent_id"] = "G-CAMPAIGN-001"
            (workspace / "state.json").write_text(json.dumps(state), encoding="utf-8")
            ready = self.run_harness("dispatch-readiness", "--workspace", str(workspace))
            self.assertEqual(ready.returncode, 0, ready.stdout + ready.stderr)
            self.assertIn("DISPATCH_READY", ready.stdout)

    def test_current_schema_blocks_context_build_without_owner_release_mapping(self) -> None:
        temp_dir, workspace = self.initialize_prepared_plan()
        with temp_dir:
            root = article_root(workspace)
            receipt = workspace / "evidence/owner-confirmations/owner-confirmation.md"
            receipt.write_text("OWNER_PREWRITE_PLAN_CONFIRMED\n", encoding="utf-8")
            confirmed = self.run_harness(
                "confirm-prewrite-plan", "--workspace", str(workspace),
                "--confirmation-id", "OWNER-LIVE-NO-MAP-001", "--receipt-file", str(receipt),
                "--receipt-type", "OWNER_MESSAGE", "--source-locator", "test-owner-message-live-no-map-001",
            )
            self.assertEqual(confirmed.returncode, 0, confirmed.stdout + confirmed.stderr)
            blocked = self.run_harness(
                "build-article-context", "--workspace", str(workspace),
                "--article-id", "A1", "--output", str(root / "context/article-contract.json"),
            )
            self.assertNotEqual(blocked.returncode, 0)
            self.assertIn("missing owner-confirmed platform/account assignment", blocked.stdout)

    def test_article_template_is_copy_ready_for_a_required_cta(self) -> None:
        item = json.loads((ROOT / "templates/campaign-article.json").read_text(encoding="utf-8"))
        self.assertEqual(HARNESS.content_value_article_errors(item, required_cta=True), [])


if __name__ == "__main__":
    unittest.main()
