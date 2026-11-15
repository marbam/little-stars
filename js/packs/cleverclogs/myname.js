// My name: reading her own name, usually the first word a child learns to recognise. Uses whoever is playing.
// Rounds 1-2: which one says your name? (round 2 uses names that start with the same letter, if there are any)
// Round 3: a letter is missing near the end. Round 4: the first letter is missing.
// Round 5: the letters are jumbled; point to them in order to build the name.
(function () {
    const { el, pick, shuffle, sample, LETTER_SOUNDS } = LS.ui;
    const { choiceRow } = LS.bigsteps;

    const OTHER_NAMES = [
        'Ava', 'Mia', 'Leo', 'Max', 'Sam', 'Ella', 'Noah', 'Lily', 'Theo', 'Isla', 'Finn', 'Ruby', 'Oscar', 'Grace',
        'Freya', 'Jack', 'Alfie', 'Poppy', 'Rosie', 'Harry', 'Evie', 'Arlo', 'Ivy', 'Ezra', 'Maisie', 'Tom', 'Daisy',
        'Ben', 'Molly', 'George', 'Bella', 'Nora', 'Luca', 'Zara', 'Toby', 'Hannah', 'Oliver', 'Amelia', 'Sophie',
    ];
    const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

    // Say the first sound only when it's a plain consonant sound (not "Charlie", "Sophie" with "ph", or vowel names like "Isla").
    const simpleStart = (name) => /^[bdfghjklmnprstvwyz]/i.test(name) && !/^(ch|sh|th|ph|wh|kn|gn)/i.test(name);

    LS.registerGame({
        id: 'myname',
        title: 'My name',
        icon: '📛',
        colour: '#118ab2',
        stars: 5,
        start(stage, api) {
            const name = api.name;
            const lower = name.toLowerCase();
            // Positions of letters (skipping spaces, hyphens and apostrophes).
            const letterAt = name.split('').map((ch, i) => (/\p{L}/u.test(ch) ? i : -1)).filter((i) => i >= 0);
            const canGap = letterAt.length >= 2;
            const others = [...new Set([...api.players, ...OTHER_NAMES])].filter((n) => n.toLowerCase() !== lower);
            let round = 0;

            const nameWithGap = (gap) => el('div', { class: 'name-word' }, name.split('').map((ch, i) =>
                el('span', { class: 'name-letter' + (i === gap ? ' gap-slot' : '') }, i === gap ? '?' : ch)));

            function next() {
                round++;
                if (round <= 2 || !canGap) whichName(round === 2);
                else if (round <= 4) missingLetter(round === 3 ? pick(letterAt.slice(1)) : letterAt[0]);
                else jumble();
            }

            function done(message, delay = 3000) {
                if (!api.correct(message)) api.later(next, delay);
            }

            // Which one says your name?
            function whichName(sameStart) {
                const first = lower[0];
                const alike = others.filter((n) => n[0].toLowerCase() === first);
                const different = others.filter((n) => n[0].toLowerCase() !== first);
                const picks = sameStart && alike.length ? [pick(alike), pick(different)] : sample(different, 2);
                const row = choiceRow(shuffle([name, ...picks]), {
                    className: 'name-choice',
                    render: (n) => n,
                    isRight: (n) => n === name,
                    onRight: () => done(`That says ${name}!`),
                    onWrong: (n) => api.tryAgain(`That one says ${n}. Can you find ${name}?`),
                });
                stage.replaceChildren(row);
                api.prompt(`Which one says ${name}? Can you point to your name?`);
            }

            // One letter is missing.
            function missingLetter(gap) {
                const missing = name[gap];
                const word = nameWithGap(gap);
                const wrong = sample(ALPHABET.filter((l) => l !== missing.toLowerCase()), 2);
                const isUpper = missing !== missing.toLowerCase();
                const letters = shuffle([missing, ...wrong.map((l) => (isUpper ? l.toUpperCase() : l))]);
                const row = choiceRow(letters, {
                    className: 'choice letter',
                    render: (l) => l,
                    isRight: (l) => l === missing,
                    onRight: () => {
                        word.children[gap].textContent = missing;
                        word.children[gap].classList.remove('gap-slot');
                        word.children[gap].classList.add('lit');
                        done(`Yes! That spells ${name}!`);
                    },
                    onWrong: () => api.tryAgain(`Not that one. Which letter is missing from ${name}?`),
                });
                stage.replaceChildren(word, row);
                api.prompt(gap === letterAt[0]
                    ? `Oh no! The first letter of ${name} has gone. Which letter is it?`
                    : `Oh no! A letter is missing from ${name}. Which one goes in the gap?`);
            }

            // The letters are jumbled: point to them in order.
            function jumble() {
                const slots = name.split('').map((ch) => el('span', { class: 'name-letter' + (/\p{L}/u.test(ch) ? ' empty' : '') }, /\p{L}/u.test(ch) ? '' : ch));
                const word = el('div', { class: 'name-word' }, slots);
                let pos = 0; // index into letterAt: the next letter needed
                let finished = false;
                // Make sure the jumble really is jumbled (unless every letter is the same).
                const inOrder = letterAt.map((i) => name[i]);
                let jumbled = shuffle(inOrder);
                for (let tries = 0; tries < 20 && jumbled.join('') === inOrder.join(''); tries++) jumbled = shuffle(inOrder);
                const tiles = jumbled.map((ch) => {
                    const tile = el('button', {
                        class: 'choice letter tile-letter', 'data-letter': ch,
                        onClick() {
                            if (finished || tile.disabled) return;
                            const want = name[letterAt[pos]];
                            if (ch === want) {
                                tile.disabled = true;
                                tile.classList.add('used');
                                slots[letterAt[pos]].textContent = ch;
                                slots[letterAt[pos]].classList.remove('empty');
                                slots[letterAt[pos]].classList.add('lit');
                                pos++;
                                LS.sound.click();
                                if (pos === letterAt.length) {
                                    finished = true;
                                    const sound = simpleStart(name) ? ` ${name} starts with ${LETTER_SOUNDS[lower[0]]}!` : '';
                                    done(`You built ${name}!${sound}`, 3400);
                                }
                            } else {
                                tile.classList.remove('shake');
                                void tile.offsetWidth;
                                tile.classList.add('shake');
                                api.tryAgain(pos === 0 ? `Which letter does ${name} start with?` : 'Not that one yet. Which letter comes next?');
                            }
                        },
                    }, ch);
                    return tile;
                });
                stage.replaceChildren(word, el('div', { class: 'choice-row' }, tiles));
                api.prompt(`The letters in ${name} are all jumbled up! Can you put them in order?`);
            }

            next();
        },
    });
})();
