#!/usr/bin/env python3
"""Audit a privacy-safe, SEO-compliant SPD Markdown campaign record."""

from __future__ import annotations

import argparse
from datetime import datetime
import json
import re
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


STATUS_CATEGORIES = {
    "not attempted": "not_attempted",
    "form in progress": "in_progress",
    "submitted": "submitted",
    "awaiting approval": "awaiting_approval",
    "awaiting email verification": "awaiting_email_verification",
    "published": "published",
    "submission outcome unknown": "outcome_unknown",
    "submission failed": "submission_failed",
    "blocked — user action": "blocked_user_action",
    "blocked — missing verified data": "blocked_missing_data",
    "blocked — account or email policy": "blocked_account_policy",
    "blocked — reciprocal link/site modification": "blocked_reciprocal_link",
    "blocked — execution backend failure": "blocked_execution_backend",
    "unavailable": "unavailable",
    "paid-only": "paid_only",
    "ineligible": "ineligible",
    "terminated by user": "terminated",
}

PHASES = {"eligibility", "verification", "form", "confirmation", "follow-up"}

VERIFICATION_STATES = {
    "not checked": "not_checked",
    "automatic verification passed": "automatic_passed",
    "awaiting manual verification": "awaiting_manual",
    "manual verification completed": "manual_completed",
    "verification unavailable before form": "unavailable_before_form",
    "verification expired/reset": "expired_or_reset",
    "no verification presented": "not_presented",
    "deferred by user": "deferred",
}

AUTH_ACTIONS = (
    "inspection",
    "form filling",
    "account creation",
    "native registration-email verification",
    "terms/privacy acceptance",
    "final form submission",
    "email sending",
    "article publication",
    "claim ownership",
    "payment/upgrade",
    "reciprocal link/site modification",
    "dns/html/domain verification",
)

SUPPORTED_ROUTES = {"directory listing", "request app", "claim listing", "account/profile"}
SEPARATE_ROUTES = {"article", "community", "email", "contact form", "resource page", "partner outreach"}

CAMPAIGN_REQUIRED_FIELDS = {
    "public brand",
    "canonical product url",
    "product canonical id",
    "campaign purpose",
    "ranking manipulation prohibited",
    "approved contact reference",
    "master-data source",
    "evidence store",
    "evidence retention policy",
    "execution modes",
    "host platform",
    "ui environment",
    "available control capabilities",
    "browser routing policy",
    "rollout stage",
    "maximum sites this batch",
    "per-site approval required",
    "anchor policy",
    "kpi policy",
}

SITE_REQUIRED_FIELDS = {
    "website", "submission url", "platform domain", "product canonical id", "account alias", "site approval reference",
    "route", "idempotency key", "quality gate", "audience relevance", "user/discovery value",
    "editorial/platform governance", "paid/ranking-link offer", "directory/network quality",
    "automation/terms compatibility", "reciprocal link requirement", "phase", "status",
    "listing plan/cost", "execution mode", "platform capability result", "requested browser constraint", "selected browser surface",
    "execution backend/profile alias", "backend selection reason", "account/login",
    "credential source", "verification preflight", "manual-verification queue", "duplicate check",
    "fields entered", "fields omitted", "category", "asset reference", "asset sha-256",
    "agreements", "subscriptions", "captcha/authentication", "artifact stage", "first opened",
    "eligibility checked at", "verification checked at", "form started at", "submit action timestamp",
    "last checked", "result summary", "exact result", "public listing url", "evidence type",
    "evidence store reference", "evidence captured at", "evidence retention until", "backend checked",
    "mailbox checked", "public search checked", "next review time", "outbound link anchor",
    "outbound link anchor type", "outbound link href", "outbound link rel", "commercial relationship",
    "link checked at", "follow-up", "owner", "deadline",
}

TIMESTAMP_FIELDS = {
    "first opened", "eligibility checked at", "verification checked at", "form started at",
    "submit action timestamp", "last checked", "evidence captured at", "evidence retention until",
    "next review time", "link checked at", "deadline",
}

SENTINELS = {
    "none", "not applicable", "n/a", "unknown", "not attempted", "not checked", "not started",
    "not submitted", "not queued", "not observed", "campaign policy", "no expiry",
}

TRACKING_QUERY_KEYS = {
    "fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid", "ref", "referrer", "source",
}
SECRET_QUERY_KEYS = {
    "access_token", "api_key", "apikey", "auth", "authorization", "code", "key", "magic",
    "oauth_code", "oauth_state", "password", "recovery_code", "signature", "state", "token",
}

EVIDENCE_REQUIRED = {
    "submitted", "awaiting_approval", "awaiting_email_verification", "published", "submission_failed",
    "outcome_unknown", "paid_only", "ineligible", "unavailable",
}

PHASE_STATUS = {
    "not_attempted": {"eligibility", "verification"},
    "in_progress": {"form"},
    "submitted": {"confirmation", "follow-up"},
    "awaiting_approval": {"confirmation", "follow-up"},
    "awaiting_email_verification": {"confirmation", "follow-up"},
    "published": {"follow-up"},
    "outcome_unknown": {"confirmation", "follow-up"},
    "submission_failed": {"confirmation", "follow-up"},
    "paid_only": {"eligibility", "follow-up"},
    "ineligible": {"eligibility", "follow-up"},
    "unavailable": {"eligibility", "follow-up"},
}

FORM_OR_LATER = {
    "in_progress", "submitted", "awaiting_approval", "awaiting_email_verification", "published",
    "outcome_unknown", "submission_failed",
}

UNRESOLVED_VERIFICATION = {"awaiting_manual", "unavailable_before_form", "expired_or_reset"}

EVIDENCE_TYPES = {
    "server receipt", "email receipt", "public page", "policy page", "error response", "user confirmation",
}

ARTIFACT_STAGES = {"not applicable", "draft", "review", "public", "sent", "bounced"}
REL_TOKENS = {"none", "nofollow", "sponsored", "ugc"}
COMMERCIAL_RELATIONSHIPS = {"none", "paid", "incentivized", "reciprocal"}

COMMON_MULTI_LABEL_SUFFIXES = {
    "co.uk", "org.uk", "ac.uk", "com.au", "net.au", "org.au", "co.jp", "co.kr", "com.cn",
    "com.sg", "com.br", "com.mx", "co.in", "co.nz", "com.hk", "com.tw", "com.tr", "com.ar",
}

CAMPAIGN_HEADINGS = {"permanent operating rules", "authorization matrix", "source list"}


def compact(value: str) -> str:
    value = re.sub(r"[*]", "", value).replace("`", "")
    return re.sub(r"\s+", " ", value).strip()


def normalize_token(value: str) -> str:
    value = compact(value).lower().replace("–", "—").replace("−", "—")
    value = re.sub(r"^blocked\s*-\s*", "blocked — ", value)
    return re.sub(r"\s*—\s*", " — ", value)


def is_placeholder(value: str) -> bool:
    cleaned = compact(value)
    return not cleaned or bool(re.fullmatch(r"\[.*\]", cleaned))


def is_meaningful(value: str) -> bool:
    cleaned = compact(value).lower()
    return not is_placeholder(value) and cleaned not in SENTINELS


def parse_datetime(value: str) -> datetime | None:
    cleaned = compact(value)
    if cleaned.lower() in SENTINELS or is_placeholder(cleaned):
        return None
    try:
        parsed = datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else None


def is_iso_or_sentinel(value: str) -> bool:
    return compact(value).lower() in SENTINELS or parse_datetime(value) is not None


def domain_from_url(value: str) -> str:
    parts = urlsplit(compact(value))
    hostname = (parts.hostname or "").lower().rstrip(".")
    if hostname.startswith("www."):
        hostname = hostname[4:]
    labels = hostname.split(".")
    if len(labels) >= 3 and ".".join(labels[-2:]) in COMMON_MULTI_LABEL_SUFFIXES:
        return ".".join(labels[-3:])
    return ".".join(labels[-2:]) if len(labels) >= 2 else hostname


def query_key_is_tracking(key: str) -> bool:
    key = key.lower()
    return key.startswith("utm_") or key in TRACKING_QUERY_KEYS


def normalized_url(value: str) -> str:
    cleaned = compact(value)
    parts = urlsplit(cleaned)
    if not parts.scheme or not parts.netloc:
        return cleaned.lower()
    hostname = (parts.hostname or "").lower()
    port = parts.port
    if port and not ((parts.scheme.lower() == "http" and port == 80) or (parts.scheme.lower() == "https" and port == 443)):
        netloc = f"{hostname}:{port}"
    else:
        netloc = hostname
    path = re.sub(r"/{2,}", "/", parts.path).rstrip("/") or "/"
    query = urlencode(sorted((k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if not query_key_is_tracking(k)))
    return urlunsplit((parts.scheme.lower(), netloc, path, query, ""))


def parse_fields(body: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for match in re.finditer(r"^- ([^:\n]+):\s*(.*)$", body, re.MULTILINE):
        fields[compact(match.group(1)).lower()] = compact(match.group(2))
    return fields


def section_body(text: str, heading: str) -> str | None:
    match = re.search(rf"^## {re.escape(heading)}\s*$", text, re.MULTILINE | re.IGNORECASE)
    if not match:
        return None
    next_heading = re.search(r"^## .+$", text[match.end():], re.MULTILINE)
    end = match.end() + next_heading.start() if next_heading else len(text)
    return text[match.end():end]


def parse_authorization(text: str) -> tuple[dict[str, dict[str, str]], list[str]]:
    body = section_body(text, "Authorization matrix")
    if body is None:
        return {}, ["missing campaign section: Authorization matrix"]
    entries: dict[str, dict[str, str]] = {}
    errors: list[str] = []
    for action, value in parse_fields(body).items():
        if action not in AUTH_ACTIONS:
            errors.append("authorization matrix contains an unknown action")
            continue
        data: dict[str, str] = {}
        for part in value.split(";"):
            if "=" not in part:
                errors.append(f"authorization {action}: malformed segment")
                continue
            key, item = part.split("=", 1)
            data[compact(key).lower()] = compact(item)
        entries[action] = data
    return entries, errors


def parse_sources(text: str) -> tuple[list[str], list[str]]:
    body = section_body(text, "Source list")
    if body is None:
        return [], ["missing campaign section: Source list"]
    sources = [compact(item) for item in re.findall(r"^\d+\.\s+(.+)$", body, re.MULTILINE)]
    sources = [item for item in sources if not is_placeholder(item)]
    if not sources:
        return [], ["Source list contains no concrete URLs"]
    errors: list[str] = []
    for index, source in enumerate(sources, 1):
        parts = urlsplit(source)
        if parts.scheme not in {"http", "https"} or not parts.netloc:
            errors.append(f"Source list entry {index} has an invalid URL")
        if any(query_key_is_tracking(key) for key, _ in parse_qsl(parts.query, keep_blank_values=True)):
            errors.append(f"Source list entry {index} contains tracking parameters")
    return sources, errors


def parse_events(body: str) -> list[dict[str, str]]:
    pattern = re.compile(
        r"^-\s*([^|\n]+?)\s*\|\s*event_id=([^|\n]+?)\s*\|\s*action=([^|\n]+?)\s*"
        r"\|\s*result=([^|\n]+?)\s*\|\s*evidence=(.+?)\s*$",
        re.MULTILINE,
    )
    return [
        {"timestamp": compact(m.group(1)), "event_id": compact(m.group(2)), "action": normalize_token(m.group(3)),
         "result": compact(m.group(4)), "evidence": compact(m.group(5))}
        for m in pattern.finditer(body)
    ]


def parse_record(text: str) -> list[dict[str, object]]:
    sections: list[dict[str, object]] = []
    headers = list(re.finditer(r"^## (.+)$", text, re.MULTILINE))
    for index, header in enumerate(headers):
        name = compact(header.group(1))
        if name.lower() in CAMPAIGN_HEADINGS:
            continue
        end = headers[index + 1].start() if index + 1 < len(headers) else len(text)
        body = text[header.end():end]
        fields = parse_fields(body)
        raw_status = fields.get("status", "missing")
        normalized = normalize_token(raw_status)
        verification = normalize_token(fields.get("verification preflight", "missing"))
        sections.append({
            "index": len(sections) + 1,
            "name": name,
            "website": fields.get("website", ""),
            "submission_url": fields.get("submission url", ""),
            "status": compact(raw_status),
            "normalized_status": normalized,
            "category": STATUS_CATEGORIES.get(normalized, "unknown"),
            "verification_preflight": verification,
            "verification_category": VERIFICATION_STATES.get(verification, "unknown"),
            "phase": normalize_token(fields.get("phase", "")),
            "quality_gate": normalize_token(fields.get("quality gate", "")),
            "fields": fields,
            "events": parse_events(body),
            "errors": [],
            "warnings": [],
        })
    return sections


def scan_sensitive_data(text: str) -> list[str]:
    errors: list[str] = []
    labels = re.findall(
        r"(?im)^-\s*(password|otp|one-time password|recovery code|oauth code|oauth state|magic link|cookie|"
        r"session id|api key|access token|refresh token)\s*:", text,
    )
    if labels:
        errors.append("record contains prohibited secret fields: " + ", ".join(sorted(set(x.lower() for x in labels))))
    if re.search(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", text, re.IGNORECASE):
        errors.append("record contains an unredacted email address")
    if re.search(r"(?<![\w])\+\d[\d\s().-]{6,}\d", text):
        errors.append("record contains an unredacted phone number")
    if re.search(r"(?:/Users/|/home/|[A-Za-z]:\\Users\\)", text):
        errors.append("record contains a private absolute path")
    for raw_url in re.findall(r"https?://[^\s)>\]]+", text):
        raw_url = raw_url.rstrip(".,;:'\"")
        for key, _ in parse_qsl(urlsplit(raw_url).query, keep_blank_values=True):
            if key.lower() in SECRET_QUERY_KEYS:
                errors.append(f"record URL contains a sensitive query parameter: {key.lower()}")
    return sorted(set(errors))


def validate_campaign(text: str) -> tuple[dict[str, str], dict[str, dict[str, str]], list[str], list[str]]:
    errors = scan_sensitive_data(text)
    warnings: list[str] = []
    body = section_body(text, "Permanent operating rules")
    campaign = parse_fields(body or "")
    if body is None:
        errors.append("missing campaign section: Permanent operating rules")
    missing = sorted(CAMPAIGN_REQUIRED_FIELDS - campaign.keys())
    if missing:
        errors.append("campaign missing fields: " + ", ".join(missing))
    unresolved = sorted(field for field in CAMPAIGN_REQUIRED_FIELDS & campaign.keys() if is_placeholder(campaign[field]))
    if unresolved:
        errors.append("campaign unresolved placeholders: " + ", ".join(unresolved))
    if normalize_token(campaign.get("ranking manipulation prohibited", "")) != "yes":
        errors.append("campaign must set Ranking manipulation prohibited: yes")
    purpose = normalize_token(campaign.get("campaign purpose", ""))
    if not any(term in purpose for term in ("product discovery", "profile accuracy", "referral traffic", "listing durability")):
        errors.append("campaign purpose must include discovery, accuracy, referral, or listing durability")
    if any(term in purpose for term in ("pagerank", "dofollow", "backlink count", "ranking manipulation")):
        errors.append("campaign purpose contains a prohibited ranking/link objective")
    kpi = normalize_token(campaign.get("kpi policy", ""))
    if any(term in kpi for term in ("backlink count", "dofollow count", " da ", " dr ")):
        errors.append("KPI policy contains prohibited link-volume/domain-metric targets")
    if normalize_token(campaign.get("rollout stage", "")) != "pilot":
        errors.append("V2 requires Rollout stage: pilot")
    if normalize_token(campaign.get("per-site approval required", "")) != "yes":
        errors.append("V2 requires Per-site approval required: yes")
    if normalize_token(campaign.get("host platform", "")) not in {"windows", "macos", "linux", "other"}:
        errors.append("Host platform must be windows, macos, linux, or other")
    if normalize_token(campaign.get("ui environment", "")) not in {"desktop", "remote desktop", "headless", "unknown"}:
        errors.append("UI environment must be desktop, remote desktop, headless, or unknown")
    if not is_meaningful(campaign.get("available control capabilities", "")):
        errors.append("Available control capabilities must record at least one capability or user handoff")
    try:
        maximum_sites = int(compact(campaign.get("maximum sites this batch", "")))
    except ValueError:
        maximum_sites = 0
    if not 1 <= maximum_sites <= 10:
        errors.append("V2 maximum sites this batch must be between 1 and 10")

    auth, auth_errors = parse_authorization(text)
    errors.extend(auth_errors)
    for action in AUTH_ACTIONS:
        if action not in auth:
            errors.append(f"authorization missing action: {action}")
            continue
        entry = auth[action]
        decision = normalize_token(entry.get("decision", ""))
        if decision not in {"allowed", "ask", "prohibited"}:
            errors.append(f"authorization {action}: invalid decision")
        if decision == "allowed":
            for key in ("approved_by", "approved_at", "scope", "expires_at"):
                if not is_meaningful(entry.get(key, "")) and not (key == "expires_at" and normalize_token(entry.get(key, "")) == "no expiry"):
                    errors.append(f"authorization {action}: allowed entry requires {key}")
            if parse_datetime(entry.get("approved_at", "")) is None:
                errors.append(f"authorization {action}: approved_at must be ISO 8601 with timezone")
            expiry = normalize_token(entry.get("expires_at", ""))
            if expiry != "no expiry" and parse_datetime(entry.get("expires_at", "")) is None:
                errors.append(f"authorization {action}: expires_at must be ISO 8601 with timezone or no expiry")
            approved_at = parse_datetime(entry.get("approved_at", ""))
            expires_at = parse_datetime(entry.get("expires_at", ""))
            if approved_at and expires_at and expires_at < approved_at:
                errors.append(f"authorization {action}: expires_at precedes approved_at")

    sources, source_errors = parse_sources(text)
    errors.extend(source_errors)
    return campaign, auth, sources, errors + warnings


def authorization_error(action: str, timestamp: datetime, domain: str, auth: dict[str, dict[str, str]]) -> str | None:
    entry = auth.get(action)
    if not entry:
        return f"executed action lacks authorization entry: {action}"
    if normalize_token(entry.get("decision", "")) != "allowed":
        return f"executed action is not allowed: {action}"
    approved = parse_datetime(entry.get("approved_at", ""))
    if approved is None or approved > timestamp:
        return f"executed action predates approval: {action}"
    expiry_text = normalize_token(entry.get("expires_at", ""))
    expiry = None if expiry_text == "no expiry" else parse_datetime(entry.get("expires_at", ""))
    if expiry_text != "no expiry" and (expiry is None or expiry < timestamp):
        return f"executed action has expired authorization: {action}"
    scope = normalize_token(entry.get("scope", ""))
    if scope != "all listed sites":
        domains = {domain_from_url(item) or normalize_token(item) for item in re.split(r"\s*,\s*", entry.get("scope", "")) if item.strip()}
        if domain not in domains:
            return f"executed action is outside authorization scope: {action}"
    return None


def validate_quality(site: dict[str, object]) -> None:
    fields = site["fields"]
    errors = site["errors"]
    assert isinstance(fields, dict) and isinstance(errors, list)
    gate = normalize_token(fields.get("quality gate", ""))
    allowed_values = {
        "audience relevance": {"pass", "fail", "unknown"},
        "user/discovery value": {"pass", "fail", "unknown"},
        "editorial/platform governance": {"pass", "governed platform", "fail", "unknown"},
        "paid/ranking-link offer": {"none", "qualified paid placement", "unqualified paid/ranking link", "unknown"},
        "directory/network quality": {"pass", "fail", "unknown"},
        "automation/terms compatibility": {"allowed", "manual-only", "prohibited", "unknown"},
        "reciprocal link requirement": {"none", "optional", "required"},
    }
    for field, values in allowed_values.items():
        value = normalize_token(fields.get(field, ""))
        if value not in values:
            errors.append(f"invalid value for {field}")
    if gate not in {"not checked", "passed", "failed"}:
        errors.append("invalid quality gate")
        return
    criteria = {
        "audience relevance": "pass",
        "user/discovery value": "pass",
        "directory/network quality": "pass",
    }
    if gate == "passed":
        for field, expected in criteria.items():
            if normalize_token(fields.get(field, "")) != expected:
                errors.append(f"quality gate passed but {field} is not {expected}")
        if normalize_token(fields.get("editorial/platform governance", "")) not in {"pass", "governed platform"}:
            errors.append("quality gate passed without editorial/platform governance")
        if normalize_token(fields.get("paid/ranking-link offer", "")) not in {"none", "qualified paid placement"}:
            errors.append("quality gate passed despite unsafe or unknown paid/ranking-link offer")
        if normalize_token(fields.get("reciprocal link requirement", "")) == "required":
            errors.append("quality gate passed despite a required reciprocal link")
        compatibility = normalize_token(fields.get("automation/terms compatibility", ""))
        mode = normalize_token(fields.get("execution mode", ""))
        if mode in {"automated", "mixed"} and compatibility != "allowed":
            errors.append("automated or mixed execution requires explicit terms compatibility: allowed")
        if compatibility in {"prohibited", "unknown"}:
            errors.append("quality gate passed without compatible execution terms")
    if gate == "failed" and site["category"] != "ineligible":
        errors.append("failed quality gate must use Status: ineligible")


def validate_timestamps(site: dict[str, object]) -> None:
    fields = site["fields"]
    errors = site["errors"]
    assert isinstance(fields, dict) and isinstance(errors, list)
    for field in sorted(TIMESTAMP_FIELDS & fields.keys()):
        if not is_iso_or_sentinel(fields[field]):
            errors.append(f"{field} must be ISO 8601 with timezone or an approved sentinel")
    if parse_datetime(fields.get("last checked", "")) is None:
        errors.append("last checked requires an ISO 8601 timestamp")
    ordered = [
        ("first opened", parse_datetime(fields.get("first opened", ""))),
        ("eligibility checked at", parse_datetime(fields.get("eligibility checked at", ""))),
        ("verification checked at", parse_datetime(fields.get("verification checked at", ""))),
        ("form started at", parse_datetime(fields.get("form started at", ""))),
        ("submit action timestamp", parse_datetime(fields.get("submit action timestamp", ""))),
        ("last checked", parse_datetime(fields.get("last checked", ""))),
    ]
    previous: tuple[str, datetime] | None = None
    for name, current in ordered:
        if current is None:
            continue
        if previous and current < previous[1]:
            errors.append(f"timestamp order invalid: {name} precedes {previous[0]}")
        previous = (name, current)


def validate_evidence_and_links(site: dict[str, object]) -> None:
    fields = site["fields"]
    errors = site["errors"]
    assert isinstance(fields, dict) and isinstance(errors, list)
    category = str(site["category"])
    if category in EVIDENCE_REQUIRED:
        evidence_type = normalize_token(fields.get("evidence type", ""))
        if evidence_type not in EVIDENCE_TYPES:
            errors.append(f"{category} requires a canonical evidence type")
        for field in ("evidence store reference", "evidence captured at", "evidence retention until", "exact result"):
            if not is_meaningful(fields.get(field, "")):
                errors.append(f"{category} requires {field}")
        reference = fields.get("evidence store reference", "")
        if any(mark in reference for mark in ("/", "\\", "@", "http://", "https://")):
            errors.append("evidence store reference must be an opaque ID, not a path, URL, or email")
    if category == "published":
        public_url = fields.get("public listing url", "")
        if urlsplit(public_url).scheme not in {"http", "https"} or not urlsplit(public_url).netloc:
            errors.append("published requires a public listing URL")
        for field in ("outbound link anchor", "outbound link anchor type", "outbound link href", "outbound link rel", "link checked at"):
            value = normalize_token(fields.get(field, ""))
            if (field == "outbound link rel" and value == "not observed") or (field != "outbound link rel" and not is_meaningful(fields.get(field, ""))):
                errors.append(f"published requires {field}")
    anchor_type = normalize_token(fields.get("outbound link anchor type", ""))
    if anchor_type == "exact-match commercial":
        errors.append("commercial exact-match anchor is prohibited")
    if anchor_type not in {"brand", "product", "naked url", "not observed"}:
            errors.append("invalid outbound link anchor type")
    rel_value = normalize_token(fields.get("outbound link rel", ""))
    if rel_value != "not observed":
        tokens = set(rel_value.split())
        if not tokens or not tokens <= REL_TOKENS:
            errors.append("invalid outbound link rel")
    relationship = normalize_token(fields.get("commercial relationship", ""))
    if relationship not in COMMERCIAL_RELATIONSHIPS:
        errors.append("invalid commercial relationship")
    if relationship in {"paid", "incentivized"} and not ({"sponsored", "nofollow"} & set(rel_value.split())):
        errors.append("paid or incentivized links require sponsored or nofollow")


def validate_events(site: dict[str, object], auth: dict[str, dict[str, str]], global_event_ids: set[str]) -> None:
    fields = site["fields"]
    events = site["events"]
    errors = site["errors"]
    assert isinstance(fields, dict) and isinstance(events, list) and isinstance(errors, list)
    domain = normalize_token(fields.get("platform domain", ""))
    event_actions: list[str] = []
    previous_time: datetime | None = None
    for event in events:
        timestamp = parse_datetime(event["timestamp"])
        if timestamp is None:
            errors.append("event has an invalid timestamp")
            continue
        if previous_time and timestamp < previous_time:
            errors.append("event log is not chronological")
        previous_time = timestamp
        event_id = event["event_id"]
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{2,80}", event_id):
            errors.append("event has an invalid event ID")
        elif event_id in global_event_ids:
            errors.append("duplicate event ID")
        else:
            global_event_ids.add(event_id)
        action = event["action"]
        event_actions.append(action)
        if action not in AUTH_ACTIONS:
            errors.append("invalid event action")
        else:
            auth_error = authorization_error(action, timestamp, domain, auth)
            if auth_error:
                errors.append(auth_error)
        if not is_meaningful(event["result"]):
            errors.append("event requires a result")
        if action in {"final form submission", "email sending", "article publication", "claim ownership", "payment/upgrade"} and not is_meaningful(event["evidence"]):
            errors.append("consequential event requires an evidence reference")

    if parse_datetime(fields.get("first opened", "")) and "inspection" not in event_actions:
        errors.append("opened site requires an inspection event")
    form_started = parse_datetime(fields.get("form started at", ""))
    if (form_started or is_meaningful(fields.get("fields entered", ""))) and "form filling" not in event_actions:
        errors.append("form work requires a form filling event")
    submitted_at = parse_datetime(fields.get("submit action timestamp", ""))
    final_events = [event for event in events if event["action"] == "final form submission"]
    if submitted_at and not final_events:
        errors.append("submit action timestamp requires a final form submission event")
    if submitted_at and final_events and all(parse_datetime(event["timestamp"]) != submitted_at for event in final_events):
        errors.append("submit action timestamp must match a final form submission event")
    if site["category"] == "outcome_unknown" and len(final_events) != 1:
        errors.append("submission outcome unknown must have exactly one unresolved final submission event")
    if is_meaningful(fields.get("agreements", "")) and "terms/privacy acceptance" not in event_actions:
        errors.append("accepted agreements require a terms/privacy acceptance event")
    if normalize_token(fields.get("route", "")) == "claim listing" and site["category"] not in {"not_attempted", "ineligible"} and "claim ownership" not in event_actions:
        errors.append("claim route execution requires a claim ownership event")


def validate_site(
    site: dict[str, object], campaign: dict[str, str], auth: dict[str, dict[str, str]],
    normalized_sources: set[str], global_event_ids: set[str],
) -> None:
    fields = site["fields"]
    errors = site["errors"]
    warnings = site["warnings"]
    assert isinstance(fields, dict) and isinstance(errors, list) and isinstance(warnings, list)

    missing = sorted(SITE_REQUIRED_FIELDS - fields.keys())
    if missing:
        errors.append("missing fields: " + ", ".join(missing))
    unresolved = sorted(field for field in SITE_REQUIRED_FIELDS & fields.keys() if is_placeholder(fields[field]))
    if unresolved:
        errors.append("unresolved placeholders: " + ", ".join(unresolved))

    normalized_status = str(site["normalized_status"])
    category = STATUS_CATEGORIES.get(normalized_status)
    if category is None:
        errors.append("invalid canonical status")
        category = "unknown"
        site["category"] = category
    elif compact(str(site["status"])).lower() != normalized_status:
        warnings.append(f"noncanonical status formatting; use: {normalized_status}")

    phase = str(site["phase"])
    if phase not in PHASES:
        errors.append("invalid phase")
    elif category in PHASE_STATUS and phase not in PHASE_STATUS[category]:
        errors.append(f"incompatible phase/status: {phase} / {normalized_status}")

    route = normalize_token(fields.get("route", ""))
    if route in SEPARATE_ROUTES:
        errors.append(f"route requires a separate workflow: {route}")
    elif route not in SUPPORTED_ROUTES:
        errors.append("invalid SPD route")

    verification = str(site["verification_preflight"])
    if verification not in VERIFICATION_STATES:
        errors.append("invalid verification preflight")
    if category in FORM_OR_LATER and site["verification_category"] in UNRESOLVED_VERIFICATION:
        errors.append("form/post-submit status cannot retain unresolved verification")
    if site["verification_category"] in UNRESOLVED_VERIFICATION and not is_meaningful(fields.get("manual-verification queue", "")):
        errors.append("unresolved verification requires a manual-verification queue entry")

    validate_quality(site)
    if category in FORM_OR_LATER and site["quality_gate"] != "passed":
        errors.append("form/post-submit status requires Quality gate: passed")
    capability_result = normalize_token(fields.get("platform capability result", ""))
    if capability_result not in {"supported", "supported with handoff", "unavailable"}:
        errors.append("invalid platform capability result")
    if category in FORM_OR_LATER and capability_result == "unavailable":
        errors.append("form/post-submit status requires a compatible platform capability")

    submission_url = fields.get("submission url", "")
    platform_domain = normalize_token(fields.get("platform domain", ""))
    actual_domain = domain_from_url(submission_url)
    if not actual_domain:
        errors.append("submission URL must be an absolute HTTP(S) URL")
    elif platform_domain != actual_domain:
        errors.append(f"platform domain does not match submission URL: expected {actual_domain}")
    if normalized_url(submission_url) not in normalized_sources:
        errors.append("submission URL is not present in Source list")

    product_id = normalize_token(fields.get("product canonical id", ""))
    campaign_product_id = normalize_token(campaign.get("product canonical id", ""))
    if product_id != campaign_product_id:
        errors.append("site product canonical ID does not match campaign")
    if not is_meaningful(fields.get("site approval reference", "")):
        errors.append("site requires an opaque per-site approval reference")
    expected_key = "|".join((platform_domain, product_id, normalize_token(fields.get("account alias", "")), route))
    if normalize_token(fields.get("idempotency key", "")) != expected_key:
        errors.append("invalid idempotency key")

    validate_timestamps(site)
    validate_evidence_and_links(site)
    validate_events(site, auth, global_event_ids)

    captured_at = parse_datetime(fields.get("evidence captured at", ""))
    retention_until = parse_datetime(fields.get("evidence retention until", ""))
    last_checked = parse_datetime(fields.get("last checked", ""))
    if captured_at and last_checked and captured_at > last_checked:
        errors.append("evidence captured at cannot be later than last checked")
    if captured_at and retention_until and retention_until < captured_at:
        errors.append("evidence retention until cannot precede evidence capture")

    if category == "not_attempted":
        if is_meaningful(fields.get("fields entered", "")):
            errors.append("not attempted cannot contain entered listing fields")
        if parse_datetime(fields.get("form started at", "")):
            errors.append("not attempted cannot have a form-start time")
        if parse_datetime(fields.get("submit action timestamp", "")):
            errors.append("not attempted cannot have a submit-action time")
        if phase == "confirmation":
            errors.append("not attempted cannot be in confirmation phase")
        if any(event["action"] in {"form filling", "final form submission", "claim ownership", "payment/upgrade"} for event in site["events"]):
            errors.append("not attempted contains a listing execution event")
    if category == "in_progress":
        if parse_datetime(fields.get("form started at", "")) is None:
            errors.append("form in progress requires form started at")
        if parse_datetime(fields.get("submit action timestamp", "")):
            errors.append("form in progress cannot have a submit-action time")
    if category in {"submitted", "awaiting_approval", "awaiting_email_verification", "submission_failed", "outcome_unknown"}:
        if parse_datetime(fields.get("submit action timestamp", "")) is None:
            errors.append(f"{category} requires submit action timestamp")
    if category == "outcome_unknown":
        for field in ("backend checked", "mailbox checked", "public search checked"):
            if not is_meaningful(fields.get(field, "")):
                errors.append(f"outcome_unknown requires {field}")
        if parse_datetime(fields.get("next review time", "")) is None:
            errors.append("outcome_unknown requires next review time")
    if category.startswith("blocked_") and not is_meaningful(fields.get("follow-up", "")):
        errors.append(f"{category} requires follow-up")

    artifact = normalize_token(fields.get("artifact stage", ""))
    if artifact not in ARTIFACT_STAGES:
        errors.append("invalid artifact stage")
    if category == "published" and artifact != "public":
        errors.append("published requires Artifact stage: public")
    if category == "awaiting_approval" and artifact != "review":
        errors.append("awaiting approval requires Artifact stage: review")

    safe_label = f"Site {site['index']}"
    site["errors"] = [f"{safe_label}: {message}" for message in errors]
    site["warnings"] = [f"{safe_label}: {message}" for message in warnings]
    site["valid"] = not site["errors"]


def redacted_report(report: dict[str, object]) -> dict[str, object]:
    sites = report.get("sites", [])
    safe_sites = []
    queue_indices: list[int] = []
    for index, site in enumerate(sites if isinstance(sites, list) else [], 1):
        status = str(site.get("normalized_status", ""))
        phase = str(site.get("phase", ""))
        quality_gate = str(site.get("quality_gate", ""))
        safe_sites.append({
            "site_index": index,
            "platform_domain": domain_from_url(str(site.get("submission_url", ""))),
            "status": status if status in STATUS_CATEGORIES else "invalid",
            "category": site.get("category"),
            "phase": phase if phase in PHASES else "invalid",
            "quality_gate": quality_gate if quality_gate in {"not checked", "passed", "failed"} else "invalid",
            "verification_category": site.get("verification_category"),
            "valid": site.get("valid"),
            "error_count": len(site.get("errors", [])),
            "warning_count": len(site.get("warnings", [])),
        })
        if site.get("verification_category") in UNRESOLVED_VERIFICATION:
            queue_indices.append(index)
    return {
        "valid": report.get("valid"),
        "total": report.get("total"),
        "counts": report.get("counts"),
        "verification_counts": report.get("verification_counts"),
        "manual_verification_site_indices": queue_indices,
        "error_count": len(report.get("errors", [])),
        "warning_count": len(report.get("warnings", [])),
        "sites": safe_sites,
    }


def audit_text(text: str) -> dict[str, object]:
    campaign, auth, sources, campaign_errors = validate_campaign(text)
    normalized_sources = {normalized_url(source) for source in sources}
    sites = parse_record(text)
    global_event_ids: set[str] = set()
    for site in sites:
        validate_site(site, campaign, auth, normalized_sources, global_event_ids)

    errors = list(campaign_errors) + [message for site in sites for message in site["errors"]]
    warnings = [message for site in sites for message in site["warnings"]]
    if not sites:
        errors.append("record contains no website sections")
    try:
        maximum_sites = int(compact(campaign.get("maximum sites this batch", "")))
    except ValueError:
        maximum_sites = 0
    if maximum_sites and (len(sites) > maximum_sites or len(sources) > maximum_sites):
        errors.append("pilot batch exceeds the approved maximum site count")

    seen_urls: dict[str, int] = {}
    seen_keys: dict[str, int] = {}
    for site in sites:
        url = str(site["submission_url"])
        if url and not is_placeholder(url):
            key = normalized_url(url)
            if key in seen_urls:
                message = f"Site {site['index']}: duplicate normalized submission URL also used by Site {seen_urls[key]}"
                errors.append(message)
                site["errors"].append(message)
                site["valid"] = False
            else:
                seen_urls[key] = int(site["index"])
        fields = site["fields"]
        assert isinstance(fields, dict)
        idem = normalize_token(fields.get("idempotency key", ""))
        if idem and not is_placeholder(idem):
            if idem in seen_keys:
                message = f"Site {site['index']}: duplicate idempotency key also used by Site {seen_keys[idem]}"
                errors.append(message)
                site["errors"].append(message)
                site["valid"] = False
            else:
                seen_keys[idem] = int(site["index"])

    counts: dict[str, int] = {}
    verification_counts: dict[str, int] = {}
    for site in sites:
        category = str(site["category"])
        counts[category] = counts.get(category, 0) + 1
        verification = str(site["verification_category"])
        verification_counts[verification] = verification_counts.get(verification, 0) + 1
    queue = [site for site in sites if site["verification_category"] in UNRESOLVED_VERIFICATION]
    return {
        "valid": not errors,
        "total": len(sites),
        "counts": counts,
        "verification_counts": verification_counts,
        "manual_verification_queue": queue,
        "errors": errors,
        "warnings": warnings,
        "sites": sites,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("record", type=Path)
    parser.add_argument("--json", action="store_true", help="emit a redacted structural report")
    args = parser.parse_args()
    report = audit_text(args.record.read_text(encoding="utf-8"))
    if args.json:
        print(json.dumps(redacted_report(report), ensure_ascii=False, indent=2))
    else:
        print(f"Valid: {'yes' if report['valid'] else 'no'}")
        print(f"Total sites: {report['total']}")
        for key in sorted(report["counts"]):
            print(f"{key}: {report['counts'][key]}")
        for warning in report["warnings"]:
            print(f"WARNING: {warning}")
        for error in report["errors"]:
            print(f"ERROR: {error}")
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
