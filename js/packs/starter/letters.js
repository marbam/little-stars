// Which letter does the word start with? Early rounds show the word (letter matching); later rounds hide it.
(function () {
    const { el, sample, shuffle, pick, article, capitalise } = LS.ui;

    // Emoji chosen to render on Windows 10's emoji font.
    const WORDS = [
        ['🍎', 'apple'], ['🐻', 'bear'], ['🍌', 'banana'], ['🐱', 'cat'], ['🚗', 'car'], ['🐶', 'dog'], ['🦆', 'duck'],
        ['🥚', 'egg'], ['🐘', 'elephant'], ['🐟', 'fish'], ['🐸', 'frog'], ['🦊', 'fox'], ['🐐', 'goat'], ['🍇', 'grapes'],
        ['🎩', 'hat'], ['🐴', 'horse'], ['🍦', 'ice cream'], ['🔑', 'key'], ['🐨', 'koala'], ['🦁', 'lion'], ['🍋', 'lemon'],
        ['🐒', 'monkey'], ['🌙', 'moon'], ['🐭', 'mouse'], ['👃', 'nose'], ['🐙', 'octopus'], ['🍊', 'orange'],
        ['🐷', 'pig'], ['🐧', 'penguin'], ['🍐', 'pear'], ['🐰', 'rabbit'], ['🌈', 'rainbow'], ['🚀', 'rocket'],
        ['☀️', 'sun'], ['🐍', 'snake'], ['⭐', 'star'], ['🐢', 'turtle'], ['🚂', 'train'], ['🌳', 'tree'],
        ['☂️', 'umbrella'], ['🚐', 'van'], ['🌋', 'volcano'], ['🐋', 'whale'], ['🐺', 'wolf'], ['🦓', 'zebra'],
    ];

    // Letter names, spelled so the speech voice says them clearly.
    const LETTER_NAMES = {
        a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'gee', h: 'aitch', i: 'eye', j: 'jay',
        k: 'kay', l: 'ell', m: 'em', n: 'en', o: 'oh', p: 'pee', q: 'queue', r: 'ar', s: 'ess', t: 'tee',
        u: 'you', v: 'vee', w: 'double you', x: 'ex', y: 'why', z: 'zed',
    };

    const ALL_LETTERS = [...new Set(WORDS.map(([, w]) => w[0]))];

    LS.registerGame({
        id: 'letters',
        title: 'First letters',
        icon: '🔤',
        colour: '#9d4edd',
        stars: 5,
        start(stage, api) {
            const deck = shuffle(WORDS);
            let round = 0;

            function next() {
                const [emoji, word] = deck[round % deck.length];
                round++;
                const showWord = round <= 3;
                const letter = word[0];
                let done = false;

                const wordEl = el('div', { class: 'word' + (showWord ? '' : ' hidden-word') },
                    el('span', { class: 'first' }, letter), word.slice(1));
                const card = el('div', { class: 'picture-card' }, el('div', { class: 'picture' }, emoji), wordEl);

                const choices = shuffle([letter, ...sample(ALL_LETTERS.filter((l) => l !== letter), 2)]);
                const row = el('div', { class: 'choice-row' }, choices.map((l) => {
                    const btn = el('button', {
                        class: 'choice letter', 'data-say': LETTER_NAMES[l],
                        onClick() {
                            if (done) return;
                            if (l === letter) {
                                done = true;
                                btn.classList.add('right');
                                wordEl.classList.remove('hidden-word');
                                if (!api.correct(`${capitalise(word)} starts with ${LETTER_NAMES[l]}!`)) api.later(next, 2600);
                            } else {
                                btn.classList.add('wrong');
                                btn.disabled = true;
                                api.tryAgain(`That's ${LETTER_NAMES[l]}. ${capitalise(word)}... try another one!`);
                            }
                        },
                    }, l);
                    return btn;
                }));

                stage.replaceChildren(card, row);
                api.prompt(`This is ${article(word)} ${word}. Which letter does ${word} start with?`);
            }

            next();
        },
    });
})();
