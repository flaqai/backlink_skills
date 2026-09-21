#!/usr/bin/env python3
"""Validate packaging invariants of the minimal visual payload."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
from html.parser import HTMLParser
from pathlib import Path

TEMPLATE_ID = "BLOG_3P_VISUAL_PAYLOAD"
TEMPLATE_VERSION = "3"
TEMPLATE_ASSET_SHA256 = "e03ef4a8af8fd911c47fe9a3ee7983eddd36c628a7eb334bf7b60cc5ac22b8c6"
EXPECTED_ORDER = ["blog-title", "article-body", "seo-metadata", "seo-title", "seo-tags", "seo-description"]
CTA_FIELDS = ("anchor_text", "product_name", "product_destination_url", "product_evidence_path", "reader_task_relevance", "relationship_disclosure")
IMAGE_FORMATS = {".png", ".jpg", ".jpeg"}
IMAGE_ZONES = {"LEAD", "MIDDLE", "CLOSING"}
CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA = "1.5"
COMPILER_PATH = Path(__file__).with_name("build_visual_payload.py")
COMPILER_SPEC = importlib.util.spec_from_file_location("blog_3p_visual_payload_compiler", COMPILER_PATH)
assert COMPILER_SPEC is not None and COMPILER_SPEC.loader is not None
COMPILER = importlib.util.module_from_spec(COMPILER_SPEC)
COMPILER_SPEC.loader.exec_module(COMPILER)


def normalize_text(value: str) -> str:
    return " ".join(value.split())


def read_article_package(path: Path) -> dict:
    try:
        package = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"article-package must be valid JSON: {exc}") from exc
    if not isinstance(package, dict) or package.get("schema_version") not in {"1.2", "1.3", "1.4", "1.5"}:
        raise ValueError("article-package must use schema_version 1.2, 1.3, 1.4 or 1.5")
    return package


def required_cta_from_package(package: dict) -> dict[str, str]:
    cta = package.get("cta")
    if not isinstance(cta, dict) or cta.get("mode") != "SECONDARY_RECOMMENDATION":
        raise ValueError("article-package must declare a required SECONDARY_RECOMMENDATION CTA")
    missing = [field for field in CTA_FIELDS if not isinstance(cta.get(field), str) or not cta[field].strip()]
    if missing:
        raise ValueError("article-package required CTA is missing: " + ", ".join(missing))
    return {field: cta[field].strip() for field in CTA_FIELDS}


class VisibleTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data):
        self.parts.append(data)


def visible_html_text(source: str) -> str:
    parser = VisibleTextParser()
    parser.feed(source)
    parser.close()
    return normalize_text("".join(parser.parts))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_bytes_match_extension(path: Path, suffix: str) -> bool:
    header = path.read_bytes()[:12]
    if suffix == ".png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    return header.startswith(b"\xff\xd8\xff")


def current_visual_assets(package: dict, package_path: Path) -> list[dict] | None:
    """Load and verify the source-of-truth image manifest for current packages.

    The compiler is the only writer of the fixed cards, but review-ready
    validation also needs to detect any post-compile hand edit of a card.
    Historical packages keep their narrow compatibility path.
    """
    if package.get("schema_version") not in {"1.4", CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA}:
        return None
    sources = package.get("artifact_sources")
    source = sources.get("visual_manifest") if isinstance(sources, dict) else None
    if not isinstance(source, dict) or not isinstance(source.get("path"), str):
        raise ValueError("current article-package requires a visual_manifest artifact source")
    relative_manifest = Path(source["path"])
    root = package_path.resolve().parent
    if relative_manifest.is_absolute() or ".." in relative_manifest.parts:
        raise ValueError("visual_manifest path must be workspace-relative")
    manifest_path = (root / relative_manifest).resolve()
    if root not in manifest_path.parents or not manifest_path.is_file():
        raise ValueError("visual_manifest must exist inside the article workspace")
    if source.get("sha256") != sha256_file(manifest_path):
        raise ValueError("visual_manifest sha256 must match the article-package")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"visual_manifest must be valid JSON: {exc}") from exc
    assets = manifest.get("assets") if isinstance(manifest, dict) else None
    if not isinstance(assets, list):
        raise ValueError("visual_manifest must contain an assets list")
    normalized: list[dict] = []
    for index, raw in enumerate(assets, 1):
        label = f"visual_manifest asset {index:02d}"
        if not isinstance(raw, dict) or raw.get("ordinal") != index:
            raise ValueError(f"{label} must have ordinal {index}")
        zone = str(raw.get("coverage_zone", "")).strip().upper()
        if zone not in IMAGE_ZONES:
            raise ValueError(f"{label} must use LEAD, MIDDLE or CLOSING")
        file_value = raw.get("file")
        if not isinstance(file_value, str) or not file_value.strip():
            raise ValueError(f"{label} requires a workspace-relative file")
        relative_file = Path(file_value.strip())
        if relative_file.is_absolute() or ".." in relative_file.parts:
            raise ValueError(f"{label} file must be workspace-relative")
        image_path = (root / relative_file).resolve()
        suffix = image_path.suffix.casefold()
        if suffix not in IMAGE_FORMATS:
            raise ValueError(f"{label} must use PNG or JPG/JPEG")
        expected_name = rf"{index:02d}-{zone.casefold()}-[^/]+\.(?:png|jpe?g)"
        if not re.fullmatch(expected_name, image_path.name, re.IGNORECASE):
            raise ValueError(f"{label} must use stable numbered lead/middle/closing naming")
        if root not in image_path.parents or not image_path.is_file():
            raise ValueError(f"{label} image file is missing")
        expected_sha256 = raw.get("sha256")
        if not isinstance(expected_sha256, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", expected_sha256):
            raise ValueError(f"{label} requires a final SHA-256")
        if sha256_file(image_path) != expected_sha256.casefold():
            raise ValueError(f"{label} sha256 does not match its image file")
        if not image_bytes_match_extension(image_path, suffix):
            raise ValueError(f"{label} image bytes do not match its extension")
        values = {
            field: str(raw.get(field, "")).strip()
            for field in ("alt", "caption", "placement_anchor")
        }
        missing = [field for field, value in values.items() if not value]
        if missing:
            raise ValueError(f"{label} is missing " + ", ".join(missing))
        normalized.append({
            "ordinal": f"{index:02d}", "coverage_zone": zone,
            "file": str(relative_file), **values,
        })
    return normalized


def compiler_projection_errors(
    *, package: dict, package_path: Path, payload: str, markdown_payload: str,
    title_transfer_mode: str,
) -> tuple[list[str], str]:
    """Rebuild the current paired payload from package-declared source files.

    A byte-identical rebuild establishes that Markdown is a compiler-derived
    fallback rather than a second independently authored document.  Legacy
    packages remain explicitly conservative: the reviewer must read both
    projections because their body input is not package-bound.
    """
    if package.get("schema_version") != CURRENT_SINGLE_SOURCE_PACKAGE_SCHEMA:
        return [], "COMPANION_DUAL_READ_REQUIRED"
    try:
        declared_mode = package.get("title_transfer_mode")
        normalized_mode = "TITLE_IN_BODY" if title_transfer_mode == "BODY_H1_REQUIRED" else title_transfer_mode
        if declared_mode not in {"SEPARATE_TITLE_FIELD", "TITLE_IN_BODY"}:
            raise ValueError("article-package schema 1.5 title_transfer_mode is invalid")
        if normalized_mode != declared_mode:
            raise ValueError("title_transfer_mode must match article-package title_transfer_mode")
        inputs = COMPILER.current_single_source_inputs(package, package_path)
        body = COMPILER.read_body_fragment(inputs["canonical"])
        cta = COMPILER.required_cta_from_package(package_path)
        COMPILER.ensure_body_preserves_cta(body, cta)
        image_items = COMPILER.read_visual_manifest(
            inputs["visual_manifest"], asset_root=package_path.resolve().parent,
        )
        metadata_title, _seo_title, _tags, _description = COMPILER.read_metadata(inputs["metadata"])
        if metadata_title is None:
            raise ValueError("metadata-json requires platform_title or canonical_title for the current article-package")
        expected_html, expected_markdown = COMPILER.render_payload_pair(
            title=metadata_title, body=body, image_items=image_items,
            metadata_path=inputs["metadata"], title_transfer_mode=normalized_mode,
        )
    except ValueError as exc:
        return [str(exc)], "COMPANION_DUAL_READ_REQUIRED"
    errors: list[str] = []
    if payload != expected_html:
        errors.append("HTML payload does not match current compiler output")
    if markdown_payload != expected_markdown:
        errors.append("Markdown payload does not match current compiler output")
    return errors, "COMPILER_VERIFIED_MATCH" if not errors else "COMPANION_DUAL_READ_REQUIRED"


class PayloadParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_body = 0
        self.template = False
        self.template_assets = ""
        self.ids = []
        self.bad_links = []
        self.cards = 0
        self.coverage_zones = []
        self.card_ordinals = []
        self.card_files = []
        self.card_alt_texts = []
        self._current_card_text = None
        self.body_text = []
        self.anchors = []
        self._anchor_href = None
        self._anchor_text = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "main" and data.get("data-template-id") == TEMPLATE_ID and data.get("data-template-version") == TEMPLATE_VERSION:
            self.template = True
            self.template_assets = data.get("data-template-assets-sha256", "")
        if data.get("id"):
            self.ids.append(data["id"])
        if data.get("id") == "article-body":
            self.in_body = 1
        elif self.in_body:
            self.in_body += 1
        if self.in_body and tag == "a" and not data.get("href", "").strip():
            self.bad_links.append("empty href")
        if self.in_body and tag == "a":
            self._anchor_href = data.get("href", "").strip()
            self._anchor_text = []
        if self.in_body and "image-placeholder" in data.get("class", "").split():
            self.cards += 1
            self.coverage_zones.append(data.get("data-coverage-zone", "UNSPECIFIED").upper())
            self.card_ordinals.append(data.get("data-image-ordinal", ""))
            self.card_files.append(data.get("data-image-file", ""))
            self._current_card_text = []

    def handle_data(self, data):
        if self.in_body:
            self.body_text.append(data)
        if self._anchor_href is not None:
            self._anchor_text.append(data)
        if self._current_card_text is not None:
            self._current_card_text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._anchor_href is not None:
            self.anchors.append((self._anchor_href, normalize_text("".join(self._anchor_text))))
            self._anchor_href = None
            self._anchor_text = []
        if tag == "aside" and self._current_card_text is not None:
            self.card_alt_texts.append("".join(self._current_card_text))
            self._current_card_text = None
        if self.in_body:
            self.in_body -= 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--payload", type=Path, required=True)
    parser.add_argument("--markdown-payload", type=Path, required=True)
    parser.add_argument("--article-package", type=Path, required=True)
    parser.add_argument(
        "--title-transfer-mode", "--heading-transport", "--mode",
        dest="title_transfer_mode",
        choices=["SEPARATE_TITLE_FIELD", "TITLE_IN_BODY", "BODY_H1_REQUIRED"],
        default="SEPARATE_TITLE_FIELD",
        help="Local copy-selection metadata only; not evidence of public heading hierarchy.",
    )
    parser.add_argument("--required-coverage-zones", default="")
    parser.add_argument("--minimum-image-cards", type=int, default=0)
    args = parser.parse_args()
    source = args.payload.read_text(encoding="utf-8")
    markdown_source = args.markdown_payload.read_text(encoding="utf-8")
    try:
        package = read_article_package(args.article_package)
        cta = required_cta_from_package(package)
        manifest_assets = current_visual_assets(package, args.article_package)
    except ValueError as exc:
        print("PAYLOAD_INVALID\n" + str(exc))
        return 1
    parsed = PayloadParser()
    parsed.feed(source)
    parsed.close()
    errors = []
    if not parsed.template:
        errors.append(f"payload must use fixed template {TEMPLATE_ID}@{TEMPLATE_VERSION}")
    if parsed.template_assets != TEMPLATE_ASSET_SHA256:
        errors.append("fixed-template asset signature is missing or invalid")
    if f"{TEMPLATE_ID}@{TEMPLATE_VERSION}: compiler-generated minimal template" not in source:
        errors.append("missing fixed-template compiler signature")
    style = re.search(r"<style>(.*?)</style>", source, re.DOTALL)
    if not style or hashlib.sha256(style.group(1).encode("utf-8")).hexdigest() != TEMPLATE_ASSET_SHA256:
        errors.append("fixed-template CSS was modified")
    if re.search(r"<script\b|<button\b", source, re.IGNORECASE):
        errors.append("minimal visual payload must not contain scripts or copy buttons")
    if "{{IMAGE_CARDS}}" in source or "BLOG_3P_IMAGE:" in source:
        errors.append("visual payload must not retain an unresolved image marker")
    positions = [parsed.ids.index(value) if value in parsed.ids else -1 for value in EXPECTED_ORDER]
    if positions != sorted(positions) or -1 in positions:
        errors.append("payload must follow title, body, SEO title, tags and description order")
    # Local markup is an authoring and copy-selection aid only. Platform paste
    # behavior varies, so it cannot establish or fail public heading hierarchy.
    errors.extend(parsed.bad_links)
    expected_anchor = normalize_text(cta["anchor_text"])
    expected_href = cta["product_destination_url"]
    if not any(href == expected_href and text == expected_anchor for href, text in parsed.anchors):
        errors.append("payload must preserve the required CTA's exact visible anchor text and href")
    disclosure = cta["relationship_disclosure"]
    if disclosure != "NOT_APPLICABLE" and normalize_text(disclosure) not in normalize_text("".join(parsed.body_text)):
        errors.append("payload must preserve the required CTA relationship disclosure")
    required_zones = [zone.strip().upper() for zone in args.required_coverage_zones.split(",") if zone.strip()]
    missing_zones = [zone for zone in required_zones if zone not in parsed.coverage_zones]
    if missing_zones:
        errors.append("missing image-placeholder coverage zones: " + ",".join(missing_zones))
    if parsed.cards < args.minimum_image_cards:
        errors.append(f"minimum image placeholders is {args.minimum_image_cards}, found {parsed.cards}")
    if len(parsed.card_alt_texts) != parsed.cards or any("Alt：" not in text and "Alt:" not in text for text in parsed.card_alt_texts):
        errors.append("every image placeholder needs visible Alt text")
    expected_ordinals = [f"{index:02d}" for index in range(1, parsed.cards + 1)]
    if parsed.card_ordinals != expected_ordinals:
        errors.append("image placeholders must use stable ordered 01, 02, 03 ordinals")
    for ordinal, zone, filename, card_text in zip(
        parsed.card_ordinals, parsed.coverage_zones, parsed.card_files, parsed.card_alt_texts,
    ):
        if not re.fullmatch(rf"{re.escape(ordinal)}-{zone.casefold()}-[^/]+\.(?:png|jpe?g)", Path(filename).name, re.IGNORECASE):
            errors.append(f"image placeholder {ordinal or '?'} has an invalid PNG/JPG filename")
        if "文件：" not in card_text or "定位：" not in card_text or "图注：" not in card_text:
            errors.append(f"image placeholder {ordinal or '?'} lacks a complete transfer annotation")
    markdown_signature = f"<!-- {TEMPLATE_ID}@{TEMPLATE_VERSION}: compiler-generated Markdown companion -->"
    if markdown_signature not in markdown_source:
        errors.append("Markdown payload is missing the compiler signature")
    expected_markdown_cta = f"[{cta['anchor_text']}]({cta['product_destination_url']})"
    if expected_markdown_cta not in markdown_source:
        errors.append("Markdown payload must preserve the required CTA's exact visible anchor text and href")
    if disclosure != "NOT_APPLICABLE" and normalize_text(disclosure) not in normalize_text(markdown_source):
        errors.append("Markdown payload must preserve the required CTA relationship disclosure")
    markdown_ordinals = re.findall(r"(?m)^> 【图片 (\d{2})｜(?:首图|正文图|结尾图)｜在此处插入】$", markdown_source)
    if markdown_ordinals != expected_ordinals:
        errors.append("Markdown payload image cards do not match the HTML payload order")
    if "{{IMAGE_CARDS}}" in markdown_source or "BLOG_3P_IMAGE:" in markdown_source:
        errors.append("Markdown payload must not retain an unresolved image marker")
    if "## SEO Metadata" not in markdown_source:
        errors.append("Markdown payload must include the SEO metadata section")
    for ordinal in expected_ordinals:
        card_match = re.search(
            rf"(?ms)^> 【图片 {ordinal}｜.*?^> 相邻内容：.*?(?=^> 【图片|^## SEO Metadata|\Z)", markdown_source,
        )
        if card_match is None or "> Alt：" not in card_match.group(0):
            errors.append(f"Markdown payload image card {ordinal} lacks visible Alt text")
    if manifest_assets is not None:
        expected_manifest_ordinals = [asset["ordinal"] for asset in manifest_assets]
        if parsed.card_ordinals != expected_manifest_ordinals:
            errors.append("HTML image cards do not match the visual manifest ordinals")
        if parsed.coverage_zones != [asset["coverage_zone"] for asset in manifest_assets]:
            errors.append("HTML image-card coverage zones do not match the visual manifest")
        if parsed.card_files != [asset["file"] for asset in manifest_assets]:
            errors.append("HTML image-card files do not match the visual manifest")
        for asset, card_text in zip(manifest_assets, parsed.card_alt_texts):
            ordinal = asset["ordinal"]
            for label, value in (
                ("文件", asset["file"]),
                ("定位", asset["placement_anchor"]),
                ("Alt", asset["alt"]),
                ("图注", asset["caption"]),
            ):
                if f"{label}：{value}" not in card_text:
                    errors.append(f"HTML image card {ordinal} {label} does not match the visual manifest")
            card_start = source.find(f'data-image-ordinal="{ordinal}"')
            if card_start < 0 or normalize_text(asset["placement_anchor"]).casefold() not in visible_html_text(source[:card_start]).casefold():
                errors.append(f"HTML image card {ordinal} is not after its visual-manifest placement anchor")
            markdown_start = markdown_source.find(f"> 【图片 {ordinal}｜")
            card_match = re.search(
                rf"(?ms)^> 【图片 {ordinal}｜.*?^> 相邻内容：.*?(?=^> 【图片|^## SEO Metadata|\Z)", markdown_source,
            )
            if markdown_start < 0 or card_match is None:
                errors.append(f"Markdown image card {ordinal} is missing")
                continue
            markdown_card = card_match.group(0)
            for label, value in (
                ("文件", asset["file"]),
                ("定位", asset["placement_anchor"]),
                ("Alt", asset["alt"]),
                ("图注", asset["caption"]),
            ):
                if f"> {label}：{value}" not in markdown_card:
                    errors.append(f"Markdown image card {ordinal} {label} does not match the visual manifest")
            if normalize_text(asset["placement_anchor"]).casefold() not in normalize_text(markdown_source[:markdown_start]).casefold():
                errors.append(f"Markdown image card {ordinal} is not after its visual-manifest placement anchor")
    projection_errors, companion_status = compiler_projection_errors(
        package=package, package_path=args.article_package, payload=source,
        markdown_payload=markdown_source, title_transfer_mode=args.title_transfer_mode,
    )
    errors.extend(projection_errors)
    if errors:
        print("PAYLOAD_INVALID\n" + "\n".join(errors))
        return 1
    print(
        "PAYLOAD_VALID"
        + "\ntitle_transfer_mode=" + ("TITLE_IN_BODY" if args.title_transfer_mode == "BODY_H1_REQUIRED" else args.title_transfer_mode)
        + f"\nimage_placeholders={parsed.cards}\ncoverage_zones=" + ",".join(parsed.coverage_zones)
        + "\ncompanion_projection=" + companion_status
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
