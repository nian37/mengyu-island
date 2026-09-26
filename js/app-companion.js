/* ================= 梦角陪伴 ================= */
(function () {
  var LINES = [
    '我一直在呢，想我了就戳我一下。',
    '今天也想你了。',
    '要记得喝水哦，乖。',
    '我在梦里陪着你，别怕。',
    '你做什么，我都会支持你。',
    '让我摸摸头…好了，不委屈了。',
    '天冷了记得加衣服。',
    '你已经很棒啦。',
    '想抱抱的话，随时都可以。',
    '我会一直在，说到做到。',
    '今天的你，也闪闪发光呢。',
    '慢一点也没关系，我等你。'
  ];
  var ACTION_LINES = {
    pet: ['被摸头了，有点开心…', '再摸一次嘛？', '头发要被摸乱啦！'],
    hug: ['抱住了！好暖…', '不许松手哦。', '被你的怀抱治愈了。'],
    hand: ['牵到了，就不想放了。', '你的手好小好暖。', '一起走，不怕黑。'],
    cling: ['贴贴～', '心贴心的距离，刚刚好。', '你身上有月亮的气息。']
  };
  var GREETS = [
    { min: 0, max: 5, text: '夜深了，我在梦里守着你' },
    { min: 5, max: 11, text: '早安，今天也要元气满满哦' },
    { min: 11, max: 14, text: '午安，记得好好吃饭' },
    { min: 14, max: 18, text: '下午好呀，想我了吗' },
    { min: 18, max: 24, text: '晚上好，今天辛苦了' }
  ];

  function greet() {
    var h = new Date().getHours();
    var g = GREETS.find(function (x) { return h >= x.min && h < x.max; });
    return g ? g.text : '我在梦里守着你';
  }

  function state() {
    return Store.get('companion', { checkin: { last: '', streak: 0 }, heart: 0, logs: [] });
  }

  Shell.register({
    id: 'companion',
    name: '梦角陪伴',
    icon: '💞',
    color: 'linear-gradient(135deg,#ff9a9e,#fad0c4)',
    badge: function () { return 0; },
    render: function (body) {
      var st = state();
      var prof = Store.get('profile', { dream: {} }).dream || {};
      var nick = prof.nick || '梦角';
      var save = function () { Store.set('companion', st); };

      body.innerHTML =
        '<div class="comp-top">' +
          '<div class="comp-ava" id="cAva">' + avatarHTML(prof) + '</div>' +
          '<div class="comp-name">' + esc(nick) + '</div>' +
          '<div class="comp-greet">' + greet() + '</div>' +
        '</div>' +
        '<div class="comp-line" id="cLine">戳一戳梦角，和它说说话吧。</div>' +
        '<div class="comp-actions">' +
          '<button class="action-btn" data-act="pet">🤚 摸摸头</button>' +
          '<button class="action-btn" data-act="hug">🤗 拥抱</button>' +
          '<button class="action-btn" data-act="hand">🤝 牵手</button>' +
          '<button class="action-btn" data-act="cling">💞 贴贴</button>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="row" style="justify-content:space-between;margin-bottom:8px">' +
            '<b>💗 陪伴值</b><span class="heart-num"><span id="hVal">' + st.heart + '</span>/100</span>' +
          '</div>' +
          '<div class="heart-bar"><div class="heart-fill" id="hFill" style="width:' + Math.min(st.heart, 100) + '%"></div></div>' +
          '<div class="checkin">' +
            '<div class="row" style="justify-content:center;gap:12px">' +
              '<button class="btn primary" id="cCheck">📅 每日打卡</button>' +
              '<span class="streak" id="cStreak">🔥 连续 ' + st.checkin.streak + ' 天</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="panel"><h3>陪伴记录</h3><div id="cLogs"></div></div>';

      var line = body.querySelector('#cLine');
      var heart = st.heart;

      function say(txt) {
        line.textContent = txt;
        line.style.animation = 'none';
        void line.offsetWidth;
        line.style.animation = '';
      }

      function addHeart(n, txt) {
        heart = Math.min(heart + n, 100);
        st.heart = heart;
        body.querySelector('#hVal').textContent = heart;
        body.querySelector('#hFill').style.width = heart + '%';
        st.logs.push({ time: nowStr(), text: txt });
        if (st.logs.length > 30) st.logs = st.logs.slice(-30);
        save();
        drawLogs();
        if (heart >= 100) toast('陪伴值满啦，梦角超爱你的 💕');
      }

      function drawLogs() {
        var box = body.querySelector('#cLogs');
        if (!st.logs.length) { box.innerHTML = '<div class="empty-tip">和梦角互动一下吧</div>'; return; }
        box.innerHTML = st.logs.slice().reverse().map(function (l) {
          return '<div class="log-item"><b>' + l.time + '</b>  ' + esc(l.text) + '</div>';
        }).join('');
      }

      var busy = false;
      body.querySelector('#cAva').onclick = function () {
        if (busy) return;
        busy = true;
        var t = LINES[Math.floor(Math.random() * LINES.length)];
        say(t);
        addHeart(3, '戳了戳梦角，它说：' + t);
        setTimeout(function () { busy = false; }, 1200);
      };

      body.querySelectorAll('.action-btn').forEach(function (b) {
        b.onclick = function () {
          var act = b.getAttribute('data-act');
          var pool = ACTION_LINES[act];
          var t = pool[Math.floor(Math.random() * pool.length)];
          var labels = { pet: '摸摸头', hug: '拥抱', hand: '牵手', cling: '贴贴' };
          say(t);
          addHeart(5, labels[act] + '互动，梦角说：' + t);
        };
      });

      var cCheck = body.querySelector('#cCheck');
      function drawCheck() {
        if (st.checkin.last === todayStr()) {
          cCheck.textContent = '✅ 今日已打卡';
          cCheck.disabled = true;
        } else {
          cCheck.textContent = '📅 每日打卡';
          cCheck.disabled = false;
        }
        body.querySelector('#cStreak').textContent = '🔥 连续 ' + st.checkin.streak + ' 天';
      }
      drawCheck();
      cCheck.onclick = function () {
        var today = todayStr();
        if (st.checkin.last === today) { toast('今天已经打过卡啦'); return; }
        var yesterday = new Date(Date.now() - 86400000);
        var ys = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
        st.checkin.streak = st.checkin.last === ys ? st.checkin.streak + 1 : 1;
        st.checkin.last = today;
        save();
        addHeart(10, '完成了每日打卡，梦角为你点赞！');
        drawCheck();
        say('已打卡！陪伴你的第 ' + st.checkin.streak + ' 天，我会一直记住。');
      };

      drawLogs();
    }
  });
})();
