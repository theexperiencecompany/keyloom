# Undo and Redo

> Letting people reverse and re-apply recent actions so they can explore and recover from mistakes safely.

**When to use it:** For editors, drawing and design tools, and form-heavy apps, anywhere a destructive or experimental action should be reversible.

**Guidelines**
- Help people predict outcomes: label undo and redo with the specific action ("Undo Typing"), not a bare arrow.
- Show the result of an undo or redo by scrolling to or highlighting the affected content, even if it was offscreen.
- Allow multiple levels back to a logical checkpoint such as opening or the last save; avoid arbitrary limits.
- Batch related micro-changes (repeated small adjustments) into a single undo step, and offer "revert all" when useful.
- Support familiar undo and redo shortcuts, and add visible buttons where discoverability matters, such as touch interfaces.
- For irreversible actions, prefer a brief "Undo" window after the fact over an upfront confirmation prompt.

**Accessibility**
- Make undo and redo controls operable without a pointer and clearly labeled (for example, "Undo Bold").
- Announce the result of an undo so people who aren't watching the screen know what changed.
- Keep undo controls legible, high-contrast, and comfortably sized.

**Avoid**
- Silent undos with no visible result, which lead people to repeat the action thinking it failed.
- Redefining familiar shortcuts or capping undo depth unnecessarily.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo)
