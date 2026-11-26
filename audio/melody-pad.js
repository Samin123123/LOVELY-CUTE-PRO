// LOVELY BOY • CUTE PRO (V11) - Live Call Melody Soundboard Engine

(function () {
  const MELODIES = {
    sakura: [
      { f: 1046.5, d: 0.22, t: 0.0, w: "sine" },
      { f: 1174.66, d: 0.22, t: 0.14, w: "sine" },
      { f: 1567.98, d: 0.28, t: 0.28, w: "sine" },
      { f: 1318.51, d: 0.35, t: 0.44, w: "sine" },
      { f: 2093.0, d: 0.45, t: 0.62, w: "sine" }
    ],
    heart: [
      { f: 880.0, d: 0.18, t: 0.0, w: "triangle" },
      { f: 1108.73, d: 0.18, t: 0.12, w: "triangle" },
      { f: 1318.51, d: 0.22, t: 0.24, w: "triangle" },
      { f: 1760.0, d: 0.45, t: 0.38, w: "sine" }
    ],
    angel: [
      { f: 523.25, d: 0.3, t: 0.0, w: "sine" },
      { f: 659.25, d: 0.3, t: 0.08, w: "sine" },
      { f: 783.99, d: 0.3, t: 0.16, w: "sine" },
      { f: 1046.5, d: 0.35, t: 0.24, w: "sine" },
      { f: 1318.51, d: 0.4, t: 0.32, w: "sine" },
      { f: 1567.98, d: 0.55, t: 0.4, w: "sine" }
    ],
    kawaii: [
      { f: 1318.51, d: 0.12, t: 0.0, w: "sine" },
      { f: 1567.98, d: 0.12, t: 0.11, w: "sine" },
      { f: 2093.0, d: 0.18, t: 0.22, w: "sine" },
      { f: 1567.98, d: 0.12, t: 0.36, w: "sine" },
      { f: 2349.32, d: 0.32, t: 0.48, w: "sine" }
    ],
    dream: [
      { f: 783.99, d: 0.35, t: 0.0, w: "sine" },
      { f: 987.77, d: 0.35, t: 0.2, w: "sine" },
      { f: 1174.66, d: 0.4, t: 0.4, w: "sine" },
      { f: 1479.98, d: 0.6, t: 0.62, w: "sine" }
    ],
    magic: [
      { f: 1046.5, d: 0.1, t: 0.0, w: "sine" },
      { f: 1244.51, d: 0.1, t: 0.06, w: "sine" },
      { f: 1479.98, d: 0.1, t: 0.12, w: "sine" },
      { f: 1760.0, d: 0.12, t: 0.18, w: "sine" },
      { f: 2093.0, d: 0.15, t: 0.24, w: "sine" },
      { f: 2489.02, d: 0.38, t: 0.3, w: "sine" }
    ]
  };

  function triggerMelody(padId) {
    const notes = MELODIES[padId];
    if (!notes) return;

    const sharedState = window.__LB_AUDIO_STATE__;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;

    let ctx = sharedState && sharedState.ctx ? sharedState.ctx : null;
    if (!ctx) {
      ctx = new AudioCtx();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const baseTime = ctx.currentTime + 0.02;

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = n.w || "sine";
      osc.frequency.setValueAtTime(n.f, baseTime + n.t);

      gain.gain.setValueAtTime(0.0001, baseTime + n.t);
      gain.gain.linearRampToValueAtTime(0.18, baseTime + n.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, baseTime + n.t + n.d);

      osc.connect(gain);

      // Local monitor so user can hear the melody
      gain.connect(ctx.destination);

      // Inject directly into active WhatsApp call mic stream if connected
      if (sharedState && sharedState.melodyBus) {
        gain.connect(sharedState.melodyBus);
      }

      osc.start(baseTime + n.t);
      osc.stop(baseTime + n.t + n.d + 0.03);
    });
  }

  window.addEventListener("message", (event) => {
    if (!event.data || event.data.source !== "LB_CUTE_PRO_BRIDGE") return;
    if (event.data.type === "PLAY_MELODY" && event.data.padId) {
      triggerMelody(event.data.padId);
    }
  });
})();
