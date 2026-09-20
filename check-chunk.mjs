import { chromium } from "playwright-core";

const b = await chromium.launch({
  channel: "msedge",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});

const ctx = await b.newContext({ viewport: { width: 394, height: 844 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await page.goto("http://localhost:3018/en/cars", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.locator('button[aria-controls="fleet-filters-content"]').click();
await page.waitForTimeout(500);

const cat = page.locator("#fleet-filters-content .space-y-1\\.5").first().locator("button[role=combobox]");

// Open
await cat.evaluate((el) => {
  el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, pointerType: "touch", buttons: 1, isPrimary: true, bubbles: true }));
  el.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, pointerType: "touch", buttons: 0, isPrimary: true, bubbles: true }));
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
});
await page.waitForTimeout(500);
console.log("After tap1:", await cat.getAttribute("data-state"), "lb:", await page.locator('[role=listbox]').count());

// 2nd tap — dispatch each sub-event and sample state at each step
await cat.evaluate((el) => {
  el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 2, pointerType: "touch", buttons: 1, isPrimary: true, bubbles: true }));
});
console.log("after tap2 pointerdown:", await cat.getAttribute("data-state"), "lb:", await page.locator('[role=listbox]').count());
await page.waitForTimeout(50);
console.log("  +50ms:", await cat.getAttribute("data-state"), "lb:", await page.locator('[role=listbox]').count());

await cat.evaluate((el) => {
  el.dispatchEvent(new PointerEvent("pointerup", { pointerId: 2, pointerType: "touch", buttons: 0, isPrimary: true, bubbles: true }));
});
await page.waitForTimeout(50);
console.log("after tap2 pointerup:", await cat.getAttribute("data-state"), "lb:", await page.locator('[role=listbox]').count());

await cat.evaluate((el) => {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
});
console.log("after tap2 click:", await cat.getAttribute("data-state"), "lb:", await page.locator('[role=listbox]').count());
await page.waitForTimeout(500);
console.log("final after tap2:", await cat.getAttribute("data-state"), "lb:", await page.locator('[role=listbox]').count());

// now does a manual Escape close it?
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true })));
await page.waitForTimeout(400);
console.log("after manual doc Escape:", await cat.getAttribute("data-state"), "lb:", await page.locator('[role=listbox]').count());

await ctx.close();
await b.close();
