'use strict';
/* =========================================================================
   Actors: procedural low-poly humans, zombies (neon-infected), raiders,
   survivors, nests, pickups, particles, tracers and hitscan combat.
   Convention: an actor faces +Z in model space; yaw a means direction
   (sin a, cos a) in the XZ plane.
   ========================================================================= */
const MC={};
const BOXG=new THREE.BoxGeometry(1,1,1);
function mat(col,emi,extra){const k=col+'|'+(emi||'')+'|'+(extra||'');if(MC[k])return MC[k];
  const m=emi?new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(emi==='hot'?2.2:1.4),toneMapped:false}):new THREE.MeshStandardMaterial({color:col,roughness:.72,metalness:.08});return MC[k]=m}
function part(parent,col,sx,sy,sz,x,y,z,emi){const m=new THREE.Mesh(BOXG,mat(col,emi));m.scale.set(sx,sy,sz);m.position.set(x,y,z);parent.add(m);return m}
function limb(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}

/* o: {skin, top, top2, pants, shoes, hair, hairStyle, visor, eyes, mask, scale, coat, scarf, glowStripe} */
function makeHuman(o){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const s=o.scale||1;body.scale.setScalar(s);
  const hips=limb(body,0,.95,0);
  part(hips,o.pants,.38,.2,.24,0,0,0);
  const torso=limb(hips,0,.08,0);
  part(torso,o.top,.48,.62,.27,0,.32,0);
  if(o.top2)part(torso,o.top2,.5,.14,.29,0,.1,0);
  if(o.coat)part(torso,o.coat,.52,.5,.3,0,-.12,-.01);
  if(o.scarf)part(torso,o.scarf,.34,.14,.32,0,.6,.02);
  if(o.glowStripe)part(torso,o.glowStripe,.05,.5,.02,.12,.32,.145,'hot');
  const head=limb(torso,0,.7,0);
  part(head,o.skin,.25,.29,.27,0,.14,0);
  if(o.hair){if(o.hairStyle==='bob')part(head,o.hair,.29,.26,.3,0,.2,-.02);else if(o.hairStyle==='long')part(head,o.hair,.29,.42,.3,0,.12,-.03);else if(o.hairStyle!=='bald')part(head,o.hair,.27,.1,.29,0,.31,-.01)}
  if(o.mask)part(head,o.mask,.26,.16,.1,0,.1,.12);
  if(o.visor)part(head,o.visor,.26,.06,.06,0,.17,.14,'hot');
  if(o.eyes){part(head,o.eyes,.05,.035,.02,-.06,.17,.14,'hot');part(head,o.eyes,.05,.035,.02,.06,.17,.14,'hot')}
  const armL=limb(torso,-.31,.55,0),armR=limb(torso,.31,.55,0);
  for(const a of[armL,armR]){part(a,o.coat||o.top,.13,.64,.14,0,-.3,0);part(a,o.skin,.1,.12,.11,0,-.66,0)}
  const legL=limb(hips,-.11,-.02,0),legR=limb(hips,.11,-.02,0);
  for(const l of[legL,legR]){part(l,o.pants,.17,.88,.19,0,-.44,0);part(l,o.shoes||'#111',.17,.1,.28,0,-.9,.05)}
  const gun=new THREE.Group();gun.position.set(0,-.62,.12);armR.add(gun);
  part(gun,'#1b1c22',.07,.12,.36,0,0,.12);part(gun,'#1b1c22',.06,.16,.08,0,-.1,0);
  const blade=part(gun,o.bladeCol||'#29e7ff',.03,.05,1.1,0,0,.6,'hot');blade.visible=false;
  gun.visible=false;
  return{root,body,hips,torso,head,armL,armR,legL,legR,gun,blade,ph:Math.random()*6,swing:0,fall:0};
}
function animHuman(h,speed,dt,mode){
  const amp=Math.min(.95,speed*.2);h.ph+=dt*(2.2+speed*1.7);
  const sw=Math.sin(h.ph)*amp;
  h.legL.rotation.x=sw;h.legR.rotation.x=-sw;
  h.hips.position.y=.95+Math.abs(Math.cos(h.ph))*amp*.06;
  if(mode==='zombie'){h.armL.rotation.x=-1.35+Math.sin(h.ph*.5)*.12;h.armR.rotation.x=-1.25+Math.cos(h.ph*.5)*.12;h.head.rotation.z=Math.sin(h.ph*.3)*.25;h.torso.rotation.x=.18}
  else if(mode==='aim'){h.armR.rotation.x=-1.52;h.armL.rotation.x=-1.25;h.armL.rotation.z=-.35;h.torso.rotation.x=0}
  else if(mode==='drive'){h.armR.rotation.x=-1.2;h.armL.rotation.x=-1.2;h.legL.rotation.x=-1.4;h.legR.rotation.x=-1.4}
  else{h.armL.rotation.x=-sw*.8;h.armR.rotation.x=sw*.8;h.armL.rotation.z=0;h.torso.rotation.x=speed>5?.15:0}
  if(h.swing>0){h.swing-=dt;const t=1-h.swing/.35;h.armR.rotation.x=-2.4+t*2.2;h.armR.rotation.z=-.6+t*1.2;h.torso.rotation.y=.6-t*1.2}else h.torso.rotation.y=0;
}
function animFall(h,dt){h.fall=Math.min(1,h.fall+dt*2.6);h.body.rotation.x=-h.fall*Math.PI/2*1.02;h.body.position.y=-h.fall*.2;h.armL.rotation.x=-2.6*h.fall;h.armR.rotation.x=-2.8*h.fall}

/* character looks */
const LOOKS={
  seojin:{skin:'#e6b89a',top:'#0e0f18',top2:'#171a28',pants:'#11121a',hair:'#0b0b10',hairStyle:'bob',visor:'#29e7ff',shoes:'#0b0b10',glowStripe:'#29e7ff',bladeCol:'#29e7ff'},
  taeo:{skin:'#c48b68',top:'#4a2a1a',pants:'#1c1c24',hair:'#1a120e',scarf:'#ffb347',shoes:'#5a3018'},
  mira:{skin:'#dfb096',top:'#1d1222',coat:'#2a1830',pants:'#16121c',hair:'#c9cad8',hairStyle:'bob',glowStripe:'#ff2e88'},
  kang:{skin:'#c08c6a',top:'#5a4632',coat:'#6a5238',pants:'#2a241e',hair:'#a2a2ac',hairStyle:'bald',shoes:'#3a2012'},
  doyun:{skin:'#dcaa86',top:'#16402a',top2:'#5dff9b',pants:'#141418',hair:'#efe2a8'},
  raider:()=>({skin:'#b98266',top:rpick(['#3a1a1a','#2a2a2a','#402818']),top2:'#6a1010',pants:rpick(['#222','#2a2620','#1e2230']),mask:'#aa1818',visor:'#ff2848',hair:'#111'}),
  survivor:()=>({skin:rpick(['#e0b090','#c89070','#d8a888']),top:rpick(['#4a5a6a','#6a5a4a','#3a4a3a','#5a3a4a']),pants:rpick(['#2a2a33','#3a3226']),hair:rpick(['#111','#3a2a1a','#666'])}),
  zombie:(t)=>({skin:rpick(['#7d8f7f','#8a8f9a','#6f7f76','#8f8a78']),top:rpick(['#2a2c30','#3a2a2a','#2a3a3a','#44403a','#3a3050']),pants:rpick(['#22232a','#2a2620','#303040']),hair:rpick(['#111','#2a2018',null]),
    eyes:t==='glow'?'#ff2e88':t==='runner'?'#ffb347':'#5dff9b',glowStripe:t==='glow'?'#ff2e88':null,scale:t==='brute'?1.5:1,hairStyle:Math.random()<.3?'long':null}),
};

/* ---------- particles ---------- */
const FX={};
function fxInit(scene){
  const N=2400;
  const geo=new THREE.BufferGeometry();
  FX.pos=new Float32Array(N*3);FX.col=new Float32Array(N*3);FX.p=[];FX.N=N;
  geo.setAttribute('position',new THREE.BufferAttribute(FX.pos,3));geo.setAttribute('color',new THREE.BufferAttribute(FX.col,3));
  const tex=radialTex('rgba(255,255,255,1)','rgba(0,0,0,0)');
  FX.pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.35,map:tex,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  FX.pts.frustumCulled=false;scene.add(FX.pts);
  // smoke puffs (normal blending, bigger)
  FX.spos=new Float32Array(600*3);FX.sp=[];
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(FX.spos,3));
  FX.smoke=new THREE.Points(sg,new THREE.PointsMaterial({size:2.4,map:tex,color:'#2a2a33',transparent:true,opacity:.35,depthWrite:false}));FX.smoke.frustumCulled=false;scene.add(FX.smoke);
  // tracers
  FX.tpos=new Float32Array(200*6);FX.tcol=new Float32Array(200*6);FX.tr=[];
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(FX.tpos,3));tg.setAttribute('color',new THREE.BufferAttribute(FX.tcol,3));
  FX.tracer=new THREE.LineSegments(tg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,toneMapped:false}));FX.tracer.frustumCulled=false;scene.add(FX.tracer);
  // muzzle light
  FX.flash=new THREE.PointLight('#ffcc88',0,14,2);scene.add(FX.flash);FX.flashT=0;
}
const _c=new THREE.Color();
function burst(x,y,z,n,col,spd=6,life=.5,up=2){_c.set(col);for(let i=0;i<n;i++){if(FX.p.length>=FX.N)FX.p.shift();const a=Math.random()*6.28,e=Math.random()*1.2-.2,s=spd*(.3+Math.random());FX.p.push({x,y,z,vx:Math.cos(a)*Math.cos(e)*s,vy:Math.sin(e)*s+up,vz:Math.sin(a)*Math.cos(e)*s,life:life*(.5+Math.random()),max:life,r:_c.r,g:_c.g,b:_c.b,grav:1})}}
function ember(x,y,z,col){_c.set(col);if(FX.p.length>=FX.N)FX.p.shift();FX.p.push({x:x+rnd(-.3,.3),y,z:z+rnd(-.3,.3),vx:rnd(-.3,.3),vy:rnd(1.5,3),vz:rnd(-.3,.3),life:rnd(.4,.9),max:.9,r:_c.r,g:_c.g,b:_c.b,grav:0})}
function puff(x,y,z){if(FX.sp.length>=600)FX.sp.shift();FX.sp.push({x:x+rnd(-.4,.4),y,z:z+rnd(-.4,.4),vy:rnd(.8,1.8),life:rnd(1.5,3)})}
function tracer(a,b,col){_c.set(col);if(FX.tr.length>=200)FX.tr.shift();FX.tr.push({a:[a.x,a.y,a.z],b:[b.x,b.y,b.z],life:.07,r:_c.r,g:_c.g,b2:_c.b})}
function muzzle(p,col='#ffcc88'){FX.flash.position.copy(p);FX.flash.color.set(col);FX.flash.intensity=6;FX.flashT=.05;burst(p.x,p.y,p.z,4,col,3,.08,0)}
function fxUpdate(dt){
  let i=0;
  for(const p of FX.p){p.life-=dt;p.vy-=9.8*dt*p.grav;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.05&&p.grav){p.y=.05;p.vy*=-.3;p.vx*=.6;p.vz*=.6}}
  FX.p=FX.p.filter(p=>p.life>0);
  for(const p of FX.p){const k=Math.max(0,p.life/p.max);FX.pos[i*3]=p.x;FX.pos[i*3+1]=p.y;FX.pos[i*3+2]=p.z;FX.col[i*3]=p.r*k*1.6;FX.col[i*3+1]=p.g*k*1.6;FX.col[i*3+2]=p.b*k*1.6;i++}
  FX.pts.geometry.setDrawRange(0,i);FX.pts.geometry.attributes.position.needsUpdate=true;FX.pts.geometry.attributes.color.needsUpdate=true;
  let j=0;for(const s of FX.sp){s.life-=dt;s.y+=s.vy*dt;s.x+=dt*.6}FX.sp=FX.sp.filter(s=>s.life>0);
  for(const s of FX.sp){FX.spos[j*3]=s.x;FX.spos[j*3+1]=s.y;FX.spos[j*3+2]=s.z;j++}
  FX.smoke.geometry.setDrawRange(0,j);FX.smoke.geometry.attributes.position.needsUpdate=true;
  let k=0;for(const t of FX.tr){t.life-=dt}FX.tr=FX.tr.filter(t=>t.life>0);
  for(const t of FX.tr){FX.tpos.set(t.a,k*6);FX.tpos.set(t.b,k*6+3);FX.tcol.set([t.r*.3,t.g*.3,t.b2*.3,t.r*2,t.g*2,t.b2*2],k*6);k++}
  FX.tracer.geometry.setDrawRange(0,k*2);FX.tracer.geometry.attributes.position.needsUpdate=true;FX.tracer.geometry.attributes.color.needsUpdate=true;
  if(FX.flashT>0){FX.flashT-=dt;if(FX.flashT<=0)FX.flash.intensity=0}
}

/* ---------- actors ---------- */
const ACT={zombies:[],raiders:[],allies:[],npcs:[],pickups:[],nests:[]};
const ZT={
  walker:{ko:'워커',hp:70,speed:1.5,dmg:9,reach:1.3,score:1},
  runner:{ko:'러너',hp:45,speed:4.9,dmg:7,reach:1.2,score:2},
  brute:{ko:'브루트',hp:420,speed:1.9,dmg:26,reach:1.9,score:6},
  glow:{ko:'네온 감염체',hp:90,speed:2.5,dmg:11,reach:1.3,score:3,explode:true},
};
let SCENE=null;
function actorsInit(scene){SCENE=scene;fxInit(scene)}
function spawnZombie(x,z,type='walker',o={}){
  const t=ZT[type],look=LOOKS.zombie(type);
  const h=makeHuman(look);h.root.position.set(x,0,z);SCENE.add(h.root);
  const zb={kind:'zombie',type,x,z,yaw:Math.random()*6.28,hp:t.hp*(o.hpMul||1),maxHp:t.hp*(o.hpMul||1),speed:t.speed*rnd(.85,1.15),dmg:t.dmg,reach:t.reach*(look.scale||1),r:.38*(look.scale||1),h,cd:0,state:'wander',wt:0,dead:0,noise:0,wave:!!o.wave,mission:o.mission||null,groan:rnd(2,8),hitT:0,slow:0,scale:look.scale||1};
  ACT.zombies.push(zb);return zb;
}
function spawnRaider(x,z,o={}){
  const h=makeHuman(o.boss?{...LOOKS.raider(),top:'#1a1a1a',top2:'#ffb347',scale:1.15,visor:'#ffb347'}:LOOKS.raider());h.root.position.set(x,0,z);h.gun.visible=true;SCENE.add(h.root);
  const r={kind:'raider',x,z,yaw:Math.random()*6.28,hp:o.boss?400:90,maxHp:o.boss?400:90,speed:3.4,r:.4,h,cd:rnd(.5,1.5),state:'patrol',home:{x,z},dead:0,target:null,strafe:Math.random()<.5?1:-1,boss:!!o.boss,camp:o.camp||null,mission:o.mission||null,hitT:0,scale:o.boss?1.15:1,ph:Math.random()*6};
  ACT.raiders.push(r);return r;
}
function spawnAlly(x,z,look,o={}){
  const h=makeHuman(typeof look==='function'?look():look);h.root.position.set(x,0,z);SCENE.add(h.root);
  const a={kind:'ally',x,z,yaw:0,hp:100,maxHp:100,r:.38,h,follow:!!o.follow,id:o.id||null,dead:0,home:{x,z},speed:4.2,name:o.name||'생존자',scale:1};
  ACT.allies.push(a);return a;
}
function spawnNPC(id,x,z,yaw=0){
  const h=makeHuman(LOOKS[id]);h.root.position.set(x,0,z);h.root.rotation.y=yaw;SCENE.add(h.root);
  const n={kind:'npc',id,x,z,yaw,h,home:{x,z,yaw},r:.4,scale:1};ACT.npcs.push(n);return n;
}
function removeActor(a){SCENE.remove(a.h.root)}
function spawnNest(x,z,o={}){
  const g=new THREE.Group();
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.4,1),new THREE.MeshBasicMaterial({color:new THREE.Color('#ff2e88').multiplyScalar(1.8),toneMapped:false,wireframe:false}));core.position.y=1.3;g.add(core);
  const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(1.9,0),new THREE.MeshStandardMaterial({color:'#2a1030',roughness:.6,flatShading:true,transparent:true,opacity:.75}));shell.position.y=1.3;g.add(shell);
  for(let i=0;i<6;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(.08,.2,3,5),mat('#3a1a3a'));const a=i/6*6.28;t.position.set(Math.cos(a)*1.6,.5,Math.sin(a)*1.6);t.rotation.set(Math.sin(a)*.7,0,-Math.cos(a)*.7);g.add(t)}
  g.position.set(x,0,z);SCENE.add(g);
  const n={kind:'nest',x,z,hp:260,maxHp:260,r:2,g,core,shell,cd:rnd(2,5),dead:0,mission:o.mission||null,scale:1.5};ACT.nests.push(n);return n;
}
/* pickups */
const PICK={scrap:{col:'#ff9a3a',ko:'고철'},ammo:{col:'#3dff9b',ko:'탄약'},med:{col:'#ff4d5e',ko:'메디킷'},cash:{col:'#7cffb2',ko:'현금'},chip:{col:'#29e7ff',ko:'테크 칩'}};
function spawnPickup(x,z,type,amt){
  const m=new THREE.Mesh(type==='chip'?new THREE.OctahedronGeometry(.28):BOXG,mat(PICK[type].col,'hot'));if(type!=='chip')m.scale.set(.42,.3,.42);m.position.set(x,.45,z);SCENE.add(m);
  ACT.pickups.push({x,z,type,amt,m,t:0,life:90});
}

/* movement with collisions against tiles, shelter blocks and cars */
function moveEnt(e,dx,dz){
  const r=e.r||.4;let hitPiece=null;
  const blk=(x,z)=>solidW(x-r,z-r)||solidW(x+r,z-r)||solidW(x-r,z+r)||solidW(x+r,z+r)||x<r||z<r||x>WX-r||z>WZ-r;
  if(!blk(e.x+dx,e.z))e.x+=dx;
  if(!blk(e.x,e.z+dz))e.z+=dz;
  if(typeof SH!=='undefined')for(const p of SH.pieces){if(!p.block)continue;const q=pushOutRect(e,p.x,p.z,p.hw+r,p.hd+r,p.rot);if(q)hitPiece=p}
  if(typeof VEH!=='undefined')for(const c of VEH.cars){if(Math.abs(c.x-e.x)>4||Math.abs(c.z-e.z)>4)continue;pushOutRect(e,c.x,c.z,c.len/2+r*.8,c.wid/2+r*.8,c.yaw,true)}
  return hitPiece;
}
/* push circle centre out of an oriented rectangle; rect half extents along its local x (hw) and z (hd); rot = yaw */
function pushOutRect(e,cx,cz,hw,hd,rot,forwardIsLen){
  const s=Math.sin(rot),c=Math.cos(rot);
  // local axes: forward (s,c) and right (c,-s)
  const dx=e.x-cx,dz=e.z-cz;
  let lf=dx*s+dz*c, lr=dx*c-dz*s;
  const hf=forwardIsLen?hw:hd, hr=forwardIsLen?hd:hw;
  if(Math.abs(lf)>=hf||Math.abs(lr)>=hr)return false;
  if(hf-Math.abs(lf)<hr-Math.abs(lr))lf=Math.sign(lf||1)*hf;else lr=Math.sign(lr||1)*hr;
  const nx=cx+lf*s+lr*c,nz=cz+lf*c-lr*s;
  if(!solidW(nx,nz)){e.x=nx;e.z=nz}
  return true;
}
/* spatial hash for separation */
const HASH=new Map();
function hashAll(){HASH.clear();for(const L of[ACT.zombies,ACT.raiders,ACT.allies])for(const a of L){if(a.dead)continue;const k=(Math.floor(a.x/4)*1024+Math.floor(a.z/4));let b=HASH.get(k);if(!b)HASH.set(k,b=[]);b.push(a)}}
function neighbours(x,z,f){const cx=Math.floor(x/4),cz=Math.floor(z/4);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const b=HASH.get((cx+i)*1024+cz+j);if(b)for(const a of b)f(a)}}

/* ---------- hitscan ---------- */
const _v=new THREE.Vector3();
function heightAt(x,z){const t=tileW(x,z);if(t!==BLD)return -1;const i=bid[idx(Math.floor(x/TILE),Math.floor(z/TILE))];return i>=0?B[i].ht:30}
/* returns {t, ent, head, point} ; ents considered: zombies, raiders, nests, cars(optional), allies excluded unless hurtAllies */
function rayCast(o,d,range,opts={}){
  let best={t:range,ent:null,head:false,wall:false};
  // world geometry: march
  for(let t=.5;t<range;t+=.5){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<0){best={t,ent:null,wall:true};break}const h=heightAt(x,z);if(h>=0&&y<h){best={t,ent:null,wall:true};break}}
  const test=(e,cy,r)=>{const ox=o.x-e.x,oy=o.y-cy,oz=o.z-e.z;const b=ox*d.x+oy*d.y+oz*d.z,c=ox*ox+oy*oy+oz*oz-r*r,disc=b*b-c;if(disc<0)return -1;const t=-b-Math.sqrt(disc);return t>0?t:-1};
  const cands=[];
  if(opts.zombies!==false)for(const z of ACT.zombies)if(!z.dead)cands.push(z);
  if(opts.raiders!==false)for(const r of ACT.raiders)if(!r.dead)cands.push(r);
  for(const n of ACT.nests)if(!n.dead)cands.push(n);
  if(opts.player)cands.push(opts.player);
  if(opts.allies)for(const a of ACT.allies)if(!a.dead)cands.push(a);
  for(const e of cands){if(e===opts.ignore)continue;const s=e.scale||1;
    if(Math.abs(e.x-o.x)>range||Math.abs(e.z-o.z)>range)continue;
    if(e.kind==='nest'){const t=test(e,1.3,1.8);if(t>0&&t<best.t)best={t,ent:e,head:false};continue}
    let t=test(e,1.62*s,.2*s);if(t>0&&t<best.t){best={t,ent:e,head:true};continue}
    t=test(e,1.12*s,.4*s);if(t>0&&t<best.t)best={t,ent:e,head:false};
    t=test(e,.55*s,.3*s);if(t>0&&t<best.t)best={t,ent:e,head:false};
  }
  if(opts.cars&&typeof VEH!=='undefined')for(const c of VEH.cars){if(c===opts.ignoreCar)continue;const t=test({x:c.x,z:c.z},.9,c.wid*.6);if(t>0&&t<best.t)best={t,ent:c,head:false,car:true}}
  best.point=new THREE.Vector3(o.x+d.x*best.t,o.y+d.y*best.t,o.z+d.z*best.t);
  return best;
}
function damage(e,amt,from,opts={}){
  if(!e||e.dead)return;
  if(e.kind==='zombie'||e.kind==='raider'||e.kind==='nest'){
    e.hp-=amt;e.hitT=.12;
    if(e.kind==='zombie'){e.state='chase';e.target=from||e.target;e.slow=Math.max(e.slow,.25)}
    if(e.kind==='raider'&&from)e.target=from;
    const col=e.kind==='zombie'?(e.type==='glow'?'#ff2e88':'#7dff9b'):e.kind==='nest'?'#ff2e88':'#ff3040';
    if(opts.point)burst(opts.point.x,opts.point.y,opts.point.z,opts.head?12:6,col,opts.head?7:4,.45,1);
    if(e.hp<=0)killActor(e,from,opts);
  }else if(e.kind==='ally'){e.hp-=amt;if(e.hp<=0){e.dead=1;e.h.fall=0}}
  else if(e.kind==='player'){hurtPlayer(amt,opts.src)}
  else if(e.len){e.hp-=amt*.35}
}
function killActor(e,from,opts={}){
  e.dead=1;e.deadT=0;
  if(e.kind==='nest'){burst(e.x,1.5,e.z,60,'#ff2e88',9,1,3);SCENE.remove(e.g);sfx('boom');onKill&&onKill(e,from,opts);return}
  if(e.kind==='zombie'&&ZT[e.type].explode){burst(e.x,1,e.z,50,'#ff2e88',8,.8,2);sfx('boom');
    for(const q of ACT.zombies)if(q!==e&&!q.dead&&Math.hypot(q.x-e.x,q.z-e.z)<4)damage(q,80,null);
    if(Math.hypot(PL.x-e.x,PL.z-e.z)<4)hurtPlayer(22,'explode')}
  const r=Math.random();
  if(e.kind==='zombie'){if(r<.35)spawnPickup(e.x,e.z,'scrap',Math.ceil(rnd(2,5)*(e.type==='brute'?3:1)));else if(r<.45)spawnPickup(e.x,e.z,'ammo',1);else if(r<.5)spawnPickup(e.x,e.z,'med',1);if(e.type==='brute'||Math.random()<.04)spawnPickup(e.x+.8,e.z,'chip',1)}
  if(e.kind==='raider'){spawnPickup(e.x,e.z,r<.5?'ammo':'cash',r<.5?1:Math.floor(rnd(40,120)));if(Math.random()<.5)spawnPickup(e.x+.6,e.z+.3,'scrap',Math.ceil(rnd(3,6)));if(e.boss)spawnPickup(e.x-.6,e.z,'chip',2)}
  onKill&&onKill(e,from,opts);
}
let onKill=null;
