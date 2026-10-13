import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { terms } from '../../src/data.js';

const fileURL = pathToFileURL(resolve('dist/index.html')).href;

test('all 24 terms, artwork and navigation work from a file URL with networking disabled', async ({
  page,
  context,
}) => {
  await context.setOffline(true);
  const errors = [];
  const remoteRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) remoteRequests.push(request.url());
  });
  await page.goto(`${fileURL}#lichun`);
  await expect(page.locator('h1')).toHaveText('立春');
  await page.screenshot({ path: 'output/review/desktop-spring.png', fullPage: true });
  for (const term of terms) {
    await page.goto(`${fileURL}#${term.id}`);
    await expect(page.locator('h1')).toHaveText(term.name);
    await expect(page.locator('.hero-art')).toBeVisible();
    await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true);
    expect(await page.locator('.hero-art').evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
    await page.getByRole('tab', { name: '问时令' }).click();
    await expect(page.locator('.quiz-question h4')).toHaveText(term.questions[0].question);
    await page.getByRole('tab', { name: '拼山河' }).click();
    await expect(page.locator('.puzzle-tile')).toHaveCount(9);
  }
  await page.goto(`${fileURL}#hanlu`);
  await page.screenshot({ path: 'output/review/desktop-autumn.png', fullPage: true });
  await page.getByRole('button', { name: '节气图鉴', exact: true }).click();
  await expect(page.locator('.atlas-grid .term-card')).toHaveCount(24);
  await page.getByRole('searchbox').fill('梅花');
  expect(await page.locator('.atlas-grid .term-card').count()).toBeGreaterThan(0);
  await page.getByRole('searchbox').fill('不存在的时令');
  await expect(page.getByText('还未寻到这份时令')).toBeVisible();
  await page.getByRole('button', { name: '查看全部节气' }).click();
  await expect(page.locator('.atlas-grid .term-card')).toHaveCount(24);
  await page.getByRole('button', { name: '冬藏', exact: true }).click();
  await expect(page.locator('.atlas-grid .term-card')).toHaveCount(6);
  await page.getByRole('button', { name: '资料与创作' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
  expect(remoteRequests).toEqual([]);
});

test('quiz, puzzle, seals, persistence and postcard export form one complete journey', async ({
  page,
  context,
}) => {
  await context.setOffline(true);
  await page.goto(`${fileURL}#lichun`);
  await page.getByRole('tab', { name: '问时令' }).click();
  await page.locator('[data-answer="0"]').click();
  await expect(page.locator('.answer-feedback')).toContainText('答案是 B');
  await page.getByRole('button', { name: '下一题', exact: true }).click();
  await page.locator('[data-answer="2"]').click();
  await page.getByRole('button', { name: '下一题', exact: true }).click();
  await page.locator('[data-answer="0"]').click();
  await page.getByRole('button', { name: '查看结果' }).click();
  await expect(page.locator('.result-panel')).toContainText('答对 2 / 3');
  await expect(page.locator('.activity-progress')).toHaveText('0 / 2');
  await page.getByRole('button', { name: '再答一次' }).click();
  for (let i = 0; i < 3; i++) {
    await page.locator(`[data-answer="${terms[0].questions[i].answer}"]`).click();
    await page.getByRole('button', { name: i === 2 ? '查看结果' : '下一题', exact: true }).click();
  }
  await expect(page.locator('.activity-progress')).toHaveText('1 / 2');
  await page.getByRole('button', { name: '去拼山河' }).click();
  await page.getByRole('button', { name: '查看完整原图' }).click();
  await expect(page.locator('.puzzle-peek')).toBeVisible();
  await expect(page.locator('.puzzle-tile').first()).toBeDisabled();
  await page.getByRole('button', { name: '查看完整原图' }).click();
  for (let i = 0; i < 9; i++) {
    const labels = await page
      .locator('.puzzle-tile')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')));
    const current = labels.map((label) => Number(label.match(/图块 (\d+)/)[1]) - 1);
    if (current[i] !== i) {
      await page.locator(`[data-tile="${i}"]`).click();
      await page.locator(`[data-tile="${current.indexOf(i)}"]`).click();
    }
  }
  await expect(page.locator('.puzzle-board')).toHaveClass(/solved/);
  await expect(page.locator('.activity-progress')).toContainText('印记已藏');
  await page.getByRole('button', { name: /我的印记/ }).click();
  await expect(page.locator('.seal-item.earned')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: /我的印记/ }).click();
  await expect(page.locator('.seal-item.earned')).toHaveCount(1);
  await page.getByRole('button', { name: '立春，已收集印记', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '保存节气明信片' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^岁时-立春-\d{4}\.png$/);
  await download.saveAs('output/review/postcard.png');
});

test('narrow screens remain usable and tabs support keyboard navigation', async ({
  page,
  context,
}) => {
  await context.setOffline(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${fileURL}#hanlu`);
  await page.screenshot({ path: 'output/review/mobile-autumn.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('tab', { name: '读时令' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '问时令' })).toBeFocused();
  await expect(page.getByRole('tab', { name: '问时令' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: '拼山河' })).toBeFocused();
  await page.screenshot({ path: 'output/review/mobile-puzzle.png', fullPage: true });
  await expect(page.locator('.puzzle-tile').first()).toBeVisible();
  await page.getByRole('button', { name: '节气图鉴', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: /我的印记/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
