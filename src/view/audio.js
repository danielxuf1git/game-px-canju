export function createAudio() {
  let ctx = null;
  let muted = true;
  let unlocked = false;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function beep(freq, dur, type, gain) {
    if (muted || !unlocked) return;
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  }

  return {
    muted: () => muted,
    unlock() {
      unlocked = true;
      const c = ac();
      if (c.state === "suspended") c.resume();
    },
    toggle() {
      muted = !muted;
      if (!muted) this.unlock();
      return muted;
    },
    tap() { beep(420, 0.04, "square", 0.05); },
    slot() { beep(180, 0.07, "triangle", 0.06); },
    match() { beep(660, 0.09, "sine", 0.07); },
    burst() { beep(90, 0.18, "sawtooth", 0.08); },
  };
}
