// Captures phone-sized states of the real AutoHub portal for the vertical reels.
// usage: node tools/capture_reels.mjs [r1 r2 ...]   (app must be running on http://localhost:3000, prod build)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const B = process.env.APP || 'http://localhost:3000';
const OUT = path.resolve('public/reels');
fs.mkdirSync(OUT, { recursive: true });
const want = process.argv.slice(2);
const on = (r) => want.length === 0 || want.includes(r);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const meta = fs.existsSync(`${OUT}/meta.json`) ? JSON.parse(fs.readFileSync(`${OUT}/meta.json`, 'utf8')) : {};
const targets = fs.existsSync(`${OUT}/targets.json`) ? JSON.parse(fs.readFileSync(`${OUT}/targets.json`, 'utf8')) : {};
/** centre of an element in page css px (what a tap in the screenshot should hit) */
async function mark(name, loc) { const b = await loc.boundingBox(); const sy = await loc.page().evaluate(() => scrollY); targets[name] = { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) }; console.log('target', name, targets[name]); }

async function newCtx() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  return { ctx, page };
}
/** sign in as a role in the same browser context (the demo database lives in localStorage, shared by every role) */
async function as(ctx, page, role, uid) {
  await ctx.addCookies([{ name: 'ah_role', value: role, url: B }, { name: 'ah_uid', value: uid, url: B }]);
  await page.goto(B + '/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((id) => localStorage.setItem('autohub.session', id), uid);
}
const go = async (page, url, ms = 900) => { await page.goto(B + url, { waitUntil: 'networkidle' }); await page.waitForTimeout(ms); };
const CLEAN = `nextjs-portal{display:none!important} *{caret-color:transparent!important}`;
async function shot(page, name, { full = false, ms = 500 } = {}) {
  await page.addStyleTag({ content: CLEAN });
  await page.waitForTimeout(ms);
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file, fullPage: full });
  const dims = await page.evaluate(() => ({ w: innerWidth, h: full => 0 }));
  const h = full ? await page.evaluate(() => document.documentElement.scrollHeight) : 844;
  meta[name] = { w: 390, h };
  console.log('shot', name, h);
}
/** make sure the demo database exists in localStorage (the first mutation persists it), then edit it directly */
async function persist(page) {
  await go(page, '/admin/jobs/J1018');
  const t = page.getByRole('switch', { name: 'Insurance job' });
  await t.click(); await page.waitForTimeout(150); await t.click(); await page.waitForTimeout(150);
}
const patchDb = (page, fn, arg) => page.evaluate(([src, a]) => { const db = JSON.parse(localStorage.getItem('autohub.db')); (new Function('db', 'a', src))(db, a); localStorage.setItem('autohub.db', JSON.stringify(db)); }, [fn.toString().replace(/^[^{]*\{|\}$/g, ''), arg]);
const tokenOf = async (page, id) => { await go(page, `/admin/jobs/${id}`, 400); await page.getByRole('button', { name: /Copy tracking link/ }).click(); await page.waitForTimeout(250); return (await page.evaluate(() => navigator.clipboard.readText())).split('/track/')[1]; };
const safe = async (label, fn) => { try { await fn(); } catch (e) { console.log('FAILED', label, String(e).split('\n')[0]); } };

/* ------------------------------------------------ reel 1: customer tracking (Fortuner, J1018) */
if (on('r1')) await safe('r1', async () => {
  const { ctx, page } = await newCtx();
  await as(ctx, page, 'admin', 'u-admin');
  await persist(page);
  const tok = await tokenOf(page, 'J1018');
  for (const [stage, prog, name] of [['inspection', 20, 'r1_insp'], ['in_repair', 60, 'r1_repair'], ['ready', 100, 'r1_ready']]) {
    await patchDb(page, (db, a) => { const j = db.jobs.find((x) => x.id === 'J1018'); j.stage = a[0]; j.progress = a[1]; }, [stage, prog]);
    await go(page, `/track/${tok}`, 1200);
    await shot(page, name, { full: true });
  }
  await ctx.close();
});

/* ------------------------------------------------ reel 2: owner's view */
if (on('r2')) await safe('r2', async () => {
  const { ctx, page } = await newCtx();
  await as(ctx, page, 'admin', 'u-admin');
  await go(page, '/admin', 3500);
  await shot(page, 'r2_home', { ms: 1500 });
  await page.evaluate(() => { const c = document.querySelector('canvas'); c?.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(1200);
  await shot(page, 'r2_map');
  await mark('r2_bay3', page.getByText('Bay 3', { exact: false }).first());
  await page.getByText('Bay 3', { exact: false }).first().click({ force: true });
  await page.waitForTimeout(1500);
  await shot(page, 'r2_bay');
  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(700);
  await mark('r2_viewjob', page.getByRole('link', { name: 'View Job' }).first());
  await shot(page, 'r2_bay_detail');
  await go(page, '/admin/jobs/J1012', 800);
  await shot(page, 'r2_job');
  await ctx.close();
});

/* ------------------------------------------------ reel 3: technician (Priya) */
if (on('r3')) await safe('r3', async () => {
  const { ctx, page } = await newCtx();
  await as(ctx, page, 'technician', 'u-priya');
  await go(page, '/employee/jobs', 900);
  await mark('r3_continue', page.getByRole('link', { name: 'Continue' }).first().or(page.getByRole('button', { name: 'Continue' }).first()));
  await shot(page, 'r3_jobs');
  await go(page, '/employee/jobs/J1010', 900);
  await shot(page, 'r3_job');
  await mark('r3_stage', page.locator('#stage'));
  await page.locator('#stage').selectOption('quality_check');
  await page.waitForTimeout(500);
  await shot(page, 'r3_status');
  await go(page, '/employee/parts-request', 900);
  await shot(page, 'r3_parts');
  await mark('r3_request', page.getByRole('button', { name: 'Request' }).first());
  await page.getByRole('button', { name: 'Request' }).first().click();
  await page.waitForTimeout(600);
  await mark('r3_send', page.getByRole('button', { name: 'Send request' }));
  await shot(page, 'r3_modal');
  await page.getByRole('button', { name: 'Send request' }).click();
  await page.waitForTimeout(700);
  await shot(page, 'r3_sent');
  await as(ctx, page, 'admin', 'u-admin');
  await go(page, '/admin/inventory', 900);
  await shot(page, 'r3_admin');
  await ctx.close();
});

/* ------------------------------------------------ reel 4: estimate, approval, payment, review (BMW 3, J1004) */
if (on('r4')) await safe('r4', async () => {
  const { ctx, page } = await newCtx();
  await as(ctx, page, 'technician', 'u-amit');
  await go(page, '/employee/jobs/J1004', 900);
  await shot(page, 'r4_tech');
  await as(ctx, page, 'admin', 'u-admin');
  await go(page, '/admin/estimates/EST-1024', 900);
  await shot(page, 'r4_est_admin', { full: true });
  const tok = await tokenOf(page, 'J1004');
  await go(page, `/track/${tok}/estimate`, 900);
  await shot(page, 'r4_est', { full: true });
  await mark('r4_approve', page.getByRole('button', { name: 'Approve Estimate' }));
  await page.getByRole('button', { name: 'Approve Estimate' }).click();
  await page.waitForTimeout(600);
  await shot(page, 'r4_confirm');
  await mark('r4_confirm_btn', page.getByRole('button', { name: 'Approve', exact: true }));
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.waitForTimeout(800);
  await shot(page, 'r4_approved');
  // delivery: job delivered + pending invoice
  await patchDb(page, (db) => { const j = db.jobs.find((x) => x.id === 'J1004'); j.stage = 'delivered'; j.progress = 100; j.completedOn = '18 Mar 2025'; db.invoices.unshift({ id: 'INV-1026', customerId: 'c-rahul-m', vehicleId: j.vehicleId, jobId: 'J1004', amount: 38350, date: '18 Mar 2025', status: 'Pending' }); });
  await as(ctx, page, 'customer', 'u-rahul-m');
  await go(page, '/customer/invoices', 900);
  await shot(page, 'r4_inv');
  await page.getByRole('button', { name: 'View' }).first().click();
  await page.waitForTimeout(700);
  await shot(page, 'r4_pay');
  await mark('r4_paybtn', page.getByRole('button', { name: /^Pay ₹/ }));
  await page.getByRole('button', { name: /^Pay ₹/ }).click();
  await page.waitForTimeout(900);
  await shot(page, 'r4_paid');
  await go(page, `/track/${tok}/feedback`, 900);
  await shot(page, 'r4_fb');
  const stars = page.locator('svg.lucide-star');
  await mark('r4_star5', stars.nth(4));
  await stars.nth(4).click();
  await page.waitForTimeout(500);
  await shot(page, 'r4_fb_stars');
  await page.getByRole('button', { name: /Submit/i }).click().catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, 'r4_fb_done');
  await ctx.close();
});

/* ------------------------------------------------ reel 5: insurance claims (Creta, CLM-2403) */
if (on('r5')) await safe('r5', async () => {
  const { ctx, page } = await newCtx();
  await as(ctx, page, 'admin', 'u-admin');
  await go(page, '/admin/insurance', 900);
  await shot(page, 'r5_list');
  await go(page, '/admin/insurance/CLM-2403', 900);
  for (const h of ['Claim details', 'Documents', 'Photos', 'Estimate split', 'Timelines (reference)', 'Claim timeline']) await mark('r5_h_' + h.split(' ')[0].toLowerCase() + (h === 'Claim details' ? '_d' : ''), page.getByRole('heading', { name: h }));
  await mark('r5_split_card', page.getByText('Customer pays').first());
  await shot(page, 'r5_claim', { full: true });
  await mark('r5_mark', page.getByRole('button', { name: 'Mark uploaded' }).first());
  await page.getByRole('button', { name: 'Mark uploaded' }).first().click();
  await page.waitForTimeout(400);
  await mark('r5_gen', page.getByRole('button', { name: /Generate claim pack/ }));
  await shot(page, 'r5_docs_ok', { full: true });
  await page.getByRole('button', { name: /Generate claim pack/ }).click();
  await page.waitForTimeout(600);
  await shot(page, 'r5_pack_loading');
  await page.waitForTimeout(1800);
  await shot(page, 'r5_pack');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await as(ctx, page, 'customer', 'u-rahul-m');
  await go(page, '/customer/jobs/J1033', 900);
  await shot(page, 'r5_cust');
  await mark('r5_approve', page.getByRole('button', { name: /^Approve ₹/ }));
  await page.getByRole('button', { name: /^Approve ₹/ }).click();
  await page.waitForTimeout(600);
  await shot(page, 'r5_cust_ok');
  await as(ctx, page, 'admin', 'u-admin');
  await go(page, '/admin/insurance?tab=receivables', 900);
  await mark('r5_recv_head', page.getByTestId('receivables-header'));
  await shot(page, 'r5_recv', { full: true });
  await ctx.close();
});

fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
fs.writeFileSync(`${OUT}/targets.json`, JSON.stringify(targets, null, 1));
await browser.close();
