// Sound effects generated with the Web Audio API, so there are no audio files to ship.
window.LS = window.LS || {};

LS.sound = (function () {
    let ctx = null;
    let enabled = true;

    function audio() {
        if (!ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            ctx = new Ctx();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function tone(freq, start, dur, type = 'sine', vol = 0.2) {
        const c = enabled && audio();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        const t = c.currentTime + start;
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + dur + 0.05);
    }

    function sweep(from, to, dur, type = 'sine', vol = 0.2) {
        const c = enabled && audio();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        const t = c.currentTime;
        osc.type = type;
        osc.frequency.setValueAtTime(from, t);
        osc.frequency.exponentialRampToValueAtTime(to, t + dur);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    }

    function noise(dur, vol) {
        const c = enabled && audio();
        if (!c) return;
        const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        const filter = c.createBiquadFilter();
        const gain = c.createGain();
        src.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        gain.gain.setValueAtTime(vol, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        src.start();
    }

    return {
        unlock: audio,
        setEnabled(value) { enabled = value; },
        click() { tone(700, 0, 0.07, 'triangle', 0.12); },
        flip() { sweep(600, 1200, 0.07, 'triangle', 0.12); },
        splash() { sweep(300, 900, 0.15, 'sine', 0.15); },
        pop() { noise(0.1, 0.35); sweep(900, 150, 0.12, 'triangle', 0.25); },
        // Deliberately soft and friendly: getting it wrong should never feel like a telling-off.
        oops() { tone(392, 0, 0.16, 'sine', 0.12); tone(330, 0.14, 0.22, 'sine', 0.12); },
        cheer() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.18)); },
        fanfare() {
            [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.18));
            tone(784, 0.55, 0.2, 'triangle', 0.18);
            tone(1047, 0.75, 0.6, 'triangle', 0.2);
        },
    };
})();
