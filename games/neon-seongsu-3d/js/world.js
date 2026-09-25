'use strict';
/* =========================================================================
   NEON SEONGSU: DEAD RAIN — world generation
   The tile layout matches the 2D game (1 tile = 4 m) so the city is the same
   Seongsu: Line 2 viaduct on Achasan-ro, Seoul Forest west, Jungnangcheon on
   the far west edge, the Han River south, OMNI Tower in Seongsu 2-ga.
   ========================================================================= */
const TILE=4, MW=150, MH=110, WX=MW*TILE, WZ=MH*TILE;
const ROAD=0,SIDE=1,BLD=2,GRASS=3,WATER=4,PLAZA=5,ALLEY=6,URB=9;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const rpick=a=>a[Math.floor(Math.random()*a.length)];
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d};
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const RNG=mulberry(20771);
const rr=(a,b)=>a+RNG()*(b-a), ri=(a,b)=>Math.floor(rr(a,b+1)), pick=a=>a[Math.floor(RNG()*a.length)];
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const map=new Uint8Array(MW*MH).fill(URB);
const bid=new Int16Array(MW*MH).fill(-1);
const idx=(x,y)=>y*MW+x;
const inb=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH;
const tileAt=(x,y)=>inb(x,y)?map[idx(x,y)]:BLD;
const tileW=(x,z)=>tileAt(Math.floor(x/TILE),Math.floor(z/TILE));
const solidT=t=>t===BLD||t===WATER;
const solidW=(x,z)=>solidT(tileW(x,z));
const walkT=t=>t===SIDE||t===PLAZA||t===ALLEY||t===GRASS||t===ROAD;

for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
  let t=URB;
  if(y>=96)t=WATER;else if(y>=90)t=GRASS;else if(x<3)t=WATER;else if(x<30)t=GRASS;
  if(x<30&&y<86&&((x-15)/6)**2+((y-62)/4)**2<1)t=WATER;
  map[idx(x,y)]=t;
}
const ROADS=[
  {nm:'아차산로',hz:1,x:0,y:36,w:143,h:4},{nm:'강변북로',hz:1,x:0,y:86,w:143,h:4},
  {nm:'뚝섬로',hz:1,x:30,y:12,w:113,h:3},{nm:'연무장길',hz:1,x:30,y:52,w:113,h:2},
  {nm:'성수일로',hz:1,x:30,y:68,w:113,h:2},{nm:'왕십리로',hz:1,x:30,y:24,w:113,h:2},
  {nm:'서울숲길',hz:0,x:30,y:0,w:3,h:90},{nm:'성덕정길',hz:0,x:44,y:0,w:2,h:90},
  {nm:'성수이로',hz:0,x:62,y:0,w:4,h:90},{nm:'상원길',hz:0,x:80,y:12,w:2,h:78},
  {nm:'연무장5길',hz:0,x:96,y:0,w:3,h:90},{nm:'성수삼로',hz:0,x:112,y:12,w:2,h:78},
  {nm:'광나루로',hz:0,x:128,y:0,w:3,h:90},{nm:'자양로',hz:0,x:140,y:0,w:3,h:90},
];
for(const r of ROADS)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)map[idx(x,y)]=ROAD;
for(let y=96;y<=100;y++)for(let x=60;x<=66;x++)map[idx(x,y)]=PLAZA;     // Ttukseom pier
for(let y=60;y<=61;y++)for(let x=0;x<=2;x++)map[idx(x,y)]=PLAZA;        // Salgoji bridge
for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
  if(map[idx(x,y)]!==URB)continue;
  let adj=false;
  for(let dy=-1;dy<=1&&!adj;dy++)for(let dx=-1;dx<=1;dx++)if(tileAt(x+dx,y+dy)===ROAD){adj=true;break}
  if(adj)map[idx(x,y)]=SIDE;
}
// shelter yard in front of the red-brick warehouse
for(let y=55;y<=60;y++)for(let x=47;x<=60;x++)map[idx(x,y)]=PLAZA;
// raider camp at the pier plaza and a raider yard under Seongsu station
for(let y=41;y<=45;y++)for(let x=83;x<=92;x++)if(map[idx(x,y)]===URB)map[idx(x,y)]=PLAZA;

for(const r of ROADS)r.cross=[];
for(const H of ROADS)if(H.hz)for(const V of ROADS)if(!V.hz){
  if(V.x<H.x+H.w&&V.x+V.w>H.x&&H.y<V.y+V.h&&H.y+H.h>V.y){H.cross.push(V);V.cross.push(H)}
}
const DXS=[1,0,-1,0],DZS=[0,1,0,-1],DYAW=[Math.PI/2,0,-Math.PI/2,Math.PI];
function laneW(r,d){return r.hz?(d===0?r.y+r.h*.75:r.y+r.h*.25)*TILE:(d===3?r.x+r.w*.75:r.x+r.w*.25)*TILE}

/* ---------- buildings ---------- */
const B=[];
const CAFE=['로스터리','카페','COFFEE','베이커리','팝업','갤러리','빈티지','편집숍','와인바','브런치'];
const SHOE=['수제화','구두','SHOES','가죽공방','맞춤구두'];
const GEN=['성수','노래방','PC방','HOTEL','BAR','라멘','치킨','사이버','굿즈','네온','약국','국밥','LAB','클럽','오락실','인쇄소','철공소','24시','편의점','모텔','당구장'];
const NEON=['#ff2e88','#29e7ff','#ffb347','#b36bff','#5dff9b','#ff5b5b'];
function addBuilding(x,y,w,h,o){
  const id=B.length;
  for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){map[idx(i,j)]=BLD;bid[idx(i,j)]=id}
  const b=Object.assign({id,x,y,w,h,ht:20,type:'conc',sign:null,signCol:pick(NEON),uoff:RNG()*8,variant:ri(0,1)},o);
  B.push(b);return b;
}
const SHELTER_B=addBuilding(47,61,14,6,{ht:11,type:'brick',sign:'블랙 로스터리',signCol:'#ff2e88',landmark:1,shelter:1});
const OMNI_B=addBuilding(100,71,11,14,{ht:150,type:'omni',sign:'OMNI',signCol:'#ff2e88',landmark:1,omni:1});
for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
  if(map[idx(x,y)]!==URB)continue;
  const w=ri(3,7),h=ri(3,6);
  let ww=0;while(ww<w&&inb(x+ww,y)&&map[idx(x+ww,y)]===URB)ww++;
  let hh=0;for(;hh<h;hh++){if(!inb(x,y+hh))break;let ok=true;for(let i=0;i<ww;i++)if(map[idx(x+i,y+hh)]!==URB){ok=false;break}if(!ok)break}
  if(ww*hh<=2||RNG()<.05){for(let j=0;j<hh;j++)for(let i=0;i<ww;i++)map[idx(x+i,y+j)]=PLAZA;continue}
  const cafe=y>=46&&y<=58&&x>=33, shoe=x>=47&&x<=60&&y>=41&&y<=50, north=y<24;
  const brick=!north&&RNG()<(shoe||cafe?.45:.28);
  let sign=null;
  if(shoe&&RNG()<.8)sign=pick(SHOE);else if(cafe&&RNG()<.7)sign=pick(CAFE);else if(RNG()<.5)sign=pick(GEN);
  const tall=!brick&&RNG()<.22;
  const ht=brick?rr(7,13):north?rr(22,58):tall?rr(30,62):rr(11,28);
  addBuilding(x,y,ww,hh,{ht,type:brick?'brick':tall?'glass':'conc',sign});
  if(RNG()<.22)for(let j=0;j<hh;j++)if(inb(x+ww,y+j)&&map[idx(x+ww,y+j)]===URB)map[idx(x+ww,y+j)]=ALLEY;
}
function buildingNear(tx,ty,f){for(let r=0;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(!inb(tx+dx,ty+dy))continue;const i=bid[idx(tx+dx,ty+dy)];if(i>=0&&(!f||f(B[i])))return B[i]}return null}
const KANG_B=buildingNear(47,45,b=>!b.landmark);if(KANG_B){KANG_B.sign='강 수제화';KANG_B.signCol='#ffb347';KANG_B.type='brick';KANG_B.ht=9}

const P=(tx,ty)=>({x:(tx+.5)*TILE,z:(ty+.5)*TILE});
const PC=(tx,ty)=>({x:tx*TILE,z:ty*TILE});
function snapWalk(tx,ty,ok=t=>t===SIDE||t===PLAZA||t===ALLEY||t===GRASS){for(let r=0;r<10;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(ok(tileAt(tx+dx,ty+dy)))return P(tx+dx,ty+dy);return P(tx,ty)}
function nearestRoad(p){const tx=Math.floor(p.x/TILE),ty=Math.floor(p.z/TILE);for(let r=0;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(tileAt(tx+dx,ty+dy)===ROAD)return P(tx+dx,ty+dy);return p}

const LOC={
  shelter:P(53.5,58), shelterCore:{x:53.5*TILE+2,z:60.6*TILE}, start:P(66,47), kang:P(46,45), pier:P(63,98),
  raiderYard:P(87,43), forest:P(15,48), omni:P(105,70), doyun:P(70,91), station:P(86,40),
};
const LABELS=[['서울숲',15,45],['중랑천',2,24],['뚝섬역',42,33],['성수역',86,33],['연무장길',88,50],['수제화 거리',53,45],['쉘터 · 블랙 로스터리',53,62],['OMNI 타워',105,78],['뚝섬 선착장',63,93],['한강',70,103],['성수1가',75,20],['성수2가',120,30]];
function zoneOf(x,z){
  const tx=x/TILE,ty=z/TILE;
  if(ty>=96)return['한강','HAN RIVER'];
  if(ty>=90)return['뚝섬 한강공원','TTUKSEOM PARK · RAIDER TERRITORY'];
  if(tx<3)return['중랑천','JUNGNANGCHEON'];
  if(tx<30)return['서울숲','SEOUL FOREST · INFECTED ZONE'];
  if(tx>=46&&tx<62&&ty>=54&&ty<67)return['쉘터','BLACK ROASTERY SHELTER'];
  if(tx>=99&&tx<112&&ty>=70&&ty<86)return['OMNI 타워','OMNI TOWER'];
  if(ty>=50.5&&ty<55.5)return['연무장길','YEONMUJANG-GIL'];
  if(tx<62&&ty>=40&&ty<51)return['수제화 거리','SHOEMAKER ST.'];
  if(ty>=34&&ty<46&&tx>=78&&tx<95)return['성수역','LINE 2 · SEONGSU · RAIDER YARD'];
  if(ty>=34&&ty<42)return tx<62?['뚝섬역','LINE 2 · TTUKSEOM']:['아차산로','ACHASAN-RO'];
  return tx<96?['성수1가','SEONGSU 1-GA']:['성수2가','SEONGSU 2-GA'];
}

/* ---------- flow fields (4-neighbour BFS over walkable tiles) ---------- */
const QB=new Int32Array(MW*MH);
function bfs(out,sx,sy){
  out.fill(-1);sx=clamp(sx,0,MW-1);sy=clamp(sy,0,MH-1);let h=0,t=0;out[idx(sx,sy)]=0;QB[t++]=idx(sx,sy);
  while(h<t){const i=QB[h++],x=i%MW,y=(i/MW)|0,d=out[i];
    for(let k=0;k<4;k++){const nx=x+DXS[k],ny=y+DZS[k];if(!inb(nx,ny))continue;const j=idx(nx,ny);if(out[j]>=0||solidT(map[j]))continue;out[j]=d+1;QB[t++]=j}}
}
function flowStep(field,x,z){
  const tx=Math.floor(x/TILE),ty=Math.floor(z/TILE);let bx=tx,by=ty,bd=field[idx(clamp(tx,0,MW-1),clamp(ty,0,MH-1))];if(bd<0)bd=1e9;
  for(let k=0;k<4;k++){const nx=tx+DXS[k],ny=ty+DZS[k];if(!inb(nx,ny))continue;const v=field[idx(nx,ny)];if(v>=0&&v<bd){bd=v;bx=nx;by=ny}}
  return{x:(bx+.5)*TILE,z:(by+.5)*TILE};
}
function losW(ax,az,bx,bz){const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/2);for(let i=1;i<n;i++)if(solidW(ax+(bx-ax)*i/n,az+(bz-az)*i/n))return false;return true}

/* =========================================================================
   Three.js city construction
   ========================================================================= */
const CITY={};
function canvasTex(w,h,draw,opts={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;if(opts.repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping}t.anisotropy=opts.aniso||4;return t;
}
function facadeTextures(type,variant){
  const S=256;
  const base={conc:['#1d1c29','#14131c'],brick:['#4a2019','#3a1813'],glass:['#101a26','#0a1119'],omni:['#170f24','#0e0a18']}[type];
  const litCols={conc:['#ffd9a0','#8ff4ff','#ffb0d8','#fff1c4'],brick:['#ffb86b','#ffcf8a'],glass:['#8ff4ff','#c7a5ff','#e6f7ff'],omni:['#ff7ab8','#ff2e88','#ffd0e8']}[type];
  const R2=mulberry(type.length*97+variant*13+1);
  const cols=type==='glass'?6:4, rows=type==='glass'?6:4;
  const lit=[];for(let i=0;i<cols*rows;i++)lit.push(R2()<(type==='omni'?.75:type==='glass'?.45:.38)?litCols[Math.floor(R2()*litCols.length)]:null);
  const map=canvasTex(S,S,g=>{
    g.fillStyle=base[0];g.fillRect(0,0,S,S);
    if(type==='brick'){g.fillStyle='rgba(0,0,0,.28)';for(let y=0;y<S;y+=8){g.fillRect(0,y,S,1.5);for(let x=((y/8)%2)*12;x<S;x+=24)g.fillRect(x,y,1.5,8)}}
    if(type==='conc'){for(let i=0;i<300;i++){g.fillStyle=`rgba(255,255,255,${R2()*.03})`;g.fillRect(R2()*S,R2()*S,R2()*20,R2()*20)}g.fillStyle='rgba(0,0,0,.35)';for(let y=0;y<S;y+=S/rows)g.fillRect(0,y,S,3)}
    const cw=S/cols,rh=S/rows;
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const x=i*cw+cw*.18,y=j*rh+rh*.22,w=cw*.64,h=rh*(type==='glass'?.62:.5);
      g.fillStyle=type==='glass'?'#0c1622':'#0a0a10';g.fillRect(x,y,w,h);
      g.strokeStyle='rgba(255,255,255,.08)';g.lineWidth=2;g.strokeRect(x,y,w,h);
      if(type!=='glass'){g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x-2,y+h,w+4,3)}
    }
    // rain streaks and grime
    for(let i=0;i<120;i++){g.fillStyle=`rgba(0,0,0,${R2()*.25})`;g.fillRect(R2()*S,R2()*S,1+R2()*2,10+R2()*60)}
  },{repeat:1});
  const emi=canvasTex(S,S,g=>{
    g.fillStyle='#000';g.fillRect(0,0,S,S);
    const cw=S/cols,rh=S/rows;
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const c=lit[j*cols+i];if(!c)continue;
      const x=i*cw+cw*.18,y=j*rh+rh*.22,w=cw*.64,h=rh*(type==='glass'?.62:.5);
      const gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,c);gr.addColorStop(1,'#000');g.globalAlpha=.55+R2()*.45;g.fillStyle=gr;g.fillRect(x,y,w,h);
      if(R2()<.4){g.fillStyle='rgba(0,0,0,.7)';g.fillRect(x+w*R2()*.6,y,w*.25,h)}g.globalAlpha=1}
  },{repeat:1});
  return{map,emi};
}
/* sign atlas: 8x8 horizontal cells (256x128) in the top half, 16x4 vertical cells (128x256) below */
const ATLAS={c:null,g:null,tex:null,cache:{},h:0,v:0};
function atlasInit(){ATLAS.c=document.createElement('canvas');ATLAS.c.width=ATLAS.c.height=2048;ATLAS.g=ATLAS.c.getContext('2d');}
function signCell(text,col,vertical){
  const key=text+col+(vertical?'v':'h');if(ATLAS.cache[key])return ATLAS.cache[key];
  const g=ATLAS.g;let x,y,w,h;
  if(vertical){if(ATLAS.v>=64)return ATLAS.cache[key]=signCell(text,col,false);const i=ATLAS.v++;w=128;h=256;x=(i%16)*128;y=1024+Math.floor(i/16)*256}
  else{if(ATLAS.h>=64){const keys=Object.keys(ATLAS.cache);return ATLAS.cache[keys[Math.floor(Math.random()*keys.length)]]}const i=ATLAS.h++;w=256;h=128;x=(i%8)*256;y=Math.floor(i/8)*128}
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  g.fillStyle='rgba(8,6,14,.92)';g.fillRect(x+4,y+4,w-8,h-8);
  g.strokeStyle=col;g.lineWidth=5;g.shadowColor=col;g.shadowBlur=16;g.strokeRect(x+10,y+10,w-20,h-20);
  g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';
  const font='"Black Han Sans","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  if(vertical){const chars=[...text].slice(0,4);const fs=Math.min(52,(h-40)/chars.length);g.font=`${fs}px ${font}`;chars.forEach((ch,k)=>{const yy=y+20+fs*(k+.55);g.shadowBlur=22;g.fillText(ch,x+w/2,yy);g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.85)';g.fillText(ch,x+w/2,yy);g.fillStyle=col})}
  else{let fs=Math.min(70,(w-40)/Math.max(1.6,text.length*(/[A-Z0-9 ]/.test(text)?.62:.95)));g.font=`${fs}px ${font}`;g.shadowBlur=24;g.fillText(text,x+w/2,y+h/2+4);g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.85)';g.fillText(text,x+w/2,y+h/2+4)}
  g.restore();
  return ATLAS.cache[key]={u0:x/2048,v0:1-(y+h)/2048,u1:(x+w)/2048,v1:1-y/2048,aspect:w/h};
}
/* geometry accumulator */
function Acc(){return{p:[],n:[],u:[],i:[],g:{}}}
function accQuad(A,grp,a,b,c,d,nrm,uv){
  // a b c d counter-clockwise, uv=[[u,v]x4]
  const L=A.g[grp]||(A.g[grp]=[]);const base=A.p.length/3;
  for(const [v,t] of [[a,uv[0]],[b,uv[1]],[c,uv[2]],[d,uv[3]]]){A.p.push(v[0],v[1],v[2]);A.n.push(nrm[0],nrm[1],nrm[2]);A.u.push(t[0],t[1])}
  L.push(base,base+1,base+2,base,base+2,base+3);
}
function accBox(A,grp,x0,y0,z0,x1,y1,z1,uvScale=1,roofGrp=null,uo=0){
  const us=uvScale;
  const wallU=(len)=>len/6*us, wallV=(h)=>h/12*us;
  // walls: +z (south), -z (north), +x (east), -x (west)
  accQuad(A,grp,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],[[uo,wallV(y0)],[uo+wallU(x1-x0),wallV(y0)],[uo+wallU(x1-x0),wallV(y1)],[uo,wallV(y1)]]);
  accQuad(A,grp,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],[[uo,wallV(y0)],[uo+wallU(x1-x0),wallV(y0)],[uo+wallU(x1-x0),wallV(y1)],[uo,wallV(y1)]]);
  accQuad(A,grp,[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],[[uo,wallV(y0)],[uo+wallU(z1-z0),wallV(y0)],[uo+wallU(z1-z0),wallV(y1)],[uo,wallV(y1)]]);
  accQuad(A,grp,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],[[uo,wallV(y0)],[uo+wallU(z1-z0),wallV(y0)],[uo+wallU(z1-z0),wallV(y1)],[uo,wallV(y1)]]);
  accQuad(A,roofGrp||grp,[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],[[x0/8,z1/8],[x1/8,z1/8],[x1/8,z0/8],[x0/8,z0/8]]);
}
function accMesh(A,materials,order){
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(A.u,2));
  const all=[];let start=0;
  order.forEach((k,mi)=>{const L=A.g[k]||[];for(const v of L)all.push(v);geo.addGroup(start,L.length,mi);start+=L.length});
  geo.setIndex(all);geo.computeBoundingSphere();
  return new THREE.Mesh(geo,materials);
}
function groundTexture(){
  const PPT=16; // pixels per tile (4 px per metre)
  return canvasTex(MW*PPT,MH*PPT,(g,w,h)=>{
    const R3=mulberry(7);
    for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
      const t=map[idx(x,y)],X=x*PPT,Y=y*PPT;
      if(t===ROAD){g.fillStyle=`rgba(${22+R3()*6|0},${23+R3()*6|0},${30+R3()*6|0},.78)`;g.fillRect(X,Y,PPT,PPT)}
      else if(t===SIDE||t===PLAZA){g.fillStyle=t===PLAZA?'rgba(40,34,48,.9)':'rgba(44,44,58,.9)';g.fillRect(X,Y,PPT,PPT);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(X,Y,PPT,1);g.fillRect(X,Y,1,PPT);g.fillRect(X+PPT/2,Y,1,PPT)}
      else if(t===ALLEY){g.fillStyle='rgba(30,26,36,.88)';g.fillRect(X,Y,PPT,PPT)}
      else if(t===GRASS){g.fillStyle=`rgb(${14+R3()*8|0},${34+R3()*14|0},${26+R3()*8|0})`;g.fillRect(X,Y,PPT,PPT)}
      else if(t===WATER){g.fillStyle='rgba(6,14,26,.28)';g.fillRect(X,Y,PPT,PPT)}
      else{g.fillStyle='#0b0b10';g.fillRect(X,Y,PPT,PPT)}
    }
    // puddles on roads
    for(let i=0;i<2600;i++){const x=R3()*w,y=R3()*h;if(map[idx(Math.floor(x/PPT),Math.floor(y/PPT))]!==ROAD)continue;g.fillStyle='rgba(8,10,18,.35)';g.beginPath();g.ellipse(x,y,6+R3()*18,3+R3()*8,R3()*3,0,7);g.fill()}
    // markings
    const s=PPT/TILE;
    for(const r of ROADS){
      const cross=r.cross.map(X=>r.hz?[X.x*PPT,(X.x+X.w)*PPT]:[X.y*PPT,(X.y+X.h)*PPT]).sort((a,b)=>a[0]-b[0]);
      const a0=(r.hz?r.x:r.y)*PPT,a1=(r.hz?r.x+r.w:r.y+r.h)*PPT;let segs=[],st=a0;for(const c of cross){if(c[0]>st)segs.push([st,c[0]]);st=Math.max(st,c[1])}if(st<a1)segs.push([st,a1]);
      g.fillStyle='rgba(200,150,40,.42)';
      for(const[a,b]of segs){if(r.hz){const cy=(r.y+r.h/2)*PPT;g.fillRect(a,cy-2.5,b-a,1.6);g.fillRect(a,cy+1,b-a,1.6)}else{const cx=(r.x+r.w/2)*PPT;g.fillRect(cx-2.5,a,1.6,b-a);g.fillRect(cx+1,a,1.6,b-a)}}
      g.fillStyle='rgba(200,200,215,.3)';
      for(const[a,b]of segs){if(b-a<PPT*2)continue;if(r.hz&&r.h>=3){for(const f of[.25,.75]){const y=(r.y+r.h*f)*PPT;if(Math.abs(f-.5)<.1)continue;for(let x=a+8;x<b-8;x+=24)g.fillRect(x,y-.8,12,1.6)}}}
      g.fillStyle='rgba(200,200,215,.38)';
      for(const c of cross){for(const edge of[c[0]-14,c[1]+4]){if(edge<a0||edge>a1-10)continue;if(r.hz){for(let y=r.y*PPT+2;y<(r.y+r.h)*PPT-2;y+=6)g.fillRect(edge,y,10,3)}else{for(let x=r.x*PPT+2;x<(r.x+r.w)*PPT-2;x+=6)g.fillRect(x,edge,3,10)}}}
    }
    // shelter yard painted markings
    g.strokeStyle='rgba(255,179,71,.5)';g.lineWidth=3;g.setLineDash([10,8]);g.strokeRect(47*PPT+4,55*PPT+4,14*PPT-8,6*PPT-8);g.setLineDash([]);
    void s;
  },{aniso:8});
}
function radialTex(inner,outer){return canvasTex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,inner);gr.addColorStop(.4,inner.replace(/[\d.]+\)$/,'0.35)'));gr.addColorStop(1,outer);g.fillStyle=gr;g.fillRect(0,0,128,128)})}

function buildCity(scene,quality){
  atlasInit();
  // ground + reflections
  const gtex=groundTexture();
  const gmat=new THREE.MeshStandardMaterial({map:gtex,roughness:.42,metalness:.2,transparent:quality.reflect,depthWrite:true});
  if(!quality.reflect)gmat.color.set('#c8c8d8');
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(WX,WZ),gmat);ground.rotation.x=-Math.PI/2;ground.position.set(WX/2,0,WZ/2);ground.renderOrder=1;scene.add(ground);
  if(quality.reflect&&THREE.Reflector){
    const refl=new THREE.Reflector(new THREE.PlaneGeometry(WX,WZ),{textureWidth:Math.floor(innerWidth*.5),textureHeight:Math.floor(innerHeight*.5),color:0x8a8aa0,clipBias:.003});
    refl.rotation.x=-Math.PI/2;refl.position.set(WX/2,-.05,WZ/2);scene.add(refl);CITY.refl=refl;
  }
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshBasicMaterial({color:'#05060a'}));outer.rotation.x=-Math.PI/2;outer.position.set(WX/2,-.3,WZ/2);scene.add(outer);
  // buildings
  const types=['conc','brick','glass','omni'];const mats={},acc={};
  for(const t of types)for(const v of[0,1]){const tx=facadeTextures(t,v);
    mats[t+v]=[new THREE.MeshStandardMaterial({map:tx.map,emissiveMap:tx.emi,emissive:new THREE.Color('#ffffff'),emissiveIntensity:t==='omni'?1.6:1.25,roughness:t==='glass'?.35:.85,metalness:t==='glass'?.6:.05}),
      new THREE.MeshStandardMaterial({color:t==='brick'?'#2a1512':'#121219',roughness:.9})];acc[t+v]=Acc()}
  const roofProps=[];
  for(const b of B){
    const x0=b.x*TILE,z0=b.y*TILE,x1=(b.x+b.w)*TILE,z1=(b.y+b.h)*TILE,key=b.type+b.variant;
    accBox(acc[key],'w',x0,0,z0,x1,b.ht,z1,1,'r',b.uoff);
    if(b.type!=='omni'&&b.ht>9){const n=1+Math.floor(RNG()*3);for(let i=0;i<n;i++)roofProps.push([rr(x0+2,x1-3),b.ht,rr(z0+2,z1-3),rr(1.2,3),rr(.8,2.2),rr(1.2,3)])}
    if(b.ht>40&&RNG()<.5)roofProps.push([(x0+x1)/2,b.ht,(z0+z1)/2,.25,rr(6,14),.25]);
  }
  for(const k in acc){const m=accMesh(acc[k],mats[k],['w','r']);scene.add(m)}
  // roof props (instanced boxes)
  const rp=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:'#1b1b24',roughness:.8}),roofProps.length);
  const M4=new THREE.Matrix4();roofProps.forEach((p,i)=>{M4.compose(new THREE.Vector3(p[0],p[1]+p[4]/2,p[2]),new THREE.Quaternion(),new THREE.Vector3(p[3],p[4],p[5]));rp.setMatrixAt(i,M4)});scene.add(rp);
  // ground-floor storefront glow strips (emissive) on buildings facing sidewalks
  const shop=Acc();const shopCols=[];
  // signs
  const signs=Acc();
  for(const b of B){
    if(!b.sign)continue;
    const faces=[];
    const cx=b.x+b.w/2,cy=b.y+b.h/2;
    if(walkT(tileAt(Math.floor(cx),b.y+b.h)))faces.push('s');
    if(walkT(tileAt(Math.floor(cx),b.y-1)))faces.push('n');
    if(walkT(tileAt(b.x+b.w,Math.floor(cy))))faces.push('e');
    if(walkT(tileAt(b.x-1,Math.floor(cy))))faces.push('w');
    if(!faces.length)continue;
    const f=faces[Math.floor(RNG()*faces.length)];
    const vertical=!b.omni&&!b.shelter&&RNG()<.45&&[...b.sign].length<=4;
    const cell=signCell(b.sign,b.signCol,vertical);
    const x0=b.x*TILE,z0=b.y*TILE,x1=(b.x+b.w)*TILE,z1=(b.y+b.h)*TILE;
    let w,h,y;
    if(vertical){w=1.6;h=Math.min(b.ht-3,6.5);y=clamp(b.ht*.5,4,b.ht-h/2-.5)}
    else{const along=(f==='s'||f==='n')?(x1-x0):(z1-z0);w=Math.min(along*.8,b.omni?36:9);h=w/cell.aspect;y=b.omni?b.ht-12:Math.min(b.ht-h/2-.4,rr(4.5,7))}
    const off=.25;
    const uv=[[cell.u0,cell.v0],[cell.u1,cell.v0],[cell.u1,cell.v1],[cell.u0,cell.v1]];
    const pos=vertical?rr(.15,.35):.5;
    if(f==='s'){const cxw=lerp(x0,x1,pos),z=z1+off;accQuad(signs,'s',[cxw-w/2,y-h/2,z],[cxw+w/2,y-h/2,z],[cxw+w/2,y+h/2,z],[cxw-w/2,y+h/2,z],[0,0,1],uv)}
    if(f==='n'){const cxw=lerp(x1,x0,pos),z=z0-off;accQuad(signs,'s',[cxw+w/2,y-h/2,z],[cxw-w/2,y-h/2,z],[cxw-w/2,y+h/2,z],[cxw+w/2,y+h/2,z],[0,0,-1],uv)}
    if(f==='e'){const czw=lerp(z1,z0,pos),x=x1+off;accQuad(signs,'s',[x,y-h/2,czw+w/2],[x,y-h/2,czw-w/2],[x,y+h/2,czw-w/2],[x,y+h/2,czw+w/2],[1,0,0],uv)}
    if(f==='w'){const czw=lerp(z0,z1,pos),x=x0-off;accQuad(signs,'s',[x,y-h/2,czw-w/2],[x,y-h/2,czw+w/2],[x,y+h/2,czw+w/2],[x,y+h/2,czw-w/2],[-1,0,0],uv)}
    b.signFace=f;
    // shop strip
    const sc=new THREE.Color(b.signCol);
    if(!b.omni){if(f==='s')accQuad(shop,'s',[x0+1,.2,z1+.05],[x1-1,.2,z1+.05],[x1-1,3,z1+.05],[x0+1,3,z1+.05],[0,0,1],[[0,0],[1,0],[1,1],[0,1]]);
      else if(f==='n')accQuad(shop,'s',[x1-1,.2,z0-.05],[x0+1,.2,z0-.05],[x0+1,3,z0-.05],[x1-1,3,z0-.05],[0,0,-1],[[0,0],[1,0],[1,1],[0,1]]);
      else if(f==='e')accQuad(shop,'s',[x1+.05,.2,z1-1],[x1+.05,.2,z0+1],[x1+.05,3,z0+1],[x1+.05,3,z1-1],[1,0,0],[[0,0],[1,0],[1,1],[0,1]]);
      else accQuad(shop,'s',[x0-.05,.2,z0+1],[x0-.05,.2,z1-1],[x0-.05,3,z1-1],[x0-.05,3,z0+1],[-1,0,0],[[0,0],[1,0],[1,1],[0,1]]);
      for(let k=0;k<4;k++)shopCols.push(sc.r*.55,sc.g*.55,sc.b*.55)}
  }
  ATLAS.tex=new THREE.CanvasTexture(ATLAS.c);ATLAS.tex.encoding=THREE.sRGBEncoding;ATLAS.tex.anisotropy=4;
  const smat=new THREE.MeshBasicMaterial({map:ATLAS.tex,transparent:true,toneMapped:false,side:THREE.DoubleSide,depthWrite:false});
  smat.color.setScalar(1.35);
  const sm=accMesh(signs,[smat],['s']);sm.renderOrder=3;scene.add(sm);CITY.signMat=smat;
  const shopTex=canvasTex(64,64,g=>{const gr=g.createLinearGradient(0,64,0,0);gr.addColorStop(0,'#fff');gr.addColorStop(.35,'#999');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,64,64);g.fillStyle='rgba(0,0,0,.6)';for(let x=0;x<64;x+=16)g.fillRect(x,0,2,64)});
  const shopGeo=accMesh(shop,[new THREE.MeshBasicMaterial({map:shopTex,vertexColors:true,toneMapped:false})],['s']);
  shopGeo.geometry.setAttribute('color',new THREE.Float32BufferAttribute(shopCols,3));scene.add(shopGeo);
  // OMNI crown ring
  const ob=OMNI_B,ocx=(ob.x+ob.w/2)*TILE,ocz=(ob.y+ob.h/2)*TILE;
  const ringMat=new THREE.MeshBasicMaterial({color:'#ff2e88',toneMapped:false});ringMat.color.multiplyScalar(2);
  CITY.omniRings=[];
  for(let k=0;k<3;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(22+k*6,.35,6,64),ringMat);r.position.set(ocx,ob.ht+8+k*6,ocz);r.rotation.x=Math.PI/2+.2*k;scene.add(r);CITY.omniRings.push(r)}
  const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,30,6),new THREE.MeshBasicMaterial({color:'#ff2e88',toneMapped:false}));beacon.position.set(ocx,ob.ht+15,ocz);scene.add(beacon);
  // quarantine walls on the north and east edges
  const wallMat=new THREE.MeshStandardMaterial({color:'#1b1d26',roughness:.9});const holo=new THREE.MeshBasicMaterial({color:'#ff2e88',transparent:true,opacity:.25,toneMapped:false,side:THREE.DoubleSide,depthWrite:false});
  const wN=new THREE.Mesh(new THREE.BoxGeometry(WX,7,1.2),wallMat);wN.position.set(WX/2,3.5,-.6);scene.add(wN);
  const wE=new THREE.Mesh(new THREE.BoxGeometry(1.2,7,WZ),wallMat);wE.position.set(WX+.6,3.5,WZ/2);scene.add(wE);
  const hN=new THREE.Mesh(new THREE.PlaneGeometry(WX,14),holo);hN.position.set(WX/2,14,-.8);scene.add(hN);
  const hE=new THREE.Mesh(new THREE.PlaneGeometry(WZ,14),holo);hE.rotation.y=Math.PI/2;hE.position.set(WX+.8,14,WZ/2);scene.add(hE);
  // Line 2 viaduct
  const deckY=8.5,z0=37.15*TILE,z1=38.85*TILE;
  const deck=new THREE.Mesh(new THREE.BoxGeometry(143*TILE,1.2,z1-z0),new THREE.MeshStandardMaterial({color:'#20222c',roughness:.8}));deck.position.set(143*TILE/2,deckY,(z0+z1)/2);scene.add(deck);
  const stripe=new THREE.MeshBasicMaterial({color:'#00c060',toneMapped:false});
  for(const zz of[z0-.05,z1+.05]){const s=new THREE.Mesh(new THREE.BoxGeometry(143*TILE,.18,.08),stripe);s.position.set(143*TILE/2,deckY-.3,zz);scene.add(s)}
  const pil=new THREE.InstancedMesh(new THREE.BoxGeometry(1.4,deckY,1.4),new THREE.MeshStandardMaterial({color:'#262833',roughness:.85}),30);let pi=0;
  for(let x=10;x<143*TILE&&pi<30;x+=20){M4.makeTranslation(x,deckY/2,(z0+z1)/2);pil.setMatrixAt(pi++,M4)}pil.count=pi;scene.add(pil);
  for(const[sx,ex,nm]of[[82,92,'성수 SEONGSU'],[38,46,'뚝섬 TTUKSEOM']]){
    const plat=new THREE.Mesh(new THREE.BoxGeometry((ex-sx)*TILE,.8,(z1-z0)+6),new THREE.MeshStandardMaterial({color:'#2a2d38',roughness:.7}));plat.position.set((sx+ex)/2*TILE,deckY+.2,(z0+z1)/2);scene.add(plat);
    const roof=new THREE.Mesh(new THREE.BoxGeometry((ex-sx)*TILE,.3,(z1-z0)+7),new THREE.MeshStandardMaterial({color:'#15171e'}));roof.position.set((sx+ex)/2*TILE,deckY+5,(z0+z1)/2);scene.add(roof);
    const cell=signCell(nm,'#3dff9b',false);
    const sg=new THREE.PlaneGeometry(14,14/cell.aspect);const uv=sg.attributes.uv;uv.setXY(0,cell.u0,cell.v1);uv.setXY(1,cell.u1,cell.v1);uv.setXY(2,cell.u0,cell.v0);uv.setXY(3,cell.u1,cell.v0);
    for(const side of[-1,1]){const s=new THREE.Mesh(sg,smat);s.position.set((sx+ex)/2*TILE,deckY+3.5,(z0+z1)/2+side*((z1-z0)/2+3.6));if(side<0)s.rotation.y=Math.PI;scene.add(s)}
  }
  // trains
  const carTex=canvasTex(256,64,g=>{g.fillStyle='#c8ced9';g.fillRect(0,0,256,64);g.fillStyle='#00a84d';g.fillRect(0,40,256,8);g.fillStyle='#fff3c4';for(let x=10;x<250;x+=30)g.fillRect(x,12,20,20)});
  const carEmi=canvasTex(256,64,g=>{g.fillStyle='#000';g.fillRect(0,0,256,64);g.fillStyle='#fff3c4';for(let x=10;x<250;x+=30)g.fillRect(x,12,20,20);g.fillStyle='#00ff80';g.fillRect(0,40,256,8)});
  const trainMat=new THREE.MeshStandardMaterial({map:carTex,emissiveMap:carEmi,emissive:'#ffffff',emissiveIntensity:1.1,roughness:.5,metalness:.4});
  CITY.trains=[];
  for(const[zz,dir,x] of[[37.55*TILE,-1,100],[38.45*TILE,1,400]]){const g=new THREE.Group();for(let k=0;k<6;k++){const c=new THREE.Mesh(new THREE.BoxGeometry(17.5,3.2,2.9),trainMat);c.position.set(-dir*k*18.2,0,0);g.add(c)}g.position.set(x,deckY+2.2,zz);scene.add(g);CITY.trains.push({g,dir})}
  // street lamps + ground glow
  const lamps=[];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(map[idx(x,y)]!==SIDE)continue;let nr=false;for(let d=0;d<4;d++)if(tileAt(x+DXS[d],y+DZS[d])===ROAD)nr=true;if(nr&&(x*7+y*13)%9===0)lamps.push([(x+.5)*TILE,(y+.5)*TILE,(x+y)%5===0?'#8ff4ff':'#ffb347'])}
  const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.12,6,6),new THREE.MeshStandardMaterial({color:'#22242e'}),lamps.length);
  const head=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.18,.9),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),lamps.length);
  const glowT=radialTex('rgba(255,255,255,1)','rgba(0,0,0,0)');
  const pool=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glowT,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,vertexColors:false,toneMapped:false}),lamps.length);
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0));const col=new THREE.Color();
  lamps.forEach((l,i)=>{M4.makeTranslation(l[0],3,l[1]);pole.setMatrixAt(i,M4);M4.makeTranslation(l[0],6,l[1]);head.setMatrixAt(i,M4);col.set(l[2]).multiplyScalar(1.6);head.setColorAt(i,col);
    M4.compose(new THREE.Vector3(l[0],.06,l[1]),q,new THREE.Vector3(12,12,1));pool.setMatrixAt(i,M4);col.set(l[2]).multiplyScalar(.28);pool.setColorAt(i,col)});
  pool.renderOrder=2;scene.add(pole,head,pool);
  // sign light pools on the ground
  const sp=[];for(const b of B){if(!b.signFace||b.omni)continue;const x0=b.x*TILE,z0=b.y*TILE,x1=(b.x+b.w)*TILE,z1=(b.y+b.h)*TILE;
    const p=b.signFace==='s'?[(x0+x1)/2,z1+3]:b.signFace==='n'?[(x0+x1)/2,z0-3]:b.signFace==='e'?[x1+3,(z0+z1)/2]:[x0-3,(z0+z1)/2];sp.push([p[0],p[1],b.signCol])}
  const spool=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),pool.material,sp.length);
  sp.forEach((l,i)=>{M4.compose(new THREE.Vector3(l[0],.07,l[1]),q,new THREE.Vector3(10,10,1));spool.setMatrixAt(i,M4);col.set(l[2]).multiplyScalar(.35);spool.setColorAt(i,col)});spool.renderOrder=2;scene.add(spool);
  // trees
  const trees=[];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const t=map[idx(x,y)];
    if(t===GRASS){let nr=false;for(let d=0;d<4;d++)if(tileAt(x+DXS[d],y+DZS[d])===ROAD)nr=true;if(!nr&&RNG()<(x<30&&y<86?.5:.14))trees.push([(x+rr(.2,.8))*TILE,(y+rr(.2,.8))*TILE,rr(.8,1.4)])}
    else if(t===SIDE&&(x*11+y*5)%23===0&&x>34)trees.push([(x+.5)*TILE,(y+.5)*TILE,rr(.6,.8)])}
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.3,3,5),new THREE.MeshStandardMaterial({color:'#2a2018',roughness:1}),trees.length);
  const leaf=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.4,0),new THREE.MeshStandardMaterial({color:'#123a2a',roughness:.9,flatShading:true}),trees.length);
  trees.forEach((t,i)=>{const s=t[2];M4.compose(new THREE.Vector3(t[0],1.5*s,t[1]),new THREE.Quaternion(),new THREE.Vector3(s,s,s));trunk.setMatrixAt(i,M4);M4.compose(new THREE.Vector3(t[0],4*s,t[1]),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,RNG()*6,0)),new THREE.Vector3(s,s*1.15,s));leaf.setMatrixAt(i,M4)});
  scene.add(trunk,leaf);CITY.trees=trees;
  // barricades, burning barrels, sandbags scattered around the quarantine zone
  const barrels=[];for(let i=0;i<70;i++){const x=Math.floor(rr(4,146)),y=Math.floor(rr(2,94));if(map[idx(x,y)]===SIDE||map[idx(x,y)]===PLAZA)barrels.push([(x+rr(.2,.8))*TILE,(y+rr(.2,.8))*TILE])}
  barrels.push([LOC.raiderYard.x+3,LOC.raiderYard.z],[LOC.raiderYard.x-6,LOC.raiderYard.z+3],[LOC.pier.x,LOC.pier.z-12],[LOC.shelter.x-6,LOC.shelter.z+2]);
  const bar=new THREE.InstancedMesh(new THREE.CylinderGeometry(.35,.35,1,8),new THREE.MeshStandardMaterial({color:'#3a2a20',roughness:.8,metalness:.4}),barrels.length);
  barrels.forEach((b,i)=>{M4.makeTranslation(b[0],.5,b[1]);bar.setMatrixAt(i,M4)});scene.add(bar);CITY.barrels=barrels;
  // water surface tint for the Han and the stream (additive shimmer)
  const wtex=canvasTex(256,256,g=>{g.fillStyle='#000';g.fillRect(0,0,256,256);g.strokeStyle='rgba(120,160,255,.25)';for(let i=0;i<120;i++){const y=Math.random()*256,x=Math.random()*256;g.beginPath();g.moveTo(x,y);g.lineTo(x+10+Math.random()*30,y);g.stroke()}},{repeat:1});
  wtex.repeat.set(40,6);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(WX,14*TILE),new THREE.MeshBasicMaterial({map:wtex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));water.rotation.x=-Math.PI/2;water.position.set(WX/2,.08,(96+7)*TILE);scene.add(water);CITY.water=wtex;
  // Seongsu bridge silhouette across the Han (landmark in the distance)
  const bridge=new THREE.Mesh(new THREE.BoxGeometry(WX,1.5,10),new THREE.MeshStandardMaterial({color:'#1a1c26'}));bridge.position.set(WX/2,9,(104)*TILE);scene.add(bridge);
  const bl=new THREE.Mesh(new THREE.BoxGeometry(WX,.2,.2),new THREE.MeshBasicMaterial({color:'#ffb347',toneMapped:false}));bl.position.set(WX/2,9.8,104*TILE-5);scene.add(bl);
  ATLAS.tex.needsUpdate=true;
}
/* minimap base image: 3 px per tile */
function minimapImage(){
  const c=document.createElement('canvas');c.width=MW*3;c.height=MH*3;const g=c.getContext('2d');
  const MC={[ROAD]:'#4c5068',[SIDE]:'#262838',[BLD]:'#101119',[GRASS]:'#12331f',[WATER]:'#0b2742',[PLAZA]:'#302840',[ALLEY]:'#1d1a28'};
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){g.fillStyle=MC[map[idx(x,y)]]||'#111';g.fillRect(x*3,y*3,3,3)}
  for(const b of B){g.fillStyle=b.omni?'#5a1a44':b.shelter?'#6a3a14':b.type==='brick'?'#331a16':'#191a26';g.fillRect(b.x*3+1,b.y*3+1,b.w*3-2,b.h*3-2)}
  g.fillStyle='#00a84d';g.fillRect(0,37.6*3,143*3,2);
  return c;
}
