# Buttons

> A button initiates an instantaneous action, combining style, content, and a semantic role.

**When to use it:** To trigger an action such as submit, save, delete, or open a dialog. Use a navigation element instead when the result is simply moving to another screen or destination.

**Guidelines**
- Use one prominent, primary style per view for the most likely action; keep the others lighter.
- Distinguish the preferred option with style, not size; keep buttons in a set the same size.
- Start text labels with a verb ("Add to Cart"); use familiar icons for familiar actions.
- Provide clearly distinct hover, focus, pressed, and disabled appearances.
- Style destructive actions distinctly and never make a destructive button the default that responds to the return key.
- For slow actions, show progress within the button and consider swapping the label.

**Accessibility**
- Give every button a clear, descriptive name; icon-only buttons especially need a spoken label.
- Show a visible focus indication and keep focus order logical.
- Make targets generous and easily tapped (about 44pt) and don't pack them tightly.
- Don't rely on color alone to signal a button's state or role.

**Avoid**
- Multiple competing prominent buttons in one view.
- Removing the visible focus indication.
- Tiny or tightly packed tap targets.

**Full reference:** [buttons.md](https://developer.apple.com/design/human-interface-guidelines/buttons)
