'use strict';
(() => {
  const email = 'zivzhu@gmail.com';
  const $ = selector => document.querySelector(selector);
  const embedded = window.parent !== window && new URLSearchParams(location.search).get('embedded') === '1';
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  const copy = {
    en: {
      eyebrow: 'A PRIVATE TRAVEL JOURNAL IN SOUND', title: 'Write to Story', intro: "A memory, a place, a small detail. I'd love to hear what stayed with you.",
      topic: 'What would you like to share?', thought: 'Share a thought', sound: 'Suggest a sound', problem: 'Report a problem',
      thoughtPrompt: 'What did this sound bring back?', thoughtPlaceholder: 'A memory, a feeling, or how Story fits into your day…',
      soundPrompt: 'Where would you like to listen next?', soundPlaceholder: 'A place, a season, a sound you miss…',
      problemPrompt: 'What happened?', problemPlaceholder: 'What were you doing? What happened, and what did you expect?',
      include: 'Include details to help me investigate', details: 'Recording and device details · optional, editable', detailsPlaceholder: 'Recording:\nApp version:\niPhone model and iOS version:\nHeadphones or speaker:',
      note: 'This opens an email draft to zivzhu@gmail.com. You can review it before sending.', compose: 'Continue to email ↗', copyEmail: 'Copy email', copyMessage: 'Copy message',
      helpEyebrow: 'A LITTLE HELP', helpTitle: 'Make yourself at home.',
      timerQ: 'How does the sleep timer work?', timerA: 'Tap the timer to choose looping, 25, 45 or 60 minutes. Pausing holds the time left; resuming continues the countdown. Changing recordings keeps that time. The last ten seconds fade out gently. Choosing a different duration starts a fresh timer.',
      offlineQ: 'Can I listen offline and with the screen locked?', offlineA: 'All six recordings and their scenes are included in Story. Start a recording, then lock your screen. The system playback controls let you pause and resume. Calls or disconnecting headphones may pause playback.',
      layoutQ: 'Where is the playlist?', layoutA: "On a regular iPhone, use the small playlist button in the side column. On Duo's portrait cover, use the lower half of the layout switch. Unfold Duo to choose the full player or a split view. Portrait and tabletop layouts place the playlist below the scene. Tent mode keeps just the listening controls.",
      languageQ: 'How do I change the language?', languageA: 'Open Settings to choose English or Simplified Chinese. On Duo, unfold the phone to reach Settings. Help and feedback are also at the bottom of the playlist.',
      issueQ: 'What should I include in a problem report?', issueA: 'Tell me what you did, what happened and which recording was playing. Mention whether you used headphones or the speaker, and whether the phone was locked or folded. You can add a screenshot in your email app. If no mail app opens, copy the address and message into your preferred email service.',
      footer: 'Recorded along the way. Made to listen again.', privacy: 'Privacy policy', about: 'About Story',
      draft: 'Your email app can open this draft. If it does not open, copy the email address and message below.', unavailable: 'No mail app could open. Copy the email address and message into your preferred email service.',
      sent: 'Your message was handed to Mail for sending. Thank you for writing.', cancelled: 'Your message is still here if you want to come back to it.', saved: 'Draft saved in Mail.', failed: 'Mail could not send this message. Your text is still here; you can copy it and try another email app.',
      copiedEmail: 'Email address copied.', copiedMessage: 'Message copied.', copyFailed: 'Could not copy automatically. Select the text and use Copy.',
      recording: 'Recording', app: 'App version', device: 'Device', system: 'System', timer: 'Sleep timer', playback: 'Playback', playing: 'Playing', paused: 'Paused', loop: 'Loop', minutes: 'min', remaining: 'remaining'
    },
    zh: {
      eyebrow: '一本可以听的私人旅行手记', title: '写给 Story', intro: '一段回忆，一个地方，一个小小的细节。我想听听，什么留在了你的心里。',
      topic: '你想分享什么？', thought: '分享感受', sound: '推荐一种声音', problem: '报告问题',
      thoughtPrompt: '这段声音，让你想起了什么？', thoughtPlaceholder: '一段记忆，一种感受，或是你在什么时候听 Story……',
      soundPrompt: '下一次，你想听见哪里？', soundPlaceholder: '一个地方，一个季节，一种让你想念的声音……',
      problemPrompt: '发生了什么？', problemPlaceholder: '你当时做了什么？出现了什么情况？你原本希望怎样？',
      include: '附上信息，方便我查找原因', details: '录音与设备信息 · 可选，可编辑', detailsPlaceholder: '录音：\nApp 版本：\niPhone 型号与 iOS 版本：\n耳机或扬声器：',
      note: '接下来会打开寄给 zivzhu@gmail.com 的邮件草稿。你可以检查后再发送。', compose: '继续写邮件 ↗', copyEmail: '复制邮箱', copyMessage: '复制内容',
      helpEyebrow: '使用帮助', helpTitle: '安心听一会儿。',
      timerQ: '睡眠定时怎么用？', timerA: '点按定时按钮，选择持续循环、25、45 或 60 分钟。暂停会保留剩余时间，继续播放时接着倒数。切换录音也会保留剩余时间。最后十秒声音会逐渐淡出。选择不同时长会重新计时。',
      offlineQ: '可以离线收听、锁屏播放吗？', offlineA: '六段录音和场景都随 Story 提供。先播放一段录音，再锁屏，就能用系统播放控件暂停或继续。来电或断开耳机连接可能会暂停播放。',
      layoutQ: '播放列表在哪里？', layoutA: '普通 iPhone 可以点侧边一列里的小圆播放列表按钮。Duo 竖向外屏使用布局开关的下半部分。展开 Duo 后可选择全屏播放器或分栏；竖向和半折叠上下摆放时，列表会位于场景下方。帐篷模式只保留收听控件。',
      languageQ: '怎么切换语言？', languageA: '在设置中选择 English 或简体中文。使用 Duo 时，展开手机即可找到设置。播放列表底部也能打开帮助与反馈。',
      issueQ: '报告问题时，需要提供什么？', issueA: '告诉我你做了什么、发生了什么，以及当时播放的录音。也可以说明使用耳机还是扬声器，手机是否锁屏或折叠。你可以在邮件里添加截图。若无法打开邮件 App，可以复制邮箱和内容，用常用的邮件服务发送。',
      footer: '沿途录下，留待重听。', privacy: '隐私声明', about: '关于 Story',
      draft: '邮件 App 可以打开这份草稿。若没有打开，请复制下方的邮箱和内容发送。', unavailable: '无法打开邮件 App。你可以复制邮箱和内容，用常用的邮件服务发送。',
      sent: '邮件已交给邮件 App 发送。谢谢你的来信。', cancelled: '内容还留在这里，可以稍后继续。', saved: '草稿已保存在邮件 App。', failed: '邮件未能发送。内容还在，你可以复制后使用其他邮件 App 重试。',
      copiedEmail: '邮箱已复制。', copiedMessage: '内容已复制。', copyFailed: '无法自动复制，请选中文字后使用复制。',
      recording: '录音', app: 'App 版本', device: '设备', system: '系统', timer: '睡眠定时', playback: '播放状态', playing: '播放中', paused: '已暂停', loop: '持续循环', minutes: '分钟', remaining: '剩余'
    }
  };
  let lang = location.hash === '#zh' ? 'zh' : 'en';
  let context = {}, detailsEdited = false, statusKey = '';
  const drafts = {thought: '', sound: '', problem: ''};
  let topic = ['thought', 'sound', 'problem'].includes(requestedTopic) ? requestedTopic : 'thought';
  document.documentElement.toggleAttribute('data-embedded', embedded);
  document.documentElement.toggleAttribute('data-help', requestedTopic === 'help');
  $('#topic').value = topic;
  const post = (action, payload = {}) => window.parent.postMessage({type: 'story-support', action, ...payload}, '*');
  const status = key => { statusKey = key; $('#mail-status').textContent = copy[lang][key] || ''; };
  function deviceDetails() {
    const t = copy[lang], lines = [];
    for (const key of ['recording', 'app', 'device', 'system']) if (context[key]) lines.push(t[key] + ': ' + context[key]);
    if (context.timerMinutes !== undefined) {
      const timer = context.timerMinutes ? context.timerMinutes + ' ' + t.minutes : t.loop;
      lines.push(t.timer + ': ' + timer + (context.remainingMinutes != null ? ' (' + context.remainingMinutes + ' ' + t.minutes + ' ' + t.remaining + ')' : ''));
    }
    if (context.playing !== undefined) lines.push(t.playback + ': ' + (context.playing ? t.playing : t.paused));
    return lines.join('\n');
  }
  function render() {
    const t = copy[lang];
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    document.title = lang === 'zh' ? 'Story · 帮助与反馈' : 'Story · Help & Feedback';
    document.querySelectorAll('[data-copy]').forEach(el => el.textContent = t[el.dataset.copy]);
    document.querySelectorAll('nav a').forEach(el => el.setAttribute('aria-current', String(el.hash === '#' + lang)));
    $('#message-label').textContent = t[topic + 'Prompt'];
    $('#message').placeholder = t[topic + 'Placeholder'];
    $('#problem-details').hidden = topic !== 'problem';
    $('#details').placeholder = t.detailsPlaceholder;
    if (!detailsEdited) $('#details').value = deviceDetails();
    $('#details-fields').hidden = !$('#include-details').checked;
    $('#privacy-link').href = 'privacy.html#' + lang;
    $('#about-link').href = 'about.html#' + lang;
    status(statusKey);
  }
  function message() {
    const details = topic === 'problem' && $('#include-details').checked ? $('#details').value.trim() : '';
    return {subject: 'Story · ' + copy[lang][topic], body: $('#message').value.trim() + (details ? '\n\n' + details : '')};
  }
  $('#topic').onchange = () => {
    drafts[topic] = $('#message').value;
    topic = $('#topic').value;
    $('#message').value = drafts[topic];
    status(''); render();
  };
  $('#details').oninput = () => { detailsEdited = true; };
  $('#include-details').onchange = render;
  window.addEventListener('hashchange', () => { lang = location.hash === '#zh' ? 'zh' : 'en'; render(); });
  window.addEventListener('message', event => {
    if (!embedded || event.source !== window.parent || event.data?.type !== 'story-support-response') return;
    if (event.data.context) { context = event.data.context; render(); }
    if (event.data.status) status(event.data.status);
  });
  $('#letter-form').onsubmit = event => {
    event.preventDefault();
    if (!$('#message').value.trim()) { $('#message').value = ''; $('#message').reportValidity(); return; }
    const draft = message();
    if (embedded) post('compose', draft);
    else location.href = 'mailto:' + email + '?subject=' + encodeURIComponent(draft.subject) + '&body=' + encodeURIComponent(draft.body);
    status('draft');
  };
  async function copyText(value, success) {
    if (embedded) { post('copy', {text: value, success}); return; }
    try { await navigator.clipboard.writeText(value); status(success); }
    catch {
      const helper = document.createElement('textarea');
      helper.value = value; helper.style.position = 'fixed'; helper.style.top = '0';
      document.body.append(helper); helper.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch {}
      helper.remove(); status(copied ? success : 'copyFailed');
    }
  }
  $('#copy-email').onclick = () => copyText(email, 'copiedEmail');
  $('#copy-message').onclick = () => { const draft = message(); copyText(draft.subject + '\n\n' + draft.body, 'copiedMessage'); };
  $('#privacy-link').onclick = event => { if (embedded) { event.preventDefault(); post('privacy'); } };
  $('#about-link').onclick = event => { if (embedded) { event.preventDefault(); post('about'); } };
  render();
  if (embedded) post('ready');
  else if (requestedTopic === 'help') $('#help-title').scrollIntoView();
})();
