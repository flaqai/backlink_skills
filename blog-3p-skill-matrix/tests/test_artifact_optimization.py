#!/usr/bin/env python3
"""Regression checks for canonical manifests and compact review context."""
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
BUILD_PAYLOAD = ROOT / "skills/blog-3p-human-handoff/scripts/build_visual_payload.py"
SPEC = importlib.util.spec_from_file_location("blog_3p_harnessctl", HARNESS_PATH)
assert SPEC is not None and SPEC.loader is not None
HARNESS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HARNESS)

TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0dIDAT\x08\xd7c\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff\x89\x99=\x1d\x00\x00\x00\x00IEND\xaeB`\x82"
)


def article() -> dict:
    return {
        "article_id": "A1",
        "language": "en",
        "market": "US",
        "focus_keyword": "example workflow",
        "reader_value_promise": "Teach the reader the workflow before the secondary recommendation.",
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


def package_for(item: dict, visual_sha: str) -> dict:
    return {
        "schema_version": "1.3",
        "article_id": item["article_id"],
        "canonical_path": "canonical/article.html",
        "canonical_sha256": "a" * 64,
        "title": "Example workflow",
        "seo_title": "Example workflow guide",
        "tags": ["example"],
        "description": "A useful example workflow.",
        "meta_description": "A useful example workflow.",
        "focus_keyword": item["focus_keyword"],
        "reader_value_promise": item["reader_value_promise"],
        "cta": copy.deepcopy(item["cta"]),
        "artifact_sources": {
            "evidence_pack": {"path": "research/evidence-pack.json", "sha256": "PENDING", "role": "ARTICLE_CLAIM_AND_SEO_DECISION_INDEX"},
            "visual_manifest": {"path": "canonical/visual-manifest.json", "sha256": visual_sha, "role": "SINGLE_SOURCE_FOR_IMAGE_ASSETS_ALT_CAPTIONS_AND_PLACEMENT"},
            "handoff_manifest": {"path": "handoff/handoff-manifest.json", "sha256": "PENDING_AFTER_PAYLOAD", "role": "DERIVED_HANDOFF_ARTIFACT_AND_HASH_INDEX"},
            "manual_retelling": "PROHIBITED",
        },
        "final_visual_payload_delta": {
            "precondition": "TEXT_AND_SEO_FIELDS_STABLE",
            "scope": "VISUAL_MANIFEST_ASSETS_AND_COMPILED_PAYLOAD_ONLY",
            "reviewer_result": "PENDING",
            "report_path": "reviews/visual-payload-delta-1.md",
            "report_sha256": None,
            "reviewer_agent_id": None,
            "review_index_sha256": None,
            "reviewed_visual_manifest_sha256": None,
            "reviewed_visual_payload_sha256": None,
        },
    }


def current_package_for(item: dict, *, canonical_sha: str, metadata_sha: str, evidence_sha: str, visual_sha: str) -> dict:
    """Schema-1.5: package-bound rich-text source and one final full-R receipt."""
    return {
        "schema_version": "1.5",
        "article_id": item["article_id"],
        "canonical_path": "canonical/article.html",
        "canonical_sha256": canonical_sha,
        "canonical_format": "RICH_TEXT_HTML_FRAGMENT",
        "reader_value_promise": item["reader_value_promise"],
        "cta": copy.deepcopy(item["cta"]),
        "title_transfer_mode": "SEPARATE_TITLE_FIELD",
        "artifact_sources": {
            "evidence_pack": {"path": "research/evidence-pack.json", "sha256": evidence_sha, "role": "ARTICLE_CLAIM_AND_SEO_DECISION_INDEX"},
            "visual_manifest": {"path": "canonical/visual-manifest.json", "sha256": visual_sha, "role": "SINGLE_SOURCE_FOR_IMAGE_ASSETS_ALT_CAPTIONS_AND_PLACEMENT"},
            "metadata": {"path": "canonical/metadata.json", "sha256": metadata_sha, "role": "SINGLE_SOURCE_FOR_TITLE_AND_SEO_METADATA"},
            "manual_retelling": "PROHIBITED",
        },
    }


def article_root(workspace: Path, article_id: str = "A1") -> Path:
    """Create and return the disjoint schema-2.13 artifact root for an article."""
    root = workspace / "articles" / article_id
    for relative in ("canonical", "research", "context", "reviews", "handoff", "images"):
        (root / relative).mkdir(parents=True, exist_ok=True)
    return root


def write_visual_asset(workspace: Path, *, ordinal: int = 1, zone: str = "LEAD") -> dict:
    """Create a small real PNG plus the current visual-manifest record."""
    filename = f"images/{ordinal:02d}-{zone.casefold()}-workflow.png"
    image = workspace / filename
    image.parent.mkdir(parents=True, exist_ok=True)
    image.write_bytes(TINY_PNG)
    return {
        "ordinal": ordinal,
        "coverage_zone": zone,
        "file": filename,
        "sha256": HARNESS.sha256_file(image),
        "alt": "An editorial workflow illustration.",
        "caption": "Workflow overview.",
        "placement_anchor": "Useful answer.",
        "adjacent_claim_id": "CLAIM-001",
        "reader_job": "Orient the reader.",
        "placement_reason": "Lead context.",
        "visual_review_status": "PASS",
    }


def record_research_and_full_approvals(
    workspace: Path, root: Path, index_path: Path, canonical: Path, evidence_pack: Path,
) -> dict:
    """Create route-appropriate compact R receipts used by hand-off fixtures."""
    research_report = root / "reviews/research-review-1.md"
    full_report = root / "reviews/review-1.md"
    research_report.write_text("R: research approved.\n", encoding="utf-8")
    full_report.write_text("R: full review approved.\n", encoding="utf-8")
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
    state["orchestration"]["tasks"] = [
        {
            "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "agent_id": "R-A1",
            "workflow_stage": "FULL_REVIEW", "result": "APPROVED",
            "result_path": "articles/A1/reviews/review-1.md", "status": "COMPLETED",
        },
    ]
    index = json.loads(index_path.read_text(encoding="utf-8"))
    elevated = index.get("review_effort", {}).get("tier") == "ELEVATED_EARLY_CHALLENGE"
    if elevated:
        state["orchestration"]["tasks"].insert(0, {
            "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "agent_id": "R-A1",
            "workflow_stage": "RESEARCH_REVIEW", "result": "RESEARCH_APPROVED",
            "result_path": "articles/A1/reviews/research-review-1.md", "status": "COMPLETED",
        })
        index["latest_research_review"] = {
            "status": "RESEARCH_APPROVED",
            "coverage": None,
            "report_path": "articles/A1/reviews/research-review-1.md",
            "report_sha256": HARNESS.sha256_file(research_report),
            "reviewer_agent_id": "R-A1",
            "reviewed_evidence_pack_sha256": HARNESS.sha256_file(evidence_pack),
        }
    state_path.write_text(json.dumps(state), encoding="utf-8")
    index["latest_full_review"] = {
        "status": "APPROVED",
        "report_path": "articles/A1/reviews/review-1.md",
        "report_sha256": HARNESS.sha256_file(full_report),
        "reviewer_agent_id": "R-A1",
        "canonical_sha256": HARNESS.sha256_file(canonical),
        "evidence_pack_sha256": HARNESS.sha256_file(evidence_pack),
    }
    index_path.write_text(json.dumps(index), encoding="utf-8")
    return index


class ArtifactOptimizationTests(unittest.TestCase):
    def run_harness(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(HARNESS_PATH), *args], cwd=ROOT, text=True,
            capture_output=True, check=False,
        )

    def initialize_confirmed_workspace(self) -> tuple[tempfile.TemporaryDirectory[str], Path, dict]:
        temp_dir = tempfile.TemporaryDirectory()
        workspace = Path(temp_dir.name) / "campaign"
        initialized = self.run_harness("init", "--workspace", str(workspace), "--campaign-id", "optimized")
        self.assertEqual(initialized.returncode, 0, initialized.stdout + initialized.stderr)
        item = article()
        campaign_path = workspace / "campaign.json"
        campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
        campaign["articles"] = [item]
        campaign_path.write_text(json.dumps(campaign), encoding="utf-8")
        configure_confirmed_human_release_map(
            workspace, HARNESS, campaign_id="optimized", article=item,
            confirmation_id="OWNER-PLAN-001",
        )
        manifest_path = workspace / "prewrite-plan.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["campaign_summary"] = {section: f"confirmed {section}" for section in HARNESS.MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS}
        manifest["article_plans"] = [{
            "article_id": "A1",
            "evidence_refs": ["evidence/shared/campaign-evidence-pack.json"],
            **{section: f"confirmed {section}" for section in HARNESS.MODEL_FIRST_PREWRITE_PLAN_SECTIONS},
            "topic_slot": {
                "slot_id": "A1-TOPIC",
                "reader_task": "Help the reader complete the example workflow.",
                "core_intent": "Practical instructional workflow.",
                "market": item["market"],
                "differentiation_angle": "A bounded, evidence-led practical guide.",
                "forbidden_deviations": ["Do not turn this into a product-performance claim."],
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
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        synced = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
        self.assertEqual(synced.returncode, 0, synced.stdout + synced.stderr)
        receipt = workspace / "evidence/owner-confirmations/owner-confirmation.md"
        receipt.write_text("OWNER_PREWRITE_PLAN_CONFIRMED\n", encoding="utf-8")
        confirmed = self.run_harness(
            "confirm-prewrite-plan", "--workspace", str(workspace),
            "--confirmation-id", "OWNER-PLAN-001", "--receipt-file", str(receipt),
            "--receipt-type", "OWNER_MESSAGE", "--source-locator", "test-owner-message-001",
        )
        self.assertEqual(confirmed.returncode, 0, confirmed.stdout + confirmed.stderr)
        return temp_dir, workspace, item

    def test_prewrite_json_is_canonical_and_manual_markdown_drift_fails(self) -> None:
        template = json.loads((ROOT / "templates/campaign.json").read_text(encoding="utf-8"))
        self.assertEqual(template, HARNESS.campaign("REPLACE_ME"))
        temp_dir, workspace, _ = self.initialize_confirmed_workspace()
        with temp_dir:
            checked = self.run_harness("check", "--workspace", str(workspace))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            plan = workspace / "prewrite-plan.md"
            plan.write_text(plan.read_text(encoding="utf-8") + "\nmanual drift\n", encoding="utf-8")
            drift = self.run_harness("check", "--workspace", str(workspace))
            self.assertNotEqual(drift.returncode, 0)
            self.assertIn("deterministic rendering", drift.stdout)

    def test_context_review_index_and_delta_validate_only_changed_artifacts(self) -> None:
        temp_dir, workspace, _ = self.initialize_confirmed_workspace()
        with temp_dir:
            root = article_root(workspace)
            canonical = root / "canonical/article.html"
            canonical.write_text("# Example\n\nBody.\n", encoding="utf-8")
            evidence_pack = root / "research/evidence-pack.json"
            evidence_pack.write_text(json.dumps({"schema_version": "1.0", "claims": []}), encoding="utf-8")
            context = root / "context/article-contract.json"
            built = self.run_harness("build-article-context", "--workspace", str(workspace), "--article-id", "A1", "--output", str(context))
            self.assertEqual(built.returncode, 0, built.stdout + built.stderr)
            context_data = json.loads(context.read_text(encoding="utf-8"))
            self.assertEqual(context_data["review_effort"], HARNESS.STANDARD_REVIEW_EFFORT)
            self.assertEqual(context_data["rehydration_protocol"], HARNESS.MODEL_FIRST_REHYDRATION_PROTOCOL)
            self.assertNotIn(
                "CONTEXT_COMPACTION",
                context_data["rehydration_protocol"]["expand_historical_material_when"],
            )
            self.assertEqual(self.run_harness("check-article-context", "--workspace", str(workspace), "--context", str(context)).returncode, 0)
            index = root / "reviews/review-index.json"
            index_built = self.run_harness("build-review-index", "--workspace", str(workspace), "--article-contract", str(context), "--output", str(index))
            self.assertEqual(index_built.returncode, 0, index_built.stdout + index_built.stderr)
            record_research_and_full_approvals(workspace, root, index, canonical, evidence_pack)
            self.assertEqual(self.run_harness("check-review-index", "--workspace", str(workspace), "--index", str(index)).returncode, 0)
            approved_index = index.read_text(encoding="utf-8")
            tampered_index = json.loads(approved_index)
            tampered_index["latest_full_review"]["evidence_pack_sha256"] = "0" * 64
            index.write_text(json.dumps(tampered_index), encoding="utf-8")
            evidence_mismatch = self.run_harness("check-review-index", "--workspace", str(workspace), "--index", str(index))
            self.assertNotEqual(evidence_mismatch.returncode, 0)
            self.assertIn("evidence_pack_sha256", evidence_mismatch.stdout)
            index.write_text(approved_index, encoding="utf-8")
            delta = root / "reviews/review-delta-1.json"
            delta.write_text(json.dumps({
                "schema_version": "1.0",
                "article_id": "A1",
                "review_index_path": "articles/A1/reviews/review-index.json",
                "review_index_sha256": HARNESS.sha256_file(index),
                "review_scope": "R_DELTA",
                "r_delta_attempt": 1,
                "full_review_required": False,
                "changed_artifacts": [{
                    "path": "articles/A1/canonical/article.html",
                    "sha256": HARNESS.sha256_file(canonical),
                    "change_kind": "CANONICAL_TEXT",
                    "affected_requirement_ids": ["REQ-SEO-001"],
                    "affected_finding_ids": ["SEO-EXAMPLE-001"],
                }],
            }), encoding="utf-8")
            validated = self.run_harness("check-review-delta", "--workspace", str(workspace), "--delta", str(delta))
            self.assertEqual(validated.returncode, 0, validated.stdout + validated.stderr)
            canonical.write_text("# Example\n\nChanged body.\n", encoding="utf-8")
            stale = self.run_harness("check-review-delta", "--workspace", str(workspace), "--delta", str(delta))
            self.assertNotEqual(stale.returncode, 0)
            self.assertIn("sha256 does not match", stale.stdout)
            campaign_path = workspace / "campaign.json"
            campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
            campaign["articles"][0]["focus_keyword"] = "drifted workflow intent"
            campaign_path.write_text(json.dumps(campaign), encoding="utf-8")
            stale_build = self.run_harness(
                "build-review-index", "--workspace", str(workspace),
                "--article-contract", str(context), "--output", str(root / "reviews/stale-index.json"),
            )
            self.assertNotEqual(stale_build.returncode, 0)
            self.assertIn("article contract is stale or invalid", stale_build.stdout)
            stale_index = self.run_harness("check-review-index", "--workspace", str(workspace), "--index", str(index))
            self.assertNotEqual(stale_index.returncode, 0)
            self.assertIn("frozen_article no longer matches", stale_index.stdout)

    def test_new_finding_stays_in_review_index_not_frozen_article_contract(self) -> None:
        temp_dir, workspace, _ = self.initialize_confirmed_workspace()
        with temp_dir:
            root = article_root(workspace)
            canonical = root / "canonical/article.html"
            canonical.write_text("# Example\n\nBody.\n", encoding="utf-8")
            context = root / "context/article-contract.json"
            self.assertEqual(self.run_harness(
                "build-article-context", "--workspace", str(workspace),
                "--article-id", "A1", "--output", str(context),
            ).returncode, 0)
            state_path = workspace / "state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["finding_status"]["SEO-EXAMPLE-001"] = {
                "article_id": "A1", "status": "OPEN",
                "report_path": "articles/A1/reviews/review-1.md", "supersedes": None,
                "split_from": None,
            }
            state_path.write_text(json.dumps(state), encoding="utf-8")
            checked = self.run_harness(
                "check-article-context", "--workspace", str(workspace), "--context", str(context),
            )
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            self.assertNotIn("open_findings", json.loads(context.read_text(encoding="utf-8")))
            index = root / "reviews/review-index.json"
            built = self.run_harness(
                "build-review-index", "--workspace", str(workspace),
                "--article-contract", str(context), "--output", str(index),
            )
            self.assertEqual(built.returncode, 0, built.stdout + built.stderr)
            self.assertEqual(json.loads(index.read_text(encoding="utf-8"))["open_findings"][0]["id"], "SEO-EXAMPLE-001")

    def test_review_ready_checks_current_artifacts_without_issuing_editorial_verdict(self) -> None:
        temp_dir, workspace, item = self.initialize_confirmed_workspace()
        with temp_dir:
            root = article_root(workspace)
            canonical = root / "canonical/article.html"
            canonical.write_text(
                '<p>Useful answer.</p><!-- BLOG_3P_IMAGE:01 --><p><a href="https://example.com/product">Try Example Product</a></p>',
                encoding="utf-8",
            )
            body = canonical
            metadata = root / "canonical/metadata.json"
            metadata.write_text(json.dumps({
                "canonical_title": "Example workflow",
                "platform_title": "Example workflow",
                "seo_title": "Example workflow guide",
                "tags": ["example"],
                "description": "A useful example workflow.",
            }), encoding="utf-8")
            visual_manifest = root / "canonical/visual-manifest.json"
            visual_manifest.write_text(json.dumps({
                "schema_version": "1.0", "assets": [write_visual_asset(root)],
            }), encoding="utf-8")
            evidence_pack = root / "research/evidence-pack.json"
            evidence_pack.write_text(json.dumps({
                "schema_version": HARNESS.CURRENT_EVIDENCE_PACK_SCHEMA, "claims": [],
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
                        "mode": "NOT_USED", "evidence_refs": [],
                        "used_as_keyword_or_demand_evidence": False,
                    },
                },
                "evidence_posture": {
                    "mode": "METHOD_TEMPLATE_NO_EXECUTION",
                    "empirical_claims_allowed": False,
                    "claim_boundary": "Reader-run method only.",
                    "evidence_paths": [],
                    "documented_record": None,
                },
            }), encoding="utf-8")
            context = root / "context/article-contract.json"
            self.assertEqual(self.run_harness(
                "build-article-context", "--workspace", str(workspace),
                "--article-id", "A1", "--output", str(context),
            ).returncode, 0)
            index = root / "reviews/review-index.json"
            self.assertEqual(self.run_harness(
                "build-review-index", "--workspace", str(workspace),
                "--article-contract", str(context), "--output", str(index),
            ).returncode, 0)
            package = root / "article-package.json"
            package.write_text(json.dumps(current_package_for(
                item,
                canonical_sha=HARNESS.sha256_file(canonical),
                metadata_sha=HARNESS.sha256_file(metadata),
                evidence_sha=HARNESS.sha256_file(evidence_pack),
                visual_sha=HARNESS.sha256_file(visual_manifest),
            )), encoding="utf-8")
            payload = root / "handoff/visual-payload.html"
            compiled = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(payload),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(compiled.returncode, 0, compiled.stdout + compiled.stderr)
            ready = self.run_harness(
                "check-review-ready", "--workspace", str(workspace),
                "--article-contract", str(context), "--review-index", str(index),
                "--article-package", str(package),
            )
            self.assertEqual(ready.returncode, 0, ready.stdout + ready.stderr)
            self.assertIn("REVIEW_READY_CHECK_PASSED", ready.stdout)
            self.assertIn("companion_projection=COMPILER_VERIFIED_MATCH", ready.stdout)
            markdown_payload = payload.with_suffix(".md")
            original_markdown = markdown_payload.read_text(encoding="utf-8")
            markdown_payload.write_text(
                original_markdown.replace("Useful answer.", "Manually altered ordinary paragraph."),
                encoding="utf-8",
            )
            companion_drift = self.run_harness(
                "check-review-ready", "--workspace", str(workspace),
                "--article-contract", str(context), "--review-index", str(index),
                "--article-package", str(package),
            )
            self.assertNotEqual(companion_drift.returncode, 0)
            self.assertIn("Markdown payload does not match current compiler output", companion_drift.stdout)
            markdown_payload.write_text(original_markdown, encoding="utf-8")
            evidence_data = json.loads(evidence_pack.read_text(encoding="utf-8"))
            evidence_data["topic_slot_alignment"].update({
                "status": "TOPIC_EVIDENCE_CONFLICT",
                "active_conflict": {
                    "conflict_id": "TOPIC_EVIDENCE_CONFLICT-001",
                    "reason": "Regional intent evidence points to a different reader problem.",
                    "evidence_refs": ["evidence/serp/a1.md"],
                    "proposed_action": "OWNER_RECONFIRM_REQUIRED",
                },
            })
            evidence_pack.write_text(json.dumps(evidence_data), encoding="utf-8")
            package_data = json.loads(package.read_text(encoding="utf-8"))
            package_data["artifact_sources"]["evidence_pack"]["sha256"] = HARNESS.sha256_file(evidence_pack)
            package.write_text(json.dumps(package_data), encoding="utf-8")
            conflicted_payload = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(payload),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(conflicted_payload.returncode, 0, conflicted_payload.stdout + conflicted_payload.stderr)
            conflicted = self.run_harness(
                "check-review-ready", "--workspace", str(workspace),
                "--article-contract", str(context), "--review-index", str(index),
                "--article-package", str(package),
            )
            self.assertNotEqual(conflicted.returncode, 0)
            self.assertIn("TOPIC_EVIDENCE_CONFLICT: resolve with the registered campaign G", conflicted.stdout)
            payload.write_text(
                payload.read_text(encoding="utf-8").replace(
                    "01-lead-workflow.png", "01-lead-substituted.png",
                ),
                encoding="utf-8",
            )
            card_drift = self.run_harness(
                "check-review-ready", "--workspace", str(workspace),
                "--article-contract", str(context), "--review-index", str(index),
                "--article-package", str(package),
            )
            self.assertNotEqual(card_drift.returncode, 0)
            self.assertIn("HTML image-card files do not match the visual manifest", card_drift.stdout)
            evidence_pack.write_text(json.dumps({"schema_version": "1.1", "claims": ["drift"]}), encoding="utf-8")
            stale = self.run_harness(
                "check-review-ready", "--workspace", str(workspace),
                "--article-contract", str(context), "--review-index", str(index),
                "--article-package", str(package),
            )
            self.assertNotEqual(stale.returncode, 0)
            self.assertIn("evidence_pack sha256", stale.stdout)

    def test_efficiency_summary_uses_only_runtime_metrics_that_exist(self) -> None:
        temp_dir, workspace, _ = self.initialize_confirmed_workspace()
        with temp_dir:
            state_path = workspace / "state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["orchestration"]["tasks"] = [
                {
                    "article_id": "A1", "role": "ARTICLE_WRITER", "workflow_stage": "DRAFT",
                    "status": "COMPLETED", "result": "READY",
                    "runtime_metrics": {"input_tokens": 120, "output_tokens": 80, "wall_time_seconds": 12.5},
                },
                {
                    "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "workflow_stage": "FULL_REVIEW",
                    "status": "COMPLETED", "result": "CHANGES_REQUIRED",
                },
            ]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            output = "evidence/operations/efficiency-summary.json"
            summarized = self.run_harness(
                "summarize-efficiency", "--workspace", str(workspace), "--output", output,
            )
            self.assertEqual(summarized.returncode, 0, summarized.stdout + summarized.stderr)
            summary = json.loads((workspace / output).read_text(encoding="utf-8"))
            self.assertEqual(summary["completed_model_stages"]["count"], 2)
            self.assertEqual(summary["runtime_metrics"]["input_tokens"]["total"], 120.0)
            self.assertEqual(summary["runtime_metrics"]["tool_calls"]["availability"], "UNAVAILABLE")
            self.assertEqual(summary["review_rework_signals"]["review_changes_required"], 1)

    def test_elevated_route_requires_the_early_research_receipt(self) -> None:
        temp_dir, workspace, _ = self.initialize_confirmed_workspace()
        with temp_dir:
            manifest_path = workspace / "prewrite-plan.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["article_plans"][0]["review_effort"] = {
                "tier": "ELEVATED_EARLY_CHALLENGE",
                "research_gate": "SEPARATE_RESEARCH_REVIEW_REQUIRED",
                "reasons": ["VOLATILE_COMPARATIVE_CLAIM"],
            }
            manifest["status"] = "PENDING_OWNER_PREWRITE_PLAN_CONFIRMATION"
            manifest["owner_confirmation_id"] = None
            manifest["owner_confirmation_receipt"] = None
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            item = json.loads((workspace / "campaign.json").read_text(encoding="utf-8"))["articles"][0]
            configure_confirmed_human_release_map(
                workspace, HARNESS, campaign_id="optimized", article=item,
                confirmation_id="OWNER-PLAN-002",
            )
            synced = self.run_harness("sync-prewrite-plan", "--workspace", str(workspace))
            self.assertEqual(synced.returncode, 0, synced.stdout + synced.stderr)
            receipt = workspace / "evidence/owner-confirmations/owner-reconfirmation.md"
            receipt.write_text("OWNER_PREWRITE_PLAN_CONFIRMED after elevated-route update\n", encoding="utf-8")
            confirmed = self.run_harness(
                "confirm-prewrite-plan", "--workspace", str(workspace),
                "--confirmation-id", "OWNER-PLAN-002", "--receipt-file", str(receipt),
                "--receipt-type", "OWNER_MESSAGE", "--source-locator", "test-owner-message-002",
            )
            self.assertEqual(confirmed.returncode, 0, confirmed.stdout + confirmed.stderr)
            root = article_root(workspace)
            canonical = root / "canonical/article.html"
            canonical.write_text("# Example\n\nBody.\n", encoding="utf-8")
            evidence_pack = root / "research/evidence-pack.json"
            evidence_pack.write_text(json.dumps({"schema_version": "1.0", "claims": []}), encoding="utf-8")
            context = root / "context/article-contract.json"
            self.assertEqual(self.run_harness(
                "build-article-context", "--workspace", str(workspace), "--article-id", "A1", "--output", str(context),
            ).returncode, 0)
            index = root / "reviews/review-index.json"
            self.assertEqual(self.run_harness(
                "build-review-index", "--workspace", str(workspace), "--article-contract", str(context), "--output", str(index),
            ).returncode, 0)
            index_data = json.loads(index.read_text(encoding="utf-8"))
            self.assertEqual(index_data["latest_research_review"]["status"], "PENDING")
            record_research_and_full_approvals(workspace, root, index, canonical, evidence_pack)
            self.assertEqual(self.run_harness("check-review-index", "--workspace", str(workspace), "--index", str(index)).returncode, 0)
            missing_research = json.loads(index.read_text(encoding="utf-8"))
            missing_research["latest_research_review"] = {
                "status": "NOT_REQUIRED",
                "coverage": "INTEGRATED_IN_FULL_REVIEW",
                "report_path": None,
                "report_sha256": None,
                "reviewer_agent_id": None,
                "reviewed_evidence_pack_sha256": None,
            }
            index.write_text(json.dumps(missing_research), encoding="utf-8")
            errors = HARNESS.review_index_errors(
                workspace, index, require_research_approved=True, require_full_approved=True,
            )
            self.assertTrue(any("separate research review" in error for error in errors), errors)

    def test_compiler_builds_and_harness_checks_compact_handoff_manifest(self) -> None:
        temp_dir, workspace, item = self.initialize_confirmed_workspace()
        with temp_dir:
            root = article_root(workspace)
            canonical = root / "canonical/article.html"
            canonical.write_text("# Example\n", encoding="utf-8")
            (root / "canonical/body.html").write_text(
                '<p>Useful answer.</p><p><a href="https://example.com/product">Try Example Product</a></p>',
                encoding="utf-8",
            )
            (root / "canonical/metadata.json").write_text(
                json.dumps({"seo_title": "Example workflow guide", "tags": ["example"], "description": "A useful example workflow."}),
                encoding="utf-8",
            )
            visual_manifest = root / "canonical/visual-manifest.json"
            visual_manifest.write_text(json.dumps({"schema_version": "1.0", "assets": []}), encoding="utf-8")
            evidence_pack = root / "research/evidence-pack.json"
            evidence_pack.write_text(json.dumps({"schema_version": "1.0", "claims": []}), encoding="utf-8")
            (root / "requirements-traceability.md").write_text("REQ-SEO-001 -> canonical/article.html\n", encoding="utf-8")
            context = root / "context/article-contract.json"
            self.assertEqual(self.run_harness(
                "build-article-context", "--workspace", str(workspace), "--article-id", "A1", "--output", str(context),
            ).returncode, 0)
            index = root / "reviews/review-index.json"
            self.assertEqual(self.run_harness(
                "build-review-index", "--workspace", str(workspace), "--article-contract", str(context), "--output", str(index),
            ).returncode, 0)
            record_research_and_full_approvals(workspace, root, index, canonical, evidence_pack)
            visual_sha = HARNESS.sha256_file(visual_manifest)
            package = root / "article-package.json"
            package_data = package_for(item, visual_sha)
            package_data["canonical_sha256"] = HARNESS.sha256_file(canonical)
            package_data["artifact_sources"]["evidence_pack"]["sha256"] = HARNESS.sha256_file(evidence_pack)
            package.write_text(json.dumps(package_data), encoding="utf-8")
            output = root / "handoff/visual-payload.html"
            handoff = root / "handoff/handoff-manifest.json"
            initial_payload = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(root / "canonical/body.html"), "--article-package", str(package),
                    "--metadata-json", str(root / "canonical/metadata.json"), "--output", str(output),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(initial_payload.returncode, 0, initial_payload.stdout + initial_payload.stderr)
            visual_report = root / "reviews/visual-payload-delta-1.md"
            visual_report.write_text("R: visual payload approved.\n", encoding="utf-8")
            index_data = json.loads(index.read_text(encoding="utf-8"))
            index_data["last_delta"] = {
                "review_scope": "R_VISUAL_DELTA",
                "status": "APPROVED",
                "report_path": "articles/A1/reviews/visual-payload-delta-1.md",
                "report_sha256": HARNESS.sha256_file(visual_report),
                "reviewer_agent_id": "R-A1",
                "reviewed_visual_manifest_sha256": visual_sha,
                "reviewed_visual_payload_sha256": HARNESS.sha256_file(output),
            }
            index.write_text(json.dumps(index_data), encoding="utf-8")
            state_path = workspace / "state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["orchestration"]["tasks"].append({
                "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "agent_id": "R-A1",
                "workflow_stage": "VISUAL_PAYLOAD_DELTA", "result": "APPROVED",
                "result_path": "articles/A1/reviews/visual-payload-delta-1.md", "status": "COMPLETED",
            })
            state_path.write_text(json.dumps(state), encoding="utf-8")
            package_data = json.loads(package.read_text(encoding="utf-8"))
            package_data["final_visual_payload_delta"] = {
                "precondition": "TEXT_AND_SEO_FIELDS_STABLE",
                "scope": "VISUAL_MANIFEST_ASSETS_AND_COMPILED_PAYLOAD_ONLY",
                "reviewer_result": "APPROVED",
                "report_path": "articles/A1/reviews/visual-payload-delta-1.md",
                "report_sha256": HARNESS.sha256_file(visual_report),
                "reviewer_agent_id": "R-A1",
                "review_index_sha256": HARNESS.sha256_file(index),
                "reviewed_visual_manifest_sha256": visual_sha,
                "reviewed_visual_payload_sha256": HARNESS.sha256_file(output),
            }
            package.write_text(json.dumps(package_data), encoding="utf-8")
            built = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(root / "canonical/body.html"), "--article-package", str(package),
                    "--metadata-json", str(root / "canonical/metadata.json"), "--output", str(output),
                    "--handoff-manifest-output", str(handoff), "--workspace", str(root),
                    "--requirements-traceability", str(root / "requirements-traceability.md"),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(built.returncode, 0, built.stdout + built.stderr)
            checked = self.run_harness("check-handoff-manifest", "--workspace", str(workspace), "--manifest", str(handoff), "--article-package", str(package))
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            state_path = workspace / "state.json"
            frozen_state = state_path.read_text(encoding="utf-8")
            missing_full_task = json.loads(frozen_state)
            missing_full_task["orchestration"]["tasks"] = [
                task for task in missing_full_task["orchestration"]["tasks"]
                if task.get("workflow_stage") != "FULL_REVIEW"
            ]
            state_path.write_text(json.dumps(missing_full_task), encoding="utf-8")
            no_full_gate = self.run_harness("check-handoff-manifest", "--workspace", str(workspace), "--manifest", str(handoff), "--article-package", str(package))
            self.assertNotEqual(no_full_gate.returncode, 0)
            self.assertIn("FULL_REVIEW", no_full_gate.stdout)
            state_path.write_text(frozen_state, encoding="utf-8")
            frozen_package = package.read_text(encoding="utf-8")
            rejected_package = json.loads(frozen_package)
            rejected_package["final_visual_payload_delta"]["reviewer_result"] = "CHANGES_REQUIRED"
            package.write_text(json.dumps(rejected_package), encoding="utf-8")
            rejected = self.run_harness("check-article-package", "--workspace", str(workspace), "--package", str(package))
            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn("must be PENDING or APPROVED", rejected.stdout)
            package.write_text(frozen_package, encoding="utf-8")
            visual_report.write_text("placeholder, not the reviewed report\n", encoding="utf-8")
            tampered = self.run_harness("check-handoff-manifest", "--workspace", str(workspace), "--manifest", str(handoff), "--article-package", str(package))
            self.assertNotEqual(tampered.returncode, 0)
            self.assertIn("report_sha256 does not match", tampered.stdout)

    def test_current_package_uses_one_final_full_review_without_a_default_visual_delta(self) -> None:
        temp_dir, workspace, item = self.initialize_confirmed_workspace()
        with temp_dir:
            root = article_root(workspace)
            canonical = root / "canonical/article.html"
            canonical.write_text(
                '<p>Useful answer.</p><p><a href="https://example.com/product">Try Example Product</a></p><!-- BLOG_3P_IMAGE:01 -->',
                encoding="utf-8",
            )
            body = canonical
            metadata = root / "canonical/metadata.json"
            metadata.write_text(json.dumps({
                "canonical_title": "Example workflow",
                "platform_title": "Example workflow",
                "seo_title": "Example workflow guide",
                "tags": ["example"],
                "description": "A useful example workflow.",
            }), encoding="utf-8")
            visual_manifest = root / "canonical/visual-manifest.json"
            visual_manifest.write_text(json.dumps({
                "schema_version": "1.0", "assets": [write_visual_asset(root)],
            }), encoding="utf-8")
            evidence_pack = root / "research/evidence-pack.json"
            evidence_pack.write_text(json.dumps({"schema_version": "1.0", "claims": []}), encoding="utf-8")
            (root / "requirements-traceability.md").write_text("REQ-SEO-001 -> canonical/article.html\n", encoding="utf-8")
            context = root / "context/article-contract.json"
            self.assertEqual(self.run_harness(
                "build-article-context", "--workspace", str(workspace), "--article-id", "A1", "--output", str(context),
            ).returncode, 0)
            index = root / "reviews/review-index.json"
            self.assertEqual(self.run_harness(
                "build-review-index", "--workspace", str(workspace), "--article-contract", str(context), "--output", str(index),
            ).returncode, 0)
            package = root / "article-package.json"
            package.write_text(json.dumps(current_package_for(
                item,
                canonical_sha=HARNESS.sha256_file(canonical),
                metadata_sha=HARNESS.sha256_file(metadata),
                evidence_sha=HARNESS.sha256_file(evidence_pack),
                visual_sha=HARNESS.sha256_file(visual_manifest),
            )), encoding="utf-8")
            output = root / "handoff/visual-payload.html"
            compiled = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(output),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(compiled.returncode, 0, compiled.stdout + compiled.stderr)
            record_research_and_full_approvals(workspace, root, index, canonical, evidence_pack)
            index_data = json.loads(index.read_text(encoding="utf-8"))
            index_data["latest_full_review"].update({
                "metadata_sha256": HARNESS.sha256_file(metadata),
                "visual_manifest_sha256": HARNESS.sha256_file(visual_manifest),
                "visual_payload_sha256": HARNESS.sha256_file(output),
                "visual_payload_markdown_sha256": HARNESS.sha256_file(output.with_suffix(".md")),
                "article_package_sha256": HARNESS.sha256_file(package),
            })
            index.write_text(json.dumps(index_data), encoding="utf-8")
            handoff = root / "handoff/handoff-manifest.json"
            reviewed_payload = output.read_bytes()
            reviewed_stat = output.stat()
            built = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(output), "--handoff-manifest-output", str(handoff),
                    "--workspace", str(root), "--requirements-traceability", str(root / "requirements-traceability.md"),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(built.returncode, 0, built.stdout + built.stderr)
            self.assertEqual(output.read_bytes(), reviewed_payload)
            self.assertEqual(output.stat().st_ino, reviewed_stat.st_ino)
            self.assertEqual(output.stat().st_mtime_ns, reviewed_stat.st_mtime_ns)
            colliding_manifest = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(output), "--handoff-manifest-output", str(output),
                    "--workspace", str(root), "--requirements-traceability", str(root / "requirements-traceability.md"),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertNotEqual(colliding_manifest.returncode, 0)
            self.assertIn("must not share a visual payload path", colliding_manifest.stderr + colliding_manifest.stdout)
            self.assertEqual(output.read_bytes(), reviewed_payload)
            checked = self.run_harness(
                "check-handoff-manifest", "--workspace", str(workspace), "--manifest", str(handoff), "--article-package", str(package),
            )
            self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
            package_data = json.loads(package.read_text(encoding="utf-8"))
            self.assertNotIn("handoff_manifest", package_data["artifact_sources"])
            self.assertNotIn("final_visual_payload_delta", package_data)
            state = json.loads((workspace / "state.json").read_text(encoding="utf-8"))
            self.assertFalse(any(task.get("workflow_stage") == "VISUAL_PAYLOAD_DELTA" for task in state["orchestration"]["tasks"]))
            manifest = json.loads(handoff.read_text(encoding="utf-8"))
            self.assertEqual(manifest["review_provenance"]["mode"], "FULL_REVIEW_COVERS_FINAL_PAYLOAD")
            self.assertEqual(manifest["review_provenance"]["source"], "reviews/review-index.json#/latest_full_review")

            visual_data = json.loads(visual_manifest.read_text(encoding="utf-8"))
            approved_payload = output.read_bytes()
            approved_payload_stat = output.stat()
            visual_data["assets"][0]["caption"] = "Updated workflow overview."
            visual_manifest.write_text(json.dumps(visual_data), encoding="utf-8")
            package_data["artifact_sources"]["visual_manifest"]["sha256"] = HARNESS.sha256_file(visual_manifest)
            package.write_text(json.dumps(package_data), encoding="utf-8")
            guarded_handoff = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(output), "--handoff-manifest-output", str(handoff),
                    "--workspace", str(root), "--requirements-traceability", str(root / "requirements-traceability.md"),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertNotEqual(guarded_handoff.returncode, 0)
            self.assertIn("must not rewrite the reviewed visual payload", guarded_handoff.stderr + guarded_handoff.stdout)
            self.assertEqual(output.read_bytes(), approved_payload)
            self.assertEqual(output.stat().st_ino, approved_payload_stat.st_ino)
            self.assertEqual(output.stat().st_mtime_ns, approved_payload_stat.st_mtime_ns)
            revised_payload = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(output),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(revised_payload.returncode, 0, revised_payload.stdout + revised_payload.stderr)
            missing_delta = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(output), "--handoff-manifest-output", str(handoff),
                    "--workspace", str(root), "--requirements-traceability", str(root / "requirements-traceability.md"),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertNotEqual(missing_delta.returncode, 0)
            self.assertIn("R_VISUAL_DELTA", missing_delta.stderr + missing_delta.stdout)
            delta_path = root / "reviews/review-delta-1.json"
            delta_path.write_text(json.dumps({
                "schema_version": "1.0", "article_id": "A1",
                "review_index_path": "articles/A1/reviews/review-index.json",
                "review_index_sha256": HARNESS.sha256_file(index),
                "review_scope": "R_VISUAL_DELTA", "r_delta_attempt": 1,
                "full_review_required": False,
                "changed_artifacts": [
                    {"path": "articles/A1/canonical/visual-manifest.json", "sha256": HARNESS.sha256_file(visual_manifest), "change_kind": "VISUAL_MANIFEST", "affected_requirement_ids": ["REQ-VISUAL-001"], "affected_finding_ids": ["VISUAL-NARRATIVE-001"]},
                    {"path": "articles/A1/handoff/visual-payload.html", "sha256": HARNESS.sha256_file(output), "change_kind": "VISUAL_PAYLOAD", "affected_requirement_ids": ["REQ-VISUAL-001"], "affected_finding_ids": ["VISUAL-NARRATIVE-001"]},
                    {"path": "articles/A1/handoff/visual-payload.md", "sha256": HARNESS.sha256_file(output.with_suffix(".md")), "change_kind": "VISUAL_PAYLOAD", "affected_requirement_ids": ["REQ-VISUAL-001"], "affected_finding_ids": ["VISUAL-NARRATIVE-001"]},
                    {"path": "articles/A1/article-package.json", "sha256": HARNESS.sha256_file(package), "change_kind": "ARTICLE_PACKAGE_VISUAL_POINTER", "affected_requirement_ids": ["REQ-VISUAL-001"], "affected_finding_ids": ["VISUAL-NARRATIVE-001"]},
                ],
            }), encoding="utf-8")
            validated_delta = self.run_harness(
                "check-review-delta", "--workspace", str(workspace), "--delta", str(delta_path),
            )
            self.assertEqual(validated_delta.returncode, 0, validated_delta.stdout + validated_delta.stderr)
            delta_report = root / "reviews/visual-payload-delta-1.md"
            delta_report.write_text("R: visual payload delta approved.\n", encoding="utf-8")
            index_data = json.loads(index.read_text(encoding="utf-8"))
            index_data["last_delta"] = {
                "review_scope": "R_VISUAL_DELTA", "status": "APPROVED",
                "report_path": "articles/A1/reviews/visual-payload-delta-1.md",
                "report_sha256": HARNESS.sha256_file(delta_report), "reviewer_agent_id": "R-A1",
                "reviewed_canonical_sha256": HARNESS.sha256_file(canonical),
                "reviewed_metadata_sha256": HARNESS.sha256_file(metadata),
                "reviewed_visual_manifest_sha256": HARNESS.sha256_file(visual_manifest),
                "reviewed_visual_payload_sha256": HARNESS.sha256_file(output),
                "reviewed_visual_payload_markdown_sha256": HARNESS.sha256_file(output.with_suffix(".md")),
                "reviewed_article_package_sha256": HARNESS.sha256_file(package),
            }
            index.write_text(json.dumps(index_data), encoding="utf-8")
            state = json.loads((workspace / "state.json").read_text(encoding="utf-8"))
            state["orchestration"]["tasks"].append({
                "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "agent_id": "R-A1",
                "workflow_stage": "VISUAL_PAYLOAD_DELTA", "result": "APPROVED",
                "result_path": "articles/A1/reviews/visual-payload-delta-1.md", "status": "COMPLETED",
            })
            (workspace / "state.json").write_text(json.dumps(state), encoding="utf-8")
            rebuilt = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(output), "--handoff-manifest-output", str(handoff),
                    "--workspace", str(root), "--requirements-traceability", str(root / "requirements-traceability.md"),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(rebuilt.returncode, 0, rebuilt.stdout + rebuilt.stderr)
            delta_checked = self.run_harness(
                "check-handoff-manifest", "--workspace", str(workspace), "--manifest", str(handoff), "--article-package", str(package),
            )
            self.assertEqual(delta_checked.returncode, 0, delta_checked.stdout + delta_checked.stderr)
            delta_manifest = json.loads(handoff.read_text(encoding="utf-8"))
            self.assertEqual(delta_manifest["review_provenance"]["mode"], "POST_FULL_REVIEW_VISUAL_DELTA")
            self.assertEqual(delta_manifest["review_provenance"]["source"], "reviews/review-index.json#/last_delta")

    def test_post_full_review_targeted_delta_binds_current_handoff(self) -> None:
        """A same-R non-visual repair can avoid a second full reread.

        This is deliberately an ``R_DELTA`` rather than ``R_VISUAL_DELTA``:
        it changes the post-review SEO metadata and consequently the compiled
        reader payload.  The final receipt must bind the original full-review
        report, every current artifact hash, and the visible same-R task.
        """
        temp_dir, workspace, item = self.initialize_confirmed_workspace()
        with temp_dir:
            root = article_root(workspace)
            canonical = root / "canonical/article.html"
            canonical.write_text(
                '<p>Useful answer.</p><p><a href="https://example.com/product">Try Example Product</a></p>',
                encoding="utf-8",
            )
            body = canonical
            metadata = root / "canonical/metadata.json"
            metadata.write_text(json.dumps({
                "canonical_title": "Example workflow",
                "platform_title": "Example workflow",
                "seo_title": "Example workflow guide",
                "tags": ["example"],
                "description": "A useful example workflow.",
            }), encoding="utf-8")
            visual_manifest = root / "canonical/visual-manifest.json"
            visual_manifest.write_text(json.dumps({"schema_version": "1.0", "assets": []}), encoding="utf-8")
            evidence_pack = root / "research/evidence-pack.json"
            evidence_pack.write_text(json.dumps({"schema_version": "1.0", "claims": []}), encoding="utf-8")
            traceability = root / "requirements-traceability.md"
            traceability.write_text("REQ-SEO-001 -> canonical/metadata.json\n", encoding="utf-8")

            context = root / "context/article-contract.json"
            self.assertEqual(self.run_harness(
                "build-article-context", "--workspace", str(workspace), "--article-id", "A1", "--output", str(context),
            ).returncode, 0)
            index = root / "reviews/review-index.json"
            self.assertEqual(self.run_harness(
                "build-review-index", "--workspace", str(workspace), "--article-contract", str(context), "--output", str(index),
            ).returncode, 0)
            package = root / "article-package.json"
            package.write_text(json.dumps(current_package_for(
                item,
                canonical_sha=HARNESS.sha256_file(canonical),
                metadata_sha=HARNESS.sha256_file(metadata),
                evidence_sha=HARNESS.sha256_file(evidence_pack),
                visual_sha=HARNESS.sha256_file(visual_manifest),
            )), encoding="utf-8")
            payload = root / "handoff/visual-payload.html"
            compiled = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(payload),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(compiled.returncode, 0, compiled.stdout + compiled.stderr)

            record_research_and_full_approvals(workspace, root, index, canonical, evidence_pack)
            index_data = json.loads(index.read_text(encoding="utf-8"))
            index_data["latest_full_review"].update({
                "metadata_sha256": HARNESS.sha256_file(metadata),
                "visual_manifest_sha256": HARNESS.sha256_file(visual_manifest),
                "visual_payload_sha256": HARNESS.sha256_file(payload),
                "visual_payload_markdown_sha256": HARNESS.sha256_file(payload.with_suffix(".md")),
                "article_package_sha256": HARNESS.sha256_file(package),
            })
            index.write_text(json.dumps(index_data), encoding="utf-8")

            # This is not a visual-only correction: the SEO metadata changes
            # after FULL_REVIEW, so its package pointer and rendered payload do too.
            metadata.write_text(json.dumps({
                "canonical_title": "Example workflow",
                "platform_title": "Example workflow",
                "seo_title": "Example workflow: practical guide",
                "tags": ["example"],
                "description": "A clearer practical example workflow.",
            }), encoding="utf-8")
            package_data = json.loads(package.read_text(encoding="utf-8"))
            package_data["artifact_sources"]["metadata"]["sha256"] = HARNESS.sha256_file(metadata)
            package.write_text(json.dumps(package_data), encoding="utf-8")
            recompiled = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(payload),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(recompiled.returncode, 0, recompiled.stdout + recompiled.stderr)

            baseline_full = index_data["latest_full_review"]
            delta_capsule = root / "reviews/review-delta-1.json"
            delta_capsule.write_text(json.dumps({
                "schema_version": "1.0",
                "article_id": "A1",
                "review_index_path": "articles/A1/reviews/review-index.json",
                "review_index_sha256": HARNESS.sha256_file(index),
                "review_scope": "R_DELTA",
                "r_delta_attempt": 1,
                "full_review_required": False,
                "changed_artifacts": [
                    {
                        "path": "articles/A1/canonical/metadata.json",
                        "sha256": HARNESS.sha256_file(metadata),
                        "change_kind": "METADATA_OR_CTA",
                        "affected_requirement_ids": ["REQ-SEO-001"],
                        "affected_finding_ids": ["SEO-TITLE-001"],
                    },
                    {
                        "path": "articles/A1/article-package.json",
                        "sha256": HARNESS.sha256_file(package),
                        "change_kind": "METADATA_OR_CTA",
                        "affected_requirement_ids": ["REQ-SEO-001"],
                        "affected_finding_ids": ["SEO-TITLE-001"],
                    },
                    {
                        "path": "articles/A1/handoff/visual-payload.html",
                        "sha256": HARNESS.sha256_file(payload),
                        "change_kind": "VISUAL_PAYLOAD",
                        "affected_requirement_ids": ["REQ-SEO-001"],
                        "affected_finding_ids": ["SEO-TITLE-001"],
                    },
                    {
                        "path": "articles/A1/handoff/visual-payload.md",
                        "sha256": HARNESS.sha256_file(payload.with_suffix(".md")),
                        "change_kind": "VISUAL_PAYLOAD",
                        "affected_requirement_ids": ["REQ-SEO-001"],
                        "affected_finding_ids": ["SEO-TITLE-001"],
                    },
                ],
            }), encoding="utf-8")
            delta_checked = self.run_harness(
                "check-review-delta", "--workspace", str(workspace), "--delta", str(delta_capsule),
            )
            self.assertEqual(delta_checked.returncode, 0, delta_checked.stdout + delta_checked.stderr)

            delta_report = root / "reviews/review-delta-approval-1.md"
            delta_report.write_text("R: targeted repair approved.\n", encoding="utf-8")
            index_data = json.loads(index.read_text(encoding="utf-8"))
            index_data["last_delta"] = {
                "review_scope": "R_DELTA",
                "status": "APPROVED",
                "full_review_required": False,
                "report_path": "articles/A1/reviews/review-delta-approval-1.md",
                "report_sha256": HARNESS.sha256_file(delta_report),
                "reviewer_agent_id": "R-A1",
                "baseline_full_review_report_sha256": baseline_full["report_sha256"],
                "reviewed_canonical_sha256": HARNESS.sha256_file(canonical),
                "reviewed_metadata_sha256": HARNESS.sha256_file(metadata),
                "reviewed_visual_manifest_sha256": HARNESS.sha256_file(visual_manifest),
                "reviewed_visual_payload_sha256": HARNESS.sha256_file(payload),
                "reviewed_visual_payload_markdown_sha256": HARNESS.sha256_file(payload.with_suffix(".md")),
                "reviewed_article_package_sha256": HARNESS.sha256_file(package),
                "reviewed_evidence_pack_sha256": HARNESS.sha256_file(evidence_pack),
            }
            index.write_text(json.dumps(index_data), encoding="utf-8")
            state_path = workspace / "state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["orchestration"]["tasks"].append({
                "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "agent_id": "R-A1",
                "workflow_stage": "REVIEW_DELTA", "result": "APPROVED",
                "result_path": "articles/A1/reviews/review-delta-approval-1.md", "status": "COMPLETED",
            })
            state_path.write_text(json.dumps(state), encoding="utf-8")

            handoff = root / "handoff/handoff-manifest.json"
            built = subprocess.run(
                [
                    sys.executable, str(BUILD_PAYLOAD), "--title", "Example workflow",
                    "--body-html", str(body), "--article-package", str(package),
                    "--metadata-json", str(metadata), "--visual-manifest", str(visual_manifest),
                    "--output", str(payload), "--handoff-manifest-output", str(handoff),
                    "--workspace", str(root), "--requirements-traceability", str(traceability),
                ], cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(built.returncode, 0, built.stdout + built.stderr)
            handoff_checked = self.run_harness(
                "check-handoff-manifest", "--workspace", str(workspace),
                "--manifest", str(handoff), "--article-package", str(package),
            )
            self.assertEqual(handoff_checked.returncode, 0, handoff_checked.stdout + handoff_checked.stderr)
            manifest = json.loads(handoff.read_text(encoding="utf-8"))
            self.assertEqual(manifest["review_provenance"], {
                "source": "reviews/review-index.json#/last_delta",
                "mode": "POST_FULL_REVIEW_TARGETED_DELTA",
            })

            # The generic delta cannot become a detached replacement for the
            # approved full review: its baseline report hash remains mandatory.
            original_index = index.read_text(encoding="utf-8")
            tampered = json.loads(original_index)
            tampered["last_delta"]["baseline_full_review_report_sha256"] = "0" * 64
            index.write_text(json.dumps(tampered), encoding="utf-8")
            rejected = self.run_harness(
                "check-handoff-manifest", "--workspace", str(workspace),
                "--manifest", str(handoff), "--article-package", str(package),
            )
            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn("must bind the approved full-review report hash", rejected.stdout)
            index.write_text(original_index, encoding="utf-8")

            payload.with_suffix(".md").write_text("# Tampered Markdown payload\n", encoding="utf-8")
            markdown_tampered = self.run_harness(
                "check-handoff-manifest", "--workspace", str(workspace),
                "--manifest", str(handoff), "--article-package", str(package),
            )
            self.assertNotEqual(markdown_tampered.returncode, 0)
            self.assertIn("visual_payload_markdown sha256 does not match", markdown_tampered.stdout)


if __name__ == "__main__":
    unittest.main()
