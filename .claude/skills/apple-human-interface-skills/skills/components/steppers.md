# Steppers

> A stepper is a two-segment control for increasing or decreasing a value by a fixed amount.

**When to use it:** Use a stepper for small, precise adjustments to a numeric value, and pair it with an editable field when values can vary widely.

**Guidelines**
- Always show the value adjacent to the stepper; the buttons themselves don't display it.
- Pair the stepper with an editable field so people can type large changes instead of many taps.
- Define a sensible increment plus minimum and maximum bounds, and disable the relevant button at a limit.
- Consider offering a larger jump for wide ranges so people aren't stuck making tiny changes.

**Accessibility**
- Give the increment and decrement controls clear names like "Increase quantity," not just "+" and "−".
- Convey the current value so it's perceivable without sight.
- Provide a visible focus indicator and a logical order between the two controls.
- Ensure each control meets an adequate touch target of roughly 44pt.
- Maintain sufficient contrast for the controls and the displayed value.

**Avoid**
- A stepper with no visible associated value.
- Forcing many taps for large changes with no field to type into.
- Increment controls that lack clear, descriptive names.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/steppers)
