/* ================= 梦屿商城（模拟现实购物软件） ================= */

/* ---------- 商品数据 ---------- */
window.SHOP_DATA = {
  cats: [
    { id: 'digital', name: '📱 数码电子' },
    { id: 'beauty', name: '💄 美妆护肤' },
    { id: 'fashion', name: '👗 服饰穿搭' },
    { id: 'snack', name: '🍫 零食饮品' },
    { id: 'home', name: '🏠 家居生活' },
    { id: 'station', name: '📚 文具书籍' }
  ],
  items: [
    /* 数码电子 */
    { cat: 'digital', emoji: '🎧', name: '无线蓝牙耳机', price: 299, desc: '主动降噪，戴一天耳朵也不累' },
    { cat: 'digital', emoji: '⌚', name: '智能手表', price: 899, desc: '心率监测 + 消息提醒，陪你运动' },
    { cat: 'digital', emoji: '🔊', name: '便携蓝牙音箱', price: 199, desc: '小身材大音量，露营氛围感拉满' },
    { cat: 'digital', emoji: '🔋', name: '口袋充电宝', price: 79, desc: '20000mAh，出门再也不怕没电' },
    { cat: 'digital', emoji: '📱', name: '多功能手机支架', price: 39, desc: '桌面 / 床头都适用，追剧神器' },
    /* 美妆护肤 */
    { cat: 'beauty', emoji: '💄', name: '丝绒口红礼盒', price: 129, desc: '雾面质地，显白不挑肤色' },
    { cat: 'beauty', emoji: '🌸', name: '樱花香水', price: 299, desc: '清甜花香，留香一整天' },
    { cat: 'beauty', emoji: '🧖', name: '补水面膜', price: 89, desc: '熬夜救星，一敷就水润' },
    { cat: 'beauty', emoji: '🧴', name: '护手霜礼盒', price: 39, desc: '秋冬必备，滋润不粘腻' },
    { cat: 'beauty', emoji: '✨', name: '焕亮精华液', price: 169, desc: '提亮肤色，素颜也发光' },
    /* 服饰穿搭 */
    { cat: 'fashion', emoji: '👗', name: '碎花连衣裙', price: 199, desc: '温柔风，约会拍照都好看' },
    { cat: 'fashion', emoji: '🧥', name: '宽松卫衣', price: 129, desc: '软糯面料，居家外出两相宜' },
    { cat: 'fashion', emoji: '🧣', name: '羊绒围巾', price: 69, desc: '暖到心里，冬天最贴心的礼物' },
    { cat: 'fashion', emoji: '🧦', name: '彩虹袜子礼盒', price: 29, desc: '一双一个颜色，每天都好心情' },
    { cat: 'fashion', emoji: '👟', name: '百搭小白鞋', price: 159, desc: '百搭不挑人，走路带风' },
    /* 零食饮品 */
    { cat: 'snack', emoji: '🍫', name: '手工巧克力礼盒', price: 59, desc: '入口即化，甜过恋爱' },
    { cat: 'snack', emoji: '🍪', name: '黄油曲奇饼干', price: 49, desc: '奶香浓郁，配下午茶刚刚好' },
    { cat: 'snack', emoji: '🥜', name: '每日坚果大礼包', price: 99, desc: '30 天不重样，健康又解馋' },
    { cat: 'snack', emoji: '🍮', name: '多口味果冻', price: 19, desc: 'QQ 弹弹，童年的味道' },
    { cat: 'snack', emoji: '🌶', name: '辣条大礼包', price: 39, desc: '越吃越上头，追剧必备' },
    /* 家居生活 */
    { cat: 'home', emoji: '🕯', name: '香薰蜡烛', price: 49, desc: '助眠放松，满屋都是温柔香气' },
    { cat: 'home', emoji: '🛋', name: '云朵抱枕', price: 69, desc: '软软糯糯，抱着就不想撒手' },
    { cat: 'home', emoji: '💡', name: '星星小夜灯', price: 129, desc: '暖光不刺眼，陪你熬夜' },
    { cat: 'home', emoji: '☕', name: '陶瓷马克杯', price: 35, desc: '手绘图案，喝水都变有仪式感' },
    { cat: 'home', emoji: '🛏', name: '毛绒盖毯', price: 89, desc: '秋冬窝沙发追剧，暖烘烘的' },
    /* 文具书籍 */
    { cat: 'station', emoji: '📒', name: '星空手账本', price: 25, desc: '记录我们的小日常' },
    { cat: 'station', emoji: '🖋', name: '钢笔礼盒', price: 99, desc: '顺滑好写，送人有面子' },
    { cat: 'station', emoji: '🌌', name: '星座故事书', price: 45, desc: '每个星座都有一段浪漫传说' },
    { cat: 'station', emoji: '💌', name: '明信片套装', price: 19, desc: '把想说的话写在卡片上吧' },
    { cat: 'station', emoji: '📖', name: '立体童话书', price: 59, desc: '翻开就是一座小城堡' }
  ]
};

/* ---------- 购买记录（商城 & 外卖共用） ---------- */
window.Purchases = {
  key: 'purchases',
  all() { return Store.get(this.key, []); },
  add(rec) {
    var list = this.all();
    rec.id = uid();
    rec.time = todayStr() + ' ' + nowStr();
    list.unshift(rec);
    Store.set(this.key, list.slice(0, 200));
  },
  clear() { Store.set(this.key, []); },
  viewModal() {
    var cur = 'all';
    function draw(b) {
      var list = window.Purchases.all();
      var filtered = cur === 'all' ? list : list.filter(function (r) { return r.buyer === cur; });
      var box = b.querySelector('#purList');
      if (!filtered.length) { box.innerHTML = '<div class="empty-tip">还没有购买记录</div>'; return; }
      box.innerHTML = filtered.map(function (r) {
        var who = r.buyer === 'user' ? '🧍 我' : '🌙 梦角';
        var to = r.recipient === 'user' ? '自己' : '梦角';
        return '<div class="pur-item">' +
          '<div class="pur-ico">' + (r.emoji || (r.type === 'food' ? '🍜' : '🛍️')) + '</div>' +
          '<div class="pur-main">' +
            '<div class="pur-name">' + esc(r.item) + '</div>' +
            '<div class="pur-sub">' + esc(r.store) + ' · ' + who + '买给' + to + '</div>' +
            '<div class="pur-time">' + esc(r.time) + '</div>' +
          '</div>' +
          '<div class="pur-price">' + Wallet.fmt(r.price) + '</div>' +
        '</div>';
      }).join('');
    }
    window.Modal.show({
      title: '📜 购买记录',
      body:
        '<div class="tf-dir" id="purTabs">' +
          '<button class="tf-dir-btn sel" data-f="all">全部</button>' +
          '<button class="tf-dir-btn" data-f="user">🧍 我的</button>' +
          '<button class="tf-dir-btn" data-f="dream">🌙 梦角的</button>' +
        '</div>' +
        '<div id="purList" style="margin-top:12px"></div>',
      footer: '<div class="modal-foot"><button class="btn ghost" data-m="cancel">关闭</button></div>',
      onMount: function (b) {
        b.querySelectorAll('#purTabs [data-f]').forEach(function (btn) {
          btn.onclick = function () {
            b.querySelectorAll('#purTabs .tf-dir-btn').forEach(function (x) { x.classList.remove('sel'); });
            btn.classList.add('sel');
            cur = btn.getAttribute('data-f');
            draw(b);
          };
        });
        draw(b);
      }
    });
  }
};

/* ---------- 梦角自己逛（商城 + 外卖随机买买买） ---------- */
window.DreamShop = {
  spend() {
    var r = Math.random() < 0.5 ? this.buyShopItem() : this.buyFoodItem();
    if (r) {
      var to = r.recipient === 'user' ? '给你' : '给自己';
      toast('🌙 梦角逛了一圈，买了「' + r.item + '」' + to + '！' + Wallet.fmt(r.price));
    }
    return r;
  },
  buyShopItem() {
    var w = Wallet.get();
    var afford = SHOP_DATA.items.filter(function (i) { return i.price <= w.dream; });
    if (!afford.length) return null;
    var item = afford[Math.floor(Math.random() * afford.length)];
    var r = Wallet.pay('dream', item.price);
    if (!r.ok) return null;
    var recipient = Math.random() < 0.35 ? 'user' : 'dream';
    var rec = { type: 'shop', store: '梦屿商城', emoji: item.emoji, item: item.name, price: item.price, buyer: 'dream', recipient: recipient };
    window.Purchases.add(rec);
    return rec;
  },
  buyFoodItem() {
    var w = Wallet.get();
    var shops = FOOD_DATA ? FOOD_DATA.shops : [];
    if (!shops.length) return null;
    var shop = shops[Math.floor(Math.random() * shops.length)];
    var afford = shop.items.filter(function (i) { return i.price <= w.dream; });
    if (!afford.length) return null;
    var item = afford[Math.floor(Math.random() * afford.length)];
    var r = Wallet.pay('dream', item.price);
    if (!r.ok) return null;
    var recipient = Math.random() < 0.3 ? 'user' : 'dream';
    var rec = { type: 'food', store: shop.name, emoji: item.emoji, item: item.name, price: item.price, buyer: 'dream', recipient: recipient };
    window.Purchases.add(rec);
    return rec;
  }
};

/* ---------- 商城应用 ---------- */
(function () {
  function showProduct(body, name) {
    var it = SHOP_DATA.items.filter(function (x) { return x.name === name; })[0];
    if (!it) return;
    window.Modal.show({
      title: '🛍️ 商品详情',
      body:
        '<div class="prod-detail">' +
          '<div class="prod-detail-ico">' + it.emoji + '</div>' +
          '<div class="prod-detail-name">' + esc(it.name) + '</div>' +
          '<div class="prod-detail-price">' + Wallet.fmt(it.price) + '</div>' +
          '<div class="prod-detail-desc">' + esc(it.desc) + '</div>' +
          '<div class="wallet-card">' +
            '<div class="wallet-row"><span>🧍 我的余额</span><b>' + Wallet.fmt(Wallet.get().user) + '</b></div>' +
            '<div class="wallet-row"><span>🌙 梦角余额</span><b>' + Wallet.fmt(Wallet.get().dream) + '</b></div>' +
          '</div>' +
        '</div>',
      footer:
        '<div class="modal-foot">' +
          '<button class="btn ghost" id="pdSelf">🧍 给自己买</button>' +
          '<button class="btn primary" id="pdGift">🎁 送给梦角</button>' +
        '</div>',
      onMount: function (b, root) {
        function buy(recipient) {
          var r = Wallet.pay('user', it.price);
          if (!r.ok) { toast(r.msg); return; }
          window.Purchases.add({ type: 'shop', store: '梦屿商城', emoji: it.emoji, item: it.name, price: it.price, buyer: 'user', recipient: recipient });
          window.Modal.close();
          if (recipient === 'dream') {
            toast('已送给梦角「' + it.name + '」，梦角超开心 🎁');
            if (window.ChatGiftNotify) window.ChatGiftNotify(it.name, it.emoji, it.price);
          } else {
            toast('购买成功，已放入你的小仓库 🧍');
          }
        }
        root.querySelector('#pdSelf').onclick = function () { buy('user'); };
        root.querySelector('#pdGift').onclick = function () { buy('dream'); };
      }
    });
  }

  function renderShop(body) {
    var cur = 'all';
    body.innerHTML =
      '<div class="panel center">' +
        '<div class="panel-title">🛍️ 梦屿商城</div>' +
        '<p class="muted sm">全场包邮 · 买给自己或送给梦角都行～</p>' +
      '</div>' +
      '<div class="cat-row" id="shopCats">' +
        '<button class="cat-chip sel" data-cat="all">全部</button>' +
        SHOP_DATA.cats.map(function (c) {
          return '<button class="cat-chip" data-cat="' + c.id + '">' + c.name + '</button>';
        }).join('') +
      '</div>' +
      '<div class="prod-grid" id="prodGrid"></div>' +
      '<div class="row wrap" style="gap:8px;margin-top:12px">' +
        '<button class="btn small ghost" id="shopDream">🌙 让梦角逛逛</button>' +
        '<button class="btn small ghost" id="shopRecords">📜 购买记录</button>' +
      '</div>';

    var grid = body.querySelector('#prodGrid');

    function drawProducts() {
      var list = SHOP_DATA.items.filter(function (i) { return cur === 'all' || i.cat === cur; });
      grid.innerHTML = list.map(function (it) {
        return '<div class="prod-card" data-name="' + esc(it.name) + '">' +
          '<div class="prod-ico">' + it.emoji + '</div>' +
          '<div class="prod-name">' + esc(it.name) + '</div>' +
          '<div class="prod-price">' + Wallet.fmt(it.price) + '</div>' +
          '<button class="btn small primary">购买</button>' +
        '</div>';
      }).join('');
      grid.querySelectorAll('.prod-card').forEach(function (card) {
        card.onclick = function () { showProduct(body, card.getAttribute('data-name')); };
      });
    }

    body.querySelector('#shopCats').onclick = function (e) {
      var chip = e.target.closest('.cat-chip');
      if (!chip) return;
      cur = chip.getAttribute('data-cat');
      body.querySelectorAll('.cat-chip').forEach(function (x) { x.classList.toggle('sel', x === chip); });
      drawProducts();
    };

    body.querySelector('#shopDream').onclick = function () {
      var w = Wallet.get();
      if (w.dream < 10) { toast('梦角余额不足，先给它转点钱吧 💸'); return; }
      toast('🌙 梦角出门逛商城啦…');
      setTimeout(function () { window.DreamShop.buyShopItem(); }, 1800);
    };
    body.querySelector('#shopRecords').onclick = function () { window.Purchases.viewModal(); };

    drawProducts();
  }

  Shell.register({
    id: 'shop',
    name: '梦屿商城',
    icon: '🛍️',
    color: 'linear-gradient(135deg,#ff9a9e,#fecfef)',
    badge: function () { return 0; },
    render: function (body) { renderShop(body); }
  });
})();
