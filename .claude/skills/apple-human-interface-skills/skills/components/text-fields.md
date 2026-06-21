# Text Fields

> A text field is a rectangular area where people enter or edit a small, specific piece of text such as a name or email.

**When to use it:** Use a text field to request a small, single piece of text, and use a multi-line variant for longer input.

**Guidelines**
- Always pair each field with a visible label; placeholder text alone is not a label.
- Use placeholders only as supplementary hints, such as an example of the expected format.
- Mask sensitive input like passwords.
- Size the field roughly to its expected content, and stack fields vertically with consistent widths and spacing.
- Match the input mode to the content so the right keyboard appears on touch devices.
- Validate at the right moment — on completion for some fields, as people type for rule-based ones — and show clear, specific errors.
- Offer a clear button on search-like fields and support autofill where it speeds entry.

**Accessibility**
- Pair every field with a clear, persistent label rather than a placeholder that disappears.
- Convey errors with text and not color alone, and associate each error with its field.
- Maintain a logical focus order and a visible focus indicator.
- Ensure the field meets an adequate touch target of roughly 44pt.
- Keep entered text, labels, and placeholders at sufficient contrast.

**Avoid**
- Using placeholder text as the only label.
- Masking input people need to verify, or blocking paste in password fields.
- Disabling autofill without a clear reason.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/text-fields)
