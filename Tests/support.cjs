const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { chromium } = require('playwright');

async function serve(page, root, prefix = '/') {
  await page.route('http://story.test/**', route => {
    const name = new URL(route.request().url()).pathname.slice(prefix.length) || 'index.html';
    return route.fulfill({ path: path.resolve(root, name) });
  });
}

test('feedback from both app entry points preserves playback state and sends only reviewed details', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (window !== window.top) return;
      window.supportCalls = [];
      window.storySupportInfo = {app: '1.1 (5)', device: 'Test iPhone', system: 'iOS test'};
      window.webkit = {messageHandlers: {story: {postMessage: message => {
        supportCalls.push(message);
        if (message.action === 'supportMail') window.storySupportResult('unavailable');
        if (message.action === 'supportCopy') window.storySupportResult(message.success);
      }}}};
    });
    await serve(page, 'Resources');
    await page.goto('http://story.test/');
    await page.waitForFunction(() => !!window.storyPlaybackChanged);
    await page.evaluate(() => window.storyPlaybackChanged({id:'s2', playing:true, deadline:Date.now()+900000, pausedMS:0, failed:false}));
    await page.locator('#open-library').click();
    await page.locator('#archive [data-support="problem"]').click();
    const frame = page.frameLocator('#support iframe');
    await frame.getByLabel('What happened?', {exact:true}).waitFor();
    assert.equal(await frame.locator('#website-link').getAttribute('href'), 'https://zhuhong.me/story/#en');
    await page.waitForFunction(() => document.querySelector('#support iframe').contentDocument.querySelector('#details').value.includes('Sleepless Rain Night'));
    const details = await frame.locator('#details').inputValue();
    assert.match(details, /1\.1 \(5\)/);
    assert.match(details, /Test iPhone/);
    assert.match(details, /Playing/);
    await frame.locator('#message').fill('Rain stopped & timer + playback changed. 雨声');
    await frame.locator('#details').fill('Only the details I chose');
    await frame.getByRole('button', {name:'Continue to email ↗'}).click();
    await frame.getByText('No mail app could open.', {exact:false}).waitFor();
    let draft = await page.evaluate(() => supportCalls.findLast(m => m.action === 'supportMail'));
    assert.equal(draft.body, 'Rain stopped & timer + playback changed. 雨声\n\nOnly the details I chose');
    await frame.locator('#include-details').uncheck();
    await frame.getByRole('button', {name:'Continue to email ↗'}).click();
    await page.waitForFunction(() => supportCalls.filter(m => m.action === 'supportMail').length === 2);
    draft = await page.evaluate(() => supportCalls.findLast(m => m.action === 'supportMail'));
    assert.equal(draft.body, 'Rain stopped & timer + playback changed. 雨声');
    await frame.getByRole('button', {name:'Copy message',exact:true}).click();
    await frame.getByText('Message copied.', {exact:true}).waitFor();
    await frame.locator('#topic').selectOption('sound');
    assert.equal(await frame.locator('#problem-details').isVisible(), false);
    await frame.locator('#message').fill('A quiet market at dawn');
    await frame.locator('#topic').selectOption('problem');
    assert.equal(await frame.locator('#message').inputValue(), 'Rain stopped & timer + playback changed. 雨声');
    assert.equal(await page.locator('#toggle use').getAttribute('href'), '#pause');
    assert.equal(await page.evaluate(() => supportCalls.filter(m => ['toggle','select','settings'].includes(m.action)).length), 0);
    await page.locator('#close-support').click();
    assert.equal(await page.locator('#archive').isVisible(), true);
    await page.locator('#close-library').click();
    await page.locator('#open-settings').click();
    await page.getByLabel('简体中文',{exact:true}).check();
    await page.locator('#settings [data-support="thought"]').click();
    await frame.getByRole('heading',{name:'写给 Story',exact:true}).waitFor();
    assert.equal(await frame.getByRole('button',{name:'复制邮箱',exact:true}).isVisible(), true);
    await frame.locator('#privacy-link').click();
    await page.frameLocator('#policy iframe').getByRole('heading',{name:'隐私声明',exact:true}).waitFor();
    assert.equal(await page.frameLocator('#policy iframe').locator('#website-link').getAttribute('href'), 'https://zhuhong.me/story/privacy.html#zh');
    await page.locator('#close-policy').click();
    assert.equal(await page.locator('#support').isVisible(), true);
    await page.locator('#close-support').click();
    await page.locator('#settings [data-support="help"]').click();
    await frame.getByRole('heading',{name:'安心听一会儿。',exact:true}).waitFor();
    assert.equal(await frame.locator('.letter').isVisible(), false);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('opening help and feedback does not pause preview audio or restart the sleep countdown', async () => {
  const browser = await chromium.launch({channel:'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:402,height:874}});
    await page.addInitScript(() => {
      const AudioElement = window.Audio;
      window.Audio = function(...args) { const audio = new AudioElement(...args); window.testAudio = audio; return audio; };
    });
    await serve(page, 'Resources');
    await page.goto('http://story.test/');
    await page.locator('#mode').click();
    await page.locator('#toggle').click();
    await page.waitForFunction(() => testAudio.currentTime > .1 && !testAudio.paused);
    const before = await page.evaluate(() => testAudio.currentTime);
    await page.locator('#open-settings').click();
    await page.locator('#settings [data-support="thought"]').click();
    const frame = page.frameLocator('#support iframe');
    await frame.getByRole('heading',{name:'Write to Story',exact:true}).waitFor();
    await frame.locator('#message').fill('A quiet moment.');
    await page.locator('#close-support').click();
    await page.locator('#close-settings').click();
    await page.waitForFunction(time => testAudio.currentTime > time && !testAudio.paused, before);
    assert.equal(await page.locator('#mode').getAttribute('aria-label'), 'Sleep timer · 25 min left');
  } finally { await browser.close(); }
});

test('public support page defaults to English, keeps drafts across language changes, copies text and fits small phones', async () => {
  const browser = await chromium.launch({channel:'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:320,height:568}});
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {value:{writeText:async text => {window.copied = text;}}});
    });
    await serve(page, 'AppStore/website', '/story/');
    await page.goto('http://story.test/story/');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.locator('#message').fill('A memory & a place + 一段雨声');
    await page.getByRole('link',{name:'简体中文',exact:true}).click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    assert.equal(await page.locator('#message').inputValue(), 'A memory & a place + 一段雨声');
    await page.getByRole('button',{name:'复制内容',exact:true}).click();
    assert.equal(await page.evaluate(() => copied), 'Story · 分享感受\n\nA memory & a place + 一段雨声');
    await page.locator('#topic').selectOption('problem');
    await page.locator('#include-details').uncheck();
    assert.equal(await page.locator('#details').isVisible(), false);
    await page.getByText('睡眠定时怎么用？',{exact:true}).click();
    assert.equal(await page.locator('details').first().getAttribute('open'), '');
    for (const width of [320,390,678,890]) {
      await page.setViewportSize({width,height:720});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.equal(await page.locator('#privacy-link').getAttribute('href'), 'privacy.html#zh');
    assert.equal(await page.locator('#website-link').isVisible(), false);
    await page.locator('#about-link').click();
    assert.equal(new URL(page.url()).pathname, '/story/about.html');
    await page.getByRole('heading',{name:'把那一刻留下来',exact:true}).waitFor();
    assert.equal(await page.locator('article[lang="zh-Hans"] a').first().getAttribute('href'), 'https://zhuhong.me/');
    await page.getByRole('link',{name:'写给 Story ↗',exact:true}).click();
    await page.locator('#privacy-link').click();
    assert.equal(new URL(page.url()).pathname, '/story/privacy.html');
    await page.getByRole('heading',{name:'隐私声明',exact:true}).waitFor();
  } finally { await browser.close(); }
});
