'use strict';
/* =========================================================================
   Vehicles: procedural car models, arcade physics (metres, seconds),
   abandoned/locked cars to steal, raider patrol trucks on lane AI.
   Forward = +Z in model space; yaw a → forward (sin a, cos a).
   ========================================================================= */
const VEH={cars:[]};
const VT={
  sedan:{ko:'세단',len:4.6,wid:1.9,h:1.42,maxF:34,acc:10,hp:100,cols:['#2b3a67','#6b2d5c','#1f5f5b','#c0c7d6','#3a3a48','#8a1c2b','#d9a441','#5b6275']},
  taxi:{ko:'택시',len:4.6,wid:1.9,h:1.45,maxF:33,acc:10,hp:100,cols:['#f08a24']},
  van:{ko:'밴',len:5.2,wid:2.1,h:2.1,maxF:28,acc:8,hp:140,cols:['#d8dbe6','#3c4a5c','#4a3b2b']},
  gt:{ko:'VOLT GT',len:4.5,wid:2.0,h:1.18,maxF:52,acc:17,hp:110,cols:['#29e7ff','#ff2e88']},
  omni:{ko:'OMNI 시큐리티',len:4.9,wid:2.05,h:1.7,maxF:40,acc:12,hp:160,cols:['#e8ecf5']},
  raider:{ko:'레이더 트럭',len:5.4,wid:2.25,h:1.9,maxF:32,acc:10,hp:230,cols:['#5a3a22','#3a3a30','#4a2a1a']},
  bus:{ko:'버스',len:11,wid:2.5,h:3.1,maxF:22,acc:5,hp:300,cols:['#1f9d55','#2a6fd6']},
};
const WHEEL_G=new THREE.CylinderGeometry(.36,.36,.28,12);WHEEL_G.rotateZ(Math.PI/2);
const CONE_G=(()=>{const g=new THREE.ConeGeometry(3.2,16,16,1,true);g.translate(0,-8,0);g.rotateX(-Math.PI/2);return g})();
let CONE_M=null;
function carModel(type,col){
  const t=VT[type],g=new THREE.Group(),L=t.len,Wd=t.wid,Hh=t.h;
  const body=new THREE.MeshStandardMaterial({color:col,roughness:.35,metalness:.55});
  const glass=new THREE.MeshStandardMaterial({color:'#0b1018',roughness:.1,metalness:.9,emissive:'#0a1a2a',emissiveIntensity:.4});
  const lower=new THREE.Mesh(BOXG,body);lower.scale.set(Wd,Hh*.45,L);lower.position.y=.35+Hh*.22;g.add(lower);
  const cabL=type==='bus'||type==='van'?L*.92:type==='gt'?L*.42:L*.52;
  const cab=new THREE.Mesh(BOXG,type==='bus'?body:glass);cab.scale.set(Wd*.9,Hh*.5,cabL);cab.position.set(0,.35+Hh*.66,type==='bus'||type==='van'?-L*.02:-L*.06);g.add(cab);
  if(type!=='bus'&&type!=='van'){const roof=new THREE.Mesh(BOXG,body);roof.scale.set(Wd*.86,.06,cabL*.8);roof.position.set(0,.35+Hh*.92,-L*.06);g.add(roof)}
  else{const win=new THREE.Mesh(BOXG,glass);win.scale.set(Wd*1.01,Hh*.22,L*.8);win.position.set(0,.35+Hh*.7,0);g.add(win)}
  const wheels=[];for(const[x,z]of[[-Wd/2,L*.32],[Wd/2,L*.32],[-Wd/2,-L*.32],[Wd/2,-L*.32]]){const w=new THREE.Mesh(WHEEL_G,mat('#0c0c10'));w.position.set(x,.36,z);g.add(w);wheels.push(w)}
  const hl=mat('#fff6d0','hot'),tl=mat('#ff2848','hot');
  for(const s of[-1,1]){const h=new THREE.Mesh(BOXG,hl);h.scale.set(.42,.14,.06);h.position.set(s*Wd*.34,.35+Hh*.3,L/2+.02);g.add(h);
    const b=new THREE.Mesh(BOXG,tl);b.scale.set(.46,.12,.06);b.position.set(s*Wd*.34,.35+Hh*.32,-L/2-.02);g.add(b)}
  if(type==='taxi'){const s=new THREE.Mesh(BOXG,mat('#ffe28a','hot'));s.scale.set(.6,.22,.3);s.position.set(0,.35+Hh+.08,-L*.06);g.add(s)}
  let bar=null;
  if(type==='omni'){bar=[new THREE.Mesh(BOXG,mat('#ff2e88','hot')),new THREE.Mesh(BOXG,mat('#29e7ff','hot'))];bar[0].scale.set(.5,.12,.2);bar[1].scale.set(.5,.12,.2);bar[0].position.set(-.3,.35+Hh+.08,-L*.06);bar[1].position.set(.3,.35+Hh+.08,-L*.06);g.add(bar[0],bar[1])}
  if(type==='raider'){const sp=mat('#8a8a90');for(let i=-2;i<=2;i++){const s=new THREE.Mesh(new THREE.ConeGeometry(.08,.5,4),sp);s.rotation.x=Math.PI/2;s.position.set(i*.4,.6,L/2+.25);g.add(s)}
    const cage=new THREE.Mesh(BOXG,mat('#2a2a2a'));cage.scale.set(Wd,.08,L*.4);cage.position.set(0,.35+Hh*.7,-L*.28);g.add(cage)}
  if(type==='gt'){const u=new THREE.Mesh(new THREE.PlaneGeometry(Wd*1.1,L*.9),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(1.5),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));u.rotation.x=-Math.PI/2;u.position.y=.06;g.add(u)}
  if(!CONE_M)CONE_M=new THREE.MeshBasicMaterial({color:'#fff1c8',transparent:true,opacity:.02,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const cones=[];for(const s of[-1,1]){const c=new THREE.Mesh(CONE_G,CONE_M);c.position.set(s*Wd*.34,.35+Hh*.3,L/2);c.rotation.x=.08;c.visible=false;g.add(c);cones.push(c)}
  return{g,body,glass,wheels,cones,bar};
}
function makeCar(type,x,z,yaw,o={}){
  const t=VT[type],col=o.col||rpick(t.cols),m=carModel(type,col);
  m.g.position.set(x,0,z);m.g.rotation.y=yaw;SCENE.add(m.g);
  const c={kind:'car',type,x,z,yaw,vx:0,vz:0,len:t.len,wid:t.wid,maxF:t.maxF,acc:t.acc,hp:o.hp||t.hp,maxHp:t.hp,m,col,locked:!!o.locked,wreck:!!o.wreck,driver:o.driver||null,ai:null,burn:0,alarm:0,stun:0,
    mission:o.mission||null,keep:!!o.keep,lights:!!o.lights,steer:0};
  if(c.wreck)burnLook(c);
  VEH.cars.push(c);return c;
}
function burnLook(c){c.m.body.color.set('#1a1512');c.m.body.roughness=.95;c.m.body.metalness=.1;c.m.glass.color.set('#050505');c.m.glass.emissiveIntensity=0;for(const k of c.m.g.children)if(k.material&&k.material.toneMapped===false)k.visible=false}
function carCorners(c,x,z,yaw){const s=Math.sin(yaw),co=Math.cos(yaw),L=c.len/2-.1,Wd=c.wid/2-.1,out=[];
  for(const[l,w]of[[L,Wd],[L,-Wd],[-L,Wd],[-L,-Wd],[L,0],[-L,0],[0,Wd],[0,-Wd]])out.push([x+s*l+co*w,z+co*l-s*w]);return out}
function carBlocked(c,x,z,yaw){
  for(const[px,pz]of carCorners(c,x,z,yaw)){if(px<0||pz<0||px>WX||pz>WZ||solidW(px,pz))return true;
    if(typeof SH!=='undefined')for(const p of SH.pieces){if(!p.block)continue;if(Math.abs(px-p.x)>6||Math.abs(pz-p.z)>6)continue;const s=Math.sin(p.rot),cc=Math.cos(p.rot),dx=px-p.x,dz=pz-p.z,lf=dx*s+dz*cc,lr=dx*cc-dz*s;if(Math.abs(lr)<p.hw&&Math.abs(lf)<p.hd){p.hp-=Math.hypot(c.vx,c.vz)*.6;SH.hitPiece(p);return true}}}
  return false;
}
function moveCar(c,dt){
  const dx=c.vx*dt,dz=c.vz*dt;let imp=0;
  if(!carBlocked(c,c.x+dx,c.z,c.yaw))c.x+=dx;else{imp=Math.max(imp,Math.abs(c.vx));c.vx*=-.25}
  if(!carBlocked(c,c.x,c.z+dz,c.yaw))c.z+=dz;else{imp=Math.max(imp,Math.abs(c.vz));c.vz*=-.25}
  if(imp>7){c.hp-=(imp-7)*1.6;burst(c.x+Math.sin(c.yaw)*c.len/2,.8,c.z+Math.cos(c.yaw)*c.len/2,10,'#ffcf6b',6,.4,2);if(c===PL.inCar){camShake(Math.min(1.2,imp/18));sfx('crash')}}
}
function carPhys(c,thr,steer,hb,dt,nitro){
  const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw);
  let vf=c.vx*fx+c.vz*fz,vl=c.vx*fz-c.vz*fx;
  if(c.stun>0){thr=0;steer*=.3}
  const perk=c===PL.inCar&&GAME.inv.perks.engine?1.15:1;
  if(thr>0)vf+=(vf<0?28:c.acc*perk)*thr*dt;else if(thr<0)vf+=(vf>0?-30:-12)*(-thr)*dt;
  const tt=tileW(c.x,c.z);let maxF=c.maxF*perk*(tt===GRASS?.6:1)*(c.hp<30?.7:1);
  if(nitro){maxF*=1.35;vf+=16*dt}
  vf=clamp(vf,-10,maxF);vf*=1-(thr===0?.35:.08)*dt;if(tt===GRASS)vf*=1-.6*dt;if(hb)vf*=1-1.2*dt;
  vl*=Math.max(0,1-(hb?1.4:8.5)*dt);
  c.steer=lerp(c.steer,steer,Math.min(1,dt*8));
  const ny=c.yaw-(hb?2.6:1.9)*c.steer*clamp(vf/7,-1,1)*dt;
  if(!carBlocked(c,c.x,c.z,ny))c.yaw=ny;
  const nfx=Math.sin(c.yaw),nfz=Math.cos(c.yaw);
  c.vx=nfx*vf+nfz*vl;c.vz=nfz*vf-nfx*vl;
  c.drift=Math.abs(vl);
  moveCar(c,dt);
  return vf;
}
function driveTo(c,tx,tz,vmax,dt){
  const want=Math.atan2(tx-c.x,tz-c.z),da=angDiff(want,c.yaw),sp=Math.hypot(c.vx,c.vz);
  let steer=clamp(-da*2.2,-1,1),thr=sp<vmax?1:0;if(Math.abs(da)>1.4&&sp>9)thr=-.6;
  if(c.rev>0){c.rev-=dt;thr=-1;steer=-steer}else{if(sp<1.2)c.stuck=(c.stuck||0)+dt;else c.stuck=0;if(c.stuck>1.2){c.rev=1;c.stuck=0}}
  carPhys(c,thr,steer,false,dt);
}
/* lane AI (port of the 2D traffic logic) for raider patrols */
function laneInit(c){const r=rpick(ROADS.filter(q=>(q.hz?q.h:q.w)>=3));const d=r.hz?rpick([0,2]):rpick([1,3]);c.road=r;c.dir=d;c.cr=null;const along=(r.hz?rnd(r.x+2,r.x+r.w-2):rnd(r.y+2,r.y+r.h-2))*TILE;if(r.hz){c.x=along;c.z=laneW(r,d)}else{c.z=along;c.x=laneW(r,d)}c.yaw=DYAW[d];c.spd=0}
function laneUpdate(c,dt){
  const r=c.road,d=c.dir,hz=r.hz,sg=(d===0||d===1)?1:-1;
  let target=c.cruise||11;
  const ax=c.x+DXS[d]*(c.len/2+4),az=c.z+DZS[d]*(c.len/2+4);
  for(const o of VEH.cars){if(o===c)continue;if(Math.abs(o.x-ax)<2.6&&Math.abs(o.z-az)<2.6){target=0;break}}
  c.spd+=clamp(target-c.spd,-18*dt,6*dt);
  c.x+=DXS[d]*c.spd*dt;c.z+=DZS[d]*c.spd*dt;
  const s=hz?c.x:c.z;
  if(!c.cr){
    let best=null,bd=1e9;
    for(const X of r.cross){const entry=hz?(sg>0?X.x*TILE:(X.x+X.w)*TILE):(sg>0?X.y*TILE:(X.y+X.h)*TILE);const dd=(entry-s)*sg;if(dd>-.3&&dd<bd){bd=dd;best=X}}
    if(best){const X=best,opts=[];
      if(hz){if(sg>0?r.x+r.w>X.x+X.w+1:r.x<X.x-1)opts.push(-1,-1);if(X.y+X.h>r.y+r.h+1)opts.push(1);if(X.y<r.y-1)opts.push(3)}
      else{if(sg>0?r.y+r.h>X.y+X.h+1:r.y<X.y-1)opts.push(-1,-1);if(X.x+X.w>r.x+r.w+1)opts.push(0);if(X.x<r.x-1)opts.push(2)}
      const ch=opts.length?rpick(opts):-1;
      c.cr=ch<0?{X,ch:-1,at:hz?(sg>0?(X.x+X.w)*TILE:X.x*TILE):(sg>0?(X.y+X.h)*TILE:X.y*TILE)}:{X,ch,at:laneW(X,ch)};
    }else{const end=sg>0?(hz?(r.x+r.w)*TILE:(r.y+r.h)*TILE):(hz?r.x*TILE:r.y*TILE);if((end-s)*sg<3.5){c.dir=(d+2)%4;if(hz)c.z=laneW(r,c.dir);else c.x=laneW(r,c.dir)}}
  }else if((s-c.cr.at)*sg>=0){
    if(c.cr.ch<0)c.cr=null;else{const X=c.cr.X,nd=c.cr.ch;if(hz)c.x=c.cr.at;else c.z=c.cr.at;c.road=X;c.dir=nd;if(X.hz)c.z=laneW(X,nd);else c.x=laneW(X,nd);c.cr=null}
  }
  c.yaw+=angDiff(DYAW[c.dir],c.yaw)*Math.min(1,dt*8);
  c.vx=DXS[c.dir]*c.spd;c.vz=DZS[c.dir]*c.spd;
}
function explodeCar(c){
  c.wreck=true;c.burn=25;c.hp=0;c.vx*=.2;c.vz*=.2;burnLook(c);
  burst(c.x,1.2,c.z,80,'#ffb347',12,1,5);burst(c.x,1.2,c.z,40,'#ff5b2e',8,1.2,6);sfx('boom',c.x,c.z);
  const d=Math.hypot(PL.x-c.x,PL.z-c.z);if(d<25)camShake(1.4*(1-d/25));
  for(const z of ACT.zombies)if(!z.dead&&Math.hypot(z.x-c.x,z.z-c.z)<6)damage(z,200,PL);
  for(const r of ACT.raiders)if(!r.dead&&Math.hypot(r.x-c.x,r.z-c.z)<6)damage(r,120,PL);
  if(PL.inCar===c){exitCar(true);hurtPlayer(35,'explode')}else if(!PL.inCar&&d<6)hurtPlayer(40,'explode');
  PL.noiseT=6;PL.noiseR=80;
}
function vehUpdate(dt){
  for(const c of VEH.cars){
    if(c.wreck){if(c.burn>0){c.burn-=dt;if(Math.random()<.5)ember(c.x+rnd(-1,1),1.2,c.z+rnd(-1,1),rpick(['#ff7a2e','#ffb347']));if(Math.random()<.2)puff(c.x,1.5,c.z)}c.vx*=1-3*dt;c.vz*=1-3*dt;moveCar(c,dt);syncCar(c,dt);continue}
    if(c.stun>0)c.stun-=dt;
    if(c===PL.inCar){/* driven in main.js */}
    else if(c.ai==='lane')laneUpdate(c,dt);
    else if(c.ai==='chase'&&c.target)driveTo(c,c.target.x,c.target.z,c.maxF*.8,dt);
    else{c.vx*=1-3*dt;c.vz*=1-3*dt;if(Math.abs(c.vx)+Math.abs(c.vz)>.05)moveCar(c,dt)}
    if(c.alarm>0){c.alarm-=dt;if(Math.floor(c.alarm*4)%2)for(const k of c.m.cones)k.visible=true}
    // run-over
    const sp=Math.hypot(c.vx,c.vz);
    if(sp>4.5){const s=Math.sin(c.yaw),co=Math.cos(c.yaw);
      const hitTest=e=>{const dx=e.x-c.x,dz=e.z-c.z;if(Math.abs(dx)>6||Math.abs(dz)>6)return false;const lf=dx*s+dz*co,lr=dx*co-dz*s;return Math.abs(lf)<c.len/2+e.r&&Math.abs(lr)<c.wid/2+e.r};
      for(const z of ACT.zombies){if(z.dead||!hitTest(z))continue;damage(z,sp*14,c===PL.inCar?PL:null,{point:new THREE.Vector3(z.x,1,z.z)});burst(z.x,1,z.z,14,'#7dff9b',sp*.6,.6,3);c.hp-=z.type==='brute'?14:2.5;if(c===PL.inCar){camShake(.2);sfx('splat')}
        if(z.dead){z.h.body.rotation.z=rnd(-1,1)}else{z.x+=c.vx*.08;z.z+=c.vz*.08}}
      for(const r of ACT.raiders){if(r.dead||!hitTest(r))continue;damage(r,sp*9,c===PL.inCar?PL:null,{point:new THREE.Vector3(r.x,1,r.z)});c.hp-=3;if(c===PL.inCar)sfx('splat')}
      if(!PL.inCar&&!PL.dead&&hitTest(PL)&&c!==PL.inCar&&sp>6){hurtPlayer(sp*1.6,'car');PL.x+=c.vx*.1;PL.z+=c.vz*.1}
    }
    if(c.hp<=0&&!c.wreck)explodeCar(c);
    else if(c.hp<30&&Math.random()<.15)puff(c.x+Math.sin(c.yaw)*c.len*.4,1.2,c.z+Math.cos(c.yaw)*c.len*.4);
    syncCar(c,dt);
  }
  // car-car collisions (pairs near the player)
  const near=VEH.cars.filter(c=>Math.abs(c.x-PL.x)<120&&Math.abs(c.z-PL.z)<120);
  for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){const a=near[i],b=near[j];const lim=(a.len+b.len)/2;if(Math.abs(a.x-b.x)>lim||Math.abs(a.z-b.z)>lim)continue;
    const ca=[[a.x+Math.sin(a.yaw)*a.len*.27,a.z+Math.cos(a.yaw)*a.len*.27],[a.x-Math.sin(a.yaw)*a.len*.27,a.z-Math.cos(a.yaw)*a.len*.27]],cb=[[b.x+Math.sin(b.yaw)*b.len*.27,b.z+Math.cos(b.yaw)*b.len*.27],[b.x-Math.sin(b.yaw)*b.len*.27,b.z-Math.cos(b.yaw)*b.len*.27]];
    const R=(a.wid+b.wid)*.55;let best=0,nx=0,nz=0;for(const p of ca)for(const q of cb){const dx=q[0]-p[0],dz=q[1]-p[1],d=Math.hypot(dx,dz)||.01,pen=R-d;if(pen>best){best=pen;nx=dx/d;nz=dz/d}}
    if(best<=0)continue;a.x-=nx*best/2;a.z-=nz*best/2;b.x+=nx*best/2;b.z+=nz*best/2;
    const imp=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;if(imp>0){const j2=imp*.6;a.vx-=nx*j2;a.vz-=nz*j2;b.vx+=nx*j2;b.vz+=nz*j2;if(imp>4){a.hp-=imp*.8;b.hp-=imp*.8;burst((a.x+b.x)/2,.9,(a.z+b.z)/2,12,'#ffcf6b',6,.4,2);if(a===PL.inCar||b===PL.inCar){camShake(Math.min(1,imp/15));sfx('crash')}}}}
}
function syncCar(c,dt){
  c.m.g.position.set(c.x,0,c.z);c.m.g.rotation.y=c.yaw;c.m.g.visible=Math.abs(c.x-camera.position.x)<150&&Math.abs(c.z-camera.position.z)<150;if(!c.m.g.visible)return;
  const sp=c.vx*Math.sin(c.yaw)+c.vz*Math.cos(c.yaw);for(const w of c.m.wheels)w.rotation.x+=sp*dt/.36;
  c.m.wheels[0].rotation.y=c.m.wheels[1].rotation.y=-c.steer*.45;
  const lit=!c.wreck&&(c===PL.inCar||c.ai||c.lights);for(const k of c.m.cones)k.visible=lit||(c.alarm>0&&Math.floor(c.alarm*4)%2===1);
  if(c.m.bar){const f=Math.floor(GAME.t*6)%2;c.m.bar[0].visible=!!f;c.m.bar[1].visible=!f}
}
function spawnCity(){
  // abandoned cars on the roads — the aftermath of the evacuation
  for(let i=0;i<95;i++){
    const r=rpick(ROADS),d=r.hz?rpick([0,2]):rpick([1,3]);
    const along=(r.hz?rnd(r.x+1,r.x+r.w-1):rnd(r.y+1,r.y+r.h-1))*TILE;
    let x=r.hz?along:laneW(r,d),z=r.hz?laneW(r,d):along;
    if(VEH.cars.some(c=>Math.hypot(c.x-x,c.z-z)<7))continue;
    const roll=Math.random(),type=roll<.08?'bus':roll<.2?'taxi':roll<.3?'van':roll<.36?'omni':'sedan';
    const wreck=Math.random()<(type==='bus'?.8:.28);
    const c=makeCar(type,x,z,DYAW[d]+rnd(-.5,.5)*(Math.random()<.4?1:.1),{wreck,locked:!wreck&&Math.random()<.55});
    if(!carBlocked(c,c.x,c.z,c.yaw))continue;c.yaw=DYAW[d];
  }
  // raider patrols
  for(let i=0;i<3;i++){const c=makeCar('raider',0,0,0,{});laneInit(c);c.ai='lane';c.cruise=rnd(9,13);c.crew=2;c.raider=true}
}
