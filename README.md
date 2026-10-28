# Little Stars

A collection of simple, friendly learning games for young children, inspired by the Amiga's *Fun School 3: For Under 5s*. Everything is spoken aloud, so the player doesn't need to read yet. There's no way to fail: wrong answers get a gentle "have another go", and right answers get stars, cheers and confetti.

## Running it

Double-click `index.html`. It opens in your browser, works offline and needs nothing installed.

- **Microsoft Edge is recommended.** Its built-in "Natural" voices (e.g. *Libby*, *Sonia*) sound far nicer than the older robotic ones. Chrome works too.
- Press the 🖥️ button (or F11) for full screen, which stops little hands clicking on browser tabs.
- The child's name and their star total are saved in the browser's local storage.

## Starter Pack (Under 5s)

| Game | What it teaches |
| --- | --- |
| 🍎 Count with me | Counting 1–10. Clicking each object counts it out loud. |
| 🔤 First letters | Letter recognition and initial letters. The word is shown at first and hidden in later rounds. |
| 🎈 Pop the balloons | Colours and mouse control. Pop three balloons of the colour asked for. |
| 🔺 Find the shape | Shapes, then shape + colour together ("the red triangle"). |
| 🃏 Find the pairs | Memory, with animals that say their names. |
| 🎨 Colour in | Free colouring of three pictures. Says each colour's name. |

## How it's built

Plain HTML, CSS and JavaScript with no build step and no frameworks. See `CLAUDE.md` for design decisions and conventions.

To run the automated check (plays every game in headless Chrome and saves screenshots to `tests/shots/`): `npm install` then `npm test`.

```
index.html              loads every script, in order
css/style.css
js/core/ui.js           DOM + random helpers, shared colours
js/core/sound.js        sound effects generated with Web Audio (no audio files)
js/core/speech.js       text-to-speech (browser speechSynthesis)
js/core/registry.js     LS.registerGame / LS.registerPack
js/core/app.js          screens: name -> packs -> games -> game -> celebration
js/packs/starter/*.js   one file per game, plus pack.js
```

### Adding a new pack

1. Create `js/packs/<pack-id>/` with one file per game. Each game calls:

   ```js
   LS.registerGame({
       id: 'my-game', title: 'My game', icon: '🦕', colour: '#3a86ff',
       stars: 5,                       // stars needed to finish (0 = call api.finish() yourself)
       start(stage, api) {
           api.prompt('Shown at the top and spoken aloud');
           // build the game inside `stage`...
           // on a right answer:  if (!api.correct('Optional message')) api.later(nextRound, 2400);
           // on a wrong answer:  api.tryAgain('Optional message');
           // return an optional cleanup function
       },
   });
   ```

   Always use `api.later(fn, ms)` and `api.onFrame(fn)` rather than raw `setTimeout`/`requestAnimationFrame`, so everything stops cleanly when the player leaves a game.

2. Add a `pack.js` that calls `LS.registerPack({ id, title, ages: 'Ages 5–7', icon, colour, games: [...] })`. Packs are grouped on the menu by their `ages` label.
3. Add the new `<script>` tags to `index.html`, before `js/core/app.js`.
