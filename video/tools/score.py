"""Synthesises the music bed + SFX from src/cues.json, mixes the voice-over from src/timing.json and writes public/audio/mix.wav."""
import json, sys, wave, numpy as np
from scipy.signal import butter, lfilter
from scipy.io import wavfile

SR = 44100
ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
cues = json.load(open(f'{ROOT}/src/cues.json'))
timing = json.load(open(f'{ROOT}/src/timing.json'))
DUR = cues['close']['end'] + 0.5
N = int(DUR * SR)
rng = np.random.default_rng(7)

def buf(): return np.zeros(N, dtype=np.float64)
def put(b, t, x, g=1.0):
    i = int(t * SR)
    if i >= N: return
    x = x[: N - i]
    b[i:i + len(x)] += x * g
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.005, r=0.2):
    t = tt(d); e = np.minimum(t / a, 1) * np.exp(-t / r); return e
def lp(x, f): b, a = butter(2, f / (SR / 2), 'low'); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(d * SR))
def midi(n): return 440 * 2 ** ((n - 69) / 12)

# ---- music: warm pad + soft pulse, chord progression Am-F-C-G, 96 bpm
music = buf()
BPM = 96; beat = 60 / BPM
chords = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]
bar = beat * 4
t0 = 0.0; k = 0
while t0 < DUR:
    ch = chords[k % 4]
    d = bar + 0.6
    t = tt(d)
    pad = np.zeros_like(t)
    for n in ch:
        for det in (-0.07, 0.0, 0.07):
            pad += np.sin(2 * np.pi * midi(n) * 2 ** (det / 12) * t + rng.random() * 6.28) * 0.12
    pad += np.sin(2 * np.pi * midi(ch[0] - 24) * t) * 0.3
    e = np.minimum(t / 0.8, 1) * np.minimum((d - t) / 0.6, 1)
    put(music, t0, lp(pad, 1800) * e)
    # plucked arpeggio
    for j in range(8):
        n = ch[j % 3] + (12 if j % 2 else 24)
        tp = tt(0.5)
        pl = (np.sin(2 * np.pi * midi(n) * tp) + 0.3 * np.sin(4 * np.pi * midi(n) * tp)) * np.exp(-tp / 0.16) * 0.09
        put(music, t0 + j * beat / 2, pl)
    t0 += bar; k += 1
# soft kick + hat from the reveal on
def kick():
    t = tt(0.4); f = 50 + 90 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.14) * 0.55
def hat(): return hp(noise(0.08), 7000) * np.exp(-tt(0.08) / 0.02) * 0.12
groove_from = cues['reveal']['start']; groove_to = cues['close']['merge']
t = groove_from
while t < groove_to:
    put(music, t, kick()); put(music, t + beat / 2, hat()); t += beat
# music intensity arc
tt_ = np.arange(N) / SR
arc = np.interp(tt_, [0, 4, 7, 10.3, 11, 36, 47, 51, 56, DUR], [0.35, 0.55, 0.7, 0.8, 1.0, 1.0, 1.05, 1.1, 0.8, 0.0])
music *= arc

# ---- sfx
sfx = buf()
def whoosh(t, d=0.6, up=True):
    x = bp(noise(d), 300, 5000); t_ = tt(d)
    e = (np.sin(np.pi * (t_ / d) ** (1.6 if up else 0.7))) ** 2
    put(sfx, t, x * e, 0.45)
def tick(t, f=1800, g=0.25):
    t_ = tt(0.08); put(sfx, t, np.sin(2 * np.pi * f * t_) * np.exp(-t_ / 0.012), g)
def pop(t, f=520, g=0.3):
    t_ = tt(0.18); put(sfx, t, np.sin(2 * np.pi * (f + 400 * np.exp(-t_ / 0.03)) * t_) * np.exp(-t_ / 0.05), g)
def chime(t, n=84, g=0.2):
    t_ = tt(1.2); put(sfx, t, (np.sin(2 * np.pi * midi(n) * t_) + 0.4 * np.sin(2 * np.pi * midi(n + 12) * t_)) * np.exp(-t_ / 0.35), g)
def impact(t, g=0.7):
    t_ = tt(1.2); x = np.sin(2 * np.pi * 45 * t_) * np.exp(-t_ / 0.3) + lp(noise(1.2), 600) * np.exp(-t_ / 0.2) * 0.5
    put(sfx, t, x, g)
def riser(t0_, d):
    x = hp(noise(d), 1500) * (tt(d) / d) ** 2; put(sfx, t0_, x, 0.35)

h, lg, r, i_, s, te, cu, cl = (cues[k] for k in ['hook', 'logo', 'reveal', 'interact', 'studio', 'tech', 'cust', 'close'])
for w in (h['w1'], h['w2'], h['w3']): tick(w, 1400, 0.3)
riser(h['chaos'], h['flash'] - h['chaos'])
whoosh(h['suck'], 0.9, True)
impact(h['flash'], 0.8)
chime(lg['draw'], 81, 0.18); tick(lg['word'], 2200, 0.2); chime(lg['tag'], 88, 0.14)
whoosh(lg['dive'], 0.8)
pop(r['floor'], 300, 0.25); whoosh(r['walls'], 0.7)
for k_ in range(6): tick(r['pads'] + k_ * 0.13, 1200 + k_ * 150, 0.15)
for k_ in range(5): pop(r['fixtures'] + k_ * 0.16, 480 + k_ * 40, 0.18)
for k_ in range(8): pop(r['cars'] + k_ * r['carGap'], 360, 0.22)
pop(r['techs'], 700, 0.22); whoosh(r['ui'] - 0.2, 0.6)
for x in r['ring']: chime(x, 86, 0.1)
tick(i_['clickBay2'], 1500, 0.35); pop(i_['menu'], 600, 0.2); tick(i_['pick'], 1700, 0.35); chime(i_['oneClick'], 88, 0.16)
whoosh(s['start'] - 0.1, 0.7)
tick(s['addBay'], 1500, 0.35); pop(s['addBay'] + 0.1, 440, 0.25); tick(s['drag'], 1200, 0.2)
pop(s['props'], 560, 0.2); pop(s['equip'], 640, 0.2); tick(s['publish'], 1800, 0.35); chime(s['toast'], 91, 0.18); whoosh(s['to3d'] - 0.1, 0.6)
whoosh(te['start'] - 0.1, 0.7); tick(te['scan'], 2000, 0.2); tick(te['tap'], 1500, 0.35); pop(te['tip'], 760, 0.22)
whoosh(cu['start'] - 0.1, 0.7); pop(cu['phone'], 420, 0.28)
tick(cu['approve'], 1600, 0.35); chime(cu['approve'] + 0.1, 91, 0.2); chime(cu['approve'] + 0.25, 95, 0.14)
whoosh(cl['start'] - 0.1, 0.7)
riser(cl['merge'] - 1.0, 1.0); impact(cl['merge'] + 0.05, 0.6)
chime(cl['logo'], 79, 0.22); chime(cl['tag'], 86, 0.15)

# ---- voice-over
vo = buf()
for ln in timing['lines']:
    sr, d = wavfile.read(f"{ROOT}/public/audio/vo_{ln['n']}.wav")
    d = d.astype(np.float64) / (32768.0 if d.dtype == np.int16 else 1.0)
    if d.ndim > 1: d = d.mean(1)
    if sr != SR:
        from scipy.signal import resample_poly
        from math import gcd
        g = gcd(sr, SR); d = resample_poly(d, SR // g, sr // g)
    put(vo, ln['start'], d, 1.0)

# duck music under the voice
duck = np.ones(N)
for ln in timing['lines']:
    a, b = int((ln['start'] - 0.15) * SR), int((ln['end'] + 0.3) * SR)
    duck[a:b] = 0.42
duck = lp(duck, 4)
mix = vo * 1.0 + music * 0.55 * duck + sfx * 0.9
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = mix / max(1e-9, np.abs(mix).max()) * 0.9
wavfile.write(f'{ROOT}/public/audio/mix_raw.wav', SR, (mix * 32767).astype(np.int16))
print('ok', DUR)
