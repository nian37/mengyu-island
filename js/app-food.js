/* ================= 梦屿外卖（模拟现实外卖软件） ================= */

/* ---------- 商家与菜品数据 ---------- */
window.FOOD_DATA = {
  shops: [
    {
      name: '蜜语奶茶', emoji: '🧋', tag: '奶茶果茶', time: '25分钟', rating: '4.9', sales: '月售2000+', desc: '现做奶茶，甜过初恋',
      items: [
        { emoji: '🧋', name: '珍珠奶茶', price: 15 },
        { emoji: '🍵', name: '芝士奶盖茶', price: 18 },
        { emoji: '🥭', name: '杨枝甘露', price: 22 },
        { emoji: '🍋', name: '手打柠檬茶', price: 13 },
        { emoji: '🍠', name: '芋泥波波奶', price: 20 }
      ]
    },
    {
      name: '疯狂炸鸡', emoji: '🍗', tag: '炸鸡汉堡', time: '30分钟', rating: '4.8', sales: '月售3000+', desc: '现炸现卖，外酥里嫩',
      items: [
        { emoji: '🍗', name: '香辣鸡翅(4只)', price: 19 },
        { emoji: '🍔', name: '全家炸鸡桶', price: 39 },
        { emoji: '🍟', name: '黄金薯条', price: 12 },
        { emoji: '🍔', name: '招牌汉堡套餐', price: 25 },
        { emoji: '🍿', name: '鸡米花', price: 13 }
      ]
    },
    {
      name: '蜀味火锅', emoji: '🍲', tag: '火锅串串', time: '45分钟', rating: '4.7', sales: '月售1200+', desc: '麻辣鲜香，锅底免费续',
      items: [
        { emoji: '🌶', name: '麻辣牛油锅底', price: 28 },
        { emoji: '🫁', name: '脆爽毛肚', price: 32 },
        { emoji: '🥩', name: '精品肥牛卷', price: 36 },
        { emoji: '🦐', name: '手打虾滑', price: 28 },
        { emoji: '🍜', name: '川味宽粉', price: 12 }
      ]
    },
    {
      name: '甜心烘焙', emoji: '🍰', tag: '蛋糕甜品', time: '35分钟', rating: '4.9', sales: '月售800+', desc: '低糖烘焙，治愈你的下午',
      items: [
        { emoji: '🍓', name: '草莓鲜奶蛋糕', price: 32 },
        { emoji: '🌈', name: '马卡龙礼盒', price: 45 },
        { emoji: '🥧', name: '葡式蛋挞', price: 18 },
        { emoji: '🍞', name: '黄油吐司', price: 12 },
        { emoji: '🍮', name: '提拉米苏', price: 28 }
      ]
    },
    {
      name: '深夜面馆', emoji: '🍜', tag: '面食馄饨', time: '40分钟', rating: '4.6', sales: '月售1500+', desc: '一碗热面，暖到胃里',
      items: [
        { emoji: '🍜', name: '招牌牛肉面', price: 18 },
        { emoji: '🍝', name: '老北京炸酱面', price: 16 },
        { emoji: '🥟', name: '鲜肉馄饨', price: 15 },
        { emoji: '🥟', name: '黄金煎饺(8只)', price: 12 },
        { emoji: '🌶', name: '酸辣粉', price: 14 }
      ]
    },
    {
      name: '元气轻食', emoji: '🥗', tag: '沙拉轻食', time: '30分钟', rating: '4.8', sales: '月售600+', desc: '低卡低脂，吃不胖的快乐',
      items: [
        { emoji: '🥗', name: '鸡胸肉沙拉', price: 22 },
        { emoji: '🥪', name: '全麦三明治', price: 18 },
        { emoji: '🥑', name: '牛油果奶昔', price: 16 },
        { emoji: '🍚', name: '低卡魔芋饭', price: 24 },
        { emoji: '🍹', name: '鲜榨果蔬汁', price: 12 }
      ]
    }
  ]
};

/* ---------- 外卖应用 ---------- */
(function () {
  var cart = [];       // { name, emoji, price, qty }
  var cartShop = null;

  function cartTotal() {
    return cart.reduce(function (s, c) { return s + c.price * c.qty; }, 0);
  }
  function cartCount() {
    return cart.reduce(function (s, c) { return s + c.qty; }, 0);
  }

  /* 首页：商家列表 */
  function renderFood(body) {
    cart = []; cartShop = null;
    body.innerHTML =
      '<div class="panel center">' +
        '<div class="panel-title">🍜 梦屿外卖</div>' +
        '<p class="muted sm">想吃什么就点什么，饿着肚子怎么谈恋爱</p>' +
      '</div>' +
      '<div class="row" style="justify-content:space-between;margin-bottom:10px">' +
        '<b>附近商家</b>' +
        '<button class="btn small ghost" id="foodRecords">📜 购买记录</button>' +
      '</div>' +
      '<div class="shop-list" id="shopList"></div>' +
      '<div class="row wrap" style="gap:8px;margin-top:10px">' +
        '<button class="btn small ghost" id="foodDream">🌙 让梦角点一单</button>' +
      '</div>';

    var list = body.querySelector('#shopList');
    list.innerHTML = FOOD_DATA.shops.map(function (s) {
      return '<div class="shop-card" data-name="' + esc(s.name) + '">' +
        '<div class="shop-ico">' + s.emoji + '</div>' +
        '<div class="shop-main">' +
          '<div class="shop-name">' + esc(s.name) + '</div>' +
          '<div class="shop-tag">' + esc(s.tag) + ' · ' + esc(s.time) + '</div>' +
          '<div class="shop-meta">⭐ ' + s.rating + ' · ' + esc(s.sales) + '</div>' +
          '<div class="shop-desc">' + esc(s.desc) + '</div>' +
        '</div>' +
        '<div class="shop-go">›</div>' +
      '</div>';
    }).join('');

    list.querySelectorAll('.shop-card').forEach(function (card) {
      card.onclick = function () { openShop(body, card.getAttribute('data-name')); };
    });

    body.querySelector('#foodRecords').onclick = function () { window.Purchases.viewModal(); };
    body.querySelector('#foodDream').onclick = function () {
      var w = Wallet.get();
      if (w.dream < 10) { toast('梦角余额不足，先给它转点钱吧 💸'); return; }
      toast('🌙 梦角打开外卖开始点单啦…');
      setTimeout(function () { window.DreamShop.buyFoodItem(); }, 1800);
    };
  }

  /* 商家详情：点餐 */
  function openShop(body, name) {
    var shop = FOOD_DATA.shops.filter(function (s) { return s.name === name; })[0];
    if (!shop) return;
    cart = []; cartShop = shop;

    body.innerHTML =
      '<div class="row" style="margin-bottom:10px">' +
        '<button class="appbar-back" id="fdBack">‹</button>' +
        '<b style="font-size:15px">' + shop.emoji + ' ' + esc(shop.name) + '</b>' +
        '<span class="mode-chip">⭐ ' + shop.rating + '</span>' +
      '</div>' +
      '<div class="panel" style="padding:10px 12px">' +
        '<p class="muted sm">' + esc(shop.desc) + '</p>' +
        '<p class="muted sm" style="margin-top:3px">预计送达：' + esc(shop.time) + ' · ' + esc(shop.sales) + '</p>' +
      '</div>' +
      '<div class="menu-list" id="menuList"></div>' +
      '<div class="cartbar" id="cartBar" hidden>' +
        '<div class="cartbar-info"><span class="cartbar-ico">🛒</span>' +
          '<span id="cartInfo">已选 0 件 · ¥0</span></div>' +
        '<button class="btn primary small" id="cartGo">去结算</button>' +
      '</div>';

    body.querySelector('#fdBack').onclick = function () { renderFood(body); };
    var menu = body.querySelector('#menuList');
    var cartBar = body.querySelector('#cartBar');

    function drawMenu() {
      menu.innerHTML = shop.items.map(function (it) {
        var inCart = cart.filter(function (c) { return c.name === it.name; })[0];
        return '<div class="menu-item">' +
          '<div class="menu-ico">' + it.emoji + '</div>' +
          '<div class="menu-main">' +
            '<div class="menu-name">' + esc(it.name) + '</div>' +
            '<div class="menu-price">' + Wallet.fmt(it.price) + '</div>' +
          '</div>' +
          '<div class="menu-qty" data-name="' + esc(it.name) + '">' +
            (inCart ? '<button class="qty-btn" data-op="-">−</button><span class="qty-num">' + inCart.qty + '</span><button class="qty-btn" data-op="+">＋</button>'
                    : '<button class="qty-btn add" data-op="+">＋</button>') +
          '</div>' +
        '</div>';
      }).join('');

      menu.querySelectorAll('[data-op]').forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          var name2 = btn.closest('.menu-qty').getAttribute('data-name');
          var item = shop.items.filter(function (x) { return x.name === name2; })[0];
          var op = btn.getAttribute('data-op');
          var idx = -1;
          for (var i = 0; i < cart.length; i++) if (cart[i].name === item.name) { idx = i; break; }
          if (op === '+') {
            if (idx >= 0) cart[idx].qty++;
            else cart.push({ name: item.name, emoji: item.emoji, price: item.price, qty: 1 });
          } else if (idx >= 0) {
            cart[idx].qty--;
            if (cart[idx].qty <= 0) cart.splice(idx, 1);
          }
          updateCart();
        };
      });
    }

    function updateCart() {
      drawMenu();
      var n = cartCount();
      var total = cartTotal();
      var info = body.querySelector('#cartInfo');
      info.textContent = '已选 ' + n + ' 件 · ' + Wallet.fmt(total);
      cartBar.hidden = n === 0;
    }

    body.querySelector('#cartGo').onclick = function () { checkout(body, shop); };
    drawMenu();
  }

  /* 结算：选择给自己 / 送给梦角 */
  function checkout(body, shop) {
    var total = cartTotal();
    window.Modal.show({
      title: '🧾 确认订单',
      body:
        '<div class="order-summary">' +
          '<div class="order-shop">' + shop.emoji + ' ' + esc(shop.name) + '</div>' +
          cart.map(function (c) {
            return '<div class="order-row"><span>' + c.emoji + ' ' + esc(c.name) + ' ×' + c.qty + '</span><b>' + Wallet.fmt(c.price * c.qty) + '</b></div>';
          }).join('') +
          '<div class="order-row total"><span>合计</span><b>' + Wallet.fmt(total) + '</b></div>' +
          '<div class="wallet-card">' +
            '<div class="wallet-row"><span>🧍 我的余额</span><b>' + Wallet.fmt(Wallet.get().user) + '</b></div>' +
            '<div class="wallet-row"><span>🌙 梦角余额</span><b>' + Wallet.fmt(Wallet.get().dream) + '</b></div>' +
          '</div>' +
          '<p class="muted sm center" style="margin-top:6px">这笔外卖，想给谁？</p>' +
        '</div>',
      footer:
        '<div class="modal-foot">' +
          '<button class="btn ghost" id="ckSelf">🧍 自己吃</button>' +
          '<button class="btn primary" id="ckGift">🎁 送给梦角</button>' +
        '</div>',
      onMount: function (b, root) {
        function place(recipient) {
          var r = Wallet.pay('user', total);
          if (!r.ok) { toast(r.msg); return; }
          var first = cart[0];
          var label = cart.length === 1 ? first.name : first.name + ' 等' + cart.length + '样';
          window.Purchases.add({ type: 'food', store: shop.name, emoji: first.emoji, item: label, price: total, buyer: 'user', recipient: recipient });
          window.Modal.close();
          if (recipient === 'dream') {
            toast('外卖已送给梦角，骑手正在飞奔 🛵🎁');
            if (window.ChatGiftNotify) window.ChatGiftNotify(label + '（' + shop.name + '）', '🍜', total);
          } else {
            toast('下单成功！' + shop.time + ' 内送达 🛵');
          }
          cart = []; cartShop = null;
          renderFood(body);
        }
        root.querySelector('#ckSelf').onclick = function () { place('user'); };
        root.querySelector('#ckGift').onclick = function () { place('dream'); };
      }
    });
  }

  Shell.register({
    id: 'food',
    name: '梦屿外卖',
    icon: '🍜',
    color: 'linear-gradient(135deg,#ffb347,#ffcc33)',
    badge: function () { return 0; },
    render: function (body) { renderFood(body); }
  });
})();
