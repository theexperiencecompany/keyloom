# Layout

> A consistent, adaptive layout grounds people in content and works across screen sizes and orientations.

**When to use it:** Designing screen structure, grouping content versus controls, and adapting to viewport size, orientation, zoom, and device edges.

**Guidelines**
- Group related items with whitespace, shapes, separators, or cards, and keep content distinct from controls.
- Give essential information room, and defer secondary content with progressive disclosure.
- Extend backgrounds and full-bleed media to the edges, and float controls above scrolling content.
- Place important items toward the top and leading edge, accounting for reading direction.
- Align elements to a shared grid, and use alignment and indentation to express hierarchy.
- Provide generous spacing around controls so targets don't crowd each other.
- Design the full layout first, and collapse to a compact, stacked form only when it no longer fits.
- Don't distort media aspect ratio to fit — scale and crop to keep the key subject visible.
- Respect safe areas and standard margins, accounting for rounded corners, cutouts, and floating chrome.

**Accessibility**
- Let content reflow without horizontal scrolling, including at high zoom levels.
- Adapt to larger text by stacking content and reducing columns as text grows.
- Keep the reading order consistent with the visual order for screen readers and keyboard navigation.
- Test across sizes, orientations, zoom levels, and both left-to-right and right-to-left layouts.

**Avoid**
- Rigid layouts that don't reflow, and controls jammed against edges without margins.
- Content hidden behind notches, status bars, or toolbars.
- Abrupt layout jumps when resizing instead of smooth transitions between breakpoints.

**Full reference:** [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/layout)
