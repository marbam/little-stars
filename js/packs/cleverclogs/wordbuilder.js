// Word builder: a picture of a cat with "c _ t" underneath. Which sound is missing?
// Starts with the last sound missing, then the middle (vowel) sound, which is the hardest to hear.
(function () {
    const { el, pick, shuffle, sample, article, capitalise, LETTER_SOUNDS } = LS.ui;
    const { choiceRow } = LS.bigsteps;

    // Three-letter words where every letter makes its simple sound. Emoji chosen to render on Windows 10.
    const WORDS = [
        ['🐱', 'cat'], ['🐶', 'dog'], ['🐷', 'pig'], ['☀️', 'sun'], ['🚌', 'bus'], ['🎩', 'hat'], ['🛏️', 'bed'],
        ['☕', 'cup'], ['🚐', 'van'], ['🗺️', 'map'], ['🦇', 'bat'], ['🕸️', 'web'], ['📌', 'pin'], ['🖊️', 'pen'],
        ['🐀', 'rat'], ['👜', 'bag'], ['🧢', 'cap'], ['🗑️', 'bin'], ['🔟', 'ten'], ['🐛', 'bug'], ['🥫', 'tin'],
    ];
    const VOWELS = ['a', 'e', 'i', 'o', 'u'];
    const ENDINGS = ['t', 'g', 'n', 'p', 's', 'd', 'b', 'm'];
    const SAME_SOUND = { c: 'k', k: 'c' };

    LS.registerGame({
        id: 'wordbuilder',
        title: 'Word builder',
        icon: '🔤',
        colour: '#8338ec',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let lastWord = null;

            function next() {
                round++;
                const gapAt = round <= 2 ? 2 : 1; // last sound first, then the middle one
                let pair;
                do { pair = pick(WORDS); } while (pair === lastWord);
                lastWord = pair;
                const [emoji, word] = pair;
                const missing = word[gapAt];
                const pool = (gapAt === 1 ? VOWELS : ENDINGS).filter((l) => l !== missing && l !== SAME_SOUND[missing]);
                const letters = shuffle([missing, ...sample(pool, 2)]);

                const slots = word.split('').map((l, i) => el('span', { class: 'sound-slot' + (i === gapAt ? ' gap-slot' : ' filled') }, i === gapAt ? '?' : l));
                const card = el('div', { class: 'picture-card' }, el('div', { class: 'picture' }, emoji));
                const sounds = word.split('').map((l) => LETTER_SOUNDS[l]);
                const where = gapAt === 1 ? 'in the middle' : 'at the end';

                const row = choiceRow(letters, {
                    className: 'choice letter',
                    render: (l) => l,
                    say: (l) => LETTER_SOUNDS[l],
                    isRight: (l) => l === missing,
                    onRight: () => {
                        slots[gapAt].textContent = missing;
                        slots[gapAt].classList.remove('gap-slot');
                        slots[gapAt].classList.add('lit');
                        if (!api.correct(`${sounds.join(', ')}... ${word}!`)) api.later(next, 3000);
                    },
                    onWrong: (l) => api.tryAgain(`That one says ${LETTER_SOUNDS[l]}. ${capitalise(word)}... listen for the sound ${where}.`),
                });

                stage.replaceChildren(el('div', { class: 'sound-panel' }, card, el('div', { class: 'sound-word' }, slots)), row);
                api.prompt(`This is ${article(word)} ${word}. Which sound is missing ${where}?`);
            }

            next();
        },
    });
})();
