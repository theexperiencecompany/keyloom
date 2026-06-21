# Lists and Tables

> Lists and tables present data in rows, and optionally columns, supporting scanning, selection, navigation, and editing.

**When to use it:** For rows of mostly textual data people scan and read. Use a table for multi-column, sortable data; use a list for single-column hierarchies or navigation.

**Guidelines**
- Prefer lists and tables for text-heavy content; use a grid for image-heavy or size-varying items.
- Keep row text succinct to minimize truncation; reveal long details in a separate view.
- Use descriptive column headings — nouns, Title Case, no trailing punctuation.
- Provide clear selection feedback and allow editing such as reorder, add, and delete when it makes sense.
- Use a disclosure chevron for drill-in and an info affordance only to reveal more detail.
- In tables, let people sort by tapping a header, resize columns, and use alternating row shading when wide.
- Use an outline or tree for hierarchical data rather than a flat table.

**Accessibility**
- Convey row labels, selection state, and available actions clearly to assistive technology.
- Expose meaningful structure — headers, sort state, hierarchy level — so the data is understandable, not just visible.
- Don't rely on color alone for selection — pair it with a checkmark or other indicator.
- Give rows and controls generous, easily tapped targets (about 44pt).

**Avoid**
- Using table structure purely for visual layout.
- Over-tall rows packed with large blocks of text.
- Mixing a trailing alphabetical index with trailing row controls.

**Full reference:** [lists-and-tables.md](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)
