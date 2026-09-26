/* ================= 梦屿 · 虚拟钱包 ================= */
window.Wallet = {
  key: 'wallet',

  /* 获取钱包；梦角余额首次随机生成 */
  get() {
    var w = Store.get(this.key, null);
    if (!w) {
      w = { user: 10000, dream: 5000 + Math.floor(Math.random() * 15001) };
      Store.set(this.key, w);
    }
    if (typeof w.dream !== 'number') {
      w.dream = 5000 + Math.floor(Math.random() * 15001);
      Store.set(this.key, w);
    }
    if (typeof w.user !== 'number') { w.user = 10000; Store.set(this.key, w); }
    return w;
  },

  save(w) { Store.set(this.key, w); },

  fmt(n) { return '¥' + Math.round(n).toLocaleString('zh-CN'); },

  /* 转账：from: 'user'|'dream' -> to: 'user'|'dream'，金额 amount */
  transfer(from, to, amount) {
    var w = this.get();
    amount = Math.round(amount);
    if (amount <= 0) return { ok: false, msg: '金额要大于 0 哦' };
    if (w[from] < amount) return { ok: false, msg: (from === 'user' ? '你的' : '梦角的') + '余额不足' };
    w[from] -= amount;
    w[to] += amount;
    this.save(w);
    return { ok: true, amount: amount, from: from, to: to };
  },

  /* 支付：who: 'user'|'dream'，返回是否成功 */
  pay(who, amount) {
    var w = this.get();
    amount = Math.round(amount);
    if (amount <= 0) return { ok: false, msg: '金额不正确' };
    if (w[who] < amount) return { ok: false, msg: (who === 'user' ? '你的' : '梦角的') + '余额不足，先去充值吧' };
    w[who] -= amount;
    this.save(w);
    return { ok: true };
  },

  /* 余额修改弹窗：可自定义更改用户余额，也可重新随机梦角余额 */
  editModal() {
    var self = this;
    var w = this.get();
    var userVal, dreamVal;
    window.Modal.show({
      title: '💰 我的钱包',
      body:
        '<p class="muted sm center">梦屿虚拟币，购物、点外卖、转账都能用～</p>' +
        '<div class="wallet-card">' +
          '<div class="wallet-row"><span>🧍 我的余额</span><b id="walUser">' + self.fmt(w.user) + '</b></div>' +
          '<div class="wallet-row"><span>🌙 梦角余额</span><b id="walDream">' + self.fmt(w.dream) + '</b></div>' +
        '</div>' +
        '<div class="field-row"><div class="field-label">修改我的余额</div>' +
          '<div class="row" style="gap:8px">' +
            '<input class="inp" id="walUserInp" type="number" min="0" step="100" placeholder="输入新余额">' +
            '<button class="btn primary" id="walUserSet">修改</button>' +
          '</div>' +
        '</div>' +
        '<p class="muted sm" style="margin-top:6px">梦角余额是随机生成的财运，也可以重新摇一摇：</p>' +
        '<div class="row" style="gap:8px;margin-top:6px">' +
          '<button class="btn ghost" id="walReRoll">🎲 重新随机梦角余额</button>' +
        '</div>',
      footer: '<div class="modal-foot"><button class="btn ghost" data-m="cancel">关闭</button></div>',
      onMount: function (b) {
        userVal = b.querySelector('#walUserInp');
        b.querySelector('#walUserSet').onclick = function () {
          var v = parseFloat(userVal.value);
          if (!(v >= 0)) { toast('请输入有效的金额'); return; }
          var w2 = self.get();
          w2.user = Math.round(v);
          self.save(w2);
          b.querySelector('#walUser').textContent = self.fmt(w2.user);
          toast('余额已更新：' + self.fmt(w2.user) + ' 💰');
        };
        b.querySelector('#walReRoll').onclick = function () {
          var w2 = self.get();
          w2.dream = 5000 + Math.floor(Math.random() * 15001);
          self.save(w2);
          b.querySelector('#walDream').textContent = self.fmt(w2.dream);
          toast('梦角的财运变成了 ' + self.fmt(w2.dream) + ' 🎲');
        };
      }
    });
  }
};

/* 转账弹窗（聊天界面调用），支持双向：我→梦角 / 梦角→我 */
window.Transfer = {
  open() {
    var w = Wallet.get();
    var amtInput;
    var dir = 'user2dream';
    var goBtn, noteEl;

    function refresh(b) {
      var title = dir === 'user2dream' ? '转账给梦角' : '梦角转账给我';
      goBtn.textContent = title;
      noteEl.textContent = dir === 'user2dream'
        ? '把我的虚拟币转给梦角，让梦角去买喜欢的东西吧'
        : '让梦角转给我一些虚拟币，梦角会答应的～';
    }

    window.Modal.show({
      title: '💸 转账',
      body:
        '<p class="muted sm center" id="trNote">把我的虚拟币转给梦角，让梦角去买喜欢的东西吧</p>' +
        '<div class="tf-dir">' +
          '<button class="tf-dir-btn sel" data-dir="user2dream">🧍 → 🌙 转给梦角</button>' +
          '<button class="tf-dir-btn" data-dir="dream2user">🌙 → 🧍 梦角转给我</button>' +
        '</div>' +
        '<div class="wallet-card">' +
          '<div class="wallet-row"><span>🧍 我的余额</span><b>' + Wallet.fmt(w.user) + '</b></div>' +
          '<div class="wallet-row"><span>🌙 梦角余额</span><b>' + Wallet.fmt(w.dream) + '</b></div>' +
        '</div>' +
        '<div class="field-row"><div class="field-label">转账金额</div>' +
          '<input class="inp" id="trAmt" type="number" min="1" placeholder="输入金额">' +
        '</div>' +
        '<div class="row wrap" style="gap:8px;margin-top:10px" id="trQuick">' +
          [6.66, 13.14, 52, 99, 520, 1314].map(function (n) {
            return '<button class="btn small ghost" data-amt="' + n + '">' + n + '</button>';
          }).join('') +
        '</div>',
      footer: '<div class="modal-foot"><button class="btn primary" id="trGo">转账给梦角</button><button class="btn ghost" data-m="cancel">取消</button></div>',
      onMount: function (b, root) {
        amtInput = b.querySelector('#trAmt');
        noteEl = b.querySelector('#trNote');
        goBtn = root.querySelector('#trGo');
        root.querySelectorAll('.tf-dir-btn').forEach(function (btn) {
          btn.onclick = function () {
            root.querySelectorAll('.tf-dir-btn').forEach(function (x) { x.classList.remove('sel'); });
            btn.classList.add('sel');
            dir = btn.getAttribute('data-dir');
            refresh(b);
          };
        });
        b.querySelectorAll('#trQuick [data-amt]').forEach(function (btn) {
          btn.onclick = function () { amtInput.value = btn.getAttribute('data-amt'); };
        });
        goBtn.onclick = function () {
          var amt = parseFloat(amtInput.value);
          if (!(amt > 0)) { toast('请输入有效金额'); return; }
          var from = dir === 'user2dream' ? 'user' : 'dream';
          var to = dir === 'user2dream' ? 'dream' : 'user';
          var r = Wallet.transfer(from, to, amt);
          if (!r.ok) { toast(r.msg); return; }
          window.Modal.close();
          if (window.ChatTransferNotify) window.ChatTransferNotify(amt, dir);
          toast((dir === 'user2dream' ? '已转给梦角 ' : '梦角转给你 ') + Wallet.fmt(r.amount) + ' 💸');
          /* 梦角收到钱后，偶尔会自己去商城/外卖逛逛 */
          if (dir === 'user2dream' && window.DreamShop && Math.random() < 0.6) {
            setTimeout(function () { window.DreamShop.spend(); }, 2200);
          }
        };
      }
    });
  }
};

/* ================= 钱包应用（主界面） ================= */
(function () {
  function renderWallet(body) {
    var w = Wallet.get();
    var pur = window.Purchases ? window.Purchases.all() : [];
    var mine = pur.filter(function (p) { return p.buyer === 'user'; }).length;
    var dreams = pur.filter(function (p) { return p.buyer === 'dream'; }).length;

    body.innerHTML =
      '<div class="panel center">' +
        '<div class="panel-title">💰 梦屿钱包</div>' +
        '<p class="muted sm">虚拟币余额，购物、点外卖、转账都能用～</p>' +
      '</div>' +
      '<div class="wallet-card big">' +
        '<div class="wallet-row"><span>🧍 我的余额</span><b>' + Wallet.fmt(w.user) + '</b></div>' +
        '<div class="wallet-row"><span>🌙 梦角余额</span><b>' + Wallet.fmt(w.dream) + '</b></div>' +
      '</div>' +
      '<div class="row wrap" style="gap:8px;margin-bottom:14px">' +
        '<button class="btn primary" id="wEdit">✏️ 修改余额</button>' +
        '<button class="btn ghost" id="wTransfer">💸 转账</button>' +
        '<button class="btn ghost" id="wRecords">📜 购买记录</button>' +
      '</div>' +
      '<div class="stats-row">' +
        '<div class="stat-card"><div class="stat-label">我的购买</div><div class="stat-val">' + mine + ' 笔</div></div>' +
        '<div class="stat-card"><div class="stat-label">梦角购买</div><div class="stat-val">' + dreams + ' 笔</div></div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title">💡 小提示</div>' +
        '<p class="muted sm" style="line-height:1.8">· 修改余额可以自定义我的余额，梦角余额是随机财运，可以摇一摇重新生成。<br>' +
        '· 给梦角转账后，梦角偶尔会自己去商城和外卖逛逛。<br>' +
        '· 在「梦屿商城」「梦屿外卖」里买东西，可以选择给自己或送给梦角。</p>' +
      '</div>';

    body.querySelector('#wEdit').onclick = function () { Wallet.editModal(); };
    body.querySelector('#wTransfer').onclick = function () { window.Transfer.open(); };
    body.querySelector('#wRecords').onclick = function () {
      if (window.Purchases) window.Purchases.viewModal();
    };
  }

  Shell.register({
    id: 'wallet',
    name: '我的钱包',
    icon: '💰',
    color: 'linear-gradient(135deg,#f6d365,#fda085)',
    badge: function () { return 0; },
    render: function (body) { renderWallet(body); }
  });
})();
