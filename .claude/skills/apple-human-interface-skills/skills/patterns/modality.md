# Modality

> Content shown in a dedicated mode that blocks interaction with the rest of the app until people explicitly dismiss it.

**When to use it:** For critical information people must act on, confirming a recent action, a short self-contained task, or a focused, immersive experience such as a media viewer or editor.

**Guidelines**
- Use modality only when there's a clear benefit; it interrupts and demands dismissal.
- Keep modal tasks simple, short, and single-path; avoid deep nested hierarchies.
- Use a full-screen modal for in-depth or complex tasks like media viewing, markup, or editing.
- Always provide an obvious way to dismiss, such as a close control or a familiar cancel gesture.
- Confirm before closing if unsaved content would be lost, offering a clear save or cancel choice.
- Give the modal a clear title naming its task, and show only one modal at a time; never stack alerts.

**Accessibility**
- Give the modal an accessible, descriptive title and a logical reading order.
- Move focus into the modal on open and return it to the triggering control on close.
- Keep focus within the modal while it's open, and support a clear, standard way to dismiss it.
- Ensure the modal's content and controls are legible, high-contrast, and comfortably sized.

**Avoid**
- Overusing modals for non-critical information or routine status.
- Missing or hard-to-find dismiss affordances.
- Multiple simultaneous overlapping modals that bury prior context.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/modality)
