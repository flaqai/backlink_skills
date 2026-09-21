"""Regression coverage for evidence separation without adding review rounds."""
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
except ModuleNotFoundError:  # pragma: no cover
    from tests.manual_release_fixture import configure_confirmed_human_release_map


ROOT = Path(__file__).resolve().parents[1]
HARNESS_PATH = ROOT / "skills/blog-3p-harness/scripts/harnessctl.py"
SPEC = importlib.util.spec_from_file_location("blog_3p_harness_research_integrity", HARNESS_PATH)
assert SPEC and SPEC.loader
HARNESS = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = HARNESS
SPEC.loader.exec_module(HARNESS)


def article() -> dict:
    return {
        "article_id": "A1",
        "language": "en",
        "market": "Global English",
        "focus_keyword": "example reader workflow",
        "reader_value_promise": "Answer the reader task before the required recommendation.",
        "cta": {
            "mode": "SECONDARY_RECOMMENDATION",
            "anchor_text": "Try Example Product",
            "product_name": "Example Product",
            "product_destination_url": "https://example.com/product",
            "product_evidence_path": "research/evidence-pack.json#/claims/example-product",
            "reader_task_relevance": "It is a relevant secondary option after the answer.",
            "relationship_disclosure": "NOT_APPLICABLE",
        },
    }


def method_posture() -> dict:
    return {
        "mode": "METHOD_TEMPLATE_NO_EXECUTION",
        "empirical_claims_allowed": False,
        "claim_boundary": "This is a reader-run method template, not a reported test result.",
        "evidence_paths": [],
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
    """Return the current-schema article root used by integration fixtures."""
    root = workspace / "articles" / article_id
    root.mkdir(parents=True, exist_ok=True)
    return root


class ResearchIntegrityTests(unittest.TestCase):
    def run_harness(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(HARNESS_PATH), *args], cwd=ROOT,
            text=True, capture_output=True, check=False,
        )

    def prepare(self, workspace: Path, *, cross_language: bool = False) -> None:
        initialized = self.run_harness("init", "--workspace", str(workspace), "--campaign-id", "research-integrity")
        self.assertEqual(initialized.returncode, 0, initialized.stdout + initialized.stderr)
        item = article()
        campaign_path = workspace / "campaign.json"
        campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
        campaign["articles"] = [item]
        campaign_path.write_text(json.dumps(campaign), encoding="utf-8")
        plan_path = workspace / "prewrite-plan.json"
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        mapping = {
            "article_language": item["language"],
            "market": item["market"],
            "platform": "ExamplePlatform",
            "account": "ACCOUNT-A1",
            "fit_mode": "PRIMARY_AUDIENCE_MATCH",
            "cross_language_exception": None,
        }
        if cross_language:
            mapping.update({
                "fit_mode": "CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED",
                "cross_language_exception": {
                    "reason": "The owner explicitly requested this documented cross-language exception.",
                    "requested_owner_confirmation_literal": "Approve Global English / ExamplePlatform as a cross-language exception.",
                },
            })
        plan["campaign_summary"] = {
            section: f"prepared {section}"
            for section in HARNESS.MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS
        }
        plan["article_plans"] = [{
            "article_id": item["article_id"],
            "evidence_refs": ["evidence/shared/campaign-evidence-pack.json"],
            **{section: f"prepared {section}" for section in HARNESS.MODEL_FIRST_PREWRITE_PLAN_SECTIONS},
            "topic_slot": topic_slot(item),
            "frozen_delivery_mapping": mapping,
            "evidence_posture": method_posture(),
            "review_effort": copy.deepcopy(HARNESS.STANDARD_REVIEW_EFFORT),
        }]
        plan_path.write_text(json.dumps(plan), encoding="utf-8")
        synced = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
        self.assertEqual(synced.returncode, 0, synced.stdout + synced.stderr)
        configure_confirmed_human_release_map(
            workspace, HARNESS, campaign_id="research-integrity", article=item,
            confirmation_id="OWNER-RESEARCH-001",
        )
        if cross_language:
            self.configure_cross_language_evidence(workspace)
        receipt = workspace / "evidence/owner-confirmations/owner-confirmation.md"
        receipt.write_text("OWNER_PREWRITE_PLAN_CONFIRMED\n", encoding="utf-8")
        confirmed = self.run_harness(
            "confirm-prewrite-plan", "--workspace", str(workspace),
            "--confirmation-id", "OWNER-RESEARCH-001", "--receipt-file", str(receipt),
            "--receipt-type", "OWNER_MESSAGE", "--source-locator", "research-integrity-test",
        )
        self.assertEqual(confirmed.returncode, 0, confirmed.stdout + confirmed.stderr)

    def configure_cross_language_evidence(self, workspace: Path) -> None:
        proposal_path = workspace / "evidence/platform-matching/platform-matching-proposal.json"
        proposal = json.loads(proposal_path.read_text(encoding="utf-8"))
        compatibility = proposal["proposals"][0]["audience_compatibility"]
        compatibility.update({
            "primary_reader_languages": ["ja"],
            "primary_reader_markets": ["Japan"],
            "transport_supported_content_languages": ["en"],
            "fit_mode": "CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED",
            "cross_language_exception_required": True,
        })
        proposal_path.write_text(json.dumps(proposal), encoding="utf-8")
        selection_path = workspace / "owner-platform-selection.json"
        selection = json.loads(selection_path.read_text(encoding="utf-8"))
        selection["matching_proposal"]["sha256"] = HARNESS.sha256_file(proposal_path)
        receipt = selection["pair_receipts"][0]
        receipt.update({
            "fit_mode": "CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED",
            "cross_language_exception_owner_confirmation_id": "OWNER-RESEARCH-001",
            "cross_language_exception_literal": "Approve Global English / ExamplePlatform as a cross-language exception.",
        })
        selection_path.write_text(json.dumps(selection), encoding="utf-8")
        campaign_path = workspace / "campaign.json"
        campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
        campaign["platform_scope"]["selection_lock"]["sha256"] = HARNESS.sha256_file(selection_path)
        row = campaign["locale_platform_validation"]["rows"][0]
        row["decision"] = "CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED"
        row["audience_compatibility"].update({
            "primary_reader_languages": ["ja"],
            "primary_reader_markets": ["Japan"],
            "transport_supported_content_languages": ["en"],
            "fit_mode": "CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED",
            "cross_language_exception_required": True,
        })
        campaign_path.write_text(json.dumps(campaign), encoding="utf-8")

    def test_transport_language_alone_cannot_pass_as_primary_audience_fit(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir) / "campaign"
            self.prepare(workspace)
            proposal_path = workspace / "evidence/platform-matching/platform-matching-proposal.json"
            proposal = json.loads(proposal_path.read_text(encoding="utf-8"))
            proposal["proposals"][0]["audience_compatibility"].update({
                "primary_reader_languages": ["ja"],
                "primary_reader_markets": ["Japan"],
                "transport_supported_content_languages": ["en"],
            })
            proposal_path.write_text(json.dumps(proposal), encoding="utf-8")
            selection_path = workspace / "owner-platform-selection.json"
            selection = json.loads(selection_path.read_text(encoding="utf-8"))
            selection["matching_proposal"]["sha256"] = HARNESS.sha256_file(proposal_path)
            selection_path.write_text(json.dumps(selection), encoding="utf-8")
            campaign_path = workspace / "campaign.json"
            campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
            campaign["platform_scope"]["selection_lock"]["sha256"] = HARNESS.sha256_file(selection_path)
            row = campaign["locale_platform_validation"]["rows"][0]
            row["audience_compatibility"].update({
                "primary_reader_languages": ["ja"],
                "primary_reader_markets": ["Japan"],
                "transport_supported_content_languages": ["en"],
            })
            campaign_path.write_text(json.dumps(campaign), encoding="utf-8")
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertNotEqual(checked.returncode, 0)
            self.assertIn("primary-audience evidence does not match", checked.stdout)

    def test_explicit_cross_language_exception_can_pass_without_new_review_round(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir) / "campaign"
            self.prepare(workspace, cross_language=True)
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)

    def test_scope_drift_requires_explicit_invalidation_before_reconfirmation(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir) / "campaign"
            self.prepare(workspace)
            plan_path = workspace / "prewrite-plan.json"
            plan = json.loads(plan_path.read_text(encoding="utf-8"))
            plan["article_plans"][0]["evidence_posture"]["mode"] = "DOCUMENTED_EMPIRICAL_RECORD"
            plan["article_plans"][0]["evidence_posture"]["empirical_claims_allowed"] = True
            plan_path.write_text(json.dumps(plan), encoding="utf-8")
            drift = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
            self.assertNotEqual(drift.returncode, 0)
            self.assertIn("SCOPE_RECONFIRM_REQUIRED", drift.stdout)
            invalidated = self.run_harness(
                "invalidate-prewrite-confirmation", "--workspace", str(workspace),
                "--reason", "Change claimed evidence posture before drafting.",
            )
            self.assertEqual(invalidated.returncode, 0, invalidated.stdout + invalidated.stderr)
            refreshed = json.loads(plan_path.read_text(encoding="utf-8"))
            self.assertEqual(refreshed["status"], "OWNER_PREWRITE_PLAN_CHANGES_REQUESTED")
            self.assertTrue(refreshed["invalidation_history"])

    def test_topic_slot_drift_requires_explicit_reconfirmation(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir) / "campaign"
            self.prepare(workspace)
            plan_path = workspace / "prewrite-plan.json"
            plan = json.loads(plan_path.read_text(encoding="utf-8"))
            plan["article_plans"][0]["topic_slot"]["core_intent"] = "A materially different reader intent."
            plan_path.write_text(json.dumps(plan), encoding="utf-8")
            drift = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
            self.assertNotEqual(drift.returncode, 0)
            self.assertIn("SCOPE_RECONFIRM_REQUIRED", drift.stdout)

    def test_within_slot_adjustment_stays_on_standard_route_but_conflict_blocks_review_ready(self) -> None:
        item = article()
        plan = {"topic_slot": topic_slot(item)}
        aligned = {
            "topic_slot_alignment": {
                "frozen_slot_id": "A1-TOPIC",
                "status": "ALIGNED",
                "within_slot_adjustments": ["Replaced a literal translation with a natural regional variant."],
                "resolved_conflicts": [],
                "active_conflict": None,
            }
        }
        self.assertEqual(HARNESS.topic_slot_alignment_errors(plan, aligned), [])
        missing_resolution_list = copy.deepcopy(aligned)
        del missing_resolution_list["topic_slot_alignment"]["resolved_conflicts"]
        missing_resolution_errors = HARNESS.topic_slot_alignment_errors(plan, missing_resolution_list)
        self.assertIn(
            "research topic_slot_alignment.resolved_conflicts must be a list",
            missing_resolution_errors,
        )
        conflict = copy.deepcopy(aligned)
        conflict["topic_slot_alignment"].update({
            "status": "TOPIC_EVIDENCE_CONFLICT",
            "active_conflict": {
                "conflict_id": "TOPIC_EVIDENCE_CONFLICT-001",
                "reason": "The frozen reader task does not match the regional intent evidence.",
                "evidence_refs": ["evidence/serp/a1.md"],
                "proposed_action": "OWNER_RECONFFIRM_REQUIRED",
            },
        })
        conflict["topic_slot_alignment"]["active_conflict"]["proposed_action"] = "OWNER_RECONFIRM_REQUIRED"
        errors = HARNESS.topic_slot_alignment_errors(plan, conflict)
        self.assertTrue(any("TOPIC_EVIDENCE_CONFLICT" in error for error in errors))

        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir) / "campaign"
            self.prepare(workspace)
            root = article_root(workspace)
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
            review_index = json.loads(index.read_text(encoding="utf-8"))
            self.assertEqual(review_index["latest_research_review"]["status"], "NOT_REQUIRED")
            self.assertEqual(review_index["latest_research_review"]["coverage"], "INTEGRATED_IN_FULL_REVIEW")

    def test_resolved_topic_conflict_requires_one_registered_g_task(self) -> None:
        item = article()
        plan = {"topic_slot": topic_slot(item)}
        alignment = {
            "frozen_slot_id": "A1-TOPIC",
            "status": "ALIGNED",
            "within_slot_adjustments": ["Used a narrower natural local phrase within the frozen reader task."],
            "resolved_conflicts": [{
                "conflict_id": "TOPIC_EVIDENCE_CONFLICT-001",
                "decision_id": "TOPIC-DECISION-001",
                "reason": "The regional evidence required a narrower formulation within the same reader task.",
                "evidence_refs": ["evidence/serp/a1.md"],
                "decision": "NARROW_WITHIN_SLOT",
                "gatekeeper_agent_id": "G-CAMPAIGN",
                "decided_at": "2026-09-18T10:00:00+00:00",
            }],
            "active_conflict": None,
        }
        self.assertEqual(HARNESS.topic_slot_alignment_errors(plan, {"topic_slot_alignment": alignment}), [])
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir)
            state = HARNESS.state("topic-resolution")
            state["orchestration"]["campaign_gatekeeper_agent_id"] = "G-CAMPAIGN"
            state["orchestration"]["tasks"] = [{
                "article_id": "A1",
                "role": "CAMPAIGN_GATEKEEPER",
                "agent_id": "G-CAMPAIGN",
                "workflow_stage": "TOPIC_EVIDENCE_DECISION",
                "status": "COMPLETED",
                "conflict_id": "TOPIC_EVIDENCE_CONFLICT-001",
                "decision_id": "TOPIC-DECISION-001",
                "decision": "NARROW_WITHIN_SLOT",
            }]
            (workspace / "state.json").write_text(json.dumps(state), encoding="utf-8")
            self.assertEqual(
                HARNESS.topic_conflict_resolution_errors(workspace, {"article_id": "A1"}, alignment),
                [],
            )
            state["orchestration"]["tasks"] = []
            (workspace / "state.json").write_text(json.dumps(state), encoding="utf-8")
            errors = HARNESS.topic_conflict_resolution_errors(workspace, {"article_id": "A1"}, alignment)
            self.assertTrue(any("TOPIC_EVIDENCE_DECISION" in error for error in errors))

    def test_platform_profile_and_empirical_records_have_narrow_machine_boundaries(self) -> None:
        item = article()
        bad_profile = {
            "schema_version": HARNESS.CURRENT_EVIDENCE_PACK_SCHEMA,
            "topic_slot_alignment": {
                "frozen_slot_id": "A1-TOPIC",
                "status": "ALIGNED",
                "within_slot_adjustments": [],
                "resolved_conflicts": [],
                "active_conflict": None,
            },
            "research_separation": {
                "reader_intent_basis": {
                    "decision": "REGIONAL_SERP",
                    "selected_phrase_evidence_refs": ["evidence/serp/a1.md"],
                },
                "platform_profile_use": {
                    "mode": "TOPIC_FRAMING_ONLY",
                    "evidence_refs": ["evidence/platform-profile.md"],
                    "used_as_keyword_or_demand_evidence": True,
                },
            },
            "evidence_posture": {
                "mode": "DOCUMENTED_EMPIRICAL_RECORD",
                "empirical_claims_allowed": True,
                "claim_boundary": "Only documented observations are claimed.",
                "evidence_paths": ["research/run-log.md"],
                "documented_record": {"protocol_path": "research/protocol.md"},
            },
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir)
            (workspace / "research").mkdir()
            (workspace / "research/evidence-pack.json").write_text(json.dumps(bad_profile), encoding="utf-8")
            (workspace / "campaign.json").write_text(json.dumps(HARNESS.campaign("research-integrity")), encoding="utf-8")
            context = {
                "artifact_paths": {"evidence_pack": "research/evidence-pack.json"},
                "prewrite_plan": {
                    "topic_slot": topic_slot(item),
                    "evidence_posture": {
                        "mode": "DOCUMENTED_EMPIRICAL_RECORD", "empirical_claims_allowed": True,
                    },
                },
            }
            errors = HARNESS.research_evidence_pack_integrity_errors(workspace, context)
            self.assertTrue(any("platform profile cannot" in error for error in errors))
            self.assertTrue(any("documented empirical record requires" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
