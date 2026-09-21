#!/usr/bin/env python3
"""Regression contract for schema-2.13 article-path isolation."""
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


def article(article_id: str) -> dict[str, object]:
    return {
        "article_id": article_id,
        "language": "en",
        "market": "US",
        "focus_keyword": f"{article_id.lower()} example workflow",
        "reader_value_promise": f"Give readers a complete {article_id} workflow before the recommendation.",
        "cta": {
            "mode": "SECONDARY_RECOMMENDATION",
            "anchor_text": f"Try Example Product for {article_id}",
            "product_name": "Example Product",
            "product_destination_url": "https://example.com/product",
            "product_evidence_path": "research/evidence-pack.json#/claims/example-product",
            "reader_task_relevance": "It is a relevant option after the standalone answer.",
            "relationship_disclosure": "NOT_APPLICABLE",
        },
    }


class MainSessionPathIsolationTests(unittest.TestCase):
    """Each test names a future regression in the schema-2.13 boundary."""

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
        initialized = self.run_harness(
            "init", "--workspace", str(workspace), "--campaign-id", "path-isolation",
        )
        self.assertEqual(initialized.returncode, 0, initialized.stdout + initialized.stderr)
        return temp_dir, workspace

    def write_json(self, path: Path, value: object) -> None:
        path.write_text(json.dumps(value), encoding="utf-8")

    def configure_confirmed_two_article_workspace(self, workspace: Path) -> None:
        """Build a real owner-confirmed two-article fixture before registering roots."""
        items = [article("A1"), article("A2")]
        mappings = {
            "A1": {"platform": "ExamplePlatformOne", "account": "ACCOUNT-A1"},
            "A2": {"platform": "ExamplePlatformTwo", "account": "ACCOUNT-A2"},
        }
        campaign_path = workspace / "campaign.json"
        campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
        campaign["schema_version"] = "2.13"
        campaign["articles"] = items
        campaign["orchestration_policy"].update({
            "execution_isolation": "MAIN_SESSION_PATH_ISOLATED",
            "worktree_autospawn": "EXPLICIT_EXCEPTION_ONLY",
        })

        proposal_rows = []
        source_artifacts = []
        pair_receipts = []
        locale_rows = []
        for item in items:
            article_id = str(item["article_id"])
            mapping = mappings[article_id]
            source_id = f"owner-source-{article_id}"
            source_path = workspace / f"evidence/owner-selection/{article_id}.md"
            source_path.write_text(
                f"Owner confirms {mapping['platform']} / {mapping['account']} for {article_id}.\n",
                encoding="utf-8",
            )
            evidence_dir = workspace / "evidence/platform-matching"
            for suffix in ("eligibility", "primary-audience", "transport"):
                (evidence_dir / f"{article_id}-{suffix}.md").write_text(
                    f"Test-only {suffix} evidence for {article_id}.\n", encoding="utf-8",
                )
            audience = {
                "primary_reader_languages": [item["language"]],
                "primary_reader_markets": [item["market"]],
                "primary_audience_evidence_path": f"evidence/platform-matching/{article_id}-primary-audience.md",
                "transport_supported_content_languages": [item["language"]],
                "transport_evidence_path": f"evidence/platform-matching/{article_id}-transport.md",
                "fit_mode": "PRIMARY_AUDIENCE_MATCH",
                "cross_language_exception_required": False,
            }
            proposal_rows.append({
                "article_id": article_id,
                "language": item["language"],
                "market": item["market"],
                "platform": mapping["platform"],
                "candidate_source_id": source_id,
                "candidate_locator": f"test owner source for {article_id}",
                "rationale": "Test-only in-scope language and format fit.",
                "eligibility_evidence_path": f"evidence/platform-matching/{article_id}-eligibility.md",
                "audience_compatibility": audience,
                "account_status": "OWNER_CONFIRMATION_REQUIRED",
            })
            source_artifacts.append({
                "source_id": source_id,
                "source_type": "OWNER_MESSAGE",
                "path": f"evidence/owner-selection/{article_id}.md",
                "sha256": HARNESS.sha256_file(source_path),
            })
            pair_receipts.append({
                "article_id": article_id,
                "article_language": item["language"],
                "market": item["market"],
                "platform": mapping["platform"],
                "account": mapping["account"],
                "source_id": source_id,
                "source_locator": f"test owner source for {article_id}",
                "platform_source_literal": mapping["platform"],
                "account_confirmation_literal": mapping["account"],
                "mapping_confirmation_literal": f"{item['language']} / {item['market']} / {mapping['platform']} / {mapping['account']}",
                "fit_mode": "PRIMARY_AUDIENCE_MATCH",
                "cross_language_exception_owner_confirmation_id": None,
                "cross_language_exception_literal": None,
                "owner_confirmation_id": "OWNER-PATH-001",
                "status": "EXPLICITLY_CONFIRMED",
            })
            locale_rows.append({
                "article_id": article_id,
                "article_language": item["language"],
                "market": item["market"],
                "platform": mapping["platform"],
                "account": mapping["account"],
                "decision": "PRIMARY_AUDIENCE_MATCH",
                "audience_compatibility": audience,
            })

        proposal_path = workspace / "evidence/platform-matching/platform-matching-proposal.json"
        self.write_json(proposal_path, {
            "schema_version": "1.0",
            "campaign_id": "path-isolation",
            "researcher_role": HARNESS.MATCHING_ROLE,
            "status": "RECOMMENDED_PENDING_OWNER_CONFIRMATION",
            "proposals": proposal_rows,
        })
        selection_path = workspace / "owner-platform-selection.json"
        self.write_json(selection_path, {
            "schema_version": "1.0",
            "campaign_id": "path-isolation",
            "status": "OWNER_CONFIRMED",
            "matching_proposal": {
                "path": "evidence/platform-matching/platform-matching-proposal.json",
                "sha256": HARNESS.sha256_file(proposal_path),
                "researcher_role": HARNESS.MATCHING_ROLE,
                "task_id": "MATCHING-001",
            },
            "source_artifacts": source_artifacts,
            "pair_receipts": pair_receipts,
        })
        campaign["platform_scope"]["allowed_pairs"] = [
            {"platform": mapping["platform"], "account": mapping["account"]}
            for mapping in mappings.values()
        ]
        campaign["platform_scope"]["selection_lock"]["sha256"] = HARNESS.sha256_file(selection_path)
        campaign["article_platform_assignment"]["assignments"] = [
            {"article_id": item["article_id"], **mappings[str(item["article_id"])]}
            for item in items
        ]
        campaign["locale_platform_validation"]["rows"] = locale_rows
        self.write_json(campaign_path, campaign)

        plan_path = workspace / "prewrite-plan.json"
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        # This fixture intentionally exercises the retained schema-2.13
        # compatibility route after downgrading the campaign declaration.
        plan["schema_version"] = HARNESS.PREVIOUS_PREWRITE_PLAN_SCHEMA
        plan["campaign_summary"] = {
            section: f"confirmed {section}" for section in HARNESS.MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS
        }
        plan["article_plans"] = [{
            "article_id": item["article_id"],
            "evidence_refs": ["evidence/shared/campaign-evidence-pack.json"],
            **{section: f"confirmed {section} for {item['article_id']}" for section in HARNESS.MODEL_FIRST_PREWRITE_PLAN_SECTIONS},
            "topic_slot": {
                "slot_id": f"{item['article_id']}-TOPIC",
                "reader_task": f"Help the reader complete the {item['article_id']} workflow.",
                "core_intent": "Practical instructional workflow.",
                "market": item["market"],
                "differentiation_angle": "A bounded, evidence-led practical guide.",
                "forbidden_deviations": ["Do not turn this into a product-performance claim."],
            },
            "frozen_delivery_mapping": {
                "article_language": item["language"],
                "market": item["market"],
                "platform": mappings[str(item["article_id"])]["platform"],
                "account": mappings[str(item["article_id"])]["account"],
                "fit_mode": "PRIMARY_AUDIENCE_MATCH",
                "cross_language_exception": None,
            },
            "evidence_posture": {
                "mode": "METHOD_TEMPLATE_NO_EXECUTION",
                "empirical_claims_allowed": False,
                "claim_boundary": "The article gives a reader-run method, not test results.",
                "evidence_paths": [],
            },
            "review_effort": copy.deepcopy(HARNESS.STANDARD_REVIEW_EFFORT),
        } for item in items]
        self.write_json(plan_path, plan)
        synced = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
        self.assertEqual(synced.returncode, 0, synced.stdout + synced.stderr)
        receipt = workspace / "evidence/owner-confirmations/owner-confirmation.md"
        receipt.write_text("OWNER_PREWRITE_PLAN_CONFIRMED\n", encoding="utf-8")
        confirmed = self.run_harness(
            "confirm-prewrite-plan", "--workspace", str(workspace),
            "--confirmation-id", "OWNER-PATH-001", "--receipt-file", str(receipt),
            "--receipt-type", "OWNER_MESSAGE", "--source-locator", "test-owner-message-path-001",
        )
        self.assertEqual(confirmed.returncode, 0, confirmed.stdout + confirmed.stderr)

        state_path = workspace / "state.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["orchestration"]["campaign_gatekeeper_agent_id"] = "G-CAMPAIGN"
        state["orchestration"]["article_workspaces"] = {
            str(item["article_id"]): {
                "root_role": "ARTICLE_WRITER_REVIEWER_PAIR",
                "role_bundle": {
                    "campaign_gatekeeper_agent": "G-CAMPAIGN",
                    "writer_agent": f"W-{item['article_id']}",
                    "reviewer_agent": f"R-{item['article_id']}",
                },
                "isolation": "MAIN_SESSION_PATH_ISOLATED",
                "artifact_root": f"articles/{item['article_id']}",
            }
            for item in items
        }
        self.write_json(state_path, state)
        for item in items:
            (workspace / "articles" / str(item["article_id"])).mkdir(parents=True, exist_ok=True)

    def initialized_path_isolated_workspace(self) -> tuple[tempfile.TemporaryDirectory[str], Path]:
        temp_dir, workspace = self.initialize()
        self.configure_confirmed_two_article_workspace(workspace)
        return temp_dir, workspace

    def path_isolation_errors(self, workspace: Path) -> list[str]:
        """Exercise the schema-2.13 validator directly, not a test-only stub.

        `check()` will compose this validator with the rest of the campaign
        gates.  Keeping this boundary small ensures an unrelated pre-write or
        release finding cannot make a root-collision test pass by accident.
        """
        validator = getattr(HARNESS, "article_workspace_isolation_errors", None)
        self.assertTrue(
            callable(validator),
            "schema 2.13 requires article_workspace_isolation_errors(article_workspaces, article_ids=...)",
        )
        state = json.loads((workspace / "state.json").read_text(encoding="utf-8"))
        return validator(
            state["orchestration"]["article_workspaces"],
            article_ids={"A1", "A2"},
        )

    def test_fresh_init_uses_schema_2_14_main_session_default(self) -> None:
        """A regression to worktree-first defaults must fail at initialization."""
        temp_dir, workspace = self.initialize()
        with temp_dir:
            campaign = json.loads((workspace / "campaign.json").read_text(encoding="utf-8"))
            policy = campaign["orchestration_policy"]
            self.assertEqual(campaign["schema_version"], "2.14")
            self.assertEqual(policy["execution_isolation"], "MAIN_SESSION_PATH_ISOLATED")
            self.assertEqual(policy["worktree_autospawn"], "EXPLICIT_EXCEPTION_ONLY")

    def test_two_articles_use_deterministic_distinct_roots(self) -> None:
        """A root collision or root-level article artifact breaks main-session isolation."""
        temp_dir, workspace = self.initialized_path_isolated_workspace()
        with temp_dir:
            state = json.loads((workspace / "state.json").read_text(encoding="utf-8"))
            roots = state["orchestration"]["article_workspaces"]
            self.assertEqual(roots["A1"]["artifact_root"], "articles/A1")
            self.assertEqual(roots["A2"]["artifact_root"], "articles/A2")
            self.assertNotEqual(roots["A1"]["artifact_root"], roots["A2"]["artifact_root"])
            self.assertEqual(self.path_isolation_errors(workspace), [])

    def test_rejects_invalid_reused_and_overlapping_artifact_roots(self) -> None:
        """Removing root-boundary validation must be observable through `check`."""
        mutations = {
            "invalid": "../outside",
            "reused": "articles/A1",
            "overlapping": "articles/A1/reviews",
        }
        for label, root in mutations.items():
            with self.subTest(label=label):
                temp_dir, workspace = self.initialized_path_isolated_workspace()
                with temp_dir:
                    state_path = workspace / "state.json"
                    state = json.loads(state_path.read_text(encoding="utf-8"))
                    state["orchestration"]["article_workspaces"]["A2"]["artifact_root"] = root
                    self.write_json(state_path, state)
                    errors = self.path_isolation_errors(workspace)
                    self.assertTrue(any("artifact_root" in error for error in errors), errors)

    def test_git_worktree_requires_an_explicit_dispatch_reason(self) -> None:
        """An unrecorded switch to Git isolation must not bypass the main-session default."""
        temp_dir, workspace = self.initialized_path_isolated_workspace()
        with temp_dir:
            state_path = workspace / "state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            entry = state["orchestration"]["article_workspaces"]["A1"]
            entry["isolation"] = "GIT_WORKTREE"
            self.write_json(state_path, state)
            missing_reason = self.path_isolation_errors(workspace)
            self.assertTrue(
                any("worktree_dispatch_decision" in error for error in missing_reason),
                missing_reason,
            )

            for reason in (
                "TRUE_CONCURRENT_WRITE",
                "HIGH_RISK_REWRITE_OR_ROLLBACK",
                "OWNER_REQUESTED_GIT_ISOLATION",
            ):
                with self.subTest(reason=reason):
                    entry["worktree_dispatch_decision"] = {"reason": reason}
                    self.write_json(state_path, state)
                    self.assertEqual(self.path_isolation_errors(workspace), [])

            entry["worktree_dispatch_decision"] = {"reason": "LOWER_TOKEN_COST"}
            self.write_json(state_path, state)
            invalid_reason = self.path_isolation_errors(workspace)
            self.assertTrue(any("reason" in error for error in invalid_reason), invalid_reason)


if __name__ == "__main__":
    unittest.main()
