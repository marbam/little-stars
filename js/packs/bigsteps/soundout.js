// Sound it out: hear "c... a... t", then find the picture. This is blending, the first step in reading.
// Early rounds show a dot for each sound; from round 3 the letters appear and light up as they're said,
// and one of the wrong pictures sounds very close to the right one (cat / hat).
(function () {
    const { el, shuffle, sample, article, capitalise, LETTER_SOUNDS } = LS.ui;
    const { choiceRow } = LS.bigsteps;

    // Three-letter words where every letter makes its simple sound. Emoji chosen to render on Windows 10.
    const WORDS = [
        ['🐱', 'cat'], ['🐶', 'dog'], ['🐷', 'pig'], ['☀️', 'sun'], ['🚌', 'bus'], ['🎩', 'hat'], ['🛏️', 'bed'],
        ['☕', 'cup'], ['🚐', 'van'], ['🗺️', 'map'], ['🦇', 'bat'], ['🕸️', 'web'], ['📌', 'pin'], ['🖊️', 'pen'],
        ['🐀', 'rat'], ['👜', 'bag'], ['🧢', 'cap'], ['🗑️', 'bin'], ['🔟', 'ten'], ['🐛', 'bug'], ['🥫', 'tin'],
    ].map(([e, word]) => ({ e, word, sounds: word.split('').map((l) => LETTER_SOUNDS[l]) }));

    // How many letters two words share in the same place (cat and hat share 2).
    const shared = (a, b) => a.word.split('').filter((l, i) => b.word[i] === l).length;

    LS.registerGame({
        id: 'soundout',
        title: 'Sound it out',
        icon: '🧩',
        colour: '#2a9d8f',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let lastWord = null;
            let token = 0; // bumps whenever the sounds start again, so an older run stops

            function next() {
                round++;
                const showLetters = round >= 3;
                const target = shuffle(WORDS).find((w) => w !== lastWord);
                lastWord = target;

                let others;
                if (showLetters) {
                    // One that sounds very close, plus one that's quite different.
                    const close = shuffle(WORDS.filter((w) => w !== target && shared(w, target) === 2))[0];
                    const pool = WORDS.filter((w) => w !== target && w !== close && shared(w, target) === 0);
                    others = close ? [close, ...sample(pool, 1)] : sample(pool, 2);
                } else {
                    others = sample(WORDS.filter((w) => w !== target && w.word[0] !== target.word[0] && shared(w, target) === 0), 2);
                }

                const slots = target.word.split('').map((l) => el('span', { class: 'sound-slot' }, showLetters ? l : '●'));
                const word = el('div', { class: 'sound-word' }, slots);

                async function playSounds() {
                    const mine = ++token;
                    slots.forEach((s) => s.classList.remove('lit'));
                    for (let i = 0; i < slots.length; i++) {
                        slots[i].classList.add('lit');
                        await api.say(target.sounds[i]);
                        await api.wait(350);
                        if (mine !== token) return;
                        slots[i].classList.remove('lit');
                    }
                }

                const listen = el('button', {
                    class: 'big-btn listen-btn', onClick: playSounds,
                }, '👂 Listen');

                const row = choiceRow(shuffle([target, ...others]), {
                    render: (w) => el('span', { class: 'pic' }, w.e),
                    say: (w) => w.word,
                    isRight: (w) => w === target,
                    onRight: () => {
                        token++;
                        slots.forEach((s, i) => { s.textContent = target.word[i]; s.classList.add('lit'); });
                        if (!api.correct(`${target.sounds.join(', ')}... ${target.word}!`)) api.later(next, 3200);
                    },
                    onWrong: (w) => {
                        token++;
                        const mine = token;
                        api.tryAgain(`That's ${article(w.word)} ${w.word}. Listen again!`)
                            .then(() => api.wait(300))
                            .then(() => { if (mine === token) playSounds(); });
                    },
                });

                stage.replaceChildren(el('div', { class: 'sound-panel' }, word, listen), row);
                const mine = ++token;
                api.prompt('Listen to the sounds. What word do they make?')
                    .then(() => api.wait(400))
                    .then(() => { if (mine === token) playSounds(); });
            }

            next();
        },
    });
})();
