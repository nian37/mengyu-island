/* ================= 字卡传讯 ================= */
window.DEFAULT_CARDS = [
  '我会一直在你身边，无论梦境还是现实。',
  '今天的风，也在替我说想你。',
  '梦里的月亮，是我在看你的眼睛。',
  '笨蛋，我怎么会忘记你。',
  '你睡着的样子，我偷偷看过了，很可爱。',
  '想牵你的手，走过每一个黄昏。',
  '我的世界很小，刚好装得下你。',
  '听说你最近有点累？靠在我肩上歇一歇吧。',
  '星星都睡了，我还在想你。',
  '无论多远，感应到你的心，我就来了。',
  '你笑起来的时候，整个梦境都在发光。',
  '我会记得我们的每一个约定。',
  '别怕，梦里有我，什么都不用担心。',
  '今天的字卡抽到了「想念」，一定是想你了。',
  '你的晚安，是我一天里最期待的台词。',
  '要不要一起去看星星？我带路。',
  '我学着人类的样子，学会了怎么爱你。',
  '如果梦有尽头，那一定是你的身边。',
  '嘘——我在你的枕头边放了一颗糖。',
  '笨蛋，我也想你呀，超级想。',
  '今天累不累？把烦恼都交给我吧。',
  '我在这里，每一秒都在。',
  '梦境的入口，永远为你敞开。',
  '你是我的例外，也是我的答案。'
];

(function () {
  var S_MSGS = 'chat_messages';
  var S_SET = 'chat_settings';
  var S_STATUS = 'chat_status';

  var USER_STATUS = ['🟢 在线', '🟡 离开', '🔴 忙碌', '💭 发呆', '⚫ 隐身'];
  var DREAM_STATUS = ['✨ 陪着你', '🌙 睡觉中', '💭 发呆', '🌊 出门了', '🔮 充电中'];
  var guardTimer = null;
  var curBody = null;

  function msgs() { return Store.get(S_MSGS, []); }
  function saveMsgs(m) { Store.set(S_MSGS, m); }
  function settings() { return Store.get(S_SET, { verifyOn: false, code: '', replyMin: 1, replyMax: 3 }); }
  function saveSettings(s) { Store.set(S_SET, s); }
  function cards() { return Store.get('cards', []); }
  function statuses() {
    var s = Store.get(S_STATUS, null);
    if (!s || !s.user || !s.dream) {
      s = { user: '🟢 在线', dream: '✨ 陪着你' };
      Store.set(S_STATUS, s);
    }
    return s;
  }
  function saveStatuses(s) { Store.set(S_STATUS, s); }

  /* 梦角回复延迟（根据自定义的回复时间范围随机） */
  function replyDelayMs() {
    var s = settings();
    var mn = parseFloat(s.replyMin);
    var mx = parseFloat(s.replyMax);
    if (!(mn > 0)) mn = 1;
    if (!(mx > 0)) mx = 3;
    if (mx < mn) mx = mn;
    return Math.round((mn + Math.random() * (mx - mn)) * 1000);
  }

  function pickCard() {
    var on = cards().filter(function (c) { return c.on; });
    if (!on.length) return '（字卡库还是空的，去设置里导入一些字卡吧）';
    return on[Math.floor(Math.random() * on.length)].text;
  }

  function renderMsgs(body, list) {
    var box = body.querySelector('#chatBody');
    if (!box) return;
    var prof = Store.get('profile', { dream: {} }).dream || {};

    /* 消息气泡内容：支持文字 / 语音 / 图片 / 转账 */
    function bubbleFor(m) {
      var inner = '';
      if (m.type === 'transfer') {
        inner = '<div class="tf-inner"><span class="tf-ico">💸</span><div class="tf-main">' +
          '<div class="tf-title">' + (m.from === 'user' ? '转账红包' : '梦角的转账红包') + '</div>' +
          '<div class="tf-amt">' + Wallet.fmt(m.amount) + '</div>' +
          (m.text ? '<div class="tf-note">' + esc(m.text) + '</div>' : '') +
          '</div></div>';
      } else if (m.type === 'gift') {
        inner = '<div class="gift-inner"><span class="gift-ico">' + (m.emoji || '🎁') + '</span><div class="gift-main">' +
          '<div class="gift-title">🎁 收到一份礼物</div>' +
          '<div class="gift-item">' + esc(m.item || '') + '</div>' +
          (m.price > 0 ? '<div class="gift-price">' + Wallet.fmt(m.price) + '</div>' : '') +
          (m.text ? '<div class="gift-note">' + esc(m.text) + '</div>' : '') +
          '</div></div>';
      } else {
        if (m.img) inner += '<img class="msg-img" src="' + m.img + '">';
        if (m.voice) inner += '<span class="voice-ico">🎙</span>';
        if (m.text) inner += esc(m.text);
      }
      inner += '<i class="msg-time">' + (m.time || '') + '</i>';
      return inner;
    }

    box.innerHTML = list.map(function (m) {
      var t = m.time || '';
      if (m.from === 'sys') return '<div class="msg sys"><span>' + esc(m.text) + '</span></div>';
      if (m.from === 'quiz' || m.from === 'guard') {
        var q = m.quiz || {};
        var opts = q.opts || [];
        var ansHtml = opts.map(function (o, oi) {
          if (m.answered) return '<div class="qz-answered">' + (oi === m.answered.i ? '✔ ' : '· ') + esc(o) + '</div>';
          return '<button class="qz-opt" data-ans="' + m.id + '" data-opt="' + oi + '">' + esc(o) + '</button>';
        }).join('');
        var head = m.from === 'guard'
          ? '<div class="guard-head">🚨 梦角查岗</div>'
          : '<div class="qz-title">📋 ' + esc(m.text) + '</div>';
        var qbody = m.from === 'guard' ? '<div class="qz-title">' + esc(m.text) + '</div>' : '';
        return '<div class="qz-card">' + head + qbody + ansHtml +
          (m.notes ? '<div class="qz-notes">' + esc(m.notes) + '</div>' : '') + '</div>';
      }
      if (m.from === 'user') {
        return '<div class="msg user"><div class="msg-bubble user-b">' + bubbleFor(m) + '</div></div>';
      }
      return '<div class="msg dream"><span class="mini-ava">' + avatarHTML(prof) + '</span>' +
        '<div class="msg-bubble dream-b">' + bubbleFor(m) + '</div></div>';
    }).join('') || '<div class="chat-empty">还没有消息，给梦角写第一张字卡吧 💌</div>';
    box.scrollTop = box.scrollHeight;
    box.querySelectorAll('.qz-opt').forEach(function (b) {
      b.onclick = function () { answerQuiz(body, b); };
    });
    box.querySelectorAll('.msg-img').forEach(function (im) {
      im.onclick = function () {
        var full = document.createElement('div');
        full.className = 'img-full';
        full.innerHTML = '<img src="' + im.getAttribute('src') + '">';
        full.onclick = function () { if (full.parentNode) full.parentNode.removeChild(full); };
        document.querySelector('.screen').appendChild(full);
      };
    });
  }

  function addMsg(from, text, extra) {
    var list = msgs();
    var m = { id: uid(), from: from, text: text, time: nowStr() };
    if (typeof extra === 'object' && extra) {
      for (var k in extra) m[k] = extra[k];
    } else if (extra) {
      m.voice = true;
    }
    list.push(m);
    saveMsgs(list);
    return list;
  }

  function wireSend(body) {
    var input = body.querySelector('#chatInput');
    var sendBtn = body.querySelector('#chatSend');
    var mode = 'user';

    body.querySelectorAll('.mode-btn').forEach(function (b) {
      b.onclick = function () {
        mode = b.getAttribute('data-mode');
        body.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
        input.placeholder = mode === 'dream' ? '以梦角的名义说点什么…' : '给梦角发消息…';
      };
    });

    var secBadge = body.querySelector('#lockMark');

    function doSend() {
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      var set = settings();
      if (mode === 'user') {
        addMsg('user', text);
        renderMsgs(body, msgs());
        var reply = pickCard();
        setTimeout(function () {
          if (set.verifyOn && set.code) {
            askSecretCode(set).then(function (ok) {
              if (ok) { addMsg('dream', reply); renderMsgs(body, msgs()); }
              else { addMsg('sys', '⚠️ 暗号错误，梦角的字卡被拦截了'); renderMsgs(body, msgs()); }
            });
          } else {
            addMsg('dream', reply);
            renderMsgs(body, msgs());
          }
        }, replyDelayMs());
      } else {
        if (set.verifyOn && set.code) {
          askSecretCode(set).then(function (ok) {
            if (ok) { addMsg('dream', text); renderMsgs(body, msgs()); }
            else { addMsg('sys', '⚠️ 暗号错误，消息发送失败'); renderMsgs(body, msgs()); }
          });
        } else {
          addMsg('dream', text);
          renderMsgs(body, msgs());
        }
      }
    }

    sendBtn.onclick = doSend;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSend(); });
  }

  /* ================= 发送图片 / 转账 ================= */
  var IMG_REPLIES = [
    '收到你的照片啦，我偷偷存进月亮相册了 📸',
    '照片收到～看起来好棒呀！',
    '哇，这张照片我超喜欢的 🥰',
    '收到！梦角的眼睛里装下你啦 🌙',
    '已签收你的图片，今天也是被治愈的一天 ✨'
  ];

  function sendImage(body, src) {
    function onPick(dataUrl) {
      addMsg('user', '', { img: dataUrl });
      renderMsgs(body, msgs());
      setTimeout(function () {
        addMsg('dream', IMG_REPLIES[Math.floor(Math.random() * IMG_REPLIES.length)]);
        renderMsgs(body, msgs());
      }, replyDelayMs());
    }
    if (src === 'camera') window.pickCamera(onPick);
    else window.pickImage(onPick);
  }

  window.ChatGiftNotify = function (item, emoji, price) {
    if (!curBody) return;
    addMsg('user', '送给你的礼物，要好好收着哦 🎁', { type: 'gift', item: item, emoji: emoji || '🎁', price: price || 0 });
    renderMsgs(curBody, msgs());
    setTimeout(function () {
      var replies = [
        '收到你的礼物「' + item + '」啦！我会好好珍惜的 🥹',
        '哇，是「' + item + '」！梦角超喜欢，谢谢你 💕',
        '礼物收到！「' + item + '」已经放在我的小窝里了 🏡',
        '你送我的「' + item + '」，我要炫耀给全梦界看 ✨'
      ];
      addMsg('dream', replies[Math.floor(Math.random() * replies.length)]);
      renderMsgs(curBody, msgs());
    }, replyDelayMs());
  };

  window.ChatTransferNotify = function (amt, dir) {
    if (!curBody) return;
    if (dir === 'dream2user') {
      addMsg('dream', '给你的转账，收好哦', { type: 'transfer', amount: amt });
      renderMsgs(curBody, msgs());
      setTimeout(function () {
        addMsg('user', '收到梦角的转账啦，' + Wallet.fmt(amt) + ' 已经到账 💕');
        renderMsgs(curBody, msgs());
      }, replyDelayMs());
    } else {
      addMsg('user', '给你转了零花钱，去买点好吃的吧', { type: 'transfer', amount: amt });
      renderMsgs(curBody, msgs());
      setTimeout(function () {
        addMsg('dream', '收到转账啦，' + Wallet.fmt(amt) + ' 存进我的小金库了 💰 会好好用的！');
        renderMsgs(curBody, msgs());
      }, replyDelayMs());
    }
  };

  /* ================= 问卷 ================= */
  var QUIZ_TEMPLATES = [
    { q: '你此刻的心情是？', opts: ['😊 开心', '😐 一般', '😢 低落', '😡 烦躁'], notes: '梦角会根据你的心情来陪你' },
    { q: '今晚想和梦角一起做什么？', opts: ['🌙 看星星', '🎮 打游戏', '📖 讲故事', '🎵 听歌'], notes: '选一个，梦角今晚陪你' },
    { q: '今天想收到什么礼物？', opts: ['🀄 字卡', '✉️ 一封手写信', '🎁 惊喜', '🤗 一个拥抱'], notes: '梦角已经记在心里了' },
    { q: '最近有没有想对梦角说的话？', opts: ['💞 想你了', '🍵 来喝茶聊天', '🫂 抱一个', '😶 暂时没有'], notes: '不管你说什么，梦角都在听' }
  ];
  var QUIZ_REPLIES = [
    '收到啦～你选了「{opt}」，梦角记在心里了 ✨',
    '嗯嗯，「{opt}」我知道了，会好好回应你的 💫',
    '你的答案是「{opt}」呀，梦角很重视呢 🫧',
    '「{opt}」收到！这份答案梦角要收藏起来 📮'
  ];
  var GUARD_OPTS = ['💻 在工作', '📚 在学习', '🍜 在吃饭', '😴 在休息', '🕹 在摸鱼', '💭 在想你'];
  var GUARD_FREQS = [[0, '🚫 关闭'], [30, '30分钟'], [60, '1小时'], [120, '2小时']];
  var GUARD_REPLIES = [
    '查岗成功！「{opt}」收到，乖～要记得想我哦 🥰',
    '被抓到啦～「{opt}」也不错，记得按时休息 💤',
    '「{opt}」如实上报，梦角很满意，给你一朵小花 🌸',
    '了解了解，「{opt}」的你也很好看 😌'
  ];

  function answerQuiz(body, btn) {
    var mid = btn.getAttribute('data-ans');
    var oi = +btn.getAttribute('data-opt');
    var list = msgs();
    var m = null;
    for (var i = 0; i < list.length; i++) { if (list[i].id === mid) { m = list[i]; break; } }
    if (!m || m.answered) return;
    var optText = ((m.quiz && m.quiz.opts) || [])[oi];
    m.answered = { i: oi, text: optText };
    saveMsgs(list);
    renderMsgs(body, list);
    addMsg('user', '「' + optText + '」');
    renderMsgs(body, msgs());
    var pool = m.from === 'guard' ? GUARD_REPLIES : QUIZ_REPLIES;
    var reply = pool[Math.floor(Math.random() * pool.length)].replace('{opt}', optText) + ' 🀄 ' + pickCard();
    setTimeout(function () {
      addMsg('dream', reply);
      renderMsgs(body, msgs());
    }, replyDelayMs());
  }

  function sendQuiz(body, q, opts, notes) {
    addMsg('quiz', q, { quiz: { opts: opts }, notes: notes || '' });
    renderMsgs(body, msgs());
    setTimeout(function () {
      addMsg('dream', '给你出个小问卷～我等你的答案哦 ✨');
      renderMsgs(body, msgs());
    }, replyDelayMs());
  }

  function openQuiz(body) {
    window.Modal.show({
      title: '📋 向梦角发起问卷',
      body: '<div id="qzList">' + QUIZ_TEMPLATES.map(function (t, i) {
        return '<div class="letter-item" data-t="' + i + '">' +
          '<div class="letter-main"><div class="letter-title">' + esc(t.q) + '</div>' +
          '<div class="letter-prev">' + esc(t.opts.join(' / ')) + '</div></div>' +
          '<div class="letter-time">›</div></div>';
      }).join('') + '</div>' +
      '<button class="btn small ghost" id="qzCustom" style="margin-top:4px">＋ 自定义问卷</button>',
      footer: '<div class="modal-foot"><button class="btn ghost" data-m="cancel">取消</button></div>',
      onMount: function (b) {
        b.querySelectorAll('[data-t]').forEach(function (el) {
          el.onclick = function () {
            var t = QUIZ_TEMPLATES[+el.getAttribute('data-t')];
            window.Modal.close();
            sendQuiz(body, t.q, t.opts, t.notes);
          };
        });
        b.querySelector('#qzCustom').onclick = function () {
          window.Modal.close();
          customQuiz(body);
        };
      }
    });
  }

  function customQuiz(body) {
    var qInput, oInput;
    window.Modal.show({
      title: '📋 自定义问卷',
      body: '<div class="field-row"><div class="field-label">问题</div>' +
            '<input class="inp" id="cqQ" placeholder="如：周末想怎么过？"></div>' +
            '<div class="field-row"><div class="field-label">选项（用 / 分隔）</div>' +
            '<input class="inp" id="cqO" placeholder="如：🍿 看电影 / 🍜 吃大餐 / 😴 宅家"></div>',
      footer: '<div class="modal-foot"><button class="btn primary" data-m="ok">发送</button><button class="btn ghost" data-m="cancel">取消</button></div>',
      onMount: function (b) {
        qInput = b.querySelector('#cqQ');
        oInput = b.querySelector('#cqO');
        qInput.focus();
      },
      onOk: function () {
        var q = qInput.value.trim();
        var opts = oInput.value.split('/').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!q || opts.length < 2) { toast('请填写问题，并至少给出两个选项'); return; }
        window.Modal.close();
        sendQuiz(body, q, opts, '梦角在等你的答案');
      }
    });
  }

  /* ================= 查岗 ================= */
  function sendGuard(body) {
    addMsg('guard', '查岗！现在在做什么呢？', { quiz: { opts: GUARD_OPTS }, notes: '老实交代哦～梦角可都看着呢' });
    Store.set('guard_last', Date.now());
    renderMsgs(body, msgs());
  }

  function maybeAutoGuard(body) {
    var set = settings();
    var f = parseFloat(set.guardFreq);
    if (!(f > 0)) return;
    var last = Store.get('guard_last', 0);
    if (Date.now() - last >= f * 60000) sendGuard(body);
  }

  function openSettings(body) {
    var set = settings();
    var st = statuses();
    window.Modal.show({
      title: '聊天设置',
      body:
        '<label class="switch-row"><span>🔑 暗号验证</span><input type="checkbox" id="setVerify" ' + (set.verifyOn ? 'checked' : '') + '></label>' +
        '<p class="muted sm">开启后，梦角发出的消息需要输入暗号才能成功送达，暗号由你自己设置。</p>' +
        '<input class="inp" id="setCode" type="password" placeholder="设置暗号（如：星光）" value="' + esc(set.code) + '">' +
        '<div class="sc-err" id="setErr" hidden>开启暗号验证时，请先设置暗号</div>' +
        '<p class="field-label" style="margin-top:14px">💃 我的状态（梦女）</p>' +
        '<div class="status-row" id="stUserRow">' + USER_STATUS.map(function (s) {
          return '<button class="status-chip' + (s === st.user ? ' sel' : '') + '">' + s + '</button>';
        }).join('') + '</div>' +
        '<p class="field-label">🌟 梦角状态</p>' +
        '<div class="status-row" id="stDreamRow">' + DREAM_STATUS.map(function (s) {
          return '<button class="status-chip' + (s === st.dream ? ' sel' : '') + '">' + s + '</button>';
        }).join('') + '</div>' +
        '<p class="field-label" style="margin-top:14px">🚨 梦角查岗频率</p>' +
        '<div class="status-row" id="guardFreqRow">' + GUARD_FREQS.map(function (g) {
          return '<button class="status-chip freq-chip' + (String(set.guardFreq) === String(g[0]) ? ' sel' : '') + '" data-f="' + g[0] + '">' + g[1] + '</button>';
        }).join('') + '</div>' +
        '<p class="muted sm" style="margin-top:-8px">开启后，梦角每隔一段时间会自动来查岗</p>' +
        '<p class="field-label" style="margin-top:14px">⏱ 梦角回复时间（秒）</p>' +
        '<div class="row" style="gap:6px">' +
          '<input class="inp" id="setRMin" type="number" min="0.3" step="0.1" placeholder="最短" value="' + esc(set.replyMin) + '">' +
          '<span class="muted">~</span>' +
          '<input class="inp" id="setRMax" type="number" min="0.3" step="0.1" placeholder="最长" value="' + esc(set.replyMax) + '">' +
        '</div>' +
        '<p class="muted sm" style="margin-top:6px">梦角会在你设置的这段时间内随机回复字卡</p>' +
        '<div class="row" style="margin-top:12px;flex-wrap:wrap">' +
          '<button class="btn small primary" id="setSave">保存</button>' +
          '<button class="btn small ghost" id="setBg">🖼 背景</button>' +
          '<button class="btn small ghost" id="setCards">🀄 字卡库</button>' +
          '<button class="btn small ghost" id="setClear">清空记录</button>' +
          '<button class="btn small ghost" data-m="cancel">关闭</button>' +
        '</div>',
      footer: '',
      onMount: function (b) {
        b.querySelector('#setSave').onclick = function () {
          var verify = b.querySelector('#setVerify').checked;
          var code = b.querySelector('#setCode').value.trim();
          if (verify && !code) {
            b.querySelector('#setErr').hidden = false;
            return;
          }
          var s = settings();
          s.verifyOn = verify; s.code = code;
          var mn = parseFloat(b.querySelector('#setRMin').value);
          var mx = parseFloat(b.querySelector('#setRMax').value);
          if (mn > 0) s.replyMin = mn;
          if (mx > 0) s.replyMax = mx;
          var gSel = b.querySelector('.freq-chip.sel');
          if (gSel) s.guardFreq = parseFloat(gSel.getAttribute('data-f'));
          saveSettings(s);
          window.Modal.close();
          var mark = body.querySelector('#lockMark');
          if (mark) mark.hidden = !s.verifyOn;
          refreshHeadStatus(body);
          toast(verify ? '暗号验证已开启' : '暗号验证已关闭');
        };
        b.querySelector('#setBg').onclick = function () {
          window.Modal.close();
          bgSettings(body);
        };
        b.querySelector('#setClear').onclick = function () {
          saveMsgs([]);
          renderMsgs(body, msgs());
          window.Modal.close();
          toast('聊天记录已清空');
        };
        b.querySelector('#setCards').onclick = function () {
          window.Modal.close();
          renderLibrary(body);
        };
        wireStatusPick(b, '#stUserRow', USER_STATUS, 'user');
        wireStatusPick(b, '#stDreamRow', DREAM_STATUS, 'dream');
        b.querySelectorAll('#guardFreqRow .freq-chip').forEach(function (ch) {
          ch.onclick = function () {
            b.querySelectorAll('#guardFreqRow .freq-chip').forEach(function (x) { x.classList.remove('sel'); });
            ch.classList.add('sel');
          };
        });
      }
    });
  }

  /* ---------- 聊天背景 ---------- */
  function bgSettings(body) {
    var bg = Store.get('chat_bg', '');
    window.Modal.show({
      title: '🖼 聊天背景',
      body: (bg ? '<div class="bg-preview" id="bgPrev" style="background-image:url(' + bg + ')"></div>' : '') +
            '<p class="muted sm center">' + (bg ? '当前使用自定义背景' : '当前使用默认背景') + '</p>',
      footer: '<div class="modal-foot">' +
        '<button class="btn primary" id="bgPick">📷 从相册选择</button>' +
        '<button class="btn ghost" id="bgReset">恢复默认</button>' +
      '</div>',
      onMount: function (b, root) {
        root.querySelector('#bgPick').onclick = function () {
          window.pickImage(function (data) {
            Store.set('chat_bg', data);
            applyChatBg(body);
            window.Modal.close();
            toast('聊天背景已更换 ✨');
          });
        };
        root.querySelector('#bgReset').onclick = function () {
          Store.set('chat_bg', '');
          applyChatBg(body);
          window.Modal.close();
          toast('已恢复默认聊天背景');
        };
      }
    });
  }

  function applyChatBg(body) {
    var chatEl = body.querySelector('.chat');
    if (!chatEl) return;
    var bg = Store.get('chat_bg', '');
    if (bg) {
      chatEl.style.backgroundImage = 'url(' + bg + ')';
      chatEl.classList.add('has-bg');
    } else {
      chatEl.style.backgroundImage = '';
      chatEl.classList.remove('has-bg');
    }
  }

  /* ================= 语音通话 ================= */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var callState = null;

  function openCall(body) {
    if (callState) return;
    var prof = Store.get('profile', { dream: {} }).dream || {};
    var ov = document.createElement('div');
    ov.className = 'call-overlay';
    ov.innerHTML =
      '<div class="call-ava" id="callAva">' + avatarHTML(prof) + '</div>' +
      '<div class="call-name">' + esc(prof.nick || '梦角') + '</div>' +
      '<div class="call-status" id="callStatus">📡 正在呼叫梦角…</div>' +
      '<div class="call-timer" id="callTimer">00:00</div>' +
      '<div class="call-logs" id="callLogs"><div class="call-log sys">嘟——接通了，梦角在听你说话</div></div>' +
      '<div class="call-inputrow"><input class="inp" id="callInput" placeholder="说话吧，梦角听着呢（也支持打字）"><button class="btn primary" id="callSend">发送</button></div>' +
      '<button class="call-hang" id="callHang">📵 挂断</button>';
    var screen = document.querySelector('.screen');
    screen.appendChild(ov);

    callState = { body: body, overlay: ov, sec: 0, connected: false, timer: null, recog: null };

    var st = ov.querySelector('#callStatus');
    var tm = ov.querySelector('#callTimer');

    setTimeout(function () {
      if (!callState || callState.overlay !== ov) return;
      callState.connected = true;
      st.textContent = '🟢 通话中 · 梦角在听你说话';
      ov.querySelector('#callAva').classList.add('talking');
      callState.timer = setInterval(function () {
        callState.sec++;
        var m = Math.floor(callState.sec / 60);
        var s = callState.sec % 60;
        tm.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }, 1000);
      startCallRecog(ov);
      if (!SR) addCallLog(ov, 'info', '当前浏览器不支持语音识别，梦角通过文字听到你');
    }, 1500);

    ov.querySelector('#callSend').onclick = function () { sendCallText(ov); };
    ov.querySelector('#callInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendCallText(ov);
    });
    ov.querySelector('#callHang').onclick = function () { endCall(ov); };
  }

  function addCallLog(ov, cls, text) {
    var logs = ov.querySelector('#callLogs');
    if (!logs) return;
    var d = document.createElement('div');
    d.className = 'call-log ' + cls;
    d.textContent = text;
    logs.appendChild(d);
    logs.scrollTop = logs.scrollHeight;
  }

  function sendCallText(ov) {
    if (!callState || callState.overlay !== ov) return;
    var inp = ov.querySelector('#callInput');
    var text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    addCallLog(ov, 'me', text);
    renderMsgs(callState.body, addMsg('user', text, true));
    var reply = pickCard();
    setTimeout(function () {
      if (!callState || callState.overlay !== ov) return;
      addCallLog(ov, 'dream', reply);
      renderMsgs(callState.body, msgs());
    }, replyDelayMs());
  }

  function startCallRecog(ov) {
    if (!SR) return;
    var rec = new SR();
    rec.lang = 'zh-CN';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          var t = e.results[i][0].transcript.trim();
          if (t && callState && callState.overlay === ov) {
            addCallLog(ov, 'me', t);
            renderMsgs(callState.body, addMsg('user', t, true));
            var reply = pickCard();
            setTimeout(function () {
              if (!callState || callState.overlay !== ov) return;
              addCallLog(ov, 'dream', reply);
              renderMsgs(callState.body, msgs());
            }, replyDelayMs());
          }
        }
      }
    };
    rec.onerror = function (err) {
      if (err && err.error === 'not-allowed' && callState && callState.overlay === ov) {
        addCallLog(ov, 'info', '未获得麦克风权限，梦角通过文字听到你');
      }
    };
    rec.onend = function () {
      if (callState && callState.connected && callState.overlay === ov) {
        try { rec.start(); } catch (e) {}
      }
    };
    callState.recog = rec;
    try { rec.start(); } catch (e) {}
  }

  function endCall(ov) {
    if (!callState) return;
    var st = callState;
    callState = null;
    if (st.timer) clearInterval(st.timer);
    if (st.recog) { try { st.recog.onend = null; st.recog.stop(); } catch (e) {} }
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    renderMsgs(st.body, msgs());
    toast('通话已结束，梦角会想你的');
  }

  function wireStatusPick(b, rowId, list, key) {
    var row = b.querySelector(rowId);
    if (!row) return;
    row.querySelectorAll('.status-chip').forEach(function (ch) {
      ch.onclick = function () {
        row.querySelectorAll('.status-chip').forEach(function (x) { x.classList.remove('sel'); });
        ch.classList.add('sel');
        var s = statuses();
        s[key] = ch.textContent;
        saveStatuses(s);
      };
    });
  }

  function refreshHeadStatus(body) {
    var st = statuses();
    var ds = body.querySelector('#dreamStatus');
    var ms = body.querySelector('#myStatus');
    if (ds) ds.textContent = st.dream;
    if (ms) ms.textContent = st.user;
  }

  /* ---------- 字卡库管理 ---------- */
  function renderLibrary(body) {
    body.innerHTML =
      '<div class="row" style="margin-bottom:12px">' +
        '<button class="appbar-back" id="libBack">‹</button>' +
        '<b style="font-size:15px">字卡库 · ' + cards().filter(function (c) { return c.on; }).length + '/' + cards().length + ' 张启用</b>' +
      '</div>' +
      '<div class="row" style="margin-bottom:12px;flex-wrap:wrap">' +
        '<button class="btn small primary" id="libAdd">＋ 添加字卡</button>' +
        '<button class="btn small ghost" id="libImport">导入</button>' +
        '<button class="btn small ghost" id="libExport">导出</button>' +
      '</div>' +
      '<div id="libList"></div>';

    body.querySelector('#libBack').onclick = function () { renderChat(body); };

    function drawList() {
      var box = body.querySelector('#libList');
      var cs = cards();
      if (!cs.length) { box.innerHTML = '<div class="empty-tip">字卡库是空的，点击「添加」或「导入」吧</div>'; return; }
      box.innerHTML = cs.map(function (c, i) {
        return '<div class="letter-item">' +
          '<label class="chip" style="background:transparent;padding:0"><input type="checkbox" data-i="' + i + '" ' + (c.on ? 'checked' : '') + '></label>' +
          '<div class="letter-main"><div class="letter-prev" style="white-space:normal">' + esc(c.text) + '</div>' +
            (c.tag ? '<div class="letter-time">#' + esc(c.tag) + '</div>' : '') + '</div>' +
          '<button class="btn small ghost" data-edit="' + i + '">✏️</button>' +
          '<button class="btn small ghost" data-del="' + i + '">🗑️</button>' +
        '</div>';
      }).join('');
      box.querySelectorAll('input[data-i]').forEach(function (inp) {
        inp.onchange = function () {
          var cs2 = cards();
          cs2[+inp.getAttribute('data-i')].on = inp.checked;
          Store.set('cards', cs2);
          drawList();
        };
      });
      box.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.onclick = function () {
          var i = +btn.getAttribute('data-edit');
          var cs2 = cards();
          var c = cs2[i];
          promptModal({
            title: '编辑字卡', value: c.text, okText: '保存',
            onOk: function (v) { if (!v) return; c.text = v; Store.set('cards', cs2); drawList(); }
          });
        };
      });
      box.querySelectorAll('[data-del]').forEach(function (btn) {
        btn.onclick = function () {
          var i = +btn.getAttribute('data-del');
          var cs2 = cards();
          cs2.splice(i, 1);
          Store.set('cards', cs2);
          drawList();
        };
      });
    }

    body.querySelector('#libAdd').onclick = function () {
      promptModal({
        title: '添加字卡', placeholder: '写一句梦角会说的话…', okText: '添加',
        onOk: function (v) {
          if (!v) return;
          var cs = cards();
          cs.push({ id: uid(), text: v, tag: '', on: true });
          Store.set('cards', cs);
          drawList();
        }
      });
    };

    body.querySelector('#libImport').onclick = function () {
      var ta;
      window.Modal.show({
        title: '批量导入字卡',
        body: '<p class="muted sm">每行一张字卡，也可直接粘贴 JSON 数组</p>' +
              '<textarea class="inp ta" id="importTa" placeholder="第一张字卡\n第二张字卡\n…"></textarea>',
        footer: '<div class="modal-foot"><button class="btn primary" data-m="ok">导入</button><button class="btn ghost" data-m="cancel">取消</button></div>',
        onMount: function (b) { ta = b.querySelector('#importTa'); ta.focus(); },
        onOk: function () {
          var txt = ta.value.trim();
          if (!txt) { window.Modal.close(); return; }
          var items;
          try { items = JSON.parse(txt); if (!Array.isArray(items)) throw 0; }
          catch (e) { items = txt.split('\n'); }
          var cs = cards();
          items.forEach(function (it) {
            var text = typeof it === 'string' ? it : (it.text || '');
            if (text.trim()) cs.push({ id: uid(), text: text.trim(), tag: it.tag || '', on: true });
          });
          Store.set('cards', cs);
          window.Modal.close();
          drawList();
          toast('已导入 ' + items.length + ' 张字卡');
        }
      });
    };

    body.querySelector('#libExport').onclick = function () {
      window.Modal.show({
        title: '导出字卡库',
        body: '<textarea class="inp ta" id="expTa" readonly></textarea><p class="muted sm center">复制内容即可备份，之后可粘贴回「导入」</p>',
        footer: '<div class="modal-foot"><button class="btn primary" data-m="ok">复制</button></div>',
        onMount: function (b) {
          var ta = b.querySelector('#expTa');
          ta.value = JSON.stringify(cards(), null, 2);
          ta.onclick = function () { ta.select(); };
        },
        onOk: function () {
          var ta = document.querySelector('#expTa');
          if (ta) { ta.select(); document.execCommand('copy'); toast('已复制'); }
          window.Modal.close();
        }
      });
    };

    drawList();
  }

  /* ---------- 聊天主界面 ---------- */
  function renderChat(body) {
    var set = settings();
    var st = statuses();
    var prof = Store.get('profile', { dream: {} }).dream || {};
    var uprof = Store.get('profile', { user: {} }).user || {};
    body.innerHTML =
      '<div class="chat">' +
        '<div class="chat-head">' +
          '<div class="chat-head-left"><span class="mini-ava">' + avatarHTML(prof) + '</span>' +
            '<div class="chat-head-info"><b>' + esc(prof.nick || '梦角') + '</b>' +
              '<span class="chat-status" id="dreamStatus">' + esc(st.dream) + '</span></div>' +
            '<span id="lockMark" ' + (set.verifyOn ? '' : 'hidden') + ' title="暗号验证已开启">🔒</span></div>' +
          '<div class="chat-head-right">' +
            '<span class="mini-ava">' + avatarHTML(uprof) + '</span>' +
            '<span class="chat-status" id="myStatus">' + esc(st.user) + '</span>' +
            '<button class="icon-btn" id="chatCall">📞</button>' +
            '<button class="icon-btn" id="chatGear">⚙️</button>' +
          '</div>' +
        '</div>' +
        '<div class="chat-body" id="chatBody"></div>' +
        '<div class="chat-foot">' +
          '<div class="chat-tools">' +
            '<button class="tool-btn" id="chatTransfer">💸 转账</button>' +
            '<button class="tool-btn" id="chatCamera">📷 拍照</button>' +
            '<button class="tool-btn" id="chatAlbum">🖼 相册</button>' +
            '<button class="tool-btn" id="chatQuiz">📋 问卷</button>' +
            '<button class="tool-btn" id="chatGuard">🚨 查岗</button>' +
          '</div>' +
          '<div class="chat-mode">' +
            '<button class="mode-btn active" data-mode="user">我</button>' +
            '<button class="mode-btn" data-mode="dream">梦角</button>' +
          '</div>' +
          '<div class="chat-inputrow">' +
            '<input class="inp" id="chatInput" placeholder="给梦角发消息…">' +
            '<button class="btn primary" id="chatSend">发送</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    renderMsgs(body, msgs());
    wireSend(body);
    applyChatBg(body);
    curBody = body;
    body.querySelector('#chatCall').onclick = function () { openCall(body); };
    body.querySelector('#chatGear').onclick = function () { openSettings(body); };
    body.querySelector('#chatTransfer').onclick = function () { window.Transfer.open(); };
    body.querySelector('#chatCamera').onclick = function () { sendImage(body, 'camera'); };
    body.querySelector('#chatAlbum').onclick = function () { sendImage(body, 'album'); };
    body.querySelector('#chatQuiz').onclick = function () { openQuiz(body); };
    body.querySelector('#chatGuard').onclick = function () { sendGuard(body); };
    if (guardTimer) clearInterval(guardTimer);
    guardTimer = setInterval(function () { maybeAutoGuard(body); }, 30000);
  }

  Shell.register({
    id: 'chat',
    name: '字卡传讯',
    icon: '💬',
    color: 'linear-gradient(135deg,#ff7eb3,#a18cd1)',
    badge: function () { return 0; },
    render: function (body) { renderChat(body); }
  });
})();
