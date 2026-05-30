# Open Spaces run in the background until explicitly closed

A Space, once opened, keeps its Terminals (and the Agents running in them) alive even when the user navigates back to the Space list or opens another Space. Multiple Spaces can be open concurrently. Terminals are torn down only when the user clicks "Close Space" or quits the app — never when they merely leave the Space's view.

Why:
- Agents are long-lived, stateful sessions (a Claude Code conversation, a running task). Killing them on navigation would lose that state and force a cold restart on every context switch.
- The user explicitly wants to switch between Spaces while everything stays warm.

## Consequences

- Terminal instances (pty + xterm) must be decoupled from the visible view. The app holds a pool of open Spaces and mounts only the active one's Panes into the window; navigation shows/hides views, it does not create/destroy Terminals.
- Memory and process count grow with the number of open Spaces (each open Space = its full grid of Agents). Accepted; "Close Space" is the user's lever to reclaim resources.
- Two distinct teardown triggers must be wired: "Close Space" (one Space) and app quit (all Spaces). Leaving a view is neither. "Remove from list" deletes a saved (closed) Space and is separate again.
