import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { terms } from '../../src/data.js';

let server;
let siteURL;

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = pathname === '/solar-term/' ? 'index.html' : pathname.slice('/solar-term/'.length);
    if (!pathname.startsWith('/solar-term/') || !/^(index\.html|assets\/[\w.-]+)$/.test(file)) {
      response.writeHead(404).end();
      return;
    }
    try {
      const body = await readFile(resolve('release', file));
      response
        .writeHead(200, {
          'Content-Type': {
            '.html': 'text/html; charset=utf-8',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.webp': 'image/webp',
          }[extname(file)],
          'Content-Length': body.length,
          'Cache-Control': file.startsWith('assets/')
            ? 'public, max-age=31536000, immutable'
            : 'no-cache',
        })
        .end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  siteURL = `http://127.0.0.1:${server.address().port}/solar-term/`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('online subpath loads split code and only current artwork, then fetches the next term', async ({
  page,
}) => {
  const errors = [];
  const requests = [];
  const failures = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  page.on('requestfailed', (request) => failures.push(request.url()));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  const response = await page.goto(`${siteURL}#lichun`, { waitUntil: 'networkidle' });
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('立春');
  await expect(page.locator('.hero-art')).toHaveJSProperty('naturalWidth', 1440);
  expect(requests.filter((url) => url.endsWith('.js')).length).toBeGreaterThanOrEqual(2);
  expect(requests.filter((url) => url.endsWith('.webp')).length).toBeLessThanOrEqual(7);
  expect(requests.every((url) => url.startsWith(siteURL))).toBe(true);
  const initialBytes = await page.evaluate(() =>
    [
      ...performance.getEntriesByType('navigation'),
      ...performance.getEntriesByType('resource'),
    ].reduce((total, entry) => total + entry.decodedBodySize, 0),
  );
  expect(initialBytes).toBeGreaterThan(100 * 1024);
  expect(initialBytes).toBeLessThan(1024 * 1024);
  console.log(`Online initial load: ${(initialBytes / 1024).toFixed(1)} KiB (uncompressed).`);
  const initialArtwork = await page.locator('.hero-art').getAttribute('src');
  await page.getByRole('button', { name: '下一个节气', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('雨水');
  await expect(page.locator('.hero-art')).toHaveJSProperty('naturalWidth', 1440);
  expect(await page.locator('.hero-art').getAttribute('src')).not.toBe(initialArtwork);
  await page.getByRole('tab', { name: '问时令' }).click();
  await expect(page.locator('.quiz-question h4')).toHaveText(terms[1].questions[0].question);
  await page.getByRole('tab', { name: '拼山河' }).click();
  await expect(page.locator('.puzzle-tile')).toHaveCount(9);
  const background = await page
    .locator('.puzzle-tile')
    .first()
    .evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(background).toContain('/solar-term/assets/');
  const downloadReady = page.waitForEvent('download');
  await page.getByRole('button', { name: '保存节气明信片' }).click();
  const download = await downloadReady;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
});

test('every term resolves its online image after hash navigation and page reload', async ({
  page,
}) => {
  const failures = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  await page.goto(`${siteURL}#lichun`);
  for (const term of terms) {
    await page.goto(`${siteURL}#${term.id}`);
    await expect(page.locator('h1')).toHaveText(term.name);
    await expect(page.locator('.hero-art')).toHaveJSProperty('naturalWidth', 1440);
    expect(await page.locator('.hero-art').getAttribute('src')).toContain('/assets/');
  }
  await page.reload();
  await expect(page.locator('h1')).toHaveText('大寒');
  await expect(page.locator('.hero-art')).toHaveJSProperty('naturalWidth', 1440);
  expect(failures).toEqual([]);
});

test('online bilingual content and independent text controls preserve activities', async ({
  page,
}) => {
  test.setTimeout(90000);
  const { checkBilingual } = await import('./helpers/bilingual.js');
  await checkBilingual(page, siteURL);
});
