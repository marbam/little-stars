// I spy something beginning with... The reverse of First letters: hear a sound, find the picture.
// Starts with three pictures with very different sounds, then four pictures including a similar-sounding one.
(function () {
    const { el, pick, shuffle, sample, article, capitalise, firstSound } = LS.ui;
    const { choiceRow } = LS.bigsteps;

    // Every word starts with its letter's short sound (no "ice cream", "knife" or "cheese").
    // Emoji chosen to render on Windows 10's emoji font.
    const WORDS = [
        ['🍎', 'apple'], ['🐜', 'ant'], ['🐻', 'bear'], ['🍌', 'banana'], ['🚌', 'bus'], ['🐝', 'bee'],
        ['🐱', 'cat'], ['🚗', 'car'], ['🎂', 'cake'], ['🐮', 'cow'], ['🐶', 'dog'], ['🦆', 'duck'],
        ['🥚', 'egg'], ['🐘', 'elephant'], ['🐟', 'fish'], ['🐸', 'frog'], ['🦊', 'fox'],
        ['🐐', 'goat'], ['🍇', 'grapes'], ['🎩', 'hat'], ['🐴', 'horse'], ['🏠', 'house'], ['🐛', 'insect'],
        ['🔑', 'key'], ['🐨', 'koala'], ['🦁', 'lion'], ['🍋', 'lemon'], ['🍃', 'leaf'],
        ['🐒', 'monkey'], ['🌙', 'moon'], ['🐭', 'mouse'], ['👃', 'nose'], ['🐙', 'octopus'],
        ['🐷', 'pig'], ['🐧', 'penguin'], ['🍐', 'pear'], ['🐰', 'rabbit'], ['🌈', 'rainbow'], ['🚀', 'rocket'],
        ['☀️', 'sun'], ['🐍', 'snake'], ['🧦', 'sock'], ['🐯', 'tiger'], ['🚂', 'train'], ['🌳', 'tree'],
        ['☂️', 'umbrella'], ['🚐', 'van'], ['🌋', 'volcano'], ['🎻', 'violin'], ['🐋', 'whale'], ['🐺', 'wolf'],
        ['⌚', 'watch'], ['🦓', 'zebra'],
    ].map(([e, word]) => ({ e, word, sound: firstSound(word) }));

    // Sounds that are easy to mix up, used to make later rounds a little trickier.
    const SIMILAR = {
        b: 'pd', p: 'bt', d: 'bt', t: 'dp', m: 'n', n: 'm', f: 'vs', v: 'fw', s: 'fz', z: 's', g: 'c', c: 'g',
    };

    LS.registerGame({
        id: 'ispy',
        title: 'I spy',
        icon: '👀',
        colour: '#e76f51',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let lastSound = null;

            function next() {
                round++;
                const tricky = round >= 3;
                let target;
                do { target = pick(WORDS); } while (target.sound === lastSound);
                lastSound = target.sound;

                // Every other picture must start with a different sound, and with a different sound from each other.
                const used = new Set([target.sound]);
                const others = [];
                const addFrom = (pool) => {
                    const w = shuffle(pool).find((x) => !used.has(x.sound));
                    if (w) { used.add(w.sound); others.push(w); }
                };
                if (tricky) {
                    const similar = (SIMILAR[target.word[0]] || '').split('');
                    addFrom(WORDS.filter((w) => similar.includes(w.word[0])));
                }
                while (others.length < (tricky ? 3 : 2)) addFrom(WORDS);

                const letter = target.word[0];
                const sound = target.sound;
                const card = el('div', { class: 'picture-card letter-card' }, el('div', { class: 'big-letter' }, letter));

                const row = choiceRow(shuffle([target, ...others]), {
                    render: (w) => el('span', { class: 'pic' }, w.e),
                    say: (w) => w.word,
                    isRight: (w) => w === target,
                    onRight: (w) => {
                        if (!api.correct(`${capitalise(w.word)}! ${sound}, ${sound}, ${w.word}!`)) api.later(next, 3000);
                    },
                    onWrong: (w) => api.tryAgain(`That's ${article(w.word)} ${w.word}. ${capitalise(w.word)} starts with ${w.sound}. Can you find something beginning with ${sound}?`),
                });

                stage.replaceChildren(card, row);
                api.prompt(`I spy with my little eye, something beginning with “${letter}”! Can you point to it?`,
                    `I spy with my little eye, something beginning with ${sound}! Can you point to it?`);
            }

            next();
        },
    });
})();
