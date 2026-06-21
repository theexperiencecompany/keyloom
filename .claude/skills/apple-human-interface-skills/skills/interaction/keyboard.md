# Keyboard

> Operating and navigating an interface — text entry, activation, and shortcuts — without relying on a pointer.

**When to use it:** Whenever an interface must be fully operable from a keyboard, and when frequent actions (search, save, new, undo) benefit from shortcuts.

**Guidelines**
- Make every interactive element reachable and activatable by keyboard alone, with no dead ends.
- Keep navigation order logical, following the visual reading order; don't fight the natural flow.
- Respect the standard shortcuts users already know (copy, paste, cut, undo, find, save, cancel/close); don't repurpose them.
- Match the platform's expected modifier conventions so shortcuts feel native.
- Reserve custom shortcuts for your most frequent actions; too many makes the interface hard to learn.
- Use directional navigation to move within a composite element (menu, list, grid, tabs), not between separate controls.
- Let a single, consistent gesture dismiss modals, menus, and popovers and return the user to where they were.
- Surface shortcuts where users will find them (menus, tooltips, help) so they're discoverable rather than hidden.

**Accessibility**
- Show a clearly visible focus indicator at every step so keyboard users always know where they are.
- Never trap focus — users must be able to move into and out of every component, including modals.
- Don't make any action depend on a single input mode; keyboard users need a path to everything pointer or touch users have.
- Give feedback that is perceivable, not conveyed by subtle cues alone.

**Avoid**
- Controls that can only be reached or triggered by mouse or touch.
- Overriding or shadowing standard shortcuts with conflicting behavior.
- Forcing an unnatural navigation order that contradicts the visual layout.
- Burying the interface under so many custom shortcuts that it's hard to learn.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/keyboards)
