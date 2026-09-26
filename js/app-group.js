/* ================= 梦界群聊 ================= */
(function () {
  var MEMBERS = [
    { id: 'dream', name: '梦角', avatar: '', pool: [] },
    { id: 'elf', name: '月光精灵', avatar: '🧚', pool: ['今晚的月光好温柔呀～', '要不要一起在星辉下跳舞？', '我听到有人想梦角啦！'] },
    { id: 'star', name: '星之使者', avatar: '⭐', pool: ['星光已就位，请指示～', '刚刚划过的流星，是我许的愿。', '今晚的星座运势：满分！'] },
    { id: 'cat', name: '梦境猫', avatar: '🐱', pool: ['喵～你们在聊什么呀？', '喵的，我爪子上有星星！', '呼噜呼噜…继续继续。'] },
    { id: 'wind', name: '风之少女', avatar: '🍃', pool: ['风把你们的悄悄话吹到我这儿啦～', '春天要来了，好开心！', '刚刚吹过一阵带花香的风。'] },
    { id: 'time', name: '时间旅人', avatar: '🕰️', pool: ['我已经见过你们聊天的第五十七次啦。', '未来可期，一切都会很好。', '时间证明，你们的故事很长。'] }
  ];

  function state() {
    var g = Store.get('group', null);
    if (!g) {
      g = {
        name: '梦界群聊',
        msgs: [
          { from: 'elf', text: '欢迎来到梦界群聊！', time: nowStr() },
          { from: 'cat', text: '喵～有新朋友来了？', time: nowStr() }
        ]
      };
      Store.set('group', g);
    }
    return g;
  }

  function pickCard() {
    var on = Store.get('cards', []).filter(function (c) { return c.on; });
    return on.length ? on[Math.floor(Math.random() * on.length)].text : '（字卡库是空的）';
  }

  Shell.register({
    id: 'group',
    name: '梦界群聊',
    icon: '💭',
    color: 'linear-gradient(135deg,#89f7fe,#66a6ff)',
    badge: function () { return 0; },
    render: function (body) {
      var g = state();
      var prof = Store.get('profile', { dream: {} }).dream || {};

      function memberInfo(id) {
        if (id === 'user') return { name: '我', avatar: '🙋' };
        if (id === 'dream') return { name: prof.nick || '梦角', avatar: avatarHTML(prof) };
        var m = MEMBERS.find(function (x) { return x.id === id; });
        return m ? { name: m.name, avatar: esc(m.avatar) } : { name: id, avatar: '❓' };
      }

      body.innerHTML =
        '<div class="chat">' +
          '<div class="chat-head">' +
            '<div class="chat-head-left">💬 <b>' + esc(g.name) + '</b><span class="muted sm">' + MEMBERS.length + '人</span></div>' +
            '<button class="icon-btn" id="gSettings">⚙️</button>' +
          '</div>' +
          '<div class="chat-body" id="gBody"></div>' +
          '<div class="chat-foot">' +
            '<div class="chat-inputrow">' +
              '<input class="inp" id="gInput" placeholder="在群里说点什么…">' +
              '<button class="btn primary" id="gSend">发送</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      function renderG() {
        var box = body.querySelector('#gBody');
        box.innerHTML = g.msgs.map(function (m) {
          var info = memberInfo(m.from);
          var me = m.from === 'user';
          var name = me ? '我' : info.name;
          var ava = me ? '🙋' : (m.from === 'dream' ? info.avatar : info.avatar);
          return '<div class="gmsg ' + (me ? 'me' : '') + '">' +
            '<div class="g-ava">' + ava + '</div>' +
            '<div class="g-box">' +
              '<div class="g-name">' + name + '</div>' +
              '<div class="g-bubble">' + esc(m.text) + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
        box.scrollTop = box.scrollHeight;
      }

      function send() {
        var input = body.querySelector('#gInput');
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        g.msgs.push({ from: 'user', text: text, time: nowStr() });
        Store.set('group', g);
        renderG();

        var members = MEMBERS.filter(function (m) { return m.id !== 'dream'; });
        setTimeout(function () {
          var r = Math.random();
          var from, reply;
          if (r < 0.35) { from = 'dream'; reply = pickCard(); }
          else {
            var m = members[Math.floor(Math.random() * members.length)];
            from = m.id;
            reply = m.pool[Math.floor(Math.random() * m.pool.length)];
          }
          g.msgs.push({ from: from, text: reply, time: nowStr() });
          Store.set('group', g);
          renderG();
        }, 700 + Math.random() * 900);
      }

      body.querySelector('#gSend').onclick = send;
      body.querySelector('#gInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });

      body.querySelector('#gSettings').onclick = function () {
        window.Modal.show({
          title: '群聊设置',
          body:
            '<input class="inp" id="gName" value="' + esc(g.name) + '" placeholder="群聊名称">' +
            '<div style="margin-top:10px">成员（' + MEMBERS.length + '人）：</div>' +
            '<div class="row wrap" style="margin-top:6px">' + MEMBERS.map(function (m) {
              return '<span class="chip" style="gap:6px">' + (m.id === 'dream' ? avatarHTML(prof) : m.avatar) + ' ' + esc(m.id === 'dream' ? (prof.nick || '梦角') : m.name) + '</span>';
            }).join('') + '</div>' +
            '<div class="row" style="margin-top:14px">' +
              '<button class="btn primary" data-m="ok">保存</button>' +
              '<button class="btn small ghost" data-m="cancel">关闭</button>' +
            '</div>',
          footer: '',
          onMount: function (b) {
            b.querySelector('[data-m="ok"]').onclick = function () {
              var nm = b.querySelector('#gName').value.trim();
              if (nm) { g.name = nm; Store.set('group', g); }
              window.Modal.close();
              var left = body.querySelector('.chat-head-left b');
              if (left) left.textContent = g.name;
            };
          }
        });
      };

      renderG();
    }
  });
})();
