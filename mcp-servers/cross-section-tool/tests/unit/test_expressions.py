"""T1 boundary tests: the restricted grammar accepts exactly its language."""

import math

import pytest

from xsect.model.errors import ExpressionError
from xsect.model.expressions import (
    MAX_AST_DEPTH,
    MAX_EXPR_LENGTH,
    evaluate,
    is_bare_name,
    parse,
)


def ev(src: str, **env: float) -> float:
    return evaluate(parse(src), env)


def test_arithmetic_and_functions() -> None:
    assert ev("od/2 - wall_t", od=50.0, wall_t=3.0) == 22.0
    assert ev("sqrt(a**2 + b**2)", a=3.0, b=4.0) == 5.0
    assert ev("min(a, b, 10)", a=4.0, b=7.0) == 4.0
    assert ev("atan2(y, x)", y=1.0, x=1.0) == pytest.approx(math.pi / 4)
    assert ev("pi * 2") == pytest.approx(math.tau)
    assert ev("7 % 4") == 3.0


def test_deg_converts_degrees_to_radians_and_rad_inverts() -> None:
    assert ev("deg(90)") == pytest.approx(math.pi / 2)
    assert ev("rad(pi)") == pytest.approx(180.0)


def test_referenced_names_feed_the_dag() -> None:
    expr = parse("od/2 - wall_t + sin(theta)")
    assert expr.names == frozenset({"od", "wall_t", "theta"})
    assert parse("pi + tau").names == frozenset()  # constants are not inputs


def test_determinism_repeat_evaluation() -> None:
    expr = parse("sqrt(a) * sin(b) + a**3 % 7")
    env = {"a": 12.34, "b": 0.567}
    assert evaluate(expr, env) == evaluate(expr, env)


@pytest.mark.parametrize(
    "src",
    [
        "__import__('os')",
        "(1).__class__",
        "a.__dict__",
        "a[0]",
        "lambda x: x",
        "[x for x in range(3)]",
        "a if b else c",
        "a and b",
        "a == b",
        "f'{a}'",
        "'abc'",
        "True",
        "a := 3",
        "min(a, key=b)",
        "min(*a)",
        "unknownfn(3)",
        "a; b",
        "",
        "   ",
    ],
)
def test_adversarial_corpus_rejected_before_evaluation(src: str) -> None:
    with pytest.raises(ExpressionError):
        parse(src)


def test_structural_caps() -> None:
    with pytest.raises(ExpressionError, match="length"):
        parse("1+" * (MAX_EXPR_LENGTH // 2) + "1")
    deep = "(" * (MAX_AST_DEPTH + 2) + "1" + ")" * (MAX_AST_DEPTH + 2)
    # parentheses are structural; force depth with unary ops instead
    deep = "-" * (MAX_AST_DEPTH + 2) + "a"
    with pytest.raises(ExpressionError, match="depth"):
        parse(deep)
    with pytest.raises(ExpressionError, match="exponent"):
        ev("2 ** 65")
    with pytest.raises(ExpressionError, match="arguments"):
        parse("min(1,2,3,4,5,6,7,8,9)")


def test_numeric_domain_errors_are_typed() -> None:
    with pytest.raises(ExpressionError, match="division by zero"):
        ev("1/(a-a)", a=3.0)
    with pytest.raises(ExpressionError, match="non-finite|overflow"):
        ev("(10.0**60) ** 60")
    with pytest.raises(ExpressionError, match="domain"):
        ev("sqrt(0-1)")
    with pytest.raises(ExpressionError, match="complex"):
        ev("(0-8) ** 0.5")


def test_unknown_name_names_the_missing_dimension() -> None:
    with pytest.raises(ExpressionError, match="'ghost'"):
        ev("ghost + 1")


def test_is_bare_name() -> None:
    assert is_bare_name("wall_t")
    assert not is_bare_name("od/2")
    assert not is_bare_name("a.b")
