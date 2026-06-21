# Context Menus

> A context menu provides quick access to actions relevant to a specific item or view, revealed on demand.

**When to use it:** For frequently used actions tied to a specific item — a row, card, file, or message — supplementing, never replacing, actions available elsewhere.

**Guidelines**
- Include only the most relevant actions; keep the list short (about three separator-delimited groups at most).
- Always expose the same actions elsewhere — a context menu is hidden and not discoverable on its own.
- Support it consistently across similar items; hide unavailable items rather than disabling them.
- Place the most frequent items first; rarely show a title.
- List destructive actions last and style them distinctly.
- Provide either a context menu or an inline edit menu for an item, not both.

**Accessibility**
- Make the menu reachable and operable in a logical order, with a clear way to dismiss and return focus to the item.
- Mark destructive items by their text, not by color alone.
- Give items generous, easily tapped targets (about 44pt).
- Ensure the menu and its items are clearly labeled and perceivable.

**Avoid**
- Putting actions only in a context menu.
- Long menus that scroll, or more than one level of submenu.
- Relying on color alone to signal destructive actions.

**Full reference:** [context-menus.md](https://developer.apple.com/design/human-interface-guidelines/context-menus)
