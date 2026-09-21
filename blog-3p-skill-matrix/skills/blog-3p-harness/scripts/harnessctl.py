#!/usr/bin/env python3
"""Initialize and validate a human-native-release-only Blog 3P content project."""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlparse

PHASES = {"draft", "prewrite_planning", "awaiting_owner_prewrite_confirmation", "research", "write", "review", "repair", "gate", "human_release_ready", "human_publishing", "human_accepted", "public_readonly_validating", "completed", "deferred", "blocked", "capacity_blocked"}
PRIORITY = ["CURRENT_BRAND_SITE", "REGIONAL_SERP", "MODEL_TRANSLATION_FALLBACK"]
VISUAL_ZONES = ["LEAD", "MIDDLE", "CLOSING"]
OWNER_SOURCE_TYPES = {"OWNER_XLSX", "OWNER_TABLE", "OWNER_MESSAGE"}
MATCHING_ROLE = "CAMPAIGN_PLATFORM_MATCHING_RESEARCHER"
CURRENT_CAMPAIGN_SCHEMA = "2.14"
CURRENT_PREWRITE_PLAN_SCHEMA = "1.8"
PREVIOUS_PREWRITE_PLAN_SCHEMA = "1.7"
CURRENT_EVIDENCE_PACK_SCHEMA = "1.3"
RESEARCH_INTEGRITY_PREWRITE_PLAN_SCHEMA = "1.6"
RESEARCH_INTEGRITY_EVIDENCE_PACK_SCHEMA = "1.2"
PRIMARY_AUDIENCE_FIT = "PRIMARY_AUDIENCE_MATCH"
CROSS_LANGUAGE_EXCEPTION_FIT = "CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED"
DELIVERY_FIT_MODES = {PRIMARY_AUDIENCE_FIT, CROSS_LANGUAGE_EXCEPTION_FIT}
EVIDENCE_POSTURE_METHOD_TEMPLATE = "METHOD_TEMPLATE_NO_EXECUTION"
EVIDENCE_POSTURE_DOCUMENTED_RECORD = "DOCUMENTED_EMPIRICAL_RECORD"
EVIDENCE_POSTURE_MODES = {
    EVIDENCE_POSTURE_METHOD_TEMPLATE,
    EVIDENCE_POSTURE_DOCUMENTED_RECORD,
}
READER_INTENT_BASIS_MODES = {
    "CURRENT_BRAND_SITE",
    "REGIONAL_SERP",
    "MODEL_TRANSLATION_FALLBACK",
}
PLATFORM_PROFILE_USE_MODES = {"NOT_USED", "TOPIC_FRAMING_ONLY"}
DOCUMENTED_RECORD_FIELDS = (
    "protocol_path",
    "inputs_or_settings_path",
    "run_log_path",
    "evaluation_criteria",
    "limitations",
)
TOPIC_SLOT_FIELDS = (
    "slot_id",
    "reader_task",
    "core_intent",
    "market",
    "differentiation_angle",
)
TOPIC_SLOT_ALIGNMENT_STATUSES = {"ALIGNED", "TOPIC_EVIDENCE_CONFLICT"}
TOPIC_CONFLICT_PROPOSED_ACTIONS = {
    "KEEP_SLOT",
    "NARROW_WITHIN_SLOT",
    "PAUSE",
    "OWNER_RECONFIRM_REQUIRED",
}
TOPIC_CONFLICT_RESOLUTION_ACTIONS = {"KEEP_SLOT", "NARROW_WITHIN_SLOT"}
TOPIC_CONFLICT_DECISION_STAGE = "TOPIC_EVIDENCE_DECISION"
LEGACY_PREWRITE_PLAN_SECTIONS = ["task_and_audience", "research_evidence_and_uncertainty", "keyword_and_localization_strategy", "factual_claims_and_sources", "title_and_outline", "visual_narrative", "platform_transport_assumptions", "risks_and_owner_decisions"]
PREWRITE_PLAN_SECTIONS = ["task_and_audience", "reader_value_and_secondary_cta", "research_evidence_and_uncertainty", "keyword_and_localization_strategy", "factual_claims_and_sources", "title_and_outline", "visual_narrative", "platform_transport_assumptions", "risks_and_owner_decisions"]
LEGACY_PREWRITE_SUMMARY_SECTIONS = ["owner_task_and_scope", "sources_checked_and_uncertainty", "shared_constraints", "platform_matching_status"]
PREWRITE_SUMMARY_SECTIONS = ["owner_task_and_scope", "content_value_and_cta_policy", "sources_checked_and_uncertainty", "shared_constraints", "platform_matching_status"]
MODEL_FIRST_PREWRITE_PLAN_SECTIONS = [
    "task_and_audience",
    "reader_value_and_secondary_cta",
    "editorial_brief",
    "risks_and_owner_decisions",
]
MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS = ["campaign_strategy"]
PREWRITE_STATUSES = {"PENDING_OWNER_PREWRITE_PLAN_CONFIRMATION", "OWNER_PREWRITE_PLAN_CONFIRMED", "OWNER_PREWRITE_PLAN_CHANGES_REQUESTED"}
OWNER_CONFIRMATION_RECEIPT_TYPES = {"OWNER_MESSAGE", "OWNER_FILE"}
OWNER_CONFIRMATION_RECEIPT_DIRECTORY = "evidence/owner-confirmations"
# `ARTICLE_LANE_GATEKEEPER` remains readable for schema-2.6 records.  New
# campaigns keep the article-local context in the reusable W/R pair and reuse
# the one registered campaign G as a batch control plane.
ARTICLE_EXECUTION_ROLES = {"ARTICLE_LANE_GATEKEEPER", "ARTICLE_WRITER", "ARTICLE_LANGUAGE_REVIEWER"}
ARTICLE_PAIR_ROLES = {"ARTICLE_WRITER", "ARTICLE_LANGUAGE_REVIEWER"}
CAMPAIGN_GATEKEEPER_ROLE = "CAMPAIGN_GATEKEEPER"
CTA_RECOMMENDATION_FIELDS = ("product_name", "product_destination_url", "product_evidence_path", "reader_task_relevance", "relationship_disclosure")
REQUIRED_CTA_RECOMMENDATION_FIELDS = ("anchor_text", *CTA_RECOMMENDATION_FIELDS)
HUMAN_RETURN_STATES = {"HUMAN_ACCEPTED", "HUMAN_NEEDS_FIX"}
ARTICLE_CONTEXT_SCHEMA = "1.0"
REVIEW_INDEX_SCHEMA = "1.0"
REVIEW_DELTA_SCHEMA = "1.0"
RESEARCH_REVIEW_STATUSES = {"PENDING", "NOT_REQUIRED", "RESEARCH_APPROVED", "RESEARCH_CHANGES_REQUIRED"}
FULL_REVIEW_STATUSES = {"PENDING", "NOT_REQUIRED", "APPROVED", "CHANGES_REQUIRED"}
AUTHOR_QA_STATUSES = {
    "PENDING",
    "NOT_REQUIRED",
    "AUTHOR_QA_READY",
    "AUTHOR_QA_ESCALATION_REQUIRED",
    "CHANGES_REQUIRED",
}
REVIEW_TIERS = {
    "AUTHOR_QA_INTEGRATED",
    "INDEPENDENT_R_ESCALATION",
    # Schema-2.13 compatibility tiers.  Their meanings must never be
    # reinterpreted as author self-QA after a matrix upgrade.
    "STANDARD_INTEGRATED_REVIEW",
    "ELEVATED_EARLY_CHALLENGE",
}
AUTHOR_QA_REVIEW_EFFORT = {
    "tier": "AUTHOR_QA_INTEGRATED",
    "quality_mode": "WQ_SHARED_CONTEXT",
    "research_gate": "INTEGRATED_IN_AUTHOR_QA",
    "independent_reviewer_required": False,
    "reasons": [],
}
INDEPENDENT_R_REVIEW_EFFORT = {
    "tier": "INDEPENDENT_R_ESCALATION",
    "quality_mode": "WR_INDEPENDENT",
    "research_gate": "INTEGRATED_IN_FULL_REVIEW",
    "independent_reviewer_required": True,
    "reasons": ["REPLACE_WITH_RECORDED_ESCALATION_REASON"],
}
STANDARD_REVIEW_EFFORT = {
    "tier": "STANDARD_INTEGRATED_REVIEW",
    "research_gate": "INTEGRATED_IN_FULL_REVIEW",
    "reasons": [],
}
LEGACY_REVIEW_EFFORT = {
    "tier": "ELEVATED_EARLY_CHALLENGE",
    "research_gate": "SEPARATE_RESEARCH_REVIEW_REQUIRED",
    "reasons": ["LEGACY_SCHEMA_COMPATIBILITY"],
}
AUTHOR_QA_PROTOCOL = "CANDIDATE_LOCK_ADVERSARIAL_SELF_QA_TARGETED_REPAIR_FINAL_BIND"
AUTHOR_QA_ROUTE_RESOLUTION = {
    "planned_quality_mode": "WQ_SHARED_CONTEXT",
    "effective_quality_mode": "WQ_SHARED_CONTEXT",
    "status": "NOT_ESCALATED",
    "escalation_trigger_ids": [],
}
WR_ROUTE_RESOLUTION = {
    "planned_quality_mode": "WR_INDEPENDENT",
    "effective_quality_mode": "WR_INDEPENDENT",
    "status": "NOT_APPLICABLE",
    "escalation_trigger_ids": [],
}
FINAL_VISUAL_DELTA_RESULT = "APPROVED"
FINAL_VISUAL_DELTA_FIELDS = (
    "report_sha256", "reviewer_agent_id", "review_index_sha256",
    "reviewed_visual_manifest_sha256", "reviewed_visual_payload_sha256",
)
FINAL_QUALITY_HASH_FIELDS = (
    "canonical_sha256",
    "evidence_pack_sha256",
    "metadata_sha256",
    "visual_manifest_sha256",
    "visual_payload_sha256",
    "visual_payload_markdown_sha256",
    "article_package_sha256",
)
CURRENT_ARTICLE_PACKAGE_SCHEMA = "1.5"
PACKAGE_SCHEMA_WITH_METADATA_SOURCE = {"1.4", CURRENT_ARTICLE_PACKAGE_SCHEMA}
OPTIMIZED_ARTICLE_PACKAGE_SCHEMAS = {"1.3", *PACKAGE_SCHEMA_WITH_METADATA_SOURCE}
MAIN_SESSION_PATH_ISOLATION = "MAIN_SESSION_PATH_ISOLATED"
GIT_WORKTREE_ISOLATION = "GIT_WORKTREE"
ARTICLE_ARTIFACT_ROOT_TEMPLATE = "articles/{article_id}"
WORKTREE_AUTOSPAWN_POLICY = "EXPLICIT_EXCEPTION_ONLY"
WORKTREE_DISPATCH_REASONS = {
    "TRUE_CONCURRENT_WRITE",
    "HIGH_RISK_REWRITE_OR_ROLLBACK",
    "OWNER_REQUESTED_GIT_ISOLATION",
}
DELTA_CHANGE_KINDS = {
    "CANONICAL_TEXT",
    "METADATA_OR_CTA",
    "RESEARCH_EVIDENCE",
    "VISUAL_ASSET",
    "VISUAL_MANIFEST",
    "VISUAL_PAYLOAD",
    "ARTICLE_PACKAGE_VISUAL_POINTER",
    "REQUIREMENTS_OR_SCOPE",
}
DELTA_REVIEW_SCOPES = {"R_DELTA", "R_VISUAL_DELTA"}
PUBLIC_QA_OUTCOMES = {
    "PUBLIC_QA_PASSED",
    "PUBLIC_QA_PASSED_WITH_LIMITATION",
    "HUMAN_TRANSPORT_FIX_REQUIRED",
    "PUBLIC_QA_UNVERIFIED",
    "CANONICAL_CHANGE_REQUESTED",
}
PUBLIC_QA_RECORD_STATUSES = {"NOT_STARTED", *HUMAN_RETURN_STATES, "PUBLIC_READONLY_VALIDATING", *PUBLIC_QA_OUTCOMES}
LIMITATION_SCOPE_FIELDS = ("platform", "account_or_site", "editor_or_theme", "locale_or_market", "observed_at")
PUBLIC_QA_POLICY_2_3 = {
    "mode": "REUSE_ARTICLE_LANE_GATEKEEPER_READONLY",
    "requires_human_acceptance": True,
    "human_return_receipt": "STRUCTURED_REQUIRED",
    "public_snapshot": "NORMALIZED_READONLY_REQUIRED",
    "fresh_public_reviewer": "PROHIBITED",
    "automatic_wr_reopen": False,
    "human_transport_fix_recheck": "SAME_LANE_G_ONLY",
    "canonical_change_reopen": "OWNER_EXPLICIT_REQUEST_ID_REQUIRED",
    "accepted_platform_limitation": "EVIDENCE_SCOPED_NOT_GENERALIZABLE",
    "unverified_retry_budget": 1,
    "on_mismatch": "CLASSIFY_BEFORE_OWNER_DECISION",
    "outcomes": [
        "PUBLIC_QA_PASSED",
        "PUBLIC_QA_PASSED_WITH_LIMITATION",
        "HUMAN_TRANSPORT_FIX_REQUIRED",
        "PUBLIC_QA_UNVERIFIED",
        "CANONICAL_CHANGE_REQUESTED",
    ],
}
GATE_BATCH_POLICY_2_7 = {
    "mode": "CAMPAIGN_G_BATCH_CONTRACT_ACCEPTANCE",
    "input": "CURRENT_R_APPROVED_ARTICLE_ROWS_ONLY",
    "scheduling": "ALL_CURRENTLY_READY_ROWS_PER_G_TURN",
    "decision_scope": "REQUIREMENTS_HASH_AND_EXCEPTION_ONLY",
    "article_quality_rereview": "PROHIBITED",
    "per_article_traceability": "BATCH_REPORT_ROW_REQUIRED",
    "machine_external_writes_allowed": False,
}
GATE_BATCH_POLICY_2_14 = {
    **GATE_BATCH_POLICY_2_7,
    "input": "CURRENT_FINAL_QUALITY_READY_ARTICLE_ROWS_ONLY",
    "quality_credential": "ROUTE_TRUTHFUL_WQ_OR_WR_RECEIPT",
}
PUBLIC_QA_POLICY_2_7 = {
    "mode": "REUSE_REGISTERED_CAMPAIGN_GATEKEEPER_BATCH_READONLY",
    "requires_human_acceptance": True,
    "human_return_receipt": "STRUCTURED_REQUIRED",
    "public_snapshot": "NORMALIZED_READONLY_REQUIRED",
    "fresh_public_reviewer": "PROHIBITED",
    "automatic_wr_reopen": False,
    "batch_input": "CURRENT_HUMAN_ACCEPTED_ROWS_ONLY",
    "batch_agent": "REGISTERED_CAMPAIGN_GATEKEEPER",
    "per_article_traceability": "BATCH_REPORT_ENTRY_REQUIRED",
    "human_transport_fix_recheck": "SAME_CAMPAIGN_G_BATCH_ONLY",
    "canonical_change_reopen": "OWNER_EXPLICIT_REQUEST_ID_REQUIRED",
    "accepted_platform_limitation": "EVIDENCE_SCOPED_NOT_GENERALIZABLE",
    "unverified_retry_budget": 1,
    "on_mismatch": "CLASSIFY_BEFORE_OWNER_DECISION",
    "outcomes": [
        "PUBLIC_QA_PASSED",
        "PUBLIC_QA_PASSED_WITH_LIMITATION",
        "HUMAN_TRANSPORT_FIX_REQUIRED",
        "PUBLIC_QA_UNVERIFIED",
        "CANONICAL_CHANGE_REQUESTED",
    ],
}
ARTIFACT_OPTIMIZATION_POLICY_2_4 = {
    "mode": "CANONICAL_MANIFESTS_AND_DELTA_CONTEXT",
    "prewrite_manifest_schema": "1.3",
    "prewrite_manifest_canonical_source": True,
    "prewrite_owner_view": "HARNESS_DETERMINISTIC_RENDER_ONLY",
    "manual_duplicate_entry": "PROHIBITED",
    "article_context": {"path": "context/article-contract.json", "schema_version": ARTICLE_CONTEXT_SCHEMA},
    "review_index": {"path": "reviews/review-index.json", "schema_version": REVIEW_INDEX_SCHEMA},
    "review_delta": {"schema_version": REVIEW_DELTA_SCHEMA, "max_delta_attempts_before_full_review": 2},
    "research_evidence_pack": {"path": "research/evidence-pack.json", "canonical": True},
    "shared_evidence_pack": {"path": "evidence/shared/campaign-evidence-pack.json", "canonical": True},
    "visual_manifest": {"path": "canonical/visual-manifest.json", "canonical": True},
    "article_package": {
        "current_schema_version": "1.4",
        "legacy_schema_versions": ["1.2", "1.3"],
        "one_way_sources": ["canonical_article", "metadata", "research_evidence_pack", "visual_manifest"],
        "duplicate_metadata_links_images": "PROHIBITED",
    },
    "final_artifact_review": {
        "default": "FULL_REVIEW_COVERS_FINAL_PAYLOAD",
        "post_full_visual_delta": "ONLY_AFTER_VISUAL_OR_PAYLOAD_CHANGE",
        "semantic_change": "FULL_REVIEW_REQUIRED",
    },
    "handoff_manifest": {"path": "handoff/handoff-manifest.json", "canonical": True},
    "visual_payloads": {
        "html": "handoff/visual-payload.html",
        "markdown": "handoff/visual-payload.md",
        "both_required": True,
    },
    "payload_semantic_auditor": "ARTICLE_LANGUAGE_REVIEWER",
    "gate_payload_acceptance": "MANIFEST_HASH_AND_REQUIREMENTS_ONLY",
}
MODEL_FIRST_ARTIFACT_OPTIMIZATION_POLICY_2_6 = {
    **ARTIFACT_OPTIMIZATION_POLICY_2_4,
    "prewrite_manifest_schema": "1.4",
    "model_owned_research_record": "ONE_EVIDENCE_PACK_WITH_DERIVED_VIEWS",
    "review_route": "STANDARD_INTEGRATED_REVIEW_UNLESS_ELEVATED",
    "final_artifact_review": {
        "default": "FULL_REVIEW_COVERS_FINAL_PAYLOAD",
        "post_full_visual_delta": "ONLY_AFTER_VISUAL_OR_PAYLOAD_CHANGE",
        "semantic_change": "TARGETED_R_DELTA_UNLESS_SCOPE_OR_LINEAGE_ESCALATION",
    },
}
LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_8 = {
    **MODEL_FIRST_ARTIFACT_OPTIMIZATION_POLICY_2_6,
    "prewrite_manifest_schema": "1.5",
    "owner_confirmation_receipt": "HASH_BOUND_OWNER_ORIGINATED_ARTIFACT",
}
LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_10 = {
    **LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_8,
    "prewrite_manifest_schema": RESEARCH_INTEGRITY_PREWRITE_PLAN_SCHEMA,
    "research_evidence_pack": {
        "path": "research/evidence-pack.json",
        "canonical": True,
        "schema_version": RESEARCH_INTEGRITY_EVIDENCE_PACK_SCHEMA,
    },
}
LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_11 = {
    **LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_10,
    "prewrite_manifest_schema": CURRENT_PREWRITE_PLAN_SCHEMA,
    "research_evidence_pack": {
        "path": "research/evidence-pack.json",
        "canonical": True,
        "schema_version": CURRENT_EVIDENCE_PACK_SCHEMA,
    },
}
LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_12 = {
    **LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_11,
    "article_package": {
        "current_schema_version": CURRENT_ARTICLE_PACKAGE_SCHEMA,
        "legacy_schema_versions": ["1.2", "1.3", "1.4"],
        "one_way_sources": ["canonical_article", "metadata", "research_evidence_pack", "visual_manifest"],
        "canonical_article": {
            "path": "canonical/article.html",
            "format": "RICH_TEXT_HTML_FRAGMENT",
            "compiler_input": "PACKAGE_DECLARED_ONLY",
        },
        "duplicate_metadata_links_images": "PROHIBITED",
    },
    "visual_payloads": {
        "html": "handoff/visual-payload.html",
        "markdown": "handoff/visual-payload.md",
        "both_required": True,
        "review_surface": "HTML_PRIMARY_MARKDOWN_COMPILER_VERIFIED_FALLBACK",
    },
    "payload_semantic_auditor": "ARTICLE_LANGUAGE_REVIEWER_HTML_PRIMARY",
}
LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_13 = {
    **LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_12,
    "article_artifact_root_template": ARTICLE_ARTIFACT_ROOT_TEMPLATE,
    "article_context": {
        "path": "articles/{article_id}/context/article-contract.json",
        "schema_version": ARTICLE_CONTEXT_SCHEMA,
    },
    "review_index": {
        "path": "articles/{article_id}/reviews/review-index.json",
        "schema_version": REVIEW_INDEX_SCHEMA,
    },
    "research_evidence_pack": {
        "path": "articles/{article_id}/research/evidence-pack.json",
        "canonical": True,
        "schema_version": CURRENT_EVIDENCE_PACK_SCHEMA,
    },
    "visual_manifest": {
        "path": "articles/{article_id}/canonical/visual-manifest.json",
        "canonical": True,
    },
    "handoff_manifest": {
        "path": "articles/{article_id}/handoff/handoff-manifest.json",
        "canonical": True,
    },
    "visual_payloads": {
        "html": "articles/{article_id}/handoff/visual-payload.html",
        "markdown": "articles/{article_id}/handoff/visual-payload.md",
        "both_required": True,
        "review_surface": "HTML_PRIMARY_MARKDOWN_COMPILER_VERIFIED_FALLBACK",
    },
}
LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_14 = {
    **LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_13,
    "review_route": "AUTHOR_QA_INTEGRATED_UNLESS_WR_ESCALATED",
    "quality_routes": {
        "default": "AUTHOR_QA_INTEGRATED",
        "author_qa_receipt": "reviews/author-qa-N.json",
        "independent_r_escalation": "INDEPENDENT_R_ESCALATION",
        "wq_late_change": "RERUN_AUTHOR_QA_OR_ESCALATE_WR",
    },
    "final_artifact_review": {
        "default": "AUTHOR_QA_COVERS_FINAL_PAYLOAD",
        "independent_escalation": "FULL_REVIEW_COVERS_FINAL_PAYLOAD",
        "post_full_visual_delta": "ONLY_AFTER_WR_FULL_REVIEW",
        "semantic_change": "RERUN_AUTHOR_QA_OR_WR_DELTA_AFTER_INDEPENDENT_REVIEW",
    },
}
MODEL_FIRST_EXECUTION_POLICY_2_6 = {
    "mode": "MODEL_CONTINUOUS_CREATION_WITH_RISK_ESCALATION",
    "default_review_tier": "STANDARD_INTEGRATED_REVIEW",
    "writer_continuous_sequence": ["RESEARCH", "DRAFT", "VISUALS", "PAYLOAD"],
    "separate_research_review": "RISK_TRIGGERED_ONLY",
    "independent_final_review": "REQUIRED",
    "reviewer_may_elevate_not_downgrade": True,
    "gatekeeper_binds_tier_and_reason": True,
    "mechanical_checks": "POSTHOC_INTEGRITY_AND_SCOPE_ONLY",
}
MODEL_FIRST_EXECUTION_POLICY_2_14 = {
    "mode": "MODEL_CONTINUOUS_CREATION_WITH_DUAL_QUALITY_ROUTES",
    "default_review_tier": "AUTHOR_QA_INTEGRATED",
    "writer_continuous_sequence": ["RESEARCH", "DRAFT", "VISUALS", "PAYLOAD", "AUTHOR_QA"],
    "author_qa_protocol": AUTHOR_QA_PROTOCOL,
    "independent_r_escalation": "RISK_OR_OWNER_TRIGGERED_ONLY",
    "separate_research_review": "WR_RISK_TRIGGERED_ONLY",
    "independent_final_review": "REQUIRED_ONLY_FOR_WR",
    "wq_to_wr_downgrade": "PROHIBITED",
    "gatekeeper_binds_tier_and_reason": True,
    "mechanical_checks": "POSTHOC_INTEGRITY_AND_SCOPE_ONLY",
}
LIVE_EXECUTION_PROFILE_2_8 = {
    "mode": "LIVE_BASELINE_V1",
    "purpose": "REAL_WORK_OBSERVATION_WITHOUT_EXPERIMENTAL_ROUTING",
    "owner_confirmation": "RECEIPT_BOUND_LOCAL_COMMAND_REQUIRED",
    "article_flow": "ONE_CONTINUOUS_W_THEN_ONE_INDEPENDENT_FULL_R",
    "gate_flow": "ONE_SHARED_CAMPAIGN_G_BATCH",
    "public_flow": "HUMAN_NATIVE_RELEASE_THEN_SAME_G_BATCH_READONLY",
    "automatic_model_routing": "PROHIBITED",
    "extra_debate_agents": "PROHIBITED",
    "global_content_cache": "PROHIBITED",
    "telemetry": "OPTIONAL_OBSERVE_ONLY",
}
# Schema 2.8 remains readable so historical records can still be checked, but
# no current command may use it to dispatch editorial work.  New projects have
# one execution path: an owner performs the native publication after a local
# human-release handoff; automation can only inspect local files or public
# reader pages read-only.
HUMAN_RELEASE_PROFILE_2_9 = {
    "mode": "HUMAN_RELEASE_ONLY_V1",
    "purpose": "HUMAN_NATIVE_RELEASE_REQUIRED_WITH_READONLY_EVIDENCE",
    "owner_confirmation": "RECEIPT_BOUND_LOCAL_COMMAND_REQUIRED",
    "article_flow": "ONE_CONTINUOUS_W_THEN_ONE_INDEPENDENT_FULL_R",
    "gate_flow": "ONE_SHARED_CAMPAIGN_G_BATCH",
    "public_flow": "HUMAN_NATIVE_RELEASE_THEN_SAME_G_BATCH_READONLY",
    "automatic_model_routing": "PROHIBITED",
    "extra_debate_agents": "PROHIBITED",
    "global_content_cache": "PROHIBITED",
    "telemetry": "OPTIONAL_OBSERVE_ONLY",
}
HUMAN_RELEASE_PROFILE_2_14 = {
    **HUMAN_RELEASE_PROFILE_2_9,
    "article_flow": "WQ_DEFAULT_OR_WR_INDEPENDENT_ESCALATION",
    "quality_routes": "AUTHOR_QA_INTEGRATED_DEFAULT_WITH_ONE_WAY_WR_ESCALATION",
}
MODEL_FIRST_REHYDRATION_PROTOCOL = {
    "always_read_first": ["CURRENT_WORKFLOW_CORE", "context/article-contract.json", "reviews/review-index.json"],
    "expand_historical_material_when": ["INPUT_HASH_DRIFT", "OPEN_FINDING_LINEAGE", "AGENT_REPLACEMENT", "R_DELTA_ESCALATION", "OWNER_SCOPE_CHANGE"],
    "do_not_reload_unaffected_history": True,
}
TREND_EVIDENCE_POLICY_2_5 = {
    "mode": "OPTIONAL_ENGLISH_GLOBAL_RELATIVE_CONTEXT_ONLY",
    "insufficient_data_route": "TARGET_PLATFORM_AUDIENCE_NEED_WITH_EXPLICIT_BOUNDARY",
    "prohibited_inferences": [
        "SEARCH_VOLUME",
        "LOW_BASE_HIGH_MOMENTUM",
        "LOCAL_DEMAND",
        "POPULARITY",
        "COMMERCIAL_INTENT",
        "MODEL_CAPABILITY",
    ],
}
RESEARCH_INTEGRITY_POLICY_2_10 = {
    "mode": "EVIDENCE_LAYER_SEPARATION_AND_CLAIM_POSTURE",
    "required_before_full_review": True,
    "evidence_pack_schema_version": RESEARCH_INTEGRITY_EVIDENCE_PACK_SCHEMA,
    "platform_profile_use": "TOPIC_FRAMING_OR_FORMAT_ONLY",
    "platform_profile_must_not_prove": [
        "KEYWORD",
        "NATURAL_VARIANT",
        "SEARCH_INTENT",
        "LOCAL_DEMAND",
        "POPULARITY",
    ],
    "evidence_postures": [
        EVIDENCE_POSTURE_METHOD_TEMPLATE,
        EVIDENCE_POSTURE_DOCUMENTED_RECORD,
    ],
    "template_mode_empirical_claims_allowed": False,
    "documented_record_requires": list(DOCUMENTED_RECORD_FIELDS),
}
RESEARCH_INTEGRITY_POLICY_2_11 = {
    **RESEARCH_INTEGRITY_POLICY_2_10,
    "evidence_pack_schema_version": CURRENT_EVIDENCE_PACK_SCHEMA,
}
TOPIC_GOVERNANCE_POLICY_2_11 = {
    "mode": "G_FREEZES_TOPIC_SLOT_W_EVIDENCE_BOUNDARY",
    "required_before_article_dispatch": True,
    "frozen_slot_fields": list(TOPIC_SLOT_FIELDS) + ["forbidden_deviations"],
    "writer_may_record_within_slot_keyword_title_and_natural_variant_adjustments": True,
    "writer_may_not_change_frozen_topic_slot": True,
    "unresolved_conflict_status": "TOPIC_EVIDENCE_CONFLICT",
    "gatekeeper_resolution_options": [
        "KEEP_SLOT",
        "NARROW_WITHIN_SLOT",
        "PAUSE",
        "OWNER_RECONFIRM_REQUIRED",
    ],
    "material_topic_change_requires_owner_reconfirmation": True,
}
LOCALE_PLATFORM_POLICY_2_10 = {
    "mode": "ARTICLE_LANGUAGE_MARKET_PRIMARY_AUDIENCE_EVIDENCE",
    "required_before_editorial_dispatch": True,
    "rows": [],
    "on_mismatch": "PLATFORM_AUDIENCE_MISMATCH_RECONFIRM_OWNER",
    "article_language_source": "USER_CONFIRMED_ARTICLE_LANGUAGE_ONLY",
    "platform_language_role": "TRANSPORT_ELIGIBILITY_ONLY_NEVER_REWRITE_LANGUAGE",
    "transport_evidence_is_not_audience_fit": True,
    "primary_audience_evidence_required": True,
    "cross_language_exception_requires_explicit_owner_confirmation": True,
}


def parse_schema_version(value: object) -> tuple[int, int] | None:
    if not isinstance(value, str):
        return None
    match = re.fullmatch(r"(\d+)\.(\d+)", value)
    return (int(match.group(1)), int(match.group(2))) if match else None


def schema_at_least(value: object, major: int, minor: int) -> bool:
    parsed = parse_schema_version(value)
    return parsed is not None and parsed >= (major, minor)


def canonical_json_sha256(value: object) -> str:
    """Hash a structured frozen decision without depending on pretty-printing."""
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def normalized_string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip().casefold() for item in value if non_empty_string(item)]


def evidence_posture_errors(
    value: object, *, require_documented_record: bool = False,
) -> list[str]:
    """Validate the declared claim boundary, never the prose itself."""
    if not isinstance(value, dict):
        return ["evidence_posture must be an object"]
    mode = value.get("mode")
    if mode not in EVIDENCE_POSTURE_MODES:
        return ["evidence_posture.mode is invalid"]
    expected_empirical = mode == EVIDENCE_POSTURE_DOCUMENTED_RECORD
    if value.get("empirical_claims_allowed") is not expected_empirical:
        return ["evidence_posture.empirical_claims_allowed does not match its mode"]
    if not non_empty_string(value.get("claim_boundary")):
        return ["evidence_posture.claim_boundary must be non-empty"]
    paths = value.get("evidence_paths")
    if not isinstance(paths, list) or not all(non_empty_string(path) for path in paths):
        return ["evidence_posture.evidence_paths must be a list of non-empty paths"]
    record = value.get("documented_record")
    if mode == EVIDENCE_POSTURE_METHOD_TEMPLATE:
        if record is not None and record != {}:
            return ["method-template evidence_posture must not contain a documented empirical record"]
        return []
    if not require_documented_record:
        return []
    if not isinstance(record, dict):
        return ["documented empirical evidence_posture requires documented_record"]
    return [
        f"documented empirical record requires {field}"
        for field in DOCUMENTED_RECORD_FIELDS
        if not non_empty_string(record.get(field))
    ]


def frozen_delivery_mapping_errors(cfg: dict, plan: dict) -> list[str]:
    """Validate the owner-visible language/market/platform decision capsule."""
    if not schema_at_least(cfg.get("schema_version"), 2, 10):
        return []
    article_id = str(plan.get("article_id", "")).strip() or "<unknown>"
    article = article_record(cfg, article_id)
    if article is None:
        return [f"pre-write mapping article {article_id} is not configured"]
    mapping = plan.get("frozen_delivery_mapping")
    if not isinstance(mapping, dict):
        return [f"pre-write manifest article {article_id}: frozen_delivery_mapping must be an object"]
    errors: list[str] = []
    language = str(article.get("language", "")).strip()
    market = str(article.get("market", "")).strip()
    for field in ("article_language", "market", "platform", "account", "fit_mode"):
        if not non_empty_string(mapping.get(field)):
            errors.append(f"pre-write manifest article {article_id}: frozen_delivery_mapping.{field} must be non-empty")
    if str(mapping.get("article_language", "")).strip().casefold() != language.casefold():
        errors.append(f"pre-write manifest article {article_id}: frozen delivery language must match campaign article language")
    if str(mapping.get("market", "")).strip().casefold() != market.casefold():
        errors.append(f"pre-write manifest article {article_id}: frozen delivery market must match campaign article market")
    fit_mode = mapping.get("fit_mode")
    if fit_mode not in DELIVERY_FIT_MODES:
        errors.append(f"pre-write manifest article {article_id}: frozen delivery fit_mode is invalid")
    exception = mapping.get("cross_language_exception")
    if fit_mode == PRIMARY_AUDIENCE_FIT and exception is not None:
        errors.append(f"pre-write manifest article {article_id}: primary-audience mapping cannot carry a cross-language exception")
    if fit_mode == CROSS_LANGUAGE_EXCEPTION_FIT:
        if not isinstance(exception, dict):
            errors.append(f"pre-write manifest article {article_id}: cross-language mapping requires an exception object")
        else:
            for field in ("reason", "requested_owner_confirmation_literal"):
                if not non_empty_string(exception.get(field)):
                    errors.append(f"pre-write manifest article {article_id}: cross-language exception requires {field}")
    for error in evidence_posture_errors(plan.get("evidence_posture")):
        errors.append(f"pre-write manifest article {article_id}: {error}")
    return errors


def topic_slot_errors(cfg: dict, plan: dict) -> list[str]:
    """Validate G's frozen topic boundary without scoring keywords or prose."""
    if not schema_at_least(cfg.get("schema_version"), 2, 11):
        return []
    article_id = str(plan.get("article_id", "")).strip() or "<unknown>"
    slot = plan.get("topic_slot")
    if not isinstance(slot, dict):
        return [f"pre-write manifest article {article_id}: topic_slot must be an object"]
    errors = [
        f"pre-write manifest article {article_id}: topic_slot.{field} must be non-empty"
        for field in TOPIC_SLOT_FIELDS
        if not non_empty_string(slot.get(field))
    ]
    deviations = slot.get("forbidden_deviations")
    if not isinstance(deviations, list) or not deviations or not all(non_empty_string(item) for item in deviations):
        errors.append(f"pre-write manifest article {article_id}: topic_slot.forbidden_deviations must be a non-empty list of strings")
    mapping = plan.get("frozen_delivery_mapping")
    if isinstance(mapping, dict) and non_empty_string(slot.get("market")):
        if str(slot.get("market")).strip().casefold() != str(mapping.get("market", "")).strip().casefold():
            errors.append(f"pre-write manifest article {article_id}: topic_slot.market must match frozen_delivery_mapping.market")
    return errors


def topic_slot_alignment_errors(plan: object, evidence: object) -> list[str]:
    """Reject unresolved W→G topic conflicts; leave semantic judgment to people."""
    if not isinstance(plan, dict):
        return ["article contract lacks the frozen topic_slot"]
    slot = plan.get("topic_slot")
    if not isinstance(slot, dict) or not non_empty_string(slot.get("slot_id")):
        return ["article contract lacks a valid frozen topic_slot"]
    if not isinstance(evidence, dict):
        return ["research evidence pack is invalid"]
    alignment = evidence.get("topic_slot_alignment")
    if not isinstance(alignment, dict):
        return ["research evidence pack requires topic_slot_alignment"]
    errors: list[str] = []
    if alignment.get("frozen_slot_id") != slot.get("slot_id"):
        errors.append("research topic_slot_alignment.frozen_slot_id does not match the frozen topic_slot")
    status = alignment.get("status")
    if status not in TOPIC_SLOT_ALIGNMENT_STATUSES:
        errors.append("research topic_slot_alignment.status is invalid")
    adjustments = alignment.get("within_slot_adjustments")
    if not isinstance(adjustments, list) or not all(non_empty_string(item) for item in adjustments):
        errors.append("research topic_slot_alignment.within_slot_adjustments must be a list of non-empty strings")
    resolved_conflicts = alignment.get("resolved_conflicts")
    if not isinstance(resolved_conflicts, list):
        errors.append("research topic_slot_alignment.resolved_conflicts must be a list")
    else:
        conflict_ids: set[str] = set()
        decision_ids: set[str] = set()
        for resolution in resolved_conflicts:
            if not isinstance(resolution, dict):
                errors.append("research topic_slot_alignment.resolved_conflicts entries must be objects")
                continue
            for field in ("conflict_id", "decision_id", "reason", "decision", "gatekeeper_agent_id", "decided_at"):
                if not non_empty_string(resolution.get(field)):
                    errors.append(f"resolved topic conflict requires {field}")
            refs = resolution.get("evidence_refs")
            if not isinstance(refs, list) or not refs or not all(non_empty_string(ref) for ref in refs):
                errors.append("resolved topic conflict requires evidence_refs")
            conflict_id = resolution.get("conflict_id")
            decision_id = resolution.get("decision_id")
            if non_empty_string(conflict_id):
                if conflict_id in conflict_ids:
                    errors.append("resolved topic conflict IDs must be unique")
                conflict_ids.add(conflict_id)
            if non_empty_string(decision_id):
                if decision_id in decision_ids:
                    errors.append("resolved topic decision IDs must be unique")
                decision_ids.add(decision_id)
            if resolution.get("decision") not in TOPIC_CONFLICT_RESOLUTION_ACTIONS:
                errors.append("resolved topic conflict decision must be KEEP_SLOT or NARROW_WITHIN_SLOT")
            if non_empty_string(resolution.get("decided_at")) and parse_timestamp(resolution.get("decided_at")) is None:
                errors.append("resolved topic conflict decided_at must be a timezone-aware ISO-8601 timestamp")
    conflict = alignment.get("active_conflict")
    if status == "ALIGNED":
        if conflict is not None:
            errors.append("aligned research topic slot must not retain an active_conflict")
    elif status == "TOPIC_EVIDENCE_CONFLICT":
        if not isinstance(conflict, dict):
            errors.append("TOPIC_EVIDENCE_CONFLICT requires active_conflict")
        else:
            for field in ("conflict_id", "reason", "proposed_action"):
                if not non_empty_string(conflict.get(field)):
                    errors.append(f"TOPIC_EVIDENCE_CONFLICT requires active_conflict.{field}")
            refs = conflict.get("evidence_refs")
            if not isinstance(refs, list) or not refs or not all(non_empty_string(ref) for ref in refs):
                errors.append("TOPIC_EVIDENCE_CONFLICT requires active_conflict.evidence_refs")
            if conflict.get("proposed_action") not in TOPIC_CONFLICT_PROPOSED_ACTIONS:
                errors.append("TOPIC_EVIDENCE_CONFLICT active_conflict.proposed_action is invalid")
        errors.append("TOPIC_EVIDENCE_CONFLICT: resolve with the registered campaign G before FULL_REVIEW")
    return errors


def topic_conflict_resolution_errors(workspace: Path, context: dict, alignment: object) -> list[str]:
    """Bind a resolved W→G topic exception to the already-registered G task.

    Normal aligned work carries an empty list and pays no extra model turn. A
    conflict resolved inside the frozen slot remains auditable without adding
    a reviewer or reopening the owner plan.
    """
    if not isinstance(alignment, dict):
        return []
    resolutions = alignment.get("resolved_conflicts")
    if not isinstance(resolutions, list) or not resolutions:
        return []
    state_record, state_error = read_workspace_json(workspace, "state.json")
    if state_error or state_record is None:
        return [state_error or "topic conflict resolution requires state.json"]
    orchestration = state_record.get("orchestration")
    registered_g = (
        orchestration.get("campaign_gatekeeper_agent_id")
        if isinstance(orchestration, dict) else None
    )
    tasks = orchestration.get("tasks") if isinstance(orchestration, dict) else None
    if not non_empty_string(registered_g):
        return ["resolved topic conflict requires the registered campaign gatekeeper agent ID"]
    if not isinstance(tasks, list):
        return ["resolved topic conflict requires the visible task ledger"]
    article_id = context.get("article_id")
    errors: list[str] = []
    for resolution in resolutions:
        if not isinstance(resolution, dict):
            continue
        decision_id = resolution.get("decision_id")
        conflict_id = resolution.get("conflict_id")
        decision = resolution.get("decision")
        if resolution.get("gatekeeper_agent_id") != registered_g:
            errors.append("resolved topic conflict must name the registered campaign gatekeeper")
            continue
        matches = [
            task for task in tasks
            if isinstance(task, dict)
            and task.get("article_id") == article_id
            and task.get("role") == CAMPAIGN_GATEKEEPER_ROLE
            and task.get("agent_id") == registered_g
            and task.get("workflow_stage") == TOPIC_CONFLICT_DECISION_STAGE
            and task.get("status") == "COMPLETED"
            and task.get("conflict_id") == conflict_id
            and task.get("decision_id") == decision_id
            and task.get("decision") == decision
        ]
        if len(matches) != 1:
            errors.append(
                "resolved topic conflict requires exactly one completed "
                "TOPIC_EVIDENCE_DECISION task by the registered campaign G"
            )
    return errors


def protected_prewrite_scope_snapshot(cfg: dict, manifest: dict) -> dict:
    """Return only decisions that need a fresh owner receipt when changed."""
    articles: list[dict] = []
    plans = manifest.get("article_plans")
    plans_by_id = {
        str(plan.get("article_id", "")).strip(): plan
        for plan in plans if isinstance(plan, dict)
    } if isinstance(plans, list) else {}
    configured = cfg.get("articles")
    for article in configured if isinstance(configured, list) else []:
        if not isinstance(article, dict):
            continue
        article_id = str(article.get("article_id", "")).strip()
        plan = plans_by_id.get(article_id, {})
        mapping = plan.get("frozen_delivery_mapping") if isinstance(plan, dict) else {}
        posture = plan.get("evidence_posture") if isinstance(plan, dict) else {}
        topic_slot = plan.get("topic_slot") if isinstance(plan, dict) else None
        mapping = mapping if isinstance(mapping, dict) else {}
        posture = posture if isinstance(posture, dict) else {}
        protected_article = {
            "article_id": article_id,
            "article_language": str(article.get("language", "")).strip(),
            "market": str(article.get("market", "")).strip(),
            "platform": str(mapping.get("platform", "")).strip(),
            "account": str(mapping.get("account", "")).strip(),
            "fit_mode": mapping.get("fit_mode"),
            "evidence_posture_mode": posture.get("mode"),
            "empirical_claims_allowed": posture.get("empirical_claims_allowed"),
        }
        if schema_at_least(cfg.get("schema_version"), 2, 11):
            protected_article["topic_slot"] = topic_slot
        articles.append(protected_article)
    return {"schema_version": "1.0", "articles": sorted(articles, key=lambda item: item["article_id"])}


def confirmed_scope_snapshot_errors(cfg: dict, manifest: dict) -> list[str]:
    if not schema_at_least(cfg.get("schema_version"), 2, 10):
        return []
    actual = protected_prewrite_scope_snapshot(cfg, manifest)
    recorded = manifest.get("confirmed_scope_snapshot")
    if not isinstance(recorded, dict):
        return ["confirmed pre-write plan requires confirmed_scope_snapshot"]
    if recorded != actual:
        return ["SCOPE_RECONFIRM_REQUIRED: protected pre-write topic slot, mapping or evidence posture changed"]
    return []


def schema_2_14_or_newer(cfg_or_version: object) -> bool:
    """Keep schema-2.13 routes readable without reclassifying old R approvals."""
    version = cfg_or_version.get("schema_version") if isinstance(cfg_or_version, dict) else cfg_or_version
    return schema_at_least(version, 2, 14)


def prewrite_plan_schema_for_campaign(cfg_or_version: object) -> str:
    """Select the manifest version without invalidating a completed 2.13 plan."""
    return CURRENT_PREWRITE_PLAN_SCHEMA if schema_2_14_or_newer(cfg_or_version) else PREVIOUS_PREWRITE_PLAN_SCHEMA


def author_qa_route(review_effort: object) -> bool:
    return isinstance(review_effort, dict) and review_effort.get("tier") == "AUTHOR_QA_INTEGRATED"


def independent_review_route(review_effort: object) -> bool:
    return isinstance(review_effort, dict) and review_effort.get("tier") in {
        "INDEPENDENT_R_ESCALATION",
        "STANDARD_INTEGRATED_REVIEW",
        "ELEVATED_EARLY_CHALLENGE",
    }


def model_first_review_effort_errors(value: object, *, cfg_or_version: object = CURRENT_CAMPAIGN_SCHEMA) -> list[str]:
    """Validate a frozen quality route without using field mechanics as a quality score.

    Schema-2.14 introduces WQ but keeps the old two independent-R tiers
    readable.  In particular, a historical ``STANDARD_INTEGRATED_REVIEW``
    cannot be reinterpreted as the new author-QA route merely because a user
    upgrades the local skill.
    """
    if not isinstance(value, dict):
        return ["review_effort must be an object"]
    tier = value.get("tier")
    reasons = value.get("reasons")
    if not isinstance(reasons, list) or not all(non_empty_string(reason) for reason in reasons):
        return ["review_effort.reasons must be a list of non-empty strings"]
    if not schema_2_14_or_newer(cfg_or_version):
        if tier not in {"STANDARD_INTEGRATED_REVIEW", "ELEVATED_EARLY_CHALLENGE"}:
            return ["schema 2.13 and earlier review_effort.tier must be STANDARD_INTEGRATED_REVIEW or ELEVATED_EARLY_CHALLENGE"]
        expected_gate = (
            "INTEGRATED_IN_FULL_REVIEW"
            if tier == "STANDARD_INTEGRATED_REVIEW"
            else "SEPARATE_RESEARCH_REVIEW_REQUIRED"
        )
        if value.get("research_gate") != expected_gate:
            return [f"review_effort.research_gate must be {expected_gate}"]
        if tier == "ELEVATED_EARLY_CHALLENGE" and not reasons:
            return ["elevated review_effort requires at least one risk reason"]
        return []

    if tier == "AUTHOR_QA_INTEGRATED":
        expected = {
            "quality_mode": "WQ_SHARED_CONTEXT",
            "research_gate": "INTEGRATED_IN_AUTHOR_QA",
            "independent_reviewer_required": False,
        }
        for field, expected_value in expected.items():
            if value.get(field) != expected_value:
                return [f"AUTHOR_QA_INTEGRATED review_effort.{field} must be {expected_value}"]
        return []
    if tier == "INDEPENDENT_R_ESCALATION":
        if value.get("quality_mode") != "WR_INDEPENDENT":
            return ["INDEPENDENT_R_ESCALATION review_effort.quality_mode must be WR_INDEPENDENT"]
        if value.get("research_gate") not in {"INTEGRATED_IN_FULL_REVIEW", "SEPARATE_RESEARCH_REVIEW_REQUIRED"}:
            return ["INDEPENDENT_R_ESCALATION review_effort.research_gate must be INTEGRATED_IN_FULL_REVIEW or SEPARATE_RESEARCH_REVIEW_REQUIRED"]
        if value.get("independent_reviewer_required") is not True:
            return ["INDEPENDENT_R_ESCALATION requires independent_reviewer_required=true"]
        if not reasons:
            return ["INDEPENDENT_R_ESCALATION requires at least one recorded risk or owner reason"]
        return []

    # Explicit legacy compatibility remains usable in a 2.14 workspace only
    # for a pre-existing or deliberately retained independent-R route.
    if tier == "STANDARD_INTEGRATED_REVIEW":
        if value.get("research_gate") != "INTEGRATED_IN_FULL_REVIEW":
            return ["review_effort.research_gate must be INTEGRATED_IN_FULL_REVIEW"]
        return []
    if tier == "ELEVATED_EARLY_CHALLENGE":
        if value.get("research_gate") != "SEPARATE_RESEARCH_REVIEW_REQUIRED":
            return ["review_effort.research_gate must be SEPARATE_RESEARCH_REVIEW_REQUIRED"]
        if not reasons:
            return ["elevated review_effort requires at least one risk reason"]
        return []
    return ["review_effort.tier must be AUTHOR_QA_INTEGRATED, INDEPENDENT_R_ESCALATION, STANDARD_INTEGRATED_REVIEW or ELEVATED_EARLY_CHALLENGE"]


def review_effort_for_plan(cfg: dict, plan: dict) -> tuple[dict, list[str]]:
    """Return the frozen article quality route; old campaigns retain independent R."""
    if not schema_at_least(cfg.get("schema_version"), 2, 6):
        return dict(LEGACY_REVIEW_EFFORT), []
    value = plan.get("review_effort")
    errors = model_first_review_effort_errors(value, cfg_or_version=cfg)
    if errors:
        return {}, errors
    assert isinstance(value, dict)
    return dict(value), []


def research_review_required(review_effort: object) -> bool:
    return isinstance(review_effort, dict) and (
        review_effort.get("tier") == "ELEVATED_EARLY_CHALLENGE"
        or (
            review_effort.get("tier") == "INDEPENDENT_R_ESCALATION"
            and review_effort.get("research_gate") == "SEPARATE_RESEARCH_REVIEW_REQUIRED"
        )
    )


def prewrite_plan_submission_errors(cfg: dict, manifest: dict) -> list[str]:
    """Validate enough of a pending plan to show it to the owner or bind it."""
    articles = cfg.get("articles")
    configured_ids = [
        str(article.get("article_id", "")).strip()
        for article in articles if isinstance(article, dict)
    ] if isinstance(articles, list) else []
    plans = manifest.get("article_plans")
    plan_ids = [
        str(plan.get("article_id", "")).strip()
        for plan in plans if isinstance(plan, dict)
    ] if isinstance(plans, list) else []
    errors: list[str] = []
    # Select the version branch before comparing the manifest.  Writing this
    # as ``if schema >= 2.11 and wrong ... elif schema >= 2.10 and wrong``
    # makes a valid 2.11/1.7 pair fall through into the historical 2.10/1.6
    # error branch.
    if schema_at_least(cfg.get("schema_version"), 2, 11):
        expected_schema = prewrite_plan_schema_for_campaign(cfg)
        if manifest.get("schema_version") != expected_schema:
            errors.append(f"schema 2.11+ pre-write manifest schema_version must be {expected_schema}")
    elif schema_at_least(cfg.get("schema_version"), 2, 10):
        if manifest.get("schema_version") != RESEARCH_INTEGRITY_PREWRITE_PLAN_SCHEMA:
            errors.append(f"schema 2.10 pre-write manifest schema_version must be {RESEARCH_INTEGRITY_PREWRITE_PLAN_SCHEMA}")
    if not configured_ids or len(configured_ids) != len(articles or []) or len(set(configured_ids)) != len(configured_ids):
        errors.append("campaign.json requires unique non-empty article IDs before owner confirmation")
    if not isinstance(plans, list) or len(plan_ids) != len(plans) or not exact_article_coverage(plan_ids, configured_ids):
        errors.append("pre-write plan must cover every configured article exactly once")
        return errors
    summary = manifest.get("campaign_summary")
    if not isinstance(summary, dict) or any(
        not non_empty_string(summary.get(section))
        for section in MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS
    ):
        errors.append("pre-write plan requires every campaign-summary section")
    slot_ids: list[str] = []
    for plan in plans:
        if not isinstance(plan, dict):
            continue
        article_id = str(plan.get("article_id", "")).strip() or "<unknown>"
        for section in MODEL_FIRST_PREWRITE_PLAN_SECTIONS:
            if not non_empty_string(plan.get(section)):
                errors.append(f"pre-write manifest article {article_id}: missing {section}")
        for error in model_first_review_effort_errors(plan.get("review_effort"), cfg_or_version=cfg):
            errors.append(f"pre-write manifest article {article_id}: {error}")
        errors.extend(frozen_delivery_mapping_errors(cfg, plan))
        errors.extend(topic_slot_errors(cfg, plan))
        slot = plan.get("topic_slot")
        if isinstance(slot, dict) and non_empty_string(slot.get("slot_id")):
            slot_ids.append(str(slot["slot_id"]).strip())
    duplicates = sorted(slot_id for slot_id, count in Counter(slot_ids).items() if count > 1)
    if duplicates:
        errors.append("pre-write topic_slot.slot_id values must be unique: " + ", ".join(duplicates))
    return errors


def non_empty_string(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def content_value_policy_errors(policy: object, *, required_cta: bool = False) -> list[str]:
    if not isinstance(policy, dict):
        return ["content value policy must be an object"]
    expected = {
        "mode": "READER_VALUE_FIRST",
        "primary_purpose": "STANDALONE_ANSWER_TO_READER_TASK",
        "cta_role": "REQUIRED_SECONDARY_TRANSPARENT_RECOMMENDATION" if required_cta else "OPTIONAL_SECONDARY_TRANSPARENT_RECOMMENDATION",
        "cta_requires_identifiable_product_and_claim_basis": True,
        "cta_requires_relationship_disclosure_when_applicable": True,
        "cta_must_not_replace_or_dominate_reader_value": True,
    }
    if required_cta:
        expected["cta_must_be_present"] = True
    return [f"content value policy requires {key}={value!r}" for key, value in expected.items() if policy.get(key) != value]


def content_value_article_errors(article: object, *, required_cta: bool = False) -> list[str]:
    if not isinstance(article, dict):
        return ["content value declaration requires an article object"]
    article_id = str(article.get("article_id", "")).strip() or "<unknown>"
    errors: list[str] = []
    if not non_empty_string(article.get("reader_value_promise")):
        errors.append(f"article {article_id}: reader_value_promise is required")
    cta = article.get("cta")
    if not isinstance(cta, dict):
        return errors + [f"article {article_id}: cta must be an object"]
    mode = cta.get("mode")
    if required_cta:
        if mode != "SECONDARY_RECOMMENDATION":
            errors.append(f"article {article_id}: cta.mode must be SECONDARY_RECOMMENDATION in schema 2.2+")
        for field in REQUIRED_CTA_RECOMMENDATION_FIELDS:
            if not non_empty_string(cta.get(field)):
                errors.append(f"article {article_id}: required secondary CTA requires {field}")
    elif mode == "NONE":
        if any(cta.get(field) is not None and cta.get(field) != "" for field in CTA_RECOMMENDATION_FIELDS):
            errors.append(f"article {article_id}: CTA NONE may not carry recommendation fields")
    elif mode == "SECONDARY_RECOMMENDATION":
        for field in CTA_RECOMMENDATION_FIELDS:
            if not non_empty_string(cta.get(field)):
                errors.append(f"article {article_id}: secondary CTA requires {field}")
    else:
        errors.append(f"article {article_id}: cta.mode must be NONE or SECONDARY_RECOMMENDATION")
    return errors


def normalized_cta_declaration(value: object) -> object:
    if not isinstance(value, dict) or value.get("mode") != "NONE":
        return value
    return {key: item for key, item in value.items() if key not in CTA_RECOMMENDATION_FIELDS}


def article_package_declaration_errors(campaign_article: object, package: object, *, required_cta: bool = False, package_schema: str | set[str] | None = None) -> list[str]:
    if not isinstance(campaign_article, dict):
        return ["campaign article declaration must be an object"]
    if not isinstance(package, dict):
        return ["article package must be an object"]
    article_id = str(campaign_article.get("article_id", "")).strip() or "<unknown>"
    errors = content_value_article_errors(package, required_cta=required_cta)
    expected_package_schemas = (
        {package_schema} if isinstance(package_schema, str)
        else package_schema or ({"1.2"} if required_cta else {"1.1"})
    )
    if package.get("schema_version") not in expected_package_schemas:
        expected = ", ".join(sorted(expected_package_schemas))
        errors.append(f"article {article_id}: article package schema_version must be one of {expected}")
    if str(package.get("article_id", "")).strip() != article_id:
        errors.append(f"article {article_id}: article package article_id does not match")
    if package.get("reader_value_promise") != campaign_article.get("reader_value_promise"):
        errors.append(f"article {article_id}: article package reader_value_promise does not match frozen campaign declaration")
    package_cta = package.get("cta") if required_cta else normalized_cta_declaration(package.get("cta"))
    campaign_cta = campaign_article.get("cta") if required_cta else normalized_cta_declaration(campaign_article.get("cta"))
    if package_cta != campaign_cta:
        errors.append(f"article {article_id}: article package cta does not match frozen campaign declaration")
    return errors


def package_artifact_source_errors(package: object) -> list[str]:
    """Validate the compact source chain without scoring editorial content."""
    if not isinstance(package, dict):
        return ["article package must be an object"]
    sources = package.get("artifact_sources")
    expected = {
        "evidence_pack": ("research/evidence-pack.json", "ARTICLE_CLAIM_AND_SEO_DECISION_INDEX"),
        "visual_manifest": ("canonical/visual-manifest.json", "SINGLE_SOURCE_FOR_IMAGE_ASSETS_ALT_CAPTIONS_AND_PLACEMENT"),
    }
    schema = package.get("schema_version")
    if schema == "1.3":
        expected["handoff_manifest"] = ("handoff/handoff-manifest.json", "DERIVED_HANDOFF_ARTIFACT_AND_HASH_INDEX")
    elif schema in PACKAGE_SCHEMA_WITH_METADATA_SOURCE:
        expected["metadata"] = ("canonical/metadata.json", "SINGLE_SOURCE_FOR_TITLE_AND_SEO_METADATA")
    errors: list[str] = []
    if not isinstance(sources, dict):
        return ["article package schema 1.3 requires artifact_sources"]
    if sources.get("manual_retelling") != "PROHIBITED":
        errors.append("article package artifact_sources must prohibit manual retelling")
    for key, (path, role) in expected.items():
        source = sources.get(key)
        if not isinstance(source, dict):
            errors.append(f"article package artifact_sources requires {key}")
            continue
        if source.get("path") != path:
            errors.append(f"article package {key} path is invalid")
        if source.get("role") != role:
            errors.append(f"article package {key} role is invalid")
        if not non_empty_string(source.get("sha256")):
            errors.append(f"article package {key} requires sha256 or a lifecycle placeholder")
    if schema == "1.3":
        errors.extend(final_visual_payload_delta_errors(package.get("final_visual_payload_delta")))
    elif schema in PACKAGE_SCHEMA_WITH_METADATA_SOURCE:
        if "handoff_manifest" in sources:
            errors.append("current article package must not point back to its derived handoff manifest")
        if schema == CURRENT_ARTICLE_PACKAGE_SCHEMA:
            if package.get("canonical_path") != "canonical/article.html":
                errors.append("article package schema 1.5 canonical_path must be canonical/article.html")
            if package.get("canonical_format") != "RICH_TEXT_HTML_FRAGMENT":
                errors.append("article package schema 1.5 canonical_format must be RICH_TEXT_HTML_FRAGMENT")
    else:
        errors.append("article package artifact optimization supports schema_version 1.3, 1.4 or 1.5")
    return errors


def final_visual_payload_delta_errors(
    delta: object, *, require_approved: bool = False, workspace: Path | None = None,
    expected_visual_manifest_sha256: str | None = None,
    expected_visual_payload_sha256: str | None = None,
    expected_review_index_sha256: str | None = None,
) -> list[str]:
    """Check the compact R visual-delta receipt without re-scoring payload semantics."""
    if not isinstance(delta, dict):
        return ["article package schema 1.3 requires final_visual_payload_delta"]
    errors: list[str] = []
    if delta.get("precondition") != "TEXT_AND_SEO_FIELDS_STABLE" or delta.get("scope") != "VISUAL_MANIFEST_ASSETS_AND_COMPILED_PAYLOAD_ONLY":
        errors.append("article package final visual payload delta boundary is invalid")
    result = delta.get("reviewer_result")
    if result not in {"PENDING", FINAL_VISUAL_DELTA_RESULT}:
        errors.append("article package final visual payload delta must be PENDING or APPROVED")
    if not non_empty_string(delta.get("report_path")):
        errors.append("article package final visual payload delta requires report_path")
    if result == "PENDING" and any(delta.get(field) not in {None, ""} for field in FINAL_VISUAL_DELTA_FIELDS):
        errors.append("pending final visual payload delta may not carry approval bindings")
    if not require_approved:
        return errors
    if result != FINAL_VISUAL_DELTA_RESULT:
        errors.append("handoff requires an APPROVED final visual payload delta")
    for field in FINAL_VISUAL_DELTA_FIELDS:
        if not non_empty_string(delta.get(field)):
            errors.append(f"approved final visual payload delta requires {field}")
    if workspace is not None and non_empty_string(delta.get("report_path")):
        report, report_error = workspace_file(workspace, delta.get("report_path"), label="final visual payload delta report")
        if report_error:
            errors.append(report_error)
        elif report is not None and delta.get("report_sha256") != sha256_file(report):
            errors.append("final visual payload delta report_sha256 does not match")
    if expected_visual_manifest_sha256 is not None and delta.get("reviewed_visual_manifest_sha256") != expected_visual_manifest_sha256:
        errors.append("final visual payload delta visual manifest hash does not match")
    if expected_visual_payload_sha256 is not None and delta.get("reviewed_visual_payload_sha256") != expected_visual_payload_sha256:
        errors.append("final visual payload delta visual payload hash does not match")
    if expected_review_index_sha256 is not None and delta.get("review_index_sha256") != expected_review_index_sha256:
        errors.append("final visual payload delta review index hash does not match")
    return errors


def is_http_url(value: object) -> bool:
    if not non_empty_string(value):
        return False
    parsed = urlparse(value.strip())
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc) and parsed.username is None and parsed.password is None


def parse_timestamp(value: object) -> datetime | None:
    """Accept only timezone-aware ISO-8601 timestamps for auditable public-QA turns."""
    if not non_empty_string(value):
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(timezone.utc)


def workspace_file(workspace: Path, value: object, *, label: str) -> tuple[Path | None, str | None]:
    """Resolve a campaign-local evidence file without permitting traversal outside the workspace."""
    if not non_empty_string(value):
        return None, f"{label} requires a non-empty relative path"
    candidate = Path(value.strip())
    if candidate.is_absolute():
        return None, f"{label} must stay relative to the campaign workspace"
    root = workspace.resolve()
    resolved = (workspace / candidate).resolve()
    if resolved == root or root not in resolved.parents:
        return None, f"{label} is outside the campaign workspace"
    if not resolved.is_file():
        return None, f"{label} does not exist"
    return resolved, None


def owner_confirmation_receipt_errors(workspace: Path, receipt: object) -> list[str]:
    """Require an owner-originated artifact rather than a self-typed status flip."""
    if not isinstance(receipt, dict):
        return ["owner confirmation receipt must be an object"]
    errors: list[str] = []
    if receipt.get("source_type") not in OWNER_CONFIRMATION_RECEIPT_TYPES:
        errors.append("owner confirmation receipt source_type is invalid")
    source_value = receipt.get("source_path")
    source_path, source_error = workspace_file(
        workspace, source_value, label="owner confirmation receipt source_path",
    )
    if source_error:
        errors.append(source_error)
    elif source_path is not None:
        relative = relative_path(workspace, source_path)
        if not relative.startswith(OWNER_CONFIRMATION_RECEIPT_DIRECTORY + "/"):
            errors.append("owner confirmation receipt must be stored under evidence/owner-confirmations")
        elif not source_path.read_text(encoding="utf-8").strip():
            errors.append("owner confirmation receipt source file must not be empty")
        if receipt.get("source_sha256") != sha256_file(source_path):
            errors.append("owner confirmation receipt source_sha256 does not match")
    if not non_empty_string(receipt.get("source_locator")):
        errors.append("owner confirmation receipt requires source_locator")
    if parse_timestamp(receipt.get("recorded_at")) is None:
        errors.append("owner confirmation receipt requires a timezone-aware recorded_at")
    return errors


def json_object_file(path: Path, *, label: str) -> tuple[dict | None, str | None]:
    try:
        parsed = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return None, f"{label} must be valid JSON: {exc}"
    if not isinstance(parsed, dict):
        return None, f"{label} must contain a JSON object"
    return parsed, None


def shared_campaign_evidence_reuse_errors(workspace: Path, evidence: object) -> list[str]:
    """Validate only the provenance of an optional campaign-local cache hit.

    This intentionally does not decide whether the selected source is fresh,
    natural for the target language, or appropriate for the reader task.  W
    records that article-level reasoning and R reviews it.  The harness only
    ensures that a declared reuse points at a real, bounded record and never
    reuses the volatile/account/editor-transport classes.
    """
    if not isinstance(evidence, dict):
        return ["research evidence pack must be an object for shared evidence reuse"]
    has_shared = "campaign_shared_evidence" in evidence
    has_delta = "article_delta" in evidence
    if not has_shared and not has_delta:
        return []
    errors: list[str] = []
    if not has_shared:
        return ["research evidence pack article_delta requires campaign_shared_evidence"]
    if not has_delta:
        return ["research evidence pack campaign_shared_evidence requires article_delta"]

    shared = evidence.get("campaign_shared_evidence")
    delta = evidence.get("article_delta")
    if not isinstance(shared, dict):
        errors.append("research evidence pack campaign_shared_evidence must be an object")
    if not isinstance(delta, dict):
        errors.append("research evidence pack article_delta must be an object")
    if errors:
        return errors
    assert isinstance(shared, dict)
    assert isinstance(delta, dict)

    for field in ("decision", "freshness_or_scope_check"):
        if not non_empty_string(delta.get(field)):
            errors.append(f"research evidence pack article_delta requires {field}")
    additional_refs = delta.get("additional_evidence_refs")
    if not isinstance(additional_refs, list) or not all(non_empty_string(ref) for ref in additional_refs):
        errors.append("research evidence pack article_delta additional_evidence_refs must be a list of non-empty references")

    shared_path, shared_error = workspace_file(
        workspace,
        shared.get("path"),
        label="campaign shared evidence pack",
    )
    if shared_error:
        return errors + [shared_error]
    assert shared_path is not None
    if relative_path(workspace, shared_path) != "evidence/shared/campaign-evidence-pack.json":
        errors.append("campaign shared evidence pack must be stored at evidence/shared/campaign-evidence-pack.json")
    declared_sha256 = shared.get("sha256")
    if not non_empty_string(declared_sha256):
        errors.append("campaign shared evidence pack requires sha256")
    elif declared_sha256 != sha256_file(shared_path):
        errors.append("campaign shared evidence pack sha256 does not match")

    record_ids = shared.get("record_ids")
    if (
        not isinstance(record_ids, list)
        or not record_ids
        or not all(non_empty_string(record_id) for record_id in record_ids)
        or len({record_id.strip() for record_id in record_ids if isinstance(record_id, str)}) != len(record_ids)
    ):
        return errors + ["campaign shared evidence pack record_ids must be non-empty and unique"]

    shared_pack, shared_pack_error = json_object_file(shared_path, label="campaign shared evidence pack")
    if shared_pack_error or shared_pack is None:
        return errors + [shared_pack_error or "campaign shared evidence pack is invalid"]
    records = shared_pack.get("records")
    if not isinstance(records, list):
        return errors + ["campaign shared evidence pack requires a records list"]
    if not records:
        return errors + ["referenced campaign shared evidence pack must contain at least one record"]
    records_by_id: dict[str, dict] = {}
    for index, record in enumerate(records, start=1):
        if not isinstance(record, dict) or not non_empty_string(record.get("id")):
            errors.append(f"campaign shared evidence pack record {index} requires id")
            continue
        record_id = record["id"].strip()
        if record_id in records_by_id:
            errors.append(f"campaign shared evidence pack record IDs must be unique: {record_id}")
            continue
        records_by_id[record_id] = record

    reusable_kinds = {
        "GLOBAL_ENGLISH_TRENDS",
        "BRAND_SITE_VARIANT",
        "REGIONAL_SERP_VARIANT",
    }
    for record_id in (record_id.strip() for record_id in record_ids):
        record = records_by_id.get(record_id)
        if record is None:
            errors.append(f"campaign shared evidence pack record_id does not exist: {record_id}")
            continue
        if record.get("kind") not in reusable_kinds:
            errors.append(f"campaign shared evidence record is not reusable: {record_id}")
    return errors


def normalized_snapshot_sha256(snapshot: dict) -> str:
    payload = dict(snapshot)
    payload.pop("snapshot_sha256", None)
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def public_qa_policy_errors(policy: object, *, expected: dict | None = None) -> list[str]:
    if not isinstance(policy, dict):
        return ["public QA policy must be an object"]
    expected = PUBLIC_QA_POLICY_2_3 if expected is None else expected
    return [
        f"public QA policy requires {key}={value!r}"
        for key, value in expected.items()
        if policy.get(key) != value
    ]


def batch_gate_policy_errors(policy: object, *, expected: dict | None = None) -> list[str]:
    if not isinstance(policy, dict):
        return ["batch gate policy must be an object"]
    expected = GATE_BATCH_POLICY_2_7 if expected is None else expected
    return [
        f"batch gate policy requires {key}={value!r}"
        for key, value in expected.items()
        if policy.get(key) != value
    ]


def platform_limitation_errors(limitation: object, *, prefix: str) -> list[str]:
    if not isinstance(limitation, dict):
        return [f"{prefix}: platform limitation must be an object"]
    errors: list[str] = []
    for field in ("id", "observed_behavior"):
        if not non_empty_string(limitation.get(field)):
            errors.append(f"{prefix}: platform limitation requires {field}")
    scope = limitation.get("scope")
    if not isinstance(scope, dict):
        errors.append(f"{prefix}: platform limitation requires a scoped observation")
    else:
        for field in LIMITATION_SCOPE_FIELDS:
            if not non_empty_string(scope.get(field)):
                errors.append(f"{prefix}: platform limitation scope requires {field}")
    evidence_paths = limitation.get("evidence_paths")
    if not isinstance(evidence_paths, list) or not evidence_paths or any(not non_empty_string(path) for path in evidence_paths):
        errors.append(f"{prefix}: platform limitation requires non-empty evidence_paths")
    affected = limitation.get("affected_contract_items")
    if not isinstance(affected, list) or not affected or any(not non_empty_string(item) for item in affected):
        errors.append(f"{prefix}: platform limitation requires affected_contract_items")
    if not non_empty_string(limitation.get("owner_acceptance")):
        errors.append(f"{prefix}: platform limitation requires owner_acceptance")
    if limitation.get("not_generalizable") is not True:
        errors.append(f"{prefix}: platform limitation must set not_generalizable=true")
    return errors


def public_return_receipt_errors(receipt: object, *, expected_article_id: object = None) -> list[str]:
    if not isinstance(receipt, dict):
        return ["public return receipt must be an object"]
    errors: list[str] = []
    if receipt.get("schema_version") != "1.0":
        errors.append("public return receipt schema_version must be 1.0")
    article_id = str(receipt.get("article_id", "")).strip()
    if not article_id:
        errors.append("public return receipt requires article_id")
    elif expected_article_id is not None and article_id != expected_article_id:
        errors.append("public return receipt article_id does not match article package")
    if not is_http_url(receipt.get("public_url")):
        errors.append("public return receipt requires an http(s) public_url")
    if receipt.get("human_state") not in HUMAN_RETURN_STATES:
        errors.append("public return receipt human_state must be HUMAN_ACCEPTED or HUMAN_NEEDS_FIX")
    if parse_timestamp(receipt.get("returned_at")) is None:
        errors.append("public return receipt requires a timezone-aware ISO-8601 returned_at")
    if not non_empty_string(receipt.get("published_at_or_revision")):
        errors.append("public return receipt requires published_at_or_revision or UNVERIFIED")
    visual_paths = receipt.get("public_visual_evidence_paths")
    if not isinstance(visual_paths, list) or any(not non_empty_string(path) for path in visual_paths):
        errors.append("public return receipt public_visual_evidence_paths must be a list of paths")
    limitations = receipt.get("known_platform_limitations")
    if not isinstance(limitations, list):
        errors.append("public return receipt known_platform_limitations must be a list")
    else:
        for index, limitation in enumerate(limitations, 1):
            errors.extend(platform_limitation_errors(limitation, prefix=f"public return receipt limitation #{index}"))
    return errors


def publication_ledger_errors(
    publication: object, *, article_ids: set[str], article_workspaces: object, workspace: Path | None = None,
    batch_mode: bool = False, campaign_gatekeeper_agent_id: str | None = None,
) -> list[str]:
    if not isinstance(publication, dict):
        return ["state publication must be an object"]
    if not non_empty_string(publication.get("status")):
        return ["state publication requires a status"]
    records = publication.get("articles")
    if not isinstance(records, dict):
        return ["state publication articles must be an object"]
    errors: list[str] = []
    workspace_records = article_workspaces if isinstance(article_workspaces, dict) else {}
    for article_id, record in records.items():
        prefix = f"state publication article {article_id}"
        if article_id not in article_ids:
            errors.append(f"{prefix}: unknown article_id")
        if not isinstance(record, dict):
            errors.append(f"{prefix}: record must be an object")
            continue
        required_fields = {
            "public_url", "human_state", "returned_at", "return_receipt_path", "public_snapshot_path",
            "attempt", "unverified_retry_count", "public_qa_status", "last_report_path",
            "owner_request_id", "accepted_platform_limitations",
        }
        if batch_mode:
            required_fields.update(("campaign_gatekeeper_agent_id", "batch_id", "batch_entry_id", "batch_entry_sha256"))
        else:
            required_fields.add("lane_gatekeeper_agent_id")
        missing = sorted(required_fields - set(record))
        if missing:
            errors.append(f"{prefix}: missing fields " + ", ".join(missing))
            continue
        human_state = record.get("human_state")
        if human_state is not None and human_state not in HUMAN_RETURN_STATES:
            errors.append(f"{prefix}: human_state is invalid")
        if human_state is not None and parse_timestamp(record.get("returned_at")) is None:
            errors.append(f"{prefix}: active public state requires a timezone-aware ISO-8601 returned_at")
        qa_status = record.get("public_qa_status")
        if qa_status not in PUBLIC_QA_RECORD_STATUSES:
            errors.append(f"{prefix}: public_qa_status is invalid")
        if isinstance(record.get("attempt"), bool) or not isinstance(record.get("attempt"), int) or record["attempt"] < 0:
            errors.append(f"{prefix}: attempt must be a non-negative integer")
        retry_count = record.get("unverified_retry_count")
        retry_policy = PUBLIC_QA_POLICY_2_7 if batch_mode else PUBLIC_QA_POLICY_2_3
        retry_budget = retry_policy["unverified_retry_budget"]
        if isinstance(retry_count, bool) or not isinstance(retry_count, int) or retry_count < 0:
            errors.append(f"{prefix}: unverified_retry_count must be a non-negative integer")
        elif retry_count > retry_budget:
            errors.append(f"{prefix}: unverified_retry_count exceeds the configured retry budget")
        limitations = record.get("accepted_platform_limitations")
        if not isinstance(limitations, list):
            errors.append(f"{prefix}: accepted_platform_limitations must be a list")
        else:
            for index, limitation in enumerate(limitations, 1):
                errors.extend(platform_limitation_errors(limitation, prefix=f"{prefix} limitation #{index}"))
        public_stage = qa_status in {"PUBLIC_READONLY_VALIDATING", *PUBLIC_QA_OUTCOMES}
        if human_state is not None or qa_status != "NOT_STARTED":
            if not is_http_url(record.get("public_url")):
                errors.append(f"{prefix}: an active public state requires an http(s) public_url")
            if not non_empty_string(record.get("return_receipt_path")):
                errors.append(f"{prefix}: an active public state requires return_receipt_path")
        if public_stage:
            if human_state != "HUMAN_ACCEPTED":
                errors.append(f"{prefix}: public QA requires HUMAN_ACCEPTED")
            if batch_mode:
                if not non_empty_string(record.get("campaign_gatekeeper_agent_id")):
                    errors.append(f"{prefix}: batch public QA requires campaign_gatekeeper_agent_id")
                elif record.get("campaign_gatekeeper_agent_id") != campaign_gatekeeper_agent_id:
                    errors.append(f"{prefix}: batch public QA must reuse the registered campaign gatekeeper")
                if not non_empty_string(record.get("batch_id")) or not non_empty_string(record.get("batch_entry_id")):
                    errors.append(f"{prefix}: batch public QA requires batch_id and batch_entry_id")
                if not non_empty_string(record.get("batch_entry_sha256")):
                    errors.append(f"{prefix}: batch public QA requires batch_entry_sha256")
            elif not non_empty_string(record.get("lane_gatekeeper_agent_id")):
                errors.append(f"{prefix}: public QA requires the existing lane_gatekeeper_agent_id")
            if record.get("attempt", 0) < 1:
                errors.append(f"{prefix}: public QA requires attempt >= 1")
            if not batch_mode:
                article_workspace = workspace_records.get(article_id)
                if not isinstance(article_workspace, dict):
                    errors.append(f"{prefix}: public QA requires the registered article workspace")
                    bundle = None
                else:
                    bundle = article_workspace.get("role_bundle")
                if not isinstance(bundle, dict):
                    errors.append(f"{prefix}: public QA requires the registered lane role bundle")
                registered_lane_id = bundle.get("lane_gatekeeper_agent") if isinstance(bundle, dict) else None
                if not non_empty_string(registered_lane_id):
                    errors.append(f"{prefix}: public QA requires a registered lane gatekeeper agent ID")
                elif record.get("lane_gatekeeper_agent_id") != registered_lane_id:
                    errors.append(f"{prefix}: public QA must reuse the registered lane gatekeeper")
        if qa_status in PUBLIC_QA_OUTCOMES:
            if not non_empty_string(record.get("public_snapshot_path")):
                errors.append(f"{prefix}: completed public QA classification requires public_snapshot_path")
            if not non_empty_string(record.get("last_report_path")):
                errors.append(f"{prefix}: completed public QA classification requires last_report_path")
        if qa_status == "PUBLIC_QA_PASSED_WITH_LIMITATION" and not limitations:
            errors.append(f"{prefix}: PASS_WITH_LIMITATION requires an evidence-scoped limitation")
        if qa_status == "CANONICAL_CHANGE_REQUESTED" and not non_empty_string(record.get("owner_request_id")):
            errors.append(f"{prefix}: CANONICAL_CHANGE_REQUESTED requires owner_request_id")
        if workspace is not None and (human_state is not None or qa_status != "NOT_STARTED"):
            errors.extend(publication_artifact_errors(
                record, article_id=article_id, workspace=workspace, prefix=prefix,
                batch_mode=batch_mode, campaign_gatekeeper_agent_id=campaign_gatekeeper_agent_id,
            ))
    return errors


def publication_artifact_errors(
    record: dict, *, article_id: str, workspace: Path, prefix: str,
    batch_mode: bool = False, campaign_gatekeeper_agent_id: str | None = None,
) -> list[str]:
    """Bind an active public-QA ledger row to real, campaign-local evidence files."""
    errors: list[str] = []
    receipt_path, receipt_path_error = workspace_file(
        workspace, record.get("return_receipt_path"), label=f"{prefix} return_receipt_path",
    )
    if receipt_path_error:
        errors.append(receipt_path_error)
    elif receipt_path is not None:
        receipt, receipt_error = json_object_file(receipt_path, label=f"{prefix} return receipt")
        if receipt_error:
            errors.append(receipt_error)
        elif receipt is not None:
            errors.extend(f"{prefix}: {error}" for error in public_return_receipt_errors(receipt, expected_article_id=article_id))
            if receipt.get("public_url") != record.get("public_url"):
                errors.append(f"{prefix}: receipt public_url does not match the ledger")
            if receipt.get("human_state") != record.get("human_state"):
                errors.append(f"{prefix}: receipt human_state does not match the ledger")
            receipt_returned_at = parse_timestamp(receipt.get("returned_at"))
            ledger_returned_at = parse_timestamp(record.get("returned_at"))
            if receipt_returned_at is None or ledger_returned_at is None or receipt_returned_at != ledger_returned_at:
                errors.append(f"{prefix}: receipt returned_at does not match the ledger")

    qa_status = record.get("public_qa_status")
    snapshot_required = qa_status in {"PUBLIC_READONLY_VALIDATING", *PUBLIC_QA_OUTCOMES}
    report_required = qa_status in PUBLIC_QA_OUTCOMES
    if not snapshot_required:
        return errors

    snapshot_path, snapshot_path_error = workspace_file(
        workspace, record.get("public_snapshot_path"), label=f"{prefix} public_snapshot_path",
    )
    if snapshot_path_error:
        errors.append(snapshot_path_error)
    elif snapshot_path is not None:
        snapshot, snapshot_error = json_object_file(snapshot_path, label=f"{prefix} public snapshot")
        if snapshot_error:
            errors.append(snapshot_error)
        elif snapshot is not None:
            if snapshot.get("snapshot_sha256") != normalized_snapshot_sha256(snapshot):
                errors.append(f"{prefix}: public snapshot hash does not match")
            expected_contract = snapshot.get("expected_contract")
            if not isinstance(expected_contract, dict) or expected_contract.get("article_id") != article_id:
                errors.append(f"{prefix}: public snapshot article_id does not match the ledger")
            source = snapshot.get("source")
            if not isinstance(source, dict) or source.get("requested_url") != record.get("public_url"):
                errors.append(f"{prefix}: public snapshot URL does not match the ledger")
            if snapshot.get("capture_status") not in {"CAPTURED", "UNVERIFIED"}:
                errors.append(f"{prefix}: public snapshot has an invalid capture_status")

    if report_required and batch_mode:
        errors.extend(batch_public_report_entry_errors(
            record, article_id=article_id, workspace=workspace, prefix=prefix,
            campaign_gatekeeper_agent_id=campaign_gatekeeper_agent_id,
        ))
        return errors

    if report_required:
        report_path, report_path_error = workspace_file(
            workspace, record.get("last_report_path"), label=f"{prefix} last_report_path",
        )
        if report_path_error:
            errors.append(report_path_error)
        elif report_path is not None:
            try:
                report_text = report_path.read_text(encoding="utf-8")
            except OSError as exc:
                errors.append(f"{prefix}: cannot read public QA report: {exc}")
            else:
                required_report_literals = (
                    f"Public QA report — {article_id}",
                    f"Existing lane G agent ID: `{record.get('lane_gatekeeper_agent_id')}`",
                    f"Public URL: `{record.get('public_url')}`",
                    f"Human return receipt: `{record.get('return_receipt_path')}`",
                    f"Normalized public snapshot: `{record.get('public_snapshot_path')}`",
                    f"Selected result: `{qa_status}`",
                )
                for literal in required_report_literals:
                    if literal not in report_text:
                        errors.append(f"{prefix}: public QA report does not bind {literal!r}")
                if (
                    qa_status == "CANONICAL_CHANGE_REQUESTED"
                    and f"Owner request ID: `{record.get('owner_request_id')}`" not in report_text
                ):
                    errors.append(f"{prefix}: canonical-change report does not bind owner_request_id")
    return errors


def batch_public_report_entry_errors(
    record: dict, *, article_id: str, workspace: Path, prefix: str,
    campaign_gatekeeper_agent_id: str | None,
) -> list[str]:
    """Bind one public ledger row to its entry in a shared G batch report.

    The batch report is a compact read-only result, not a new article or a
    substitute for the individual return receipt/snapshot records validated
    above.  Keeping the per-row hash lets a later correction be isolated.
    """
    report_path, report_path_error = workspace_file(
        workspace, record.get("last_report_path"), label=f"{prefix} batch public QA report",
    )
    if report_path_error:
        return [report_path_error]
    assert report_path is not None
    report, report_error = json_object_file(report_path, label=f"{prefix} batch public QA report")
    if report_error or report is None:
        return [report_error or f"{prefix}: batch public QA report is invalid"]
    errors: list[str] = []
    if report.get("schema_version") != "1.0":
        errors.append(f"{prefix}: batch public QA report schema_version must be 1.0")
    if report.get("batch_id") != record.get("batch_id"):
        errors.append(f"{prefix}: batch public QA report batch_id does not match the ledger")
    if report.get("gatekeeper_agent_id") != campaign_gatekeeper_agent_id:
        errors.append(f"{prefix}: batch public QA report must use the registered campaign gatekeeper")
    if report.get("workflow_stage") != "PUBLIC_QA_BATCH_READONLY":
        errors.append(f"{prefix}: batch public QA report workflow_stage is invalid")
    entries = report.get("entries")
    if not isinstance(entries, list) or not entries:
        return errors + [f"{prefix}: batch public QA report requires entries"]
    entry_ids = [entry.get("entry_id") for entry in entries if isinstance(entry, dict)]
    entry_article_ids = [entry.get("article_id") for entry in entries if isinstance(entry, dict)]
    if len(entry_ids) != len(entries) or not all(non_empty_string(value) for value in entry_ids) or len(set(entry_ids)) != len(entry_ids):
        errors.append(f"{prefix}: batch public QA entry IDs must be unique and non-empty")
    if len(entry_article_ids) != len(entries) or not all(non_empty_string(value) for value in entry_article_ids) or len(set(entry_article_ids)) != len(entry_article_ids):
        errors.append(f"{prefix}: batch public QA article IDs must be unique and non-empty")
    matches = [
        entry for entry in entries
        if isinstance(entry, dict)
        and entry.get("entry_id") == record.get("batch_entry_id")
        and entry.get("article_id") == article_id
    ]
    if len(matches) != 1:
        return errors + [f"{prefix}: batch public QA report must contain exactly one matching entry"]
    entry = matches[0]
    if record.get("batch_entry_sha256") != sha256_json(entry):
        errors.append(f"{prefix}: batch public QA entry hash does not match")
    expected_values = {
        "public_url": record.get("public_url"),
        "human_state": record.get("human_state"),
        "returned_at": record.get("returned_at"),
        "result": record.get("public_qa_status"),
        "attempt": record.get("attempt"),
        "unverified_retry_count": record.get("unverified_retry_count"),
        "owner_request_id": record.get("owner_request_id"),
    }
    for field, expected in expected_values.items():
        if entry.get(field) != expected:
            errors.append(f"{prefix}: batch public QA entry {field} does not match the ledger")
    if entry.get("human_state") != "HUMAN_ACCEPTED":
        errors.append(f"{prefix}: batch public QA entry requires HUMAN_ACCEPTED")
    if entry.get("result") not in PUBLIC_QA_OUTCOMES:
        errors.append(f"{prefix}: batch public QA entry has an invalid result")
    if entry.get("result") in {"PUBLIC_QA_PASSED", "PUBLIC_QA_PASSED_WITH_LIMITATION"}:
        if entry.get("visual_evidence_mode") != "RENDERED_READER_PAGE":
            errors.append(f"{prefix}: a public pass requires rendered reader-page visual evidence")
        visual_paths = entry.get("rendered_visual_evidence_paths")
        if not isinstance(visual_paths, list) or not visual_paths or any(not non_empty_string(path) for path in visual_paths):
            errors.append(f"{prefix}: a public pass requires non-empty rendered_visual_evidence_paths")
    if entry.get("result") == "PUBLIC_QA_PASSED_WITH_LIMITATION" and not entry.get("accepted_platform_limitations"):
        errors.append(f"{prefix}: batch public pass-with-limitation requires an accepted limitation")
    if entry.get("result") == "CANONICAL_CHANGE_REQUESTED" and not non_empty_string(entry.get("owner_request_id")):
        errors.append(f"{prefix}: batch canonical change requires owner_request_id")
    if entry.get("accepted_platform_limitations") != record.get("accepted_platform_limitations"):
        errors.append(f"{prefix}: batch public QA limitations do not match the ledger")
    for artifact_key, ledger_key in (("return_receipt", "return_receipt_path"), ("public_snapshot", "public_snapshot_path")):
        artifact = entry.get(artifact_key)
        if not isinstance(artifact, dict):
            errors.append(f"{prefix}: batch public QA entry requires {artifact_key}")
            continue
        if artifact.get("path") != record.get(ledger_key):
            errors.append(f"{prefix}: batch public QA {artifact_key} path does not match the ledger")
        artifact_path, artifact_error = workspace_file(workspace, artifact.get("path"), label=f"{prefix} batch {artifact_key}")
        if artifact_error:
            errors.append(artifact_error)
        elif artifact_path is not None and artifact.get("sha256") != sha256_file(artifact_path):
            errors.append(f"{prefix}: batch public QA {artifact_key} sha256 does not match")
    for artifact_key in ("article_contract", "article_package", "handoff_manifest"):
        artifact = entry.get(artifact_key)
        if not isinstance(artifact, dict) or not non_empty_string(artifact.get("path")) or not non_empty_string(artifact.get("sha256")):
            errors.append(f"{prefix}: batch public QA entry requires {artifact_key} path and sha256")
    return errors


def public_qa_task_errors(
    publication: object, *, tasks: object, article_workspaces: object,
    batch_mode: bool = False, campaign_gatekeeper_agent_id: str | None = None,
) -> list[str]:
    """Prove post-return work stayed in the pre-existing lane and never silently restarted W/R."""
    if not isinstance(publication, dict) or not isinstance(publication.get("articles"), dict):
        return []
    if not isinstance(tasks, list):
        return ["public QA requires a visible task ledger"]
    workspace_records = article_workspaces if isinstance(article_workspaces, dict) else {}
    errors: list[str] = []
    for article_id, record in publication["articles"].items():
        if not isinstance(record, dict):
            continue
        human_state = record.get("human_state")
        qa_status = record.get("public_qa_status")
        if human_state is None and qa_status == "NOT_STARTED":
            continue
        prefix = f"state publication article {article_id}"
        returned_at = parse_timestamp(record.get("returned_at"))
        if returned_at is None:
            continue
        workspace = workspace_records.get(article_id)
        bundle = workspace.get("role_bundle") if isinstance(workspace, dict) else None
        if not isinstance(bundle, dict):
            continue
        expected_agent_by_role = (
            {
                "ARTICLE_WRITER": bundle.get("writer_agent"),
                "ARTICLE_LANGUAGE_REVIEWER": bundle.get("reviewer_agent"),
            }
            if batch_mode
            else {
                "ARTICLE_LANE_GATEKEEPER": bundle.get("lane_gatekeeper_agent"),
                "ARTICLE_WRITER": bundle.get("writer_agent"),
                "ARTICLE_LANGUAGE_REVIEWER": bundle.get("reviewer_agent"),
            }
        )
        article_tasks = [
            task for task in tasks
            if isinstance(task, dict) and task.get("article_id") == article_id and task.get("role") in set(expected_agent_by_role)
        ]
        if batch_mode:
            stale_article_g_turns = [
                task for task in tasks
                if isinstance(task, dict)
                and task.get("article_id") == article_id
                and task.get("role") == "ARTICLE_LANE_GATEKEEPER"
                and (parse_timestamp(task.get("started_at")) or datetime.min.replace(tzinfo=timezone.utc)) >= returned_at
            ]
            if stale_article_g_turns:
                errors.append(f"{prefix}: batch public QA must not create an article-lane G turn")
        for task in article_tasks:
            role = task.get("role")
            expected_agent_id = expected_agent_by_role.get(role)
            if not non_empty_string(task.get("agent_id")) or task.get("agent_id") != expected_agent_id:
                errors.append(f"{prefix}: article task {role} must reuse its registered agent ID")
            task_started_at = parse_timestamp(task.get("started_at"))
            if task_started_at is None:
                errors.append(f"{prefix}: article task {role} requires a timezone-aware ISO-8601 started_at")
                continue
            if task_started_at >= returned_at and role in {"ARTICLE_WRITER", "ARTICLE_LANGUAGE_REVIEWER"}:
                if (
                    qa_status != "CANONICAL_CHANGE_REQUESTED"
                    or task.get("workflow_stage") != "CANONICAL_REOPEN"
                    or task.get("owner_request_id") != record.get("owner_request_id")
                ):
                    errors.append(f"{prefix}: post-return W/R is forbidden without the matching canonical-change owner request")

        completed_classification = qa_status in PUBLIC_QA_OUTCOMES
        if batch_mode or not completed_classification:
            continue
        lane_agent_id = record.get("lane_gatekeeper_agent_id")
        public_g_turns = [
            task for task in article_tasks
            if task.get("role") == "ARTICLE_LANE_GATEKEEPER"
            and task.get("agent_id") == lane_agent_id
            and task.get("workflow_stage") == "PUBLIC_QA_READONLY"
            and task.get("result_path") == record.get("last_report_path")
            and (parse_timestamp(task.get("started_at")) or datetime.min.replace(tzinfo=timezone.utc)) >= returned_at
        ]
        if not public_g_turns:
            errors.append(f"{prefix}: public QA requires a timestamped read-only turn by the registered lane gatekeeper")
    if batch_mode:
        errors.extend(batch_public_qa_task_errors(
            publication, tasks=tasks, campaign_gatekeeper_agent_id=campaign_gatekeeper_agent_id,
        ))
    return errors


def batch_public_qa_task_errors(
    publication: dict, *, tasks: list, campaign_gatekeeper_agent_id: str | None,
) -> list[str]:
    """Prove a single G turn covered exactly the published rows in each batch."""
    records = publication.get("articles")
    if not isinstance(records, dict):
        return []
    grouped: dict[str, list[tuple[str, dict]]] = {}
    for article_id, record in records.items():
        if not isinstance(record, dict) or record.get("public_qa_status") not in PUBLIC_QA_OUTCOMES:
            continue
        report_path = record.get("last_report_path")
        if non_empty_string(report_path):
            grouped.setdefault(report_path, []).append((article_id, record))
    errors: list[str] = []
    for report_path, rows in grouped.items():
        expected_ids = {article_id for article_id, _ in rows}
        returned_at = [parse_timestamp(record.get("returned_at")) for _, record in rows]
        latest_return = max((value for value in returned_at if value is not None), default=None)
        matching_tasks = [
            task for task in tasks
            if isinstance(task, dict)
            and task.get("role") == CAMPAIGN_GATEKEEPER_ROLE
            and task.get("agent_id") == campaign_gatekeeper_agent_id
            and task.get("workflow_stage") == "PUBLIC_QA_BATCH_READONLY"
            and task.get("result_path") == report_path
            and task.get("status") == "COMPLETED"
            and isinstance(task.get("article_ids"), list)
            and set(task.get("article_ids")) == expected_ids
        ]
        if len(matching_tasks) != 1:
            errors.append(f"batch public QA {report_path}: requires exactly one visible campaign-G task with the matching article IDs")
            continue
        started_at = parse_timestamp(matching_tasks[0].get("started_at"))
        if started_at is None:
            errors.append(f"batch public QA {report_path}: task requires a timezone-aware ISO-8601 started_at")
        elif latest_return is not None and started_at < latest_return:
            errors.append(f"batch public QA {report_path}: task may not predate its latest human return")
    return errors


def dump(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_json(value: object) -> str:
    """Hash structured provenance without depending on incidental JSON whitespace."""
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def relative_path(workspace: Path, path: Path) -> str:
    """Return a workspace-relative path and reject accidental external references."""
    root = workspace.resolve()
    resolved = path.resolve()
    if resolved == root or root not in resolved.parents:
        raise ValueError(f"path must stay inside workspace: {path}")
    return str(resolved.relative_to(root))


def article_id_is_safe_path_component(article_id: object) -> bool:
    """Article IDs may name a deterministic directory, never a path fragment."""
    if not non_empty_string(article_id):
        return False
    value = article_id.strip()
    path = Path(value)
    return not path.is_absolute() and value not in {".", ".."} and path.name == value and "/" not in value and "\\" not in value


def uses_main_session_path_isolation(cfg: object) -> bool:
    """Return whether this campaign uses the schema-2.13+ article-root layout."""
    return isinstance(cfg, dict) and schema_at_least(cfg.get("schema_version"), 2, 13)


def article_artifact_root_relative(cfg: object, article_id: object) -> str:
    """Resolve the one allowed article root for a current main-session campaign."""
    if not uses_main_session_path_isolation(cfg):
        return ""
    if not article_id_is_safe_path_component(article_id):
        raise ValueError("article_id is not safe for an article artifact root")
    return ARTICLE_ARTIFACT_ROOT_TEMPLATE.format(article_id=str(article_id).strip())


def article_artifact_paths_for_campaign(cfg: object, article_id: object) -> dict[str, str]:
    """Return campaign-root-relative single-article paths without collisions."""
    root = article_artifact_root_relative(cfg, article_id)

    def article_path(value: str) -> str:
        return str(Path(root, value)) if root else value

    return {
        "evidence_pack": article_path("research/evidence-pack.json"),
        "canonical_article": article_path(canonical_article_path_for_campaign(cfg)),
        "metadata": article_path("canonical/metadata.json"),
        "visual_manifest": article_path("canonical/visual-manifest.json"),
        "article_package": article_path("article-package.json"),
        "review_index": article_path("reviews/review-index.json"),
        "handoff_manifest": article_path("handoff/handoff-manifest.json"),
        "visual_payload": article_path("handoff/visual-payload.html"),
        "visual_payload_markdown": article_path("handoff/visual-payload.md"),
    }


def article_workspace_isolation_errors(records: object, *, article_ids: set[str]) -> list[str]:
    """Validate optional execution records without treating Git isolation as default.

    A current campaign may have no records before dispatch.  Once a record is
    created, its artifact root is deterministic.  A Git worktree is an
    explicit exception with a recorded operational reason, never a shortcut
    for lower token cost.
    """
    if not isinstance(records, dict):
        return ["state article workspaces must be an object"]
    errors: list[str] = []
    seen_roots: dict[str, str] = {}
    for raw_article_id, record in records.items():
        article_id = str(raw_article_id).strip()
        if article_id not in article_ids:
            errors.append(f"article workspace {article_id or '<unknown>'}: article_id is not configured")
            continue
        if not article_id_is_safe_path_component(article_id):
            errors.append(f"article workspace {article_id}: artifact_root cannot be derived from this article_id")
            continue
        if not isinstance(record, dict):
            errors.append(f"article workspace {article_id}: record must be an object")
            continue
        expected_root = ARTICLE_ARTIFACT_ROOT_TEMPLATE.format(article_id=article_id)
        root = record.get("artifact_root")
        if root != expected_root:
            errors.append(f"article workspace {article_id}: artifact_root must be {expected_root}")
        elif root in seen_roots:
            errors.append(
                f"article workspace {article_id}: artifact_root duplicates {seen_roots[root]}"
            )
        else:
            seen_roots[root] = article_id
        isolation = record.get("isolation")
        if isolation not in {MAIN_SESSION_PATH_ISOLATION, GIT_WORKTREE_ISOLATION}:
            errors.append(
                f"article workspace {article_id}: isolation must be "
                f"{MAIN_SESSION_PATH_ISOLATION} or {GIT_WORKTREE_ISOLATION}"
            )
            continue
        decision = record.get("worktree_dispatch_decision")
        if isolation == GIT_WORKTREE_ISOLATION:
            if not isinstance(decision, dict):
                errors.append(f"article workspace {article_id}: GIT_WORKTREE requires worktree_dispatch_decision")
            elif decision.get("reason") not in WORKTREE_DISPATCH_REASONS:
                errors.append(f"article workspace {article_id}: worktree_dispatch_decision.reason is invalid")
        elif decision not in (None, {}):
            errors.append(
                f"article workspace {article_id}: main-session isolation may not carry a worktree_dispatch_decision"
            )
    return errors


def route_requires_independent_reviewer(
    workspace: Path, cfg: dict, article_id: str, review_effort: object,
) -> bool:
    """Resolve whether a registered R is needed without fabricating one for WQ.

    A frozen WQ plan normally needs only W.  Once its index records a pending
    or completed one-way WR escalation, the visible article lane must add an
    independent reviewer.  A missing/unreadable index deliberately remains
    WQ here; the index validator reports any malformed escalation separately.
    """
    if not author_qa_route(review_effort):
        return True
    try:
        index_path = workspace / article_artifact_root_relative(cfg, article_id) / "reviews/review-index.json"
    except ValueError:
        return False
    index, error = json_object_file(index_path, label="article quality route index")
    if error or not isinstance(index, dict):
        return False
    resolution = index.get("route_resolution")
    return isinstance(resolution, dict) and resolution.get("status") in {
        "WR_ESCALATION_REQUIRED", "WR_ESCALATED",
    }


def manifest_text(value: object, *, pending: str = "PENDING") -> str:
    return value.strip() if isinstance(value, str) and value.strip() else pending


PREWRITE_SUMMARY_LABELS = {
    "owner_task_and_scope": "Owner task and scope",
    "content_value_and_cta_policy": "Content value and CTA policy",
    "sources_checked_and_uncertainty": "Sources checked and uncertainty",
    "shared_constraints": "Shared constraints",
    "platform_matching_status": "Platform-matching status",
}
MODEL_FIRST_PREWRITE_SUMMARY_LABELS = {
    "campaign_strategy": "Campaign strategy and shared evidence boundary",
}
PREWRITE_PLAN_LABELS = {
    "task_and_audience": "Task and audience",
    "reader_value_and_secondary_cta": "Reader value and secondary CTA",
    "research_evidence_and_uncertainty": "Research evidence and uncertainty",
    "keyword_and_localization_strategy": "Keyword and localization strategy",
    "factual_claims_and_sources": "Factual claims and sources",
    "title_and_outline": "Title and outline",
    "visual_narrative": "Visual narrative",
    "platform_transport_assumptions": "Platform transport assumptions",
    "risks_and_owner_decisions": "Risks and owner decisions",
}
MODEL_FIRST_PREWRITE_PLAN_LABELS = {
    "task_and_audience": "Task and audience",
    "reader_value_and_secondary_cta": "Reader value and secondary CTA",
    "editorial_brief": "Model-led editorial brief",
    "risks_and_owner_decisions": "Risks and owner decisions",
}


def render_prewrite_plan_markdown(manifest: dict, manifest_sha256: str) -> str:
    """Render the owner view from the canonical JSON plan; never hand-maintain it."""
    model_first = manifest.get("schema_version") in {
        "1.4", "1.5", RESEARCH_INTEGRITY_PREWRITE_PLAN_SCHEMA,
        PREVIOUS_PREWRITE_PLAN_SCHEMA, CURRENT_PREWRITE_PLAN_SCHEMA,
    }
    article_plans = manifest.get("article_plans")
    article_plans = article_plans if isinstance(article_plans, list) else []
    article_ids = [str(plan.get("article_id", "")).strip() for plan in article_plans if isinstance(plan, dict)]
    summary = manifest.get("campaign_summary")
    summary = summary if isinstance(summary, dict) else {}
    convention = manifest.get("artifact_convention")
    convention = convention if isinstance(convention, dict) else {}
    shared_pack = manifest.get("shared_evidence_pack")
    shared_pack = shared_pack if isinstance(shared_pack, dict) else {}
    receipt = manifest.get("owner_confirmation_receipt")
    receipt = receipt if isinstance(receipt, dict) else {}
    scope_snapshot = manifest.get("confirmed_scope_snapshot")
    scope_snapshot_sha = canonical_json_sha256(scope_snapshot) if isinstance(scope_snapshot, dict) else None
    lines = [
        "# Pre-write research and writing plan",
        "",
        "<!-- BLOG_3P_PREWRITE_RENDERED_FROM: prewrite-plan.json -->",
        f"Status: {manifest_text(manifest.get('status'))}",
        f"Owner confirmation ID: {manifest_text(manifest.get('owner_confirmation_id'))}",
        f"Owner confirmation receipt: {manifest_text(receipt.get('source_path'))}",
        f"Pre-write manifest SHA-256: {manifest_sha256}",
        f"Protected scope snapshot SHA-256: {manifest_text(scope_snapshot_sha)}",
        f"Article IDs: {', '.join(article_ids) if article_ids else 'PENDING'}",
        "",
        "This is a generated, read-only owner view of `prewrite-plan.json`. It freezes scope and a model-led editorial direction; it is not article prose and does not replace W's integrated research after confirmation.",
        "",
        "## Artifact convention",
        "",
        f"- Canonical source: `{manifest_text(convention.get('canonical_source'))}`",
        f"- Owner view: `{manifest_text(convention.get('owner_view_path'))}` / `{manifest_text(convention.get('owner_view_mode'))}`",
        f"- Shared evidence pack: `{manifest_text(shared_pack.get('path'))}` (SHA-256: `{manifest_text(shared_pack.get('sha256'))}`)",
        "",
        "## Campaign strategy",
        "",
    ]
    summary_sections = MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS if model_first else PREWRITE_SUMMARY_SECTIONS
    summary_labels = MODEL_FIRST_PREWRITE_SUMMARY_LABELS if model_first else PREWRITE_SUMMARY_LABELS
    for section in summary_sections:
        lines.append(f"- **{summary_labels[section]}:** {manifest_text(summary.get(section))}")
    lines.extend(["", "## Per-article plans", ""])
    if not article_plans:
        lines.append("No article plans configured yet.")
    for plan in article_plans:
        if not isinstance(plan, dict):
            continue
        article_id = manifest_text(plan.get("article_id"), pending="UNSPECIFIED_ARTICLE")
        lines.extend([f"### {article_id}", ""])
        plan_sections = MODEL_FIRST_PREWRITE_PLAN_SECTIONS if model_first else PREWRITE_PLAN_SECTIONS
        plan_labels = MODEL_FIRST_PREWRITE_PLAN_LABELS if model_first else PREWRITE_PLAN_LABELS
        for index, section in enumerate(plan_sections, 1):
            lines.append(f"{index}. **{plan_labels[section]}** — {manifest_text(plan.get(section))}")
        if model_first:
            topic_slot = plan.get("topic_slot")
            if isinstance(topic_slot, dict):
                deviations = topic_slot.get("forbidden_deviations")
                deviation_text = "; ".join(
                    str(item).strip() for item in deviations if str(item).strip()
                ) if isinstance(deviations, list) else "PENDING"
                lines.append(
                    "- **Frozen topic slot:** "
                    f"{manifest_text(topic_slot.get('slot_id'))}; reader task: "
                    f"{manifest_text(topic_slot.get('reader_task'))}; core intent: "
                    f"{manifest_text(topic_slot.get('core_intent'))}; market: "
                    f"{manifest_text(topic_slot.get('market'))}; differentiation: "
                    f"{manifest_text(topic_slot.get('differentiation_angle'))}"
                )
                lines.append(f"- **Forbidden topic deviations:** {deviation_text or 'PENDING'}")
            mapping = plan.get("frozen_delivery_mapping")
            if isinstance(mapping, dict):
                lines.append(
                    "- **Frozen delivery mapping:** "
                    f"{manifest_text(mapping.get('article_language'))} → {manifest_text(mapping.get('market'))} → "
                    f"{manifest_text(mapping.get('platform'))} / {manifest_text(mapping.get('account'))}"
                )
                lines.append(f"- **Audience-fit route:** {manifest_text(mapping.get('fit_mode'))}")
                exception = mapping.get("cross_language_exception")
                if isinstance(exception, dict):
                    lines.append(
                        "- **Cross-language exception requested:** "
                        f"{manifest_text(exception.get('reason'))}; owner wording: "
                        f"{manifest_text(exception.get('requested_owner_confirmation_literal'))}"
                    )
            posture = plan.get("evidence_posture")
            if isinstance(posture, dict):
                lines.append(
                    "- **Evidence posture:** "
                    f"{manifest_text(posture.get('mode'))}; empirical claims allowed: "
                    f"{manifest_text(posture.get('empirical_claims_allowed'))}; boundary: "
                    f"{manifest_text(posture.get('claim_boundary'))}"
                )
            review_effort = plan.get("review_effort")
            if isinstance(review_effort, dict):
                reasons = review_effort.get("reasons")
                reason_text = ", ".join(str(reason).strip() for reason in reasons if str(reason).strip()) if isinstance(reasons, list) else "PENDING"
                lines.append(
                    "- **Review route:** "
                    f"{manifest_text(review_effort.get('tier'))} / {manifest_text(review_effort.get('research_gate'))}"
                    f" (reasons: {reason_text or 'NONE'})"
                )
        evidence_refs = plan.get("evidence_refs")
        if isinstance(evidence_refs, list) and evidence_refs:
            lines.append("- **Evidence references:** " + ", ".join(str(item).strip() for item in evidence_refs if str(item).strip()))
        lines.append("")
    lines.extend([
        "## Owner decision",
        "",
        "- [ ] `OWNER_PREWRITE_PLAN_CONFIRMED` — permits G to lock requirements and dispatch article worktrees.",
        "- [ ] `OWNER_PREWRITE_PLAN_CHANGES_REQUESTED` — revise the canonical JSON plan; do not dispatch article worktrees, W or R.",
        "",
    ])
    return "\n".join(lines)


def render_confirmation_markdown(
    *, status: str, confirmation_id: object, report_sha256: object,
    manifest_sha256: object, article_ids: list[str], owner_receipt: object = None,
    scope_snapshot_sha256: object = None,
) -> str:
    receipt = owner_receipt if isinstance(owner_receipt, dict) else {}
    return "\n".join([
        "# Campaign confirmation",
        "",
        "<!-- BLOG_3P_PREWRITE_CONFIRMATION_RENDERED -->",
        "## Pre-write plan confirmation",
        "",
        f"Pre-write plan status: {manifest_text(status)}",
        f"Pre-write plan confirmation ID: {manifest_text(confirmation_id)}",
        f"Pre-write report SHA-256: {manifest_text(report_sha256)}",
        f"Pre-write manifest SHA-256: {manifest_text(manifest_sha256)}",
        f"Protected scope snapshot SHA-256: {manifest_text(scope_snapshot_sha256)}",
        f"Pre-write article IDs: {', '.join(article_ids) if article_ids else 'PENDING'}",
        f"Owner confirmation receipt path: {manifest_text(receipt.get('source_path'))}",
        f"Owner confirmation receipt SHA-256: {manifest_text(receipt.get('source_sha256'))}",
        f"Owner confirmation receipt locator: {manifest_text(receipt.get('source_locator'))}",
        f"Owner confirmation receipt recorded at: {manifest_text(receipt.get('recorded_at'))}",
        "",
    ])


def replace_generated_receipt_block(text: str, block: str) -> str:
    start = "<!-- BLOG_3P_PREWRITE_RECEIPT_START -->"
    end = "<!-- BLOG_3P_PREWRITE_RECEIPT_END -->"
    replacement = f"{start}\n{block.rstrip()}\n{end}"
    pattern = re.compile(re.escape(start) + r"[\s\S]*?" + re.escape(end))
    if pattern.search(text):
        return pattern.sub(replacement, text, count=1)
    suffix = "\n" if text.endswith("\n") else "\n\n"
    return text + suffix + replacement + "\n"


def render_requirements_receipt(
    *, status: str, confirmation_id: object, report_sha256: object,
    manifest_sha256: object, article_ids: list[str], owner_receipt: object = None,
    scope_snapshot_sha256: object = None,
) -> str:
    receipt = owner_receipt if isinstance(owner_receipt, dict) else {}
    return "\n".join([
        "## Bound pre-write plan",
        "",
        f"Pre-write plan status: {manifest_text(status)}",
        f"Pre-write plan confirmation ID: {manifest_text(confirmation_id)}",
        f"Pre-write report SHA-256: {manifest_text(report_sha256)}",
        f"Pre-write manifest SHA-256: {manifest_text(manifest_sha256)}",
        f"Protected scope snapshot SHA-256: {manifest_text(scope_snapshot_sha256)}",
        f"Pre-write article IDs: {', '.join(article_ids) if article_ids else 'PENDING'}",
        f"Owner confirmation receipt SHA-256: {manifest_text(receipt.get('source_sha256'))}",
    ])


def read_workspace_json(workspace: Path, name: str) -> tuple[dict | None, str | None]:
    path = workspace / name
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return None, f"{name} must be valid JSON: {exc}"
    if not isinstance(value, dict):
        return None, f"{name} must contain a JSON object"
    return value, None


def sync_prewrite_plan(workspace: Path) -> int:
    """Synchronize generated plan/receipt views from the canonical JSON manifest."""
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    st, state_error = read_workspace_json(workspace, "state.json")
    manifest, manifest_error = read_workspace_json(workspace, "prewrite-plan.json")
    errors = [error for error in (cfg_error, state_error, manifest_error) if error]
    if errors or cfg is None or st is None or manifest is None:
        print("PREWRITE_SYNC_FAILED\n" + "\n".join(errors))
        return 1
    if manifest.get("campaign_id") != cfg.get("campaign_id"):
        print("PREWRITE_SYNC_FAILED\nprewrite-plan.json campaign_id does not match campaign.json")
        return 1
    status = manifest.get("status")
    if status not in PREWRITE_STATUSES:
        print("PREWRITE_SYNC_FAILED\nprewrite-plan.json status is invalid")
        return 1
    article_plans = manifest.get("article_plans")
    if not isinstance(article_plans, list) or not all(isinstance(plan, dict) for plan in article_plans):
        print("PREWRITE_SYNC_FAILED\nprewrite-plan.json article_plans must be a list of objects")
        return 1
    plan_ids = [str(plan.get("article_id", "")).strip() for plan in article_plans]
    articles = cfg.get("articles")
    articles = articles if isinstance(articles, list) else []
    configured_ids = [str(article.get("article_id", "")).strip() for article in articles if isinstance(article, dict)]
    requires_receipt_bound_confirmation = schema_at_least(cfg.get("schema_version"), 2, 8)
    requires_scope_snapshot = schema_at_least(cfg.get("schema_version"), 2, 10)
    receipt = manifest.get("owner_confirmation_receipt")
    scope_snapshot: dict | None = None
    if status == "OWNER_PREWRITE_PLAN_CONFIRMED":
        confirmation_id = manifest.get("owner_confirmation_id")
        if not non_empty_string(confirmation_id):
            print("PREWRITE_SYNC_FAILED\nconfirmed pre-write plan requires owner_confirmation_id")
            return 1
        if not exact_article_coverage(plan_ids, configured_ids):
            print("PREWRITE_SYNC_FAILED\nconfirmed pre-write plan must cover every configured article exactly once")
            return 1
        if requires_receipt_bound_confirmation:
            receipt_errors = owner_confirmation_receipt_errors(workspace, receipt)
            if receipt_errors:
                print("PREWRITE_SYNC_FAILED\n" + "\n".join(receipt_errors))
                return 1
        if requires_scope_snapshot:
            snapshot_errors = confirmed_scope_snapshot_errors(cfg, manifest)
            if snapshot_errors:
                print("PREWRITE_SYNC_FAILED\n" + "\n".join(snapshot_errors))
                return 1
            scope_snapshot = manifest.get("confirmed_scope_snapshot")
    manifest_path = workspace / "prewrite-plan.json"
    report_path = workspace / "prewrite-plan.md"
    manifest_sha = sha256_file(manifest_path)
    report_path.write_text(render_prewrite_plan_markdown(manifest, manifest_sha), encoding="utf-8")
    report_sha = sha256_file(report_path)
    confirmed = status == "OWNER_PREWRITE_PLAN_CONFIRMED"
    receipt_confirmation_id = manifest.get("owner_confirmation_id") if confirmed else None
    receipt_article_ids = plan_ids if confirmed else []
    receipt_report_sha = report_sha if confirmed else None
    receipt_manifest_sha = manifest_sha if confirmed else None
    scope_snapshot_sha = canonical_json_sha256(scope_snapshot) if scope_snapshot is not None else None
    prewrite = st.setdefault("prewrite_plan", {})
    prewrite.update({
        "status": status,
        "report_path": "prewrite-plan.md",
        "report_sha256": receipt_report_sha,
        "manifest_path": "prewrite-plan.json",
        "manifest_sha256": receipt_manifest_sha,
        "article_ids": receipt_article_ids,
        "owner_confirmation_id": receipt_confirmation_id,
        "owner_confirmation_receipt": receipt if confirmed else None,
        "scope_snapshot": scope_snapshot,
        "scope_snapshot_sha256": scope_snapshot_sha,
    })
    if confirmed and st.get("phase") in {"prewrite_planning", "awaiting_owner_prewrite_confirmation"}:
        st["phase"] = "research"
    elif not confirmed and st.get("phase") in {"prewrite_planning", "awaiting_owner_prewrite_confirmation"}:
        st["phase"] = (
            "awaiting_owner_prewrite_confirmation"
            if not prewrite_plan_submission_errors(cfg, manifest)
            else "prewrite_planning"
        )
    scope_lock = cfg.setdefault("scope_lock", {})
    scope_lock["prewrite_plan_receipt"] = {
        "owner_confirmation_id": receipt_confirmation_id,
        "report_sha256": receipt_report_sha,
        "manifest_sha256": receipt_manifest_sha,
        "article_ids": receipt_article_ids,
        "owner_confirmation_receipt": receipt if confirmed else None,
        "scope_snapshot": scope_snapshot,
        "scope_snapshot_sha256": scope_snapshot_sha,
    }
    if requires_receipt_bound_confirmation:
        scope_lock["status"] = "LOCKED" if confirmed else "DRAFT"
        scope_lock["owner_confirmation"] = "OWNER_PREWRITE_PLAN_CONFIRMED" if confirmed else "PENDING"
    confirmation_path = workspace / "confirmation.md"
    confirmation_path.write_text(
        render_confirmation_markdown(
            status=status,
            confirmation_id=receipt_confirmation_id,
            report_sha256=receipt_report_sha,
            manifest_sha256=receipt_manifest_sha,
            article_ids=receipt_article_ids,
            owner_receipt=receipt if confirmed else None,
            scope_snapshot_sha256=scope_snapshot_sha,
        ),
        encoding="utf-8",
    )
    requirements_path = workspace / "requirements-contract.md"
    existing_requirements = requirements_path.read_text(encoding="utf-8") if requirements_path.exists() else "# Requirements contract\n\n## Stable requirements\n\n"
    requirements_path.write_text(
        replace_generated_receipt_block(
            existing_requirements,
            render_requirements_receipt(
                status=status,
                confirmation_id=receipt_confirmation_id,
                report_sha256=receipt_report_sha,
                manifest_sha256=receipt_manifest_sha,
                article_ids=receipt_article_ids,
                owner_receipt=receipt if confirmed else None,
                scope_snapshot_sha256=scope_snapshot_sha,
            ),
        ),
        encoding="utf-8",
    )
    dump(workspace / "campaign.json", cfg)
    dump(workspace / "state.json", st)
    print(
        "PREWRITE_SYNCED"
        + f"\nstatus={status}"
        + f"\nmanifest_sha256={manifest_sha}"
        + f"\nreport_sha256={report_sha}"
    )
    return 0


def confirm_prewrite_plan(
    workspace: Path, confirmation_id: str, receipt_file: Path, receipt_type: str,
    source_locator: str,
) -> int:
    """Bind a real owner receipt to a prepared plan; never infer confirmation."""
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    manifest, manifest_error = read_workspace_json(workspace, "prewrite-plan.json")
    errors = [error for error in (cfg_error, manifest_error) if error]
    if errors or cfg is None or manifest is None:
        print("PREWRITE_CONFIRM_FAILED\n" + "\n".join(errors))
        return 1
    if not schema_at_least(cfg.get("schema_version"), 2, 9):
        print("PREWRITE_CONFIRM_FAILED\nconfirm-prewrite-plan requires a schema-2.9+ human-native-release workspace")
        return 1
    if manifest.get("status") == "OWNER_PREWRITE_PLAN_CONFIRMED":
        print("PREWRITE_CONFIRM_FAILED\nplan is already confirmed; make a material change and obtain a fresh owner receipt before reconfirming")
        return 1
    if manifest.get("status") not in {"PENDING_OWNER_PREWRITE_PLAN_CONFIRMATION", "OWNER_PREWRITE_PLAN_CHANGES_REQUESTED"}:
        print("PREWRITE_CONFIRM_FAILED\npre-write plan status is invalid")
        return 1
    if not non_empty_string(confirmation_id):
        print("PREWRITE_CONFIRM_FAILED\nconfirmation_id must be non-empty")
        return 1
    if receipt_type not in OWNER_CONFIRMATION_RECEIPT_TYPES:
        print("PREWRITE_CONFIRM_FAILED\nreceipt_type must be OWNER_MESSAGE or OWNER_FILE")
        return 1
    if not non_empty_string(source_locator):
        print("PREWRITE_CONFIRM_FAILED\nsource_locator must be non-empty")
        return 1
    try:
        receipt_relative = relative_path(workspace, receipt_file)
    except ValueError as exc:
        print(f"PREWRITE_CONFIRM_FAILED\n{exc}")
        return 1
    if not receipt_relative.startswith(OWNER_CONFIRMATION_RECEIPT_DIRECTORY + "/"):
        print("PREWRITE_CONFIRM_FAILED\nreceipt_file must be stored under evidence/owner-confirmations")
        return 1
    if not receipt_file.is_file():
        print("PREWRITE_CONFIRM_FAILED\nreceipt_file does not exist")
        return 1
    try:
        if not receipt_file.read_text(encoding="utf-8").strip():
            print("PREWRITE_CONFIRM_FAILED\nreceipt_file must not be empty")
            return 1
    except OSError as exc:
        print(f"PREWRITE_CONFIRM_FAILED\nreceipt_file cannot be read: {exc}")
        return 1
    plan_errors = prewrite_plan_submission_errors(cfg, manifest)
    if plan_errors:
        print("PREWRITE_CONFIRM_FAILED\n" + "\n".join(plan_errors))
        return 1
    manifest["status"] = "OWNER_PREWRITE_PLAN_CONFIRMED"
    manifest["owner_confirmation_id"] = confirmation_id.strip()
    manifest["owner_confirmation_receipt"] = {
        "source_type": receipt_type,
        "source_path": receipt_relative,
        "source_sha256": sha256_file(receipt_file),
        "source_locator": source_locator.strip(),
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    if schema_at_least(cfg.get("schema_version"), 2, 10):
        manifest["confirmed_scope_snapshot"] = protected_prewrite_scope_snapshot(cfg, manifest)
    dump(workspace / "prewrite-plan.json", manifest)
    result = sync_prewrite_plan(workspace)
    if result == 0:
        print(
            "PREWRITE_CONFIRMED"
            + f"\nconfirmation_id={confirmation_id.strip()}"
            + f"\nreceipt={receipt_relative}"
        )
    return result


def invalidate_prewrite_confirmation(workspace: Path, reason: str) -> int:
    """Make a deliberate, auditable return to owner confirmation after scope drift."""
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    manifest, manifest_error = read_workspace_json(workspace, "prewrite-plan.json")
    errors = [error for error in (cfg_error, manifest_error) if error]
    if errors or cfg is None or manifest is None:
        print("PREWRITE_INVALIDATE_FAILED\n" + "\n".join(errors))
        return 1
    if not schema_at_least(cfg.get("schema_version"), 2, 10):
        print("PREWRITE_INVALIDATE_FAILED\ninvalidate-prewrite-confirmation requires a schema-2.10+ workspace")
        return 1
    if manifest.get("status") != "OWNER_PREWRITE_PLAN_CONFIRMED":
        print("PREWRITE_INVALIDATE_FAILED\nonly an owner-confirmed pre-write plan can be invalidated")
        return 1
    if not non_empty_string(reason):
        print("PREWRITE_INVALIDATE_FAILED\nreason must be non-empty")
        return 1
    history = manifest.setdefault("invalidation_history", [])
    if not isinstance(history, list):
        print("PREWRITE_INVALIDATE_FAILED\ninvalidation_history must be a list")
        return 1
    history.append({
        "invalidated_at": datetime.now(timezone.utc).isoformat(),
        "reason": reason.strip(),
        "owner_confirmation_id": manifest.get("owner_confirmation_id"),
        "owner_confirmation_receipt": manifest.get("owner_confirmation_receipt"),
        "confirmed_scope_snapshot": manifest.get("confirmed_scope_snapshot"),
        "confirmed_scope_snapshot_sha256": canonical_json_sha256(manifest.get("confirmed_scope_snapshot")),
    })
    manifest["status"] = "OWNER_PREWRITE_PLAN_CHANGES_REQUESTED"
    manifest["owner_confirmation_id"] = None
    manifest["owner_confirmation_receipt"] = None
    manifest["confirmed_scope_snapshot"] = None
    dump(workspace / "prewrite-plan.json", manifest)
    result = sync_prewrite_plan(workspace)
    if result == 0:
        print("PREWRITE_CONFIRMATION_INVALIDATED\nreason=" + reason.strip())
    return result


def requirement_ids_from_contract(text: str) -> list[str]:
    return sorted(set(re.findall(r"(?mi)^\s*(?:[-*]\s+)?`?(REQ-[A-Z0-9_]+-\d+)`?", text)))


def dispatch_readiness(workspace: Path) -> int:
    """Report the few remaining local prerequisites before G provisions W/R pairs."""
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    st, state_error = read_workspace_json(workspace, "state.json")
    manifest, manifest_error = read_workspace_json(workspace, "prewrite-plan.json")
    errors = [error for error in (cfg_error, state_error, manifest_error) if error]
    if errors or cfg is None or st is None or manifest is None:
        print("DISPATCH_NOT_READY\n" + "\n".join(errors))
        return 1
    blockers: list[str] = []
    blockers.extend(human_native_release_policy_errors(cfg))
    if manifest.get("status") != "OWNER_PREWRITE_PLAN_CONFIRMED":
        blockers.append("owner confirmation is missing; present prewrite-plan.md, save the owner receipt, then run confirm-prewrite-plan")
    else:
        blockers.extend(owner_confirmation_receipt_errors(workspace, manifest.get("owner_confirmation_receipt")))
        blockers.extend(confirmed_scope_snapshot_errors(cfg, manifest))
    prewrite = st.get("prewrite_plan")
    if not isinstance(prewrite, dict) or prewrite.get("status") != "OWNER_PREWRITE_PLAN_CONFIRMED":
        blockers.append("state.json does not contain the owner-confirmed pre-write receipt")
    scope_lock = cfg.get("scope_lock")
    if not isinstance(scope_lock, dict) or scope_lock.get("status") != "LOCKED" or scope_lock.get("owner_confirmation") != "OWNER_PREWRITE_PLAN_CONFIRMED":
        blockers.append("campaign scope lock is not bound to the owner-confirmed pre-write plan")
    plan_errors = prewrite_plan_submission_errors(cfg, manifest)
    blockers.extend(plan_errors)
    requirements_path = workspace / "requirements-contract.md"
    if not requirements_path.is_file() or not requirement_ids_from_contract(requirements_path.read_text(encoding="utf-8")):
        blockers.append("requirements-contract.md needs at least one owner-confirmed REQ-<AREA>-NNN entry before article contexts are built")
    orchestration = st.get("orchestration")
    if not isinstance(orchestration, dict) or not non_empty_string(orchestration.get("campaign_gatekeeper_agent_id")):
        blockers.append("register the visible reusable CAMPAIGN_GATEKEEPER agent ID in state.json before dispatch")
    article_ids = [str(article.get("article_id", "")).strip() for article in cfg.get("articles", []) if isinstance(article, dict)]
    if not article_ids or any(not article_id for article_id in article_ids) or len(set(article_ids)) != len(article_ids):
        blockers.append("campaign requires unique non-empty article IDs before dispatch")
    for article_id in article_ids:
        _, _, mapping_errors = human_native_release_mapping_for_article(workspace, cfg, article_id)
        blockers.extend(mapping_errors)
    article_root_example = article_artifact_root_relative(cfg, article_ids[0]) if article_ids else "articles/<article_id>"
    next_steps = [
        "Continue in the campaign main session and reuse visible W/R roles where suitable; process articles sequentially or only in path-disjoint batches.",
        "Create a Git worktree only for a recorded true concurrent write, high-risk rewrite/rollback, or owner-requested isolation; it is not a token-saving default.",
        f"Write each article only below {article_root_example}/, including its context, canonical source, reviews and handoff files.",
        f"After W has created {article_root_example}/{canonical_article_path_for_campaign(cfg)}, build that article's reviews/review-index.json; a bootstrap index is not a review approval.",
    ]
    if blockers:
        print("DISPATCH_NOT_READY\n" + "\n".join(f"- {item}" for item in blockers))
        return 1
    print("DISPATCH_READY")
    print("article_ids=" + ",".join(article_ids))
    print("NEXT")
    print("\n".join(f"- {item}" for item in next_steps))
    return 0


def render_prewrite_plan(manifest_path: Path, output: Path) -> int:
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"PREWRITE_RENDER_FAILED\nmanifest must be valid JSON: {exc}")
        return 1
    if not isinstance(manifest, dict):
        print("PREWRITE_RENDER_FAILED\nmanifest must contain a JSON object")
        return 1
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_prewrite_plan_markdown(manifest, sha256_file(manifest_path)), encoding="utf-8")
    print(f"PREWRITE_RENDERED: {output}")
    return 0


def article_record(cfg: dict, article_id: str) -> dict | None:
    articles = cfg.get("articles")
    if not isinstance(articles, list):
        return None
    for article in articles:
        if isinstance(article, dict) and str(article.get("article_id", "")).strip() == article_id:
            return article
    return None


def article_plan_record(manifest: dict, article_id: str) -> dict | None:
    plans = manifest.get("article_plans")
    if not isinstance(plans, list):
        return None
    for plan in plans:
        if isinstance(plan, dict) and str(plan.get("article_id", "")).strip() == article_id:
            return plan
    return None


def frozen_prewrite_declaration_for_article(
    workspace: Path, cfg: dict, article_id: str,
) -> tuple[dict | None, dict | None, list[str]]:
    """Load the owner-visible mapping and evidence posture for one current article."""
    if not schema_at_least(cfg.get("schema_version"), 2, 10):
        return None, None, []
    manifest, error = read_workspace_json(workspace, "prewrite-plan.json")
    if error or manifest is None:
        return None, None, [error or "pre-write manifest is invalid"]
    plan = article_plan_record(manifest, article_id)
    if not isinstance(plan, dict):
        return None, None, [f"article {article_id}: missing owner-visible pre-write plan"]
    errors = frozen_delivery_mapping_errors(cfg, plan)
    mapping = plan.get("frozen_delivery_mapping")
    posture = plan.get("evidence_posture")
    return mapping if isinstance(mapping, dict) else None, posture if isinstance(posture, dict) else None, errors


def audience_compatibility_errors(
    value: object, *, article_language: str, market: str,
    expected_fit_mode: object, label: str,
) -> list[str]:
    """Keep reader-audience evidence distinct from editor transport evidence."""
    if not isinstance(value, dict):
        return [f"{label} audience_compatibility must be an object"]
    errors: list[str] = []
    primary_languages = normalized_string_list(value.get("primary_reader_languages"))
    primary_markets = normalized_string_list(value.get("primary_reader_markets"))
    transport_languages = normalized_string_list(value.get("transport_supported_content_languages"))
    for field in ("primary_audience_evidence_path", "transport_evidence_path"):
        if not non_empty_string(value.get(field)):
            errors.append(f"{label} audience_compatibility requires {field}")
    if not primary_languages:
        errors.append(f"{label} audience_compatibility requires primary_reader_languages")
    if not primary_markets:
        errors.append(f"{label} audience_compatibility requires primary_reader_markets")
    if not transport_languages:
        errors.append(f"{label} audience_compatibility requires transport_supported_content_languages")
    if str(value.get("fit_mode", "")).strip() != str(expected_fit_mode or "").strip():
        errors.append(f"{label} audience fit_mode does not match the frozen delivery mapping")
    fit_mode = value.get("fit_mode")
    if fit_mode not in DELIVERY_FIT_MODES:
        errors.append(f"{label} audience fit_mode is invalid")
    language = article_language.strip().casefold()
    normalized_market = market.strip().casefold()
    if language and language not in transport_languages:
        errors.append(f"{label} transport support does not include the frozen article language")
    primary_match = language in primary_languages and normalized_market in primary_markets
    if fit_mode == PRIMARY_AUDIENCE_FIT and not primary_match:
        errors.append(f"{label} primary-audience evidence does not match the frozen language and market")
    if fit_mode == CROSS_LANGUAGE_EXCEPTION_FIT:
        if primary_match:
            errors.append(f"{label} cross-language exception is not justified by its declared primary audience")
        if value.get("cross_language_exception_required") is not True:
            errors.append(f"{label} cross-language exception must be explicitly marked as owner-confirmation required")
    elif value.get("cross_language_exception_required") is not False:
        errors.append(f"{label} primary-audience match must not declare a cross-language exception")
    return errors


def human_native_release_policy_errors(cfg: object) -> list[str]:
    """Validate the sole executable release route for current campaigns."""
    if not isinstance(cfg, dict):
        return ["campaign configuration must be an object"]
    errors: list[str] = []
    expected_profile = (
        HUMAN_RELEASE_PROFILE_2_14
        if schema_2_14_or_newer(cfg)
        else HUMAN_RELEASE_PROFILE_2_9
    )
    if cfg.get("live_execution_profile") != expected_profile:
        errors.append("current schema requires the matching human-native release profile")
    release_policy = cfg.get("release_policy")
    if not isinstance(release_policy, dict):
        return errors + ["schema 2.9+ release_policy must be an object"]
    if release_policy.get("mode") != "HUMAN_NATIVE_ONLY":
        errors.append("schema 2.9+ release_policy.mode must be HUMAN_NATIVE_ONLY")
    if "human_release_requested" in release_policy:
        errors.append("schema 2.9+ must not contain release_policy.human_release_requested; human release is mandatory")
    if release_policy.get("machine_external_writes_allowed") is not False:
        errors.append("machine external writes must be false")
    return errors


def human_native_release_mapping_for_article(
    workspace: Path, cfg: dict, article_id: str,
) -> tuple[dict | None, dict | None, list[str]]:
    """Return the owner-confirmed release mapping required before W/R can start.

    ``check`` performs the full campaign-wide integrity audit.  This compact
    per-article check intentionally duplicates only the parts needed to stop a
    direct context build from bypassing that audit.
    """
    errors: list[str] = []
    article = article_record(cfg, article_id)
    if article is None:
        return None, None, ["article is not configured"]
    frozen_mapping, _, prewrite_errors = frozen_prewrite_declaration_for_article(workspace, cfg, article_id)
    errors.extend(prewrite_errors)
    scope = cfg.get("platform_scope")
    assignment_policy = cfg.get("article_platform_assignment")
    locale_policy = cfg.get("locale_platform_validation")
    if not isinstance(scope, dict):
        return None, None, ["human-native release requires platform_scope"]
    if not isinstance(assignment_policy, dict):
        return None, None, ["human-native release requires article_platform_assignment"]
    if not isinstance(locale_policy, dict):
        return None, None, ["human-native release requires locale_platform_validation"]
    assignments = assignment_policy.get("assignments")
    assignment = next(
        (
            item for item in assignments
            if isinstance(item, dict) and str(item.get("article_id", "")).strip() == article_id
        ),
        None,
    ) if isinstance(assignments, list) else None
    if not isinstance(assignment, dict):
        errors.append(f"article {article_id}: missing owner-confirmed platform/account assignment")
        return None, None, errors
    platform = str(assignment.get("platform", "")).strip()
    account = str(assignment.get("account", "")).strip()
    if not platform or not account:
        errors.append(f"article {article_id}: platform/account assignment must be non-empty")
    allowed_pairs = scope.get("allowed_pairs")
    allowed = {
        (str(item.get("platform", "")).strip().casefold(), str(item.get("account", "")).strip().casefold())
        for item in allowed_pairs if isinstance(item, dict)
    } if isinstance(allowed_pairs, list) else set()
    pair = (platform.casefold(), account.casefold())
    if isinstance(frozen_mapping, dict):
        if platform.casefold() != str(frozen_mapping.get("platform", "")).strip().casefold() or account.casefold() != str(frozen_mapping.get("account", "")).strip().casefold():
            errors.append(f"article {article_id}: assignment does not match the owner-visible frozen delivery mapping")
    if pair not in allowed:
        errors.append(f"article {article_id}: assignment is not an owner-confirmed allowed platform/account pair")

    selection = scope.get("selection_lock")
    lock_path: Path | None = None
    lock: dict | None = None
    if not isinstance(selection, dict) or selection.get("mode") != "OWNER_SOURCE_RECEIPTS_ONLY":
        errors.append(f"article {article_id}: owner platform selection lock is invalid")
    else:
        lock_path, lock_error = workspace_file(
            workspace, selection.get("path"), label="owner platform selection lock",
        )
        if lock_error:
            errors.append(lock_error)
        elif lock_path is not None:
            if selection.get("sha256") != sha256_file(lock_path):
                errors.append("owner platform selection lock hash does not match")
            lock, lock_error = json_object_file(lock_path, label="owner platform selection lock")
            if lock_error:
                errors.append(lock_error)
            elif lock is not None:
                if lock.get("campaign_id") != cfg.get("campaign_id") or lock.get("status") != "OWNER_CONFIRMED":
                    errors.append("owner platform selection lock must be OWNER_CONFIRMED for this campaign")

    expected_confirmation = None
    scope_lock = cfg.get("scope_lock")
    if isinstance(scope_lock, dict):
        bound_receipt = scope_lock.get("prewrite_plan_receipt")
        if isinstance(bound_receipt, dict):
            expected_confirmation = bound_receipt.get("owner_confirmation_id")
    if not non_empty_string(expected_confirmation):
        errors.append(f"article {article_id}: owner-confirmed pre-write receipt is not bound to the platform/account selection")
    elif isinstance(lock, dict):
        artifacts = lock.get("source_artifacts")
        receipts = lock.get("pair_receipts")
        artifact_by_id = {
            str(item.get("source_id", "")).strip(): item
            for item in artifacts if isinstance(item, dict) and non_empty_string(item.get("source_id"))
        } if isinstance(artifacts, list) else {}
        matching_receipts = [
            item for item in receipts if isinstance(item, dict)
            and str(item.get("article_id", "")).strip() == article_id
            and str(item.get("platform", "")).strip().casefold() == pair[0]
            and str(item.get("account", "")).strip().casefold() == pair[1]
            and item.get("status") == "EXPLICITLY_CONFIRMED"
            and item.get("owner_confirmation_id") == expected_confirmation
        ] if isinstance(receipts, list) else []
        if len(matching_receipts) != 1:
            errors.append(f"article {article_id}: requires exactly one matching owner-confirmed platform/account receipt")
        else:
            matching_receipt = matching_receipts[0]
            source_id = matching_receipt.get("source_id")
            source = artifact_by_id.get(str(source_id).strip())
            if source is None:
                errors.append(f"article {article_id}: platform/account receipt must reference an owner source artifact")
            else:
                source_path, source_error = workspace_file(
                    workspace, source.get("path"), label="owner platform selection source",
                )
                if source_error:
                    errors.append(source_error)
                elif source_path is not None and source.get("sha256") != sha256_file(source_path):
                    errors.append("owner platform selection source hash does not match")
            if isinstance(frozen_mapping, dict):
                language = str(article.get("language", "")).strip().casefold()
                market = str(article.get("market", "")).strip().casefold()
                if str(matching_receipt.get("article_language", "")).strip().casefold() != language or str(matching_receipt.get("market", "")).strip().casefold() != market:
                    errors.append(f"article {article_id}: owner receipt must bind the frozen article language and market")
                if str(matching_receipt.get("fit_mode", "")).strip() != str(frozen_mapping.get("fit_mode", "")).strip():
                    errors.append(f"article {article_id}: owner receipt fit_mode does not match the frozen delivery mapping")
                if not non_empty_string(matching_receipt.get("mapping_confirmation_literal")):
                    errors.append(f"article {article_id}: owner receipt requires exact mapping_confirmation_literal")
                if frozen_mapping.get("fit_mode") == CROSS_LANGUAGE_EXCEPTION_FIT:
                    exception = frozen_mapping.get("cross_language_exception")
                    required_literal = exception.get("requested_owner_confirmation_literal") if isinstance(exception, dict) else None
                    if matching_receipt.get("cross_language_exception_owner_confirmation_id") != expected_confirmation:
                        errors.append(f"article {article_id}: cross-language exception must bind the same owner confirmation ID")
                    if not non_empty_string(matching_receipt.get("cross_language_exception_literal")):
                        errors.append(f"article {article_id}: cross-language exception requires owner-confirmed literal")
                    elif non_empty_string(required_literal) and str(matching_receipt.get("cross_language_exception_literal")).strip() != str(required_literal).strip():
                        errors.append(f"article {article_id}: cross-language exception literal does not match the owner-visible request")
        proposal_ref = lock.get("matching_proposal")
        if not isinstance(proposal_ref, dict) or proposal_ref.get("researcher_role") != MATCHING_ROLE:
            errors.append(f"article {article_id}: owner selection lock requires a matching-researcher proposal")
        else:
            proposal_path, proposal_error = workspace_file(
                workspace, proposal_ref.get("path"), label="platform matching proposal",
            )
            if proposal_error:
                errors.append(proposal_error)
            elif proposal_path is not None:
                if proposal_ref.get("sha256") != sha256_file(proposal_path):
                    errors.append("platform matching proposal hash does not match")
                proposal, proposal_error = json_object_file(proposal_path, label="platform matching proposal")
                if proposal_error:
                    errors.append(proposal_error)
                elif proposal is not None:
                    language = str(article.get("language", "")).strip().casefold()
                    market = str(article.get("market", "")).strip().casefold()
                    matches = [
                        item for item in proposal.get("proposals", []) if isinstance(item, dict)
                        and str(item.get("article_id", "")).strip() == article_id
                        and str(item.get("platform", "")).strip().casefold() == pair[0]
                        and str(item.get("language", "")).strip().casefold() == language
                        and str(item.get("market", "")).strip().casefold() == market
                    ] if isinstance(proposal.get("proposals"), list) else []
                    if proposal.get("campaign_id") != cfg.get("campaign_id") or proposal.get("status") != "RECOMMENDED_PENDING_OWNER_CONFIRMATION" or len(matches) != 1:
                        errors.append(f"article {article_id}: assignment must preserve one matching visible platform recommendation")
                    elif isinstance(frozen_mapping, dict):
                        errors.extend(audience_compatibility_errors(
                            matches[0].get("audience_compatibility"),
                            article_language=str(article.get("language", "")),
                            market=str(article.get("market", "")),
                            expected_fit_mode=frozen_mapping.get("fit_mode"),
                            label=f"article {article_id} platform recommendation",
                        ))

    rows = locale_policy.get("rows")
    locale_row = next(
        (
            item for item in rows
            if isinstance(item, dict) and str(item.get("article_id", "")).strip() == article_id
        ),
        None,
    ) if isinstance(rows, list) else None
    if not isinstance(locale_row, dict):
        errors.append(f"article {article_id}: missing locale-platform compatibility evidence")
        return assignment, None, errors
    language = str(article.get("language", "")).strip().casefold()
    market = str(article.get("market", "")).strip().casefold()
    if (
        str(locale_row.get("article_language", "")).strip().casefold() != language
        or str(locale_row.get("market", "")).strip().casefold() != market
        or str(locale_row.get("platform", "")).strip().casefold() != pair[0]
        or str(locale_row.get("account", "")).strip().casefold() != pair[1]
    ):
        errors.append(f"article {article_id}: locale-platform row must exactly match the frozen article and platform/account assignment")
    if isinstance(frozen_mapping, dict):
        if str(locale_row.get("decision", "")).strip() != str(frozen_mapping.get("fit_mode", "")).strip():
            errors.append(f"article {article_id}: locale-platform decision does not match the frozen delivery mapping")
        errors.extend(audience_compatibility_errors(
            locale_row.get("audience_compatibility"),
            article_language=str(article.get("language", "")),
            market=str(article.get("market", "")),
            expected_fit_mode=frozen_mapping.get("fit_mode"),
            label=f"article {article_id} locale-platform row",
        ))
    else:
        supported = [
            str(value).strip().casefold()
            for value in locale_row.get("supported_content_languages", [])
        ] if isinstance(locale_row.get("supported_content_languages"), list) else []
        if not language or language not in supported:
            errors.append(f"article {article_id}: locale-platform row must declare support for the frozen article language")
        if not non_empty_string(locale_row.get("platform_language_evidence")) or str(locale_row.get("decision", "")).strip().upper() != "COMPATIBLE":
            errors.append(f"article {article_id}: locale-platform row requires evidence and a COMPATIBLE decision")
    return assignment, locale_row, errors


def active_findings_for_article(finding_status: object, article_id: str) -> list[dict]:
    """Keep review context compact while retaining IDs and lineage pointers."""
    if not isinstance(finding_status, dict):
        return []
    active: list[dict] = []
    closed = {"RESOLVED", "CLOSED", "ACCEPTED", "SUPERSEDED"}
    for finding_id, value in finding_status.items():
        if not isinstance(value, dict):
            continue
        owner_article = str(value.get("article_id", "")).strip()
        status = str(value.get("status", "OPEN")).strip().upper()
        if owner_article == article_id and status not in closed:
            active.append({
                "id": str(finding_id),
                "status": status,
                "supersedes": value.get("supersedes"),
                "split_from": value.get("split_from"),
                "report_path": value.get("report_path"),
            })
    return sorted(active, key=lambda item: item["id"])


def canonical_article_path_for_campaign(cfg: object) -> str:
    """Choose the unique canonical article source without rewriting history."""
    if isinstance(cfg, dict) and schema_at_least(cfg.get("schema_version"), 2, 12):
        return "canonical/article.html"
    return "canonical/article.md"


def build_article_context(workspace: Path, article_id: str, output: Path) -> int:
    """Create a compact article contract at its deterministic artifact root."""
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    st, state_error = read_workspace_json(workspace, "state.json")
    manifest, manifest_error = read_workspace_json(workspace, "prewrite-plan.json")
    errors = [error for error in (cfg_error, state_error, manifest_error) if error]
    if errors or cfg is None or st is None or manifest is None:
        print("ARTICLE_CONTEXT_BUILD_FAILED\n" + "\n".join(errors))
        return 1
    if st.get("prewrite_plan", {}).get("status") != "OWNER_PREWRITE_PLAN_CONFIRMED":
        print("ARTICLE_CONTEXT_BUILD_FAILED\nowner-confirmed pre-write plan is required before an article context can exist")
        return 1
    snapshot_errors = confirmed_scope_snapshot_errors(cfg, manifest)
    if snapshot_errors:
        print("ARTICLE_CONTEXT_BUILD_FAILED\n" + "\n".join(snapshot_errors))
        return 1
    article = article_record(cfg, article_id)
    plan = article_plan_record(manifest, article_id)
    if article is None or plan is None:
        print("ARTICLE_CONTEXT_BUILD_FAILED\narticle must exist exactly once in campaign.json and prewrite-plan.json")
        return 1
    try:
        artifact_root = article_artifact_root_relative(cfg, article_id)
    except ValueError as exc:
        print("ARTICLE_CONTEXT_BUILD_FAILED\n" + str(exc))
        return 1
    expected_context = workspace / artifact_root / "context/article-contract.json" if artifact_root else None
    if expected_context is not None and output.resolve() != expected_context.resolve():
        print(
            "ARTICLE_CONTEXT_BUILD_FAILED\n"
            f"main-session article context must be {relative_path(workspace, expected_context)}"
        )
        return 1
    policy_errors = human_native_release_policy_errors(cfg)
    assignment, locale_row, mapping_errors = human_native_release_mapping_for_article(workspace, cfg, article_id)
    if policy_errors or mapping_errors:
        print("ARTICLE_CONTEXT_BUILD_FAILED\n" + "\n".join(policy_errors + mapping_errors))
        return 1
    review_effort, review_errors = review_effort_for_plan(cfg, plan)
    if review_errors:
        print("ARTICLE_CONTEXT_BUILD_FAILED\n" + "\n".join(review_errors))
        return 1
    assert assignment is not None and locale_row is not None
    source_paths = ("campaign.json", "prewrite-plan.json", "requirements-contract.md")
    canonical_article_path = canonical_article_path_for_campaign(cfg)
    context = {
        "schema_version": ARTICLE_CONTEXT_SCHEMA,
        "campaign_id": cfg.get("campaign_id"),
        "article_id": article_id,
        "frozen_article": article,
        "prewrite_plan": plan,
        "review_effort": review_effort,
        "platform_assignment": assignment,
        "locale_platform_validation": locale_row,
        "source_hashes": {name: sha256_file(workspace / name) for name in source_paths},
        "artifact_root": artifact_root or ".",
        "artifact_paths": article_artifact_paths_for_campaign(cfg, article_id),
        "rehydration_protocol": MODEL_FIRST_REHYDRATION_PROTOCOL,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    dump(output, context)
    print(f"ARTICLE_CONTEXT_BUILT: {output}")
    return 0


def article_context_errors(workspace: Path, context_path: Path) -> list[str]:
    """Return source-of-truth drift errors for a compact lane context."""
    context, context_error = json_object_file(context_path, label="article context")
    errors: list[str] = [context_error] if context_error else []
    if context is None:
        return errors
    if context.get("schema_version") != ARTICLE_CONTEXT_SCHEMA:
        errors.append("article context schema_version must be 1.0")
    article_id = str(context.get("article_id", "")).strip()
    if not article_id:
        errors.append("article context requires article_id")
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    manifest, manifest_error = read_workspace_json(workspace, "prewrite-plan.json")
    if cfg_error:
        errors.append(cfg_error)
    if manifest_error:
        errors.append(manifest_error)
    if cfg is not None and article_id and context.get("frozen_article") != article_record(cfg, article_id):
        errors.append("article context frozen_article no longer matches campaign.json")
    if manifest is not None and article_id and context.get("prewrite_plan") != article_plan_record(manifest, article_id):
        errors.append("article context prewrite_plan no longer matches prewrite-plan.json")
    if cfg is not None and manifest is not None and article_id:
        plan = article_plan_record(manifest, article_id)
        if isinstance(plan, dict):
            expected_effort, effort_errors = review_effort_for_plan(cfg, plan)
            errors.extend(effort_errors)
            if (
                not effort_errors
                and (schema_at_least(cfg.get("schema_version"), 2, 6) or "review_effort" in context)
                and context.get("review_effort") != expected_effort
            ):
                errors.append("article context review_effort no longer matches the frozen plan")
        if schema_at_least(cfg.get("schema_version"), 2, 9):
            expected_assignment, expected_locale_row, mapping_errors = human_native_release_mapping_for_article(
                workspace, cfg, article_id,
            )
            errors.extend(mapping_errors)
            if expected_assignment is not None and context.get("platform_assignment") != expected_assignment:
                errors.append("article context platform_assignment no longer matches the owner-confirmed release mapping")
            if expected_locale_row is not None and context.get("locale_platform_validation") != expected_locale_row:
                errors.append("article context locale_platform_validation no longer matches the owner-confirmed release mapping")
    # Article contracts bind owner-frozen inputs only.  Older contracts may
    # retain an open_findings snapshot, but new R findings belong to the
    # mutable review index and must never invalidate this frozen capsule.
    if "open_findings" in context and not isinstance(context.get("open_findings"), list):
        errors.append("legacy article context open_findings must be a list when present")
    source_hashes = context.get("source_hashes")
    if not isinstance(source_hashes, dict):
        errors.append("article context requires source_hashes")
    else:
        for relative, expected_hash in source_hashes.items():
            path, path_error = workspace_file(workspace, relative, label="article context source")
            if path_error:
                errors.append(path_error)
            elif path is not None and expected_hash != sha256_file(path):
                errors.append(f"article context source hash changed: {relative}")
    expected_paths = article_artifact_paths_for_campaign(cfg, article_id) if cfg is not None and article_id else {}
    expected_root = article_artifact_root_relative(cfg, article_id) if cfg is not None and article_id else "."
    if uses_main_session_path_isolation(cfg) and context.get("artifact_root") != expected_root:
        errors.append("article context artifact_root is invalid")
    if context.get("artifact_paths") != expected_paths:
        errors.append("article context artifact paths are invalid")
    protocol = context.get("rehydration_protocol")
    if not isinstance(protocol, dict) or protocol.get("do_not_reload_unaffected_history") is not True:
        errors.append("article context rehydration protocol is invalid")
    elif cfg is not None and schema_at_least(cfg.get("schema_version"), 2, 6) and protocol != MODEL_FIRST_REHYDRATION_PROTOCOL:
        errors.append("model-first article context must reread the workflow core without reloading unrelated history")
    return errors


def check_article_context(workspace: Path, context_path: Path) -> int:
    """Verify that a compact lane capsule still represents the frozen source inputs."""
    errors = article_context_errors(workspace, context_path)
    if errors:
        print("ARTICLE_CONTEXT_INVALID\n" + "\n".join(errors))
        return 1
    print("ARTICLE_CONTEXT_VALID")
    return 0


def build_review_index(workspace: Path, context_path: Path, output: Path, canonical_path: Path | None) -> int:
    """Create a compact review baseline; it records pointers rather than duplicating research prose."""
    context_errors = article_context_errors(workspace, context_path)
    if context_errors:
        print("REVIEW_INDEX_BUILD_FAILED\narticle contract is stale or invalid\n" + "\n".join(context_errors))
        return 1
    context, error = json_object_file(context_path, label="article contract")
    if error or context is None:
        print("REVIEW_INDEX_BUILD_FAILED\n" + (error or "invalid article contract"))
        return 1
    if context.get("schema_version") != ARTICLE_CONTEXT_SCHEMA or not non_empty_string(context.get("article_id")):
        print("REVIEW_INDEX_BUILD_FAILED\narticle contract schema or article_id is invalid")
        return 1
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    if cfg_error or cfg is None:
        print("REVIEW_INDEX_BUILD_FAILED\n" + (cfg_error or "campaign.json is invalid"))
        return 1
    artifact_paths = context.get("artifact_paths")
    if not isinstance(artifact_paths, dict):
        print("REVIEW_INDEX_BUILD_FAILED\narticle contract artifact paths are invalid")
        return 1
    if uses_main_session_path_isolation(cfg):
        expected_output = workspace / str(artifact_paths.get("review_index", ""))
        expected_canonical = workspace / str(artifact_paths.get("canonical_article", ""))
        if output.resolve() != expected_output.resolve():
            print(
                "REVIEW_INDEX_BUILD_FAILED\n"
                f"main-session review index must be {relative_path(workspace, expected_output)}"
            )
            return 1
        if canonical_path is not None and canonical_path.resolve() != expected_canonical.resolve():
            print(
                "REVIEW_INDEX_BUILD_FAILED\n"
                f"main-session canonical article must be {relative_path(workspace, expected_canonical)}"
            )
            return 1
    state_record, state_error = read_workspace_json(workspace, "state.json")
    if state_error or state_record is None:
        print("REVIEW_INDEX_BUILD_FAILED\n" + (state_error or "state.json is invalid"))
        return 1
    canonical = canonical_path or workspace / str(artifact_paths.get("canonical_article", "canonical/article.md"))
    canonical_record = {"path": relative_path(workspace, canonical), "sha256": sha256_file(canonical)} if canonical.is_file() else {"path": relative_path(workspace, canonical), "sha256": None}
    review_effort = context.get("review_effort")
    review_effort_errors = model_first_review_effort_errors(review_effort, cfg_or_version=cfg)
    if review_effort_errors:
        print("REVIEW_INDEX_BUILD_FAILED\narticle contract review_effort is invalid\n" + "\n".join(review_effort_errors))
        return 1
    is_wq = author_qa_route(review_effort)
    independent = independent_review_route(review_effort)
    research_required = research_review_required(review_effort)
    if is_wq:
        research_record = {
            "status": "NOT_REQUIRED",
            "coverage": "INTEGRATED_IN_AUTHOR_QA",
            "report_path": None, "report_sha256": None,
            "reviewer_agent_id": None, "reviewed_evidence_pack_sha256": None,
        }
        full_record = {
            "status": "NOT_REQUIRED", "report_path": None, "report_sha256": None,
            "reviewer_agent_id": None, "canonical_sha256": None,
            "evidence_pack_sha256": None, "metadata_sha256": None, "visual_manifest_sha256": None,
            "visual_payload_sha256": None, "visual_payload_markdown_sha256": None,
            "article_package_sha256": None,
        }
        route_resolution = dict(AUTHOR_QA_ROUTE_RESOLUTION)
    else:
        research_record = {
            "status": "PENDING" if research_required else "NOT_REQUIRED",
            "coverage": None if research_required else "INTEGRATED_IN_FULL_REVIEW",
            "report_path": None, "report_sha256": None,
            "reviewer_agent_id": None, "reviewed_evidence_pack_sha256": None,
        }
        full_record = {
            "status": "PENDING", "report_path": None, "report_sha256": None,
            "reviewer_agent_id": None, "canonical_sha256": canonical_record["sha256"],
            "evidence_pack_sha256": None, "metadata_sha256": None, "visual_manifest_sha256": None,
            "visual_payload_sha256": None, "visual_payload_markdown_sha256": None,
            "article_package_sha256": None,
        }
        route_resolution = dict(WR_ROUTE_RESOLUTION) if schema_2_14_or_newer(cfg) and independent else None
    index = {
        "schema_version": REVIEW_INDEX_SCHEMA,
        "article_id": context["article_id"],
        "article_contract": {"path": relative_path(workspace, context_path), "sha256": sha256_file(context_path)},
        "canonical": canonical_record,
        "open_findings": active_findings_for_article(state_record.get("finding_status"), context["article_id"]),
        "review_effort": review_effort,
        "route_resolution": route_resolution,
        "latest_research_review": research_record,
        "latest_author_qa": {
            "status": "PENDING" if is_wq else "NOT_REQUIRED",
            "receipt_path": None, "receipt_sha256": None, "author_agent_id": None,
            "self_qa_protocol": AUTHOR_QA_PROTOCOL if is_wq else None,
            "candidate_canonical_sha256": None, "canonical_sha256": None,
            "evidence_pack_sha256": None, "metadata_sha256": None, "visual_manifest_sha256": None,
            "visual_payload_sha256": None, "visual_payload_markdown_sha256": None,
            "article_package_sha256": None, "open_finding_ids": [],
        },
        "latest_full_review": full_record,
        "last_delta": None,
        "read_protocol": context.get("rehydration_protocol"),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    dump(output, index)
    print(f"REVIEW_INDEX_BUILT: {output}")
    return 0


def review_record_errors(
    workspace: Path, record: object, *, label: str, allowed_statuses: set[str],
    approved_status: str, require_approved: bool, expected_artifact_sha256: str | None = None,
    artifact_field: str | None = None, pending_allows_artifact: bool = False,
) -> list[str]:
    """Validate one small R decision receipt without trying to score the report text."""
    if not isinstance(record, dict):
        return [f"review index requires {label}"]
    errors: list[str] = []
    status = record.get("status")
    if status not in allowed_statuses:
        errors.append(f"{label} has an invalid status")
    if status in {"PENDING", "NOT_REQUIRED"}:
        for field in ("report_path", "report_sha256", "reviewer_agent_id"):
            if record.get(field) not in {None, ""}:
                errors.append(f"{status.lower()} {label} may not carry {field}")
        if artifact_field is not None and not pending_allows_artifact and record.get(artifact_field) not in {None, ""}:
            errors.append(f"{status.lower()} {label} may not carry {artifact_field}")
    else:
        for field in ("report_path", "report_sha256", "reviewer_agent_id"):
            if not non_empty_string(record.get(field)):
                errors.append(f"{label} requires {field}")
        report_path, report_error = workspace_file(workspace, record.get("report_path"), label=f"{label} report")
        if report_error:
            errors.append(report_error)
        elif report_path is not None and record.get("report_sha256") != sha256_file(report_path):
            errors.append(f"{label} report_sha256 does not match")
        if artifact_field is not None:
            if not non_empty_string(record.get(artifact_field)):
                errors.append(f"{label} requires {artifact_field}")
            elif expected_artifact_sha256 is not None and record.get(artifact_field) != expected_artifact_sha256:
                errors.append(f"{label} {artifact_field} does not match")
    if require_approved and status != approved_status:
        errors.append(f"handoff requires {label} status {approved_status}")
    return errors


def author_qa_record_errors(
    workspace: Path, record: object, *, require_ready: bool,
    expected_hashes: dict[str, str | None],
) -> list[str]:
    """Validate the compact WQ receipt without calling it an independent review."""
    if not isinstance(record, dict):
        return ["review index requires latest_author_qa"]
    errors: list[str] = []
    status = record.get("status")
    if status not in AUTHOR_QA_STATUSES:
        errors.append("latest_author_qa has an invalid status")
        return errors
    if status in {"PENDING", "NOT_REQUIRED"}:
        for field in ("receipt_path", "receipt_sha256", "author_agent_id"):
            if record.get(field) not in {None, ""}:
                errors.append(f"{status.lower()} latest_author_qa may not carry {field}")
        if status == "NOT_REQUIRED" and record.get("self_qa_protocol") not in {None, ""}:
            errors.append("not_required latest_author_qa may not carry self_qa_protocol")
    else:
        for field in ("receipt_path", "receipt_sha256", "author_agent_id"):
            if not non_empty_string(record.get(field)):
                errors.append(f"latest_author_qa requires {field}")
        receipt_path, receipt_error = workspace_file(
            workspace, record.get("receipt_path"), label="latest_author_qa receipt",
        )
        if receipt_error:
            errors.append(receipt_error)
        elif receipt_path is not None and record.get("receipt_sha256") != sha256_file(receipt_path):
            errors.append("latest_author_qa receipt_sha256 does not match")
        if record.get("self_qa_protocol") != AUTHOR_QA_PROTOCOL:
            errors.append("latest_author_qa self_qa_protocol is invalid")
        finding_ids = record.get("open_finding_ids")
        if not isinstance(finding_ids, list) or any(not non_empty_string(item) for item in finding_ids):
            errors.append("latest_author_qa open_finding_ids must be a list of non-empty IDs")
        if status == "AUTHOR_QA_READY":
            if finding_ids != []:
                errors.append("AUTHOR_QA_READY requires zero open_finding_ids")
            if not non_empty_string(record.get("candidate_canonical_sha256")):
                errors.append("AUTHOR_QA_READY requires candidate_canonical_sha256")
            for field, expected in expected_hashes.items():
                if not non_empty_string(record.get(field)):
                    errors.append(f"AUTHOR_QA_READY requires {field}")
                elif expected is None or record.get(field) != expected:
                    errors.append(f"AUTHOR_QA_READY {field} does not match the current artifact")
    if require_ready and status != "AUTHOR_QA_READY":
        errors.append("handoff requires latest_author_qa status AUTHOR_QA_READY")
    return errors


def author_qa_route_resolution_errors(index: dict, *, require_final_quality: bool) -> tuple[list[str], str]:
    """Return the effective WQ/WR mode and reject silent route changes."""
    resolution = index.get("route_resolution")
    if not isinstance(resolution, dict):
        return ["AUTHOR_QA_INTEGRATED requires route_resolution"], "INVALID"
    expected_planned = "WQ_SHARED_CONTEXT"
    if resolution.get("planned_quality_mode") != expected_planned:
        return ["WQ route_resolution planned_quality_mode must be WQ_SHARED_CONTEXT"], "INVALID"
    triggers = resolution.get("escalation_trigger_ids")
    if not isinstance(triggers, list) or any(not non_empty_string(item) for item in triggers):
        return ["WQ route_resolution escalation_trigger_ids must be a list of non-empty IDs"], "INVALID"
    status = resolution.get("status")
    effective = resolution.get("effective_quality_mode")
    if status == "NOT_ESCALATED":
        errors = []
        if effective != "WQ_SHARED_CONTEXT":
            errors.append("un-escalated WQ route must retain WQ_SHARED_CONTEXT")
        if triggers:
            errors.append("un-escalated WQ route may not carry escalation_trigger_ids")
        return errors, "WQ_SHARED_CONTEXT"
    if status == "WR_ESCALATION_REQUIRED":
        errors = []
        if effective != "WQ_SHARED_CONTEXT":
            errors.append("pending WQ escalation must retain WQ_SHARED_CONTEXT until an independent R is registered")
        if not triggers:
            errors.append("WQ escalation requires at least one stable escalation trigger ID")
        if require_final_quality:
            errors.append("handoff is blocked while WQ escalation is still pending")
        return errors, "WQ_SHARED_CONTEXT"
    if status == "WR_ESCALATED":
        errors = []
        if effective != "WR_INDEPENDENT_ESCALATED":
            errors.append("escalated WQ route must use WR_INDEPENDENT_ESCALATED")
        if not triggers:
            errors.append("escalated WQ route requires at least one stable escalation trigger ID")
        return errors, "WR_INDEPENDENT_ESCALATED"
    return ["WQ route_resolution status must be NOT_ESCALATED, WR_ESCALATION_REQUIRED or WR_ESCALATED"], "INVALID"


def independent_route_resolution_errors(index: dict, review_effort: dict) -> list[str]:
    """Validate the explicit 2.14 WR declaration while tolerating 2.13 indexes."""
    resolution = index.get("route_resolution")
    if resolution is None or resolution == "":
        return []
    if not isinstance(resolution, dict):
        return ["WR route_resolution must be an object when present"]
    if resolution.get("planned_quality_mode") != "WR_INDEPENDENT":
        return ["WR route_resolution planned_quality_mode must be WR_INDEPENDENT"]
    if resolution.get("effective_quality_mode") != "WR_INDEPENDENT":
        return ["WR route_resolution effective_quality_mode must be WR_INDEPENDENT"]
    if resolution.get("status") != "NOT_APPLICABLE":
        return ["WR route_resolution status must be NOT_APPLICABLE"]
    triggers = resolution.get("escalation_trigger_ids")
    if not isinstance(triggers, list) or triggers:
        return ["WR route_resolution escalation_trigger_ids must be an empty list"]
    return []


def final_artifact_hashes(workspace: Path, context: dict, canonical: object) -> dict[str, str | None]:
    """Resolve only the bounded final sources that a quality receipt must bind."""
    paths = context.get("artifact_paths") if isinstance(context.get("artifact_paths"), dict) else {}
    values: dict[str, str | None] = {
        "canonical_sha256": canonical.get("sha256") if isinstance(canonical, dict) else None,
        "evidence_pack_sha256": None,
        "metadata_sha256": None,
        "visual_manifest_sha256": None,
        "visual_payload_sha256": None,
        "visual_payload_markdown_sha256": None,
        "article_package_sha256": None,
    }
    for field, path_key in (
        ("evidence_pack_sha256", "evidence_pack"),
        ("metadata_sha256", "metadata"),
        ("visual_manifest_sha256", "visual_manifest"),
        ("visual_payload_sha256", "visual_payload"),
        ("visual_payload_markdown_sha256", "visual_payload_markdown"),
        ("article_package_sha256", "article_package"),
    ):
        path, path_error = workspace_file(workspace, paths.get(path_key), label=f"review index {path_key}")
        if path_error is None and path is not None:
            values[field] = sha256_file(path)
    return values


def review_index_errors(
    workspace: Path, index_path: Path, *, require_research_approved: bool = False,
    require_full_approved: bool = False,
) -> list[str]:
    """Verify the route-appropriate, hash-bound quality receipt.

    ``require_full_approved`` is retained as a CLI-compatible parameter name.
    On a WQ route it means "require final quality readiness", not an invented
    independent full review.
    """
    index, index_error = json_object_file(index_path, label="review index")
    errors: list[str] = [index_error] if index_error else []
    if index is None:
        return errors
    if index.get("schema_version") != REVIEW_INDEX_SCHEMA:
        errors.append("review index schema_version must be 1.0")
    article_id = str(index.get("article_id", "")).strip()
    if not article_id:
        errors.append("review index requires article_id")
    context: dict | None = None
    contract = index.get("article_contract")
    if not isinstance(contract, dict):
        errors.append("review index requires article_contract")
    else:
        context_path, context_error = workspace_file(workspace, contract.get("path"), label="review index article_contract")
        if context_error:
            errors.append(context_error)
        elif context_path is not None:
            if contract.get("sha256") != sha256_file(context_path):
                errors.append("review index article contract hash does not match")
            errors.extend(article_context_errors(workspace, context_path))
            context, parsed_context_error = json_object_file(context_path, label="article context")
            if parsed_context_error or context is None:
                errors.append(parsed_context_error or "article context is invalid")
            elif context.get("article_id") != article_id:
                errors.append("review index article_id does not match article context")
    canonical = index.get("canonical")
    if not isinstance(canonical, dict):
        errors.append("review index requires canonical record")
    else:
        canonical_path, canonical_error = workspace_file(workspace, canonical.get("path"), label="review index canonical path")
        if canonical_error:
            errors.append(canonical_error)
        elif canonical_path is not None and canonical.get("sha256") is not None and canonical.get("sha256") != sha256_file(canonical_path):
            errors.append("review index canonical hash does not match")
    if not isinstance(index.get("open_findings"), list):
        errors.append("review index open_findings must be a list")
    context_effort = context.get("review_effort") if isinstance(context, dict) else None
    index_effort = index.get("review_effort")
    if isinstance(context_effort, dict):
        if index_effort != context_effort:
            errors.append("review index review_effort does not match article contract")
    elif index_effort not in {None, ""}:
        errors.append("legacy article contract may not introduce a review_effort in the review index")
    effective_effort = context_effort if isinstance(context_effort, dict) else LEGACY_REVIEW_EFFORT
    if isinstance(context_effort, dict):
        cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
        if cfg_error:
            errors.append(cfg_error)
        else:
            errors.extend(model_first_review_effort_errors(effective_effort, cfg_or_version=cfg or {}))
    expected_hashes = final_artifact_hashes(workspace, context, canonical) if isinstance(context, dict) else {
        field: None for field in FINAL_QUALITY_HASH_FIELDS
    }
    evidence_pack_sha256 = expected_hashes["evidence_pack_sha256"]
    if evidence_pack_sha256 is None and (require_research_approved or require_full_approved):
        errors.append("review index evidence pack is missing or unreadable")
    research_required = research_review_required(effective_effort)
    research_record = index.get("latest_research_review")
    errors.extend(review_record_errors(
        workspace, research_record, label="latest_research_review",
        allowed_statuses=RESEARCH_REVIEW_STATUSES, approved_status="RESEARCH_APPROVED",
        require_approved=require_research_approved and research_required, expected_artifact_sha256=evidence_pack_sha256,
        artifact_field="reviewed_evidence_pack_sha256",
    ))
    if research_required:
        if isinstance(research_record, dict) and research_record.get("status") == "NOT_REQUIRED":
            errors.append("this WR route requires a separate research review")
    elif isinstance(research_record, dict):
        if research_record.get("status") != "NOT_REQUIRED":
            errors.append("an integrated quality route must not create a separate research-review gate")
        expected_coverage = "INTEGRATED_IN_AUTHOR_QA" if author_qa_route(effective_effort) else "INTEGRATED_IN_FULL_REVIEW"
        if research_record.get("coverage") != expected_coverage:
            errors.append(f"integrated quality route requires {expected_coverage} coverage")

    if author_qa_route(effective_effort):
        resolution_errors, effective_mode = author_qa_route_resolution_errors(
            index, require_final_quality=require_full_approved,
        )
        errors.extend(resolution_errors)
        author_record = index.get("latest_author_qa")
        author_needs_ready = require_full_approved and effective_mode == "WQ_SHARED_CONTEXT"
        errors.extend(author_qa_record_errors(
            workspace, author_record, require_ready=author_needs_ready,
            expected_hashes=expected_hashes,
        ))
        full_record = index.get("latest_full_review")
        if effective_mode == "WQ_SHARED_CONTEXT":
            errors.extend(review_record_errors(
                workspace, full_record, label="latest_full_review",
                allowed_statuses=FULL_REVIEW_STATUSES, approved_status="APPROVED",
                require_approved=False, expected_artifact_sha256=expected_hashes["canonical_sha256"],
                artifact_field="canonical_sha256", pending_allows_artifact=True,
            ))
            if not isinstance(full_record, dict) or full_record.get("status") != "NOT_REQUIRED":
                errors.append("un-escalated AUTHOR_QA_INTEGRATED must not carry a full R review")
            if author_needs_ready and index.get("open_findings") != []:
                errors.append("AUTHOR_QA_READY requires the review index to have zero open_findings")
        elif effective_mode == "WR_INDEPENDENT_ESCALATED":
            if isinstance(author_record, dict) and author_record.get("status") != "AUTHOR_QA_ESCALATION_REQUIRED":
                errors.append("escalated WQ route requires AUTHOR_QA_ESCALATION_REQUIRED before independent R")
            errors.extend(review_record_errors(
                workspace, full_record, label="latest_full_review",
                allowed_statuses=FULL_REVIEW_STATUSES, approved_status="APPROVED",
                require_approved=require_full_approved, expected_artifact_sha256=expected_hashes["canonical_sha256"],
                artifact_field="canonical_sha256", pending_allows_artifact=True,
            ))
            if isinstance(full_record, dict) and full_record.get("status") == "APPROVED":
                if full_record.get("evidence_pack_sha256") != evidence_pack_sha256:
                    errors.append("escalated WQ independent full review evidence_pack_sha256 does not match")
        return errors

    # Independent WR routes retain the existing R receipt and delta semantics.
    errors.extend(independent_route_resolution_errors(index, effective_effort))
    full_record = index.get("latest_full_review")
    errors.extend(review_record_errors(
        workspace, full_record, label="latest_full_review",
        allowed_statuses=FULL_REVIEW_STATUSES, approved_status="APPROVED",
        require_approved=require_full_approved, expected_artifact_sha256=expected_hashes["canonical_sha256"],
        artifact_field="canonical_sha256", pending_allows_artifact=True,
    ))
    if isinstance(full_record, dict) and full_record.get("status") == "APPROVED":
        if full_record.get("evidence_pack_sha256") != evidence_pack_sha256:
            errors.append("independent final review evidence_pack_sha256 does not match")
    return errors


def check_review_index(workspace: Path, index_path: Path) -> int:
    """Verify review-baseline provenance before an R full or delta turn."""
    errors = review_index_errors(workspace, index_path)
    if errors:
        print("REVIEW_INDEX_INVALID\n" + "\n".join(errors))
        return 1
    print("REVIEW_INDEX_VALID")
    return 0


def registered_reviewer_id(workspace: Path, article_id: str) -> tuple[str | None, list[str]]:
    """Resolve the one visible R registered for an article lane."""
    state, state_error = read_workspace_json(workspace, "state.json")
    if state_error or state is None:
        return None, [state_error or "state.json is invalid"]
    orchestration = state.get("orchestration")
    workspaces = orchestration.get("article_workspaces") if isinstance(orchestration, dict) else None
    lane = workspaces.get(article_id) if isinstance(workspaces, dict) else None
    bundle = lane.get("role_bundle") if isinstance(lane, dict) else None
    reviewer_id = bundle.get("reviewer_agent") if isinstance(bundle, dict) else None
    if not non_empty_string(reviewer_id):
        return None, ["handoff requires the registered article lane reviewer"]
    return reviewer_id, []


def registered_writer_id(workspace: Path, article_id: str) -> tuple[str | None, list[str]]:
    """Resolve the visible W that owns a WQ receipt for this article."""
    state, state_error = read_workspace_json(workspace, "state.json")
    if state_error or state is None:
        return None, [state_error or "state.json is invalid"]
    orchestration = state.get("orchestration")
    workspaces = orchestration.get("article_workspaces") if isinstance(orchestration, dict) else None
    lane = workspaces.get(article_id) if isinstance(workspaces, dict) else None
    bundle = lane.get("role_bundle") if isinstance(lane, dict) else None
    writer_id = bundle.get("writer_agent") if isinstance(bundle, dict) else None
    if not non_empty_string(writer_id):
        return None, ["handoff requires the registered article writer for AUTHOR_QA"]
    return writer_id, []


def visible_quality_task_receipt_errors(
    workspace: Path, *, article_id: str, agent_role: str, agent_id: str,
    workflow_stage: str, result: str, result_path: str,
) -> list[str]:
    """Require a visible WQ or WR task without pretending they are the same role."""
    state, state_error = read_workspace_json(workspace, "state.json")
    if state_error or state is None:
        return [state_error or "state.json is invalid"]
    orchestration = state.get("orchestration")
    tasks = orchestration.get("tasks") if isinstance(orchestration, dict) else None
    if not isinstance(tasks, list):
        return ["handoff requires the visible task ledger"]
    for task in tasks:
        if not isinstance(task, dict):
            continue
        if (
            task.get("article_id") == article_id
            and task.get("role") == agent_role
            and task.get("agent_id") == agent_id
            and task.get("workflow_stage") == workflow_stage
            and task.get("result") == result
            and task.get("result_path") == result_path
            and task.get("status") == "COMPLETED"
        ):
            return []
    return [
        "handoff requires a completed visible quality task for "
        f"{workflow_stage} at {result_path}"
    ]


def reviewer_task_receipt_errors(
    workspace: Path, *, article_id: str, reviewer_agent_id: str, workflow_stage: str,
    result: str, report_path: str,
) -> list[str]:
    """Compatibility wrapper for a visible independent R task receipt."""
    return visible_quality_task_receipt_errors(
        workspace, article_id=article_id, agent_role="ARTICLE_LANGUAGE_REVIEWER",
        agent_id=reviewer_agent_id, workflow_stage=workflow_stage,
        result=result, result_path=report_path,
    )


def handoff_review_approval_errors(
    workspace: Path, article_id: str, *, article_root: Path | None = None,
) -> tuple[list[str], dict | None, str | None]:
    """Bind hand-off to the truthful WQ or WR final quality credential."""
    root = article_root or workspace
    index_path = root / "reviews/review-index.json"
    index, index_error = json_object_file(index_path, label="handoff review index")
    errors: list[str] = []
    if index_error or index is None:
        errors.extend(review_index_errors(workspace, index_path, require_full_approved=True))
        errors.append(index_error or "handoff requires a review index")
        return errors, None, None
    review_effort = index.get("review_effort")
    requires_research = research_review_required(review_effort) if isinstance(review_effort, dict) else True
    errors.extend(review_index_errors(
        workspace, index_path,
        require_research_approved=requires_research,
        require_full_approved=True,
    ))
    if index.get("article_id") != article_id:
        errors.append("handoff review index article_id does not match article package")
    resolution_errors, effective_mode = (
        author_qa_route_resolution_errors(index, require_final_quality=True)
        if author_qa_route(review_effort)
        else ([], "WR_INDEPENDENT")
    )
    errors.extend(resolution_errors)
    if effective_mode == "WQ_SHARED_CONTEXT":
        writer_id, writer_errors = registered_writer_id(workspace, article_id)
        errors.extend(writer_errors)
        if writer_id is None:
            return errors, index, None
        author = index.get("latest_author_qa")
        if not isinstance(author, dict):
            errors.append("handoff requires latest_author_qa")
        else:
            if author.get("author_agent_id") != writer_id:
                errors.append("latest_author_qa author_agent_id must match the registered article writer")
            receipt_path = author.get("receipt_path")
            if non_empty_string(receipt_path):
                errors.extend(visible_quality_task_receipt_errors(
                    workspace, article_id=article_id, agent_role="ARTICLE_WRITER",
                    agent_id=writer_id, workflow_stage="AUTHOR_QA",
                    result="AUTHOR_QA_READY", result_path=receipt_path,
                ))
        return errors, index, writer_id

    reviewer_id, reviewer_errors = registered_reviewer_id(workspace, article_id)
    errors.extend(reviewer_errors)
    if reviewer_id is None:
        return errors, index, None
    full = index.get("latest_full_review")
    review_receipts = [("latest_full_review", full, "FULL_REVIEW", "APPROVED")]
    if requires_research:
        review_receipts.insert(0, ("latest_research_review", index.get("latest_research_review"), "RESEARCH_REVIEW", "RESEARCH_APPROVED"))
    for label, record, stage, result in review_receipts:
        if not isinstance(record, dict):
            continue
        if record.get("reviewer_agent_id") != reviewer_id:
            errors.append(f"{label} reviewer_agent_id must match the registered article reviewer")
            continue
        report_path = record.get("report_path")
        if non_empty_string(report_path):
            errors.extend(reviewer_task_receipt_errors(
                workspace, article_id=article_id, reviewer_agent_id=reviewer_id,
                workflow_stage=stage, result=result, report_path=report_path,
            ))
    return errors, index, reviewer_id


def current_handoff_review_binding(
    workspace: Path, package: dict, package_path: Path, review_index: dict | None,
    *, metadata_sha256: str | None, visual_manifest_sha256: str | None,
    visual_payload_sha256: str | None, visual_payload_markdown_sha256: str | None,
    evidence_pack_sha256: str | None,
    article_id: str, reviewer_agent_id: str | None,
) -> tuple[list[str], str | None]:
    """Resolve the WQ or independent-WR handoff proof.

    A WQ receipt is truthful only for a same-author adversarial self-QA and
    never grants the semantic label of an independent review.  R-Delta remains
    available only after an actual independent WR full review.
    """
    if not isinstance(review_index, dict):
        return ["handoff requires a review index for final quality bindings"], None
    expected = {
        "canonical_sha256": package.get("canonical_sha256"),
        "evidence_pack_sha256": evidence_pack_sha256,
        "metadata_sha256": metadata_sha256,
        "visual_manifest_sha256": visual_manifest_sha256,
        "visual_payload_sha256": visual_payload_sha256,
        "visual_payload_markdown_sha256": visual_payload_markdown_sha256,
        "article_package_sha256": sha256_file(package_path),
    }
    review_effort = review_index.get("review_effort")
    if author_qa_route(review_effort):
        resolution_errors, effective_mode = author_qa_route_resolution_errors(
            review_index, require_final_quality=True,
        )
        if resolution_errors:
            return resolution_errors, None
        if effective_mode == "WQ_SHARED_CONTEXT":
            author = review_index.get("latest_author_qa")
            if not isinstance(author, dict) or author.get("status") != "AUTHOR_QA_READY":
                return ["handoff requires AUTHOR_QA_READY on an un-escalated WQ route"], None
            errors: list[str] = []
            for field, expected_hash in expected.items():
                if not non_empty_string(author.get(field)):
                    errors.append(f"AUTHOR_QA_READY requires {field}")
                elif expected_hash is None or author.get(field) != expected_hash:
                    errors.append(f"AUTHOR_QA_READY {field} does not match the final artifact")
            if not non_empty_string(author.get("candidate_canonical_sha256")):
                errors.append("AUTHOR_QA_READY requires candidate_canonical_sha256")
            if author.get("open_finding_ids") != []:
                errors.append("AUTHOR_QA_READY requires zero open_finding_ids")
            if errors:
                return errors, None
            return [], "AUTHOR_QA_COVERS_FINAL_PAYLOAD"
        # A documented WQ escalation now follows the ordinary independent
        # branch below; it does not regain an author-QA delta shortcut.
    full = review_index.get("latest_full_review")
    if not isinstance(full, dict) or full.get("status") != "APPROVED":
        return ["handoff requires an APPROVED independent final full review"], None
    errors: list[str] = []
    for field, expected_hash in expected.items():
        if not non_empty_string(full.get(field)):
            errors.append(f"final full review requires {field}")
        elif expected_hash is None or full.get(field) != expected_hash:
            errors.append(f"final full review {field} does not match the final artifact")
    if not errors:
        return [], "FULL_REVIEW_COVERS_FINAL_PAYLOAD"

    # A bounded R-Delta may review a documented post-full repair without
    # reloading the entire article.  It remains tied to the approved full-R
    # baseline, the same reviewer, and every current delivery artifact.
    delta = review_index.get("last_delta")
    if not isinstance(delta, dict) or delta.get("status") != "APPROVED":
        return errors, None
    review_scope = delta.get("review_scope")
    if review_scope not in {"R_DELTA", "R_VISUAL_DELTA"}:
        return errors, None
    required = (
        "report_path", "report_sha256", "reviewer_agent_id", "reviewed_canonical_sha256",
        "reviewed_metadata_sha256", "reviewed_visual_manifest_sha256",
        "reviewed_visual_payload_sha256", "reviewed_visual_payload_markdown_sha256",
        "reviewed_article_package_sha256",
    )
    label = "final visual delta" if review_scope == "R_VISUAL_DELTA" else "final targeted delta"
    delta_errors = [f"{label} requires {field}" for field in required if not non_empty_string(delta.get(field))]
    if reviewer_agent_id is not None and delta.get("reviewer_agent_id") != reviewer_agent_id:
        delta_errors.append(f"{label} reviewer_agent_id must match the registered article reviewer")
    report_path = delta.get("report_path")
    if non_empty_string(report_path):
        report, report_error = workspace_file(workspace, report_path, label=f"{label} report")
        if report_error:
            delta_errors.append(report_error)
        elif report is not None and delta.get("report_sha256") != sha256_file(report):
            delta_errors.append(f"{label} report_sha256 does not match")
    expected_delta = {
        "reviewed_canonical_sha256": expected["canonical_sha256"],
        "reviewed_metadata_sha256": expected["metadata_sha256"],
        "reviewed_visual_manifest_sha256": expected["visual_manifest_sha256"],
        "reviewed_visual_payload_sha256": expected["visual_payload_sha256"],
        "reviewed_visual_payload_markdown_sha256": expected["visual_payload_markdown_sha256"],
        "reviewed_article_package_sha256": expected["article_package_sha256"],
    }
    for field, expected_hash in expected_delta.items():
        if expected_hash is None or delta.get(field) != expected_hash:
            delta_errors.append(f"{label} {field} does not match the final artifact")
    if review_scope == "R_VISUAL_DELTA":
        for field in ("canonical_sha256", "metadata_sha256", "evidence_pack_sha256"):
            if field not in expected:
                continue
            if full.get(field) != expected[field]:
                delta_errors.append(f"final visual delta cannot replace full-review {field}")
    else:
        if delta.get("full_review_required") is True:
            delta_errors.append("final targeted delta may not replace a required full review")
        if delta.get("baseline_full_review_report_sha256") != full.get("report_sha256"):
            delta_errors.append("final targeted delta must bind the approved full-review report hash")
        if "evidence_pack_sha256" in expected and delta.get("reviewed_evidence_pack_sha256") != expected["evidence_pack_sha256"]:
            delta_errors.append("final targeted delta reviewed_evidence_pack_sha256 does not match the final artifact")
    if reviewer_agent_id is not None and non_empty_string(report_path):
        delta_errors.extend(reviewer_task_receipt_errors(
            workspace, article_id=article_id, reviewer_agent_id=reviewer_agent_id,
            workflow_stage="VISUAL_PAYLOAD_DELTA" if review_scope == "R_VISUAL_DELTA" else "REVIEW_DELTA",
            result=FINAL_VISUAL_DELTA_RESULT,
            report_path=report_path,
        ))
    if delta_errors:
        return errors + delta_errors, None
    return [], "POST_FULL_REVIEW_VISUAL_DELTA" if review_scope == "R_VISUAL_DELTA" else "POST_FULL_REVIEW_TARGETED_DELTA"


def final_quality_receipt_from_index(index: object) -> tuple[dict | None, list[str]]:
    """Project WQ or WR evidence into G's route-truthful compact credential.

    G needs to bind a completed quality route but must never relabel WQ as an
    R approval.  The caller separately validates files and final hashes with
    ``review_index_errors``; this helper only normalizes the identity surface
    used by the batch report.
    """
    if not isinstance(index, dict):
        return None, ["quality receipt requires a review index object"]
    effort = index.get("review_effort")
    if author_qa_route(effort):
        resolution_errors, effective_mode = author_qa_route_resolution_errors(
            index, require_final_quality=True,
        )
        if resolution_errors:
            return None, resolution_errors
        if effective_mode == "WQ_SHARED_CONTEXT":
            record = index.get("latest_author_qa")
            if not isinstance(record, dict):
                return None, ["WQ quality receipt requires latest_author_qa"]
            return {
                "quality_mode": "WQ_SHARED_CONTEXT",
                "status": record.get("status"),
                "agent_role": "ARTICLE_WRITER",
                "agent_id": record.get("author_agent_id"),
                "receipt_path": record.get("receipt_path"),
                "receipt_sha256": record.get("receipt_sha256"),
            }, []
        quality_mode = "WR_INDEPENDENT_ESCALATED"
    else:
        quality_mode = "WR_INDEPENDENT" if independent_review_route(effort) else "WR_INDEPENDENT_LEGACY"
    record = index.get("latest_full_review")
    if not isinstance(record, dict):
        return None, ["WR quality receipt requires latest_full_review"]
    return {
        "quality_mode": quality_mode,
        "status": record.get("status"),
        "agent_role": "ARTICLE_LANGUAGE_REVIEWER",
        "agent_id": record.get("reviewer_agent_id"),
        "receipt_path": record.get("report_path"),
        "receipt_sha256": record.get("report_sha256"),
    }, []


def quality_receipt_row_errors(
    row: dict, review_index: dict | None, *, require_generic_receipt: bool,
    prefix: str,
) -> list[str]:
    """Compare a G row to the current quality credential without re-reviewing."""
    expected, expected_errors = final_quality_receipt_from_index(review_index)
    errors = list(expected_errors)
    if expected is None:
        return errors
    supplied = row.get("quality_receipt")
    if require_generic_receipt:
        if not isinstance(supplied, dict):
            return errors + [f"{prefix}: requires quality_receipt bound to the current review index"]
        for field, value in expected.items():
            if supplied.get(field) != value:
                errors.append(f"{prefix}: quality_receipt {field} does not match the review index")
        accepted_status = "AUTHOR_QA_READY" if expected["quality_mode"] == "WQ_SHARED_CONTEXT" else "APPROVED"
        if supplied.get("status") != accepted_status:
            errors.append(f"{prefix}: quality_receipt status must be {accepted_status}")
        return errors

    # Legacy report rows retain the old full_review projection so completed
    # schema-2.13 evidence remains readable and does not need migration.
    supplied = row.get("full_review")
    if not isinstance(supplied, dict):
        return errors + [f"{prefix}: requires full_review bound to the current review index"]
    legacy_projection = {
        "status": expected.get("status"),
        "reviewer_agent_id": expected.get("agent_id"),
        "report_path": expected.get("receipt_path"),
        "report_sha256": expected.get("receipt_sha256"),
    }
    for field, value in legacy_projection.items():
        if supplied.get(field) != value:
            errors.append(f"{prefix}: full_review {field} does not match the review index")
    if supplied.get("status") != "APPROVED":
        errors.append(f"{prefix}: full_review must be APPROVED before G batch acceptance")
    return errors


def check_review_delta(workspace: Path, delta_path: Path) -> int:
    """Validate a narrow R-delta hand-off without asking R to reload unrelated history."""
    delta, error = json_object_file(delta_path, label="review delta")
    errors: list[str] = [error] if error else []
    if delta is None:
        print("REVIEW_DELTA_INVALID\n" + "\n".join(errors))
        return 1
    if delta.get("schema_version") != REVIEW_DELTA_SCHEMA:
        errors.append("review delta schema_version must be 1.0")
    article_id = str(delta.get("article_id", "")).strip()
    if not article_id:
        errors.append("review delta requires article_id")
    review_index_path, index_path_error = workspace_file(workspace, delta.get("review_index_path"), label="review delta review_index_path")
    if index_path_error:
        errors.append(index_path_error)
    else:
        assert review_index_path is not None
        index, index_error = json_object_file(review_index_path, label="review index")
        requires_research = (
            research_review_required(index.get("review_effort"))
            if isinstance(index, dict) and isinstance(index.get("review_effort"), dict)
            else True
        )
        errors.extend(review_index_errors(
            workspace, review_index_path,
            require_research_approved=requires_research,
            require_full_approved=True,
        ))
        if index_error or index is None:
            errors.append(index_error or "review index is invalid")
        else:
            effort = index.get("review_effort")
            if author_qa_route(effort):
                _, effective_mode = author_qa_route_resolution_errors(
                    index, require_final_quality=False,
                )
                if effective_mode != "WR_INDEPENDENT_ESCALATED":
                    errors.append(
                        "AUTHOR_QA_INTEGRATED does not permit R_DELTA; rerun AUTHOR_QA or record a WR escalation"
                    )
            if index.get("schema_version") != REVIEW_INDEX_SCHEMA:
                errors.append("review delta references an unsupported review index")
            if index.get("article_id") != article_id:
                errors.append("review delta article_id does not match review index")
            if delta.get("review_index_sha256") != sha256_file(review_index_path):
                errors.append("review delta review_index_sha256 does not match")
    review_scope = delta.get("review_scope")
    if review_scope not in DELTA_REVIEW_SCOPES:
        errors.append("review delta review_scope must be R_DELTA or R_VISUAL_DELTA")
    attempt = delta.get("r_delta_attempt")
    if isinstance(attempt, bool) or not isinstance(attempt, int) or attempt < 1:
        errors.append("review delta r_delta_attempt must be a positive integer")
    if isinstance(attempt, int) and attempt > 2 and delta.get("full_review_required") is not True:
        errors.append("review delta after two attempts must escalate to a full review")
    changed = delta.get("changed_artifacts")
    if not isinstance(changed, list) or not changed:
        errors.append("review delta requires non-empty changed_artifacts")
    elif all(isinstance(item, dict) for item in changed):
        kinds: set[str] = set()
        for item in changed:
            kind = item.get("change_kind")
            kinds.add(str(kind))
            if kind not in DELTA_CHANGE_KINDS:
                errors.append("review delta changed artifact has unknown change_kind")
            artifact_path, artifact_error = workspace_file(workspace, item.get("path"), label="review delta changed artifact")
            if artifact_error:
                errors.append(artifact_error)
            elif artifact_path is not None and item.get("sha256") != sha256_file(artifact_path):
                errors.append("review delta changed artifact sha256 does not match")
            if not isinstance(item.get("affected_requirement_ids"), list) or not isinstance(item.get("affected_finding_ids"), list):
                errors.append("review delta changed artifact requires affected requirement and finding ID lists")
        if review_scope == "R_VISUAL_DELTA" and not kinds <= {"VISUAL_ASSET", "VISUAL_MANIFEST", "VISUAL_PAYLOAD", "ARTICLE_PACKAGE_VISUAL_POINTER"}:
            errors.append("R_VISUAL_DELTA may only contain visual artifacts")
        if "REQUIREMENTS_OR_SCOPE" in kinds and delta.get("full_review_required") is not True:
            errors.append("requirements or scope changes require a full review")
    else:
        errors.append("review delta changed_artifacts must contain objects")
    if errors:
        print("REVIEW_DELTA_INVALID\n" + "\n".join(errors))
        return 1
    print("REVIEW_DELTA_VALID")
    return 0


def markdown_field(text: str, label: str) -> str | None:
    match = re.search(rf"(?mi)^\s*{re.escape(label)}\s*:\s*\`?([^\`\n]+?)\`?\s*$", text)
    return match.group(1).strip() if match else None


def csv_values(value: str | None) -> list[str]:
    if value is None:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def exact_article_coverage(candidate_ids: object, article_ids: list[str]) -> bool:
    if not isinstance(candidate_ids, list) or not article_ids:
        return False
    normalized = [str(item).strip() for item in candidate_ids]
    return (
        all(normalized)
        and len(normalized) == len(article_ids)
        and len(set(normalized)) == len(normalized)
        and set(normalized) == set(article_ids)
    )


def campaign(campaign_id: str) -> dict:
    return {
        "schema_version": CURRENT_CAMPAIGN_SCHEMA, "campaign_id": campaign_id,
        "scope_lock": {"status": "DRAFT", "owner_confirmation": "PENDING", "prewrite_plan_receipt": {"owner_confirmation_id": None, "report_sha256": None, "manifest_sha256": None, "article_ids": [], "owner_confirmation_receipt": None, "scope_snapshot": None, "scope_snapshot_sha256": None}},
        "prewrite_plan_policy": {"mode": "CAMPAIGN_G_SCOPE_AND_EDITORIAL_BRIEF", "required_before_article_dispatch": True, "owner_confirmation_required": True, "report_path": "prewrite-plan.md", "manifest_path": "prewrite-plan.json", "confirmation_path": "confirmation.md", "requirements_contract_path": "requirements-contract.md", "requires_per_article_plan": True, "article_plan_sections": MODEL_FIRST_PREWRITE_PLAN_SECTIONS, "campaign_summary_sections": MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS, "allow_article_roles_before_confirmation": False, "standalone_article_research_role": "PROHIBITED", "writer_research_remains_required": True, "canonical_source": "prewrite-plan.json", "owner_view_mode": "DETERMINISTIC_RENDERED_READ_ONLY", "manual_duplicate_entry": "PROHIBITED", "sync_command": "sync-prewrite-plan", "confirmation_command": "confirm-prewrite-plan", "owner_confirmation_receipt_required": True},
        "platform_scope": {"source": "OWNER_SELECTION_LOCK_ONLY", "allowed_pairs": [], "automatic_discovery_or_expansion": False, "on_exhaustion": "CAPACITY_BLOCKED", "selection_lock": {"path": "owner-platform-selection.json", "sha256": "PENDING_OWNER_CONFIRMATION", "mode": "OWNER_SOURCE_RECEIPTS_ONLY", "internal_candidates_may_be_selected": False, "eligibility_evidence_may_select_platform": False, "on_missing_receipt": "OWNER_DECISION_REQUIRED"}},
        "platform_matching_policy": {"mode": "VISIBLE_SUBAGENT_RESEARCH_THEN_OWNER_LOCK", "researcher_role": MATCHING_ROLE, "reusable": True, "candidate_universe": "OWNER_SOURCE_ARTIFACT_ONLY", "main_controller_may_select_or_rank": False, "proposal_may_write_allowed_pairs": False, "owner_confirmation_required_before_lock": True, "proposal_path": "evidence/platform-matching/platform-matching-proposal.json"},
        "articles": [],
        "article_platform_assignment": {"mode": "ONE_ARTICLE_ONE_DISTINCT_PLATFORM", "required_before_editorial_dispatch": True, "platform_reuse_across_articles": "PROHIBITED", "pair_reuse_across_articles": "PROHIBITED", "assignments": [], "on_missing_or_duplicate": "ARTICLE_PLATFORM_ASSIGNMENT_BLOCKED_RECONFIRM_OWNER"},
        "locale_platform_validation": LOCALE_PLATFORM_POLICY_2_10,
        "title_quality_policy": {"mode": "MODEL_LED_SEMANTIC_REVIEW", "required_before_review": True, "review_dimensions": ["topic_clarity", "reader_intent", "distinct_value", "natural_language", "market_suitability"], "heuristics": {"minimum_word_count": 6, "minimum_visible_char_count": 24, "non_blocking": True}},
        "content_value_policy": {"mode": "READER_VALUE_FIRST", "primary_purpose": "STANDALONE_ANSWER_TO_READER_TASK", "cta_role": "REQUIRED_SECONDARY_TRANSPARENT_RECOMMENDATION", "cta_must_be_present": True, "cta_requires_identifiable_product_and_claim_basis": True, "cta_requires_relationship_disclosure_when_applicable": True, "cta_must_not_replace_or_dominate_reader_value": True},
        "keyword_research_policy": {"mode": "WRITER_CONTINUOUS_LONG_TAIL_AND_REGIONAL_SERP", "required_within_writer_continuous_turn_before_claims": True, "creative_angle_is_not_keyword_evidence": True, "variant_priority_order": PRIORITY, "english_multi_article_intents_must_be_distinct": True, "regional_serp_variants_required_for_every_target_language": True, "model_translation_fallback_requires_independent_regional_serp_checks": 2, "trend_evidence_policy": TREND_EVIDENCE_POLICY_2_5},
        "research_integrity_policy": RESEARCH_INTEGRITY_POLICY_2_11,
        "topic_governance_policy": TOPIC_GOVERNANCE_POLICY_2_11,
        "platform_style_research_policy": {"mode": "ON_DEMAND_IN_SCOPE_PROFILE", "attempt_before_drafting": False, "in_scope_platforms_only": True, "sample_shortage": "UNVERIFIED_USE_CONSERVATIVE_GENERIC", "editorial_profile_is_non_binding": True, "durable_harvest_requires_public_qa_passed": True, "trigger": "CACHE_MISS_AND_MATERIAL_READER_TRANSPORT_RISK"},
        "visual_narrative_policy": {"mode": "LEAD_MIDDLE_CLOSING_REQUIRED", "default_applies_to": ["guide", "tutorial", "comparison", "review", "long_explainer"], "default_minimum_images": 3, "required_coverage_zones": VISUAL_ZONES, "all_articles_required": False, "exception_requires_owner_confirmation": True},
        "cross_language_seo": {"status": "NOT_REQUESTED", "target_locales": [], "google_trends_seed_language": "ENGLISH_ONLY", "variant_priority_order": PRIORITY, "minimum_independent_regional_serp_checks_for_fallback": 2},
        "quality_policy": {"aitdk_local_reference": "required", "plugin_scan": "best_effort_non_blocking", "final_prepublication_target": "visual-payload.html+visual-payload.md"},
        "artifact_optimization_policy": LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_14,
        "model_first_execution_policy": MODEL_FIRST_EXECUTION_POLICY_2_14,
        "live_execution_profile": HUMAN_RELEASE_PROFILE_2_14,
        "orchestration_policy": {"delegation_default": "VISIBLE_SUBAGENTS", "visible_task_record_required": True, "invisible_cli_agent_sessions": "PROHIBITED", "writer_reviewer_pair_mode": "REUSABLE_WQ_WR_WITH_ARTICLE_ARTIFACT_ISOLATION", "cross_article_agent_reuse": "CAMPAIGN_WQ_WR_G_REUSE_ALLOWED", "operations_steward_mode": "ONE_REUSABLE_CAMPAIGN_OPERATIONS_STEWARD", "persistent_requirements_gatekeeper": True, "fresh_agent_roles": [], "pair_activation": "G_QUEUE_SUBJECT_TO_RUNTIME_CAPACITY", "execution_session": "CONTINUOUS_CAMPAIGN_MAIN_SESSION", "execution_isolation": MAIN_SESSION_PATH_ISOLATION, "article_artifact_root_template": ARTICLE_ARTIFACT_ROOT_TEMPLATE, "article_artifact_roots": "REQUIRED_DISJOINT", "worktree_autospawn": WORKTREE_AUTOSPAWN_POLICY, "worktree_dispatch_decision": "REQUIRED_FOR_GIT_WORKTREE_ONLY", "worktree_allowed_reasons": ["TRUE_CONCURRENT_WRITE", "HIGH_RISK_REWRITE_OR_ROLLBACK", "OWNER_REQUESTED_GIT_ISOLATION"], "worktree_fallback": "NOT_APPLICABLE_MAIN_SESSION_PATH_ISOLATED", "silent_worktree_fallback": False, "article_worktree_role_bundle": "REUSABLE_WQ_WR_PLUS_SHARED_CAMPAIGN_G", "project_worktree_root_role": "ARTICLE_ARTIFACT_ROOT", "campaign_gatekeeper_scope": "PREWRITE_BATCH_CONTRACT_AND_BATCH_PUBLIC_QA", "batch_gate_policy": GATE_BATCH_POLICY_2_14, "article_public_gate_mode": "REUSE_REGISTERED_CAMPAIGN_GATEKEEPER_BATCH_READONLY", "public_qa_policy": PUBLIC_QA_POLICY_2_7, "queue_resume_policy": "MAIN_SESSION_SEQUENTIAL_OR_SAFE_PATH_BATCH", "article_agent_replacement_requires_full_rehydration": True, "allowed_main_cli_use": ["local_file_operations", "deterministic_validation", "hashing", "read_only_inspection", "version_control"]},
        "release_policy": {
            "mode": "HUMAN_NATIVE_ONLY",
            "machine_external_writes_allowed": False,
            "default_title_transfer_mode": "SEPARATE_TITLE_FIELD",
            "heading_hierarchy_policy": {
                "authority": "PUBLIC_READER_PAGE_VISUAL_ONLY",
                "editor_html_or_dom": "NOT_A_VALID_QA_SURFACE",
                "local_payload_markup": "AUTHORING_AND_COPY_SELECTION_AID_ONLY",
                "public_visual_check_requires_human_accepted_url": True,
            },
            "visual_payload_template": {"id": "BLOG_3P_VISUAL_PAYLOAD", "version": "3", "rendering": "COMPILER_ONLY", "model_authored_shell_css_js": "PROHIBITED"},
        },
    }


def state(campaign_id: str) -> dict:
    return {"schema_version": "2.4", "campaign_id": campaign_id, "phase": "prewrite_planning", "round": 0, "history": [], "finding_status": {}, "locale_platform_validation": {}, "prewrite_plan": {"status": "PENDING_OWNER_PREWRITE_PLAN_CONFIRMATION", "report_path": "prewrite-plan.md", "report_sha256": None, "manifest_path": "prewrite-plan.json", "manifest_sha256": None, "article_ids": [], "owner_confirmation_id": None, "owner_confirmation_receipt": None, "scope_snapshot": None, "scope_snapshot_sha256": None}, "artifact_index": {"article_contexts": {}, "review_indexes": {}, "review_deltas": {}, "gate_batches": {}, "public_qa_batches": {}}, "orchestration": {"controller_role": "CAMPAIGN_GATEKEEPER", "campaign_gatekeeper_agent_id": None, "campaign_writer_agent_id": None, "campaign_reviewer_agent_id": None, "execution_session": "CONTINUOUS_CAMPAIGN_MAIN_SESSION", "article_artifact_root_template": ARTICLE_ARTIFACT_ROOT_TEMPLATE, "tasks": [], "article_queue": [], "article_agents": {}, "article_workspaces": {}, "service_agents": {"campaign_operations": {"role": "CAMPAIGN_OPERATIONS_STEWARD", "agent_id": None, "status": "NOT_STARTED", "reusable": True, "last_rehydrated_at": None}, "platform_matching": {"role": MATCHING_ROLE, "agent_id": None, "status": "NOT_STARTED", "reusable": True, "last_rehydrated_at": None}}, "capacity": {"available_slots": "RUNTIME_DISCOVERED", "active_article_pairs": [], "active_article_worktrees": [], "spawn_policy": "MAIN_SESSION_SEQUENTIAL_OR_SAFE_PATH_BATCH", "last_dispatch_at": None}}, "publication": {"status": "NOT_STARTED", "articles": {}}}


def init(workspace: Path, campaign_id: str) -> int:
    if workspace.exists() and any(workspace.iterdir()):
        print(f"ERROR: workspace is not empty: {workspace}")
        return 2
    workspace.mkdir(parents=True, exist_ok=True)
    for name in ("research", "canonical", "reviews", "gate", "handoff", "evidence", "resolutions", "context", "articles"):
        (workspace / name).mkdir(exist_ok=True)
    (workspace / "evidence" / "owner-selection").mkdir(exist_ok=True)
    (workspace / "evidence" / "platform-matching").mkdir(exist_ok=True)
    (workspace / OWNER_CONFIRMATION_RECEIPT_DIRECTORY).mkdir(exist_ok=True)
    (workspace / "evidence" / "public-qa").mkdir(exist_ok=True)
    (workspace / "evidence" / "shared").mkdir(exist_ok=True)
    dump(workspace / "campaign.json", campaign(campaign_id))
    dump(workspace / "state.json", state(campaign_id))
    dump(workspace / "owner-platform-selection.json", {"schema_version": "1.0", "campaign_id": campaign_id, "status": "PENDING_OWNER_CONFIRMATION", "source_artifacts": [], "pair_receipts": []})
    (workspace / "requirements-contract.md").write_text(
        "# Requirements contract\n\n"
        "G creates stable REQ-<AREA>-NNN entries here only from requirements explicitly confirmed by the owner. "
        "The pre-write receipt block is compiler-managed; do not hand-edit it.\n\n"
        "<!-- BLOG_3P_PREWRITE_RECEIPT_START -->\n"
        "## Bound pre-write plan\n\n"
        "Pre-write plan status: PENDING_OWNER_PREWRITE_PLAN_CONFIRMATION\n"
        "Pre-write plan confirmation ID: PENDING\n"
        "Pre-write report SHA-256: PENDING\n"
        "Pre-write manifest SHA-256: PENDING\n"
        "Protected scope snapshot SHA-256: PENDING\n"
        "Pre-write article IDs: PENDING\n"
        "<!-- BLOG_3P_PREWRITE_RECEIPT_END -->\n\n"
        "## Stable requirements\n\n",
        encoding="utf-8",
    )
    dump(workspace / "prewrite-plan.json", {
        "schema_version": CURRENT_PREWRITE_PLAN_SCHEMA,
        "campaign_id": campaign_id,
        "status": "PENDING_OWNER_PREWRITE_PLAN_CONFIRMATION",
        "owner_confirmation_id": None,
        "owner_confirmation_receipt": None,
        "artifact_convention": {
            "canonical_source": "prewrite-plan.json",
            "owner_view_path": "prewrite-plan.md",
            "owner_view_mode": "DETERMINISTIC_RENDERED_READ_ONLY",
            "manual_duplicate_entry": "PROHIBITED",
            "writer_research_remains_required": True,
        },
        "shared_evidence_pack": {
            "path": "evidence/shared/campaign-evidence-pack.json",
            "sha256": "PENDING",
            "scope": "CAMPAIGN_READONLY_BASELINE",
            "does_not_replace_article_research": True,
        },
        "campaign_summary": {section: "" for section in MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS},
        "article_plans": [],
    })
    (workspace / "pre-clearance-checklist.md").write_text(
        "# 开始前照做清单（真实运行基线）\n\n"
        "这是一份启动清单，不是新增审稿环节。默认路线是：写前 G → 用户确认 → 每篇连续 W + WQ（作者对抗式自检）→ 批量 G → 人工发布 → 原 G 批量公开页复核；仅风险或用户明确要求的文章升级为独立 WR。\n\n"
        "- [ ] **用户确认范围。** 每篇填明文章 ID、语言、市场、读者任务、焦点关键词、读者价值与必保留 CTA（精确锚文本、URL、依据、关联性、披露），以及唯一的平台／账号组合；未确认不得自行替换。当前矩阵只支持人工原生发布。\n"
        "- [ ] **G 只做写前方案。** 填写唯一可编辑的 `prewrite-plan.json`，运行 `sync-prewrite-plan`，把生成的 `prewrite-plan.md` 发给用户。确认前不得启动文章工作区、W 或 R。\n"
        "- [ ] **保存真实确认回执。** 用户确认后，把原始确认文本保存到 `evidence/owner-confirmations/`；回执必须能说明来源定位，不能用工作流状态或内部配置代替用户确认。\n"
        "- [ ] **用命令绑定确认。** 运行 `confirm-prewrite-plan`，再运行 `check` 与 `dispatch-readiness`。前者只绑定回执和哈希，后者明确列出仍缺的 REQ、G 登记或每篇平台／账号映射；`CHECK_PASSED` 本身只表示结构可读，不等于可派发。\n"
        "- [ ] **再启动每篇质量路线。** G 先写稳定 `REQ-*`，登记可见的项目 G；每篇默认只登记可见 W，在同一连续上下文完成调研、正文、三图、可视化富文本交付页和 `CANDIDATE_LOCK → ADVERSARIAL_SELF_QA → TARGETED_REPAIR → FINAL_BIND`。只有冻结为 WR、用户要求独立审稿，或 WQ 记录了升级触发 ID 时，才登记独立 R。Git 工作区不是常规路径。\n"
        "- [ ] **保留读者页边界。** Google Trends 仅为可选英文全球相对背景；跨语言用语优先品牌站、地区 SERP、最后才有边界地模型翻译。平台编辑器 HTML 不能证明标题层级；人工回传 `HUMAN_ACCEPTED` URL 后，仅由同一 G 看公开读者页视觉。\n",
        encoding="utf-8",
    )
    synced = sync_prewrite_plan(workspace)
    if synced != 0:
        return synced
    print(f"INITIALIZED: {workspace}")
    return 0


def check(workspace: Path) -> int:
    missing = [name for name in ("campaign.json", "state.json", "confirmation.md", "requirements-contract.md", "pre-clearance-checklist.md", "research", "canonical", "reviews", "gate", "handoff") if not (workspace / name).exists()]
    if missing:
        print("CHECK_FAILED\n" + "\n".join(f"missing {name}" for name in missing)); return 1
    try:
        cfg = json.loads((workspace / "campaign.json").read_text(encoding="utf-8"))
        st = json.loads((workspace / "state.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"CHECK_FAILED\ninvalid JSON: {exc}"); return 1
    errors: list[str] = []
    parsed_schema_version = parse_schema_version(cfg.get("schema_version"))
    if parsed_schema_version is None:
        errors.append("campaign schema_version must use exact major.minor form")
        # Apply current strict policy after a malformed version so it cannot
        # quietly select a weaker legacy validation path.
        parsed_schema_version = (2, 9)
    requires_prewrite_policy = parsed_schema_version >= (2, 0)
    requires_content_value_policy = parsed_schema_version >= (2, 1)
    requires_required_cta_policy = parsed_schema_version >= (2, 2)
    requires_streamlined_public_qa_policy = parsed_schema_version >= (2, 3)
    requires_artifact_optimization_policy = parsed_schema_version >= (2, 4)
    requires_trend_evidence_policy = parsed_schema_version >= (2, 5)
    requires_model_first_execution_policy = parsed_schema_version >= (2, 6)
    requires_batch_control_plane = parsed_schema_version >= (2, 7)
    requires_live_execution_profile = parsed_schema_version >= (2, 8)
    requires_human_native_release = parsed_schema_version >= (2, 9)
    requires_research_integrity = parsed_schema_version >= (2, 10)
    requires_topic_governance = parsed_schema_version >= (2, 11)
    requires_single_source_payload = parsed_schema_version >= (2, 12)
    requires_main_session_path_isolation = parsed_schema_version >= (2, 13)
    requires_dual_quality_routes = parsed_schema_version >= (2, 14)
    required_plan_sections = (
        MODEL_FIRST_PREWRITE_PLAN_SECTIONS if requires_model_first_execution_policy
        else PREWRITE_PLAN_SECTIONS if requires_content_value_policy
        else LEGACY_PREWRITE_PLAN_SECTIONS
    )
    required_summary_sections = (
        MODEL_FIRST_PREWRITE_SUMMARY_SECTIONS if requires_model_first_execution_policy
        else PREWRITE_SUMMARY_SECTIONS if requires_content_value_policy
        else LEGACY_PREWRITE_SUMMARY_SECTIONS
    )
    prewrite_files_available = all((workspace / name).is_file() for name in ("prewrite-plan.md", "prewrite-plan.json"))
    prewrite_manifest: object = {}
    if requires_prewrite_policy:
        if not prewrite_files_available:
            errors.append("schema 2+ campaign requires prewrite-plan.md and prewrite-plan.json")
        else:
            try:
                prewrite_manifest = json.loads((workspace / "prewrite-plan.json").read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                errors.append(f"invalid pre-write manifest JSON: {exc}")
    prewrite_policy = cfg.get("prewrite_plan_policy", {})
    if requires_prewrite_policy:
        expected_prewrite_mode = "CAMPAIGN_G_SCOPE_AND_EDITORIAL_BRIEF" if requires_model_first_execution_policy else "CAMPAIGN_G_PREWRITE_EVIDENCE_AND_PLAN"
        if not isinstance(prewrite_policy, dict) or prewrite_policy.get("mode") != expected_prewrite_mode: errors.append("pre-write plan must be controlled by campaign G without replacing writer research")
        elif prewrite_policy.get("required_before_article_dispatch") is not True: errors.append("pre-write plan must precede article dispatch")
        elif prewrite_policy.get("owner_confirmation_required") is not True: errors.append("pre-write plan requires owner confirmation")
        elif prewrite_policy.get("report_path") != "prewrite-plan.md": errors.append("pre-write report path must be prewrite-plan.md")
        elif prewrite_policy.get("manifest_path") != "prewrite-plan.json": errors.append("pre-write manifest path must be prewrite-plan.json")
        elif prewrite_policy.get("confirmation_path") != "confirmation.md": errors.append("pre-write confirmation path must be confirmation.md")
        elif prewrite_policy.get("requirements_contract_path") != "requirements-contract.md": errors.append("pre-write requirements contract path must be requirements-contract.md")
        elif prewrite_policy.get("requires_per_article_plan") is not True: errors.append("pre-write plan requires one plan per article")
        elif prewrite_policy.get("article_plan_sections") != required_plan_sections: errors.append("pre-write plan sections are incomplete or reordered")
        elif prewrite_policy.get("campaign_summary_sections") != required_summary_sections: errors.append("pre-write campaign-summary sections are incomplete or reordered")
        elif prewrite_policy.get("allow_article_roles_before_confirmation") is not False: errors.append("article roles may not start before owner confirms the pre-write plan")
        elif prewrite_policy.get("standalone_article_research_role") != "PROHIBITED": errors.append("pre-write planning must not create a second article-research role")
        elif prewrite_policy.get("writer_research_remains_required") is not True: errors.append("pre-write plan cannot replace writer integrated research")
        elif requires_artifact_optimization_policy and prewrite_policy.get("canonical_source") != "prewrite-plan.json": errors.append("schema 2.4+ pre-write source must be canonical JSON")
        elif requires_artifact_optimization_policy and prewrite_policy.get("owner_view_mode") != "DETERMINISTIC_RENDERED_READ_ONLY": errors.append("schema 2.4+ pre-write owner view must be deterministically rendered")
        elif requires_artifact_optimization_policy and prewrite_policy.get("manual_duplicate_entry") != "PROHIBITED": errors.append("schema 2.4+ pre-write duplicate manual entry must be prohibited")
        elif requires_artifact_optimization_policy and prewrite_policy.get("sync_command") != "sync-prewrite-plan": errors.append("schema 2.4+ pre-write synchronization command is invalid")
        elif requires_live_execution_profile and prewrite_policy.get("confirmation_command") != "confirm-prewrite-plan": errors.append("schema 2.8+ pre-write confirmation command is invalid")
        elif requires_live_execution_profile and prewrite_policy.get("owner_confirmation_receipt_required") is not True: errors.append("schema 2.8+ pre-write confirmation requires an owner receipt")
    expected_artifact_policy = (
        LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_14 if requires_dual_quality_routes
        else LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_13 if parsed_schema_version >= (2, 13)
        else LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_12 if requires_single_source_payload
        else LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_11 if requires_topic_governance
        else LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_10 if requires_research_integrity
        else LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_8 if requires_live_execution_profile
        else MODEL_FIRST_ARTIFACT_OPTIMIZATION_POLICY_2_6 if requires_model_first_execution_policy
        else ARTIFACT_OPTIMIZATION_POLICY_2_4
    )
    if requires_artifact_optimization_policy and cfg.get("artifact_optimization_policy") not in (
        expected_artifact_policy,
        LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_11 if not requires_research_integrity else expected_artifact_policy,
        LIVE_ARTIFACT_OPTIMIZATION_POLICY_2_12 if not requires_research_integrity else expected_artifact_policy,
    ):
        errors.append("schema 2.4+ artifact optimization policy is missing or changed")
    expected_model_first_policy = (
        MODEL_FIRST_EXECUTION_POLICY_2_14
        if requires_dual_quality_routes
        else MODEL_FIRST_EXECUTION_POLICY_2_6
    )
    if requires_model_first_execution_policy and cfg.get("model_first_execution_policy") != expected_model_first_policy:
        errors.append("schema 2.6+ model-first execution policy is missing or changed")
    expected_research_integrity_policy = (
        RESEARCH_INTEGRITY_POLICY_2_11
        if requires_topic_governance
        else RESEARCH_INTEGRITY_POLICY_2_10
    )
    if requires_research_integrity and cfg.get("research_integrity_policy") != expected_research_integrity_policy:
        errors.append("schema 2.10+ research integrity policy is missing or changed")
    if requires_topic_governance and cfg.get("topic_governance_policy") != TOPIC_GOVERNANCE_POLICY_2_11:
        errors.append("schema 2.11 topic governance policy is missing or changed")
    if requires_human_native_release:
        errors.extend(human_native_release_policy_errors(cfg))
    elif requires_live_execution_profile and cfg.get("live_execution_profile") != LIVE_EXECUTION_PROFILE_2_8:
        errors.append("schema 2.8 live execution profile is missing or changed")
    if requires_prewrite_policy and not prewrite_files_available:
        print("CHECK_FAILED\n" + "\n".join(errors)); return 1
    scope = cfg.get("platform_scope", {})
    if scope.get("source") != "OWNER_SELECTION_LOCK_ONLY": errors.append("platform scope source must be OWNER_SELECTION_LOCK_ONLY")
    if not isinstance(scope.get("allowed_pairs"), list): errors.append("allowed_pairs must be a list")
    if scope.get("automatic_discovery_or_expansion") is not False: errors.append("automatic platform expansion must be false")
    matching_policy = cfg.get("platform_matching_policy", {})
    if not isinstance(matching_policy, dict) or matching_policy.get("mode") != "VISIBLE_SUBAGENT_RESEARCH_THEN_OWNER_LOCK": errors.append("platform matching must use a visible subagent before owner lock")
    elif matching_policy.get("researcher_role") != MATCHING_ROLE or matching_policy.get("reusable") is not True: errors.append("platform matching requires one reusable visible matching researcher")
    elif matching_policy.get("candidate_universe") != "OWNER_SOURCE_ARTIFACT_ONLY": errors.append("platform matching candidates must come only from owner source artifacts")
    elif matching_policy.get("main_controller_may_select_or_rank") is not False or matching_policy.get("proposal_may_write_allowed_pairs") is not False: errors.append("G and matching proposal may not freeze platform selections")
    elif matching_policy.get("owner_confirmation_required_before_lock") is not True or not str(matching_policy.get("proposal_path", "")).strip(): errors.append("platform matching requires owner confirmation and a proposal path")
    selection_receipts: list[dict] = []; matching_proposals: list[dict] = []
    locked = str(cfg.get("scope_lock", {}).get("status", "")).upper() in {"LOCKED", "CONFIRMED"}
    release_policy_for_scope = cfg.get("release_policy")
    human_release_requested = (
        release_policy_for_scope.get("human_release_requested")
        if isinstance(release_policy_for_scope, dict) and requires_live_execution_profile and not requires_human_native_release
        else None
    )
    platform_mapping_required = (
        locked
        if requires_human_native_release or not requires_live_execution_profile
        else locked and human_release_requested is True
    )
    if platform_mapping_required and scope.get("allowed_pairs"):
        selection = scope.get("selection_lock", {})
        if not isinstance(selection, dict) or selection.get("mode") != "OWNER_SOURCE_RECEIPTS_ONLY": errors.append("locked platform scope requires OWNER_SOURCE_RECEIPTS_ONLY selection lock")
        elif selection.get("internal_candidates_may_be_selected") is not False or selection.get("eligibility_evidence_may_select_platform") is not False: errors.append("internal candidates and eligibility evidence may not select platforms")
        elif selection.get("on_missing_receipt") != "OWNER_DECISION_REQUIRED": errors.append("missing platform receipt must require owner decision")
        else:
            lock_name = str(selection.get("path", "")).strip()
            root = workspace.resolve(); lock_path = (workspace / lock_name).resolve()
            if not lock_name or lock_path == root or root not in lock_path.parents or not lock_path.is_file(): errors.append("owner platform selection lock file is missing or outside workspace")
            elif lock_path.name == "campaign.json": errors.append("campaign.json cannot be an owner platform selection source")
            elif selection.get("sha256") != sha256_file(lock_path): errors.append("owner platform selection lock hash does not match")
            else:
                try:
                    lock = json.loads(lock_path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError) as exc:
                    errors.append(f"invalid owner platform selection lock: {exc}"); lock = {}
                if not isinstance(lock, dict):
                    errors.append("owner platform selection lock must be an object"); lock = {}
                artifacts = lock.get("source_artifacts", []) if isinstance(lock, dict) else []
                selection_receipts = lock.get("pair_receipts", []) if isinstance(lock, dict) else []
                matching_reference = lock.get("matching_proposal", {}) if isinstance(lock, dict) else {}
                if lock.get("campaign_id") != cfg.get("campaign_id") or lock.get("status") != "OWNER_CONFIRMED": errors.append("owner platform selection lock must be OWNER_CONFIRMED for this campaign")
                if not isinstance(artifacts, list) or not artifacts: errors.append("owner platform selection lock needs source artifacts")
                if not isinstance(selection_receipts, list) or not selection_receipts: errors.append("owner platform selection lock needs pair receipts")
                artifact_by_id = {str(item.get("source_id", "")).strip(): item for item in artifacts if isinstance(item, dict)}
                if len(artifact_by_id) != len(artifacts) or not all(artifact_by_id): errors.append("owner selection source artifacts need unique source_id values")
                for source_id, artifact in artifact_by_id.items():
                    source_path = (workspace / str(artifact.get("path", "")).strip()).resolve()
                    if artifact.get("source_type") not in OWNER_SOURCE_TYPES: errors.append(f"owner selection source {source_id}: source_type must be owner-originated")
                    elif source_path == root or root not in source_path.parents or not source_path.is_file(): errors.append(f"owner selection source {source_id}: source file is missing or outside workspace")
                    elif source_path.name in {"campaign.json", "state.json", "owner-platform-selection.json"}: errors.append(f"owner selection source {source_id}: workflow configuration cannot select a platform")
                    elif artifact.get("sha256") != sha256_file(source_path): errors.append(f"owner selection source {source_id}: source hash does not match")
                proposal_name = str(matching_reference.get("path", "")).strip() if isinstance(matching_reference, dict) else ""
                proposal_path = (workspace / proposal_name).resolve()
                if not isinstance(matching_reference, dict) or matching_reference.get("researcher_role") != MATCHING_ROLE or not str(matching_reference.get("task_id", "")).strip(): errors.append("owner selection lock needs a visible matching-researcher proposal reference")
                elif proposal_name != matching_policy.get("proposal_path") or proposal_path == root or root not in proposal_path.parents or not proposal_path.is_file(): errors.append("matching proposal file is missing, outside workspace, or differs from policy")
                elif matching_reference.get("sha256") != sha256_file(proposal_path): errors.append("matching proposal hash does not match")
                else:
                    try:
                        proposal = json.loads(proposal_path.read_text(encoding="utf-8"))
                    except (OSError, json.JSONDecodeError) as exc:
                        errors.append(f"invalid platform matching proposal: {exc}"); proposal = {}
                    if not isinstance(proposal, dict): errors.append("platform matching proposal must be an object"); proposal = {}
                    matching_proposals = proposal.get("proposals", []) if isinstance(proposal, dict) else []
                    if proposal.get("campaign_id") != cfg.get("campaign_id") or proposal.get("researcher_role") != MATCHING_ROLE or proposal.get("status") != "RECOMMENDED_PENDING_OWNER_CONFIRMATION": errors.append("platform matching proposal has invalid campaign, role, or status")
                    if not isinstance(matching_proposals, list) or not matching_proposals: errors.append("platform matching proposal needs recommendations")
                    for item in matching_proposals if isinstance(matching_proposals, list) else []:
                        if not isinstance(item, dict): errors.append("platform matching recommendation must be an object"); continue
                        required = ("article_id", "language", "market", "platform", "candidate_source_id", "candidate_locator", "rationale", "eligibility_evidence_path")
                        if any(not str(item.get(field, "")).strip() for field in required): errors.append("platform matching recommendation has missing required fields")
                        if item.get("candidate_source_id") not in artifact_by_id: errors.append("platform matching recommendation references an unknown owner source")
                        if requires_research_integrity:
                            proposal_article_id = str(item.get("article_id", "")).strip()
                            proposal_article = article_record(cfg, proposal_article_id)
                            proposal_plan = article_plan_record(prewrite_manifest, proposal_article_id) if isinstance(prewrite_manifest, dict) else None
                            frozen_mapping = proposal_plan.get("frozen_delivery_mapping") if isinstance(proposal_plan, dict) else None
                            if proposal_article is None or not isinstance(frozen_mapping, dict):
                                errors.append("schema 2.10+ platform recommendation requires a matching frozen pre-write delivery mapping")
                            else:
                                if str(item.get("language", "")).strip().casefold() != str(proposal_article.get("language", "")).strip().casefold() or str(item.get("market", "")).strip().casefold() != str(proposal_article.get("market", "")).strip().casefold():
                                    errors.append(f"article {proposal_article_id}: platform recommendation must match frozen article language and market")
                                if str(item.get("platform", "")).strip().casefold() != str(frozen_mapping.get("platform", "")).strip().casefold():
                                    errors.append(f"article {proposal_article_id}: platform recommendation must match the owner-visible platform")
                                errors.extend(audience_compatibility_errors(
                                    item.get("audience_compatibility"),
                                    article_language=str(proposal_article.get("language", "")),
                                    market=str(proposal_article.get("market", "")),
                                    expected_fit_mode=frozen_mapping.get("fit_mode"),
                                    label=f"article {proposal_article_id} platform recommendation",
                                ))
                for receipt in selection_receipts if isinstance(selection_receipts, list) else []:
                    if not isinstance(receipt, dict): errors.append("owner platform selection receipt must be an object"); continue
                    required = ("article_id", "platform", "account", "source_id", "source_locator", "platform_source_literal", "account_confirmation_literal", "owner_confirmation_id")
                    if any(not str(receipt.get(field, "")).strip() for field in required): errors.append("owner platform selection receipt has missing required fields")
                    if receipt.get("source_id") not in artifact_by_id: errors.append("owner platform selection receipt references an unknown source")
                    if receipt.get("status") != "EXPLICITLY_CONFIRMED": errors.append("owner platform selection receipt must be EXPLICITLY_CONFIRMED")
                    if requires_research_integrity:
                        receipt_article_id = str(receipt.get("article_id", "")).strip()
                        receipt_article = article_record(cfg, receipt_article_id)
                        receipt_plan = article_plan_record(prewrite_manifest, receipt_article_id) if isinstance(prewrite_manifest, dict) else None
                        frozen_mapping = receipt_plan.get("frozen_delivery_mapping") if isinstance(receipt_plan, dict) else None
                        strict_required = ("article_language", "market", "mapping_confirmation_literal", "fit_mode")
                        if any(not non_empty_string(receipt.get(field)) for field in strict_required): errors.append("schema 2.10+ owner platform selection receipt has missing language/market/mapping fields")
                        if receipt_article is None or not isinstance(frozen_mapping, dict):
                            errors.append("schema 2.10+ owner platform selection receipt requires a matching frozen pre-write delivery mapping")
                        else:
                            if str(receipt.get("article_language", "")).strip().casefold() != str(receipt_article.get("language", "")).strip().casefold() or str(receipt.get("market", "")).strip().casefold() != str(receipt_article.get("market", "")).strip().casefold():
                                errors.append(f"article {receipt_article_id}: owner platform receipt must match frozen article language and market")
                            if str(receipt.get("platform", "")).strip().casefold() != str(frozen_mapping.get("platform", "")).strip().casefold() or str(receipt.get("account", "")).strip().casefold() != str(frozen_mapping.get("account", "")).strip().casefold():
                                errors.append(f"article {receipt_article_id}: owner platform receipt must match the owner-visible platform/account")
                            if str(receipt.get("fit_mode", "")).strip() != str(frozen_mapping.get("fit_mode", "")).strip():
                                errors.append(f"article {receipt_article_id}: owner platform receipt fit_mode must match the frozen delivery mapping")
                            if frozen_mapping.get("fit_mode") == CROSS_LANGUAGE_EXCEPTION_FIT:
                                exception = frozen_mapping.get("cross_language_exception")
                                expected_literal = exception.get("requested_owner_confirmation_literal") if isinstance(exception, dict) else None
                                if receipt.get("cross_language_exception_owner_confirmation_id") != receipt.get("owner_confirmation_id") or not non_empty_string(receipt.get("cross_language_exception_literal")):
                                    errors.append(f"article {receipt_article_id}: cross-language receipt needs its own explicit owner confirmation literal")
                                elif non_empty_string(expected_literal) and str(receipt.get("cross_language_exception_literal")).strip() != str(expected_literal).strip():
                                    errors.append(f"article {receipt_article_id}: cross-language receipt literal must match the owner-visible request")
    if requires_human_native_release and platform_mapping_required:
        bound_confirmation = None
        bound_receipt = cfg.get("scope_lock", {}).get("prewrite_plan_receipt") if isinstance(cfg.get("scope_lock"), dict) else None
        if isinstance(bound_receipt, dict):
            bound_confirmation = bound_receipt.get("owner_confirmation_id")
        if not non_empty_string(bound_confirmation):
            errors.append("human-native release requires a bound owner pre-write confirmation ID")
        elif not isinstance(selection_receipts, list) or not selection_receipts:
            errors.append("human-native release requires owner-confirmed platform/account receipts")
        elif any(not isinstance(receipt, dict) or receipt.get("owner_confirmation_id") != bound_confirmation for receipt in selection_receipts):
            errors.append("every current platform/account receipt must bind the owner pre-write confirmation ID")
    assignment = cfg.get("article_platform_assignment", {})
    if assignment.get("mode") != "ONE_ARTICLE_ONE_DISTINCT_PLATFORM": errors.append("article-platform assignment mode must be ONE_ARTICLE_ONE_DISTINCT_PLATFORM")
    if assignment.get("required_before_editorial_dispatch") is not True: errors.append("article-platform assignment must be required before editorial dispatch")
    if assignment.get("platform_reuse_across_articles") != "PROHIBITED": errors.append("a platform may not be reused across articles")
    if assignment.get("pair_reuse_across_articles") != "PROHIBITED": errors.append("a platform/account pair may not be reused across articles")
    assignments = assignment.get("assignments")
    if not isinstance(assignments, list): errors.append("article-platform assignments must be a list")
    articles = cfg.get("articles", [])
    if not isinstance(articles, list): errors.append("articles must be a list")
    if platform_mapping_required and (articles or assignments or scope.get("allowed_pairs")):
        article_ids = [str(item.get("article_id", "")).strip() for item in articles if isinstance(item, dict)]
        if not article_ids or len(article_ids) != len(articles) or len(set(article_ids)) != len(article_ids): errors.append("locked campaign articles require unique non-empty article_id values")
        if not isinstance(assignments, list) or len(assignments) != len(article_ids): errors.append("locked campaign requires exactly one article-platform assignment per article")
        elif all(isinstance(item, dict) for item in assignments):
            assigned_ids = [str(item.get("article_id", "")).strip() for item in assignments]
            platforms = [str(item.get("platform", "")).strip().casefold() for item in assignments]
            pairs = [(str(item.get("platform", "")).strip().casefold(), str(item.get("account", "")).strip().casefold()) for item in assignments]
            if set(assigned_ids) != set(article_ids) or len(set(assigned_ids)) != len(assigned_ids): errors.append("article-platform assignments must cover each article exactly once")
            if not all(platforms) or len(set(platforms)) != len(platforms): errors.append("each article must use a distinct non-empty platform")
            if not all(platform and account for platform, account in pairs) or len(set(pairs)) != len(pairs): errors.append("each article must use a distinct non-empty platform/account pair")
            allowed = {(str(item.get("platform", "")).strip().casefold(), str(item.get("account", "")).strip().casefold()) for item in scope.get("allowed_pairs", []) if isinstance(item, dict)}
            receipt_pairs = {(str(item.get("platform", "")).strip().casefold(), str(item.get("account", "")).strip().casefold()) for item in selection_receipts if isinstance(item, dict)}
            receipt_rows = {(str(item.get("article_id", "")).strip(), str(item.get("platform", "")).strip().casefold(), str(item.get("account", "")).strip().casefold()) for item in selection_receipts if isinstance(item, dict)}
            proposal_rows = {(str(item.get("article_id", "")).strip(), str(item.get("platform", "")).strip().casefold()) for item in matching_proposals if isinstance(item, dict)}
            if len(allowed) != len(scope.get("allowed_pairs", [])): errors.append("locked article-platform campaigns require allowed_pairs objects with platform and account")
            elif set(allowed) != receipt_pairs: errors.append("allowed_pairs must exactly equal owner-confirmed selection receipts")
            elif not {(str(item.get("article_id", "")).strip(), str(item.get("platform", "")).strip().casefold(), str(item.get("account", "")).strip().casefold()) for item in assignments} <= receipt_rows: errors.append("every article assignment needs its matching owner-confirmed selection receipt")
            elif not {(str(item.get("article_id", "")).strip(), str(item.get("platform", "")).strip().casefold()) for item in assignments} <= proposal_rows: errors.append("every article assignment must preserve the visible matching-researcher platform recommendation")
            elif not set(pairs) <= allowed: errors.append("each article assignment must exactly match a user-supplied allowed platform/account pair")
        else: errors.append("article-platform assignments must contain objects")
    locale = cfg.get("locale_platform_validation", {})
    expected_locale_mode = (
        "ARTICLE_LANGUAGE_MARKET_PRIMARY_AUDIENCE_EVIDENCE"
        if requires_research_integrity else "ARTICLE_LANGUAGE_MARKET_PLATFORM_EVIDENCE"
    )
    allowed_locale_modes = {expected_locale_mode}
    if not requires_research_integrity:
        allowed_locale_modes.add("ARTICLE_LANGUAGE_MARKET_PRIMARY_AUDIENCE_EVIDENCE")
    if not isinstance(locale, dict) or locale.get("mode") not in allowed_locale_modes: errors.append(f"locale-platform validation mode must be {expected_locale_mode}")
    elif locale.get("required_before_editorial_dispatch") is not True: errors.append("locale-platform validation must be required before editorial dispatch")
    elif locale.get("article_language_source") != "USER_CONFIRMED_ARTICLE_LANGUAGE_ONLY": errors.append("article language must come only from user-confirmed article language")
    elif locale.get("platform_language_role") not in ({"TRANSPORT_ELIGIBILITY_ONLY_NEVER_REWRITE_LANGUAGE"} if requires_research_integrity else {"ELIGIBILITY_ONLY_NEVER_REWRITE_LANGUAGE", "TRANSPORT_ELIGIBILITY_ONLY_NEVER_REWRITE_LANGUAGE"}): errors.append("platform language may only determine transport eligibility, never rewrite article language")
    elif requires_research_integrity and (locale.get("transport_evidence_is_not_audience_fit") is not True or locale.get("primary_audience_evidence_required") is not True or locale.get("cross_language_exception_requires_explicit_owner_confirmation") is not True): errors.append("schema 2.10+ locale-platform policy must separate transport from primary audience fit")
    locale_rows = locale.get("rows") if isinstance(locale, dict) else None
    if not isinstance(locale_rows, list): errors.append("locale-platform validation rows must be a list")
    if platform_mapping_required and (articles or assignments or scope.get("allowed_pairs")):
        if not isinstance(locale_rows, list) or len(locale_rows) != len(article_ids): errors.append("locked campaign requires one locale-platform validation row per article")
        elif not all(isinstance(item, dict) for item in locale_rows): errors.append("locale-platform validation rows must contain objects")
        else:
            article_by_id = {str(item.get("article_id", "")).strip(): item for item in articles if isinstance(item, dict)}
            assignment_by_id = {str(item.get("article_id", "")).strip(): item for item in assignments if isinstance(item, dict)}
            row_ids = [str(item.get("article_id", "")).strip() for item in locale_rows]
            if set(row_ids) != set(article_ids) or len(set(row_ids)) != len(row_ids): errors.append("locale-platform validation must cover each article exactly once")
            for row in locale_rows:
                article_id = str(row.get("article_id", "")).strip()
                article = article_by_id.get(article_id, {})
                mapped = assignment_by_id.get(article_id, {})
                language = str(article.get("language", "")).strip().casefold()
                market = str(article.get("market", "")).strip().casefold()
                if not language or not market: errors.append(f"article {article_id}: language and market are required for locale-platform validation")
                if str(row.get("article_language", "")).strip().casefold() != language or str(row.get("market", "")).strip().casefold() != market: errors.append(f"article {article_id}: locale validation must match the frozen article language and market")
                if str(row.get("platform", "")).strip().casefold() != str(mapped.get("platform", "")).strip().casefold() or str(row.get("account", "")).strip().casefold() != str(mapped.get("account", "")).strip().casefold(): errors.append(f"article {article_id}: locale validation must match its unique platform/account assignment")
                if requires_research_integrity:
                    plan = article_plan_record(prewrite_manifest, article_id) if isinstance(prewrite_manifest, dict) else None
                    frozen_mapping = plan.get("frozen_delivery_mapping") if isinstance(plan, dict) else None
                    expected_fit_mode = frozen_mapping.get("fit_mode") if isinstance(frozen_mapping, dict) else None
                    if str(row.get("decision", "")).strip() != str(expected_fit_mode or "").strip(): errors.append(f"article {article_id}: locale-platform decision must match the pre-write frozen delivery mapping")
                    errors.extend(audience_compatibility_errors(
                        row.get("audience_compatibility"),
                        article_language=str(article.get("language", "")),
                        market=str(article.get("market", "")),
                        expected_fit_mode=expected_fit_mode,
                        label=f"article {article_id} locale-platform row",
                    ))
                else:
                    supported = [str(value).strip().casefold() for value in row.get("supported_content_languages", [])] if isinstance(row.get("supported_content_languages"), list) else []
                    if not supported or language not in supported: errors.append(f"article {article_id}: LOCALE_PLATFORM_MISMATCH (platform does not support the frozen article language)")
                    if not str(row.get("platform_language_evidence", "")).strip() or str(row.get("decision", "")).strip().upper() != "COMPATIBLE": errors.append(f"article {article_id}: locale-platform evidence and COMPATIBLE decision are required")
    title_policy = cfg.get("title_quality_policy", {})
    if not isinstance(title_policy, dict) or title_policy.get("mode") != "MODEL_LED_SEMANTIC_REVIEW": errors.append("title review mode must be MODEL_LED_SEMANTIC_REVIEW")
    elif title_policy.get("required_before_review") is not True: errors.append("title review must be required before review")
    elif not isinstance(title_policy.get("review_dimensions"), list) or not title_policy["review_dimensions"]: errors.append("title review requires non-empty review_dimensions")
    elif not isinstance(title_policy.get("heuristics"), dict) or title_policy["heuristics"].get("non_blocking") is not True: errors.append("title heuristics must be explicitly non-blocking")
    if requires_content_value_policy:
        errors.extend(content_value_policy_errors(cfg.get("content_value_policy"), required_cta=requires_required_cta_policy))
        quality_policy = cfg.get("quality_policy")
        expected_quality_policy = {
            "aitdk_local_reference": "required",
            "plugin_scan": "best_effort_non_blocking",
            "final_prepublication_target": "visual-payload.html+visual-payload.md",
        }
        if not isinstance(quality_policy, dict) or any(quality_policy.get(key) != value for key, value in expected_quality_policy.items()):
            errors.append("schema 2.1+ campaign requires the standard local quality policy")
    keyword_policy = cfg.get("keyword_research_policy", {})
    expected_keyword_mode = "WRITER_CONTINUOUS_LONG_TAIL_AND_REGIONAL_SERP" if requires_model_first_execution_policy else "PRE_DRAFT_LONG_TAIL_AND_REGIONAL_SERP"
    if not isinstance(keyword_policy, dict) or keyword_policy.get("mode") != expected_keyword_mode: errors.append(f"keyword research mode must be {expected_keyword_mode}")
    elif requires_model_first_execution_policy and keyword_policy.get("required_within_writer_continuous_turn_before_claims") is not True: errors.append("writer keyword research must occur inside the continuous W turn before supported claims")
    elif not requires_model_first_execution_policy and requires_prewrite_policy and keyword_policy.get("required_after_owner_prewrite_confirmation_before_drafting") is not True: errors.append("writer keyword research must follow plan confirmation and precede drafting")
    elif not requires_prewrite_policy and keyword_policy.get("required_before_confirmation_and_drafting") is not True: errors.append("legacy keyword research must precede confirmation and drafting")
    elif keyword_policy.get("creative_angle_is_not_keyword_evidence") is not True: errors.append("creative angle cannot be keyword evidence")
    elif keyword_policy.get("variant_priority_order") != PRIORITY: errors.append("keyword research variant priority order is invalid")
    elif keyword_policy.get("english_multi_article_intents_must_be_distinct") is not True: errors.append("English multi-article intents must be distinct")
    elif keyword_policy.get("regional_serp_variants_required_for_every_target_language") is not True: errors.append("regional SERP variants are required for every target language")
    elif keyword_policy.get("model_translation_fallback_requires_independent_regional_serp_checks") != 2: errors.append("model translation fallback requires two regional SERP checks")
    if requires_trend_evidence_policy and (not isinstance(keyword_policy, dict) or keyword_policy.get("trend_evidence_policy") != TREND_EVIDENCE_POLICY_2_5):
        errors.append("schema 2.5 keyword research requires the optional-trends evidence policy")
    style_policy = cfg.get("platform_style_research_policy", {})
    expected_style_mode = "ON_DEMAND_IN_SCOPE_PROFILE" if requires_model_first_execution_policy else "IN_SCOPE_READONLY_DUAL_PROFILE"
    if not isinstance(style_policy, dict) or style_policy.get("mode") != expected_style_mode: errors.append(f"platform style research mode must be {expected_style_mode}")
    elif requires_model_first_execution_policy and style_policy.get("attempt_before_drafting") is not False: errors.append("model-first platform style research must not be a drafting gate")
    elif not requires_model_first_execution_policy and style_policy.get("attempt_before_drafting") is not True: errors.append("platform style research must be attempted before drafting")
    elif style_policy.get("in_scope_platforms_only") is not True: errors.append("platform style research must stay in scope")
    elif style_policy.get("sample_shortage") != "UNVERIFIED_USE_CONSERVATIVE_GENERIC": errors.append("platform style sample shortage must remain non-blocking")
    elif style_policy.get("editorial_profile_is_non_binding") is not True: errors.append("platform editorial profile must remain non-binding")
    elif style_policy.get("durable_harvest_requires_public_qa_passed") is not True: errors.append("platform style harvest requires public QA")
    elif requires_model_first_execution_policy and style_policy.get("trigger") != "CACHE_MISS_AND_MATERIAL_READER_TRANSPORT_RISK": errors.append("model-first platform style research must be risk-triggered")
    visual_policy = cfg.get("visual_narrative_policy", {})
    if not isinstance(visual_policy, dict) or visual_policy.get("mode") != "LEAD_MIDDLE_CLOSING_REQUIRED": errors.append("visual narrative mode must be LEAD_MIDDLE_CLOSING_REQUIRED")
    elif visual_policy.get("required_coverage_zones") != VISUAL_ZONES: errors.append("visual narrative must require LEAD, MIDDLE and CLOSING coverage")
    elif not isinstance(visual_policy.get("default_minimum_images"), int) or visual_policy["default_minimum_images"] < 3: errors.append("visual narrative default minimum must be at least three images")
    elif not isinstance(visual_policy.get("default_applies_to"), list) or not visual_policy["default_applies_to"]: errors.append("visual narrative requires article-type coverage")
    elif not isinstance(visual_policy.get("all_articles_required"), bool): errors.append("visual narrative all_articles_required must be boolean")
    elif visual_policy.get("exception_requires_owner_confirmation") is not True: errors.append("visual narrative exceptions require owner confirmation")
    if isinstance(articles, list) and requires_content_value_policy:
        for article in articles:
            if not isinstance(article, dict):
                continue
            article_id = str(article.get("article_id", "")).strip()
            if locked and not str(article.get("focus_keyword", "")).strip(): errors.append(f"article {article_id}: focus_keyword is required")
            errors.extend(content_value_article_errors(article, required_cta=requires_required_cta_policy))
    release_policy = cfg.get("release_policy", {})
    if not requires_human_native_release and requires_live_execution_profile and not isinstance(release_policy.get("human_release_requested"), bool):
        errors.append("schema 2.8 release_policy.human_release_requested must be boolean")
    elif not requires_human_native_release and requires_live_execution_profile and release_policy.get("human_release_requested") is False:
        configured_pairs = scope.get("allowed_pairs") if isinstance(scope, dict) else None
        configured_assignments = assignment.get("assignments") if isinstance(assignment, dict) else None
        configured_locale_rows = locale.get("rows") if isinstance(locale, dict) else None
        if any(isinstance(value, list) and value for value in (configured_pairs, configured_assignments, configured_locale_rows)):
            errors.append("platform mappings require release_policy.human_release_requested=true")
    if not requires_human_native_release and release_policy.get("machine_external_writes_allowed") is not False: errors.append("machine external writes must be false")
    if release_policy.get("default_title_transfer_mode") not in {"SEPARATE_TITLE_FIELD", "TITLE_IN_BODY"}: errors.append("release policy needs a valid default title transfer mode")
    heading_policy = release_policy.get("heading_hierarchy_policy")
    if not isinstance(heading_policy, dict): errors.append("release policy requires a heading hierarchy policy")
    elif heading_policy.get("authority") != "PUBLIC_READER_PAGE_VISUAL_ONLY": errors.append("heading hierarchy authority must be the public reader-page visual")
    elif heading_policy.get("editor_html_or_dom") != "NOT_A_VALID_QA_SURFACE": errors.append("editor HTML or DOM cannot be a heading QA surface")
    elif heading_policy.get("local_payload_markup") != "AUTHORING_AND_COPY_SELECTION_AID_ONLY": errors.append("local payload markup must remain an authoring and copy-selection aid")
    elif heading_policy.get("public_visual_check_requires_human_accepted_url") is not True: errors.append("public visual heading check requires human acceptance and a URL")
    template = release_policy.get("visual_payload_template", {})
    if not isinstance(template, dict) or template.get("id") != "BLOG_3P_VISUAL_PAYLOAD" or template.get("version") != "3": errors.append("release payload must use BLOG_3P_VISUAL_PAYLOAD@3")
    elif template.get("rendering") != "COMPILER_ONLY" or template.get("model_authored_shell_css_js") != "PROHIBITED": errors.append("release payload must be compiler-only with no model-authored shell, CSS or JavaScript")
    orchestration = cfg.get("orchestration_policy", {})
    uses_batch_control_plane = (
        requires_batch_control_plane
        or (
            isinstance(orchestration, dict)
            and orchestration.get("batch_gate_policy") == GATE_BATCH_POLICY_2_7
            and orchestration.get("article_public_gate_mode") == "REUSE_REGISTERED_CAMPAIGN_GATEKEEPER_BATCH_READONLY"
        )
    )
    requires_worktree_policy = parsed_schema_version != (1, 0)
    requires_lane_bundle = parsed_schema_version not in {(1, 0), (1, 1)}
    if orchestration.get("delegation_default") != "VISIBLE_SUBAGENTS": errors.append("visible subagents must be the default delegation mode")
    if orchestration.get("visible_task_record_required") is not True: errors.append("visible task records must be required")
    if orchestration.get("invisible_cli_agent_sessions") != "PROHIBITED": errors.append("invisible CLI agent sessions must be prohibited")
    expected_pair_mode = (
        "REUSABLE_WQ_WR_WITH_ARTICLE_ARTIFACT_ISOLATION"
        if requires_dual_quality_routes
        else "REUSABLE_W_R_WITH_ARTICLE_ARTIFACT_ISOLATION"
        if requires_main_session_path_isolation else "ONE_REUSABLE_PAIR_PER_ARTICLE"
    )
    if orchestration.get("writer_reviewer_pair_mode") != expected_pair_mode:
        errors.append("schema 2.14 main-session campaigns must use reusable WQ/WR roles with per-article artifact isolation" if requires_dual_quality_routes else "main-session campaigns must allow reusable W/R roles with per-article artifact isolation" if requires_main_session_path_isolation else "each article must have one reusable writer-reviewer pair")
    expected_cross_article_reuse = (
        "CAMPAIGN_WQ_WR_G_REUSE_ALLOWED" if requires_dual_quality_routes
        else "CAMPAIGN_W_R_G_REUSE_ALLOWED" if requires_main_session_path_isolation
        else "CAMPAIGN_GATEKEEPER_ONLY" if uses_batch_control_plane else "PROHIBITED"
    )
    if orchestration.get("cross_article_agent_reuse") != expected_cross_article_reuse:
        errors.append("only the persistent campaign gatekeeper may be reused across articles" if uses_batch_control_plane else "writer-reviewer agents may not be reused across articles")
    if orchestration.get("operations_steward_mode") != "ONE_REUSABLE_CAMPAIGN_OPERATIONS_STEWARD": errors.append("campaign operations must use one reusable visible steward")
    if orchestration.get("persistent_requirements_gatekeeper") is not True: errors.append("G must be the persistent requirements gatekeeper")
    if orchestration.get("fresh_agent_roles") != []: errors.append("public QA must not create a fresh agent")
    if orchestration.get("pair_activation") != "G_QUEUE_SUBJECT_TO_RUNTIME_CAPACITY": errors.append("article pairs must be scheduled by the G queue and runtime capacity")
    if requires_main_session_path_isolation:
        if orchestration.get("execution_session") != "CONTINUOUS_CAMPAIGN_MAIN_SESSION": errors.append("main-session campaigns require a continuous campaign main session")
        if orchestration.get("execution_isolation") != MAIN_SESSION_PATH_ISOLATION: errors.append("main-session execution isolation must be MAIN_SESSION_PATH_ISOLATED")
        if orchestration.get("article_artifact_root_template") != ARTICLE_ARTIFACT_ROOT_TEMPLATE: errors.append("main-session article artifact root template must be articles/{article_id}")
        if orchestration.get("article_artifact_roots") != "REQUIRED_DISJOINT": errors.append("main-session article artifact roots must be required and disjoint")
        if orchestration.get("worktree_autospawn") != WORKTREE_AUTOSPAWN_POLICY: errors.append("main-session worktree autospawn must be EXPLICIT_EXCEPTION_ONLY")
        if orchestration.get("worktree_dispatch_decision") != "REQUIRED_FOR_GIT_WORKTREE_ONLY": errors.append("main-session Git worktrees require a recorded exception decision")
        if orchestration.get("worktree_allowed_reasons") != ["TRUE_CONCURRENT_WRITE", "HIGH_RISK_REWRITE_OR_ROLLBACK", "OWNER_REQUESTED_GIT_ISOLATION"]: errors.append("main-session worktree reasons are invalid")
        if orchestration.get("worktree_fallback") != "NOT_APPLICABLE_MAIN_SESSION_PATH_ISOLATED": errors.append("main-session execution must not use a worktree fallback as its normal path")
        if orchestration.get("silent_worktree_fallback") is not False: errors.append("worktree decisions must never be silent")
    elif requires_worktree_policy:
        if orchestration.get("execution_isolation") != "WORKTREE_FIRST_PER_ARTICLE": errors.append("execution isolation must be WORKTREE_FIRST_PER_ARTICLE")
        if orchestration.get("worktree_autospawn") != "CREATE_VISIBLE_PROJECT_WORKTREE_PER_READY_ARTICLE_WHEN_SUPPORTED": errors.append("ready articles must auto-spawn visible project worktrees when supported")
        if orchestration.get("worktree_fallback") != "VISIBLE_SHARED_WORKSPACE_WITH_PATH_ISOLATION": errors.append("worktree fallback must preserve visible shared-workspace path isolation")
        if orchestration.get("silent_worktree_fallback") is not False: errors.append("worktree fallback must never be silent")
    elif orchestration.get("visible_worktree_autospawn") != "AUTHORIZED_MAXIMIZE_AVAILABLE_CAPACITY": errors.append("legacy campaigns must retain visible worktree auto-spawn policy")
    if requires_lane_bundle:
        public_qa = orchestration.get("public_qa_policy")
        if uses_batch_control_plane:
            expected_role_bundle = "REUSABLE_WQ_WR_PLUS_SHARED_CAMPAIGN_G" if requires_dual_quality_routes else "REUSABLE_W_R_PLUS_SHARED_CAMPAIGN_G" if requires_main_session_path_isolation else "ONE_REUSABLE_W_R_PAIR_PLUS_SHARED_CAMPAIGN_G"
            expected_root_role = "ARTICLE_ARTIFACT_ROOT" if requires_main_session_path_isolation else "ARTICLE_WRITER_REVIEWER_PAIR"
            if orchestration.get("article_worktree_role_bundle") != expected_role_bundle: errors.append("schema 2.14 main-session article execution must use reusable WQ/WR plus the shared campaign G" if requires_dual_quality_routes else "main-session article execution must use reusable W/R plus the shared campaign G" if requires_main_session_path_isolation else "each article worktree must carry one reusable W-R pair plus the shared campaign G")
            if orchestration.get("project_worktree_root_role") != expected_root_role: errors.append("main-session articles must root artifacts at ARTICLE_ARTIFACT_ROOT" if requires_main_session_path_isolation else "the project worktree root must be the article writer-reviewer pair")
            if orchestration.get("campaign_gatekeeper_scope") != "PREWRITE_BATCH_CONTRACT_AND_BATCH_PUBLIC_QA": errors.append("campaign G must own pre-write, batch contract acceptance and batch public QA")
            if orchestration.get("article_public_gate_mode") != "REUSE_REGISTERED_CAMPAIGN_GATEKEEPER_BATCH_READONLY": errors.append("public QA must reuse the registered campaign gatekeeper in batch read-only mode")
            errors.extend(batch_gate_policy_errors(
                orchestration.get("batch_gate_policy"),
                expected=GATE_BATCH_POLICY_2_14 if requires_dual_quality_routes else GATE_BATCH_POLICY_2_7,
            ))
            errors.extend(public_qa_policy_errors(public_qa, expected=PUBLIC_QA_POLICY_2_7))
        else:
            if orchestration.get("article_worktree_role_bundle") != "ONE_REUSABLE_W_R_G_LANE_PER_ARTICLE": errors.append("each article worktree must carry one reusable W-R-G lane")
            if orchestration.get("project_worktree_root_role") != "ARTICLE_LANE_GATEKEEPER": errors.append("the project worktree root must be ARTICLE_LANE_GATEKEEPER")
            if orchestration.get("campaign_gatekeeper_scope") != "GLOBAL_REQUIREMENTS_QUEUE_AND_LEDGER_ONLY": errors.append("campaign G must remain the global requirements, queue and ledger controller")
            if orchestration.get("article_public_gate_mode") != "REUSE_ARTICLE_LANE_GATEKEEPER_ONLY": errors.append("public QA must reuse the article lane gatekeeper only")
            if requires_streamlined_public_qa_policy:
                errors.extend(public_qa_policy_errors(public_qa))
            elif isinstance(public_qa, dict) and all(key in public_qa for key in PUBLIC_QA_POLICY_2_3):
                errors.extend(public_qa_policy_errors(public_qa))
            elif not isinstance(public_qa, dict) or public_qa.get("mode") != "REUSE_ARTICLE_LANE_GATEKEEPER_READONLY": errors.append("public QA must use the existing article lane gatekeeper in read-only mode")
            elif public_qa.get("requires_human_acceptance") is not True: errors.append("public QA requires explicit human acceptance")
            elif public_qa.get("automatic_wr_reopen") is not False: errors.append("public QA must not automatically reopen the W-R loop")
            elif public_qa.get("on_mismatch") != "OWNER_DECISION_REQUIRED": errors.append("public QA mismatch must require an owner decision")
    expected_resume_policy = "MAIN_SESSION_SEQUENTIAL_OR_SAFE_PATH_BATCH" if requires_main_session_path_isolation else "AUTO_START_NEXT_READY_TASK_ON_SLOT_AVAILABLE"
    if orchestration.get("queue_resume_policy") != expected_resume_policy: errors.append("main-session campaigns must process sequentially or by a safe path-disjoint batch" if requires_main_session_path_isolation else "next ready task must auto-start when a runtime slot becomes available")
    if orchestration.get("article_agent_replacement_requires_full_rehydration") is not True: errors.append("article-agent replacement must require full rehydration")
    state_orchestration = st.get("orchestration", {})
    if requires_artifact_optimization_policy:
        artifact_index = st.get("artifact_index")
        if not isinstance(artifact_index, dict):
            errors.append("state artifact_index must be an object")
        else:
            required_artifact_indexes = ("article_contexts", "review_indexes", "review_deltas")
            if uses_batch_control_plane:
                required_artifact_indexes += ("gate_batches", "public_qa_batches")
            if any(not isinstance(artifact_index.get(field), dict) for field in required_artifact_indexes):
                errors.append("state artifact_index must track article contexts, review indexes, review deltas and applicable batch records")
    tasks = state_orchestration.get("tasks") if isinstance(state_orchestration, dict) else None
    article_queue = state_orchestration.get("article_queue") if isinstance(state_orchestration, dict) else None
    article_agents = state_orchestration.get("article_agents") if isinstance(state_orchestration, dict) else None
    if not isinstance(tasks, list): errors.append("state orchestration tasks must be a list")
    if not isinstance(article_queue, list): errors.append("state article queue must be a list")
    if not isinstance(article_agents, dict): errors.append("state article agents must be an object")
    article_workspaces = state_orchestration.get("article_workspaces") if isinstance(state_orchestration, dict) else None
    if requires_main_session_path_isolation:
        if state_orchestration.get("execution_session") != "CONTINUOUS_CAMPAIGN_MAIN_SESSION": errors.append("state must record the continuous campaign main session")
        if state_orchestration.get("article_artifact_root_template") != ARTICLE_ARTIFACT_ROOT_TEMPLATE: errors.append("state article artifact root template must be articles/{article_id}")
    if requires_worktree_policy and not isinstance(article_workspaces, dict): errors.append("state article workspaces must be an object")
    elif article_workspaces is not None and not isinstance(article_workspaces, dict): errors.append("state article workspaces must be an object when present")
    elif requires_lane_bundle and isinstance(article_workspaces, dict):
        configured_workspace_article_ids = {
            str(article.get("article_id", "")).strip()
            for article in articles if isinstance(article, dict) and str(article.get("article_id", "")).strip()
        }
        if requires_main_session_path_isolation:
            errors.extend(article_workspace_isolation_errors(
                article_workspaces, article_ids=configured_workspace_article_ids,
            ))
        seen_writers: set[str] = set()
        seen_reviewers: set[str] = set()
        campaign_gatekeeper_id = state_orchestration.get("campaign_gatekeeper_agent_id") if isinstance(state_orchestration, dict) else None
        if uses_batch_control_plane and article_workspaces and not non_empty_string(campaign_gatekeeper_id):
            errors.append("batch control plane requires state orchestration campaign_gatekeeper_agent_id")
        for article_id, workspace_record in article_workspaces.items():
            if article_id not in configured_workspace_article_ids:
                errors.append(f"article workspace {article_id}: article_id is not configured")
            if not isinstance(workspace_record, dict):
                errors.append(f"article workspace {article_id}: record must be an object"); continue
            bundle = workspace_record.get("role_bundle")
            if uses_batch_control_plane:
                expected_workspace_root_role = (
                    "ARTICLE_WRITER_QUALITY_ROUTE"
                    if requires_dual_quality_routes else "ARTICLE_WRITER_REVIEWER_PAIR"
                )
                if workspace_record.get("root_role") != expected_workspace_root_role:
                    errors.append(f"article workspace {article_id}: root role must be {expected_workspace_root_role}")
                if not isinstance(bundle, dict): errors.append(f"article workspace {article_id}: role_bundle must be an object")
                else:
                    if requires_dual_quality_routes:
                        if set(("campaign_gatekeeper_agent", "writer_agent")) - set(bundle):
                            errors.append(f"article workspace {article_id}: WQ/WR role_bundle must declare shared campaign G and W")
                            continue
                        if any(not non_empty_string(bundle.get(field)) for field in ("campaign_gatekeeper_agent", "writer_agent")):
                            errors.append(f"article workspace {article_id}: WQ/WR campaign G and W IDs must be non-empty")
                            continue
                        if bundle.get("campaign_gatekeeper_agent") != campaign_gatekeeper_id:
                            errors.append(f"article workspace {article_id}: campaign G must match the registered campaign gatekeeper")
                        plan = article_plan_record(prewrite_manifest, article_id) if isinstance(prewrite_manifest, dict) else None
                        effort = plan.get("review_effort") if isinstance(plan, dict) else None
                        reviewer_required = route_requires_independent_reviewer(
                            workspace, cfg, article_id, effort,
                        )
                        reviewer_id = bundle.get("reviewer_agent")
                        if reviewer_required:
                            if not non_empty_string(reviewer_id):
                                errors.append(f"article workspace {article_id}: WR route requires an independent reviewer_agent")
                            elif reviewer_id == bundle.get("writer_agent"):
                                errors.append(f"article workspace {article_id}: WR reviewer_agent must differ from writer_agent")
                        elif reviewer_id not in {None, ""}:
                            errors.append(f"article workspace {article_id}: un-escalated WQ route must not register an idle reviewer_agent")
                        seen_writers.add(bundle.get("writer_agent"))
                        if non_empty_string(reviewer_id):
                            seen_reviewers.add(reviewer_id)
                    elif set(("campaign_gatekeeper_agent", "writer_agent", "reviewer_agent")) - set(bundle):
                        errors.append(f"article workspace {article_id}: role_bundle must declare shared campaign G, W and R")
                    elif any(not non_empty_string(bundle.get(field)) for field in ("campaign_gatekeeper_agent", "writer_agent", "reviewer_agent")):
                        errors.append(f"article workspace {article_id}: role_bundle agent IDs must be non-empty")
                    else:
                        if bundle.get("campaign_gatekeeper_agent") != campaign_gatekeeper_id:
                            errors.append(f"article workspace {article_id}: campaign G must match the registered campaign gatekeeper")
                        writer_id = bundle.get("writer_agent")
                        reviewer_id = bundle.get("reviewer_agent")
                        if not requires_main_session_path_isolation and writer_id in seen_writers: errors.append(f"article workspace {article_id}: writer may not be reused across articles")
                        if not requires_main_session_path_isolation and reviewer_id in seen_reviewers: errors.append(f"article workspace {article_id}: reviewer may not be reused across articles")
                        seen_writers.add(writer_id); seen_reviewers.add(reviewer_id)
            else:
                if workspace_record.get("root_role") != "ARTICLE_LANE_GATEKEEPER": errors.append(f"article workspace {article_id}: root role must be ARTICLE_LANE_GATEKEEPER")
                if not isinstance(bundle, dict): errors.append(f"article workspace {article_id}: role_bundle must be an object")
                elif set(("lane_gatekeeper_agent", "writer_agent", "reviewer_agent")) - set(bundle): errors.append(f"article workspace {article_id}: role_bundle must declare lane G, W and R")
                elif any(not non_empty_string(bundle.get(field)) for field in ("lane_gatekeeper_agent", "writer_agent", "reviewer_agent")):
                    errors.append(f"article workspace {article_id}: role_bundle agent IDs must be non-empty")
    service_agents = state_orchestration.get("service_agents") if isinstance(state_orchestration, dict) else None
    service = service_agents.get("campaign_operations") if isinstance(service_agents, dict) else None
    if not isinstance(service, dict) or service.get("role") != "CAMPAIGN_OPERATIONS_STEWARD" or service.get("reusable") is not True: errors.append("state requires one reusable campaign operations steward")
    matcher = service_agents.get("platform_matching") if isinstance(service_agents, dict) else None
    if not isinstance(matcher, dict) or matcher.get("role") != MATCHING_ROLE or matcher.get("reusable") is not True: errors.append("state requires one reusable visible platform matching researcher")
    capacity = state_orchestration.get("capacity", {}) if isinstance(state_orchestration, dict) else {}
    if not isinstance(capacity, dict): errors.append("state orchestration capacity must be an object")
    elif capacity.get("spawn_policy") != ("MAIN_SESSION_SEQUENTIAL_OR_SAFE_PATH_BATCH" if requires_main_session_path_isolation else "AUTHORIZED_MAXIMIZE_AVAILABLE_CAPACITY"): errors.append("state capacity must use main-session sequential or safe path batches" if requires_main_session_path_isolation else "state capacity must maximize visible runtime capacity")
    elif requires_worktree_policy and not isinstance(capacity.get("active_article_worktrees"), list): errors.append("state capacity must track active article worktrees")
    elif not isinstance(capacity.get("active_article_pairs"), list): errors.append("state capacity must track active article pairs")
    prewrite_state = st.get("prewrite_plan")
    if requires_prewrite_policy and not isinstance(prewrite_state, dict):
        errors.append("state pre-write plan must be an object")
    elif requires_prewrite_policy and isinstance(prewrite_state, dict):
        prewrite_status = prewrite_state.get("status")
        if prewrite_status not in PREWRITE_STATUSES:
            errors.append("state pre-write plan has an unknown status")
        if prewrite_state.get("report_path") != "prewrite-plan.md":
            errors.append("state pre-write report path must be prewrite-plan.md")
        if prewrite_state.get("manifest_path") != "prewrite-plan.json":
            errors.append("state pre-write manifest path must be prewrite-plan.json")
        article_ids = [str(article.get("article_id", "")).strip() for article in articles if isinstance(article, dict)]
        article_ids_are_valid = bool(article_ids) and len(article_ids) == len(articles) and all(article_ids) and len(set(article_ids)) == len(article_ids)
        if not isinstance(prewrite_manifest, dict):
            errors.append("pre-write manifest must be an object")
        else:
            if prewrite_manifest.get("campaign_id") != cfg.get("campaign_id"):
                errors.append("pre-write manifest campaign_id does not match")
            if prewrite_manifest.get("status") != prewrite_status:
                errors.append("pre-write manifest status does not match state")
            expected_manifest_schema = (
                prewrite_plan_schema_for_campaign(cfg) if requires_topic_governance
                else RESEARCH_INTEGRITY_PREWRITE_PLAN_SCHEMA if requires_research_integrity
                else "1.5" if requires_live_execution_profile
                else "1.4" if requires_model_first_execution_policy
                else "1.3" if requires_artifact_optimization_policy
                else "1.2" if requires_required_cta_policy
                else "1.1" if requires_content_value_policy
                else "1.0"
            )
            allowed_manifest_schemas = {expected_manifest_schema}
            if not requires_research_integrity:
                allowed_manifest_schemas.add(CURRENT_PREWRITE_PLAN_SCHEMA)
            if prewrite_manifest.get("schema_version") not in allowed_manifest_schemas:
                errors.append(f"pre-write manifest schema_version must be {expected_manifest_schema}")
            if requires_artifact_optimization_policy:
                convention = prewrite_manifest.get("artifact_convention")
                expected_convention = {
                    "canonical_source": "prewrite-plan.json",
                    "owner_view_path": "prewrite-plan.md",
                    "owner_view_mode": "DETERMINISTIC_RENDERED_READ_ONLY",
                    "manual_duplicate_entry": "PROHIBITED",
                    "writer_research_remains_required": True,
                }
                if not isinstance(convention, dict) or any(convention.get(key) != value for key, value in expected_convention.items()):
                    errors.append("pre-write manifest artifact convention is invalid")
                shared_pack = prewrite_manifest.get("shared_evidence_pack")
                if not isinstance(shared_pack, dict) or shared_pack.get("path") != "evidence/shared/campaign-evidence-pack.json" or shared_pack.get("scope") != "CAMPAIGN_READONLY_BASELINE" or shared_pack.get("does_not_replace_article_research") is not True:
                    errors.append("pre-write manifest shared evidence pack declaration is invalid")
                elif shared_pack.get("sha256") != "PENDING":
                    shared_path, shared_error = workspace_file(workspace, shared_pack.get("path"), label="shared evidence pack")
                    if shared_error:
                        errors.append(shared_error)
                    elif shared_path is not None and shared_pack.get("sha256") != sha256_file(shared_path):
                        errors.append("shared evidence pack hash does not match")
                rendered_plan = render_prewrite_plan_markdown(prewrite_manifest, sha256_file(workspace / "prewrite-plan.json"))
                if (workspace / "prewrite-plan.md").read_text(encoding="utf-8") != rendered_plan:
                    errors.append("pre-write report must be the deterministic rendering of prewrite-plan.json")
        if prewrite_status == "OWNER_PREWRITE_PLAN_CONFIRMED":
            confirmation_id = str(prewrite_state.get("owner_confirmation_id", "")).strip()
            if not confirmation_id:
                errors.append("confirmed pre-write plan requires owner_confirmation_id")
            if not article_ids_are_valid:
                errors.append("confirmed pre-write plan requires unique non-empty configured article IDs")
            if not exact_article_coverage(prewrite_state.get("article_ids"), article_ids):
                errors.append("confirmed pre-write plan must cover every configured article exactly once")
            report_path = workspace / "prewrite-plan.md"
            manifest_path = workspace / "prewrite-plan.json"
            report_hash = sha256_file(report_path)
            manifest_hash = sha256_file(manifest_path)
            if prewrite_state.get("report_sha256") != report_hash:
                errors.append("confirmed pre-write report hash does not match")
            if prewrite_state.get("manifest_sha256") != manifest_hash:
                errors.append("confirmed pre-write manifest hash does not match")
            if isinstance(prewrite_manifest, dict):
                if prewrite_manifest.get("owner_confirmation_id") != confirmation_id:
                    errors.append("pre-write manifest owner_confirmation_id does not match state")
                if requires_live_execution_profile:
                    receipt = prewrite_manifest.get("owner_confirmation_receipt")
                    errors.extend(owner_confirmation_receipt_errors(workspace, receipt))
                    if prewrite_state.get("owner_confirmation_receipt") != receipt:
                        errors.append("state pre-write owner confirmation receipt does not match manifest")
                if requires_research_integrity:
                    errors.extend(prewrite_plan_submission_errors(cfg, prewrite_manifest))
                    errors.extend(confirmed_scope_snapshot_errors(cfg, prewrite_manifest))
                    scope_snapshot = prewrite_manifest.get("confirmed_scope_snapshot")
                    scope_snapshot_sha = canonical_json_sha256(scope_snapshot) if isinstance(scope_snapshot, dict) else None
                    if prewrite_state.get("scope_snapshot") != scope_snapshot:
                        errors.append("state pre-write scope snapshot does not match manifest")
                    if prewrite_state.get("scope_snapshot_sha256") != scope_snapshot_sha:
                        errors.append("state pre-write scope snapshot hash does not match manifest")
                summary = prewrite_manifest.get("campaign_summary")
                if not isinstance(summary, dict) or any(not isinstance(summary.get(section), str) or not summary[section].strip() for section in required_summary_sections):
                    errors.append("confirmed pre-write manifest requires every campaign-summary section")
                plans = prewrite_manifest.get("article_plans")
                manifest_ids = [str(plan.get("article_id", "")).strip() for plan in plans if isinstance(plan, dict)] if isinstance(plans, list) else []
                if not isinstance(plans, list) or len(manifest_ids) != len(plans) or not exact_article_coverage(manifest_ids, article_ids):
                    errors.append("pre-write manifest must contain exactly one plan per configured article")
                else:
                    for plan in plans:
                        if not isinstance(plan, dict):
                            continue
                        for section in required_plan_sections:
                            if not isinstance(plan.get(section), str) or not plan[section].strip():
                                errors.append(f"pre-write manifest article {plan.get('article_id')}: missing {section}")
                        if requires_model_first_execution_policy:
                            for error in model_first_review_effort_errors(plan.get("review_effort"), cfg_or_version=cfg):
                                errors.append(f"pre-write manifest article {plan.get('article_id')}: {error}")
            report_text = report_path.read_text(encoding="utf-8")
            report_ids = csv_values(markdown_field(report_text, "Article IDs"))
            if markdown_field(report_text, "Status") != "OWNER_PREWRITE_PLAN_CONFIRMED":
                errors.append("pre-write report must record OWNER_PREWRITE_PLAN_CONFIRMED")
            if markdown_field(report_text, "Owner confirmation ID") != confirmation_id:
                errors.append("pre-write report confirmation ID does not match state")
            if markdown_field(report_text, "Pre-write manifest SHA-256") != manifest_hash:
                errors.append("pre-write report manifest hash does not match")
            if requires_research_integrity and markdown_field(report_text, "Protected scope snapshot SHA-256") != canonical_json_sha256(prewrite_manifest.get("confirmed_scope_snapshot")):
                errors.append("pre-write report scope snapshot hash does not match")
            if not exact_article_coverage(report_ids, article_ids):
                errors.append("pre-write report must name every configured article exactly once")
            confirmation_text = (workspace / "confirmation.md").read_text(encoding="utf-8")
            if markdown_field(confirmation_text, "Pre-write plan status") != "OWNER_PREWRITE_PLAN_CONFIRMED":
                errors.append("confirmation record must record OWNER_PREWRITE_PLAN_CONFIRMED")
            if markdown_field(confirmation_text, "Pre-write plan confirmation ID") != confirmation_id:
                errors.append("confirmation record ID does not match state")
            if markdown_field(confirmation_text, "Pre-write report SHA-256") != report_hash:
                errors.append("confirmation record report hash does not match")
            if markdown_field(confirmation_text, "Pre-write manifest SHA-256") != manifest_hash:
                errors.append("confirmation record manifest hash does not match")
            if requires_research_integrity and markdown_field(confirmation_text, "Protected scope snapshot SHA-256") != canonical_json_sha256(prewrite_manifest.get("confirmed_scope_snapshot")):
                errors.append("confirmation record scope snapshot hash does not match")
            if not exact_article_coverage(csv_values(markdown_field(confirmation_text, "Pre-write article IDs")), article_ids):
                errors.append("confirmation record must name every configured article exactly once")
            requirements_text = (workspace / "requirements-contract.md").read_text(encoding="utf-8")
            if markdown_field(requirements_text, "Pre-write plan confirmation ID") != confirmation_id:
                errors.append("requirements contract confirmation ID does not match state")
            if markdown_field(requirements_text, "Pre-write report SHA-256") != report_hash:
                errors.append("requirements contract report hash does not match")
            if markdown_field(requirements_text, "Pre-write manifest SHA-256") != manifest_hash:
                errors.append("requirements contract manifest hash does not match")
            if requires_research_integrity and markdown_field(requirements_text, "Protected scope snapshot SHA-256") != canonical_json_sha256(prewrite_manifest.get("confirmed_scope_snapshot")):
                errors.append("requirements contract scope snapshot hash does not match")
            if not exact_article_coverage(csv_values(markdown_field(requirements_text, "Pre-write article IDs")), article_ids):
                errors.append("requirements contract must bind every configured article exactly once")
            scope_receipt = cfg.get("scope_lock", {}).get("prewrite_plan_receipt") if isinstance(cfg.get("scope_lock"), dict) else None
            if not isinstance(scope_receipt, dict):
                errors.append("scope lock must bind the confirmed pre-write plan")
            else:
                if scope_receipt.get("owner_confirmation_id") != confirmation_id:
                    errors.append("scope lock pre-write confirmation ID does not match state")
                if scope_receipt.get("report_sha256") != report_hash:
                    errors.append("scope lock pre-write report hash does not match")
                if scope_receipt.get("manifest_sha256") != manifest_hash:
                    errors.append("scope lock pre-write manifest hash does not match")
                if not exact_article_coverage(scope_receipt.get("article_ids"), article_ids):
                    errors.append("scope lock must bind every configured article exactly once")
                if requires_research_integrity:
                    scope_snapshot = prewrite_manifest.get("confirmed_scope_snapshot")
                    scope_snapshot_sha = canonical_json_sha256(scope_snapshot) if isinstance(scope_snapshot, dict) else None
                    if scope_receipt.get("scope_snapshot") != scope_snapshot:
                        errors.append("scope lock pre-write scope snapshot does not match manifest")
                    if scope_receipt.get("scope_snapshot_sha256") != scope_snapshot_sha:
                        errors.append("scope lock pre-write scope snapshot hash does not match manifest")
                if requires_live_execution_profile:
                    if scope_receipt.get("owner_confirmation_receipt") != prewrite_manifest.get("owner_confirmation_receipt"):
                        errors.append("scope lock owner confirmation receipt does not match manifest")
                    scope_lock = cfg.get("scope_lock")
                    if not isinstance(scope_lock, dict) or scope_lock.get("status") != "LOCKED":
                        errors.append("owner-confirmed live workspace must have scope_lock.status=LOCKED")
                    elif scope_lock.get("owner_confirmation") != "OWNER_PREWRITE_PLAN_CONFIRMED":
                        errors.append("owner-confirmed live workspace must record scope_lock.owner_confirmation")
            if st.get("phase") in {"prewrite_planning", "awaiting_owner_prewrite_confirmation"}:
                errors.append("confirmed pre-write plan must advance beyond the pre-write phase")
        elif st.get("phase") not in {"prewrite_planning", "awaiting_owner_prewrite_confirmation", "deferred", "blocked", "capacity_blocked"}:
            errors.append("unconfirmed pre-write plan cannot enter editorial phases")
        if prewrite_status != "OWNER_PREWRITE_PLAN_CONFIRMED":
            article_role_tasks = [task for task in tasks if isinstance(task, dict) and task.get("role") in ARTICLE_EXECUTION_ROLES] if isinstance(tasks, list) else []
            active_pairs = capacity.get("active_article_pairs") if isinstance(capacity, dict) else None
            active_worktrees = capacity.get("active_article_worktrees") if isinstance(capacity, dict) else None
            if article_role_tasks:
                errors.append("article roles may not start before OWNER_PREWRITE_PLAN_CONFIRMED")
            if isinstance(article_queue, list) and article_queue:
                errors.append("article queue must remain empty before OWNER_PREWRITE_PLAN_CONFIRMED")
            if isinstance(article_agents, dict) and article_agents:
                errors.append("article agents may not exist before OWNER_PREWRITE_PLAN_CONFIRMED")
            if isinstance(article_workspaces, dict) and article_workspaces:
                errors.append("article worktrees may not exist before OWNER_PREWRITE_PLAN_CONFIRMED")
            if isinstance(active_pairs, list) and active_pairs:
                errors.append("active article pairs are forbidden before OWNER_PREWRITE_PLAN_CONFIRMED")
            if isinstance(active_worktrees, list) and active_worktrees:
                errors.append("active article worktrees are forbidden before OWNER_PREWRITE_PLAN_CONFIRMED")
    if requires_streamlined_public_qa_policy:
        configured_article_ids = {
            str(article.get("article_id", "")).strip()
            for article in articles
            if isinstance(article, dict) and str(article.get("article_id", "")).strip()
        }
        errors.extend(
            publication_ledger_errors(
                st.get("publication"), article_ids=configured_article_ids, article_workspaces=article_workspaces,
                workspace=workspace, batch_mode=uses_batch_control_plane,
                campaign_gatekeeper_agent_id=(
                    state_orchestration.get("campaign_gatekeeper_agent_id")
                    if isinstance(state_orchestration, dict) else None
                ),
            )
        )
        errors.extend(
            public_qa_task_errors(
                st.get("publication"), tasks=tasks, article_workspaces=article_workspaces,
                batch_mode=uses_batch_control_plane,
                campaign_gatekeeper_agent_id=(
                    state_orchestration.get("campaign_gatekeeper_agent_id")
                    if isinstance(state_orchestration, dict) else None
                ),
            )
        )
    cross = cfg.get("cross_language_seo", {})
    if cross.get("google_trends_seed_language") != "ENGLISH_ONLY": errors.append("Google Trends seed language must be ENGLISH_ONLY")
    if cross.get("variant_priority_order") != PRIORITY: errors.append("cross-language priority order is invalid")
    if cross.get("minimum_independent_regional_serp_checks_for_fallback") != 2: errors.append("model fallback requires two independent SERP checks")
    if cross.get("status") not in {"NOT_REQUESTED", "REQUIRED", "READY", "UNVERIFIED", "OWNER_WAIVED"}: errors.append("unknown cross-language status")
    if st.get("campaign_id") != cfg.get("campaign_id"): errors.append("state campaign_id does not match")
    if st.get("phase") not in PHASES: errors.append("unknown phase")
    if errors:
        print("CHECK_FAILED\n" + "\n".join(errors)); return 1
    print("CHECK_PASSED"); return 0


def check_article_package(workspace: Path, package_path: Path) -> int:
    """Check declaration fidelity only; R retains all editorial judgment."""
    errors, package = article_package_errors(workspace, package_path)
    if errors:
        print("ARTICLE_PACKAGE_CHECK_FAILED\n" + "\n".join(errors))
        return 1
    if package is None:
        print("ARTICLE_PACKAGE_CHECK_SKIPPED_LEGACY_SCHEMA")
        return 0
    print("ARTICLE_PACKAGE_CHECK_PASSED")
    return 0


def article_package_errors(workspace: Path, package_path: Path) -> tuple[list[str], dict | None]:
    """Return package declaration errors without turning them into editorial scores."""
    errors: list[str] = []
    try:
        cfg = json.loads((workspace / "campaign.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"invalid campaign JSON: {exc}"], None
    parsed_schema_version = parse_schema_version(cfg.get("schema_version"))
    requires_required_cta_policy = False
    requires_artifact_optimization_policy = False
    if parsed_schema_version is None:
        errors.append("campaign schema_version must use exact major.minor form")
        requires_required_cta_policy = True
    elif parsed_schema_version < (2, 1):
        return [], None
    else:
        requires_required_cta_policy = parsed_schema_version >= (2, 2)
        requires_artifact_optimization_policy = parsed_schema_version >= (2, 4)
        errors.extend(content_value_policy_errors(cfg.get("content_value_policy"), required_cta=requires_required_cta_policy))

    resolved_package = package_path if package_path.is_absolute() else workspace / package_path
    try:
        package = json.loads(resolved_package.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"invalid article package JSON: {exc}")
        package = None
    articles = cfg.get("articles")
    if not isinstance(articles, list):
        errors.append("campaign articles must be a list")
    elif not isinstance(package, dict):
        errors.append("article package must be an object")
    else:
        article_id = str(package.get("article_id", "")).strip()
        matches = [article for article in articles if isinstance(article, dict) and str(article.get("article_id", "")).strip() == article_id]
        if len(matches) != 1:
            errors.append("article package article_id must match exactly one campaign article")
        else:
            if uses_main_session_path_isolation(cfg):
                try:
                    expected_package = workspace / article_artifact_root_relative(cfg, article_id) / "article-package.json"
                    if resolved_package.resolve() != expected_package.resolve():
                        errors.append("article package must be inside its deterministic article artifact root")
                except ValueError as exc:
                    errors.append(str(exc))
            errors.extend(article_package_declaration_errors(
                matches[0], package, required_cta=requires_required_cta_policy,
                package_schema=OPTIMIZED_ARTICLE_PACKAGE_SCHEMAS if requires_artifact_optimization_policy else None,
            ))
            if requires_artifact_optimization_policy:
                errors.extend(package_artifact_source_errors(package))
    return errors, package if isinstance(package, dict) else None


def package_current_artifact_errors(workspace: Path, package: object) -> list[str]:
    """Check only current artifact presence and hashes before an expensive R turn.

    This is deliberately narrower than editorial review: it does not inspect
    prose quality, SEO judgment, factual entailment, or image-reader fit.
    """
    if not isinstance(package, dict):
        return ["review-ready requires an article package object"]
    errors: list[str] = []
    canonical_path, canonical_error = workspace_file(
        workspace, package.get("canonical_path"), label="review-ready canonical article"
    )
    if canonical_error:
        errors.append(canonical_error)
    elif canonical_path is not None and package.get("canonical_sha256") != sha256_file(canonical_path):
        errors.append("review-ready canonical article sha256 does not match article package")
    sources = package.get("artifact_sources")
    source_keys = ["evidence_pack", "visual_manifest"]
    if package.get("schema_version") in PACKAGE_SCHEMA_WITH_METADATA_SOURCE:
        source_keys.append("metadata")
    if not isinstance(sources, dict):
        return errors + ["review-ready article package requires artifact_sources"]
    for key in source_keys:
        source = sources.get(key)
        if not isinstance(source, dict):
            errors.append(f"review-ready article package requires {key}")
            continue
        source_path, source_error = workspace_file(
            workspace, source.get("path"), label=f"review-ready {key}"
        )
        if source_error:
            errors.append(source_error)
        elif source_path is not None and source.get("sha256") != sha256_file(source_path):
            errors.append(f"review-ready {key} sha256 does not match article package")
    if package.get("schema_version") == CURRENT_ARTICLE_PACKAGE_SCHEMA:
        if package.get("canonical_path") != "canonical/article.html":
            errors.append("review-ready article package schema 1.5 canonical_path must be canonical/article.html")
        if package.get("canonical_format") != "RICH_TEXT_HTML_FRAGMENT":
            errors.append("review-ready article package schema 1.5 canonical_format must be RICH_TEXT_HTML_FRAGMENT")
    return errors


def research_evidence_pack_integrity_errors(workspace: Path, context: dict) -> list[str]:
    """Check declared research boundaries locally; leave meaning and prose to R."""
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    if cfg_error or cfg is None or not schema_at_least(cfg.get("schema_version"), 2, 10):
        return []
    paths = context.get("artifact_paths")
    evidence_relative = paths.get("evidence_pack") if isinstance(paths, dict) else None
    evidence_path, evidence_error = workspace_file(workspace, evidence_relative, label="research evidence pack")
    if evidence_error:
        return [evidence_error]
    assert evidence_path is not None
    evidence, evidence_error = json_object_file(evidence_path, label="research evidence pack")
    if evidence_error or evidence is None:
        return [evidence_error or "research evidence pack is invalid"]
    errors: list[str] = []
    errors.extend(shared_campaign_evidence_reuse_errors(workspace, evidence))
    requires_topic_governance = schema_at_least(cfg.get("schema_version"), 2, 11)
    expected_evidence_schema = (
        CURRENT_EVIDENCE_PACK_SCHEMA
        if requires_topic_governance
        else RESEARCH_INTEGRITY_EVIDENCE_PACK_SCHEMA
    )
    if evidence.get("schema_version") != expected_evidence_schema:
        errors.append(f"research evidence pack schema_version must be {expected_evidence_schema}")
    plan = context.get("prewrite_plan")
    expected_posture = plan.get("evidence_posture") if isinstance(plan, dict) else None
    actual_posture = evidence.get("evidence_posture")
    if not isinstance(expected_posture, dict):
        errors.append("article contract lacks the frozen evidence posture")
    elif not isinstance(actual_posture, dict):
        errors.append("research evidence pack lacks evidence_posture")
    else:
        for key in ("mode", "empirical_claims_allowed"):
            if actual_posture.get(key) != expected_posture.get(key):
                errors.append(f"research evidence posture {key} does not match the frozen pre-write declaration")
        errors.extend(evidence_posture_errors(actual_posture, require_documented_record=True))
    separation = evidence.get("research_separation")
    if not isinstance(separation, dict):
        return errors + ["research evidence pack requires research_separation"]
    reader_basis = separation.get("reader_intent_basis")
    if not isinstance(reader_basis, dict):
        errors.append("research evidence pack requires reader_intent_basis")
    else:
        decision = reader_basis.get("decision")
        refs = reader_basis.get("selected_phrase_evidence_refs")
        if decision not in READER_INTENT_BASIS_MODES:
            errors.append("reader_intent_basis.decision is invalid")
        if not isinstance(refs, list) or not all(non_empty_string(ref) for ref in refs) or not refs:
            errors.append("reader_intent_basis requires selected_phrase_evidence_refs")
        elif decision == "MODEL_TRANSLATION_FALLBACK" and len(refs) < 2:
            errors.append("model-translation fallback requires two recorded regional evidence references")
    profile_use = separation.get("platform_profile_use")
    if not isinstance(profile_use, dict):
        errors.append("research evidence pack requires platform_profile_use")
    else:
        if profile_use.get("mode") not in PLATFORM_PROFILE_USE_MODES:
            errors.append("platform_profile_use.mode must be NOT_USED or TOPIC_FRAMING_ONLY")
        refs = profile_use.get("evidence_refs")
        if not isinstance(refs, list) or not all(non_empty_string(ref) for ref in refs):
            errors.append("platform_profile_use.evidence_refs must be a list of non-empty references")
        if profile_use.get("used_as_keyword_or_demand_evidence") is not False:
            errors.append("platform profile cannot be used as selected keyword or demand evidence")
    if requires_topic_governance:
        errors.extend(topic_slot_alignment_errors(plan, evidence))
        alignment = evidence.get("topic_slot_alignment") if isinstance(evidence, dict) else None
        errors.extend(topic_conflict_resolution_errors(workspace, context, alignment))
    return errors


def review_ready_errors(
    workspace: Path, context_path: Path, index_path: Path, package_path: Path,
) -> list[str]:
    """Run model-free transport/provenance checks before a full R review.

    A successful result merely means that R can spend its time on editorial
    judgment. It is not an approval and does not choose the review route.
    """
    errors = article_context_errors(workspace, context_path)
    context, context_error = json_object_file(context_path, label="review-ready article contract")
    if context_error or context is None:
        return errors + [context_error or "review-ready article contract is invalid"]
    review_effort = context.get("review_effort")
    requires_research = research_review_required(review_effort) if isinstance(review_effort, dict) else True
    errors.extend(
        review_index_errors(
            workspace, index_path, require_research_approved=requires_research,
        )
    )
    package_errors, package = article_package_errors(workspace, package_path)
    errors.extend(package_errors)
    if package is None:
        return errors + ["review-ready requires an article package supported by the current workflow"]
    if package.get("article_id") != context.get("article_id"):
        errors.append("review-ready article package does not bind the article contract article_id")
    resolved_package = package_path if package_path.is_absolute() else workspace / package_path
    package_root = resolved_package.parent
    current_cfg, _ = read_workspace_json(workspace, "campaign.json")
    if uses_main_session_path_isolation(current_cfg):
        expected_package = workspace / str(context.get("artifact_paths", {}).get("article_package", ""))
        if resolved_package.resolve() != expected_package.resolve():
            errors.append("review-ready article package must use the article contract artifact root")
    errors.extend(package_current_artifact_errors(package_root, package))
    errors.extend(research_evidence_pack_integrity_errors(workspace, context))
    payload_relative = context.get("artifact_paths", {}).get("visual_payload") if isinstance(context.get("artifact_paths"), dict) else None
    payload_path, payload_error = workspace_file(
        workspace, payload_relative, label="review-ready visual payload"
    )
    if payload_error:
        errors.append(payload_error)
        return errors
    assert payload_path is not None
    markdown_relative = context.get("artifact_paths", {}).get("visual_payload_markdown") if isinstance(context.get("artifact_paths"), dict) else None
    markdown_path, markdown_error = workspace_file(
        workspace, markdown_relative, label="review-ready Markdown payload"
    )
    if markdown_error:
        errors.append(markdown_error)
        return errors
    assert markdown_path is not None
    validator = Path(__file__).resolve().parents[2] / "blog-3p-human-handoff" / "scripts" / "validate_payload.py"
    if not validator.is_file():
        errors.append("review-ready payload validator is unavailable")
        return errors
    release_policy = current_cfg.get("release_policy", {}) if isinstance(current_cfg, dict) else {}
    title_transfer_mode = (
        release_policy.get("default_title_transfer_mode", "SEPARATE_TITLE_FIELD")
        if isinstance(release_policy, dict) else "SEPARATE_TITLE_FIELD"
    )
    result = subprocess.run(
        [
            sys.executable, str(validator), "--payload", str(payload_path),
            "--markdown-payload", str(markdown_path),
            "--article-package", str(package_path),
            "--title-transfer-mode", str(title_transfer_mode),
        ],
        text=True, capture_output=True, check=False,
    )
    if result.returncode != 0:
        detail = (result.stdout or result.stderr).strip().replace("\n", "; ")
        errors.append("review-ready visual payload validation failed" + (f": {detail}" if detail else ""))
    return errors


def check_review_ready(workspace: Path, context_path: Path, index_path: Path, package_path: Path) -> int:
    """Fail cheaply on structural drift; never score an article or issue a verdict."""
    errors = review_ready_errors(workspace, context_path, index_path, package_path)
    if errors:
        print("REVIEW_READY_CHECK_FAILED\n" + "\n".join(errors))
        return 1
    resolved_package = package_path if package_path.is_absolute() else workspace / package_path
    package, package_error = json_object_file(resolved_package, label="review-ready article package")
    companion_status = (
        "COMPILER_VERIFIED_MATCH"
        if package_error is None and isinstance(package, dict) and package.get("schema_version") == CURRENT_ARTICLE_PACKAGE_SCHEMA
        else "COMPANION_DUAL_READ_REQUIRED"
    )
    print("REVIEW_READY_CHECK_PASSED\ncompanion_projection=" + companion_status)
    return 0


def runtime_metric_value(value: object) -> float | None:
    """Accept optional runtime-provided metrics without inventing missing data."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0:
        return None
    return float(value)


def runtime_metric_summary(tasks: list[dict[str, object]]) -> dict[str, dict[str, object]]:
    """Summarize only metrics actually supplied by completed model tasks."""
    metric_fields = ("input_tokens", "output_tokens", "wall_time_seconds", "tool_calls")
    metrics: dict[str, dict[str, object]] = {}
    for field in metric_fields:
        values: list[float] = []
        for task in tasks:
            source = task.get("runtime_metrics")
            source = source if isinstance(source, dict) else task
            value = runtime_metric_value(source.get(field))
            if value is not None:
                values.append(value)
        metrics[field] = {
            "total": sum(values) if values else None,
            "observed_task_count": len(values),
            "availability": "RUNTIME_PROVIDED" if values else "UNAVAILABLE",
        }
    return metrics


def unavailable_transport_signal(*, total: bool = False) -> dict[str, object]:
    """Keep an absent or unusable ledger distinct from a measured zero."""
    return {
        "total" if total else "count": None,
        "availability": "UNAVAILABLE",
    }


def observed_transport_count(
    records: list[dict[str, object]], *, field: str, expected: object,
    allowed_values: set[object],
) -> dict[str, object]:
    """Count a ledger status only when every observed row supplies that status."""
    values = [record.get(field) for record in records]
    if any(
        field not in record or not any(value == allowed for allowed in allowed_values)
        for record, value in zip(records, values)
    ):
        return unavailable_transport_signal()
    return {
        "count": sum(value == expected for value in values),
        "availability": "LEDGER_PROVIDED",
    }


def public_transport_summary(publication: object) -> dict[str, object]:
    """Expose public handoff friction from the existing ledger, never as a gate."""
    signal_names = (
        "human_needs_fix",
        "human_transport_fix_required",
        "public_qa_unverified",
        "passed_with_limitation",
        "accepted_platform_limitation_count",
        "unverified_retry_count",
        "canonical_change_requested",
    )
    if not isinstance(publication, dict) or not isinstance(publication.get("articles"), dict):
        signals: dict[str, object] = {
            "availability": "UNAVAILABLE",
            "observed_article_count": None,
        }
        for name in signal_names:
            signals[name] = unavailable_transport_signal(
                total=name in {"accepted_platform_limitation_count", "unverified_retry_count"},
            )
        return signals

    article_records = publication["articles"]
    records = [record for record in article_records.values() if isinstance(record, dict)]
    has_only_records = len(records) == len(article_records)
    signals = {
        "availability": "LEDGER_PROVIDED",
        "observed_article_count": len(article_records),
        "human_needs_fix": (
            observed_transport_count(
                records, field="human_state", expected="HUMAN_NEEDS_FIX",
                allowed_values={None, *HUMAN_RETURN_STATES},
            )
            if has_only_records else unavailable_transport_signal()
        ),
        "human_transport_fix_required": (
            observed_transport_count(
                records, field="public_qa_status", expected="HUMAN_TRANSPORT_FIX_REQUIRED",
                allowed_values=set(PUBLIC_QA_RECORD_STATUSES),
            )
            if has_only_records else unavailable_transport_signal()
        ),
        "public_qa_unverified": (
            observed_transport_count(
                records, field="public_qa_status", expected="PUBLIC_QA_UNVERIFIED",
                allowed_values=set(PUBLIC_QA_RECORD_STATUSES),
            )
            if has_only_records else unavailable_transport_signal()
        ),
        "passed_with_limitation": (
            observed_transport_count(
                records, field="public_qa_status", expected="PUBLIC_QA_PASSED_WITH_LIMITATION",
                allowed_values=set(PUBLIC_QA_RECORD_STATUSES),
            )
            if has_only_records else unavailable_transport_signal()
        ),
        "canonical_change_requested": (
            observed_transport_count(
                records, field="public_qa_status", expected="CANONICAL_CHANGE_REQUESTED",
                allowed_values=set(PUBLIC_QA_RECORD_STATUSES),
            )
            if has_only_records else unavailable_transport_signal()
        ),
    }
    limitations = [record.get("accepted_platform_limitations") for record in records]
    if not has_only_records or any(not isinstance(value, list) for value in limitations):
        signals["accepted_platform_limitation_count"] = unavailable_transport_signal(total=True)
    else:
        signals["accepted_platform_limitation_count"] = {
            "total": sum(len(value) for value in limitations),
            "availability": "LEDGER_PROVIDED",
        }
    retry_counts = [record.get("unverified_retry_count") for record in records]
    if (
        not has_only_records
        or any(isinstance(value, bool) or not isinstance(value, int) or value < 0 for value in retry_counts)
    ):
        signals["unverified_retry_count"] = unavailable_transport_signal(total=True)
    else:
        signals["unverified_retry_count"] = {
            "total": sum(retry_counts),
            "availability": "LEDGER_PROVIDED",
        }
    return signals


def summarize_efficiency(workspace: Path, output: Path | None) -> int:
    """Summarize observed workflow cost signals without becoming a release gate."""
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    state_record, state_error = read_workspace_json(workspace, "state.json")
    errors = [error for error in (cfg_error, state_error) if error]
    if errors or cfg is None or state_record is None:
        print("EFFICIENCY_SUMMARY_FAILED\n" + "\n".join(errors))
        return 1
    orchestration = state_record.get("orchestration")
    tasks = orchestration.get("tasks") if isinstance(orchestration, dict) else None
    if not isinstance(tasks, list):
        print("EFFICIENCY_SUMMARY_FAILED\nstate orchestration requires tasks")
        return 1
    model_roles = {"ARTICLE_WRITER", "ARTICLE_LANGUAGE_REVIEWER", "ARTICLE_LANE_GATEKEEPER", CAMPAIGN_GATEKEEPER_ROLE}
    completed = [
        task for task in tasks
        if isinstance(task, dict) and task.get("status") == "COMPLETED" and task.get("role") in model_roles
    ]
    by_role = Counter(str(task.get("role")) for task in completed)
    by_stage = Counter(str(task.get("workflow_stage", "UNSPECIFIED")) for task in completed)
    metrics = runtime_metric_summary(completed)
    completed_by_stage: dict[str, list[dict[str, object]]] = {}
    for task in completed:
        stage = str(task.get("workflow_stage", "UNSPECIFIED"))
        completed_by_stage.setdefault(stage, []).append(task)
    metrics_by_stage = {
        stage: runtime_metric_summary(stage_tasks)
        for stage, stage_tasks in sorted(completed_by_stage.items())
    }
    review_stages = Counter(str(task.get("workflow_stage", "UNSPECIFIED")) for task in completed)
    review_results = Counter(str(task.get("result", "UNSPECIFIED")) for task in completed if task.get("role") == "ARTICLE_LANGUAGE_REVIEWER")
    canonical_reopen_turns = sum(
        task.get("workflow_stage") == "CANONICAL_REOPEN"
        and task.get("role") in {"ARTICLE_WRITER", "ARTICLE_LANGUAGE_REVIEWER"}
        for task in completed
    )
    summary = {
        "schema_version": "1.0",
        "purpose": "OBSERVE_ONLY_WORKFLOW_EFFICIENCY_SUMMARY",
        "campaign_id": cfg.get("campaign_id"),
        "measurement_boundary": "NOT_A_RELEASE_GATE; NO_COST_OR_TOKEN_ESTIMATE_WHEN_RUNTIME_DATA_IS_UNAVAILABLE",
        "completed_model_stages": {
            "count": len(completed),
            "by_role": dict(sorted(by_role.items())),
            "by_workflow_stage": dict(sorted(by_stage.items())),
        },
        "review_rework_signals": {
            "author_qa_turns": review_stages.get("AUTHOR_QA", 0),
            "independent_full_review_turns": review_stages.get("FULL_REVIEW", 0),
            "full_review_turns": review_stages.get("FULL_REVIEW", 0),
            "research_review_turns": review_stages.get("RESEARCH_REVIEW", 0),
            "wq_to_wr_escalation_count": (
                review_stages.get("WR_ESCALATION", 0)
                + review_stages.get("WR_ESCALATION_DECISION", 0)
            ),
            "targeted_delta_turns": review_stages.get("REVIEW_DELTA", 0),
            "visual_delta_turns": review_stages.get("VISUAL_PAYLOAD_DELTA", 0),
            "canonical_reopen_turns": canonical_reopen_turns,
            "review_changes_required": review_results.get("CHANGES_REQUIRED", 0),
        },
        "runtime_metrics": metrics,
        "runtime_metrics_by_workflow_stage": metrics_by_stage,
        "public_transport_signals": public_transport_summary(state_record.get("publication")),
    }
    serialized = json.dumps(summary, ensure_ascii=False, indent=2) + "\n"
    if output is None:
        print(serialized, end="")
        return 0
    resolved_output = output if output.is_absolute() else workspace / output
    try:
        relative_path(workspace, resolved_output)
    except ValueError:
        print("EFFICIENCY_SUMMARY_FAILED\noutput must stay inside the campaign workspace")
        return 1
    resolved_output.parent.mkdir(parents=True, exist_ok=True)
    resolved_output.write_text(serialized, encoding="utf-8")
    print(f"EFFICIENCY_SUMMARY_WRITTEN: {relative_path(workspace, resolved_output)}")
    return 0


def check_public_return_receipt(workspace: Path, receipt_path: Path, package_path: Path) -> int:
    """Validate the human return boundary without fetching or changing a public page."""
    errors: list[str] = []
    try:
        cfg = json.loads((workspace / "campaign.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"PUBLIC_RETURN_RECEIPT_CHECK_FAILED\ninvalid campaign JSON: {exc}")
        return 1
    parsed_schema_version = parse_schema_version(cfg.get("schema_version"))
    if parsed_schema_version is None:
        errors.append("campaign schema_version must use exact major.minor form")
        parsed_schema_version = (2, 5)
    if parsed_schema_version < (2, 3):
        print("PUBLIC_RETURN_RECEIPT_CHECK_SKIPPED_LEGACY_SCHEMA")
        return 0
    orchestration = cfg.get("orchestration_policy", {})
    expected_public_policy = PUBLIC_QA_POLICY_2_7 if parsed_schema_version >= (2, 7) else PUBLIC_QA_POLICY_2_3
    errors.extend(public_qa_policy_errors(
        orchestration.get("public_qa_policy") if isinstance(orchestration, dict) else None,
        expected=expected_public_policy,
    ))
    resolved_package = package_path if package_path.is_absolute() else workspace / package_path
    resolved_receipt = receipt_path if receipt_path.is_absolute() else workspace / receipt_path
    try:
        package = json.loads(resolved_package.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"invalid article package JSON: {exc}")
        package = None
    try:
        receipt = json.loads(resolved_receipt.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"invalid public return receipt JSON: {exc}")
        receipt = None
    article_id = str(package.get("article_id", "")).strip() if isinstance(package, dict) else ""
    articles = cfg.get("articles")
    matches = [article for article in articles if isinstance(article, dict) and str(article.get("article_id", "")).strip() == article_id] if isinstance(articles, list) else []
    if len(matches) != 1:
        errors.append("article package article_id must match exactly one campaign article")
    elif isinstance(package, dict):
        errors.extend(article_package_declaration_errors(
            matches[0], package, required_cta=True,
            package_schema=OPTIMIZED_ARTICLE_PACKAGE_SCHEMAS if parsed_schema_version >= (2, 4) else None,
        ))
        if parsed_schema_version >= (2, 4):
            errors.extend(package_artifact_source_errors(package))
    errors.extend(public_return_receipt_errors(receipt, expected_article_id=article_id or None))
    if errors:
        print("PUBLIC_RETURN_RECEIPT_CHECK_FAILED\n" + "\n".join(errors))
        return 1
    print("PUBLIC_RETURN_RECEIPT_CHECK_PASSED")
    return 0


def check_handoff_manifest(workspace: Path, manifest_path: Path, package_path: Path) -> int:
    """Check the compiler-generated handoff receipt without repeating full R."""
    resolved_manifest = manifest_path if manifest_path.is_absolute() else workspace / manifest_path
    resolved_package = package_path if package_path.is_absolute() else workspace / package_path
    manifest, manifest_error = json_object_file(resolved_manifest, label="handoff manifest")
    package, package_error = json_object_file(resolved_package, label="article package")
    errors: list[str] = [error for error in (manifest_error, package_error) if error]
    if manifest is None or package is None:
        print("HANDOFF_MANIFEST_CHECK_FAILED\n" + "\n".join(errors))
        return 1
    if manifest.get("schema_version") != "1.0":
        errors.append("handoff manifest schema_version must be 1.0")
    if package.get("schema_version") not in OPTIMIZED_ARTICLE_PACKAGE_SCHEMAS:
        errors.append("handoff manifest requires article package schema_version 1.3, 1.4 or 1.5")
    errors.extend(package_artifact_source_errors(package))
    article_id = str(package.get("article_id", "")).strip()
    article_root = resolved_package.parent
    cfg, cfg_error = read_workspace_json(workspace, "campaign.json")
    if cfg_error:
        errors.append(cfg_error)
    elif uses_main_session_path_isolation(cfg):
        try:
            expected_root = workspace / article_artifact_root_relative(cfg, article_id)
        except ValueError as exc:
            errors.append(str(exc))
            expected_root = None
        if expected_root is not None and article_root.resolve() != expected_root.resolve():
            errors.append("handoff article package must be inside its deterministic article artifact root")
        expected_manifest = article_root / "handoff/handoff-manifest.json"
        if resolved_manifest.resolve() != expected_manifest.resolve():
            errors.append("handoff manifest must be inside the article package handoff directory")
    if manifest.get("article_id") != article_id:
        errors.append("handoff manifest article_id does not match article package")
    if manifest.get("purpose") != "DERIVED_HANDOFF_ARTIFACT_AND_HASH_INDEX":
        errors.append("handoff manifest purpose is invalid")

    review_errors, review_index, registered_reviewer_id = handoff_review_approval_errors(
        workspace, article_id, article_root=article_root,
    )
    errors.extend(review_errors)
    review_index_path = article_root / "reviews/review-index.json"
    review_index_sha256 = sha256_file(review_index_path) if review_index_path.is_file() else None

    def verify_artifact(key: str, expected_path: str | None = None) -> None:
        record = manifest.get(key)
        if not isinstance(record, dict):
            errors.append(f"handoff manifest requires {key}")
            return
        if expected_path is not None and record.get("path") != expected_path:
            errors.append(f"handoff manifest {key} path does not match the canonical declaration")
        artifact, artifact_error = workspace_file(article_root, record.get("path"), label=f"handoff manifest {key}")
        if artifact_error:
            errors.append(artifact_error)
        elif artifact is not None and record.get("sha256") != sha256_file(artifact):
            errors.append(f"handoff manifest {key} sha256 does not match")

    verify_artifact("visual_payload", "handoff/visual-payload.html")
    verify_artifact("visual_payload_markdown", "handoff/visual-payload.md")
    verify_artifact("metadata", "canonical/metadata.json")
    try:
        expected_package_path = relative_path(article_root, resolved_package)
    except ValueError:
        expected_package_path = None
        errors.append("handoff article package must stay inside workspace")
    verify_artifact("article_package", expected_package_path)
    artifact_sources = package.get("artifact_sources")
    expected_visual_path = None
    if isinstance(artifact_sources, dict) and isinstance(artifact_sources.get("visual_manifest"), dict):
        expected_visual_path = artifact_sources["visual_manifest"].get("path")
    verify_artifact("visual_manifest", expected_visual_path if isinstance(expected_visual_path, str) else None)
    visual_record = manifest.get("visual_manifest")
    if isinstance(artifact_sources, dict) and isinstance(artifact_sources.get("visual_manifest"), dict) and isinstance(visual_record, dict):
        if visual_record.get("sha256") != artifact_sources["visual_manifest"].get("sha256"):
            errors.append("handoff manifest visual_manifest sha256 does not match article package")
    metadata_record = manifest.get("metadata")
    if package.get("schema_version") in PACKAGE_SCHEMA_WITH_METADATA_SOURCE:
        metadata_source = artifact_sources.get("metadata") if isinstance(artifact_sources, dict) else None
        if not isinstance(metadata_source, dict) or not isinstance(metadata_record, dict):
            errors.append("current handoff requires package and manifest metadata records")
        elif metadata_record.get("path") != metadata_source.get("path") or metadata_record.get("sha256") != metadata_source.get("sha256"):
            errors.append("handoff manifest metadata does not match article package")
    evidence_pack_sha256 = None
    if isinstance(artifact_sources, dict):
        evidence_source = artifact_sources.get("evidence_pack")
        if isinstance(evidence_source, dict):
            evidence_pack, evidence_error = workspace_file(article_root, evidence_source.get("path"), label="handoff evidence pack")
            if evidence_error:
                errors.append(evidence_error)
            elif evidence_pack is not None and evidence_source.get("sha256") != sha256_file(evidence_pack):
                errors.append("handoff evidence pack sha256 does not match article package")
            else:
                evidence_pack_sha256 = evidence_source.get("sha256")
        canonical_path, canonical_error = workspace_file(article_root, package.get("canonical_path"), label="handoff canonical article")
        if canonical_error:
            errors.append(canonical_error)
        elif canonical_path is not None and package.get("canonical_sha256") != sha256_file(canonical_path):
            errors.append("handoff canonical article sha256 does not match article package")
    visual_payload, visual_payload_error = workspace_file(article_root, "handoff/visual-payload.html", label="handoff visual payload")
    visual_payload_sha256 = sha256_file(visual_payload) if visual_payload is not None and not visual_payload_error else None
    visual_payload_markdown, visual_payload_markdown_error = workspace_file(
        article_root, "handoff/visual-payload.md", label="handoff Markdown payload",
    )
    visual_payload_markdown_sha256 = (
        sha256_file(visual_payload_markdown)
        if visual_payload_markdown is not None and not visual_payload_markdown_error else None
    )
    visual_manifest_sha256 = None
    if isinstance(artifact_sources, dict) and isinstance(artifact_sources.get("visual_manifest"), dict):
        visual_manifest_sha256 = artifact_sources["visual_manifest"].get("sha256")
    if package.get("schema_version") == "1.3":
        package_delta = package.get("final_visual_payload_delta")
        errors.extend(final_visual_payload_delta_errors(
            package_delta, require_approved=True, workspace=workspace,
            expected_visual_manifest_sha256=visual_manifest_sha256 if isinstance(visual_manifest_sha256, str) else None,
            expected_visual_payload_sha256=visual_payload_sha256,
            expected_review_index_sha256=review_index_sha256,
        ))
        expected_delta_fields = (
            "reviewer_result", "report_path", "report_sha256", "reviewer_agent_id",
            "review_index_sha256", "reviewed_visual_manifest_sha256", "reviewed_visual_payload_sha256",
        )
        final_delta = manifest.get("final_visual_payload_delta")
        if not isinstance(final_delta, dict):
            errors.append("handoff manifest requires final_visual_payload_delta")
        elif not isinstance(package_delta, dict) or any(final_delta.get(field) != package_delta.get(field) for field in expected_delta_fields):
            errors.append("handoff manifest final visual payload delta does not match article package")
        if isinstance(package_delta, dict) and registered_reviewer_id is not None:
            if package_delta.get("reviewer_agent_id") != registered_reviewer_id:
                errors.append("final visual payload delta reviewer_agent_id must match the registered article reviewer")
            elif non_empty_string(package_delta.get("report_path")):
                errors.extend(reviewer_task_receipt_errors(
                    workspace, article_id=article_id, reviewer_agent_id=registered_reviewer_id,
                    workflow_stage="VISUAL_PAYLOAD_DELTA", result=FINAL_VISUAL_DELTA_RESULT,
                    report_path=package_delta["report_path"],
                ))
        if isinstance(review_index, dict) and isinstance(package_delta, dict):
            visual_index = review_index.get("last_delta")
            if not isinstance(visual_index, dict):
                errors.append("handoff review index requires the approved final visual delta")
            else:
                if visual_index.get("review_scope") != "R_VISUAL_DELTA" or visual_index.get("status") != FINAL_VISUAL_DELTA_RESULT:
                    errors.append("handoff review index final delta must be an approved R_VISUAL_DELTA")
                for field in (
                    "report_path", "report_sha256", "reviewer_agent_id",
                    "reviewed_visual_manifest_sha256", "reviewed_visual_payload_sha256",
                ):
                    if visual_index.get(field) != package_delta.get(field):
                        errors.append(f"handoff review index final delta {field} does not match article package")
    else:
        verify_artifact("review_index", "reviews/review-index.json")
        metadata_sha256 = metadata_record.get("sha256") if isinstance(metadata_record, dict) else None
        binding_errors, review_mode = current_handoff_review_binding(
            workspace, package, resolved_package, review_index,
            metadata_sha256=metadata_sha256 if isinstance(metadata_sha256, str) else None,
            visual_manifest_sha256=visual_manifest_sha256 if isinstance(visual_manifest_sha256, str) else None,
            visual_payload_sha256=visual_payload_sha256,
            visual_payload_markdown_sha256=visual_payload_markdown_sha256,
            evidence_pack_sha256=evidence_pack_sha256 if isinstance(evidence_pack_sha256, str) else None,
            article_id=article_id, reviewer_agent_id=registered_reviewer_id,
        )
        errors.extend(binding_errors)
        provenance = manifest.get("review_provenance")
        if not isinstance(provenance, dict):
            errors.append("current handoff requires review_provenance")
        elif review_mode == "AUTHOR_QA_COVERS_FINAL_PAYLOAD":
            if provenance.get("source") != "reviews/review-index.json#/latest_author_qa" or provenance.get("mode") != review_mode:
                errors.append("current handoff review_provenance is invalid")
        elif review_mode == "FULL_REVIEW_COVERS_FINAL_PAYLOAD":
            if provenance.get("source") != "reviews/review-index.json#/latest_full_review" or provenance.get("mode") != review_mode:
                errors.append("current handoff review_provenance is invalid")
        elif review_mode in {"POST_FULL_REVIEW_VISUAL_DELTA", "POST_FULL_REVIEW_TARGETED_DELTA"}:
            if provenance.get("source") != "reviews/review-index.json#/last_delta" or provenance.get("mode") != review_mode:
                errors.append("current handoff review_provenance is invalid")
        else:
            errors.append("current handoff review_provenance is invalid")
    gate_input = manifest.get("gate_input")
    if not isinstance(gate_input, dict):
        errors.append("handoff manifest requires gate_input")
    else:
        trace_path, trace_error = workspace_file(article_root, gate_input.get("requirements_traceability_path"), label="handoff manifest requirements traceability")
        if trace_error:
            errors.append(trace_error)
        elif trace_path is not None and gate_input.get("requirements_traceability_sha256") != sha256_file(trace_path):
            errors.append("handoff manifest requirements traceability sha256 does not match")
        if gate_input.get("gate_mode") != "MANIFEST_HASH_AND_REQUIREMENTS_ONLY":
            errors.append("handoff manifest gate mode is invalid")
    if errors:
        print("HANDOFF_MANIFEST_CHECK_FAILED\n" + "\n".join(errors))
        return 1
    print("HANDOFF_MANIFEST_CHECK_PASSED")
    return 0


def article_root_mapping_errors(values: list[str]) -> tuple[dict[str, Path], list[str]]:
    """Parse explicit local roots without embedding absolute paths in reports."""
    roots: dict[str, Path] = {}
    errors: list[str] = []
    for value in values:
        article_id, separator, raw_path = value.partition("=")
        article_id = article_id.strip()
        raw_path = raw_path.strip()
        if not separator or not article_id or not raw_path:
            errors.append("--article-root must use ARTICLE_ID=/absolute/or/relative/path")
            continue
        if article_id in roots:
            errors.append(f"duplicate --article-root for {article_id}")
            continue
        root = Path(raw_path).expanduser().resolve()
        if not root.is_dir():
            errors.append(f"article root for {article_id} is not a directory: {root}")
            continue
        roots[article_id] = root
    return roots, errors


def batch_article_root(
    workspace: Path, cfg: dict, state_record: dict, article_id: str, explicit_roots: dict[str, Path],
) -> tuple[Path | None, str | None]:
    """Resolve a batch row's root without making every normal row a worktree."""
    explicit = explicit_roots.get(article_id)
    if not uses_main_session_path_isolation(cfg):
        if explicit is None:
            return None, f"requires --article-root {article_id}=..."
        return explicit, None
    orchestration = state_record.get("orchestration")
    records = orchestration.get("article_workspaces") if isinstance(orchestration, dict) else {}
    record = records.get(article_id) if isinstance(records, dict) else None
    isolation = record.get("isolation") if isinstance(record, dict) else MAIN_SESSION_PATH_ISOLATION
    if isolation == GIT_WORKTREE_ISOLATION:
        if explicit is None:
            return None, f"GIT_WORKTREE article requires --article-root {article_id}=..."
        return explicit, None
    try:
        expected = workspace / article_artifact_root_relative(cfg, article_id)
    except ValueError as exc:
        return None, str(exc)
    if explicit is not None and explicit.resolve() != expected.resolve():
        return None, f"main-session article root must be {relative_path(workspace, expected)}; use --article-root only for GIT_WORKTREE"
    return expected, None


def batch_row_artifact_errors(article_root: Path, row: dict, *, key: str, prefix: str) -> tuple[Path | None, list[str]]:
    record = row.get(key)
    if not isinstance(record, dict):
        return None, [f"{prefix}: requires {key}"]
    path, path_error = workspace_file(article_root, record.get("path"), label=f"{prefix} {key}")
    if path_error:
        return None, [path_error]
    assert path is not None
    errors: list[str] = []
    if record.get("sha256") != sha256_file(path):
        errors.append(f"{prefix}: {key} sha256 does not match")
    return path, errors


def check_batch_gate(workspace: Path, report_path: Path, article_root_values: list[str]) -> int:
    """Check G's compact multi-article contract-acceptance receipt.

    This deliberately checks only frozen declarations, approved R receipts and
    hashes. It never scores prose or opens a second editorial review.
    """
    errors: list[str] = []
    try:
        cfg = json.loads((workspace / "campaign.json").read_text(encoding="utf-8"))
        state_record = json.loads((workspace / "state.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"BATCH_GATE_CHECK_FAILED\ninvalid controller JSON: {exc}")
        return 1
    if not schema_at_least(cfg.get("schema_version"), 2, 7):
        print("BATCH_GATE_CHECK_SKIPPED_LEGACY_SCHEMA")
        return 0
    current_human_release = schema_at_least(cfg.get("schema_version"), 2, 9)
    if current_human_release:
        errors.extend(human_native_release_policy_errors(cfg))
    orchestration = cfg.get("orchestration_policy")
    if not isinstance(orchestration, dict):
        errors.append("campaign requires orchestration_policy")
    else:
        errors.extend(batch_gate_policy_errors(
            orchestration.get("batch_gate_policy"),
            expected=GATE_BATCH_POLICY_2_14 if schema_2_14_or_newer(cfg) else GATE_BATCH_POLICY_2_7,
        ))
    report_resolved = report_path if report_path.is_absolute() else workspace / report_path
    report, report_error = json_object_file(report_resolved, label="batch gate report")
    if report_error or report is None:
        errors.append(report_error or "batch gate report is invalid")
    roots, root_errors = article_root_mapping_errors(article_root_values)
    errors.extend(root_errors)
    if errors or report is None:
        print("BATCH_GATE_CHECK_FAILED\n" + "\n".join(errors))
        return 1
    if report.get("schema_version") != "1.0":
        errors.append("batch gate report schema_version must be 1.0")
    if report.get("campaign_id") != cfg.get("campaign_id"):
        errors.append("batch gate report campaign_id does not match")
    if report.get("workflow_stage") != "BATCH_GATE_ACCEPTANCE":
        errors.append("batch gate report workflow_stage must be BATCH_GATE_ACCEPTANCE")
    state_orchestration = state_record.get("orchestration")
    registered_g = state_orchestration.get("campaign_gatekeeper_agent_id") if isinstance(state_orchestration, dict) else None
    if not non_empty_string(registered_g):
        errors.append("batch gate requires state orchestration campaign_gatekeeper_agent_id")
    elif report.get("gatekeeper_agent_id") != registered_g:
        errors.append("batch gate report must use the registered campaign gatekeeper")
    batch_scope = report.get("batch_scope")
    rows = report.get("rows")
    if not isinstance(batch_scope, dict) or not isinstance(rows, list) or not rows:
        errors.append("batch gate report requires a non-empty batch_scope and rows")
        rows = []
    scope_ids = batch_scope.get("article_ids") if isinstance(batch_scope, dict) else None
    row_ids = [row.get("article_id") for row in rows if isinstance(row, dict)]
    if not isinstance(scope_ids, list) or not scope_ids or not all(non_empty_string(value) for value in scope_ids) or len(set(scope_ids)) != len(scope_ids):
        errors.append("batch gate scope article_ids must be unique and non-empty")
    elif set(scope_ids) != set(row_ids) or len(row_ids) != len(rows) or len(set(row_ids)) != len(row_ids):
        errors.append("batch gate scope article_ids must exactly match unique report rows")
    configured = {
        str(article.get("article_id", "")).strip(): article
        for article in cfg.get("articles", []) if isinstance(article, dict) and non_empty_string(article.get("article_id"))
    }
    if isinstance(scope_ids, list):
        unknown = set(scope_ids) - set(configured)
        if unknown:
            errors.append("batch gate scope contains unconfigured article IDs: " + ", ".join(sorted(unknown)))
    prewrite = state_record.get("prewrite_plan")
    if isinstance(batch_scope, dict):
        expected_confirmation = prewrite.get("owner_confirmation_id") if isinstance(prewrite, dict) else None
        if batch_scope.get("prewrite_confirmation_id") != expected_confirmation:
            errors.append("batch gate report prewrite confirmation ID does not match state")
        requirements_path = workspace / "requirements-contract.md"
        if not requirements_path.is_file() or batch_scope.get("requirements_contract_sha256") != sha256_file(requirements_path):
            errors.append("batch gate report requirements contract hash does not match")
    ready_count = 0
    changes_count = 0
    for row in rows:
        if not isinstance(row, dict):
            errors.append("batch gate row must be an object")
            continue
        article_id = row.get("article_id")
        prefix = f"batch gate article {article_id or '<unknown>'}"
        if article_id not in configured:
            continue
        if row.get("status") not in {"HUMAN_RELEASE_READY", "CHANGES_REQUIRED"}:
            errors.append(f"{prefix}: status must be HUMAN_RELEASE_READY or CHANGES_REQUIRED")
        elif row.get("status") == "HUMAN_RELEASE_READY":
            ready_count += 1
        else:
            changes_count += 1
        article_root, article_root_error = batch_article_root(
            workspace, cfg, state_record, article_id, roots,
        )
        if article_root_error or article_root is None:
            errors.append(f"{prefix}: {article_root_error or 'article root is unavailable'}")
            continue
        context_path, context_errors = batch_row_artifact_errors(article_root, row, key="article_contract", prefix=prefix)
        index_path, index_errors = batch_row_artifact_errors(article_root, row, key="review_index", prefix=prefix)
        package_path, package_errors = batch_row_artifact_errors(article_root, row, key="article_package", prefix=prefix)
        _, handoff_errors = batch_row_artifact_errors(article_root, row, key="handoff_manifest", prefix=prefix)
        _, trace_errors = batch_row_artifact_errors(article_root, row, key="requirements_traceability", prefix=prefix)
        errors.extend(context_errors + index_errors + package_errors + handoff_errors + trace_errors)
        if context_path is not None:
            context, context_error = json_object_file(context_path, label=f"{prefix} article contract")
            if context_error or context is None or context.get("article_id") != article_id:
                errors.append(f"{prefix}: article contract does not bind the article ID")
            else:
                errors.extend(f"{prefix}: {error}" for error in article_context_errors(workspace, context_path))
            if context_error or context is None:
                context = None
            if context is not None and current_human_release:
                expected_assignment, expected_locale_row, mapping_errors = human_native_release_mapping_for_article(
                    workspace, cfg, article_id,
                )
                errors.extend(f"{prefix}: {error}" for error in mapping_errors)
                if expected_assignment is not None and context.get("platform_assignment") != expected_assignment:
                    errors.append(f"{prefix}: article contract platform_assignment does not match the owner-confirmed release mapping")
                if expected_locale_row is not None and context.get("locale_platform_validation") != expected_locale_row:
                    errors.append(f"{prefix}: article contract locale_platform_validation does not match the owner-confirmed release mapping")
        review_index: dict | None = None
        if index_path is not None:
            errors.extend(f"{prefix}: {error}" for error in review_index_errors(workspace, index_path, require_full_approved=True))
            review_index, index_error = json_object_file(index_path, label=f"{prefix} review index")
            if index_error or review_index is None or review_index.get("article_id") != article_id:
                errors.append(f"{prefix}: review index does not bind the article ID")
        if package_path is not None:
            package, package_error = json_object_file(package_path, label=f"{prefix} article package")
            if package_error or package is None:
                errors.append(package_error or f"{prefix}: article package is invalid")
            else:
                errors.extend(f"{prefix}: {error}" for error in article_package_declaration_errors(
                    configured[article_id], package, required_cta=True,
                    package_schema=OPTIMIZED_ARTICLE_PACKAGE_SCHEMAS,
                ))
                errors.extend(f"{prefix}: {error}" for error in package_artifact_source_errors(package))
        effort = review_index.get("review_effort") if isinstance(review_index, dict) else None
        uses_new_quality_receipt = (
            schema_2_14_or_newer(cfg)
            and isinstance(effort, dict)
            and effort.get("tier") in {"AUTHOR_QA_INTEGRATED", "INDEPENDENT_R_ESCALATION"}
        )
        errors.extend(quality_receipt_row_errors(
            row, review_index,
            require_generic_receipt=uses_new_quality_receipt,
            prefix=prefix,
        ))
        finding_ids = row.get("requirement_finding_ids")
        if not isinstance(finding_ids, list) or any(not non_empty_string(value) for value in finding_ids):
            errors.append(f"{prefix}: requirement_finding_ids must be a list of non-empty IDs")
    expected_aggregate = "READY" if ready_count == len(rows) else "CHANGES_REQUIRED" if changes_count == len(rows) else "PARTIAL_READY"
    if report.get("aggregate_status") != expected_aggregate:
        errors.append(f"batch gate report aggregate_status must be {expected_aggregate}")
    if isinstance(state_orchestration, dict):
        tasks = state_orchestration.get("tasks")
        try:
            report_reference = relative_path(workspace, report_resolved)
        except ValueError:
            report_reference = None
            errors.append("batch gate report must stay inside the campaign controller workspace")
        matching_tasks = [
            task for task in tasks if isinstance(task, dict)
            and task.get("role") == CAMPAIGN_GATEKEEPER_ROLE
            and task.get("agent_id") == registered_g
            and task.get("workflow_stage") == "BATCH_GATE_ACCEPTANCE"
            and task.get("result_path") == report_reference
            and task.get("status") == "COMPLETED"
            and isinstance(task.get("article_ids"), list)
            and isinstance(scope_ids, list) and set(task.get("article_ids")) == set(scope_ids)
        ] if isinstance(tasks, list) else []
        if len(matching_tasks) != 1:
            errors.append("batch gate requires exactly one visible campaign-G task with the matching article IDs")
    if errors:
        print("BATCH_GATE_CHECK_FAILED\n" + "\n".join(errors))
        return 1
    print("BATCH_GATE_CHECK_PASSED")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(); sub = parser.add_subparsers(dest="command", required=True)
    p_init = sub.add_parser("init"); p_init.add_argument("--workspace", type=Path, required=True); p_init.add_argument("--campaign-id", required=True)
    p_check = sub.add_parser("check"); p_check.add_argument("--workspace", type=Path, required=True)
    p_sync = sub.add_parser("sync-prewrite-plan"); p_sync.add_argument("--workspace", type=Path, required=True)
    p_confirm = sub.add_parser("confirm-prewrite-plan"); p_confirm.add_argument("--workspace", type=Path, required=True); p_confirm.add_argument("--confirmation-id", required=True); p_confirm.add_argument("--receipt-file", type=Path, required=True); p_confirm.add_argument("--receipt-type", choices=sorted(OWNER_CONFIRMATION_RECEIPT_TYPES), required=True); p_confirm.add_argument("--source-locator", required=True)
    p_invalidate = sub.add_parser("invalidate-prewrite-confirmation"); p_invalidate.add_argument("--workspace", type=Path, required=True); p_invalidate.add_argument("--reason", required=True)
    p_dispatch = sub.add_parser("dispatch-readiness"); p_dispatch.add_argument("--workspace", type=Path, required=True)
    p_render = sub.add_parser("render-prewrite-plan"); p_render.add_argument("--manifest", type=Path, required=True); p_render.add_argument("--output", type=Path, required=True)
    p_context = sub.add_parser("build-article-context"); p_context.add_argument("--workspace", type=Path, required=True, help="campaign root; current main-session schemas write each article below articles/<article_id>/"); p_context.add_argument("--article-id", required=True); p_context.add_argument("--output", type=Path, required=True)
    p_context_check = sub.add_parser("check-article-context"); p_context_check.add_argument("--workspace", type=Path, required=True); p_context_check.add_argument("--context", type=Path, required=True)
    p_index = sub.add_parser("build-review-index"); p_index.add_argument("--workspace", type=Path, required=True); p_index.add_argument("--article-contract", type=Path, required=True); p_index.add_argument("--output", type=Path, required=True); p_index.add_argument("--canonical", type=Path)
    p_index_check = sub.add_parser("check-review-index"); p_index_check.add_argument("--workspace", type=Path, required=True); p_index_check.add_argument("--index", type=Path, required=True)
    p_delta = sub.add_parser("check-review-delta"); p_delta.add_argument("--workspace", type=Path, required=True); p_delta.add_argument("--delta", type=Path, required=True)
    p_package = sub.add_parser("check-article-package"); p_package.add_argument("--workspace", type=Path, required=True); p_package.add_argument("--package", type=Path, required=True)
    p_review_ready = sub.add_parser("check-review-ready"); p_review_ready.add_argument("--workspace", type=Path, required=True); p_review_ready.add_argument("--article-contract", type=Path, required=True); p_review_ready.add_argument("--review-index", type=Path, required=True); p_review_ready.add_argument("--article-package", type=Path, required=True)
    p_efficiency = sub.add_parser("summarize-efficiency"); p_efficiency.add_argument("--workspace", type=Path, required=True); p_efficiency.add_argument("--output", type=Path)
    p_return = sub.add_parser("check-public-return-receipt"); p_return.add_argument("--workspace", type=Path, required=True); p_return.add_argument("--receipt", type=Path, required=True); p_return.add_argument("--article-package", type=Path, required=True)
    p_handoff = sub.add_parser("check-handoff-manifest"); p_handoff.add_argument("--workspace", type=Path, required=True); p_handoff.add_argument("--manifest", type=Path, required=True); p_handoff.add_argument("--article-package", type=Path, required=True)
    p_batch_gate = sub.add_parser("check-batch-gate"); p_batch_gate.add_argument("--workspace", type=Path, required=True); p_batch_gate.add_argument("--report", type=Path, required=True); p_batch_gate.add_argument("--article-root", action="append", default=[])
    args = parser.parse_args()
    if args.command == "init":
        return init(args.workspace, args.campaign_id)
    if args.command == "check":
        return check(args.workspace)
    if args.command == "sync-prewrite-plan":
        return sync_prewrite_plan(args.workspace)
    if args.command == "confirm-prewrite-plan":
        receipt_file = args.receipt_file if args.receipt_file.is_absolute() else args.workspace / args.receipt_file
        return confirm_prewrite_plan(args.workspace, args.confirmation_id, receipt_file, args.receipt_type, args.source_locator)
    if args.command == "invalidate-prewrite-confirmation":
        return invalidate_prewrite_confirmation(args.workspace, args.reason)
    if args.command == "dispatch-readiness":
        return dispatch_readiness(args.workspace)
    if args.command == "render-prewrite-plan":
        return render_prewrite_plan(args.manifest, args.output)
    if args.command == "build-article-context":
        output = args.output if args.output.is_absolute() else args.workspace / args.output
        return build_article_context(args.workspace, args.article_id, output)
    if args.command == "check-article-context":
        context = args.context if args.context.is_absolute() else args.workspace / args.context
        return check_article_context(args.workspace, context)
    if args.command == "build-review-index":
        context = args.article_contract if args.article_contract.is_absolute() else args.workspace / args.article_contract
        output = args.output if args.output.is_absolute() else args.workspace / args.output
        canonical = args.canonical if args.canonical is None or args.canonical.is_absolute() else args.workspace / args.canonical
        return build_review_index(args.workspace, context, output, canonical)
    if args.command == "check-review-index":
        index = args.index if args.index.is_absolute() else args.workspace / args.index
        return check_review_index(args.workspace, index)
    if args.command == "check-review-delta":
        delta = args.delta if args.delta.is_absolute() else args.workspace / args.delta
        return check_review_delta(args.workspace, delta)
    if args.command == "check-article-package":
        return check_article_package(args.workspace, args.package)
    if args.command == "check-review-ready":
        context = args.article_contract if args.article_contract.is_absolute() else args.workspace / args.article_contract
        index = args.review_index if args.review_index.is_absolute() else args.workspace / args.review_index
        package = args.article_package if args.article_package.is_absolute() else args.workspace / args.article_package
        return check_review_ready(args.workspace, context, index, package)
    if args.command == "summarize-efficiency":
        output = args.output if args.output is None or args.output.is_absolute() else args.workspace / args.output
        return summarize_efficiency(args.workspace, output)
    if args.command == "check-public-return-receipt":
        return check_public_return_receipt(args.workspace, args.receipt, args.article_package)
    if args.command == "check-batch-gate":
        report = args.report if args.report.is_absolute() else args.workspace / args.report
        return check_batch_gate(args.workspace, report, args.article_root)
    return check_handoff_manifest(args.workspace, args.manifest, args.article_package)


if __name__ == "__main__":
    raise SystemExit(main())
