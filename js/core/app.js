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

    const jarKey = () => 'ls.stars.' + state.name.toLowerCase();
    const jar = () => store.get(jarKey(), 0);
    const addToJar = (n) => store.set(jarKey(), jar() + n);

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
    function leave() {
        if (cleanup) { const c = cleanup; cleanup = null; c(); }
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
    function showWelcome() {
        leave();
        const logo = el('div', { class: 'logo' },
            el('span', { class: 'logo-star' }, '⭐'), ' Little Stars ', el('span', { class: 'logo-star delay' }, '⭐'));
        let body;

        if (state.name) {
            body = [
                el('h1', {}, `Hello again, ${state.name}!`),
                el('button', { class: 'big-btn', 'data-say': "Let's play!", onClick: begin }, '▶  Play'),
                el('button', {
                    class: 'link-btn',
                    onClick() { state.name = ''; store.set('ls.name', ''); showWelcome(); },
                }, `I'm not ${state.name}`),
            ];
        } else {
            const input = el('input', {
                class: 'name-input', type: 'text', maxlength: '14', placeholder: 'Type your name',
                autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Your name',
            });
            body = el('form', {
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
                    state.name = name;
                    store.set('ls.name', name);
                    begin();
                },
            }, el('h1', {}, "What's your name?"), input, el('button', { class: 'big-btn', type: 'submit' }, "Let's go!  ▶"));
            setTimeout(() => input.focus(), 50);
        }

        app.replaceChildren(el('div', { class: 'screen welcome' }, logo, body));
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
            el('div', { class: 'jar', title: 'Stars collected' }, `⭐ ${jar()}`),
            settingsButtons());

        app.replaceChildren(el('div', { class: 'screen menu' }, header,
            el('div', { class: 'scroll' }, el('h1', { class: 'screen-heading' }, 'Pick a pack'), sections)));
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
            say: (text) => LS.speech.say(text),
            // The instruction shown at the top, spoken aloud. The speaker button repeats it.
            prompt(text) { lastPrompt = text; promptText.textContent = text; return LS.speech.say(text); },
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
            tryAgain(message) { LS.sound.oops(); LS.speech.say(message || 'Oops! Have another go.'); },
            // For games without stars (like painting): end the game now.
            finish(message) {
                if (finished) return;
                finished = true;
                celebrate(pack, game, Math.max(stars, 1), message);
            },
            later(fn, ms) {
                const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
                timers.add(id);
                return id;
            },
            onFrame(fn) {
                frameFns.add(fn);
                if (rafId == null) rafId = requestAnimationFrame(loop);
            },
        };

        const gameCleanup = game.start(stage, api);

        cleanup = () => {
            timers.forEach(clearTimeout);
            timers.clear();
            frameFns.clear();
            if (rafId != null) cancelAnimationFrame(rafId);
            if (typeof gameCleanup === 'function') gameCleanup();
        };
    }

    // ---------- Celebration ----------
    function celebrate(pack, game, stars, message) {
        addToJar(stars);
        LS.sound.fanfare();
        const starText = stars === 1 ? 'a star' : `${stars} stars`;
        const line = message || `You got ${starText}!`;

        const card = el('div', { class: 'celebrate-card' },
            el('div', { class: 'big-star' }, '⭐'),
            el('h1', {}, `Well done, ${state.name}!`),
            el('p', {}, line),
            el('div', { class: 'btn-row' },
                el('button', { class: 'big-btn', 'data-say': 'Play again', onClick: () => playGame(pack, game) }, '🔁 Again'),
                el('button', { class: 'big-btn alt', 'data-say': 'Pick another game', onClick: () => openPack(pack) }, '🎮 More games')));

        overlay.replaceChildren(LS.ui.confetti(), card);
        overlay.hidden = false;
        LS.speech.say(`Hooray! Well done, ${state.name}! ${line}`);
    }

    showWelcome();
})();
