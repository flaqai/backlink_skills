"""Shared owner-confirmed human-release mapping for current-schema tests."""
from __future__ import annotations

import json
from pathlib import Path


def configure_confirmed_human_release_map(
    workspace: Path, harness: object, *, campaign_id: str, article: dict,
    confirmation_id: str, platform: str = "ExamplePlatform", account: str = "ACCOUNT-A1",
) -> None:
    """Populate the minimum real evidence chain required by the current schema.

    The fixture deliberately uses a source artifact, visible matching proposal,
    owner receipt, unique assignment and locale proof.  Tests therefore cannot
    accidentally retain a local-only dispatch path.
    """
    source_path = workspace / "evidence/owner-selection/owner-selection.md"
    source_path.parent.mkdir(parents=True, exist_ok=True)
    source_path.write_text(
        f"Owner confirms {platform} / {account} for {article['article_id']}.\n",
        encoding="utf-8",
    )
    proposal_path = workspace / "evidence/platform-matching/platform-matching-proposal.json"
    proposal_path.parent.mkdir(parents=True, exist_ok=True)
    proposal = {
        "schema_version": "1.0",
        "campaign_id": campaign_id,
        "researcher_role": harness.MATCHING_ROLE,
        "status": "RECOMMENDED_PENDING_OWNER_CONFIRMATION",
        "proposals": [{
            "article_id": article["article_id"],
            "language": article["language"],
            "market": article["market"],
            "platform": platform,
            "candidate_source_id": "owner-source-001",
            "candidate_locator": "test owner selection source",
            "rationale": "Test-only in-scope language and format fit.",
            "eligibility_evidence_path": "evidence/platform-matching/A1-eligibility.md",
            "audience_compatibility": {
                "primary_reader_languages": [article["language"]],
                "primary_reader_markets": [article["market"]],
                "primary_audience_evidence_path": "evidence/platform-matching/A1-primary-audience.md",
                "transport_supported_content_languages": [article["language"]],
                "transport_evidence_path": "evidence/platform-matching/A1-transport.md",
                "fit_mode": "PRIMARY_AUDIENCE_MATCH",
                "cross_language_exception_required": False,
            },
            "account_status": "OWNER_CONFIRMATION_REQUIRED",
        }],
    }
    proposal_path.write_text(json.dumps(proposal), encoding="utf-8")
    eligibility_path = workspace / "evidence/platform-matching/A1-eligibility.md"
    eligibility_path.write_text("Test-only compatibility evidence.\n", encoding="utf-8")
    (workspace / "evidence/platform-matching/A1-primary-audience.md").write_text(
        "Test-only primary reader language and market evidence.\n", encoding="utf-8",
    )
    (workspace / "evidence/platform-matching/A1-transport.md").write_text(
        "Test-only transport-language evidence.\n", encoding="utf-8",
    )

    selection_path = workspace / "owner-platform-selection.json"
    selection = {
        "schema_version": "1.0",
        "campaign_id": campaign_id,
        "status": "OWNER_CONFIRMED",
        "matching_proposal": {
            "path": "evidence/platform-matching/platform-matching-proposal.json",
            "sha256": harness.sha256_file(proposal_path),
            "researcher_role": harness.MATCHING_ROLE,
            "task_id": "MATCHING-001",
        },
        "source_artifacts": [{
            "source_id": "owner-source-001",
            "source_type": "OWNER_MESSAGE",
            "path": "evidence/owner-selection/owner-selection.md",
            "sha256": harness.sha256_file(source_path),
        }],
        "pair_receipts": [{
            "article_id": article["article_id"],
            "article_language": article["language"],
            "market": article["market"],
            "platform": platform,
            "account": account,
            "source_id": "owner-source-001",
            "source_locator": "test owner selection source",
            "platform_source_literal": platform,
            "account_confirmation_literal": account,
            "mapping_confirmation_literal": f"{article['language']} / {article['market']} / {platform} / {account}",
            "fit_mode": "PRIMARY_AUDIENCE_MATCH",
            "cross_language_exception_owner_confirmation_id": None,
            "cross_language_exception_literal": None,
            "owner_confirmation_id": confirmation_id,
            "status": "EXPLICITLY_CONFIRMED",
        }],
    }
    selection_path.write_text(json.dumps(selection), encoding="utf-8")

    campaign_path = workspace / "campaign.json"
    campaign = json.loads(campaign_path.read_text(encoding="utf-8"))
    campaign["platform_scope"]["allowed_pairs"] = [{"platform": platform, "account": account}]
    campaign["platform_scope"]["selection_lock"]["sha256"] = harness.sha256_file(selection_path)
    campaign["article_platform_assignment"]["assignments"] = [{
        "article_id": article["article_id"], "platform": platform, "account": account,
    }]
    campaign["locale_platform_validation"]["rows"] = [{
        "article_id": article["article_id"],
        "article_language": article["language"],
        "market": article["market"],
        "platform": platform,
        "account": account,
        "decision": "PRIMARY_AUDIENCE_MATCH",
        "audience_compatibility": {
            "primary_reader_languages": [article["language"]],
            "primary_reader_markets": [article["market"]],
            "primary_audience_evidence_path": "evidence/platform-matching/A1-primary-audience.md",
            "transport_supported_content_languages": [article["language"]],
            "transport_evidence_path": "evidence/platform-matching/A1-transport.md",
            "fit_mode": "PRIMARY_AUDIENCE_MATCH",
            "cross_language_exception_required": False,
        },
    }]
    campaign_path.write_text(json.dumps(campaign), encoding="utf-8")
