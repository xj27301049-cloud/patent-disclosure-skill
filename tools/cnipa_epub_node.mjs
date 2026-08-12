#!/usr/bin/env node

import { existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EPUB_BASE = 'http://epub.cnipa.gov.cn/';
const RESULT_TITLES = new Set(['专利查询结果展示', '无查询结果']);
const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const RUNTIME_DIR = process.env.PATENT_BROWSER_RUNTIME_DIR || '/workspace/patent_runtime/browser';
const CHROMIUM_TMP = join(RUNTIME_DIR, 'chromium_tmp');
const FONTCONFIG_DIR = join(RUNTIME_DIR, 'fontconfig');
mkdirSync(CHROMIUM_TMP, { recursive: true });
mkdirSync(FONTCONFIG_DIR, { recursive: true });
const glesPath = join(CHROMIUM_TMP, 'libGLESv2.so');
if (existsSync(glesPath) && statSync(glesPath).size < 1024) unlinkSync(glesPath);
const chromiumPath = join(CHROMIUM_TMP, 'chromium');
if (existsSync(chromiumPath) && !existsSync(glesPath)) unlinkSync(chromiumPath);
// @sparticuz/chromium extracts its bundled browser into os.tmpdir(). Keep that
// work inside a known writable, task-specific directory in restricted runtimes.
process.env.TMPDIR = CHROMIUM_TMP;
process.env.FONTCONFIG_PATH = FONTCONFIG_DIR;

async function launchBrowser() {
  const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
    import('@sparticuz/chromium'),
    import('puppeteer-core'),
  ]);
  const executablePath = await chromium.executablePath();
  return puppeteer.launch({
    executablePath,
    headless: true,
    dumpio: process.env.CNIPA_BROWSER_DEBUG === '1',
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  });
}

async function smokeTest() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent('<main id="probe">中文字体与浏览器内核正常</main>');
    const value = await page.$eval('#probe', (el) => el.textContent);
    process.stdout.write(JSON.stringify({ ok: value === '中文字体与浏览器内核正常', value }));
  } finally {
    await browser.close();
  }
}

async function fetchResultHtml(keyword) {
  const maxWaitMs = Number(process.env.EPUB_WAF_MAX_WAIT_SEC || 180) * 1000;
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 900 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9' });
    await page.goto(EPUB_BASE, { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('#searchStr', { timeout: maxWaitMs });
    await page.$eval('#searchStr', (el, value) => { el.value = value; }, keyword);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 120000 }),
      page.$eval('#indexForm', (form) => form.submit()),
    ]);
    await page.waitForFunction(
      (titles) => {
        const title = document.title.trim();
        if (!titles.includes(title)) return false;
        if (title === '无查询结果') return true;
        const result = document.querySelector('#result');
        if (!result) return false;
        if (result.querySelector('div.item, h1.title')) return true;
        const html = result.innerHTML;
        return ['无查询结果', '没有找到', '未检索到', '0条'].some((s) => html.includes(s));
      },
      { timeout: 120000 },
      [...RESULT_TITLES]
    );
    process.stdout.write(await page.content());
  } finally {
    await browser.close();
  }
}

const args = process.argv.slice(2);
try {
  if (args[0] === '--smoke') {
    await smokeTest();
  } else {
    const keyword = (args[0] || '').trim();
    if (!keyword) throw new Error('missing keyword');
    await fetchResultHtml(keyword);
  }
} catch (error) {
  const detail = error?.stack || error?.message || JSON.stringify(error, Object.getOwnPropertyNames(error || {}));
  process.stderr.write(`CNIPA_NODE_ERROR: ${detail}\n`);
  process.exitCode = 1;
}
