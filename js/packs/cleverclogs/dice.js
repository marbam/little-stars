// Dotty dice: a dice shows for a moment, then turns over. How many dots? Seeing small amounts at a glance
// without counting (subitising). Starts with 1-3, then 4-6, then two dice. "Look again" shows it again,
// as often as she likes, so there's no pressure.
(function () {
    const { el, randInt, NUMBER_WORDS } = LS.ui;
    const { choiceRow } = LS.bigsteps;

    // Which of the 3x3 spots are filled for each number, like a real dice.
    const SPOTS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    // Each round: the numbers on each dice [smallest, largest], and how many dice.
    const ROUNDS = [[1, 3, 1], [1, 3, 1], [4, 6, 1], [1, 6, 1], [1, 3, 2]];
    const SHOW_FOR = 2500;

    function dice(n) {
        return el('div', { class: 'dice' }, Array.from({ length: 9 }, (_, i) =>
            el('span', { class: 'dice-spot' + (SPOTS[n].includes(i) ? ' dot' : '') })));
    }

    LS.registerGame({
        id: 'dice',
        title: 'Dotty dice',
        icon: '🎲',
        colour: '#06d6a0',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let last = 0;

            function next() {
                const [min, max, count] = ROUNDS[Math.min(round, ROUNDS.length - 1)];
                round++;
                let values, total;
                do {
                    values = Array.from({ length: count }, () => randInt(min, max));
                    total = values.reduce((a, b) => a + b, 0);
                } while (total === last);
                last = total;

                const table = el('div', { class: 'dice-table' }, values.map(dice));
                let hideTimer = null;
                function show() {
                    table.classList.remove('hidden-dice');
                    if (hideTimer) clearTimeout(hideTimer);
                    hideTimer = api.later(() => table.classList.add('hidden-dice'), SHOW_FOR);
                }

                const look = el('button', { class: 'big-btn listen-btn', 'data-say': 'Look again', onClick: show }, '👀 Look again');

                const options = new Set([total]);
                while (options.size < 3) {
                    const n = total + randInt(-2, 2);
                    if (n >= 1 && n <= count * max) options.add(n);
                }
                const row = choiceRow([...options].sort((a, b) => a - b), {
                    className: 'choice number',
                    render: (n) => String(n),
                    isRight: (n) => n === total,
                    onRight: (n) => {
                        if (hideTimer) clearTimeout(hideTimer);
                        table.classList.remove('hidden-dice');
                        const sum = count > 1 ? `${values.map((v) => NUMBER_WORDS[v]).join(' and ')} makes ${NUMBER_WORDS[n]}!` : `${NUMBER_WORDS[n]} dots!`;
                        if (!api.correct(sum)) api.later(next, 3000);
                    },
                    onWrong: () => api.tryAgain('Not quite. Shall we look again?'),
                });

                stage.replaceChildren(el('div', { class: 'sound-panel' }, table, look), row);
                api.prompt(count > 1 ? 'How many dots are there altogether?' : 'Look at the dice! How many dots?');
                show();
            }

            next();
        },
    });
})();
