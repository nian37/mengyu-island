/* ================= 日记本 ================= */
(function () {
  var MOODS = ['😊', '😌', '😭', '😢', '🤩', '😴', '😤', '🤗'];

  function diary() { return Store.get('diary', []); }
  function save(ds) { Store.set('diary', ds); }

  function whoTag(who) {
    return who === 'dream' ? '<span class="who-tag tag-dream">梦角</span>' : '<span class="who-tag tag-user">用户</span>';
  }

  function renderList(body) {
    var box = body.querySelector('#dList');
    var ds = diary().slice().reverse();
    if (!ds.length) { box.innerHTML = '<div class="empty-tip">还没有日记，写下第一篇吧 📖</div>'; return; }
    box.innerHTML = ds.map(function (d) {
      return '<div class="diary-item" data-id="' + d.id + '">' +
        '<div class="diary-top">' + whoTag(d.who) +
          '<span class="diary-date">' + esc(d.date + ' ' + (d.time || '')) + '</span>' +
          '<span class="diary-mood">' + esc(d.mood || '') + '</span></div>' +
        '<div class="diary-prev">' + esc(d.content.slice(0, 60)) + '</div>' +
        '<div class="row" style="margin-top:8px"><button class="btn small ghost" data-del-d="' + d.id + '">🗑️ 删除</button></div>' +
      '</div>';
    }).join('');

    box.querySelectorAll('.diary-item').forEach(function (it) {
      it.onclick = function (e) {
        if (e.target.closest('[data-del-d]')) return;
        var d = diary().find(function (x) { return x.id === it.getAttribute('data-id'); });
        if (!d) return;
        window.Modal.show({
          title: d.date + ' ' + (d.time || '') + ' ' + (d.mood || ''),
          body: '<div class="letter-full">' + esc(d.content) + '</div>',
          footer: '<div class="modal-foot"><button class="btn primary" data-m="ok">关闭</button></div>'
        });
      };
    });
    box.querySelectorAll('[data-del-d]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-del-d');
        save(diary().filter(function (x) { return x.id !== id; }));
        renderList(body);
      };
    });
  }

  function addEntry(body) {
    var who = 'user';
    var mood = '';
    window.Modal.show({
      title: '写日记',
      body:
        '<div class="row" style="margin-bottom:8px">' +
          '<button class="btn small primary" id="dWhoU">用户</button>' +
          '<button class="btn small ghost" id="dWhoD">梦角</button>' +
        '</div>' +
        '<div class="mood-row" id="dMoods">' + MOODS.map(function (x) {
          return '<button class="mood" data-mood="' + x + '">' + x + '</button>';
        }).join('') + '</div>' +
        '<textarea class="inp ta" id="dContent" placeholder="记录今天的心情、梦境、悄悄话…"></textarea>' +
        '<div class="row" style="margin-top:10px">' +
          '<button class="btn primary" id="dSave">保存</button>' +
          '<button class="btn small ghost" data-m="cancel">取消</button>' +
        '</div>',
      footer: '',
      onMount: function (b) {
        function setWho(w) {
          who = w;
          b.querySelector('#dWhoU').classList.toggle('primary', w === 'user');
          b.querySelector('#dWhoU').classList.toggle('ghost', w !== 'user');
          b.querySelector('#dWhoD').classList.toggle('primary', w === 'dream');
          b.querySelector('#dWhoD').classList.toggle('ghost', w !== 'dream');
        }
        b.querySelector('#dWhoU').onclick = function () { setWho('user'); };
        b.querySelector('#dWhoD').onclick = function () { setWho('dream'); };
        b.querySelectorAll('#dMoods .mood').forEach(function (m) {
          m.onclick = function () {
            b.querySelectorAll('#dMoods .mood').forEach(function (x) { x.classList.remove('sel'); });
            m.classList.add('sel');
            mood = m.getAttribute('data-mood');
          };
        });
        b.querySelector('#dSave').onclick = function () {
          var content = b.querySelector('#dContent').value.trim();
          if (!content) { toast('写点什么再保存吧'); return; }
          var ds = diary();
          ds.push({ id: uid(), who: who, mood: mood, content: content, date: todayStr(), time: nowStr() });
          save(ds);
          window.Modal.close();
          renderList(body);
          toast('日记已保存');
        };
      }
    });
  }

  Shell.register({
    id: 'diary',
    name: '日记本',
    icon: '📖',
    color: 'linear-gradient(135deg,#ffecd2,#fcb69f)',
    badge: function () { return 0; },
    render: function (body) {
      body.innerHTML =
        '<div class="row" style="margin-bottom:12px">' +
          '<button class="btn primary" id="addD">✏️ 写日记</button>' +
          '<span class="muted sm">用户和梦角都可以写</span>' +
        '</div>' +
        '<div id="dList"></div>';
      renderList(body);
      body.querySelector('#addD').onclick = function () { addEntry(body); };
    }
  });
})();
