# Loading

> Handling waits for content so they don't disrupt the experience, ideally finishing before people notice.

**When to use it:** For content or assets that take more than a moment to fetch or render, especially when you can show useful structure or partial data while the rest arrives.

**Guidelines**
- Show something immediately, such as a placeholder layout, so a blank screen isn't mistaken for a broken one.
- Replace placeholders progressively as real content arrives.
- Let people interact with other parts of the experience while content loads in the background.
- Show a determinate progress indicator when the duration is known, and an indeterminate one when it isn't.
- For unavoidably long waits, show something useful (tips, partial content) and an estimate of time remaining.
- Prefer a brief loading indicator over a blank screen for short waits.

**Accessibility**
- Communicate progress and completion to people using assistive technology, not just visually.
- Make sure loading indicators and any accompanying text remain legible and high-contrast.
- Respect reduced-motion preferences for spinner and placeholder animations.

**Avoid**
- Blank screens with no indication anything is happening.
- Blocking the whole experience when partial interaction is possible.
- An indeterminate spinner when you actually know the progress.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/loading)
