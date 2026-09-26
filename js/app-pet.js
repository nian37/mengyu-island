/* ================= 一起养宠 ================= */
(function () {
  var S_KEY = 'pet';

  var PET_SPECIES = [
    { id: 'cat', icon: '🐱', name: '小猫咪', tip: '傲娇又粘人，会偷看你写字卡' },
    { id: 'dog', icon: '🐶', name: '小狗狗', tip: '热情的小尾巴，看到你就摇起来' },
    { id: 'bunny', icon: '🐰', name: '小兔子', tip: '软乎乎的一团，最爱吃胡萝卜' },
    { id: 'duck', icon: '🐥', name: '小黄鸭', tip: '嘎嘎嘎，梦角养的小跟班' },
    { id: 'fox', icon: '🦊', name: '小狐狸', tip: '古灵精怪，最会哄你开心' }
  ];

  var PET_LINES = {
    idle: [
      '喵…今天有好好吃饭吗？',
      '汪！等你来陪我玩～',
      '你回来了！我等你很久啦',
      '肚子有点饿了呢…',
      '抱抱我嘛，就一下下',
      '快看快看，我学会新技能啦'
    ],
    feed: ['啊呜啊呜…好好吃！', '最喜欢你喂我啦 🍰', '吃饱饱了，超级幸福～', '这个味道…是幸福的味道！'],
    play: ['哈哈哈好开心！', '再玩一次嘛！', '球球飞起来啦！', '和你玩最开心了 🎉'],
    bath: ['泡泡好多呀，香香的～', '洗澡澡好舒服 🛁', '我现在香喷喷的啦！', '呼噜噜…洗得好干净'],
    sleep: ['呼…zzZ 梦里有你', '晚安啦，明天见哦 💤', '被窝好暖，你也早点睡', '睡着的时候也在想你']
  };

  var STATS = [
    { key: 'hunger', label: '🍚 饱食', icon: '🍚' },
    { key: 'mood', label: '😊 心情', icon: '😊' },
    { key: 'energy', label: '⚡ 精力', icon: '⚡' },
    { key: 'clean', label: '🧼 清洁', icon: '🧼' }
  ];

  function pet() {
    var p = Store.get(S_KEY, null);
    if (!p) return null;
    applyDecay(p);
    return p;
  }
  function savePet(p) { Store.set(S_KEY, p); }

  /* 时间衰减：离线时间越长，状态越低 */
  function applyDecay(p) {
    if (!p.last || !p.decay) return;
    var mins = Math.floor((Date.now() - p.last) / 60000);
    if (mins <= 0) return;
    var foodDrop = Math.min(mins * 0.8, 60);
    var cleanDrop = Math.min(mins * 0.5, 40);
    var energyDrop = Math.min(mins * 0.4, 30);
    p.hunger = Math.max(0, p.hunger - foodDrop);
    p.clean = Math.max(0, p.clean - cleanDrop);
    p.energy = Math.max(0, p.energy - energyDrop);
    p.last = Date.now();
    savePet(p);
  }

  function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }

  function levelOf(exp) { return Math.floor(exp / 100) + 1; }

  function fillCls(v) { return v >= 60 ? 'full' : v >= 30 ? 'mid' : 'low'; }

  function statHtml(p) {
    return STATS.map(function (s) {
      var v = Math.round(p[s.key]);
      return '<div class="stat-line">' +
        '<div class="stat-label"><span>' + s.label + '</span><span>' + v + '</span></div>' +
        '<div class="stat-bar"><div class="stat-fill ' + fillCls(v) + '" style="width:' + v + '%"></div></div>' +
      '</div>';
    }).join('');
  }

  function logsHtml(logs) {
    if (!logs || !logs.length) return '<div class="empty-tip">还没有记录，快去和小家伙互动吧</div>';
    return logs.slice().reverse().map(function (l) {
      return '<div class="log-item"><b>' + l.time + '</b>  ' + esc(l.text) + '</div>';
    }).join('');
  }

  /* ---------- 领养 ---------- */
  function adopt(body) {
    body.innerHTML =
      '<div class="panel center">' +
        '<div class="panel-title">🐾 一起养宠</div>' +
        '<p class="muted sm">选一个喜欢的小家伙，和梦角一起照顾它吧</p>' +
      '</div>' +
      '<div class="pet-pick" id="petPick" style="margin-top:10px">' +
        PET_SPECIES.map(function (sp) {
          return '<div class="pet-pick-card" data-id="' + sp.id + '">' +
            '<div class="pet-pick-ico">' + sp.icon + '</div>' +
            '<div class="pet-pick-name">' + sp.name + '</div>' +
            '<div class="pet-pick-tip">' + sp.tip + '</div>' +
          '</div>';
        }).join('') +
      '</div>';

    body.querySelectorAll('.pet-pick-card').forEach(function (c) {
      c.onclick = function () {
        var sp = PET_SPECIES.find(function (x) { return x.id === c.getAttribute('data-id'); });
        window.promptModal({
          title: '给它起个名字吧',
          placeholder: '如：团子',
          okText: '领养 🎀',
          onOk: function (v) {
            var nm = v.trim();
            if (!nm) { toast('名字不能为空哦'); return; }
            var p = {
              species: sp.id, icon: sp.icon, name: nm,
              hunger: 80, mood: 80, energy: 80, clean: 80,
              exp: 0, level: 1, last: Date.now(), decay: true, logs: []
            };
            p.logs.push({ time: nowStr(), text: '✨ 领养了' + sp.name + '「' + nm + '」，要一起好好照顾它哦' });
            savePet(p);
            toast('欢迎「' + nm + '」加入你们的小家 💕');
            render(body);
          }
        });
      };
    });
  }

  /* ---------- 主界面 ---------- */
  function render(body) {
    var p = pet();
    if (!p) { adopt(body); return; }

    body.innerHTML =
      '<div class="pet-top">' +
        '<div class="pet-ava" id="petAva">' + p.icon + '</div>' +
        '<div class="pet-name">' + esc(p.name) + '</div>' +
        '<div class="pet-sub">' + esc(speciesName(p)) + ' · Lv.' + p.level + '</div>' +
        '<div class="grow-line" id="growLine">成长值 <span id="expVal">' + (p.exp % 100) + '</span>/100</div>' +
      '</div>' +
      '<div class="pet-stats">' + statHtml(p) + '</div>' +
      '<div class="pet-actions">' +
        '<button class="btn small primary" data-act="feed">🍰 喂食</button>' +
        '<button class="btn small ghost" data-act="play">🎾 玩耍</button>' +
        '<button class="btn small ghost" data-act="bath">🛁 洗澡</button>' +
        '<button class="btn small ghost" data-act="sleep">💤 睡觉</button>' +
      '</div>' +
      '<p class="pet-tip" id="petLine">' + randomLine('idle') + '</p>' +
      '<div class="panel"><h3>📖 成长日记</h3><div id="petLogs">' + logsHtml(p.logs) + '</div></div>';

    var line = body.querySelector('#petLine');

    function say(txt) {
      line.textContent = txt;
      line.style.animation = 'none';
      void line.offsetWidth;
      line.style.animation = '';
    }

    function gainExp(p2, n, txt) {
      p2.exp += n;
      var oldLv = p2.level;
      p2.level = levelOf(p2.exp);
      var grow = body.querySelector('#growLine');
      if (grow) grow.innerHTML = '成长值 <span id="expVal">' + (p2.exp % 100) + '</span>/100 · Lv.' + p2.level;
      var nm = body.querySelector('.pet-name');
      if (nm) nm.textContent = esc(p2.name);
      var sub = body.querySelector('.pet-sub');
      if (sub) sub.textContent = esc(speciesName(p2)) + ' · Lv.' + p2.level;
      if (p2.level > oldLv) {
        p2.icon = evolvedIcon(p2);
        body.querySelector('#petAva').textContent = p2.icon;
        toast('🎉 恭喜！「' + p2.name + '」升到了 Lv.' + p2.level + '，变得更漂亮啦！');
        p2.logs.push({ time: nowStr(), text: '🌟 升级啦！现在是小明星「' + p2.name + '」Lv.' + p2.level });
      }
      p2.logs.push({ time: nowStr(), text: txt });
      if (p2.logs.length > 30) p2.logs = p2.logs.slice(-30);
      savePet(p2);
      body.querySelector('#petLogs').innerHTML = logsHtml(p2.logs);
    }

    function act(name, add, linePool, desc) {
      var pool = linePool[Math.floor(Math.random() * linePool.length)];
      p[name] = clamp(p[name] + add);
      say(pool);
      gainExp(p, 12, desc + '，小家伙说：' + pool);
      drawStats();
      if (p[name] >= 100) toast(p.name + '的' + (name === 'hunger' ? '小肚子' : name === 'mood' ? '心情' : name === 'energy' ? '精力' : '清洁度') + '满格啦 ✨');
    }

    function drawStats() {
      var stEl = body.querySelector('.pet-stats');
      stEl.innerHTML = statHtml(p);
    }

    body.querySelector('#petAva').onclick = function () {
      say(randomLine('idle'));
      gainExp(p, 3, '摸了摸小家伙的头');
    };

    body.querySelectorAll('.pet-actions .btn').forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-act');
        if (a === 'feed') act('hunger', 30, PET_LINES.feed, '🍰 喂食');
        else if (a === 'play') act('mood', 30, PET_LINES.play, '🎾 玩耍');
        else if (a === 'bath') act('clean', 40, PET_LINES.bath, '🛁 洗澡');
        else if (a === 'sleep') act('energy', 50, PET_LINES.sleep, '💤 睡觉');
      };
    });
  }

  function speciesName(p) {
    var sp = PET_SPECIES.find(function (x) { return x.id === p.species; });
    return sp ? sp.name : '小家伙';
  }

  /* 等级越高，形象越华丽 */
  function evolvedIcon(p) {
    if (p.level >= 5) return p.species === 'dog' ? '🐕‍🦺' : p.species === 'cat' ? '🐯' : p.species === 'bunny' ? '🐇' : p.species === 'duck' ? '🦆' : '🦊';
    return p.icon;
  }

  function randomLine(k) {
    var pool = PET_LINES[k];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  Shell.register({
    id: 'pet',
    name: '一起养宠',
    icon: '🐾',
    color: 'linear-gradient(135deg,#84fab0,#8fd3f4)',
    badge: function () {
      var p = pet();
      if (!p) return 0;
      return (p.hunger < 30 || p.clean < 30) ? 1 : 0;
    },
    render: function (body) { render(body); }
  });
})();
