// One more, one less: early adding and taking away. A friend has some fruit, one more arrives
// (or one rolls away), and she says how many there are now. Tapping the fruit counts it out loud.
(function () {
    const { el, pick, randInt, NUMBER_WORDS } = LS.ui;
    const { THINGS, plural, choiceRow, FRIENDS } = LS.bigsteps;

    // Each round: [add or take, how many change, largest number she starts with]
    const ROUNDS = [['add', 1, 3], ['add', 1, 4], ['take', 1, 5], ['add', 2, 5], ['either', 1, 7]];

    LS.registerGame({
        id: 'onemore',
        title: 'One more, one less',
        icon: '➕',
        colour: '#f4a261',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let lastFriend = null;
            let lastThing = null;

            async function next() {
                const [kind, change, maxStart] = ROUNDS[Math.min(round, ROUNDS.length - 1)];
                round++;
                const take = kind === 'take' || (kind === 'either' && Math.random() < 0.5);
                const start = take ? randInt(change + 1, maxStart) : randInt(1, maxStart);
                const answer = take ? start - change : start + change;

                let friend, thing;
                do { friend = pick(FRIENDS); } while (friend === lastFriend);
                do { thing = pick(THINGS); } while (thing === lastThing);
                lastFriend = friend;
                lastThing = thing;

                // Tapping counts whatever is on the plate, in order.
                const items = [];
                const plate = el('div', { class: 'friend-plate' });
                function recount() {
                    items.filter((i) => !i.classList.contains('gone')).forEach((i) => {
                        i.classList.remove('counted');
                        delete i.dataset.n;
                    });
                }
                function addItem(arriving) {
                    const item = el('button', {
                        class: 'count-item' + (arriving ? ' arrive' : ''), style: { '--tilt': randInt(-10, 10) + 'deg' },
                        onClick() {
                            if (item.classList.contains('counted') || item.classList.contains('gone')) return;
                            const n = plate.querySelectorAll('.count-item.counted').length + 1;
                            item.dataset.n = n;
                            item.classList.add('counted');
                            LS.sound.click();
                            api.say(NUMBER_WORDS[n]);
                        },
                    }, thing.e);
                    items.push(item);
                    plate.append(item);
                }
                for (let i = 0; i < start; i++) addItem(false);

                const answers = el('div', { class: 'answer-slot' });
                const scene = el('div', { class: 'friend-scene' },
                    el('div', { class: 'friend' }, friend.e), plate);
                stage.replaceChildren(scene, answers);

                const startWords = `${NUMBER_WORDS[start]} ${plural(thing, start)}`;
                const changeWords = `${NUMBER_WORDS[change]} ${take ? '' : 'more'}`.trim();
                await api.prompt(`${friend.name} has ${startWords}.`);
                await api.wait(500);

                if (take) {
                    const leaving = items.slice(-change);
                    leaving.forEach((i) => i.classList.add('gone'));
                    LS.sound.flip();
                    await api.say(change === 1 ? `Oh no! One ${thing.one} rolls away!` : `Oh no! ${NUMBER_WORDS[change]} ${thing.many} roll away!`);
                    leaving.forEach((i) => i.remove());
                } else {
                    for (let i = 0; i < change; i++) addItem(true);
                    LS.sound.splash();
                    await api.say(`Here comes ${changeWords}!`);
                }
                recount();
                await api.wait(300);

                const question = take
                    ? `${friend.name} had ${startWords}, and ${NUMBER_WORDS[change]} rolled away. How many are left?`
                    : `${friend.name} had ${startWords}, and got ${changeWords}. How many ${thing.many} now?`;

                // The right answer plus two near it, in number order.
                const options = new Set([answer]);
                while (options.size < 3) {
                    const n = answer + randInt(-2, 2);
                    if (n >= 1 && n <= 10) options.add(n);
                }
                answers.replaceChildren(choiceRow([...options].sort((a, b) => a - b), {
                    className: 'choice number',
                    render: (n) => String(n),
                    isRight: (n) => n === answer,
                    onRight: (n) => {
                        const sum = take
                            ? `${NUMBER_WORDS[start]} take away ${NUMBER_WORDS[change]} leaves ${NUMBER_WORDS[n]}!`
                            : `${NUMBER_WORDS[start]} and ${NUMBER_WORDS[change]} more makes ${NUMBER_WORDS[n]}!`;
                        if (!api.correct(sum)) api.later(next, 3400);
                    },
                    onWrong: () => api.tryAgain(`Not quite. Tap the ${thing.many} to count them.`),
                }));
                api.prompt(question);
            }

            next();
        },
    });
})();
