// Captures real UI from the running AutoHub app as transparent sprites for the film.
// usage: node tools/capture.mjs   (app must be running on http://localhost:3000)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const B = process.env.APP || 'http://localhost:3000';
const OUT = path.resolve('public/sprites');
fs.mkdirSync(OUT, { recursive: true });
const meta = {};
const DSF = 2.5;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function ctxFor(role, uid, vp) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: DSF });
  if (role) {
    await ctx.addCookies([{ name: 'ah_role', value: role, url: B }, { name: 'ah_uid', value: uid, url: B }]);
    await ctx.addInitScript((id) => { try { localStorage.setItem('autohub.session', id); } catch {} }, uid);
  }
  return ctx;
}
const TRANSPARENT = `
  html, body { background: transparent !important; }
  main { background: none !important; box-shadow: none !important; border: none !important; }
  nextjs-portal { display: none !important; }
`;
async function prep(page) {
  await page.addStyleTag({ content: TRANSPARENT });
  await page.evaluate(() => {
    document.querySelectorAll('canvas').forEach((c) => { const w = c.closest('.z-0') || c.parentElement; if (w) w.style.visibility = 'hidden'; });
  });
}
/** screenshot an element (plus padding for shadows) on a transparent page, and remember where it was */
async function grab(page, loc, name, pad = 30, extra = {}) {
  // isolate the element: everything else on the page is made invisible so neighbours never leak into the sprite
  await page.evaluate(() => document.querySelectorAll('[data-cap]').forEach((e) => e.removeAttribute('data-cap')));
  await loc.evaluate((el) => el.setAttribute('data-cap', '1'));
  await page.addStyleTag({ content: 'html.cap *{visibility:hidden !important} html.cap [data-cap], html.cap [data-cap] *{visibility:visible !important}' });
  await page.evaluate(() => document.documentElement.classList.add('cap'));
  const bb = await loc.boundingBox();
  const top = extra.top ?? pad;
  const clip = { x: Math.max(0, bb.x - pad), y: Math.max(0, bb.y - top), width: bb.width + pad * 2, height: bb.height + top + pad };
  await page.screenshot({ path: path.join(OUT, name + '.png'), clip, omitBackground: true });
  meta[name] = { x: bb.x, y: bb.y, w: bb.width, h: bb.height, clip };
  await page.evaluate(() => document.documentElement.classList.remove('cap'));
  console.log('grab', name, Math.round(bb.width), 'x', Math.round(bb.height));
}

/* ------------------------------------------------------------------ admin dashboard @ 1536 x 864 */
{
  const ctx = await ctxFor('admin', 'u-admin', { width: 1536, height: 1000 });
  const page = await ctx.newPage();
  await page.goto(B + '/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await prep(page);
  const hero = page.locator('main > div').first();
  await grab(page, page.locator('aside').first(), 'sidebar');
  await grab(page, hero.locator('div.relative.z-20').first().locator('> div').first(), 'topbar');
  await grab(page, page.locator('h1').first().locator('xpath=..'), 'greeting');
  await grab(page, page.getByRole('link', { name: 'View Settings' }).locator('xpath=..'), 'buttons');
  const kpis = page.locator('section[aria-label="Summary"] > a');
  for (let i = 0; i < 4; i++) await grab(page, kpis.nth(i), 'kpi' + i);
  await grab(page, page.locator('[role=toolbar]'), 'controls');
  await grab(page, page.locator('section[aria-label="Selected bay"]'), 'panel_bay1');
  await grab(page, page.locator('section[aria-label="Today\'s schedule"]'), 'schedule');
  await grab(page, page.getByText('Bay Status', { exact: true }).locator('xpath=ancestor::div[contains(@class,"grid")][1]'), 'bottombar');
  // bay 2 (inspection job)
  await page.locator('button[aria-label^="Bay 2:"]').evaluate((el) => el.click());
  await page.waitForTimeout(500);
  await grab(page, page.locator('section[aria-label="Selected bay"]'), 'panel_bay2');
  await page.getByRole('button', { name: /Update Status/ }).click();
  await page.waitForTimeout(300);
  const pbb = await page.locator('section[aria-label="Selected bay"]').boundingBox();
  await page.locator('section[aria-label="Selected bay"]').evaluate((el) => el.setAttribute('data-cap', '1'));
  await page.addStyleTag({ content: 'html.cap *{visibility:hidden !important} html.cap [data-cap], html.cap [data-cap] *{visibility:visible !important}' });
  await page.evaluate(() => document.documentElement.classList.add('cap'));
  await page.screenshot({ path: path.join(OUT, 'panel_menu.png'), clip: { x: pbb.x - 30, y: pbb.y - 30, width: pbb.width + 60, height: pbb.height + 60 }, omitBackground: true });
  await page.evaluate(() => document.documentElement.classList.remove('cap'));
  const menuBB = await page.getByRole('menu').boundingBox();
  meta.panel_menu = { x: pbb.x, y: pbb.y, w: pbb.width, h: pbb.height, menu: menuBB, clip: { x: pbb.x - 30, y: pbb.y - 30, width: pbb.width + 60, height: pbb.height + 60 } };
  await page.getByRole('menuitem', { name: 'In Repair' }).click();
  await page.waitForTimeout(500);
  await grab(page, page.locator('section[aria-label="Selected bay"]'), 'panel_bay2_repair');
  await grab(page, kpis.nth(0), 'kpi0_after');
  // job details tab
  await page.getByRole('tab', { name: 'Job Details' }).click();
  await page.waitForTimeout(200);
  await grab(page, page.locator('section[aria-label="Selected bay"]'), 'panel_bay2_details');
  await ctx.close();
}

/* ------------------------------------------------------------------ layout studio @ 1536 x 1100 */
{
  const ctx = await ctxFor('admin', 'u-admin', { width: 1536, height: 1100 });
  const page = await ctx.newPage();
  await page.goto(B + '/admin/settings/workshop', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await prep(page);
  const card = (t) => page.getByRole('heading', { name: t, exact: true }).locator('xpath=ancestor::div[contains(@class,"neu")][1]');
  await grab(page, card('Workshop Dimensions'), 'studio_dims');
  await grab(page, card('Tools'), 'studio_tools');
  await grab(page, page.getByRole('heading', { name: 'Workshop Layout', exact: true }).locator('xpath=..'), 'studio_title');
  await grab(page, page.getByRole('button', { name: /Save Draft/ }).locator('xpath=..'), 'studio_actions_idle');
  await grab(page, page.locator('aside[aria-label],div[aria-label="Properties"]').first(), 'studio_props_empty');
  // add a bay, set it up
  await page.getByRole('button', { name: 'Add bay' }).click();
  await page.getByLabel('Bay type').selectOption('tyre');
  await page.getByLabel('Add equipment to bay').selectOption({ label: 'Two-post lift' });
  await page.waitForTimeout(400);
  await grab(page, page.locator('[aria-label="Properties"]'), 'studio_props_bay9');
  await grab(page, page.getByRole('button', { name: /Save Draft/ }).locator('xpath=..'), 'studio_actions_dirty');
  await grab(page, card('Layout Check'), 'studio_check');
  await ctx.close();
}

/* ------------------------------------------------------------------ technician inspection @ 1536 x 1100 */
{
  const ctx = await ctxFor('technician', 'u-amit', { width: 1280, height: 1300 });
  const page = await ctx.newPage();
  await page.goto(B + '/employee/jobs/J1004/inspection', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await prep(page);
  const cards = page.locator('main .neu');
  console.log('inspection cards', await cards.count());
  const title = page.locator('main h1, main h2').first();
  await page.screenshot({ path: path.join(OUT, 'inspection_page.png'), omitBackground: true });
  const cs = await cards.all();
  for (let i = 0; i < Math.min(cs.length, 4); i++) await grab(page, cs[i], 'insp' + i);
  await ctx.close();
}

/* ------------------------------------------------------------------ customer share link on a phone @ 390 x 844 */
{
  const cctx = await ctxFor('customer', 'u-rahul-m', { width: 1280, height: 800 });
  const cp = await cctx.newPage();
  await cp.goto(B + '/customer/share', { waitUntil: 'networkidle' });
  await cp.waitForTimeout(600);
  const vals = await cp.locator('input[readonly]').evaluateAll((els) => els.map((e) => e.value));
  const tok = vals.find((v) => v.includes('j1004')).split('/track/')[1];
  await cctx.close();
  meta.token = tok;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  for (const [name, p] of [['phone_overview', ''], ['phone_estimate', '/estimate'], ['phone_timeline', '/timeline'], ['phone_photos', '/photos'], ['phone_live', '/live']]) {
    await page.goto(`${B}/track/${tok}${p}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    meta[name] = { w: 390, h };
    console.log('phone', name, h);
  }
  // approve the estimate and capture the approved state
  await page.goto(`${B}/track/${tok}/estimate`, { waitUntil: 'networkidle' });
  const ok = page.getByRole('button', { name: /Approve Estimate/ });
  await ok.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const bb = await ok.boundingBox();
  meta.approve_btn = bb;
  await ok.click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'phone_estimate_approved.png'), fullPage: true });
  meta.phone_estimate_approved = { w: 390, h: await page.evaluate(() => document.documentElement.scrollHeight) };
  await ctx.close();
}

fs.writeFileSync(path.join(OUT, 'sprites.json'), JSON.stringify(meta, null, 1));
await browser.close();
console.log('done');
