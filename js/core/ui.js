// Small DOM and randomness helpers shared by every game.
window.LS = window.LS || {};

LS.ui = (function () {
    function append(node, kids) {
        kids.flat(Infinity).forEach((kid) => {
            if (kid == null || kid === false) return;
            node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
        });
    }

    // el('button', { class: 'x', onClick() {}, style: { '--c': 'red' } }, 'child', ...)
    function el(tag, props, ...kids) {
        const node = document.createElement(tag);
        for (const [key, value] of Object.entries(props || {})) {
            if (value == null || value === false) continue;
            if (key === 'class') node.className = value;
            else if (key === 'text') node.textContent = value;
            else if (key === 'style') {
                for (const [prop, v] of Object.entries(value)) {
                    if (prop.startsWith('--')) node.style.setProperty(prop, v);
                    else node.style[prop] = v;
                }
            } else if (key.startsWith('on') && typeof value === 'function') {
                node.addEventListener(key.slice(2).toLowerCase(), value);
            } else node.setAttribute(key, value === true ? '' : value);
        }
        append(node, kids);
        return node;
    }

    function svg(tag, attrs, ...kids) {
        const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, value);
        append(node, kids);
        return node;
    }

    const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
    const pick = (list) => list[Math.floor(Math.random() * list.length)];

    function shuffle(list) {
        const copy = list.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    const sample = (list, n) => shuffle(list).slice(0, n);
    const article = (word) => (/^[aeiou]/i.test(word) ? 'an' : 'a');
    const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    // Points for an n-pointed star polygon.
    function starPoints(cx, cy, outer, inner, n = 5) {
        const pts = [];
        for (let i = 0; i < n * 2; i++) {
            const angle = -Math.PI / 2 + (i * Math.PI) / n;
            const r = i % 2 ? inner : outer;
            pts.push((cx + r * Math.cos(angle)).toFixed(1) + ',' + (cy + r * Math.sin(angle)).toFixed(1));
        }
        return pts.join(' ');
    }

    function confetti(count = 90) {
        const colours = ['#e63946', '#ffd60a', '#3a86ff', '#2dc653', '#9d4edd', '#fb8500', '#ff70a6'];
        const wrap = el('div', { class: 'confetti' });
        for (let i = 0; i < count; i++) {
            wrap.append(el('i', {
                style: {
                    left: Math.random() * 100 + '%',
                    background: pick(colours),
                    animationDelay: Math.random() * 1.2 + 's',
                    animationDuration: 2.5 + Math.random() * 2 + 's',
                    '--spin': Math.random() * 720 - 360 + 'deg',
                    '--drift': Math.random() * 200 - 100 + 'px',
                },
            }));
        }
        return wrap;
    }

    // The colours used by the balloon and shape games (names are spoken aloud).
    const COLOURS = [
        { name: 'red', hex: '#e63946' },
        { name: 'blue', hex: '#3a86ff' },
        { name: 'yellow', hex: '#ffd60a' },
        { name: 'green', hex: '#2dc653' },
        { name: 'purple', hex: '#9d4edd' },
        { name: 'orange', hex: '#fb8500' },
    ];

    const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

    return { el, svg, randInt, pick, shuffle, sample, article, capitalise, starPoints, confetti, COLOURS, NUMBER_WORDS };
})();
