# Combo Boxes

> A combo box combines a text field with a dropdown list, so people can type a custom value or pick from predefined options.

**When to use it:** When people may type a free-form value or choose from likely options — autocomplete and filterable suggestion lists. Use a plain selection control when only predefined options are valid.

**Guidelines**
- Populate with a meaningful default value that hints at the available choices.
- Use a visible label so people know what kind of items to expect.
- Offer relevant choices while still allowing a custom typed value; filter the list as the user types.
- Keep list items no wider than the field so they don't truncate awkwardly.
- Remember a typed custom value isn't added to the predefined list.

**Accessibility**
- Make the control fully operable in a logical order: move through options, choose, dismiss, and filter by typing.
- Clearly convey the expanded state and which option is currently active.
- Associate a clear label with the field.
- Make targets generous and easily tapped (about 44pt).

**Avoid**
- A combo box that can't be navigated or dismissed without a pointer.
- Hiding the affordance that suggestions exist.
- List items wider than the input that get truncated.

**Full reference:** [combo-boxes.md](https://developer.apple.com/design/human-interface-guidelines/combo-boxes)
