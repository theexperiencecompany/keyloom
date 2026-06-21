# Pop-Up Buttons

> A pop-up button displays a menu of mutually exclusive options and updates to show the current selection.

**When to use it:** Use a pop-up button to choose one value from a flat list of mutually exclusive options when you want to save space and don't need every option visible at once.

**Guidelines**
- Provide a useful default that hints at the available choices and reflects the most likely value.
- Give context with a visible label so people can predict the options before opening the menu.
- Keep the option list flat and mutually exclusive, grouping related items into clear sections when helpful.
- Use a pop-up button for moderate lists; for very long lists, prefer a searchable control instead.
- Optionally include a "Custom…" option to reveal extra inputs only when needed.
- Don't use a pop-up button to trigger actions — use a menu or buttons for that.

**Accessibility**
- Always pair the control with a clear, visible label.
- Convey the currently selected value so it's perceivable without sight.
- Provide a visible focus indicator and a logical order through the options.
- Ensure the control meets an adequate touch target of roughly 44pt.
- Maintain sufficient contrast for the label, selected value, and menu items.

**Avoid**
- Custom controls that don't behave predictably for keyboard or assistive-technology users.
- Using a pop-up button for multi-select or for actions.
- Empty or meaningless default values when a sensible default exists.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons)
