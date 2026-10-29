"""Builds src/reels/reel6.json (captions, UI cards, pills, sound hits) for video 6 from the voice-over timing.
Beats are fractions of each spoken line, so the picture stays locked to the narration if the lines change."""
import json
T = json.load(open('src/reels/timing6.json'))
LN = {l['key']: l for l in T['lines']}
KEYS = [l['key'] for l in T['lines']]
DUR = 81.6
OUTRO = DUR - 1.85

def start(k): return LN[k]['start'] - 0.2 if k != 'hook' else 0.95
def end(k):
    i = KEYS.index(k)
    return (LN[KEYS[i + 1]]['start'] - 0.2) if i + 1 < len(KEYS) else OUTRO - 0.05
def A(k, f): return round(LN[k]['start'] + f * LN[k]['dur'], 3)
def span(k, f0, f1):
    a = start(k) if f0 <= 0 else A(k, f0)
    b = end(k) if f1 >= 1 else A(k, f1)
    return round(a, 3), round(b, 3)

caps, cards, pills, hits = [], [], [], []
def cap(k, text, f0=0, f1=1, size=None):
    a, b = span(k, f0, f1); d = {'from': a, 'to': b, 'text': text}
    if size: d['size'] = size
    caps.append(d); return a
def card(k, name, f0, f1, cx, cy, s, rot=0, dir=None, swap=False, dialog=False, taps=None, raw=None, panel=False):
    a, b = span(k, f0, f1)
    d = {'name': name, 'from': a, 'to': b, 'cx': cx, 'cy': cy, 's': s, 'rot': rot}
    if dir: d['dir'] = dir
    if swap: d['swap'] = True
    if dialog: d['dialog'] = True
    if panel: d['panel'] = True
    if taps: d['taps'] = [{'t': A(k, f), 'key': key} for f, key in taps]
    if raw: d['rawTaps'] = [{'t': A(k, f), 'x': x, 'y': y} for f, x, y in raw]
    cards.append(d)
    if not swap: hits.append([a + 0.05, 'pop'])
    for tp in d.get('taps', []) + d.get('rawTaps', []): hits.append([tp['t'], 'tick'])
def pill(k, f0, f1, x, y, text, tone='dark', size=36, rot=0):
    a, b = span(k, f0, f1 if f1 < 1 else 1)
    pills.append({'at': a, 'to': b, 'x': x, 'y': y, 'text': text, 'tone': tone, 'size': size, 'rot': rot})
    if '✓' in text: hits.append([a + 0.05, 'chime'])
    else: hits.append([a + 0.03, 'pop'])

# ---- scenes
cap('hook', 'Cars. Mechanics. Customers. *Insurers.*')
for i, f in enumerate([0.5, 0.62, 0.76, 0.9]): hits.append([A('hook', f), 'pop'])

cap('one', 'One platform. *Three portals.*')
card('one', 'r6_kpi', 0.50, 0.70, 540, 1090, 2.3, rot=-2)
pill('one', 0.52, 0.70, 70, 500, 'Owner', 'coral', 40, -2)
card('one', 'r3_job', 0.70, 0.84, 540, 1080, 2.4, rot=2)
pill('one', 0.72, 0.84, 70, 500, 'Technician', 'dark', 40, -2)
card('one', 'r6_track', 0.84, 1.0, 540, 1070, 1.45, rot=-1)
pill('one', 0.86, 1.0, 70, 500, 'Customer', 'green', 40, -2)

cap('live', 'Your whole workshop, *live.*')
card('live', 'r6_map', 0, 1, 540, 1090, 2.3)
card('live', 'r6_kpi', 0.45, 1, 540, 740, 2.1, rot=2, dir='right')
pill('live', 0.25, 1.0, 70, 1500, 'Live · updated just now', 'white', 34, -2)

cap('job', 'Create a job in *a minute.*')
card('job', 'r6_newjob', 0, 0.5, 540, 1050, 2.15, rot=-2, raw=[(0.38, 195, 76)])
card('job', 'r6_damage', 0.5, 1, 540, 1040, 2.3, rot=2, dir='right')
pill('job', 0.62, 1.0, 560, 1500, 'Mark damage ✓', 'green', 34, 3)

cap('studio', 'Design *your* layout.')
card('studio', 'r6_studio', 0, 1, 540, 980, 1.62, rot=-1)
pill('studio', 0.30, 1.0, 540, 1370, 'Add bays', 'dark', 36, -3)
pill('studio', 0.52, 1.0, 540, 1445, 'Choose equipment', 'coral', 36, 2)
pill('studio', 0.78, 1.0, 540, 1520, 'Publish ✓', 'green', 36, -2)

cap('tech', 'Technicians: *status & parts.*')
card('tech', 'r3_job', 0, 0.32, 540, 1050, 2.7, rot=-2, taps=[(0.2, 'cont')])
card('tech', 'r3_stage_a', 0.30, 0.52, 540, 1000, 4.4, taps=[(0.44, 'sel')])
card('tech', 'r3_stage_b', 0.48, 0.62, 540, 1000, 4.4, swap=True)
pill('tech', 0.50, 0.62, 560, 1500, 'Quality Check ✓', 'green', 34, 3)
card('tech', 'r3_part', 0.60, 1, 540, 1110, 4.2, rot=-3, dir='left', taps=[(0.72, 'req')])
card('tech', 'r3_modal', 0.68, 1, 540, 1220, 2.15, dialog=True, taps=[(0.86, 'send')])

cap('cust', 'Customers: *private link.*')
card('cust', 'r6_track', 0, 1, 540, 1060, 1.5, rot=-1)
pill('cust', 0.55, 1.0, 60, 1500, 'No app. No login.', 'coral', 38, -3)

cap('approve', 'Approve. *Pay. Review.*')
card('approve', 'r4_est', 0, 0.27, 540, 1050, 2.15, rot=2)
card('approve', 'r4_chip_a', 0.25, 0.50, 540, 700, 4.0)
card('approve', 'r4_btn', 0.27, 0.56, 540, 1000, 2.7, taps=[(0.44, 'appr')])
card('approve', 'r4_chip_b', 0.50, 0.58, 540, 700, 4.0, swap=True)
pill('approve', 0.50, 0.62, 600, 1500, 'Approved ✓', 'green', 36, 3)
card('approve', 'r4_inv', 0.56, 0.80, 540, 1050, 1.8, dialog=True, taps=[(0.72, 'pay')])
card('approve', 'r4_inv_paid', 0.74, 0.82, 540, 1050, 1.8, dialog=True, swap=True)
pill('approve', 0.76, 0.84, 600, 1500, 'Paid ✓', 'green', 36, 3)
card('approve', 'r4_fb_stars', 0.80, 1, 540, 1040, 2.5, rot=-1)

cap('ins', 'Insurance claims, *handled.*')
card('ins', 'r5_docs_b', 0, 0.27, 540, 1040, 2.0, rot=-2)
pill('ins', 0.06, 0.27, 560, 1500, 'Documents ✓', 'green', 34, 3)
card('ins', 'r5_pack', 0.25, 0.50, 540, 1080, 1.45, dialog=True)
card('ins', 'r5_split', 0.50, 0.70, 540, 1000, 3.0, rot=-2)
card('ins', 'r5_cust_b', 0.68, 1, 540, 1050, 2.45)
pill('ins', 0.82, 1.0, 560, 1500, 'Approved ✓', 'green', 36, 3)

cap('recv', 'Know what each *insurer owes.*')
card('recv', 'r5_recv', 0, 0.5, 540, 960, 2.8, rot=1)
card('recv', 'r5_ins', 0.45, 1, 540, 1050, 2.7, rot=-1)

cap('more', 'Calendar. Inventory. *Reports. Team.*')
card('more', 'r6_cal', 0, 0.28, 540, 1050, 1.45, rot=-2)
card('more', 'r6_inv', 0.25, 0.52, 540, 1050, 1.95, rot=2, dir='right', panel=True)
card('more', 'r6_rev', 0.50, 0.80, 540, 700, 2.5, rot=-1)
card('more', 'r6_trend', 0.52, 0.80, 540, 1180, 2.4, rot=1, dir='left')
card('more', 'r6_team', 0.78, 1, 540, 1050, 1.95, rot=-1, panel=True)

# ---- sound: a whoosh on every scene change, plus the intro/outro stings
for k in KEYS: hits.append([round(start(k) + 0.05, 3), 'whoosh'])
hits += [[0.12, 'chime'], [0.72, 'whoosh'], [OUTRO, 'whoosh'], [OUTRO + 0.3, 'impact'], [OUTRO + 0.6, 'chime'], [start('close') + 0.4, 'chime']]
hits.sort()
json.dump({'dur': DUR, 'outro': OUTRO, 'closeAt': round(start('close'), 3), 'caps': caps, 'cards': cards, 'pills': pills, 'hits': hits}, open('src/reels/reel6.json', 'w'), indent=1)
print('ok', len(cards), 'cards', len(pills), 'pills', len(hits), 'hits', 'close at', round(start('close'), 2))
