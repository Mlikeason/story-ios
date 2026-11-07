const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { chromium } = require('playwright');

test('outer playback, both inner layouts, sleep deadline and language preferences', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 678, height: 466 } });
    await page.clock.install();
    await page.addInitScript(() => {
      const AudioElement = window.Audio;
      window.Audio = function (...args) {
        const audio = new AudioElement(...args);
        (window.testPlayers ??= []).push(audio);
        return audio;
      };
    });
    await page.route('http://story.test/**', route => {
      const name = new URL(route.request().url()).pathname.slice(1) || 'index.html';
      return route.fulfill({ path: path.resolve('Resources', name) });
    });
    await page.goto('http://story.test/');
    const visibleTitle = text => page.waitForFunction(expected => document.querySelector('h1').textContent === expected, text);
    const waitForIcon = icon => page.waitForFunction(
      expected => document.querySelector('#toggle use').getAttribute('href') === expected, icon
    );
    await visibleTitle('Margaret River');
    assert.equal(await page.locator('#description').count(), 0);
    assert.equal(await page.locator('#favorite').innerText(), '');
    const waveAnimation = () => page.locator('#wave path').first().evaluate(bar => getComputedStyle(bar).animationName);
    const tentExtras = ['#open-library', '#title', '#number', '#location', '#favorite', '#open-settings'];
    // The phone layout centers the transport on the glass, even with an asymmetric safe area.
    await page.evaluate(() => document.documentElement.style.setProperty('--left', '47px'));
    for (const [width, height] of [[402, 874], [874, 402], [402, 874], [678, 466]]) {
      await page.setViewportSize({width, height});
      for (const selector of ['.caption .eyebrow', '#title', '#location', '#favorite']) {
        assert.equal(await page.locator(selector).isVisible(), height > width, selector + ' follows iPhone orientation');
      }
      for (const selector of ['#wave', '#toggle', '.transport']) {
        const box = await page.locator(selector).boundingBox();
        assert.ok(Math.abs(box.x + box.width / 2 - width / 2) < 1, selector + ' centered on iPhone');
      }
      const playlist = await page.locator('#open-library').boundingBox();
      const timer = await page.locator('#mode').boundingBox();
      assert.equal(playlist.x, timer.x);
      assert.equal(playlist.width, playlist.height);
      assert.ok(playlist.y >= timer.y + timer.height);
    }
    await page.evaluate(() => document.documentElement.style.removeProperty('--left'));
    await page.locator('#open-library').click();
    await page.evaluate(() => {
      document.documentElement.dataset.cover = 'tent';
      document.documentElement.style.setProperty('--rail-right', '26px');
      window.storyLayoutChanged();
    });
    for (const selector of [...tentExtras, '#archive']) assert.equal(await page.locator(selector).isVisible(), false);
    assert.equal(await page.locator('.imprint').isVisible(), true);
    const tentBoxes = [];
    for (const selector of ['#wave', '#toggle']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(Math.abs(box.x + box.width / 2 - 678 / 2) < 1, selector + ' centered on the outer display');
      tentBoxes.push(box);
    }
    assert.ok(tentBoxes[0].y + tentBoxes[0].height <= tentBoxes[1].y);
    for (const selector of ['#wave', '#toggle']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box.y >= 466 * .55, selector + ' stays below the middle of the cover display');
    }
    const timer = page.locator('#mode');
    for (const [label, number] of [['Loop', ''], ['25 min', '25'], ['45 min', '45'], ['60 min', '60'], ['Loop', '']]) {
      assert.equal(await timer.getAttribute('aria-label'), 'Sleep timer · ' + label);
      assert.equal(await timer.locator('span').textContent(), number);
      assert.equal(await timer.locator('.loop-symbol').isVisible(), !number);
      await timer.click();
    }
    await timer.click(); // 25 → 45 minutes
    await page.locator('#toggle').click();
    await waitForIcon('#pause');
    assert.equal(await waveAnimation(), 'wave-pulse');
    await page.locator('#toggle').click();
    await waitForIcon('#play');
    assert.equal(await waveAnimation(), 'none');
    assert.equal(await page.evaluate(() => testPlayers[0].paused), true);
    await page.locator('#toggle').click();
    await waitForIcon('#pause');
    await page.waitForFunction(() => testPlayers[0].currentTime > 0.25);
    const before = await page.evaluate(() => testPlayers[0].currentTime);
    await page.clock.fastForward(7 * 60000);
    assert.equal(await page.locator('#mode').getAttribute('aria-label'), 'Sleep timer · 38 min left');
    await page.locator('#toggle').click();
    await waitForIcon('#play');
    await page.clock.fastForward(4 * 60000);
    assert.equal(await timer.getAttribute('aria-label'), 'Sleep timer · 38 min left');
    await page.locator('#toggle').click();
    await waitForIcon('#pause');
    assert.equal(await timer.getAttribute('aria-label'), 'Sleep timer · 38 min left');
    await page.setViewportSize({ width: 466, height: 678 });
    await page.evaluate(() => {
      document.documentElement.dataset.cover = 'portrait';
      window.storyLayoutChanged();
    });
    assert.equal(await page.locator('#open-settings').isVisible(), false);
    const outerPlayer = page.locator('#view-solo');
    const outerList = page.getByRole('button', { name: 'Playlist', exact: true });
    await outerList.click();
    assert.equal(await outerList.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.record:visible').count(), 6);
    await outerPlayer.click();
    assert.equal(await page.locator('#archive').isVisible(), false);
    await outerList.click();
    await page.locator('.record[data-id=s1]').click();
    assert.equal(await outerPlayer.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#archive').isVisible(), false);
    assert.equal(await page.locator('#mode').getAttribute('aria-label'), 'Sleep timer · 38 min left');
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-cover');
      window.storyLayoutChanged();
    });
    for (const selector of tentExtras) assert.equal(await page.locator(selector).isVisible(), true);
    await page.locator('#favorite').click();

    await page.setViewportSize({ width: 890, height: 626 });
    assert.equal(await page.locator('#archive').isVisible(), false);
    // The native bridge supplies these edges only for an active horizontal fold.
    await page.evaluate(() => {
      const root = document.documentElement;
      root.style.setProperty('--fold-start', '292px');
      root.style.setProperty('--fold-end', '334px');
      root.setAttribute('data-tabletop', '');
      window.storyLayoutChanged();
    });
    const upper = await page.locator('#player').boundingBox();
    const lower = await page.locator('#archive').boundingBox();
    assert.equal(upper.y + upper.height, 292);
    assert.equal(lower.y, 334);
    assert.equal(await page.locator('#view-solo').isVisible(), false);
    assert.equal(await page.locator('#archive').isVisible(), true);
    await page.locator('.record[data-id=s1]').click();
    assert.equal(await page.locator('#archive').isVisible(), true);
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-tabletop');
      window.storyLayoutChanged();
    });
    assert.equal(await page.locator('#archive').isVisible(), false);
    await page.locator('#view-split').click();
    const soloButton = await page.locator('#view-solo').boundingBox();
    const splitButton = await page.locator('#view-split').boundingBox();
    assert.equal(soloButton.x, splitButton.x);
    assert.equal(soloButton.y + soloButton.height, splitButton.y);
    assert.ok(Math.min(soloButton.height, splitButton.height, splitButton.width, soloButton.width) >= 44);
    assert.equal(await page.locator('.record:visible').count(), 6);
    assert.equal(await page.locator('#archive-title').innerText(), 'Playlist');
    await page.locator('#view-solo').click();
    assert.equal(await page.locator('#archive').isVisible(), false);
    assert.equal(await page.locator('#mode').getAttribute('aria-label'), 'Sleep timer · 38 min left');
    await page.waitForFunction(t => testPlayers.length === 1 && !testPlayers[0].paused && testPlayers[0].currentTime > t, before);

    await page.locator('#view-split').click();
    await page.locator('#open-settings').click();
    await page.getByLabel('简体中文', {exact:true}).check();
    await page.locator('#privacy').click();
    await page.frameLocator('#policy iframe').getByRole('heading', {name:'隐私声明', exact:true}).waitFor();
    await page.locator('#close-policy').click();
    await page.locator('#close-settings').click();
    await visibleTitle('玛格丽特河');
    const slogan = page.locator('.imprint');
    assert.equal(await slogan.getAttribute('lang'), 'en');
    assert.equal((await slogan.textContent()).trim(), 'The Unbearable Lightness of Being');
    for (const [width, height, expanded] of [
      [320, 568, false], [390, 844, false], [667, 375, false], [678, 466, false],
      [626, 890, true], [890, 626, true], [375, 626, false]
    ]) {
      await page.setViewportSize({ width, height });
      assert.equal(await page.locator('#archive').isVisible(), expanded);
      if (expanded) {
        assert.equal(await page.locator('#title').isVisible(), true);
        await page.waitForFunction(stacked => document.querySelector('#desk').hasAttribute('data-stacked') === stacked, height > width);
        const player = await page.locator('#player').boundingBox();
        const playlist = await page.locator('#archive').boundingBox();
        if (height > width) {
          assert.equal(player.width, width);
          assert.equal(playlist.width, width);
          assert.equal(playlist.y, player.y + player.height);
          assert.equal(playlist.y, height / 2);
          await page.locator('#view-solo').click();
          assert.equal(await page.locator('#archive').isVisible(), false);
          assert.equal((await page.locator('#player').boundingBox()).height, height);
          await page.locator('#view-split').click();
        } else {
          assert.equal(playlist.x, player.x + player.width);
          assert.equal(playlist.y, player.y);
        }
        assert.equal(await slogan.isVisible(), true);
      }
      for (const id of ['toggle', 'previous', 'next', 'favorite', 'mode', 'open-settings']) {
        if (id === 'favorite' && width > height && !expanded) continue; // Part of the hidden title line.
        const bounds = await page.locator('#' + id).boundingBox();
        assert.ok(bounds.width >= 44 && bounds.height >= 44, id + ' hit target');
        assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width + 1 &&
          bounds.y + bounds.height <= height + 1, id + ' visible at ' + width + '×' + height);
      }
    }
    // Use the real saved deadline via native-independent browser clock, including earlier UI interactions.
    await page.locator('#toggle').click();
    await waitForIcon('#play');
    const remaining = await page.evaluate(() => JSON.parse(localStorage.getItem('whitenoise_v3')).pausedMS);
    assert.ok(remaining > 37 * 60000 && remaining <= 38 * 60000);
    await page.locator('#toggle').click();
    await waitForIcon('#pause');
    await page.clock.fastForward(remaining - 5000);
    await page.waitForFunction(() => testPlayers[0].volume < .55 && testPlayers[0].volume > .2);
    await page.locator('#toggle').click();
    await waitForIcon('#play');
    await page.clock.fastForward(60000);
    await page.locator('#toggle').click();
    await waitForIcon('#pause');
    assert.ok(await page.evaluate(() => testPlayers[0].volume < .55));
    await page.clock.fastForward(6500);
    await waitForIcon('#play');
    await page.reload();
    await visibleTitle('玛格丽特河');
    await page.setViewportSize({ width: 890, height: 626 });
    assert.equal(await page.locator('#view-split').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#mode').getAttribute('aria-label'), '睡眠定时 · 45 分钟');
    assert.equal(await page.locator('#favorite').getAttribute('aria-pressed'), 'true');

    // The old picker stored 60 minutes at index 2, now occupied by 45 minutes.
    await page.evaluate(() => localStorage.setItem('whitenoise_v3', JSON.stringify({modeIdx: 2})));
    await page.reload();
    await visibleTitle('Margaret River');
    assert.equal(await timer.getAttribute('aria-label'), 'Sleep timer · 60 min');
    await timer.click();
    assert.equal(await timer.getAttribute('aria-label'), 'Sleep timer · Loop');
  } finally {
    await browser.close();
  }
});
