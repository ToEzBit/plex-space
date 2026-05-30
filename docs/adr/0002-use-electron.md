# Use Electron as the application framework

Plex Space is a terminal-centric desktop app: its core job is spawning ptys and rendering live terminals. We chose Electron over Tauri and native Swift.

Why Electron:
- The terminal stack `xterm.js` + `node-pty` is the most mature, battle-tested option for this exact use case (it is what VS Code and Hyper use). Lowest implementation risk.
- Node in the main process makes pty spawning and shell/environment handling straightforward.

Why not the alternatives:
- **Tauri** (Rust + system webview) produces a lighter binary, but pty handling moves to Rust (`portable-pty`) and the terminal-rendering ecosystem is less turnkey — more friction for a terminal-heavy app.
- **Native Swift** (SwiftUI + SwiftTerm) gives the best performance and native feel on macOS, but costs the most effort and a different skill set than web/JS.

## Consequences

We accept Electron's heavier footprint (larger bundle, higher baseline RAM) as the price for the mature terminal ecosystem and faster delivery. Swapping frameworks later would be a near-total rewrite, so this is effectively locked in.
