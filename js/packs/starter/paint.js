// Colouring-in: pick a colour, click part of the picture to fill it. No right or wrong answers.
(function () {
    const { el, svg, starPoints } = LS.ui;

    const PALETTE = [
        { name: 'red', hex: '#e63946' }, { name: 'orange', hex: '#fb8500' },
        { name: 'yellow', hex: '#ffd60a' }, { name: 'green', hex: '#2dc653' },
        { name: 'light blue', hex: '#8ecae6' }, { name: 'blue', hex: '#3a86ff' },
        { name: 'purple', hex: '#9d4edd' }, { name: 'pink', hex: '#ff70a6' },
        { name: 'brown', hex: '#8d5524' }, { name: 'grey', hex: '#adb5bd' },
        { name: 'black', hex: '#2b2d42' }, { name: 'white', hex: '#ffffff' },
    ];

    const R = (tag, attrs) => ({ tag, attrs });

    // Regions are drawn in order, so later ones sit on top. Every region is its own paintable area.
    const PICTURES = [
        {
            name: 'house',
            regions: [
                R('rect', { x: 0, y: 0, width: 400, height: 225 }), // sky
                R('circle', { cx: 335, cy: 58, r: 32 }), // sun
                R('path', { d: 'M62 100 C40 100 40 72 62 72 C64 50 96 46 104 64 C114 44 150 48 150 74 C170 74 172 100 150 100 Z' }), // cloud
                R('rect', { x: 0, y: 225, width: 400, height: 75 }), // grass
                R('rect', { x: 228, y: 72, width: 24, height: 50 }), // chimney
                R('rect', { x: 110, y: 130, width: 150, height: 110 }), // walls
                R('polygon', { points: '92,136 185,66 278,136' }), // roof
                R('rect', { x: 166, y: 178, width: 38, height: 62, rx: 3 }), // door
                R('rect', { x: 124, y: 150, width: 30, height: 30 }), // window
                R('rect', { x: 216, y: 150, width: 30, height: 30 }), // window
                R('rect', { x: 322, y: 165, width: 18, height: 70 }), // trunk
                R('circle', { cx: 331, cy: 145, r: 38 }), // leaves
                R('circle', { cx: 40, cy: 262, r: 12 }), // flower
                R('circle', { cx: 75, cy: 272, r: 12 }), // flower
            ],
        },
        {
            name: 'fish',
            regions: [
                R('rect', { x: 0, y: 0, width: 400, height: 300 }), // water
                R('path', { d: 'M0 250 Q100 225 200 250 T400 248 V300 H0 Z' }), // sand
                R('path', { d: 'M52 258 Q28 205 52 160 Q66 130 56 100 Q84 130 74 165 Q58 205 76 258 Z' }), // seaweed
                R('polygon', { points: starPoints(330, 264, 24, 10) }), // starfish
                R('polygon', { points: '285,150 352,98 352,202' }), // tail
                R('path', { d: 'M165 98 Q205 45 250 100 Z' }), // fin
                R('ellipse', { cx: 205, cy: 150, rx: 92, ry: 60 }), // body
                R('path', { d: 'M212 96 Q234 150 212 204 L238 202 Q258 150 238 98 Z' }), // stripe
                R('circle', { cx: 158, cy: 138, r: 14 }), // eye
                R('circle', { cx: 155, cy: 138, r: 6 }), // pupil
                R('circle', { cx: 118, cy: 82, r: 10 }), // bubbles
                R('circle', { cx: 100, cy: 52, r: 7 }),
                R('circle', { cx: 122, cy: 28, r: 5 }),
            ],
        },
        {
            name: 'rocket',
            regions: [
                R('rect', { x: 0, y: 0, width: 400, height: 300 }), // space
                R('circle', { cx: 70, cy: 75, r: 38 }), // planet
                R('circle', { cx: 335, cy: 235, r: 28 }), // moon
                R('polygon', { points: starPoints(330, 60, 16, 7) }),
                R('polygon', { points: starPoints(255, 30, 10, 4) }),
                R('polygon', { points: starPoints(60, 230, 12, 5) }),
                R('polygon', { points: starPoints(110, 180, 9, 4) }),
                R('path', { d: 'M172 222 Q200 300 228 222 Z' }), // flame
                R('polygon', { points: '162,165 122,235 162,222' }), // fin
                R('polygon', { points: '238,165 278,235 238,222' }), // fin
                R('path', { d: 'M200 38 Q242 90 242 170 L242 222 L158 222 L158 170 Q158 90 200 38 Z' }), // body
                R('path', { d: 'M200 38 Q221 64 228 88 L172 88 Q179 64 200 38 Z' }), // nose
                R('circle', { cx: 200, cy: 130, r: 20 }), // window
                R('rect', { x: 158, y: 188, width: 84, height: 14 }), // stripe
            ],
        },
    ];

    LS.registerGame({
        id: 'paint',
        title: 'Colour in',
        icon: '🎨',
        colour: '#ff70a6',
        stars: 0,
        start(stage, api) {
            let pictureIndex = 0;
            let colour = PALETTE[0];
            const holder = el('div', { class: 'paint-canvas-holder' });

            const swatches = PALETTE.map((c) => {
                const btn = el('button', {
                    class: 'swatch', style: { '--c': c.hex }, title: c.name, 'aria-label': c.name,
                    onClick() {
                        colour = c;
                        swatches.forEach((s) => s.classList.toggle('selected', s === btn));
                        LS.sound.click();
                        api.say(c.name);
                    },
                });
                return btn;
            });
            swatches[0].classList.add('selected');

            function draw() {
                const picture = PICTURES[pictureIndex];
                const regions = picture.regions.map((r) => {
                    const node = svg(r.tag, r.attrs);
                    node.setAttribute('class', 'region');
                    node.setAttribute('fill', '#ffffff');
                    node.addEventListener('click', () => {
                        node.setAttribute('fill', colour.hex);
                        LS.sound.splash();
                    });
                    return node;
                });
                holder.replaceChildren(svg('svg', { viewBox: '-4 -4 408 308', class: 'paint-canvas' }, regions));
            }

            function change(step) {
                pictureIndex = (pictureIndex + step + PICTURES.length) % PICTURES.length;
                LS.sound.flip();
                draw();
            }

            const controls = el('div', { class: 'paint-controls' },
                el('button', { class: 'nav-btn', 'data-say': 'Another picture', title: 'Another picture', onClick: () => change(-1) }, '◀'),
                el('button', {
                    class: 'big-btn', 'data-say': "I've finished!",
                    onClick: () => api.finish(`What a beautiful ${PICTURES[pictureIndex].name}!`),
                }, '✔ Finished!'),
                el('button', { class: 'nav-btn', 'data-say': 'Another picture', title: 'Another picture', onClick: () => change(1) }, '▶'));

            stage.append(el('div', { class: 'paint-wrap' },
                el('div', { class: 'palette' }, swatches),
                el('div', { class: 'paint-main' }, holder, controls)));

            draw();
            api.prompt('Pick a colour, then click on the picture to paint it!');
        },
    });
})();
