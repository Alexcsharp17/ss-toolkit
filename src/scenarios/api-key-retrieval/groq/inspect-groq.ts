#!/usr/bin/env npx tsx
/**
 * Inspect Groq console pages - dump selectors
 */

import { chromium } from 'playwright';

async function inspectKeys() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  // Keys page - requires auth, but we can see structure if redirected
  console.log('Loading keys page (may redirect to login)...');
  await page.goto('https://console.groq.com/keys', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const url = page.url();
  console.log('Current URL:', url);

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a[href*="key"], [role="button"]')).map((el) => {
      const a = el as HTMLElement;
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.textContent ?? '').trim().slice(0, 80),
        id: a.id,
        'data-testid': a.getAttribute('data-testid'),
        href: (el as HTMLAnchorElement).href,
      };
    }).filter((b) => b.text || b.href?.includes('key'));
  });
  console.log('Buttons/links related to keys:', JSON.stringify(buttons, null, 2));

  await browser.close();
}

inspectKeys().catch(console.error);
