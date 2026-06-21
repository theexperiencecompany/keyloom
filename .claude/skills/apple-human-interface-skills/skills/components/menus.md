# Menus

> A menu reveals a list of commands, options, or states when the user activates a trigger, presenting actions in a space-efficient popup.

**When to use it:** To present commands or options tied to a button or trigger — a dropdown or overflow menu — grouping related actions without consuming persistent screen space.

**Guidelines**
- Write short, clear labels; use a verb for actions, Title Case, and drop articles.
- Append an ellipsis when an item needs more input before completing, such as "Export…".
- List important and frequent items first; group related items with a divider.
- Use icons sparingly and consistently — every item in a group gets one, or none do.
- Show unavailable items as disabled rather than removing them, and keep the menu openable even if all items are disabled.
- Use submenus sparingly — one level, about five items; for toggles use a single item with a changing label or checkmark.
- Keep menus short; allow scrolling only for dynamic or user-generated content.

**Accessibility**
- Clearly convey the menu, its items, and any checked or disabled state.
- Make the menu fully operable in a logical order, with a clear way to dismiss and return focus to the trigger.
- Give items generous, easily tapped targets (about 44pt).
- Ensure adequate contrast and don't signal state by color alone.

**Avoid**
- Using a menu for primary navigation when persistent visibility matters.
- More than one level of submenu.
- Mismatched icon treatment within a group, or relying on pointer-only interaction.

**Full reference:** [menus.md](https://developer.apple.com/design/human-interface-guidelines/menus)
