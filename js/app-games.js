/* ================= 梦界游戏 · 小游戏合集 ================= */
(function () {
  var cleanup = null;

  function setCleanup(fn) {
    if (cleanup) { try { cleanup(); } catch (e) {} }
    cleanup = fn || null;
  }

  /* ---------- 游戏大厅 ---------- */
  function gameHall(body) {
    setCleanup();
    body.innerHTML =
      '<div class="panel center">' +
        '<div class="panel-title">🎮 梦界游戏厅</div>' +
        '<p class="muted sm">和梦角一起玩游戏吧，输赢都要开心呀～</p>' +
      '</div>' +
      '<div class="game-list">' +
        '<div class="game-card" id="gGomoku">' +
          '<div class="game-ico">⚫⚪</div>' +
          '<div class="game-main"><b>五子棋</b><div class="muted sm">双人对战 / 人机对战</div></div>' +
          '<div class="game-go">›</div>' +
        '</div>' +
        '<div class="game-card" id="gSnake">' +
          '<div class="game-ico">🐍</div>' +
          '<div class="game-main"><b>贪吃蛇</b><div class="muted sm">和梦角一起抓星星吃</div></div>' +
          '<div class="game-go">›</div>' +
        '</div>' +
      '</div>';
    body.querySelector('#gGomoku').onclick = function () { gomokuMenu(body); };
    body.querySelector('#gSnake').onclick = function () { startSnake(body); };
  }

  /* ================= 五子棋 ================= */
  function gomokuMenu(body) {
    setCleanup();
    body.innerHTML =
      '<div class="row" style="margin-bottom:12px"><button class="appbar-back" id="gBack">‹</button><b>⚫⚪ 五子棋</b></div>' +
      '<div class="panel center">' +
        '<p class="muted sm">选择对战方式</p>' +
        '<div class="row" style="justify-content:center;margin-top:14px;gap:10px">' +
          '<button class="btn primary" id="gPvp">👥 双人对战</button>' +
          '<button class="btn ghost" id="gAi">🤖 人机对战</button>' +
        '</div>' +
      '</div>';
    body.querySelector('#gBack').onclick = function () { gameHall(body); };
    body.querySelector('#gPvp').onclick = function () { startGomoku(body, 'pvp'); };
    body.querySelector('#gAi').onclick = function () { startGomoku(body, 'ai'); };
  }

  function startGomoku(body, mode) {
    setCleanup();
    var N = 15;
    var board = [];
    for (var i = 0; i < N; i++) { var row = []; for (var j = 0; j < N; j++) row.push(0); board.push(row); }
    var turn = 1;      // 1 黑 2 白
    var over = false;
    var history = [];
    var cv = document.createElement('canvas');
    cv.width = 380; cv.height = 380;
    var ctx = cv.getContext('2d');
    var cell = cv.width / (N + 1);

    body.innerHTML =
      '<div class="row" style="margin-bottom:10px"><button class="appbar-back" id="gBack">‹</button>' +
        '<b>五子棋</b><span class="mode-chip" id="gInfo"></span></div>' +
      '<div class="center" style="margin-bottom:8px"><span id="gTurn" class="turn-tag">⚫ 黑方回合</span></div>' +
      '<div class="board-wrap" id="boardWrap"></div>' +
      '<div class="row" style="justify-content:center;margin-top:10px;gap:10px">' +
        '<button class="btn small ghost" id="gUndo">↩ 悔棋</button>' +
        '<button class="btn small ghost" id="gRestart">🔄 重新开始</button>' +
        '<button class="btn small ghost" id="gQuit">🏠 返回</button>' +
      '</div>';

    body.querySelector('#gBack').onclick = function () { gomokuMenu(body); };
    body.querySelector('#gQuit').onclick = function () { gameHall(body); };
    body.querySelector('#gRestart').onclick = function () { startGomoku(body, mode); };
    body.querySelector('#boardWrap').appendChild(cv);

    function info() {
      var who = turn === 1 ? '⚫ 黑方回合' : '⚪ 白方回合';
      if (mode === 'ai' && turn === 2) who = '🤖 电脑思考中…';
      body.querySelector('#gTurn').textContent = who;
      body.querySelector('#gInfo').textContent = mode === 'ai' ? '🤖 人机' : '👥 双人';
    }

    function drawBoard() {
      ctx.fillStyle = '#1c1238';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1;
      for (var i = 0; i < N; i++) {
        ctx.beginPath();
        ctx.moveTo(cell, cell + i * cell);
        ctx.lineTo(cell + (N - 1) * cell, cell + i * cell);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cell + i * cell, cell);
        ctx.lineTo(cell + i * cell, cell + (N - 1) * cell);
        ctx.stroke();
      }
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (!board[r][c]) continue;
          ctx.beginPath();
          ctx.arc(cell + c * cell, cell + r * cell, cell * 0.38, 0, Math.PI * 2);
          ctx.fillStyle = board[r][c] === 1 ? '#111' : '#f5f5f5';
          ctx.fill();
          if (board[r][c] === 1) { ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.stroke(); }
        }
      }
      var last = history[history.length - 1];
      if (last) {
        ctx.beginPath();
        ctx.arc(cell + last.c * cell, cell + last.r * cell, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2d55';
        ctx.fill();
      }
    }

    function checkWin(r, c, v) {
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      for (var d = 0; d < dirs.length; d++) {
        var cnt = 1;
        for (var s = 1; ; s++) {
          var nr = r + dirs[d][0] * s, nc = c + dirs[d][1] * s;
          if (nr < 0 || nr >= N || nc < 0 || nc >= N || board[nr][nc] !== v) break;
          cnt++;
        }
        for (var s2 = 1; ; s2++) {
          var nr2 = r - dirs[d][0] * s2, nc2 = c - dirs[d][1] * s2;
          if (nr2 < 0 || nr2 >= N || nc2 < 0 || nc2 >= N || board[nr2][nc2] !== v) break;
          cnt++;
        }
        if (cnt >= 5) return true;
      }
      return false;
    }

    function evalPos(r, c, v) {
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      var max = 0;
      for (var d = 0; d < dirs.length; d++) {
        var cnt = 1;
        for (var s = 1; ; s++) {
          var nr = r + dirs[d][0] * s, nc = c + dirs[d][1] * s;
          if (nr < 0 || nr >= N || nc < 0 || nc >= N || board[nr][nc] !== v) break;
          cnt++;
        }
        for (var s2 = 1; ; s2++) {
          var nr2 = r - dirs[d][0] * s2, nc2 = c - dirs[d][1] * s2;
          if (nr2 < 0 || nr2 >= N || nc2 < 0 || nc2 >= N || board[nr2][nc2] !== v) break;
          cnt++;
        }
        if (cnt > max) max = cnt;
      }
      return max;
    }

    function aiBest(v) {
      var bestScore = -1, best = null;
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (board[r][c]) continue;
          var sc = evalPos(r, c, v) * 10 - (Math.abs(r - 7) + Math.abs(c - 7));
          if (sc > bestScore) { bestScore = sc; best = { r: r, c: c }; }
        }
      }
      return best;
    }

    function aiMove() {
      if (over) return;
      var best = aiBest(2) || aiBest(1) || aiBest(2);
      if (best) place(best.r, best.c);
    }

    function place(r, c) {
      if (over || board[r][c]) return;
      board[r][c] = turn;
      history.push({ r: r, c: c });
      drawBoard();
      if (checkWin(r, c, turn)) {
        over = true;
        var wn = turn === 1 ? '⚫ 黑方' : '⚪ 白方';
        if (mode === 'ai' && turn === 2) wn = '🤖 电脑';
        body.querySelector('#gTurn').textContent = '🎉 ' + wn + ' 获胜！';
        return;
      }
      if (history.length === N * N) { over = true; body.querySelector('#gTurn').textContent = '🤝 平局'; return; }
      turn = turn === 1 ? 2 : 1;
      info();
      if (mode === 'ai' && turn === 2) setTimeout(function () { aiMove(); }, 350);
    }

    cv.addEventListener('click', function (e) {
      if (over) return;
      if (mode === 'ai' && turn === 2) return;
      var rect = cv.getBoundingClientRect();
      var x = (e.clientX - rect.left) * (cv.width / rect.width);
      var y = (e.clientY - rect.top) * (cv.height / rect.height);
      var c = Math.round((x - cell) / cell);
      var r = Math.round((y - cell) / cell);
      if (c < 0 || c >= N || r < 0 || r >= N) return;
      place(r, c);
    });

    body.querySelector('#gUndo').onclick = function () {
      if (!history.length) return;
      var steps = mode === 'ai' ? 2 : 1;
      while (steps-- && history.length) {
        var last = history.pop();
        board[last.r][last.c] = 0;
      }
      over = false;
      turn = 1;
      info();
      drawBoard();
    };

    drawBoard();
    info();
  }

  /* ================= 贪吃蛇 ================= */
  function startSnake(body) {
    setCleanup();
    var COLS = 19, ROWS = 19, cell = 20;
    var cv = document.createElement('canvas');
    cv.width = COLS * cell; cv.height = ROWS * cell;
    var ctx = cv.getContext('2d');
    var snake = [{ r: 9, c: 4 }, { r: 9, c: 3 }, { r: 9, c: 2 }];
    var dir = { r: 0, c: 1 };
    var nextDir = { r: 0, c: 1 };
    var food = null;
    var score = 0;
    var running = false;
    var over = false;
    var timer = null;
    var speed = 150;

    body.innerHTML =
      '<div class="row" style="margin-bottom:10px"><button class="appbar-back" id="gBack">‹</button>' +
        '<b>🐍 贪吃蛇</b><span class="mode-chip" id="gScore">0 分</span></div>' +
      '<div class="board-wrap" id="boardWrap"></div>' +
      '<div class="row" style="justify-content:center;margin-top:8px">' +
        '<button class="btn small" id="gUp">⬆</button>' +
      '</div>' +
      '<div class="row" style="justify-content:center;margin-top:6px">' +
        '<button class="btn small" id="gLeft">⬅</button>' +
        '<button class="btn small" id="gPause" style="margin:0 8px">⏸ 暂停</button>' +
        '<button class="btn small" id="gRight">➡</button>' +
      '</div>' +
      '<div class="row" style="justify-content:center;margin-top:6px">' +
        '<button class="btn small" id="gDown">⬇</button>' +
      '</div>' +
      '<div class="row" style="justify-content:center;margin-top:10px;gap:10px">' +
        '<button class="btn small ghost" id="gRestart">🔄 重来</button>' +
        '<button class="btn small ghost" id="gQuit">🏠 返回</button>' +
      '</div>';

    body.querySelector('#gBack').onclick = function () { gameHall(body); };
    body.querySelector('#gQuit').onclick = function () { gameHall(body); };
    body.querySelector('#gRestart').onclick = function () { startSnake(body); };
    body.querySelector('#boardWrap').appendChild(cv);

    function placeFood() {
      var empty = [];
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var hit = snake.some(function (s) { return s.r === r && s.c === c; });
          if (!hit) empty.push({ r: r, c: c });
        }
      }
      if (!empty.length) { end(true); return; }
      food = empty[Math.floor(Math.random() * empty.length)];
    }

    function draw() {
      ctx.fillStyle = '#1c1238';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = 'rgba(255,255,255,.05)';
      ctx.lineWidth = 1;
      for (var i = 1; i < COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, cv.height); ctx.stroke();
      }
      for (var j = 1; j < ROWS; j++) {
        ctx.beginPath(); ctx.moveTo(0, j * cell); ctx.lineTo(cv.width, j * cell); ctx.stroke();
      }
      if (food) {
        ctx.fillStyle = '#ff7eb3';
        ctx.beginPath();
        ctx.arc(food.c * cell + cell / 2, food.r * cell + cell / 2, cell * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }
      snake.forEach(function (s, k) {
        ctx.fillStyle = k === 0 ? '#84fab0' : '#5ee7df';
        var pad = 1.5;
        ctx.fillRect(s.c * cell + pad, s.r * cell + pad, cell - pad * 2, cell - pad * 2);
      });
    }

    function restartTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(step, speed);
    }

    function step() {
      if (!running) return;
      var h = snake[0];
      var nr = h.r + nextDir.r, nc = h.c + nextDir.c;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { end(); return; }
      var hitSelf = snake.some(function (s, k) { return k < snake.length - 1 && s.r === nr && s.c === nc; });
      if (hitSelf) { end(); return; }
      snake.unshift({ r: nr, c: nc });
      if (food && nr === food.r && nc === food.c) {
        score++;
        body.querySelector('#gScore').textContent = score + ' 分';
        placeFood();
        speed = Math.max(80, 150 - score * 4);
        restartTimer();
      } else {
        snake.pop();
      }
      dir = nextDir;
      draw();
    }

    function end(win) {
      running = false;
      over = true;
      if (timer) clearInterval(timer);
      toast(win ? '🎉 填满了整个棋盘！好厉害' : '💥 撞到了，梦角说下次小心一点');
    }

    function turn(r, c) {
      if (!running || over) return;
      if (dir.r === -r && dir.c === -c) return;
      if (dir.r === r && dir.c === c) return;
      nextDir = { r: r, c: c };
    }

    body.querySelector('#gUp').onclick = function () { turn(-1, 0); };
    body.querySelector('#gDown').onclick = function () { turn(1, 0); };
    body.querySelector('#gLeft').onclick = function () { turn(0, -1); };
    body.querySelector('#gRight').onclick = function () { turn(0, 1); };
    body.querySelector('#gPause').onclick = function () {
      running = !running;
      if (running) { restartTimer(); body.querySelector('#gPause').textContent = '⏸ 暂停'; }
      else { if (timer) clearInterval(timer); body.querySelector('#gPause').textContent = '▶ 继续'; }
    };

    function key(e) {
      var k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') turn(-1, 0);
      else if (k === 'ArrowDown' || k === 's' || k === 'S') turn(1, 0);
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') turn(0, -1);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') turn(0, 1);
      else if (k === ' ') { e.preventDefault(); var p = body.querySelector('#gPause'); if (p) p.click(); }
    }
    document.addEventListener('keydown', key);
    setCleanup(function () { document.removeEventListener('keydown', key); });

    placeFood();
    draw();
    running = true;
    restartTimer();
  }

  /* ---------- 注册应用 ---------- */
  Shell.register({
    id: 'games',
    name: '梦界游戏',
    icon: '🎮',
    color: 'linear-gradient(135deg,#5ee7df,#b490ca)',
    badge: function () { return 0; },
    render: function (body) { gameHall(body); }
  });
})();
