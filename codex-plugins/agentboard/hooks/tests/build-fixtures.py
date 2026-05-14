#!/usr/bin/env python3
"""Build synthetic test fixtures for the architecture-pipeline hook scripts.

Writes one JSON file per fixture into ./fixtures/. Each fixture's content
mirrors the `tool_input` object that Claude Code passes to the hook for an
`agentboard_submit_workspace_artifact` call. The validation script's stdin
contract reads `{tool_input: <obj>}` OR the obj directly; we emit the obj
directly here.

Fixtures (minimum per plan §11 acceptance criterion 10):
  - 1 valid + 1 invalid for each of 4 artifact types  (8 fixtures)
  - 1 valid architecture document at each level       (3 fixtures: L1, L2, L3)
  - 1 non-architecture artifact (planning_artifact)    (1 fixture)

Plus negative-control fixtures targeting specific rule failures so the
test runner can verify the rule IDs in stderr.
"""

import json
import os
import sys
from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
FIXTURES_DIR.mkdir(parents=True, exist_ok=True)


def write(name: str, tool_input: dict) -> None:
    path = FIXTURES_DIR / f"{name}.json"
    path.write_text(json.dumps(tool_input, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Bundle helpers
# ---------------------------------------------------------------------------

def make_valid_classification_block(level: int) -> dict:
    """Classification fields that drive a particular computed_level under v1.0.

    L3: external_system_count=1 (fires R-L3-EXT)
    L2: new_contracts_count=1   (fires R-L2-NEW-CONTRACTS)
    L1: all triggers inactive
    """
    if level == 3:
        nc, em, tb, mig, ext, low, up, cpl, sec = 1, 0, False, False, 1, 1, 3, False, 0
    elif level == 2:
        nc, em, tb, mig, ext, low, up, cpl, sec = 1, 0, False, False, 0, 1, 3, False, 0
    else:
        nc, em, tb, mig, ext, low, up, cpl, sec = 0, 0, False, False, 0, 1, 2, False, 0

    return {
        "new_contracts_count": {
            "value": nc,
            "evidence": (
                [{"contract_name": "FooEvent", "spec_quote": "x", "spec_location": "§3"}]
                if nc > 0 else []
            ),
        },
        "existing_contracts_modified_count": {"value": em, "evidence": []},
        "trust_boundaries_introduced": {"value": tb, "evidence": []},
        "migration_signals_present": {"value": mig, "evidence": []},
        "external_system_count": {
            "value": ext,
            "evidence": (
                [{"system": "Stripe", "spec_quote": "x", "kind": "payment"}]
                if ext > 0 else []
            ),
        },
        "expected_card_count_band": {
            "lower": low,
            "upper": up,
            "evidence": [{"reasoning": "test fixture"}],
        },
        "coupling_hotspot_overlap": {"value": cpl, "evidence": []},
        "security_relevant_keyword_hits": {"value": sec, "evidence": []},
    }


def make_valid_design_fields() -> dict:
    return {
        "files_relevant": [
            {"path": "src/foo.py", "role": "candidate-new", "exists": False, "reason": "spec §3"}
        ],
        "dependency_edges": [],
        "blast_radius": {"for_candidate_modified_set": []},
        "existing_patterns_hits": [],
        "constraint_hits": [],
        "external_libraries": [],
        "open_questions": [],
    }


def fired_rules(level: int) -> list:
    if level == 3:
        return ["R-L3-EXT"]
    if level == 2:
        return ["R-L2-NEW-CONTRACTS"]
    return []


def make_valid_bundle(level: int = 2) -> dict:
    return {
        "schema_version": "2.0",
        "rules_version": "1.0",
        "spec_path": "docs/specs/synthetic.md",
        "spec_hash": "deadbeef",
        "classification_fields": make_valid_classification_block(level),
        "design_fields": make_valid_design_fields(),
        "rule_evaluation": {
            "rules_fired": fired_rules(level),
            "computed_level": level,
            "reasoning": "synthetic test fixture",
        },
        "agent_metadata": {
            "agent_id": "test-agent",
            "model": "claude-haiku-4-5-20251001",
            "timestamp_iso": "2026-05-14T00:00:00Z",
        },
    }


def bundle_artifact_content(bundle: dict) -> str:
    return "ARCH_FACTS_BUNDLE_V2\n" + json.dumps(bundle, indent=2)


# ---------------------------------------------------------------------------
# Audit helpers
# ---------------------------------------------------------------------------

ALL_VERDICT_FIELDS = [
    "new_contracts_count",
    "existing_contracts_modified_count",
    "trust_boundaries_introduced",
    "migration_signals_present",
    "external_system_count",
    "expected_card_count_band",
    "coupling_hotspot_overlap",
    "security_relevant_keyword_hits",
    "files_relevant",
    "dependency_edges",
    "blast_radius",
    "existing_patterns_hits",
    "constraint_hits",
    "external_libraries",
    "open_questions",
]


def make_valid_audit(verified_level: int = 2, with_discrepancy: bool = False) -> dict:
    audit = {
        "schema_version": "2.0",
        "rules_version": "1.0",
        "spec_path": "docs/specs/synthetic.md",
        "audited_bundle_artifact_id": "artifact-123",
        "version_validation": {
            "schema_version_match": True,
            "rules_version_match": True,
            "spec_path_match": True,
            "spec_hash_match": True,
        },
        "field_verdicts": {
            k: {"verdict": "PASS", "method": "test-method", "details": "ok"}
            for k in ALL_VERDICT_FIELDS
        },
        "any_discrepancy": with_discrepancy,
        "corrected_bundle": make_valid_bundle(verified_level) if with_discrepancy else None,
        "recomputed_level": verified_level if with_discrepancy else None,
        "verified_level": verified_level,
        "agent_metadata": {
            "agent_id": "test-auditor",
            "model": "claude-sonnet-4-6",
            "extended_thinking": True,
            "timestamp_iso": "2026-05-14T00:00:00Z",
        },
    }
    return audit


def audit_artifact_content(audit: dict) -> str:
    return "ARCH_BUNDLE_AUDIT_V2\n" + json.dumps(audit, indent=2)


# ---------------------------------------------------------------------------
# Design review helpers
# ---------------------------------------------------------------------------

def make_valid_review(findings: list = None) -> dict:
    findings = findings or []
    blocker = sum(1 for f in findings if f["severity"] == "blocker")
    serious = sum(1 for f in findings if f["severity"] == "serious")
    minor = sum(1 for f in findings if f["severity"] == "minor")
    return {
        "schema_version": "1.0",
        "spec_path": "docs/specs/synthetic.md",
        "architecture_document_path": "docs/arch/synthetic.md",
        "architecture_document_artifact_id": "artifact-doc",
        "verified_bundle_artifact_id": "artifact-bundle",
        "findings": findings,
        "summary": {
            "blocker_count": blocker,
            "serious_count": serious,
            "minor_count": minor,
        },
        "agent_metadata": {
            "agent_id": "test-reviewer",
            "model": "claude-sonnet-4-6",
            "extended_thinking": True,
            "timestamp_iso": "2026-05-14T00:00:00Z",
        },
    }


def review_artifact_content(review: dict) -> str:
    return "ARCH_DESIGN_REVIEW_V1\n" + json.dumps(review, indent=2)


# ---------------------------------------------------------------------------
# Architecture-document fixtures
# ---------------------------------------------------------------------------

def slice_block(
    title: str,
    description: str,
    allowed: list,
    forbidden: list = None,
    produces: list = None,
    consumes: list = None,
    verification: str = "local-only",
    depends_on: list = None,
    source_decisions: str = "D1",
) -> str:
    forbidden = forbidden or ["None"]
    produces = produces or ["None"]
    consumes = consumes or ["None"]
    depends_on = depends_on or ["None"]
    return (
        f"### {title}\n"
        f"- **Description**: {description}\n"
        f"- **Allowed-touch**: {', '.join(allowed)}\n"
        f"- **Forbidden-touch**: {', '.join(forbidden)}\n"
        f"- **Produces**: {', '.join(produces)}\n"
        f"- **Consumes**: {', '.join(consumes)}\n"
        f"- **Verification scope**: {verification}\n"
        f"- **Depends on**: {', '.join(depends_on)}\n"
        f"- **Source decisions**: {source_decisions}\n"
    )


def doc_l1(extra_section: bool = False) -> str:
    slices = slice_block(
        title="Add foo utility",
        description="Create the foo helper module.",
        allowed=["src/foo.py"],
        source_decisions="Direct from spec — R1 (no design decisions at this level)",
    )
    return (
        "# Architecture — Synthetic L1\n\n"
        "## Goal — what this architecture serves\n"
        "Synthetic L1 fixture.\n\n"
        "## Scope (in / out)\n"
        "In: foo utility. Out: bar.\n\n"
        "_At L1, the slice Descriptions and Allowed-touch lists carry the component-level content._\n\n"
        "## Card Slices (populated)\n"
        f"{slices}\n"
        "## Limitations\n"
        "Minimal.\n\n"
        "## Standards governing this architecture\n"
        "Inherited from spec.\n\n"
        "## Status of this architecture\n"
        "Draft.\n\n"
        "**Level:** L1\n"
    )


def doc_l2(missing_d_ref: bool = False) -> str:
    src_dec = "D2" if missing_d_ref else "D1"
    slices = (
        slice_block(
            title="Producer slice",
            description="Produces FooEvent.",
            allowed=["src/producer.py"],
            produces=["FooEvent (consumed by Consumer slice)"],
            verification="contributes to verification card V1",
            source_decisions="D1",
        )
        + "\n"
        + slice_block(
            title="Consumer slice",
            description="Consumes FooEvent and persists it.",
            allowed=["src/consumer.py"],
            consumes=["FooEvent (produced by Producer slice)"],
            verification="contributes to verification card V1",
            depends_on=["Producer slice"],
            source_decisions=src_dec,
        )
    )
    return (
        "# Architecture — Synthetic L2\n\n"
        "## Goal — what this architecture serves\n"
        "Synthetic L2 fixture.\n\n"
        "## Scope (in / deferred / out)\n"
        "In: foo. Deferred: bar. Out: baz.\n\n"
        "## Components and structure\n"
        "Two components communicate via FooEvent.\n\n"
        "## Design decisions\n"
        "### D1: Use event-based decoupling\n"
        "Reasoning: explicit contract via FooEvent.\n\n"
        "## Card Slices\n"
        f"{slices}\n"
        "## Traceability matrix\n"
        "| R# | Decision |\n"
        "|----|----------|\n"
        "| R1 | D1 |\n\n"
        "## Limitations and trade-offs\n"
        "Synthetic.\n\n"
        "## Standards governing this architecture\n"
        "SOLID.\n\n"
        "## Status of this architecture\n"
        "Draft.\n\n"
        "**Level:** L2\n"
    )


def doc_l3() -> str:
    slices = (
        slice_block(
            title="API gateway slice",
            description="Front-door HTTP gateway.",
            allowed=["src/gateway.py"],
            produces=["RequestEnvelope (consumed by Service slice)"],
            verification="owns end-to-end verification",
            source_decisions="D1",
        )
        + "\n"
        + slice_block(
            title="Service slice",
            description="Domain service handling requests.",
            allowed=["src/service.py"],
            consumes=["RequestEnvelope (produced by API gateway slice)"],
            verification="contributes to API gateway slice",
            depends_on=["API gateway slice"],
            source_decisions="D2",
        )
    )
    return (
        "# Architecture — Synthetic L3\n\n"
        "## Goal — what this architecture serves\n"
        "Synthetic L3 fixture.\n\n"
        "## Scope (in / deferred / out)\n"
        "In: gateway + service. Deferred: nothing. Out: storage layer.\n\n"
        "## Components and structure\n"
        "Two-component split.\n\n"
        "## Quality characteristics addressed (ISO/IEC 25010:2023)\n"
        "Reliability, Maintainability.\n\n"
        "## Design decisions\n"
        "### D1: Adopt gateway pattern\n"
        "Reasoning.\n\n"
        "### D2: Domain service owns business logic\n"
        "Reasoning.\n\n"
        "## Card Slices\n"
        f"{slices}\n"
        "## Traceability matrix\n"
        "| R# | Decision |\n"
        "|----|----------|\n"
        "| R1 | D1, D2 |\n\n"
        "## Limitations and trade-offs\n"
        "Synthetic.\n\n"
        "## Standards governing this architecture\n"
        "SOLID, ISO 25010.\n\n"
        "## Status of this architecture\n"
        "Draft.\n\n"
        "**Level:** L3\n"
    )


# ---------------------------------------------------------------------------
# Write fixtures
# ---------------------------------------------------------------------------

def emit(name: str, artifact_type: str, content: str) -> None:
    write(name, {"artifact_type": artifact_type, "content": content})


# --- architecture_document fixtures
emit("doc_l1_valid", "architecture_document", doc_l1())
emit("doc_l2_valid", "architecture_document", doc_l2())
emit("doc_l3_valid", "architecture_document", doc_l3())

# L2 doc with a slice referencing D2 that isn't defined in Design decisions
# (R-DOC-6 should fire).
emit(
    "doc_l2_invalid_missing_d_ref",
    "architecture_document",
    doc_l2(missing_d_ref=True),
)

# L1 doc missing the level marker entirely (R-DOC-1 should fire).
no_marker = doc_l1().replace("**Level:** L1\n", "Status note without marker.\n")
emit("doc_l1_invalid_no_level_marker", "architecture_document", no_marker)

# L2 doc with empty Card Slices section (R-DOC-3 should fire).
empty_slices = (
    "# Architecture — Synthetic L2 empty\n\n"
    "## Goal — what this architecture serves\nx\n\n"
    "## Scope (in / deferred / out)\nx\n\n"
    "## Components and structure\nx\n\n"
    "## Design decisions\n### D1: Foo\ny\n\n"
    "## Card Slices\n\n"
    "## Traceability matrix\n| R# | Decision |\n|----|----------|\n| R1 | D1 |\n\n"
    "## Limitations and trade-offs\nx\n\n"
    "## Standards governing this architecture\nx\n\n"
    "## Status of this architecture\nx\n\n"
    "**Level:** L2\n"
)
emit("doc_l2_invalid_empty_slices", "architecture_document", empty_slices)

# L2 doc with a slice missing required field labels (R-DOC-4 should fire).
broken_slice_doc = (
    "# Architecture — Synthetic L2 broken slice\n\n"
    "## Goal — what this architecture serves\nx\n\n"
    "## Scope (in / deferred / out)\nx\n\n"
    "## Components and structure\nx\n\n"
    "## Design decisions\n### D1: Foo\ny\n\n"
    "## Card Slices\n"
    "### Half-formed slice\n"
    "- **Description**: missing required fields\n"
    "- **Allowed-touch**: src/foo.py\n\n"
    "## Traceability matrix\n| R# | Decision |\n|----|----------|\n| R1 | D1 |\n\n"
    "## Limitations and trade-offs\nx\n\n"
    "## Standards governing this architecture\nx\n\n"
    "## Status of this architecture\nx\n\n"
    "**Level:** L2\n"
)
emit("doc_l2_invalid_broken_slice_fields", "architecture_document", broken_slice_doc)

# --- ARCH_FACTS_BUNDLE_V2 fixtures
emit("bundle_valid_l2", "general", bundle_artifact_content(make_valid_bundle(2)))

# Invalid: declared level disagrees with what rules would derive
# (computed_level=3 but classification block matches L2 conditions).
mismatched_bundle = make_valid_bundle(2)
mismatched_bundle["rule_evaluation"]["computed_level"] = 3
emit("bundle_invalid_level_mismatch", "general", bundle_artifact_content(mismatched_bundle))

# Invalid: malformed JSON (sentinel line then garbage).
emit(
    "bundle_invalid_malformed_json",
    "general",
    "ARCH_FACTS_BUNDLE_V2\n{not valid json,,,",
)

# --- ARCH_BUNDLE_AUDIT_V2 fixtures
emit("audit_valid_no_discrepancy", "general", audit_artifact_content(make_valid_audit(2, False)))
emit(
    "audit_valid_with_discrepancy",
    "general",
    audit_artifact_content(make_valid_audit(3, True)),
)

# Invalid: missing verdict entries for several required fields.
broken_audit = make_valid_audit(2, False)
for k in ["files_relevant", "dependency_edges", "blast_radius"]:
    del broken_audit["field_verdicts"][k]
emit(
    "audit_invalid_missing_verdicts",
    "general",
    audit_artifact_content(broken_audit),
)

# Invalid: any_discrepancy=true but no corrected_bundle / recomputed_level.
incoherent_audit = make_valid_audit(2, False)
incoherent_audit["any_discrepancy"] = True
incoherent_audit["corrected_bundle"] = None
incoherent_audit["recomputed_level"] = None
emit(
    "audit_invalid_incoherent_discrepancy",
    "general",
    audit_artifact_content(incoherent_audit),
)

# --- ARCH_DESIGN_REVIEW_V1 fixtures
emit("review_valid_empty_findings", "general", review_artifact_content(make_valid_review()))
emit(
    "review_valid_with_findings",
    "general",
    review_artifact_content(
        make_valid_review(
            [
                {
                    "id": "F1",
                    "severity": "serious",
                    "category": "missing-decision",
                    "summary": "R3 has no decision",
                    "details": "R3 is uncovered.",
                    "document_citation": {
                        "section": "Design decisions",
                        "decision_id_or_slice_name": None,
                        "quoted_text": "(none)",
                    },
                    "suggested_resolution": "Add D3.",
                },
                {
                    "id": "F2",
                    "severity": "minor",
                    "category": "standards-decoration",
                    "summary": "ISO 25010 not used",
                    "details": "Cited but no decision uses it.",
                    "document_citation": {
                        "section": "Standards",
                        "decision_id_or_slice_name": None,
                        "quoted_text": "ISO 25010",
                    },
                    "suggested_resolution": "Remove or link to a decision.",
                },
            ]
        )
    ),
)

# Invalid: summary counts don't match findings.
bad_summary_review = make_valid_review(
    [
        {
            "id": "F1",
            "severity": "blocker",
            "category": "missing-decision",
            "summary": "x",
            "details": "x",
            "document_citation": {"section": "Design decisions"},
            "suggested_resolution": "x",
        }
    ]
)
bad_summary_review["summary"]["blocker_count"] = 0  # wrong
bad_summary_review["summary"]["serious_count"] = 1  # wrong
emit("review_invalid_summary_mismatch", "general", review_artifact_content(bad_summary_review))

# Invalid: a finding with severity outside the allowed set.
bad_severity_review = make_valid_review(
    [
        {
            "id": "F1",
            "severity": "critical",  # not allowed
            "category": "missing-decision",
            "summary": "x",
            "details": "x",
            "document_citation": {"section": "Design decisions"},
            "suggested_resolution": "x",
        }
    ]
)
emit("review_invalid_bad_severity", "general", review_artifact_content(bad_severity_review))

# --- Non-architecture artifact fixture (existing gate should still fire)
emit(
    "non_architecture_with_todo",
    "planning_artifact",
    "Plan for card. TODO: figure out the schema later.\n",
)

emit(
    "non_architecture_clean",
    "planning_artifact",
    "Plan for card. Step 1: edit src/foo.py line 12. Step 2: edit src/bar.py line 7.\n",
)

print(f"Wrote {sum(1 for _ in FIXTURES_DIR.glob('*.json'))} fixtures to {FIXTURES_DIR}")
