# Progress Indicators

> A progress indicator shows that an app is working during loading or a lengthy operation, optionally estimating the time remaining.

**When to use it:** Show progress whenever an operation takes more than a moment, using a determinate indicator for known-duration tasks and an indeterminate one for unquantifiable work.

**Guidelines**
- Prefer a determinate indicator whenever progress can be measured; report it accurately and evenly, never jumping ahead and then stalling.
- Keep the indicator animating so the app never looks frozen; if work stalls, explain the problem.
- Transition from indeterminate to determinate once duration is known, but don't change the indicator's shape mid-task.
- Use a compact spinner for small or constrained spaces and background work; use a bar for prominent, measurable progress, and keep it in a consistent location.
- Add a short, specific description only when it clarifies what's happening; avoid vague phrasing like "Loading…".
- Offer a way to cancel (and to pause, where losing progress matters), and confirm before canceling if progress would be lost.

**Accessibility**
- Ensure progress text and the indicator itself have sufficient contrast against the background.
- Don't rely on color alone to signal progress or completion; use shape, fill, and position too.
- Convey current progress and status changes clearly so they remain perceivable without sight.
- Keep any interactive controls (cancel, pause, retry) at an adequate touch target of roughly 44pt.
- Respect reduced-motion preferences for spinning or animated indicators.

**Avoid**
- Stationary indicators that make a working app look stalled.
- Labeling a simple spinner when it's already obvious a process has started.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)
