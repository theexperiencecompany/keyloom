# Pickers

> A picker presents one or more scrollable lists of distinct values to choose from, including date and time pickers.

**When to use it:** To choose from a medium-to-long list of predictable, logically ordered values. Use a short selection control for brief lists and a searchable list for very large sets.

**Guidelines**
- Use predictable, logically ordered values — alphabetical or chronological — for quick scanning.
- Show the picker in context, near the field being edited, rather than navigating to a new view.
- Prefer familiar date and time pickers so people get calendar layout, entry, and localization they already know.
- Let the locale format and order date and time parts; don't hardcode the order.
- For fine granularity, constrain intervals to sensible steps such as 15 minutes.

**Accessibility**
- Give every picker a clear, descriptive label.
- Make values adjustable and selectable in a logical order, not by pointer alone.
- Clearly convey the currently selected value.
- Give controls generous, easily tapped targets (about 44pt).

**Avoid**
- Forcing an unfamiliar selection pattern where a familiar one fits.
- Switching to a separate screen just to show the picker.
- Custom date widgets that lack keyboard operability or localization.

**Full reference:** [pickers.md](https://developer.apple.com/design/human-interface-guidelines/pickers)
