/* ================= 一起听歌（可绑定 QQ 音乐） ================= */
(function () {
  var SAMPLES = [
    { title: '晚风心里吹', artist: '陈慧娴' },
    { title: '向云端', artist: '小霞' },
    { title: '小美满', artist: '周深' },
    { title: 'Dream It Possible', artist: 'Delacey' },
    { title: '错位时空', artist: '艾辰' },
    { title: '一路生花', artist: '温奕心' }
  ];
  var REACTIONS = [
    '这首歌好好听，我跟着哼起来了 🎶',
    '有点想你和我合唱…',
    '这段旋律，像我们的故事。',
    '我已经单曲循环了！',
    '你也喜欢这首歌吗？太好了！',
    '戴上耳机，我们就是同一个世界啦。',
    '等会儿陪你一起听完～'
  ];

  function state() { return Store.get('music', { qq: {}, queue: [], react: [] }); }

  Shell.register({
    id: 'music',
    name: '一起听歌',
    icon: '🎵',
    color: 'linear-gradient(135deg,#fdcbf1,#e6dee9)',
    badge: function () { return 0; },
    render: function (body) {
      var st = state();
      var save = function () { Store.set('music', st); };

      function qqLink(title) {
        return 'https://y.qq.com/n/ryqq/search?t=song&w=' + encodeURIComponent(title || '');
      }

      body.innerHTML =
        '<div class="panel bind-card" id="bindCard"></div>' +
        '<div class="panel">' +
          '<div class="row" style="justify-content:space-between;margin-bottom:10px">' +
            '<b>🎧 一起听房间</b>' +
            '<span class="room-status on" id="roomStatus">在听</span>' +
          '</div>' +
          '<div class="row" style="margin-bottom:8px">' +
            '<button class="btn small" id="mToggle">切换状态</button>' +
            '<button class="btn small ghost" id="mNext">下一首 ⏭</button>' +
          '</div>' +
          '<div class="field-label">当前播放</div>' +
          '<div class="song-item" id="mNow"><div class="song-num">▶️</div><div class="song-main">' +
            '<div class="song-title">（房间里还没有歌曲）</div><div class="song-artist">—</div></div>' +
            '<a class="btn small ghost" id="mSearch" target="_blank" rel="noopener">去QQ音乐搜</a></div>' +
          '<div class="field-label">播放列表</div>' +
          '<div class="row" style="margin-bottom:8px">' +
            '<input class="inp" id="mTitle" placeholder="歌曲名">' +
            '<input class="inp" id="mArtist" placeholder="歌手" style="flex:0 0 100px">' +
          '</div>' +
          '<div class="row" style="margin-bottom:10px">' +
            '<button class="btn small primary" id="mAdd">我点歌</button>' +
            '<button class="btn small ghost" id="mDreamAdd">梦角点歌 🎁</button>' +
          '</div>' +
          '<div id="mList"></div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3>💬 梦角的听歌反应</h3>' +
          '<div id="mReact"></div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3>🌙 梦角最近在听</h3>' +
          '<div id="mSamples"></div>' +
        '</div>';

      /* 绑定 QQ 音乐 */
      function drawBind() {
        var card = body.querySelector('#bindCard');
        if (st.qq.id) {
          card.innerHTML =
            '<div class="bind-ok">✅ 已绑定 QQ 音乐账号：<b>' + esc(st.qq.nick || st.qq.id) + '</b>（' + esc(st.qq.id) + '）</div>' +
            '<p class="muted sm" style="margin-top:6px">模拟绑定演示 · 真实授权需接入 QQ 音乐开放平台</p>';
        } else {
          card.innerHTML =
            '<h3>绑定 QQ 音乐</h3>' +
            '<div class="row" style="margin-bottom:8px">' +
              '<input class="inp" id="qqId" placeholder="QQ 音乐账号 / ID">' +
            '</div>' +
            '<div class="row" style="margin-bottom:8px">' +
              '<input class="inp" id="qqNick" placeholder="显示昵称（可选）">' +
            '</div>' +
            '<button class="btn primary big" id="qqBind">绑定账号</button>' +
            '<p class="muted sm" style="margin-top:8px">绑定后即可与梦角共享歌单、一起听歌</p>';
        }
        var bindBtn = body.querySelector('#qqBind');
        if (bindBtn) bindBtn.onclick = function () {
          var id = body.querySelector('#qqId').value.trim();
          if (!id) { toast('请输入账号'); return; }
          st.qq = { id: id, nick: body.querySelector('#qqNick').value.trim() };
          save();
          drawBind();
          drawSamples();
          toast('已绑定 QQ 音乐');
        };
      }

      function drawNow() {
        var cur = st.queue[0];
        var now = body.querySelector('#mNow');
        var title = body.querySelector('#mNow .song-title');
        var artist = body.querySelector('#mNow .song-artist');
        if (cur) {
          title.textContent = cur.title + (cur.from === 'dream' ? '（梦角点的）' : '');
          artist.textContent = cur.artist || '—';
        } else {
          title.textContent = '（房间里还没有歌曲）';
          artist.textContent = '—';
        }
      }

      function drawList() {
        var box = body.querySelector('#mList');
        if (!st.queue.length) { box.innerHTML = '<div class="empty-tip">播放列表空空的，点首歌吧</div>'; return; }
        box.innerHTML = st.queue.map(function (s, i) {
          return '<div class="song-item">' +
            '<div class="song-num">' + (i + 1) + '</div>' +
            '<div class="song-main"><div class="song-title">' + esc(s.title) + '</div>' +
            '<div class="song-artist">' + esc(s.artist || '未知歌手') + '</div></div>' +
            (s.from === 'dream' ? '<span class="song-tag">梦角</span>' : '') +
            '<button class="btn small ghost" data-rm="' + s.id + '">✕</button>' +
          '</div>';
        }).join('');
        box.querySelectorAll('[data-rm]').forEach(function (b) {
          b.onclick = function () {
            var id = b.getAttribute('data-rm');
            st.queue = st.queue.filter(function (x) { return x.id !== id; });
            save(); drawList(); drawNow();
          };
        });
      }

      function drawReact() {
        var box = body.querySelector('#mReact');
        if (!st.react.length) { box.innerHTML = '<div class="empty-tip">梦角还在酝酿反应…</div>'; return; }
        box.innerHTML = st.react.slice().reverse().map(function (r) {
          return '<div class="react-item"><div class="g-ava">' + avatarHTML(Store.get('profile', { dream: {} }).dream) + '</div>' +
            '<div class="g-box"><div class="g-name">梦角</div><div class="g-bubble">' + esc(r) + '</div></div></div>';
        }).join('');
      }

      function drawSamples() {
        var box = body.querySelector('#mSamples');
        box.innerHTML = SAMPLES.map(function (s, i) {
          return '<div class="song-item">' +
            '<div class="song-num">♪</div>' +
            '<div class="song-main"><div class="song-title">' + esc(s.title) + '</div>' +
            '<div class="song-artist">' + esc(s.artist) + '</div></div>' +
            '<button class="btn small ghost" data-sample="' + i + '">＋ 加入</button>' +
          '</div>';
        }).join('');
        box.querySelectorAll('[data-sample]').forEach(function (b) {
          b.onclick = function () {
            var s = SAMPLES[+b.getAttribute('data-sample')];
            st.queue.push({ id: uid(), title: s.title, artist: s.artist, from: 'dream' });
            save(); drawList(); drawNow();
            st.react.push('把《' + s.title + '》放进了我们的歌单 ♪');
            save(); drawReact();
          };
        });
      }

      function addSong(from) {
        var t = body.querySelector('#mTitle').value.trim();
        var a = body.querySelector('#mArtist').value.trim();
        if (!t) { toast('请输入歌曲名'); return; }
        body.querySelector('#mTitle').value = '';
        body.querySelector('#mArtist').value = '';
        st.queue.push({ id: uid(), title: t, artist: a, from: from });
        save(); drawList(); drawNow();
        var react = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
        st.react.push(from === 'dream' ? '我点了《' + t + '》，想和你一起听 ♪' : react);
        save(); drawReact();
      }

      body.querySelector('#mAdd').onclick = function () { addSong('user'); };
      body.querySelector('#mDreamAdd').onclick = function () { addSong('dream'); };
      body.querySelector('#mNext').onclick = function () {
        if (!st.queue.length) { toast('列表是空的'); return; }
        var first = st.queue.shift();
        st.queue.push(first);
        save(); drawList(); drawNow();
      };
      body.querySelector('#mToggle').onclick = function () {
        var st2 = state();
        var room = body.querySelector('#roomStatus');
        if (room.classList.contains('on')) {
          room.classList.remove('on'); room.classList.add('off'); room.textContent = '休息';
          st2.roomOff = true;
        } else {
          room.classList.add('on'); room.classList.remove('off'); room.textContent = '在听';
          st2.roomOff = false;
        }
        Store.set('music', st2);
      };

      drawBind();
      drawNow();
      drawList();
      drawReact();
      drawSamples();
    }
  });
})();
