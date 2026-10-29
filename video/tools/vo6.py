"""English voice-over for video 6 (the whole product). usage: KOKORO_DIR=... python3 tools/vo6.py
Writes public/audio/v6_<n>.wav and src/reels/timing6.json."""
import json, os
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = os.environ.get('KOKORO_DIR', '.')
VOICE, SPEED = 'am_michael', 0.98
# (key, text, silence after the line)
LINES = [
    ('hook', "Running a garage means juggling cars, mechanics, customers and insurers.", 0.5),
    ('one', "AutoHub brings all of it into one platform, with three portals. One for the owner, one for technicians, and one for customers.", 0.7),
    ('live', "Owners get a live view of the whole workshop. Every bay, every car, every technician, in real time.", 0.6),
    ('job', "Creating a job takes a minute. Pick the vehicle, and mark any damage right on the car.", 0.6),
    ('studio', "Your workshop is unique, so the layout is yours. Add bays and equipment, and publish.", 0.6),
    ('tech', "Technicians see only their own jobs. They update the status, and request parts, from their phone.", 0.6),
    ('cust', "Customers follow every step from a private link. No app, and no login.", 0.5),
    ('approve', "Extra work is approved with one tap, with photos and prices. Then they pay online, and leave a review.", 0.7),
    ('ins', "For insurance jobs, AutoHub tracks the documents and photos, builds the claim pack for the surveyor, and splits the bill between insurer and customer.", 0.7),
    ('recv', "And you always know exactly how much each insurer owes you.", 0.6),
    ('more', "Calendar, inventory, reports and your team, all in the same place.", 0.8),
    ('close', "AutoHub. Every car, every bay, every claim, under control.", 2.8),
]
k = Kokoro(os.path.join(K, 'kokoro-v1.0.onnx'), os.path.join(K, 'voices-v1.0.bin'))
os.makedirs(os.path.join(HERE, 'public/audio'), exist_ok=True)
t = 0.9
out = {'fps': 30, 'lines': []}
for i, (key, text, gap) in enumerate(LINES):
    s, sr = k.create(text, voice=VOICE, speed=SPEED, lang='en-us')
    idx = np.where(np.abs(s) > 0.008)[0]
    s = s[max(0, idx[0] - 200): idx[-1] + 2400]
    dur = len(s) / sr
    sf.write(os.path.join(HERE, f'public/audio/v6_{i + 1}.wav'), s, sr)
    out['lines'].append({'n': i + 1, 'key': key, 'text': text, 'start': round(t, 3), 'dur': round(dur, 3), 'end': round(t + dur, 3)})
    print(f'{key:8s} {t:6.2f} -> {t + dur:6.2f}')
    t += dur + gap
out['total'] = round(t, 3)
json.dump(out, open(os.path.join(HERE, 'src/reels/timing6.json'), 'w'), indent=1)
print('total', out['total'])
