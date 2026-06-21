# Right to Left

> Mirroring your interface to match the reading direction of right-to-left scripts like Arabic and Hebrew.

**When to use it:** Whenever you localize for Arabic, Hebrew, Persian, Urdu, or other right-to-left languages.

**Guidelines**
- Think in terms of leading and trailing edges so the layout mirrors automatically with reading direction.
- Align text to match the interface direction — right-aligned in right-to-left contexts.
- Align a paragraph of three or more lines by its own language, not the surrounding context.
- Use one consistent alignment for all items in a list, even when scripts are mixed.
- Never reverse the digit order within a number such as a phone or card number.
- Reverse the order of numerals that show progress or sequence to match a flipped control, but don't mirror the glyphs themselves.
- Flip directional controls (sliders, progress, back and next) and reverse their leading and trailing icons.
- Don't flip controls that point to a real direction or an onscreen location.
- Reverse the order of images when their sequence carries meaning.

**Accessibility**
- Set reading direction correctly so screen readers announce order properly and bidirectional text renders well; auto-detect direction for user-generated content.
- Visually balance Arabic or Hebrew next to all-caps Latin (those scripts have no uppercase) by nudging the right-to-left text size if needed.

**Avoid**
- Flipping photos, illustrations, logos, or universal marks such as a checkmark.
- Mirroring icons of real-world objects (clocks, right-handed tools) that aren't directional.
- Reversing digits inside a single number.

**Full reference:** [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/right-to-left)
