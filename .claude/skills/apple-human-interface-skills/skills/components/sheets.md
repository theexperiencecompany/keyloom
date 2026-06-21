# Sheets

> A sheet presents a focused, self-contained task closely related to the current context, layered over the view beneath it.

**When to use it:** Use a sheet to request specific input or complete a short, scoped task before returning; for long or complex multi-step flows, prefer a dedicated full-screen view.

**Guidelines**
- Show only one sheet at a time; close the current one before opening another.
- Always pair a confirming action (Done or Save) with a way to cancel that dismisses without saving.
- Use Back for multi-step flows; never show Back, Cancel, and Done together.
- Place the cancel or close action on the leading side and the confirming action on the trailing side.
- Pick a sensible default size and offer resize options only when they genuinely help.
- On touch devices, support swipe-to-dismiss and show a drag affordance when the sheet is resizable.
- If there are unsaved changes, confirm before discarding them on dismiss.

**Accessibility**
- Keep focus within the sheet while it's open and return focus to its origin when it closes.
- Provide a clearly labeled close action.
- Give any drag or resize affordance an equivalent that doesn't require a gesture.
- Ensure controls meet an adequate touch target of roughly 44pt.
- Maintain strong contrast between the sheet and the dimmed content behind it.

**Avoid**
- Stacking sheets or opening one sheet from another without closing the first.
- A lone confirming button as the only way out.
- Using a sheet for a prolonged editing task that deserves its own view.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/sheets)
