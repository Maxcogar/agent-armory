# ADR-0005: In-scope machining envelope — 3/4-axis + positional multi-orientation, no continuous 5-axis

- **Status:** Accepted
- **Date:** 2026-06-27

## Context
"Breadth is mandatory" needs a defined envelope or it's unbounded. The owner's
shop (resolving OQ-1) defines it: a 3/4-axis ~20 hp / 12k Kessler mill with
Renishaw probing, machining aluminum through hard/tough steels (17-4 hardened, AR,
chromoly, 316), for prototypes through production runs. Off-axis work is done with
a CAT40 coolant-driven high-speed **angle head**: the tilt off Z is set manually
and locked; the clocking is set by a **commanded spindle orientation** that holds.
Both are positional/indexed — neither is a continuous cutting axis.

## Decision
The in-scope machining envelope is **3/4-axis plus positional (3+2-style)
multi-orientation at arbitrary fixed angles via workplanes**. **Continuous
simultaneous 5-axis is out of scope.** The angle head is modeled as a first-class
tooling concept with its own geometry (tilt + gauge-line-to-cutter offset) and a
**decoupled speed regime** (coolant-driven cutter RPM, independent of the machine
spindle RPM). NC output for angle-head ops is workplane-oriented 3-axis plus an
emitted spindle-orient command. Material-aware strategy/feeds/speeds is core, given
the hardness range.

## Consequences
- Tool-axis support is bounded to positional orientations — large simplification
  versus continuous 5-axis, while still covering the shop's real work.
- The tool model and post must handle angle-head geometry, spindle-orient output,
  and a separate speed regime — non-standard behavior most generic CAM lacks.
- Subsystem B (shop knowledge) must be keyed by material.
- Revisit only if the shop adds a continuous-5-axis machine.
