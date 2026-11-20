// Map-config driven world: terrain, sky, water streams, lighting, props. createWorld(scene,mapId) -> world with dispose().
import * as THREE from 'three';
import {PALETTE,toon,outline,hatch} from './style.js';
import {installPost} from './post.js';
import {clamp,sstep,mix,hash,vn,fbm,ridge} from './mapkit.js';
import * as propkit from './propkit.js';
import {MAPS,MAP_ORDER} from './maps/index.js';

export {MAPS,MAP_ORDER};

const NOISE=`
float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 h22(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
float vnz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbmz(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vnz(p);p*=2.03;a*=.5;}return s/.9375;}
`;
const VOR=`
vec3 vor(vec2 p){vec2 i=floor(p),f=fract(p);float d1=8.,d2=8.,id=0.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 o=h22(i+g);o=.5+.5*sin(uT*.6+6.28*o);vec2 r=g+o-f;float d=dot(r,r);
  if(d<d1){d2=d1;d1=d;id=h21(i+g);}else if(d<d2)d2=d;}
 return vec3(sqrt(d1),sqrt(d2)-sqrt(d1),id);}
`;

const SKY_FRAG=`
uniform float uT;varying vec3 vD;
uniform vec3 uTop,uMid,uHor,uGnd,uMoonDir,uMoonCol,uHaloCol,uAurA,uAurB;uniform float uMoonSize,uAur,uStars,uMoon;
§NOISE§
§SKYEXTRA§
void main(){
  vec3 d=normalize(vD);float h=d.y;
  vec3 col=mix(uHor,uMid,smoothstep(0.,.28,h));col=mix(col,uTop,smoothstep(.22,.85,h));
  vec3 M=normalize(uMoonDir);
  float md=dot(d,M);
  vec3 tx=normalize(cross(M,vec3(0.,1.,0.))),ty=cross(tx,M);
  vec2 ml=vec2(dot(d,tx),dot(d,ty))/uMoonSize;float mr=length(ml);
  float halo=exp(-max(mr-1.,0.)*1.6);
  col+=uHaloCol*halo*.55*step(0.,md)*uMoon;
  col+=vec3(.5,.55,1.)*pow(max(md,0.),60.)*.5*uMoon;
  float disc=(1.-smoothstep(.97,1.,mr))*uMoon;
  float cr=smoothstep(.1,.14,length(ml-vec2(-.35,.3)))*smoothstep(.07,.1,length(ml-vec2(.38,-.25)))*smoothstep(.05,.08,length(ml-vec2(.1,.55)))*smoothstep(.08,.12,length(ml-vec2(-.15,-.45)));
  vec3 mc=mix(uMoonCol,mix(uMoonCol,vec3(1.),.6),smoothstep(.3,.9,1.-mr*.6));
  mc=mix(mc*.9,mc,cr);
  mc=mix(mc,uHaloCol*.2,smoothstep(.97,1.,mr)*.6);
  col=mix(col,mc,disc*step(0.,md));
  vec2 st=vec2(atan(d.z,d.x)*80.,h*80.);vec2 sc=floor(st),sf=fract(st)-.5;
  float sh=h21(sc);float sd=smoothstep(.16,0.,length(sf))*step(.965,sh)*(.6+.4*sin(uT*2.+sh*40.));
  col+=vec3(.8,.9,1.)*sd*smoothstep(.0,.2,h)*(1.-disc)*uStars;
  vec2 uv=d.xz/(abs(h)+.3);
  vec2 c0=uv-vec2(-7.,5.);float ang=.9*exp(-length(c0)*.06);
  float cs=cos(ang),sn=sin(ang);vec2 r=mat2(cs,-sn,sn,cs)*c0;
  vec2 s=vec2(r.x*.55,r.y*4.2)+vec2(uT*.006,0.);
  s.y+=vnz(r*.35)*3.+sin(r.x*.6)*1.2+sin(uT*.1+r.x*.3)*.4;
  float band=fbmz(s*1.1);
  float vis=smoothstep(-.02,.1,h)*(1.-smoothstep(.45,.85,h))*uAur;
  float c1=smoothstep(.56,.572,band),c2=smoothstep(.67,.68,band),c3=smoothstep(.76,.77,band);
  vec3 ac=mix(uAurA,uAurB,smoothstep(.0,.35,vnz(r*.12)));
  ac=mix(ac,vec3(.72,.35,1.),c2*.7);ac=mix(ac,vec3(.8,1.,.95),c3*.6);
  col=mix(col,col*.6+ac*.75,c1*.8*vis*(1.-disc));
  col+=ac*step(.93,fract(band*24.))*.18*vis*c1;
  col=skyExtra(d,col);
  col=mix(col,uGnd,smoothstep(.0,-.12,h));
  gl_FragColor=vec4(pow(col,vec3(2.2)),1.);
  #include <colorspace_fragment>
}`;

const WATER_VERT='varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
const WATER_FRAG=`
uniform float uT,uClean;varying vec2 vUv;varying vec3 vW;
uniform vec3 uSl0,uSl1,uSlMax,uCrack,uRingC,uEdge,uCl0,uCl1,uStreak,uFoam,uFz0,uFz1,uFar,uFarCl;
§NOISE§§VOR§
§WATEREXTRA§
void main(){
  vec2 p=vW.xz*.3;float fl=uT*.5;
  float n=fbmz(p*1.3+vec2(0.,fl*.4)+vnz(p*3.+uT*.2));
  vec3 sl=mix(uSl0,uSl1,step(.52,n));
  vec3 vr=vor(p*1.7+vec2(0.,fl*.15));
  float crack=1.-smoothstep(0.,.045,vr.y);
  sl+=uCrack*crack*(.7+.3*sin(uT*2.+vr.z*20.));
  vec2 bp=vW.xz*.9;vec2 bi=floor(bp);float bh=h21(bi);float br=length(fract(bp)-.5);float ph=fract(uT*.25+bh);
  float rad=.1+.2*ph;float ring=smoothstep(.05,0.,abs(br-rad))*step(.45,bh)*(1.-ph);
  sl=mix(sl,uRingC,ring*.9);
  sl+=uEdge*smoothstep(.6,1.,abs(vUv.x))*.45;sl=min(sl,uSlMax);
  sl=waterExtra(sl,p,vW,0.);
  vec3 cl=mix(uCl0,uCl1,step(.5,fbmz(p*2.+vec2(0.,-fl))));
  float streak=step(.93,fract(p.y*3.-fl*1.2+n*2.5));cl=mix(cl,uStreak,streak*.7);
  float foam=smoothstep(.78,.95,abs(vUv.x)+(vnz(p*4.)-.5)*.25);cl=mix(cl,uFoam,foam);
  float dist=abs(vUv.y-.5)*2.;float k=uClean*1.35-dist;
  float m=smoothstep(0.,.06,k);
  float band=smoothstep(0.,.03,k)*(1.-smoothstep(.06,.26,k));
  vec3 vc=vor(p*2.4);float ice=1.-smoothstep(0.,.06,vc.y);
  vec3 fz=mix(uFz0,uFz1,vc.z);
  float dd=smoothstep(35.,220.,length(vW-cameraPosition));sl=mix(sl,uFar+uCrack*crack*.8,dd*.6);cl=mix(cl,uFarCl,dd*.4);
  vec3 col=mix(sl,cl,m);col=mix(col,fz,band*.85);col=mix(col,vec3(1.),band*ice);
  col=waterExtra(col,p,vW,m);
  gl_FragColor=vec4(pow(col,vec3(2.2)),1.);
  #include <colorspace_fragment>
}`;

const v3=a=>new THREE.Vector3(...a),col3=h=>new THREE.Color(h);
const SKY_DEF={top:[.015,.02,.12],mid:[.07,.06,.34],hor:[.36,.16,.66],gnd:[.07,.05,.25],moonDir:[-.55,.44,-1],moonCol:[.62,.5,1],halo:[.42,.28,.95],moonSize:.24,moon:1,aurora:0,aurA:[.12,.45,1],aurB:[.2,1,.55],stars:1,extra:''};
const WATER_DEF={sl0:[.08,.5,.12],sl1:[.2,.95,.25],slMax:[.75,.95,.75],crack:[1,.15,.8],ring:[.6,1,.5],edge:[.9,.1,.7],cl0:[.05,.42,.95],cl1:[.14,.68,1],streak:[.6,.95,1],foam:[.85,.97,1],fz0:[.55,.85,1],fz1:[.4,.6,1],far:[.18,.2,.4],farCl:[.2,.4,.9],extra:''};

// fly cam + post hook shared across world instances (installed once)
const fly=window.__fly={on:false,pos:new THREE.Vector3(),yaw:0,pitch:0,speed:30};
const keys={};let camRef=null,flyInit=false,last=performance.now(),drag=false;
function initFly(){
  if(flyInit)return;flyInit=true;
  addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyF'&&!e.repeat){fly.on=!fly.on;if(fly.on&&camRef){fly.pos.copy(camRef.position);const eu=new THREE.Euler().setFromQuaternion(camRef.quaternion,'YXZ');fly.yaw=eu.y;fly.pitch=eu.x}}});
  addEventListener('keyup',e=>{keys[e.code]=false});
  addEventListener('mousedown',()=>{drag=true});addEventListener('mouseup',()=>{drag=false});
  addEventListener('mousemove',e=>{if(fly.on&&drag){fly.yaw-=e.movementX*.003;fly.pitch=clamp(fly.pitch-e.movementY*.003,-1.5,1.5)}});
  const qf=new URLSearchParams(location.search).get('fly');
  if(new URLSearchParams(location.search).get('hide'))document.head.insertAdjacentHTML('beforeend','<style>body>*:not(canvas){display:none!important}</style>');
  if(qf){const v=qf.split(',').map(Number);document.head.insertAdjacentHTML('beforeend','<style>body>*:not(canvas){display:none!important}</style>');fly.on=true;fly.pos.set(v[0],v[1],v[2]);fly.yaw=(v[3]||0)*Math.PI/180;fly.pitch=(v[4]||0)*Math.PI/180}
}
const onBefore=cam=>{camRef=cam;const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;if(!fly.on)return;if(!fly.logged){fly.logged=1;console.log('FLY',fly.pos.toArray().join(','))}
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(fly.pitch,fly.yaw,0,'YXZ'));
  const f=new THREE.Vector3(0,0,-1).applyQuaternion(q),r=new THREE.Vector3(1,0,0).applyQuaternion(q),sp=fly.speed*(keys.ShiftLeft?3:1)*dt;
  if(keys.KeyW)fly.pos.addScaledVector(f,sp);if(keys.KeyS)fly.pos.addScaledVector(f,-sp);if(keys.KeyD)fly.pos.addScaledVector(r,sp);if(keys.KeyA)fly.pos.addScaledVector(r,-sp);
  if(keys.KeyE)fly.pos.y+=sp;if(keys.KeyQ)fly.pos.y-=sp;
  cam.position.copy(fly.pos);cam.quaternion.copy(q)};

export function createWorld(scene,mapId='glacier'){
  const cfg=MAPS[mapId]||MAPS.glacier;
  initFly();
  const root=new THREE.Group();root.name='world:'+cfg.id;scene.add(root);
  const prevFog=scene.fog,prevBg=scene.background;
  const heightAt=cfg.heightAt;
  scene.fog=new THREE.Fog(cfg.fog.color,cfg.fog.near,cfg.fog.far);
  scene.background=new THREE.Color(cfg.background);
  for(const l of cfg.lights){
    if(l.type==='hemi')root.add(new THREE.HemisphereLight(l.sky,l.ground,l.i));
    else{const d=new THREE.DirectionalLight(l.color,l.i);d.position.set(...l.pos);root.add(d)}
  }

  const uT={value:0};
  const sk={...SKY_DEF,...cfg.sky};
  const skyMat=new THREE.ShaderMaterial({uniforms:{uT,uTop:{value:v3(sk.top)},uMid:{value:v3(sk.mid)},uHor:{value:v3(sk.hor)},uGnd:{value:v3(sk.gnd)},uMoonDir:{value:v3(sk.moonDir)},uMoonCol:{value:v3(sk.moonCol)},uHaloCol:{value:v3(sk.halo)},uAurA:{value:v3(sk.aurA)},uAurB:{value:v3(sk.aurB)},uMoonSize:{value:sk.moonSize},uAur:{value:sk.aurora},uStars:{value:sk.stars},uMoon:{value:sk.moon}},
    vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:SKY_FRAG.replace('§NOISE§',NOISE).replace('§SKYEXTRA§',sk.extra||'vec3 skyExtra(vec3 d,vec3 c){return c;}'),side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1000,32,16),skyMat);
  sky.renderOrder=-10;sky.frustumCulled=false;sky.onBeforeRender=(r,s,cam)=>sky.position.copy(cam.position);root.add(sky);

  // terrain
  const T=cfg.terrain,SIZE=T.size??560,SEG=T.seg??420;
  const tg=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);tg.rotateX(-Math.PI/2);
  const tp=tg.attributes.position;
  for(let i=0;i<tp.count;i++)tp.setY(i,heightAt(tp.getX(i),tp.getZ(i)));
  tg.computeVertexNormals();
  const tc=new Float32Array(tp.count*3),tn=tg.attributes.normal,c=new THREE.Color();
  for(let i=0;i<tp.count;i++){
    T.colorAt(tp.getX(i),tp.getY(i),tp.getZ(i),1-tn.getY(i),c);
    tc[i*3]=c.r;tc[i*3+1]=c.g;tc[i*3+2]=c.b;
  }
  tg.setAttribute('color',new THREE.BufferAttribute(tc,3));
  const R=T.rock;
  const tmat=toon(0xffffff,{vertexColors:true});
  tmat.onBeforeCompile=s=>{
    s.uniforms.uR1={value:col3(R.c1)};s.uniforms.uR2={value:col3(R.c2)};s.uniforms.uR3={value:col3(R.c3)};
    s.uniforms.uVein={value:col3(R.vein??0x8ff2ff)};s.uniforms.uVeinAmt={value:R.veinAmt??.85};s.uniforms.uRockThr={value:R.thr??.4};s.uniforms.uRockHi={value:R.hi??.35};
    s.vertexShader=s.vertexShader.replace('void main() {','varying vec3 vWN;varying vec3 vWP;\nvoid main() {').replace('#include <begin_vertex>','#include <begin_vertex>\nvWN=normal;vWP=(modelMatrix*vec4(position,1.)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('void main() {',`varying vec3 vWN;varying vec3 vWP;uniform vec3 uR1,uR2,uR3,uVein;uniform float uVeinAmt,uRockThr,uRockHi;
      float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float nn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
      void main() {`).replace('#include <color_fragment>',`#include <color_fragment>
      {float sl=1.-normalize(vWN).y;float rv=sl+(nn(vWP.xz*.35+vWP.y*.2)-.5)*.1-smoothstep(35.,60.,vWP.y)*uRockHi;float rk=step(uRockThr,rv);
       float b=fract(vWP.y*.16+nn(vWP.xz*.09)*2.4+nn(vWP.xz*.45)*.3);vec3 rc=mix(uR1,b<.6?uR1:(b<.85?uR2:uR3),.3)*(.94+.1*nn(vWP.xz*1.7));
       diffuseColor.rgb=mix(diffuseColor.rgb,rc,rk);
       float vl=abs(nn(vWP.xz*.11+vec2(3.,7.))-.5),vl2=abs(nn(vWP.xz*.23+vec2(11.,2.))-.5);float vein=max(1.-smoothstep(.0,.014,vl),(1.-smoothstep(.0,.01,vl2))*.7);
       diffuseColor.rgb=mix(diffuseColor.rgb,uVein,vein*(1.-rk)*uVeinAmt);}`);
  };
  tmat.customProgramCacheKey=()=>'terrain:'+cfg.id;
  root.add(new THREE.Mesh(tg,hatch(tmat,{strength:.5,scale:6,t1:.18,t2:.45,tint:T.hatchTint??0x3a1fa0})));

  // streams
  const RV=cfg.river,wp={...WATER_DEF,...cfg.water},WATER_Y=RV.waterY??-.45;
  const wu=k=>({value:v3(wp[k])});
  const colliders=[],streams=[],waterMats=[],crystals=[],targets=[],cleanAmt=[],updaters=[];
  const NSEG=RV.zb.length-1;
  for(let s=0;s<NSEG;s++){
    const z0=RV.zb[s],z1=RV.zb[s+1],zc=(z0+z1)/2,NZ=40,NU=6,pos=[],uv=[],idx=[];
    for(let i=0;i<=NZ;i++){const z=mix(z0,z1,i/NZ);for(let j=0;j<=NU;j++){const u=j/NU*2-1;pos.push(RV.x(z)+u*(RV.w(z)+(RV.pad??1.8)),WATER_Y,z);uv.push(u,i/NZ)}}
    for(let i=0;i<NZ;i++)for(let j=0;j<NU;j++){const a=i*(NU+1)+j,b=a+1,cc=a+NU+1,d=cc+1;idx.push(a,cc,b,b,cc,d)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
    const m=new THREE.ShaderMaterial({uniforms:{uT,uClean:{value:0},uSl0:wu('sl0'),uSl1:wu('sl1'),uSlMax:wu('slMax'),uCrack:wu('crack'),uRingC:wu('ring'),uEdge:wu('edge'),uCl0:wu('cl0'),uCl1:wu('cl1'),uStreak:wu('streak'),uFoam:wu('foam'),uFz0:wu('fz0'),uFz1:wu('fz1'),uFar:wu("far"),uFarCl:wu("farCl")},
      vertexShader:WATER_VERT,fragmentShader:WATER_FRAG.replace('§NOISE§',NOISE).replace('§VOR§',VOR).replace('§WATEREXTRA§',wp.extra||'vec3 waterExtra(vec3 c,vec2 p,vec3 w,float m){return c;}')});
    const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;root.add(mesh);waterMats.push(m);targets.push(0);cleanAmt.push(0);
    streams.push({x:RV.x(zc),z:zc,radius:(RV.radius&&RV.radius[s])??(Array.isArray(RV.radius)?22:RV.radius??22),clean:false});
  }

  const ctx={THREE,scene,root,uT,heightAt,colliders,crystals,streams,cfg,kit:{...propkit,clamp,sstep,mix,hash,vn,fbm,ridge,toon,outline,hatch,PALETTE},onUpdate:fn=>updaters.push(fn)};
  cfg.props(ctx);

  const qp=new URLSearchParams(location.search);
  if(qp.get('clean'))qp.get('clean').split(',').forEach(i=>{if(!streams[+i])return;targets[+i]=1;cleanAmt[+i]=qp.get('half')?.55:1;streams[+i].clean=true});
  let installed=false;

  return {
    id:cfg.id,cfg,
    update(t,dt){
      uT.value=t;
      if(!installed&&window.__game&&window.__game.renderer){installed=true;installPost(window.__game.renderer,{onBefore})}
      for(let i=0;i<streams.length;i++){const d=targets[i]-cleanAmt[i];cleanAmt[i]+=Math.sign(d)*Math.min(Math.abs(d),dt*.45);waterMats[i].uniforms.uClean.value=cleanAmt[i]}
      for(const f of updaters)f(t,dt);
    },
    heightAt,colliders,crystals,streams,
    setStreamClean(i,clean){if(!streams[i])return;streams[i].clean=!!clean;targets[i]=clean?1:0},
    bounds:cfg.bounds??120,
    dispose(){
      scene.remove(root);
      root.traverse(o=>{
        if(o.geometry)o.geometry.dispose();
        const m=o.material;if(m)(Array.isArray(m)?m:[m]).forEach(x=>x.dispose());
        if(o.isInstancedMesh)o.dispose();
      });
      updaters.length=0;colliders.length=0;crystals.length=0;streams.length=0;
      scene.fog=prevFog;scene.background=prevBg;
    },
  };
}
