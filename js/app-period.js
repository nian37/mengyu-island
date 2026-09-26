/* ================= 经期记录 ================= */
(function () {
  var MOODS = ['😊', '😌', '😣', '😫', '😢', '😡', '🥱'];
  var SYMS = ['腹痛', '腰酸', '头痛', '乏力', '手脚冰凉', '情绪低落', '食欲变化', '其他'];

  function dms(iso) { return new Date(iso + 'T00:00:00').getTime(); }

  function compute(st) {
    var days = Object.keys(st.days).filter(function (k) { return st.days[k].on; }).sort();
    var starts = [];
    for (var i = 0; i < days.length; i++) {
      var prev = days[i - 1];
      if (!prev || dms(days[i]) - dms(prev) > 86400000) starts.push(days[i]);
    }
    var cycle = null;
    if (starts.length >= 2) {
      var total = 0;
      for (var j = 1; j < starts.length; j++) total += (dms(starts[j]) - dms(starts[j - 1])) / 86400000;
      cycle = Math.round(total / (starts.length - 1));
    }
    var lastStart = starts.length ? starts[starts.length - 1] : null;
    var next = null;
    if (lastStart && cycle) {
      var d = new Date(dms(lastStart) + cycle * 86400000);
      next = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    return { days: days, starts: starts, lastStart: lastStart, cycle: cycle, next: next };
  }

  function renderStats(body, st) {
    var r = compute(st);
    var box = body.querySelector('#statsBox');
    box.innerHTML =
      statCard('最近经期开始', r.lastStart ? fmtDate(r.lastStart) : '—') +
      statCard('平均周期', r.cycle ? r.cycle + ' 天' : '—') +
      statCard('预计下次经期', r.next ? fmtDate(r.next) : '—') +
      statCard('经期记录天数', r.days.length + ' 天');
  }

  function statCard(label, val) {
    return '<div class="stat-card"><div class="stat-label">' + label + '</div><div class="stat-val">' + val + '</div></div>';
  }

  function showDay(body, ds, st, draw) {
    var panel = body.querySelector('#dayPanel');
    var d = st.days[ds] || {};
    var isToday = ds === todayStr();
    panel.innerHTML =
      '<h4 class="panel-title">' + fmtDate(ds) + (isToday ? '（今天）' : '') + '</h4>' +
      '<label class="switch-row"><span>🌸 经期中</span><input type="checkbox" id="dpOn" ' + (d.on ? 'checked' : '') + '></label>' +
      '<div class="mood-row" id="dpMood">' + MOODS.map(function (x) {
        return '<button class="mood ' + (d.mood === x ? 'sel' : '') + '" data-mood="' + x + '">' + x + '</button>';
      }).join('') + '</div>' +
      '<div class="row wrap" style="margin:8px 0" id="dpSym">' + SYMS.map(function (s) {
        return '<label class="chip"><input type="checkbox" value="' + s + '" ' + ((d.sym || []).indexOf(s) >= 0 ? 'checked' : '') + '>' + s + '</label>';
      }).join('') + '</div>' +
      '<textarea class="inp ta" id="dpNote" placeholder="记录这一天的心情或身体状况…">' + esc(d.note || '') + '</textarea>' +
      '<div class="row" style="margin-top:10px">' +
        '<button class="btn primary" id="dpSave">保存</button>' +
        '<button class="btn small ghost" id="dpClear">清空这天</button>' +
      '</div>';

    panel.querySelectorAll('.mood').forEach(function (m) {
      m.onclick = function () {
        panel.querySelectorAll('.mood').forEach(function (x) { x.classList.remove('sel'); });
        m.classList.add('sel');
      };
    });

    panel.querySelector('#dpSave').onclick = function () {
      var on = panel.querySelector('#dpOn').checked;
      var moodEl = panel.querySelector('.mood.sel');
      var mood = moodEl ? moodEl.getAttribute('data-mood') : '';
      var sym = [];
      panel.querySelectorAll('#dpSym input:checked').forEach(function (i) { sym.push(i.value); });
      var note = panel.querySelector('#dpNote').value.trim();
      if (!on) delete st.days[ds];
      else st.days[ds] = { on: true, mood: mood, sym: sym, note: note };
      Store.set('period', st);
      renderStats(body, st);
      var n = new Date();
      draw(n.getFullYear(), n.getMonth() + 1);
      showDay(body, ds, st, draw);
      toast('已保存');
    };

    panel.querySelector('#dpClear').onclick = function () {
      delete st.days[ds];
      Store.set('period', st);
      renderStats(body, st);
      var n = new Date();
      draw(n.getFullYear(), n.getMonth() + 1);
      showDay(body, ds, st, draw);
    };
  }

  Shell.register({
    id: 'period',
    name: '经期小记',
    icon: '🌸',
    color: 'linear-gradient(135deg,#ff9a9e,#fecfef)',
    badge: function () { return 0; },
    render: function (body) {
      var st = Store.get('period', { days: {} });
      body.innerHTML =
        '<div class="cal-wrap" id="calBox"></div>' +
        '<div class="stats-row" id="statsBox"></div>' +
        '<div class="panel" id="dayPanel"></div>';
      var draw = function (y, m) {
        var cur = st;
        Cal.render(body.querySelector('#calBox'), y, m, {
          dayClass: function (ds) {
            var c = '';
            if (cur.days[ds] && cur.days[ds].on) c += ' on';
            if (ds === todayStr()) c += ' today';
            return c;
          },
          onPick: function (ds) { showDay(body, ds, cur, draw); },
          onMonth: function (ny, nm) { draw(ny, nm); }
        });
        renderStats(body, cur);
      };
      var n = new Date();
      draw(n.getFullYear(), n.getMonth() + 1);
      showDay(body, todayStr(), st, draw);
    }
  });
})();
