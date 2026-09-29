(() => {
  const CFG = Object.assign({
    EASY_COUNT: 1, HARD_COUNT: 1, ASK_ID: true,
    ID_MIN_LENGTH: 4, ID_MAX_LENGTH: 10, IDLE_SECONDS: 90, RESULT_SECONDS: 30, SOUND: true,
    BGM: true, BGM_VOLUME: 0.35,
  }, window.QUIZ_CONFIG || {});
  const REC_KEY = 'gist-ox-quiz-records';
  const $ = (s) => document.querySelector(s);
  const stage = $('#stage');

  // ----- 언어 -----
  const T = {
    ko: {
      title: '연구실 <span class="hl">안전</span> 퀴즈',
      idLabel: '학(사)번 :', start: '시 작', retry: '다시 입력',
      idEmpty: '학(사)번을 입력해 주세요.', idWrong: '입력된 사(학)번 정보가 잘못되었습니다.',
      count: (n, t) => `문제 <b>${n}</b> / ${t}`,
      level: { easy: '쉬움', hard: '어려움' },
      correct: '정답입니다!', wrong: '오답입니다!',
      answerIs: (a) => `정답은 ${a} 입니다`,
      explain: '해설', next: '다음 문제', seeResult: '결과 보기',
      resultTitle: '퀴즈 <span class="hl">결과</span>',
      score: (s) => `${s}점`,
      sub: (t, ok) => `${t}문제 중 ${ok}문제를 맞혔어요!`,
      msgHigh: '훌륭해요! 연구실 안전 수칙을 잘 알고 있어요.',
      msgMid: '좋아요! 헷갈린 문제는 해설을 다시 확인해 보세요.',
      msgLow: '안전 수칙을 한 번 더 확인해 주세요.',
      review: '틀린 문제 보기', reviewTitle: '틀린 문제 다시 보기', home: '처음으로', close: '닫기',
      mine: (p, a) => `내 답: ${p} → 정답: ${a}`,
      countdown: (s) => `${s}초 후 처음 화면으로 돌아갑니다`,
    },
    en: {
      title: 'Lab <span class="hl">Safety</span> Quiz',
      idLabel: 'ID Number :', start: 'START', retry: 'Try Again',
      idEmpty: 'Please enter your ID number.', idWrong: 'The ID number you entered is not valid.',
      count: (n, t) => `Question <b>${n}</b> / ${t}`,
      level: { easy: 'Easy', hard: 'Hard' },
      correct: 'Correct!', wrong: 'Wrong!',
      answerIs: (a) => `The answer is ${a}`,
      explain: 'Explanation', next: 'Next', seeResult: 'See Result',
      resultTitle: 'Quiz <span class="hl">Result</span>',
      score: (s) => `${s} pts`,
      sub: (t, ok) => `You got ${ok} out of ${t} correct!`,
      msgHigh: 'Excellent! You know your lab safety rules well.',
      msgMid: 'Good job! Review the explanation for anything you missed.',
      msgLow: 'Please review the lab safety rules once more.',
      review: 'Review Mistakes', reviewTitle: 'Review Your Mistakes', home: 'Home', close: 'Close',
      mine: (p, a) => `Your answer: ${p} → Correct: ${a}`,
      countdown: (s) => `Returning to the start screen in ${s} seconds`,
    },
  };
  let lang = 'ko';
  const t = () => T[lang];
  function applyLang() {
    document.documentElement.lang = lang;
    stage.classList.toggle('lang-en', lang === 'en');
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t()[el.dataset.i18n]; });
  }
  const text = (q) => (lang === 'en' && q.en) ? q.en : q.ko;

  // ----- 화면 맞춤 (4:3 무대를 화면 크기에 맞게 확대/축소) -----
  function fit() {
    const s = Math.min(innerWidth / 1600, innerHeight / 1200);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  addEventListener('resize', fit); fit();

  // ----- 배경 테두리 (코일 모양 곡선 포함) -----
  (function drawFrame() {
    const L = 64, R = 1536, T0 = 64, r = 40;
    let d = `M${L},1200 L${L},470`;
    for (let y = 470; y > 330; y -= 35) d += ` C${L + 48},${y} ${L + 48},${y - 35} ${L},${y - 35}`;
    d += ` L${L},${T0 + r} Q${L},${T0} ${L + r},${T0} L${R - r},${T0} Q${R},${T0} ${R},${T0 + r} L${R},350`;
    for (let y = 350; y < 630; y += 35) d += ` C${R + 48},${y} ${R + 48},${y + 35} ${R},${y + 35}`;
    d += ` L${R},1200`;
    $('#frame').setAttribute('d', d);
  })();

  // ----- 효과음 -----
  let actx;
  function beep(notes, type = 'sine') {
    if (!CFG.SOUND) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      let tm = actx.currentTime;
      for (const [f, dur] of notes) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, tm);
        g.gain.exponentialRampToValueAtTime(0.25, tm + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
        o.connect(g).connect(actx.destination); o.start(tm); o.stop(tm + dur + 0.02);
        tm += dur * 0.8;
      }
    } catch (e) {}
  }
  // ----- 배경음악 (Happy Clappy Loop by OwlishMedia, CC0) -----
  const BGM_KEY = 'gist-ox-quiz-bgm';
  const bgm = { buf: null, el: null, src: null, gain: null, playing: false, touched: false,
    on: (() => { try { return localStorage.getItem(BGM_KEY) !== 'off'; } catch (e) { return true; } })() };
  const audioCtx = () => (actx = actx || new (window.AudioContext || window.webkitAudioContext)());

  (function loadBgm() {
    if (!CFG.BGM) return;
    // XHR: https와 안드로이드 앱(file://) 모두에서 동작. 실패하면 <audio loop>로 대체
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'assets/bgm.wav'); xhr.responseType = 'arraybuffer';
    const fallback = () => { bgm.el = new Audio('assets/bgm.wav'); bgm.el.loop = true; if (bgm.touched) startBgm(); };
    xhr.onload = () => {
      if (!xhr.response || (xhr.status && xhr.status !== 200)) return fallback();
      try {
        audioCtx().decodeAudioData(xhr.response, (b) => { bgm.buf = b; if (bgm.touched) startBgm(); }, fallback);
      } catch (e) { fallback(); }
    };
    xhr.onerror = fallback;
    try { xhr.send(); } catch (e) { fallback(); }
  })();

  function startBgm() {
    if (!CFG.BGM || !bgm.on || bgm.playing) return;
    if (bgm.buf) {
      const c = audioCtx();
      bgm.gain = c.createGain(); bgm.gain.gain.value = CFG.BGM_VOLUME;
      bgm.src = c.createBufferSource(); bgm.src.buffer = bgm.buf; bgm.src.loop = true;
      bgm.src.connect(bgm.gain).connect(c.destination); bgm.src.start();
      bgm.playing = true;
    } else if (bgm.el) {
      bgm.el.volume = CFG.BGM_VOLUME;
      bgm.el.play().then(() => { bgm.playing = true; }).catch(() => {});
    }
  }
  function stopBgm() {
    try { if (bgm.src) bgm.src.stop(); } catch (e) {}
    bgm.src = null;
    if (bgm.el) bgm.el.pause();
    bgm.playing = false;
  }
  function bgmVolume(v) {  // 해설을 읽는 동안 살짝 줄임
    if (bgm.gain) bgm.gain.gain.setTargetAtTime(v, audioCtx().currentTime, 0.25);
    if (bgm.el) bgm.el.volume = v;
  }
  function renderBgmBtn() {
    const b = $('#btn-bgm');
    if (!b) return;
    b.style.display = CFG.BGM ? '' : 'none';
    b.classList.toggle('off', !bgm.on);
  }
  // 브라우저 정책상 첫 터치 후에 소리를 낼 수 있음
  addEventListener('pointerdown', () => {
    bgm.touched = true;
    if (actx && actx.state === 'suspended') actx.resume();
    startBgm();
  }, true);
  // 앱이 뒤로 가거나 화면이 꺼지면 멈춤
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (actx) actx.suspend(); if (bgm.el) bgm.el.pause(); }
    else { if (actx) actx.resume(); if (bgm.el && bgm.playing) bgm.el.play().catch(() => {}); }
  });

  const sndOk = () => beep([[784, .14], [988, .14], [1319, .3]]);
  const sndNg = () => beep([[220, .22], [165, .4]], 'square');
  const sndTap = () => beep([[660, .06]]);

  // ----- 화면 전환 -----
  let current = 'home';
  function show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + name));
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('show'));
    bgmVolume(CFG.BGM_VOLUME);
    stage.classList.toggle('quiz-mode', name === 'quiz' || name === 'result');
    current = name;
    clearInterval(resultTimer);
  }
  const openOv = (id) => $(id).classList.add('show');
  const closeOv = (el) => el.closest('.overlay').classList.remove('show');

  document.querySelectorAll('[data-home]').forEach(b => b.addEventListener('click', () => { sndTap(); goHome(); }));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { sndTap(); closeOv(b); }));

  function goHome() { lang = 'ko'; applyLang(); show('home'); }

  // ----- 무조작 시 처음 화면으로 -----
  let lastTouch = Date.now();
  addEventListener('pointerdown', () => { lastTouch = Date.now(); }, true);
  setInterval(() => {
    if (current !== 'home' && current !== 'result' && Date.now() - lastTouch > CFG.IDLE_SECONDS * 1000) goHome();
  }, 1000);

  // ----- 처음 화면: 언어 선택 -----
  document.querySelectorAll('.pill.lang').forEach(b => b.addEventListener('click', () => {
    sndTap();
    enterFullscreen();
    lang = b.dataset.lang; applyLang();
    studentId = '';
    if (CFG.ASK_ID) { renderId(); show('id'); } else startQuiz();
  }));

  // 앱으로 설치하지 않고 브라우저로 열었을 때도 전체화면으로
  function enterFullscreen() {
    const installed = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
    const el = document.documentElement;
    if (!installed && !document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }

  // ----- 학(사)번 입력 -----
  let studentId = '';
  const keypad = $('#keypad');
  [...'0123456789', 'back'].forEach(k => {
    const b = document.createElement('div');
    b.className = 'key' + (k === 'back' ? ' back' : '');
    b.innerHTML = k === 'back'
      ? '<svg width="70" height="40" viewBox="0 0 70 40"><path d="M66 20 H10 M24 6 L8 20 L24 34" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : k;
    b.addEventListener('click', () => {
      sndTap();
      if (k === 'back') studentId = studentId.slice(0, -1);
      else if (studentId.length < CFG.ID_MAX_LENGTH) studentId += k;
      renderId();
    });
    keypad.appendChild(b);
  });
  function renderId() { $('#id-box').textContent = studentId; }
  $('#btn-id-ok').addEventListener('click', () => {
    sndTap();
    if (studentId.length < CFG.ID_MIN_LENGTH) {
      $('#id-err-text').textContent = studentId.length === 0 ? t().idEmpty : t().idWrong;
      openOv('#ov-id');
      return;
    }
    startQuiz();
  });
  $('#btn-id-retry').addEventListener('click', () => { sndTap(); studentId = ''; renderId(); closeOv($('#btn-id-retry')); });

  // ----- 퀴즈 진행: 쉬운 문제 → 어려운 문제 순서 -----
  let questions = [], idx = 0, results = [], locked = false;

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function startQuiz() {
    const Q = window.QUIZ || { easy: [], hard: [] };
    questions = [
      ...shuffle(Q.easy).slice(0, CFG.EASY_COUNT).map(q => ({ ...q, level: 'easy' })),
      ...shuffle(Q.hard).slice(0, CFG.HARD_COUNT).map(q => ({ ...q, level: 'hard' })),
    ];
    idx = 0; results = [];
    show('quiz'); renderQuestion();
  }
  function renderQuestion() {
    const q = questions[idx], tx = text(q);
    locked = false;
    $('#q-count').innerHTML = t().count(idx + 1, questions.length);
    $('#q-dots').innerHTML = questions.map((_, i) =>
      `<i class="${i < idx ? (results[i].correct ? 'ok' : 'ng') : i === idx ? 'on' : ''}"></i>`).join('');
    $('#q-cat').innerHTML = `<span class="lv ${q.level}">${t().level[q.level]}</span>${esc(tx.category || '')}`;
    const el = $('#q-text');
    el.textContent = tx.question;
    const n = tx.question.length * (lang === 'en' ? 0.5 : 1);
    el.style.fontSize = n > 70 ? '50px' : n > 50 ? '54px' : '60px';
    document.querySelectorAll('.ox-btn').forEach(b => b.classList.remove('chosen', 'dim'));
  }
  document.querySelectorAll('.ox-btn').forEach(btn => btn.addEventListener('click', () => {
    if (locked) return;
    locked = true;
    const q = questions[idx], pick = btn.dataset.ans, correct = pick === q.answer;
    results.push({ q, pick, correct });
    document.querySelectorAll('.ox-btn').forEach(b => b.classList.add(b === btn ? 'chosen' : 'dim'));
    correct ? sndOk() : sndNg();
    setTimeout(() => showAnswer(q, correct), 250);
  }));
  function showAnswer(q, correct) {
    const v = $('#a-verdict');
    v.className = 'verdict ' + (correct ? 'ok' : 'ng');
    v.innerHTML = `<svg><use href="#mark-${correct ? 'o' : 'x'}"/></svg><span>${correct ? t().correct : t().wrong}</span>`;
    const color = q.answer === 'O' ? 'var(--blue)' : 'var(--red)';
    $('#a-chip').innerHTML = t().answerIs(`<b style="color:${color}">${q.answer}</b>`);
    $('#a-explain').textContent = text(q).explanation || '';
    $('#btn-next-label').textContent = idx + 1 < questions.length ? t().next : t().seeResult;
    openOv('#ov-answer');
    bgmVolume(CFG.BGM_VOLUME * 0.4);
  }
  $('#btn-next').addEventListener('click', () => {
    sndTap();
    $('#ov-answer').classList.remove('show');
    bgmVolume(CFG.BGM_VOLUME);
    idx++;
    if (idx < questions.length) renderQuestion(); else finish();
  });

  // ----- 결과 -----
  let resultTimer;
  function finish() {
    const total = questions.length, ok = results.filter(r => r.correct).length;
    const score = Math.round(ok / total * 100);
    saveRecord({ time: new Date().toISOString(), id: studentId, lang, score, correct: ok, total });
    show('result');
    $('#r-score').textContent = t().score(score);
    $('#r-sub').textContent = t().sub(total, ok);
    $('#r-msg').textContent = score >= 80 ? t().msgHigh : score >= 50 ? t().msgMid : t().msgLow;
    $('#btn-review').style.display = ok < total ? '' : 'none';
    let left = CFG.RESULT_SECONDS;
    const tick = () => { $('#r-countdown').textContent = t().countdown(left); };
    tick();
    resultTimer = setInterval(() => {
      if ($('#ov-review').classList.contains('show')) { left = CFG.RESULT_SECONDS; tick(); return; }
      if (--left <= 0) goHome(); else tick();
    }, 1000);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  $('#btn-review').addEventListener('click', () => {
    sndTap();
    $('#review-list').innerHTML = results.filter(r => !r.correct).map(r => `
      <div class="review-item">
        <div class="rq">${esc(text(r.q).question)}</div>
        <div class="ra">${t().mine(r.pick, r.q.answer)}</div>
        <div class="re">${esc(text(r.q).explanation || '')}</div>
      </div>`).join('');
    openOv('#ov-review');
  });

  // ----- 기록 (SCORE) -----
  function loadRecords() { try { return JSON.parse(localStorage.getItem(REC_KEY)) || []; } catch (e) { return []; } }
  function saveRecord(r) { try { const a = loadRecords(); a.push(r); localStorage.setItem(REC_KEY, JSON.stringify(a)); } catch (e) {} }
  const fmt = (iso) => { const d = new Date(iso), p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  function renderRecords() {
    const a = loadRecords();
    const avg = a.length ? Math.round(a.reduce((s, r) => s + r.score, 0) / a.length) : 0;
    $('#rec-summary').textContent = a.length ? `총 ${a.length}회 참여 · 평균 ${avg}점` : '아직 기록이 없습니다.';
    $('#rec-body').innerHTML = a.slice().reverse().map(r =>
      `<tr><td>${fmt(r.time)}</td><td>${esc(r.id || '-')}</td><td>${r.score}</td><td>${r.correct}/${r.total}</td></tr>`).join('');
  }
  $('#btn-records').addEventListener('click', () => { sndTap(); renderRecords(); openOv('#ov-records'); });
  $('#btn-csv').addEventListener('click', () => {
    const rows = [['일시', '학(사)번', '언어', '점수', '정답수', '문항수'],
      ...loadRecords().map(r => [fmt(r.time), r.id, r.lang === 'en' ? 'English' : '한국어', r.score, r.correct, r.total])];
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const name = `OX퀴즈_기록_${fmt(new Date().toISOString()).slice(0, 10)}.csv`;
    if (window.AndroidApp) {  // APK: 태블릿의 '다운로드' 폴더에 저장
      alert(window.AndroidApp.saveCsv(csv, name));
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = name;
    a.click();
  });
  $('#btn-clear').addEventListener('click', () => {
    if (confirm('저장된 기록을 모두 지울까요? 되돌릴 수 없습니다.')) {
      try { localStorage.removeItem(REC_KEY); } catch (e) {}
      renderRecords();
    }
  });

  // 길게 누르기 메뉴/드래그/두 손가락 확대 방지 (터치스크린)
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('dragstart', e => e.preventDefault());
  addEventListener('gesturestart', e => e.preventDefault());
  addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  applyLang();

  // 배경음악 켜기/끄기 버튼 (처음 화면)
  $('#btn-bgm').addEventListener('click', () => {
    bgm.on = !bgm.on;
    try { localStorage.setItem(BGM_KEY, bgm.on ? 'on' : 'off'); } catch (e) {}
    if (bgm.on) startBgm(); else stopBgm();
    renderBgmBtn();
  });
  renderBgmBtn();

  // APK에서 뒤로 가기 버튼 → 팝업 닫기 / 처음 화면 (앱이 꺼지지 않도록)
  window.quizBack = () => {
    if ($('#ov-answer').classList.contains('show')) return;  // 해설은 '다음 문제'로만 넘김
    const open = [...document.querySelectorAll('.overlay.show')];
    if (open.length) { open.forEach(o => o.classList.remove('show')); return; }
    if (current !== 'home') goHome();
  };

  // 오프라인 실행을 위한 서비스 워커 (https 또는 localhost에서만 동작)
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
