/* ================= 梦屿 · 设置 ================= */
(function () {
  var themeName = function (id) {
    var th = Shell.THEMES.find(function (x) { return x.id === id; });
    return th ? th.name : '梦境灰白';
  };

  var currentBody = null;
  var syncTheme = function () {
    if (!currentBody) return;
    var t = Store.get('theme', 'dream-white');
    var desc = currentBody.querySelector('#setThemeDesc');
    if (desc) desc.textContent = '当前：' + themeName(t);
    currentBody.querySelectorAll('.theme-dot').forEach(function (x) {
      x.classList.toggle('sel', x.getAttribute('data-t') === t);
    });
  };
  document.addEventListener('themechange', syncTheme);

  Shell.register({
    id: 'settings',
    name: '设置',
    icon: '⚙️',
    color: 'linear-gradient(135deg,#9aa0b8,#5f6b8c)',
    badge: function () { return 0; },
    render: function (body) {
      var cur = Store.get('theme', 'dream-white');
      currentBody = body;

      body.innerHTML =
        '<p class="muted sm center" style="margin-bottom:12px">所有自定义功能都搬到这里啦～</p>' +

        '<div class="panel">' +
          '<div class="panel-title">🎨 外观</div>' +
          '<div class="set-item" id="setTheme">' +
            '<div class="set-ico">🎨</div>' +
            '<div class="set-main">' +
              '<div class="set-name">主题切换</div>' +
              '<div class="set-desc" id="setThemeDesc">当前：' + esc(themeName(cur)) + '</div>' +
            '</div>' +
            '<div class="set-go">›</div>' +
          '</div>' +
          '<div class="theme-strip set-strip" id="setThemeStrip"></div>' +
          '<div class="set-item" id="setWall">' +
            '<div class="set-ico">🖼</div>' +
            '<div class="set-main">' +
              '<div class="set-name">主界面壁纸</div>' +
              '<div class="set-desc">从相册选一张图片做壁纸</div>' +
            '</div>' +
            '<div class="set-go">›</div>' +
          '</div>' +
          '<div class="set-item" id="setCss">' +
            '<div class="set-ico">🛠</div>' +
            '<div class="set-main">' +
              '<div class="set-name">自定义样式</div>' +
              '<div class="set-desc">粘贴 CSS，打造专属外观</div>' +
            '</div>' +
            '<div class="set-go">›</div>' +
          '</div>' +
        '</div>' +

        '<div class="panel">' +
          '<div class="panel-title">💾 数据</div>' +
          '<div class="set-item" id="setBackup">' +
            '<div class="set-ico">💾</div>' +
            '<div class="set-main">' +
              '<div class="set-name">数据备份</div>' +
              '<div class="set-desc">导出 / 恢复，换设备也不怕丢</div>' +
            '</div>' +
            '<div class="set-go">›</div>' +
          '</div>' +
        '</div>';

      /* 主题快速切换条 */
      var strip = body.querySelector('#setThemeStrip');
      strip.innerHTML = Shell.THEMES.map(function (t) {
        return '<button class="theme-dot' + (t.id === cur ? ' sel' : '') + '" data-t="' + t.id + '"' +
          ' style="background:' + Shell.themeGradient(t.id) + '" title="' + t.name + '"></button>';
      }).join('');
      strip.onclick = function (e) {
        var dot = e.target.closest('.theme-dot');
        if (!dot) return;
        var t = dot.getAttribute('data-t');
        Store.set('theme', t);
        Shell.applyTheme();
        var desc = body.querySelector('#setThemeDesc');
        if (desc) desc.textContent = '当前：' + themeName(t);
        body.querySelectorAll('.theme-dot').forEach(function (x) {
          x.classList.toggle('sel', x.getAttribute('data-t') === t);
        });
        toast('主题已切换为 ' + themeName(t));
      };

      body.querySelector('#setTheme').onclick = function () { Shell.themeModal(); };
      body.querySelector('#setWall').onclick = function () { Shell.wallpaperModal(); };
      body.querySelector('#setCss').onclick = function () { Shell.customCssModal(); };
      body.querySelector('#setBackup').onclick = function () { Backup.openModal(); };
    }
  });
})();
