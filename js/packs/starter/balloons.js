// Balloons float up the screen; pop three of the colour asked for to earn a star.
(function () {
    const { el, pick, COLOURS } = LS.ui;
    const NEEDED = 3;

    LS.registerGame({
        id: 'balloons',
        title: 'Pop the balloons',
        icon: '🎈',
        colour: '#fb8500',
        stars: 5,
        start(stage, api) {
            const meter = el('div', { class: 'pop-meter' });
            const layer = el('div', { class: 'balloon-layer' });
            stage.append(meter, layer);

            let target = null;
            let popped = 0;
            let active = false;
            let balloons = [];
            let spawnIn = 0;
            let lastWrongSpeech = 0;

            function place(b) {
                b.node.style.transform = `translate(${b.x + Math.sin(b.sway) * 14}px, ${b.y}px)`;
            }

            // kind: 'target', 'other', or omitted for random (always keeping at least one target on screen).
            function spawn(kind, y) {
                const width = layer.clientWidth;
                const height = layer.clientHeight;
                const targetsShowing = balloons.some((b) => !b.popped && b.colour === target);
                const isTarget = kind === 'target' || (kind !== 'other' && (!targetsShowing || Math.random() < 0.4));
                const colour = isTarget ? target : pick(COLOURS.filter((c) => c !== target));
                const node = el('div', { class: 'balloon', style: { '--c': colour.hex } }, el('div', { class: 'balloon-body' }));
                const b = {
                    node, colour, popped: false,
                    x: 10 + Math.random() * Math.max(0, width - 130),
                    y: y == null ? height + 20 : y,
                    speed: 45 + Math.random() * 30, // slow enough for little hands on a mouse
                    sway: Math.random() * Math.PI * 2,
                };
                node.addEventListener('pointerdown', () => hit(b));
                layer.append(node);
                balloons.push(b);
                place(b);
            }

            function hit(b) {
                if (!active || b.popped) return;
                if (b.colour === target) {
                    b.popped = true;
                    b.node.classList.add('popped');
                    LS.sound.pop();
                    popped++;
                    meter.children[popped - 1].classList.add('full');
                    api.later(() => b.node.remove(), 300);
                    if (popped >= NEEDED) {
                        active = false;
                        if (!api.correct(`You popped three ${target.name} balloons!`)) api.later(newRound, 2600);
                    }
                } else {
                    b.node.classList.remove('wobble');
                    void b.node.offsetWidth; // restart the animation
                    b.node.classList.add('wobble');
                    LS.sound.oops();
                    const now = performance.now();
                    if (now - lastWrongSpeech > 2500) {
                        lastWrongSpeech = now;
                        api.say(`That one is ${b.colour.name}. Pop the ${target.name} ones!`);
                    }
                }
            }

            function newRound() {
                balloons.forEach((b) => b.node.remove());
                balloons = [];
                const previous = target;
                do { target = pick(COLOURS); } while (target === previous);
                popped = 0;
                meter.replaceChildren(...Array.from({ length: NEEDED }, () => el('span', { class: 'pip', style: { '--c': target.hex } })));
                const h = layer.clientHeight;
                spawn('target', h * 0.45);
                spawn('other', h * 0.7);
                spawn('target', h * 0.95);
                spawn('other', h * 1.15);
                spawnIn = 1;
                active = true;
                api.prompt(`Pop the ${target.name} balloons!`);
            }

            api.onFrame((dt) => {
                if (!active) return;
                spawnIn -= dt;
                if (spawnIn <= 0) {
                    spawn();
                    spawnIn = 1.1 + Math.random() * 0.6;
                }
                for (const b of balloons) {
                    if (b.popped) continue;
                    b.y -= b.speed * dt;
                    b.sway += dt * 1.5;
                    place(b);
                }
                balloons = balloons.filter((b) => {
                    if (b.popped) return b.node.isConnected;
                    if (b.y < -220) { b.node.remove(); return false; }
                    return true;
                });
            });

            newRound();
        },
    });
})();
