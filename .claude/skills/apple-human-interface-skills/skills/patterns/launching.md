# Launching

> The startup experience from open to first interactive screen, ideally feeling instant.

**When to use it:** Every app or page load is a launch moment to optimize; use a brief branding or placeholder screen only to bridge the wait, never as an ad.

**Guidelines**
- Make launch feel instant; people don't want to wait more than a moment or two.
- Show a placeholder layout that closely matches the first real screen to avoid jarring flashes and shifts.
- Match the placeholder to the device's current theme and orientation.
- Avoid text in the placeholder; it can't be localized and may flash when real content swaps in.
- Don't treat the launch screen as a branding or "About" moment; keep it minimal.
- Restore previous state on return (scroll position, open views, in-progress input) so people continue where they left off.
- Defer large or non-essential content so the first screen is ready fast.

**Accessibility**
- Don't let the placeholder trap focus or read out noise; keep it out of the way of assistive technology until real content loads.
- Move focus to meaningful content once it loads, and respect reduced-motion preferences for any launch animation.

**Avoid**
- Showing a splash screen or logo on every launch.
- Placeholder layouts that visibly shift when the real content arrives.
- Blocking the first screen on large downloads.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/launching)
