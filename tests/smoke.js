const puppeteer = require('puppeteer-core');
const path = require('path');
const out = (n) => path.join(__dirname, 'shots', n + '.png');
const indexUrl = require('url').pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    require('fs').mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
    const browser = await puppeteer.launch({
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: true,
        args: ['--autoplay-policy=no-user-gesture-required'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    await page.goto(indexUrl);
    await sleep(800);
    await page.screenshot({ path: out('01-welcome') });

    await page.type('.name-input', 'sam');
    await page.click('.name-form .big-btn');
    await sleep(500);
    await page.screenshot({ path: out('02-packs') });

    await page.click('.tile');
    await sleep(500);
    await page.screenshot({ path: out('03-games') });

    const report = {};
    const overlayShown = () => page.evaluate(() => !document.getElementById('overlay').hidden);
    const backToGames = async () => { await page.click('.celebrate-card .big-btn.alt'); await sleep(400); };
    const openGame = async (i) => { const tiles = await page.$$('.tile'); await tiles[i].click(); await sleep(600); };

    // 1. Counting
    await openGame(0);
    await page.screenshot({ path: out('10-counting') });
    for (let r = 0; r < 5; r++) {
        await page.evaluate(() => {
            const n = document.querySelectorAll('.count-item').length;
            document.querySelectorAll('.count-item').forEach((i) => i.click());
            [...document.querySelectorAll('.choice')].find((b) => b.textContent === String(n)).click();
        });
        if (r === 4) await page.screenshot({ path: out('11-counting-right') });
        await sleep(2800);
    }
    report.counting = await overlayShown();
    await page.screenshot({ path: out('12-celebrate') });
    await backToGames();

    // 2. Letters
    await openGame(1);
    await page.screenshot({ path: out('20-letters') });
    for (let r = 0; r < 5; r++) {
        await page.evaluate(() => {
            const first = document.querySelector('.word .first').textContent;
            const choices = [...document.querySelectorAll('.choice')];
            choices.find((b) => b.textContent !== first).click(); // try a wrong one first
            choices.find((b) => b.textContent === first).click();
        });
        if (r === 3) await page.screenshot({ path: out('21-letters-hidden-word') });
        await sleep(3000);
    }
    report.letters = await overlayShown();
    await backToGames();

    // 3. Balloons
    await openGame(2);
    await sleep(1500);
    await page.screenshot({ path: out('30-balloons') });
    for (let r = 0; r < 5; r++) {
        for (let k = 0; k < 3; k++) {
            await page.waitForFunction(() => {
                const target = document.querySelector('.pip').style.getPropertyValue('--c');
                return [...document.querySelectorAll('.balloon:not(.popped)')].some((b) => b.style.getPropertyValue('--c') === target);
            }, { timeout: 10000 });
            await page.evaluate(() => {
                const target = document.querySelector('.pip').style.getPropertyValue('--c');
                const b = [...document.querySelectorAll('.balloon:not(.popped)')].find((x) => x.style.getPropertyValue('--c') === target);
                b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            });
            await sleep(200);
        }
        await sleep(2900);
    }
    report.balloons = await overlayShown();
    await backToGames();

    // 4. Shapes
    await openGame(3);
    await page.screenshot({ path: out('40-shapes') });
    for (let r = 0; r < 5; r++) {
        await page.evaluate(() => {
            const names = Object.fromEntries(LS.ui.COLOURS.map((c) => [c.hex, c.name]));
            const describe = (svgEl) => {
                const s = svgEl.firstChild;
                let shape;
                if (s.tagName === 'circle') shape = 'circle';
                else if (s.tagName === 'path') shape = 'heart';
                else if (s.tagName === 'rect') shape = s.getAttribute('width') === s.getAttribute('height') ? 'square' : 'rectangle';
                else shape = s.getAttribute('points').split(' ').length === 3 ? 'triangle' : 'star';
                return { shape, colour: names[s.getAttribute('fill')] };
            };
            const prompt = document.querySelector('.prompt-text').textContent;
            const btns = [...document.querySelectorAll('.shape-btn')];
            const btn = btns.find((b) => {
                const d = describe(b.querySelector('svg'));
                return prompt.includes(`the ${d.colour} ${d.shape}?`) || prompt.endsWith(`the ${d.shape}?`);
            });
            btn.click();
        });
        if (r === 3) await page.screenshot({ path: out('41-shapes-colour') });
        await sleep(2700);
    }
    report.shapes = await overlayShown();
    await backToGames();

    // 5. Pairs
    await openGame(4);
    await page.click('.card');
    await sleep(300);
    await page.screenshot({ path: out('50-pairs') });
    // reset by flipping a mismatch first, then solve
    const cards = await page.$$('.card');
    await page.evaluate(async () => {
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const cards = [...document.querySelectorAll('.card')];
        const first = cards[0];
        const emoji = (c) => c.querySelector('.front').textContent;
        const mismatch = cards.find((c) => emoji(c) !== emoji(first));
        mismatch.click();
        await wait(1700);
        const groups = {};
        cards.forEach((c) => (groups[emoji(c)] ||= []).push(c));
        for (const pair of Object.values(groups)) {
            pair[0].click(); await wait(100); pair[1].click(); await wait(1100);
        }
    });
    await sleep(3000);
    report.pairs = await overlayShown();
    await backToGames();

    // 6. Paint
    await openGame(5);
    await page.evaluate(() => {
        const sw = document.querySelectorAll('.swatch');
        const regions = document.querySelectorAll('.region');
        regions.forEach((r, i) => { sw[i % sw.length].click(); r.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    });
    await sleep(400);
    await page.screenshot({ path: out('60-paint') });
    for (const n of [1, 2]) {
        await page.evaluate(() => [...document.querySelectorAll('.paint-controls .nav-btn')][1].click());
        await page.evaluate(() => {
            const sw = document.querySelectorAll('.swatch');
            document.querySelectorAll('.region').forEach((r, i) => { sw[(i * 5) % sw.length].click(); r.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
        });
        await sleep(400);
        await page.screenshot({ path: out('6' + n + '-paint') });
    }
    await page.click('.paint-controls .big-btn');
    await sleep(500);
    report.paint = await overlayShown();
    await page.screenshot({ path: out('63-paint-done') });
    await backToGames();

    // Reload: the player picker should offer Sam, and the star jar should persist.
    await page.reload();
    await sleep(600);
    await page.screenshot({ path: out('70-welcome-again') });
    report.pickerNames = await page.evaluate(() => [...document.querySelectorAll('.player-btn:not(.new) .player-name')].map((n) => n.textContent));
    await page.click('.player-btn');
    await sleep(400);
    report.jar = await page.evaluate(() => document.querySelector('.jar').textContent);
    await page.screenshot({ path: out('71-packs-two') });

    // The Ages 4–5 packs. Each game marks its right answer with data-right; pick a wrong one first, then the right one.
    // Share it out needs its sweets dealing first, and the last round of My name is built letter by letter.
    const ready = () => document.querySelector('[data-right]:not(.right), .share-sweet:not(:disabled), .tile-letter:not(.used)');

    async function playRound() {
        await page.waitForFunction(ready, { timeout: 30000 });
        await page.evaluate(() => {
            const sweets = [...document.querySelectorAll('.share-sweet:not(:disabled)')];
            if (sweets.length && !document.querySelector('[data-right]:not(.right)')) sweets.forEach((x) => x.click());
        });
        if ((await page.$$('.tile-letter:not(.used)')).length) {
            await page.evaluate((name) => {
                const tiles = [...document.querySelectorAll('.tile-letter')];
                tiles.find((t) => t.dataset.letter !== name[0]).click(); // a wrong one first
                for (const ch of name) tiles.find((t) => t.dataset.letter === ch && !t.disabled).click();
            }, 'Sam');
            return;
        }
        await page.waitForFunction(() => document.querySelector('[data-right]:not(.right)'), { timeout: 30000 });
        await page.evaluate(() => {
            const right = document.querySelector('[data-right]:not(.right)');
            const wrong = [...right.parentElement.children].find((b) => b !== right && !b.disabled);
            if (wrong) wrong.click();
            right.click();
        });
    }

    async function playPack(tileIndex, prefix, games) {
        await (await page.$$('.tile'))[tileIndex].click();
        await sleep(500);
        await page.screenshot({ path: out(prefix + '0-menu') });
        for (let g = 0; g < games.length; g++) {
            await openGame(g);
            for (let r = 0; r < 5; r++) {
                await page.waitForFunction(ready, { timeout: 30000 });
                if (r === 0 || r === 3 || r === 4) await page.screenshot({ path: out(prefix + (g + 1) + '-' + games[g] + '-round' + (r + 1)) });
                await playRound();
                await sleep(400);
                if (r === 4) await page.screenshot({ path: out(prefix + (g + 1) + '-' + games[g] + '-right') });
            }
            await page.waitForFunction(() => !document.getElementById('overlay').hidden, { timeout: 15000 }).catch(() => {});
            report[games[g]] = await overlayShown();
            await backToGames();
        }
        await page.click('.topbar .nav-btn'); // back to the packs
        await sleep(400);
    }

    const bigSteps = ['ispy', 'soundout', 'rhyme', 'moreless', 'onemore', 'pattern'];
    const cleverClogs = ['findnumber', 'dice', 'share', 'wordbuilder', 'myname', 'oddoneout'];
    await playPack(1, '9', bigSteps);
    await playPack(2, 'c', cleverClogs);
    report.jarAfterAllPacks = await page.evaluate(() => document.querySelector('.jar').textContent);

    // Smaller screen check
    await page.setViewport({ width: 1024, height: 600 });
    await page.screenshot({ path: out('83-small-packs') });
    for (const [tileIndex, games, picks] of [[1, bigSteps, [1, 3, 4, 5]], [2, cleverClogs, [1, 2, 4, 5]]]) {
        await (await page.$$('.tile'))[tileIndex].click();
        await sleep(300);
        for (const g of picks) {
            await openGame(g);
            await page.waitForFunction(() => document.querySelector('[data-right], .share-sweet'), { timeout: 30000 });
            await page.screenshot({ path: out('82-small-' + games[g]) });
            await page.click('.topbar .nav-btn');
            await sleep(400);
        }
        await page.click('.topbar .nav-btn');
        await sleep(400);
    }
    await page.click('.tile');
    await sleep(300);
    await page.screenshot({ path: out('80-small-games') });
    const t = await page.$$('.tile'); await t[4].click(); await sleep(500);
    await page.screenshot({ path: out('81-small-pairs') });

    // A second player: "Someone new" should add them to the picker alongside Sam.
    await page.setViewport({ width: 1366, height: 768 });
    await page.reload();
    await sleep(500);
    await page.click('.player-btn.new');
    await sleep(300);
    await page.type('.name-input', 'ava');
    await page.click('.name-form .big-btn');
    await sleep(400);
    await page.reload();
    await sleep(500);
    report.pickerAfterNew = await page.evaluate(() => [...document.querySelectorAll('.player-btn:not(.new) .player-name')].map((n) => n.textContent));
    await page.screenshot({ path: out('72-two-players') });

    console.log(JSON.stringify(report, null, 1));
    console.log('ERRORS:', errors.length ? errors : 'none');
    await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
