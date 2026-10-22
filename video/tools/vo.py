"""Generate the English voice-over (Kokoro, offline) and the shared timeline.

usage: KOKORO_DIR=/path/with/kokoro-v1.0.onnx+voices-v1.0.bin python3 tools/vo.py
Writes public/audio/vo_<n>.wav and src/timing.json (seconds), which both the Remotion film and tools/score.py read.
"""
import json, os, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = os.environ.get('KOKORO_DIR', '.')
VOICE, SPEED = 'am_michael', 0.97

# (text, silence after the line in seconds)
LINES = [
    ("Every car. Every bay. Every promise.", 0.55),
    ("Running a workshop means keeping all of it in your head.", 0.55),
    ("AutoHub puts it all in front of you.", 1.1),
    ("This is Workshop Live View. Your entire floor, in three dimensions, in real time.", 0.55),
    ("Every vehicle. Every technician. Every stage. At a glance.", 0.7),
    ("Tap a bay to open the job. Move it forward in a single click.", 0.9),
    ("Your workshop is unique, so the layout is yours. Drag in a new bay, choose its equipment, and publish. It appears on the floor instantly.", 0.8),
    ("Technicians flag damage right on the car.", 0.8),
    ("And customers follow every step, and approve estimates, from a private link. No app. No login.", 0.9),
    ("One platform. Three portals. Total clarity.", 1.0),
    ("AutoHub. Every repair, under control.", 3.2),
]
SR_OUT = 48000
k = Kokoro(os.path.join(K, 'kokoro-v1.0.onnx'), os.path.join(K, 'voices-v1.0.bin'))
os.makedirs(os.path.join(HERE, 'public/audio'), exist_ok=True)
t = 0.9  # a beat of silence at the start
timing = {'fps': 30, 'lines': []}
for i, (text, gap) in enumerate(LINES):
    s, sr = k.create(text, voice=VOICE, speed=SPEED, lang='en-us')
    idx = np.where(np.abs(s) > 0.008)[0]
    s = s[max(0, idx[0] - 200): idx[-1] + 2400]
    dur = len(s) / sr
    sf.write(os.path.join(HERE, f'public/audio/vo_{i + 1}.wav'), s, sr)
    timing['lines'].append({'n': i + 1, 'text': text, 'start': round(t, 3), 'dur': round(dur, 3), 'end': round(t + dur, 3)})
    print(f'L{i + 1:02d} {t:6.2f} -> {t + dur:6.2f}  {text[:60]}')
    t += dur + gap
timing['total'] = round(t, 3)
json.dump(timing, open(os.path.join(HERE, 'src/timing.json'), 'w'), indent=1)
print('total', timing['total'])
