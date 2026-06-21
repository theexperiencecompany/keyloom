# Action Sheets

> An action sheet presents a set of choices related to an action the user just initiated, typically rising from the screen edge.

**When to use it:** When a user-initiated action needs several related choices — especially to confirm a destructive action while still offering alternatives. Prefer it over an alert when more than a simple confirm/cancel is required.

**Guidelines**
- Trigger an action sheet only in response to an intentional user action.
- Keep the title short (ideally one line); add a message only when it genuinely clarifies the choice.
- Always provide a Cancel choice when an action might destroy data, placed at the bottom.
- Make destructive choices visually prominent and place them at the top.
- Keep the choices few (about three plus Cancel) so the sheet never needs to scroll.

**Accessibility**
- Treat the sheet as a modal layer that takes focus, with a logical reading order through the choices.
- Name destructive choices by their consequence, not by color alone.
- Give every choice a generous, easily tapped target (about 44pt).
- Ensure label text is legible with sufficient contrast.

**Avoid**
- Letting the sheet grow long enough to scroll, which invites accidental selections.
- Announcing a problem the user didn't initiate — that is an alert's job.

**Full reference:** [action-sheets.md](https://developer.apple.com/design/human-interface-guidelines/action-sheets)
