import { chromium } from "playwright-core";

const b = await chromium.launch({
  channel: "msedge",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});

const ctx = await b.newContext({ viewport: { width: 394, height: 844 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await page.goto("http://localhost:3009/en/cars", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.locator('button[aria-controls="fleet-filters-content"]').click();
await page.waitForTimeout(500);

const cat = page.locator("#fleet-filters-content .space-y-1\\.5").first().locator("button[role=combobox]");

// Open via touch tap
await cat.evaluate((el) => {
  el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, pointerType: "touch", buttons: 1, isPrimary: true, bubbles: true }));
  el.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, pointerType: "touch", buttons: 0, isPrimary: true, bubbles: true }));
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
});
await page.waitForTimeout(500);
console.log("After open:", await cat.getAttribute("data-state"), "| listbox:", await page.locator('[role=listbox]').count());

// Now: does our handler fire? Check the source
const source = await cat.evaluate((el) => {
  // Try to access the React fiber
  const key = Object.keys(el).find(k => k.startsWith('__reactFiber'));
  if (!key) return 'no fiber';
  let fiber = el[key];
  let depth = 0;
  while (fiber && depth < 20) {
    if (fiber.stateNode && fiber.stateNode.selectTriggerPointerDown !== undefined) {
      return 'found selectTriggerPointerDown on stateNode';
    }
    fiber = fiber.return;
    depth++;
  }
  return 'not found in fiber tree';
});
console.log("Source check:", source);

// Check if Escape dispatch actually reaches Radix's content Escape handler
// Radix Select's Content handles Escape at the document level
await cat.evaluate(() => {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
});
await page.waitForTimeout(500);
console.log("After doc Escape:", await cat.getAttribute("data-state"), "| listbox:", await page.locator('[role=listbox]').count());

await ctx.close();
await b.close();
