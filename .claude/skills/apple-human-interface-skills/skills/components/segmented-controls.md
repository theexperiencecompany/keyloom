# Segmented Controls

> A segmented control is a linear set of two or more equal-width segments, each acting as a button, offering a single choice from a related set.

**When to use it:** Use a segmented control for a single choice among a few closely related, mutually exclusive options, or for switching between subviews within the same section.

**Guidelines**
- Keep all segments equal width and visually balanced; keep icon and title widths consistent.
- Limit the control to about five segments on narrow layouts and up to roughly seven on wide ones.
- Use either all text or all icons in one control, never a mix, and prefer nouns or noun phrases for labels.
- Keep one consistent behavior per control: every segment selects a state, or every segment performs an action — never mix the two.
- For icon-only segments, provide a clear way to learn what each one means.
- For switching between whole app sections, use a tab bar or other navigation instead.

**Accessibility**
- Give each segment a clear accessible name, especially icon-only segments.
- Make the selected segment distinguishable by more than color alone.
- Provide a visible focus indicator and a logical order across segments.
- Ensure each segment meets an adequate touch target of roughly 44pt.
- Maintain strong contrast for labels and the selected state.

**Avoid**
- Mixing selection-state and action segments in one control.
- Too many segments, or wildly unequal segment content and width.
- Using a segmented control to navigate between top-level app sections.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)
