#!/usr/bin/env python3
"""Regression checks for optional, bounded Google Trends evidence."""
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


def set_schema_2_4_legacy_policy(cfg: dict) -> None:
    """A historical fixture must carry its matching pre-2.6 policy, not only an old number."""
    cfg["schema_version"] = "2.4"
    cfg.pop("model_first_execution_policy", None)
    cfg["prewrite_plan_policy"].update({
        "mode": "CAMPAIGN_G_PREWRITE_EVIDENCE_AND_PLAN",
        "article_plan_sections": HARNESS.PREWRITE_PLAN_SECTIONS,
        "campaign_summary_sections": HARNESS.PREWRITE_SUMMARY_SECTIONS,
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
    cfg["artifact_optimization_policy"] = copy.deepcopy(HARNESS.ARTIFACT_OPTIMIZATION_POLICY_2_4)
    orchestration = cfg["orchestration_policy"]
    for field in (
        "execution_session",
        "article_artifact_root_template",
        "article_artifact_roots",
        "worktree_dispatch_decision",
        "worktree_allowed_reasons",
        "batch_gate_policy",
    ):
        orchestration.pop(field, None)
    orchestration.update({
        "writer_reviewer_pair_mode": "ONE_REUSABLE_PAIR_PER_ARTICLE",
        "cross_article_agent_reuse": "PROHIBITED",
        "execution_isolation": "WORKTREE_FIRST_PER_ARTICLE",
        "worktree_autospawn": "CREATE_VISIBLE_PROJECT_WORKTREE_PER_READY_ARTICLE_WHEN_SUPPORTED",
        "worktree_fallback": "VISIBLE_SHARED_WORKSPACE_WITH_PATH_ISOLATION",
        "silent_worktree_fallback": False,
        "article_worktree_role_bundle": "ONE_REUSABLE_W_R_G_LANE_PER_ARTICLE",
        "project_worktree_root_role": "ARTICLE_LANE_GATEKEEPER",
        "campaign_gatekeeper_scope": "GLOBAL_REQUIREMENTS_QUEUE_AND_LEDGER_ONLY",
        "article_public_gate_mode": "REUSE_ARTICLE_LANE_GATEKEEPER_ONLY",
        "public_qa_policy": copy.deepcopy(HARNESS.PUBLIC_QA_POLICY_2_3),
        "queue_resume_policy": "AUTO_START_NEXT_READY_TASK_ON_SLOT_AVAILABLE",
    })


def set_legacy_state_execution_policy(workspace: Path) -> None:
    state_path = workspace / "state.json"
    state = json.loads(state_path.read_text(encoding="utf-8"))
    orchestration = state["orchestration"]
    orchestration.pop("execution_session", None)
    orchestration.pop("article_artifact_root_template", None)
    orchestration["capacity"]["spawn_policy"] = "AUTHORIZED_MAXIMIZE_AVAILABLE_CAPACITY"
    state_path.write_text(json.dumps(state), encoding="utf-8")


class TrendEvidencePolicyTests(unittest.TestCase):
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

    def test_schema_2_5_locks_optional_bounded_trends_policy(self) -> None:
        template = json.loads((ROOT / "templates/campaign.json").read_text(encoding="utf-8"))
        self.assertEqual(template, HARNESS.campaign("REPLACE_ME"))
        policy = template["keyword_research_policy"]["trend_evidence_policy"]
        self.assertEqual(policy, HARNESS.TREND_EVIDENCE_POLICY_2_5)
        self.assertEqual(policy["mode"], "OPTIONAL_ENGLISH_GLOBAL_RELATIVE_CONTEXT_ONLY")
        self.assertEqual(
            policy["insufficient_data_route"],
            "TARGET_PLATFORM_AUDIENCE_NEED_WITH_EXPLICIT_BOUNDARY",
        )
        self.assertIn("SEARCH_VOLUME", policy["prohibited_inferences"])
        self.assertIn("LOW_BASE_HIGH_MOMENTUM", policy["prohibited_inferences"])
        self.assertIn("MODEL_CAPABILITY", policy["prohibited_inferences"])

    def test_current_workspace_passes_without_any_trends_artifact(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            self.assertFalse((workspace / "evidence/trends-momentum.md").exists())
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            self.assertIn("CHECK_PASSED", checked.stdout)

    def test_current_schema_rejects_weakened_optional_trends_policy(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            campaign_path = workspace / "campaign.json"
            cfg = json.loads(campaign_path.read_text(encoding="utf-8"))
            cfg["keyword_research_policy"]["trend_evidence_policy"] = copy.deepcopy(
                cfg["keyword_research_policy"]["trend_evidence_policy"]
            )
            cfg["keyword_research_policy"]["trend_evidence_policy"]["mode"] = "REQUIRED_BREAKOUT_SIGNAL"
            campaign_path.write_text(json.dumps(cfg), encoding="utf-8")
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertNotEqual(checked.returncode, 0)
            self.assertIn("optional-trends evidence policy", checked.stdout)

    def test_schema_2_4_remains_compatible_without_new_policy(self) -> None:
        temp_dir, workspace = self.initialize()
        with temp_dir:
            campaign_path = workspace / "campaign.json"
            cfg = json.loads(campaign_path.read_text(encoding="utf-8"))
            set_schema_2_4_legacy_policy(cfg)
            cfg["keyword_research_policy"].pop("trend_evidence_policy")
            campaign_path.write_text(json.dumps(cfg), encoding="utf-8")
            set_legacy_state_execution_policy(workspace)
            manifest_path = workspace / "prewrite-plan.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["schema_version"] = "1.3"
            manifest["campaign_summary"] = {
                section: "" for section in HARNESS.PREWRITE_SUMMARY_SECTIONS
            }
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            synced = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
            self.assertEqual(synced.returncode, 0, synced.stdout + synced.stderr)
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)


if __name__ == "__main__":
    unittest.main()
