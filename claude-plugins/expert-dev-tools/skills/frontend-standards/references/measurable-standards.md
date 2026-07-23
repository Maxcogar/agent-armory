# Measurable Frontend Standards

Specific numbers and thresholds referenced by the frontend-standards skill. These are not guidelines — they are requirements from named standards with specific values.

## Color Contrast — WCAG 2.2 Level AA

| Element | Minimum Ratio | Standard |
|---------|--------------|----------|
| Normal text (under 18px bold / 24px regular) | 4.5:1 | WCAG 1.4.3 |
| Large text (18px+ bold or 24px+ regular) | 3:1 | WCAG 1.4.3 |
| UI components and graphical objects | 3:1 | WCAG 1.4.11 |
| Focus indicators | 3:1, at least 2px | WCAG 2.4.7, 2.4.11 |

## Touch and Target Sizes

| Standard | Minimum Size |
|----------|-------------|
| WCAG 2.2 (2.5.8) | 24×24 CSS pixels |
| Apple HIG | 44×44 points |
| Material Design | 48×48 dp |

## Typography — Readability Research

| Property | Recommended Range | Source |
|----------|-------------------|--------|
| Body text size (screen) | 16px minimum | Web typography consensus |
| Line height (body text) | 1.4–1.6 | WCAG 1.4.12 / readability research |
| Line length | 45–75 characters | Readability research (Baymard Institute) |
| Paragraph spacing | At least 2× font size | WCAG 1.4.12 |
| Letter spacing | At least 0.12× font size must not break layout | WCAG 1.4.12 |
| Word spacing | At least 0.16× font size must not break layout | WCAG 1.4.12 |

## Core Web Vitals — Google

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

## Responsive Breakpoints — WCAG Requirements

| Requirement | Value | Standard |
|-------------|-------|----------|
| Content must reflow without horizontal scroll at | 320px width | WCAG 1.4.10 |
| Text resizable without loss of content to | 200% | WCAG 1.4.4 |
| Content must work at zoom level | 400% | WCAG 1.4.10 |
| Orientation must not be locked | Unless essential | WCAG 1.3.4 |

## Animation and Motion

| Requirement | Value | Standard |
|-------------|-------|----------|
| Maximum flash rate | 3 per second | WCAG 2.3.1 |
| Reduced motion preference | Must respect `prefers-reduced-motion` | WCAG 2.3.3 |
| Auto-playing content | Must be pausable/stoppable | WCAG 2.2.2 |

## Timing

| Requirement | Value | Standard |
|-------------|-------|----------|
| Time limits | User can turn off, adjust, or extend | WCAG 2.2.1 |
| Minimum time extension | 10× the default | WCAG 2.2.1 |
