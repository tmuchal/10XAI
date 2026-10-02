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

/* ---------- human models: rounded segments with shoulder/elbow/hip/knee joints ---------- */
const GEO={};
function cyl(rt,rb,h,seg=10){const k='c'+rt+'|'+rb+'|'+h+'|'+seg;return GEO[k]||(GEO[k]=new THREE.CylinderGeometry(rt,rb,h,seg))}
function sph(r,ws=14,hs=10){const k='s'+r+'|'+ws+'|'+hs;return GEO[k]||(GEO[k]=new THREE.SphereGeometry(r,ws,hs))}
function rbox(w,h,d,rf=.3){const k='b'+w+'|'+h+'|'+d+'|'+rf;if(GEO[k])return GEO[k];const g=new THREE.BoxGeometry(w,h,d,4,4,4);
  const p=g.attributes.position,v=new THREE.Vector3(),r=Math.min(w,h,d)*rf;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const ix=clamp(v.x,-w/2+r,w/2-r),iy=clamp(v.y,-h/2+r,h/2-r),iz=clamp(v.z,-d/2+r,d/2-r);const dx=v.x-ix,dy=v.y-iy,dz=v.z-iz,l=Math.hypot(dx,dy,dz);if(l>1e-6)v.set(ix+dx/l*r,iy+dy/l*r,iz+dz/l*r);p.setXYZ(i,v.x,v.y,v.z)}
  g.computeVertexNormals();return GEO[k]=g}
function mesh(parent,geo,col,x,y,z,emi,sx,sy,sz){const m=new THREE.Mesh(geo,mat(col,emi));m.position.set(x,y,z);if(sx!==undefined)m.scale.set(sx,sy??sx,sz??sx);parent.add(m);return m}
/* o: skin, top, top2, sleeve, glove, pants, shoes, hair, hairStyle, visor, eyes, mask, hood, coat, scarf, collar, vest, pack, glowStripe, veins, scale, bulk */
function makeHuman(o){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  body.scale.setScalar(o.scale||1);const k=o.bulk||1;
  const hips=limb(body,0,.9,0);
  mesh(hips,cyl(.15*k,.14*k,.2,12),o.pants,0,0,0,null,1,1,.72);
  const torso=limb(hips,0,.08,0);
  mesh(torso,cyl(.19*k,.15*k,.48,14),o.top,0,.25,0,null,1,1,.66);
  mesh(torso,sph(.19*k,14,8),o.top,0,.47,0,null,1,.42,.66);
  if(o.top2)mesh(torso,cyl(.196*k,.17*k,.07,14),o.top2,0,.07,0,null,1,1,.7);
  if(o.coat){mesh(torso,cyl(.2*k,.25*k,.7,14),o.coat,0,.06,0,null,1,1,.72);mesh(torso,cyl(.205*k,.2*k,.3,14),o.coat,0,.36,0,null,1,1,.7)}
  if(o.vest){mesh(torso,rbox(.36*k,.32,.27*k),o.vest,0,.28,0);for(const x of[-.09,0,.09])mesh(torso,rbox(.07,.08,.05),o.vest2||'#3a3a30',x,.2,.14*k)}
  if(o.pack){mesh(torso,rbox(.28,.34,.13),o.pack,0,.28,-.16*k);if(o.glowStripe)mesh(torso,rbox(.2,.025,.02),o.glowStripe,0,.36,-.23*k,'hot')}
  if(o.scarf){mesh(torso,cyl(.11,.15,.12,12),o.scarf,0,.52,0);mesh(torso,rbox(.08,.28,.04),o.scarf,.07,.36,.12)}
  if(o.collar)mesh(torso,cyl(.1,.13,.1,12),o.collar,0,.53,0);
  if(o.glowStripe){mesh(torso,rbox(.025,.36,.02),o.glowStripe,.085,.27,.135*k,'hot');mesh(torso,rbox(.025,.36,.02),o.glowStripe,-.085,.27,.135*k,'hot')}
  if(o.veins)for(let i=0;i<4;i++)mesh(torso,rbox(.018,.2+Math.random()*.15,.018),o.veins,rnd(-.12,.12),rnd(.12,.36),.13,'hot').rotation.z=rnd(-.6,.6);
  const head=limb(torso,0,.5,0);
  mesh(head,cyl(.05,.06,.1,8),o.skin,0,.04,0);
  const skull=mesh(head,sph(.112,16,12),o.skin,0,.14,.005,null,1,1.12,1.06);
  const hs=o.hairStyle||'short';
  if(o.hair&&hs!=='bald'){
    if(hs==='bob'){mesh(head,sph(.128,16,10),o.hair,0,.16,-.022,null,1.06,1.02,1.1);mesh(head,rbox(.2,.05,.06),o.hair,0,.23,.085)}
    else if(hs==='long'){mesh(head,sph(.126,16,10),o.hair,0,.17,-.02,null,1.04,1,1.08);mesh(head,rbox(.22,.3,.08),o.hair,0,.04,-.08)}
    else if(hs==='spiky'){mesh(head,sph(.12,14,8),o.hair,0,.19,-.015,null,1,.82,1.04);for(let i=0;i<6;i++){const c=mesh(head,cyl(0,.035,.1,5),o.hair,rnd(-.07,.07),.29,rnd(-.07,.05));c.rotation.set(rnd(-.5,.3),0,rnd(-.4,.4))}}
    else mesh(head,sph(.12,14,8),o.hair,0,.19,-.015,null,1,.82,1.04);
  }
  if(o.hood)mesh(head,sph(.145,16,10),o.hood,0,.16,-.03,null,1.08,1.12,1.12);
  if(o.mask)mesh(head,sph(.116,14,10),o.mask,0,.1,.018,null,1.02,.6,1.05);
  if(o.visor)mesh(head,rbox(.21,.04,.05,.4),o.visor,0,.17,.088,'hot');
  else{const ec=o.eyes||'#1a1216',em=o.eyes?'hot':null;mesh(head,sph(.016,6,4),ec,-.038,.165,.104,em);mesh(head,sph(.016,6,4),ec,.038,.165,.104,em)}
  const mkArm=side=>{const sh=limb(torso,side*.24*k,.44,0);mesh(sh,sph(.065*k,10,8),o.sleeve||o.coat||o.top,0,0,0);mesh(sh,cyl(.058*k,.048*k,.28,10),o.sleeve||o.coat||o.top,0,-.14,0);
    const el=limb(sh,0,-.28,0);mesh(el,cyl(.048*k,.04*k,.26,10),o.forearm||o.sleeve||o.coat||o.top,0,-.13,0);mesh(el,sph(.046*k,10,8),o.glove||o.skin,0,-.29,.01,null,.9,1.2,1);
    if(o.veins)mesh(el,rbox(.015,.2,.015),o.veins,0,-.13,.045,'hot');return[sh,el]};
  const[armL,elbowL]=mkArm(-1),[armR,elbowR]=mkArm(1);
  const mkLeg=side=>{const hp=limb(hips,side*.085*k,-.03,0);mesh(hp,cyl(.078*k,.062*k,.43,10),o.pants,0,-.215,0);const kn=limb(hp,0,-.43,0);mesh(kn,cyl(.06*k,.048*k,.4,10),o.pants,0,-.2,0);mesh(kn,rbox(.105,.08,.25,.35),o.shoes||'#111',0,-.42,.045);return[hp,kn]};
  const[legL,kneeL]=mkLeg(-1),[legR,kneeR]=mkLeg(1);
  const gun=new THREE.Group();gun.position.set(0,-.3,.03);elbowR.add(gun);
  mesh(gun,rbox(.05,.08,.32,.2),'#1b1c22',0,.02,.14);mesh(gun,rbox(.045,.12,.06,.2),'#14151a',0,-.06,.04);mesh(gun,rbox(.02,.02,.08),'#29e7ff',0,.065,.14,'hot');
  const blade=mesh(gun,rbox(.025,.06,1.05,.2),o.bladeCol||'#29e7ff',0,.02,.6,'hot');blade.visible=false;
  gun.visible=false;
  for(const g of[hips,torso,head,armL,elbowL,armR,elbowR,legL,kneeL,legR,kneeR])mergeChildren(g,humanClass,{s:HSTD,e:HEMI});
  return{root,body,hips,torso,head,skull,armL,armR,elbowL,elbowR,legL,legR,kneeL,kneeR,gun,blade,ph:Math.random()*6,swing:0,fall:0,flinch:0,fallDir:Math.random()<.5?-1:1};
}
function animHuman(h,speed,dt,mode){
  h.ph+=dt*(2.3+speed*1.5);
  const amp=Math.min(1,speed*.2),s=Math.sin(h.ph),c=Math.cos(h.ph),run=speed>5.2;
  if(mode==='drive'){h.legL.rotation.x=h.legR.rotation.x=-1.45;h.kneeL.rotation.x=h.kneeR.rotation.x=1.45;h.armL.rotation.x=h.armR.rotation.x=-1.05;h.elbowL.rotation.x=h.elbowR.rotation.x=-.55;return}
  const zm=mode==='zombie';
  h.legL.rotation.x=-s*amp*(zm?.6:.85);h.legR.rotation.x=s*amp*(zm?.75:.85);
  h.kneeL.rotation.x=.06+Math.max(0,c)*amp*(run?1.6:1.1);h.kneeR.rotation.x=.06+Math.max(0,-c)*amp*(run?1.6:1.1);
  h.hips.position.y=.9+Math.abs(c)*amp*.045-(run?.035:0);h.hips.rotation.y=s*amp*.1;
  let tx=run?.2:.03+Math.sin(h.ph*.2)*.01,ty=-s*amp*.18;
  if(zm){h.armL.rotation.set(-1.25+Math.sin(h.ph*.5)*.15,0,.12);h.armR.rotation.set(-1.15+Math.cos(h.ph*.5)*.15,0,-.12);h.elbowL.rotation.x=-.25;h.elbowR.rotation.x=-.35;tx=.28;h.head.rotation.z=Math.sin(h.ph*.3)*.3;h.head.rotation.x=.15}
  else if(mode==='aim'){h.armR.rotation.set(-1.48,0,-.08);h.elbowR.rotation.x=-.08;h.armL.rotation.set(-1.32,0,.62);h.elbowL.rotation.x=-.55;ty=.12;h.head.rotation.set(0,-.08,0)}
  else{h.armL.rotation.set(s*amp*.85,0,.06);h.armR.rotation.set(-s*amp*.85,0,-.06);const eb=-(.2+amp*(run?1.1:.5));h.elbowL.rotation.x=eb;h.elbowR.rotation.x=eb;h.head.rotation.set(0,0,0)}
  if(h.swing>0){h.swing-=dt;const t=1-h.swing/.35;h.armR.rotation.set(-2.5+t*2.6,0,-.7+t*1.3);h.elbowR.rotation.x=-.3;ty=.7-t*1.4}
  if(h.flinch>0){h.flinch=Math.max(0,h.flinch-dt*4);tx-=h.flinch*.5;h.head.rotation.x-=h.flinch*.6}
  h.torso.rotation.x=tx;h.torso.rotation.y=ty;
}
function animFall(h,dt){
  h.fall=Math.min(1,h.fall+dt*2.4);const e=1-Math.pow(1-h.fall,3);
  h.body.rotation.x=h.fallDir*e*Math.PI/2*1.02;h.body.position.y=-e*.12;
  h.armL.rotation.x=-1.4*e*h.fallDir;h.armR.rotation.x=-.6*e;h.armL.rotation.z=.8*e;h.armR.rotation.z=-1*e;
  h.kneeL.rotation.x=.9*e;h.kneeR.rotation.x=.3*e;h.legL.rotation.x=-.4*e;h.torso.rotation.x=0;
}
/* ---------- draw-call reduction: merge a group's static child meshes into vertex-coloured meshes ---------- */
const HSTD=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:.08});
const HEMI=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
const _mv=new THREE.Vector3(),_mn=new THREE.Matrix3();
function mergeGeos(list){
  let nv=0,ni=0;for(const m of list){const g=m.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count}
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),col=new Float32Array(nv*3),ix=new Uint32Array(ni);let vo=0,io=0;
  for(const m of list){m.updateMatrix();const g=m.geometry,Pa=g.attributes.position,Na=g.attributes.normal,c=m.material.color;_mn.getNormalMatrix(m.matrix);
    for(let i=0;i<Pa.count;i++){_mv.fromBufferAttribute(Pa,i).applyMatrix4(m.matrix);const o=(vo+i)*3;pos[o]=_mv.x;pos[o+1]=_mv.y;pos[o+2]=_mv.z;_mv.fromBufferAttribute(Na,i).applyMatrix3(_mn).normalize();nor[o]=_mv.x;nor[o+1]=_mv.y;nor[o+2]=_mv.z;col[o]=c.r;col[o+1]=c.g;col[o+2]=c.b}
    if(g.index)for(let i=0;i<g.index.count;i++)ix[io++]=g.index.getX(i)+vo;else for(let i=0;i<Pa.count;i++)ix[io++]=i+vo;vo+=Pa.count}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.setIndex(new THREE.BufferAttribute(ix,1));geo.computeBoundingSphere();return geo;
}
/* classify(mesh) -> key or null (null = leave alone); mats[key] = material for the merged mesh */
function mergeChildren(grp,classify,mats){
  const buckets={};for(const ch of[...grp.children]){if(!ch.isMesh||ch.userData.keep)continue;const k=classify(ch);if(!k)continue;(buckets[k]=buckets[k]||[]).push(ch)}
  for(const k in buckets){const L=buckets[k];if(L.length<2&&k!=='s')continue;const m=new THREE.Mesh(mergeGeos(L),mats[k]);grp.add(m);for(const c of L)grp.remove(c)}
}
const humanClass=ch=>ch.material.transparent?null:ch.material.isMeshBasicMaterial?'e':'s';
/* character looks */
const LOOKS={
  seojin:{skin:'#e6b89a',top:'#151722',top2:'#0b0b10',sleeve:'#10111a',glove:'#0b0b10',pants:'#11121a',hair:'#0b0b10',hairStyle:'bob',visor:'#29e7ff',shoes:'#0b0b10',glowStripe:'#29e7ff',pack:'#1a1c26',collar:'#10111a',bladeCol:'#29e7ff'},
  taeo:{skin:'#c48b68',top:'#4a2a1a',sleeve:'#4a2a1a',pants:'#1c1c24',hair:'#1a120e',hairStyle:'spiky',scarf:'#ffb347',shoes:'#5a3018',collar:'#3a2014'},
  mira:{skin:'#dfb096',top:'#1d1222',coat:'#2a1830',pants:'#16121c',hair:'#c9cad8',hairStyle:'bob',collar:'#ff2e88',glowStripe:'#ff2e88',shoes:'#16121c'},
  kang:{skin:'#c08c6a',top:'#5a4632',coat:'#6a5238',pants:'#2a241e',hair:'#a2a2ac',hairStyle:'short',shoes:'#3a2012',bulk:1.05},
  raider:()=>({skin:'#b98266',top:rpick(['#2a1a1a','#2a2a2a','#302018']),sleeve:rpick(['#3a1414','#2a2a2a']),vest:'#24241e',vest2:'#4a4030',pants:rpick(['#222','#2a2620','#1e2230']),hood:rpick(['#5a1010','#2a0c0c','#1a1a1a']),mask:'#aa1818',visor:'#ff2848',glove:'#1a1a1a',shoes:'#1a1410'}),
  survivor:()=>({skin:rpick(['#e0b090','#c89070','#d8a888']),top:rpick(['#4a5a6a','#6a5a4a','#3a4a3a','#5a3a4a']),pants:rpick(['#2a2a33','#3a3226']),hair:rpick(['#111','#3a2a1a','#666']),hairStyle:rpick(['short','bob','long']),pack:Math.random()<.5?'#3a3a2a':null}),
  zombie:(t)=>({skin:rpick(['#7d8f7f','#8a8f9a','#6f7f76','#8f8a78']),top:rpick(['#2a2c30','#3a2a2a','#2a3a3a','#44403a','#3a3050']),pants:rpick(['#22232a','#2a2620','#303040']),hair:rpick(['#111','#2a2018','#555',null]),hairStyle:rpick(['short','long','bob','bald']),
    eyes:t==='glow'?'#ff2e88':t==='runner'?'#ffb347':'#5dff9b',veins:t==='glow'?'#ff2e88':t==='brute'?'#5dff9b':Math.random()<.3?'#5dff9b':null,scale:t==='brute'?1.42:t==='runner'?.97:1,bulk:t==='brute'?1.35:t==='runner'?.85:1,shoes:'#18181c'}),
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
function actorsInit(scene){SCENE=scene;fxInit(scene);decalInit()}
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
  const L=LOOKS[id];const h=makeHuman(typeof L==='function'?L():L);h.root.position.set(x,0,z);h.root.rotation.y=yaw;SCENE.add(h.root);
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
    e.hp-=amt;e.hitT=.12;if(e.h){e.h.flinch=Math.min(1,e.h.flinch+.55+amt/90)}if(from&&e.kind!=='nest'){const dx=e.x-from.x,dz=e.z-from.z,d=Math.hypot(dx,dz)||1,kb=Math.min(.45,amt/120)*(e.type==='brute'?.3:1);moveEnt(e,dx/d*kb,dz/d*kb)}
    if(e.kind==='zombie'){e.state='chase';e.target=from||e.target;e.slow=Math.max(e.slow,.25)}
    if(e.kind==='raider'&&from)e.target=from;
    const col=e.kind==='zombie'?(e.type==='glow'?'#ff2e88':'#7dff9b'):e.kind==='nest'?'#ff2e88':'#ff3040';
    if(opts.point){burst(opts.point.x,opts.point.y,opts.point.z,opts.head?12:6,col,opts.head?7:4,.45,1);if(Math.random()<.5)decal(e.x+rnd(-.6,.6),e.z+rnd(-.6,.6),col,rnd(.5,1.1))}
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
  if(opts.head&&e.h&&e.kind!=='nest'){e.h.head.visible=false;const s=e.scale||1;burst(e.x,1.65*s,e.z,26,e.kind==='zombie'?(e.type==='glow'?'#ff2e88':'#7dff9b'):'#ff3040',6,.7,3)}
  if(e.h)decal(e.x,e.z,e.kind==='zombie'?(e.type==='glow'?'#ff2e88':'#4adf6b'):'#a01828',rnd(1.2,2));
  const r=Math.random();
  if(e.kind==='zombie'){if(r<.35)spawnPickup(e.x,e.z,'scrap',Math.ceil(rnd(2,5)*(e.type==='brute'?3:1)));else if(r<.45)spawnPickup(e.x,e.z,'ammo',1);else if(r<.5)spawnPickup(e.x,e.z,'med',1);if(e.type==='brute'||Math.random()<.04)spawnPickup(e.x+.8,e.z,'chip',1)}
  if(e.kind==='raider'){spawnPickup(e.x,e.z,r<.5?'ammo':'cash',r<.5?1:Math.floor(rnd(40,120)));if(Math.random()<.5)spawnPickup(e.x+.6,e.z+.3,'scrap',Math.ceil(rnd(3,6)));if(e.boss)spawnPickup(e.x-.6,e.z,'chip',2)}
  onKill&&onKill(e,from,opts);
}
let onKill=null;
/* ground decals: blood / ichor / scorch (ring buffer of instanced quads) */
const DEC={n:0,max:220,mesh:null};
function decalInit(){
  const tex=canvasTex(128,128,g=>{g.fillStyle='#fff';for(let i=0;i<14;i++){const a=Math.random()*6.28,d=Math.random()*38,r=8+Math.random()*22;g.globalAlpha=.6+Math.random()*.4;g.beginPath();g.ellipse(64+Math.cos(a)*d,64+Math.sin(a)*d,r,r*(.5+Math.random()*.5),a,0,7);g.fill()}
    for(let i=0;i<20;i++){g.globalAlpha=.8;g.beginPath();g.arc(64+(Math.random()-.5)*110,64+(Math.random()-.5)*110,1+Math.random()*4,0,7);g.fill()}});
  DEC.mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.85,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2}),DEC.max);
  DEC.mesh.count=0;DEC.mesh.renderOrder=2;SCENE.add(DEC.mesh);
}
const _dq=new THREE.Quaternion(),_dm=new THREE.Matrix4(),_dc=new THREE.Color();
function decal(x,z,col,size){if(!DEC.mesh)return;const i=DEC.n%DEC.max;DEC.n++;_dq.setFromEuler(new THREE.Euler(-Math.PI/2,0,Math.random()*6.28));_dm.compose(new THREE.Vector3(x,.04+(i%7)*.002,z),_dq,new THREE.Vector3(size,size,1));DEC.mesh.setMatrixAt(i,_dm);_dc.set(col).multiplyScalar(col==='#111111'?1:.75);DEC.mesh.setColorAt(i,_dc);DEC.mesh.count=Math.min(DEC.n,DEC.max);DEC.mesh.instanceMatrix.needsUpdate=true;if(DEC.mesh.instanceColor)DEC.mesh.instanceColor.needsUpdate=true}
