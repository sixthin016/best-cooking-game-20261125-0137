// All sound is synthesised with WebAudio — no audio files, no network. The context
// starts on the first user gesture (browsers block audio before one); M toggles mute.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  /** A short oscillator blip that slides from `from` Hz to `to` Hz. */
  function blip(from, to, seconds, type, gainValue, when = 0) {
    const audio = ensure();
    if (!audio || muted) return;
    const t = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + seconds);
    gain.gain.setValueAtTime(gainValue, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  /** A burst of filtered noise (chop thud, sizzle, trash clatter). */
  function noise(seconds, filterFreq, gainValue, when = 0) {
    const audio = ensure();
    if (!audio || muted) return;
    const t = audio.currentTime + when;
    const length = Math.max(1, Math.floor(audio.sampleRate * seconds));
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(gainValue, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(t);
  }

  const sounds = {
    pickup() {
      blip(520, 760, 0.08, 'sine', 0.12);
    },
    place() {
      blip(340, 240, 0.09, 'triangle', 0.14);
      noise(0.06, 900, 0.08);
    },
    chop() {
      noise(0.07, 1400, 0.22);
      blip(180, 90, 0.07, 'square', 0.08);
    },
    cooked() {
      blip(660, 990, 0.12, 'sine', 0.12);
    },
    burnt() {
      blip(220, 110, 0.3, 'sawtooth', 0.12);
    },
    served() {
      blip(660, 660, 0.1, 'sine', 0.14);
      blip(880, 880, 0.12, 'sine', 0.14, 0.1);
      blip(1320, 1320, 0.18, 'sine', 0.12, 0.2);
      noise(0.15, 4000, 0.05, 0.05);
    },
    missed() {
      blip(330, 165, 0.35, 'triangle', 0.14);
    },
    error() {
      blip(140, 110, 0.12, 'square', 0.08);
    },
    rush() {
      blip(440, 660, 0.12, 'square', 0.1);
      blip(440, 660, 0.12, 'square', 0.1, 0.15);
      blip(660, 880, 0.16, 'square', 0.1, 0.3);
    },
    trash() {
      noise(0.12, 500, 0.16);
      blip(200, 120, 0.1, 'triangle', 0.08);
    },
    over() {
      blip(523, 523, 0.15, 'sine', 0.12);
      blip(659, 659, 0.15, 'sine', 0.12, 0.15);
      blip(784, 784, 0.3, 'sine', 0.12, 0.3);
    },
  };

  /** Start/stop the grill sizzle loop while anything cooks. */
  function setSizzle(on) {
    const audio = ensure();
    if (!audio) return;
    if (on && !sizzleNodes && !muted) {
      const length = audio.sampleRate;
      const buffer = audio.createBuffer(1, length, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = audio.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = audio.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      const gain = audio.createGain();
      gain.gain.value = 0.03;
      source.connect(filter).connect(gain).connect(audio.destination);
      source.start();
      sizzleNodes = { source, gain };
    } else if (!on && sizzleNodes) {
      try {
        sizzleNodes.source.stop();
      } catch {
        /* already stopped */
      }
      sizzleNodes = null;
    }
  }

  return {
    unlock: ensure,
    play(name) {
      if (sounds[name]) sounds[name]();
    },
    setSizzle,
    toggleMute() {
      muted = !muted;
      if (muted) setSizzle(false);
      return muted;
    },
    isMuted: () => muted,
  };
}
