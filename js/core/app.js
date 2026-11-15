// Screens: name entry -> pack menu -> game menu -> game -> celebration.
(function () {
    const { el, pick } = LS.ui;
    const app = document.getElementById('app');
    const overlay = document.getElementById('overlay');

    // localStorage can be unavailable (e.g. some private windows), so never let it break the game.
    const store = {
        get(key, fallback) {
            try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
        },
        set(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
        },
    };

    const state = { name: store.get('ls.name', ''), sound: store.get('ls.sound', true) };

    function applySound() {
        LS.sound.setEnabled(state.sound);
        LS.speech.setEnabled(state.sound);
    }
    applySound();

    const jarKey = (name = state.name) => 'ls.stars.' + name.toLowerCase();
    const jar = (name) => store.get(jarKey(name), 0);
    const addToJar = (n) => store.set(jarKey(), jar() + n);

    // Everyone who has played on this computer, most recent first.
    // Players from before this list existed only had a star jar saved, so pick those up too.
    function players() {
        const list = store.get('ls.players', []);
        const known = new Set(list.map((n) => n.toLowerCase()));
        const add = (n) => { if (n && !known.has(n.toLowerCase())) { known.add(n.toLowerCase()); list.push(n); } };
        add(state.name);
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('ls.stars.')) add(cleanName(key.slice('ls.stars.'.length)));
            }
        } catch (e) { /* ignore */ }
        return list;
    }

    function choosePlayer(name) {
        const existing = players().find((n) => n.toLowerCase() === name.toLowerCase());
        state.name = existing || name;
        store.set('ls.name', state.name);
        store.set('ls.players', [state.name, ...players().filter((n) => n !== state.name)]);
        begin();
    }

    // Browsers only allow sound after the first click or key press.
    let unlocked = false;
    function unlock() { unlocked = true; LS.sound.unlock(); }
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Anything with data-say is read aloud when the mouse moves over it, to help pre-readers find their way.
    let lastHover = null;
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest ? e.target.closest('[data-say]') : null;
        if (target === lastHover) return;
        lastHover = target;
        if (target && unlocked) LS.speech.say(target.dataset.say);
    });

    // Tidy up whatever screen is showing before drawing the next one.
    let cleanup = null;
    const screenTimers = new Set(); // timers belonging to the current screen (e.g. the celebration's star sounds)
    function screenLater(fn, ms) {
        const id = setTimeout(() => { screenTimers.delete(id); fn(); }, ms);
        screenTimers.add(id);
    }
    function leave() {
        if (cleanup) { const c = cleanup; cleanup = null; c(); }
        screenTimers.forEach(clearTimeout);
        screenTimers.clear();
        overlay.hidden = true;
        overlay.replaceChildren();
        LS.speech.stop();
    }

    function toggleFullscreen() {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    }

    function settingsButtons() {
        const soundBtn = el('button', {
            class: 'nav-btn small', title: 'Sound on/off', 'aria-label': 'Sound on or off',
            onClick() {
                state.sound = !state.sound;
                store.set('ls.sound', state.sound);
                applySound();
                soundBtn.textContent = state.sound ? '🔊' : '🔇';
            },
        }, state.sound ? '🔊' : '🔇');
        const fullBtn = el('button', { class: 'nav-btn small', title: 'Full screen', 'aria-label': 'Full screen', onClick: toggleFullscreen }, '🖥️');
        return [soundBtn, fullBtn];
    }

    const cleanName = (raw) => {
        const n = raw.trim().replace(/[^\p{L}\p{M}' -]/gu, '').slice(0, 14).trim();
        return n.charAt(0).toUpperCase() + n.slice(1);
    };

    // ---------- Welcome / name ----------
    const logo = () => el('div', { class: 'logo' },
        el('span', { class: 'logo-star' }, '⭐'), ' Little Stars ', el('span', { class: 'logo-star delay' }, '⭐'));

    // Players who've been here before just pick their name; anyone new types it in.
    function showWelcome() {
        leave();
        const list = players();
        if (!list.length) { showNameForm(false); return; }

        const buttons = list.map((name) => el('button', {
            class: 'player-btn', 'data-say': name, onClick: () => choosePlayer(name),
        }, el('span', { class: 'player-name' }, name), el('span', { class: 'player-stars' }, `⭐ ${jar(name)}`)));
        const someoneNew = el('button', {
            class: 'player-btn new', 'data-say': 'Someone new', onClick: () => showNameForm(true),
        }, el('span', { class: 'player-name' }, '➕'), el('span', { class: 'player-stars' }, 'Someone new'));

        app.replaceChildren(el('div', { class: 'screen welcome' }, logo(),
            el('h1', {}, "Who's playing?"),
            el('div', { class: 'player-grid' }, buttons, someoneNew)));
    }

    function showNameForm(canGoBack) {
        leave();
        const input = el('input', {
            class: 'name-input', type: 'text', maxlength: '14', placeholder: 'Type your name',
            autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Your name',
        });
        const form = el('form', {
            class: 'name-form',
            onSubmit(e) {
                e.preventDefault();
                const name = cleanName(input.value);
                if (!name) {
                    input.classList.remove('shake');
                    void input.offsetWidth;
                    input.classList.add('shake');
                    input.focus();
                    return;
                }
                choosePlayer(name);
            },
        }, el('h1', {}, "What's your name?"), input, el('button', { class: 'big-btn', type: 'submit' }, "Let's go!  ▶"),
            canGoBack ? el('button', { class: 'link-btn', type: 'button', onClick: showWelcome }, 'Back to the names') : null);
        setTimeout(() => input.focus(), 50);
        app.replaceChildren(el('div', { class: 'screen welcome' }, logo(), form));
    }

    function begin() {
        unlock();
        showPacks(`Hello ${state.name}! Let's play! Pick a pack.`);
    }

    // ---------- Pack menu ----------
    function tile({ icon, title, sub, colour, onClick }) {
        return el('button', { class: 'tile', style: { '--tile': colour }, 'data-say': title, onClick },
            el('span', { class: 'tile-icon' }, icon),
            el('span', { class: 'tile-label' }, title),
            sub ? el('span', { class: 'tile-sub' }, sub) : null);
    }

    function showPacks(greeting) {
        leave();
        const groups = new Map();
        LS.packs.forEach((p) => {
            if (!groups.has(p.ages)) groups.set(p.ages, []);
            groups.get(p.ages).push(p);
        });

        const sections = [...groups].map(([ages, packs]) => el('section', { class: 'pack-group' },
            el('h2', {}, ages),
            el('div', { class: 'tile-grid' }, packs.map((p) => tile({
                icon: p.icon, title: p.title, sub: `${p.games.length} games`, colour: p.colour, onClick: () => openPack(p),
            })))));

        const header = el('header', { class: 'topbar' },
            el('button', { class: 'nav-btn', 'data-say': 'Change player', title: 'Change player', onClick: showWelcome }, '👋'),
            el('div', { class: 'title' }, `Hi ${state.name}!`),
            el('button', { class: 'big-btn shop-btn', 'data-say': 'Sticker book', onClick: showStickers }, '📒 Stickers'),
            el('div', { class: 'jar', title: 'Stars collected' }, `⭐ ${jar()}`),
            settingsButtons());

        app.replaceChildren(el('div', { class: 'screen menu' }, header,
            el('div', { class: 'scroll' }, el('h1', { class: 'screen-heading' }, 'Pick a pack'), el('div', { class: 'pack-groups' }, sections))));
        LS.speech.say(greeting || 'Pick a pack to play!');
    }

    // ---------- Game menu ----------
    function openPack(pack) {
        leave();
        const header = el('header', { class: 'topbar' },
            el('button', { class: 'nav-btn', 'data-say': 'Back to the packs', title: 'Back', onClick: () => showPacks() }, '⬅️'),
            el('div', { class: 'title' }, pack.title),
            el('div', { class: 'jar', title: 'Stars collected' }, `⭐ ${jar()}`),
            settingsButtons());

        const tiles = pack.games.map((id) => LS.games[id]).filter(Boolean).map((game) => tile({
            icon: game.icon, title: game.title, colour: game.colour, onClick: () => playGame(pack, game),
        }));

        app.replaceChildren(el('div', { class: 'screen menu' }, header,
            el('div', { class: 'scroll' }, el('h1', { class: 'screen-heading' }, 'Which game shall we play?'),
                el('div', { class: 'tile-grid games' }, tiles))));
        LS.speech.say('Which game shall we play?');
    }

    // ---------- A game ----------
    function playGame(pack, game) {
        leave();

        let stars = 0;
        let finished = false;
        let active = true; // false once the player leaves, so nothing late can speak or schedule
        let lastPrompt = '';
        const timers = new Set();
        const frameFns = new Set();
        let rafId = null;
        let lastFrame = null;

        const promptText = el('div', { class: 'prompt-text' });
        const starRow = el('div', { class: 'star-row' },
            Array.from({ length: game.stars }, () => el('span', { class: 'star-slot' }, '★')));
        const stage = el('main', { class: `stage stage-${game.id}` });

        const header = el('header', { class: 'topbar' },
            el('button', { class: 'nav-btn', 'data-say': 'Back to the games', title: 'Back to the games', onClick: () => openPack(pack) }, '🏠'),
            el('div', { class: 'prompt' },
                el('button', { class: 'hear-btn', title: 'Hear it again', 'aria-label': 'Hear it again', onClick: () => LS.speech.say(lastPrompt) }, '🔊'),
                promptText),
            starRow);

        app.replaceChildren(el('div', { class: 'screen game', style: { '--accent': game.colour } }, header, stage));

        function loop(t) {
            const dt = lastFrame == null ? 0 : Math.min(0.05, (t - lastFrame) / 1000);
            lastFrame = t;
            frameFns.forEach((fn) => fn(dt));
            rafId = requestAnimationFrame(loop);
        }

        const praise = () => pick(['Well done!', 'Brilliant!', 'Super!', 'Fantastic!', 'Amazing!', 'Yes!',
            `Well done, ${state.name}!`, `Great job, ${state.name}!`]);

        const api = {
            name: state.name,
            players: players(), // everyone who has played here, including this player
            say: (text) => (active ? LS.speech.say(text) : Promise.resolve()),
            // The instruction shown at the top, spoken aloud. The speaker button repeats it.
            // Pass `spoken` when the speech should differ from the text, e.g. a letter's sound ("ser") vs the letter ("s").
            prompt(text, spoken = text) {
                if (!active) return Promise.resolve();
                lastPrompt = spoken;
                promptText.textContent = text;
                return LS.speech.say(spoken);
            },
            // Resolves after ms. Never resolves if the player leaves first, so `await api.wait()` chains just stop.
            wait: (ms) => new Promise((resolve) => api.later(resolve, ms)),
            // Award a star. Returns true when that was the last star (the game should then stop).
            correct(message) {
                if (finished) return true;
                stars++;
                LS.sound.cheer();
                const slot = starRow.children[stars - 1];
                if (slot) slot.classList.add('earned');
                LS.speech.say(message ? `${praise()} ${message}` : praise());
                if (stars >= game.stars) {
                    finished = true;
                    api.later(() => celebrate(pack, game, stars), 2600);
                    return true;
                }
                return false;
            },
            // Returns a promise that resolves when the message has been spoken.
            tryAgain(message) { LS.sound.oops(); return api.say(message || 'Oops! Have another go.'); },
            // For games without stars (like painting): end the game now.
            finish(message) {
                if (finished) return;
                finished = true;
                celebrate(pack, game, Math.max(stars, 1), message);
            },
            later(fn, ms) {
                if (!active) return null;
                const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
                timers.add(id);
                return id;
            },
            onFrame(fn) {
                if (!active) return;
                frameFns.add(fn);
                if (rafId == null) rafId = requestAnimationFrame(loop);
            },
        };

        const gameCleanup = game.start(stage, api);

        cleanup = () => {
            active = false;
            timers.forEach(clearTimeout);
            timers.clear();
            frameFns.clear();
            if (rafId != null) cancelAnimationFrame(rafId);
            if (typeof gameCleanup === 'function') gameCleanup();
        };
    }

    // ---------- Sticker book ----------
    function showStickers() {
        leave();
        const key = 'ls.stickers.' + state.name.toLowerCase();
        LS.stickerBook.open({
            name: state.name,
            stars: () => jar(),
            spend: (n) => store.set(jarKey(), Math.max(0, jar() - n)),
            load: () => store.get(key, {}),
            save: (data) => store.set(key, data),
            back: () => showPacks(),
            settingsButtons,
            render: (node) => { LS.speech.stop(); app.replaceChildren(node); },
        });
    }

    // ---------- Celebration ----------
    function celebrate(pack, game, stars, message) {
        addToJar(stars);
        LS.sound.fanfare();
        const starText = stars === 1 ? 'a star' : `${stars} stars`;
        const line = message || `You got ${starText}!`;

        // The stars won pop in one at a time, each with a little ding, then the jar shows the new total.
        const STAR_GAP = 450;
        const awarded = Array.from({ length: stars }, (_, i) =>
            el('span', { class: 'award-star', style: { animationDelay: 0.9 + (i * STAR_GAP) / 1000 + 's' } }, '⭐'));
        const total = el('p', { class: 'jar-total' }, `Your star jar: ⭐ ${jar()}`);
        total.style.animationDelay = 0.9 + (stars * STAR_GAP) / 1000 + 's';
        awarded.forEach((_, i) => screenLater(() => LS.sound.ding(i), 900 + i * STAR_GAP));

        const card = el('div', { class: 'celebrate-card' },
            el('h1', {}, `Well done, ${state.name}!`),
            el('p', {}, line),
            el('div', { class: 'award-stars' }, awarded),
            total,
            el('div', { class: 'btn-row' },
                el('button', { class: 'big-btn', 'data-say': 'Play again', onClick: () => playGame(pack, game) }, '🔁 Again'),
                el('button', { class: 'big-btn alt', 'data-say': 'Pick another game', onClick: () => openPack(pack) }, '🎮 More games'),
                el('button', { class: 'big-btn sticker', 'data-say': 'Sticker book', onClick: showStickers }, '📒 Stickers')));

        overlay.replaceChildren(LS.ui.confetti(), card);
        overlay.hidden = false;
        LS.speech.say(`Hooray! Well done, ${state.name}! ${line}`);
    }

    showWelcome();
})();
