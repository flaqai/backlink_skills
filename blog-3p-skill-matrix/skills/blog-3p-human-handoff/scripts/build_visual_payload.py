#!/usr/bin/env python3
"""Build the fixed, minimal visual hand-off page from canonical inputs."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path

TEMPLATE_ID = "BLOG_3P_VISUAL_PAYLOAD"
TEMPLATE_VERSION = "3"
CTA_FIELDS = ("anchor_text", "product_name", "product_destination_url", "product_evidence_path", "reader_task_relevance", "relationship_disclosure")
PACKAGE_SCHEMAS = {"1.2", "1.3", "1.4", "1.5"}
CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA = "1.5"
IMAGE_FORMATS = {".png", ".jpg", ".jpeg"}
IMAGE_ZONES = {"LEAD", "MIDDLE", "CLOSING"}
IMAGE_MARKER_RE = re.compile(r"<!--\s*BLOG_3P_IMAGE:(\d{2})\s*-->")
LEGACY_IMAGE_MARKER = "{{IMAGE_CARDS}}"
FORBIDDEN_BODY_TAGS = {
    "html", "head", "body", "main", "section", "article", "header", "footer",
    "style", "script", "iframe", "form", "button", "input", "textarea", "select",
    "nav", "aside", "img",
}


class BodyFragmentPolicy(HTMLParser):
    def handle_starttag(self, tag, attrs):
        if tag.casefold() in FORBIDDEN_BODY_TAGS:
            raise ValueError(f"canonical body may not contain <{tag}>; the fixed template owns layout and image annotations")
        for name, _ in attrs:
            if name.casefold() == "style" or name.casefold().startswith("on"):
                raise ValueError(f"canonical body may not contain the {name} attribute")

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


class CTAContentParser(HTMLParser):
    """Read visible body text and links without changing the canonical fragment."""

    def __init__(self):
        super().__init__()
        self.body_text: list[str] = []
        self.anchors: list[tuple[str, str]] = []
        self._anchor_href: str | None = None
        self._anchor_text: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag.casefold() == "a":
            self._anchor_href = dict(attrs).get("href", "").strip()
            self._anchor_text = []

    def handle_data(self, data):
        self.body_text.append(data)
        if self._anchor_href is not None:
            self._anchor_text.append(data)

    def handle_endtag(self, tag):
        if tag.casefold() == "a" and self._anchor_href is not None:
            self.anchors.append((self._anchor_href, normalize_text("".join(self._anchor_text))))
            self._anchor_href = None
            self._anchor_text = []


def normalize_text(value: str) -> str:
    return " ".join(value.split())


def read_body_fragment(path: Path) -> str:
    body = path.read_text(encoding="utf-8")
    parser = BodyFragmentPolicy()
    parser.feed(body)
    parser.close()
    return body


def read_article_package(path: Path) -> dict:
    try:
        package = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"article-package must be valid JSON: {exc}") from exc
    if not isinstance(package, dict) or package.get("schema_version") not in PACKAGE_SCHEMAS:
        raise ValueError("article-package must use schema_version 1.2, 1.3, 1.4, or 1.5")
    return package


def required_cta_from_package(path: Path) -> dict[str, str]:
    package = read_article_package(path)
    cta = package.get("cta")
    if not isinstance(cta, dict) or cta.get("mode") != "SECONDARY_RECOMMENDATION":
        raise ValueError("article-package must declare a required SECONDARY_RECOMMENDATION CTA")
    missing = [field for field in CTA_FIELDS if not isinstance(cta.get(field), str) or not cta[field].strip()]
    if missing:
        raise ValueError("article-package required CTA is missing: " + ", ".join(missing))
    return {field: cta[field].strip() for field in CTA_FIELDS}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _package_source_path(
    package_root: Path, source: object, *, key: str, expected_path: str,
) -> Path:
    """Return one package-declared, hash-bound source inside its workspace."""
    if not isinstance(source, dict):
        raise ValueError(f"article-package schema 1.5 requires {key} source")
    if source.get("path") != expected_path:
        raise ValueError(f"article-package {key} path is invalid")
    expected_hash = source.get("sha256")
    if not isinstance(expected_hash, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", expected_hash):
        raise ValueError(f"article-package {key} sha256 must be final")
    relative = Path(expected_path)
    path = (package_root / relative).resolve()
    if package_root not in path.parents or not path.is_file():
        raise ValueError(f"article-package {key} source must exist inside the article workspace")
    if sha256_file(path) != expected_hash.casefold():
        raise ValueError(f"article-package {key} sha256 must match its source")
    return path


def current_single_source_inputs(package: dict, package_path: Path) -> dict[str, Path]:
    """Resolve the four immutable sources of a schema-1.5 payload.

    The current package deliberately has no independent body/title/metadata
    input chain.  The command-line paths remain compatibility aliases, but
    must resolve to these declarations exactly.
    """
    if package.get("schema_version") != CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA:
        raise ValueError("current single-source inputs require article-package schema_version 1.5")
    package_root = package_path.resolve().parent
    if package.get("canonical_path") != "canonical/article.html":
        raise ValueError("article-package schema 1.5 canonical_path must be canonical/article.html")
    if package.get("canonical_format") != "RICH_TEXT_HTML_FRAGMENT":
        raise ValueError("article-package schema 1.5 canonical_format must be RICH_TEXT_HTML_FRAGMENT")
    canonical_hash = package.get("canonical_sha256")
    if not isinstance(canonical_hash, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", canonical_hash):
        raise ValueError("article-package canonical article sha256 must be final")
    canonical = (package_root / "canonical/article.html").resolve()
    if package_root not in canonical.parents or not canonical.is_file():
        raise ValueError("article-package canonical article source must exist inside the article workspace")
    if sha256_file(canonical) != canonical_hash.casefold():
        raise ValueError("article-package canonical article sha256 must match its source")
    sources = package.get("artifact_sources")
    if not isinstance(sources, dict):
        raise ValueError("article-package schema 1.5 requires artifact_sources")
    if sources.get("manual_retelling") != "PROHIBITED":
        raise ValueError("article-package schema 1.5 must prohibit manual retelling")
    return {
        "canonical": canonical,
        "metadata": _package_source_path(
            package_root, sources.get("metadata"), key="metadata", expected_path="canonical/metadata.json",
        ),
        "visual_manifest": _package_source_path(
            package_root, sources.get("visual_manifest"), key="visual_manifest", expected_path="canonical/visual-manifest.json",
        ),
        "evidence_pack": _package_source_path(
            package_root, sources.get("evidence_pack"), key="evidence_pack", expected_path="research/evidence-pack.json",
        ),
    }


def workspace_relative(workspace: Path, path: Path) -> str:
    root = workspace.resolve()
    resolved = path.resolve()
    if resolved == root or root not in resolved.parents:
        raise ValueError(f"handoff artifact must stay inside --workspace: {path}")
    return str(resolved.relative_to(root))


def artifact_record(workspace: Path, path: Path) -> dict[str, str]:
    if not path.is_file():
        raise ValueError(f"handoff artifact is missing: {path}")
    return {"path": workspace_relative(workspace, path), "sha256": sha256_file(path)}


def indexed_review_report_path(article_workspace: Path, report_path: object, article_id: object) -> Path:
    """Resolve a review receipt without weakening article-root isolation.

    Schema-2.13 article packages are compiled from their own ``articles/<id>``
    root, while the harness indexes review receipts relative to the campaign
    root so a batch gate can read every article deterministically.  Accept
    that exact, same-article campaign-relative form here; legacy packages keep
    resolving receipts relative to their article workspace.  A receipt for a
    different article never receives the campaign-root fallback.
    """
    if not isinstance(report_path, str) or not report_path.strip():
        raise ValueError("review report_path must be a non-empty relative path")
    relative = Path(report_path)
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError("review report_path must be a safe relative path")
    workspace = article_workspace.resolve()
    local = (workspace / relative).resolve()
    if workspace in local.parents and local.is_file():
        return local

    normalized_article_id = str(article_id).strip()
    expected_prefix = ("articles", normalized_article_id)
    if (
        normalized_article_id
        and relative.parts[:2] == expected_prefix
        and workspace.name == normalized_article_id
        and workspace.parent.name == "articles"
    ):
        campaign_root = workspace.parent.parent.resolve()
        candidate = (campaign_root / relative).resolve()
        if campaign_root in candidate.parents and candidate.is_file():
            return candidate
    return local


def separate_research_review_required(review_index: dict) -> bool:
    """Keep legacy packages conservative while honoring the frozen WR route."""
    effort = review_index.get("review_effort")
    if not isinstance(effort, dict):
        return True
    return (
        effort.get("tier") == "ELEVATED_EARLY_CHALLENGE"
        or (
            effort.get("tier") == "INDEPENDENT_R_ESCALATION"
            and effort.get("research_gate") == "SEPARATE_RESEARCH_REVIEW_REQUIRED"
        )
    )


def standard_integrated_review(review_index: dict) -> bool:
    effort = review_index.get("review_effort")
    return isinstance(effort, dict) and effort.get("tier") == "STANDARD_INTEGRATED_REVIEW"


def author_qa_integrated(review_index: dict) -> bool:
    effort = review_index.get("review_effort")
    return isinstance(effort, dict) and effort.get("tier") == "AUTHOR_QA_INTEGRATED"


def author_qa_is_un_escalated(review_index: dict) -> bool:
    resolution = review_index.get("route_resolution")
    return (
        isinstance(resolution, dict)
        and resolution.get("planned_quality_mode") == "WQ_SHARED_CONTEXT"
        and resolution.get("effective_quality_mode") == "WQ_SHARED_CONTEXT"
        and resolution.get("status") == "NOT_ESCALATED"
        and resolution.get("escalation_trigger_ids") == []
    )


def require_approved_final_visual_delta(workspace: Path, package: dict, visual_payload: Path) -> dict:
    """Legacy schema-1.3 path: require an existing same-R visual receipt."""
    final_delta = package.get("final_visual_payload_delta")
    if not isinstance(final_delta, dict) or final_delta.get("reviewer_result") != "APPROVED":
        raise ValueError("handoff manifest requires an APPROVED final visual payload delta")
    required = (
        "report_path", "report_sha256", "reviewer_agent_id", "review_index_sha256",
        "reviewed_visual_manifest_sha256", "reviewed_visual_payload_sha256",
    )
    missing = [field for field in required if not isinstance(final_delta.get(field), str) or not final_delta[field].strip()]
    if missing:
        raise ValueError("approved final visual payload delta is missing: " + ", ".join(missing))
    try:
        report = indexed_review_report_path(
            workspace, final_delta["report_path"], package.get("article_id"),
        )
    except (TypeError, ValueError) as exc:
        raise ValueError("final visual payload delta report must use a safe article-local or same-article campaign-indexed path") from exc
    if not report.is_file() or final_delta["report_sha256"] != sha256_file(report):
        raise ValueError("final visual payload delta report_sha256 must match its existing report")
    index = workspace / "reviews/review-index.json"
    if not index.is_file() or final_delta["review_index_sha256"] != sha256_file(index):
        raise ValueError("final visual payload delta review_index_sha256 must match reviews/review-index.json")
    try:
        review_index = json.loads(index.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("reviews/review-index.json must be valid JSON") from exc
    if review_index.get("article_id") != package.get("article_id"):
        raise ValueError("review index article_id must match article-package before handoff compilation")
    if (
        separate_research_review_required(review_index)
        and review_index.get("latest_research_review", {}).get("status") != "RESEARCH_APPROVED"
    ):
        raise ValueError("handoff manifest requires review-index RESEARCH_APPROVED")
    if review_index.get("latest_full_review", {}).get("status") != "APPROVED":
        raise ValueError("handoff manifest requires review-index full R APPROVED")
    indexed_visual_delta = review_index.get("last_delta")
    if not isinstance(indexed_visual_delta, dict) or indexed_visual_delta.get("review_scope") != "R_VISUAL_DELTA" or indexed_visual_delta.get("status") != "APPROVED":
        raise ValueError("handoff manifest requires an approved R_VISUAL_DELTA in the review index")
    for field in (
        "report_path", "report_sha256", "reviewer_agent_id",
        "reviewed_visual_manifest_sha256", "reviewed_visual_payload_sha256",
    ):
        if indexed_visual_delta.get(field) != final_delta.get(field):
            raise ValueError(f"final visual payload delta {field} must match the review index")
    sources = package.get("artifact_sources")
    visual_source = sources.get("visual_manifest") if isinstance(sources, dict) else None
    if not isinstance(visual_source, dict) or not isinstance(visual_source.get("path"), str):
        raise ValueError("article-package requires a visual_manifest artifact source")
    visual_manifest = workspace / visual_source["path"]
    if not visual_manifest.is_file() or visual_source.get("sha256") != sha256_file(visual_manifest):
        raise ValueError("article-package visual_manifest sha256 must match before handoff compilation")
    if final_delta["reviewed_visual_manifest_sha256"] != visual_source["sha256"]:
        raise ValueError("final visual payload delta must bind the reviewed visual manifest")
    if final_delta["reviewed_visual_payload_sha256"] != sha256_file(visual_payload):
        raise ValueError("final visual payload delta must bind the compiled visual payload")
    return final_delta


def require_approved_final_artifact_review(
    workspace: Path, package: dict, package_path: Path, metadata_path: Path, visual_payload: Path,
    visual_payload_markdown: Path,
) -> tuple[str, dict]:
    """Resolve current full-R or bounded post-full R-Delta provenance.

    A normal full review already covers the complete final package.  When a
    known, post-review repair changes one or more delivery artifacts, the same
    reviewer may instead bind a narrow ``R_DELTA`` to the approved full-review
    report and every current artifact.  This keeps the final hand-off honest
    without mechanically forcing the reviewer to reread unrelated prose.
    ``R_VISUAL_DELTA`` remains the stricter visual-only subset.
    """
    index = workspace / "reviews/review-index.json"
    if not index.is_file():
        raise ValueError("handoff manifest requires reviews/review-index.json")
    try:
        review_index = json.loads(index.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("reviews/review-index.json must be valid JSON") from exc
    if review_index.get("article_id") != package.get("article_id"):
        raise ValueError("review index article_id must match article-package before handoff compilation")
    if (
        separate_research_review_required(review_index)
        and review_index.get("latest_research_review", {}).get("status") != "RESEARCH_APPROVED"
    ):
        raise ValueError("handoff manifest requires review-index RESEARCH_APPROVED")
    wq_final = author_qa_integrated(review_index) and author_qa_is_un_escalated(review_index)
    if wq_final:
        quality = review_index.get("latest_author_qa")
        if not isinstance(quality, dict) or quality.get("status") != "AUTHOR_QA_READY":
            raise ValueError("handoff manifest requires AUTHOR_QA_READY for an un-escalated WQ route")
        required = (
            "receipt_path", "receipt_sha256", "author_agent_id", "candidate_canonical_sha256",
            "canonical_sha256", "evidence_pack_sha256", "metadata_sha256",
            "visual_manifest_sha256", "visual_payload_sha256",
            "visual_payload_markdown_sha256", "article_package_sha256",
        )
        missing = [field for field in required if not isinstance(quality.get(field), str) or not quality[field].strip()]
        if missing:
            raise ValueError("AUTHOR_QA_READY must bind all final artifacts: " + ", ".join(missing))
        receipt = indexed_review_report_path(workspace, quality["receipt_path"], package.get("article_id"))
        if not receipt.is_file() or quality["receipt_sha256"] != sha256_file(receipt):
            raise ValueError("AUTHOR_QA_READY receipt_sha256 must match its existing receipt")
        if quality.get("open_finding_ids") != []:
            raise ValueError("AUTHOR_QA_READY requires zero open_finding_ids")
    else:
        quality = review_index.get("latest_full_review")
        if not isinstance(quality, dict) or quality.get("status") != "APPROVED":
            raise ValueError("handoff manifest requires review-index independent full R APPROVED")
        required = (
            "report_path", "report_sha256", "reviewer_agent_id", "canonical_sha256",
            "evidence_pack_sha256", "metadata_sha256", "visual_manifest_sha256",
            "visual_payload_sha256", "visual_payload_markdown_sha256",
            "article_package_sha256",
        )
        missing = [field for field in required if not isinstance(quality.get(field), str) or not quality[field].strip()]
        if missing:
            raise ValueError("final independent full review must bind all final artifacts: " + ", ".join(missing))
        report = indexed_review_report_path(workspace, quality["report_path"], package.get("article_id"))
        if not report.is_file() or quality["report_sha256"] != sha256_file(report):
            raise ValueError("final independent full review report_sha256 must match its existing report")
    sources = package.get("artifact_sources")
    visual_source = sources.get("visual_manifest") if isinstance(sources, dict) else None
    if not isinstance(visual_source, dict) or not isinstance(visual_source.get("path"), str):
        raise ValueError("article-package requires a visual_manifest artifact source")
    visual_manifest = workspace / visual_source["path"]
    if not visual_manifest.is_file() or visual_source.get("sha256") != sha256_file(visual_manifest):
        raise ValueError("article-package visual_manifest sha256 must match before handoff compilation")
    evidence_source = sources.get("evidence_pack") if isinstance(sources, dict) else None
    if not isinstance(evidence_source, dict) or not isinstance(evidence_source.get("path"), str):
        raise ValueError("article-package requires an evidence_pack artifact source")
    evidence_pack = workspace / evidence_source["path"]
    if not evidence_pack.is_file() or evidence_source.get("sha256") != sha256_file(evidence_pack):
        raise ValueError("article-package evidence_pack sha256 must match before handoff compilation")
    metadata_source = sources.get("metadata") if isinstance(sources, dict) else None
    if not isinstance(metadata_source, dict) or metadata_source.get("path") != "canonical/metadata.json":
        raise ValueError("current article-package requires canonical metadata source")
    if metadata_source.get("sha256") != sha256_file(metadata_path):
        raise ValueError("article-package metadata sha256 must match before handoff compilation")
    canonical_path = workspace / str(package.get("canonical_path", ""))
    if not canonical_path.is_file() or package.get("canonical_sha256") != sha256_file(canonical_path):
        raise ValueError("article-package canonical article sha256 must match before handoff compilation")
    expected = {
        "canonical_sha256": package["canonical_sha256"],
        "metadata_sha256": metadata_source["sha256"],
        "visual_manifest_sha256": visual_source["sha256"],
        "visual_payload_sha256": sha256_file(visual_payload),
        "visual_payload_markdown_sha256": sha256_file(visual_payload_markdown),
        "article_package_sha256": sha256_file(package_path),
    }
    expected["evidence_pack_sha256"] = evidence_source["sha256"]
    mismatches = [field for field, value in expected.items() if quality.get(field) != value]
    if not mismatches:
        return ("AUTHOR_QA_COVERS_FINAL_PAYLOAD", quality) if wq_final else ("FULL_REVIEW_COVERS_FINAL_PAYLOAD", quality)
    if wq_final:
        raise ValueError("AUTHOR_QA_READY no longer matches; rerun AUTHOR_QA or record a WR escalation")
    full = quality
    delta = review_index.get("last_delta")
    review_scope = delta.get("review_scope") if isinstance(delta, dict) else None
    if not isinstance(delta, dict) or review_scope not in {"R_DELTA", "R_VISUAL_DELTA"} or delta.get("status") != "APPROVED":
        raise ValueError("final full review no longer matches; an approved R_DELTA or R_VISUAL_DELTA is required")
    label = "final visual delta" if review_scope == "R_VISUAL_DELTA" else "final targeted delta"
    required_delta = (
        "report_path", "report_sha256", "reviewer_agent_id", "reviewed_canonical_sha256",
        "reviewed_metadata_sha256", "reviewed_visual_manifest_sha256",
        "reviewed_visual_payload_sha256", "reviewed_visual_payload_markdown_sha256",
        "reviewed_article_package_sha256",
    )
    missing_delta = [field for field in required_delta if not isinstance(delta.get(field), str) or not delta[field].strip()]
    if missing_delta:
        raise ValueError(f"approved {label} is missing: " + ", ".join(missing_delta))
    delta_report = indexed_review_report_path(workspace, delta["report_path"], package.get("article_id"))
    if not delta_report.is_file() or delta["report_sha256"] != sha256_file(delta_report):
        raise ValueError(f"{label} report_sha256 must match its existing report")
    delta_expected = {
        "reviewed_canonical_sha256": expected["canonical_sha256"],
        "reviewed_metadata_sha256": expected["metadata_sha256"],
        "reviewed_visual_manifest_sha256": expected["visual_manifest_sha256"],
        "reviewed_visual_payload_sha256": expected["visual_payload_sha256"],
        "reviewed_visual_payload_markdown_sha256": expected["visual_payload_markdown_sha256"],
        "reviewed_article_package_sha256": expected["article_package_sha256"],
    }
    for field, value in delta_expected.items():
        if delta.get(field) != value:
            raise ValueError(f"{label} {field} does not match the final artifact")
    if review_scope == "R_VISUAL_DELTA":
        # A visual-only delta may not silently re-approve a changed article,
        # metadata, or (on the standard route) research basis.
        for field in ("canonical_sha256", "metadata_sha256", "evidence_pack_sha256"):
            if field in expected and full.get(field) != expected[field]:
                raise ValueError(f"final visual delta cannot replace full-review {field}")
        return "POST_FULL_REVIEW_VISUAL_DELTA", delta
    if delta.get("full_review_required") is True:
        raise ValueError("final targeted delta may not replace a required full review")
    if delta.get("baseline_full_review_report_sha256") != full.get("report_sha256"):
        raise ValueError("final targeted delta must bind the approved full-review report hash")
    if "evidence_pack_sha256" in expected and delta.get("reviewed_evidence_pack_sha256") != expected["evidence_pack_sha256"]:
        raise ValueError("final targeted delta reviewed_evidence_pack_sha256 does not match the final artifact")
    return "POST_FULL_REVIEW_TARGETED_DELTA", delta


def require_approved_handoff_review(
    workspace: Path, package: dict, package_path: Path, metadata_path: Path, visual_payload: Path,
    visual_payload_markdown: Path,
) -> tuple[str, dict]:
    """Use the compact current proof chain while retaining schema-1.3 handoffs."""
    if package.get("schema_version") == "1.3":
        return "LEGACY_VISUAL_DELTA", require_approved_final_visual_delta(workspace, package, visual_payload)
    if package.get("schema_version") in {"1.4", CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA}:
        return require_approved_final_artifact_review(
            workspace, package, package_path, metadata_path, visual_payload, visual_payload_markdown,
        )
    raise ValueError("handoff manifest requires article-package schema_version 1.3, 1.4 or 1.5")


def build_handoff_manifest(
    *, workspace: Path, package_path: Path, package: dict, metadata_path: Path, output: Path,
    visual_payload: Path, visual_payload_markdown: Path, requirements_traceability: Path,
) -> None:
    """Produce one small receipt that points at the final human-release artifacts."""
    article_id = str(package.get("article_id", "")).strip()
    if not article_id:
        raise ValueError("article-package requires article_id to build a handoff manifest")
    artifact_sources = package.get("artifact_sources")
    if not isinstance(artifact_sources, dict):
        raise ValueError("article-package schema 1.3 requires artifact_sources before handoff compilation")
    visual_source = artifact_sources.get("visual_manifest")
    if not isinstance(visual_source, dict) or not isinstance(visual_source.get("path"), str):
        raise ValueError("article-package requires a visual_manifest artifact source")
    visual_manifest = workspace / visual_source["path"]
    visual_record = artifact_record(workspace, visual_manifest)
    if visual_source.get("sha256") != visual_record["sha256"]:
        raise ValueError("article-package visual_manifest sha256 must match the reviewed manifest before handoff compilation")
    review_mode, review = require_approved_handoff_review(
        workspace, package, package_path, metadata_path, visual_payload, visual_payload_markdown,
    )
    manifest = {
        "schema_version": "1.0",
        "article_id": article_id,
        "purpose": "DERIVED_HANDOFF_ARTIFACT_AND_HASH_INDEX",
        "visual_payload": artifact_record(workspace, visual_payload),
        "visual_payload_markdown": artifact_record(workspace, visual_payload_markdown),
        "article_package": artifact_record(workspace, package_path),
        "metadata": artifact_record(workspace, metadata_path),
        "visual_manifest": visual_record,
        "review_index": artifact_record(workspace, workspace / "reviews/review-index.json"),
        "gate_input": {
            "requirements_traceability_path": workspace_relative(workspace, requirements_traceability),
            "requirements_traceability_sha256": sha256_file(requirements_traceability),
            "gate_mode": "MANIFEST_HASH_AND_REQUIREMENTS_ONLY",
        },
    }
    if review_mode == "LEGACY_VISUAL_DELTA":
        manifest["final_visual_payload_delta"] = {
            field: review[field]
            for field in (
                "reviewer_result", "report_path", "report_sha256", "reviewer_agent_id",
                "review_index_sha256", "reviewed_visual_manifest_sha256", "reviewed_visual_payload_sha256",
            )
        }
    else:
        manifest["review_provenance"] = {
            "source": (
                "reviews/review-index.json#/latest_author_qa"
                if review_mode == "AUTHOR_QA_COVERS_FINAL_PAYLOAD"
                else "reviews/review-index.json#/latest_full_review"
                if review_mode == "FULL_REVIEW_COVERS_FINAL_PAYLOAD"
                else "reviews/review-index.json#/last_delta"
            ),
            "mode": review_mode,
        }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ensure_body_preserves_cta(body: str, cta: dict[str, str]) -> None:
    parser = CTAContentParser()
    parser.feed(body)
    parser.close()
    expected_anchor = normalize_text(cta["anchor_text"])
    expected_href = cta["product_destination_url"]
    if not any(href == expected_href and text == expected_anchor for href, text in parser.anchors):
        raise ValueError("canonical body must preserve the required CTA's exact visible anchor text and href")
    disclosure = cta["relationship_disclosure"]
    if disclosure != "NOT_APPLICABLE" and normalize_text(disclosure) not in normalize_text("".join(parser.body_text)):
        raise ValueError("canonical body must preserve the required CTA relationship disclosure")


CSS = """
body{margin:0;background:#fff;color:#222;font:16px/1.7 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
main{max-width:860px;margin:28px auto;padding:0 20px 48px}h1{font-size:32px;line-height:1.25;margin:0 0 28px}h2{font-size:24px;line-height:1.35;margin-top:34px}h3{font-size:19px;line-height:1.4;margin-top:24px}a{color:#0759b7;text-decoration:underline}.image-placeholder{border:1px dashed #888;background:#fafafa;padding:12px 14px;margin:22px 0;font-size:14px;color:#333}.image-placeholder strong{display:block;margin-bottom:5px}#seo-metadata{border-top:1px solid #ccc;margin-top:36px;padding-top:16px}#seo-metadata h2{margin:0 0 12px;font-size:20px}#seo-metadata p{margin:7px 0}
""".strip()
TEMPLATE_ASSET_SHA256 = hashlib.sha256(CSS.encode("utf-8")).hexdigest()


def image_zone_label(zone: str) -> str:
    return {"LEAD": "首图", "MIDDLE": "正文图", "CLOSING": "结尾图"}[zone]


def visible_text(fragment: str) -> str:
    parser = CTAContentParser()
    parser.feed(fragment)
    parser.close()
    return normalize_text("".join(parser.body_text))


def require_sha256(value: object, *, label: str) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", value):
        raise ValueError(f"{label} requires a final SHA-256")
    return value.casefold()


def asset_path(asset_root: Path, file_value: object, *, label: str) -> tuple[Path, str]:
    if not isinstance(file_value, str) or not file_value.strip():
        raise ValueError(f"{label} requires a non-empty file path")
    relative = Path(file_value.strip())
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError(f"{label} file must be a workspace-relative path")
    root = asset_root.resolve()
    resolved = (root / relative).resolve()
    if root not in resolved.parents:
        raise ValueError(f"{label} file must stay inside the article workspace")
    return resolved, str(relative)


def image_bytes_match_extension(path: Path, suffix: str) -> bool:
    header = path.read_bytes()[:12]
    if suffix == ".png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    return header.startswith(b"\xff\xd8\xff")


def normalize_image_items(items: object, *, asset_root: Path) -> list[dict]:
    """Validate one stable, directly transferable image record per body marker."""
    if not isinstance(items, list):
        raise ValueError("image manifest assets must contain a list")
    normalized: list[dict] = []
    for index, raw in enumerate(items, 1):
        label = f"image #{index}"
        if not isinstance(raw, dict):
            raise ValueError(f"{label} must be an object")
        if raw.get("ordinal") != index:
            raise ValueError(f"{label} ordinal must be the ordered value {index}")
        zone = str(raw.get("coverage_zone", "")).strip().upper()
        if zone not in IMAGE_ZONES:
            raise ValueError(f"{label} coverage_zone must be LEAD, MIDDLE or CLOSING")
        values = {
            field: str(raw.get(field, "")).strip()
            for field in ("alt", "caption", "placement_anchor", "adjacent_claim_id", "reader_job", "placement_reason")
        }
        missing = [field for field, value in values.items() if not value]
        if missing:
            raise ValueError(f"{label} is missing required " + ", ".join(missing))
        file_path, relative_file = asset_path(asset_root, raw.get("file"), label=label)
        suffix = file_path.suffix.casefold()
        if suffix not in IMAGE_FORMATS:
            raise ValueError(f"{label} must use PNG or JPG/JPEG, not {suffix or 'an extensionless file'}")
        expected_name = re.compile(rf"{index:02d}-{zone.casefold()}-[^/]+\.(?:png|jpe?g)$", re.IGNORECASE)
        if not expected_name.fullmatch(file_path.name):
            raise ValueError(
                f"{label} file must use {index:02d}-{zone.casefold()}-<slug>.png|jpg|jpeg naming"
            )
        if not file_path.is_file():
            raise ValueError(f"{label} image file is missing: {relative_file}")
        expected_sha256 = require_sha256(raw.get("sha256"), label=label)
        if sha256_file(file_path) != expected_sha256:
            raise ValueError(f"{label} sha256 does not match its image file")
        if not image_bytes_match_extension(file_path, suffix):
            raise ValueError(f"{label} image bytes do not match its {suffix} extension")
        normalized.append({
            **raw,
            "ordinal": index,
            "coverage_zone": zone,
            "file": relative_file,
            **values,
        })
    return normalized


def html_image_card(item: dict) -> str:
    ordinal = item["ordinal"]
    zone = item["coverage_zone"]
    return (
        '<aside class="image-placeholder" data-coverage-zone="{zone}" '
        'data-image-ordinal="{ordinal:02d}" data-image-file="{file}">'
        '<strong>【图片 {ordinal:02d}｜{zone_label}｜在此处插入】</strong>'
        '<div>文件：{file}</div><div>覆盖区：{zone}</div><div>定位：{anchor}</div>'
        '<div>Alt：{alt}</div><div>图注：{caption}</div>'
        '<div>相邻内容：{reader_job}</div></aside>'
    ).format(
        ordinal=ordinal,
        zone=html.escape(zone),
        zone_label=image_zone_label(zone),
        file=html.escape(item["file"]),
        anchor=html.escape(item["placement_anchor"]),
        alt=html.escape(item["alt"]),
        caption=html.escape(item["caption"]),
        reader_job=html.escape(item["reader_job"]),
    )


def markdown_image_card(item: dict) -> str:
    return "\n".join((
        f"> 【图片 {item['ordinal']:02d}｜{image_zone_label(item['coverage_zone'])}｜在此处插入】",
        ">",
        f"> 文件：{item['file']}",
        f"> 覆盖区：{item['coverage_zone']}",
        f"> 定位：{item['placement_anchor']}",
        f"> Alt：{item['alt']}",
        f"> 图注：{item['caption']}",
        f"> 相邻内容：{item['reader_job']}",
    ))


def replace_image_markers(body: str, items: list[dict], render_card) -> str:
    """Replace one explicit body marker per asset without moving it elsewhere."""
    if LEGACY_IMAGE_MARKER in body:
        raise ValueError(f"canonical body must use one {IMAGE_MARKER_RE.pattern} marker per image, not {LEGACY_IMAGE_MARKER}")
    matches = list(IMAGE_MARKER_RE.finditer(body))
    expected_ordinals = list(range(1, len(items) + 1))
    observed_ordinals = [int(match.group(1)) for match in matches]
    if observed_ordinals != expected_ordinals:
        raise ValueError(
            "canonical body must contain each image marker exactly once, in manifest order: "
            + ", ".join(f"{ordinal:02d}" for ordinal in expected_ordinals)
        )
    by_ordinal = {item["ordinal"]: item for item in items}
    for match in matches:
        item = by_ordinal[int(match.group(1))]
        before = visible_text(body[:match.start()]).casefold()
        if normalize_text(item["placement_anchor"]).casefold() not in before:
            raise ValueError(
                f"image #{item['ordinal']} placement_anchor must occur before its body marker"
            )

    def replacement(match: re.Match[str]) -> str:
        return render_card(by_ordinal[int(match.group(1))])

    return IMAGE_MARKER_RE.sub(replacement, body)


class FragmentMarkdownRenderer(HTMLParser):
    """Small deterministic renderer for the supported canonical body fragment."""

    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self.list_stack: list[tuple[str, int]] = []
        self._anchor_href: str | None = None

    def blank_line(self) -> None:
        if self.parts and not "".join(self.parts).endswith("\n\n"):
            self.parts.append("\n\n")

    def handle_starttag(self, tag, attrs):
        tag = tag.casefold()
        data = dict(attrs)
        if tag in {"p", "blockquote"}:
            self.blank_line()
            if tag == "blockquote":
                self.parts.append("> ")
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.blank_line()
            self.parts.append("#" * int(tag[1]) + " ")
        elif tag in {"ul", "ol"}:
            self.blank_line()
            self.list_stack.append((tag, 0))
        elif tag == "li":
            if self.parts and not "".join(self.parts).endswith("\n"):
                self.parts.append("\n")
            indent = "  " * max(0, len(self.list_stack) - 1)
            if self.list_stack and self.list_stack[-1][0] == "ol":
                kind, count = self.list_stack[-1]
                count += 1
                self.list_stack[-1] = (kind, count)
                self.parts.append(f"{indent}{count}. ")
            else:
                self.parts.append(f"{indent}- ")
        elif tag == "a":
            self._anchor_href = data.get("href", "").strip()
            self.parts.append("[")
        elif tag in {"strong", "b"}:
            self.parts.append("**")
        elif tag in {"em", "i"}:
            self.parts.append("*")
        elif tag == "code":
            self.parts.append("`")
        elif tag == "br":
            self.parts.append("\n")

    def handle_endtag(self, tag):
        tag = tag.casefold()
        if tag in {"p", "blockquote", "li", "h1", "h2", "h3", "h4", "h5", "h6"}:
            self.blank_line()
        elif tag in {"ul", "ol"}:
            if self.list_stack:
                self.list_stack.pop()
            self.blank_line()
        elif tag == "a":
            self.parts.append(f"]({self._anchor_href})" if self._anchor_href else "]")
            self._anchor_href = None
        elif tag in {"strong", "b"}:
            self.parts.append("**")
        elif tag in {"em", "i"}:
            self.parts.append("*")
        elif tag == "code":
            self.parts.append("`")

    def handle_data(self, data):
        self.parts.append(data)

    def handle_comment(self, data):
        marker = f"<!--{data}-->"
        if IMAGE_MARKER_RE.fullmatch(marker):
            self.blank_line()
            self.parts.append(marker)
            self.blank_line()

    def render(self) -> str:
        return "".join(self.parts).strip() + "\n"


def body_markdown(body: str, items: list[dict]) -> str:
    renderer = FragmentMarkdownRenderer()
    renderer.feed(body)
    renderer.close()
    return replace_image_markers(renderer.render(), items, markdown_image_card)


def read_visual_manifest(path: Path, *, asset_root: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("assets"), list):
        raise ValueError("visual-manifest must contain an assets list")
    if any(not isinstance(item, dict) for item in data["assets"]):
        raise ValueError("visual-manifest assets must contain objects")
    return normalize_image_items(data["assets"], asset_root=asset_root)


def read_images_json(path: Path | None) -> list[dict]:
    if path is None:
        return []
    items = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(items, list) or any(not isinstance(item, dict) for item in items):
        raise ValueError("images-json must contain a list of image objects")
    return normalize_image_items(items, asset_root=path.parent)


def read_metadata(path: Path) -> tuple[str | None, str, str, str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("metadata-json must contain an object")
    seo_title = str(data.get("seo_title", "")).strip()
    description = str(data.get("description", data.get("meta_description", ""))).strip()
    raw_tags = data.get("tags", [])
    if isinstance(raw_tags, list):
        tags = ", ".join(str(tag).strip() for tag in raw_tags if str(tag).strip())
    else:
        tags = str(raw_tags).strip()
    title = str(data.get("platform_title", data.get("canonical_title", data.get("title", "")))).strip() or None
    if not seo_title or not tags or not description:
        raise ValueError("metadata-json requires non-empty seo_title, tags and description")
    return title, seo_title, tags, description


def render_payload_pair(
    *, title: str, body: str, image_items: list[dict], metadata_path: Path,
    title_transfer_mode: str,
) -> tuple[str, str]:
    """Render the HTML primary and Markdown companion from the same inputs.

    Kept as a public pure function so the validator can rebuild both outputs
    rather than asking a language reviewer to compare duplicate projections.
    """
    body_with_cards = replace_image_markers(body, image_items, html_image_card)
    markdown_with_cards = body_markdown(body, image_items)
    _metadata_title, seo_title, tags, description = read_metadata(metadata_path)
    rendered = """<!doctype html><html lang=\"zh-CN\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>{title}</title><style>{css}</style><main data-template-id=\"{template_id}\" data-template-version=\"{template_version}\" data-template-assets-sha256=\"{template_assets_sha256}\"><!-- {template_id}@{template_version}: compiler-generated minimal template --><h1 id=\"blog-title\">{title}</h1><article id=\"article-body\" data-title-transfer-mode=\"{mode}\">{body}</article><section id=\"seo-metadata\"><h2>SEO Metadata</h2><p id=\"seo-title\"><strong>SEO title：</strong>{seo_title}</p><p id=\"seo-tags\"><strong>Tags：</strong>{tags}</p><p id=\"seo-description\"><strong>Description：</strong>{description}</p></section></main></html>""".format(
        title=html.escape(title), css=CSS, template_id=TEMPLATE_ID,
        template_version=TEMPLATE_VERSION, template_assets_sha256=TEMPLATE_ASSET_SHA256,
        mode=title_transfer_mode, body=body_with_cards, seo_title=html.escape(seo_title),
        tags=html.escape(tags), description=html.escape(description),
    )
    rendered_markdown = """<!-- {template_id}@{template_version}: compiler-generated Markdown companion -->

# {title}

{body}

## SEO Metadata

- SEO title：{seo_title}
- Tags：{tags}
- Description：{description}
""".format(
        template_id=TEMPLATE_ID, template_version=TEMPLATE_VERSION,
        title=title.strip(), body=markdown_with_cards.strip(), seo_title=seo_title,
        tags=tags, description=description,
    )
    return rendered, rendered_markdown


def require_current_package_sources(
    package: dict, package_path: Path, body_path: Path, metadata_path: Path,
    visual_manifest_path: Path | None,
) -> None:
    """Keep current compilation on its declared one-way input chain."""
    if package.get("schema_version") not in {"1.4", CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA}:
        return
    if visual_manifest_path is None:
        raise ValueError("current article-package requires --visual-manifest")
    if package.get("schema_version") == CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA:
        inputs = current_single_source_inputs(package, package_path)
        if body_path.resolve() != inputs["canonical"]:
            raise ValueError("--body-html must match the article-package canonical article source")
        if metadata_path.resolve() != inputs["metadata"]:
            raise ValueError("--metadata-json must match the article-package metadata source")
        if visual_manifest_path.resolve() != inputs["visual_manifest"]:
            raise ValueError("--visual-manifest must match the article-package visual_manifest source")
        return
    sources = package.get("artifact_sources")
    if not isinstance(sources, dict):
        raise ValueError("article-package schema 1.4+ requires artifact_sources")
    root = package_path.resolve().parent
    for key, path in (("metadata", metadata_path), ("visual_manifest", visual_manifest_path)):
        source = sources.get(key)
        if not isinstance(source, dict) or not isinstance(source.get("path"), str):
            raise ValueError(f"article-package schema 1.4+ requires {key} source")
        expected = (root / source["path"]).resolve()
        if expected != path.resolve():
            raise ValueError(f"--{key.replace('_', '-')} must match the article-package source")
        if source.get("sha256") != sha256_file(path):
            raise ValueError(f"article-package {key} sha256 must match the supplied file")


def require_handoff_preserves_reviewed_payload(
    output: Path, markdown_output: Path, manifest_output: Path,
    rendered: str, rendered_markdown: str,
) -> None:
    """Prevent manifest finalization from silently changing either R-bound payload.

    W compiles a candidate payload before R.  A post-review invocation that
    creates only the derived handoff manifest may repeat the deterministic
    compilation, but must be byte-identical to that already reviewed file.
    If inputs changed, W must compile without a manifest, obtain the
    appropriate same-R delta/full review, and only then finalize the manifest.
    """
    if output.resolve() == manifest_output.resolve() or markdown_output.resolve() == manifest_output.resolve():
        raise ValueError("--handoff-manifest-output must not share a visual payload path")
    if output.is_file() and manifest_output.exists() and output.samefile(manifest_output):
        raise ValueError("--handoff-manifest-output must not alias the visual payload file")
    if markdown_output.is_file() and manifest_output.exists() and markdown_output.samefile(manifest_output):
        raise ValueError("--handoff-manifest-output must not alias the Markdown payload file")
    if not output.is_file() or not markdown_output.is_file():
        raise ValueError(
            "--handoff-manifest-output requires existing reviewed HTML and Markdown payloads; "
            "compile it before R instead"
        )
    if output.read_bytes() != rendered.encode("utf-8"):
        raise ValueError(
            "--handoff-manifest-output must not rewrite the reviewed visual payload; "
            "compile the changed payload before the appropriate R review or R-Delta"
        )
    if markdown_output.read_bytes() != rendered_markdown.encode("utf-8"):
        raise ValueError(
            "--handoff-manifest-output must not rewrite the reviewed Markdown payload; "
            "compile the changed payload before the appropriate R review or R-Delta"
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--title", required=True)
    parser.add_argument("--body-html", type=Path, required=True)
    parser.add_argument("--article-package", type=Path, required=True)
    parser.add_argument("--metadata-json", type=Path, required=True)
    parser.add_argument("--visual-manifest", type=Path, help="Required for current schema-1.5 packages; the only image-card source.")
    parser.add_argument("--images-json", type=Path, help="Legacy schema-1.2/1.3 compatibility input.")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--markdown-output", type=Path,
        help="Companion Markdown output. Defaults beside --output as visual-payload.md.",
    )
    parser.add_argument("--handoff-manifest-output", type=Path)
    parser.add_argument("--workspace", type=Path, help="Required only when generating --handoff-manifest-output.")
    parser.add_argument("--requirements-traceability", type=Path, help="Required only when generating --handoff-manifest-output.")
    parser.add_argument(
        "--title-transfer-mode", "--heading-transport",
        dest="title_transfer_mode",
        choices=["SEPARATE_TITLE_FIELD", "TITLE_IN_BODY", "BODY_H1_REQUIRED"],
        default="SEPARATE_TITLE_FIELD",
        help="Local title/body selection aid; it does not assert the public page's heading markup.",
    )
    args = parser.parse_args()

    title_transfer_mode = "TITLE_IN_BODY" if args.title_transfer_mode == "BODY_H1_REQUIRED" else args.title_transfer_mode
    markdown_output = args.markdown_output or args.output.with_suffix(".md")
    package = read_article_package(args.article_package)
    cta = required_cta_from_package(args.article_package)
    require_current_package_sources(
        package, args.article_package, args.body_html, args.metadata_json, args.visual_manifest,
    )
    body = read_body_fragment(args.body_html)
    ensure_body_preserves_cta(body, cta)
    if package.get("schema_version") in {"1.4", CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA}:
        if args.images_json is not None:
            raise ValueError("current article-package must not use --images-json; use --visual-manifest")
        image_items = read_visual_manifest(args.visual_manifest, asset_root=args.article_package.resolve().parent)
    else:
        image_items = read_images_json(args.images_json)
    metadata_title, seo_title, tags, description = read_metadata(args.metadata_json)
    if package.get("schema_version") in {"1.4", CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA}:
        if metadata_title is None:
            raise ValueError("metadata-json requires platform_title or canonical_title for the current article-package")
        if normalize_text(args.title) != normalize_text(metadata_title):
            raise ValueError("--title must match canonical metadata platform_title for the current article-package")
    if package.get("schema_version") == CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA:
        declared_mode = package.get("title_transfer_mode")
        if declared_mode not in {"SEPARATE_TITLE_FIELD", "TITLE_IN_BODY"}:
            raise ValueError("article-package schema 1.5 title_transfer_mode is invalid")
        if title_transfer_mode != declared_mode:
            raise ValueError("--title-transfer-mode must match article-package title_transfer_mode")
    rendered, rendered_markdown = render_payload_pair(
        title=args.title.strip(), body=body, image_items=image_items,
        metadata_path=args.metadata_json, title_transfer_mode=title_transfer_mode,
    )
    if args.handoff_manifest_output is not None:
        if args.workspace is None or args.requirements_traceability is None:
            raise ValueError("--handoff-manifest-output requires --workspace and --requirements-traceability")
        if package.get("schema_version") not in {"1.3", "1.4", CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA}:
            raise ValueError("--handoff-manifest-output requires article-package schema_version 1.3, 1.4 or 1.5")
        require_handoff_preserves_reviewed_payload(
            args.output, markdown_output, args.handoff_manifest_output,
            rendered, rendered_markdown,
        )
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
        markdown_output.parent.mkdir(parents=True, exist_ok=True)
        markdown_output.write_text(rendered_markdown, encoding="utf-8")
    if args.handoff_manifest_output is not None:
        build_handoff_manifest(
            workspace=args.workspace,
            package_path=args.article_package,
            package=package,
            metadata_path=args.metadata_json,
            output=args.handoff_manifest_output,
            visual_payload=args.output,
            visual_payload_markdown=markdown_output,
            requirements_traceability=args.requirements_traceability,
        )
    if args.handoff_manifest_output is None:
        print(f"BUILT: {args.output}")
        print(f"MARKDOWN_BUILT: {markdown_output}")
    else:
        print(f"PAYLOAD_VERIFIED_UNCHANGED: {args.output}")
        print(f"MARKDOWN_VERIFIED_UNCHANGED: {markdown_output}")
        print(f"HANDOFF_MANIFEST_BUILT: {args.handoff_manifest_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
