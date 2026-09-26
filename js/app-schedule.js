/* ================= 日程记录 ================= */
(function () {
  var COLORS = ['#ff7eb3', '#a18cd1', '#7ec8ff', '#84fab0', '#ffd93d'];

  function events() { return Store.get('events', []); }
  function save(evs) { Store.set('events', evs); }

  function whoTag(who) {
    return who === 'dream' ? '<span class="who-tag tag-dream">梦角</span>' : '<span class="who-tag tag-user">用户</span>';
  }

  function renderDay(body, evs, sel) {
    var box = body.querySelector('#dayEvts');
    if (sel) {
      var list = evs.filter(function (e) { return e.date === sel; });
      if (!list.length) { box.innerHTML = '<div class="empty-tip">' + fmtDate(sel) + ' 还没有日程</div>'; return; }
      box.innerHTML = '<h3>' + fmtDate(sel) + '</h3>' + list.map(function (e) {
        return evtItem(e);
      }).join('');
    } else {
      var now = todayStr();
      var upcoming = evs.filter(function (e) { return e.date >= now; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      if (!upcoming.length) { box.innerHTML = '<div class="empty-tip">暂无待办日程</div>'; return; }
      box.innerHTML = '<h3>最近日程</h3>' + upcoming.slice(0, 15).map(function (e) { return evtItem(e); }).join('');
    }
    box.querySelectorAll('[data-del-evt]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-del-evt');
        var evs2 = events().filter(function (e) { return e.id !== id; });
        save(evs2);
        renderDay(body, evs2, sel);
        var n = new Date();
        drawCal(n.getFullYear(), n.getMonth() + 1, sel);
      };
    });
  }

  function evtItem(e) {
    var color = e.color || COLORS[0];
    return '<div class="evt-item">' +
      '<div class="evt-dot" style="background:' + color + '"></div>' +
      '<div class="evt-main"><div class="evt-title">' + esc(e.title) + '</div>' +
        '<div class="evt-time">' + esc(e.date) + (e.time ? ' ' + esc(e.time) : '') + '</div></div>' +
      whoTag(e.who) +
      '<button class="btn small ghost" data-del-evt="' + e.id + '">🗑️</button>' +
    '</div>';
  }

  function addEvt(body, redraw) {
    var today = todayStr();
    var who = 'user';
    var color = COLORS[0];
    window.Modal.show({
      title: '添加日程',
      body:
        '<div class="row" style="margin-bottom:10px">' +
          '<button class="btn small primary" id="evWhoU">以用户</button>' +
          '<button class="btn small ghost" id="evWhoD">以梦角</button>' +
        '</div>' +
        '<input class="inp" id="evTitle" placeholder="日程内容，如：和梦角看星星">' +
        '<div class="row" style="margin-top:8px">' +
          '<input class="inp" type="date" id="evDate" value="' + today + '">' +
          '<input class="inp" type="time" id="evTime" value="20:00" style="flex:0 0 110px">' +
        '</div>' +
        '<div class="row" style="margin-top:10px" id="evColors">' +
          COLORS.map(function (c, i) {
            return '<button class="btn small" data-c="' + c + '" style="background:' + c + ';width:34px;padding:6px" data-idx="' + i + '"></button>';
          }).join('') +
        '</div>' +
        '<div class="row" style="margin-top:12px">' +
          '<button class="btn primary" id="evSave">添加</button>' +
          '<button class="btn small ghost" data-m="cancel">取消</button>' +
        '</div>',
      footer: '',
      onMount: function (b) {
        function setWho(w) {
          who = w;
          b.querySelector('#evWhoU').classList.toggle('primary', w === 'user');
          b.querySelector('#evWhoU').classList.toggle('ghost', w !== 'user');
          b.querySelector('#evWhoD').classList.toggle('primary', w === 'dream');
          b.querySelector('#evWhoD').classList.toggle('ghost', w !== 'dream');
        }
        b.querySelector('#evWhoU').onclick = function () { setWho('user'); };
        b.querySelector('#evWhoD').onclick = function () { setWho('dream'); };
        b.querySelectorAll('#evColors .btn').forEach(function (btn) {
          btn.onclick = function () { color = btn.getAttribute('data-c'); };
        });
        b.querySelector('#evSave').onclick = function () {
          var title = b.querySelector('#evTitle').value.trim();
          var date = b.querySelector('#evDate').value;
          if (!title || !date) { toast('请填写内容和日期'); return; }
          var evs = events();
          evs.push({ id: uid(), title: title, date: date, time: b.querySelector('#evTime').value, who: who, color: color });
          save(evs);
          window.Modal.close();
          redraw();
          toast('日程已添加');
        };
      }
    });
  }

  var drawCal;
  Shell.register({
    id: 'schedule',
    name: '日程表',
    icon: '📅',
    color: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
    badge: function () { return 0; },
    render: function (body) {
      var sel = todayStr();
      body.innerHTML =
        '<div class="row" style="margin-bottom:12px">' +
          '<button class="btn primary" id="addEvt">＋ 添加日程</button>' +
          '<span class="muted sm">梦角也可添加，用户可查看全部</span>' +
        '</div>' +
        '<div class="cal-wrap" id="calBox"></div>' +
        '<div class="panel" id="dayEvts"></div>';

      drawCal = function (y, m, keepSel) {
        if (keepSel) sel = keepSel;
        var evs = events();
        Cal.render(body.querySelector('#calBox'), y, m, {
          dayClass: function (ds) {
            var c = '';
            if (ds === sel) c += ' today';
            if (evs.some(function (e) { return e.date === ds; })) c += ' dot';
            return c;
          },
          onPick: function (ds) { sel = ds; drawCal(y, m); },
          onMonth: function (ny, nm) { sel = ''; drawCal(ny, nm); }
        });
        renderDay(body, evs, sel);
      };

      var n = new Date();
      drawCal(n.getFullYear(), n.getMonth() + 1);
      body.querySelector('#addEvt').onclick = function () {
        addEvt(body, function () {
          var nn = new Date();
          drawCal(nn.getFullYear(), nn.getMonth() + 1, sel);
        });
      };
    }
  });
})();
