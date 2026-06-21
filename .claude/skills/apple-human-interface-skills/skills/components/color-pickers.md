# Color Pickers

> A color picker lets people choose and adjust a color for text, shapes, or other elements.

**When to use it:** When people need to pick or change a color value, ideally through a familiar, low-effort control.

**Guidelines**
- Prefer a standard, system-consistent picker so the experience feels familiar.
- Show the currently selected color in the swatch or trigger so the active value stays visible.
- Offer a precise text entry (such as a hex value) alongside visual selection for exact colors.
- Update previews live as the color changes.
- Provide a small set of recent or preset swatches when it speeds common choices.

**Accessibility**
- Don't rely on the swatch color alone — also expose the value as text people can read.
- Give every color control a clear, descriptive label.
- Keep the picker fully operable in a logical focus order, not by pointer alone.
- Make controls generous, easily tapped targets (about 44pt) with legible, high-contrast labels.

**Avoid**
- Reinventing a complex color interface when a simpler, familiar one suffices.
- Conveying the chosen color only visually with no readable value.
- A picker that can't be operated or dismissed without a pointer.

**Full reference:** [color-wells.md](https://developer.apple.com/design/human-interface-guidelines/color-wells)
