'use strict';
/* =========================================================================
   AI: zombies hunt by sight, sound and flow field; raiders hold camps and
   fight anyone (including zombies); allies follow and shoot; nests breed.
   ========================================================================= */
const flowPL=new Int16Array(MW*MH);let flowT=0,spawnT=0;
const _mz=new THREE.Vector3();
function playerTarget(){return PL.inCar?{x:PL.inCar.x,z:PL.inCar.z,r:PL.inCar.len/2,kind:'car',car:PL.inCar}:PL}
function aiUpdate(dt){
  hashAll();
  flowT-=dt;if(flowT<=0){flowT=.5;bfs(flowPL,Math.floor(PL.x/TILE),Math.floor(PL.z/TILE))}
  const pt=playerTarget();
  for(const z of ACT.zombies)updateZombie(z,dt,pt);
  ACT.zombies=ACT.zombies.filter(z=>{if(z.dead&&z.deadT>9){removeActor(z);return false}return true});
  for(const r of ACT.raiders)updateRaider(r,dt,pt);
  ACT.raiders=ACT.raiders.filter(r=>{if(r.dead&&r.deadT>14){removeActor(r);return false}return true});
  for(const a of ACT.allies)updateAlly(a,dt);
  for(const n of ACT.npcs){const d=Math.hypot(PL.x-n.x,PL.z-n.z);const want=d<7?Math.atan2(PL.x-n.x,PL.z-n.z):n.home.yaw;n.yaw+=angDiff(want,n.yaw)*Math.min(1,dt*4);n.h.root.rotation.y=n.yaw;animHuman(n.h,0,dt,'idle');n.h.head.rotation.x=Math.sin(GAME.t*.7+n.x)*.05}
  for(const n of ACT.nests)updateNest(n,dt);
  ACT.nests=ACT.nests.filter(n=>!n.dead);
  for(const p of ACT.pickups){p.t+=dt;p.life-=dt;p.m.rotation.y+=dt*2;p.m.position.y=.45+Math.sin(p.t*3)*.12;
    const o=PL.inCar||PL,d=Math.hypot(o.x-p.x,o.z-p.z);
    if(d<(PL.inCar?3.2:2.2)&&!PL.dead){collectPickup(p);p.life=0}}
  ACT.pickups=ACT.pickups.filter(p=>{if(p.life<=0){SCENE.remove(p.m);return false}return true});
  populate(dt);
}
function separation(a){neighbours(a.x,a.z,o=>{if(o===a||o.dead)return;const dx=a.x-o.x,dz=a.z-o.z,d=Math.hypot(dx,dz),m=a.r+o.r;if(d>0&&d<m){const p=(m-d)*.5;a.x+=dx/d*p;a.z+=dz/d*p}})}
function updateZombie(z,dt,pt){
  const h=z.h;
  if(z.dead){z.deadT+=dt;animFall(h,dt);if(z.deadT>6)h.root.position.y-=dt*.4;return}
  z.cd-=dt;z.slow=Math.max(0,z.slow-dt*.8);
  const inLight=typeof SH!=='undefined'&&SH.uvSlow(z.x,z.z);
  const pd=Math.hypot(pt.x-z.x,pt.z-z.z);
  let aggro=GAME.night?40:28;if(PL.noiseT>0)aggro=Math.max(aggro,PL.noiseR);
  let tg=null,td=1e9;
  if(!PL.dead&&!GAME.safe&&pd<aggro&&(pd<9||z.state==='chase'||losW(z.x,z.z,pt.x,pt.z))){tg=pt;td=pd}
  for(const r of ACT.raiders){if(r.dead)continue;const d=Math.hypot(r.x-z.x,r.z-z.z);if(d<16&&d<td){tg=r;td=d}}
  for(const a of ACT.allies){if(a.dead||a.riding)continue;const d=Math.hypot(a.x-z.x,a.z-z.z);if(d<14&&d<td){tg=a;td=d}}
  if(z.wave&&(!tg||td>14)){const c=SH.core;tg={x:c.x,z:c.z,r:1.5,kind:'core'};td=Math.hypot(c.x-z.x,c.z-z.z)}
  let spd=0;
  if(tg){
    z.state='chase';
    let aim=tg;
    if((tg===pt)&&td>6&&!losW(z.x,z.z,tg.x,tg.z))aim=flowStep(flowPL,z.x,z.z);
    const want=Math.atan2(aim.x-z.x,aim.z-z.z);z.yaw+=angDiff(want,z.yaw)*Math.min(1,dt*6);
    const reach=z.reach+(tg.r||.4);
    if(td>reach){
      spd=z.speed*(1-z.slow)*(inLight?.55:1)*(GAME.night?1.12:1);
      const hitP=moveEnt(z,Math.sin(z.yaw)*spd*dt,Math.cos(z.yaw)*spd*dt);
      if(hitP&&z.cd<=0){z.cd=1.1;h.swing=.35;hitP.hp-=z.dmg*1.4;SH.hitPiece(hitP);if(Math.random()<.3)sfx('thud',hitP.x,hitP.z)}
    }else if(z.cd<=0){
      z.cd=1.15;h.swing=.35;
      if(tg===pt){if(PL.inCar){PL.inCar.hp-=z.dmg*.5;camShake(.25);sfx('thud')}else hurtPlayer(z.dmg,'zombie',z)}
      else if(tg.kind==='core'){SH.hurtCore(z.dmg)}
      else damage(tg,z.dmg,z);
    }
  }else{
    z.state='wander';z.wt-=dt;if(z.wt<=0){z.wt=rnd(2,6);z.wy=Math.random()*6.28}
    z.yaw+=angDiff(z.wy||0,z.yaw)*Math.min(1,dt*2);spd=.55;moveEnt(z,Math.sin(z.yaw)*spd*dt,Math.cos(z.yaw)*spd*dt);
  }
  separation(z);
  // being run over is handled by vehicles.js
  z.groan-=dt;if(z.groan<=0){z.groan=rnd(4,11);if(pd<22)sfx('groan',z.x,z.z)}
  h.root.position.set(z.x,0,z.z);h.root.rotation.y=z.yaw;h.root.visible=pd<95;if(h.root.visible)animHuman(h,spd,dt,'zombie');
  if(z.type==='runner')h.torso.rotation.x=.45;
}
function raiderShoot(r,tg,d){
  r.h.root.updateMatrixWorld();r.h.gun.getWorldPosition(_mz);_mz.y+=.05;
  const isPl=tg===PL||tg.kind==='car';
  let hit;
  if(isPl){hit=Math.random()<clamp(.62-d/55-(PL.sprinting?.18:0)-(PL.inCar?.12:0)-(PL.cover?.2:0),.1,.7)}else hit=Math.random()<.7;
  const aim=new THREE.Vector3(tg.x,(tg.kind==='car'?.9:1.2*(tg.scale||1)),tg.z);
  if(!hit){aim.x+=rnd(-1.6,1.6);aim.y+=rnd(-.4,1.2);aim.z+=rnd(-1.6,1.6)}
  tracer(_mz,aim,r.boss?'#ffb347':'#ff5040');muzzle(_mz,'#ff9060');sfx('shot2',r.x,r.z);
  if(hit){if(isPl){if(PL.inCar){PL.inCar.hp-=6}else hurtPlayer(r.boss?16:9,'raider',r)}else damage(tg,26,r,{point:aim})}
  else if(isPl)sfx('whiz',aim.x,aim.z);
}
function updateRaider(r,dt,pt){
  const h=r.h;
  if(r.dead){r.deadT+=dt;animFall(h,dt);return}
  r.cd-=dt;r.ph+=dt;
  let tg=null,td=1e9;
  const pd=Math.hypot(pt.x-r.x,pt.z-r.z);
  if(!PL.dead&&!GAME.safe&&pd<(r.target===PL?44:30)&&losW(r.x,r.z,pt.x,pt.z)){tg=pt===PL?PL:pt;td=pd}
  for(const z of ACT.zombies){if(z.dead)continue;const d=Math.hypot(z.x-r.x,z.z-r.z);if(d<18&&d<td&&losW(r.x,r.z,z.x,z.z)){tg=z;td=d}}
  let spd=0,mode='idle';
  if(tg){
    r.state='combat';const want=Math.atan2(tg.x-r.x,tg.z-r.z);r.yaw+=angDiff(want,r.yaw)*Math.min(1,dt*7);
    const f=td>15?1:td<7?-1:0;const sx=Math.sin(r.yaw),sz=Math.cos(r.yaw);
    const mx=sx*f+sz*r.strafe*.7,mz=sz*f-sx*r.strafe*.7;
    if(Math.random()<dt*.4)r.strafe*=-1;
    spd=r.speed*.8;moveEnt(r,mx*spd*dt,mz*spd*dt);mode='aim';
    if(r.cd<=0&&td<46){r.cd=r.boss?rnd(.25,.45):rnd(.55,1.15);raiderShoot(r,tg,td)}
  }else{
    r.state='patrol';const hd=Math.hypot(r.home.x-r.x,r.home.z-r.z);
    if(hd>10||Math.random()<dt*.2)r.wy=hd>10?Math.atan2(r.home.x-r.x,r.home.z-r.z):Math.random()*6.28;
    r.yaw+=angDiff(r.wy||0,r.yaw)*Math.min(1,dt*2);
    if(Math.sin(r.ph*.4)>0){spd=1.2;moveEnt(r,Math.sin(r.yaw)*spd*dt,Math.cos(r.yaw)*spd*dt)}
  }
  separation(r);
  h.root.position.set(r.x,0,r.z);h.root.rotation.y=r.yaw;h.root.visible=pd<110;if(h.root.visible)animHuman(h,spd,dt,mode);
}
function updateAlly(a,dt){
  const h=a.h;
  if(a.dead){a.deadT=(a.deadT||0)+dt;animFall(h,dt);return}
  if(a.riding){h.root.visible=false;if(!PL.inCar){a.riding=false;h.root.visible=true;a.x=PL.x+1.5;a.z=PL.z}else{a.x=PL.inCar.x;a.z=PL.inCar.z}return}
  let spd=0,mode='idle';
  if(a.follow&&!PL.dead){
    if(PL.inCar&&Math.hypot(PL.inCar.x-a.x,PL.inCar.z-a.z)<6){a.riding=true;return}
    const tx=PL.x-Math.sin(PL.yaw)*2.2,tz=PL.z-Math.cos(PL.yaw)*2.2,d=Math.hypot(tx-a.x,tz-a.z);
    if(d>1.2){a.yaw+=angDiff(Math.atan2(tx-a.x,tz-a.z),a.yaw)*Math.min(1,dt*6);spd=d>6?5.5:3;
      if(d>8&&!losW(a.x,a.z,PL.x,PL.z)){const s=flowStep(flowPL,a.x,a.z);a.yaw=Math.atan2(s.x-a.x,s.z-a.z)}
      moveEnt(a,Math.sin(a.yaw)*spd*dt,Math.cos(a.yaw)*spd*dt)}
    if(d>60){a.x=PL.x+1;a.z=PL.z+1}
  }
  a.cd=(a.cd||1)-dt;
  let near=null,nd=15;for(const z of ACT.zombies){if(z.dead)continue;const d=Math.hypot(z.x-a.x,z.z-a.z);if(d<nd&&losW(a.x,a.z,z.x,z.z)){nd=d;near=z}}
  if(near&&a.armed!==false){mode='aim';a.yaw=Math.atan2(near.x-a.x,near.z-a.z);h.gun.visible=true;
    if(a.cd<=0){a.cd=rnd(.7,1.2);h.root.updateMatrixWorld();h.gun.getWorldPosition(_mz);const tp=new THREE.Vector3(near.x,1.2,near.z);tracer(_mz,tp,'#9fe8ff');muzzle(_mz,'#bfefff');sfx('shot',a.x,a.z);if(Math.random()<.65)damage(near,30,a,{point:tp})}}
  separation(a);
  h.root.position.set(a.x,0,a.z);h.root.rotation.y=a.yaw;animHuman(h,spd,dt,mode);
}
function updateNest(n,dt){
  n.core.scale.setScalar(1+Math.sin(GAME.t*4+n.x)*.12);n.shell.rotation.y+=dt*.3;
  if(Math.random()<dt*4)ember(n.x,1.4,n.z,'#ff2e88');
  const pd=Math.hypot(PL.x-n.x,PL.z-n.z);n.cd-=dt;
  if(pd<55&&n.cd<=0){n.cd=rnd(4,7);const near=ACT.zombies.filter(z=>!z.dead&&Math.hypot(z.x-n.x,z.z-n.z)<25).length;if(near<10){const a=Math.random()*6.28;spawnZombie(n.x+Math.cos(a)*3,n.z+Math.sin(a)*3,Math.random()<.35?'glow':'runner');burst(n.x,1.3,n.z,20,'#ff2e88',5,.6,2)}}
}
function randomSpot(minD,maxD,cx=PL.x,cz=PL.z){
  for(let k=0;k<25;k++){const a=Math.random()*6.28,d=rnd(minD,maxD),x=cx+Math.sin(a)*d,z=cz+Math.cos(a)*d;const t=tileW(x,z);if(t===ROAD||t===SIDE||t===PLAZA||t===ALLEY||t===GRASS)return{x,z}}
  return null;
}
function zombieType(){const r=Math.random(),zn=zoneOf(PL.x,PL.z)[0];
  if(zn==='서울숲')return r<.3?'glow':r<.55?'runner':r<.6?'brute':'walker';
  if(GAME.night)return r<.22?'runner':r<.3?'glow':r<.34?'brute':'walker';
  return r<.12?'runner':r<.16?'glow':r<.18?'brute':'walker'}
function populate(dt){
  spawnT-=dt;if(spawnT>0)return;spawnT=.35;
  const alive=ACT.zombies.filter(z=>!z.dead);
  const zn=zoneOf(PL.x,PL.z)[0];
  let want=(GAME.night?30:18)*GAME.diff;if(zn==='서울숲')want+=16;if(zn==='쉘터'&&!SH.waveOn)want=6;if(zn==='OMNI 타워')want+=10;
  if(GAME.calm)want=Math.min(want,4);
  if(alive.length<want){const s=randomSpot(48,80);if(s){const g=Math.random()<.3?3:1;for(let i=0;i<g;i++)spawnZombie(s.x+rnd(-2,2),s.z+rnd(-2,2),zombieType())}}
  for(const z of alive)if(!z.wave&&!z.mission&&Math.hypot(z.x-PL.x,z.z-PL.z)>125){z.dead=1;z.deadT=99}
}
function collectPickup(p){
  const I=GAME.inv;
  if(p.type==='scrap'){I.scrap+=p.amt;toast(`+${p.amt} 고철`,'#ff9a3a')}
  else if(p.type==='ammo'){for(const k in I.ammo)if(I.owned[k]&&WEAPONS[k].ammoPack)I.ammo[k]+=WEAPONS[k].ammoPack;toast('탄약 확보','#3dff9b')}
  else if(p.type==='med'){PL.hp=Math.min(100,PL.hp+35);toast('+35 체력','#ff4d5e')}
  else if(p.type==='cash'){GAME.money+=p.amt;toast(`+$${p.amt}`,'#7cffb2')}
  else if(p.type==='chip'){I.chips+=p.amt;toast(`+${p.amt} 테크 칩`,'#29e7ff')}
  sfx('pick');
}
