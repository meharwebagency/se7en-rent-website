import { chromium } from "playwright-core";

const b = await chromium.launch({
  channel: "msedge",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const BASE = "http://localhost:3018";

async function tap(page, loc) {
  await loc.evaluate((el) => {
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, pointerType: "touch", buttons: 1, isPrimary: true, bubbles: true, cancelable: true }));
    el.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, pointerType: "touch", buttons: 0, isPrimary: true, bubbles: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }));
  });
}

const checks = [];
async function log(label, ok) {
  checks.push(ok);
  console.log((ok ? "PASS " : "FAIL ") + label);
}

for (const [lang, dir] of [["en", "/en/cars"], ["ar", "/ar/cars"]]) {
  const ctx = await b.newContext({ viewport: { width: 394, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(BASE + dir, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.locator('button[aria-controls="fleet-filters-content"]').click();
  await page.waitForTimeout(500);
  const cat = page.locator("#fleet-filters-content .space-y-1\\.5").first().locator("button[role=combobox]");

  await tap(page, cat); await page.waitForTimeout(600);
  await log(`${lang.toUpperCase()} 1st tap opens`, await page.locator('[role=listbox]').count() > 0);

  await tap(page, cat); await page.waitForTimeout(800);
  await log(`${lang.toUpperCase()} 2nd tap closes`, await page.locator('[role=listbox]').count() === 0);

  await tap(page, cat); await page.waitForTimeout(600);
  await log(`${lang.toUpperCase()} 3rd tap reopens`, await page.locator('[role=listbox]').count() > 0);

  const brand = page.locator("#fleet-filters-content .space-y-1\\.5").nth(1).locator("button[role=combobox]");
  await tap(page, brand); await page.waitForTimeout(400);
  await log(`${lang.toUpperCase()} open Brand -> Category auto-closes`, await page.locator('button[role=combobox][data-state="open"]').count() === 1);

  const opt = page.locator('[role=listbox] [role=option]').first();
  await opt.evaluate((el) => {
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 2, pointerType: "touch", buttons: 1, isPrimary: true, bubbles: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
  });
  await page.waitForTimeout(500);
  await log(`${lang.toUpperCase()} option select closes`, await page.locator('[role=listbox]').count() === 0);

  await ctx.close();
}

{
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/en/cars", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const cat = page.locator("#fleet-filters-content .space-y-1\\.5").first().locator("button[role=combobox]");
  await cat.click(); await page.waitForTimeout(400);
  await log("DESKTOP 1st click opens", await page.locator('[role=listbox]').count() > 0);
  await cat.click({ force: true }); await page.waitForTimeout(400);
  await log("DESKTOP 2nd click closes (mouse unchanged)", await page.locator('[role=listbox]').count() === 0);
  await ctx.close();
}

await b.close();
const f = checks.filter((c) => !c).length;
console.log(`\n${checks.length - f}/${checks.length} passed${f ? " (" + f + " FAILED)" : ""}.`);

