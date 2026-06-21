# Labels

> A label is static, uneditable text that people can read (and often copy) but not edit.

**When to use it:** To display a small amount of read-only text — captions, list-item descriptions, helper or context text. For editable text use an input; for large bodies use a text view.

**Guidelines**
- Prefer system or default fonts; if you restyle, keep text legible and support user font scaling.
- Use a tiered color hierarchy — primary, secondary, tertiary, and quaternary — to express importance.
- Make useful text selectable so people can copy it, such as errors, addresses, or locations.
- Respect the user's font-size preferences so text scales with their settings.

**Accessibility**
- Associate each label clearly with the control or content it describes.
- Ensure meaningful text is announced and purely decorative text is not.
- Don't convey meaning by color alone.
- Ensure sufficient contrast for every tier of text, including secondary and tertiary.

**Avoid**
- Locking down selection on informational text people may want to copy.
- Low-contrast secondary or tertiary text that fails contrast requirements.

**Full reference:** [labels.md](https://developer.apple.com/design/human-interface-guidelines/labels)
