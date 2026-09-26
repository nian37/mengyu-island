/* ================= 梦角小屋（头像 / 昵称设置） ================= */
(function () {
  var EMOJIS = ['🌙', '🌷', '🐰', '🦊', '🐺', '🦋', '🌸', '⭐', '🌊', '🔥', '🍃', '🧸', '🐱', '🦄', '👑', '💫', '🌹', '🫧', '☁️', '🎐'];

  Shell.register({
    id: 'dreamset',
    name: '梦角小屋',
    icon: '🏠',
    color: 'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    badge: function () { return 0; },
    render: function (body) {
      var prof = Store.get('profile', { user: {}, dream: {} });
      var d = prof.dream;

      body.innerHTML =
        '<div class="panel">' +
          '<h3>梦角的头像</h3>' +
          '<div class="avatar-big" id="dsAvatar">' + avatarHTML(d) + '</div>' +
          '<div class="emoji-pick" id="dsEmojis">' + EMOJIS.map(function (e) {
            return '<span class="emoji-it" data-e="' + e + '">' + e + '</span>';
          }).join('') + '</div>' +
          '<div class="row" style="margin-bottom:8px">' +
            '<input class="inp" id="dsAvatarText" placeholder="自定义头像（文字/emoji）">' +
            '<button class="btn small primary" id="dsAvatarTextBtn">使用</button>' +
          '</div>' +
          '<div class="row">' +
            '<input type="file" id="dsAvatarFile" accept="image/*" hidden>' +
            '<button class="btn small ghost" id="dsAvatarFileBtn">📷 从相册选择</button>' +
            (d.avatarImg ? '<button class="btn small ghost" id="dsAvatarRm">移除图片</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3>昵称</h3>' +
          '<input class="inp" id="dsNick" value="' + esc(d.nick || '') + '" placeholder="给梦角起个名字">' +
        '</div>' +
        '<div class="panel">' +
          '<h3>陪伴语（显示在主界面）</h3>' +
          '<input class="inp" id="dsGreet" value="' + esc(d.greet || '') + '" placeholder="如：我在梦里等你">' +
        '</div>' +
        '<button class="btn primary big" id="dsSave">保存</button>' +
        '<p class="muted sm center" style="margin-top:8px">保存后，梦角会以新形象出现在各个应用中</p>';

      var avatarBox = body.querySelector('#dsAvatar');

      body.querySelector('#dsEmojis').onclick = function (e) {
        var t = e.target.closest('.emoji-it');
        if (!t) return;
        body.querySelectorAll('.emoji-it').forEach(function (x) { x.classList.remove('sel'); });
        t.classList.add('sel');
        d.avatar = t.getAttribute('data-e');
        delete d.avatarImg;
        avatarBox.innerHTML = avatarHTML(d);
      };

      body.querySelector('#dsAvatarTextBtn').onclick = function () {
        var v = body.querySelector('#dsAvatarText').value.trim();
        if (!v) return;
        d.avatar = v;
        delete d.avatarImg;
        avatarBox.innerHTML = avatarHTML(d);
      };

      body.querySelector('#dsAvatarFileBtn').onclick = function () {
        body.querySelector('#dsAvatarFile').click();
      };
      body.querySelector('#dsAvatarFile').addEventListener('change', function (e) {
        var f = e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          d.avatarImg = r.result;
          avatarBox.innerHTML = avatarHTML(d);
          toast('头像已更新，记得保存');
        };
        r.readAsDataURL(f);
      });
      var rmBtn = body.querySelector('#dsAvatarRm');
      if (rmBtn) rmBtn.onclick = function () {
        delete d.avatarImg;
        avatarBox.innerHTML = avatarHTML(d);
        toast('已移除图片头像');
      };

      body.querySelector('#dsSave').onclick = function () {
        var nick = body.querySelector('#dsNick').value.trim();
        var greet = body.querySelector('#dsGreet').value.trim();
        if (nick) d.nick = nick;
        if (greet) d.greet = greet;
        Store.set('profile', prof);
        Shell.renderWidget();
        toast('梦角形象已更新 ✨');
      };
    }
  });
})();
