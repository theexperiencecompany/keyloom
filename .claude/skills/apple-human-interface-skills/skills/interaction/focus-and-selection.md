# Focus and Selection

> Focus marks the single element an interaction will target; selection marks the item or items a user has chosen to act on.

**When to use it:** Any interface navigated by keyboard or remote; lists, grids, menus, and tabs that need directional navigation; and dynamic views where focus must move or be restored.

**Guidelines**
- Rely on familiar, expected focus behavior wherever possible; introduce custom handling only when truly needed.
- Never move focus without a user action — except to keep it sensible when the focused element disappears.
- When a modal or dialog opens, move focus into it; when it closes, return focus to whatever opened it.
- Indicate focus with a ring for individual controls and a highlight for an item within a list or collection.
- Make focus order follow reading order, and group related controls so directional navigation stays within a logical area.
- Distinguish focus from selection: focusing an item shouldn't activate it if that causes a jarring shift; require an explicit confirmation.
- Style selected items distinctly from focused ones so the two states are never confused.

**Accessibility**
- Always keep a clearly visible focus indicator; never remove it without an equally visible replacement.
- Ensure the indicator has enough contrast and isn't clipped or hidden behind other elements.
- Manage focus in dynamic interfaces so it never lands on a hidden element or gets lost, and make focus changes perceivable to assistive tech.
- Keep readable text selectable with adequate contrast; don't disable selection on content users may want to copy.

**Avoid**
- Removing or suppressing the focus indicator, leaving keyboard users unsure where they are.
- Stealing or resetting focus in the middle of a user's task.
- Auto-activating a focused item when doing so triggers a disruptive context shift.
- Conveying selection by color alone, with no perceivable state for assistive tech.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)
