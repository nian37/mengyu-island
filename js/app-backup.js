/* ================= 梦屿 · 数据备份 ================= */
window.Backup = {
  _saved: false,

  /* 收集所有应用数据（排除备份数据自身） */
  collect() {
    var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf(Store._p) !== 0) continue;
      var name = k.slice(Store._p.length);
      if (name === '_autobak' || name === '_manbak') continue;
      try { out[name] = JSON.parse(localStorage.getItem(k)); }
      catch (e) { out[name] = localStorage.getItem(k); }
    }
    return out;
  },

  /* 将备份数据写回本地存储 */
  restore(data) {
    if (!data) return;
    Object.keys(data).forEach(function (k) { Store.set(k, data[k]); });
  },

  timeStr(t) {
    var d = new Date(t);
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  },

  /* ---------- 手动备份 ---------- */
  manList() { return Store.get('_manbak', []); },

  saveMan() {
    var list = this.manList();
    list.unshift({ t: Date.now(), data: this.collect() });
    Store.set('_manbak', list.slice(0, 5));
    return list[0].t;
  },

  /* 导出备份文件（下载 JSON） */
  exportFile() {
    var pkg = { app: '梦屿·梦角字卡传讯', version: 1, time: new Date().toISOString(), data: this.collect() };
    var blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mengyu-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  },

  /* 从文件导入并恢复 */
  importFile(file, cb) {
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var j = JSON.parse(rd.result);
        var d = (j && j.data) ? j.data : j;
        Backup.restore(d);
        cb(true);
      } catch (e) { cb(false); }
    };
    rd.readAsText(file);
  },

  /* ---------- 退出时自动备份 ---------- */
  autoList() { return Store.get('_autobak', []); },

  autoSave() {
    var list = this.autoList();
    list.unshift({ t: Date.now(), data: this.collect() });
    Store.set('_autobak', list.slice(0, 3));
  },

  /* ---------- 弹窗 ---------- */
  openModal() {
    var self = this;
    window.Modal.show({
      title: '💾 数据备份',
      body:
        '<p class="muted sm center">备份梦屿里的所有数据，换设备也不怕丢～</p>' +
        '<div class="bk-acts">' +
          '<button class="btn primary" id="bkExport">📤 导出文件</button>' +
          '<button class="btn ghost" id="bkSave">⭐ 存一份</button>' +
          '<button class="btn ghost" id="bkImport">📥 恢复</button>' +
        '</div>' +
        '<div class="bk-title">📋 自动备份（退出时）</div>' +
        '<div id="bkAutoList"></div>' +
        '<div class="bk-title">🗂 手动备份历史</div>' +
        '<div id="bkManList"></div>',
      footer: '<div class="modal-foot"><button class="btn ghost" data-m="cancel">关闭</button></div>',
      onMount: function (b, root) {
        root.querySelector('#bkExport').onclick = function () { self.exportFile(); toast('备份文件已导出 📤'); };
        root.querySelector('#bkSave').onclick = function () {
          self.saveMan();
          toast('已保存手动备份 ⭐');
          self.renderLists(b);
        };
        root.querySelector('#bkImport').onclick = function () {
          var inp = document.createElement('input');
          inp.type = 'file';
          inp.accept = '.json,application/json';
          inp.style.display = 'none';
          document.body.appendChild(inp);
          inp.onchange = function () {
            var f = inp.files && inp.files[0];
            if (!f) { inp.remove(); return; }
            self.importFile(f, function (ok) {
              inp.remove();
              if (ok) { toast('恢复成功 ✨'); self.renderLists(b); }
              else toast('文件解析失败，请选择正确的备份文件');
            });
          };
          inp.click();
        };
        self.renderLists(b);
      }
    });
  },

  renderLists(b) {
    var self = this;
    var auto = b.querySelector('#bkAutoList');
    var man = b.querySelector('#bkManList');
    var aList = this.autoList();
    var mList = this.manList();
    auto.innerHTML = aList.length
      ? aList.map(function (x) {
          return '<div class="bk-item">' +
            '<span class="bk-time">' + self.timeStr(x.t) + '</span>' +
            '<span class="bk-acts"><button class="btn primary" data-act="restore">恢复</button></span>' +
          '</div>';
        }).join('')
      : '<div class="muted sm center" style="padding:6px 0">暂无自动备份</div>';
    man.innerHTML = mList.length
      ? mList.map(function (x, i) {
          return '<div class="bk-item">' +
            '<span class="bk-time">' + self.timeStr(x.t) + '</span>' +
            '<span class="bk-acts">' +
              '<button class="btn primary" data-act="restore">恢复</button>' +
              '<button class="btn danger" data-act="del">删除</button>' +
            '</span>' +
          '</div>';
        }).join('')
      : '<div class="muted sm center" style="padding:6px 0">暂无手动备份</div>';

    var wire = function (listEl, storeKey, isAuto) {
      listEl.querySelectorAll('button[data-act]').forEach(function (btn, idx) {
        btn.onclick = function () {
          var act = btn.getAttribute('data-act');
          var item = (isAuto ? Store.get(storeKey, []) : Store.get(storeKey, []))[idx];
          if (act === 'restore' && item) {
            self.restore(item.data);
            toast('已恢复 ' + self.timeStr(item.t) + ' 的备份 ✨');
            self.renderLists(b);
          } else if (act === 'del') {
            var list = Store.get(storeKey, []);
            list.splice(idx, 1);
            Store.set(storeKey, list);
            toast('已删除该备份');
            self.renderLists(b);
          }
        };
      });
    };
    wire(auto, '_autobak', true);
    wire(man, '_manbak', false);
  }
};

/* ---------- 主屏按钮 ---------- */
(function () {
  var btn = document.getElementById('backupBtn');
  if (btn) btn.onclick = function () { Backup.openModal(); };

  /* 退出时自动备份（移动端 PWA 用 pagehide / visibilitychange 更可靠） */
  function tryAutoSave() {
    if (Backup._saved) return;
    Backup._saved = true;
    Backup.autoSave();
  }
  window.addEventListener('pagehide', tryAutoSave);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') tryAutoSave();
  });

  /* 启动时提示：检测到上次退出留下的自动备份 */
  var list = Backup.autoList();
  if (list.length) {
    var latest = list[0];
    window.Modal.show({
      title: '💾 发现自动备份',
      body: '<p class="muted sm center">上次退出时（' + Backup.timeStr(latest.t) + '）自动备份了一份数据，<br>要恢复它吗？</p>',
      footer: '<div class="modal-foot"><button class="btn primary" data-m="ok">恢复</button><button class="btn ghost" data-m="cancel">暂不</button></div>',
      onOk: function () {
        Backup.restore(latest.data);
        window.Modal.close();
        toast('已从自动备份恢复 ✨');
      }
    });
  }
})();
