# Disclosure Controls

> Controls that reveal or hide related information or functionality, keeping advanced or secondary content out of the way until it's needed.

**When to use it:** To progressively reveal advanced options or details, or to expand nested hierarchy inline such as folders and outline rows.

**Guidelines**
- Hide details until they're relevant; keep the most-used controls visible and tuck advanced ones behind disclosure.
- Provide a descriptive label that says what will be revealed, not a bare arrow.
- For inline hierarchy, point the triangle right when collapsed and down when expanded, on the leading edge.
- For a section attached to a control, point down when collapsed and up when expanded, next to its content.
- Use at most one section-expanding disclosure control per view.
- Establish a clear visual relationship between the toggle and the content it reveals.

**Accessibility**
- Clearly convey the expanded or collapsed state along with the label.
- Make the control operable in a logical focus order, not by pointer alone.
- Respect reduced motion for the expand and collapse transition.
- Ensure the control has a generous, easily tapped target and adequate contrast.

**Avoid**
- Bare chevrons or arrows with no descriptive label.
- Multiple competing section-expanding controls in one view.
- Placing expanded content visually far from its control.

**Full reference:** [disclosure-controls.md](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls)
