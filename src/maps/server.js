// Map 2: NEON SERVER CITY. Purple box towers, a lit monolith, terraced slabs, floating UI windows, toxic data-spill rivers.
import * as THREE from 'three';
import {PALETTE} from '../style.js';
import {sstep,fbm,ridge,vn,hash} from '../mapkit.js';

const riverX=z=>26*Math.sin(z*.04+.5)+8*Math.sin(z*.105);
const riverW=z=>6.5+2*Math.sin(z*.07+1);
const BED=-1.7;
const quant=(v,s)=>{const q=v/s;return s*(Math.floor(q)+sstep(.45,1,q-Math.floor(q)))};
function heightAt(x,z){
  const d=Math.abs(x-riverX(z)),w=riverW(z);
  const endF=1-sstep(98,120,Math.abs(z));
  const n=fbm(x*.017+3,z*.017+1.3);
  const base=3.4+quant(Math.max(0,n-.25)*7,1.05)+fbm(x*.09,z*.09)*.35;
  const r=Math.hypot(x,z);
  const mw=sstep(100,145,r)*sstep(25,60,r);
  const M=mw*(6+quant(46*ridge(x*.012+7,z*.012+2),7));
  const bed=sstep(w,w+10,d);
  const land=base+M+sstep(w+4,w+22,d)*1.2*vn(x*.1,z*.1);
  const bm=(1-bed)*endF;
  return land*(1-bm)+BED*bm;
}
const cA=new THREE.Color(0x2a1a5e),cB=new THREE.Color(0x3a2a86),cTile=new THREE.Color(0x1a0f48),cWet=new THREE.Color(0x24166a),cDeep=new THREE.Color(0x0e0838),cHigh=new THREE.Color(0x6a4ad0),cSlope=new THREE.Color(0x1c1250);

const MAT_NOISE='float hz(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}';
function panelTex(kind,hue){
  const c=document.createElement('canvas');c.width=256;c.height=160;const g=c.getContext('2d');
  const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
  const gr=g.createLinearGradient(0,0,0,160);gr.addColorStop(0,hue[0]);gr.addColorStop(1,hue[1]);
  rr(6,6,244,148,22);g.fillStyle=gr;g.fill();g.lineWidth=7;g.strokeStyle='#e8f4ff';g.stroke();
  rr(2,2,252,156,26);g.lineWidth=4;g.strokeStyle='#07061c';g.stroke();
  g.fillStyle='rgba(255,255,255,.9)';[26,44,62].forEach((x,i)=>{g.beginPath();g.arc(x,26,5,0,7);g.fillStyle=['#ff4ad8','#ffe14a','#4affd8'][i];g.fill()});
  g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=8;g.lineJoin='round';g.lineCap='round';
  if(kind==='image'){g.beginPath();g.moveTo(54,126);g.lineTo(104,70);g.lineTo(136,104);g.lineTo(162,82);g.lineTo(204,126);g.closePath();g.stroke();g.beginPath();g.arc(178,64,10,0,7);g.fill()}
  if(kind==='play'){g.beginPath();g.moveTo(98,60);g.lineTo(98,132);g.lineTo(162,96);g.closePath();g.stroke();g.fillStyle='rgba(255,255,255,.35)';g.fill()}
  if(kind==='cube'){const q=(a,b)=>[128+a,96+b];g.beginPath();[[0,-40],[38,-20],[38,22],[0,42],[-38,22],[-38,-20]].forEach((p,i)=>g[i?'lineTo':'moveTo'](...q(...p)));g.closePath();g.stroke();g.beginPath();g.moveTo(...q(-38,-20));g.lineTo(...q(0,0));g.lineTo(...q(38,-20));g.moveTo(...q(0,0));g.lineTo(...q(0,42));g.stroke()}
  if(kind==='text'){g.lineWidth=9;[[44,70,150],[44,96,210],[44,122,120]].forEach(l=>{g.beginPath();g.moveTo(l[0],l[1]);g.lineTo(l[2],l[1]);g.stroke()})}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

export default {
  id:'server',name:'NEON SERVER CITY',short:'SERVER',blurb:'BOX TOWERS / DATA-SPILL STREAMS / THE CORRUPTED MAINFRAME',accent:'#b06bff',
  bounds:120,heightAt,
  fog:{color:0x1c0e48,near:85,far:430},background:0x0c0624,
  lights:[{type:'hemi',sky:0x7a5cff,ground:0x2a0a60,i:.7},{type:'dir',color:0xc8b4ff,i:1.45,pos:[-50,80,-60]},{type:'dir',color:0xff2dd0,i:.75,pos:[60,30,70]},{type:'dir',color:0x39e8ff,i:.35,pos:[0,20,-80]}],
  sky:{top:[.01,.008,.09],mid:[.09,.04,.3],hor:[.45,.12,.62],gnd:[.07,.03,.2],moonDir:[.5,.36,-1],moonCol:[.75,.45,1],halo:[.65,.2,.95],moonSize:.3,moon:1,aurora:1,aurA:[.1,.85,1],aurB:[1,.2,.8],
    extra:`
vec3 skyExtra(vec3 d,vec3 c){
  float h=d.y,a=atan(d.z,d.x);
  c+=vec3(.55,.12,.75)*exp(-abs(h-.03)*13.)*.4;
  vec3 M=normalize(vec3(.5,.36,-1.));
  float md=dot(d,M);
  if(md>.955){float sl=step(.55,fract(h*150.+floor(uT*3.)*.37));float gl=step(.93,h21(vec2(floor(h*150.),floor(uT*4.))));c=mix(c,c*vec3(.55,.5,.9),sl*.4);c+=vec3(1.,.2,.8)*gl*.5*step(.97,md);}
  float row=floor(h*90.);float band=step(.992,h21(vec2(row,floor(uT*1.5))))*smoothstep(.02,.2,h)*(1.-smoothstep(.5,.8,h));
  c+=vec3(.2,.9,1.)*band*.35*step(.5,fbmz(vec2(a*12.,row)));
  return c;
}`},
  water:{
    sl0:[.1,.015,.2],sl1:[.38,.04,.5],slMax:[.85,.5,.95],crack:[.35,1,.15],ring:[1,.25,.9],edge:[1,.1,.65],
    cl0:[0,.62,.72],cl1:[.08,.92,.95],streak:[.8,1,1],foam:[.8,1,1],fz0:[.35,1,.95],fz1:[.3,.6,1],far:[.2,.07,.32],farCl:[.1,.6,.8],
    extra:`
vec3 waterExtra(vec3 c,vec2 p,vec3 w,float m){
  vec2 q=vec2(w.x*1.1,w.z*.8-uT*(.9+m*.8));vec2 cell=floor(q),f=fract(q);
  float col=step(.78-m*.1,h21(vec2(cell.x,floor(q.y*.25)+7.)));
  vec2 g=floor(f*vec2(3.,5.));float bit=step(.5,h21(cell+g*.37+floor(uT*(2.+m*3.)*h21(cell))));
  float inner=step(.14,f.x)*step(f.x,.86)*step(.1,f.y)*step(f.y,.9)*step(.12,fract(f.x*3.))*step(.15,fract(f.y*5.));
  float gl=col*bit*inner;
  vec3 gc=mix(vec3(.55,1.,.2),vec3(.85,1.,1.),m);
  c=mix(c,gc,gl*(.45+.2*m));
  float blk=step(.97,h21(vec2(floor(w.x*.5),floor(w.z*.7-uT*2.)+floor(uT*3.))));
  c=mix(c,mix(vec3(1.,.15,.85),vec3(.5,1.,1.),m),blk*.5);
  c*=.88+.12*sin(w.z*9.-uT*3.);
  return c;
}`},
  river:{x:riverX,w:riverW,zb:[-90,-45,0,45,90],radius:20,waterY:-.45},
  terrain:{size:560,seg:420,hatchTint:0x2a1070,
    rock:{c1:0x1c1250,c2:0x2e1c78,c3:0x5a30a8,vein:0x39e8ff,veinAmt:.95,thr:.42,hi:.1},
    colorAt(x,y,z,slope,c){
      c.copy(cA).lerp(cB,sstep(.45,.7,vn(x*.04,z*.04)));
      const t=((Math.floor(x/7)+Math.floor(z/7))&1);c.lerp(cTile,t*.45);
      c.lerp(cHigh,sstep(18,50,y)*.5);c.lerp(cSlope,sstep(.12,.45,slope)*.8);
      c.lerp(cWet,(1-sstep(-1.4,1.4,y))*.8);c.lerp(cDeep,(1-sstep(-2,-1.2,y)));
    }},
  enemy:{impHp:1.25,golemHp:1.3,dmg:1.2,speed:1.08,impBase:5,golemExtra:1,bossHp:900,bossDmg:1.2},
  boss:{name:'CORRUPTED MAINFRAME',tint:0xc070ff,glow:0xff2dd0,variant:'data',rise:'THE CORRUPTED MAINFRAME BOOTS',fall:'MAINFRAME OFFLINE'},
  intro:['SERVER CITY ONLINE','PURGE THE DATA SPILLS (FOLLOW THE GREEN BEACON)'],
  thumb:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1050"/><stop offset="1" stop-color="#4a2a9a"/></linearGradient><linearGradient id="mg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1250"/><stop offset=".5" stop-color="#2a1a78"/><stop offset="1" stop-color="#140c3c"/></linearGradient></defs>
<rect width="240" height="120" fill="url(#sg)"/><circle cx="196" cy="24" r="12" fill="#c890ff" stroke="#07061c" stroke-width="2"/>
<g stroke="#07061c" stroke-width="2" stroke-linejoin="round"><rect x="8" y="46" width="22" height="56" fill="#6a3ae0"/><rect x="26" y="62" width="20" height="40" fill="#8a4af0"/><rect x="62" y="56" width="22" height="46" fill="#7a42e8"/><rect x="156" y="52" width="22" height="50" fill="#7a42e8"/><rect x="176" y="34" width="14" height="68" fill="#6a3ae0"/><rect x="200" y="46" width="26" height="56" fill="#8a4af0"/><rect x="190" y="70" width="18" height="32" fill="#6a3ae0"/>
<path d="M0 98 L60 90 L96 86 L96 104 L0 104Z" fill="#5a38c0"/><path d="M240 98 L180 90 L144 86 L144 104 L240 104Z" fill="#5a38c0"/><path d="M0 102 L50 96 L96 98 L96 112 L0 112Z" fill="#8a52f0"/><path d="M240 102 L190 96 L144 98 L144 112 L240 112Z" fill="#8a52f0"/>
<path d="M98 104 L100 36 L106 30 L134 30 L140 36 L142 104Z" fill="url(#mg)"/><rect x="106" y="40" width="28" height="60" fill="#120a38" stroke="none"/></g>
<g fill="#ffd8ff"><rect x="112" y="46" width="3" height="3"/><rect x="120" y="46" width="3" height="3"/><rect x="116" y="56" width="3" height="3"/><rect x="124" y="66" width="3" height="3"/><rect x="112" y="76" width="3" height="3"/><rect x="120" y="86" width="3" height="3"/></g>
<g fill="#39e8ff"><rect x="30" y="92" width="6" height="3"/><rect x="42" y="92" width="6" height="3"/><rect x="186" y="92" width="6" height="3"/><rect x="198" y="92" width="6" height="3"/></g>
<g stroke="#07061c" stroke-width="2"><rect x="26" y="24" width="38" height="24" rx="6" fill="#8a5cff"/><path d="M34 42 L42 32 L48 38 L52 34 L58 42Z" fill="#fff" stroke="none"/><rect x="170" y="22" width="36" height="22" rx="6" fill="#7a4cf5"/><path d="M182 28 L182 38 L194 33Z" fill="#fff" stroke="none"/><rect x="14" y="66" width="30" height="16" rx="5" fill="#8a5cff"/></g>
<rect x="1" y="1" width="238" height="118" fill="none" stroke="#b06bff" stroke-width="2"/></svg>`,
  props(ctx){
    const {THREE,root,uT,heightAt,colliders,crystals,streams,kit}=ctx,{toon,hatch,sstep,hash}=kit;
    const INK=PALETTE.ink;
    // ---- box towers (instanced, window shader keyed on world position) ----
    const boxes=[];
    const addBox=(x,y,z,w,h,d,c,solid)=>boxes.push({x,y,z,w,h,d,c});
    const winMat=hatch(toon(0xffffff,{emissive:0x1a0a50,emissiveIntensity:.25,rim:.5}),{strength:.5,scale:5,tint:0x180850});
    const hp=winMat.onBeforeCompile;
    winMat.onBeforeCompile=(s,r)=>{
      hp(s,r);s.uniforms.uT=uT;
      s.vertexShader=s.vertexShader.replace('void main() {','varying vec3 vWP2;varying vec3 vWN2;\nvoid main() {').replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 wp4=modelMatrix*instanceMatrix*vec4(position,1.);vWP2=wp4.xyz;vWN2=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);');
      s.fragmentShader=s.fragmentShader.replace('void main() {','varying vec3 vWP2;varying vec3 vWN2;uniform float uT;'+MAT_NOISE+'\nvoid main() {').replace('#include <opaque_fragment>',`{
        vec3 n=normalize(vWN2);float sideF=1.-step(.5,abs(n.y));
        vec2 uv=vec2(vWP2.x*abs(n.z)+vWP2.z*abs(n.x),vWP2.y);
        vec2 sz=vec2(2.6,3.4);vec2 cell=floor(uv/sz),f=fract(uv/sz);
        float k=vWP2.x*abs(n.x)+vWP2.z*abs(n.z);
        float r=hz(cell+floor(k*.37)*13.1+sign(n.x+n.z)*3.);
        float win=step(.18,f.x)*step(f.x,.82)*step(.28,f.y)*step(f.y,.72);
        float on=step(.6,r)*(.75+.25*sin(uT*1.3+r*60.));
        float cp=hz(cell.yx+k*.1);
        vec3 wc=cp<.45?vec3(.35,.95,1.):(cp<.75?vec3(1.,.35,.85):vec3(.95,.9,1.));
        outgoingLight+=wc*win*on*sideF*1.15;
      }
      #include <opaque_fragment>`);
    };
    winMat.customProgramCacheKey=()=>'server-win';
    const pal=[0x4a2a9a,0x3a1f80,0x5a35b0,0x2a1a68,0x6a3ac8];
    // monolith + shoulders
    addBox(0,-10,-128,46,26,46,0x2a1a68);addBox(0,10,-128,30,100,30,0x120a3c);addBox(0,100,-128,22,60,22,0x1a1050);addBox(0,158,-128,12,24,12,0x120a3c);addBox(0,180,-128,3,40,3,0x39e8ff);
    addBox(-30,-10,-110,18,50,18,0x5a35b0);addBox(32,-10,-112,16,64,16,0x4a2a9a);
    // far ring
    for(let i=0;i<64;i++){const a=i/64*Math.PI*2+hash(i,1)*.1,R=150+hash(i,2)*90,w=10+hash(i,3)*14,h=28+Math.pow(hash(i,4),1.5)*80,x=Math.cos(a)*R,z=Math.sin(a)*R;
      if(Math.hypot(x,z+128)<45)continue;addBox(x,-12,z,w,h+12,w*(.7+hash(i,5)*.6),pal[i%5]);
      if(hash(i,6)>.5)addBox(x+w*.15,-12,z,w*.6,h+22,w*.6,pal[(i+2)%5])}
    // ziggurat slabs (solid-ish, off the streams)
    const SLAB=[[-78,-30,0],[80,18,.6],[-70,66,1.2],[74,-72,2.1]];
    SLAB.forEach(([x,z,ry],i)=>{const y=heightAt(x,z)-1.5;
      addBox(x,y,z,22,3.6,14,0x6a3ac8);addBox(x,y+3.6,z,16,3.6,10,0x7a46e0);addBox(x,y+7.2,z,10,3.6,7,0x8a58f0);addBox(x,y+10.8,z,5,5,4,0x4a2a9a);
      colliders.push({x,y:y+3,z,r:9,solid:true},{x,y:y+8,z,r:5,solid:true})});
    // server racks near streams
    const rw=ctx.cfg.river.w,rx=ctx.cfg.river.x;
    for(let i=0;i<16;i++){const z=(hash(i,21)-.5)*190,x=rx(z)+(hash(i,22)<.5?-1:1)*(rw(z)+14+hash(i,23)*38);
      if(Math.hypot(x,z)<26)continue;let ok=true;for(const s of streams)if(Math.hypot(x-s.x,z-s.z)<9)ok=false;if(!ok||Math.abs(x)>105)continue;
      const y=heightAt(x,z)-1,h=7+hash(i,24)*8;addBox(x,y,z,3.6,h,3.6,pal[i%5]);colliders.push({x,y:y+h*.5,z,r:2.6,solid:true})}
    const geo=new THREE.BoxGeometry(1,1,1);geo.translate(0,.5,0);
    const inst=new THREE.InstancedMesh(geo,winMat,boxes.length),
      ink=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:INK,side:THREE.BackSide}),boxes.length),dm=new THREE.Object3D(),cc=new THREE.Color();
    boxes.forEach((b,i)=>{dm.position.set(b.x,b.y,b.z);dm.scale.set(b.w,b.h,b.d);dm.updateMatrix();inst.setMatrixAt(i,dm.matrix);inst.setColorAt(i,cc.setHex(b.c));
      const e=b.w>12?.9:.45;dm.position.y=b.y-e*.5;dm.scale.set(b.w+e*2,b.h+e*2,b.d+e*2);dm.updateMatrix();ink.setMatrixAt(i,dm.matrix)});
    inst.frustumCulled=false;ink.frustumCulled=false;root.add(inst,ink);
    // monolith beacon
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.2,5,150,10,1,true),new THREE.MeshBasicMaterial({color:0x39e8ff,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
    beam.position.set(0,260,-128);root.add(beam);

    // ---- floating UI windows ----
    const kinds=['image','play','cube','text'],hues=[['#8a5cff','#5a2ee0'],['#7a4cf5','#4a2ad0'],['#a060ff','#6a30e0'],['#6a5cff','#3a2ad0']];
    const texs=kinds.map((k,i)=>panelTex(k,hues[i]));
    const pg=new THREE.PlaneGeometry(1,.625),haloM=new THREE.MeshBasicMaterial({color:0xb06bff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false});
    const panels=[];
    const PS=[[-36,20,-40,0],[40,24,-60,1],[-46,18,24,2],[50,22,40,3],[-12,30,-78,1],[10,26,70,0],[-82,34,-4,3],[84,38,-10,2],[-60,58,-100,0],[70,60,-110,1],[0,70,-92,2],[-110,44,50,1]];
    PS.forEach(([x,y,z,k],i)=>{const s=11+hash(i,31)*7;
      const g=new THREE.Group();g.position.set(x,y,z);
      const m=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({map:texs[k],transparent:true,side:THREE.DoubleSide,alphaTest:.05}));m.scale.setScalar(s);
      const h=new THREE.Mesh(pg,haloM);h.scale.setScalar(s*1.35);h.position.z=-.2;
      g.add(m,h);g.lookAt(0,y,0);root.add(g);panels.push({g,y,ph:i*1.7})});

    // ---- floating slabs w/ data spires ----
    const islands=[],imat=kit.islandMat({emissive:0x6a2aff,tint:0x2a1060});
    const IS=[[-60,32,-70,9],[58,40,-38,8],[-72,28,44,8],[62,34,64,10],[0,58,-98,13],[-30,50,10,6],[30,46,-4,6]];
    IS.forEach((q,i)=>{const o=kit.makeIsland(root,q[0],q[1],q[2],q[3],i*3.1,imat,{top:0x5a3ab8,mid:0x2a1a70,under:0x140a40,glow:0xb06bff});
      const sp=new THREE.Mesh(new THREE.CylinderGeometry(.35*q[3]*.4,q[3]*.28,q[3]*3.2,4),toon(0x39e8ff,{emissive:i%2?0xff2dd0:0x18c8ff,emissiveIntensity:1,rim:1}));
      sp.position.y=q[3]*1.6;sp.rotation.y=Math.PI/4;kit.outline(sp,.05);o.m.add(sp);
      const bm=new THREE.Mesh(new THREE.CylinderGeometry(.5,q[3]*.5,q[3]*9,8,1,true),new THREE.MeshBasicMaterial({color:i%2?0xff2dd0:0x39e8ff,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      bm.position.y=q[3]*4.5;o.m.add(bm);islands.push(o)});
    const tube=kit.tetherMaterial(uT,[.35,.15,.9],[.2,1,1]);
    kit.tetherChain(root,IS.slice(0,4).map(q=>new THREE.Vector3(q[0],q[1],q[2])),tube,0x8a4aff);
    kit.tetherLink(root,IS[4],IS[0],tube);kit.tetherLink(root,IS[4],IS[1],tube);kit.tetherLink(root,IS[5],IS[6],tube,10);

    // ---- shards, rocks, skyline, motes ----
    const ck=kit.crystalKit(root,heightAt,colliders,crystals,{colA:0x4af0ff,emA:0x18c8ff,colB:0xff4ad8,emB:0xd01ab0,haloA:0x18c8ff,haloB:0xff2dd0});
    streams.forEach((s,i)=>{const dx=(i%2?1:-1)*(rw(s.z)+9);ck.cluster(s.x+dx,s.z+6,3.2+i*.3,i%2==0);ck.cluster(s.x-dx*.7,s.z-9,2.1,false)});
    for(let i=0;i<10;i++){const x=(hash(i,77)-.5)*210,z=(hash(i,78)-.5)*210-10;if(heightAt(x,z)<0||Math.hypot(x,z)<22)continue;ck.cluster(x,z,1.6+hash(i,3)*2,i%3==0)}
    kit.scatterRocks(root,heightAt,colliders,{count:70,colors:[0x2a1a68,0x4a2a98,0x6a3ac8]});
    kit.peakRings(root,[[320,0x2a1a66,70,1],[420,0x1e1250,100,2],[540,0x150c3c,130,3]],{top:0x6a4aff,profile:(a,sd)=>.2+.8*Math.pow(hash(Math.floor(a*(30+sd*12)),sd),1.6)});
    kit.fallingParticles(root,uT,{color:[.3,1,.95,.85],twoTone:[1,.25,.85],fall:-.5,drift:.3,size:60});

    ctx.onUpdate((t)=>{
      islands.forEach(o=>{o.m.position.y=o.y+Math.sin(t*.5+o.ph)*.8;o.m.rotation.y=Math.sin(t*.1+o.ph)*.05});
      panels.forEach(p=>{p.g.position.y=p.y+Math.sin(t*.6+p.ph)*.9});
      ck.pulse(t);beam.material.opacity=.14+.06*Math.sin(t*1.5);
    });
  },
};
