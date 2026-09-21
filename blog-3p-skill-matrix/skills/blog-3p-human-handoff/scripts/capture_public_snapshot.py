#!/usr/bin/env python3
"""Capture a bounded, read-only public-page snapshot for the registered campaign G batch."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


MAX_RESPONSE_BYTES = 2_000_000
IGNORED_TAGS = {"script", "style", "noscript", "template"}
REQUIRED_CTA_FIELDS = ("anchor_text", "product_destination_url", "relationship_disclosure")
LIMITATION_SCOPE_FIELDS = ("platform", "account_or_site", "editor_or_theme", "locale_or_market", "observed_at")


def non_empty_string(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def normalize_text(value: str) -> str:
    return " ".join(value.split())


def is_http_url(value: object) -> bool:
    if not non_empty_string(value):
        return False
    parsed = urlparse(value.strip())
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc) and parsed.username is None and parsed.password is None


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def is_timezone_aware_iso8601(value: object) -> bool:
    if not non_empty_string(value):
        return False
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return False
    return parsed.tzinfo is not None


def read_json(path: Path, label: str) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"{label} must be valid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be a JSON object")
    return value


def current_metadata_title(article_package: dict, package_path: Path) -> str:
    """Read the current package title from canonical metadata, not a copied field."""
    sources = article_package.get("artifact_sources")
    source = sources.get("metadata") if isinstance(sources, dict) else None
    if not isinstance(source, dict) or not non_empty_string(source.get("path")):
        raise ValueError("article-package schema 1.4+ requires metadata source")
    root = package_path.resolve().parent
    metadata_path = (root / source["path"].strip()).resolve()
    if metadata_path == root or root not in metadata_path.parents:
        raise ValueError("article-package metadata source must stay inside the package workspace")
    if not metadata_path.is_file():
        raise ValueError("article-package metadata source is missing")
    digest = hashlib.sha256(metadata_path.read_bytes()).hexdigest()
    if source.get("sha256") != digest:
        raise ValueError("article-package metadata source sha256 does not match")
    metadata = read_json(metadata_path, "canonical metadata")
    title = str(metadata.get("platform_title", metadata.get("canonical_title", metadata.get("title", "")))).strip()
    if not title:
        raise ValueError("canonical metadata requires platform_title or canonical_title")
    return title


def required_contract(article_package: dict, package_path: Path) -> dict:
    if article_package.get("schema_version") not in {"1.2", "1.3", "1.4"}:
        raise ValueError("article-package must use schema_version 1.2, 1.3 or 1.4")
    article_id = article_package.get("article_id")
    if not non_empty_string(article_id):
        raise ValueError("article-package requires article_id")
    cta = article_package.get("cta")
    if not isinstance(cta, dict) or cta.get("mode") != "SECONDARY_RECOMMENDATION":
        raise ValueError("article-package must declare the required SECONDARY_RECOMMENDATION CTA")
    missing = [field for field in REQUIRED_CTA_FIELDS if not non_empty_string(cta.get(field))]
    if missing:
        raise ValueError("article-package required CTA is missing: " + ", ".join(missing))
    return {
        "article_id": article_id.strip(),
        "canonical_path": article_package.get("canonical_path"),
        "canonical_sha256": article_package.get("canonical_sha256"),
        "title": current_metadata_title(article_package, package_path)
        if article_package.get("schema_version") == "1.4"
        else str(article_package.get("title", "")).strip(),
        "required_cta": {
            "anchor_text": cta["anchor_text"].strip(),
            "href": cta["product_destination_url"].strip(),
            "relationship_disclosure": cta["relationship_disclosure"].strip(),
        },
    }


def validate_platform_limitation(limitation: object, index: int) -> None:
    """Keep a direct snapshot invocation from bypassing the validated limitation boundary."""
    prefix = f"public return receipt limitation #{index}"
    if not isinstance(limitation, dict):
        raise ValueError(f"{prefix} must be an object")
    for field in ("id", "observed_behavior", "owner_acceptance"):
        if not non_empty_string(limitation.get(field)):
            raise ValueError(f"{prefix} requires {field}")
    scope = limitation.get("scope")
    if not isinstance(scope, dict):
        raise ValueError(f"{prefix} requires a scoped observation")
    for field in LIMITATION_SCOPE_FIELDS:
        if not non_empty_string(scope.get(field)):
            raise ValueError(f"{prefix} scope requires {field}")
    for field in ("evidence_paths", "affected_contract_items"):
        values = limitation.get(field)
        if not isinstance(values, list) or not values or any(not non_empty_string(value) for value in values):
            raise ValueError(f"{prefix} requires non-empty {field}")
    if limitation.get("not_generalizable") is not True:
        raise ValueError(f"{prefix} must set not_generalizable=true")


def validate_receipt(receipt: dict, article_id: str) -> None:
    if receipt.get("schema_version") != "1.0":
        raise ValueError("public return receipt must use schema_version 1.0")
    if receipt.get("article_id") != article_id:
        raise ValueError("public return receipt article_id must match article-package")
    if not is_http_url(receipt.get("public_url")):
        raise ValueError("public return receipt requires an http(s) public_url")
    if receipt.get("human_state") not in {"HUMAN_ACCEPTED", "HUMAN_NEEDS_FIX"}:
        raise ValueError("public return receipt human_state must be HUMAN_ACCEPTED or HUMAN_NEEDS_FIX")
    if not is_timezone_aware_iso8601(receipt.get("returned_at")):
        raise ValueError("public return receipt requires a timezone-aware ISO-8601 returned_at")
    if not non_empty_string(receipt.get("published_at_or_revision")):
        raise ValueError("public return receipt requires published_at_or_revision or UNVERIFIED")
    visual_paths = receipt.get("public_visual_evidence_paths")
    if not isinstance(visual_paths, list) or any(not non_empty_string(path) for path in visual_paths):
        raise ValueError("public return receipt public_visual_evidence_paths must be a list of paths")
    limitations = receipt.get("known_platform_limitations")
    if not isinstance(limitations, list):
        raise ValueError("public return receipt known_platform_limitations must be a list")
    for index, limitation in enumerate(limitations, 1):
        validate_platform_limitation(limitation, index)


class ReaderPageParser(HTMLParser):
    """Extract small transport observations; it intentionally never infers heading hierarchy."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._ignored: list[str] = []
        self._in_title = False
        self._title_parts: list[str] = []
        self._visible_text_parts: list[str] = []
        self._anchor_href: Optional[str] = None
        self._anchor_text_parts: list[str] = []
        self._caption_parts: Optional[list[str]] = None
        self.links: list[dict] = []
        self.images: list[dict] = []
        self.captions: list[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        tag = tag.casefold()
        if self._ignored:
            if tag in IGNORED_TAGS:
                self._ignored.append(tag)
            return
        if tag in IGNORED_TAGS:
            self._ignored.append(tag)
            return
        data = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "a" and self._anchor_href is None:
            self._anchor_href = (data.get("href") or "").strip()
            self._anchor_text_parts = []
        elif tag == "figcaption":
            self._caption_parts = []
        elif tag == "img":
            self.images.append({"src": (data.get("src") or "").strip(), "alt": (data.get("alt") or "").strip()})

    def handle_startendtag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data: str) -> None:
        if self._ignored:
            return
        self._visible_text_parts.append(data)
        if self._in_title:
            self._title_parts.append(data)
        if self._anchor_href is not None:
            self._anchor_text_parts.append(data)
        if self._caption_parts is not None:
            self._caption_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.casefold()
        if self._ignored:
            if tag == self._ignored[-1]:
                self._ignored.pop()
            return
        if tag == "title":
            self._in_title = False
        elif tag == "a" and self._anchor_href is not None:
            self.links.append({"href": self._anchor_href, "text": normalize_text("".join(self._anchor_text_parts))})
            self._anchor_href = None
            self._anchor_text_parts = []
        elif tag == "figcaption" and self._caption_parts is not None:
            self.captions.append(normalize_text("".join(self._caption_parts)))
            self._caption_parts = None

    @property
    def document_title(self) -> str:
        return normalize_text("".join(self._title_parts))

    @property
    def visible_text(self) -> str:
        return normalize_text("".join(self._visible_text_parts))


def load_source(receipt: dict, html_file: Optional[Path]) -> Tuple[Optional[str], Dict]:
    requested_url = receipt["public_url"].strip()
    if html_file is not None:
        raw = html_file.read_bytes()
        if len(raw) > MAX_RESPONSE_BYTES:
            raise ValueError(f"html fixture exceeds {MAX_RESPONSE_BYTES} byte capture limit")
        return raw.decode("utf-8", errors="replace"), {
            "mode": "LOCAL_HTML_FIXTURE",
            "requested_url": requested_url,
            "final_url": requested_url,
            "http_status": None,
            "content_type": "text/html",
            "response_sha256": hashlib.sha256(raw).hexdigest(),
            "fetch_error": None,
        }
    request = Request(requested_url, headers={"User-Agent": "Blog3P-PublicQA/1.0", "Accept": "text/html,application/xhtml+xml"})
    try:
        with urlopen(request, timeout=15) as response:  # nosec B310 - user-supplied public URL, read-only by contract
            raw = response.read(MAX_RESPONSE_BYTES + 1)
            if len(raw) > MAX_RESPONSE_BYTES:
                raise ValueError(f"response exceeds {MAX_RESPONSE_BYTES} byte capture limit")
            charset = response.headers.get_content_charset() or "utf-8"
            return raw.decode(charset, errors="replace"), {
                "mode": "HTTP_GET_READONLY",
                "requested_url": requested_url,
                "final_url": response.geturl(),
                "http_status": getattr(response, "status", None),
                "content_type": response.headers.get("Content-Type", ""),
                "response_sha256": hashlib.sha256(raw).hexdigest(),
                "fetch_error": None,
            }
    except (HTTPError, URLError, OSError, ValueError) as exc:
        status = exc.code if isinstance(exc, HTTPError) else None
        return None, {
            "mode": "HTTP_GET_READONLY",
            "requested_url": requested_url,
            "final_url": None,
            "http_status": status,
            "content_type": None,
            "response_sha256": None,
            "fetch_error": f"{type(exc).__name__}: {exc}",
        }


def bounded_records(records: list[dict], limit: int = 50) -> tuple[list[dict], bool]:
    return records[:limit], len(records) > limit


def observation(contract: dict, source: dict, html_source: Optional[str], visual_paths: list) -> dict:
    result = {
        "capture_status": "CAPTURED" if html_source is not None else "UNVERIFIED",
        "captured_at": utc_now(),
        "source": source,
        "expected_contract": contract,
        "visual_hierarchy": {
            "status": "PENDING_LANE_G_VISUAL_JUDGMENT" if visual_paths else "REQUIRES_RENDERED_VISUAL_EVIDENCE",
            "evidence_paths": visual_paths,
            "rule": "Do not infer heading hierarchy from HTML, DOM, source, Feed markup or this snapshot.",
        },
    }
    if html_source is None:
        result["observed_transport"] = None
        return result
    parser = ReaderPageParser()
    parser.feed(html_source)
    parser.close()
    visible_text = parser.visible_text
    expected_cta = contract["required_cta"]
    expected_anchor = normalize_text(expected_cta["anchor_text"])
    matching_anchor_hrefs = sorted({link["href"] for link in parser.links if link["text"] == expected_anchor})
    exact_cta = any(link["text"] == expected_anchor and link["href"] == expected_cta["href"] for link in parser.links)
    disclosure = expected_cta["relationship_disclosure"]
    image_records, images_truncated = bounded_records(parser.images)
    caption_records, captions_truncated = bounded_records([{"text": caption} for caption in parser.captions])
    result["observed_transport"] = {
        "document_title": parser.document_title,
        "document_title_exact_match": bool(contract["title"]) and normalize_text(contract["title"]) == parser.document_title,
        "visible_text_sha256": hashlib.sha256(visible_text.encode("utf-8")).hexdigest(),
        "visible_text_character_count": len(visible_text),
        "links": {
            "count": len(parser.links),
            "required_cta": {
                "expected_anchor_text": expected_cta["anchor_text"],
                "expected_href": expected_cta["href"],
                "anchor_text_found": bool(matching_anchor_hrefs),
                "matching_anchor_hrefs": matching_anchor_hrefs[:20],
                "exact_anchor_href_found": exact_cta,
                "relationship_disclosure": "NOT_APPLICABLE" if disclosure == "NOT_APPLICABLE" else ("FOUND" if normalize_text(disclosure) in visible_text else "NOT_FOUND"),
            },
        },
        "images": {
            "count": len(parser.images),
            "observable_alt_count": sum(1 for image in parser.images if image["alt"]),
            "records": image_records,
            "records_truncated": images_truncated,
            "captions": caption_records,
            "captions_truncated": captions_truncated,
        },
    }
    return result


def snapshot_hash(snapshot: dict) -> str:
    encoded = json.dumps(snapshot, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--article-package", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--html-file", type=Path, help="Offline fixture or explicitly saved public HTML; skips the HTTP GET.")
    args = parser.parse_args()
    try:
        receipt = read_json(args.receipt, "public return receipt")
        contract = required_contract(read_json(args.article_package, "article-package"), args.article_package)
        validate_receipt(receipt, contract["article_id"])
    except ValueError as exc:
        print("PUBLIC_SNAPSHOT_INVALID\n" + str(exc))
        return 1
    if receipt["human_state"] == "HUMAN_NEEDS_FIX":
        print("PUBLIC_SNAPSHOT_SKIPPED\nhuman_state=HUMAN_NEEDS_FIX")
        return 0
    try:
        html_source, source = load_source(receipt, args.html_file)
    except OSError as exc:
        print("PUBLIC_SNAPSHOT_INVALID\n" + str(exc))
        return 1
    snapshot = observation(contract, source, html_source, receipt["public_visual_evidence_paths"])
    snapshot["snapshot_sha256"] = snapshot_hash(snapshot)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(("PUBLIC_SNAPSHOT_CAPTURED" if html_source is not None else "PUBLIC_SNAPSHOT_UNVERIFIED") + f"\noutput={args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
