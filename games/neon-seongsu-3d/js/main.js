'use strict';
/* =========================================================================
   NEON SEONGSU: DEAD RAIN — engine, player, camera, UI, missions, audio
   ========================================================================= */
const GAME={t:0,minutes:21*60+30,day:1,hour:21,night:true,money:0,diff:1,safe:false,calm:false,paused:true,state:'title',
  inv:{scrap:15,chips:0,owned:{pistol:true,katana:true},ammo:{pistol:48,smg:0,shotgun:0},mag:{pistol:12,smg:0,shotgun:0},up:{pistol:0,smg:0,shotgun:0,katana:0},unlocked:{},perks:{engine:0,vest:0}},
  story:0,rescued:{kang:false,taeo:false},survivors:0,kills:0,contractsDone:0,board:null};
const PL={kind:'player',x:0,z:0,yaw:0,y:0,vy:0,hp:100,armor:0,stamina:100,r:.4,scale:1,inCar:null,dead:false,noiseT:0,noiseR:0,weapon:'pistol',reload:0,fireCD:0,sprinting:false,h:null,hurtT:0,cover:false,flash:true};
const CAM={yaw:Math.PI,pitch:.22,aim:0,shake:0,carFollow:1};
let FILL,renderer,scene,camera,composer,bloom,hemi,moon,flashLight,headL=[],sky,rain,splash;
let QUALITY='high';
try{QUALITY=localStorage.getItem('ns3d-quality')||(matchMedia('(pointer:coarse)').matches?'low':'high')}catch(e){}
const QSET={high:{pr:Math.min(devicePixelRatio||1,1.5),reflect:true,bloom:true},med:{pr:1,reflect:false,bloom:true},low:{pr:.8,reflect:false,bloom:false}};

/* ---------- audio ---------- */
const AU={ctx:null};
function audioInit(){
  if(AU.ctx)return;try{const ac=new(window.AudioContext||window.webkitAudioContext)();AU.ctx=ac;
  AU.master=ac.createGain();AU.master.gain.value=.6;AU.master.connect(ac.destination);
  AU.sfx=ac.createGain();AU.sfx.gain.value=.8;AU.sfx.connect(AU.master);AU.music=ac.createGain();AU.music.gain.value=0;AU.music.connect(AU.master);
  const nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=nb;
  const rs=ac.createBufferSource();rs.buffer=nb;rs.loop=true;const rf=ac.createBiquadFilter();rf.type='bandpass';rf.frequency.value=2600;rf.Q.value=.35;const rg=ac.createGain();rg.gain.value=.05;rs.connect(rf);rf.connect(rg);rg.connect(AU.master);rs.start();AU.rain=rg;
  const dr=ac.createOscillator();dr.type='sawtooth';dr.frequency.value=41;const df=ac.createBiquadFilter();df.type='lowpass';df.frequency.value=180;const dg=ac.createGain();dg.gain.value=.025;dr.connect(df);df.connect(dg);dg.connect(AU.master);dr.start();AU.drone=dg;
  AU.eng=ac.createOscillator();AU.eng.type='sawtooth';AU.engF=ac.createBiquadFilter();AU.engF.type='lowpass';AU.engG=ac.createGain();AU.engG.gain.value=0;AU.eng.connect(AU.engF);AU.engF.connect(AU.engG);AU.engG.connect(AU.sfx);AU.eng.start();
  AU.next=ac.currentTime;AU.step=0;setInterval(radioTick,25);
  }catch(e){AU.ctx=null}
}
function tone(f,d,type='square',v=.15,f2=null,when=0,dest=null){if(!AU.ctx)return;const ac=AU.ctx,t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(dest||AU.sfx);o.start(t);o.stop(t+d+.02)}
function noise(d,v=.3,f=1000,type='lowpass',when=0,dest=null){if(!AU.ctx)return;const ac=AU.ctx,t=ac.currentTime+when,s=ac.createBufferSource();s.buffer=AU.noise;s.playbackRate.value=rnd(.8,1.2);const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;const g=ac.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0005,t+d);s.connect(fl);fl.connect(g);g.connect(dest||AU.sfx);s.start(t);s.stop(t+d+.02)}
function sfx(k,x,z){
  if(!AU.ctx||GAME.state!=='play')return;let v=1;if(x!==undefined){const d=Math.hypot(x-PL.x,z-PL.z);v=clamp(1-d/90,0,1);if(v<.02)return}
  switch(k){
    case'shot':noise(.18,.5*v,2400);tone(110,.12,'sine',.35*v,40);break;
    case'shot2':noise(.22,.3*v,1300);tone(90,.14,'sine',.2*v,40);break;
    case'shotgun':noise(.35,.7*v,1600);tone(70,.25,'sine',.45*v,30);break;
    case'turret':noise(.08,.18*v,3500,'highpass');break;
    case'boom':noise(1.2,.8*v,260);tone(70,.9,'sine',.5*v,25);break;
    case'groan':{const f=rnd(70,120);tone(f,.9,'sawtooth',.06*v,f*.7);noise(.7,.05*v,500,'bandpass');break}
    case'splat':noise(.15,.35*v,700);break;
    case'crash':noise(.4,.5*v,600);tone(60,.3,'triangle',.3*v,30);break;
    case'thud':noise(.12,.3*v,400);break;
    case'pick':tone(880,.07,'square',.08);tone(1320,.1,'square',.08,null,.06);break;
    case'build':noise(.1,.3,900);tone(300,.15,'square',.08,600,.05);break;
    case'deny':tone(180,.2,'square',.08,120);break;
    case'alarm':for(let i=0;i<4;i++){tone(660,.25,'square',.1,null,i*.5);tone(440,.25,'square',.1,null,i*.5+.25)}break;
    case'pass':[0,4,7,12].forEach((n,i)=>tone(440*Math.pow(2,n/12),.5,'sawtooth',.08,null,i*.09));break;
    case'fail':[0,-3,-7].forEach((n,i)=>tone(220*Math.pow(2,n/12),.45,'sawtooth',.1,null,i*.16));break;
    case'hit':tone(1800,.04,'square',.05);break;
    case'kill':tone(1200,.05,'square',.06);tone(1800,.08,'square',.05,null,.04);break;
    case'whiz':noise(.12,.12,3000,'bandpass');break;
    case'msg':tone(1320,.06,'sine',.08);tone(1760,.08,'sine',.08,null,.07);break;
    case'swing':noise(.18,.2,2600,'bandpass');break;
    case'reload':noise(.05,.2,2000);noise(.05,.2,1500,'lowpass',.3);break;
    case'empty':tone(900,.03,'square',.05);break;
    case'hurt':noise(.2,.3,400);break;
    case'horn':tone(330,.35,'square',.12);tone(415,.35,'square',.1);break;
    case'door':noise(.1,.3,800);break;
    case'boost':tone(200,.6,'sine',.2,60);noise(.5,.15,1200,'bandpass');break;
  }
}
/* car radio: procedural synthwave */
let radioOn=true;
function radioTick(){if(!AU.ctx)return;const ac=AU.ctx,on=PL.inCar&&radioOn&&!GAME.paused&&GAME.state==='play';AU.music.gain.setTargetAtTime(on?.28:0,ac.currentTime,.3);
  const sp=60/100/4;if(AU.next<ac.currentTime-.2)AU.next=ac.currentTime+.05;
  while(AU.next<ac.currentTime+.15){if(on){const s=AU.step,bar=Math.floor(s/16)%4,k=s%16,r=[57,53,48,55][bar],w=AU.next-ac.currentTime,M=AU.music,mf=m=>440*Math.pow(2,(m-69)/12);
    if(k%4===0)tone(120,.25,'sine',.6,40,w,M);if(k%8===4)noise(.18,.22,1800,'bandpass',w,M);if(k%2===1)noise(.04,.05,7000,'highpass',w,M);
    if(k%2===0)tone(mf(r-24+(k%4===2?12:0)),sp*1.8,'sawtooth',.11,null,w,M);tone(mf(r+12+[0,3,7][k%3]+(k>=8?12:0)),sp*.9,'square',.03,null,w,M)}
    AU.next+=sp;AU.step++}}

/* ---------- UI helpers ---------- */
let toastN=0;
function toast(text,col='#ece9ff'){const el=document.createElement('div');el.className='toast';el.style.setProperty('--c',col);el.textContent=text;$('toasts').prepend(el);setTimeout(()=>el.classList.add('out'),2600);setTimeout(()=>el.remove(),3200);while($('toasts').children.length>5)$('toasts').lastChild.remove()}
let bannerT=0;
function banner(main,sub='',cls=''){$('bMain').textContent=main;$('bMain').className='b-main '+cls;$('bSub').textContent=sub;$('banner').classList.add('show');bannerT=3.4}
const MSGQ=[];let msgT=0;
function msg(who,ko,en){MSGQ.push({who,ko,en})}
function camShake(v){CAM.shake=Math.max(CAM.shake,v)}
function hurtPlayer(d,src,from){
  if(PL.dead||GAME.state!=='play'||GAME.god)return;
  if(PL.armor>0){const a=Math.min(PL.armor,d*.6);PL.armor-=a;d-=a}
  PL.hp-=d;PL.hurtT=1;camShake(.25);sfx('hurt');
  if(from){const a=Math.atan2(from.x-PL.x,from.z-PL.z)-CAM.yaw;showDmgDir(a)}
  if(PL.hp<=0)playerDie(src);
}
function showDmgDir(a){const el=$('dmgdir');el.style.transform=`translate(-50%,-50%) rotate(${-a+Math.PI}rad)`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}

/* ---------- init ---------- */
function initGame(){
  const q=QSET[QUALITY];
  renderer=new THREE.WebGLRenderer({canvas:$('c3d'),antialias:QUALITY==='high',powerPreference:'high-performance'});
  renderer.setPixelRatio(q.pr);renderer.setSize(innerWidth,innerHeight);
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0d0818,.0105);scene.background=new THREE.Color(0x0d0818);
  camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,700);
  hemi=new THREE.HemisphereLight(0x6070ff,0x1a0a14,.55);scene.add(hemi);
  moon=new THREE.DirectionalLight(0x8a90ff,.35);moon.position.set(-100,200,-60);scene.add(moon);
  scene.add(new THREE.AmbientLight(0x221a33,.35));
  FILL=new THREE.PointLight(0xa8b0ff,1.1,16,1.6);scene.add(FILL);
  flashLight=new THREE.SpotLight(0xfff0d8,0,38,.42,.55,1.3);scene.add(flashLight,flashLight.target);
  for(let i=0;i<2;i++){const s=new THREE.SpotLight(0xfff2cf,0,60,.5,.6,1.2);scene.add(s,s.target);headL.push(s)}
  // sky dome with horizon glow
  const sg=new THREE.SphereGeometry(650,24,12),cols=[];const top=new THREE.Color('#05030a'),hor=new THREE.Color('#3a1030'),mid=new THREE.Color('#120a24');
  for(let i=0;i<sg.attributes.position.count;i++){const y=sg.attributes.position.getY(i)/650;const c=y<.05?hor.clone():y<.35?hor.clone().lerp(mid,(y-.05)/.3):mid.clone().lerp(top,(y-.35)/.65);cols.push(c.r,c.g,c.b)}
  sg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  sky=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(sky);
  buildCity(scene,q);
  actorsInit(scene);
  shelterInit();
  // rain
  const RN=QUALITY==='low'?1800:4200;const rp=new Float32Array(RN*6);
  for(let i=0;i<RN;i++){const x=rnd(-45,45),y=rnd(0,30),z=rnd(-45,45);rp.set([x,y,z,x-.05,y+.9,z],i*6)}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rp,3));
  rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:'#a8b8ff',transparent:true,opacity:.32,fog:false}));rain.frustumCulled=false;scene.add(rain);
  const spp=new Float32Array(500*3);const sgeo=new THREE.BufferGeometry();sgeo.setAttribute('position',new THREE.BufferAttribute(spp,3));
  splash=new THREE.Points(sgeo,new THREE.PointsMaterial({size:.12,color:'#cfd8ff',transparent:true,opacity:.55}));splash.frustumCulled=false;scene.add(splash);
  // post
  if(q.bloom){composer=new THREE.EffectComposer(renderer);composer.setPixelRatio(q.pr);composer.addPass(new THREE.RenderPass(scene,camera));
    bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.95,.55,.62);composer.addPass(bloom);
    if(QUALITY==='high'&&THREE.FXAAShader){const fx=new THREE.ShaderPass(THREE.FXAAShader);fx.uniforms.resolution.value.set(1/(innerWidth*q.pr),1/(innerHeight*q.pr));composer.addPass(fx);composer.fxaa=fx}}
  // player
  PL.h=makeHuman(LOOKS.seojin);PL.h.gun.visible=true;scene.add(PL.h.root);
  spawnCity();
  // raider camp under Seongsu station
  for(let i=0;i<6;i++){const s=randomSpot(2,9,LOC.raiderYard.x,LOC.raiderYard.z);if(s)spawnRaider(s.x,s.z,{camp:'yard'})}
  loadGame();
  placeShelterNPCs();
  addEventListener('resize',onResize);
  buildMinimap();
}
function onResize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(composer){composer.setSize(innerWidth,innerHeight);if(composer.fxaa)composer.fxaa.uniforms.resolution.value.set(1/(innerWidth*QSET[QUALITY].pr),1/(innerHeight*QSET[QUALITY].pr))}}
function placeShelterNPCs(){
  const want=[['mira',LOC.shelter.x-9,LOC.shelter.z+3.4,Math.PI]];
  if(GAME.rescued.kang)want.push(['kang',LOC.shelter.x+6,LOC.shelter.z+2.5,-Math.PI/2]);
  if(GAME.rescued.taeo)want.push(['taeo',LOC.shelter.x+2,LOC.shelter.z-3,0]);
  for(const[id,x,z,yaw]of want){if(ACT.npcs.some(n=>n.id===id&&Math.hypot(n.x-x,n.z-z)<1))continue;ACT.npcs.filter(n=>n.id===id).forEach(n=>removeActor(n));ACT.npcs=ACT.npcs.filter(n=>n.id!==id);spawnNPC(id,x,z,yaw)}
  for(const a of ACT.allies)if(a.id&&GAME.rescued[a.id]&&!a.dead){removeActor(a);a.dead=1;a.deadT=99}
  ACT.allies=ACT.allies.filter(a=>!(a.id&&GAME.rescued[a.id]));
}

/* ---------- input ---------- */
const KEYS={},PRESSED=new Set();const MOUSE={dx:0,dy:0,lmb:false,rmb:false,locked:false};
const isTouch=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window);
addEventListener('keydown',e=>{
  if(['Space','Tab','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  if(!e.repeat)PRESSED.add(e.code);KEYS[e.code]=true;
  if(CUT&&!e.repeat&&(e.code==='KeyE'||e.code==='Enter'||e.code==='Space'))cutNext();
});
addEventListener('keyup',e=>{KEYS[e.code]=false});
addEventListener('blur',()=>{for(const k in KEYS)KEYS[k]=false;MOUSE.lmb=MOUSE.rmb=false});
document.addEventListener('pointerlockchange',()=>{MOUSE.locked=document.pointerLockElement===$('c3d')});
addEventListener('mousemove',e=>{if(MOUSE.locked||MOUSE.rmb||(MOUSE.lmb&&!MOUSE.locked&&GAME.state==='play')){MOUSE.dx+=e.movementX||0;MOUSE.dy+=e.movementY||0}});
$('c3d').addEventListener('mousedown',e=>{if(GAME.state!=='play'||anyOverlay())return;
  if(!MOUSE.locked&&!isTouch&&$('c3d').requestPointerLock){try{const p=$('c3d').requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(err){}}
  if(e.button===0){MOUSE.lmb=true;PRESSED.add('Fire')}if(e.button===2)MOUSE.rmb=true});
addEventListener('mouseup',e=>{if(e.button===0)MOUSE.lmb=false;if(e.button===2)MOUSE.rmb=false});
$('c3d').addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('wheel',e=>{if(GAME.state==='play')PRESSED.add(e.deltaY>0?'WheelDown':'WheelUp')},{passive:true});
const JOY={x:0,y:0,id:null,lookId:null,lx:0,ly:0};
function touchInit(){
  document.body.classList.add('touch');$('touch').hidden=false;
  const jz=$('joy'),kn=$('joyKnob');
  const upd=e=>{const r=jz.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const m=Math.hypot(dx,dy),mx=55;if(m>mx){dx*=mx/m;dy*=mx/m}JOY.x=dx/mx;JOY.y=dy/mx;kn.style.transform=`translate(${dx}px,${dy}px)`};
  jz.addEventListener('pointerdown',e=>{JOY.id=e.pointerId;jz.setPointerCapture(e.pointerId);upd(e)});
  jz.addEventListener('pointermove',e=>{if(e.pointerId===JOY.id)upd(e)});
  const end=e=>{if(e.pointerId===JOY.id){JOY.id=null;JOY.x=JOY.y=0;kn.style.transform=''}};jz.addEventListener('pointerup',end);jz.addEventListener('pointercancel',end);
  const lz=$('lookZone');
  lz.addEventListener('pointerdown',e=>{JOY.lookId=e.pointerId;JOY.lx=e.clientX;JOY.ly=e.clientY;lz.setPointerCapture(e.pointerId)});
  lz.addEventListener('pointermove',e=>{if(e.pointerId!==JOY.lookId)return;MOUSE.dx+=(e.clientX-JOY.lx)*1.6;MOUSE.dy+=(e.clientY-JOY.ly)*1.6;JOY.lx=e.clientX;JOY.ly=e.clientY});
  const le=e=>{if(e.pointerId===JOY.lookId)JOY.lookId=null};lz.addEventListener('pointerup',le);lz.addEventListener('pointercancel',le);
  document.querySelectorAll('#touch [data-key]').forEach(b=>{const k=b.dataset.key;
    b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();b.setPointerCapture(e.pointerId);if(k==='Fire'){MOUSE.lmb=true;PRESSED.add('Fire')}else if(k==='Aim'){MOUSE.rmb=!MOUSE.rmb;b.classList.toggle('on',MOUSE.rmb);return}else{KEYS[k]=true;PRESSED.add(k)}b.classList.add('on')});
    const up=()=>{if(k==='Fire')MOUSE.lmb=false;else if(k!=='Aim')KEYS[k]=false;if(k!=='Aim')b.classList.remove('on')};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)});
}
function moveAxis(){let x=(KEYS.KeyD?1:0)-(KEYS.KeyA?1:0)+JOY.x,y=(KEYS.KeyS?1:0)-(KEYS.KeyW?1:0)+JOY.y;return{x:clamp(x,-1,1),y:clamp(y,-1,1)}}
function anyOverlay(){return['board','bench','mapScr','pauseScr','deathScr','endScr','titleScr'].some(id=>!$(id).hidden)||!!CUT}

/* ---------- camera ---------- */
const _fw=new THREE.Vector3(),_rt=new THREE.Vector3(),_piv=new THREE.Vector3(),_cp=new THREE.Vector3();
function camForward(){return _fw.set(Math.sin(CAM.yaw)*Math.cos(CAM.pitch),-Math.sin(CAM.pitch),Math.cos(CAM.yaw)*Math.cos(CAM.pitch)).normalize()}
function updateCamera(dt){
  const sens=MOUSE.locked?.0022:.004;
  if(!anyOverlay()){CAM.yaw-=MOUSE.dx*sens;CAM.pitch=clamp(CAM.pitch+MOUSE.dy*sens,-.55,1.15);if(Math.abs(MOUSE.dx)>1)CAM.lastLook=GAME.t}
  MOUSE.dx=MOUSE.dy=0;
  const aiming=(MOUSE.rmb||KEYS.KeyC)&&!PL.inCar&&!PL.dead;CAM.aim=lerp(CAM.aim,aiming?1:0,Math.min(1,dt*10));
  let dist,height,shoulder;
  if(PL.inCar){const c=PL.inCar;if(GAME.t-(CAM.lastLook||-9)>1.4){const want=c.yaw+(Math.hypot(c.vx,c.vz)>2&&(c.vx*Math.sin(c.yaw)+c.vz*Math.cos(c.yaw))<-1?Math.PI:0);CAM.yaw+=angDiff(want,CAM.yaw)*Math.min(1,dt*3);CAM.pitch=lerp(CAM.pitch,.28,dt*2)}
    const sp=Math.hypot(c.vx,c.vz);dist=7.2+c.len*.4+sp*.05;height=2.2;shoulder=0;_piv.set(c.x,1.4,c.z);camera.fov=lerp(camera.fov,62+sp*.35,dt*3)}
  else{dist=lerp(3.6,1.9,CAM.aim);height=1.62;shoulder=lerp(.62,.72,CAM.aim);_piv.set(PL.x,height+PL.y,PL.z);camera.fov=lerp(camera.fov,lerp(64,50,CAM.aim)+(PL.sprinting?5:0),dt*8)}
  camera.updateProjectionMatrix();
  const f=camForward();_rt.set(-Math.cos(CAM.yaw),0,Math.sin(CAM.yaw));
  _cp.copy(_piv).addScaledVector(f,-dist).addScaledVector(_rt,shoulder);_cp.y+=PL.inCar?.6:.12;
  // collide against buildings
  const steps=16;let ok=_piv.clone();for(let i=1;i<=steps;i++){const t=i/steps;const x=lerp(_piv.x,_cp.x,t),y=lerp(_piv.y,_cp.y,t),z=lerp(_piv.z,_cp.z,t);const h=heightAt(x,z);if((h>=0&&y<h+.2)||x<0||z<0||x>WX||z>WZ)break;ok.set(x,y,z)}
  if(ok.distanceTo(_piv)<dist*.95)ok.lerp(_piv,.08);
  if(ok.y<.35)ok.y=.35;
  camera.position.copy(ok);
  if(CAM.shake>0){camera.position.x+=rnd(-1,1)*CAM.shake*.25;camera.position.y+=rnd(-1,1)*CAM.shake*.25;CAM.shake=Math.max(0,CAM.shake-dt*3)}
  camera.lookAt(camera.position.x+f.x*30,camera.position.y+f.y*30,camera.position.z+f.z*30);
  sky.position.copy(camera.position);
  FILL.position.set(camera.position.x,camera.position.y+1.5,camera.position.z);
}
function groundAim(){const f=camForward();if(f.y>-.02)return null;const t=-camera.position.y/f.y;if(t>40)return null;return{x:camera.position.x+f.x*t,z:camera.position.z+f.z*t}}

/* ---------- player ---------- */
function curW(){return WEAPONS[PL.weapon]}
function wDamage(k){return WEAPONS[k].dmg*(1+.2*(GAME.inv.up[k]||0))}
function switchWeapon(k){if(!GAME.inv.owned[k]||PL.weapon===k)return;PL.weapon=k;PL.reload=0;PL.h.blade.visible=k==='katana';PL.h.gun.children.forEach((c,i)=>{if(c!==PL.h.blade)c.visible=k!=='katana'});sfx('reload')}
function startReload(){const k=PL.weapon,w=WEAPONS[k];if(w.melee||PL.reload>0)return;const I=GAME.inv;if(I.mag[k]>=w.mag||I.ammo[k]<=0)return;PL.reload=w.reload;sfx('reload')}
function finishReload(){const k=PL.weapon,w=WEAPONS[k],I=GAME.inv;const need=w.mag-I.mag[k],take=Math.min(need,I.ammo[k]);I.mag[k]+=take;I.ammo[k]-=take}
const _o=new THREE.Vector3(),_d=new THREE.Vector3(),_mp=new THREE.Vector3();
function fireWeapon(){
  const k=PL.weapon,w=WEAPONS[k],I=GAME.inv;
  if(PL.fireCD>0||PL.reload>0)return;
  PL.yaw=CAM.yaw;
  if(w.melee){PL.fireCD=60/w.rpm;PL.h.swing=.35;sfx('swing');
    let hit=false;for(const L of[ACT.zombies,ACT.raiders,ACT.nests])for(const e of L){if(e.dead)continue;const dx=e.x-PL.x,dz=e.z-PL.z,d=Math.hypot(dx,dz);if(d>w.range+(e.r||.4))continue;const a=Math.abs(angDiff(Math.atan2(dx,dz),PL.yaw));if(a>1.2&&d>1.2)continue;
      damage(e,wDamage(k),PL,{point:new THREE.Vector3(e.x,1.2,e.z)});hit=true;if(e.kind==='zombie'&&!e.dead){e.x+=dx/d*.8;e.z+=dz/d*.8}}
    if(hit){sfx('hit');hitmark(false);camShake(.12)}return}
  if(I.mag[k]<=0){sfx('empty');PL.fireCD=.25;startReload();return}
  I.mag[k]--;PL.fireCD=60/w.rpm;
  const f=camForward();_o.copy(camera.position);const skip=camera.position.distanceTo(_piv)+.3;_o.addScaledVector(f,skip);
  PL.h.root.updateMatrixWorld();PL.h.gun.getWorldPosition(_mp);_mp.addScaledVector(f,.35);
  let anyHit=false,anyHead=false,killed=false;
  const spread=w.spread*(PL.sprinting?2.2:1)*(CAM.aim>.5?.55:1)*(1+PL.recoil);
  for(let p=0;p<(w.pellets||1);p++){
    _d.copy(f);_d.x+=rnd(-1,1)*spread;_d.y+=rnd(-1,1)*spread;_d.z+=rnd(-1,1)*spread;_d.normalize();
    const hit=rayCast(_o,_d,w.range,{cars:true,ignoreCar:PL.inCar});
    tracer(_mp,hit.point,w.col);
    if(hit.ent){const was=hit.ent.dead;damage(hit.ent,wDamage(k)*(hit.head?2.3:1),PL,{point:hit.point,head:hit.head});anyHit=true;if(hit.head)anyHead=true;if(!was&&hit.ent.dead)killed=true}
    else if(hit.wall)burst(hit.point.x,hit.point.y,hit.point.z,4,'#c8c8d8',3,.25,1);
  }
  muzzle(_mp,w.col);sfx(k==='shotgun'?'shotgun':'shot');PL.noiseT=2.5;PL.noiseR=w.noise;
  PL.recoil=Math.min(1.5,PL.recoil+.35);CAM.pitch-=k==='shotgun'?.035:.012;camShake(k==='shotgun'?.25:.06);
  if(anyHit){sfx('hit');hitmark(anyHead,killed)}
  if(I.mag[k]<=0)startReload();
}
let hitT=0;
function hitmark(head,kill){const el=$('hitmark');el.className='show'+(head?' head':'')+(kill?' kill':'');hitT=.18;if(head&&kill)toast('HEADSHOT','#ff2e88')}
onKill=(e,from,opts)=>{if(from===PL){GAME.kills++;if(e.kind==='zombie')sfx('kill')}if(MSN.active)MSN.onKill(e)};
function playerDie(src){
  PL.dead=true;PL.hp=0;if(PL.inCar)exitCar(true);PL.h.fall=0;
  const lostM=Math.floor(GAME.money*.2),lostS=Math.floor(GAME.inv.scrap*.1);GAME.money-=lostM;GAME.inv.scrap-=lostS;
  $('deathSub').textContent=`${src==='zombie'?'감염체에게 쓰러졌다':src==='raider'?'레이더의 총에 맞았다':src==='explode'?'폭발에 휘말렸다':'쓰러졌다'} · -$${lostM} · 고철 -${lostS}`;
  setTimeout(()=>{$('deathScr').hidden=false;document.exitPointerLock&&document.exitPointerLock()},1600);
  if(MSN.active)failMission('쓰러졌다');
}
function respawn(){PL.dead=false;PL.hp=100;PL.h.fall=0;PL.h.body.rotation.x=0;PL.h.body.position.y=0;PL.x=LOC.shelter.x;PL.z=LOC.shelter.z;$('deathScr').hidden=true;for(const z of ACT.zombies)if(!z.dead&&Math.hypot(z.x-PL.x,z.z-PL.z)<30){z.dead=1;z.deadT=99}saveGame()}
function enterCar(){
  let best=null,bd=3.4;for(const c of VEH.cars){if(c.wreck)continue;const d=Math.hypot(c.x-PL.x,c.z-PL.z);if(d<bd){bd=d;best=c}}
  if(!best)return false;
  if(best.locked){toast('잠겨 있다 · E를 길게 눌러 시동을 걸어라','#ffb347');return false}
  if(best.ai){// carjack a raider truck: crew spills out
    for(let i=0;i<(best.crew||0);i++)spawnRaider(best.x+rnd(-2,2),best.z+rnd(-2,2));best.crew=0;best.ai=null}
  PL.inCar=best;best.driver='player';best.lights=true;PL.h.root.visible=false;sfx('door');CAM.lastLook=-9;
  if(best.mission&&MSN.active)MSN.onEnter(best);
  return true;
}
function exitCar(force){const c=PL.inCar;if(!c)return;if(!force&&Math.hypot(c.vx,c.vz)>5)return;
  const s=Math.sin(c.yaw),co=Math.cos(c.yaw);for(const side of[1,-1]){const x=c.x+co*(c.wid/2+.8)*side,z=c.z-s*(c.wid/2+.8)*side;if(!solidW(x,z)){PL.x=x;PL.z=z;break}}
  c.driver=null;PL.inCar=null;PL.h.root.visible=true;sfx('door');for(const h of headL)h.intensity=0}
/* interactions (E), with hold support */
const HOLD={key:null,t:0,dur:0,label:'',done:null};
function interactables(){
  const out=[];const o=PL;
  for(const n of ACT.npcs){const d=Math.hypot(n.x-o.x,n.z-o.z);if(d<2.8){
    if(n.id==='mira')out.push({d,label:'해결사 의뢰 보기',act:()=>openBoard()});
    else if(n.id==='kang')out.push({d,label:'강 영감 · 작업대',act:()=>openBench()});
    else if(n.id==='taeo'&&GAME.rescued.taeo)out.push({d,label:'태오와 대화',act:()=>talkTaeo()});
  }}
  for(const p of SH.pieces){const d=Math.hypot(p.x-o.x,p.z-o.z);if(d>2.6)continue;if(p.type==='bench')out.push({d,label:'작업대 사용',act:()=>openBench()});if(p.type==='bed')out.push({d,label:'잠자기 · 저장',act:()=>sleep()})}
  for(const c of VEH.cars){if(c.wreck||!c.locked)continue;const d=Math.hypot(c.x-o.x,c.z-o.z);if(d<3.4)out.push({d,label:`${VT[c.type].ko} 핫와이어`,hold:1.8,key:'hw'+VEH.cars.indexOf(c),act:()=>{c.locked=false;c.alarm=6;PL.noiseT=8;PL.noiseR=70;sfx('alarm');toast('시동 성공 · 경보가 울린다!','#ffb347')}})}
  if(MSN.active){const s=MSN.step();if(s&&s.type==='talk'){const n=ACT.npcs.find(q=>q.id===s.npc);if(n&&Math.hypot(n.x-o.x,n.z-o.z)<2.8)out.unshift({d:0,label:s.text.replace(/\s*\(E\)/,''),act:()=>nextStep()})}
    if(s&&s.type==='hold'){const a=s.at();if(Math.hypot(a.x-o.x,a.z-o.z)<s.r)out.unshift({d:0,label:s.text.replace(/\s*\(E 길게\)/,''),hold:s.dur,key:'ms'+MSN.i,act:()=>nextStep()})}}
  return out.sort((a,b)=>a.d-b.d);
}
function updatePlayer(dt){
  const h=PL.h;
  if(PL.dead){animFall(h,dt);h.root.position.set(PL.x,0,PL.z);return}
  PL.noiseT-=dt;PL.fireCD-=dt;PL.recoil=Math.max(0,(PL.recoil||0)-dt*2.5);PL.hurtT=Math.max(0,PL.hurtT-dt);
  if(PL.reload>0){PL.reload-=dt;if(PL.reload<=0)finishReload()}
  // weapon select
  WKEYS.forEach((k,i)=>{if(PRESSED.has('Digit'+(i+1)))switchWeapon(k)});
  if(PRESSED.has('WheelDown')||PRESSED.has('WheelUp')||PRESSED.has('KeyX')){const own=WKEYS.filter(k=>GAME.inv.owned[k]);const i=own.indexOf(PL.weapon);switchWeapon(own[(i+(PRESSED.has('WheelUp')?-1:1)+own.length)%own.length])}
  if(PRESSED.has('KeyR'))startReload();
  if(PRESSED.has('KeyV')){PL.flash=!PL.flash;toast(PL.flash?'손전등 켬':'손전등 끔')}
  if(PRESSED.has('KeyF')){if(PL.inCar)exitCar(false);else enterCar()}
  if(PRESSED.has('KeyB')){const inZone=Math.hypot(PL.x-SH.zone.x,PL.z-SH.zone.z)<SH.zone.r+4;if(SH.building)setBuildMode(false);else if(inZone&&!PL.inCar)setBuildMode(true);else toast('건설은 쉘터 구역 안에서만 가능하다','#ff4d5e')}
  if(PRESSED.has('KeyH'))sfx('horn');
  // interaction
  const it=PL.inCar?[]:interactables();const top=it[0];
  if(top){$('prompt').innerHTML=`<kbd>E</kbd>${esc(top.label)}${top.hold?' <small>(길게)</small>':''}`;$('prompt').classList.add('show')}else $('prompt').classList.remove('show');
  if(top&&top.hold){if(KEYS.KeyE){if(HOLD.key!==top.key){HOLD.key=top.key;HOLD.t=0}HOLD.t+=dt;setHold(HOLD.t/top.hold);if(HOLD.t>=top.hold){HOLD.key=null;setHold(0);top.act()}}else{HOLD.key=null;setHold(0)}}
  else{setHold(0);if(top&&PRESSED.has('KeyE'))top.act()}
  if(PL.inCar){driveUpdate(dt);return}
  // movement
  const ax=moveAxis(),m=Math.hypot(ax.x,ax.y);
  const aiming=CAM.aim>.4||MOUSE.lmb&&!curW().melee;
  PL.sprinting=(KEYS.ShiftLeft||KEYS.ShiftRight||(isTouch&&m>.95))&&m>.2&&PL.stamina>2&&!aiming;
  PL.stamina=clamp(PL.stamina+(PL.sprinting?-22:14)*dt,0,100);
  let spd=0;
  if(m>.12){const fx=Math.sin(CAM.yaw),fz=Math.cos(CAM.yaw),rx=-Math.cos(CAM.yaw),rz=Math.sin(CAM.yaw);
    const dx=(fx*-ax.y+rx*ax.x)/Math.max(1,m),dz=(fz*-ax.y+rz*ax.x)/Math.max(1,m);
    spd=(PL.sprinting?7.6:aiming?2.8:4.4)*Math.min(1,m);moveEnt(PL,dx*spd*dt,dz*spd*dt);
    if(!aiming)PL.yaw+=angDiff(Math.atan2(dx,dz),PL.yaw)*Math.min(1,dt*12)}
  if(aiming)PL.yaw+=angDiff(CAM.yaw,PL.yaw)*Math.min(1,dt*18);
  if(PRESSED.has('Space')&&PL.y<=0){PL.vy=4.6}
  PL.vy-=14*dt;PL.y=Math.max(0,PL.y+PL.vy*dt);if(PL.y<=0)PL.vy=0;
  // fire
  if(SH.building){ghostUpdate();if(PRESSED.has('Fire'))placePiece();if(PRESSED.has('KeyR'))SH.rot+=Math.PI/2;PIECE_KEYS.forEach((k,i)=>{if(PRESSED.has('Digit'+(i+1))){SH.sel=i;renderBuildBar()}});if(PRESSED.has('WheelDown')||PRESSED.has('WheelUp')){SH.sel=(SH.sel+(PRESSED.has('WheelUp')?-1:1)+PIECE_KEYS.length)%PIECE_KEYS.length;renderBuildBar()}}
  else{const w=curW();if(PRESSED.has('Fire')||(MOUSE.lmb&&w.auto))fireWeapon();if(PRESSED.has('KeyQ')&&PL.weapon!=='katana'){const pw=PL.weapon;PL.weapon='katana';fireWeapon();PL.weapon=pw}}
  h.root.position.set(PL.x,PL.y,PL.z);h.root.rotation.y=PL.yaw;animHuman(h,spd,dt,aiming?'aim':'walk');
  const inZone=Math.hypot(PL.x-SH.zone.x,PL.z-SH.zone.z)<SH.zone.r;if(SH.building&&!inZone)setBuildMode(false);
}
function driveUpdate(dt){
  const c=PL.inCar;const ax=moveAxis();
  const vf=carPhys(c,-ax.y,ax.x,!!KEYS.Space,dt,false);
  PL.x=c.x;PL.z=c.z;PL.yaw=c.yaw;
  if(c.wreck)return;
  if(AU.ctx){AU.engG.gain.setTargetAtTime(.05,AU.ctx.currentTime,.1);AU.eng.frequency.setTargetAtTime(38+Math.abs(vf)*4,AU.ctx.currentTime,.05);AU.engF.frequency.setTargetAtTime(200+Math.abs(vf)*40,AU.ctx.currentTime,.05)}
  const s=Math.sin(c.yaw),co=Math.cos(c.yaw);
  headL.forEach((L,i)=>{const side=i?1:-1;L.intensity=3.2;L.position.set(c.x+s*c.len/2+co*side*.7,1,c.z+co*c.len/2-s*side*.7);L.target.position.set(c.x+s*(c.len/2+20)+co*side*1.5,0,c.z+co*(c.len/2+20)-s*side*1.5)});
  if(c.drift>6&&Math.random()<.5)puff(c.x-s*c.len*.4,.3,c.z-co*c.len*.4);
}
let holdShown=0;
function setHold(v){if(Math.abs(v-holdShown)<.01)return;holdShown=v;$('holdRing').style.setProperty('--p',v);$('holdRing').hidden=v<=0}

/* ---------- missions ---------- */
const MSN={active:null,i:0,
  step(){return this.active&&this.active.steps[this.i]},
  onKill(e){},
  onEnter(c){},
};
let CUT=null;
function cutscene(lines,onEnd){CUT={lines,i:0,onEnd,t:0};$('cut').hidden=false;document.exitPointerLock&&document.exitPointerLock();showCut()}
function showCut(){const l=CUT.lines[CUT.i],w=WHO[l[0]];$('cut').style.setProperty('--c',w.col);$('cutPic').src=portrait(l[0]);$('cutName').innerHTML=`${esc(w.ko)}<small>${esc(w.en)}</small>`;$('cutKo').textContent=l[1];$('cutEn').textContent=l[2]||'';CUT.t=0;sfx('msg')}
function cutNext(){if(!CUT||CUT.t<.25)return;CUT.i++;if(CUT.i>=CUT.lines.length){const f=CUT.onEnd;CUT=null;$('cut').hidden=true;PRESSED.clear();if(f)f()}else showCut()}
$('cut').addEventListener('pointerdown',cutNext);
function startMission(def,isStory,contract){
  if(MSN.active){toast('이미 진행 중인 의뢰가 있다','#ff4d5e');return}
  const m={id:def.id||('c'+Date.now()),def,steps:isStory?def.steps:contractSteps(contract.kind),v:{},story:isStory,title:isStory?def.title:contract.ko,en:isStory?def.en:contract.en,reward:isStory?def.reward:contract.reward,timer:null,prog:0};
  MSN.active=m;MSN.i=-1;closeOverlays();
  banner(m.title,(m.en||'').toUpperCase(),'cy');
  if(isStory&&def.intro)cutscene(def.intro,nextStep);else nextStep();
}
function nextStep(){
  const m=MSN.active;if(!m)return;MSN.i++;const s=m.steps[MSN.i];
  if(!s){passMission();return}
  m.prog=0;if(s.start)s.start(m);
  if(MSN.i>0)sfx('pick');
  if(s.type==='cut'){cutscene(s.lines,nextStep);return}
  if(s.type==='defend'){m.wavesLeft=s.waves;startWave()}
}
function passMission(){
  const m=MSN.active,R=m.reward||{};MSN.active=null;
  GAME.money+=R.money||0;GAME.inv.scrap+=R.scrap||0;GAME.inv.chips+=R.chips||0;if(R.survivor)GAME.survivors+=R.survivor;
  if(R.unlock){GAME.inv.unlocked[R.unlock]=true;toast(`작업대에서 ${WEAPONS[R.unlock].ko} 제작 가능`,'#29e7ff')}
  banner('의뢰 완료',`+$${(R.money||0).toLocaleString()}${R.scrap?` · +${R.scrap} 고철`:''}`,'');sfx('pass');
  if(m.story){GAME.story++;if(m.def.done)m.def.done();if(m.def.final)setTimeout(showEnding,3500)}else GAME.contractsDone++;
  if(m.v.ally&&m.v.ally.id===undefined&&!m.v.ally.dead){const a=m.v.ally;removeActor(a);a.dead=1;a.deadT=99}
  GAME.board=null;GAME.calm=false;saveGame();
  if(!m.def.final)setTimeout(()=>msg('mira','수고했어. 다음 의뢰는 내 카운터에서.','Nice work. Next contract is at my counter.'),1800);
}
function failMission(reason){const m=MSN.active;if(!m)return;MSN.active=null;banner('의뢰 실패',reason,'bad');sfx('fail');
  for(const z of ACT.zombies)if(z.mission===m.id)z.mission=null;for(const r of ACT.raiders)if(r.mission===m.id)r.mission=null;
  if(m.v.ally&&!m.v.ally.id){m.v.ally.follow=false}
  if(m.v.crate)SCENE.remove(m.v.crate)}
function stepTarget(){
  const m=MSN.active,s=MSN.step();if(!m||!s)return null;
  switch(s.type){
    case'goto':case'hold':return s.at();
    case'killTag':{let b=null,bd=1e9;for(const L of[ACT.zombies,ACT.raiders])for(const e of L)if(!e.dead&&e.mission===m.id){const d=Math.hypot(e.x-PL.x,e.z-PL.z);if(d<bd){bd=d;b=e}}return b}
    case'talk':return ACT.npcs.find(n=>n.id===s.npc)||null;
    case'scrap':case'build':case'defend':return LOC.shelter;
    case'rescue':return m.v.ally&&!m.v.ally.dead?(Math.hypot(m.v.ally.x-PL.x,m.v.ally.z-PL.z)>14?m.v.ally:LOC.shelter):null;
    case'drive':return PL.inCar===m.v.car?s.to():m.v.car;
    case'nests':{let b=null,bd=1e9;for(const n of ACT.nests)if(!n.dead&&n.mission===m.id){const d=Math.hypot(n.x-PL.x,n.z-PL.z);if(d<bd){bd=d;b=n}}return b}
  }return null;
}
function missionUpdate(dt){
  const m=MSN.active,s=MSN.step();if(!m||!s||CUT)return;
  const o=PL.inCar||PL;
  switch(s.type){
    case'goto':{const a=s.at();if(Math.hypot(a.x-o.x,a.z-o.z)<s.r)nextStep();break}
    case'killTag':{const left=[...ACT.zombies,...ACT.raiders].filter(e=>!e.dead&&e.mission===m.id).length;m.prog=left;if(left===0)nextStep();break}
    case'scrap':m.prog=GAME.inv.scrap;if(GAME.inv.scrap>=s.need)nextStep();break;
    case'build':if(SH.pieces.some(p=>p.type===s.piece))nextStep();break;
    case'rescue':{const a=m.v.ally;if(!a||a.dead){failMission('호위 대상이 쓰러졌다');break}if(Math.hypot(a.x-SH.zone.x,a.z-SH.zone.z)<14&&!a.riding&&!PL.inCar||(a.riding&&PL.inCar&&Math.hypot(PL.x-SH.zone.x,PL.z-SH.zone.z)<14)){if(a.riding){a.riding=false;a.h.root.visible=true;a.x=PL.x+2;a.z=PL.z}a.follow=false;nextStep()}break}
    case'drive':{const c=m.v.car;if(!c){nextStep();break}if(c.wreck){failMission('차가 부서졌다');break}const t=s.to();if(PL.inCar===c&&Math.hypot(c.x-t.x,c.z-t.z)<s.r){nextStep()}break}
    case'nests':{const left=ACT.nests.filter(n=>!n.dead&&n.mission===m.id).length;m.prog=left;if(left===0)nextStep();break}
    case'defend':if(!SH.waveOn&&m.waveDone){m.wavesLeft--;m.waveDone=false;if(m.wavesLeft>0)startWave();else nextStep()}break;
  }
}
GAME.onWave=()=>{if(MSN.active&&MSN.step()&&MSN.step().type==='defend')MSN.active.waveDone=true};
GAME.onWaveFail=()=>{if(MSN.active&&MSN.step()&&MSN.step().type==='defend')failMission('쉘터가 함락됐다')};
function stepText(){const m=MSN.active,s=MSN.step();if(!m||!s)return'';let t=s.text||'';
  if(s.type==='killTag')t+=` · 남은 적 ${m.prog}`;if(s.type==='scrap')t+=` (${Math.min(m.prog,s.need)}/${s.need})`;if(s.type==='nests')t+=` · 남은 둥지 ${m.prog}`;
  if(s.type==='defend'&&SH.waveOn)t+=` · 웨이브 ${SH.wave} · 남은 감염체 ${SH.waveLeft+ACT.zombies.filter(z=>z.wave&&!z.dead).length}`;if(s.type==='drive'&&PL.inCar!==m.v.car)t='목표 차량에 타라 (F)';return t}

/* ---------- panels: board, bench, sleep, map, pause ---------- */
function closeOverlays(){['board','bench','mapScr','pauseScr'].forEach(id=>$(id).hidden=true);GAME.paused=false}
function pauseFor(id){$(id).hidden=false;GAME.paused=true;document.exitPointerLock&&document.exitPointerLock();MOUSE.lmb=MOUSE.rmb=false}
function openBoard(){
  if(!GAME.board)GAME.board=[...CONTRACTS].sort(()=>Math.random()-.5).slice(0,3);
  const next=STORY[GAME.story];
  let h='';
  if(MSN.active)h+=`<div class="ctr on"><b>진행 중 · ${esc(MSN.active.title)}</b><span>${esc(stepText())}</span><button class="btn ghost" data-a="abandon">의뢰 포기</button></div>`;
  if(next&&!MSN.active)h+=`<div class="ctr story"><em>스토리 ${GAME.story+1}/${STORY.length}</em><b>${esc(next.title)} · ${esc(next.en)}</b><span>보상 $${next.reward.money.toLocaleString()}${next.reward.scrap?` · 고철 ${next.reward.scrap}`:''}</span><button class="btn" data-a="story">수락</button></div>`;
  if(!MSN.active)GAME.board.forEach((c,i)=>{h+=`<div class="ctr"><em>의뢰 · ${esc(c.en)}</em><b>${esc(c.ko)}</b><span>${esc(c.desc)} 보상 $${c.reward.money}${c.reward.scrap?` · 고철 ${c.reward.scrap}`:''}${c.reward.chips?` · 칩 ${c.reward.chips}`:''}</span><button class="btn ghost" data-a="c${i}">수락</button></div>`});
  $('boardList').innerHTML=h;
  $('boardStats').textContent=`쉘터 인원 ${1+(GAME.rescued.kang?1:0)+(GAME.rescued.taeo?1:0)+GAME.survivors}명 · 구조물 ${SH.pieces.length}개 · 완료한 의뢰 ${GAME.contractsDone}건`;
  $('boardList').querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=b.dataset.a;if(a==='story')startMission(STORY[GAME.story],true);else if(a==='abandon'){failMission('의뢰 포기');openBoard()}else startMission({id:'c'+Date.now()},false,GAME.board[+a.slice(1)])});
  pauseFor('board');
}
function openBench(){
  if(!SH.pieces.some(p=>p.type==='bench')&&!GAME.rescued.kang){toast('작업대를 먼저 지어라 (B)','#ff4d5e');return}
  const I=GAME.inv;let h='';
  for(const k of WKEYS){const w=WEAPONS[k];
    if(!I.owned[k]){if(w.craft){const can=I.unlocked[k]&&I.scrap>=w.craft.scrap&&GAME.money>=w.craft.money;h+=`<div class="brow"><span><b>${w.ko}</b><small>${I.unlocked[k]?'제작 가능':'잠김 · 스토리 진행 필요'}</small></span><button class="btn ghost" data-a="craft:${k}" ${can?'':'disabled'}>제작 · ${w.craft.scrap} 고철 · $${w.craft.money}</button></div>`}continue}
    const lv=I.up[k]||0,cs=25*(lv+1),cc=lv;h+=`<div class="brow"><span><b>${w.ko} · Lv.${lv}</b><small>피해 +${lv*20}%</small></span><button class="btn ghost" data-a="up:${k}" ${lv<3&&I.scrap>=cs&&I.chips>=cc?'':'disabled'}>${lv<3?`강화 · ${cs} 고철${cc?` · ${cc} 칩`:''}`:'최대'}</button></div>`}
  h+=`<div class="brow"><span><b>탄약 제작</b><small>보유 총기마다 탄약 1팩</small></span><button class="btn ghost" data-a="ammo" ${I.scrap>=10?'':'disabled'}>10 고철</button></div>`;
  h+=`<div class="brow"><span><b>방탄 조끼</b><small>방어력 50 충전</small></span><button class="btn ghost" data-a="vest" ${I.scrap>=30?'':'disabled'}>30 고철</button></div>`;
  h+=`<div class="brow"><span><b>엔진 튜닝</b><small>모든 차량 속도·가속 +15%</small></span><button class="btn ghost" data-a="engine" ${!I.perks.engine&&I.scrap>=40&&I.chips>=2?'':'disabled'}>${I.perks.engine?'보유':'40 고철 · 2 칩'}</button></div>`;
  $('benchList').innerHTML=h;$('benchStats').textContent=`고철 ${I.scrap} · 테크 칩 ${I.chips} · $${GAME.money.toLocaleString()}`;
  $('benchList').querySelectorAll('button').forEach(b=>b.onclick=()=>{const[a,k]=b.dataset.a.split(':');
    if(a==='craft'){const w=WEAPONS[k];I.scrap-=w.craft.scrap;GAME.money-=w.craft.money;I.owned[k]=true;I.ammo[k]=w.ammoPack*2;I.mag[k]=w.mag;switchWeapon(k);toast(w.ko+' 제작 완료','#29e7ff')}
    else if(a==='up'){const lv=I.up[k]||0;I.scrap-=25*(lv+1);I.chips-=lv;I.up[k]=lv+1;toast(WEAPONS[k].ko+' 강화','#29e7ff')}
    else if(a==='ammo'){I.scrap-=10;for(const q in I.ammo)if(I.owned[q])I.ammo[q]+=WEAPONS[q].ammoPack}
    else if(a==='vest'){I.scrap-=30;PL.armor=50}
    else if(a==='engine'){I.scrap-=40;I.chips-=2;I.perks.engine=1}
    sfx('build');saveGame();openBench()});
  pauseFor('bench');
}
function talkTaeo(){cutscene(rpick([[['taeo','GT 기름은 가득. 필요하면 말만 해요.','The GT is fueled. Just say the word.']],[['taeo','아버지가 부츠 새로 만들어 주셨어요. 이거 신고 달리면 안 미끄러져요.','Dad made me new boots. No slipping in these.']],[['taeo','밤엔 네온 간판 근처로 가지 마요. 감염체들이 불빛에 모여요.','Stay away from neon signs at night. The infected gather at the light.']]]))}
function sleep(){if(SH.waveOn){toast('웨이브 중에는 잘 수 없다','#ff4d5e');return}$('fade').classList.add('on');setTimeout(()=>{GAME.minutes+=360;PL.hp=100;saveGame();toast('6시간 뒤… 체력 회복 · 저장됨','#3dff9b');$('fade').classList.remove('on')},900)}
function showEnding(){$('endStats').textContent=`처치 ${GAME.kills} · 의뢰 ${GAME.contractsDone} · 구조물 ${SH.pieces.length} · $${GAME.money.toLocaleString()}`;pauseFor('endScr')}

/* ---------- minimap & big map ---------- */
let MMIMG=null;
function buildMinimap(){MMIMG=minimapImage()}
function drawMinimap(){
  const cv=$('mini'),S=cv.clientWidth||180,dp=Math.min(2,devicePixelRatio||1);if(cv.width!==S*dp){cv.width=S*dp;cv.height=S*dp}
  const g=cv.getContext('2d');g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,S,S);
  g.save();g.beginPath();g.arc(S/2,S/2,S/2,0,7);g.clip();g.fillStyle='#05060a';g.fillRect(0,0,S,S);
  const sc=S/180*1.6;/* px per metre */
  g.translate(S/2,S/2);g.rotate(Math.PI-CAM.yaw);g.scale(sc,sc);g.translate(-PL.x,-PL.z);
  g.imageSmoothingEnabled=false;g.drawImage(MMIMG,0,0,WX,WZ);
  const dot=(x,z,c,r)=>{g.fillStyle=c;g.beginPath();g.arc(x,z,r/sc,0,7);g.fill()};
  g.strokeStyle='rgba(255,179,71,.5)';g.lineWidth=2/sc;g.beginPath();g.arc(SH.zone.x,SH.zone.z,SH.zone.r,0,7);g.stroke();
  for(const z of ACT.zombies)if(!z.dead&&Math.abs(z.x-PL.x)<90&&Math.abs(z.z-PL.z)<90)dot(z.x,z.z,z.type==='brute'?'#ff2e88':'#ff4d5e',z.type==='brute'?3:1.8);
  for(const r of ACT.raiders)if(!r.dead&&Math.abs(r.x-PL.x)<110&&Math.abs(r.z-PL.z)<110)dot(r.x,r.z,'#ffb347',2.4);
  for(const a of ACT.allies)if(!a.dead)dot(a.x,a.z,'#29e7ff',2.4);
  for(const n of ACT.nests)if(!n.dead)dot(n.x,n.z,'#ff2e88',4);
  for(const c of VEH.cars)if(!c.wreck&&Math.abs(c.x-PL.x)<70&&Math.abs(c.z-PL.z)<70){g.fillStyle=c.locked?'rgba(255,255,255,.35)':'#ffffff';g.fillRect(c.x-1.6,c.z-1.6,3.2,3.2)}
  const tg=stepTarget();if(tg)dot(tg.x,tg.z,'#ffd400',4.5);
  g.restore();
  // shelter arrow if off-map
  g.fillStyle='#fff';g.save();g.translate(S/2,S/2);g.beginPath();g.moveTo(0,-7);g.lineTo(5,6);g.lineTo(0,3);g.lineTo(-5,6);g.closePath();g.rotate(0);g.fill();g.restore();
}
function drawBigMap(){
  const c=$('bigmap'),dp=Math.min(2,devicePixelRatio||1),w=Math.min(innerWidth-32,1200),h=Math.min(innerHeight-60,w*WZ/WX),ww=h*WX/WZ;
  c.style.width=ww+'px';c.style.height=h+'px';c.width=ww*dp;c.height=h*dp;const g=c.getContext('2d');g.setTransform(dp,0,0,dp,0,0);
  const s=ww/WX;g.drawImage(MMIMG,0,0,ww,h);
  g.font=`${Math.max(11,s*9)|0}px "Black Han Sans",sans-serif`;g.textAlign='center';g.textBaseline='middle';
  for(const[t,x,y]of LABELS){g.fillStyle='rgba(0,0,0,.7)';g.fillText(t,x*TILE*s+1,y*TILE*s+1);g.fillStyle='#ece9ff';g.fillText(t,x*TILE*s,y*TILE*s)}
  g.strokeStyle='#ffb347';g.lineWidth=2;g.beginPath();g.arc(SH.zone.x*s,SH.zone.z*s,SH.zone.r*s,0,7);g.stroke();
  for(const n of ACT.nests)if(!n.dead){g.fillStyle='#ff2e88';g.beginPath();g.arc(n.x*s,n.z*s,5,0,7);g.fill()}
  const tg=stepTarget();if(tg){g.fillStyle='#ffd400';g.beginPath();g.arc(tg.x*s,tg.z*s,7,0,7);g.fill()}
  g.fillStyle='#29e7ff';g.beginPath();g.arc(PL.x*s,PL.z*s,6,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
  g.font='600 12px "IBM Plex Mono",monospace';g.textAlign='left';g.fillStyle='#9591b5';g.fillText('주황 원 = 쉘터 구역 · 노랑 = 목표 · 분홍 = 감염 둥지 · M 또는 클릭으로 닫기',10,h-12);
}

/* ---------- world animation, lighting, HUD ---------- */
const _pv=new THREE.Vector3();
function worldUpdate(dt){
  GAME.minutes+=dt*1.2;const mm=GAME.minutes%1440;GAME.hour=Math.floor(mm/60);GAME.day=1+Math.floor(GAME.minutes/1440);
  const night=GAME.hour>=20||GAME.hour<5;GAME.night=night;
  const dayF=clamp(night?0:GAME.hour<7?(GAME.hour-5+mm%60/60)/2:GAME.hour>=18?1-(GAME.hour-18+mm%60/60)/2:1,0,1);
  const fogCol=new THREE.Color(0x0d0818).lerp(new THREE.Color(0x3a3848),dayF*.8);
  scene.fog.color.copy(fogCol);scene.background.copy(fogCol);scene.fog.density=.0105+dayF*.004;
  hemi.intensity=.55+dayF*.9;moon.intensity=.35+dayF*.6;
  if(bloom)bloom.strength=.95-dayF*.45;
  if(CITY.signMat)CITY.signMat.color.setScalar(1.35-dayF*.5+Math.sin(GAME.t*30)*.02);
  sky.material.color.setScalar(1+dayF*2.2);
  for(const t of CITY.trains){t.g.position.x+=t.dir*14*dt;if(t.dir>0&&t.g.position.x>WX+120)t.g.position.x=-120;if(t.dir<0&&t.g.position.x<-120)t.g.position.x=WX+120}
  CITY.omniRings.forEach((r,i)=>{r.rotation.z+=dt*(.2+i*.1)});
  if(CITY.water)CITY.water.offset.x+=dt*.01;
  // rain around camera
  const rp=rain.geometry.attributes.position.array,cx=camera.position.x,cy=camera.position.y,cz=camera.position.z,fall=30*dt,wind=4*dt;
  for(let i=0;i<rp.length;i+=6){rp[i+1]-=fall;rp[i+4]-=fall;rp[i]-=wind;rp[i+3]-=wind;
    if(rp[i+1]<0||Math.abs(rp[i]-cx)>45||Math.abs(rp[i+2]-cz)>45){const x=cx+rnd(-45,45),z=cz+rnd(-45,45),y=cy+rnd(10,28);rp[i]=x;rp[i+1]=y;rp[i+2]=z;rp[i+3]=x+.12;rp[i+4]=y+1.1;rp[i+5]=z}}
  rain.geometry.attributes.position.needsUpdate=true;
  const sp=splash.geometry.attributes.position.array;for(let i=0;i<sp.length;i+=3){if(Math.random()<.3){sp[i]=cx+rnd(-25,25);sp[i+1]=.05;sp[i+2]=cz+rnd(-25,25)}}splash.geometry.attributes.position.needsUpdate=true;
  // burning barrels
  for(const b of CITY.barrels)if(Math.abs(b[0]-PL.x)<60&&Math.abs(b[1]-PL.z)<60&&Math.random()<.35)ember(b[0],1,b[1],Math.random()<.5?'#ff7a2e':'#ffb347');
  // flashlight
  const on=PL.flash&&!PL.inCar&&!PL.dead&&(GAME.night||dayF<.5);flashLight.intensity=on?2.4:0;
  if(on){const f=camForward();flashLight.position.set(PL.x+Math.sin(PL.yaw)*.3,1.5,PL.z+Math.cos(PL.yaw)*.3);flashLight.target.position.set(PL.x+f.x*18,1.2+f.y*18,PL.z+f.z*18)}
  if(!PL.inCar&&AU.ctx)AU.engG.gain.setTargetAtTime(0,AU.ctx.currentTime,.1);
  GAME.safe=false;
}
const cacheT={};
function setT(id,v,html){if(cacheT[id]===v)return;cacheT[id]=v;if(html)$(id).innerHTML=v;else $(id).textContent=v}
let zoneName='',zoneT=0;
function hudUpdate(dt){
  const I=GAME.inv,w=curW();
  setT('clock',`${String(GAME.hour).padStart(2,'0')}:${String(Math.floor(GAME.minutes%60)).padStart(2,'0')} · ${GAME.day}일차 · ${GAME.night?'밤 · 감염체 활발':'낮'}`);
  setT('money','$'+GAME.money.toLocaleString());setT('scrap',`고철 ${I.scrap} · 칩 ${I.chips}`);
  $('hpBar').style.width=clamp(PL.hp,0,100)+'%';$('bstBar').style.width=GAME.boostE+'%';$('arBar').style.width=clamp(PL.armor*2,0,100)+'%';$('stBar').style.width=PL.stamina+'%';
  if(PL.inCar){const c=PL.inCar,kmh=Math.round(Math.hypot(c.vx,c.vz)*3.6);setT('wName',VT[c.type].ko);setT('wAmmo',`${kmh} km/h`);$('carHp').style.width=clamp(c.hp/c.maxHp*100,0,100)+'%';$('carHpWrap').hidden=false}
  else{$('carHpWrap').hidden=true;setT('wName',w.ko+(I.up[PL.weapon]?` +${I.up[PL.weapon]}`:''));setT('wAmmo',w.melee?'∞':PL.reload>0?'재장전…':`${I.mag[PL.weapon]} / ${I.ammo[PL.weapon]}`)}
  setT('wSlots',WKEYS.map((k,i)=>`<span class="${k===PL.weapon?'on':''}${I.owned[k]?'':' off'}">${i+1}</span>`).join(''),true);
  if(MSN.active){setT('mTitle',MSN.active.title);setT('mObj',stepText())}
  else if(STORY[GAME.story]){setT('mTitle','다음 의뢰 · '+STORY[GAME.story].title);setT('mObj','쉘터의 미라(해결사)에게 가서 E. 고철을 모아 쉘터를 강화하라.')}
  else{setT('mTitle','자유 모드');setT('mObj','해결사 의뢰를 받거나 구역을 정리하라.')}
  if(SH.waveOn){$('wave').hidden=false;setT('waveTxt',`블러드 레인 · WAVE ${SH.wave} · 남은 감염체 ${SH.waveLeft+ACT.zombies.filter(z=>z.wave&&!z.dead).length}`);$('coreBar').style.width=clamp(SH.coreHp/SH.coreMax*100,0,100)+'%'}else $('wave').hidden=true;
  $('vig').style.opacity=clamp((1-PL.hp/100)*.9+PL.hurtT*.5,0,1);
  const ch=$('cross');ch.hidden=PL.inCar||PL.dead||SH.building||CUT!=null;ch.style.setProperty('--s',(8+(w.spread||0)*600*(PL.sprinting?2:1)*(CAM.aim>.5?.55:1)+(PL.recoil||0)*8)+'px');
  if(hitT>0){hitT-=dt;if(hitT<=0)$('hitmark').className=''}
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').classList.remove('show')}
  if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').classList.remove('show')}else if(MSGQ.length&&!CUT){const m=MSGQ.shift(),ww=WHO[m.who];$('msgPic').src=portrait(m.who);$('msgFrom').textContent=ww.ko;$('msgFrom').style.color=ww.col;$('msgKo').textContent=m.ko;$('msgEn').textContent=m.en||'';$('msg').classList.add('show');msgT=Math.max(4,m.ko.length*.08);sfx('msg')}
  zoneT-=dt;if(zoneT<=0){zoneT=.5;const z=zoneOf(PL.x,PL.z);if(z[0]!==zoneName){zoneName=z[0];$('zone').innerHTML=`<small>${esc(z[1])}</small>${esc(z[0])}`;$('zone').classList.add('show');clearTimeout($('zone')._t);$('zone')._t=setTimeout(()=>$('zone').classList.remove('show'),3200)}}
  // objective marker
  const tg=stepTarget(),mk=$('marker');
  if(tg&&!CUT){_pv.set(tg.x,2.2,tg.z).project(camera);let x=(_pv.x*.5+.5)*innerWidth,y=(-_pv.y*.5+.5)*innerHeight;const behind=_pv.z>1;
    if(behind){x=innerWidth-x;y=innerHeight-24}
    const off=behind||x<24||x>innerWidth-24||y<24||y>innerHeight-24;x=clamp(x,24,innerWidth-24);y=clamp(y,24,innerHeight-24);
    mk.hidden=false;mk.style.transform=`translate(${x}px,${y}px)`;mk.classList.toggle('edge',off);setT('mkDist',Math.round(Math.hypot(tg.x-PL.x,tg.z-PL.z))+'m')}else mk.hidden=true;
  drawMinimap();
}

/* ---------- save ---------- */
function saveGame(){if(GAME.capture)return;try{localStorage.setItem('ns3d-save',JSON.stringify({story:GAME.story,money:GAME.money,inv:GAME.inv,rescued:GAME.rescued,survivors:GAME.survivors,minutes:GAME.minutes,kills:GAME.kills,contractsDone:GAME.contractsDone,coreHp:SH.coreHp,
  pieces:SH.pieces.map(p=>({type:p.type,x:p.x,z:p.z,rot:p.rot,hp:p.hp})),pl:{hp:PL.hp,armor:PL.armor,weapon:PL.weapon}}))}catch(e){}}
function loadGame(){
  let s=null;try{s=JSON.parse(localStorage.getItem('ns3d-save')||'null')}catch(e){}
  if(!s||GAME.fresh){PL.x=LOC.start.x;PL.z=LOC.start.z;return}
  GAME.story=s.story|0;GAME.money=s.money|0;Object.assign(GAME.inv,s.inv||{});Object.assign(GAME.rescued,s.rescued||{});GAME.survivors=s.survivors|0;GAME.minutes=s.minutes||GAME.minutes;GAME.kills=s.kills|0;GAME.contractsDone=s.contractsDone|0;SH.coreHp=s.coreHp||1000;
  for(const p of s.pieces||[])if(PIECES[p.type])addPiece(p.type,p.x,p.z,p.rot,p.hp);
  if(s.pl){PL.hp=Math.max(30,s.pl.hp||100);PL.armor=s.pl.armor||0;if(GAME.inv.owned[s.pl.weapon])PL.weapon=s.pl.weapon}
  PL.x=LOC.shelter.x;PL.z=LOC.shelter.z+4;
}

/* ---------- main loop ---------- */
let last=performance.now(),incomeT=0;
GAME.boost=0;GAME.boostE=100;
function tick(dt){
  GAME.t+=dt;
  if(CUT)CUT.t+=dt;
  if(PRESSED.has('KeyZ')&&GAME.boost<=0&&!PL.dead){if(GAME.boostE>=40){GAME.boost=1;sfx('boost')}else toast('뉴로 부스트 에너지 부족','#29e7ff')}
  if(GAME.boost>0){GAME.boostE-=22*dt;if(GAME.boostE<=0){GAME.boostE=0;GAME.boost=0}}else GAME.boostE=Math.min(100,GAME.boostE+5*dt);
  document.body.classList.toggle('boost',GAME.boost>0);
  const wdt=GAME.boost>0?dt*.3:dt;
  updatePlayer(dt);
  aiUpdate(wdt);vehUpdate(wdt);shelterUpdate(wdt);missionUpdate(dt);fxUpdate(wdt);worldUpdate(dt);
  incomeT-=dt;if(incomeT<=0){incomeT=30;const n=(GAME.rescued.kang?1:0)+(GAME.rescued.taeo?1:0)+GAME.survivors;if(n){GAME.inv.scrap+=n;}}
  if(PRESSED.has('KeyM')||PRESSED.has('Tab')){pauseFor('mapScr');drawBigMap()}
  if(PRESSED.has('Escape')||PRESSED.has('KeyP')){if(SH.building)setBuildMode(false);else pauseFor('pauseScr')}
  PRESSED.clear();
}
function frame(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  if(GAME.state==='play'&&!GAME.capture){
    if(!GAME.paused)tick(dt);else if(CUT)CUT.t+=dt;
    updateCamera(dt);hudUpdate(dt);
    if(composer)composer.render();else renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}

/* ---------- boot ---------- */
function startGame(fresh){
  $('loading').hidden=false;
  setTimeout(()=>{
    GAME.fresh=fresh;if(fresh)try{localStorage.removeItem('ns3d-save')}catch(e){}
    audioInit();if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume();
    initGame();if(isTouch)touchInit();
    $('titleScr').hidden=true;$('loading').hidden=true;$('hud').hidden=false;GAME.state='play';GAME.paused=false;
    CAM.yaw=Math.PI;
    if(GAME.story===0&&!MSN.active)setTimeout(()=>startMission(STORY[0],true),600);
    else msg('mira','돌아왔네. 의뢰는 내 카운터에서.','You\'re back. Contracts are at my counter.');
    setTimeout(()=>toast('클릭으로 시점 고정 · WASD 이동 · 마우스 조준/사격 · F 차량 · B 건설','#9fe8ff'),2500);
  },60);
}
$('btnStart').onclick=()=>startGame(false);
$('btnNew').onclick=()=>startGame(true);
document.querySelectorAll('[data-q]').forEach(b=>{b.classList.toggle('on',b.dataset.q===QUALITY);b.onclick=()=>{QUALITY=b.dataset.q;try{localStorage.setItem('ns3d-quality',QUALITY)}catch(e){}document.querySelectorAll('[data-q]').forEach(x=>x.classList.toggle('on',x===b))}});
document.querySelectorAll('[data-q2]').forEach(b=>{b.classList.toggle('on',b.dataset.q2===QUALITY);b.onclick=()=>{try{localStorage.setItem('ns3d-quality',b.dataset.q2)}catch(e){}saveGame();location.reload()}});
try{if(localStorage.getItem('ns3d-save'))$('btnNew').hidden=false,$('btnStart').textContent='이어하기'}catch(e){}
$('btnResume').onclick=closeOverlays;$('btnRespawn').onclick=respawn;$('btnFree').onclick=closeOverlays;
['boardClose','benchClose'].forEach(id=>$(id).onclick=closeOverlays);
$('mapScr').addEventListener('pointerdown',closeOverlays);
addEventListener('keydown',e=>{if(GAME.state!=='play')return;
  if(!$('mapScr').hidden&&(e.code==='KeyM'||e.code==='Tab'||e.code==='Escape')){closeOverlays();e.stopImmediatePropagation();e.preventDefault()}
  else if((!$('board').hidden||!$('bench').hidden||!$('pauseScr').hidden)&&(e.code==='Escape'||e.code==='KeyP')){closeOverlays();e.stopImmediatePropagation()}},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&GAME.state==='play'&&!GAME.paused&&!GAME.capture)pauseFor('pauseScr')});
$('titlePic0').src=portrait('seojin');$('titlePic1').src=portrait('mira');$('titlePic2').src=portrait('taeo');
requestAnimationFrame(frame);

/* ---------- deterministic capture API (promo video / testing) ---------- */
const NS3={
  scenes:['street','horde','drive','shelter','build','raiders','forest','omni','wave','title'],
  ready:false,
  init(q){if(this.ready)return true;QUALITY=q||QUALITY;GAME.capture=true;GAME.fresh=true;audioInit=()=>{};initGame();$('titleScr').hidden=true;$('loading').hidden=true;$('hud').hidden=false;GAME.state='play';GAME.paused=false;GAME.god=true;this.ready=true;return true},
  clear(){SH.lastNightWave=GAME.day;for(const z of ACT.zombies){removeActor(z)}ACT.zombies=[];for(const r of ACT.raiders)removeActor(r);ACT.raiders=[];for(const n of ACT.nests)SCENE.remove(n.g);ACT.nests=[];MSN.active=null;SH.waveOn=false;
    if(PL.inCar)exitCar(true);CUT=null;$('cut').hidden=true;closeOverlays();setBuildMode(false);PL.dead=false;PL.hp=100;PL.h.root.visible=true;this.auto=null},
  place(x,z,yaw,pitch){PL.x=x;PL.z=z;PL.yaw=yaw;CAM.yaw=yaw;CAM.pitch=pitch??.18},
  scene(name){this.init();this.clear();const S=this;GAME.calm=false;
    const L=LOC;
    if(name==='street'){GAME.minutes=22*60;S.place(P(70,53.5).x,P(70,53.5).z,-Math.PI/2,.12);for(let i=0;i<8;i++){const s=randomSpot(14,40);if(s)spawnZombie(s.x,s.z,'walker')}S.auto={walk:1}}
    if(name==='horde'){GAME.minutes=1*60;S.place(P(64,30).x,P(64,30).z,0,.1);PL.weapon='smg';GAME.inv.owned.smg=true;GAME.inv.mag.smg=999;for(let i=0;i<22;i++){const s={x:PL.x+rnd(-8,8),z:PL.z+rnd(14,40)};spawnZombie(s.x,s.z,i%7===0?'brute':i%3===0?'runner':'walker')}S.auto={fire:1,aimCam:1}}
    if(name==='drive'){GAME.minutes=23*60;const c=makeCar('gt',PC(64,20).x,PC(64,20).z,0,{col:'#29e7ff'});PL.x=c.x;PL.z=c.z;enterCar();CAM.yaw=0;CAM.pitch=.22;for(let i=0;i<14;i++){const s={x:c.x+rnd(-5,5),z:c.z+rnd(25,90)};spawnZombie(s.x,s.z,'walker')}S.auto={drive:1}}
    if(name==='shelter'){GAME.minutes=21*60;S.place(L.shelter.x-3,L.shelter.z+5,Math.PI*1.08,.32);if(!SH.pieces.length)S.demoBase()}
    if(name==='build'){GAME.minutes=21*60;S.place(L.shelter.x+2,L.shelter.z+3,Math.PI*.92,.5);if(!SH.pieces.length)S.demoBase();setBuildMode(true);SH.sel=2}
    if(name==='raiders'){GAME.minutes=2*60;S.place(L.raiderYard.x-2,L.raiderYard.z-22,0,.08);for(let i=0;i<5;i++){const s=randomSpot(3,9,L.raiderYard.x,L.raiderYard.z);if(s)spawnRaider(s.x,s.z)}for(let i=0;i<8;i++){const s=randomSpot(10,18,L.raiderYard.x,L.raiderYard.z);if(s)spawnZombie(s.x,s.z,'runner')}S.auto={fire:1,aimCam:1}}
    if(name==='forest'){GAME.minutes=3*60;S.place(P(20,40).x,P(20,40).z,Math.PI*.85,.12);spawnNest(P(17,47).x,P(17,47).z);spawnNest(P(24,52).x,P(24,52).z);for(let i=0;i<8;i++){const s=randomSpot(8,20,P(20,48).x,P(20,48).z);if(s)spawnZombie(s.x,s.z,'glow')}PL.weapon='katana';S.auto={walk:1}}
    if(name==='omni'){GAME.minutes=0;S.place(P(97,62).x,P(97,62).z,.55,-.32);for(let i=0;i<10;i++){const s=randomSpot(4,22,L.omni.x,L.omni.z);if(s)spawnZombie(s.x,s.z,i<2?'brute':'glow')}}
    if(name==='wave'){GAME.minutes=60;S.place(L.shelter.x,L.shelter.z-2,Math.PI,.2);if(!SH.pieces.length)S.demoBase();startWave(3);SH.waveSpawn=0;for(let i=0;i<16;i++){const s=randomSpot(18,34,SH.zone.x,SH.zone.z);if(s)spawnZombie(s.x,s.z,i%5===0?'runner':'walker',{wave:true})}PL.weapon='shotgun';GAME.inv.owned.shotgun=true;GAME.inv.mag.shotgun=999;S.auto={fire:1,aimCam:1}}
    if(name==='title'){GAME.minutes=23*60;S.place(P(40,53).x,P(40,53).z,Math.PI/2,-.04);PL.h.root.visible=false;$('hud').hidden=true}
    else $('hud').hidden=false;
    for(let i=0;i<20;i++)tick(1/60);updateCamera(1/60);this.render();return true},
  demoBase(){const s=LOC.shelter;addPiece('wall',s.x-6,s.z-10,0);addPiece('wall',s.x-2,s.z-10,0);addPiece('wall',s.x+2,s.z-10,0);addPiece('wall',s.x+6,s.z-10,0);addPiece('spikes',s.x,s.z-13,0);
    addPiece('gen',s.x+10,s.z+2,0);addPiece('turret',s.x-8,s.z-7,0);addPiece('turret',s.x+8,s.z-7,0);addPiece('light',s.x-11,s.z-3,0);addPiece('light',s.x+12,s.z-4,0);addPiece('bench',s.x+6,s.z+3,Math.PI);addPiece('bed',s.x-4,s.z+4,Math.PI/2)},
  render(){updateCamera(1/60);hudUpdate(1/60);if(composer)composer.render();else renderer.render(scene,camera)},
  advance(sec){const n=Math.max(1,Math.round(sec*60)),a=this.auto;
    for(let i=0;i<n;i++){
      if(a){if(a.walk)KEYS.KeyW=true;if(a.fire){let best=null,bd=40;for(const z of ACT.zombies)if(!z.dead){const d=Math.hypot(z.x-PL.x,z.z-PL.z);if(d<bd){bd=d;best=z}}
        if(best&&a.aimCam){const want=Math.atan2(best.x-PL.x,best.z-PL.z);CAM.yaw+=angDiff(want,CAM.yaw)*.15;CAM.pitch=lerp(CAM.pitch,.06,.1)}MOUSE.rmb=true;MOUSE.lmb=!!best;if(best&&Math.random()<.5)PRESSED.add('Fire')}
        if(a.drive){KEYS.KeyW=true}}
      tick(1/60);
    }
    KEYS.KeyW=false;MOUSE.lmb=false;this.render();return true},
};
window.NS3=NS3;
