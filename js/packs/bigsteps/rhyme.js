// Rhyme time: which picture rhymes with this one? From round 3, one wrong picture starts with the
// same sound as the word (cat / car), so she has to listen to the end of the word, not the start.
(function () {
    const { el, pick, shuffle, sample, article, capitalise, firstSound } = LS.ui;
    const { choiceRow } = LS.bigsteps;

    // Each group rhymes. Emoji chosen to render on Windows 10's emoji font.
    const FAMILIES = [
        [['🐱', 'cat'], ['🎩', 'hat'], ['🦇', 'bat'], ['🐀', 'rat']],
        [['🐶', 'dog'], ['🐸', 'frog']],
        [['🐝', 'bee'], ['🌳', 'tree'], ['🔑', 'key']],
        [['🎂', 'cake'], ['🐍', 'snake']],
        [['🌙', 'moon'], ['🥄', 'spoon']],
        [['🚗', 'car'], ['⭐', 'star'], ['🎸', 'guitar']],
        [['🦊', 'fox'], ['📦', 'box']],
        [['🐭', 'mouse'], ['🏠', 'house']],
        [['🐌', 'snail'], ['🐋', 'whale']],
        [['🧦', 'sock'], ['⏰', 'clock']],
        [['🐐', 'goat'], ['⛵', 'boat'], ['🧥', 'coat']],
        [['🚂', 'train'], ['🌧️', 'rain']],
        [['🖊️', 'pen'], ['🔟', 'ten']],
        [['👃', 'nose'], ['🌹', 'rose']],
        [['🐻', 'bear'], ['🍐', 'pear']],
        [['🔔', 'bell'], ['🐚', 'shell']],
    ].map((family, f) => family.map(([e, word]) => ({ e, word, family: f, sound: firstSound(word) })));
    const ALL = FAMILIES.flat();

    LS.registerGame({
        id: 'rhyme',
        title: 'Rhyme time',
        icon: '🎵',
        colour: '#ff70a6',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let lastFamily = null;

            function next() {
                round++;
                const tricky = round >= 3;
                let family;
                do { family = pick(FAMILIES); } while (family[0].family === lastFamily);
                lastFamily = family[0].family;
                const [target, rhyme] = sample(family, 2);

                // Two that don't rhyme, from different groups. Later, one of them starts with the same sound.
                const notRhyming = ALL.filter((w) => w.family !== target.family);
                const others = [];
                if (tricky) {
                    const sh = (w) => w.word.startsWith('sh'); // "shell" doesn't start like "sock"
                    const sameStart = shuffle(notRhyming).find((w) => w.word[0] === target.word[0] && sh(w) === sh(target));
                    if (sameStart) others.push(sameStart);
                }
                while (others.length < 2) {
                    const w = pick(notRhyming);
                    if (!others.some((o) => o.family === w.family)) others.push(w);
                }

                const card = el('div', { class: 'picture-card' }, el('div', { class: 'picture' }, target.e),
                    el('div', { class: 'word' }, target.word));

                const row = choiceRow(shuffle([rhyme, ...others]), {
                    render: (w) => el('span', { class: 'pic' }, w.e),
                    say: (w) => w.word,
                    isRight: (w) => w === rhyme,
                    onRight: (w) => {
                        if (!api.correct(`${capitalise(target.word)}, ${w.word}. They rhyme!`)) api.later(next, 3000);
                    },
                    onWrong: (w) => api.tryAgain(`${capitalise(target.word)}, ${w.word}. Those don't rhyme. Try another one!`),
                });

                stage.replaceChildren(card, row);
                api.prompt(`This is ${article(target.word)} ${target.word}. Which one rhymes with ${target.word}?`);
            }

            next();
        },
    });
})();
