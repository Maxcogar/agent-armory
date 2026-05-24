#!/usr/bin/env python3
"""Build synthetic test fixtures for the architecture-pipeline hook scripts.

Writes one JSON file per fixture into ./fixtures/. Each fixture's content
mirrors the `tool_input` object that Claude Code passes to the hook for an
`agentboard_submit_workspace_artifact` call. The validation script's stdin
contract reads `{tool_input: <obj>}` OR the obj directly; we emit the obj
directly here.

These fixtures exercise the CORRECTED hook rules per the reconciled plan §7
(commits 9828344 / 47a1c14). Specifically:

  - Valid architecture documents use the verbatim long-form headings and
    `- **<Label>.**` slice bullets that compose-l1/l2/l3 actually emit
    (e.g. `## Goal — what this architecture serves`,
    `## Standards governing this architecture`,
    `- **Allowed-touch list.**`, `- **Source decisions.**`).
  - Invalid documents exercise: short-form headings (must now FAIL R-DOC-2),
    short-form slice labels (must now FAIL R-DOC-4), bare-`$` level marker on
    CRLF content.
  - Sentinel-bearing artifacts exercise: CRLF-terminated content (must PASS),
    leading UTF-8 BOM (must PASS), wrong sentinel (must FAIL), absent sentinel
    (must FAIL).
  - Audit fixtures exercise: `.any_discrepancy` null / string (must FAIL),
    non-object `.corrected_bundle` (must FAIL).
  - Review fixtures exercise: bad `.id` (F0, F01, duplicate), non-contiguous
    findings IDs, count/sum mismatch, bad severity/category.

Minimum per plan §7 / §11 acceptance criterion: 1 valid + 1 invalid for each
of the 4 artifact types; valid architecture document tested at L1, L2, L3.
This file emits well beyond the minimum so every corrected rule has at least
one passing-valid and one failing-invalid fixture.
"""

import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
FIXTURES_DIR.mkdir(parents=True, exist_ok=True)


def write_bytes(name: str, data: bytes) -> None:
    (FIXTURES_DIR / f"{name}.json").write_bytes(data)


def emit(name: str, artifact_type: str, content: str) -> None:
    obj = {"artifact_type": artifact_type, "content": content}
    write_bytes(name, json.dumps(obj, indent=2).encode("utf-8"))


def emit_raw(name: str, obj: dict) -> None:
    write_bytes(name, json.dumps(obj, indent=2).encode("utf-8"))


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
    return {
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


def audit_artifact_content(audit: dict) -> str:
    return "ARCH_BUNDLE_AUDIT_V2\n" + json.dumps(audit, indent=2)


# ---------------------------------------------------------------------------
# Design review helpers
# ---------------------------------------------------------------------------

def make_finding(idx: int, severity: str, category: str) -> dict:
    return {
        "id": f"F{idx}",
        "severity": severity,
        "category": category,
        "summary": f"Finding {idx} summary.",
        "details": f"Finding {idx} detailed reasoning that is non-empty.",
        "document_citation": {
            "section": "Design decisions",
            "decision_id_or_slice_name": None,
            "quoted_text": "excerpt of the document text",
        },
        "suggested_resolution": "Ask compose to add the missing decision.",
    }


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
        "audit_artifact_id": "artifact-audit",
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
# Architecture-document fixtures — verbatim compose headings + slice bullets
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
    """Render a slice exactly as compose emits it: `- **<Label>.** <value>`
    with the canonical §5 long-form labels."""
    forbidden = forbidden or ["None"]
    produces = produces or ["None"]
    consumes = consumes or ["None"]
    depends_on = depends_on or ["None"]
    return (
        f"### {title}\n"
        f"- **Description.** {description}\n"
        f"- **Allowed-touch list.** {', '.join(allowed)}\n"
        f"- **Forbidden-touch list.** {', '.join(forbidden)}\n"
        f"- **Produces.** {', '.join(produces)}\n"
        f"- **Consumes.** {', '.join(consumes)}\n"
        f"- **Verification scope.** {verification}\n"
        f"- **Depends on.** {', '.join(depends_on)}\n"
        f"- **Source decisions.** {source_decisions}\n"
    )


L1_ATTESTATION = (
    "_At L1, the slice Descriptions and Allowed-touch lists in the Card "
    'Slices section below carry the component-level content; no separate '
    '"Components and structure" or "Design decisions" section is produced. '
    "The slicing IS the architecture at this level._"
)


def doc_l1() -> str:
    slices = slice_block(
        title="Add foo utility",
        description="Create the foo helper module.",
        allowed=["src/foo.py"],
        source_decisions="Direct from spec — R1 (no design decisions at this level)",
    )
    return (
        "# Architecture — Synthetic L1\n\n"
        "## Goal — what this architecture serves\n"
        "Synthetic L1 fixture goal paragraph.\n\n"
        "## Scope (in / out)\n"
        "**In scope:** foo utility. **Out of scope:** bar, with reasoning.\n\n"
        f"{L1_ATTESTATION}\n\n"
        "## Card Slices\n"
        f"{slices}\n"
        "## Limitations\n"
        "No limitations or trade-offs surfaced during this L1 architecture.\n\n"
        "## Standards governing this architecture\n"
        "| Standard | Source | Governed |\n|---|---|---|\n| Inherited | spec | slicing |\n\n"
        "## Status of this architecture\n"
        "Passes the single delivery gate and trap audit.\n\n"
        "**Level:** L1\n"
    )


def doc_l2(missing_d_ref: bool = False) -> str:
    src_dec = "D2" if missing_d_ref else "D1"
    slices = (
        slice_block(
            title="Producer slice",
            description="Produces FooEvent.",
            allowed=["src/producer.py"],
            produces=["FooEvent — consumed by Consumer slice"],
            verification="contributes to verification card V1",
            source_decisions="D1",
        )
        + "\n"
        + slice_block(
            title="Consumer slice",
            description="Consumes FooEvent and persists it.",
            allowed=["src/consumer.py"],
            consumes=["FooEvent — produced by Producer slice"],
            verification="contributes to verification card V1",
            depends_on=["Producer slice"],
            source_decisions=src_dec,
        )
    )
    return (
        "# Architecture — Synthetic L2\n\n"
        "## Goal — what this architecture serves\n"
        "Synthetic L2 fixture goal paragraph.\n\n"
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
        "| Standard | Source | Governed |\n|---|---|---|\n| SOLID | external | decoupling |\n\n"
        "## Status of this architecture\n"
        "Passes Gates A/B/C.\n\n"
        "**Level:** L2\n"
    )


def doc_l3(with_threat: bool = False, with_asvs: bool = True) -> str:
    slices = (
        slice_block(
            title="API gateway slice",
            description="Front-door HTTP gateway.",
            allowed=["src/gateway.py"],
            produces=["RequestEnvelope — consumed by Service slice"],
            verification="owns end-to-end verification",
            source_decisions="D1",
        )
        + "\n"
        + slice_block(
            title="Service slice",
            description="Domain service handling requests.",
            allowed=["src/service.py"],
            consumes=["RequestEnvelope — produced by API gateway slice"],
            verification="contributes to API gateway slice",
            depends_on=["API gateway slice"],
            source_decisions="D2",
        )
    )
    threat = ""
    if with_threat:
        threat += "## Threat model\nAttackers, targets, blast radius.\n\n"
        if with_asvs:
            threat += (
                "## ASVS verification mapping\n"
                "| ASVS | Decision |\n|---|---|\n| V1.1 | D1 |\n\n"
            )
    return (
        "# Architecture — Synthetic L3\n\n"
        "## Goal — what this architecture serves\n"
        "Synthetic L3 fixture goal paragraph.\n\n"
        "## Scope\n"
        "In: gateway + service. Deferred: nothing. Out: storage layer.\n\n"
        "## Components and structure\n"
        "Two-component split.\n\n"
        "## Quality characteristics addressed (ISO/IEC 25010:2023)\n"
        "| Characteristic | How |\n|---|---|\n| Reliability | D1 |\n\n"
        "## Design decisions\n"
        "### D1: Adopt gateway pattern\n"
        "Reasoning.\n\n"
        "### D2: Domain service owns business logic\n"
        "Reasoning.\n\n"
        f"{threat}"
        "## Card Slices\n"
        f"{slices}\n"
        "## Traceability matrix\n"
        "| R# | Decision |\n"
        "|----|----------|\n"
        "| R1 | D1, D2 |\n\n"
        "## Limitations and trade-offs\n"
        "Synthetic.\n\n"
        "## Standards governing this architecture\n"
        "| Standard | Source | Governed |\n|---|---|---|\n| ISO 25010 | external | quality |\n\n"
        "## Status of this architecture\n"
        "Passes Gates A/B/C.\n\n"
        "**Level:** L3\n"
    )


# ---------------------------------------------------------------------------
# Write fixtures
# ---------------------------------------------------------------------------

# --- architecture_document : valid at each level (R-DOC-1..7) ---------------
emit("doc_l1_valid", "architecture_document", doc_l1())
emit("doc_l2_valid", "architecture_document", doc_l2())
emit("doc_l3_valid", "architecture_document", doc_l3())
# L3 valid with the Threat model / ASVS co-occurrence both present.
emit("doc_l3_valid_threat_asvs", "architecture_document", doc_l3(with_threat=True, with_asvs=True))

# --- architecture_document : invalid -------------------------------------- #

# R-DOC-1: no level marker.
emit(
    "doc_l1_invalid_no_level_marker",
    "architecture_document",
    doc_l1().replace("**Level:** L1\n", "Status note without marker.\n"),
)

# R-DOC-1 on CRLF: bare-`$` level marker would have matched pre-fix; the
# corrected hook uses `\r?$` so a CRLF document with a correct marker must
# still PASS. This fixture is the CRLF-positive case (see doc_l2_valid_crlf).
# The CRLF-negative case: a CRLF doc whose marker line has trailing junk.
crlf_bad_marker = doc_l2().replace(
    "**Level:** L2\n", "**Level:** L2 (note)\n"
).replace("\n", "\r\n")
emit("doc_l2_invalid_crlf_marker_trailing", "architecture_document", crlf_bad_marker)

# R-DOC-2: short-form headings (the OLD strings) must now FAIL because compose
# emits the long verbatim forms. This exercises the central reconciliation gap.
short_form_doc = (
    "# Architecture — Synthetic L2 shortform\n\n"
    "## Goal\nx\n\n"
    "## Scope\nx\n\n"
    "## Components and structure\nx\n\n"
    "## Design decisions\n### D1: Foo\ny\n\n"
    "## Card Slices\n"
    + slice_block("Slice A", "desc", ["src/a.py"], source_decisions="D1")
    + "\n## Traceability matrix\n| R# | Decision |\n|----|----------|\n| R1 | D1 |\n\n"
    "## Limitations\nx\n\n"          # short form — should fail vs. "Limitations and trade-offs"
    "## Standards\nx\n\n"            # short form — should fail vs. "Standards governing this architecture"
    "## Status\nx\n\n"              # short form — should fail vs. "Status of this architecture"
    "**Level:** L2\n"
)
emit("doc_l2_invalid_shortform_headings", "architecture_document", short_form_doc)

# R-DOC-2: L3 with Threat model present but ASVS mapping absent (co-occur).
emit(
    "doc_l3_invalid_threat_no_asvs",
    "architecture_document",
    doc_l3(with_threat=True, with_asvs=False),
)

# R-DOC-3: empty Card Slices section.
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

# R-DOC-4: slice present but missing required field labels.
broken_slice_doc = (
    "# Architecture — Synthetic L2 broken slice\n\n"
    "## Goal — what this architecture serves\nx\n\n"
    "## Scope (in / deferred / out)\nx\n\n"
    "## Components and structure\nx\n\n"
    "## Design decisions\n### D1: Foo\ny\n\n"
    "## Card Slices\n"
    "### Half-formed slice\n"
    "- **Description.** missing required fields\n"
    "- **Allowed-touch list.** src/foo.py\n\n"
    "## Traceability matrix\n| R# | Decision |\n|----|----------|\n| R1 | D1 |\n\n"
    "## Limitations and trade-offs\nx\n\n"
    "## Standards governing this architecture\nx\n\n"
    "## Status of this architecture\nx\n\n"
    "**Level:** L2\n"
)
emit("doc_l2_invalid_broken_slice_fields", "architecture_document", broken_slice_doc)

# R-DOC-4: slice uses the OLD short-form labels (Allowed-touch / Forbidden-touch)
# which compose does NOT emit — must now FAIL against the canonical `... list`
# labels.
shortlabel_slice = (
    "### Slice with short labels\n"
    "- **Description.** desc\n"
    "- **Allowed-touch.** src/foo.py\n"          # short form (no " list")
    "- **Forbidden-touch.** None\n"              # short form (no " list")
    "- **Produces.** None\n"
    "- **Consumes.** None\n"
    "- **Verification scope.** local-only\n"
    "- **Depends on.** None\n"
    "- **Source decisions.** D1\n"
)
shortlabel_doc = (
    "# Architecture — Synthetic L2 short labels\n\n"
    "## Goal — what this architecture serves\nx\n\n"
    "## Scope (in / deferred / out)\nx\n\n"
    "## Components and structure\nx\n\n"
    "## Design decisions\n### D1: Foo\ny\n\n"
    "## Card Slices\n"
    f"{shortlabel_slice}\n"
    "## Traceability matrix\n| R# | Decision |\n|----|----------|\n| R1 | D1 |\n\n"
    "## Limitations and trade-offs\nx\n\n"
    "## Standards governing this architecture\nx\n\n"
    "## Status of this architecture\nx\n\n"
    "**Level:** L2\n"
)
emit("doc_l2_invalid_shortform_slice_labels", "architecture_document", shortlabel_doc)

# R-DOC-6: slice references D2 not defined in Design decisions.
emit("doc_l2_invalid_missing_d_ref", "architecture_document", doc_l2(missing_d_ref=True))

# CRLF-positive: a valid L2 document stored with CRLF line endings must PASS
# (exercises global \r?$ discipline on R-DOC-1 + heading extraction).
emit("doc_l2_valid_crlf", "architecture_document", doc_l2().replace("\n", "\r\n"))

# --- ARCH_FACTS_BUNDLE_V2 ------------------------------------------------- #
emit("bundle_valid_l1", "general", bundle_artifact_content(make_valid_bundle(1)))
emit("bundle_valid_l2", "general", bundle_artifact_content(make_valid_bundle(2)))
emit("bundle_valid_l3", "general", bundle_artifact_content(make_valid_bundle(3)))

# CRLF-terminated bundle content must PASS (sentinel normalization step 2/3).
emit(
    "bundle_valid_l2_crlf",
    "general",
    bundle_artifact_content(make_valid_bundle(2)).replace("\n", "\r\n"),
)

# Leading UTF-8 BOM before the sentinel must PASS (normalization step 1).
emit(
    "bundle_valid_l2_bom",
    "general",
    "﻿" + bundle_artifact_content(make_valid_bundle(2)),
)

# R-BUNDLE-5: declared level disagrees with v1.0 rule re-evaluation.
mismatched_bundle = make_valid_bundle(2)
mismatched_bundle["rule_evaluation"]["computed_level"] = 3
emit("bundle_invalid_level_mismatch", "general", bundle_artifact_content(mismatched_bundle))

# R-BUNDLE-1: malformed JSON after a correct sentinel.
emit("bundle_invalid_malformed_json", "general", "ARCH_FACTS_BUNDLE_V2\n{not valid json,,,")

# R-BUNDLE-1: wrong sentinel (first line is not ARCH_FACTS_BUNDLE_V2).
emit(
    "bundle_invalid_wrong_sentinel",
    "ARCH_FACTS_BUNDLE_V2",
    "ARCH_FACTS_BUNDLE_V1\n" + json.dumps(make_valid_bundle(2), indent=2),
)

# R-BUNDLE-1: absent sentinel — bare JSON, no sentinel line. Detected via the
# artifact_type, so the rule set runs and R-BUNDLE-1 must fail (first line is
# JSON `{`, not the sentinel).
emit(
    "bundle_invalid_absent_sentinel",
    "ARCH_FACTS_BUNDLE_V2",
    json.dumps(make_valid_bundle(2), indent=2),
)

# --- ARCH_BUNDLE_AUDIT_V2 ------------------------------------------------- #
emit("audit_valid_no_discrepancy", "general", audit_artifact_content(make_valid_audit(2, False)))
emit("audit_valid_with_discrepancy", "general", audit_artifact_content(make_valid_audit(3, True)))

# CRLF audit content must PASS.
emit(
    "audit_valid_no_discrepancy_crlf",
    "general",
    audit_artifact_content(make_valid_audit(2, False)).replace("\n", "\r\n"),
)

# R-AUDIT-3: missing verdict entries.
broken_audit = make_valid_audit(2, False)
for k in ["files_relevant", "dependency_edges", "blast_radius"]:
    del broken_audit["field_verdicts"][k]
emit("audit_invalid_missing_verdicts", "general", audit_artifact_content(broken_audit))

# R-AUDIT-4: any_discrepancy=true but corrected_bundle / recomputed_level null.
incoherent_audit = make_valid_audit(2, False)
incoherent_audit["any_discrepancy"] = True
incoherent_audit["corrected_bundle"] = None
incoherent_audit["recomputed_level"] = None
emit("audit_invalid_incoherent_discrepancy", "general", audit_artifact_content(incoherent_audit))

# R-AUDIT-4: any_discrepancy is JSON null (must FAIL — must be a boolean).
null_disc_audit = make_valid_audit(2, False)
null_disc_audit["any_discrepancy"] = None
emit("audit_invalid_any_discrepancy_null", "general", audit_artifact_content(null_disc_audit))

# R-AUDIT-4: any_discrepancy is a string "false" (must FAIL — not a boolean).
str_disc_audit = make_valid_audit(2, False)
str_disc_audit["any_discrepancy"] = "false"
emit("audit_invalid_any_discrepancy_string", "general", audit_artifact_content(str_disc_audit))

# R-AUDIT-4: any_discrepancy=true, corrected_bundle is a scalar (not object).
scalar_cb_audit = make_valid_audit(3, True)
scalar_cb_audit["corrected_bundle"] = "not-an-object"
emit("audit_invalid_corrected_bundle_scalar", "general", audit_artifact_content(scalar_cb_audit))

# R-AUDIT-1: wrong sentinel.
emit(
    "audit_invalid_wrong_sentinel",
    "ARCH_BUNDLE_AUDIT_V2",
    "ARCH_BUNDLE_AUDIT_V1\n" + json.dumps(make_valid_audit(2, False), indent=2),
)

# --- ARCH_DESIGN_REVIEW_V1 ------------------------------------------------ #
emit("review_valid_empty_findings", "general", review_artifact_content(make_valid_review()))
emit(
    "review_valid_with_findings",
    "general",
    review_artifact_content(
        make_valid_review(
            [
                make_finding(1, "serious", "missing-decision"),
                make_finding(2, "minor", "standards-decoration"),
            ]
        )
    ),
)

# CRLF review content must PASS.
emit(
    "review_valid_empty_findings_crlf",
    "general",
    review_artifact_content(make_valid_review()).replace("\n", "\r\n"),
)

# R-REVIEW-3: summary counts don't match findings.
bad_summary_review = make_valid_review([make_finding(1, "blocker", "missing-decision")])
bad_summary_review["summary"]["blocker_count"] = 0
bad_summary_review["summary"]["serious_count"] = 1
emit("review_invalid_summary_mismatch", "general", review_artifact_content(bad_summary_review))

# R-REVIEW-2: a finding with severity outside the allowed set.
bad_sev = make_valid_review([make_finding(1, "blocker", "missing-decision")])
bad_sev["findings"][0]["severity"] = "critical"
bad_sev["summary"] = {"blocker_count": 0, "serious_count": 0, "minor_count": 0}
emit("review_invalid_bad_severity", "general", review_artifact_content(bad_sev))

# R-REVIEW-2: a finding with category outside the allowed set.
bad_cat = make_valid_review([make_finding(1, "serious", "missing-decision")])
bad_cat["findings"][0]["category"] = "not-a-real-category"
emit("review_invalid_bad_category", "general", review_artifact_content(bad_cat))

# R-REVIEW-2: id == "F0" (must match ^F[1-9][0-9]*$).
bad_id_f0 = make_valid_review([make_finding(1, "serious", "missing-decision")])
bad_id_f0["findings"][0]["id"] = "F0"
emit("review_invalid_id_f0", "general", review_artifact_content(bad_id_f0))

# R-REVIEW-2: id == "F01" (zero-padded — disallowed).
bad_id_f01 = make_valid_review([make_finding(1, "serious", "missing-decision")])
bad_id_f01["findings"][0]["id"] = "F01"
emit("review_invalid_id_f01", "general", review_artifact_content(bad_id_f01))

# R-REVIEW-2: duplicate ids within .findings.
dup_ids = make_valid_review(
    [make_finding(1, "serious", "missing-decision"), make_finding(1, "minor", "other")]
)
# Both ids are "F1". Fix summary so only R-REVIEW-2's uniqueness fails for the
# id-uniqueness assertion (R-REVIEW-3 contiguity will also flag idx1).
dup_ids["summary"] = {"blocker_count": 0, "serious_count": 1, "minor_count": 1}
emit("review_invalid_duplicate_ids", "general", review_artifact_content(dup_ids))

# R-REVIEW-3: non-contiguous findings ids (F1, F3 — F2 skipped).
noncontig = make_valid_review(
    [make_finding(1, "serious", "missing-decision"), make_finding(3, "minor", "other")]
)
emit("review_invalid_noncontiguous_ids", "general", review_artifact_content(noncontig))

# R-REVIEW-2: document_citation.quoted_text empty (non-empty string required).
empty_quote = make_valid_review([make_finding(1, "serious", "missing-decision")])
empty_quote["findings"][0]["document_citation"]["quoted_text"] = ""
emit("review_invalid_empty_quoted_text", "general", review_artifact_content(empty_quote))

# R-REVIEW-1: wrong sentinel.
emit(
    "review_invalid_wrong_sentinel",
    "ARCH_DESIGN_REVIEW_V1",
    "ARCH_DESIGN_REVIEW_V2\n" + json.dumps(make_valid_review(), indent=2),
)

# --- Non-architecture artifacts (existing gate should still fire) --------- #
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
