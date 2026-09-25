/* Animatic player shared by the series pages.
 *
 *   const open = Player.mount({ shots, frames, aspect: [16, 9], colorOf: (shot) => '#hex' });
 *   open(0);   // plays from shot 0
 *
 * shots[i] = { id, dur (seconds), en, ko, cam: 'label', k: 'push'|'pull'|'pan'|'static' }
 * frames[i] = SVG markup string (from Theater.scene).
 */
(function (root) {
  const CSS = `
  .p-wrap{position:fixed;inset:0;z-index:50;background:rgba(255,248,236,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:calc(16px + env(safe-area-inset-top,0px)) 16px calc(16px + env(safe-area-inset-bottom,0px))}
  .p-screen{max-width:100%;border-radius:14px;overflow:hidden;background:#fff4dc;box-shadow:0 0 0 3px #3a2418,8px 10px 0 #3a2418}
  .p-screen svg{display:block;width:100%;height:100%}
  .p-bar{display:flex;flex-direction:column;gap:10px;max-width:100%}
  .p-prog{position:relative;height:14px;border-radius:7px;display:flex;overflow:hidden;cursor:pointer;background:#f1e3c8;border:2px solid #3a2418}
  .p-prog i{display:block;height:100%;opacity:.55;border-right:1px solid rgba(58,36,24,.35)}
  .p-head{position:absolute;top:0;bottom:0;left:0;width:0;background:rgba(58,36,24,.35);pointer-events:none;border-right:3px solid #3a2418}
  .p-ctrl{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .p-ctrl button,.p-close{background:#fffdf5;color:#3a2418;border:2px solid #3a2418;border-radius:10px;min-width:44px;height:40px;padding:0 12px;font:500 13px "IBM Plex Mono",ui-monospace,monospace;cursor:pointer;box-shadow:2px 3px 0 #3a2418}
  .p-ctrl button:active,.p-close:active{transform:translate(1px,2px);box-shadow:1px 1px 0 #3a2418}
  .p-ctrl .pp{background:#ffd23f;min-width:84px}
  .p-time{font:13px "IBM Plex Mono",ui-monospace,monospace;color:#6b4a36;font-variant-numeric:tabular-nums}
  .p-info{flex:1 1 220px;min-width:0;font-size:13px;color:#6b4a36}
  .p-info b{font:700 20px Gaegu,"Gowun Dodum",sans-serif;color:#3a2418;margin-right:8px}
  .p-close{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:16px}
  .p-wrap :focus-visible{outline:3px solid #f062a8;outline-offset:3px}
  .cam{transform-box:view-box;transform-origin:50% 50%}
  @keyframes cam-push{from{transform:scale(1)}to{transform:scale(1.08)}}
  @keyframes cam-pull{from{transform:scale(1.08)}to{transform:scale(1)}}
  @keyframes cam-pan{from{transform:scale(1.06) translateX(14px)}to{transform:scale(1.06) translateX(-14px)}}
  @keyframes cam-static{from{transform:none}to{transform:none}}
  @keyframes boil{0%{filter:url(#ink)}33%{filter:url(#ink2)}66%{filter:url(#ink3)}}
  .boil g[filter="url(#ink)"]{animation:boil .5s steps(1,end) infinite}
  @media (prefers-reduced-motion: reduce){.boil g[filter="url(#ink)"]{animation:none}.cam{animation:none!important}}`;
  const fmt = (s) => { s = Math.max(0, Math.floor(s + 1e-6)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function mount(opts) {
    const shots = opts.shots, frames = opts.frames, [aw, ah] = opts.aspect || [16, 9];
    const colorOf = opts.colorOf || (() => '#ffd23f');
    if (!document.getElementById('player-css')) { const st = document.createElement('style'); st.id = 'player-css'; st.textContent = CSS; document.head.appendChild(st); }
    let t = 0; shots.forEach((s) => { s.start = t; t += s.dur; }); const TOTAL = t;
    const wrap = document.createElement('div'); wrap.className = 'p-wrap'; wrap.hidden = true;
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Animatic player');
    const W = `min(100%, 1100px, calc((100vh - 200px) * ${aw} / ${ah}))`;
    wrap.innerHTML = `<button class="p-close" type="button">Close · Esc</button><div class="p-screen" style="width:${W};aspect-ratio:${aw}/${ah}"></div>
      <div class="p-bar" style="width:max(${W}, min(100%, 560px))"><div class="p-prog" role="slider" tabindex="0" aria-label="Animatic position" aria-valuemin="0" aria-valuemax="${TOTAL}" aria-valuenow="0">${shots.map((s) => `<i style="flex:${s.dur} 1 0;background:${colorOf(s)}"></i>`).join('')}<div class="p-head"></div></div>
      <div class="p-ctrl"><button type="button" data-a="prev" aria-label="Previous shot">◀◀</button><button type="button" class="pp" data-a="play">Pause</button><button type="button" data-a="next" aria-label="Next shot">▶▶</button><span class="p-time"></span><div class="p-info"></div></div></div>`;
    document.body.appendChild(wrap);
    const screen = wrap.querySelector('.p-screen'), prog = wrap.querySelector('.p-prog'), head = wrap.querySelector('.p-head'), btn = wrap.querySelector('.pp'), timeEl = wrap.querySelector('.p-time'), info = wrap.querySelector('.p-info');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const P = { i: 0, playing: false, t0: 0, el: 0, raf: 0, last: null };
    const cam = () => screen.querySelector('.cam');
    function paint(sec) { head.style.width = (sec / TOTAL * 100) + '%'; timeEl.textContent = fmt(sec) + ' / ' + fmt(TOTAL); prog.setAttribute('aria-valuenow', Math.floor(sec)); }
    function show(i) {
      P.i = Math.max(0, Math.min(shots.length - 1, i)); P.el = 0; P.t0 = performance.now(); const s = shots[P.i];
      screen.innerHTML = frames[P.i];
      if (!reduce) { screen.classList.add('boil'); const c = cam(); if (c) { c.style.animation = `cam-${s.k || 'static'} ${s.dur}s linear both`; c.style.animationPlayState = P.playing ? 'running' : 'paused'; } }
      info.innerHTML = `<b>${esc(s.id)}</b>${esc(s.en || '')}${s.cam ? ` <span style="opacity:.7">· ${esc(s.cam)}</span>` : ''}`;
      paint(s.start);
    }
    function tick(now) {
      if (!P.playing) return; const s = shots[P.i], el = P.el + (now - P.t0) / 1000;
      if (el >= s.dur) { if (P.i < shots.length - 1) show(P.i + 1); else { P.el = s.dur; pause(); paint(TOTAL); return; } } else paint(s.start + el);
      P.raf = requestAnimationFrame(tick);
    }
    function play() { if (P.playing) return; if (P.i === shots.length - 1 && P.el >= shots[P.i].dur) show(0); P.playing = true; P.t0 = performance.now(); const c = cam(); if (c) c.style.animationPlayState = 'running'; btn.textContent = 'Pause'; P.raf = requestAnimationFrame(tick); }
    function pause() { if (!P.playing) return; P.el += (performance.now() - P.t0) / 1000; P.playing = false; cancelAnimationFrame(P.raf); const c = cam(); if (c) c.style.animationPlayState = 'paused'; btn.textContent = 'Play'; }
    function jump(i) { const was = P.playing; pause(); show(i); if (was) play(); }
    function open(i) { P.last = document.activeElement; wrap.hidden = false; document.documentElement.style.overflow = 'hidden'; P.playing = false; show(i || 0); play(); wrap.querySelector('.p-close').focus(); }
    function close() { pause(); wrap.hidden = true; screen.innerHTML = ''; document.documentElement.style.overflow = ''; if (P.last && P.last.focus) P.last.focus(); }
    wrap.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.classList.contains('p-close')) close(); else if (b.dataset.a === 'play') P.playing ? pause() : play(); else if (b.dataset.a === 'prev') jump(P.i - 1); else if (b.dataset.a === 'next') jump(P.i + 1); });
    prog.addEventListener('click', (e) => { const r = prog.getBoundingClientRect(), sec = (e.clientX - r.left) / r.width * TOTAL; let i = shots.findIndex((s) => sec < s.start + s.dur); if (i < 0) i = shots.length - 1; jump(i); });
    document.addEventListener('keydown', (e) => {
      if (wrap.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); P.playing ? pause() : play(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); jump(P.i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); jump(P.i - 1); }
      else if (e.key === 'Tab') { const f = [...wrap.querySelectorAll('button,[tabindex="0"]')], a = f.indexOf(document.activeElement); if (e.shiftKey && a <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && a === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
    return open;
  }
  root.Player = { mount, fmt };
})(window);
