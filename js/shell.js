/* ================= 梦屿 · 手机外壳 ================= */
window.Shell = {
  apps: [],
  current: null,

  register(a) { this.apps.push(a); },

  init() {
    this.renderHome();
    this.updateClock();
    setInterval(function () { Shell.updateClock(); }, 1000);
    document.getElementById('appbarBack').addEventListener('click', function () { Shell.goHome(); });
    document.getElementById('homedot').addEventListener('click', function () { Shell.goHome(); });
    this.refreshBadges();
    this.wireWallpaper();
    this.applyTheme();
    this.applyCustomCss();
    this.applyWallpaper();
  },

  /* ---------- 主题 ---------- */
  THEMES: [
    { id: 'dream-white', icon: '☁️', name: '梦境灰白', desc: '冷调白灰，晨雾与星光的颜色' },
    { id: 'pink-heart', icon: '💗', name: '粉色爱心', desc: '甜甜的粉色，像心动的颜色' },
    { id: 'purple-star', icon: '🌌', name: '紫色星空', desc: '静谧的紫，梦境的颜色' },
    { id: 'mint-fresh', icon: '🌿', name: '薄荷清新', desc: '清爽的薄荷，元气满满' },
    { id: 'ocean-blue', icon: '🌊', name: '蔚蓝深海', desc: '深邃的蓝，海洋的呼吸' },
    { id: 'sunset-orange', icon: '🌇', name: '落日橘光', desc: '暖暖的橘，黄昏的浪漫' },
    { id: 'aurora-green', icon: '🌠', name: '极光之梦', desc: '莹绿的极光，在北纬等你' }
  ],

  themeGradient(id) {
    var map = {
      'dream-white': 'linear-gradient(135deg,#f8f8fc,#dfe1ec)',
      'pink-heart': 'linear-gradient(135deg,#3d1030,#7d255c)',
      'purple-star': 'linear-gradient(135deg,#241343,#57226e)',
      'mint-fresh': 'linear-gradient(135deg,#0b2f3a,#1a5d6f)',
      'ocean-blue': 'linear-gradient(135deg,#0a2445,#1a4f85)',
      'sunset-orange': 'linear-gradient(135deg,#42141a,#9c4522)',
      'aurora-green': 'linear-gradient(135deg,#093330,#187262)'
    };
    return map[id] || map['dream-white'];
  },

  applyTheme() {
    var t = Store.get('theme', 'dream-white');
    var ok = this.THEMES.some(function (x) { return x.id === t; });
    var id = ok ? t : 'dream-white';
    document.body.setAttribute('data-theme', id);
    /* 状态栏颜色跟随主题（iOS/Android 系统状态栏） */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var map = { 'dream-white': '#f8f8fc', 'pink-heart': '#2b0e1f', 'purple-star': '#0f0a1e', 'mint-fresh': '#06222a', 'ocean-blue': '#04172e', 'sunset-orange': '#2e0a12', 'aurora-green': '#052020' };
      meta.setAttribute('content', map[id] || '#f8f8fc');
    }
  },

  themeModal() {
    var self = this;
    var cur = Store.get('theme', 'dream-white');
    window.Modal.show({
      title: '🎨 选择主题',
      body: '<p class="muted sm center">换一个喜欢的主题色，梦屿也会跟着变装哦</p>' +
            '<div class="place-grid" style="margin-top:12px" id="themeGrid">' +
            self.THEMES.map(function (t) {
              return '<div class="place-card" data-t="' + t.id + '">' +
                '<div class="theme-prev" style="background:' + self.themeGradient(t.id) + '">' + (t.id === cur ? '✓' : '') + '</div>' +
                '<div class="place-ico">' + t.icon + '</div>' +
                '<div class="place-name">' + t.name + '</div>' +
                '<div class="place-desc">' + t.desc + '</div>' +
              '</div>';
            }).join('') + '</div>',
      footer: '<div class="modal-foot"><button class="btn ghost" data-m="cancel">关闭</button></div>',
      onMount: function (b, root) {
        var c = Store.get('theme', 'dream-white');
        b.querySelectorAll('.place-card').forEach(function (card) {
          if (card.getAttribute('data-t') === c) card.classList.add('sel');
          card.onclick = function () {
            b.querySelectorAll('.place-card').forEach(function (x) { x.classList.remove('sel'); });
            card.classList.add('sel');
            var t = card.getAttribute('data-t');
            Store.set('theme', t);
            self.applyTheme();
            if (typeof self.renderThemeStrip === 'function') self.renderThemeStrip();
            b.querySelectorAll('.theme-prev').forEach(function (p) {
              p.textContent = p.parentNode.getAttribute('data-t') === t ? '✓' : '';
            });
            toast('主题已切换为 ' + self.THEMES.find(function (x) { return x.id === t; }).name);
          };
        });
      }
    });
  },

  /* 主界面主题快捷切换条（一键换肤入口） */
  renderThemeStrip() {
    var el = document.getElementById('themeStrip');
    if (!el) return;
    var cur = Store.get('theme', 'dream-white');
    el.innerHTML = this.THEMES.map(function (t) {
      return '<button class="theme-dot' + (t.id === cur ? ' sel' : '') + '" data-t="' + t.id + '"' +
        ' style="background:' + Shell.themeGradient(t.id) + '" title="' + t.name + '"></button>';
    }).join('');
    el.onclick = function (e) {
      var dot = e.target.closest('.theme-dot');
      if (!dot) return;
      var t = dot.getAttribute('data-t');
      Store.set('theme', t);
      Shell.applyTheme();
      Shell.renderThemeStrip();
      var th = Shell.THEMES.find(function (x) { return x.id === t; });
      toast('主题已切换为 ' + th.icon + ' ' + th.name);
    };
  },

  /* ---------- 主屏壁纸 ---------- */
  wireWallpaper() {
    var btn = document.getElementById('wallBtn');
    if (btn) btn.onclick = function () { Shell.wallpaperModal(); };
    var tb = document.getElementById('themeBtn');
    if (tb) tb.onclick = function () { Shell.themeModal(); };
    var cb = document.getElementById('cssBtn');
    if (cb) cb.onclick = function () { Shell.customCssModal(); };
  },

  applyWallpaper() {
    var home = document.getElementById('home');
    if (!home) return;
    var wp = Store.get('home_wallpaper', '');
    if (wp) home.style.background = 'linear-gradient(rgba(12,7,26,.62), rgba(12,7,26,.62)), url(' + wp + ') center/cover no-repeat fixed';
    else home.style.background = '';
  },

  wallpaperModal() {
    window.Modal.show({
      title: '🎨 主界面壁纸',
      body: '<p class="muted sm center">从相册选一张喜欢的图片<br>作为主界面的壁纸吧～</p>',
      footer: '<div class="modal-foot">' +
        '<button class="btn primary" id="wpPick">📷 从相册选择</button>' +
        '<button class="btn ghost" id="wpReset">恢复默认</button>' +
      '</div>',
      onMount: function (b, root) {
        root.querySelector('#wpPick').onclick = function () {
          window.pickImage(function (data) {
            Store.set('home_wallpaper', data);
            Shell.applyWallpaper();
            window.Modal.close();
            toast('壁纸已更换 ✨');
          });
        };
        root.querySelector('#wpReset').onclick = function () {
          Store.set('home_wallpaper', '');
          Shell.applyWallpaper();
          window.Modal.close();
          toast('已恢复默认壁纸');
        };
      }
    });
  },

  /* ---------- 自定义 CSS ---------- */
  applyCustomCss(css) {
    if (css === undefined) css = Store.get('custom_css', '');
    var el = document.getElementById('customStyle');
    if (!el) {
      el = document.createElement('style');
      el.id = 'customStyle';
      document.head.appendChild(el);
    }
    el.textContent = css || '';
  },

  customCssModal() {
    var css = Store.get('custom_css', '');
    window.Modal.show({
      title: '🛠 自定义 CSS',
      body: '<p class="muted sm center">粘贴自定义样式，实时预览、覆盖任意主题<br>例：<code>body[data-theme] { --bg-1:#101010; }</code></p>' +
            '<textarea class="css-editor" id="cssEditor" spellcheck="false" placeholder="/* 在这里写你的自定义样式… */">' + esc(css) + '</textarea>',
      footer: '<div class="modal-foot">' +
        '<button class="btn primary" id="cssSave">💾 保存并应用</button>' +
        '<button class="btn ghost" id="cssReset">恢复默认</button>' +
        '<button class="btn ghost" data-m="cancel">关闭</button>' +
      '</div>',
      onMount: function (b, root) {
        var ta = root.querySelector('#cssEditor');
        ta.oninput = function () { Shell.applyCustomCss(ta.value); }; // 实时预览
        root.querySelector('#cssSave').onclick = function () {
          Store.set('custom_css', ta.value);
          Shell.applyCustomCss();
          window.Modal.close();
          toast('自定义样式已保存 ✨');
        };
        root.querySelector('#cssReset').onclick = function () {
          Store.set('custom_css', '');
          Shell.applyCustomCss();
          ta.value = '';
          toast('已恢复默认样式');
        };
      }
    });
  },

  updateClock() {
    var d = new Date();
    var el = document.getElementById('sb-time');
    if (el) el.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    var ct = document.getElementById('clockTime');
    if (ct) {
      ct.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
    }
    var cd = document.getElementById('clockDate');
    if (cd) {
      var weeks = ['日', '一', '二', '三', '四', '五', '六'];
      cd.textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 · 星期' + weeks[d.getDay()];
    }
  },

  renderHome() {
    var grid = document.getElementById('appgrid');
    grid.innerHTML = this.apps.map(function (a) {
      return '<div class="app-icon" data-id="' + a.id + '">' +
        '<div class="app-ico" style="background:' + a.color + '">' + a.icon +
          '<span class="badge" id="badge-' + a.id + '" hidden></span>' +
        '</div>' +
        '<div class="app-name">' + esc(a.name) + '</div>' +
      '</div>';
    }).join('');
    grid.onclick = function (e) {
      var el = e.target.closest('.app-icon');
      if (el) Shell.open(el.getAttribute('data-id'));
    };
    this.renderWidget();
    this.renderThemeStrip();
  },

  greetingOf() {
    var h = new Date().getHours();
    if (h < 5) return '夜深了';
    if (h < 11) return '早安';
    if (h < 14) return '午安';
    if (h < 18) return '下午好';
    return '晚安';
  },

  renderWidget() {
    var prof = Store.get('profile', { user: {}, dream: {} });
    var d = prof.dream || {};
    var el = document.getElementById('homeWidget');
    if (!el) return;
    el.innerHTML =
      '<div class="widget-inner">' +
        '<div class="widget-ava">' + avatarHTML(d) + '</div>' +
        '<div class="widget-text">' +
          '<div class="widget-name">' + esc(d.nick || '梦角') + ' · ' + this.greetingOf() + '</div>' +
          '<div class="widget-line">' + esc(d.greet || '我在梦里等你，今天也想你了。') + '</div>' +
        '</div>' +
        '<div class="widget-go">›</div>' +
      '</div>';
    el.onclick = function () { Shell.open('companion'); };
  },

  open(id) {
    var app = this.apps.find(function (a) { return a.id === id; });
    if (!app) return;
    this.current = app;
    document.getElementById('appbarTitle').textContent = app.name;
    document.getElementById('home').hidden = true;
    document.getElementById('appview').hidden = false;
    document.querySelector('.homedot').classList.add('show');
    var body = document.getElementById('appbody');
    body.innerHTML = '';
    body.scrollTop = 0;
    app.render(body);
    this.refreshBadges();
  },

  goHome() {
    this.current = null;
    document.getElementById('appview').hidden = true;
    document.getElementById('home').hidden = false;
    document.querySelector('.homedot').classList.remove('show');
    this.updateClock();
    this.refreshBadges();
  },

  refreshBadges() {
    var self = this;
    this.apps.forEach(function (a) {
      var b = document.getElementById('badge-' + a.id);
      if (!b) return;
      var n = a.badge ? a.badge() : 0;
      if (n > 0) { b.hidden = false; b.textContent = n > 99 ? '99+' : n; }
      else b.hidden = true;
    });
    if (this.current === null) self.renderWidget();
  }
};
