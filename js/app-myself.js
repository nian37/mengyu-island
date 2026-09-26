/* ================= 我的小屋（头像 / 昵称 / 回复时间） ================= */
(function () {
  var EMOJIS = ['👸', '💃', '🧚‍♀️', '🌷', '🦋', '🐰', '🌸', '⭐', '🍑', '🫧', '🎀', '💜', '🌙', '🧸', '💫', '🥀', '🍒', '☁️', '🪞', '💍'];

  Shell.register({
    id: 'myself',
    name: '我的小屋',
    icon: '🪞',
    color: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
    badge: function () { return 0; },
    render: function (body) {
      var p = Store.get('profile', { user: {}, dream: {} });
      var u = p.user;
      var set = Store.get('chat_settings', { replyMin: 1, replyMax: 3 });

      body.innerHTML =
        '<div class="panel">' +
          '<h3>我的头像</h3>' +
          '<div class="avatar-big" id="myAvatar">' + avatarHTML(u) + '</div>' +
          '<div class="emoji-pick" id="myEmojis">' + EMOJIS.map(function (e) {
            return '<span class="emoji-it" data-e="' + e + '">' + e + '</span>';
          }).join('') + '</div>' +
          '<div class="row" style="margin-bottom:8px">' +
            '<input class="inp" id="myAvatarText" placeholder="自定义头像（文字/emoji）">' +
            '<button class="btn small primary" id="myAvatarTextBtn">使用</button>' +
          '</div>' +
          '<div class="row">' +
            '<input type="file" id="myAvatarFile" accept="image/*" hidden>' +
            '<button class="btn small ghost" id="myAvatarFileBtn">📷 从相册选择</button>' +
            (u.avatarImg ? '<button class="btn small ghost" id="myAvatarRm">移除图片</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3>我的昵称</h3>' +
          '<input class="inp" id="myNick" value="' + esc(u.nick || '') + '" placeholder="别人怎么称呼你">' +
          '<p class="field-label" style="margin-top:12px">生日</p>' +
          '<input class="inp" id="myBirth" type="date" value="' + esc(u.birth || '') + '">' +
        '</div>' +
        '<div class="panel">' +
          '<h3>⏱ 梦角回复时间（秒）</h3>' +
          '<p class="muted sm" style="margin-bottom:8px">随时更改，梦角会在设定范围内随机回复字卡</p>' +
          '<div class="row" style="gap:6px">' +
            '<input class="inp" id="myRMin" type="number" min="0.3" step="0.1" placeholder="最短" value="' + esc(set.replyMin) + '">' +
            '<span class="muted">~</span>' +
            '<input class="inp" id="myRMax" type="number" min="0.3" step="0.1" placeholder="最长" value="' + esc(set.replyMax) + '">' +
          '</div>' +
        '</div>' +
        '<button class="btn primary big" id="mySave">保存</button>' +
        '<p class="muted sm center" style="margin-top:8px">保存后，你的形象会出现在聊天的顶部</p>';

      var avatarBox = body.querySelector('#myAvatar');

      body.querySelector('#myEmojis').onclick = function (e) {
        var t = e.target.closest('.emoji-it');
        if (!t) return;
        body.querySelectorAll('.emoji-it').forEach(function (x) { x.classList.remove('sel'); });
        t.classList.add('sel');
        u.avatar = t.getAttribute('data-e');
        delete u.avatarImg;
        avatarBox.innerHTML = avatarHTML(u);
      };

      body.querySelector('#myAvatarTextBtn').onclick = function () {
        var v = body.querySelector('#myAvatarText').value.trim();
        if (!v) return;
        u.avatar = v;
        delete u.avatarImg;
        avatarBox.innerHTML = avatarHTML(u);
      };

      body.querySelector('#myAvatarFileBtn').onclick = function () {
        body.querySelector('#myAvatarFile').click();
      };
      body.querySelector('#myAvatarFile').addEventListener('change', function (e) {
        var f = e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          u.avatarImg = r.result;
          avatarBox.innerHTML = avatarHTML(u);
          toast('头像已更新，记得保存');
        };
        r.readAsDataURL(f);
      });
      var rmBtn = body.querySelector('#myAvatarRm');
      if (rmBtn) rmBtn.onclick = function () {
        delete u.avatarImg;
        avatarBox.innerHTML = avatarHTML(u);
        toast('已移除图片头像');
      };

      body.querySelector('#mySave').onclick = function () {
        var nick = body.querySelector('#myNick').value.trim();
        var birth = body.querySelector('#myBirth').value.trim();
        if (nick) u.nick = nick;
        if (birth) u.birth = birth;
        var s = Store.get('chat_settings', { replyMin: 1, replyMax: 3 });
        var mn = parseFloat(body.querySelector('#myRMin').value);
        var mx = parseFloat(body.querySelector('#myRMax').value);
        if (mn > 0) s.replyMin = mn;
        if (mx > 0) s.replyMax = mx;
        Store.set('chat_settings', s);
        Store.set('profile', p);
        Shell.renderWidget();
        Shell.refreshBadges();
        toast('已保存 ✨');
      };
    }
  });
})();
