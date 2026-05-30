# A Space stores only its name and directory; Layout and Agent are per-open choices

A saved Space persists only `{name, directory}`. The Layout and Agent are not part of the Space — they are chosen each time the Space is opened. For convenience they default to the values used the last time *any* Space was opened (an app-wide default, deliberately not stored per Space, since per-Space storage would quietly reintroduce the Space-owns-its-config model this ADR rejects).

This deviates from the obvious "saved workspace remembers your whole setup" expectation, so the reasoning matters:

- A Space's stable identity is *where* you work (name + directory). Layout and Agent are *how you want to work this time* — closer to a per-session choice.
- Changing Layout/Agent after launch is deliberately out of MVP scope. If the Space *owned* its Layout/Agent, the only way to ever change them would be an extra "edit Space" feature. Treating them as per-open choices removes that need entirely: to work differently, just reopen the Space and pick differently.

## Consequences

- Opening a closed Space is "pick Layout + Agent (pre-filled with last used) → run", not a one-click relaunch. Accepted as a minor cost.
- The New Space wizard's first step captures name + directory (the only saved fields); the Layout and Agent steps are launch-time configuration shared with the reopen flow.
