#!/usr/bin/env python3
"""Audit an SPD V1 Batch Markdown campaign record."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


ALLOWED_STATUSES = {
    "not attempted",
    "form in progress",
    "draft saved",
    "submitted",
    "submission outcome unknown",
    "awaiting approval",
    "awaiting email verification",
    "published",
    "blocked — manual verification",
    "blocked — missing verified data",
    "blocked — account or email policy",
    "unavailable",
    "paid-only",
    "ineligible",
    "duplicate — no action",
    "terminated by user",
}

ALLOWED_VERIFICATION = {
    "not checked",
    "automatic verification passed",
    "awaiting manual verification",
    "manual verification completed",
    "verification unavailable before form",
    "verification expired/reset",
    "no verification presented",
    "deferred by user",
}

REQUIRED_CONTROLS = {
    "SPD version",
    "Campaign ID",
    "Product canonical ID",
    "Canonical URL",
    "Source-list reference",
    "Batch authorization reference",
    "Execution-shard size",
    "Maximum active tabs",
    "Host platform",
    "UI environment",
    "Available control capabilities",
    "Browser-routing policy",
    "Credential policy",
    "Evidence policy",
    "Duplicate policy",
    "Ambiguous-outcome policy",
    "Ranking manipulation prohibited",
}

REQUIRED_SITE_FIELDS = {
    "Queue ID",
    "Website",
    "Platform domain",
    "Route",
    "Account alias",
    "Idempotency key",
    "Execution shard",
    "Platform capability result",
    "Requested browser constraint",
    "Selected browser surface",
    "Execution backend/session alias",
    "Backend selection reason",
    "Legitimacy gate",
    "Authorization reference",
    "Status",
    "Verification preflight",
    "Fields entered",
    "Fields omitted",
    "Agreements/subscriptions",
    "Submit timestamp",
    "Exact result",
    "Evidence reference",
    "Last checked",
    "Follow-up",
}

TERMINAL_OR_PENDING = {
    "submitted",
    "submission outcome unknown",
    "awaiting approval",
    "awaiting email verification",
    "published",
}

EXECUTED = TERMINAL_OR_PENDING | {"form in progress", "draft saved"}
UNRESOLVED_VERIFICATION = {
    "awaiting manual verification",
    "verification expired/reset",
    "deferred by user",
}

TRACKING_KEYS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "gclid", "fbclid", "msclkid", "ref", "referrer",
}
SENSITIVE_QUERY_KEYS = {
    "token", "key", "api_key", "apikey", "code", "state", "session",
    "auth", "password", "otp", "signature", "sig",
}


def clean(value: str) -> str:
    return re.sub(r"[*`]", "", value).strip()


def parse_fields(body: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for match in re.finditer(r"^- ([^:\n]+):\s*(.*)$", body, re.MULTILINE):
        fields[clean(match.group(1))] = clean(match.group(2))
    return fields


def normalize_url(value: str) -> str:
    try:
        parts = urlsplit(value.strip())
    except ValueError:
        return value.strip()
    host = (parts.hostname or "").lower()
    if not host:
        return value.strip()
    port = f":{parts.port}" if parts.port else ""
    query = [
        (key, val) for key, val in parse_qsl(parts.query, keep_blank_values=True)
        if key.lower() not in TRACKING_KEYS
    ]
    path = parts.path or "/"
    if path != "/":
        path = path.rstrip("/")
    return urlunsplit(((parts.scheme or "https").lower(), host + port, path, urlencode(query), ""))


def parse_record(text: str) -> tuple[dict[str, str], list[dict[str, object]]]:
    controls_match = re.search(
        r"^## Campaign controls\s*$([\s\S]*?)(?=^## |\Z)", text, re.MULTILINE
    )
    controls = parse_fields(controls_match.group(1)) if controls_match else {}

    sites: list[dict[str, object]] = []
    headings = list(re.finditer(r"^## (?!Campaign controls$|Source list$)(.+)$", text, re.MULTILINE))
    for index, heading in enumerate(headings):
        end = headings[index + 1].start() if index + 1 < len(headings) else len(text)
        body = text[heading.end():end]
        fields = parse_fields(body)
        sites.append({"name": heading.group(1).strip(), "fields": fields})
    return controls, sites


def audit(text: str) -> dict[str, object]:
    errors: list[str] = []
    warnings: list[str] = []
    controls, sites = parse_record(text)

    missing_controls = sorted(REQUIRED_CONTROLS - controls.keys())
    if missing_controls:
        errors.append("missing campaign controls: " + ", ".join(missing_controls))
    if controls.get("SPD version") != "V1 Batch":
        errors.append("SPD version must be V1 Batch")
    if controls.get("Ranking manipulation prohibited", "").lower() != "yes":
        errors.append("Ranking manipulation prohibited must be yes")
    for numeric in ("Execution-shard size", "Maximum active tabs"):
        value = controls.get(numeric, "")
        if not value.isdigit() or int(value) < 1:
            errors.append(f"{numeric} must be a positive integer")
    if controls.get("Host platform", "").lower() not in {"windows", "macos", "linux", "other"}:
        errors.append("Host platform must be windows, macos, linux, or other")
    if controls.get("UI environment", "").lower() not in {"desktop", "remote desktop", "headless", "unknown"}:
        errors.append("UI environment must be desktop, remote desktop, headless, or unknown")
    if controls.get("Available control capabilities", "").lower() in {"", "none", "not applicable"}:
        errors.append("Available control capabilities must record at least one capability or user handoff")

    if not re.search(r"^## Source list\s*$\n(?:\s*\n)*1\.\s+\S+", text, re.MULTILINE):
        errors.append("Source list must contain at least one URL")

    email_matches = sorted(set(re.findall(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", text, re.IGNORECASE)))
    if email_matches:
        errors.append("raw email address found; use a contact alias")
    secret_label = re.search(
        r"^-\s*(?:password|passcode|otp|recovery code|cookie|session id|oauth code|magic link)\s*:\s*(?!not applicable|none|redacted)\S+",
        text,
        re.IGNORECASE | re.MULTILINE,
    )
    if secret_label:
        errors.append("secret-bearing field found in shareable record")
    for url in re.findall(r"https?://[^\s)>]+", text):
        keys = {key.lower() for key, _ in parse_qsl(urlsplit(url).query, keep_blank_values=True)}
        if keys & SENSITIVE_QUERY_KEYS:
            errors.append("URL with sensitive authentication parameter found")
            break

    seen_keys: dict[str, str] = {}
    seen_urls: dict[str, str] = {}
    status_counts: Counter[str] = Counter()
    verification_counts: Counter[str] = Counter()
    manual_queue: list[str] = []

    for site in sites:
        name = str(site["name"])
        fields = site["fields"]
        assert isinstance(fields, dict)
        missing = sorted(REQUIRED_SITE_FIELDS - fields.keys())
        if missing:
            errors.append(f"{name}: missing fields: " + ", ".join(missing))

        status = fields.get("Status", "")
        verification = fields.get("Verification preflight", "")
        status_counts[status or "missing"] += 1
        verification_counts[verification or "missing"] += 1
        if status not in ALLOWED_STATUSES:
            errors.append(f"{name}: invalid status: {status or 'missing'}")
        if verification not in ALLOWED_VERIFICATION:
            errors.append(f"{name}: invalid verification state: {verification or 'missing'}")
        capability_result = fields.get("Platform capability result", "").lower()
        if capability_result not in {"supported", "supported with handoff", "unavailable"}:
            errors.append(f"{name}: invalid platform capability result")
        if status in EXECUTED and capability_result == "unavailable":
            errors.append(f"{name}: executed without a compatible platform capability")
        if verification in UNRESOLVED_VERIFICATION:
            manual_queue.append(name)

        idem = fields.get("Idempotency key", "")
        if idem:
            if idem in seen_keys:
                errors.append(f"{name}: duplicate idempotency key also used by {seen_keys[idem]}")
            else:
                seen_keys[idem] = name

        website = fields.get("Website", "")
        normalized = normalize_url(website) if website else ""
        if normalized:
            if normalized in seen_urls:
                errors.append(f"{name}: duplicate normalized website also used by {seen_urls[normalized]}")
            else:
                seen_urls[normalized] = name

        if status in EXECUTED and fields.get("Legitimacy gate") != "passed":
            errors.append(f"{name}: executed without a passed legitimacy gate")
        if status in EXECUTED and fields.get("Authorization reference", "") in {"", "not applicable", "none"}:
            errors.append(f"{name}: executed without an authorization reference")
        if status in EXECUTED and verification in UNRESOLVED_VERIFICATION:
            errors.append(f"{name}: executed while verification remained unresolved")

        entered = fields.get("Fields entered", "").lower()
        agreements = fields.get("Agreements/subscriptions", "").lower()
        submitted_at = fields.get("Submit timestamp", "").lower()
        if status == "not attempted":
            if entered not in {"", "none"}:
                errors.append(f"{name}: not attempted but listing fields were entered")
            if agreements not in {"", "none"}:
                errors.append(f"{name}: not attempted but agreements/subscriptions were selected")
            if submitted_at not in {"", "not submitted", "not applicable"}:
                errors.append(f"{name}: not attempted but has a submit timestamp")

        if status in TERMINAL_OR_PENDING:
            if submitted_at in {"", "not submitted", "not applicable"}:
                errors.append(f"{name}: {status} requires a submit timestamp")
            if fields.get("Exact result", "").lower() in {"", "not attempted", "unknown"}:
                errors.append(f"{name}: {status} requires an exact result")
            if fields.get("Evidence reference", "").lower() in {"", "not applicable", "none"}:
                errors.append(f"{name}: {status} requires an evidence reference")

        if status == "submission outcome unknown":
            for check in ("Backend checked", "Mailbox checked", "Public page checked"):
                if fields.get(check, "").lower() in {"", "not applicable", "not checked"}:
                    errors.append(f"{name}: unknown outcome requires {check}")

        if status == "published" and fields.get("Public listing URL", "").lower() in {"", "not applicable", "none"}:
            errors.append(f"{name}: published requires a public listing URL")

    if not sites:
        errors.append("record contains no website sections")

    return {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "total_sites": len(sites),
        "status_counts": dict(sorted(status_counts.items())),
        "verification_counts": dict(sorted(verification_counts.items())),
        "manual_verification_queue": manual_queue,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("record", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = audit(args.record.read_text(encoding="utf-8"))
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Valid: {result['valid']}")
        print(f"Total sites: {result['total_sites']}")
        for key, count in result["status_counts"].items():
            print(f"{key}: {count}")
        if result["manual_verification_queue"]:
            print("Manual verification queue: " + ", ".join(result["manual_verification_queue"]))
        for error in result["errors"]:
            print("ERROR: " + error)
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
