// LOVELY BOY • CUTE PRO (V11) - Real-Time Studio Vocal Clarity, Echo & Voice Changer Engine

(function () {
  window.__LB_AUDIO_STATE__ = {
    studioClarity: true,
    noiseGate: 65,
    vocalBoost: 40,
    echoActive: false,
    echoDelay: 25,
    echoFeedback: 30,
    voiceMode: "normal",
    ctx: null,
    melodyBus: null,
    nodes: null
  };

  const state = window.__LB_AUDIO_STATE__;

  // Listen for live setting changes from bridge
  window.addEventListener("message", (event) => {
    if (!event.data || event.data.source !== "LB_CUTE_PRO_BRIDGE") return;
    if (event.data.type === "SYNC_SETTINGS" && event.data.settings) {
      Object.assign(state, event.data.settings);
      updateDSPParameters();
    }
  });

  function updateDSPParameters() {
    const n = state.nodes;
    if (!n || !state.ctx) return;
    const now = state.ctx.currentTime;

    // 1. Studio Clarity (Noise Gate + High-pass + Vocal Presence EQ + Compressor)
    if (state.studioClarity) {
      const gateFreq = 70 + (state.noiseGate / 100) * 140; // Cuts fan/wind rumble
      n.highpass.frequency.setTargetAtTime(gateFreq, now, 0.05);

      const boostDb = (state.vocalBoost / 100) * 10; // +0dB to +10dB crisp vocal clarity
      n.vocalPresence.gain.setTargetAtTime(boostDb, now, 0.05);
      n.makeupGain.gain.setTargetAtTime(1 + (state.vocalBoost / 100) * 0.85, now, 0.05);
    } else {
      n.highpass.frequency.setTargetAtTime(20, now, 0.05);
      n.vocalPresence.gain.setTargetAtTime(0, now, 0.05);
      n.makeupGain.gain.setTargetAtTime(1.0, now, 0.05);
    }

    // 2. Live Echo & Reverb
    if (state.echoActive) {
      const delaySec = 0.08 + (state.echoDelay / 100) * 0.45;
      const fbVal = (state.echoFeedback / 100) * 0.65;
      n.echoDelay.delayTime.setTargetAtTime(delaySec, now, 0.05);
      n.echoFeedback.gain.setTargetAtTime(fbVal, now, 0.05);
      n.echoWet.gain.setTargetAtTime(0.42, now, 0.05);
    } else {
      n.echoFeedback.gain.setTargetAtTime(0, now, 0.05);
      n.echoWet.gain.setTargetAtTime(0, now, 0.05);
    }

    // 3. Voice Changer Formant & Pitch Filtering
    const mode = state.voiceMode || "normal";
    n.robotWet.gain.setTargetAtTime(0, now, 0.05);
    n.dryVoice.gain.setTargetAtTime(1, now, 0.05);
    n.pitchRatio = 1.0;

    if (mode === "anime") {
      n.pitchRatio = 1.24;
      n.formantFilter.type = "peaking";
      n.formantFilter.frequency.setTargetAtTime(2600, now, 0.05);
      n.formantFilter.gain.setTargetAtTime(7, now, 0.05);
    } else if (mode === "baby") {
      n.pitchRatio = 1.36;
      n.formantFilter.type = "highshelf";
      n.formantFilter.frequency.setTargetAtTime(1800, now, 0.05);
      n.formantFilter.gain.setTargetAtTime(8, now, 0.05);
    } else if (mode === "chipmunk") {
      n.pitchRatio = 1.55;
      n.formantFilter.type = "peaking";
      n.formantFilter.frequency.setTargetAtTime(3200, now, 0.05);
      n.formantFilter.gain.setTargetAtTime(9, now, 0.05);
    } else if (mode === "deep") {
      n.pitchRatio = 0.76;
      n.formantFilter.type = "lowshelf";
      n.formantFilter.frequency.setTargetAtTime(280, now, 0.05);
      n.formantFilter.gain.setTargetAtTime(9, now, 0.05);
    } else if (mode === "robot") {
      n.pitchRatio = 0.96;
      n.robotWet.gain.setTargetAtTime(0.65, now, 0.05);
      n.dryVoice.gain.setTargetAtTime(0.45, now, 0.05);
    } else {
      n.formantFilter.type = "peaking";
      n.formantFilter.frequency.setTargetAtTime(1500, now, 0.05);
      n.formantFilter.gain.setTargetAtTime(0, now, 0.05);
    }
  }
    // Real-time granular pitch shifter + noise gate processor
  function createPitchAndGateNode(ctx, nodes) {
    const bufferSize = 2048;
    const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
    const ringBuffer = new Float32Array(bufferSize * 2);
    let writeIdx = 0;
    let readIdx = 0;

    processor.onaudioprocess = function (e) {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      const ratio = nodes.pitchRatio || 1.0;

      // Dynamic Noise Gate threshold based on user slider
      const gateThreshold = state.studioClarity ? (state.noiseGate / 100) * 0.018 : 0;

      // Calculate RMS volume of current frame
      let sum = 0;
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * input[i];
      }
      const rms = Math.sqrt(sum / input.length);
      const gateMult = rms < gateThreshold ? 0.06 : 1.0;

      for (let i = 0; i < input.length; i++) {
        const sample = input[i] * gateMult;
        ringBuffer[writeIdx] = sample;
        writeIdx = (writeIdx + 1) % ringBuffer.length;

        if (Math.abs(ratio - 1.0) < 0.02) {
          output[i] = sample;
        } else {
          const idx0 = Math.floor(readIdx) % ringBuffer.length;
          const idx1 = (idx0 + 1) % ringBuffer.length;
          const frac = readIdx - Math.floor(readIdx);
          output[i] = ringBuffer[idx0] * (1 - frac) + ringBuffer[idx1] * frac;
          readIdx = (readIdx + ratio) % ringBuffer.length;
        }
      }
    };

    return processor;
  }

  // Build full studio DSP chain for a microphone MediaStream
  function processMicrophoneStream(rawStream) {
    const audioTracks = rawStream.getAudioTracks();
    if (!audioTracks.length) return rawStream;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!state.ctx) {
      state.ctx = new AudioCtx();
    }
    const ctx = state.ctx;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const source = ctx.createMediaStreamSource(rawStream);
    const destination = ctx.createMediaStreamDestination();

    // Shared Melody Soundboard Bus (connected from melody-pad.js)
    if (!state.melodyBus) {
      state.melodyBus = ctx.createGain();
      state.melodyBus.gain.value = 0.85;
    }

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 110;

    const vocalPresence = ctx.createBiquadFilter();
    vocalPresence.type = "peaking";
    vocalPresence.frequency.value = 3100;
    vocalPresence.Q.value = 1.1;
    vocalPresence.gain.value = 4;

    const formantFilter = ctx.createBiquadFilter();
    formantFilter.type = "peaking";
    formantFilter.frequency.value = 1500;
    formantFilter.gain.value = 0;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.15;

    const makeupGain = ctx.createGain();
    makeupGain.gain.value = 1.3;

    // Robot Ring Modulator
    const robotOsc = ctx.createOscillator();
    robotOsc.type = "sawtooth";
    robotOsc.frequency.value = 55;
    robotOsc.start();

    const robotGain = ctx.createGain();
    robotGain.gain.value = 0;
    robotOsc.connect(robotGain.gain);

    const robotWet = ctx.createGain();
    robotWet.gain.value = 0;

    const dryVoice = ctx.createGain();
    dryVoice.gain.value = 1;

    // Echo Loop
    const echoDelay = ctx.createDelay(1.0);
    echoDelay.delayTime.value = 0.22;
    const echoFeedback = ctx.createGain();
    echoFeedback.gain.value = 0;
    const echoWet = ctx.createGain();
    echoWet.gain.value = 0;

    const nodes = {
      highpass,
      vocalPresence,
      formantFilter,
      compressor,
      makeupGain,
      robotWet,
      dryVoice,
      echoDelay,
      echoFeedback,
      echoWet,
      pitchRatio: 1.0
    };
    state.nodes = nodes;

    const pitchAndGate = createPitchAndGateNode(ctx, nodes);

    // Wire DSP Graph
    source.connect(highpass);
    highpass.connect(pitchAndGate);
    pitchAndGate.connect(vocalPresence);
    vocalPresence.connect(formantFilter);
    formantFilter.connect(compressor);
    compressor.connect(makeupGain);

    // Dry & Robot split
    makeupGain.connect(dryVoice);
    makeupGain.connect(robotGain);
    robotGain.connect(robotWet);

    dryVoice.connect(destination);
    robotWet.connect(destination);

    // Echo Send/Return
    makeupGain.connect(echoDelay);
    echoDelay.connect(echoFeedback);
    echoFeedback.connect(echoDelay);
    echoDelay.connect(echoWet);
    echoWet.connect(destination);

    // Mix Melody Soundboard into outgoing call audio
    state.melodyBus.connect(destination);

    updateDSPParameters();

    // Preserve any video tracks if it's a video call
    const finalStream = new MediaStream();
    destination.stream.getAudioTracks().forEach((t) => finalStream.addTrack(t));
    rawStream.getVideoTracks().forEach((t) => finalStream.addTrack(t));

    return finalStream;
  }

  // Intercept navigator.mediaDevices.getUserMedia cleanly
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async function (constraints) {
      const rawStream = await origGetUserMedia(constraints);
      if (constraints && constraints.audio) {
        try {
          return processMicrophoneStream(rawStream);
        } catch (err) {
          return rawStream;
        }
      }
      return rawStream;
    };
  }
})();
