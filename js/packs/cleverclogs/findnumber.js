// Find the number: "Can you point to number 7?" Reading numerals, starting with 1-5 and numbers that
// look very different, then up to 10 with ones that are easy to mix up (6 and 9, 1 and 7).
(function () {
    const { randInt, sample, shuffle, NUMBER_WORDS } = LS.ui;
    const { choiceRow } = LS.bigsteps;

    // Numbers that look alike.
    const LOOKALIKE = { 1: [7], 7: [1], 6: [9], 9: [6], 2: [5], 5: [2], 3: [8], 8: [3, 6], 4: [9], 10: [1] };
    // [largest number, use lookalikes]
    const ROUNDS = [[5, false], [5, false], [10, false], [10, true], [10, true]];

    LS.registerGame({
        id: 'findnumber',
        title: 'Find the number',
        icon: '🔢',
        colour: '#ef476f',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let last = 0;

            function next() {
                const [max, lookalikes] = ROUNDS[Math.min(round, ROUNDS.length - 1)];
                round++;
                let target;
                do { target = lookalikes ? pick10() : randInt(1, max); } while (target === last);
                last = target;

                const options = new Set([target]);
                if (lookalikes) options.add(sample(LOOKALIKE[target], 1)[0]);
                while (options.size < 3) {
                    const n = randInt(1, max);
                    // Early rounds keep the others well away from the answer, so they look different.
                    if (lookalikes || Math.abs(n - target) >= 2) options.add(n);
                }

                const row = choiceRow(shuffle([...options]), {
                    className: 'choice number big-number',
                    render: (n) => String(n),
                    isRight: (n) => n === target,
                    onRight: (n) => { if (!api.correct(`That's ${NUMBER_WORDS[n]}!`)) api.later(next, 2600); },
                    onWrong: (n) => api.tryAgain(`That's ${NUMBER_WORDS[n]}. Can you find ${NUMBER_WORDS[target]}?`),
                });

                stage.replaceChildren(row);
                api.prompt(`Can you point to number ${NUMBER_WORDS[target]}?`);
            }

            // Only numbers that have a lookalike.
            const pick10 = () => sample(Object.keys(LOOKALIKE).map(Number), 1)[0];

            next();
        },
    });
})();
