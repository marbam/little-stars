# Little Stars

A collection of simple, friendly learning games for young children, inspired by the Amiga's *Fun School 3: For Under 5s*. Everything is spoken aloud, so the player doesn't need to read yet. There's no way to fail: wrong answers get a gentle "have another go", and right answers get stars, cheers and confetti.

**▶ Play it online: https://marbam.github.io/little-stars/**

## Running it

Open the link above, or download the repo (green **Code** button → **Download ZIP**), extract it, and double-click `index.html`. It opens in your browser, works offline and needs nothing installed.

- **Microsoft Edge is recommended.** Its "Natural" voices (e.g. *Libby*, *Sonia*) sound far nicer than the older robotic ones, though they're online voices (see Privacy below). Chrome works too.
- Press the 🖥️ button (or F11) for full screen, which stops little hands clicking on browser tabs.
- Each child's name, stars and stickers are saved in the browser's local storage. Anyone who has played before just picks their name on the first screen.
- **Stickers:** finishing a game wins stars. Spend them in the sticker shop (📒 Stickers, on the packs screen or after a game): 5 stars a sticker, 10 for the special ones. Then pick a sticker and point to where it goes on the garden, sea or space page. Click a stuck sticker to pick it up again.

The games are designed for a child who points while a grown-up clicks: answers are big and still, with no timers.

## Privacy

Little Stars doesn't collect any data. Names, stars and stickers are saved only in your browser's local storage on your own device, and the game never sends anything anywhere: it has no accounts, analytics, adverts or cookies, and everything it uses (including the font) comes from this folder. The automated test fails if the game ever requests anything from the internet.

Two things are outside the game's control:

- **Voices:** speech comes from your web browser. Some browsers' online voices (Edge's "Natural" voices, Chrome's "Google" voices) send the words being read out, which can include the child's name, to Microsoft or Google to be spoken. Voices built into Windows (e.g. *Hazel*), as used by Brave, work entirely on the device.
- **Hosting:** the online version is served by GitHub Pages, which, like any web host, may keep standard visit logs such as IP addresses. Downloading the ZIP and playing offline avoids this.

## Starter Pack (Under 5s)

| Game | What it teaches |
| --- | --- |
| 🍎 Count with me | Counting 1–10. Clicking each object counts it out loud. |
| 🔤 First letters | Letter sounds (phonics): which sound does the word start with? Letters are spoken by their sound ("buh", "mmm"), not their name. The word is shown at first and hidden in later rounds. |
| 🎈 Pop the balloons | Colours and mouse control. Pop three balloons of the colour asked for. |
| 🔺 Find the shape | Shapes, then shape + colour together ("the red triangle"). |
| 🃏 Find the pairs | Memory, with animals that say their names. |
| 🎨 Colour in | Free colouring of three pictures. Says each colour's name. |

## Big Steps Pack (Ages 4–5)

| Game | What it teaches |
| --- | --- |
| 👀 I spy | Initial sounds: "something beginning with *ser*", find the picture. Later rounds add a similar-sounding picture. |
| 🧩 Sound it out | Blending: hear "c… a… t", find the cat. From round 3 the letters light up as each sound is said. |
| 🎵 Rhyme time | Which picture rhymes? Later rounds add a picture that starts the same but doesn't rhyme. |
| ⚖️ More or less | Which plate has more (or fewer)? Gaps get smaller, and later the smaller group is drawn bigger. |
| ➕ One more, one less | Early adding and taking away with fruit on a plate. Tap the fruit to count it. |
| 🔁 What comes next? | Patterns: AB, AAB, ABB, ABC with fruit, animals, vehicles and colours. |

## Clever Clogs Pack (Ages 4–5)

| Game | What it teaches |
| --- | --- |
| 🔢 Find the number | Reading numbers: "point to number 7". Goes up to 10, then uses lookalikes (6 / 9, 1 / 7). |
| 🎲 Dotty dice | Seeing how many without counting. The dice turns over after a moment; "Look again" shows it again. Ends with two dice. |
| 🍬 Share it out | Sharing fairly: give out sweets one each in turn, then say how many each friend has. Ends with one left over. |
| 🔤 Word builder | Which sound is missing from c _ t? The end sound first, then the middle sound. |
| 📛 My name | Reading your own name: find it, fill in a missing letter, then build it from jumbled letters. |
| 🧐 Odd one out | Sorting: which doesn't belong? By kind of thing, then colour, shape and how many. |

## How it's built

Plain HTML, CSS and JavaScript with no build step and no frameworks. See `CLAUDE.md` for design decisions and conventions.

To run the automated check (plays every game in headless Chrome and saves screenshots to `tests/shots/`): `npm install` then `npm test`. That takes a few minutes; to test just part of it, name the parts, e.g. `npm test -- dice share`, `npm test -- bigsteps` or `npm test -- welcome stickers` (the list is at the top of `tests/smoke.js`).

```
index.html              loads every script, in order
css/style.css
js/core/ui.js           DOM + random helpers, shared colours, letter sounds
js/core/sound.js        sound effects generated with Web Audio (no audio files)
js/core/speech.js       text-to-speech (browser speechSynthesis)
js/core/registry.js     LS.registerGame / LS.registerPack
js/core/stickers.js     sticker book and shop
js/core/app.js          screens: name -> packs -> games -> game -> celebration
js/packs/starter/*.js   one file per game, plus pack.js
js/packs/bigsteps/*.js  Ages 4–5 pack (common.js has helpers the next pack reuses too)
js/packs/cleverclogs/*.js  the second Ages 4–5 pack
tests/phonics.html      listen to and tune the phonic sounds
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

   Always use `api.later(fn, ms)`, `await api.wait(ms)` and `api.onFrame(fn)` rather than raw `setTimeout`/`requestAnimationFrame`, so everything stops cleanly when the player leaves a game. `api.prompt(text, spoken)` can show one thing and say another (e.g. show "s", say "ser").

2. Add a `pack.js` that calls `LS.registerPack({ id, title, ages: 'Ages 5–7', icon, colour, games: [...] })`. Packs are grouped on the menu by their `ages` label.
3. Add the new `<script>` tags to `index.html`, before `js/core/app.js`.
