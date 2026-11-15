// Odd one out: three things that belong together and one that doesn't. Sorting and reasoning.
// Rounds: what kind of thing (fruit v. vehicle), twice; then colour; then shape; then how many.
// After a right answer it explains why.
(function () {
    const { el, svg, pick, shuffle, sample, randInt, starPoints, COLOURS, NUMBER_WORDS } = LS.ui;
    const { choiceRow, THINGS } = LS.bigsteps;

    // Emoji chosen to render on Windows 10's emoji font.
    const GROUPS = [
        { isnt: 'a fruit', items: [['🍎', 'apple'], ['🍌', 'banana'], ['🍇', 'grapes'], ['🍓', 'strawberry'], ['🍐', 'pear'], ['🍊', 'orange']] },
        { isnt: 'an animal', items: [['🐶', 'dog'], ['🐱', 'cat'], ['🐸', 'frog'], ['🐷', 'pig'], ['🐰', 'rabbit'], ['🐮', 'cow']] },
        { isnt: 'something you ride in', items: [['🚗', 'car'], ['🚌', 'bus'], ['🚂', 'train'], ['🚀', 'rocket'], ['⛵', 'boat'], ['🚲', 'bike']] },
        { isnt: 'something you wear', items: [['👕', 't-shirt'], ['👖', 'jeans'], ['🧦', 'socks'], ['👟', 'trainer'], ['🎩', 'hat'], ['🧥', 'coat']] },
        { isnt: 'in the sky', items: [['☀️', 'sun'], ['🌙', 'moon'], ['⭐', 'star'], ['☁️', 'cloud'], ['🌈', 'rainbow']] },
    ];

    const SHAPES = {
        circle: () => svg('circle', { cx: 50, cy: 50, r: 42 }),
        square: () => svg('rect', { x: 12, y: 12, width: 76, height: 76, rx: 4 }),
        triangle: () => svg('polygon', { points: '50,8 94,88 6,88' }),
        star: () => svg('polygon', { points: starPoints(50, 54, 46, 19) }),
        heart: () => svg('path', { d: 'M50 90 C 22 68 4 50 12 28 C 20 8 44 8 50 28 C 56 8 80 8 88 28 C 96 50 78 68 50 90 Z' }),
    };

    function drawShape({ shape, colour }) {
        const s = SHAPES[shape]();
        s.setAttribute('fill', colour.hex);
        s.setAttribute('stroke', 'rgba(0,0,0,0.25)');
        s.setAttribute('stroke-width', '3');
        s.setAttribute('stroke-linejoin', 'round');
        return svg('svg', { viewBox: '0 0 100 100', class: 'odd-shape' }, s);
    }

    // Each builder returns { items, odd, render, say, why }.
    const BUILDERS = {
        kind() {
            const [main, other] = sample(GROUPS, 2);
            const items = sample(main.items, 3).map(([e, name]) => ({ e, name }));
            const [oe, oname] = pick(other.items);
            const odd = { e: oe, name: oname };
            return {
                items: [...items, odd], odd,
                render: (i) => el('span', { class: 'pic' }, i.e),
                say: (i) => i.name,
                why: `The ${odd.name} isn't ${main.isnt}!`,
            };
        },
        colour() {
            const [main, other] = sample(COLOURS, 2);
            // All the same shape, so colour is the only difference.
            const shape = pick(Object.keys(SHAPES));
            const items = Array.from({ length: 3 }, () => ({ shape, colour: main }));
            const odd = { shape, colour: other };
            return {
                items: [...items, odd], odd, render: drawShape,
                why: `The ${other.name} one isn't ${main.name}!`,
            };
        },
        shape() {
            const [main, other] = sample(Object.keys(SHAPES), 2);
            // All the same colour, so shape is the only difference.
            const colour = pick(COLOURS);
            const items = Array.from({ length: 3 }, () => ({ shape: main, colour }));
            const odd = { shape: other, colour };
            return {
                items: [...items, odd], odd, render: drawShape,
                why: `The ${other} isn't a ${main}!`,
            };
        },
        number() {
            const thing = pick(THINGS);
            const main = randInt(1, 3);
            const other = main + (Math.random() < 0.5 && main > 1 ? -1 : 1);
            const card = (n) => ({ n });
            const items = [card(main), card(main), card(main)];
            const odd = card(other);
            return {
                items: [...items, odd], odd,
                render: (c) => el('span', { class: 'odd-count' }, Array.from({ length: c.n }, () => el('span', {}, thing.e))),
                why: `That one has ${NUMBER_WORDS[other]}. The others all have ${NUMBER_WORDS[main]}!`,
            };
        },
    };
    const ROUNDS = ['kind', 'kind', 'colour', 'shape', 'number'];

    LS.registerGame({
        id: 'oddoneout',
        title: 'Odd one out',
        icon: '🧐',
        colour: '#fb8500',
        stars: 5,
        start(stage, api) {
            let round = 0;

            function next() {
                const kind = ROUNDS[Math.min(round, ROUNDS.length - 1)];
                round++;
                const puzzle = BUILDERS[kind]();
                const row = choiceRow(shuffle(puzzle.items), {
                    render: puzzle.render,
                    say: puzzle.say,
                    isRight: (i) => i === puzzle.odd,
                    onRight: () => { if (!api.correct(puzzle.why)) api.later(next, 3200); },
                    onWrong: () => api.tryAgain('That one goes with the others. Which one is different?'),
                });
                stage.replaceChildren(row);
                api.prompt("Which one doesn't belong? Point to the odd one out!");
            }

            next();
        },
    });
})();
