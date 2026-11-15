// The sticker book: spend stars in the shop, then stick stickers onto scenes.
// Placing is point-and-click (pick a sticker, then point to where it goes), so there's no dragging.
// Clicking a sticker that's already stuck down picks it back up, so mistakes are easy to fix.
window.LS = window.LS || {};

LS.stickerBook = (function () {
    const { el, randInt } = LS.ui;

    // Emoji chosen to render on Windows 10's emoji font.
    const CATALOGUE = [
        ['🐶', 'puppy'], ['🐱', 'kitten'], ['🐰', 'bunny'], ['🦊', 'fox'], ['🐻', 'bear'], ['🐼', 'panda'],
        ['🐨', 'koala'], ['🐯', 'tiger'], ['🦁', 'lion'], ['🐸', 'frog'], ['🐵', 'monkey'], ['🐧', 'penguin'],
        ['🐤', 'chick'], ['🦉', 'owl'], ['🦋', 'butterfly'], ['🐞', 'ladybird'], ['🐝', 'bee'], ['🐢', 'tortoise'],
        ['🐬', 'dolphin'], ['🐳', 'whale'], ['🐠', 'fish'], ['🐙', 'octopus'], ['🦀', 'crab'], ['🐌', 'snail'],
        ['🌸', 'flower'], ['🌻', 'sunflower'], ['🌳', 'tree'], ['🍄', 'mushroom'], ['🌈', 'rainbow'], ['⭐', 'star'],
        ['🌙', 'moon'], ['☀️', 'sun'], ['☁️', 'cloud'], ['🍦', 'ice cream'], ['🍭', 'lollipop'], ['🧁', 'cupcake'],
        ['🍓', 'strawberry'], ['🎈', 'balloon'], ['🚀', 'rocket'], ['🚂', 'train'], ['🚗', 'car'], ['⛵', 'boat'],
        ['🏠', 'house'], ['🏰', 'castle'], ['🎁', 'present'], ['🌍', 'planet'],
    ].map(([e, name]) => ({ e, name, cost: 5 }))
        // Special stickers cost more.
        .concat([['🦄', 'unicorn'], ['🐉', 'dragon'], ['👑', 'crown'], ['🧚', 'fairy'], ['🦖', 'dinosaur'], ['💎', 'jewel']]
            .map(([e, name]) => ({ e, name, cost: 10, special: true })));
    const BY_EMOJI = Object.fromEntries(CATALOGUE.map((s) => [s.e, s]));

    const PAGES = [
        { id: 'garden', title: 'Garden', icon: '🌳' },
        { id: 'sea', title: 'Under the sea', icon: '🌊' },
        { id: 'space', title: 'Space', icon: '🚀' },
    ];

    const blank = () => ({ spare: [], pages: { garden: [], sea: [], space: [] } });

    /**
     * ctx (from app.js): name, stars(), spend(n), load(), save(data), back(), settingsButtons(), render(node)
     */
    function open(ctx, pageId = 'garden') {
        const data = Object.assign(blank(), ctx.load());
        PAGES.forEach((p) => { if (!Array.isArray(data.pages[p.id])) data.pages[p.id] = []; });
        let page = pageId;
        let selected = null; // emoji of the sticker in hand

        const jar = el('div', { class: 'jar', title: 'Stars to spend' });
        const showJar = () => { jar.textContent = `⭐ ${ctx.stars()}`; };
        showJar();

        const header = el('header', { class: 'topbar' },
            el('button', { class: 'nav-btn', 'data-say': 'Back to the packs', title: 'Back', onClick: ctx.back }, '⬅️'),
            el('div', { class: 'title' }, 'Sticker book'),
            el('button', { class: 'big-btn shop-btn', 'data-say': 'Sticker shop', onClick: () => shop(ctx, page) }, '🛒 Shop'),
            jar,
            ctx.settingsButtons());

        const tabs = el('div', { class: 'page-tabs' });
        const board = el('div', { class: 'board' });
        const tray = el('div', { class: 'tray' });

        board.addEventListener('click', (e) => {
            if (!selected) {
                LS.speech.say(data.spare.length ? 'Pick a sticker first, then point to where it goes!' : 'Visit the shop to get some stickers!');
                return;
            }
            const rect = board.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            data.pages[page].push({ e: selected, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, r: randInt(-15, 15) });
            data.spare.splice(data.spare.indexOf(selected), 1);
            LS.sound.splash();
            const name = BY_EMOJI[selected] ? BY_EMOJI[selected].name : 'sticker';
            selected = data.spare.includes(selected) ? selected : null;
            ctx.save(data);
            draw();
            LS.speech.say(`Stuck! What a lovely ${name}!`);
        });

        function draw() {
            tabs.replaceChildren(...PAGES.map((p) => el('button', {
                class: 'page-tab' + (p.id === page ? ' selected' : ''), 'data-say': p.title, title: p.title,
                onClick() { page = p.id; draw(); },
            }, p.icon)));

            board.className = `board board-${page}`;
            board.classList.toggle('placing', !!selected);
            board.replaceChildren(...data.pages[page].map((s, i) => el('button', {
                class: 'placed-sticker',
                style: { left: s.x + '%', top: s.y + '%', '--r': s.r + 'deg' },
                title: 'Pick up',
                onClick(e) {
                    if (selected) return; // let the click reach the board, so the sticker in hand goes on top
                    e.stopPropagation();
                    data.pages[page].splice(i, 1);
                    data.spare.push(s.e);
                    selected = s.e;
                    ctx.save(data);
                    LS.sound.flip();
                    draw();
                    LS.speech.say('Picked it up! Point to where it should go.');
                },
            }, s.e)));

            // Spare stickers, with a count when there's more than one of the same.
            const counts = new Map();
            data.spare.forEach((e) => counts.set(e, (counts.get(e) || 0) + 1));
            const items = [...counts].map(([e, n]) => el('button', {
                class: 'tray-sticker' + (e === selected ? ' selected' : ''),
                'data-say': BY_EMOJI[e] ? BY_EMOJI[e].name : null,
                onClick() {
                    selected = selected === e ? null : e;
                    LS.sound.click();
                    draw();
                    if (selected) LS.speech.say(`Now point to where the ${BY_EMOJI[e] ? BY_EMOJI[e].name : 'sticker'} goes!`);
                },
            }, e, n > 1 ? el('span', { class: 'tray-count' }, `×${n}`) : null));
            tray.replaceChildren(el('div', { class: 'tray-label' }, 'Your stickers'),
                items.length ? el('div', { class: 'tray-items' }, items)
                    : el('button', { class: 'big-btn shop-btn', 'data-say': 'Sticker shop', onClick: () => shop(ctx, page) }, '🛒 Get stickers'));
        }

        draw();
        ctx.render(el('div', { class: 'screen sticker-screen' }, header,
            el('div', { class: 'book' }, tabs, board, tray)));

        if (data.spare.length) LS.speech.say('Pick a sticker, then point to where it goes!');
        else if (ctx.stars() >= 5) LS.speech.say("You haven't got any stickers to stick. Let's go to the shop!");
        else LS.speech.say('Play some games to win stars. Then you can buy stickers in the shop!');
    }

    function shop(ctx, returnPage) {
        LS.speech.stop();
        const jar = el('div', { class: 'jar', title: 'Stars to spend' });
        const grid = el('div', { class: 'shop-grid' });

        function draw() {
            const stars = ctx.stars();
            jar.textContent = `⭐ ${stars}`;
            grid.replaceChildren(...CATALOGUE.map((s) => {
                const canBuy = stars >= s.cost;
                const item = el('button', {
                    class: 'shop-item' + (s.special ? ' special' : '') + (canBuy ? '' : ' cant'),
                    'data-say': `${s.name}, ${s.cost} stars`,
                    onClick() {
                        const now = ctx.stars();
                        if (now < s.cost) {
                            LS.sound.oops();
                            LS.speech.say(`The ${s.name} costs ${s.cost} stars. You need ${s.cost - now} more. Play a game to win some!`);
                            return;
                        }
                        ctx.spend(s.cost);
                        const data = Object.assign(blank(), ctx.load());
                        data.spare.push(s.e);
                        ctx.save(data);
                        LS.sound.cheer();
                        draw();
                        LS.speech.say(`You bought the ${s.name}! It's in your sticker book.`);
                    },
                }, el('span', { class: 'shop-emoji' }, s.e), el('span', { class: 'shop-price' }, `⭐ ${s.cost}`));
                return item;
            }));
        }

        const header = el('header', { class: 'topbar' },
            el('button', { class: 'nav-btn', 'data-say': 'Back to the sticker book', title: 'Back', onClick: () => open(ctx, returnPage) }, '⬅️'),
            el('div', { class: 'title' }, 'Sticker shop'),
            el('button', { class: 'big-btn shop-btn', 'data-say': 'My sticker book', onClick: () => open(ctx, returnPage) }, '📒 My book'),
            jar,
            ctx.settingsButtons());

        draw();
        ctx.render(el('div', { class: 'screen menu' }, header, el('div', { class: 'scroll' }, grid)));
        LS.speech.say('Welcome to the sticker shop! Which sticker would you like?');
    }

    return { open, CATALOGUE };
})();
