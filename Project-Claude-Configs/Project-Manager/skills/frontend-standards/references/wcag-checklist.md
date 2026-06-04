# WCAG 2.2 Level AA — Common Failures in Generated Code

This is not the full WCAG spec. This is the subset of failures that show up most often in AI-generated frontend code — the things Claude is most likely to get wrong when pattern-matching against typical website code.

## Images

- Every `<img>` has an `alt` attribute
- Decorative images use `alt=""` (empty, not missing)
- Informative images describe the content, not the format ("Chart showing revenue growth" not "image.png")
- CSS background images that convey information have a text alternative nearby
- Icon-only buttons have `aria-label` or visually hidden text

## Color

- Text has 4.5:1 contrast ratio against background (3:1 for large text)
- UI components have 3:1 contrast against adjacent colors
- Color is never the sole means of conveying information (error states, required fields, status indicators all need a non-color signal)
- Focus indicators have 3:1 contrast and are at least 2px thick
- Placeholder text meets contrast requirements (it usually doesn't — another reason placeholders aren't labels)

## Keyboard

- All interactive elements are focusable via Tab
- Tab order follows visual/reading order
- Focus is never trapped (modals return focus on close)
- Custom components support expected keys (Enter/Space for buttons, Arrow keys for menus/tabs, Escape to dismiss)
- Focus indicators are visible — `outline: none` without a replacement is a WCAG failure
- Skip navigation link exists for page-level layouts

## Forms

- Every input has a visible `<label>` with `for`/`id` association
- Placeholder text is not used as the only label
- Required fields are indicated (not just by color)
- Error messages are specific ("Password must be 8+ characters" not "Invalid input")
- Error messages are associated with their input via `aria-describedby`
- Form validation errors don't clear the user's input
- Submit buttons are disabled or validated before submission when possible

## Structure

- Heading levels don't skip (h1 → h2 → h3, never h1 → h3)
- Landmarks are used (`<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`)
- Lists use `<ul>`/`<ol>`/`<li>`, not styled divs
- Tables use `<th>` with `scope`, not bold text in a `<td>`
- Page has a meaningful `<title>`
- Language is set on `<html lang="...">`

## Interactive Components

- Custom dropdowns, modals, tabs, carousels all have correct ARIA roles and properties
- Modals trap focus while open, return focus on close
- Tooltips are accessible to keyboard and screen readers
- Autocomplete fields announce suggestions to screen readers
- Expandable sections use `aria-expanded`
- Toggle buttons use `aria-pressed`
- Live content updates use `aria-live` regions

## Touch and Target Size

- Touch targets are at least 24x24 CSS pixels (WCAG 2.2)
- Spacing between targets prevents accidental activation
- Dragging interactions have a single-pointer alternative (WCAG 2.2)
- Gestures have single-pointer alternatives

## Motion and Animation

- Animations respect `prefers-reduced-motion` media query
- Nothing flashes more than 3 times per second
- Auto-playing content can be paused, stopped, or hidden
- Parallax and scroll-triggered animations have reduced-motion alternatives

## Responsive

- Content reflows without horizontal scrolling at 320px width
- Text can be resized to 200% without loss of content
- Content works at 400% zoom (WCAG requirement)
- Orientation is not locked (unless essential)
