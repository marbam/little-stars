// What comes next? Spot the pattern and fill the gap. Goes from AB (apple, banana, apple, banana)
// to AAB, ABB and ABC patterns. The pattern is read aloud, which helps her hear the rhythm.
(function () {
    const { el, pick, shuffle, sample, COLOURS } = LS.ui;
    const { choiceRow } = LS.bigsteps;

    // Things a pattern can be made from. Colours are drawn as blobs.
    const THEMES = [
        [['🍎', 'apple'], ['🍌', 'banana'], ['🍇', 'grapes'], ['🍓', 'strawberry'], ['🍊', 'orange']],
        [['🐶', 'dog'], ['🐱', 'cat'], ['🐸', 'frog'], ['🐷', 'pig'], ['🐰', 'rabbit']],
        [['⭐', 'star'], ['🌙', 'moon'], ['☀️', 'sun'], ['☁️', 'cloud'], ['🌈', 'rainbow']],
        [['🚗', 'car'], ['🚂', 'train'], ['🚀', 'rocket'], ['🚌', 'bus'], ['⛵', 'boat']],
        COLOURS.map((c) => [{ hex: c.hex }, c.name]),
    ].map((theme) => theme.map(([look, name]) => ({ look, name })));

    // One pattern per round, as positions in a repeating unit.
    const ROUNDS = ['AB', 'AB', 'AAB', 'ABB', 'ABC'];

    function draw(item) {
        if (typeof item.look === 'string') return el('span', { class: 'pic' }, item.look);
        return el('span', { class: 'blob', style: { '--c': item.look.hex } });
    }

    LS.registerGame({
        id: 'pattern',
        title: 'What comes next?',
        icon: '🔁',
        colour: '#118ab2',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let lastTheme = null;

            function next() {
                const shape = ROUNDS[Math.min(round, ROUNDS.length - 1)];
                round++;
                let theme;
                do { theme = pick(THEMES); } while (theme === lastTheme);
                lastTheme = theme;

                const letters = [...new Set(shape)];
                const chosen = sample(theme, letters.length);
                const unit = shape.split('').map((l) => chosen[letters.indexOf(l)]);

                // Show the unit twice and then part of a third time; the gap is the next one along.
                const shown = unit.length * 2 + Math.floor(Math.random() * unit.length);
                const sequence = Array.from({ length: shown }, (_, i) => unit[i % unit.length]);
                const answer = unit[shown % unit.length];

                const gap = el('div', { class: 'pattern-item gap' }, '?');
                const row = el('div', { class: 'pattern-row' },
                    sequence.map((item) => el('div', { class: 'pattern-item' }, draw(item))), gap);

                // The pattern's own items, plus one from outside it if needed to make three choices.
                const options = [...chosen];
                if (options.length < 3) options.push(...sample(theme.filter((t) => !chosen.includes(t)), 3 - options.length));

                const spoken = sequence.map((i) => i.name).join(', ');
                const choices = choiceRow(shuffle(options), {
                    render: draw,
                    say: (item) => item.name,
                    isRight: (item) => item === answer,
                    onRight: () => {
                        gap.classList.remove('gap');
                        gap.replaceChildren(draw(answer));
                        if (!api.correct(`${spoken}, ${answer.name}!`)) api.later(next, 3600);
                    },
                    onWrong: (item) => api.tryAgain(`Not ${item.name}. Let's say it together. ${spoken}... what comes next?`),
                });

                stage.replaceChildren(row, choices);
                api.prompt('Look at the pattern. What comes next?', `Look at the pattern. ${spoken}... what comes next?`);
            }

            next();
        },
    });
})();
