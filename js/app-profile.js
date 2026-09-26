/* ================= 个人信息 ================= */
(function () {
  var FIELDS = [
    { f: 'nick', label: '昵称', type: 'text' },
    { f: 'birth', label: '生日', type: 'date' },
    { f: 'star', label: '星座', type: 'text', ph: '如：天秤座' },
    { f: 'like', label: '喜欢', type: 'text', ph: '喜欢的事物' },
    { f: 'dislike', label: '不喜欢', type: 'text', ph: '不喜欢的事物' },
    { f: 'hobby', label: '爱好', type: 'text', ph: '爱好' },
    { f: 'intro', label: '简介', type: 'textarea', ph: '介绍一下自己吧' },
    { f: 'avatar', label: '头像（文字或 emoji）', type: 'text', ph: '如：🌸' }
  ];

  function fieldsHTML(o) {
    return FIELDS.map(function (f) {
      var v = o[f.f] || '';
      var input = f.type === 'textarea'
        ? '<textarea class="inp ta" id="pf_' + f.f + '" placeholder="' + esc(f.ph || '') + '">' + esc(v) + '</textarea>'
        : '<input class="inp" id="pf_' + f.f + '" type="' + f.type + '" value="' + esc(v) + '" placeholder="' + esc(f.ph || '') + '">';
      return '<div class="field-row"><div class="field-label">' + f.label + '</div>' + input + '</div>';
    }).join('');
  }

  Shell.register({
    id: 'profile',
    name: '个人信息',
    icon: '👤',
    color: 'linear-gradient(135deg,#fad0c4,#ffd1ff)',
    badge: function () { return 0; },
    render: function (body) {
      var prof = Store.get('profile', { user: {}, dream: {} });
      var tab = 'user';
      body.innerHTML =
        '<div class="tabs" style="margin-bottom:12px">' +
          '<button class="tab-btn active" data-t="user">我的信息</button>' +
          '<button class="tab-btn" data-t="dream">梦角信息</button>' +
        '</div>' +
        '<div class="panel" id="pfBody"></div>';

      function draw() {
        var o = tab === 'user' ? prof.user : prof.dream;
        var box = body.querySelector('#pfBody');
        box.innerHTML = fieldsHTML(o) + '<button class="btn primary big" id="pfSave" style="margin-top:6px">保存</button>';
        box.querySelector('#pfSave').onclick = function () {
          var nw = {};
          FIELDS.forEach(function (f) {
            var el = box.querySelector('#pf_' + f.f);
            if (el) nw[f.f] = el.value.trim();
          });
          if (tab === 'user') prof.user = nw; else prof.dream = nw;
          Store.set('profile', prof);
          Shell.renderWidget();
          Shell.refreshBadges();
          toast('已保存');
        };
      }

      body.querySelectorAll('.tab-btn').forEach(function (b) {
        b.onclick = function () {
          tab = b.getAttribute('data-t');
          body.querySelectorAll('.tab-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
          draw();
        };
      });
      draw();
    }
  });
})();
