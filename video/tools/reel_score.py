"""Synthesises music + SFX for one reel from src/reels/sfx.json. usage: reel_score.py r1 [out.wav]"""
import json, sys, numpy as np
from scipy.signal import butter, lfilter
from scipy.io import wavfile

SR = 44100
key = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else f'public/audio/{key}_raw.wav'
if key == 'r6':
    j = json.load(open('src/reels/reel6.json'))
    spec = {'dur': j['dur'], 'hits': j['hits']}
else:
    spec = json.load(open('src/reels/sfx.json'))[key]
DUR = spec['dur'] + 0.4
N = int(DUR * SR)
rng = np.random.default_rng(abs(hash(key)) % 1000 + 3)
buf = lambda: np.zeros(N)
def put(b, t, x, g=1.0):
    i = int(t * SR)
    if 0 <= i < N: x = x[: N - i]; b[i:i + len(x)] += x * g
tt = lambda d: np.arange(int(d * SR)) / SR
def lp(x, f): b, a = butter(2, f / (SR / 2), 'low'); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
noise = lambda d: rng.standard_normal(int(d * SR))
midi = lambda n: 440 * 2 ** ((n - 69) / 12)

# ---- music: warm pad + plucks, Am-F-C-G at 104 bpm, a soft kick groove after the hook
music = buf(); BPM = 104; beat = 60 / BPM; bar = beat * 4
chords = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]
t0, k = 0.0, 0
while t0 < DUR:
    ch = chords[k % 4]; d = bar + 0.5; t = tt(d); pad = np.zeros_like(t)
    for n in ch:
        for det in (-0.07, 0, 0.07): pad += np.sin(2 * np.pi * midi(n) * 2 ** (det / 12) * t + rng.random() * 6.28) * 0.12
    pad += np.sin(2 * np.pi * midi(ch[0] - 24) * t) * 0.3
    put(music, t0, lp(pad, 1800) * np.minimum(t / 0.6, 1) * np.minimum((d - t) / 0.5, 1))
    for j in range(8):
        n = ch[j % 3] + (12 if j % 2 else 24); tp = tt(0.45)
        put(music, t0 + j * beat / 2, (np.sin(2 * np.pi * midi(n) * tp) + 0.3 * np.sin(4 * np.pi * midi(n) * tp)) * np.exp(-tp / 0.15) * 0.09)
    t0 += bar; k += 1
def kick(): t = tt(0.35); f = 50 + 90 * np.exp(-t / 0.04); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13) * 0.5
def hat(): return hp(noise(0.07), 7000) * np.exp(-tt(0.07) / 0.02) * 0.1
t = 4.8
while t < spec['dur'] - 1.9: put(music, t, kick()); put(music, t + beat / 2, hat()); t += beat
music *= np.interp(np.arange(N) / SR, [0, 1, 5, spec['dur'] - 2, spec['dur'], DUR], [0.5, 0.65, 1.0, 1.0, 0.7, 0.0])

# ---- sfx
sfx = buf()
def tick(t, g=0.3):
    t_ = tt(0.08); put(sfx, t, np.sin(2 * np.pi * 1700 * t_) * np.exp(-t_ / 0.012), g)
def pop(t, g=0.3):
    t_ = tt(0.18); put(sfx, t, np.sin(2 * np.pi * (520 + 400 * np.exp(-t_ / 0.03)) * t_) * np.exp(-t_ / 0.05), g)
def chime(t, g=0.2):
    t_ = tt(1.1); put(sfx, t, (np.sin(2 * np.pi * midi(86) * t_) + 0.4 * np.sin(2 * np.pi * midi(98) * t_)) * np.exp(-t_ / 0.32), g)
def whoosh(t, g=0.4):
    d = 0.55; x = bp(noise(d), 300, 5000); t_ = tt(d); put(sfx, t, x * np.sin(np.pi * (t_ / d) ** 1.4) ** 2, g)
def impact(t, g=0.55):
    t_ = tt(0.9); put(sfx, t, np.sin(2 * np.pi * 52 * t_) * np.exp(-t_ / 0.25) + lp(noise(0.9), 600) * np.exp(-t_ / 0.15) * 0.4, g)
for t, kind in spec['hits']: {'tick': tick, 'pop': pop, 'chime': chime, 'whoosh': whoosh, 'impact': impact}[kind](t)

vo = buf(); duck = np.ones(N)
if key == 'r6':
    from scipy.io import wavfile as wf
    tm = json.load(open('src/reels/timing6.json'))
    for ln in tm['lines']:
        sr_, d_ = wf.read(f"public/audio/v6_{ln['n']}.wav")
        d_ = d_.astype(np.float64) / (32768.0 if d_.dtype == np.int16 else 1.0)
        if d_.ndim > 1: d_ = d_.mean(1)
        if sr_ != SR:
            from scipy.signal import resample_poly
            from math import gcd
            g_ = gcd(sr_, SR); d_ = resample_poly(d_, SR // g_, sr_ // g_)
        put(vo, ln['start'], d_, 1.0)
        duck[int((ln['start'] - 0.15) * SR): int((ln['end'] + 0.3) * SR)] = 0.4
    duck = lp(duck, 4)
mix = vo * 1.0 + music * 0.5 * duck + sfx * 0.7 if key == 'r6' else music * 0.5 + sfx * 0.9
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = mix / max(1e-9, np.abs(mix).max()) * 0.9
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('ok', key, round(DUR, 1))
