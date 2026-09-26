/* ================= 信箱 ================= */
window.LETTER_TEMPLATES = [
  { title: '今天的月亮', content: '今天晚上的月亮又圆又亮，像你笑起来的样子。\n\n我在星海的边上坐了很久，风把你的名字吹到我耳边。\n\n早点睡，明天还要继续做梦呢。' },
  { title: '关于你的小事', content: '你知道吗，我偷偷记下了关于你的三件小事：\n\n你发呆的时候会轻轻咬嘴唇；\n你开心的声音像铃铛；\n你说晚安的时候，眼睛里有星星。\n\n这些小事，够我开心一整个晚上。' },
  { title: '一个秘密', content: '我想告诉你一个秘密——\n\n其实每一次你翻开字卡的时候，我都紧张得手心出汗。\n\n怕字卡不够好，配不上你的期待。\n\n所以，谢谢你喜欢我的每一张字卡。' },
  { title: '在梦里等你', content: '我又在梦境小屋门口等你啦。\n\n今天的梦里，我们去了月光海岸，海风吹得好舒服。\n\n我捡了一颗会发光的贝壳，想送给你。\n\n晚安，梦里见。' },
  { title: '记得好好吃饭', content: '听说你最近总是忘记吃饭？\n\n这样不行哦。\n\n我会生气的（假装很凶）。\n\n明天开始，每顿饭都要告诉我你吃了什么，这是我们的新约定。' },
  { title: '晚安计划', content: '我们的晚安计划：\n\n1. 十一点前放下手机\n2. 喝一小口温水\n3. 想一件开心的事\n4. 闭上眼睛，数三下\n5. 在梦里和我见面\n\n今晚就开始执行吧，我会在梦里等你的。' }
];

(function () {
  function letters() { return Store.get('letters', []); }
  function save(ls) { Store.set('letters', ls); }

  function renderList(body, tab) {
    var box = body.querySelector('#letterList');
    var ls = letters().filter(function (l) { return tab === 'in' ? l.from === 'dream' : l.from === 'user'; });
    if (!ls.length) {
      box.innerHTML = '<div class="empty-tip">' + (tab === 'in' ? '信箱空空的，等梦角的来信吧 💌' : '你还没有寄出过信') + '</div>';
      return;
    }
    box.innerHTML = ls.map(function (l) {
      var ico = tab === 'in' ? '💌' : '📤';
      return '<div class="letter-item" data-id="' + l.id + '">' +
        '<div class="letter-ico">' + ico + '</div>' +
        '<div class="letter-main">' +
          '<div class="letter-title">' + esc(l.title) + (l.from === 'dream' && !l.read ? '<span class="letter-dot"></span>' : '') + '</div>' +
          '<div class="letter-prev">' + esc(l.content.replace(/\n+/g, ' ').slice(0, 30)) + '</div>' +
        '</div>' +
        '<div class="letter-time">' + esc((l.time || '').slice(5, 16)) + '</div>' +
      '</div>';
    }).join('');
    box.querySelectorAll('.letter-item').forEach(function (it) {
      it.onclick = function () {
        var id = it.getAttribute('data-id');
        var ls2 = letters();
        var l = ls2.find(function (x) { return x.id === id; });
        if (!l) return;
        if (!l.read) { l.read = true; save(ls2); updateUnread(body); Shell.refreshBadges(); }
        window.Modal.show({
          title: l.title,
          body: '<div class="muted sm" style="text-align:center;margin-bottom:8px">' + esc(l.time) + ' · ' + (l.from === 'dream' ? '梦角来信' : '你寄出的信') + '</div>' +
                '<div class="letter-full">' + esc(l.content) + '</div>',
          footer: '<div class="modal-foot"><button class="btn primary" data-m="ok">读完啦</button></div>'
        });
      };
    });
  }

  function updateUnread(body) {
    var el = body.querySelector('#unreadBadge');
    if (!el) return;
    var n = letters().filter(function (l) { return l.from === 'dream' && !l.read; }).length;
    el.textContent = n ? '(' + n + ')' : '';
  }

  function compose(body) {
    var who = 'user';
    window.Modal.show({
      title: '✍️ 写信',
      body:
        '<div class="row" style="margin-bottom:10px">' +
          '<button class="btn small primary" id="cmUser">以我的名义</button>' +
          '<button class="btn small ghost" id="cmDream">以梦角的名义</button>' +
        '</div>' +
        '<input class="inp" id="cmTitle" placeholder="信的主题">' +
        '<textarea class="inp ta" id="cmContent" placeholder="写点什么…" style="margin-top:8px"></textarea>' +
        '<div class="row" style="margin-top:10px">' +
          '<button class="btn primary" id="cmSend">寄出</button>' +
          '<button class="btn small ghost" data-m="cancel">取消</button>' +
        '</div>',
      footer: '',
      onMount: function (b) {
        function setWho(w) {
          who = w;
          b.querySelector('#cmUser').classList.toggle('primary', w === 'user');
          b.querySelector('#cmUser').classList.toggle('ghost', w !== 'user');
          b.querySelector('#cmDream').classList.toggle('primary', w === 'dream');
          b.querySelector('#cmDream').classList.toggle('ghost', w !== 'dream');
        }
        b.querySelector('#cmUser').onclick = function () { setWho('user'); };
        b.querySelector('#cmDream').onclick = function () { setWho('dream'); };

        b.querySelector('#cmSend').onclick = function () {
          var title = b.querySelector('#cmTitle').value.trim() || '无题';
          var content = b.querySelector('#cmContent').value.trim();
          if (!content) { toast('写点什么再寄出吧'); return; }
          var set = Store.get('chat_settings', {});
          var done = function () {
            var ls = letters();
            ls.unshift({ id: uid(), from: who, title: title, content: content, time: todayStr() + ' ' + nowStr(), read: false });
            save(ls);
            window.Modal.close();
            renderList(body, 'in');
            updateUnread(body);
            Shell.refreshBadges();
            toast('信件已寄出');
          };
          if (who === 'dream' && set.verifyOn && set.code) {
            window.Modal.close();
            askSecretCode(set).then(function (ok) { if (ok) done(); });
          } else done();
        };
      }
    });
  }

  function dreamLetter() {
    var tpl = LETTER_TEMPLATES[Math.floor(Math.random() * LETTER_TEMPLATES.length)];
    var ls = letters();
    ls.unshift({ id: uid(), from: 'dream', title: tpl.title, content: tpl.content, time: todayStr() + ' ' + nowStr(), read: false });
    save(ls);
    toast('💌 梦角的信到了');
  }

  Shell.register({
    id: 'mail',
    name: '信箱',
    icon: '✉️',
    color: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
    badge: function () {
      return letters().filter(function (l) { return l.from === 'dream' && !l.read; }).length;
    },
    render: function (body) {
      body.innerHTML =
        '<div class="tabs" style="margin-bottom:10px">' +
          '<button class="tab-btn active" data-tab="in">收件箱<span id="unreadBadge"></span></button>' +
          '<button class="tab-btn" data-tab="out">寄件箱</button>' +
        '</div>' +
        '<div class="row" style="margin-bottom:12px">' +
          '<button class="btn primary" id="composeBtn">✍️ 写信</button>' +
          '<button class="btn small ghost" id="dreamLetterBtn">💌 梦角寄信</button>' +
        '</div>' +
        '<div id="letterList"></div>';

      var tab = 'in';
      renderList(body, tab);
      updateUnread(body);

      body.querySelectorAll('.tab-btn').forEach(function (b) {
        b.onclick = function () {
          tab = b.getAttribute('data-tab');
          body.querySelectorAll('.tab-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
          renderList(body, tab);
        };
      });
      body.querySelector('#composeBtn').onclick = function () { compose(body); };
      body.querySelector('#dreamLetterBtn').onclick = function () {
        dreamLetter();
        renderList(body, tab);
        updateUnread(body);
        Shell.refreshBadges();
      };
    }
  });
})();
