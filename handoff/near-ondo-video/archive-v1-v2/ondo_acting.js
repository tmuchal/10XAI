  // ---------- Curtains, scene switching, acting ----------
  const curL = $('curL'), curR = $('curR');
  gsap.set(curL, {x:-8}); gsap.set(curR, {x:8});
  gsap.set(S.slice(1), {autoAlpha:0});
  gsap.set(footer, {opacity:0});
  tl.to(curL, {x:-680, duration:.9, ease:'power3.out'}, .9);
  tl.to(curR, {x:680, duration:.9, ease:'power3.out'}, .9);
  // Chapters swap under a whip-pan + flash (driven by the cut engine), not a curtain.
  SC.forEach((sc, i) => {
    if (!i) return;
    tl.set(S[i-1], {autoAlpha:0}, sc.t);
    tl.set(S[i], {autoAlpha:1}, sc.t);
    tl.to(pose, {hop:-30, duration:.16, yoyo:true, repeat:1, ease:'power1.out'}, sc.t + .2);
  });
  tl.to(curL, {x:-8, duration:.6, ease:'power2.inOut'}, 28.0);
  tl.to(curR, {x:8, duration:.6, ease:'power2.inOut'}, 28.0);

  tl.set(pose, {walk:1}, 1.0); tl.to(pose, {x:200, duration:1.0, ease:'power1.out'}, 1.0); tl.set(pose, {walk:0}, 2.0);
  tl.to(pose, {eye:1, bR:-10, bL:4, duration:.2}, 2.9);
  tl.to(pose, {eye:0, bR:0, bL:0, duration:.2}, 4.3);
  tl.to(pose, {arm:-26, duration:.35, ease:'back.out(2)'}, 5.1);
  tl.to(pose, {arm:40, duration:.5}, 9.2);
  tl.to(pose, {arm:-18, duration:.35, ease:'back.out(2)'}, 12.6);
  tl.to(pose, {arm:40, duration:.5}, 15.6);
  tl.to(pose, {eye:1, bR:-10, bL:4, duration:.2}, 19.1);
  tl.to(pose, {eye:0, bR:0, bL:0, duration:.2}, 20.8);
  tl.to(pose, {arm:-30, duration:.35, ease:'back.out(2)'}, 25.0);
  tl.to(pose, {arm:40, duration:.5}, 27.4);
  tl.set(pose, {walk:1}, 28.3); tl.to(pose, {x:800, duration:1.0, ease:'power1.inOut'}, 28.3); tl.set(pose, {walk:0}, 29.3);
  tl.to(pose, {hatY:-46, hatR:-26, lean:14, duration:.4, ease:'back.out(2)'}, 29.6);
  tl.to(pose, {hatY:0, hatR:0, lean:0, duration:.45, ease:'power2.inOut'}, 30.5);

  // ---------- Virtual camera ----------
  const cam3 = {s:1, x:0, y:0, rx:0, ry:0, rz:0};
  const N0 = {s:1, x:0, y:0, rx:0, ry:0, rz:0};
  const camMove = (at, to, dur, ease) => tl.to(cam3, Object.assign({duration:dur || 1.2, ease:ease || 'power3.inOut'}, to), at);
  const camFrom = (at, from, dur) => { tl.set(cam3, Object.assign({}, N0, from), at); tl.to(cam3, Object.assign({duration:dur || 1.6, ease:'power3.out'}, N0), at + .01); };
  camFrom(.9, {s:1.18, ry:-10, rx:5, y:3}, 2.0);
  camMove(3.1, {s:1.12}, .15, 'power2.out'); camMove(3.3, N0, .8, 'elastic.out(1,.5)');
  SC.forEach((sc, i) => { if (i && i < SC.length - 1) camFrom(sc.t, {s:1.16, ry:i % 2 ? 9 : -9, rx:4, rz:i % 2 ? -1.5 : 1.5}, 1.5); });
  camMove(12.5, {s:1.28, x:-16, y:1}, .5, 'power3.out'); camMove(14.3, N0, .8);
  camMove(19.0, {s:1.2, x:13, y:4, rz:-1}, .5); camMove(20.4, N0, .5);
  camMove(22.0, {s:1.14, y:2}, 1.8, 'sine.inOut'); camMove(23.9, N0, .5);
  camMove(25.9, {s:1.25, x:-18, y:-2}, .6, 'power3.out'); camMove(27.3, N0, .6);
  camMove(28.0, {s:1.1, y:-2}, 2.4, 'power2.inOut');
  tl.to({}, {duration:.01}, D - .01);
