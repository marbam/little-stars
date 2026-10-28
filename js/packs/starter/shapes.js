// Find the shape. Later rounds add colour too ("find the red triangle").
(function () {
    const { el, svg, pick, shuffle, sample, article, starPoints, COLOURS } = LS.ui;

    const SHAPES = {
        circle: () => svg('circle', { cx: 50, cy: 50, r: 42 }),
        square: () => svg('rect', { x: 10, y: 10, width: 80, height: 80, rx: 4 }),
        triangle: () => svg('polygon', { points: '50,8 94,88 6,88' }),
        rectangle: () => svg('rect', { x: 4, y: 24, width: 92, height: 52, rx: 4 }),
        star: () => svg('polygon', { points: starPoints(50, 54, 46, 19) }),
        heart: () => svg('path', { d: 'M50 90 C 22 68 4 50 12 28 C 20 8 44 8 50 28 C 56 8 80 8 88 28 C 96 50 78 68 50 90 Z' }),
    };
    const SHAPE_NAMES = Object.keys(SHAPES);

    LS.registerGame({
        id: 'shapes',
        title: 'Find the shape',
        icon: '🔺',
        colour: '#3a86ff',
        stars: 5,
        start(stage, api) {
            let round = 0;
            let lastShape = null;

            function shapeButton(choice) {
                const shape = SHAPES[choice.shape]();
                shape.setAttribute('fill', choice.colour.hex);
                shape.setAttribute('stroke', 'rgba(0,0,0,0.25)');
                shape.setAttribute('stroke-width', '3');
                shape.setAttribute('stroke-linejoin', 'round');
                return el('button', { class: 'shape-btn' }, svg('svg', { viewBox: '0 0 100 100' }, shape));
            }

            function next() {
                round++;
                const withColour = round >= 4;
                let shapeName;
                do { shapeName = pick(SHAPE_NAMES); } while (shapeName === lastShape);
                lastShape = shapeName;
                const target = { shape: shapeName, colour: pick(COLOURS) };
                const others = SHAPE_NAMES.filter((s) => s !== target.shape);
                const otherColours = COLOURS.filter((c) => c !== target.colour);

                let choices = [target];
                if (!withColour) {
                    sample(others, 2).forEach((s) => choices.push({ shape: s, colour: pick(COLOURS) }));
                } else {
                    // Same shape in another colour, same colour in another shape, and one different in both.
                    const [shapeA, shapeB] = sample(others, 2);
                    choices.push({ shape: target.shape, colour: pick(otherColours) });
                    choices.push({ shape: shapeA, colour: target.colour });
                    choices.push({ shape: shapeB, colour: pick(otherColours) });
                }
                choices = shuffle(choices);

                const label = (c) => (withColour ? `${c.colour.name} ${c.shape}` : c.shape);
                let done = false;

                const row = el('div', { class: 'choice-row' }, choices.map((c) => {
                    const btn = shapeButton(c);
                    btn.addEventListener('click', () => {
                        if (done) return;
                        if (c === target) {
                            done = true;
                            btn.classList.add('right');
                            if (!api.correct(`That's the ${label(c)}!`)) api.later(next, 2400);
                        } else {
                            btn.classList.add('wrong');
                            btn.disabled = true;
                            api.tryAgain(`That's ${article(label(c))} ${label(c)}. Can you find the ${label(target)}?`);
                        }
                    });
                    return btn;
                }));

                stage.replaceChildren(row);
                api.prompt(`Can you find the ${label(target)}?`);
            }

            next();
        },
    });
})();
