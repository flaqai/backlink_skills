#!/usr/bin/env python3
"""Regression checks for public-visual heading acceptance."""
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


class HeadingVisualPolicyTests(unittest.TestCase):
    def run_script(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def test_local_heading_markup_never_fails_payload_validation(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            (temp / "body.html").write_text(
                "<h1>Local authoring marker</h1><p>Body.</p><h4>Deep group</h4>"
                "<p><a href=\"https://example.com/product\">Try Example Product</a></p>"
                "<!-- BLOG_3P_IMAGE:01 -->",
                encoding="utf-8",
            )
            (temp / "metadata.json").write_text(
                json.dumps({"seo_title": "Example", "tags": ["example"], "description": "Description"}),
                encoding="utf-8",
            )
            image = temp / "01-lead-local-heading.png"
            image.write_bytes(b"\x89PNG\r\n\x1a\nfixture")
            (temp / "images.json").write_text(json.dumps([{
                "ordinal": 1, "file": image.name, "coverage_zone": "LEAD",
                "sha256": hashlib.sha256(image.read_bytes()).hexdigest(),
                "alt": "Visible alt", "caption": "Caption", "placement_anchor": "Body.",
                "adjacent_claim_id": "CLAIM-001", "reader_job": "Explain the local marker.",
                "placement_reason": "Lead context.",
            }]), encoding="utf-8")
            package = temp / "article-package.json"
            package.write_text(
                json.dumps({
                    "schema_version": "1.2",
                    "cta": {
                        "mode": "SECONDARY_RECOMMENDATION",
                        "anchor_text": "Try Example Product",
                        "product_name": "Example Product",
                        "product_destination_url": "https://example.com/product",
                        "product_evidence_path": "research/source-ledger.md#example-product",
                        "reader_task_relevance": "One relevant option after the answer.",
                        "relationship_disclosure": "NOT_APPLICABLE",
                    },
                }),
                encoding="utf-8",
            )
            payload = temp / "visual-payload.html"
            markdown_payload = temp / "visual-payload.md"
            build = self.run_script(
                str(BUILD), "--title", "Example article", "--body-html", str(temp / "body.html"),
                "--article-package", str(package), "--metadata-json", str(temp / "metadata.json"), "--images-json", str(temp / "images.json"),
                "--output", str(payload), "--markdown-output", str(markdown_payload),
                "--title-transfer-mode", "TITLE_IN_BODY",
            )
            self.assertEqual(build.returncode, 0, build.stderr)
            validated = self.run_script(
                str(VALIDATE), "--payload", str(payload), "--markdown-payload", str(markdown_payload),
                "--title-transfer-mode", "TITLE_IN_BODY",
                "--article-package", str(package),
                "--required-coverage-zones", "LEAD", "--minimum-image-cards", "1",
            )
            self.assertEqual(validated.returncode, 0, validated.stdout + validated.stderr)
            self.assertIn("PAYLOAD_VALID", validated.stdout)
            self.assertNotIn("local_heading_markup", validated.stdout)
            rendered_html = payload.read_text(encoding="utf-8")
            rendered_markdown = markdown_payload.read_text(encoding="utf-8")
            self.assertLess(rendered_html.index("Body."), rendered_html.index("【图片 01"))
            self.assertLess(rendered_markdown.index("Body."), rendered_markdown.index("【图片 01"))
            self.assertIn("文件：01-lead-local-heading.png", rendered_html)
            self.assertIn("文件：01-lead-local-heading.png", rendered_markdown)

            legacy = self.run_script(
                str(VALIDATE), "--payload", str(payload), "--markdown-payload", str(markdown_payload), "--mode", "BODY_H1_REQUIRED",
                "--article-package", str(package),
                "--required-coverage-zones", "LEAD", "--minimum-image-cards", "1",
            )
            self.assertEqual(legacy.returncode, 0, legacy.stdout + legacy.stderr)
            self.assertIn("title_transfer_mode=TITLE_IN_BODY", legacy.stdout)

            package_data = json.loads(package.read_text(encoding="utf-8"))
            package_data["cta"]["relationship_disclosure"] = "Sponsored recommendation."
            package.write_text(json.dumps(package_data), encoding="utf-8")
            disclosure_missing = self.run_script(
                str(VALIDATE), "--payload", str(payload), "--markdown-payload", str(markdown_payload), "--article-package", str(package),
            )
            self.assertNotEqual(disclosure_missing.returncode, 0)
            self.assertIn("relationship disclosure", disclosure_missing.stdout)
            package_data["cta"]["relationship_disclosure"] = "NOT_APPLICABLE"
            package.write_text(json.dumps(package_data), encoding="utf-8")

            original_markdown = markdown_payload.read_text(encoding="utf-8")
            markdown_payload.write_text(
                original_markdown.replace("Try Example Product", "Changed CTA text"),
                encoding="utf-8",
            )
            markdown_cta_changed = self.run_script(
                str(VALIDATE), "--payload", str(payload), "--markdown-payload", str(markdown_payload),
                "--article-package", str(package),
            )
            self.assertNotEqual(markdown_cta_changed.returncode, 0)
            self.assertIn("Markdown payload must preserve the required CTA", markdown_cta_changed.stdout)
            markdown_payload.write_text(original_markdown, encoding="utf-8")

            payload.write_text(
                payload.read_text(encoding="utf-8").replace("Try Example Product", "Changed CTA text"),
                encoding="utf-8",
            )
            changed = self.run_script(
                str(VALIDATE), "--payload", str(payload), "--markdown-payload", str(markdown_payload), "--article-package", str(package),
            )
            self.assertNotEqual(changed.returncode, 0)
            self.assertIn("exact visible anchor text and href", changed.stdout)

            markdown_payload.write_text("# Tampered\n", encoding="utf-8")
            markdown_changed = self.run_script(
                str(VALIDATE), "--payload", str(payload), "--markdown-payload", str(markdown_payload), "--article-package", str(package),
            )
            self.assertNotEqual(markdown_changed.returncode, 0)
            self.assertIn("Markdown payload", markdown_changed.stdout)

            (temp / "body.html").write_text(
                "<p>Body.</p>{{IMAGE_CARDS}}<p><a href=\"https://example.com/product\">Try Example Product</a></p>",
                encoding="utf-8",
            )
            aggregate_marker = self.run_script(
                str(BUILD), "--title", "Example article", "--body-html", str(temp / "body.html"),
                "--article-package", str(package), "--metadata-json", str(temp / "metadata.json"), "--images-json", str(temp / "images.json"),
                "--output", str(payload),
            )
            self.assertNotEqual(aggregate_marker.returncode, 0)
            self.assertIn("IMAGE_CARDS", aggregate_marker.stderr)

            image_data = json.loads((temp / "images.json").read_text(encoding="utf-8"))
            image_data[0]["file"] = "lead-local-heading.webp"
            (temp / "images.json").write_text(json.dumps(image_data), encoding="utf-8")
            (temp / "body.html").write_text(
                "<p>Body.</p><p><a href=\"https://example.com/product\">Try Example Product</a></p><!-- BLOG_3P_IMAGE:01 -->",
                encoding="utf-8",
            )
            non_portable_image = self.run_script(
                str(BUILD), "--title", "Example article", "--body-html", str(temp / "body.html"),
                "--article-package", str(package), "--metadata-json", str(temp / "metadata.json"), "--images-json", str(temp / "images.json"),
                "--output", str(payload),
            )
            self.assertNotEqual(non_portable_image.returncode, 0)
            self.assertIn("PNG or JPG/JPEG", non_portable_image.stderr)

    def test_campaign_policy_locks_public_visual_authority(self) -> None:
        campaign = json.loads((ROOT / "templates/campaign.json").read_text(encoding="utf-8"))
        release = campaign["release_policy"]
        self.assertEqual(release["default_title_transfer_mode"], "SEPARATE_TITLE_FIELD")
        self.assertEqual(
            release["heading_hierarchy_policy"],
            {
                "authority": "PUBLIC_READER_PAGE_VISUAL_ONLY",
                "editor_html_or_dom": "NOT_A_VALID_QA_SURFACE",
                "local_payload_markup": "AUTHORING_AND_COPY_SELECTION_AID_ONLY",
                "public_visual_check_requires_human_accepted_url": True,
            },
        )


if __name__ == "__main__":
    unittest.main()
