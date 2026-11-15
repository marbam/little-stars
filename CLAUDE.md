# CLAUDE.md

Guidance for Claude Code (and anyone else) working on this repo. Keep this file up to date: whenever something is added or decided, record it here so a new session can pick up where the last one left off.

## Project

**Little Stars** is a set of simple learning games for the owner's daughter (nearly 4), inspired by the Amiga 500's *Fun School 3: For Under 5s*. It's played on a **Windows 10 PC with a mouse** (no touchscreen), in the **Brave** browser, which uses Windows' built-in British voice *Hazel*. The owner has also shared it with a friend whose child is a similar age.

- **Repo:** public on GitHub, `marbam/little-stars`.
- **Live site:** GitHub Pages serves `main` at https://marbam.github.io/little-stars/. Every push to `main` goes live within a couple of minutes. Browsers may show a cached copy for up to 10 minutes, so Ctrl+F5 to see changes. File paths must match case exactly, because Pages is case-sensitive and Windows isn't.
- **Offline:** download the ZIP from GitHub, extract it, and double-click `index.html`. No server, build step or install.

**The child points and an adult clicks.** She sits on a parent's knee and isn't confident with the mouse yet, so games test thinking (reading, maths, reasoning), not mouse skill: big, still answer buttons, no timers or moving targets. Prompts say "point to" or "which one", not "click". The Starter Pack's balloon game is the exception and isn't the model for new games.

## Current state

Three packs of six games each, plus a sticker book. Every game has 5 rounds and awards 5 stars (Colour in awards 1).

| Pack (folder, `ages` heading) | Games (id: title) |
| --- | --- |
| Starter Pack (`starter/`, Under 5s) | counting: Count with me · letters: First letters (phonics) · balloons: Pop the balloons · shapes: Find the shape · pairs: Find the pairs · paint: Colour in |
| Big Steps Pack (`bigsteps/`, Ages 4–5) | ispy: I spy · soundout: Sound it out (blending) · rhyme: Rhyme time · moreless: More or less · onemore: One more, one less · pattern: What comes next? |
| Clever Clogs Pack (`cleverclogs/`, Ages 4–5) | findnumber: Find the number · dice: Dotty dice · share: Share it out · wordbuilder: Word builder · myname: My name · oddoneout: Odd one out |

The README has a table describing what each game teaches and how it gets harder.

Other features: a player picker on the first screen (each child has their own stars and stickers), a privacy note on that screen, stars that pop in one at a time on the celebration screen, and a sticker shop and book (garden, sea and space pages).

## How the owner likes to work

- **Ideas first.** For a new pack or feature, outline the games or design for the owner to vet before building. Spare ideas they like but don't pick go into "Ideas for later" below.
- **Build, then the owner plays it, then commit.** Don't commit or push until the owner has tried it and asked. Then commit straight to `main` and push.
- **Commits:** don't add a `Co-Authored-By` or any other Claude attribution line.
- **Explain in plain terms** what changed and what to check by ear (the test can't hear audio).

## Running and testing

- **Test:** `npm install` once, then `npm test`. This runs `tests/smoke.js`, which uses puppeteer-core with the installed Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`). It plays games through to the celebration screen, checks the player picker, buys and places stickers, checks that stars and stickers persist across a reload, fails on any internet request, prints PASSED or FAILED (and exits 1 on failure), and saves screenshots to `tests/shots/` (gitignored). Look at the relevant screenshots after UI changes.
- **Run only the tests that cover the change.** The full run takes about 6 minutes, and the owner asked not to run it for small changes. Pass part names: game ids (`npm test -- dice share`), a pack (`npm test -- bigsteps`), `welcome` (name screen, picker, saving; about 8 seconds), `stickers`, or `small` (small-screen screenshots). Run everything only after changes to shared code that every game uses, such as the game `api` in `app.js`, `ui.js`, `common.js` or broad CSS. Tell the owner which parts you ran.
- **`tests/phonics.html`:** open in a browser to hear every letter sound and try different spellings for `LETTER_SOUNDS`.
- `package.json` exists only for the test tooling. The game itself must keep working with no npm install.

## Architecture

Plain HTML, CSS and JavaScript, with no framework, bundler or ES modules. Scripts are loaded with ordinary `<script>` tags in `index.html` so that opening the file directly (`file://`) works; ES modules would be blocked there. Everything hangs off the global `LS` namespace. Script order in `index.html`: core files, then each pack (Starter, Big Steps, Clever Clogs), then `app.js` last.

- `js/core/ui.js`: `el()`/`svg()` DOM builders (`onClick`, `style` with `--custom-props`), random helpers, `confetti()`, shared `COLOURS`, `NUMBER_WORDS`, `LETTER_SOUNDS` (phonic sounds, used by every reading game) and `firstSound(word)`.
- `js/core/sound.js`: sound effects generated with Web Audio (no audio files): `click`, `flip`, `splash`, `pop`, `oops`, `cheer`, `fanfare`, and `ding(step)` (rising pitch, used for counting stars in).
- `js/core/speech.js`: `speechSynthesis`, preferring an en-GB voice (Edge "Natural", then Google UK English Female, then Hazel and others).
- `js/core/registry.js`: `LS.registerGame()` and `LS.registerPack()`. The README has the game contract.
- `js/core/stickers.js`: the sticker book and shop (`LS.stickerBook.open(ctx)`; app.js passes in star and storage functions). 46 stickers cost 5 stars and 6 specials cost 10. Placing is point-then-click, never dragging; clicking a placed sticker picks it back up.
- `js/core/app.js`: the screens.
  - **Flow:** player picker (or name box) → packs (grouped by `ages`, with a 📒 Stickers button) → a pack's games → game → celebration overlay (stars pop in with dings, then the jar total, then Again / More games / Stickers). Packs → sticker book ⇄ shop.
  - **`privacyNote()`:** shown on the first screen.
  - **`screenLater()`:** timers for non-game screens, cleared by `leave()`.
  - **The `api` handed to each game:**
    - `name` and `players`: the current player and everyone who has played.
    - `prompt(text, spoken = text)`: shown at the top, spoken, and repeated by 🔊. Pass `spoken` when the speech should differ, e.g. show "s", say "ser".
    - `say(text)`.
    - `correct(message)`: returns true on the last star.
    - `tryAgain(message)`: returns a promise that resolves when the message has been spoken.
    - `finish(message)`.
    - `later(fn, ms)`, `wait(ms)` and `onFrame(fn)`.
    - After the player leaves a game, `later`, `wait`, `say` and `prompt` do nothing, so `await api.wait()` chains just stop.
- `js/packs/<pack>/`: one file per game, plus `pack.js`.
  - `bigsteps/common.js`:
    - `LS.bigsteps.choiceRow(options, { render, isRight, onRight, onWrong, say, className })` builds the big answer buttons. The right one carries `data-right`, which the smoke test uses to find the answer.
    - Shared `THINGS` (things to count), `plural()` and `FRIENDS` (Teddy, Bunny, Monkey, Puppy).
  - **Clever Clogs** reuses the Big Steps helpers, so its scripts load after that pack.
- `favicon.svg`: the browser-tab icon (a smiling yellow star on the coral logo colour), linked from `index.html`.
- `fonts/`: the Andika font (designed for early readers; SIL Open Font License in `fonts/OFL.txt`), latin and latin-ext subsets in weights 400 and 700, declared at the top of `css/style.css`.

### Adding a game (checklist)

1. Create `js/packs/<pack>/<id>.js` calling `LS.registerGame({ id, title, icon, colour, stars: 5, start(stage, api) })`. In newer packs, use `choiceRow` so the right answer gets `data-right`.
2. Add the id to the pack's `pack.js` `games` list.
3. Add a `<script>` tag to `index.html`, before that pack's `pack.js` and before `app.js`.
4. Add the id to `PACKS` at the top of `tests/smoke.js`. Games that don't use `data-right` need their own player in the `STARTER`-style object there.
5. Add a row to the pack's table in `README.md`, and update "Current state" above.
6. Run just that game's test: `npm test -- <id>`.

A new pack also needs its own `pack.js` (with `ages`), its own section in `index.html`, a `PACKS` entry in the test, and a README section.

## Conventions and decisions

- **Everything important is spoken.** Every instruction goes through `api.prompt()`. Menu buttons have `data-say` so they're read aloud on hover. In the newer packs, answer pictures also say their name on hover (to help the adult name them). Browsers block audio until the first click, which the name screen provides.
- **No-fail, gentle feedback.** A wrong answer gets a soft sound and "have another go", and the wrong option fades out. There's no score loss, timer or game over. After a right answer, explain why where it helps ("The car isn't a fruit!").
- **Gentle difficulty ramp within a game** over its 5 rounds. Each game file's header comment says how it ramps.
- **Timers:** games must use `api.later()`, `api.wait()` and `api.onFrame()`, not raw `setTimeout`/`requestAnimationFrame`, so everything stops when the player leaves mid-game. When a game plays a sequence of sounds, use a token so a newer sequence stops an older one (see `soundout.js`).
- **Emoji:** the target machine is Windows 10. Avoid newer emoji (Emoji 13+, e.g. 🪼 🫙 🪁) because they won't render. Prefer long-established ones.
- **Letters are spoken by their phonic sound**, not their name (`'buh'`, `'ser'`, `'ler'`), as UK schools teach.
  - **Hazel spellings:** the spellings in `LETTER_SOUNDS` in `ui.js` were checked against Windows' Hazel voice. Hazel spells out any string with no vowel ("sss" becomes "ess ess ess"), so a held "sss" isn't possible. The odd spellings are deliberate: "aeh" is the only spelling found that gives a short i.
  - **Checking a spelling without listening:** use PowerShell's `System.Speech.Synthesis.SpeechSynthesizer` with the "Microsoft Hazel Desktop" voice and its `PhonemeReached` event to see the phonemes.
  - **Word choice:** words must begin with their letter's short sound (so no "ice cream" or "Isla"-style long vowels), and c and k are never offered together because they sound the same.
  - **Spelling:** UK English throughout (colour, ladybird, zed, biscuit).
- **Nothing leaves the device.** The welcome screen and README promise this, so never add analytics, CDNs, web fonts or any other network request; put assets in the repo. The smoke test fails on any non-`file:` request. The only exceptions are the browser's own online voices (Edge "Natural" and Chrome "Google" voices send the spoken text, including the child's name, to Microsoft or Google) and GitHub Pages hosting logs, both disclosed in the note and the README's Privacy section.
- **Persistence** is `localStorage` only, wrapped in try/catch so it can never break the game:
  - `ls.name`: the last player.
  - `ls.players`: everyone who has played, most recent first. Older players are picked up from their `ls.stars.*` keys.
  - `ls.sound`.
  - `ls.stars.<lowercase name>`: stars left to spend.
  - `ls.stickers.<lowercase name>`: `{ spare: [emoji], pages: { garden|sea|space: [{ e, x, y, r }] } }`, with x and y in % of the board.
- Large, mouse-friendly targets; balloons move slowly on purpose.

## Ideas for later

- A pack for older children (adding up, spelling, telling the time).
- Recording the owner's own voice instead of using the computer voice. This would also fix the letter sounds, which the computer voices can only approximate.
- An option to use only on-device voices (e.g. Hazel), so no spoken text goes to Microsoft or Google. This was offered when the privacy note was added; the owner hasn't decided. The trade-off is that Edge and Chrome sound more robotic.

## Environment notes (owner's Windows PC)

- **Pushing:** plain `git push` fails with "SSL certificate problem: unable to get local issuer certificate". Use `git -c http.sslBackend=schannel push origin main`. The owner may set `git config --global http.sslBackend schannel` to fix it permanently.
- **`gh`** is installed and logged in as `marbam` (used to set up GitHub Pages: `gh api repos/marbam/little-stars/pages`).
- **Shells:** the Bash tool runs an old Git Bash (4.4) that refuses complex commands (heredocs with backticks, arrays). Prefer the PowerShell tool, or write a script to the scratchpad and run it with `node`.
- **Patching files with Node scripts:** use `split(a).join(b)` rather than `replace()`, whose replacement string treats `$$` specially (it turned `page.$$` into `page.$`).
