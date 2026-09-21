#!/usr/bin/env python3
"""Regression tests for the compiler-owned paired rich-text payloads."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "skills/blog-3p-human-handoff/scripts/build_visual_payload.py"
VALIDATE = ROOT / "skills/blog-3p-human-handoff/scripts/validate_payload.py"
TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0dIDAT\x08\xd7c\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff\x89\x99=\x1d\x00\x00\x00\x00IEND\xaeB`\x82"
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class SingleSourcePayloadTests(unittest.TestCase):
    def run_script(self, script: Path, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(script), *args], cwd=ROOT,
            text=True, capture_output=True, check=False,
        )

    def make_workspace(self, root: Path) -> tuple[Path, Path, Path, Path, Path]:
        canonical = root / "canonical/article.html"
        metadata = root / "canonical/metadata.json"
        visual_manifest = root / "canonical/visual-manifest.json"
        evidence = root / "research/evidence-pack.json"
        package = root / "article-package.json"
        (root / "images").mkdir(parents=True)
        canonical.parent.mkdir(parents=True)
        evidence.parent.mkdir(parents=True)
        image = root / "images/01-lead-workflow.png"
        image.write_bytes(TINY_PNG)
        canonical.write_text(
            '<p>Useful answer for the reader.</p><!-- BLOG_3P_IMAGE:01 -->'
            '<p>Keep this ordinary paragraph exactly as written.</p>'
            '<p><a href="https://example.com/product">Try Example Product</a></p>',
            encoding="utf-8",
        )
        metadata.write_text(json.dumps({
            "canonical_title": "Example workflow",
            "platform_title": "Example workflow",
            "seo_title": "Example workflow guide",
            "tags": ["example", "workflow"],
            "description": "A useful example workflow.",
        }), encoding="utf-8")
        visual_manifest.write_text(json.dumps({
            "schema_version": "1.0",
            "assets": [{
                "ordinal": 1,
                "coverage_zone": "LEAD",
                "file": "images/01-lead-workflow.png",
                "sha256": sha256(image),
                "alt": "An editorial workflow illustration.",
                "caption": "Workflow overview.",
                "placement_anchor": "Useful answer for the reader.",
                "adjacent_claim_id": "CLAIM-001",
                "reader_job": "Orient the reader.",
                "placement_reason": "Lead context.",
                "visual_review_status": "PASS",
            }],
        }), encoding="utf-8")
        evidence.write_text(json.dumps({"schema_version": "1.3", "claims": []}), encoding="utf-8")
        package.write_text(json.dumps({
            "schema_version": "1.5",
            "article_id": "A1",
            "canonical_path": "canonical/article.html",
            "canonical_sha256": sha256(canonical),
            "reader_value_promise": "Teach the workflow before the recommendation.",
            "cta": {
                "mode": "SECONDARY_RECOMMENDATION",
                "anchor_text": "Try Example Product",
                "product_name": "Example Product",
                "product_destination_url": "https://example.com/product",
                "product_evidence_path": "research/evidence-pack.json#/claims/example-product",
                "reader_task_relevance": "A relevant option after the answer.",
                "relationship_disclosure": "NOT_APPLICABLE",
            },
            "title_transfer_mode": "SEPARATE_TITLE_FIELD",
            "canonical_format": "RICH_TEXT_HTML_FRAGMENT",
            "artifact_sources": {
                "evidence_pack": {
                    "path": "research/evidence-pack.json", "sha256": sha256(evidence),
                    "role": "ARTICLE_CLAIM_AND_SEO_DECISION_INDEX",
                },
                "visual_manifest": {
                    "path": "canonical/visual-manifest.json", "sha256": sha256(visual_manifest),
                    "role": "SINGLE_SOURCE_FOR_IMAGE_ASSETS_ALT_CAPTIONS_AND_PLACEMENT",
                },
                "metadata": {
                    "path": "canonical/metadata.json", "sha256": sha256(metadata),
                    "role": "SINGLE_SOURCE_FOR_TITLE_AND_SEO_METADATA",
                },
                "manual_retelling": "PROHIBITED",
            },
        }), encoding="utf-8")
        return canonical, metadata, visual_manifest, evidence, package

    def test_current_package_rejects_external_body_and_detects_companion_tampering(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            canonical, metadata, visual_manifest, _evidence, package = self.make_workspace(root)
            output = root / "handoff/visual-payload.html"
            output.parent.mkdir()
            compiled = self.run_script(
                BUILD, "--title", "Example workflow", "--body-html", str(canonical),
                "--article-package", str(package), "--metadata-json", str(metadata),
                "--visual-manifest", str(visual_manifest), "--output", str(output),
            )
            self.assertEqual(compiled.returncode, 0, compiled.stdout + compiled.stderr)
            markdown = output.with_suffix(".md")
            valid = self.run_script(
                VALIDATE, "--payload", str(output), "--markdown-payload", str(markdown),
                "--article-package", str(package), "--required-coverage-zones", "LEAD",
                "--minimum-image-cards", "1",
            )
            self.assertEqual(valid.returncode, 0, valid.stdout + valid.stderr)
            self.assertIn("companion_projection=COMPILER_VERIFIED_MATCH", valid.stdout)

            external_body = root / "canonical/external.html"
            external_body.write_text(canonical.read_text(encoding="utf-8"), encoding="utf-8")
            external = self.run_script(
                BUILD, "--title", "Example workflow", "--body-html", str(external_body),
                "--article-package", str(package), "--metadata-json", str(metadata),
                "--visual-manifest", str(visual_manifest), "--output", str(output),
            )
            self.assertNotEqual(external.returncode, 0)
            self.assertIn("canonical article", external.stderr)

            markdown.write_text(
                markdown.read_text(encoding="utf-8").replace(
                    "Keep this ordinary paragraph exactly as written.",
                    "A manually altered ordinary paragraph.",
                ),
                encoding="utf-8",
            )
            tampered = self.run_script(
                VALIDATE, "--payload", str(output), "--markdown-payload", str(markdown),
                "--article-package", str(package), "--required-coverage-zones", "LEAD",
                "--minimum-image-cards", "1",
            )
            self.assertNotEqual(tampered.returncode, 0)
            self.assertIn("Markdown payload does not match current compiler output", tampered.stdout)


if __name__ == "__main__":
    unittest.main()
