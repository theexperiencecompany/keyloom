# Sliders

> A slider is a track with a draggable thumb that people adjust between a minimum and maximum value.

**When to use it:** Use a slider to select an approximate value from a continuous or stepped range, and pair it with a number field or stepper when precision matters.

**Guidelines**
- Follow the expected direction: minimum at the leading end, maximum at the trailing end (bottom to top if vertical), and fill the track from the minimum to the thumb.
- Add end icons or a label to convey what the slider controls.
- For wide ranges, supplement the slider with a way to type an exact value or step in fixed amounts.
- Give live feedback as the value changes, updating any preview or number in real time.
- Use tick marks or steps to help people target specific values; labeling just the minimum and maximum is often enough.
- Show the current value nearby so it isn't hidden.

**Accessibility**
- Convey the current value and its meaning so it's perceivable without sight.
- Provide a clear label describing what the slider adjusts.
- Ensure the thumb and track meet an adequate touch target of roughly 44pt.
- Provide a visible focus indicator and a logical order among controls.
- Maintain strong contrast for the track, fill, thumb, and any value label.

**Avoid**
- Reversing the conventional minimum-to-maximum direction.
- Using a slider for exact-precision values without a paired numeric input.
- Hiding the current value from the person adjusting it.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/sliders)
