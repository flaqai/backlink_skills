#!/usr/bin/env python3
"""Regression checks for reader-value-first, required CTA declarations."""
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
SPEC = importlib.util.spec_from_file_location("blog_3p_harnessctl", HARNESS_PATH)
assert SPEC is not None and SPEC.loader is not None
HARNESS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HARNESS)


def secondary_cta() -> dict[str, str]:
    return {
        "mode": "SECONDARY_RECOMMENDATION",
        "anchor_text": "Try Example Product",
        "product_name": "Example Product",
        "product_destination_url": "https://example.com/product",
        "product_evidence_path": "research/source-ledger.md#example-product",
        "reader_task_relevance": "It is one relevant option after the standalone answer.",
        "relationship_disclosure": "NOT_APPLICABLE",
    }


def legacy_none_cta() -> dict[str, object]:
    return {
        "mode": "NONE",
        "product_name": None,
        "product_destination_url": None,
        "product_evidence_path": None,
        "reader_task_relevance": None,
        "relationship_disclosure": None,
    }


def set_legacy_execution_policy(cfg: dict, schema_version: str) -> None:
    """Give a historical schema its own execution contract, not current defaults."""
    cfg["schema_version"] = schema_version
    orchestration = cfg["orchestration_policy"]
    for field in (
        "execution_session",
        "article_artifact_root_template",
        "article_artifact_roots",
        "worktree_dispatch_decision",
        "worktree_allowed_reasons",
    ):
        orchestration.pop(field, None)
    orchestration.update({
        "writer_reviewer_pair_mode": "ONE_REUSABLE_PAIR_PER_ARTICLE",
        "operations_steward_mode": "ONE_REUSABLE_CAMPAIGN_OPERATIONS_STEWARD",
        "persistent_requirements_gatekeeper": True,
        "fresh_agent_roles": [],
        "pair_activation": "G_QUEUE_SUBJECT_TO_RUNTIME_CAPACITY",
        "execution_isolation": "WORKTREE_FIRST_PER_ARTICLE",
        "worktree_autospawn": "CREATE_VISIBLE_PROJECT_WORKTREE_PER_READY_ARTICLE_WHEN_SUPPORTED",
        "worktree_fallback": "VISIBLE_SHARED_WORKSPACE_WITH_PATH_ISOLATION",
        "silent_worktree_fallback": False,
        "queue_resume_policy": "AUTO_START_NEXT_READY_TASK_ON_SLOT_AVAILABLE",
        "article_agent_replacement_requires_full_rehydration": True,
    })
    if schema_version >= "2.7":
        orchestration.update({
            "cross_article_agent_reuse": "CAMPAIGN_GATEKEEPER_ONLY",
            "article_worktree_role_bundle": "ONE_REUSABLE_W_R_PAIR_PLUS_SHARED_CAMPAIGN_G",
            "project_worktree_root_role": "ARTICLE_WRITER_REVIEWER_PAIR",
            "campaign_gatekeeper_scope": "PREWRITE_BATCH_CONTRACT_AND_BATCH_PUBLIC_QA",
            "batch_gate_policy": copy.deepcopy(HARNESS.GATE_BATCH_POLICY_2_7),
            "article_public_gate_mode": "REUSE_REGISTERED_CAMPAIGN_GATEKEEPER_BATCH_READONLY",
            "public_qa_policy": copy.deepcopy(HARNESS.PUBLIC_QA_POLICY_2_7),
        })
    else:
        orchestration.update({
            "cross_article_agent_reuse": "PROHIBITED",
            "article_worktree_role_bundle": "ONE_REUSABLE_W_R_G_LANE_PER_ARTICLE",
            "project_worktree_root_role": "ARTICLE_LANE_GATEKEEPER",
            "campaign_gatekeeper_scope": "GLOBAL_REQUIREMENTS_QUEUE_AND_LEDGER_ONLY",
            "article_public_gate_mode": "REUSE_ARTICLE_LANE_GATEKEEPER_ONLY",
            "public_qa_policy": copy.deepcopy(HARNESS.PUBLIC_QA_POLICY_2_3),
        })
        orchestration.pop("batch_gate_policy", None)

    if schema_version >= "2.6":
        cfg["model_first_execution_policy"] = copy.deepcopy(HARNESS.MODEL_FIRST_EXECUTION_POLICY_2_6)
    else:
        cfg.pop("model_first_execution_policy", None)
        cfg["prewrite_plan_policy"].update({
            "mode": "CAMPAIGN_G_PREWRITE_EVIDENCE_AND_PLAN",
            "article_plan_sections": HARNESS.PREWRITE_PLAN_SECTIONS if schema_version >= "2.1" else HARNESS.LEGACY_PREWRITE_PLAN_SECTIONS,
            "campaign_summary_sections": HARNESS.PREWRITE_SUMMARY_SECTIONS if schema_version >= "2.1" else HARNESS.LEGACY_PREWRITE_SUMMARY_SECTIONS,
        })
        cfg["keyword_research_policy"].pop("required_within_writer_continuous_turn_before_claims", None)
        cfg["keyword_research_policy"].update({
            "mode": "PRE_DRAFT_LONG_TAIL_AND_REGIONAL_SERP",
            "required_after_owner_prewrite_confirmation_before_drafting": True,
        })
        cfg["platform_style_research_policy"].pop("trigger", None)
        cfg["platform_style_research_policy"].update({
            "mode": "IN_SCOPE_READONLY_DUAL_PROFILE",
            "attempt_before_drafting": True,
        })
    if schema_version >= "2.8":
        cfg["artifact_optimization_policy"] = copy.deepcopy(HARNESS.LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_8)
    elif schema_version == "2.4":
        cfg["artifact_optimization_policy"] = copy.deepcopy(HARNESS.ARTIFACT_OPTIMIZATION_POLICY_2_4)


def set_legacy_state_execution_policy(workspace: Path) -> None:
    """State fixtures must match historical scheduling rather than schema labels alone."""
    state_path = workspace / "state.json"
    state = json.loads(state_path.read_text(encoding="utf-8"))
    orchestration = state["orchestration"]
    orchestration.pop("execution_session", None)
    orchestration.pop("article_artifact_root_template", None)
    orchestration["capacity"]["spawn_policy"] = "AUTHORIZED_MAXIMIZE_AVAILABLE_CAPACITY"
    state_path.write_text(json.dumps(state), encoding="utf-8")


class ContentValuePolicyTests(unittest.TestCase):
    def run_harness(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(HARNESS_PATH), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def initialize(self) -> tuple[tempfile.TemporaryDirectory[str], Path]:
        temp_dir = tempfile.TemporaryDirectory()
        workspace = Path(temp_dir.name) / "campaign"
        initialized = self.run_harness("init", "--workspace", str(workspace), "--campaign-id", "example")
        self.assertEqual(initialized.returncode, 0, initialized.stdout + initialized.stderr)
        return temp_dir, workspace

    def test_template_and_initializer_share_current_required_cta_policy(self) -> None:
        template = json.loads((ROOT / "templates/campaign.json").read_text(encoding="utf-8"))
        generated = HARNESS.campaign("REPLACE_ME")
        self.assertEqual(template, generated)
        self.assertEqual(template["schema_version"], "2.14")
        self.assertEqual(template["live_execution_profile"], HARNESS.HUMAN_RELEASE_PROFILE_2_14)
        self.assertEqual(template["release_policy"]["mode"], "HUMAN_NATIVE_ONLY")
        self.assertNotIn("human_release_requested", template["release_policy"])
        policy = template["content_value_policy"]
        self.assertEqual(policy["cta_role"], "REQUIRED_SECONDARY_TRANSPARENT_RECOMMENDATION")
        self.assertTrue(policy["cta_must_be_present"])

    def test_fresh_schema_2_14_workspace_checks(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            manifest = json.loads((workspace / "prewrite-plan.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["schema_version"], "1.8")
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            self.assertIn("CHECK_PASSED", checked.stdout)

    def test_current_schema_rejects_obsolete_optional_human_release_toggle(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            campaign_path = workspace / "campaign.json"
            cfg = json.loads(campaign_path.read_text(encoding="utf-8"))
            cfg["release_policy"]["human_release_requested"] = False
            campaign_path.write_text(json.dumps(cfg), encoding="utf-8")
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertNotEqual(checked.returncode, 0)
            self.assertIn("must not contain release_policy.human_release_requested", checked.stdout)

    def test_schema_2_8_remains_checkable_but_cannot_enter_current_human_release_flow(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            campaign_path = workspace / "campaign.json"
            cfg = json.loads(campaign_path.read_text(encoding="utf-8"))
            set_legacy_execution_policy(cfg, "2.8")
            cfg["live_execution_profile"] = copy.deepcopy(HARNESS.LIVE_EXECUTION_PROFILE_2_8)
            cfg["release_policy"]["human_release_requested"] = False
            campaign_path.write_text(json.dumps(cfg), encoding="utf-8")
            set_legacy_state_execution_policy(workspace)
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            receipt = workspace / "evidence/owner-confirmations/owner-confirmation.md"
            receipt.write_text("OWNER_PREWRITE_PLAN_CONFIRMED\n", encoding="utf-8")
            blocked = self.run_harness(
                "confirm-prewrite-plan", "--workspace", str(workspace),
                "--confirmation-id", "LEGACY-001", "--receipt-file", str(receipt),
                "--receipt-type", "OWNER_MESSAGE", "--source-locator", "legacy-check-only",
            )
            self.assertNotEqual(blocked.returncode, 0)
            self.assertIn("schema-2.9+ human-native-release workspace", blocked.stdout)

    def test_schema_2_2_rejects_none_or_missing_required_cta_fields(self) -> None:
        policy = HARNESS.campaign("example")["content_value_policy"]
        self.assertEqual(HARNESS.content_value_policy_errors(policy, required_cta=True), [])
        weakened = copy.deepcopy(policy)
        weakened["cta_must_be_present"] = False
        self.assertTrue(HARNESS.content_value_policy_errors(weakened, required_cta=True))

        none_article = {
            "article_id": "A1",
            "reader_value_promise": "Explain the task without relying on a recommendation.",
            "cta": legacy_none_cta(),
        }
        errors = HARNESS.content_value_article_errors(none_article, required_cta=True)
        self.assertTrue(any("cta.mode" in error for error in errors))
        self.assertTrue(any("anchor_text" in error for error in errors))

        temp_dir, workspace = self.initialize()
        with temp_dir:
            campaign_path = workspace / "campaign.json"
            cfg = json.loads(campaign_path.read_text(encoding="utf-8"))
            cfg["articles"] = [{
                "article_id": "A1",
                "reader_value_promise": none_article["reader_value_promise"],
                "cta": legacy_none_cta(),
            }]
            campaign_path.write_text(json.dumps(cfg), encoding="utf-8")
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertNotEqual(checked.returncode, 0)
            self.assertIn("cta.mode must be SECONDARY_RECOMMENDATION", checked.stdout)

        recommendation_article = {
            "article_id": "A2",
            "reader_value_promise": "Give a useful independent answer first.",
            "cta": secondary_cta(),
        }
        self.assertEqual(HARNESS.content_value_article_errors(recommendation_article, required_cta=True), [])
        missing_anchor = copy.deepcopy(recommendation_article)
        missing_anchor["cta"].pop("anchor_text")
        self.assertTrue(any("anchor_text" in error for error in HARNESS.content_value_article_errors(missing_anchor, required_cta=True)))

    def test_malformed_schema_cannot_downgrade_required_cta_policy(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            campaign_path = workspace / "campaign.json"
            cfg = json.loads(campaign_path.read_text(encoding="utf-8"))
            cfg["schema_version"] = "2.2.0"
            cfg.pop("content_value_policy")
            cfg["prewrite_plan_policy"]["article_plan_sections"] = HARNESS.LEGACY_PREWRITE_PLAN_SECTIONS
            cfg["prewrite_plan_policy"]["campaign_summary_sections"] = HARNESS.LEGACY_PREWRITE_SUMMARY_SECTIONS
            campaign_path.write_text(json.dumps(cfg), encoding="utf-8")
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertNotEqual(checked.returncode, 0)
            self.assertIn("campaign schema_version must use exact major.minor form", checked.stdout)
            self.assertIn("content value policy", checked.stdout)

    def test_schema_2_0_and_2_1_remain_historical_compatibility_paths(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            campaign_path = workspace / "campaign.json"
            cfg = json.loads(campaign_path.read_text(encoding="utf-8"))
            set_legacy_execution_policy(cfg, "2.0")
            cfg.pop("content_value_policy")
            campaign_path.write_text(json.dumps(cfg), encoding="utf-8")
            set_legacy_state_execution_policy(workspace)
            manifest_path = workspace / "prewrite-plan.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["schema_version"] = "1.0"
            manifest["campaign_summary"] = {section: "" for section in HARNESS.LEGACY_PREWRITE_SUMMARY_SECTIONS}
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            package_checked = self.run_harness(
                "check-article-package", "--workspace", str(workspace), "--package", "does-not-exist.json"
            )
            self.assertEqual(package_checked.returncode, 0, package_checked.stdout + package_checked.stderr)
            self.assertIn("ARTICLE_PACKAGE_CHECK_SKIPPED_LEGACY_SCHEMA", package_checked.stdout)

            set_legacy_execution_policy(cfg, "2.1")
            cfg["content_value_policy"] = {
                "mode": "READER_VALUE_FIRST",
                "primary_purpose": "STANDALONE_ANSWER_TO_READER_TASK",
                "cta_role": "OPTIONAL_SECONDARY_TRANSPARENT_RECOMMENDATION",
                "cta_requires_identifiable_product_and_claim_basis": True,
                "cta_requires_relationship_disclosure_when_applicable": True,
                "cta_must_not_replace_or_dominate_reader_value": True,
            }
            cfg["articles"] = [{
                "article_id": "A1",
                "reader_value_promise": "Historical optional CTA declaration.",
                "cta": legacy_none_cta(),
            }]
            campaign_path.write_text(json.dumps(cfg), encoding="utf-8")
            manifest["schema_version"] = "1.1"
            manifest["campaign_summary"] = {section: "" for section in HARNESS.PREWRITE_SUMMARY_SECTIONS}
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            package_path = workspace / "article-package.json"
            package_path.write_text(json.dumps({
                "schema_version": "1.1",
                "article_id": "A1",
                "reader_value_promise": cfg["articles"][0]["reader_value_promise"],
                "cta": {"mode": "NONE"},
            }), encoding="utf-8")
            legacy_package = self.run_harness(
                "check-article-package", "--workspace", str(workspace), "--package", str(package_path)
            )
            self.assertEqual(legacy_package.returncode, 0, legacy_package.stdout + legacy_package.stderr)

    def test_schema_2_5_package_requires_exact_required_cta_declaration(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            campaign_path = workspace / "campaign.json"
            cfg = json.loads(campaign_path.read_text(encoding="utf-8"))
            article = {
                "article_id": "A1",
                "language": "en",
                "market": "US",
                "focus_keyword": "example task",
                "reader_value_promise": "Help readers complete the example task without relying on a recommendation.",
                "cta": secondary_cta(),
            }
            cfg["articles"] = [article]
            campaign_path.write_text(json.dumps(cfg), encoding="utf-8")
            article_root = workspace / "articles" / "A1"
            article_root.mkdir(parents=True)
            package_path = article_root / "article-package.json"
            package = {
                "schema_version": "1.3",
                "article_id": "A1",
                "reader_value_promise": article["reader_value_promise"],
                "cta": article["cta"],
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
            package_path.write_text(json.dumps(package), encoding="utf-8")
            checked = self.run_harness("check-article-package", "--workspace", str(workspace), "--package", str(package_path))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)

            package["cta"] = copy.deepcopy(package["cta"])
            package["cta"]["anchor_text"] = "Changed CTA text"
            package_path.write_text(json.dumps(package), encoding="utf-8")
            mismatched = self.run_harness("check-article-package", "--workspace", str(workspace), "--package", str(package_path))
            self.assertNotEqual(mismatched.returncode, 0)
            self.assertIn("article package cta does not match frozen campaign declaration", mismatched.stdout)

            package["cta"] = legacy_none_cta()
            package_path.write_text(json.dumps(package), encoding="utf-8")
            missing_required = self.run_harness("check-article-package", "--workspace", str(workspace), "--package", str(package_path))
            self.assertNotEqual(missing_required.returncode, 0)
            self.assertIn("cta.mode must be SECONDARY_RECOMMENDATION", missing_required.stdout)


if __name__ == "__main__":
    unittest.main()
