# CLAUDE.md

Guidance for Claude Code (and anyone else) working on this repo.

## Project

**Little Stars** is a set of simple learning games for the owner's 4-year-old, inspired by the Amiga 500's *Fun School 3: For Under 5s*. It runs locally on Windows; it isn't hosted anywhere. The repo is public on GitHub (`marbam/little-stars`).

The current audience is **under 5s who can't read yet**, played on a **Windows PC with a mouse** (no touchscreen). The owner wants to add packs for older children later, which is why games are grouped into packs by age.

## Running and testing

- **Play:** double-click `index.html`. No server, build step or install. Edge is recommended for its "Natural" text-to-speech voices.
- **Test:** `npm install` once, then `npm test`. This runs `tests/smoke.js`, which uses puppeteer-core with the installed Chrome (`C:/Program Files/Google/Chrome/...`). It enters a name, plays every game through to the celebration screen, checks that the star total persists across a reload, and saves screenshots to `tests/shots/` (gitignored). Look at the screenshots after UI changes. The test can't hear audio, so check speech by ear.
- `package.json` exists only for this test tooling. The game itself must keep working with no npm install.

## Architecture

Plain HTML, CSS and JavaScript, with no framework, bundler or ES modules. Scripts are loaded with ordinary `<script>` tags in `index.html` so that opening the file directly (`file://`) works; ES modules would be blocked there. Everything hangs off the global `LS` namespace.

- `js/core/ui.js`: `el()`/`svg()` DOM builders (`onClick`, `style` with `--custom-props`), random helpers, `confetti()`, shared `COLOURS` and `NUMBER_WORDS`.
- `js/core/sound.js`: sound effects generated with Web Audio (no audio files).
- `js/core/speech.js`: `speechSynthesis`, preferring an en-GB voice.
- `js/core/registry.js`: `LS.registerGame()` and `LS.registerPack()`. The README has the game contract.
- `js/core/app.js`: the screens (name → packs, grouped by `ages` → games → game → celebration overlay). It also provides the `api` object handed to each game: `prompt`, `say`, `correct`, `tryAgain`, `finish`, `later`, `onFrame`.
- `js/packs/<pack>/`: one file per game, plus `pack.js`. New pack scripts go in `index.html` before `app.js`.

## Conventions and decisions

- **Everything important is spoken.** Every instruction goes through `api.prompt()` (on-screen text, speech, and the 🔊 repeat button). Menu buttons have `data-say` so they're read aloud on hover. Browsers block audio until the first click, which the name screen provides.
- **No-fail, gentle feedback.** A wrong answer gets a soft sound and "have another go", and the wrong option fades out. There's no score loss, timer or game over.
- **Gentle difficulty ramp within a game.** For example, counting goes from up to 4 to up to 10, letters hide the word after round 3, and shapes add colour from round 4.
- **Timers:** games must use `api.later()` and `api.onFrame()`, not raw `setTimeout`/`requestAnimationFrame`, so everything stops when the player leaves mid-game.
- **Emoji:** the target machine is Windows 10. Avoid newer emoji (Emoji 13+, e.g. 🪼 🫙 🪁) because they won't render.
- **Letter names** are spelled phonetically for the speech engine (`'ay'`, `'bee'`, `'aitch'`, `'zed'`), because TTS reads a bare "a" as the article. UK English throughout (colour, ladybird, zed).
- **Persistence** is `localStorage` only (`ls.name`, `ls.sound`, `ls.stars.<name>`), wrapped in try/catch so it can never break the game.
- Large, mouse-friendly targets; balloons move slowly on purpose.

## Ideas discussed for later

- A pack for older children (adding up, spelling, telling the time).
- Recording the owner's own voice instead of using the computer voice.
- A sticker or reward screen to spend stars on.

## Git

Commit straight to `main`. Don't add a `Co-Authored-By` or other Claude attribution lines to commits.
