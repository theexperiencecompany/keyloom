# Scrolling

> A scrollable region lets people view content larger than its container by moving it vertically or horizontally, with indicators that show position.

**When to use it:** Use scrolling for any content area that can exceed the available space, and use paged or snapping scroll for experiences like carousels and full-screen slides.

**Guidelines**
- Support natural scrolling gestures and momentum; never break the expected feel of scrolling.
- Make scrollability apparent by letting content peek at the edge so people see there's more.
- Don't nest two scroll areas with the same orientation; a horizontal scroller inside a vertical one is fine.
- For paging, snap to each page, keep a small overlap of context, and show a page indicator.
- Auto-scroll only when it helps — to bring a search result, insertion point, or selection into view — and scroll the minimum needed.
- Give pinned toolbars or headers subtle separation (a shadow, blur, or solid background) so they stay legible above scrolling content; use one effect per region.
- In multi-pane layouts, let each pane scroll independently and keep pinned-header heights aligned.

**Accessibility**
- Ensure pinned headers and overlaid controls keep enough contrast against the content scrolling beneath them.
- Keep a logical reading and focus order as content scrolls into and out of view.
- Convey the current page or position in a paged experience, not just visually.
- Respect reduced-motion preferences for smooth, parallax, or animated scrolling effects.
- Keep interactive elements within scroll regions at an adequate touch target of roughly 44pt.

**Avoid**
- Hijacking scrolling in ways that break momentum or expected behavior.
- Nesting two scroll regions on the same axis.
- Scroll-driven parallax that interferes with reading or ignores reduced-motion needs.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/scroll-views)
