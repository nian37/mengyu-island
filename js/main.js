/* ================= 梦屿 · 启动 ================= */
(function () {
  // 初始化字卡库
  if (Store.get('cards', null) === null) {
    Store.set('cards', DEFAULT_CARDS.map(function (t, i) {
      return { id: 'c' + i, text: t, tag: '', on: true };
    }));
  }
  // 初始化信箱（每天自动来一封梦角的信）
  var letters = Store.get('letters', null);
  if (letters === null) {
    Store.set('letters', []);
    letters = [];
  }
  var today = todayStr();
  var hasToday = letters.some(function (l) { return l.from === 'dream' && l.time.slice(0, 10) === today; });
  if (!hasToday) {
    var tpl = LETTER_TEMPLATES[Math.floor(Math.random() * LETTER_TEMPLATES.length)];
    letters.unshift({ id: uid(), from: 'dream', title: tpl.title, content: tpl.content, time: today + ' 08:00', read: false });
    Store.set('letters', letters);
  }

  Shell.init();
})();
