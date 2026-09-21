#!/usr/bin/env python3
"""Regression checks for the observe-only efficiency telemetry summary."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
HARNESS = ROOT / "skills/blog-3p-harness/scripts/harnessctl.py"


class EfficiencyTelemetryTests(unittest.TestCase):
    def summarize(self, state: dict) -> dict:
        with tempfile.TemporaryDirectory() as temporary:
            workspace = Path(temporary) / "campaign"
            workspace.mkdir()
            (workspace / "campaign.json").write_text(
                json.dumps({"campaign_id": "telemetry-canary"}), encoding="utf-8",
            )
            (workspace / "state.json").write_text(json.dumps(state), encoding="utf-8")
            output = "evidence/operations/efficiency-summary.json"
            result = subprocess.run(
                [
                    sys.executable, str(HARNESS), "summarize-efficiency",
                    "--workspace", str(workspace), "--output", output,
                ],
                cwd=ROOT, text=True, capture_output=True, check=False,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            return json.loads((workspace / output).read_text(encoding="utf-8"))

    def test_groups_only_observed_runtime_metrics_by_completed_workflow_stage(self) -> None:
        summary = self.summarize({
            "orchestration": {
                "tasks": [
                    {
                        "article_id": "A1", "role": "ARTICLE_WRITER", "status": "COMPLETED",
                        "workflow_stage": "DRAFT",
                        "runtime_metrics": {
                            "input_tokens": 12, "output_tokens": 4,
                            "wall_time_seconds": 2.5,
                        },
                    },
                    {
                        "article_id": "A2", "role": "ARTICLE_WRITER", "status": "COMPLETED",
                        "workflow_stage": "DRAFT",
                        "runtime_metrics": {
                            "input_tokens": 8, "output_tokens": 4,
                            "wall_time_seconds": 1.5, "tool_calls": 2,
                        },
                    },
                    {
                        "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "status": "COMPLETED",
                        "workflow_stage": "FULL_REVIEW", "result": "CHANGES_REQUIRED",
                    },
                    {
                        "article_id": "A1", "role": "ARTICLE_LANGUAGE_REVIEWER", "status": "COMPLETED",
                        "workflow_stage": "CANONICAL_REOPEN", "result": "READY",
                        "runtime_metrics": {"input_tokens": 3},
                    },
                ],
            },
            "publication": {
                "articles": {
                    "A1": {
                        "human_state": "HUMAN_NEEDS_FIX", "public_qa_status": "NOT_STARTED",
                        "accepted_platform_limitations": [], "unverified_retry_count": 0,
                    },
                    "A2": {
                        "human_state": "HUMAN_ACCEPTED", "public_qa_status": "HUMAN_TRANSPORT_FIX_REQUIRED",
                        "accepted_platform_limitations": [], "unverified_retry_count": 0,
                    },
                    "A3": {
                        "human_state": "HUMAN_ACCEPTED", "public_qa_status": "PUBLIC_QA_UNVERIFIED",
                        "accepted_platform_limitations": [], "unverified_retry_count": 1,
                    },
                    "A4": {
                        "human_state": "HUMAN_ACCEPTED", "public_qa_status": "PUBLIC_QA_PASSED_WITH_LIMITATION",
                        "accepted_platform_limitations": [{"id": "L1"}, {"id": "L2"}],
                        "unverified_retry_count": 0,
                    },
                    "A5": {
                        "human_state": "HUMAN_ACCEPTED", "public_qa_status": "CANONICAL_CHANGE_REQUESTED",
                        "accepted_platform_limitations": [], "unverified_retry_count": 0,
                    },
                },
            },
        })

        by_stage = summary["runtime_metrics_by_workflow_stage"]
        self.assertEqual(by_stage["DRAFT"]["input_tokens"]["total"], 20.0)
        self.assertEqual(by_stage["DRAFT"]["tool_calls"]["observed_task_count"], 1)
        self.assertEqual(by_stage["FULL_REVIEW"]["input_tokens"]["availability"], "UNAVAILABLE")
        self.assertEqual(by_stage["CANONICAL_REOPEN"]["input_tokens"]["total"], 3.0)
        self.assertEqual(summary["review_rework_signals"]["canonical_reopen_turns"], 1)

        signals = summary["public_transport_signals"]
        self.assertEqual(signals["availability"], "LEDGER_PROVIDED")
        self.assertEqual(signals["observed_article_count"], 5)
        self.assertEqual(signals["human_needs_fix"]["count"], 1)
        self.assertEqual(signals["human_transport_fix_required"]["count"], 1)
        self.assertEqual(signals["public_qa_unverified"]["count"], 1)
        self.assertEqual(signals["passed_with_limitation"]["count"], 1)
        self.assertEqual(signals["accepted_platform_limitation_count"]["total"], 2)
        self.assertEqual(signals["unverified_retry_count"]["total"], 1)
        self.assertEqual(signals["canonical_change_requested"]["count"], 1)

    def test_marks_public_transport_signals_unavailable_without_a_usable_ledger(self) -> None:
        summary = self.summarize({"orchestration": {"tasks": []}})

        signals = summary["public_transport_signals"]
        self.assertEqual(signals["availability"], "UNAVAILABLE")
        self.assertIsNone(signals["observed_article_count"])
        for field in (
            "human_needs_fix", "human_transport_fix_required", "public_qa_unverified",
            "passed_with_limitation", "accepted_platform_limitation_count",
            "unverified_retry_count", "canonical_change_requested",
        ):
            self.assertEqual(signals[field]["availability"], "UNAVAILABLE")

    def test_distinguishes_a_known_not_yet_returned_row_from_a_missing_ledger_field(self) -> None:
        summary = self.summarize({
            "orchestration": {"tasks": []},
            "publication": {
                "articles": {
                    "A1": {
                        "human_state": None, "public_qa_status": "NOT_STARTED",
                        "accepted_platform_limitations": [], "unverified_retry_count": 0,
                    },
                },
            },
        })

        signal = summary["public_transport_signals"]["human_needs_fix"]
        self.assertEqual(signal["availability"], "LEDGER_PROVIDED")
        self.assertEqual(signal["count"], 0)

        missing_field_summary = self.summarize({
            "orchestration": {"tasks": []},
            "publication": {
                "articles": {
                    "A1": {
                        "public_qa_status": "NOT_STARTED",
                        "accepted_platform_limitations": [], "unverified_retry_count": 0,
                    },
                },
            },
        })
        missing_field_signal = missing_field_summary["public_transport_signals"]["human_needs_fix"]
        self.assertEqual(missing_field_signal["availability"], "UNAVAILABLE")
        self.assertIsNone(missing_field_signal["count"])

        malformed_status_summary = self.summarize({
            "orchestration": {"tasks": []},
            "publication": {
                "articles": {
                    "A1": {
                        "human_state": "HUMAN_ACCEPTED", "public_qa_status": [],
                        "accepted_platform_limitations": [], "unverified_retry_count": 0,
                    },
                },
            },
        })
        malformed_status_signal = malformed_status_summary["public_transport_signals"]["public_qa_unverified"]
        self.assertEqual(malformed_status_signal["availability"], "UNAVAILABLE")
        self.assertIsNone(malformed_status_signal["count"])


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
