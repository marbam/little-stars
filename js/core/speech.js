// Spoken instructions using the browser's built-in text-to-speech, since the player can't read yet.
window.LS = window.LS || {};

LS.speech = (function () {
    const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    let voice = null;
    let enabled = true;

    // Prefer a friendly British voice. Edge's "Natural" voices sound best.
    function chooseVoice() {
        if (!synth) return;
        const voices = synth.getVoices();
        if (!voices.length) return;
        const british = voices.filter((v) => /^en[-_]GB/i.test(v.lang));
        const pool = british.length ? british : voices.filter((v) => /^en/i.test(v.lang));
        const preferences = [/Natural/i, /Google UK English Female/i, /Libby|Sonia|Maisie|Hazel|Susan/i, /Female/i];
        for (const pattern of preferences) {
            const match = pool.find((v) => pattern.test(v.name));
            if (match) { voice = match; return; }
        }
        voice = pool[0] || voices[0];
    }

    if (synth) {
        chooseVoice();
        synth.onvoiceschanged = chooseVoice;
    }

    // Speaks the text, cutting off anything already being said. Resolves when finished.
    function say(text) {
        return new Promise((resolve) => {
            if (!synth || !enabled || !text) { resolve(); return; }
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            if (voice) { utterance.voice = voice; utterance.lang = voice.lang; } else utterance.lang = 'en-GB';
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            let finished = false;
            const done = () => { if (!finished) { finished = true; resolve(); } };
            utterance.onend = done;
            utterance.onerror = done;
            setTimeout(done, 1500 + text.length * 120); // safety net if the browser never fires onend
            synth.speak(utterance);
        });
    }

    return {
        say,
        stop() { if (synth) synth.cancel(); },
        setEnabled(value) { enabled = value; if (!value && synth) synth.cancel(); },
    };
})();
