"""Regression coverage for optional, campaign-local shared evidence reuse."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
HARNESS_PATH = ROOT / "skills/blog-3p-harness/scripts/harnessctl.py"
SPEC = importlib.util.spec_from_file_location("blog_3p_shared_evidence", HARNESS_PATH)
assert SPEC is not None and SPEC.loader is not None
HARNESS = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = HARNESS
SPEC.loader.exec_module(HARNESS)


class SharedEvidenceReuseTests(unittest.TestCase):
    def write_shared_pack(self, workspace: Path, records: list[dict]) -> Path:
        path = workspace / "evidence/shared/campaign-evidence-pack.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({
            "schema_version": "1.0",
            "purpose": "CAMPAIGN_SHARED_READONLY_EVIDENCE",
            "records": records,
        }), encoding="utf-8")
        return path

    def reusable_evidence(self, shared_pack: Path, record_ids: list[str]) -> dict:
        return {
            "campaign_shared_evidence": {
                "path": "evidence/shared/campaign-evidence-pack.json",
                "sha256": HARNESS.sha256_file(shared_pack),
                "record_ids": record_ids,
            },
            "article_delta": {
                "decision": "ADOPTED_WITH_ARTICLE_LOCAL_RATIONALE",
                "freshness_or_scope_check": "Same locale, reader intent, query context, and dated observation.",
                "additional_evidence_refs": [],
            },
        }

    def test_absent_reuse_fields_do_not_require_a_cache(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            self.assertEqual(
                HARNESS.shared_campaign_evidence_reuse_errors(Path(temp_dir), {}),
                [],
            )

    def test_reused_records_require_exact_campaign_local_pack_and_article_delta(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir)
            shared_pack = self.write_shared_pack(workspace, [{
                "id": "BRAND-EN-001",
                "kind": "BRAND_SITE_VARIANT",
            }])
            evidence = self.reusable_evidence(shared_pack, ["BRAND-EN-001"])
            self.assertEqual(
                HARNESS.shared_campaign_evidence_reuse_errors(workspace, evidence),
                [],
            )

            evidence.pop("article_delta")
            errors = HARNESS.shared_campaign_evidence_reuse_errors(workspace, evidence)
            self.assertTrue(any("article_delta" in error for error in errors), errors)

    def test_reuse_rejects_hash_drift_duplicate_or_non_reusable_records(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir)
            shared_pack = self.write_shared_pack(workspace, [
                {"id": "BRAND-EN-001", "kind": "BRAND_SITE_VARIANT"},
                {"id": "SESSION-001", "kind": "ACCOUNT_SESSION_STATE"},
                {"id": "TRANSPORT-001", "kind": "PLATFORM_TRANSPORT_STATE"},
            ])
            evidence = self.reusable_evidence(shared_pack, ["BRAND-EN-001", "BRAND-EN-001"])
            errors = HARNESS.shared_campaign_evidence_reuse_errors(workspace, evidence)
            self.assertTrue(any("record_ids" in error and "unique" in error for error in errors), errors)

            evidence = self.reusable_evidence(shared_pack, ["SESSION-001", "TRANSPORT-001"])
            errors = HARNESS.shared_campaign_evidence_reuse_errors(workspace, evidence)
            self.assertTrue(any("not reusable" in error and "SESSION-001" in error for error in errors), errors)
            self.assertTrue(any("not reusable" in error and "TRANSPORT-001" in error for error in errors), errors)

            evidence = self.reusable_evidence(shared_pack, ["BRAND-EN-001"])
            evidence["campaign_shared_evidence"]["sha256"] = "0" * 64
            errors = HARNESS.shared_campaign_evidence_reuse_errors(workspace, evidence)
            self.assertTrue(any("sha256" in error for error in errors), errors)

    def test_reuse_rejects_an_empty_referenced_shared_cache(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir)
            shared_pack = self.write_shared_pack(workspace, [])
            evidence = self.reusable_evidence(shared_pack, ["BRAND-EN-001"])
            errors = HARNESS.shared_campaign_evidence_reuse_errors(workspace, evidence)
            self.assertTrue(
                any("must contain at least one record" in error for error in errors),
                errors,
            )

    def test_review_ready_research_integrity_invokes_optional_reuse_check(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace = Path(temp_dir)
            shared_pack = self.write_shared_pack(workspace, [{
                "id": "BRAND-EN-001",
                "kind": "BRAND_SITE_VARIANT",
            }])
            evidence = self.reusable_evidence(shared_pack, ["BRAND-EN-001"])
            evidence["campaign_shared_evidence"]["sha256"] = "0" * 64
            research = workspace / "research/evidence-pack.json"
            research.parent.mkdir(parents=True, exist_ok=True)
            research.write_text(json.dumps(evidence), encoding="utf-8")
            (workspace / "campaign.json").write_text(
                json.dumps(HARNESS.campaign("shared-evidence")), encoding="utf-8"
            )
            errors = HARNESS.research_evidence_pack_integrity_errors(
                workspace,
                {"artifact_paths": {"evidence_pack": "research/evidence-pack.json"}},
            )
            self.assertTrue(
                any("campaign shared evidence pack sha256 does not match" in error for error in errors),
                errors,
            )


if __name__ == "__main__":
    unittest.main()
