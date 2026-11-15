# CLAUDE.md

Guidance for Claude Code (and anyone else) working on this repo.

## Project

**Little Stars** is a set of simple learning games for the owner's 4-year-old, inspired by the Amiga 500's *Fun School 3: For Under 5s*. It's mainly played locally on Windows. The repo is public on GitHub (`marbam/little-stars`), and GitHub Pages serves `main` at https://marbam.github.io/little-stars/, so every push to `main` goes live within a couple of minutes. File paths must match case exactly, because Pages is case-sensitive and Windows isn't.

The current audience is **under 5s who can't read yet**, played on a **Windows PC with a mouse** (no touchscreen). Games are grouped into packs by age.

**The child points and an adult clicks.** She sits on a parent's knee and isn't confident with the mouse yet, so new games should test thinking (reading, maths), not mouse skill: big, still answer buttons, no timers or moving targets. Prompts say "point to" or "which one", not "click". The Starter Pack's balloon game is the exception and isn't the model for new games.

## Running and testing

- **Play:** double-click `index.html`. No server, build step or install. Edge is recommended for its "Natural" text-to-speech voices.
- **Test:** `npm install` once, then `npm test`. This runs `tests/smoke.js`, which uses puppeteer-core with the installed Chrome (`C:/Program Files/Google/Chrome/...`). It plays games through to the celebration screen, checks the player picker, buys and places stickers, checks that stars and stickers persist across a reload, fails on any internet request, and saves screenshots to `tests/shots/` (gitignored). Look at the screenshots after UI changes. The test can't hear audio, so check speech by ear.
- **Run only the tests that cover the change.** The full run takes about 6 minutes, so pass part names: `npm test -- dice share` (game ids), `npm test -- bigsteps` (a pack), `welcome` (name screen, picker, saving), `stickers`, `small` (small-screen screenshots). A text or style change to one screen needs only that screen's part (about 10 seconds). Run everything (`npm test`) only after changes to shared code that every game uses, such as `js/core/app.js`'s game api, `ui.js`, `common.js` or broad CSS, and say which parts you ran.
- `package.json` exists only for this test tooling. The game itself must keep working with no npm install.

## Architecture

Plain HTML, CSS and JavaScript, with no framework, bundler or ES modules. Scripts are loaded with ordinary `<script>` tags in `index.html` so that opening the file directly (`file://`) works; ES modules would be blocked there. Everything hangs off the global `LS` namespace.

- `js/core/ui.js`: `el()`/`svg()` DOM builders (`onClick`, `style` with `--custom-props`), random helpers, `confetti()`, shared `COLOURS`, `NUMBER_WORDS` and `LETTER_SOUNDS` (phonic sounds, used by every reading game).
- `js/core/sound.js`: sound effects generated with Web Audio (no audio files).
- `js/core/speech.js`: `speechSynthesis`, preferring an en-GB voice.
- `js/core/registry.js`: `LS.registerGame()` and `LS.registerPack()`. The README has the game contract.
- `js/core/stickers.js`: the sticker book and shop (`LS.stickerBook.open(ctx)`; app.js passes in star and storage functions). Stickers cost 5 stars, specials 10. Placing is point-then-click, never dragging; clicking a placed sticker picks it back up.
- `js/core/app.js`: the screens (player picker / name → packs, grouped by `ages` → games → game → celebration overlay, where the stars won pop in one at a time; packs → sticker book ⇄ shop). It also provides the `api` object handed to each game: `name`, `players`, `prompt` (with an optional different spoken text), `say`, `correct`, `tryAgain`, `finish`, `later`, `wait`, `onFrame`. After the player leaves a game, `later`/`wait`/`say`/`prompt` do nothing, so `await api.wait()` chains just stop.
- `js/packs/<pack>/`: one file per game, plus `pack.js`. New pack scripts go in `index.html` before `app.js`.
  - `starter/` (Under 5s): counting, letters, balloons, shapes, pairs, paint.
  - `bigsteps/` (Ages 4–5): I spy, sound it out, rhyme time, more or less, one more one less, what comes next. `common.js` has `LS.bigsteps.choiceRow()` (big answer buttons; the right one carries `data-right`, which the smoke test uses) and the shared `THINGS` to count and `FRIENDS`.
  - `cleverclogs/` (Ages 4–5): find the number, dotty dice, share it out, word builder, my name, odd one out. Reuses the Big Steps helpers, so its scripts load after that pack. My name uses `api.name` and `api.players`.

## Conventions and decisions

- **Everything important is spoken.** Every instruction goes through `api.prompt()` (on-screen text, speech, and the 🔊 repeat button). Menu buttons have `data-say` so they're read aloud on hover. Browsers block audio until the first click, which the name screen provides.
- **No-fail, gentle feedback.** A wrong answer gets a soft sound and "have another go", and the wrong option fades out. There's no score loss, timer or game over.
- **Gentle difficulty ramp within a game.** For example, counting goes from up to 4 to up to 10, letters hide the word after round 3, and shapes add colour from round 4.
- **Timers:** games must use `api.later()`, `api.wait()` and `api.onFrame()`, not raw `setTimeout`/`requestAnimationFrame`, so everything stops when the player leaves mid-game.
- **Emoji:** the target machine is Windows 10. Avoid newer emoji (Emoji 13+, e.g. 🪼 🫙 🪁) because they won't render.
- **Letters are spoken by their phonic sound**, not their name (`'buh'`, `'ser'`, `'ler'`), as UK schools teach. The spellings in `LETTER_SOUNDS` in `ui.js` were checked against Windows' Hazel voice; it spells out any string with no vowel, so a held "sss" isn't possible. To check a spelling without listening, use PowerShell's `System.Speech` `SpeechSynthesizer` with its `PhonemeReached` event to see the phonemes. Tune by ear with `tests/phonics.html`. Starting words must begin with the letter's short sound (so no "ice cream"), and c and k are never offered together because they sound the same. UK English throughout (colour, ladybird, zed).
- **Nothing leaves the device.** The welcome screen and README promise this, so never add analytics, CDNs, web fonts or any other network request; put assets in the repo (the Andika font is in `fonts/`). The smoke test fails on any non-`file:` request. The only exceptions are the browser's own online voices and GitHub Pages hosting, both disclosed in the note.
- **Persistence** is `localStorage` only (`ls.name` last player, `ls.players` everyone who's played, most recent first, `ls.sound`, `ls.stars.<lowercase name>` (stars left to spend), `ls.stickers.<lowercase name>` (`{ spare: [emoji], pages: { garden|sea|space: [{ e, x, y, r }] } }`, x/y in % of the board)), wrapped in try/catch so it can never break the game.
- Large, mouse-friendly targets; balloons move slowly on purpose.

## Ideas discussed for later

- A pack for older children (adding up, spelling, telling the time).
- Recording the owner's own voice instead of using the computer voice.

## Git

Commit straight to `main`. Don't add a `Co-Authored-By` or other Claude attribution lines to commits.
