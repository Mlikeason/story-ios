'use strict';

const labels = {
  zh: { library: '播放列表', settings: '设置', language: '界面语言', layout: '播放器布局', solo: '全屏播放器', split: '播放器与播放列表', all: '全部录音', favorites: '我的收藏', favorite: '收藏', saved: '已收藏', privacy: '隐私声明', close: '关闭', previous: '上一段', next: '下一段', play: '播放', pause: '暂停', timer: '睡眠定时', loop: '持续循环', minute: '分钟', left: '剩余', error: '录音暂时无法播放，请重试。' },
  en: { library: 'Playlist', settings: 'Settings', language: 'Language', layout: 'Player layout', solo: 'Full-screen player', split: 'Player and playlist', all: 'All recordings', favorites: 'Favorites', favorite: 'Save', saved: 'Saved', privacy: 'Privacy', close: 'Close', previous: 'Previous recording', next: 'Next recording', play: 'Play', pause: 'Pause', timer: 'Sleep timer', loop: 'Loop', minute: 'min', left: 'left', error: 'Couldn’t play this recording. Try again.' }
};
Object.assign(labels.en, {write: 'Write to Story', report: 'Report a problem', help: 'Help', support: 'Help & feedback', about: 'About Story'});
Object.assign(labels.zh, {write: '写给 Story', report: '报告问题', help: '使用帮助', support: '帮助与反馈', about: '关于 Story'});
const $ = selector => document.querySelector(selector);
const timerPresets = [0, 25, 45, 60];
const storageKey = 'whitenoise_v3';
const bridge = window.webkit?.messageHandlers?.story;
const wide = matchMedia('(min-width: 600px) and (min-height: 510px)');
const portrait = matchMedia('(orientation: portrait)');
const twoDigits = value => String(value).padStart(2, '0');
function readSaved() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
}
async function start() {
  const sounds = window.storyRecordings || await (await fetch('recordings.json')).json();
  if (!sounds.length) throw new Error('Empty recording library');
  const saved = readSaved();
  let curIdx = Number.isInteger(saved.curIdx) && sounds[saved.curIdx] ? saved.curIdx : 0;
  // Older versions stored the index in the original three-option picker.
  const storedMinutes = saved.sleepMinutes ?? [0, 25, 60][saved.modeIdx];
  let sleepMinutes = timerPresets.includes(storedMinutes) ? storedMinutes : 0;
  let lang = saved.lang === 'zh' ? 'zh' : 'en';
  let innerView = saved.innerView === 'split' ? 'split' : 'solo';
  const favorites = new Set(sounds.map(s => s.id).filter(id => Array.isArray(saved.favorites) && saved.favorites.includes(id)));
  let playing = false, deadline = 0, failed = false;
  let pausedMS = (!bridge && sleepMinutes && Number.isFinite(saved.pausedMS)) ? Math.min(Math.max(0, saved.pausedMS), sleepMinutes * 60000) : 0;

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({curIdx, sleepMinutes, lang, innerView, pausedMS, favorites: [...favorites]})); } catch {}
  }
  function renderTime() {
    const t = labels[lang];
    const left = deadline ? Math.max(0, deadline - Date.now()) : pausedMS;
    const mins = deadline || pausedMS ? Math.ceil(left / 60000) : sleepMinutes;
    let value = sleepMinutes ? mins + ' ' + t.minute : t.loop;
    if (deadline || pausedMS) value = lang === 'zh' ? t.left + ' ' + value : value + ' ' + t.left;
    $('#mode').dataset.minutes = sleepMinutes;
    $('#mode span').textContent = sleepMinutes ? String(mins) : '';
    $('#mode').ariaLabel = $('#mode').title = t.timer + ' · ' + value;
  }
  function renderWave(sound) {
    const wave = $('#wave');
    if (wave.dataset.recording !== sound.id) {
      wave.dataset.recording = sound.id;
      wave.innerHTML = sound.wave.map((v, i) =>
        '<path d="M' + (3*i+1) + ' ' + (26-v) + 'v' + (v*2) + '" style="--period:' +
        (850 + (i*137)%650) + 'ms;--phase:-' + ((i*233)%1400) + 'ms"/>'
      ).join('');
    }
    wave.classList.toggle('playing', playing);
  }
  function renderLibrary() {
    const t = labels[lang], list = $('.recordings');
    const focusedID = list.contains(document.activeElement) && document.activeElement.dataset.id;
    list.replaceChildren();
    for (const favoriteGroup of [true, false]) {
      const group = sounds.filter(s => favorites.has(s.id) === favoriteGroup);
      if (!group.length) continue;
      const tag = document.createElement('p');
      tag.className = 'tag';
      tag.textContent = favoriteGroup ? t.favorites : t.all;
      list.append(tag);
      for (const sound of group) {
        const i = sounds.indexOf(sound), row = document.createElement('button');
        row.className = 'record';
        row.dataset.id = sound.id;
        row.setAttribute('aria-current', String(i === curIdx));
        row.innerHTML = '<img class="thumb" alt=""><span><span class="row-name"></span><span class="row-loc"></span></span><span class="sequence" aria-hidden="true"></span>';
        row.querySelector('img').src = 'Artwork/' + sound.id + '.svg';
        row.querySelector('.row-name').textContent = sound[lang].name;
        row.querySelector('.row-loc').textContent = sound[lang].location;
        row.querySelector('.sequence').textContent = i === curIdx ? '●' : twoDigits(i + 1);
        list.append(row);
      }
    }
    if (focusedID) list.querySelector('[data-id="' + focusedID + '"]')?.focus({preventScroll: true});
  }
  function render() {
    const t = labels[lang], s = sounds[curIdx], text = s[lang];
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    document.documentElement.style.setProperty('--ink', s.ink);
    const landscape = $('.landscape');
    if (landscape.dataset.recording !== s.id) {
      landscape.dataset.recording = s.id;
      const file = 'Artwork/' + s.id + '.svg';
      landscape.style.setProperty('--still', 'url("' + file + '")');
      landscape.style.setProperty('--ambient', 'url("' + file + '#ambient")');
    }
    document.querySelectorAll('[data-label]').forEach(el => el.textContent = t[el.dataset.label]);
    $('#number').textContent = 'REC. ' + twoDigits(curIdx + 1) + ' / ' + twoDigits(sounds.length);
    $('#title').textContent = text.name;
    $('#location').textContent = text.location;
    renderWave(s);
    $('#toggle').classList.toggle('playing', playing);
    $('#toggle use').setAttribute('href', playing ? '#pause' : '#play');
    $('#toggle').ariaLabel = (playing ? t.pause : t.play) + ' · ' + text.name;
    $('#previous').ariaLabel = t.previous;
    $('#next').ariaLabel = t.next;
    $('#previous').disabled = curIdx === 0;
    $('#next').disabled = curIdx === sounds.length - 1;
    const fav = favorites.has(s.id);
    $('#favorite').setAttribute('aria-pressed', String(fav));
    $('#favorite').ariaLabel = t.favorite + ' · ' + text.name;
    $('#close-library').ariaLabel = t.close;
    $('#open-library').ariaLabel = $('#open-library').title = t.library;
    $('#close-policy').ariaLabel = t.close;
    $('#close-support').ariaLabel = t.close;
    $('#support iframe').title = t.support;
    $('#close-about').ariaLabel = t.close;
    $('#about iframe').title = t.about;
    $('.recordings').ariaLabel = t.library;
    $('#open-settings').ariaLabel = t.settings;
    $('#open-settings').title = t.settings;
    $('#close-settings').ariaLabel = t.close;
    $('#policy iframe').title = t.privacy;
    updateViewPicker();
    $('#desk').dataset.view = innerView;
    updatePlayerLayout();
    $('#settings input[value="' + lang + '"]').checked = true;
    $('#error').textContent = t.error;
    $('#error').hidden = !failed;
    renderTime();
    renderLibrary();
  }
  // Only the browser preview uses HTML audio. The app owns one native player
  // so changing the WebView's size or suspending its JS cannot reset playback.
  const preview = bridge ? null : new Audio();
  if (preview) preview.loop = true;
  let revision = 0;
  function stopPreview(error = false, expired = false) {
    ++revision;
    preview.pause();
    if (expired) pausedMS = 0;
    else if (deadline) pausedMS = Math.max(0, deadline - Date.now());
    playing = false;
    deadline = 0;
    save();
    failed = error;
    render();
  }
  function playPreview(restartTimer) {
    const token = ++revision;
    const url = new URL(sounds[curIdx].file, document.baseURI).href;
    if (preview.src !== url) preview.src = url;
    applyPreviewGain();
    preview.play().then(() => {
      if (token !== revision) return;
      playing = true;
      failed = false;
      if (restartTimer) {
        deadline = sleepMinutes ? Date.now() + (pausedMS || sleepMinutes * 60000) : 0;
        pausedMS = 0;
        save();
      }
      applyPreviewGain();
      render();
    }).catch(() => { if (token === revision) stopPreview(true); });
  }
  function applyPreviewGain() {
    const left = deadline ? Math.max(0, deadline - Date.now()) : (pausedMS || Infinity);
    preview.volume = 0.85 * 10 ** (Math.min(0, sounds[curIdx].trimDB || 0) / 20) * Math.min(1, left / 10000);
  }
  function resetDeadline() {
    pausedMS = 0;
    deadline = sleepMinutes && playing ? Date.now() + sleepMinutes * 60000 : 0;
    applyPreviewGain();
  }
  function send(action, id = sounds[curIdx].id) {
    bridge?.postMessage({action, id, minutes: sleepMinutes, lang});
  }
  window.storyPlaybackChanged = state => {
    const index = sounds.findIndex(s => s.id === state.id);
    if (index >= 0) curIdx = index;
    playing = state.playing;
    deadline = state.deadline;
    pausedMS = state.pausedMS || 0;
    failed = state.failed;
    save();
    render();
  };
  function select(i) {
    if (!sounds[i] || i === curIdx) return;
    if (bridge) { send('select', sounds[i].id); return; }
    const keepPlaying = playing || !preview.paused;
    curIdx = i;
    failed = false;
    ++revision;
    if (keepPlaying) playPreview(!playing);
    save();
    render();
  }
  function tick() {
    if (preview && deadline && Date.now() >= deadline) stopPreview(false, true);
    else {
      if (preview && playing && deadline) applyPreviewGain();
      renderTime();
    }
  }
  $('#toggle').onclick = () => {
    if (bridge) send('toggle');
    else if (playing || !preview.paused) stopPreview();
    else playPreview(true);
  };
  $('#previous').onclick = () => select(curIdx - 1);
  $('#next').onclick = () => select(curIdx + 1);
  $('#mode').onclick = () => {
    const nextIndex = (timerPresets.indexOf(sleepMinutes) + 1) % timerPresets.length;
    sleepMinutes = timerPresets[nextIndex];
    if (bridge) send('settings'); else resetDeadline();
    save(); renderTime();
  };
  $('#favorite').onclick = () => {
    const id = sounds[curIdx].id;
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    save(); render();
  };
  $('#open-settings').onclick = () => $('#settings').showModal();
  $('#close-settings').onclick = () => $('#settings').close();
  $('#settings fieldset').onchange = event => {
    lang = event.target.value;
    send('settings'); save(); render();
  };
  for (const view of ['solo', 'split']) {
    $('#view-' + view).onclick = () => {
      if (document.documentElement.dataset.cover === 'portrait') {
        showLibrary(view === 'split');
        return;
      }
      innerView = view;
      save();
      render();
    };
  }
  function updateViewPicker() {
    const cover = document.documentElement.dataset.cover === 'portrait';
    const libraryOpen = $('#archive').classList.contains('open');
    const selected = cover ? (libraryOpen ? 'split' : 'solo') : innerView;
    const t = labels[lang];
    $('.view-picker').ariaLabel = t.layout;
    for (const view of ['solo', 'split']) {
      const button = $('#view-' + view);
      const label = cover && view === 'split' ? t.library : t[view];
      button.ariaLabel = button.title = label;
      button.setAttribute('aria-pressed', String(view === selected));
    }
  }
  // One library becomes a full-height panel in compact windows. Keep hidden
  // controls out of the accessibility tree and return focus to the opener.
  function updatePlayerLayout() {
    const root = document.documentElement;
    const tabletop = root.hasAttribute('data-tabletop');
    const portraitSplit = wide.matches && portrait.matches && innerView === 'split';
    $('#desk').toggleAttribute('data-stacked', tabletop || portraitSplit);
    const phone = (root.hasAttribute('data-standard-phone') || !bridge)
      && !wide.matches && !tabletop && !root.hasAttribute('data-cover');
    $('#desk').toggleAttribute('data-phone-player', phone);
    const opener = $('#open-library');
    const parent = phone ? $('.status-tools') : $('.mast');
    if (opener.parentElement !== parent) parent.insertBefore(opener, phone ? $('.view-picker') : null);
  }
  function showLibrary(open) {
    const focusWasInLibrary = $('#archive').contains(document.activeElement);
    const inline = document.documentElement.hasAttribute('data-tabletop') || (wide.matches && innerView === 'split');
    const cover = document.documentElement.dataset.cover;
    const overlay = open && !inline && !wide.matches && cover !== 'tent';
    $('#archive').classList.toggle('open', overlay);
    $('#player').inert = overlay;
    $('.status-tools').inert = overlay && cover !== 'portrait';
    updateViewPicker();
    $('#open-library').setAttribute('aria-expanded', String(overlay || inline));
    if (overlay && cover !== 'portrait') $('#close-library').focus();
    else if (!overlay && !wide.matches && focusWasInLibrary) {
      const returnTo = cover === 'tent' ? '#toggle' : cover === 'portrait' ? '#view-solo' : '#open-library';
      $(returnTo).focus({preventScroll: true});
    }
  }
  window.storyLayoutChanged = () => {
    updatePlayerLayout();
    showLibrary($('#archive').classList.contains('open'));
  };
  wide.addEventListener('change', window.storyLayoutChanged);
  portrait.addEventListener('change', window.storyLayoutChanged);
  $('#open-library').onclick = () => showLibrary(true);
  $('#close-library').onclick = () => showLibrary(false);
  $('.recordings').onclick = e => {
    const row = e.target.closest('.record');
    if (!row) return;
    select(sounds.findIndex(s => s.id === row.dataset.id));
    showLibrary(false);
  };
  function openPrivacy() {
    $('#policy iframe').src = 'privacy.html#' + lang;
    $('#policy').showModal();
  }
  $('#privacy').onclick = openPrivacy;
  $('#library-privacy').onclick = openPrivacy;
  $('#close-policy').onclick = () => $('#policy').close();
  function openAbout() {
    $('#about iframe').src = 'about.html?embedded=1#' + lang;
    $('#about').showModal();
  }
  document.querySelectorAll('[data-about]').forEach(button => button.onclick = openAbout);
  $('#close-about').onclick = () => $('#about').close();
  const supportFrame = $('#support iframe');
  function supportResponse(data) { supportFrame.contentWindow?.postMessage({type: 'story-support-response', ...data}, '*'); }
  window.storySupportResult = status => supportResponse({status});
  document.querySelectorAll('[data-support]').forEach(button => button.onclick = () => {
    supportFrame.src = 'support.html?embedded=1&topic=' + button.dataset.support + '#' + lang;
    $('#support').showModal();
  });
  $('#close-support').onclick = () => $('#support').close();
  window.addEventListener('message', async event => {
    if (event.source !== supportFrame.contentWindow || event.data?.type !== 'story-support' || !$('#support').open) return;
    const data = event.data;
    if (data.action === 'ready') {
      const left = deadline ? Math.max(0, deadline - Date.now()) : pausedMS;
      supportResponse({context: {...(window.storySupportInfo || {}), recording: sounds[curIdx][lang].name,
        timerMinutes: sleepMinutes, remainingMinutes: left ? Math.ceil(left / 60000) : null, playing}});
    } else if (data.action === 'privacy') openPrivacy();
    else if (data.action === 'about') openAbout();
    else if (data.action === 'compose' && typeof data.subject === 'string' && typeof data.body === 'string') {
      if (bridge) bridge.postMessage({action: 'supportMail', subject: data.subject, body: data.body});
      else window.location.href = 'mailto:zivzhu@gmail.com?subject=' + encodeURIComponent(data.subject) + '&body=' + encodeURIComponent(data.body);
    } else if (data.action === 'copy' && typeof data.text === 'string') {
      const success = data.success === 'copiedEmail' ? 'copiedEmail' : 'copiedMessage';
      if (bridge) bridge.postMessage({action: 'supportCopy', text: data.text, success});
      else {
        try { await navigator.clipboard.writeText(data.text); supportResponse({status: success}); }
        catch { supportResponse({status: 'copyFailed'}); }
      }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !document.querySelector('dialog[open]') && $('#archive').classList.contains('open')) showLibrary(false);
  });
  let touch;
  $('#player').addEventListener('touchstart', e => {
    touch = e.touches.length === 1 && !e.target.closest('button') ? e.touches[0] : null;
  }, {passive:true});
  $('#player').addEventListener('touchend', e => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.clientX, dy = e.changedTouches[0].clientY - touch.clientY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)*1.5) select(curIdx + (dx < 0 ? 1 : -1));
    touch = null;
  }, {passive:true});
  $('#player').addEventListener('touchcancel', () => touch = null);
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); send('ready'); } });
  render();
  send('ready');
}
start().catch(() => {
  $('#error').textContent = readSaved().lang === 'zh' ? '声音库加载失败。' : 'Could not load recordings.';
  $('#error').hidden = false;
});
