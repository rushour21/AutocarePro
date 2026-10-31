const pptxgen = require('pptxgenjs');
const React = require('react');
const RDS = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
const fs = require('fs');
const path = require('path');
const SKILL = '/root/.claude/skills/synced/c1aad0e5-b380-4b4d-a58d-6de56fbf9822_c35448ff-de04-4c4f-8d6f-0978226b75c5/pptx';
const { applyTheme } = require(`${SKILL}/scripts/apply_theme.js`);

const CARDS = path.resolve(__dirname, '../../video/public/cards');
const meta = JSON.parse(fs.readFileSync(`${CARDS}/cards.json`, 'utf8'));

const THEME = {
  name: 'AutoHub Pitch', headFontFace: 'Arial', bodyFontFace: 'Calibri',
  colors: { dk1: '1C1D20', lt1: 'FFFFFF', dk2: '55565A', lt2: 'F4F5F7', accent1: 'F26A2E', accent2: '2F6BFF', accent3: '1D9D65', accent4: '7456F0', accent5: 'EE8A12', accent6: '59616D', hlink: '2F6BFF', folHlink: '7456F0' },
};
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pres.title = 'AutoHub: client presentation';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const W = 13.333, M = 0.7;

pres.defineSlideMaster({ title: 'CONTENT', background: { color: C.background1 },
  objects: [{ placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.45, w: W - 2 * M, h: 0.9, fontFace: 'Arial', fontSize: 34, bold: true, color: C.text1, valign: 'middle', margin: 0 }, text: '' } }],
  slideNumber: { x: W - 1.2, y: 7.0, w: 0.6, h: 0.3, fontFace: 'Calibri', fontSize: 11, color: C.text2 } });
pres.defineSlideMaster({ title: 'DARK', background: { color: C.text1 },
  objects: [{ placeholder: { options: { name: 'title', type: 'title', x: M, y: 2.0, w: 6.4, h: 2.4, fontFace: 'Arial', fontSize: 44, bold: true, color: C.background1, valign: 'top', margin: 0 }, text: '' } }] });

async function icon(Comp, color, size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}
/** a cut-out UI card from the real app, fitted into a box (keeps its shape) */
function card(slide, name, x, y, maxW, maxH) {
  const m = meta[name]; const nw = m.w + 2 * m.pad, nh = m.h + 2 * m.pad;
  const k = Math.min(maxW / nw, maxH / nh); const w = nw * k, h = nh * k;
  slide.addImage({ path: `${CARDS}/${name}.png`, x: x + (maxW - w) / 2, y: y + (maxH - h) / 2, w, h, altText: `AutoHub screen: ${name}` });
}
const circleIcon = async (slide, Comp, x, y, d, bg, fg = 'FFFFFF') => {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 } });
  slide.addImage({ data: await icon(Comp, fg), x: x + d * 0.25, y: y + d * 0.25, w: d * 0.5, h: d * 0.5, altText: '' });
};
const body = (slide, runs, x, y, w, h, o = {}) => slide.addText(runs, { x, y, w, h, fontFace: 'Calibri', fontSize: 18, color: C.text2, valign: 'top', margin: 0, isTextBox: true, ...o });
const title = (slide, t) => slide.addText(t, { placeholder: 'title' });
const bullets = (items, size = 20) => items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 12, fontSize: size } }));

(async () => {
  // 1. Title
  pres.addSection({ title: 'Opening' });
  let s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Opening' });
  s.addText('AutoHub', { x: M, y: 0.7, w: 4, h: 0.5, fontFace: 'Arial', fontSize: 22, bold: true, color: C.accent1, margin: 0, isTextBox: true });
  title(s, 'Run your whole workshop from one screen');
  body(s, 'Jobs, customers and insurance claims in one simple system for garages.', M, 4.6, 6.2, 1.0, { fontSize: 20, color: 'D9DADD' });
  body(s, 'Client presentation', M, 6.5, 5, 0.4, { fontSize: 14, color: 'A0A2A8' });
  s.addShape(pres.ShapeType.roundRect, { x: 7.6, y: 1.0, w: 5.0, h: 5.5, rectRadius: 0.25, fill: { color: C.background1 }, line: { color: C.background1, width: 0 }, shadow: { type: 'outer', color: '000000', blur: 14, offset: 4, angle: 90, opacity: 0.35 } });
  card(s, 'r6_map', 7.8, 1.2, 4.6, 5.1);

  // 2. Problem
  pres.addSection({ title: 'The problem' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'The problem' });
  title(s, 'Running a garage is harder than it should be');
  const probs = [
    [fa.FaPhoneAlt, 'Endless status calls', 'Customers keep phoning to ask, "Is my car ready?"'],
    [fa.FaFileAlt, 'Details get lost', 'Job information sits on paper, WhatsApp and in memory.'],
    [fa.FaShieldAlt, 'Insurance paperwork', 'Missing documents, surveyor delays and late payments.'],
    [fa.FaEye, 'No clear picture', 'The owner cannot see which car is in which bay.'],
  ];
  for (let i = 0; i < 4; i++) {
    const x = M + (i % 2) * 6.1, y = 1.75 + Math.floor(i / 2) * 2.45;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 5.8, h: 2.15, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.background2, width: 0 }, objectName: `Problem card ${i + 1}` });
    await circleIcon(s, probs[i][0], x + 0.35, y + 0.4, 0.9, C.accent1);
    body(s, probs[i][1], x + 1.5, y + 0.4, 4.0, 0.5, { fontSize: 22, bold: true, color: C.text1, fontFace: 'Arial' });
    body(s, probs[i][2], x + 1.5, y + 1.0, 4.0, 0.9, { fontSize: 16 });
  }

  // 3. Solution
  pres.addSection({ title: 'The solution' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'The solution' });
  title(s, 'One platform, three portals');
  const roles = [
    [fa.FaUserTie, 'Owner', 'Sees the whole workshop live. Creates jobs, sends estimates, tracks insurance claims.', C.accent1],
    [fa.FaWrench, 'Technician', 'Opens their own jobs on a phone. Inspects cars, updates status, asks for parts.', C.accent2],
    [fa.FaUser, 'Customer', 'Follows the car from a private link. Approves work and pays, with no app.', C.accent3],
  ];
  for (let i = 0; i < 3; i++) {
    const x = M + i * 4.1;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.75, w: 3.8, h: 4.0, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.background2, width: 0 }, objectName: `Portal card ${i + 1}` });
    await circleIcon(s, roles[i][0], x + 0.4, 2.1, 1.0, roles[i][3]);
    body(s, roles[i][1], x + 0.4, 3.35, 3.0, 0.5, { fontSize: 26, bold: true, color: C.text1, fontFace: 'Arial' });
    body(s, roles[i][2], x + 0.4, 4.0, 3.0, 1.6, { fontSize: 16 });
  }
  body(s, 'Everyone works from the same live information, so nothing is lost between people.', M, 6.1, W - 2 * M, 0.6, { fontSize: 20, bold: true, color: C.text1 });

  // 4. Live workshop
  pres.addSection({ title: 'How it works' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'How it works' });
  title(s, 'See your whole workshop, live');
  body(s, bullets(['Every bay, every car and every technician on one map', 'Switch between a simple 2D plan and a 3D view', 'Tap any bay to open the job and update its status', "Today's jobs, due-today and waiting-for-approval at a glance"]), M, 1.8, 5.6, 4.2);
  card(s, 'r6_map', 6.8, 1.5, 3.4, 4.9); card(s, 'r6_kpi', 9.9, 2.2, 2.9, 1.8);
  body(s, 'Demo data shown.', 6.8, 6.5, 4, 0.3, { fontSize: 11, color: C.text2 });

  // 5. Job creation
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'How it works' });
  title(s, 'Creating a job takes about a minute');
  const steps = ['Vehicle: find the car or add a new one', 'Service: choose the work and the technician', 'Inspection: mark damage on the car', 'Estimate: build the quote', 'Review: create the job'];
  for (let i = 0; i < 5; i++) {
    const y = 1.75 + i * 0.95;
    s.addShape(pres.ShapeType.ellipse, { x: M, y, w: 0.6, h: 0.6, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 } });
    s.addText(String(i + 1), { x: M, y, w: 0.6, h: 0.6, align: 'center', valign: 'middle', fontFace: 'Arial', fontSize: 18, bold: true, color: C.background1, margin: 0, isTextBox: true });
    body(s, steps[i], M + 0.85, y + 0.05, 5.6, 0.5, { fontSize: 20, color: C.text1 });
  }
  card(s, 'r6_damage', 7.9, 1.5, 4.7, 5.0);
  body(s, 'The condition of the car is recorded at drop-off. That protects you and the customer.', 7.9, 6.5, 4.8, 0.5, { fontSize: 14 });

  // 6. Technician
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'How it works' });
  title(s, 'Technicians work from their phone');
  body(s, bullets(['Each technician sees only their own jobs', 'Update the status in one tap', 'Request a part without walking to the counter', 'The store sees the request straight away']), M, 1.8, 5.6, 4.2);
  card(s, 'r3_job', 6.9, 1.5, 5.6, 2.6); card(s, 'r3_banner', 6.9, 4.4, 5.6, 1.4);
  body(s, 'Demo data shown.', 6.9, 6.2, 4, 0.3, { fontSize: 11 });

  // 7. Customer
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'How it works' });
  title(s, 'Customers always know where their car is');
  card(s, 'r6_track', M, 1.5, 4.0, 5.3);
  body(s, bullets(['A private link for every car. No app, no login', 'Live status from inspection to ready for pickup', 'Photos and findings from the workshop', 'Fewer "is it ready?" calls to your team']), 5.4, 1.9, 7.2, 4.2);

  // 8. Approve and pay
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'How it works' });
  title(s, 'Approve extra work and pay with a tap');
  card(s, 'r4_est', M, 1.5, 3.6, 4.9); card(s, 'r4_fb_stars', 4.5, 1.9, 3.6, 3.8);
  body(s, bullets(['Extra work is sent with photos and a clear price', 'The customer approves from the link', 'Pay online on delivery day', 'Then leave a star review'], 18), 8.5, 1.9, 4.2, 4.2);
  body(s, 'Estimate shown. Review step shown. Demo data.', M, 6.6, 7, 0.3, { fontSize: 11 });

  // 9. Insurance
  pres.addSection({ title: 'Insurance' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Insurance' });
  title(s, 'Insurance claims, under control');
  body(s, bullets(['Checklist for documents and photos', 'One claim pack to send to the surveyor', 'A clear split: what the insurer pays and what the customer pays', 'See what each insurer owes you, and for how long'], 18), M, 1.8, 5.4, 4.5);
  card(s, 'r5_split', 6.4, 1.6, 3.4, 2.2); card(s, 'r5_recv', 9.7, 1.6, 3.2, 2.2); card(s, 'r5_ins', 6.4, 4.0, 6.5, 2.7);
  body(s, 'Demo data shown.', 6.4, 6.8, 4, 0.3, { fontSize: 11 });

  // 10. Gains
  pres.addSection({ title: 'Benefits' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Benefits' });
  title(s, 'What you gain');
  const gains = [[fa.FaPhoneSlash, 'Fewer phone calls', 'Customers check status themselves.'], [fa.FaCheckCircle, 'Faster approvals', 'One tap on a link instead of a call.'], [fa.FaCamera, 'Fewer disputes', "The car's condition is recorded at check-in."], [fa.FaRupeeSign, 'Clear insurance money', 'Know what each insurer owes you.']];
  for (let i = 0; i < 4; i++) {
    const x = M + (i % 2) * 6.1, y = 1.7 + Math.floor(i / 2) * 1.9;
    await circleIcon(s, gains[i][0], x, y, 0.9, C.accent3);
    body(s, gains[i][1], x + 1.2, y, 4.5, 0.5, { fontSize: 22, bold: true, color: C.text1, fontFace: 'Arial' });
    body(s, gains[i][2], x + 1.2, y + 0.55, 4.5, 0.7, { fontSize: 16 });
  }
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 5.65, w: W - 2 * M, h: 1.0, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2, width: 0 } });
  body(s, [{ text: 'Also included: ', options: { bold: true, color: C.text1 } }, { text: 'calendar, inventory and parts approval, reports, team, customer bookings, and a designer for your workshop layout.' }], M + 0.3, 5.8, W - 2 * M - 0.6, 0.7, { fontSize: 16, valign: 'middle' });

  // 11. Getting started
  pres.addSection({ title: 'Next steps' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Next steps' });
  title(s, 'How we get you started');
  const start = [[fa.FaDesktop, 'Walkthrough', 'We show it using your own cars and bays.'], [fa.FaCogs, 'Set up', 'Your bays, services and team are added.'], [fa.FaChalkboardTeacher, 'Train', 'A short session for staff and mechanics.'], [fa.FaRocket, 'Go live', 'You start running real jobs.']];
  for (let i = 0; i < 4; i++) {
    const x = M + i * 3.05;
    s.addShape(pres.ShapeType.roundRect, { x, y: 2.0, w: 2.8, h: 3.6, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.background2, width: 0 }, objectName: `Step card ${i + 1}` });
    await circleIcon(s, start[i][0], x + 0.3, 2.3, 0.85, C.accent1);
    body(s, `${i + 1}. ${start[i][1]}`, x + 0.3, 3.4, 2.3, 0.5, { fontSize: 20, bold: true, color: C.text1, fontFace: 'Arial' });
    body(s, start[i][2], x + 0.3, 4.0, 2.3, 1.4, { fontSize: 16 });
  }

  // 12. Next step
  s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Next steps' });
  s.addText("Let's see it on your workshop", { placeholder: 'title' });
  body(s, 'Book a short walkthrough. We will use your own cars, bays and team.', M, 4.6, 6.2, 1.2, { fontSize: 20, color: 'D9DADD' });
  body(s, 'Screens in this presentation use demo data.', M, 6.5, 6, 0.4, { fontSize: 13, color: 'A0A2A8' });
  card(s, 'r5_cust_b', 7.8, 1.0, 4.7, 5.5);

  // speaker notes (plain language)
  const notes = ['Welcome. In the next few minutes I will show how AutoHub helps a garage run jobs, customers and insurance claims in one place.', 'These are the everyday problems: calls asking for status, details lost on paper and WhatsApp, insurance paperwork, and no clear picture of the floor.', 'AutoHub has three parts that share the same live information: one for the owner, one for technicians, one for customers.', 'The owner sees every bay and car on one live map, in 2D or 3D. Tapping a bay opens the job.', 'A job is created in five short steps. The car condition is marked on a diagram at check-in.', 'Technicians see only their jobs. They update status and request parts from the phone.', 'Customers get a private link. They see live status without calling.', 'Extra work is sent with photos and price. The customer approves with one tap, pays online and can leave a review.', 'For insurance jobs we track documents and photos, prepare the claim pack for the surveyor, split the bill between insurer and customer, and show what each insurer owes.', 'The result: fewer calls, faster approvals, fewer disputes and clear insurance money.', 'Getting started is simple: a walkthrough, setup, training and go-live.', 'Next step: a short walkthrough using your own workshop.'];
  pres.slides.forEach((sl, i) => sl.addNotes(notes[i]));

  await pres.writeFile({ fileName: path.resolve(__dirname, 'AutoHub-client-pitch.pptx') });
  await applyTheme(path.resolve(__dirname, 'AutoHub-client-pitch.pptx'), THEME);
  console.log('written');
})().catch((e) => { console.error(e); process.exit(1); });
