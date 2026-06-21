# Entering Data

> Designing input so people can supply information quickly and without mistakes.

**When to use it:** For any form, checkout, sign-up, settings, or search flow that collects information from people.

**Guidelines**
- Pre-fill or gather anything you already know (profile, location, prior entries); never ask for data you can derive.
- Pair every field with a visible label; use placeholder text only as a format hint, never as the label.
- Prefill sensible defaults to reduce decisions, but never prefill a password field.
- Prefer choosing over typing (a picker, segmented control, or date picker) whenever the options are finite.
- Make it easy to move through fields in a logical order and to paste content.
- Validate as people go, with specific, actionable error messages, and clearly indicate which fields are required.
- Keep forms short; ask only for what you genuinely need right now.

**Accessibility**
- Keep labels visible and clearly associated with their fields, and present errors next to the field they describe.
- Don't convey required or error state by color alone; add text or an icon.
- Announce validation errors so people using assistive technology learn of them promptly.
- Ensure fields, labels, and error text meet legibility and contrast guidelines, with adequate target sizes.

**Avoid**
- Using placeholder text as the label (it disappears on focus and reads poorly).
- Forcing typing where a picker would do.
- Prepopulating passwords or surfacing errors only after submission.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/entering-data)
