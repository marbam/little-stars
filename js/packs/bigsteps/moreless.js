// More or less: which plate has more? Starts with big differences (2 v 7) and gets closer (5 v 6).
// From round 3 it also asks which has fewer. In the last two rounds the smaller group is drawn bigger,
// so she has to count rather than go by which plate looks fuller.
(function () {
    const { el, pick, randInt, shuffle, capitalise, NUMBER_WORDS } = LS.ui;
    const { THINGS, plural } = LS.bigsteps;

    // [ask for 'more' or 'fewer', smallest gap, largest gap]
    const ROUNDS = [['more', 3, 6], ['more', 3, 5], ['fewer', 3, 5], ['either', 1, 2], ['either', 1, 2]];

    LS.registerGame({
        id: 'moreless',
        title: 'More or less',
        icon: '⚖️',
        colour: '#6a4c93',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let lastThing = null;
            let explainedFewer = false;

            function next() {
                const [kind, minGap, maxGap] = ROUNDS[Math.min(round, ROUNDS.length - 1)];
                round++;
                const ask = kind === 'either' ? pick(['more', 'fewer']) : kind;
                const gap = randInt(minGap, maxGap);
                const small = randInt(1, 10 - gap);
                const big = small + gap;
                const trick = round >= 4;
                let thing;
                do { thing = pick(THINGS); } while (thing === lastThing);
                lastThing = thing;

                const counts = shuffle([small, big]);
                const answer = ask === 'more' ? big : small;
                let done = false;

                const plates = counts.map((n) => {
                    const size = trick && n === small ? 'big' : 'normal';
                    const items = el('div', { class: `plate-items ${size}` },
                        Array.from({ length: n }, () => el('span', { class: 'plate-item' }, thing.e)));
                    const badge = el('span', { class: 'plate-count' }, String(n));
                    const btn = el('button', {
                        class: 'plate', 'data-right': n === answer ? '' : null,
                        onClick() {
                            if (done) return;
                            badge.classList.add('shown');
                            const other = n === big ? small : big;
                            if (n === answer) {
                                done = true;
                                btn.classList.add('right');
                                plates.forEach((p) => p.querySelector('.plate-count').classList.add('shown'));
                                const msg = `This plate has ${NUMBER_WORDS[n]} ${plural(thing, n)}. ${capitalise(NUMBER_WORDS[n])} is ${ask} than ${NUMBER_WORDS[other]}!`;
                                if (!api.correct(msg)) api.later(next, 3200);
                            } else {
                                btn.classList.add('wrong');
                                btn.disabled = true;
                                api.tryAgain(`That plate has ${NUMBER_WORDS[n]}. Is that ${ask}? Try the other plate!`);
                            }
                        },
                    }, items, badge);
                    return btn;
                });

                stage.replaceChildren(el('div', { class: 'plates' }, plates));
                let text = `Which plate has ${ask} ${thing.many}?`;
                if (ask === 'fewer' && !explainedFewer) {
                    explainedFewer = true;
                    text += ' Fewer means not as many.';
                }
                api.prompt(text);
            }

            next();
        },
    });
})();
