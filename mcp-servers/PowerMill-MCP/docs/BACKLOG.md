# PowerMill MCP — Backlog (owner wants, captured raw then triaged)

> Dumping ground for "things I want it to do." Items are captured raw as the owner
> says them, then triaged into the subsystem(s) and requirements they belong to.
> Triage maps an item to subsystems A–F (see ROADMAP) and notes what must be
> resolved before it can be specced. Capturing here ≠ committing to build order —
> that's the roadmap's job, informed by this list.
>
> Status values: **captured** (recorded, not yet triaged) · **triaged** (mapped to
> subsystems + open questions) · **specced** (folded into a subsystem spec) ·
> **done**.

---

## BL-001 — Full setup import (machine + workholding)

- **Status:** triaged
- **Raw ask (2026-06-27):** "Add a full setup feature for importing my machine
  file, vises, chucks, whatever it is I'm needing for the process."

**What it means.** Represent the complete physical machining environment so the
system programs against reality and can check for real collisions:
- the **machine** (the owner's 3/4-axis ~20 hp / 12k Kessler mill — see §3.1 of the
  requirements spec),
- **workholding / fixtures** — vises, chucks, clamps, soft jaws, fixtures,
- **stock + part placement** within that setup,
- assembled into a reusable, nameable **"setup."**

**Triage — spans three subsystems:**
- **A (capability core):** tools to import/define a machine model and fixture
  models, and assemble them into a setup the toolpaths reference. (Coverage audit:
  machine tools are currently list-only; fixtures aren't handled. The .NET API has
  `PMMachineTool` and model import, but no fixture/setup assembly — likely needs
  wrapping + macro fallback.)
- **B (shop knowledge):** vises/chucks/machine are recurring shop assets — define
  once, reuse on every job. A **fixture + machine library** (curated data) lives
  here.
- **E (verification):** the machine + fixtures are what make real collision
  checking possible (don't crash the vise, clamps, or machine). Ties to R-SAFE-1
  (machine-collision verification) which was pending a machine model.

**Open questions to resolve before speccing (not blocking capture):**
- Do you already have a **machine model** for your mill (e.g. a PowerMill machine
  definition / `.mtd`, or a vendor kinematic model), or do we need to build/source
  one? (Also relates to OQ-5.)
- Are your **vises/chucks/fixtures** available as 3D models (STEP/STL), or do we
  model them?
- Do you want the **reusable library** angle (define a Kurt vise once, reuse) from
  the start, or a simpler per-job import first?

**Roadmap note:** foundation-cluster work (A+B+E); strong candidate for early build
since nearly every job needs a setup and the safety checkpoints depend on it.
