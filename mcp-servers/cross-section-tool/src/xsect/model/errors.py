"""Typed error hierarchy for the Cross-Section Tool.

Architecture conventions: ``XsectError -> {ExpressionError, DerivationError,
GeometryError, ConstraintError, StoreError, ExportError}``. Every message states
what was rejected and what a valid input looks like, so an LLM caller can act on
the error without further diagnosis (mcp-builder actionable-error guidance).

Lives in the ``model`` layer (stdlib-only) so every layer may import it without
violating the inward dependency rule.
"""

from __future__ import annotations


class XsectError(Exception):
    """Base class for all typed Cross-Section Tool errors."""


class ExpressionError(XsectError):
    """A relation/expression string was rejected by the restricted grammar
    (T1 trust boundary) or failed bounded evaluation."""


class DerivationError(XsectError):
    """A dimension record is structurally invalid (tier/provenance shape),
    the derivation DAG is invalid (unknown input, cycle), or an input update
    targeted a derived dimension."""


class GeometryError(XsectError):
    """Profile ops are invalid: literal magnitudes (FR-9), open loops,
    impossible arcs, fillets that do not fit, or half-section endpoints
    off the declared axis."""


class ConstraintError(XsectError):
    """Composition input is invalid, refs cannot be resolved, resource caps
    are exceeded, or the solver backend is unavailable."""


class StoreError(XsectError):
    """Document registry failures: unknown doc_id, snapshot I/O problems."""


class ExportError(XsectError):
    """Output serialization failures: DXF write problems, or a rendered
    payload exceeding the self-imposed structured-content budget (D16)."""
