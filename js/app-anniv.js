/* ================= 纪念日 ================= */
(function () {
  function data() { return Store.get('anniv', { list: [] }); }
  function save(d) { Store.set('anniv', d); }

  function dms(iso) { return new Date(iso + 'T00:00:00').getTime(); }
  function daysBetween(a, b) { return Math.round((dms(b) - dms(a)) / 86400000); }

  /* 每年庆祝的纪念日：计算距离下一次周年的天数 */
  function nextAnnual(it) {
    var today = new Date();
    var md = it.date.slice(5);
    var year = today.getFullYear();
    var gap = daysBetween(todayStr(), year + '-' + md);
    if (gap >= 0) return { days: gap, isToday: gap === 0, anniv: year - +it.date.slice(0, 4) };
    var nextYear = year + 1;
    return { days: daysBetween(todayStr(), nextYear + '-' + md), isToday: false, anniv: nextYear - +it.date.slice(0, 4) };
  }

  /* 「在一起」起始日：优先用标记过的，否则用日期最早的一条 */
  function togetherItem(list) {
    var t = list.filter(function (i) { return i.together; });
    if (t.length) return t[0];
    if (!list.length) return null;
    return list.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];
  }

  function render(body) {
    var list = data().list;

    var hero = '';
    var ti = togetherItem(list);
    if (ti) {
      var days = Math.max(0, daysBetween(ti.date, todayStr()));
      hero =
        '<div class="anniv-hero">' +
          '<div class="anniv-hero-ico">💞</div>' +
          '<div class="anniv-hero-num">' + days + '</div>' +
          '<div class="anniv-hero-label">天 · 从「' + esc(ti.name) + '」开始相伴</div>' +
        '</div>';
    } else {
      hero = '<div class="empty-tip">还没有纪念日，点击下方按钮记录第一个吧 💞</div>';
    }

    body.innerHTML =
      '<div class="anniv-wrap">' + hero +
        '<div class="row" style="margin:4px 0 12px">' +
          '<button class="btn primary small" id="annivAdd">＋ 记录纪念日</button>' +
        '</div>' +
        '<div id="annivList"></div>' +
      '</div>';

    function drawList() {
      var box = body.querySelector('#annivList');
      if (!list.length) { box.innerHTML = '<div class="empty-tip">💌 把重要的日子都记下来吧</div>'; return; }
      box.innerHTML = list.map(function (it, i) {
        var status;
        if (it.annual) {
          var na = nextAnnual(it);
          status = na.isToday
            ? '<span class="anniv-status today">🎉 就是今天 · ' + na.anniv + ' 周年</span>'
            : '<span class="anniv-status">距 ' + na.anniv + ' 周年还有 ' + na.days + ' 天</span>';
        } else {
          var days = daysBetween(it.date, todayStr());
          status = '<span class="anniv-status">' + (days < 0 ? '还没到来' : (days === 0 ? '🎉 就是今天' : '已 ' + days + ' 天')) + '</span>';
        }
        return '<div class="anniv-item" data-i="' + i + '">' +
          '<div class="anniv-ico">' + (it.icon || '📅') + '</div>' +
          '<div class="anniv-main">' +
            '<div class="anniv-name">' + esc(it.name) + (it.together ? ' <span class="mode-chip">💞 起始</span>' : '') + '</div>' +
            '<div class="anniv-date">' + fmtDate(it.date) + '</div>' +
          '</div>' +
          status +
          '<button class="btn small ghost" data-del="' + i + '">🗑️</button>' +
        '</div>';
      }).join('');

      box.querySelectorAll('[data-del]').forEach(function (b) {
        b.onclick = function (ev) {
          ev.stopPropagation();
          var i = +b.getAttribute('data-del');
          var d = data();
          d.list.splice(i, 1);
          save(d);
          render(body);
        };
      });
      box.querySelectorAll('.anniv-item').forEach(function (el) {
        el.onclick = function () { editModal(body, +el.getAttribute('data-i')); };
      });
    }

    body.querySelector('#annivAdd').onclick = function () { editModal(body, -1); };
    drawList();
  }

  function editModal(body, idx) {
    var d = data();
    var isNew = idx < 0;
    var it = isNew
      ? { name: '', date: todayStr(), icon: '💞', annual: true, together: d.list.length === 0 }
      : d.list[idx];
    window.Modal.show({
      title: isNew ? '记录纪念日' : '编辑纪念日',
      body:
        '<div class="field-row"><div class="field-label">图标（emoji）</div>' +
          '<input class="inp" id="anIcon" value="' + esc(it.icon || '') + '" placeholder="如：💞">' +
        '</div>' +
        '<div class="field-row"><div class="field-label">名称</div>' +
          '<input class="inp" id="anName" value="' + esc(it.name) + '" placeholder="如：我们在一起">' +
        '</div>' +
        '<div class="field-row"><div class="field-label">日期</div>' +
          '<input class="inp" id="anDate" type="date" value="' + esc(it.date) + '">' +
        '</div>' +
        '<label class="switch-row"><span>🎉 每年庆祝（纪念日）</span><input type="checkbox" id="anAnnual" ' + (it.annual ? 'checked' : '') + '></label>' +
        '<label class="switch-row"><span>💞 作为「在一起」起始日</span><input type="checkbox" id="anTogether" ' + (it.together ? 'checked' : '') + '></label>' +
        '<p class="muted sm">「在一起」起始日用于计算主卡片上相伴的天数</p>',
      footer: '<div class="modal-foot">' +
        '<button class="btn primary" data-m="ok">保存</button>' +
        '<button class="btn ghost" data-m="cancel">取消</button>' +
      '</div>',
      onOk: function () {
        var name = document.getElementById('anName').value.trim();
        var date = document.getElementById('anDate').value.trim();
        if (!name || !date) { toast('请填写名称和日期'); return; }
        it.name = name;
        it.date = date;
        it.icon = document.getElementById('anIcon').value.trim() || '📅';
        it.annual = document.getElementById('anAnnual').checked;
        it.together = document.getElementById('anTogether').checked;
        if (it.together) d.list.forEach(function (x) { if (x !== it) x.together = false; });
        if (isNew) d.list.push(it);
        save(d);
        window.Modal.close();
        render(body);
        toast('已保存 💞');
      }
    });
  }

  Shell.register({
    id: 'anniv',
    name: '纪念日',
    icon: '💞',
    color: 'linear-gradient(135deg,#ffd1ff,#a6c1ee)',
    badge: function () { return 0; },
    render: function (body) { render(body); }
  });
})();
