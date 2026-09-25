'use strict';
/* =========================================================================
   Shelter: the Black Roastery yard. Build barricades, traps, turrets,
   UV lights, generators, a bed and a workbench; defend the core from
   Blood Rain waves.
   ========================================================================= */
const PIECES={
  wall:{ko:'바리케이드',en:'Barricade',cost:{scrap:10},hw:2,hd:.35,hp:260,block:true,desc:'좀비를 막는 벽. 부서지면 다시 지어야 한다.'},
  spikes:{ko:'스파이크 트랩',en:'Spike trap',cost:{scrap:8},hw:2,hd:.7,hp:160,block:false,desc:'밟은 좀비에게 지속 피해와 감속.'},
  turret:{ko:'자동 터렛',en:'Auto turret',cost:{scrap:40,chips:2},hw:.6,hd:.6,hp:200,block:true,power:true,desc:'24m 안의 좀비를 자동 사격. 발전기 필요.'},
  light:{ko:'UV 조명탑',en:'UV light',cost:{scrap:15},hw:.4,hd:.4,hp:120,block:true,power:true,desc:'반경 10m의 감염체를 45% 감속. 발전기 필요.'},
  gen:{ko:'발전기',en:'Generator',cost:{scrap:30},hw:.9,hd:.7,hp:240,block:true,max:2,desc:'터렛과 조명에 전력을 공급한다.'},
  bed:{ko:'침대',en:'Bed',cost:{scrap:20},hw:.7,hd:1.1,hp:90,block:true,max:1,desc:'잠자기: 체력 회복, 저장, 6시간 경과.'},
  bench:{ko:'작업대',en:'Workbench',cost:{scrap:35},hw:1.1,hd:.55,hp:140,block:true,max:1,desc:'무기 제작·강화, 탄약 제작.'},
};
const PIECE_KEYS=Object.keys(PIECES);
const SH={pieces:[],core:{x:0,z:0},coreHp:1000,coreMax:1000,zone:{x:0,z:0,r:36},waveOn:false,wave:0,waveLeft:0,waveSpawn:0,ghost:null,sel:0,rot:0,building:false,lastNightWave:-1,powered:false,
  uvSlow(x,z){if(!this.powered)return false;for(const p of this.pieces)if(p.type==='light'&&Math.abs(p.x-x)<10&&Math.abs(p.z-z)<10&&Math.hypot(p.x-x,p.z-z)<10)return true;return false},
  hitPiece(p){if(p.hp<=0&&!p.gone){p.gone=true;burst(p.x,1,p.z,30,'#ffb347',6,.7,3);sfx('crash',p.x,p.z);SCENE.remove(p.g);this.pieces=this.pieces.filter(q=>q!==p);this.recalc();toast(`${PIECES[p.type].ko} 파괴됨`,'#ff4d5e')}},
  hurtCore(d){this.coreHp-=d;if(Math.random()<.2)sfx('thud',this.core.x,this.core.z);if(this.coreHp<=0)waveFail()},
  recalc(){this.powered=this.pieces.some(p=>p.type==='gen')},
};
function pieceMesh(type){
  const g=new THREE.Group();const b=(col,sx,sy,sz,x,y,z,emi)=>part(g,col,sx,sy,sz,x,y,z,emi);
  if(type==='wall'){b('#3a3a42',4,1.1,.7,0,.55,0);b('#6a4a2a',3.9,1.3,.1,0,1.75,0);b('#ffb347',3.9,.08,.12,0,1.1,.01,'hot');for(let i=-1.5;i<=1.5;i+=1)b('#2a2a30',.1,1.5,.14,i,1.8,.05)}
  else if(type==='spikes'){b('#3a2a1a',4,.12,1.3,0,.06,0);for(let i=0;i<14;i++){const s=new THREE.Mesh(new THREE.ConeGeometry(.09,.6,4),mat('#9a9aa4'));s.position.set(-1.8+(i%7)*.6,.4,i<7?-.3:.3);g.add(s)}}
  else if(type==='turret'){b('#2a2d38',1.1,.8,1.1,0,.4,0);const head=new THREE.Group();head.position.y=1.1;g.add(head);part(head,'#1c1e26',.8,.45,.8,0,0,0);part(head,'#111',.12,.12,1.1,-.15,0,.6);part(head,'#111',.12,.12,1.1,.15,0,.6);part(head,'#29e7ff',.3,.08,.05,0,.1,.41,'hot');g.userData.head=head}
  else if(type==='light'){b('#22242e',.3,5,.3,0,2.5,0);b('#b36bff',.9,.3,.9,0,5.1,0,'hot');const d=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshBasicMaterial({map:radialTex('rgba(179,107,255,.55)','rgba(0,0,0,0)'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));d.rotation.x=-Math.PI/2;d.position.y=.08;g.add(d);g.userData.glow=d}
  else if(type==='gen'){b('#6a6a2a',1.8,1.1,1.3,0,.55,0);b('#222',.2,.8,.2,.6,1.4,.3);b('#3dff9b',.5,.2,.05,-.3,.8,.66,'hot');b('#1a1a1a',1.9,.1,1.4,0,1.12,0)}
  else if(type==='bed'){b('#3a2a1a',1.4,.4,2.2,0,.2,0);b('#5a6a8a',1.3,.2,2,0,.5,0);b('#d0d0d8',1,.15,.5,0,.65,-.75)}
  else if(type==='bench'){b('#4a3a2a',2.2,.12,1.1,0,1,0);for(const[x,z]of[[-1,-.45],[1,-.45],[-1,.45],[1,.45]])b('#2a2a2a',.1,1,.1,x,.5,z);b('#1a1a22',.8,.5,.06,.5,1.35,-.4);b('#29e7ff',.7,.4,.02,.5,1.35,-.36,'hot');b('#888',.5,.1,.2,-.6,1.1,.1)}
  return g;
}
const GHOST_OK=new THREE.MeshBasicMaterial({color:'#3dff9b',transparent:true,opacity:.35,depthWrite:false});
const GHOST_BAD=new THREE.MeshBasicMaterial({color:'#ff4d5e',transparent:true,opacity:.35,depthWrite:false});
function addPiece(type,x,z,rot,hp){
  const d=PIECES[type],g=pieceMesh(type);g.position.set(x,0,z);g.rotation.y=rot;SCENE.add(g);
  const p={type,x,z,rot,hp:hp||d.hp,maxHp:d.hp,hw:d.hw,hd:d.hd,block:d.block,g,cd:0};SH.pieces.push(p);SH.recalc();return p;
}
function shelterInit(){
  SH.core={x:LOC.shelterCore.x,z:LOC.shelterCore.z};SH.zone={x:LOC.shelter.x,z:LOC.shelter.z+1,r:36};
  // roll-up door with glowing frame, string lights and the fixer counter
  const door=new THREE.Group();part(door,'#2a2a30',7,4.2,.2,0,2.1,0);part(door,'#ff2e88',7.3,.12,.25,0,4.3,0,'hot');part(door,'#ff2e88',.12,4.3,.25,-3.65,2.15,0,'hot');part(door,'#ff2e88',.12,4.3,.25,3.65,2.15,0,'hot');
  for(let y=.5;y<4;y+=.35)part(door,'#1c1c22',6.9,.04,.24,0,y,0);
  door.position.set(SH.core.x,0,61*TILE-.1);SCENE.add(door);
  const counter=new THREE.Group();part(counter,'#3a2418',3,1.05,.8,0,.52,0);part(counter,'#ff2e88',3,.05,.82,0,1.06,0,'hot');part(counter,'#dcd4c8',.3,.35,.3,.8,1.25,0);counter.position.set(LOC.shelter.x-9,0,LOC.shelter.z+2.4);SCENE.add(counter);
  const bulbs=[];const x0=47*TILE+1,x1=61*TILE-1,zA=55*TILE+1,zB=60.6*TILE;
  for(let k=0;k<5;k++){const z=lerp(zA,zB,k/4);for(let i=0;i<=24;i++){const t=i/24;bulbs.push([lerp(x0,x1,t),4.2-Math.sin(t*Math.PI)*.8,z])}}
  const bm=new THREE.InstancedMesh(new THREE.SphereGeometry(.07,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color('#ffcf8a').multiplyScalar(2.2),toneMapped:false}),bulbs.length);
  const M=new THREE.Matrix4();bulbs.forEach((b,i)=>{M.makeTranslation(b[0],b[1],b[2]);bm.setMatrixAt(i,M)});SCENE.add(bm);
  const warm=new THREE.PointLight('#ffb070',1.4,34,2);warm.position.set(LOC.shelter.x,5,LOC.shelter.z);SCENE.add(warm);
  const tarp=new THREE.Mesh(new THREE.PlaneGeometry(14,8),new THREE.MeshStandardMaterial({color:'#2a3a4a',side:THREE.DoubleSide,roughness:.9}));tarp.rotation.x=-Math.PI/2+.12;tarp.position.set(LOC.shelter.x-8,4.6,LOC.shelter.z+1);SCENE.add(tarp);
}
function ghostUpdate(){
  const type=PIECE_KEYS[SH.sel],def=PIECES[type];
  if(!SH.ghost||SH.ghost.userData.type!==type){if(SH.ghost)SCENE.remove(SH.ghost);SH.ghost=pieceMesh(type);SH.ghost.userData.type=type;SCENE.add(SH.ghost)}
  const aim=groundAim();if(!aim)return false;
  const grid=type==='wall'||type==='spikes'?2:1;
  let x=Math.round(aim.x/grid)*grid,z=Math.round(aim.z/grid)*grid;
  SH.ghost.position.set(x,0,z);SH.ghost.rotation.y=SH.rot;
  const why=placeError(type,x,z,SH.rot);
  SH.ghost.traverse(o=>{if(o.isMesh)o.material=why?GHOST_BAD:GHOST_OK});
  SH.gx=x;SH.gz=z;SH.why=why;
  return true;
}
function placeError(type,x,z,rot){
  const d=PIECES[type];
  if(Math.hypot(x-SH.zone.x,z-SH.zone.z)>SH.zone.r)return '쉘터 구역 밖';
  const s=Math.sin(rot),c=Math.cos(rot);
  for(const[l,w]of[[d.hd,d.hw],[d.hd,-d.hw],[-d.hd,d.hw],[-d.hd,-d.hw],[0,0]]){if(solidW(x+s*l+c*w,z+c*l-s*w))return '건물과 겹침'}
  for(const p of SH.pieces){const R1=Math.max(p.hw,p.hd),R2=Math.max(d.hw,d.hd);if(Math.hypot(p.x-x,p.z-z)<Math.min(R1,R2)+.5)return '다른 구조물과 겹침'}
  if(Math.hypot(PL.x-x,PL.z-z)<Math.max(d.hw,d.hd)*.7)return '플레이어 위치';
  if(d.max&&SH.pieces.filter(p=>p.type===type).length>=d.max)return `최대 ${d.max}개`;
  for(const k in d.cost){const have=k==='scrap'?GAME.inv.scrap:GAME.inv.chips;if(have<d.cost[k])return k==='scrap'?'고철 부족':'테크 칩 부족'}
  return null;
}
function placePiece(){
  const type=PIECE_KEYS[SH.sel];if(SH.why){toast(SH.why,'#ff4d5e');sfx('deny');return}
  const d=PIECES[type];GAME.inv.scrap-=d.cost.scrap||0;GAME.inv.chips-=d.cost.chips||0;
  addPiece(type,SH.gx,SH.gz,SH.rot);burst(SH.gx,.5,SH.gz,20,'#ffb347',4,.5,2);sfx('build');GAME.onBuild&&GAME.onBuild(type);saveGame();
}
function setBuildMode(on){SH.building=on;if(!on&&SH.ghost){SCENE.remove(SH.ghost);SH.ghost=null}$('buildBar').hidden=!on;renderBuildBar()}
function renderBuildBar(){
  if(!SH.building)return;
  $('buildList').innerHTML=PIECE_KEYS.map((k,i)=>{const d=PIECES[k],c=d.cost;return`<button class="bitem${i===SH.sel?' on':''}" data-i="${i}"><b>${i+1}. ${d.ko}</b><small>${c.scrap||0} 고철${c.chips?` · ${c.chips} 칩`:''}</small></button>`}).join('');
  $('buildList').querySelectorAll('.bitem').forEach(b=>b.onclick=e=>{e.stopPropagation();SH.sel=+b.dataset.i;renderBuildBar()});
  $('buildDesc').textContent=PIECES[PIECE_KEYS[SH.sel]].desc;
}
function shelterUpdate(dt){
  SH.recalc();
  for(const p of SH.pieces){
    if(p.type==='turret'&&SH.powered){p.cd-=dt;let best=null,bd=24;for(const z of ACT.zombies){if(z.dead)continue;const d=Math.hypot(z.x-p.x,z.z-p.z);if(d<bd){bd=d;best=z}}
      const head=p.g.userData.head;if(best){const want=Math.atan2(best.x-p.x,best.z-p.z)-p.rot;head.rotation.y+=angDiff(want,head.rotation.y)*Math.min(1,dt*8);
        if(p.cd<=0&&Math.abs(angDiff(want,head.rotation.y))<.3){p.cd=.22;const from=new THREE.Vector3(p.x+Math.sin(want+p.rot)*.9,1.15,p.z+Math.cos(want+p.rot)*.9),to=new THREE.Vector3(best.x,1.1,best.z);tracer(from,to,'#29e7ff');burst(from.x,from.y,from.z,3,'#29e7ff',2,.08,0);damage(best,16,null,{point:to});if(Math.random()<.4)sfx('turret',p.x,p.z)}}}
    if(p.type==='spikes'){for(const z of ACT.zombies){if(z.dead)continue;const s=Math.sin(p.rot),c=Math.cos(p.rot),dx=z.x-p.x,dz=z.z-p.z,lf=dx*s+dz*c,lr=dx*c-dz*s;if(Math.abs(lr)<p.hw&&Math.abs(lf)<p.hd+.3){damage(z,30*dt,null);z.slow=Math.max(z.slow,.5);p.hp-=4*dt;if(Math.random()<dt*3)burst(z.x,.5,z.z,3,'#7dff9b',3,.3,1)}}if(p.hp<=0)SH.hitPiece(p)}
    if(p.type==='light'&&p.g.userData.glow)p.g.userData.glow.visible=SH.powered;
  }
  // waves
  if(SH.waveOn){
    SH.waveSpawn-=dt;
    if(SH.waveLeft>0&&SH.waveSpawn<=0){SH.waveSpawn=rnd(.6,1.4);const a=Math.random()*6.28;const s=randomSpot(55,75,SH.zone.x,SH.zone.z);if(s){const r=Math.random(),n=SH.wave;const t=n>=3&&r<.12?'brute':r<.25+n*.04?'runner':r<.35?'glow':'walker';spawnZombie(s.x,s.z,t,{wave:true,hpMul:1+n*.08});SH.waveLeft--}}
    const alive=ACT.zombies.filter(z=>z.wave&&!z.dead).length;
    if(SH.waveLeft<=0&&alive===0)waveWin();
  }else if(GAME.night&&GAME.hour===1&&SH.lastNightWave!==GAME.day&&SH.pieces.length>=3&&Math.hypot(PL.x-SH.zone.x,PL.z-SH.zone.z)<160&&!MSN.active){SH.lastNightWave=GAME.day;startWave()}
}
function startWave(n){SH.wave=n||SH.wave+1;SH.waveOn=true;SH.waveLeft=8+SH.wave*6;SH.waveSpawn=4;banner('블러드 레인',`WAVE ${SH.wave} · 쉘터를 지켜라`,'bad');sfx('alarm');msg('mira','웨이브가 온다! 문 앞을 지켜.','A wave is coming! Hold the door.')}
function waveWin(){SH.waveOn=false;const sc=20+SH.wave*10,cash=200+SH.wave*150;GAME.inv.scrap+=sc;GAME.money+=cash;banner('WAVE CLEAR',`+${sc} 고철 · +$${cash}`,'');sfx('pass');GAME.onWave&&GAME.onWave(SH.wave);SH.coreHp=Math.min(SH.coreMax,SH.coreHp+250);saveGame()}
function waveFail(){SH.waveOn=false;SH.waveLeft=0;for(const z of ACT.zombies)if(z.wave)z.wave=false;const lost=Math.floor(GAME.inv.scrap*.3);GAME.inv.scrap-=lost;SH.coreHp=400;banner('쉘터 함락','고철 -'+lost,'bad');sfx('fail');GAME.onWaveFail&&GAME.onWaveFail()}
