# Pointer and Hover

> Precise pointing input — moving, hovering, and invoking contextual actions — typical of mouse and trackpad use.

**When to use it:** Desktop, laptop, and hybrid experiences where users expect precision, hover-revealed affordances, and contextual (secondary-click) actions.

**Guidelines**
- Give interactive elements clear hover feedback (a subtle background, tint, or lift) so they read as interactive.
- Show the right cursor for the context: a pointer on clickable things, a text cursor over text, a resize cursor on draggable edges.
- Keep hover effects meaningful — a change on hover should signal that something can be acted on.
- Make hit targets comfortable by extending the clickable area beyond the visible bounds.
- Keep adjacent hit regions contiguous (as in a toolbar) so feedback doesn't flicker as the pointer moves.
- Behave consistently across input modes; pair every hover affordance with an equivalent that keyboard and touch users get.
- Reserve growth or elevation effects for elements with room to move; use subtle tints for tightly packed items.

**Accessibility**
- Never make functionality hover-only — anything revealed on hover must also be reachable by keyboard and touch.
- Provide a visible, reachable alternative to secondary-click menus (such as a "more" control) rather than hiding actions behind right-click.
- Keep hit targets large enough for users with limited motor precision, and ensure every action is reachable by assistive tech.
- Show a visible focus state for the same elements that respond to hover, so non-pointer users see what's interactive.

**Avoid**
- Hover-only menus, tooltips, or controls with no keyboard or touch path.
- Removing the default cursor or focus indication without an equally clear replacement.
- Gratuitous, purely decorative pointer effects that don't signal interactivity.
- Overriding the system's native scroll, swipe, or zoom behaviors.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/pointing-devices)
