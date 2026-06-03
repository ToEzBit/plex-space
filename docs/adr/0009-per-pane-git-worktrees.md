# Per-Pane git Worktrees, created by Plex Space (not the Agent)

A Pane may opt into running its Agent inside an isolated git **Worktree** on its own branch, instead of in the Space's directory. Plex Space creates the worktree itself with `git worktree add` and launches the **bare** Agent with the Terminal's `cwd` set to the worktree path. Worktree use is a per-Pane, per-open choice; Panes can be mixed (some on a Worktree, some on the Space's directory) within one Layout.

Why Plex Space owns creation rather than delegating to the Agent:
- **Codex has no worktree flag** (`codex --help`, v0.136.0). Claude Code does (`claude -w, --worktree [name]`), but relying on it would solve only one Agent and leave Codex unsolved.
- `claude --worktree` is an **Agent flag**, which ADR-0005 explicitly put out of MVP ("agents launch with the bare command, no arguments"). Routing through it reopens a closed decision.
- `cwd` is already a per-open input to the launch path (`spacePool.open(spaceId, cwd, layout, agentCommand)`). A Worktree is just a different directory (ADR-0004: a Space is bound to a directory) — so the whole feature reduces to "compute and manage a per-Terminal `cwd`," and is identical for every Agent.

## Considered Options

- **Delegate to `claude --worktree`** — rejected: Agent-specific (no Codex), and reintroduces Agent flags that ADR-0005 deferred.
- **Space-wide worktree** (one branch shared by all Panes) — rejected: with N>1 Panes, N Agents would edit the same files on the same branch and collide. The value of worktrees in a multi-Pane grid is per-Pane isolation.
- **Per-Pane, all-or-nothing toggle** — rejected in favour of per-Pane *individual* control, so a user can keep one Pane on the real repo (tests, `git log`, the base branch) while others run isolated.
- **Keep the worktree branch on close** (`git branch -d`, or never delete) — rejected by the user in favour of force-delete; see the lifecycle decision below.

## Decisions

- **Plex Space owns the worktree.** It runs `git worktree add` before spawning, then launches the bare Agent (consistent with ADR-0001's spawn-shell-then-launch and ADR-0005's bare command). Agent-agnostic.
- **Per-Pane, mixed.** Each Pane independently chooses Worktree on/off. A Layout may freely mix Worktree and non-Worktree Panes.
- **Branch name: default-but-editable.** Each Worktree-Pane gets a suggested name, editable before launch. The default **must not collide with an existing ref** (else it would silently reattach — see below).
- **Base = current HEAD.** New branches fork from wherever the Space's repo is currently checked out (`git worktree add -b <name> <path> HEAD`), not a guessed default branch. Fork base and merge target are independent; integration target is chosen later (matches the user's rebase-onto-main workflow and the `ship-worktree` skill).
- **Location: in-repo, locally ignored.** Worktrees live at `<repo>/.plex-space/worktrees/<branch>`, kept out of `git status` via **`.git/info/exclude`** (local-only) — never by editing the tracked `.gitignore`, so Plex Space creates no diff in the user's committed files.
- **Existing branch → reattach/resume.** At launch, if the branch already exists with no live worktree, attach a worktree to it (no `-b`); if its worktree directory still exists, reuse it as `cwd`; if it's already checked out in another live worktree, block ("already open elsewhere").
- **Resume picker in the wizard.** The per-Pane branch step also lists the **Plex-managed** worktrees (those under `<repo>/.plex-space/worktrees/`, enumerated via `git worktree list --porcelain` filtered by path) so a Worktree-Pane can resume one by clicking instead of retyping its name. Each Worktree-Pane is therefore *either* "new branch `<name>`" *or* "resume `<existing>`". Entries are annotated and gated by state:
  - **clean / dirty** via `git -C <wt> status --porcelain` (the dirty-kept WIP from a previous close is the main resume target).
  - **in-use** — already open in another live Space (known from `SpacePool`, no git call) → shown disabled; a branch can't be checked out in two worktrees.
  - **claimed this launch** — once one Pane in the current wizard resumes a worktree, it is disabled for the other Panes.
  - **empty state** — no managed worktrees → no list; fall back to plain new-branch entry.
- **Close Space lifecycle (discard-experiments model):**
  - Worktree **clean** (`git status --porcelain` empty) → remove the worktree directory **and** `git branch -D` the branch.
  - Worktree **dirty** (uncommitted changes) → keep directory + branch, and warn the user which were kept.
  - Worktrees are treated as throwaway experiments: merge the winner, the rest are nuked on close. Resume is therefore **only** for dirty-kept worktrees, by design.
- **Worktree-creation failure → shell + error, no Agent.** If `git worktree add` fails for a Pane (disk, lock, bad state), that Pane drops to a normal shell in the Space's directory, prints the git error, and does **not** auto-launch the Agent — so a failed isolation never silently runs the Agent on the base branch. Other Panes are unaffected (ADR-0001 ethos).
- **Non-git directory → option hidden.** The Worktree choice is hidden/disabled unless the Space's directory is inside a git work tree.
- **`.worktreeinclude` brings gitignored essentials into new worktrees (via APFS clonefile).** A fresh worktree only contains tracked files, so gitignored runtime needs (`.env`, `node_modules`, `.venv`, …) are missing and the Agent can't build/run. After `git worktree add`, the paths listed in `<repo>/.worktreeinclude` (one literal path per line, `#` comments) are brought over with `cp -c` (APFS **clonefile** / copy-on-write). This is chosen over the alternatives because the app is macOS-only (ADR-0005) and the worktree lives under the repo (always the same APFS volume), so clonefile always succeeds and gives **symlink-speed with copy-isolation**: instant, ~zero disk until written, and an Agent's `npm install` in one worktree does not leak to the main repo or siblings (which a symlink would). Rejected: plain `cp` (copying GBs of `node_modules` per Pane) and symlinks (shared mutation). Best-effort per entry — a missing source or failed clone is skipped, never fatal; only `new` worktrees are populated (resume already has its files); absolute/`..` paths are ignored, and a path already present in the checkout is not overwritten.

## Consequences

- **Per-Terminal `cwd` is now required.** `SpacePool.open` currently spawns every Terminal with one shared `cwd`; this feature needs per-Terminal `cwd` threaded through the pool and IPC. This is the one real architectural change and lifts the previously implicit "every Pane runs in the same Space directory" invariant. Worktree config remains per-open and unsaved, so ADR-0004 (a Space stores only name + directory) holds.
- **`git branch -D` on clean close can lose committed-but-unmerged work.** Accepted, eyes-open, under the discard-experiments model: the user treats "no uncommitted changes" as "done/safe to nuke." Deleted commits survive in the reflog (~30–90 days) until `git gc`, recoverable only by hand.
- **In-repo worktrees are a partial footgun even when ignored.** ripgrep and `git status` respect `.git/info/exclude`, so Claude Code's Grep and git stay clean. But tools that ignore git-ignore rules still recurse into the nested worktree — raw `find`, broad test/build globs (`pytest`, `jest`, `tsc`), and especially **`git clean -fdx`** in the main Pane (which will try to wipe the nested worktree). Recorded so it isn't mistaken for a bug.
- **Default branch names must be generated against existing refs.** Because an existing branch silently reattaches, an auto-default that happens to match a user's unrelated pre-existing branch would hijack it. Generate defaults that avoid existing refs, or confirm reattach rather than doing it silently.
- **Resume is intentionally narrow.** Reattach/resume only reaches worktrees left dirty at close; committed-and-clean worktrees are gone. This is a direct consequence of the discard-experiments lifecycle, not an oversight — so the resume picker will, in practice, list mostly dirty WIP plus anything currently open in another Space.
- **The resume picker reads git per worktree.** Computing each entry's clean/dirty state is one `git status` call per managed worktree, run when the wizard step opens. Fine for the handful expected; if it ever grows, it should be async/cached rather than blocking the step.
