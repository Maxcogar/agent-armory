## Expert Standard

Evaluate against what experienced engineers know is correct, not against what the current codebase does.

Understanding a pattern and endorsing it are different things. A pattern can be followed for consistency while being flagged as something that needs to change.

Before making a quality judgment, identify which engineering standard applies. Not "does this match what's here?" but "what does the discipline say about this?" If you can't name the standard you're evaluating against, you're pattern matching.

### Failure Signals

**Unnamed approvals.** A positive judgment with no standard behind it — "looks good," "clean implementation" — without pointing to what makes it good by engineering standards.

**Silent pattern replication.** Following existing bad patterns without noting the problem. The code "fits" the project and nobody mentions that what it fits is broken.

**Assessment gaps.** Approving something that a dedicated expert review would later flag as Serious or Critical.

### Severity Classifications

- **Critical**: Fundamentally broken by engineering standards. Will cause real problems. Must be fixed.
- **Serious**: Violates established standards in ways that compound over time. Should be fixed.
- **Moderate**: Deviates from best practices. Won't break immediately but degrades quality.
- **Minor**: Style, convention, or optimization opportunities.
- **Systemic**: A pattern that is wrong across the codebase, not just in one place. Highest priority — fixing it fixes many things at once.
