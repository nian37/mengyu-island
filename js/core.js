/* ================= 梦屿 · 核心工具 ================= */
window.Store = {
  _p: 'mengyu_',
  get(k, fb) {
    try { const v = localStorage.getItem(this._p + k); return v == null ? fb : JSON.parse(v); }
    catch (e) { return fb; }
  },
  set(k, v) { try { localStorage.setItem(this._p + k, JSON.stringify(v)); } catch (e) {} }
};

window.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };

window.esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};

window.todayStr = function () {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

window.nowStr = function () {
  var d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

window.fmtDate = function (iso) {
  var d = new Date(iso + 'T00:00:00');
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
};

window.toast = function (msg) {
  var t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
};

window.avatarHTML = function (d) {
  d = d || {};
  if (d.avatarImg) return '<img class="ava-img" src="' + d.avatarImg + '" alt="头像">';
  return esc(d.avatar || '🌙');
};

/* 相册/相机：复用页面常驻的隐藏 <input type=file> 唤起系统选择器
   动态创建并立即 click() 的 input 在 iOS Safari / 部分 WebView 无法拉起相册相机 */
window.pickImage = function (onPick) {
  _pickFile('pickerImage', onPick);
};

/* 调用相机拍摄（真机优先打开相机，桌面端回退到文件选择） */
window.pickCamera = function (onPick) {
  _pickFile('pickerCamera', onPick);
};

function _pickFile(id, onPick) {
  var inp = document.getElementById(id);
  if (!inp) return;
  inp.value = ''; // 清空旧值，保证重复选择同一张图片也能触发 change
  inp.onchange = function () {
    var f = inp.files && inp.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () { onPick(rd.result); };
    rd.readAsDataURL(f);
  };
  inp.click();
}

/* ================= 弹窗 ================= */
window.Modal = {
  _cfg: null,
  show(cfg) {
    var root = document.getElementById('modalRoot');
    var footer = cfg.footer != null ? cfg.footer
      : '<div class="modal-foot"><button class="btn primary" data-m="ok">确定</button><button class="btn ghost" data-m="cancel">取消</button></div>';
    root.innerHTML =
      '<div class="modal-mask"></div>' +
      '<div class="modal-card">' +
        '<div class="modal-title">' + esc(cfg.title || '') + '</div>' +
        '<div class="modal-body">' + (cfg.body || '') + '</div>' +
        footer +
      '</div>';
    root.hidden = false;
    this._cfg = cfg;
    if (cfg.onMount) cfg.onMount(root.querySelector('.modal-body'), root);
  },
  close() {
    var root = document.getElementById('modalRoot');
    root.hidden = true; root.innerHTML = ''; this._cfg = null;
  }
};

document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-m]');
  if (!t) return;
  if (!t.closest('#modalRoot')) return;
  var act = t.getAttribute('data-m');
  var cfg = window.Modal._cfg;
  if (act === 'ok') {
    if (cfg && cfg.onOk) cfg.onOk(document.getElementById('modalRoot'));
    else window.Modal.close();
  } else if (act === 'cancel') {
    if (cfg && cfg.onCancel) cfg.onCancel(document.getElementById('modalRoot'));
    else window.Modal.close();
  }
});
document.addEventListener('click', function (e) {
  if (e.target.classList && e.target.classList.contains('modal-mask')) window.Modal.close();
});

window.promptModal = function (opts) {
  var input;
  window.Modal.show({
    title: opts.title || '',
    body: '<input class="inp" id="pmInput" placeholder="' + esc(opts.placeholder || '') + '" value="' + esc(opts.value || '') + '">',
    footer: '<div class="modal-foot"><button class="btn primary" data-m="ok">' + esc(opts.okText || '确定') + '</button><button class="btn ghost" data-m="cancel">取消</button></div>',
    onMount: function () { input = document.getElementById('pmInput'); input.focus(); },
    onOk: function () {
      var v = input.value.trim();
      if (opts.onOk) opts.onOk(v);
      window.Modal.close();
    }
  });
};

window.askSecretCode = function (setting) {
  return new Promise(function (resolve) {
    var input;
    window.Modal.show({
      title: '🔑 暗号验证',
      body: '<p class="muted sm" style="text-align:center">梦角的这条消息需要暗号才能送达，<br>请输入你设置的暗号：</p>' +
            '<input class="inp" id="scInput" type="password" autocomplete="off" style="margin-top:10px">' +
            '<div class="sc-err" id="scErr" hidden>暗号错误，消息被拦截了…</div>',
      footer: '<div class="modal-foot"><button class="btn primary" data-m="ok">验证</button><button class="btn ghost" data-m="cancel">取消</button></div>',
      onMount: function () { input = document.getElementById('scInput'); input.focus(); },
      onOk: function () {
        var v = input.value.trim();
        if (v === setting.code) { window.Modal.close(); resolve(true); }
        else {
          var err = document.getElementById('scErr');
          if (err) err.hidden = false;
          input.classList.add('shake');
          setTimeout(function () { input.classList.remove('shake'); }, 400);
        }
      },
      onCancel: function () { window.Modal.close(); resolve(false); }
    });
  });
};

/* 暗号验证由梦角输入：梦角要发消息时，需输入用户设置的暗号才能送达 */
window.askDreamCode = function (setting) {
  return new Promise(function (resolve) {
    var input;
    window.Modal.show({
      title: '🔑 梦角验证暗号',
      body: '<p class="muted sm" style="text-align:center">梦角想给你发消息，需要先输入你设置的暗号证明身份～<br>（帮梦角输入暗号吧）</p>' +
            '<input class="inp" id="scInput" type="password" autocomplete="off" style="margin-top:10px">' +
            '<div class="sc-err" id="scErr" hidden>暗号错误，梦角的消息被拦截了…</div>',
      footer: '<div class="modal-foot"><button class="btn primary" data-m="ok">验证</button><button class="btn ghost" data-m="cancel">取消</button></div>',
      onMount: function () { input = document.getElementById('scInput'); input.focus(); },
      onOk: function () {
        var v = input.value.trim();
        if (v === setting.code) { window.Modal.close(); resolve(true); }
        else {
          var err = document.getElementById('scErr');
          if (err) err.hidden = false;
          input.classList.add('shake');
          setTimeout(function () { input.classList.remove('shake'); }, 400);
        }
      },
      onCancel: function () { window.Modal.close(); resolve(false); }
    });
  });
};

/* ================= 日历组件 ================= */
window.Cal = {
  render(el, y, m, opts) {
    var first = new Date(y, m - 1, 1);
    var startDay = first.getDay();
    var daysIn = new Date(y, m, 0).getDate();
    var prevDays = new Date(y, m - 1, 0).getDate();
    var weeks = Math.ceil((startDay + daysIn) / 7);
    var weekNames = ['日', '一', '二', '三', '四', '五', '六'];
    var html =
      '<div class="cal-head">' +
        '<button class="cal-nav" data-nav="-1">‹</button>' +
        '<div class="cal-title">' + y + '年' + m + '月</div>' +
        '<button class="cal-nav" data-nav="1">›</button>' +
      '</div>' +
      '<div class="cal-week">' + weekNames.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
      '<div class="cal-grid">';
    for (var i = 0; i < startDay; i++) {
      html += '<div class="cal-day other">' + (prevDays - startDay + i + 1) + '</div>';
    }
    for (var d = 1; d <= daysIn; d++) {
      var dateStr = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var cls = 'cal-day' + (opts.dayClass ? ' ' + opts.dayClass(dateStr) : '');
      html += '<div class="' + cls + '" data-date="' + dateStr + '">' + d + (opts.dayContent ? opts.dayContent(dateStr) : '') + '</div>';
    }
    var cells = startDay + daysIn;
    for (var k = cells; k < weeks * 7; k++) {
      html += '<div class="cal-day other">' + (k - cells + 1) + '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
    el.querySelectorAll('.cal-nav').forEach(function (b) {
      b.onclick = function () {
        var n = +b.getAttribute('data-nav');
        var ny = y, nm = m + n;
        if (nm < 1) { nm = 12; ny--; }
        if (nm > 12) { nm = 1; ny++; }
        if (opts.onMonth) opts.onMonth(ny, nm); else window.Cal.render(el, ny, nm, opts);
      };
    });
    el.querySelectorAll('.cal-day[data-date]').forEach(function (c) {
      c.onclick = function () {
        if (opts.onPick) opts.onPick(c.getAttribute('data-date'), c);
      };
    });
  }
};
