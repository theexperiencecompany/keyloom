# Accessibility

> Designing interfaces everyone can perceive, operate, and understand regardless of ability or context.

**When to use it:** Always — it is a baseline for every screen, control, and flow, not an add-on feature.

**Guidelines**
- Let text resize generously (toward 200%) without clipping; design layouts that reflow rather than fixing text into rigid heights.
- Meet contrast targets: about 4.5:1 for body text and 3:1 for large text and interface elements; check in both light and dark.
- Convey state with more than color — add an icon, label, or shape (e.g. an error icon alongside the message).
- Give touch and click targets a comfortable size (~44pt) with spacing so they aren't easily mis-hit.
- Provide captions, transcripts, and descriptions; never communicate essential information through audio alone.
- Don't autoplay media or auto-dismiss important UI; let people control timing and opt out.

**Accessibility**
- Pair every meaningful element with a clear, descriptive label.
- Never rely on color alone for meaning or state.
- Keep a logical, predictable focus and reading order that matches the visual order.
- Honor reduced-motion and reduced-transparency preferences with calmer, more solid alternatives.
- Avoid content that flashes more than three times per second, and offer simple alternatives to swipe or drag gestures.

**Avoid**
- Relying on color alone for meaning or state.
- Tiny, tightly packed targets.
- Custom controls with no clear label or operable alternative.
- Autoplaying or flashing media without controls or a calmer fallback.

**Full reference:** [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)
