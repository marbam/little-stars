// Shared bits for the Big Steps pack. These games are about thinking rather than mouse skills:
// the child points and a grown-up clicks, so every answer is a big, still button with no time limit.
window.LS = window.LS || {};

LS.bigsteps = (function () {
    const { el } = LS.ui;

    /**
     * A row of big answer buttons. A wrong pick fades out; the right one turns green.
     *   options:  the things to choose between
     *   render:   option -> button contents
     *   isRight:  option -> boolean
     *   onRight / onWrong: option -> void (onRight is called once)
     *   say:      option -> text read aloud on hover (optional)
     * The right button carries data-right so the smoke test can find it.
     */
    function choiceRow(options, { render, isRight, onRight, onWrong, say, className = 'pic-choice' }) {
        let done = false;
        return el('div', { class: 'choice-row' }, options.map((option) => {
            const right = isRight(option);
            const btn = el('button', {
                class: className,
                'data-say': say ? say(option) : null,
                'data-right': right ? '' : null,
                onClick() {
                    if (done) return;
                    if (right) {
                        done = true;
                        btn.classList.add('right');
                        onRight(option);
                    } else {
                        btn.classList.add('wrong');
                        btn.disabled = true;
                        onWrong(option);
                    }
                },
            }, render(option));
            return btn;
        }));
    }

    // Things to count, with their names for speech.
    const THINGS = [
        { e: '🍎', one: 'apple', many: 'apples' },
        { e: '🍓', one: 'strawberry', many: 'strawberries' },
        { e: '🧁', one: 'cupcake', many: 'cupcakes' },
        { e: '🍪', one: 'biscuit', many: 'biscuits' },
        { e: '🍌', one: 'banana', many: 'bananas' },
        { e: '🍊', one: 'orange', many: 'oranges' },
        { e: '🍐', one: 'pear', many: 'pears' },
        { e: '🍩', one: 'doughnut', many: 'doughnuts' },
    ];

    const plural = (thing, n) => (n === 1 ? thing.one : thing.many);

    // Friends who own or share things in the maths games.
    const FRIENDS = [{ e: '🐻', name: 'Teddy' }, { e: '🐰', name: 'Bunny' }, { e: '🐵', name: 'Monkey' }, { e: '🐶', name: 'Puppy' }];

    return { choiceRow, THINGS, plural, FRIENDS };
})();
