# Dark Mode

> A systemwide dark color palette for low-light viewing that people expect every experience to respect automatically.

**When to use it:** Any product that should honor the system appearance preference, especially media- or reading-focused experiences that benefit from a recessive dark interface.

**Guidelines**
- Respect the system appearance preference by default; don't force one mode without reason.
- If you offer a manual choice, default to "follow system" and remember an explicit selection.
- Define colors by meaning with both light and dark values rather than fixing a single appearance.
- Treat dark as its own palette, not an inversion — use dim backgrounds with bright (not pure-white) foreground text.
- Convey depth with layered surfaces: a darker base recedes while lighter elevated surfaces (modals, cards) advance.
- Slightly dim large bright images, and provide separate dark artwork when an image only reads well in one mode.
- Give icons that blend into a dark background a subtle outline; prefer artwork that adapts across modes.

**Accessibility**
- Maintain contrast in both modes (about 4.5:1 for text, aiming higher for small custom text).
- Test with increased-contrast and reduced-transparency preferences — dark-on-dark can fail when transparency drops.
- Ensure the whole surface, including any system-drawn chrome, reads as dark and consistent.

**Avoid**
- A product-only switch that ignores the system setting (people may think it's broken).
- Pure-white text or backgrounds that glow in dark mode.
- Assuming a straight inversion produces a good dark theme.

**Full reference:** [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
