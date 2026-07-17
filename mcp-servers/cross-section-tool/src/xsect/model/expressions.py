"""Restricted arithmetic expression engine — the T1 trust boundary (D5).

Caller-supplied governing relations (C-2) are parsed with :mod:`ast` and
validated against a **default-deny whitelist** before any evaluation. The
accepted language is exactly:

* numeric literals (``int``/``float`` — never ``bool``, never ``complex``)
* bare dimension names (``ast.Name`` in load context)
* binary ``+ - * / ** %`` and unary ``+ -``
* parentheses (structural, not a node)
* calls into an enumerated function table:
  ``sin cos tan asin acos atan atan2 sqrt abs min max floor ceil deg rad``
  and the constants ``pi``, ``tau``. Trig operates in **radians**;
  ``deg(x)`` converts *x degrees* to radians (``deg(90) == pi/2``) and
  ``rad(x)`` converts *x radians* to degrees.

Everything else — attributes, subscripts, names not in the environment,
lambdas, comprehensions, comparisons, boolean ops, f-strings, keyword
arguments, any unlisted AST node — is rejected **before evaluation** with a
typed :class:`~xsect.model.errors.ExpressionError` naming the construct.

Structural caps (T3 — deterministic, unlike timeouts): expression length
<= 512 chars, AST depth <= 32, ``**`` exponent magnitude <= 64, call arity
<= 8, and every intermediate and final value must be a finite float.
"""

from __future__ import annotations

import ast
import math
import re
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field

from xsect.model.errors import ExpressionError

MAX_EXPR_LENGTH = 512
MAX_AST_DEPTH = 32
MAX_POW_EXPONENT = 64.0
MAX_CALL_ARGS = 8

_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _deg(x: float) -> float:
    """Interpret ``x`` as degrees; return radians. ``deg(90) == pi/2``."""
    return math.radians(x)


def _rad(x: float) -> float:
    """Interpret ``x`` as radians; return degrees. ``rad(pi) == 180``."""
    return math.degrees(x)


# name -> (callable, min_arity, max_arity)
_FUNCTIONS: dict[str, tuple[Callable[..., float], int, int]] = {
    "sin": (math.sin, 1, 1),
    "cos": (math.cos, 1, 1),
    "tan": (math.tan, 1, 1),
    "asin": (math.asin, 1, 1),
    "acos": (math.acos, 1, 1),
    "atan": (math.atan, 1, 1),
    "atan2": (math.atan2, 2, 2),
    "sqrt": (math.sqrt, 1, 1),
    "abs": (abs, 1, 1),
    "min": (min, 2, MAX_CALL_ARGS),
    "max": (max, 2, MAX_CALL_ARGS),
    "floor": (lambda x: float(math.floor(x)), 1, 1),
    "ceil": (lambda x: float(math.ceil(x)), 1, 1),
    "deg": (_deg, 1, 1),
    "rad": (_rad, 1, 1),
}

_CONSTANTS: dict[str, float] = {"pi": math.pi, "tau": math.tau}

#: Names that may never be used as dimension names.
RESERVED_NAMES: frozenset[str] = frozenset(_FUNCTIONS) | frozenset(_CONSTANTS)


@dataclass(frozen=True)
class Expr:
    """A validated expression: source text plus the referenced dimension names."""

    source: str
    names: frozenset[str]
    _tree: ast.Expression = field(repr=False, compare=False, hash=False)


def is_bare_name(source: str) -> bool:
    """True when ``source`` is a plain identifier (a direct dimension reference)."""
    return bool(_IDENTIFIER_RE.match(source.strip()))


def _segment(source: str, node: ast.AST) -> str:
    seg = ast.get_source_segment(source, node)
    return seg if seg is not None else type(node).__name__


def _reject(source: str, node: ast.AST, what: str) -> ExpressionError:
    return ExpressionError(
        f"expression rejected: {what} ({_segment(source, node)!r}) is not allowed. "
        "Valid expressions use numbers, dimension names, + - * / ** %, parentheses, "
        f"and calls to: {', '.join(sorted(_FUNCTIONS))}; constants pi, tau."
    )


def parse(source: str) -> Expr:
    """Validate ``source`` against the whitelist and return an :class:`Expr`.

    Rejection happens **before** any evaluation (T1). The returned ``names``
    set feeds the derivation DAG (D5/D6).
    """
    if not isinstance(source, str):
        raise ExpressionError(
            f"expression must be a string, got {type(source).__name__}. "
            "Numeric literals are not accepted as relations — pass a string."
        )
    if len(source) > MAX_EXPR_LENGTH:
        raise ExpressionError(
            f"expression rejected: length {len(source)} exceeds the cap of "
            f"{MAX_EXPR_LENGTH} characters."
        )
    if not source.strip():
        raise ExpressionError("expression rejected: empty string. Provide a relation.")
    try:
        tree = ast.parse(source, mode="eval")
    except (SyntaxError, ValueError, MemoryError, RecursionError) as exc:
        raise ExpressionError(
            f"expression rejected: not valid expression syntax ({exc}). "
            "Provide a single arithmetic expression."
        ) from exc

    names: set[str] = set()
    _validate(source, tree.body, names, depth=1)
    return Expr(source=source, names=frozenset(names), _tree=tree)


def _validate(source: str, node: ast.AST, names: set[str], depth: int) -> None:
    if depth > MAX_AST_DEPTH:
        raise ExpressionError(
            f"expression rejected: nesting depth exceeds the cap of {MAX_AST_DEPTH}."
        )
    if isinstance(node, ast.Constant):
        v = node.value
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            raise _reject(source, node, f"literal of type {type(v).__name__}")
        return
    if isinstance(node, ast.Name):
        if not isinstance(node.ctx, ast.Load):
            raise _reject(source, node, "non-load name context")
        if node.id not in _CONSTANTS:
            names.add(node.id)
        return
    if isinstance(node, ast.BinOp):
        if not isinstance(node.op, (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow, ast.Mod)):
            raise _reject(source, node, f"operator {type(node.op).__name__}")
        _validate(source, node.left, names, depth + 1)
        _validate(source, node.right, names, depth + 1)
        return
    if isinstance(node, ast.UnaryOp):
        if not isinstance(node.op, (ast.UAdd, ast.USub)):
            raise _reject(source, node, f"unary operator {type(node.op).__name__}")
        _validate(source, node.operand, names, depth + 1)
        return
    if isinstance(node, ast.Call):
        if not isinstance(node.func, ast.Name):
            raise _reject(source, node, "call of a non-name expression")
        fname = node.func.id
        if fname not in _FUNCTIONS:
            raise ExpressionError(
                f"expression rejected: unknown function {fname!r}. "
                f"Allowed functions: {', '.join(sorted(_FUNCTIONS))}."
            )
        if node.keywords:
            raise _reject(source, node, "keyword arguments")
        _fn, lo, hi = _FUNCTIONS[fname]
        if not (lo <= len(node.args) <= hi):
            raise ExpressionError(
                f"expression rejected: {fname}() takes between {lo} and {hi} "
                f"arguments, got {len(node.args)}."
            )
        for arg in node.args:
            if isinstance(arg, ast.Starred):
                raise _reject(source, arg, "starred argument")
            _validate(source, arg, names, depth + 1)
        return
    # Default deny: every other node type.
    raise _reject(source, node, f"construct {type(node).__name__}")


def evaluate(expr: Expr, env: Mapping[str, float]) -> float:
    """Evaluate a validated expression against dimension values.

    Bounded float arithmetic only. Deterministic for identical inputs (NFR-2):
    no wall clock, no randomness, no environment reads.
    """
    result = _eval(expr.source, expr._tree.body, env)
    return _check_finite(result, f"expression {expr.source!r}")


def _check_finite(v: float, what: str) -> float:
    if not math.isfinite(v):
        raise ExpressionError(
            f"{what} produced a non-finite value ({v!r}). "
            "Every intermediate and final value must be a finite float."
        )
    return v


def _eval(source: str, node: ast.AST, env: Mapping[str, float]) -> float:
    if isinstance(node, ast.Constant):
        if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
            raise ExpressionError(
                f"expression {source!r}: constant {node.value!r} is not a "
                "plain number."
            )
        return float(node.value)
    if isinstance(node, ast.Name):
        if node.id in _CONSTANTS:
            return _CONSTANTS[node.id]
        try:
            return float(env[node.id])
        except KeyError:
            raise ExpressionError(
                f"expression references {node.id!r}, which is not a defined "
                "dimension. Define it with xsect_define_dimensions first."
            ) from None
    if isinstance(node, ast.BinOp):
        left = _eval(source, node.left, env)
        right = _eval(source, node.right, env)
        try:
            if isinstance(node.op, ast.Add):
                out = left + right
            elif isinstance(node.op, ast.Sub):
                out = left - right
            elif isinstance(node.op, ast.Mult):
                out = left * right
            elif isinstance(node.op, ast.Div):
                if right == 0.0:
                    raise ExpressionError(
                        f"division by zero in {_segment(source, node)!r}."
                    )
                out = left / right
            elif isinstance(node.op, ast.Mod):
                if right == 0.0:
                    raise ExpressionError(
                        f"modulo by zero in {_segment(source, node)!r}."
                    )
                out = math.fmod(left, right)
            else:  # ast.Pow — the only remaining validated operator
                if abs(right) > MAX_POW_EXPONENT:
                    raise ExpressionError(
                        f"exponent magnitude {abs(right):g} exceeds the cap of "
                        f"{MAX_POW_EXPONENT:g} in {_segment(source, node)!r}."
                    )
                out = left**right
        except OverflowError as exc:
            raise ExpressionError(
                f"arithmetic overflow in {_segment(source, node)!r}."
            ) from exc
        if isinstance(out, complex):
            raise ExpressionError(
                f"{_segment(source, node)!r} produced a complex result; only real "
                "arithmetic is allowed (e.g. no fractional powers of negatives)."
            )
        return _check_finite(out, f"subexpression {_segment(source, node)!r}")
    if isinstance(node, ast.UnaryOp):
        v = _eval(source, node.operand, env)
        return v if isinstance(node.op, ast.UAdd) else -v
    if isinstance(node, ast.Call):
        assert isinstance(node.func, ast.Name)  # validated
        fn, _lo, _hi = _FUNCTIONS[node.func.id]
        args = [_eval(source, a, env) for a in node.args]
        try:
            out = float(fn(*args))
        except (ValueError, OverflowError, ZeroDivisionError) as exc:
            raise ExpressionError(
                f"math domain error in {_segment(source, node)!r}: {exc}."
            ) from exc
        return _check_finite(out, f"call {_segment(source, node)!r}")
    raise ExpressionError(  # pragma: no cover — unreachable after parse()
        f"internal: unvalidated node {type(node).__name__} reached evaluation."
    )
