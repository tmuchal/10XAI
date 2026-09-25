'use strict';
/* =========================================================================
   Story data: characters, portraits, story missions and fixer contracts.
   ========================================================================= */
const WHO={
  seojin:{ko:'한서진',en:'HAN SEO-JIN',col:'#29e7ff',role:'러너 · 전 OMNI 드론 엔지니어'},
  taeo:{ko:'강태오',en:'KANG TAE-O',col:'#ffb347',role:'드라이버 · 구두장이의 아들'},
  mira:{ko:'윤미라',en:'YOON MI-RA',col:'#ff2e88',role:'해결사 · 블랙 로스터리 쉘터'},
  kang:{ko:'강 영감',en:'OLD KANG',col:'#e8c38a',role:'마지막 수제화 장인'},
  hwang:{ko:'황 두목',en:'BOSS HWANG',col:'#ff5b5b',role:'뚝섬 레이더즈 두목'},
  cha:{ko:'차도현',en:'CHA DO-HYUN',col:'#e9e9ff',role:'OMNI 다이내믹스 CEO'},
  sys:{ko:'SYSTEM',en:'SYSTEM',col:'#9591b5',role:''},
};
const PORT={};
function portrait(id){
  if(PORT[id])return PORT[id];
  const S=256,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  const w=WHO[id]||WHO.sys,col=w.col;
  const bg=g.createLinearGradient(0,0,S,S);bg.addColorStop(0,'#0d0c18');bg.addColorStop(1,'#1f0d1f');g.fillStyle=bg;g.fillRect(0,0,S,S);
  g.save();g.globalAlpha=.13;g.strokeStyle=col;g.lineWidth=12;for(let i=0;i<S*2;i+=40){g.beginPath();g.moveTo(i,0);g.lineTo(i-S,S);g.stroke()}g.restore();
  g.fillStyle=col;g.globalAlpha=.16;for(let y=6;y<S;y+=10)for(let x=6;x<S;x+=10){const r=2.4*(y/S);if(r<.35)continue;g.beginPath();g.arc(x+((y/10|0)%2)*5,y,r,0,7);g.fill()}g.globalAlpha=1;
  if(id==='sys'){g.strokeStyle='#ff2e88';g.lineWidth=12;g.beginPath();g.arc(128,128,62,0,7);g.stroke();g.fillStyle='#ff2e88';g.beginPath();g.arc(128,128,20,0,7);g.fill();return PORT[id]=c.toDataURL()}
  const SK={seojin:'#e6b89a',taeo:'#c48b68',mira:'#dfb096',kang:'#c08c6a',hwang:'#b47e62',cha:'#e9c2a6'}[id];
  const CL={seojin:'#0e0f18',taeo:'#4a2a1a',mira:'#1d1222',kang:'#5a4632',hwang:'#1a1a1a',cha:'#ececf4'}[id];
  const shadeC=(hex,f)=>{const n=parseInt(hex.slice(1),16);return`rgb(${clamp(((n>>16)&255)*f,0,255)|0},${clamp(((n>>8)&255)*f,0,255)|0},${clamp((n&255)*f,0,255)|0})`};
  const poly=(pts,fill)=>{g.fillStyle=fill;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))g.lineTo(p[0],p[1]);g.closePath();g.fill()};
  if(id==='seojin'){g.fillStyle='#0b0b10';g.beginPath();g.ellipse(128,110,60,66,0,Math.PI,0);g.lineTo(186,152);g.lineTo(70,152);g.closePath();g.fill()}
  if(id==='mira'){g.fillStyle='#c9cad8';g.beginPath();g.ellipse(128,108,62,66,0,Math.PI,0);g.lineTo(190,158);g.quadraticCurveTo(128,172,66,158);g.closePath();g.fill()}
  g.fillStyle=CL;g.beginPath();g.moveTo(8,S);g.bezierCurveTo(18,184,78,168,128,168);g.bezierCurveTo(178,168,238,184,248,S);g.closePath();g.fill();
  g.fillStyle=shadeC(SK,.78);g.beginPath();g.moveTo(108,132);g.lineTo(148,132);g.lineTo(150,176);g.quadraticCurveTo(128,186,106,176);g.closePath();g.fill();
  const head=()=>{g.beginPath();g.moveTo(84,100);g.quadraticCurveTo(84,48,128,48);g.quadraticCurveTo(172,48,172,100);g.quadraticCurveTo(170,146,128,160);g.quadraticCurveTo(86,146,84,100);g.closePath()};
  head();g.fillStyle=SK;g.fill();g.save();head();g.clip();g.fillStyle='rgba(70,20,50,.3)';g.fillRect(80,40,42,130);g.restore();
  const eye=x=>{g.fillStyle='#f4efe9';g.beginPath();g.ellipse(x,106,9,4.5,0,0,7);g.fill();g.fillStyle='#1a1216';g.beginPath();g.arc(x+1,106,3.6,0,7);g.fill()};
  eye(110);eye(146);
  g.strokeStyle='#1a1216';g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(99,94);g.lineTo(120,91);g.moveTo(136,91);g.lineTo(157,94);g.stroke();
  g.strokeStyle=shadeC(SK,.68);g.lineWidth=3;g.beginPath();g.moveTo(130,108);g.lineTo(134,125);g.lineTo(126,128);g.stroke();
  g.strokeStyle=id==='mira'?'#ff2e88':'#7a3b3b';g.lineWidth=id==='mira'?5:3.5;g.beginPath();g.moveTo(116,141);g.quadraticCurveTo(128,145,140,141);g.stroke();
  if(id==='seojin'){poly([[80,114],[78,70],[96,46],[128,40],[162,46],[178,70],[176,114],[168,86],[150,90],[128,82],[104,90],[88,86]],'#0b0b10');
    g.save();g.shadowColor='#29e7ff';g.shadowBlur=18;g.fillStyle='rgba(41,231,255,.9)';g.fillRect(90,97,76,17);g.restore();g.fillStyle='rgba(255,255,255,.7)';g.fillRect(96,100,30,3)}
  else if(id==='taeo'){poly([[82,104],[78,66],[92,44],[108,50],[120,30],[138,46],[158,34],[166,56],[180,64],[176,100],[166,74],[144,66],[114,72],[94,78]],'#1a120e');
    g.fillStyle='#ffb347';g.beginPath();g.moveTo(94,164);g.quadraticCurveTo(128,190,162,164);g.lineTo(168,186);g.quadraticCurveTo(128,210,88,186);g.closePath();g.fill();poly([[146,190],[160,188],[166,236],[150,240]],'#e89a2e')}
  else if(id==='mira'){poly([[80,124],[78,64],[102,44],[140,42],[172,56],[180,122],[170,90],[146,70],[108,74],[90,96]],'#c9cad8');g.fillStyle='#ff2e88';g.beginPath();g.arc(84,124,4,0,7);g.arc(172,124,4,0,7);g.fill()}
  else if(id==='kang'){g.fillStyle='#a2a2ac';g.beginPath();g.ellipse(88,92,10,22,0,0,7);g.ellipse(168,92,10,22,0,0,7);g.fill();g.strokeStyle='#d9b36a';g.lineWidth=3.5;g.beginPath();g.arc(110,106,15,0,7);g.moveTo(161,106);g.arc(146,106,15,0,7);g.stroke();g.fillStyle='#b8b8c0';g.beginPath();g.ellipse(128,134,16,5,0,0,7);g.fill()}
  else if(id==='hwang'){g.fillStyle='#aa1818';g.fillRect(84,118,88,34);g.save();g.fillStyle='#ffb347';g.shadowColor='#ffb347';g.shadowBlur=18;g.fillRect(92,100,72,10);g.restore();g.fillStyle='#111';g.fillRect(84,48,88,26)}
  else if(id==='cha'){poly([[84,96],[84,56],[108,42],[150,42],[172,58],[172,96],[164,70],[128,60],[96,70]],'#101014');g.save();g.strokeStyle='#fff';g.shadowColor='#fff';g.shadowBlur=16;g.lineWidth=4;g.beginPath();g.ellipse(128,34,56,12,0,0,7);g.stroke();g.restore()}
  g.save();g.strokeStyle=col;g.lineWidth=4;g.shadowColor=col;g.shadowBlur=14;g.beginPath();g.moveTo(172,96);g.quadraticCurveTo(170,146,128,160);g.stroke();g.beginPath();g.moveTo(248,S);g.bezierCurveTo(238,184,178,168,140,168);g.stroke();g.restore();
  g.fillStyle='rgba(0,0,0,.25)';for(let y=0;y<S;y+=4)g.fillRect(0,y,S,1);
  return PORT[id]=c.toDataURL();
}

const WEAPONS={
  pistol:{ko:'P-77 권총',en:'P-77 PISTOL',dmg:38,rpm:320,mag:12,spread:.012,range:90,pellets:1,auto:false,ammoPack:24,noise:45,reload:1.2,col:'#ffcc88'},
  smg:{ko:'성수 SMG',en:'SEONGSU SMG',dmg:19,rpm:780,mag:32,spread:.03,range:70,pellets:1,auto:true,ammoPack:64,noise:55,reload:1.6,col:'#ffd28a',craft:{scrap:60,money:1500}},
  shotgun:{ko:'뚝섬 산탄총',en:'TTUKSEOM SHOTGUN',dmg:15,rpm:78,mag:6,spread:.085,pellets:9,range:36,auto:false,ammoPack:12,noise:75,reload:2.3,col:'#ffb070',craft:{scrap:80,money:2000}},
  katana:{ko:'모노블레이드',en:'MONOBLADE',melee:true,dmg:90,rpm:140,range:2.9,noise:0,col:'#29e7ff'},
};
const WKEYS=['pistol','smg','shotgun','katana'];

/* ---------- story ---------- */
const STORY=[
{id:'deadrain',title:'죽은 비',en:'Dead Rain',reward:{money:500,scrap:20},
 intro:[['seojin','격리구역 7. 3년 전엔 그냥 성수동이었지.','Quarantine Zone 7. Three years ago it was just Seongsu-dong.'],
   ['mira','서진? 살아 있었구나. 여긴 윤미라. 블랙 로스터리가 이 구역 마지막 쉘터야.','Seo-jin? You made it. This is Yoon Mi-ra. Black Roastery is the last shelter in the zone.'],
   ['mira','비 조심해. 포자가 섞여 있어. 네온 불빛 쪽으로 감염체가 몰려.','Watch the rain. It carries spores. The infected swarm toward neon light.'],
   ['seojin','연무장길 따라 내려갈게. 문 열어 둬.','I\'ll come down Yeonmujang-gil. Keep the door open.']],
 steps:[
  {type:'goto',at:()=>LOC.shelter,r:9,text:'쉘터(블랙 로스터리)로 이동하라'},
  {type:'killTag',text:'쉘터 앞의 감염체를 처치하라',start:m=>{for(let i=0;i<6;i++){const s=randomSpot(10,20,LOC.shelter.x,LOC.shelter.z);if(s)spawnZombie(s.x,s.z,i%3===0?'runner':'walker',{mission:'deadrain'})}}},
  {type:'talk',npc:'mira',text:'미라와 대화하라 (E)'},
  {type:'cut',lines:[['mira','솜씨 좋네. OMNI가 널 쫓아낸 이유, 나는 알아. 프로젝트 TTUK.','Nice work. I know why OMNI threw you out. Project TTUK.'],
    ['seojin','드론 메시로 포자를 뿌려서 구역을 "진정"시키는 계획. 내가 막으려다 해고됐지.','Spread spores through the drone mesh to "pacify" the district. I tried to stop it and got fired.'],
    ['mira','그리고 그게 성수를 이렇게 만들었어. 일부터 해. 난 해결사야. 의뢰가 있으면 너한테 줄게.','And that\'s what made Seongsu like this. Work first. I\'m a fixer; I\'ll send you contracts.']]},
 ]},
{id:'shelter',title:'첫 쉘터',en:'First Shelter',reward:{money:800,scrap:10},
 intro:[['mira','쉘터가 버티려면 벽이 필요해. 고철 모아 와. 차 잔해, 감염체, 레이더 전부 고철이야.','The shelter needs walls. Bring scrap. Wrecks, infected, raiders: it\'s all scrap.'],['mira','B를 누르면 건설 모드야. 바리케이드랑 발전기부터.','Press B for build mode. Start with a barricade and a generator.']],
 steps:[
  {type:'scrap',need:40,text:'고철을 모아라'},
  {type:'build',piece:'wall',text:'쉘터에 바리케이드를 지어라 (B)'},
  {type:'build',piece:'gen',text:'발전기를 지어라 (B)'},
  {type:'cut',lines:[['mira','좋아. 이제 좀 쉘터 같네. 수제화 거리에서 구조 요청이 왔어. 강 영감님이야.','Good. Now it looks like a shelter. A distress call from Shoemaker Street. It\'s Old Kang.']]},
 ]},
{id:'kang',title:'구두장이',en:'The Shoemaker',reward:{money:1500,scrap:15},
 intro:[['kang','…누구 있나? 공방 문을 감염체들이 긁고 있어.','…Anyone there? The infected are clawing at the workshop door.'],['seojin','버텨요, 영감님. 금방 가요.','Hold on, sir. I\'m coming.']],
 steps:[
  {type:'goto',at:()=>LOC.kang,r:14,text:'수제화 거리의 강 수제화 공방으로 가라',start:m=>{for(let i=0;i<12;i++){const s=randomSpot(4,16,LOC.kang.x,LOC.kang.z);if(s)spawnZombie(s.x,s.z,i<2?'brute':i<6?'runner':'walker',{mission:'kang'})}}},
  {type:'killTag',text:'공방을 둘러싼 감염체를 처치하라'},
  {type:'rescue',ally:'kang',text:'강 영감을 쉘터까지 호위하라',start:m=>{m.v.ally=spawnAlly(LOC.kang.x,LOC.kang.z,LOOKS.kang,{follow:true,id:'kang',name:'강 영감'});m.v.ally.armed=false}},
  {type:'cut',lines:[['kang','고맙네. 내 연장 좀 챙겨 왔어. 작업대만 있으면 총도 고칠 수 있지.','Thank you. I brought my tools. Give me a workbench and I can fix guns too.'],['kang','그리고… 태오. 내 아들이 레이더들한테 끌려갔어. 성수역 밑이야.','And… Tae-o. My son was taken by raiders. Under Seongsu station.']]},
 ],done:()=>{GAME.rescued.kang=true;placeShelterNPCs()}},
{id:'taeo',title:'2호선 아래',en:'Under Line 2',reward:{money:2500,scrap:25},
 intro:[['mira','성수역 고가 밑은 뚝섬 레이더즈 차고야. 태오가 거기 잡혀 있어. VOLT GT도.','The yard under Seongsu station belongs to the Ttukseom Raiders. Tae-o is held there. So is a VOLT GT.'],['hwang','여긴 내 구역이다. 네온 한 조각도 공짜는 없어.','This is my turf. Not one shard of neon comes free.']],
 steps:[
  {type:'goto',at:()=>LOC.raiderYard,r:22,text:'성수역 레이더 차고로 가라'},
  {type:'killTag',text:'차고의 레이더들을 제압하라',start:m=>{for(const r of ACT.raiders)if(r.camp==='yard'&&!r.dead)r.mission='taeo';if(!ACT.raiders.some(r=>r.mission==='taeo'&&!r.dead))for(let i=0;i<5;i++){const s=randomSpot(3,10,LOC.raiderYard.x,LOC.raiderYard.z);if(s)spawnRaider(s.x,s.z,{camp:'yard',mission:'taeo'})}}},
  {type:'talk',npc:'taeo',text:'묶여 있는 태오를 풀어줘라 (E)',start:m=>{m.v.captive=spawnNPC('taeo',LOC.raiderYard.x+4,LOC.raiderYard.z+2,Math.PI)}},
  {type:'cut',lines:[['taeo','…아버지가 보냈어요? 늦었네. 농담이에요.','…Dad sent you? You\'re late. Kidding.'],['taeo','저 GT, 레이더 두목 차예요. 시동은 내가 걸 줄 알아요. 가요.','That GT is the boss\'s car. I know how to start it. Let\'s go.']],start:m=>{if(m.v.captive){removeActor(m.v.captive);ACT.npcs=ACT.npcs.filter(n=>n!==m.v.captive)}m.v.ally=spawnAlly(LOC.raiderYard.x+4,LOC.raiderYard.z+2,LOOKS.taeo,{follow:true,id:'taeo',name:'강태오'})}},
  {type:'drive',text:'VOLT GT를 훔쳐 쉘터로 몰고 가라',start:m=>{m.v.car=makeCar('gt',LOC.raiderYard.x-6,LOC.raiderYard.z-2,Math.PI/2,{keep:true,col:'#29e7ff',locked:false,mission:'taeo'})},to:()=>LOC.shelter,r:12},
 ],done:()=>{GAME.rescued.taeo=true;placeShelterNPCs()}},
{id:'wave',title:'블러드 레인',en:'Blood Rain',reward:{money:2000,scrap:30},
 intro:[['mira','비가 붉어졌어. 오늘 밤 떼로 온다. 터렛 하나 세워. 칩 두 개 줄게.','The rain turned red. They\'re coming in a swarm tonight. Build a turret; here are two chips.'],['taeo','GT로 입구 막아 둘까요?','Should I block the entrance with the GT?'],['mira','그 차 긁히면 네가 울 거잖아.','You\'d cry if it got scratched.']],
 steps:[
  {type:'build',piece:'turret',text:'자동 터렛을 지어라 (B)',start:()=>{GAME.inv.chips+=2;GAME.inv.scrap+=20}},
  {type:'defend',waves:1,text:'블러드 레인 웨이브에서 쉘터를 지켜라'},
 ]},
{id:'pier',title:'뚝섬 레이더즈',en:'Ttukseom Raiders',reward:{money:3500,scrap:30,unlock:'smg'},
 intro:[['taeo','황 두목이 선착장에 진을 쳤어요. 보급선이 거기로 들어와요.','Boss Hwang set up camp at the pier. Supply boats come in there.'],['mira','보급선을 뺏으면 이 구역이 한 달은 버텨. 황을 치워.','Take the supply line and the zone survives a month. Remove Hwang.']],
 steps:[
  {type:'goto',at:()=>LOC.pier,r:26,text:'뚝섬 선착장 레이더 캠프로 가라',start:m=>{for(let i=0;i<6;i++){const s=randomSpot(4,16,LOC.pier.x,LOC.pier.z-10);if(s)spawnRaider(s.x,s.z,{camp:'pier',mission:'pier'})}const b=spawnRaider(LOC.pier.x,LOC.pier.z-4,{boss:true,camp:'pier',mission:'pier'});m.v.boss=b}},
  {type:'killTag',text:'황 두목과 레이더들을 제압하라'},
  {type:'cut',lines:[['hwang','…네온은… 결국 다 꺼져.','…Neon… all goes dark in the end.'],['mira','선착장 확보. 작업대에서 SMG를 만들 수 있게 됐어.','Pier secured. You can build the SMG at the workbench now.']]},
 ]},
{id:'forest',title:'깃발',en:'The Banner',reward:{money:3000,scrap:20,unlock:'shotgun'},
 intro:[['seojin','서울숲. 옛날엔 왕이 사냥하고 군대를 사열하던 뚝섬이었어.','Seoul Forest. Once it was Ttukseom, where kings hunted and reviewed troops.'],['mira','거기 세웠던 큰 깃발 이름이 "둑"이야. OMNI가 그 이름을 훔쳐 TTUK이라 불렀지.','The great banner raised there was called the "Ttuk". OMNI stole the name for TTUK.'],['seojin','숲 안에 포자 둥지가 세 개. 태워버릴게.','Three spore nests in the forest. I\'ll burn them.']],
 steps:[
  {type:'nests',text:'서울숲의 감염 둥지를 파괴하라',start:m=>{for(const[x,y]of[[10,44],[22,52],[12,70]]){const p=P(x,y);spawnNest(p.x,p.z,{mission:'forest'})}}},
  {type:'cut',lines:[['mira','둥지가 꺼지니 비가 좀 옅어졌어. 이제 남은 건 원본이야. OMNI 타워 지하의 TTUK 코어.','With the nests gone the rain thinned. Only the source is left: the TTUK core under OMNI Tower.']]},
 ]},
{id:'omni',title:'성수의 밤',en:'Seongsu Night',reward:{money:10000,scrap:50},final:true,
 intro:[['cha','격리구역 7 주민 여러분. TTUK은 실패가 아닙니다. 진화입니다.','Residents of Zone 7. TTUK is not a failure. It is evolution.'],['taeo','저 사람 말투, 광고랑 똑같네.','He talks exactly like his ads.'],['seojin','코어를 꺼내서 메시를 끊는다. 그게 끝이야.','Pull the core, cut the mesh. That\'s the end of it.'],['mira','둘 다 살아서 돌아와. 커피 식는다.','Both of you, come back alive. The coffee\'s getting cold.']],
 steps:[
  {type:'goto',at:()=>LOC.omni,r:14,text:'OMNI 타워 로비로 진입하라',start:m=>{for(let i=0;i<14;i++){const s=randomSpot(6,26,LOC.omni.x,LOC.omni.z);if(s)spawnZombie(s.x,s.z,i<3?'brute':i<8?'glow':'runner',{mission:'omni'})}}},
  {type:'killTag',text:'로비의 TTUK 원체와 감염체를 처치하라',start:m=>{const b=spawnZombie(LOC.omni.x,LOC.omni.z-4,'brute',{mission:'omni',hpMul:5});b.h.root.scale.setScalar(1.35);b.r=.8;b.reach=2.6;b.dmg=35;m.v.boss=b}},
  {type:'hold',at:()=>LOC.omni,r:3,dur:5,text:'TTUK 코어를 뽑아내라 (E 길게)'},
  {type:'goto',at:()=>LOC.shelter,r:10,text:'코어를 들고 쉘터로 돌아가라',start:()=>{GAME.calm=false;for(let i=0;i<10;i++){const s=randomSpot(20,50);if(s)spawnZombie(s.x,s.z,'runner',{mission:'omni'})}}},
  {type:'cut',lines:[['seojin','코어 차단. 드론 메시가 꺼진다.','Core severed. The drone mesh is going dark.'],['taeo','…비가 그쳤어. 진짜로.','…The rain stopped. For real.'],['mira','성수의 밤은 이제 우리 거야.','Seongsu\'s nights are ours now.']]},
 ]},
];
/* repeatable fixer contracts */
const CONTRACTS=[
  {kind:'supply',ko:'보급품 회수',en:'Supply run',desc:'구역 어딘가의 보급 상자를 회수해 쉘터로 가져와라.',reward:{money:500,scrap:25}},
  {kind:'bounty',ko:'현상금',en:'Bounty',desc:'레이더 간부와 호위를 제압하라.',reward:{money:1300,scrap:10}},
  {kind:'nest',ko:'둥지 소각',en:'Burn a nest',desc:'새로 생긴 포자 둥지를 파괴하라.',reward:{money:700,scrap:20,chips:1}},
  {kind:'car',ko:'차량 회수',en:'Vehicle recovery',desc:'OMNI 차량을 훔쳐 쉘터로 가져와라.',reward:{money:1600,scrap:10}},
  {kind:'rescue',ko:'생존자 구조',en:'Rescue',desc:'고립된 생존자를 쉘터로 호위하라. 쉘터 인원이 늘면 고철 수입이 오른다.',reward:{money:600,survivor:1}},
];
function contractSteps(kind,m){
  const far=()=>randomSpot(90,200,LOC.shelter.x,LOC.shelter.z)||randomSpot(60,120);
  if(kind==='supply'){const s=far();return[
    {type:'hold',at:()=>s,r:2.5,dur:2,text:'보급 상자를 열어라 (E 길게)',start:m=>{m.v.crate=makeCrate(s.x,s.z);for(let i=0;i<5;i++){const q=randomSpot(8,20,s.x,s.z);if(q)spawnZombie(q.x,q.z,'walker',{mission:m.id})}}},
    {type:'goto',at:()=>LOC.shelter,r:10,text:'보급품을 쉘터로 가져가라',start:m=>{if(m.v.crate)SCENE.remove(m.v.crate)}}]}
  if(kind==='bounty'){const s=far();return[
    {type:'goto',at:()=>s,r:25,text:'레이더 간부의 위치로 가라',start:m=>{spawnRaider(s.x,s.z,{boss:true,mission:m.id});for(let i=0;i<3;i++){const q=randomSpot(2,8,s.x,s.z);if(q)spawnRaider(q.x,q.z,{mission:m.id})}}},
    {type:'killTag',text:'간부와 호위를 제압하라'}]}
  if(kind==='nest'){const s=far();return[{type:'nests',text:'포자 둥지를 파괴하라',start:m=>spawnNest(s.x,s.z,{mission:m.id})}]}
  if(kind==='car'){const s=nearestRoad(far());return[
    {type:'drive',text:'OMNI 시큐리티 차량을 훔쳐 쉘터로 가져와라',start:m=>{m.v.car=makeCar('omni',s.x,s.z,Math.random()*6,{keep:true,locked:true,mission:m.id});for(let i=0;i<4;i++){const q=randomSpot(6,16,s.x,s.z);if(q)spawnZombie(q.x,q.z,'runner',{mission:m.id})}},to:()=>LOC.shelter,r:12}]}
  if(kind==='rescue'){const s=far();return[
    {type:'goto',at:()=>s,r:12,text:'생존자에게 가라',start:m=>{m.v.ally=spawnAlly(s.x,s.z,LOOKS.survivor,{follow:false,name:'생존자'});for(let i=0;i<7;i++){const q=randomSpot(8,18,s.x,s.z);if(q)spawnZombie(q.x,q.z,i<2?'runner':'walker',{mission:m.id})}}},
    {type:'rescue',text:'생존자를 쉘터로 호위하라',start:m=>{m.v.ally.follow=true}}]}
  return[];
}
function makeCrate(x,z){const g=new THREE.Group();part(g,'#3a4a2a',1.4,.9,1,0,.45,0);part(g,'#ffb347',1.42,.08,1.02,0,.7,0,'hot');part(g,'#29e7ff',.3,.3,.02,0,.5,.51,'hot');g.position.set(x,0,z);SCENE.add(g);return g}
