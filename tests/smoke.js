// Headless browser smoke test. Plays games through to the celebration screen and saves screenshots to tests/shots/.
//
//   npm test                     everything (several minutes)
//   npm test -- welcome          just the named parts: a game id (dice, ispy...), a pack (starter, bigsteps,
//   npm test -- dice share       cleverclogs), welcome (name screen, player picker, saving), stickers, or small
//                                (screenshots at a small laptop size)
//
// Run only the parts that cover what changed; run everything after changes to shared code (js/core, common.js, CSS).
const puppeteer = require('puppeteer-core');
const path = require('path');
const out = (n) => path.join(__dirname, 'shots', n + '.png');
const indexUrl = require('url').pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PACKS = {
    starter: ['counting', 'letters', 'balloons', 'shapes', 'pairs', 'paint'],
    bigsteps: ['ispy', 'soundout', 'rhyme', 'moreless', 'onemore', 'pattern'],
    cleverclogs: ['findnumber', 'dice', 'share', 'wordbuilder', 'myname', 'oddoneout'],
};
const PACK_ORDER = Object.keys(PACKS);
const OTHER_PARTS = ['welcome', 'stickers', 'small'];

// Work out which parts to run.
const args = process.argv.slice(2).map((a) => a.toLowerCase());
const known = new Set([...PACK_ORDER, ...Object.values(PACKS).flat(), ...OTHER_PARTS]);
const unknown = args.filter((a) => !known.has(a));
if (unknown.length) {
    console.error(`Unknown test part: ${unknown.join(', ')}\nChoose from: ${[...known].join(', ')}`);
    process.exit(1);
}
const all = args.length === 0;
const wantGame = (id) => all || args.includes(id) || PACK_ORDER.some((p) => args.includes(p) && PACKS[p].includes(id));
const want = (part) => all || args.includes(part);

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
    // The privacy note promises nothing leaves the device, so the game must never request anything from the internet.
    page.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) errors.push('external request: ' + r.url()); });

    const report = {};
    const overlayShown = () => page.evaluate(() => !document.getElementById('overlay').hidden);
    const backToGames = async () => { await page.click('.celebrate-card .big-btn.alt'); await sleep(400); };
    const openGame = async (i) => { const tiles = await page.$$('.tile'); await tiles[i].click(); await sleep(600); };
    const openPack = async (pack) => { await (await page.$$('.tile'))[PACK_ORDER.indexOf(pack)].click(); await sleep(400); };
    const backToPacks = async () => { await page.click('.topbar .nav-btn'); await sleep(400); };
    const jarNumber = () => page.evaluate(() => Number(document.querySelector('.jar').textContent.replace(/\D/g, '')));

    // Always: start fresh and enter a name.
    await page.goto(indexUrl);
    await sleep(800);
    await page.screenshot({ path: out('01-welcome') });
    await page.type('.name-input', 'sam');
    await page.click('.name-form .big-btn');
    await sleep(500);
    await page.screenshot({ path: out('02-packs') });

    // ---------- Starter pack: each game has its own way of finding the answer ----------
    const STARTER = {
        async counting() {
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
            await page.screenshot({ path: out('12-celebrate') });
            await sleep(3500); // the stars pop in one at a time
            await page.screenshot({ path: out('13-celebrate-stars') });
            report.awardStars = await page.evaluate(() => document.querySelectorAll('.award-star').length);
        },
        async letters() {
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
        },
        async balloons() {
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
        },
        async shapes() {
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
                    const btn = [...document.querySelectorAll('.shape-btn')].find((b) => {
                        const d = describe(b.querySelector('svg'));
                        return prompt.includes(`the ${d.colour} ${d.shape}?`) || prompt.endsWith(`the ${d.shape}?`);
                    });
                    btn.click();
                });
                if (r === 3) await page.screenshot({ path: out('41-shapes-colour') });
                await sleep(2700);
            }
        },
        async pairs() {
            await page.click('.card');
            await sleep(300);
            await page.screenshot({ path: out('50-pairs') });
            // A mismatch first, then solve.
            await page.evaluate(async () => {
                const wait = (ms) => new Promise((r) => setTimeout(r, ms));
                const cards = [...document.querySelectorAll('.card')];
                const emoji = (c) => c.querySelector('.front').textContent;
                cards.find((c) => emoji(c) !== emoji(cards[0])).click();
                await wait(1700);
                const groups = {};
                cards.forEach((c) => (groups[emoji(c)] ||= []).push(c));
                for (const pair of Object.values(groups)) {
                    pair[0].click(); await wait(100); pair[1].click(); await wait(1100);
                }
            });
            await sleep(3000);
        },
        async paint() {
            const colourIn = (step) => page.evaluate((step) => {
                const sw = document.querySelectorAll('.swatch');
                document.querySelectorAll('.region').forEach((r, i) => { sw[(i * step) % sw.length].click(); r.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
            }, step);
            await colourIn(1);
            await sleep(400);
            await page.screenshot({ path: out('60-paint') });
            for (const n of [1, 2]) {
                await page.evaluate(() => [...document.querySelectorAll('.paint-controls .nav-btn')][1].click());
                await colourIn(5);
                await sleep(400);
                await page.screenshot({ path: out('6' + n + '-paint') });
            }
            await page.click('.paint-controls .big-btn');
            await sleep(500);
            await page.screenshot({ path: out('63-paint-done') });
        },
    };

    // ---------- Ages 4–5 packs: the right answer is marked with data-right ----------
    // Pick a wrong one first, then the right one. Share it out needs its sweets dealing first,
    // and the last round of My name is built letter by letter.
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

    async function playMarkedGame(id, shot) {
        for (let r = 0; r < 5; r++) {
            await page.waitForFunction(ready, { timeout: 30000 });
            if (r === 0 || r === 3 || r === 4) await page.screenshot({ path: out(`${shot}-round${r + 1}`) });
            await playRound();
            await sleep(400);
            if (r === 4) await page.screenshot({ path: out(`${shot}-right`) });
        }
    }

    // ---------- Play the chosen games ----------
    const SHOT_PREFIX = { bigsteps: '9', cleverclogs: 'c' };
    for (const pack of PACK_ORDER) {
        const games = PACKS[pack].filter(wantGame);
        if (!games.length) continue;
        await openPack(pack);
        await page.screenshot({ path: out(`03-${pack}-games`) });
        for (const id of games) {
            await openGame(PACKS[pack].indexOf(id));
            if (STARTER[id]) await STARTER[id]();
            else await playMarkedGame(id, `${SHOT_PREFIX[pack]}${PACKS[pack].indexOf(id) + 1}-${id}`);
            await page.waitForFunction(() => !document.getElementById('overlay').hidden, { timeout: 15000 }).catch(() => {});
            report[id] = await overlayShown();
            await backToGames();
        }
        await backToPacks();
    }

    // ---------- Stickers: buy three (5 + 5 + 10 stars), stick some down, pick one up again ----------
    if (want('stickers')) {
        // Give Sam enough stars to shop with, whatever else has run.
        await page.evaluate(() => localStorage.setItem('ls.stars.sam', JSON.stringify(Math.max(50, Number(localStorage.getItem('ls.stars.sam')) || 0))));
        await page.reload();
        await sleep(500);
        await page.click('.player-btn');
        await sleep(400);
        const before = await jarNumber();
        await page.click('.topbar .shop-btn');
        await sleep(400);
        await page.screenshot({ path: out('d0-sticker-book-empty') });
        await page.click('.topbar .shop-btn'); // the shop
        await sleep(400);
        await page.evaluate(() => {
            const items = [...document.querySelectorAll('.shop-item')];
            items[0].click();
            items[1].click();
            items.find((i) => i.classList.contains('special')).click();
        });
        await sleep(300);
        await page.screenshot({ path: out('d1-sticker-shop') });
        report.starsSpent = before - (await jarNumber());
        await page.click('.topbar .shop-btn'); // back to the book
        await sleep(400);
        const stickAt = async (fx, fy) => {
            await page.click('.tray-sticker');
            const box = await (await page.$('.board')).boundingBox();
            await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
            await sleep(300);
        };
        await stickAt(0.25, 0.4);
        await stickAt(0.6, 0.7);
        await (await page.$$('.page-tab'))[1].click(); // under the sea
        await sleep(200);
        await stickAt(0.5, 0.5);
        await page.screenshot({ path: out('d2-sticker-sea') });
        await (await page.$$('.page-tab'))[0].click();
        await sleep(200);
        await page.click('.placed-sticker'); // pick one up...
        await sleep(200);
        const box = await (await page.$('.board')).boundingBox();
        await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.3); // ...and put it somewhere else
        await sleep(300);
        await page.screenshot({ path: out('d3-sticker-garden') });
        await page.reload();
        await sleep(500);
        await page.click('.player-btn');
        await sleep(400);
        await page.click('.topbar .shop-btn');
        await sleep(400);
        const after = await page.evaluate(() => ({
            garden: document.querySelectorAll('.placed-sticker').length,
            spare: document.querySelectorAll('.tray-sticker').length,
        }));
        report.stickers = report.starsSpent === 20 && after.garden === 2 && after.spare === 0;
        if (!report.stickers) report.stickersDetail = { starsSpent: report.starsSpent, ...after };
        await backToPacks();
    }

    // ---------- Smaller laptop screen: screenshots only ----------
    if (want('small')) {
        await page.setViewport({ width: 1024, height: 600 });
        await page.screenshot({ path: out('83-small-packs') });
        for (const [pack, picks] of [['bigsteps', [1, 3, 4, 5]], ['cleverclogs', [1, 2, 4, 5]]]) {
            await openPack(pack);
            for (const g of picks) {
                await openGame(g);
                await page.waitForFunction(() => document.querySelector('[data-right], .share-sweet'), { timeout: 30000 });
                await page.screenshot({ path: out('82-small-' + PACKS[pack][g]) });
                await backToPacks(); // back to the pack's games
            }
            await backToPacks();
        }
        await openPack('starter');
        await page.screenshot({ path: out('80-small-games') });
        await openGame(4);
        await page.screenshot({ path: out('81-small-pairs') });
        await backToPacks();
        await backToPacks();
        await page.setViewport({ width: 1366, height: 768 });
    }

    // ---------- Welcome: the player picker, saved stars, and adding someone new ----------
    if (want('welcome')) {
        const starsBefore = await jarNumber();
        await page.reload();
        await sleep(600);
        await page.screenshot({ path: out('70-welcome-again') });
        const names = await page.evaluate(() => [...document.querySelectorAll('.player-btn:not(.new) .player-name')].map((n) => n.textContent));
        await page.click('.player-btn');
        await sleep(400);
        const starsAfter = await jarNumber();
        await page.screenshot({ path: out('71-packs') });
        await page.reload();
        await sleep(500);
        await page.click('.player-btn.new');
        await sleep(300);
        await page.type('.name-input', 'ava');
        await page.click('.name-form .big-btn');
        await sleep(400);
        await page.reload();
        await sleep(500);
        const namesAfter = await page.evaluate(() => [...document.querySelectorAll('.player-btn:not(.new) .player-name')].map((n) => n.textContent));
        await page.screenshot({ path: out('72-two-players') });
        report.welcome = names.join() === 'Sam' && starsAfter === starsBefore && namesAfter.join() === 'Ava,Sam';
        if (!report.welcome) report.welcomeDetail = { names, starsBefore, starsAfter, namesAfter };
    }

    console.log(JSON.stringify(report, null, 1));
    console.log('ERRORS:', errors.length ? errors : 'none');
    const failed = Object.entries(report).filter(([, v]) => v === false).map(([k]) => k);
    if (report.awardStars !== undefined && report.awardStars !== 5) failed.push('awardStars');
    if (failed.length || errors.length) {
        console.log('FAILED:', failed.length ? failed.join(', ') : 'see errors');
        process.exitCode = 1;
    } else console.log('PASSED');
    await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
