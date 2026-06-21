# Alerts

> An alert is a modal that delivers critical information and requires the user to respond before continuing.

**When to use it:** To warn before a destructive or irreversible action, confirm an important user-initiated action such as a purchase, or report a problem the user must acknowledge.

**Guidelines**
- Use alerts sparingly — each one interrupts, so reserve them for essential, actionable moments.
- Don't alert merely to convey information, on load, or for common undoable actions.
- Write a clear, specific title; add message text only when it adds real value.
- Use specific verb buttons ("Delete", "Erase") rather than "OK"; reserve "OK" for purely informational alerts.
- Place the default action on the trailing side and Cancel on the leading side; never make a destructive button the default.
- Style destructive buttons distinctly so their consequence is obvious.

**Accessibility**
- Treat the alert as an interrupting layer that takes focus and clearly conveys its message.
- Ensure the default action is reachable first and focus returns to context when dismissed.
- Give buttons generous, easily tapped targets (about 44pt) and legible, high-contrast text.
- Don't rely on color alone to mark a destructive button — say so in the label.

**Avoid**
- Using an alert when a menu of choices fits the situation better.
- Long titles that wrap past two lines, or alerts that scroll.
- Overusing caution symbols, which dulls their urgency.

**Full reference:** [alerts.md](https://developer.apple.com/design/human-interface-guidelines/alerts)
