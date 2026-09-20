import { chromium } from "playwright-core";

const b = await chromium.launch({
  channel: "msedge",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});

const ctx = await b.newContext({ viewport: { width: 394, height: 844 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await page.goto("http://localhost:3009/en/cars", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.locator('button[aria-controls="fleet-filters-content"]').click();
await page.waitForTimeout(500);

// Open via native touch tap
await page.evaluate(() => {
  const t = document.querySelector('#fleet-filters-content .space-y-1\\.5')?.querySelector('button[role=combobox]');
  const r = t.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  t.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: cx, clientY: cy, buttons: 1, isPrimary: true, bubbles: true }));
  t.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: cx, clientY: cy, buttons: 0, isPrimary: true, bubbles: true }));
  t.dispatchEvent(new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true }));
});
await page.waitForTimeout(600);

const openState = await page.evaluate(() => ({
  trigger: document.querySelector('button[role=combobox]')?.getAttribute('data-state'),
  listbox: !!document.querySelector('[role=listbox]'),
}));
console.log("Opened:", JSON.stringify(openState));

// Now: does dispatching Escape on the TRIGGER close it?
const escOnTrigger = await page.evaluate(() => {
  const t = document.querySelector('button[role=combobox]');
  t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  return true;
});
await page.waitForTimeout(500);
const afterEscTrigger = await page.evaluate(() => ({
  trigger: document.querySelector('button[role=combobox]')?.getAttribute('data-state'),
  listbox: !!document.querySelector('[role=listbox]'),
}));
console.log("After Escape on trigger:", JSON.stringify(afterEscTrigger));

// Reopen, then Escape on document.body
if (afterEscTrigger.listbox) {
  await page.evaluate(() => {
    const t = document.querySelector('button[role=combobox]');
    const r = t.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    t.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: cx, clientY: cy, buttons: 1, isPrimary: true, bubbles: true }));
    t.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2, pointerType: 'touch', clientX: cx, clientY: cy, buttons: 0, isPrimary: true, bubbles: true }));
    t.dispatchEvent(new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true }));
  });
  await page.waitForTimeout(500);
}
const before = await page.evaluate(() => document.querySelector('[role=listbox]') ? 'open' : 'closed');
await page.evaluate(() => {
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
});
await page.waitForTimeout(500);
const afterEscBody = await page.evaluate(() => ({
  trigger: document.querySelector('button[role=combobox]')?.getAttribute('data-state'),
  listbox: !!document.querySelector('[role=listbox]'),
}));
console.log("Before:", before, "After Escape on body:", JSON.stringify(afterEscBody));

await ctx.close();
await b.close();
