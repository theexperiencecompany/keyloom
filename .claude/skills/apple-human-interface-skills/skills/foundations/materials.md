# Materials

> Translucent, blurred surfaces that separate a floating control or navigation layer from background content, creating depth while keeping foreground elements legible.

**When to use it:** Toolbars, navigation and tab bars, sidebars, popovers, and sheets floating over scrolling content or media where the background should subtly show through.

**Guidelines**
- Reserve translucency for the controls and navigation layer above content, not ordinary content backgrounds.
- Use it sparingly; over-applying blur distracts and feels heavy.
- Choose thickness by need — more opaque for text contrast, more translucent when context should show through.
- Use a more opaque treatment for text-heavy surfaces, and a lighter, clearer one mainly over rich media.
- Over bright media, add a subtle dimming layer to keep foreground content legible; skip it when the background is already dark.
- Place vibrant, sufficiently solid text and icons on top — thin gray content disappears against blur.
- Always have a solid fallback in mind for contexts where the blur effect isn't available.

**Accessibility**
- Honor reduced-transparency and increased-contrast preferences by switching to a solid, opaque background.
- Verify text on translucent surfaces stays legible against the worst-case content that can scroll behind it.
- Don't rely on blur alone for separation — keep a border or shadow where contrast may fall short.

**Avoid**
- Translucency on content-layer backgrounds, which confuses hierarchy.
- Low-contrast or thin text and icons over blurred surfaces.
- Translucent bars with no readable fallback.
- Heavy blur across many elements at once, creating visual noise.

**Full reference:** [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/materials)
