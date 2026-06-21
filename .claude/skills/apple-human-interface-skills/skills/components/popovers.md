# Popovers

> A popover is a transient view anchored to a control that appears above other content when activated.

**When to use it:** To expose a small amount of related information or a few quick actions tied to a trigger — dropdowns, editing pop-ups, contextual detail views — freeing space versus a persistent panel.

**Guidelines**
- Keep the contents small and limited to a few related tasks.
- Anchor the popover at the element that opened it; don't cover that element or other essential content.
- Auto-dismiss on an outside tap or item selection; keep it open for multi-select until explicitly dismissed.
- Add a Close, Cancel, or Done control only when it adds clarity.
- Show one popover at a time, never cascade them, and place nothing over a popover except an alert.
- Size it just big enough for its contents and animate size changes smoothly.

**Accessibility**
- Provide a clear way to dismiss the popover and return focus to its trigger.
- Convey the relationship between the trigger and the open popover.
- On narrow displays, present the content as a full-screen sheet instead of a small floating layer.
- Give interactive controls generous, easily tapped targets (about 44pt).

**Avoid**
- Using a popover for warnings or critical information — use an alert.
- Discarding user input when a non-modal popover is dismissed by an outside tap.

**Full reference:** [popovers.md](https://developer.apple.com/design/human-interface-guidelines/popovers)
