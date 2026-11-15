// Share it out: deal the sweets one at a time ("one for Teddy, one for Bunny...") until they're all shared,
// then say how many each friend has. Goes from two friends to three, and the last round has one left over.
(function () {
    const { el, pick, sample, randInt, NUMBER_WORDS } = LS.ui;
    const { choiceRow, FRIENDS } = LS.bigsteps;

    const TREATS = [
        { e: '🍬', one: 'sweet', many: 'sweets' },
        { e: '🍪', one: 'biscuit', many: 'biscuits' },
        { e: '🍓', one: 'strawberry', many: 'strawberries' },
        { e: '🧁', one: 'cupcake', many: 'cupcakes' },
    ];
    // Each round: [how many friends, the possible numbers of treats]. Round 5 doesn't share evenly.
    const ROUNDS = [[2, [4]], [2, [6]], [2, [8]], [3, [6, 9]], [2, [5, 7]]];

    // "Teddy and Bunny", "Teddy, Bunny and Monkey"
    const listNames = (friends) => {
        const names = friends.map((f) => f.name);
        return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    };

    LS.registerGame({
        id: 'share',
        title: 'Share it out',
        icon: '🍬',
        colour: '#ffd166',
        stars: 5,
        start(stage, api) {
            let round = 0;

            function next() {
                const [friendCount, totals] = ROUNDS[Math.min(round, ROUNDS.length - 1)];
                round++;
                const total = pick(totals);
                const each = Math.floor(total / friendCount);
                const leftOver = total % friendCount;
                const friends = sample(FRIENDS, friendCount);
                const treat = pick(TREATS);

                const plates = friends.map(() => el('div', { class: 'share-plate' }));
                const table = el('div', { class: 'share-table' }, friends.map((f, i) =>
                    el('div', { class: 'share-friend' }, el('div', { class: 'friend small' }, f.e), el('div', { class: 'share-name' }, f.name), plates[i])));
                const pile = el('div', { class: 'share-pile' });
                const answers = el('div', { class: 'answer-slot' });
                let given = 0;

                for (let i = 0; i < total; i++) {
                    const sweet = el('button', {
                        class: 'share-sweet', 'aria-label': `Give a ${treat.one}`,
                        onClick() {
                            if (given >= total - leftOver) return; // the left-over one stays put
                            const who = given % friendCount;
                            given++;
                            sweet.disabled = true;
                            plates[who].append(el('span', { class: 'share-item arrive-small' }, treat.e));
                            sweet.remove();
                            LS.sound.click();
                            api.say(`One for ${friends[who].name}!`);
                            if (given === total - leftOver) api.later(ask, 1100);
                        },
                    }, treat.e);
                    pile.append(sweet);
                }

                async function ask() {
                    if (leftOver) {
                        pile.classList.add('left-over');
                        await api.say(`Oh! There's one ${treat.one} left over. If we gave it to someone, it wouldn't be fair!`);
                    }
                    const options = new Set([each]);
                    while (options.size < 3) {
                        const n = each + randInt(-2, 2);
                        if (n >= 1) options.add(n);
                    }
                    answers.replaceChildren(choiceRow([...options].sort((a, b) => a - b), {
                        className: 'choice number',
                        render: (n) => String(n),
                        isRight: (n) => n === each,
                        onRight: () => {
                            if (!api.correct(`${listNames(friends)} have ${NUMBER_WORDS[each]} each. That's fair!`)) api.later(next, 3200);
                        },
                        onWrong: () => api.tryAgain(`Not quite. Count the ${treat.many} on ${friends[0].name}'s plate.`),
                    }));
                    api.prompt(`How many ${treat.many} does everyone have?`);
                }

                stage.replaceChildren(table, pile, answers);
                const names = listNames(friends);
                api.prompt(`Let's share the ${treat.many} between ${names}. Point to a ${treat.one} to give it out, one each in turn.`,
                    `Let's share the ${treat.many} between ${names}. Point to the ${treat.many} to give them out. One for each friend, in turn!`);
            }

            next();
        },
    });
})();
