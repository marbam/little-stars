// Classic pairs memory game with animals. Each animal says its name when turned over.
(function () {
    const { el, sample, shuffle } = LS.ui;

    const ANIMALS = [
        ['🐶', 'dog'], ['🐱', 'cat'], ['🐮', 'cow'], ['🐷', 'pig'], ['🐸', 'frog'], ['🦁', 'lion'],
        ['🐵', 'monkey'], ['🐰', 'rabbit'], ['🐻', 'bear'], ['🐔', 'chicken'], ['🐧', 'penguin'],
        ['🐘', 'elephant'], ['🦊', 'fox'], ['🐯', 'tiger'], ['🐨', 'koala'], ['🦉', 'owl'],
    ];
    const PAIRS = 4;
    const plural = (name) => (/(x|s)$/.test(name) ? name + 'es' : name + 's');

    LS.registerGame({
        id: 'pairs',
        title: 'Find the pairs',
        icon: '🃏',
        colour: '#2dc653',
        stars: PAIRS,
        start(stage, api) {
            const animals = sample(ANIMALS, PAIRS);
            const deck = shuffle([...animals, ...animals]);
            let open = [];
            let locked = false;

            const cards = deck.map(([emoji, name]) => {
                const card = el('button', { class: 'card', 'aria-label': 'card' },
                    el('div', { class: 'card-inner' },
                        el('div', { class: 'face back' }, '⭐'),
                        el('div', { class: 'face front' }, emoji)));
                const entry = { card, name, flipped: false, matched: false };
                card.addEventListener('click', () => turn(entry));
                return entry;
            });

            function turn(c) {
                if (locked || c.flipped || c.matched) return;
                c.flipped = true;
                c.card.classList.add('flipped');
                LS.sound.flip();
                api.say(c.name);
                open.push(c);
                if (open.length < 2) return;

                locked = true;
                const [a, b] = open;
                if (a.name === b.name) {
                    api.later(() => {
                        a.matched = b.matched = true;
                        a.card.classList.add('matched');
                        b.card.classList.add('matched');
                        open = [];
                        locked = false;
                        api.correct(`Two ${plural(a.name)}!`);
                    }, 800);
                } else {
                    api.later(() => {
                        [a, b].forEach((x) => { x.flipped = false; x.card.classList.remove('flipped'); });
                        open = [];
                        locked = false;
                    }, 1400);
                }
            }

            stage.append(el('div', { class: 'pairs-grid' }, cards.map((c) => c.card)));
            api.prompt('Turn over the cards. Can you find two the same?');
        },
    });
})();
