import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("public/images", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto("https://www.makabongwe.network/", { waitUntil: "networkidle", timeout: 120_000 });
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
  await page.screenshot({ path: "public/images/social-preview.png", type: "png" });
} finally {
  await browser.close();
}
