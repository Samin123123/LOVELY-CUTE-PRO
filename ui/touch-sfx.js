// LOVELY BOY • CUTE PRO (V11) - Cute Crystal & Chime Touch UI Sound Effects

window.LovelyTouchSFX = (function () {
  let audioCtx = null;
  let enabled = true;

  function getContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = "sine", volume = 0.08, delay = 0) {
    if (!enabled) return;
    const ctx = getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.18, now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Cute Crystal Tap Sound
  function tap() {
    playTone(1046.5, 0.11, "sine", 0.07, 0);     // C6
    playTone(1567.98, 0.14, "sine", 0.05, 0.03); // G6
  }

  // Sweet Toggle Switch Chime
  function toggle(isOn) {
    if (isOn) {
      playTone(880, 0.1, "sine", 0.07, 0);
      playTone(1318.5, 0.16, "sine", 0.07, 0.04);
    } else {
      playTone(987.77, 0.1, "sine", 0.06, 0);
      playTone(659.25, 0.15, "sine", 0.06, 0.04);
    }
  }

  // Magical Sparkle Unlock Sound
  function sparkle() {
    const notes = [1046.5, 1318.5, 1567.98, 2093.0];
    notes.forEach((n, i) => {
      playTone(n, 0.18, "sine", 0.07, i * 0.045);
    });
  }

  // Load saved SFX state & bind global click listener
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["lb_settings"], (res) => {
      if (res.lb_settings && typeof res.lb_settings.soundEffects === "boolean") {
        enabled = res.lb_settings.soundEffects;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const sfxBtn = document.getElementById("sfxToggleBtn");
    if (sfxBtn) {
      sfxBtn.addEventListener("click", () => {
        enabled = !enabled;
        sfxBtn.classList.toggle("active", enabled);
        sfxBtn.textContent = enabled ? "🔔" : "🔕";
        if (enabled) sparkle();
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage({
            type: "UPDATE_SETTING",
            payload: { soundEffects: enabled }
          });
        }
      });
    }

    document.body.addEventListener("click", (e) => {
      const target = e.target.closest("button, .voice-chip, .pad-btn, .tab-btn");
      if (target && target.id !== "sfxToggleBtn") {
        tap();
      }
    });

    document.body.addEventListener("change", (e) => {
      if (e.target && e.target.type === "checkbox") {
        toggle(e.target.checked);
      }
    });
  });

  return {
    tap,
    toggle,
    sparkle,
    setEnabled: (val) => {
      enabled = !!val;
    }
  };
})();
