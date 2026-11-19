// OWNER: world agent. Terrain, sky, water, arches, floating islands, ink/hatching look.
import * as THREE from 'three';
import {PALETTE,toon,outline,hatch} from './style.js';
import {installPost} from './post.js';

const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,y)=>{const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h)};
function vn(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return mix(mix(hash(ix,iy),hash(ix+1,iy),u),mix(hash(ix,iy+1),hash(ix+1,iy+1),u),v)}
function fbm(x,y,o=4){let a=.5,s=0;for(let i=0;i<o;i++){s+=a*vn(x,y);x*=2.03;y*=2.03;a*=.5}return s/(1-Math.pow(.5,o))}
function ridge(x,y,o=4){let a=.5,s=0;for(let i=0;i<o;i++){const n=1-Math.abs(2*vn(x,y)-1);s+=a*n*n;x*=2.07;y*=2.07;a*=.5}return s/(1-Math.pow(.5,o))}

const riverX=z=>28*Math.sin(z*.035)+10*Math.sin(z*.09+1);
const riverW=z=>8+2.5*Math.sin(z*.07+2);
const WATER_Y=-.45,BED=-1.8;
function heightAt(x,z){
  const d=Math.abs(x-riverX(z)),w=riverW(z);
  const endF=1-sstep(80,100,Math.abs(z));
  const base=2+fbm(x*.02+3,z*.02)*6+fbm(x*.07,z*.07)*.5;
  const mw=Math.max(sstep(40,100,d),sstep(62,118,Math.abs(z)))*sstep(25,60,Math.hypot(x,z));
  const M=mw*(10+80*ridge(x*.011+7,z*.011+2));
  const spawn=sstep(22,55,Math.hypot(x,z));const bluff=sstep(w+4,w+30,d)*(5+4*vn(x*.12,z*.12))*(.35+.65*spawn);
  const bed=sstep(w,w+11,d);
  const land=base+M+bluff;
  const bm=(1-bed)*endF;
  return land*(1-bm)+BED*bm;
}

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
§NOISE§
void main(){
  vec3 d=normalize(vD);float h=d.y;
  vec3 top=vec3(.40,.72,.90),mid=vec3(.86,.84,.90),hor=vec3(1.,.70,.58),glow=vec3(1.,.88,.62);
  vec3 col=mix(hor,mid,smoothstep(0.,.3,h));col=mix(col,top,smoothstep(.25,.9,h));
  float sg=pow(max(dot(d,normalize(vec3(-.25,.07,-1.))),0.),10.);
  col=mix(col,glow,sg*.85*(1.-smoothstep(0.,.4,h)));
  vec2 uv=d.xz/(abs(h)+.28);
  vec2 c0=uv-vec2(-7.,5.);float ang=.9*exp(-length(c0)*.06);
  float cs=cos(ang),sn=sin(ang);vec2 r=mat2(cs,-sn,sn,cs)*c0;
  vec2 s=vec2(r.x*.55,r.y*4.2)+vec2(uT*.004,0.);
  s.y+=vnz(r*.35)*3.+sin(r.x*.6)*1.2;
  float band=fbmz(s*1.1);
  float vis=smoothstep(-.02,.12,h)*(1.-smoothstep(.3,.62,h));
  float c1=smoothstep(.56,.572,band),c2=smoothstep(.67,.68,band);
  float lineA=1.-smoothstep(0.,.012,abs(band-.56));
  float lineB=1.-smoothstep(0.,.01,abs(fract(band*18.)-.5)*.1-.0);
  vec3 cc=mix(vec3(.93,.90,.93),vec3(1.,.98,.96),c2);cc=mix(cc,hor,(1.-smoothstep(0.,.3,h))*.5);
  col=mix(col,cc,c1*.92*vis);
  col=mix(col,vec3(.42,.48,.72),lineA*.0*vis);
  col=mix(col,vec3(.55,.6,.8),c1*step(.93,fract(band*24.))*.35*vis);
  col=mix(col,vec3(.81,.84,.90),smoothstep(.0,-.12,h));
  gl_FragColor=vec4(pow(col,vec3(2.2)),1.);
  #include <colorspace_fragment>
}`.replace('§NOISE§',NOISE);

const WATER_VERT='varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
const WATER_FRAG=`
uniform float uT,uClean;varying vec2 vUv;varying vec3 vW;
§NOISE§§VOR§
void main(){
  vec2 p=vW.xz*.3;float fl=uT*.5;
  float n=fbmz(p*1.3+vec2(0.,fl*.4)+vnz(p*3.+uT*.2));
  vec3 sl=mix(vec3(.06,.03,.10),vec3(.12,.06,.18),step(.52,n));
  vec3 vr=vor(p*1.7+vec2(0.,fl*.15));
  float crack=1.-smoothstep(0.,.045,vr.y);
  sl+=vec3(.6,.16,.75)*crack*(.6+.3*sin(uT*2.+vr.z*20.));
  vec2 bp=vW.xz*.9;vec2 bi=floor(bp);float bh=h21(bi);float br=length(fract(bp)-.5);float ph=fract(uT*.25+bh);
  float rad=.1+.2*ph;float ring=smoothstep(.05,0.,abs(br-rad))*step(.45,bh)*(1.-ph);
  sl=mix(sl,vec3(.9,.45,1.),ring*.9);
  sl+=vec3(.7,.15,.9)*smoothstep(.6,1.,abs(vUv.x))*.5;
  vec3 cl=mix(vec3(.18,.66,.68),vec3(.36,.82,.82),step(.5,fbmz(p*2.+vec2(0.,-fl))));
  float streak=step(.93,fract(p.y*3.-fl*1.2+n*2.5));cl=mix(cl,vec3(.8,.97,.97),streak*.6);
  float foam=smoothstep(.78,.95,abs(vUv.x)+(vnz(p*4.)-.5)*.25);cl=mix(cl,vec3(.93,.98,1.),foam);
  float dist=abs(vUv.y-.5)*2.;float k=uClean*1.35-dist;
  float m=smoothstep(0.,.06,k);
  float band=smoothstep(0.,.03,k)*(1.-smoothstep(.06,.26,k));
  vec3 vc=vor(p*2.4);float ice=1.-smoothstep(0.,.06,vc.y);
  vec3 fz=mix(vec3(.75,.93,.98),vec3(.55,.8,.92),vc.z);
  float dd=smoothstep(35.,220.,length(vW-cameraPosition));sl=mix(sl,vec3(.30,.18,.44)+vec3(.4,.14,.5)*crack*.8,dd*.7);cl=mix(cl,vec3(.45,.78,.82),dd*.4);
  vec3 col=mix(sl,cl,m);col=mix(col,fz,band*.85);col=mix(col,vec3(1.),band*ice);
  gl_FragColor=vec4(pow(col,vec3(2.2)),1.);
  #include <colorspace_fragment>
}`.replace('§NOISE§',NOISE).replace('§VOR§',VOR);

function makeArch(scene,cx,cz,span,H,ang,thick,mat){
  const a=new THREE.Vector3(Math.cos(ang),0,Math.sin(ang)),B=new THREE.Vector3(-a.z,0,a.x);
  const f1=heightAt(cx+a.x*span/2,cz+a.z*span/2),f2=heightAt(cx-a.x*span/2,cz-a.z*span/2);
  const y0=Math.min(f1,f2)-16,N=90,R=14;
  const P=t=>{const th=Math.PI*t,c=Math.cos(th);const k=span/2*c+Math.sin(2*th)*span*.05;
    return new THREE.Vector3(cx+a.x*k,y0+(H+9)*Math.pow(Math.sin(th),.85)+ (f1-f2)*(.5-t)*.0,cz+a.z*k)};
  const radius=t=>{const s=Math.sin(Math.PI*t);return thick*(.7+2.0*Math.pow(1-s,2.6)+.25*Math.sin(t*14))};
  const ringPt=(t,a2,out)=>{const e=.002,p=P(t),T=P(Math.min(1,t+e)).sub(P(Math.max(0,t-e))).normalize();
    const Nn=new THREE.Vector3().crossVectors(B,T).normalize();if(Nn.y<0)Nn.negate();
    const r=radius(t);
    const nz=(vn(p.x*.15+p.y*.1,p.z*.15+p.y*.12)-.5)*r*.7;
    const rr=r+nz+(vn(a2*1.3+t*20,t*7)-.5)*r*.15;
    return p.add(B.clone().multiplyScalar(Math.cos(a2)*rr*1.5)).add(Nn.multiplyScalar(Math.sin(a2)*rr));};
  const pos=[],col=[],idx=[];const ci=new THREE.Color(PALETTE.ice),cs=new THREE.Color(0xb9d6e6),cc=new THREE.Color();
  for(let i=0;i<=N;i++){const t=i/N;for(let j=0;j<R;j++){const v=ringPt(t,j/R*Math.PI*2);pos.push(v.x,v.y,v.z);
    cc.copy(ci).lerp(cs,sstep(.3,.7,vn(v.x*.08,v.y*.1+v.z*.05)));col.push(cc.r,cc.g,cc.b)}}
  for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a0=i*R+j,b0=i*R+(j+1)%R,c0=(i+1)*R+j,d0=(i+1)*R+(j+1)%R;idx.push(a0,b0,c0,b0,d0,c0)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);m.frustumCulled=false;scene.add(m);
  const o=outline(m,.35);o.frustumCulled=false;
  const L=[];
  for(let i=0;i<46;i++){const t=.06+.88*(i/46)+hash(i,1)*.01;if(hash(i,3)<.28)continue;const aa=Math.PI*.5+(hash(i,5)<.5?-.0:.0);
    const p1=ringPt(t,aa-.5),p2=ringPt(t,aa+.5);const mid=p1.clone().add(p2).multiplyScalar(.5);
    const lift=new THREE.Vector3().copy(ringPt(t,aa)).sub(mid).multiplyScalar(.15);
    L.push(p1.x+lift.x,p1.y+lift.y,p1.z+lift.z,p2.x+lift.x,p2.y+lift.y,p2.z+lift.z)}
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(L,3));
  scene.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x4f6a9c})));
  return {crown:P(.5).add(new THREE.Vector3(0,thick*1.2,0))};
}

function makeCrystalGeo(){const pts=[new THREE.Vector2(0,1),new THREE.Vector2(.95,.65),new THREE.Vector2(1,0),new THREE.Vector2(0,0)];return new THREE.LatheGeometry(pts,6)}

export function createWorld(scene){
  scene.fog=new THREE.Fog(0xd7d6e6,100,480);
  scene.background=new THREE.Color(0xd3d9e6);
  const hemi=new THREE.HemisphereLight(0xe2f2ff,0x9a7a96,1.05);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff0dc,2.4);sun.position.set(-60,80,40);scene.add(sun);

  const uT={value:0};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1000,32,16),new THREE.ShaderMaterial({uniforms:{uT},vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:SKY_FRAG,side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false}));
  sky.renderOrder=-10;sky.frustumCulled=false;sky.onBeforeRender=(r,s,cam)=>sky.position.copy(cam.position);scene.add(sky);

  // terrain
  const SIZE=560,SEG=420;
  const tg=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);tg.rotateX(-Math.PI/2);
  const tp=tg.attributes.position;
  for(let i=0;i<tp.count;i++)tp.setY(i,heightAt(tp.getX(i),tp.getZ(i)));
  tg.computeVertexNormals();
  const tc=new Float32Array(tp.count*3),tn=tg.attributes.normal,c=new THREE.Color();
  const cIce=new THREE.Color(0xd9eef8),cLil=new THREE.Color(0xa6c4e6),cRock=new THREE.Color(PALETTE.rock),cRock2=new THREE.Color(0xb8806a),cWet=new THREE.Color(0xaecbe0),cDeep=new THREE.Color(0x7aa7c2),cHigh=new THREE.Color(0xe9f4fa);
  for(let i=0;i<tp.count;i++){
    const x=tp.getX(i),y=tp.getY(i),z=tp.getZ(i),slope=1-tn.getY(i);
    c.copy(cIce).lerp(cLil,sstep(.5,.7,vn(x*.05,z*.05)));
    c.lerp(cHigh,sstep(18,45,y)*.7);
    c.lerp(cWet,(1-sstep(-1.4,1.4,y))*.8);c.lerp(cDeep,(1-sstep(-2,-1.2,y)));
    tc[i*3]=c.r;tc[i*3+1]=c.g;tc[i*3+2]=c.b;
  }
  tg.setAttribute('color',new THREE.BufferAttribute(tc,3));
  const tmat=toon(0xffffff,{vertexColors:true});
  tmat.onBeforeCompile=s=>{
    s.uniforms.uR1={value:cRock.clone()};s.uniforms.uR2={value:cRock2.clone()};s.uniforms.uR3={value:new THREE.Color(0x9b6a6c)};
    s.vertexShader=s.vertexShader.replace('void main() {','varying vec3 vWN;varying vec3 vWP;\nvoid main() {').replace('#include <begin_vertex>','#include <begin_vertex>\nvWN=normal;vWP=(modelMatrix*vec4(position,1.)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('void main() {',`varying vec3 vWN;varying vec3 vWP;uniform vec3 uR1,uR2,uR3;
      float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float nn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
      void main() {`).replace('#include <color_fragment>',`#include <color_fragment>
      {float sl=1.-normalize(vWN).y;float rv=sl+(nn(vWP.xz*.35+vWP.y*.2)-.5)*.1-smoothstep(35.,60.,vWP.y)*.35;float rk=step(.4,rv);
       float b=fract(vWP.y*.16+nn(vWP.xz*.09)*2.4+nn(vWP.xz*.45)*.3);vec3 rc=mix(uR1,b<.6?uR1:(b<.85?uR2:uR3),.3)*(.94+.1*nn(vWP.xz*1.7));
       diffuseColor.rgb=mix(diffuseColor.rgb,rc,rk);}`);
  };
  tmat.customProgramCacheKey=()=>'terrain';
  const terrain=new THREE.Mesh(tg,hatch(tmat,{strength:.5,scale:6,t1:.18,t2:.45}));scene.add(terrain);

  // streams
  const colliders=[],streams=[],waterMats=[],targets=[0,0,0,0],cleanAmt=[0,0,0,0];
  const zb=[-100,-50,0,50,100];
  for(let s=0;s<4;s++){
    const z0=zb[s],z1=zb[s+1],zc=(z0+z1)/2,NZ=40,NU=6,pos=[],uv=[],idx=[];
    for(let i=0;i<=NZ;i++){const z=mix(z0,z1,i/NZ);for(let j=0;j<=NU;j++){const u=j/NU*2-1;pos.push(riverX(z)+u*(riverW(z)+1.8),WATER_Y,z);uv.push(u,i/NZ)}}
    for(let i=0;i<NZ;i++)for(let j=0;j<NU;j++){const a=i*(NU+1)+j,b=a+1,cc=a+NU+1,d=cc+1;idx.push(a,cc,b,b,cc,d)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
    const m=new THREE.ShaderMaterial({uniforms:{uT,uClean:{value:0}},vertexShader:WATER_VERT,fragmentShader:WATER_FRAG});
    const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;scene.add(mesh);waterMats.push(m);
    streams.push({x:riverX(zc),z:zc,radius:22,clean:false});
  }

  // arches
  const archMat=hatch(toon(0xffffff,{vertexColors:true,emissive:0x5a86c0,emissiveIntensity:.3}),{strength:.6,scale:5});
  const A1=makeArch(scene,-22,-58,58,44,.35,5,archMat);
  const A2=makeArch(scene,46,-92,44,28,-.6,3.8,archMat);
  makeArch(scene,-95,-130,70,52,1.0,6,archMat);
  makeArch(scene,100,-30,40,22,-1.1,3.4,archMat);

  // crystals
  const crystalGeo=makeCrystalGeo(),crystals=[];
  const cMatIce=toon(0xbfe6f5,{emissive:0x2f87c8,emissiveIntensity:.5,transparent:true,opacity:.88,side:THREE.DoubleSide});
  const cMatAmb=toon(0xffd7a0,{emissive:0xff8a3a,emissiveIntensity:.7,transparent:true,opacity:.9,side:THREE.DoubleSide});
  function cluster(x,z,sc0,amber){const sc=sc0*1.8;
    const g=new THREE.Group();g.position.set(x,heightAt(x,z)-.3,z);
    const n=5+Math.floor(hash(x,z)*3);
    for(let i=0;i<n;i++){const m=new THREE.Mesh(crystalGeo,amber?cMatAmb:cMatIce);const h=(i==0?1:.35+hash(i,x)*.5)*sc;
      m.scale.set(h*.22,h,h*.22);m.position.set((hash(i,z)-.5)*sc*.9,0,(hash(x,i)-.5)*sc*.9);
      m.rotation.set((hash(i,2)-.5)*.7,hash(i,9)*6,(hash(i,4)-.5)*.7);g.add(m);outline(m,.05);}
    scene.add(g);crystals.push(g);colliders.push({x,y:g.position.y+.35*sc,z,r:.5*sc,solid:true},{x,y:g.position.y+.95*sc,z,r:.28*sc});
  }
  streams.forEach((s,i)=>{const dx=(i%2?1:-1)*(riverW(s.z)+9);cluster(s.x+dx,s.z+6,3.4+i*.4,i%2==0);cluster(s.x-dx*.7,s.z-9,2.2,false)});
  for(let i=0;i<14;i++){const x=(hash(i,77)-.5)*220,z=(hash(i,78)-.5)*220-30;if(heightAt(x,z)<0)continue;cluster(x,z,1.8+hash(i,3)*2.5,i%4==0)}

  // rocks
  const rockGeo=new THREE.DodecahedronGeometry(1,0),NR=110;
  const rocks=new THREE.InstancedMesh(rockGeo,hatch(toon(0xffffff)),NR);
  const dm=new THREE.Object3D();
  for(let i=0;i<NR;i++){const x=(hash(i,5)-.5)*260,z=(hash(i,6)-.5)*260,sc=1+hash(i,7)*hash(i,8)*5;const y=heightAt(x,z);
    dm.position.set(x,y+sc*.2,z);dm.scale.set(sc,sc*(.6+hash(i,9)*.5),sc);dm.rotation.set(hash(i,1)*6,hash(i,2)*6,hash(i,3)*6);dm.updateMatrix();rocks.setMatrixAt(i,dm.matrix);
    rocks.setColorAt(i,c.setHex(hash(i,4)<.5?PALETTE.rock:0xcfe3ee));if(sc>1.8)colliders.push({x,y:y+sc*.3,z,r:sc*.85,solid:sc>2.6})}
  scene.add(rocks);

  // floating islands
  const islands=[];
  const iceMat=hatch(toon(0xffffff,{vertexColors:true,emissive:0x5a86c0,emissiveIntensity:.3}),{strength:.55,scale:5});
  function island(x,y,z,r,seed){
    let g=new THREE.IcosahedronGeometry(r,2);const p=g.attributes.position,col=[];
    for(let i=0;i<p.count;i++){const vx=p.getX(i),vy=p.getY(i),vz=p.getZ(i);
      const n=.75+.5*vn(vx*.4+seed,vz*.4+vy*.3);
      const down=vy<0?1+Math.pow(-vy/r,1.2)*1.9:.45;
      p.setXYZ(i,vx*n*(vy<0?1-(-vy/r)*.55:1),vy*down*n,vz*n*(vy<0?1-(-vy/r)*.55:1))}
    g.computeVertexNormals();
    const pp=g.attributes.position;const ci=new THREE.Color();
    for(let i=0;i<pp.count;i++){const yy=pp.getY(i)/r;ci.setHex(PALETTE.ice).lerp(new THREE.Color(PALETTE.iceShadow),sstep(.1,-.5,yy)*.8).lerp(new THREE.Color(0xb98e78),sstep(-.55,-1.2,yy)*.9);col.push(ci.r,ci.g,ci.b)}
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    const m=new THREE.Mesh(g,iceMat);m.position.set(x,y,z);
    const o=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:PALETTE.ink,side:THREE.BackSide}));o.scale.setScalar(1.035);m.add(o);
    scene.add(m);islands.push({m,y,ph:seed});return m;
  }
  const IS=[[40,54,-62,9],[26,42,-76,5],[11,34,-88,3.5],[-5,29,-96,2.6],[-19,25,-102,1.9],[-70,70,-165,16],[78,78,-150,13],[-40,48,-120,6]];
  IS.forEach((q,i)=>island(q[0],q[1],q[2],q[3],i*3.7));
  // tether tubes
  const tubeMat=new THREE.ShaderMaterial({uniforms:{uT},transparent:false,fog:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform float uT;varying vec2 vUv;void main(){float p=fract(vUv.x*14.-uT*.7);float pulse=smoothstep(0.,.25,p)*(1.-smoothstep(.25,.8,p));vec3 c=mix(vec3(.25,.78,1.),vec3(.9,1.,1.),pulse*.85);gl_FragColor=vec4(pow(c,vec3(2.2)),1.);
#include <colorspace_fragment>
}`});
  const haloMat=new THREE.MeshBasicMaterial({color:0x55c8ff,transparent:true,opacity:.3,depthWrite:false,fog:false,blending:THREE.AdditiveBlending});
  const haloMat2=haloMat.clone();haloMat2.opacity=.1;
  const chain=[A1.crown,...IS.slice(0,5).map(q=>new THREE.Vector3(q[0],q[1],q[2]))];
  const base=new THREE.CatmullRomCurve3(chain);
  for(let k=0;k<2;k++){
    const pts=[];for(let i=0;i<=60;i++){const t=i/60,p=base.getPoint(t),tg2=base.getTangent(t);const side=new THREE.Vector3(-tg2.z,0,tg2.x).normalize();
      const off=Math.sin(t*28+k*Math.PI)*(1.6*(1-t*.3));pts.push(p.clone().add(side.multiplyScalar(off)).add(new THREE.Vector3(0,Math.cos(t*28+k*Math.PI)*1.6,0)))}
    const cv=new THREE.CatmullRomCurve3(pts);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(cv,240,.8,6),tubeMat));
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(cv,120,2.6,8),haloMat));
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(cv,80,5.2,8),haloMat2));
  }
  [[IS[7],IS[5]],[IS[6],IS[0]]].forEach(([a,b],k)=>{const cv=new THREE.CatmullRomCurve3([new THREE.Vector3(a[0],a[1],a[2]),new THREE.Vector3((a[0]+b[0])/2,Math.max(a[1],b[1])+14,(a[2]+b[2])/2),new THREE.Vector3(b[0],b[1],b[2])]);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(cv,120,.4,6),tubeMat))});

  // distant peak rings
  [[330,0xa9bbd6,70,1],[430,0xbccadf,95,2],[540,0xd0d9ea,120,3]].forEach(([R,col,H,sd])=>{
    const N=360,pos=[],idx=[],cl=[],top=new THREE.Color(0xf4f8ff),base=new THREE.Color(col),sh=new THREE.Color(col).multiplyScalar(.78),cc=new THREE.Color();
    for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
      const n=ridge(Math.cos(a)*3+sd*9,Math.sin(a)*3+sd*4,5),spire=Math.pow(vn(a*9+sd*20,sd),6)*1.3;
      const h=H*(.25+.8*n+spire)*(.8+.4*vn(a*40,sd));
      pos.push(x*R,-8,z*R,x*R,h,z*R);
      const lit=.5+.5*Math.sin(a*7+sd*2);
      cc.copy(base);cl.push(cc.r,cc.g,cc.b);cc.copy(base).lerp(top,.55).lerp(sh,(1-lit)*.55);cl.push(cc.r,cc.g,cc.b)}
    for(let i=0;i<N;i++){const a=i*2,b=a+1,c2=a+2,d2=a+3;idx.push(a,c2,b,b,c2,d2)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.setIndex(idx);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));m.frustumCulled=false;scene.add(m)});

  // snow
  const NS=700,sp=new Float32Array(NS*3),sr=new Float32Array(NS);
  for(let i=0;i<NS;i++){sp[i*3]=Math.random()*90;sp[i*3+1]=Math.random()*45;sp[i*3+2]=Math.random()*90;sr[i]=Math.random()}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));sg.setAttribute('aR',new THREE.BufferAttribute(sr,1));
  const snow=new THREE.Points(sg,new THREE.ShaderMaterial({uniforms:{uT},transparent:true,depthWrite:false,fog:false,
    vertexShader:`uniform float uT;attribute float aR;void main(){vec3 box=vec3(90.,45.,90.);vec3 p=position;p.y-=uT*(.9+aR);p.x+=sin(uT*.3+aR*20.)*2.+uT*.8;
      p=mod(p-cameraPosition+box*.5,box)-box*.5+cameraPosition;vec4 mv=viewMatrix*vec4(p,1.);gl_PointSize=clamp((1.+aR*2.)*70./-mv.z,1.5,4.);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1.,1.,1.,.85);}`}));
  snow.frustumCulled=false;scene.add(snow);

  // debug fly cam (key F)
  const fly=window.__fly={on:false,pos:new THREE.Vector3(),yaw:0,pitch:0,speed:30};
  const keys={};let last=performance.now(),drag=false;
  addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyF'&&!e.repeat){fly.on=!fly.on;if(fly.on&&camRef){fly.pos.copy(camRef.position);const eu=new THREE.Euler().setFromQuaternion(camRef.quaternion,'YXZ');fly.yaw=eu.y;fly.pitch=eu.x}}});
  addEventListener('keyup',e=>{keys[e.code]=false});
  addEventListener('mousedown',()=>{drag=true});addEventListener('mouseup',()=>{drag=false});
  addEventListener('mousemove',e=>{if(fly.on&&drag){fly.yaw-=e.movementX*.003;fly.pitch=clamp(fly.pitch-e.movementY*.003,-1.5,1.5)}});
  let camRef=null;
  const qp=new URLSearchParams(location.search),qf=qp.get('fly');
  if(qp.get('hide'))document.head.insertAdjacentHTML('beforeend','<style>body>*:not(canvas){display:none!important}</style>');
  if(qp.get('clean'))qp.get('clean').split(',').forEach(i=>{targets[+i]=1;cleanAmt[+i]=qp.get('half')?.55:1;streams[+i].clean=true});
  if(qf){const v=qf.split(',').map(Number);document.head.insertAdjacentHTML('beforeend','<style>body>*:not(canvas){display:none!important}</style>');fly.on=true;fly.pos.set(v[0],v[1],v[2]);fly.yaw=(v[3]||0)*Math.PI/180;fly.pitch=(v[4]||0)*Math.PI/180}
  const onBefore=cam=>{camRef=cam;const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;if(!fly.on)return;if(!fly.logged){fly.logged=1;console.log('FLY',fly.pos.toArray().join(','))}
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(fly.pitch,fly.yaw,0,'YXZ'));
    const f=new THREE.Vector3(0,0,-1).applyQuaternion(q),r=new THREE.Vector3(1,0,0).applyQuaternion(q),sp=fly.speed*(keys.ShiftLeft?3:1)*dt;
    if(keys.KeyW)fly.pos.addScaledVector(f,sp);if(keys.KeyS)fly.pos.addScaledVector(f,-sp);if(keys.KeyD)fly.pos.addScaledVector(r,sp);if(keys.KeyA)fly.pos.addScaledVector(r,-sp);
    if(keys.KeyE)fly.pos.y+=sp;if(keys.KeyQ)fly.pos.y-=sp;
    cam.position.copy(fly.pos);cam.quaternion.copy(q)};
  let installed=false;

  return {
    update(t,dt){
      uT.value=t;
      if(!installed&&window.__game&&window.__game.renderer){installed=true;installPost(window.__game.renderer,{onBefore})}
      for(let i=0;i<4;i++){const d=targets[i]-cleanAmt[i];cleanAmt[i]+=Math.sign(d)*Math.min(Math.abs(d),dt*.45);waterMats[i].uniforms.uClean.value=cleanAmt[i]}
      islands.forEach((o,i)=>{o.m.position.y=o.y+Math.sin(t*.5+o.ph)*.7;o.m.rotation.y=Math.sin(t*.1+o.ph)*.05});
      crystals.forEach((g,i)=>{});
      cMatIce.emissiveIntensity=.45+.2*Math.sin(t*1.7);cMatAmb.emissiveIntensity=.65+.25*Math.sin(t*2.1);
    },
    heightAt,
    colliders,
    streams,
    setStreamClean(i,clean){if(!streams[i])return;streams[i].clean=!!clean;targets[i]=clean?1:0},
    bounds:120,
  };
}
