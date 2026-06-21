# Managing Accounts

> Authentication and account flows that let people reach their content without becoming a barrier to entry.

**When to use it:** Only when core functionality genuinely requires an account; otherwise let people use the experience anonymously.

**Guidelines**
- Require an account only when necessary, and delay sign-in as long as possible so people can browse or try first.
- Explain the benefits of an account in the sign-in view, kept brief and friendly.
- Prefer modern, low-friction sign-in (passkeys or trusted federated providers) over passwords; if you use passwords, encourage strong second-factor protection.
- Name the sign-in method clearly rather than a generic "Sign In," and show only methods actually available to the person.
- Never prepopulate a password field; let the platform fill saved credentials.
- Provide a clear in-app path to delete the account, not just deactivate it, and don't bury it in legal text.
- Tell people when deletion will complete, confirm when it's done, and explain how billing or cancellation relates to deletion.

**Accessibility**
- Make sign-in controls clearly labeled and operable in a logical order.
- Announce error states so people using assistive technology learn of them promptly.
- Keep sign-in fields and buttons legible, high-contrast, and large enough to target comfortably.

**Avoid**
- Forcing sign-in before any value is shown.
- Prefilling passwords, generic button labels, or hiding account deletion.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/managing-accounts)
