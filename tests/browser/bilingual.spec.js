import { test } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { checkBilingual } from './helpers/bilingual.js';

test('offline bilingual content and independent text controls preserve activities', async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await context.setOffline(true);
  await checkBilingual(page, pathToFileURL(resolve('dist/index.html')).href);
});
