import { expect } from '@playwright/test';
import { terms } from '../../../src/data.js';
import { englishTerms } from '../../../src/data.en.js';

async function untranslatedText(page) {
  return page.evaluate(() => {
    const ignored =
      '.brand-seal, .vertical-seal, .outline-seal, .stamp, .result-seal, .small-number, .language-switch, .text-language-toggle, script, style, svg';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const found = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        !node.parentElement.closest(ignored) &&
        node.parentElement.checkVisibility() &&
        /[\u3400-\u9fff]/.test(node.nodeValue)
      )
        found.push(node.nodeValue.trim());
    }
    return found;
  });
}

export async function checkBilingual(page, url) {
  await page.goto(`${url}#lichun`);
  const description = page.locator('.description');
  await description.locator('.text-language-toggle').click();
  await expect(description).toHaveText(englishTerms.lichun.description);
  await expect(page.locator('.custom-block p').first()).toHaveText(terms[0].customDescription);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.reload();
  await expect(description).toHaveText(englishTerms.lichun.description);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText(englishTerms.lichun.name);
  await description.locator('.text-language-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(description).toHaveText(terms[0].description);
  await expect(page.locator('.custom-block p').first()).toHaveText(
    englishTerms.lichun.customDescription,
  );
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(description).toHaveText(englishTerms.lichun.description);

  await page.locator('[data-tab="quiz"]').first().click();
  const firstOption = page.locator('.quiz-option-row').first();
  await firstOption.locator('.text-language-toggle').click();
  await expect(firstOption.locator('.quiz-option-label')).toHaveText(
    terms[0].questions[0].options[0],
  );
  await expect(firstOption.locator('.quiz-option')).toBeEnabled();
  await page.locator('[data-answer="1"]').click();
  await expect(firstOption.locator('.quiz-option-label')).toHaveText(
    terms[0].questions[0].options[0],
  );
  await expect(page.locator('.answer-feedback')).toContainText('Correct');
  await page.locator('.answer-feedback p .text-language-toggle').click();
  await expect(page.locator('.answer-feedback p')).toHaveText(terms[0].questions[0].explanation);
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(page.locator('[data-answer="1"]')).toBeDisabled();
  await expect(page.locator('.answer-feedback')).toContainText('答对了');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('.answer-feedback')).toContainText('Correct');
  await page.locator('[data-tab="puzzle"]').click();
  await page.locator('[data-tile="0"]').click();
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(page.locator('[data-tile="0"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('[data-tile="0"]')).toHaveAttribute('aria-pressed', 'true');

  // Begin the catalogue sweep with a fresh quiz after verifying state preservation.
  await page.reload();
  for (const term of terms) {
    await page.goto(`${url}#${term.id}`);
    await expect(page.locator('h1')).toHaveText(englishTerms[term.id].name);
    await page.locator('[data-tab="read"]').click();
    await expect(description).toHaveText(englishTerms[term.id].description);
    expect(await untranslatedText(page), `${term.id} reading`).toEqual([]);
    await page.locator('[data-tab="quiz"]').first().click();
    for (let index = 0; index < 3; index++) {
      await expect(page.locator('.quiz-question h4')).toHaveText(
        englishTerms[term.id].questions[index].question,
      );
      await page.locator(`[data-answer="${term.questions[index].answer}"]`).click();
      await expect(page.locator('.answer-feedback p')).toHaveText(
        englishTerms[term.id].questions[index].explanation,
      );
      expect(await untranslatedText(page), `${term.id} quiz ${index}`).toEqual([]);
      await page.locator('[data-action="next-question"]').click();
    }
    expect(await untranslatedText(page), `${term.id} results`).toEqual([]);
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Major Cold');
  await page.locator('[data-view="atlas"]').click();
  await page.getByRole('searchbox').fill('plum');
  expect(await page.locator('.term-card').count()).toBeGreaterThan(0);
  expect(await untranslatedText(page)).toEqual([]);
  await page.locator('[data-view="collection"]').click();
  expect(await untranslatedText(page)).toEqual([]);
  await page.locator('[data-action="sources"]').click();
  expect(await untranslatedText(page)).toEqual([]);
  await page.locator('#modal > p').first().locator('.text-language-toggle').click();
  await expect(page.locator('#modal > p').first()).toContainText('二十四节气依太阳');
  await page.keyboard.press('Escape');

  await page.goto(`${url}#jingzhe`);
  await page.screenshot({ path: 'output/review/bilingual-desktop.png', fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByRole('button', { name: 'English', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  }
  await page.screenshot({ path: 'output/review/bilingual-mobile.png', fullPage: true });
  const downloading = page.waitForEvent('download');
  await page.locator('[data-action="download"]').click();
  const download = await downloading;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toContain('Awakening of Insects');
  await download.saveAs('output/review/bilingual-postcard.png');
}
