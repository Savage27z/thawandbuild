
export function createAudio() {
  let ctx = null, master, sfxBus, musBus, noiseBuf, intensity = 0, started = false, nextBeat = 0, beat = 0;
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  const CH = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [55, 59, 62, 65]];
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .7;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = .8; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = .5; musBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextBeat = ctx.currentTime + .1;
    const crackle = ctx.createBufferSource(); crackle.buffer = noiseBuf; crackle.loop = true;
    const cf = ctx.createBiquadFilter(); cf.type = 'highpass'; cf.frequency.value = 5000; const cg = ctx.createGain(); cg.gain.value = .012;
    crackle.connect(cf); cf.connect(cg); cg.connect(musBus); crackle.start();
    setInterval(schedule, 90); started = true;
  }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dec); }
  function tone(type, f0, f1, t, dur, vol, bus = sfxBus, a = .005, lp) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, a, vol, dur); let n = o;
    if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
    n.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + a + .05);
  }
  function noise(t, dur, vol, ftype, f0, f1, bus = sfxBus, q = 1) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf;
    f.type = ftype; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, .004, vol, dur); s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random()); s.stop(t + dur + .05);
  }
  function schedule() {
    if (!ctx || ctx.state !== 'running') return;
    const spb = 60 / 74;
    while (nextBeat < ctx.currentTime + .25) {
      const t = nextBeat, b = beat % 16, bar = Math.floor(beat / 16) % 4, ch = CH[bar];
      if (b === 0) ch.forEach((n, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'triangle'; o.frequency.value = hz(n + 12 + (i === 3 ? 0 : 0)); f.type = 'lowpass'; f.frequency.value = 900; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .6); g.gain.linearRampToValueAtTime(0, t + spb * 4 * 1.0); o.connect(f); f.connect(g); g.connect(musBus); o.start(t); o.stop(t + spb * 4 + .1); });
      if (b === 0 || b === 10) tone('sine', 110, 42, t, .3, .5 + intensity * .2, musBus);
      if (b === 4 || b === 12) { noise(t, .16, .22, 'bandpass', 1800, 900, musBus, 1.5); tone('triangle', 190, 140, t, .1, .12, musBus); }
      if (b % 2 === 0 || intensity > .4) noise(t, .04, .05 + (b % 4 === 2 ? .04 : 0), 'highpass', 7000, 8000, musBus);
      if (b % 4 === 0 || b === 7 || b === 11) { const mel = [ch[2], ch[3], ch[1], ch[3] + 2][(b >> 2) & 3] + 12; if (Math.random() < .75) tone('sine', hz(mel + (Math.random() < .3 ? 12 : 0)), hz(mel), t + .02, .55, .09, musBus, .01); }
      if (b === 0) tone('sine', hz(ch[0] - 12), hz(ch[0] - 12), t, spb * 3.5, .2, musBus, .03);
      if (intensity > .3 && b % 2 === 1) tone('triangle', hz(ch[0]), hz(ch[0]), t, .12, .05 * intensity, musBus);
      nextBeat += spb / 4 * (b % 2 === 0 ? 1.12 : .88); beat++;
    }
  }
  const S = {
    swing(n = 0) { const t = ctx.currentTime; noise(t, .16, .22, 'bandpass', 800 + n * 400, 3000 + n * 600, sfxBus, 2); },
    hit(heavy) { const t = ctx.currentTime; noise(t, .12, .35, 'bandpass', 1500, 300, sfxBus, 1.2); tone('sine', heavy ? 140 : 190, 55, t, .16, .55); tone('triangle', 900, 400, t, .05, .1); },
    slam() { const t = ctx.currentTime; tone('sine', 150, 28, t, .8, .95); noise(t, .7, .5, 'lowpass', 3000, 120); for (let i = 0; i < 6; i++) tone('sine', 2200 + Math.random() * 3000, 1500, t + .02 + i * .035, .35, .06); noise(t + .04, .5, .18, 'highpass', 5000, 9000); },
    dash() { const t = ctx.currentTime; noise(t, .28, .3, 'bandpass', 500, 4200, sfxBus, 1.2); },
    hurt() { const t = ctx.currentTime; tone('sawtooth', 220, 70, t, .3, .35, sfxBus, .005, 800); noise(t, .18, .25, 'lowpass', 1200, 200); },
    kill() { const t = ctx.currentTime; noise(t, .3, .3, 'lowpass', 2000, 150); tone('sine', 300, 60, t, .25, .3); tone('sine', 520, 700, t + .02, .12, .08); },
    xp() { const t = ctx.currentTime; tone('sine', 1100 + Math.random() * 100, 1500, t, .1, .06); },
    levelup() { const t = ctx.currentTime; [0, 4, 7, 12, 16].forEach((n, i) => tone('triangle', hz(72 + n), hz(72 + n), t + i * .08, .6, .22)); },
    purify() { const t = ctx.currentTime; [0, 7, 12, 16, 19, 24].forEach((n, i) => { tone('sine', hz(67 + n), hz(67 + n), t + i * .11, 1.6, .24); tone('sine', hz(79 + n), hz(79 + n), t + i * .11 + .01, 1.2, .08); }); noise(t, 1.6, .15, 'bandpass', 600, 5000, sfxBus, .8); },
    roar() { const t = ctx.currentTime; tone('sawtooth', 90, 45, t, 1.3, .55, sfxBus, .08, 500); tone('square', 62, 38, t, 1.3, .3, sfxBus, .08, 300); noise(t, 1.2, .3, 'lowpass', 900, 100); },
    warn() { const t = ctx.currentTime; tone('square', 330, 330, t, .1, .08, sfxBus, .005, 1200); tone('square', 330, 330, t + .14, .1, .08, sfxBus, .005, 1200); },
    stomp() { const t = ctx.currentTime; tone('sine', 90, 24, t, 1, 1); noise(t, .9, .55, 'lowpass', 2000, 80); },
    spawn() { const t = ctx.currentTime; tone('sine', 120, 260, t, .3, .1); noise(t, .3, .1, 'lowpass', 400, 1500); },
    win() { const t = ctx.currentTime; [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((n, i) => tone('triangle', hz(67 + n), hz(67 + n), t + i * .16, 1.4, .22)); },
    lose() { const t = ctx.currentTime; [0, -2, -5, -9].forEach((n, i) => tone('sawtooth', hz(60 + n), hz(57 + n), t + i * .35, 1.2, .2, sfxBus, .02, 700)); },
  };
  const api = { resume: init, setIntensity(v) { intensity = v; }, setMusicDuck(v) { if (ctx) musBus.gain.setTargetAtTime(v ? .18 : .5, ctx.currentTime, .2); } };
  for (const k in S) api[k] = (...a) => { if (ctx && ctx.state === 'running') S[k](...a); };
  return api;
}
