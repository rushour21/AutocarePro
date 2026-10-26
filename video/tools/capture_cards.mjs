// Cuts the key UI pieces out of the real AutoHub portal as transparent "pop-out cards" for the vertical reels.
// usage: node tools/capture_cards.mjs [r3 r4 r5]   (app must be running on http://localhost:3000, prod build)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const B = process.env.APP || 'http://localhost:3000';
const OUT = path.resolve('public/cards');
fs.mkdirSync(OUT, { recursive: true });
const want = process.argv.slice(2);
const on = (r) => want.length === 0 || want.includes(r);
const metaFile = `${OUT}/cards.json`;
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const DSF = 3;
const PAD = 30;

async function newCtx() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DSF, permissions: ['clipboard-read', 'clipboard-write'] });
  return { ctx, page: await ctx.newPage() };
}
async function as(ctx, page, role, uid) {
  await ctx.addCookies([{ name: 'ah_role', value: role, url: B }, { name: 'ah_uid', value: uid, url: B }]);
  await page.goto(B + '/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((id) => localStorage.setItem('autohub.session', id), uid);
}
const go = async (page, url, ms = 900) => { await page.goto(B + url, { waitUntil: 'networkidle' }); await page.waitForTimeout(ms); };
const safe = async (label, fn) => { try { await fn(); } catch (e) { console.log('FAILED', label, String(e).split('\n')[0]); } };
const card = (loc) => loc.locator('xpath=ancestor::*[contains(@class,"neu")][1]');

/** screenshot one element on a transparent page; `taps` are locators inside it whose centres are stored relative to the element */
async function grab(page, loc, name, taps = {}) {
  await page.addStyleTag({ content: 'html,body{background:transparent!important} nextjs-portal{display:none!important} *{caret-color:transparent!important} html.cap *{visibility:hidden!important} html.cap [data-cap],html.cap [data-cap] *{visibility:visible!important}' });
  await page.evaluate(() => document.querySelectorAll('[data-cap]').forEach((e) => e.removeAttribute('data-cap')));
  await loc.evaluate((el) => { el.scrollIntoView({ block: 'center' }); el.setAttribute('data-cap', '1'); });
  await page.waitForTimeout(250);
  // ancestors keep their layout but a dialog sits in a blurred overlay: hide any backdrop filter so the card stays crisp
  await page.evaluate(() => document.documentElement.classList.add('cap'));
  const bb = await loc.boundingBox();
  const tp = {};
  for (const [k, l] of Object.entries(taps)) { const b = await l.boundingBox(); tp[k] = { x: Math.round(b.x + b.width / 2 - bb.x), y: Math.round(b.y + b.height / 2 - bb.y) }; }
  const clip = { x: Math.max(0, bb.x - PAD), y: Math.max(0, bb.y - PAD), width: bb.width + PAD * 2, height: bb.height + PAD * 2 };
  await page.screenshot({ path: `${OUT}/${name}.png`, clip, omitBackground: true });
  await page.evaluate(() => document.documentElement.classList.remove('cap'));
  meta[name] = { w: Math.round(bb.width), h: Math.round(bb.height), pad: PAD, taps: tp };
  console.log('card', name, Math.round(bb.width), 'x', Math.round(bb.height), JSON.stringify(tp));
}

/* ------------------------------------------------ reel 3: technician (Priya) */
if (on('r3')) await safe('r3', async () => {
  const { ctx, page } = await newCtx();
  await as(ctx, page, 'technician', 'u-priya');
  await go(page, '/employee/jobs');
  await safe('r3_job', () => grab(page, card(page.getByText('#J1010').first()), 'r3_job', { cont: page.getByRole('link', { name: 'Continue' }).first().or(page.getByRole('button', { name: 'Continue' }).first()) }));
  await go(page, '/employee/jobs/J1010');
  const head = page.locator('#stage').locator('xpath=ancestor::div[1]');
  await safe('r3_stage_a', () => grab(page, head, 'r3_stage_a', { sel: page.locator('#stage') }));
  await page.locator('#stage').selectOption('quality_check');
  await page.waitForTimeout(400);
  await safe('r3_stage_b', () => grab(page, head, 'r3_stage_b', { sel: page.locator('#stage') }));
  await safe('r3_title', () => grab(page, page.getByRole('heading', { name: /#J1010/ }), 'r3_title'));
  await go(page, '/employee/parts-request');
  await safe('r3_part', () => grab(page, card(page.getByText('Brake Pad', { exact: true }).first()), 'r3_part', { req: page.getByRole('button', { name: 'Request' }).first() }));
  await page.getByRole('button', { name: 'Request' }).first().click();
  await page.waitForTimeout(600);
  await safe('r3_modal', () => grab(page, page.locator('[role=dialog]'), 'r3_modal', { send: page.getByRole('button', { name: 'Send request' }) }));
  await page.getByRole('button', { name: 'Send request' }).click();
  await page.waitForTimeout(500);
  await as(ctx, page, 'admin', 'u-admin');
  await go(page, '/admin/inventory');
  await safe('r3_banner', () => grab(page, card(page.getByText(/part requests? (is|are) waiting/)), 'r3_banner', { review: page.getByRole('button', { name: 'Review' }) }));
  await ctx.close();
});

/* ------------------------------------------------ reel 4: estimate, approval, payment, review (J1004) */
if (on('r4')) await safe('r4', async () => {
  const { ctx, page } = await newCtx();
  await as(ctx, page, 'technician', 'u-amit');
  await go(page, '/employee/jobs/J1004');
  await safe('r4_tech', () => grab(page, card(page.locator('main img').first()), 'r4_tech'));
  await as(ctx, page, 'admin', 'u-admin');
  await go(page, '/admin/jobs/J1004');
  await page.getByRole('button', { name: /Copy tracking link/ }).click();
  await page.waitForTimeout(250);
  const tok = (await page.evaluate(() => navigator.clipboard.readText())).split('/track/')[1];
  await go(page, `/track/${tok}/estimate`);
  await safe('r4_chip_a', () => grab(page, page.getByText('Awaiting Your Approval').first(), 'r4_chip_a'));
  await safe('r4_est', () => grab(page, card(page.getByText('Estimate EST-1024')), 'r4_est'));
  await safe('r4_btn', () => grab(page, page.getByRole('button', { name: 'Approve Estimate' }).locator('xpath=..'), 'r4_btn', { appr: page.getByRole('button', { name: 'Approve Estimate' }) }));
  await page.getByRole('button', { name: 'Approve Estimate' }).click();
  await page.waitForTimeout(500);
  await safe('r4_confirm', () => grab(page, page.locator('[role=dialog]'), 'r4_confirm', { ok: page.getByRole('button', { name: 'Approve', exact: true }) }));
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.waitForTimeout(700);
  await safe('r4_chip_b', () => grab(page, page.getByText('Approved', { exact: true }).first(), 'r4_chip_b'));
  await page.evaluate(() => { const db = JSON.parse(localStorage.getItem('autohub.db')); const j = db.jobs.find((x) => x.id === 'J1004'); j.stage = 'delivered'; j.progress = 100; db.invoices.unshift({ id: 'INV-1026', customerId: 'c-rahul-m', vehicleId: j.vehicleId, jobId: 'J1004', amount: 38350, date: '18 Mar 2025', status: 'Pending' }); localStorage.setItem('autohub.db', JSON.stringify(db)); });
  await as(ctx, page, 'customer', 'u-rahul-m');
  await go(page, '/customer/invoices');
  await page.getByRole('button', { name: 'View' }).first().click();
  await page.waitForTimeout(600);
  await safe('r4_inv', () => grab(page, page.locator('[role=dialog]'), 'r4_inv', { pay: page.getByRole('button', { name: /^Pay ₹/ }) }));
  await page.getByRole('button', { name: /^Pay ₹/ }).click();
  await page.waitForTimeout(800);
  await safe('r4_inv_paid', () => grab(page, page.locator('[role=dialog]'), 'r4_inv_paid'));
  await go(page, `/track/${tok}/feedback`);
  await safe('r4_fb', () => grab(page, card(page.getByText('How was your experience?')), 'r4_fb', { star5: page.locator('svg.lucide-star').nth(4) }));
  await page.locator('svg.lucide-star').nth(4).click();
  await page.waitForTimeout(400);
  await safe('r4_fb_stars', () => grab(page, card(page.getByText('How was your experience?')), 'r4_fb_stars'));
  await page.getByRole('button', { name: /Submit/i }).click();
  await page.waitForTimeout(700);
  await safe('r4_fb_done', () => grab(page, card(page.getByText('Thank you!')), 'r4_fb_done'));
  await ctx.close();
});

/* ------------------------------------------------ reel 5: insurance claims (CLM-2403) */
if (on('r5')) await safe('r5', async () => {
  const { ctx, page } = await newCtx();
  await as(ctx, page, 'admin', 'u-admin');
  await go(page, '/admin/insurance');
  await safe('r5_list', () => grab(page, page.locator('ul.space-y-3 > li').first(), 'r5_list'));
  await go(page, '/admin/insurance/CLM-2403');
  const sec = (h) => card(page.getByRole('heading', { name: h, exact: true }));
  await safe('r5_head', () => grab(page, card(page.getByRole('heading', { name: 'CLM-2403', exact: true })), 'r5_head', { gen: page.getByRole('button', { name: /Generate claim pack/ }) }));
  await safe('r5_docs_a', () => grab(page, sec('Documents'), 'r5_docs_a', { mark: page.getByRole('button', { name: 'Mark uploaded' }).first() }));
  await safe('r5_photos', () => grab(page, sec('Photos'), 'r5_photos'));
  await safe('r5_split', () => grab(page, page.getByText('Insurance pays').first().locator('xpath=ancestor::div[contains(@class,"bg-ink")][1]'), 'r5_split'));
  await page.getByRole('button', { name: 'Mark uploaded' }).first().click();
  await page.waitForTimeout(500);
  await safe('r5_docs_b', () => grab(page, sec('Documents'), 'r5_docs_b'));
  await page.getByRole('button', { name: /Generate claim pack/ }).click();
  await page.waitForTimeout(2600);
  await safe('r5_pack', () => grab(page, page.locator('[role=dialog]'), 'r5_pack'));
  await page.keyboard.press('Escape');
  await as(ctx, page, 'customer', 'u-rahul-m');
  await go(page, '/customer/jobs/J1033');
  const cs = page.locator('[aria-label="Insurance claim"]');
  await safe('r5_cust_a', () => grab(page, cs, 'r5_cust_a', { appr: page.getByRole('button', { name: /^Approve ₹/ }) }));
  await page.getByRole('button', { name: /^Approve ₹/ }).click();
  await page.waitForTimeout(500);
  await safe('r5_cust_b', () => grab(page, cs, 'r5_cust_b'));
  await as(ctx, page, 'admin', 'u-admin');
  await go(page, '/admin/insurance?tab=receivables');
  await safe('r5_recv', () => grab(page, card(page.getByTestId('receivables-header')), 'r5_recv'));
  await safe('r5_ins', () => grab(page, card(page.getByRole('heading', { name: 'By insurer' })), 'r5_ins'));
  await ctx.close();
});

fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
await browser.close();
