# pow-check.py < samples — the largest error of V8's 2 ** x against 2^x computed
# exactly (decimal, 60 digits), in units in the last place of the double result.
import sys, math
from decimal import Decimal, getcontext
getcontext().prec = 60
LN2 = Decimal(2).ln()
worst = (0, None)
n = 0
for line in sys.stdin:
    xs, ys = line.split()
    x, y = float(xs), float(ys)
    exact = (Decimal(x) * LN2).exp()
    ulp = math.ulp(y)
    err = abs(Decimal(y) - exact) / Decimal(ulp)
    n += 1
    if err > worst[0]: worst = (err, xs)
print(f"samples {n} worst error {float(worst[0]):.4f} ulp at x = {worst[1]}")
