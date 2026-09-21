#!/usr/bin/env python3
"""Focused route regression tests: WQ self-QA is not independent WR approval."""
from __future__ import annotations

import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
HARNESS_PATH = ROOT / "skills/blog-3p-harness/scripts/harnessctl.py"
SPEC = importlib.util.spec_from_file_location("blog_3p_harnessctl_dual_quality", HARNESS_PATH)
assert SPEC is not None and SPEC.loader is not None
HARNESS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HARNESS)


class WqWrDualRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.workspace = Path(self.temporary.name) / "campaign"
        self.workspace.mkdir()
        self.article_id = "A1"

    def write(self, relative: str, content: str) -> Path:
        path = self.workspace / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def write_json(self, relative: str, value: object) -> Path:
        return self.write(relative, json.dumps(value, ensure_ascii=False))

    def fixture(
        self, *, legacy: bool = False, review_effort: dict | None = None,
    ) -> tuple[Path, Path, dict]:
        cfg = HARNESS.campaign("dual-quality")
        if legacy:
            cfg["schema_version"] = "2.13"
        self.write_json("campaign.json", cfg)
        self.write_json("state.json", HARNESS.state("dual-quality"))
        effort = copy.deepcopy(review_effort or (
            HARNESS.STANDARD_REVIEW_EFFORT if legacy else HARNESS.AUTHOR_QA_REVIEW_EFFORT
        ))
        paths = HARNESS.article_artifact_paths_for_campaign(cfg, self.article_id)
        context = {
            "schema_version": HARNESS.ARTICLE_CONTEXT_SCHEMA,
            "article_id": self.article_id,
            "review_effort": effort,
            "artifact_paths": paths,
            "rehydration_protocol": HARNESS.MODEL_FIRST_REHYDRATION_PROTOCOL,
        }
        context_path = self.write_json("articles/A1/context/article-contract.json", context)
        canonical_path = self.write(paths["canonical_article"], "<p>A useful answer.</p>\n")
        index_path = self.workspace / paths["review_index"]
        # These tests isolate the quality-route contract. Full owner-scope and
        # prewrite provenance is independently exercised in the campaign tests.
        with patch.object(HARNESS, "article_context_errors", return_value=[]):
            result = HARNESS.build_review_index(
                self.workspace, context_path, index_path, canonical_path,
            )
        self.assertEqual(result, 0)
        return index_path, context_path, context

    def test_new_default_initializes_wq_without_inventing_an_independent_r(self) -> None:
        self.assertEqual(HARNESS.CURRENT_CAMPAIGN_SCHEMA, "2.14")
        self.assertEqual(HARNESS.AUTHOR_QA_REVIEW_EFFORT["quality_mode"], "WQ_SHARED_CONTEXT")
        index_path, _, _ = self.fixture()
        index = json.loads(index_path.read_text(encoding="utf-8"))
        self.assertEqual(index["review_effort"]["tier"], "AUTHOR_QA_INTEGRATED")
        self.assertEqual(index["route_resolution"]["status"], "NOT_ESCALATED")
        self.assertEqual(index["latest_author_qa"]["status"], "PENDING")
        self.assertEqual(index["latest_author_qa"]["self_qa_protocol"], HARNESS.AUTHOR_QA_PROTOCOL)
        self.assertEqual(index["latest_full_review"]["status"], "NOT_REQUIRED")
        self.assertEqual(index["latest_research_review"]["coverage"], "INTEGRATED_IN_AUTHOR_QA")
        with patch.object(HARNESS, "article_context_errors", return_value=[]):
            self.assertEqual(HARNESS.review_index_errors(self.workspace, index_path), [])

    def test_wq_ready_requires_all_final_hashes_and_no_open_findings(self) -> None:
        receipt = self.write("articles/A1/reviews/author-qa-receipt.json", '{"result":"AUTHOR_QA_READY"}\n')
        fields = HARNESS.FINAL_QUALITY_HASH_FIELDS
        expected = {field: f"{number:064x}" for number, field in enumerate(fields, start=1)}
        record = {
            "status": "AUTHOR_QA_READY",
            "receipt_path": "articles/A1/reviews/author-qa-receipt.json",
            "receipt_sha256": HARNESS.sha256_file(receipt),
            "author_agent_id": "W-A1",
            "self_qa_protocol": HARNESS.AUTHOR_QA_PROTOCOL,
            "candidate_canonical_sha256": "f" * 64,
            "open_finding_ids": [],
            **expected,
        }
        validate = lambda candidate: HARNESS.author_qa_record_errors(  # noqa: E731
            self.workspace, candidate, require_ready=True, expected_hashes=expected,
        )
        self.assertEqual(validate(record), [])
        for field in fields:
            with self.subTest(missing_binding=field):
                mutated = {**record, field: None}
                self.assertTrue(any(field in error for error in validate(mutated)))
        changed = {**record, "canonical_sha256": "e" * 64}
        self.assertTrue(any("canonical_sha256 does not match" in error for error in validate(changed)))
        unclosed = {**record, "open_finding_ids": ["SEO-001"]}
        self.assertTrue(any("zero open_finding_ids" in error for error in validate(unclosed)))

    def test_wq_cannot_masquerade_as_full_r_or_use_r_delta(self) -> None:
        index_path, _, context = self.fixture()
        index = json.loads(index_path.read_text(encoding="utf-8"))
        index["latest_full_review"]["status"] = "APPROVED"
        self.write_json("articles/A1/reviews/review-index.json", index)
        with patch.object(HARNESS, "article_context_errors", return_value=[]):
            errors = HARNESS.review_index_errors(self.workspace, index_path)
        self.assertTrue(any("must not carry a full R" in error for error in errors), errors)

        # A delta is specifically illegal on an un-escalated WQ route, even
        # when the other delta inputs are incomplete (their own errors remain).
        index["latest_full_review"]["status"] = "NOT_REQUIRED"
        self.write_json("articles/A1/reviews/review-index.json", index)
        canonical_path = self.workspace / context["artifact_paths"]["canonical_article"]
        delta = {
            "schema_version": HARNESS.REVIEW_DELTA_SCHEMA,
            "article_id": self.article_id,
            "review_index_path": "articles/A1/reviews/review-index.json",
            "review_index_sha256": HARNESS.sha256_file(index_path),
            "review_scope": "R_DELTA",
            "r_delta_attempt": 1,
            "changed_artifacts": [{
                "change_kind": "CANONICAL_TEXT",
                "path": context["artifact_paths"]["canonical_article"],
                "sha256": HARNESS.sha256_file(canonical_path),
                "affected_requirement_ids": [],
                "affected_finding_ids": [],
            }],
        }
        delta_path = self.write_json("articles/A1/reviews/review-delta-1.json", delta)
        output = io.StringIO()
        with patch.object(HARNESS, "article_context_errors", return_value=[]):
            with contextlib.redirect_stdout(output):
                result = HARNESS.check_review_delta(self.workspace, delta_path)
        self.assertEqual(result, 1)
        self.assertIn("AUTHOR_QA_INTEGRATED does not permit R_DELTA", output.getvalue())

    def test_schema_2_13_remains_an_independent_review_route(self) -> None:
        index_path, _, _ = self.fixture(legacy=True)
        index = json.loads(index_path.read_text(encoding="utf-8"))
        self.assertEqual(index["review_effort"]["tier"], "STANDARD_INTEGRATED_REVIEW")
        self.assertEqual(index["latest_full_review"]["status"], "PENDING")
        self.assertEqual(index["latest_author_qa"]["status"], "NOT_REQUIRED")
        self.assertIsNone(index["route_resolution"])
        with patch.object(HARNESS, "article_context_errors", return_value=[]):
            self.assertEqual(HARNESS.review_index_errors(self.workspace, index_path), [])

    def test_explicit_wr_still_requires_independent_full_review(self) -> None:
        effort = copy.deepcopy(HARNESS.INDEPENDENT_R_REVIEW_EFFORT)
        index_path, _, _ = self.fixture(review_effort=effort)
        index = json.loads(index_path.read_text(encoding="utf-8"))
        self.assertEqual(index["review_effort"]["tier"], "INDEPENDENT_R_ESCALATION")
        self.assertEqual(index["latest_author_qa"]["status"], "NOT_REQUIRED")
        self.assertEqual(index["latest_full_review"]["status"], "PENDING")
        self.assertEqual(index["route_resolution"]["effective_quality_mode"], "WR_INDEPENDENT")
        with patch.object(HARNESS, "article_context_errors", return_value=[]):
            errors = HARNESS.review_index_errors(
                self.workspace, index_path, require_full_approved=True,
            )
        self.assertTrue(any("latest_full_review status APPROVED" in error for error in errors), errors)

    def test_wq_escalation_requires_a_recorded_trigger_and_real_r_approval(self) -> None:
        index_path, _, _ = self.fixture()
        index = json.loads(index_path.read_text(encoding="utf-8"))
        index["route_resolution"] = {
            "planned_quality_mode": "WQ_SHARED_CONTEXT",
            "effective_quality_mode": "WR_INDEPENDENT_ESCALATED",
            "status": "WR_ESCALATED",
            "escalation_trigger_ids": [],
        }
        index["latest_author_qa"]["status"] = "AUTHOR_QA_ESCALATION_REQUIRED"
        self.write_json("articles/A1/reviews/review-index.json", index)
        with patch.object(HARNESS, "article_context_errors", return_value=[]):
            errors = HARNESS.review_index_errors(
                self.workspace, index_path, require_full_approved=True,
            )
        self.assertTrue(any("stable escalation trigger ID" in error for error in errors), errors)
        self.assertTrue(any("latest_full_review status APPROVED" in error for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
