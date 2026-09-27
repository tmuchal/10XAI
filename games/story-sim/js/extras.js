/* 운명극장 — extras: generative music & sound, blinking/lip-flap, save slots, character profiles.
   Hooks into engine.js through the HOOK object. */
'use strict';

(() => {
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (PREF.sound == null) PREF.sound = true;

  /* ---------------- audio ---------------- */
  const A = { ctx: null, master: null, bus: null, noise: null, kind: null, next: 0, bar: 0, timer: 0 };
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function ensure() {
    if (A.ctx) return A.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const c = A.ctx = new AC();
    A.master = c.createGain(); A.master.gain.value = PREF.sound ? 0.5 : 0; A.master.connect(c.destination);
    A.bus = c.createGain(); A.bus.connect(A.master);
    const d = c.createDelay(1); d.delayTime.value = 0.31;
    const fb = c.createGain(); fb.gain.value = 0.3;
    const wet = c.createGain(); wet.gain.value = 0.22;
    A.bus.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(A.master);
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    A.noise = buf;
    return c;
  }
  function tone(f, t, dur, o = {}) {
    const c = A.ctx, os = c.createOscillator(), g = c.createGain();
    os.type = o.type || 'sine';
    os.frequency.setValueAtTime(f, t);
    if (o.bend) os.frequency.exponentialRampToValueAtTime(f * o.bend, t + Math.min(dur, o.bendT || dur));
    const v = o.vol ?? 0.08;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.008));
    if (o.hold) g.gain.setValueAtTime(v, t + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = os;
    if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; os.connect(fl); n = fl; }
    n.connect(g); g.connect(o.dry ? A.master : A.bus);
    os.start(t); os.stop(t + dur + 0.05);
  }
  function hat(t, vol = 0.03) {
    const c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noise; f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(f); f.connect(g); g.connect(A.master); s.start(t); s.stop(t + 0.08);
  }
  const kick = t => tone(140, t, 0.32, { bend: 0.3, bendT: 0.12, vol: 0.22, dry: true });
  const bell = (m, t, vol = 0.05, dur = 1.4) => { tone(mf(m), t, dur, { vol }); tone(mf(m) * 2.01, t, dur * 0.6, { vol: vol * 0.35 }); };

  const SONGS = {
    title: { bpm: 64, chords: [[50, 53, 57], [55, 58, 62], [57, 61, 64], [50, 53, 57]],
      bar(t, ch, b, q) {
        ch.forEach(m => tone(mf(m - 12), t, q * 4.2, { type: 'triangle', vol: 0.03, a: 0.6, lp: 1100 }));
        [0, 1, 2, 1].forEach((k, i) => bell(ch[k] + 12 + (i === 2 && b % 2 ? 2 : 0), t + i * q, 0.04, 2));
      } },
    rofan: { bpm: 72, chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]],
      bar(t, ch, b, q) {
        ch.forEach(m => tone(mf(m - 12), t, q * 4.3, { type: 'sawtooth', vol: 0.018, a: 0.7, lp: 800 }));
        tone(mf(ch[0] - 24), t, q * 4, { type: 'sine', vol: 0.05, a: 0.05 });
        const arp = [0, 1, 2, 3, 4, 3, 2, 1].map(i => i < 3 ? ch[i] + 12 : ch[i - 3] + 24);
        arp.forEach((m, i) => tone(mf(m), t + i * q / 2, 1.6, { type: 'triangle', vol: 0.035 }));
      } },
    raise: { bpm: 92, chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]],
      bar(t, ch, b, q) {
        tone(mf(ch[0] - 12), t, q * 2, { type: 'triangle', vol: 0.05 });
        tone(mf(ch[0] - 12), t + q * 2, q * 2, { type: 'triangle', vol: 0.04 });
        [0, 2, 1, 2, 0, 2, 1, 2].forEach((k, i) => bell(ch[k] + 24, t + i * q / 2, i % 2 ? 0.02 : 0.035, 0.9));
        if (b % 2 === 0) bell(ch[2] + 36, t + q * 3, 0.025, 1.8);
      } },
    star: { bpm: 112, chords: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]],
      bar(t, ch, b, q) {
        for (let i = 0; i < 4; i++) { kick(t + i * q); hat(t + i * q + q / 2); }
        for (let i = 0; i < 8; i++) tone(mf(ch[0] - 12), t + i * q / 2, q / 2.2, { type: 'square', vol: 0.03, lp: 420 });
        [1, 3].forEach(i => ch.forEach(m => tone(mf(m + 12), t + i * q, q * 0.45, { type: 'sawtooth', vol: 0.014, lp: 2200 })));
        const lead = [0, 2, 1, 2, 0, 1, 2, 1, 0, 2, 1, 2, 2, 1, 0, 1];
        if (b % 4 > 1) lead.forEach((k, i) => tone(mf(ch[k] + 24), t + i * q / 4, q / 4, { type: 'square', vol: 0.008, lp: 3000 }));
      } },
    murim: { bpm: 60, chords: [[38, 45], [38, 45], [36, 43], [41, 48]],
      bar(t, ch, b, q) {
        ch.forEach(m => tone(mf(m), t, q * 4.2, { type: 'sine', vol: 0.045, a: 1.2 }));
        const scale = [62, 65, 67, 69, 72, 74, 77, 79];
        let k = (b * 3) % 5;
        const hits = [0, 1, 1.5, 2.5, 3];
        hits.forEach(h => {
          if (Math.random() < 0.25) return;
          k = Math.max(0, Math.min(scale.length - 1, k + Math.floor(Math.random() * 3) - 1));
          tone(mf(scale[k]), t + h * q, 1.8, { type: 'triangle', vol: 0.05, bend: 0.985, bendT: 0.4 });
          if (Math.random() < 0.3) tone(mf(scale[k] + 12), t + h * q + 0.07, 0.9, { type: 'triangle', vol: 0.02 });
        });
      } },
  };
  function schedule() {
    const c = A.ctx; if (!c || !A.kind) return;
    const song = SONGS[A.kind]; if (!song) return;
    const q = 60 / song.bpm;
    while (A.next < c.currentTime + 0.35) {
      if (A.next < c.currentTime) A.next = c.currentTime + 0.05;
      song.bar(A.next, song.chords[A.bar % song.chords.length], A.bar, q);
      A.next += q * 4; A.bar++;
    }
  }
  function music(kind) {
    A.kind = kind && SONGS[kind] ? kind : null;
    A.bar = 0;
    if (A.ctx) A.next = A.ctx.currentTime + 0.1;
    clearInterval(A.timer);
    if (A.kind) A.timer = setInterval(() => { if (!document.hidden && PREF.sound) schedule(); }, 120);
  }
  function sfx(k) {
    if (!A.ctx || !PREF.sound) return;
    const t = A.ctx.currentTime + 0.01;
    if (k === 'select') { tone(880, t, 0.12, { vol: 0.05, dry: true }); tone(1320, t + 0.05, 0.14, { vol: 0.04, dry: true }); }
    if (k === 'heart') [76, 80, 83].forEach((m, i) => bell(m + 12, t + i * 0.08, 0.04, 0.8));
    if (k === 'ending') [62, 66, 69, 74, 78].forEach((m, i) => bell(m, t + i * 0.22, 0.05, 3));
  }
  function setSound(on) {
    PREF.sound = on; store.set('unmyeong-pref', PREF);
    if (on) { ensure(); A.ctx?.resume?.(); }
    if (A.master) A.master.gain.setTargetAtTime(on ? 0.5 : 0, A.ctx.currentTime, 0.1);
    document.querySelectorAll('.sound-btn').forEach(b => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }
  // audio may only start after a gesture
  const unlock = () => {
    if (!PREF.sound) return;
    const c = ensure(); if (!c) return;
    c.resume?.();
    if (A.kind) A.next = c.currentTime + 0.1;
    removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock);
  };
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);

  /* ---------------- blinking & lip flap ---------------- */
  function blink(svg) {
    const eo = svg.querySelectorAll('.eo'), ec = svg.querySelectorAll('.ec');
    if (!ec.length || !eo.length) return;
    eo.forEach(g => { g.style.opacity = 0; }); ec.forEach(g => { g.style.opacity = 1; });
    setTimeout(() => { eo.forEach(g => { g.style.opacity = ''; }); ec.forEach(g => { g.style.opacity = 0; }); }, 120);
  }
  if (!REDUCE) setInterval(() => {
    if (document.hidden) return;
    document.querySelectorAll('#chars .ch svg, .hubchar svg, #ending .ec svg, .prof .pp svg, .bill .art svg').forEach(svg => { if (Math.random() < 0.33) blink(svg); });
  }, 1300);
  let flapT = 0;
  function flap(who, on) {
    clearInterval(flapT);
    const reset = () => { document.querySelectorAll('#chars .mo').forEach(g => { g.style.opacity = 0; }); document.querySelectorAll('#chars .mc').forEach(g => { g.style.opacity = ''; }); };
    reset();
    if (!on || !who || REDUCE) return;
    const node = document.querySelector(`#chars .ch[data-id="${CSS.escape(who)}"] svg`);
    if (!node || !node.querySelector('.mo')) return;
    let open = false;
    flapT = setInterval(() => {
      open = !open;
      node.querySelectorAll('.mo').forEach(g => { g.style.opacity = open ? 1 : 0; });
      node.querySelectorAll('.mc').forEach(g => { g.style.opacity = open ? 0 : ''; });
    }, 110);
  }

  /* ---------------- save slots ---------------- */
  const SLOTS = 3;
  const slotKey = (pid, n) => `unmyeong-slot-${pid}-${n}`;
  function slotLabel(sv) {
    if (!sv) return '비어 있음';
    const when = new Date(sv.savedAt || Date.now());
    const stamp = `${when.getMonth() + 1}/${when.getDate()} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
    let where = '';
    if (P.sim) where = dateLabel(simDate(sv.turn || 0));
    const last = (sv.log || []).slice().reverse().find(l => l.t);
    return `${stamp}${where ? ' · ' + where : ''}${last ? ' · ' + last.t.slice(0, 26) + (last.t.length > 26 ? '…' : '') : ''}`;
  }
  function openSlots() {
    const auto = store.get(saveKey(P.id), null);
    const rows = [];
    for (let n = 1; n <= SLOTS; n++) {
      const sv = store.get(slotKey(P.id, n), null);
      rows.push(`<div class="slotrow"><div class="si"><b>슬롯 ${n}</b><small>${esc(slotLabel(sv))}</small></div>
        <button class="tab" type="button" data-a="slot-save" data-v="${n}">저장</button>
        <button class="tab" type="button" data-a="slot-load" data-v="${n}" ${sv ? '' : 'disabled'}>불러오기</button></div>`);
    }
    sheet('저장 · 불러오기', `<div class="slots-list">${rows.join('')}
      <div class="slotrow"><div class="si"><b>자동 저장</b><small>${esc(slotLabel(auto))}</small></div></div></div>
      <p class="sub" style="letter-spacing:0">저장은 이 브라우저에만 남습니다.</p>`);
  }
  function slotSave(n) {
    const c = JSON.parse(JSON.stringify(S));
    if (S.mode === 'vn' && c.stack.length) c.stack[c.stack.length - 1].i -= 1;
    c.savedAt = Date.now();
    store.set(slotKey(P.id, n), c);
    toast(`슬롯 ${n}에 저장했습니다`);
    openSlots();
  }
  function slotLoad(n) {
    const sv = store.get(slotKey(P.id, n), null); if (!sv) return;
    UIS.typing?.(); UIS.advance = null; UIS.auto = false; UIS.skip = false;
    ['#chat', '#play', '#card'].forEach(sel => document.querySelector(sel)?.remove());
    $('#choices').hidden = true;
    closeSheet();
    store.set(saveKey(P.id), sv);
    $('#chars').innerHTML = '';
    continueGame(P.id);
    toast(`슬롯 ${n}을 불러왔습니다`);
  }

  /* ---------------- profiles ---------------- */
  function openProfile(id) {
    const c = charDef(id); if (!c) return;
    const pr = c.profile || {};
    const aff = S.aff[affId(id)] ?? 0;
    const facts = [['나이', pr.age], ['칭호', pr.title || c.role], ['좋아하는 것', (pr.likes || []).join(', ')], ['싫어하는 것', (pr.dislikes || []).join(', ')]]
      .filter(([, v]) => v).map(([k, v]) => `<div class="kv"><span>${k}</span><b>${esc(interp(v))}</b></div>`).join('');
    const secrets = (pr.secrets || []).map(s => {
      const open = aff >= (s.aff || 0) && (!s.flag || S.flags[s.flag]);
      return open ? `<li>${esc(interp(s.t))}</li>` : `<li class="lock">호감도 ${s.aff || 0} 이상${s.flag ? ' · 특정 사건 이후' : ''}에서 공개</li>`;
    }).join('');
    sheet(charName(id), `
      <div class="prof"><div class="pp">${portrait(id, aff >= 60 ? 'smile' : 'neutral')}</div>
        <div class="pi"><span class="heart">♥ ${aff}</span>${facts}</div></div>
      ${pr.bio ? `<p class="bio">${esc(interp(pr.bio))}</p>` : ''}
      ${secrets ? `<div class="sub">비밀</div><ul class="secrets">${secrets}</ul>` : ''}
      <button class="ghost" type="button" data-a="stats">관계 목록으로</button>`);
  }

  /* ---------------- menu & actions ---------------- */
  HOOK.menuExtra = () => `<div class="sub">소리</div><div class="tabs">
    <button class="tab ${PREF.sound ? 'on' : ''}" type="button" data-a="sound-on">음악·효과음 켜기</button>
    <button class="tab ${PREF.sound ? '' : 'on'}" type="button" data-a="sound-off">끄기</button></div>`;
  HOOK.action = (a, v) => {
    switch (a) {
      case 'slots': openSlots(); break;
      case 'slot-save': slotSave(+v); break;
      case 'slot-load': slotLoad(+v); break;
      case 'profile': openProfile(v); break;
      case 'sound': setSound(!PREF.sound); break;
      case 'sound-on': setSound(true); openMenu(); break;
      case 'sound-off': setSound(false); openMenu(); break;
    }
  };
  HOOK.music = music;
  HOOK.sfx = sfx;
  HOOK.flap = flap;

  // title sound toggle
  const sb = el('button', 'ibtn sound-btn' + (PREF.sound ? ' on' : ''), `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>`);
  sb.type = 'button'; sb.dataset.a = 'sound'; sb.setAttribute('aria-label', '음악 켜기/끄기'); sb.setAttribute('aria-pressed', PREF.sound);
  $('#title').appendChild(sb);
})();
