/* ================= 梦角位置感应 ================= */
(function () {
  var PLACES = [
    { id: 'star', ico: '🌌', name: '星海', desc: '亿万星光之间，我在数你的名字。' },
    { id: 'coast', ico: '🌊', name: '月光海岸', desc: '海浪一遍遍念着你的名字。' },
    { id: 'forest', ico: '🌲', name: '星梦森林', desc: '林间的风带着你的气息。' },
    { id: 'sky', ico: '🏰', name: '天空之城', desc: '云朵之上，等你来赴约。' },
    { id: 'home', ico: '🏡', name: '梦境小屋', desc: '我们的家，温暖又安静。' },
    { id: 'garden', ico: '🌸', name: '花语花园', desc: '每一朵花都在说，想你。' }
  ];

  function placeInfo(id) {
    return PLACES.find(function (p) { return p.id === id; }) || PLACES[0];
  }

  function state() { return Store.get('loc', { place: 'star', drift: true, records: [] }); }

  Shell.register({
    id: 'loc',
    name: '位置感应',
    icon: '📡',
    color: 'linear-gradient(135deg,#84fab0,#8fd3f4)',
    badge: function () { return 0; },
    render: function (body) {
      var st = state();
      var prof = Store.get('profile', { dream: {} }).dream || {};

      body.innerHTML =
        '<section class="panel loc-now">' +
          '<div class="loc-big-ava">' + avatarHTML(prof) + '</div>' +
          '<div class="loc-big">梦角现在在：<b id="locPlace">' + placeInfo(st.place).name + '</b></div>' +
          '<div class="loc-ico" id="locIco">' + placeInfo(st.place).ico + '</div>' +
          '<p class="muted sm">' + placeInfo(st.place).desc + '</p>' +
        '</section>' +
        '<button class="btn primary big" id="sensBtn">📡 感应梦角的位置</button>' +
        '<label class="switch-row"><span>梦境漫游（梦角会自己换地方）</span><input type="checkbox" id="driftBox" ' + (st.drift ? 'checked' : '') + '></label>' +
        '<div class="panel"><h3>选择梦角的位置</h3><div class="place-grid" id="placeGrid"></div></div>' +
        '<div class="panel"><h3>感应记录</h3><div class="record-list" id="recList"></div></div>';

      function drawPlaces() {
        var grid = body.querySelector('#placeGrid');
        grid.innerHTML = PLACES.map(function (p) {
          return '<div class="place-card ' + (p.id === st.place ? 'sel' : '') + '" data-id="' + p.id + '">' +
            '<div class="place-ico">' + p.ico + '</div>' +
            '<div class="place-name">' + p.name + '</div>' +
            '<div class="place-desc">' + p.desc + '</div>' +
          '</div>';
        }).join('');
        grid.querySelectorAll('.place-card').forEach(function (c) {
          c.onclick = function () {
            st.place = c.getAttribute('data-id');
            Store.set('loc', st);
            drawPlaces();
            updateNow();
          };
        });
      }

      function drawRecords() {
        var box = body.querySelector('#recList');
        if (!st.records.length) { box.innerHTML = '<div class="empty-tip">还没有感应记录</div>'; return; }
        box.innerHTML = st.records.slice().reverse().map(function (r) {
          return '<div class="record-item"><span>' + esc(r.time) + ' · 感应到梦角在「' + esc(r.place) + '」</span>' +
            '<span class="record-strength">' + r.strength + '%</span></div>';
        }).join('');
      }

      function updateNow() {
        var pi = placeInfo(st.place);
        body.querySelector('#locPlace').textContent = pi.name;
        body.querySelector('#locIco').textContent = pi.ico;
        body.querySelector('.loc-now .muted').textContent = pi.desc;
      }

      var sensBtn = body.querySelector('#sensBtn');
      sensBtn.onclick = function () {
        if (sensBtn.disabled) return;
        sensBtn.disabled = true;
        sensBtn.classList.add('sensing');
        sensBtn.textContent = '📡 正在感应…';
        setTimeout(function () {
          sensBtn.disabled = false;
          sensBtn.classList.remove('sensing');
          sensBtn.textContent = '📡 感应梦角的位置';
          var strength = 60 + Math.floor(Math.random() * 35);
          st.records.push({ time: nowStr(), place: placeInfo(st.place).name, strength: strength });
          Store.set('loc', st);
          drawRecords();
          toast('感应成功：梦角在「' + placeInfo(st.place).name + '」，感应力 ' + strength + '%');
        }, 1600);
      };

      body.querySelector('#driftBox').onchange = function () {
        st.drift = this.checked;
        Store.set('loc', st);
        toast(st.drift ? '漫游已开启，梦角会到处散步' : '漫游已关闭，梦角会留在原地');
      };

      // 梦境漫游
      var driftTimer = setInterval(function () {
        if (!document.body.contains(body)) { clearInterval(driftTimer); return; }
        if (st.drift) {
          var others = PLACES.filter(function (p) { return p.id !== st.place; });
          var nxt = others[Math.floor(Math.random() * others.length)];
          st.place = nxt.id;
          Store.set('loc', st);
          drawPlaces();
          updateNow();
        }
      }, 8000);

      drawPlaces();
      drawRecords();
    }
  });
})();
