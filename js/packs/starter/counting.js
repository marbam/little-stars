// Count the things, then pick the right number. Clicking each thing counts it out loud.
(function () {
    const { el, pick, randInt, shuffle, capitalise, NUMBER_WORDS } = LS.ui;

    const THINGS = [
        { e: '🍎', one: 'apple', many: 'apples' },
        { e: '🦆', one: 'duck', many: 'ducks' },
        { e: '🐟', one: 'fish', many: 'fish' },
        { e: '🚗', one: 'car', many: 'cars' },
        { e: '⭐', one: 'star', many: 'stars' },
        { e: '🐞', one: 'ladybird', many: 'ladybirds' },
        { e: '🍌', one: 'banana', many: 'bananas' },
        { e: '🐸', one: 'frog', many: 'frogs' },
        { e: '🎈', one: 'balloon', many: 'balloons' },
        { e: '🧁', one: 'cupcake', many: 'cupcakes' },
        { e: '🐝', one: 'bee', many: 'bees' },
        { e: '🍓', one: 'strawberry', many: 'strawberries' },
        { e: '🐥', one: 'chick', many: 'chicks' },
        { e: '🌸', one: 'flower', many: 'flowers' },
    ];

    // Gets a little harder each round.
    const MAX_PER_ROUND = [4, 5, 6, 8, 10];

    LS.registerGame({
        id: 'counting',
        title: 'Count with me',
        icon: '🍎',
        colour: '#ff6b6b',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let lastCount = 0;
            let lastThing = null;

            function next() {
                const max = MAX_PER_ROUND[Math.min(round, MAX_PER_ROUND.length - 1)];
                round++;
                let n;
                do { n = randInt(1, max); } while (n === lastCount);
                lastCount = n;
                let thing;
                do { thing = pick(THINGS); } while (thing === lastThing);
                lastThing = thing;

                let counted = 0;
                let done = false;
                const field = el('div', { class: 'count-field' });
                for (let i = 0; i < n; i++) {
                    const item = el('button', {
                        class: 'count-item', style: { '--tilt': randInt(-12, 12) + 'deg' },
                        onClick() {
                            if (item.classList.contains('counted')) return;
                            counted++;
                            item.dataset.n = counted;
                            item.classList.add('counted');
                            LS.sound.click();
                            api.say(NUMBER_WORDS[counted]);
                        },
                    }, thing.e);
                    field.append(item);
                }

                // The right answer plus two others, shown in number order.
                const options = new Set([n]);
                const top = Math.max(max, n + 2);
                while (options.size < 3) options.add(randInt(1, top));
                const choices = [...options].sort((a, b) => a - b);

                const row = el('div', { class: 'choice-row' }, choices.map((c) => {
                    const btn = el('button', {
                        class: 'choice number',
                        onClick() {
                            if (done) return;
                            if (c === n) {
                                done = true;
                                btn.classList.add('right');
                                const label = `${capitalise(NUMBER_WORDS[n])} ${n === 1 ? thing.one : thing.many}!`;
                                if (!api.correct(label)) api.later(next, 2400);
                            } else {
                                btn.classList.add('wrong');
                                btn.disabled = true;
                                api.tryAgain(`Not quite. Click on each ${thing.one} to count them.`);
                            }
                        },
                    }, String(c));
                    return btn;
                }));

                stage.replaceChildren(field, row);
                api.prompt(`How many ${thing.many} can you count?`);
            }

            next();
        },
    });
})();
