// Shared prop builders reused by every map: ribbon arches, floating islands, crystal clusters, peak rings, particles, tethers.
import * as THREE from 'three';
import {PALETTE,toon,outline,hatch} from './style.js';
import {sstep,hash,vn,ridge} from './mapkit.js';

export function makeArch(root,heightAt,cx,cz,span,H,ang,thick,mat,o={}){
  const a=new THREE.Vector3(Math.cos(ang),0,Math.sin(ang)),B=new THREE.Vector3(-a.z,0,a.x);
  const f1=heightAt(cx+a.x*span/2,cz+a.z*span/2),f2=heightAt(cx-a.x*span/2,cz-a.z*span/2);
  const y0=Math.min(f1,f2)-16,N=90,R=14;
  const P=t=>{const th=Math.PI*t,c=Math.cos(th);const k=span/2*c+Math.sin(2*th)*span*.05;
    return new THREE.Vector3(cx+a.x*k,y0+(H+9)*Math.pow(Math.sin(th),.85),cz+a.z*k)};
  const radius=t=>{const s=Math.sin(Math.PI*t);return thick*(.7+2.0*Math.pow(1-s,2.6)+.25*Math.sin(t*14))};
  const ringPt=(t,a2)=>{const e=.002,p=P(t),T=P(Math.min(1,t+e)).sub(P(Math.max(0,t-e))).normalize();
    const Nn=new THREE.Vector3().crossVectors(B,T).normalize();if(Nn.y<0)Nn.negate();
    const r=radius(t);
    const nz=(vn(p.x*.15+p.y*.1,p.z*.15+p.y*.12)-.5)*r*.7;
    const rr=r+nz+(vn(a2*1.3+t*20,t*7)-.5)*r*.15;
    return p.add(B.clone().multiplyScalar(Math.cos(a2)*rr*1.5)).add(Nn.multiplyScalar(Math.sin(a2)*rr));};
  const pos=[],col=[],idx=[];const ci=new THREE.Color(o.colA??0x7ab4ff),cs=new THREE.Color(o.colB??0x6a58e8),cc=new THREE.Color();
  for(let i=0;i<=N;i++){const t=i/N;for(let j=0;j<R;j++){const v=ringPt(t,j/R*Math.PI*2);pos.push(v.x,v.y,v.z);
    cc.copy(ci).lerp(cs,sstep(.3,.7,vn(v.x*.08,v.y*.1+v.z*.05)));col.push(cc.r,cc.g,cc.b)}}
  for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a0=i*R+j,b0=i*R+(j+1)%R,c0=(i+1)*R+j,d0=(i+1)*R+(j+1)%R;idx.push(a0,b0,c0,b0,d0,c0)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);m.frustumCulled=false;root.add(m);
  const ol=outline(m,.35);ol.frustumCulled=false;
  const L=[];
  for(let i=0;i<46;i++){const t=.06+.88*(i/46)+hash(i,1)*.01;if(hash(i,3)<.28)continue;const aa=Math.PI*.5;
    const p1=ringPt(t,aa-.5),p2=ringPt(t,aa+.5);const mid=p1.clone().add(p2).multiplyScalar(.5);
    const lift=ringPt(t,aa).sub(mid).multiplyScalar(.15);
    L.push(p1.x+lift.x,p1.y+lift.y,p1.z+lift.z,p2.x+lift.x,p2.y+lift.y,p2.z+lift.z)}
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(L,3));
  root.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:o.lineColor??0x58f0ff})));
  return {crown:P(.5).add(new THREE.Vector3(0,thick*1.2,0)),mesh:m};
}

export function makeCrystalGeo(){const pts=[[0,0],[.5,.03],[.85,.16],[1,.36],[.88,.58],[.55,.78],[.2,.93],[0,1.08]].map(p=>new THREE.Vector2(p[0],p[1]));return new THREE.LatheGeometry(pts,8)}

// Crystal cluster factory. opts: colA/emA (primary), colB/emB (secondary), haloA/haloB. Returns {cluster(x,z,sc,alt), pulse(t)}.
export function crystalKit(root,heightAt,colliders,crystals,o={}){
  const geo=makeCrystalGeo(),haloGeo=new THREE.SphereGeometry(1,12,8);
  const haloA=new THREE.MeshBasicMaterial({color:o.haloA??0x3a8cff,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false}),haloB=new THREE.MeshBasicMaterial({color:o.haloB??0x2aff80,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false});
  const mA=toon(o.colA??0x6ab8ff,{emissive:o.emA??0x2f7aff,emissiveIntensity:.8,transparent:true,opacity:.92,side:THREE.DoubleSide,rim:1});
  const mB=toon(o.colB??0x7affb0,{emissive:o.emB??0x18e060,emissiveIntensity:.8,transparent:true,opacity:.92,side:THREE.DoubleSide,rim:1});
  function cluster(x,z,sc0,alt,y0){const sc=sc0*1.8;
    const g=new THREE.Group();g.position.set(x,(y0??heightAt(x,z))-.3,z);
    const n=5+Math.floor(hash(x,z)*3);
    for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,alt?mB:mA);const h=(i==0?1:.35+hash(i,x)*.5)*sc;
      m.scale.set(h*.34,h,h*.34);m.position.set((hash(i,z)-.5)*sc*.9,0,(hash(x,i)-.5)*sc*.9);
      m.rotation.set((hash(i,2)-.5)*.7,hash(i,9)*6,(hash(i,4)-.5)*.7);g.add(m);outline(m,.05);}
    const hm=new THREE.Mesh(haloGeo,alt?haloB:haloA);hm.scale.setScalar(sc*.95);hm.position.y=sc*.5;g.add(hm);
    g.userData.fade={x,y:g.position.y+sc*.5,z,r:sc*.55+1.2,k:1};root.add(g);crystals.push(g);colliders.push({x,y:g.position.y+.35*sc,z,r:.5*sc,solid:true,fade:true},{x,y:g.position.y+.95*sc,z,r:.28*sc,fade:true});
  }
  return {cluster,pulse(t){mA.emissiveIntensity=.8+.35*Math.sin(t*1.7);mB.emissiveIntensity=.8+.35*Math.sin(t*2.1)}};
}

// Scattered rocks (instanced). o: colors[], spread, count, solid threshold.
export function scatterRocks(root,heightAt,colliders,o={}){
  const NR=o.count??110,spread=o.spread??260,cols=o.colors??[PALETTE.rock,0x6a78d8];
  const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),hatch(toon(0xffffff)),NR),dm=new THREE.Object3D(),c=new THREE.Color();
  for(let i=0;i<NR;i++){const x=(hash(i,5)-.5)*spread,z=(hash(i,6)-.5)*spread,sc=(o.minSize??1)+hash(i,7)*hash(i,8)*(o.sizeVar??5);const y=heightAt(x,z);
    dm.position.set(x,y+sc*.2,z);dm.scale.set(sc,sc*(.6+hash(i,9)*.5),sc);dm.rotation.set(hash(i,1)*6,hash(i,2)*6,hash(i,3)*6);dm.updateMatrix();rocks.setMatrixAt(i,dm.matrix);
    rocks.setColorAt(i,c.setHex(cols[Math.floor(hash(i,4)*cols.length)]));if(sc>1.8)colliders.push({x,y:y+sc*.3,z,r:sc*.85,solid:sc>2.6})}
  root.add(rocks);return rocks;
}

// Floating island. o: top/mid/under colours, seed, glow colour.
export function makeIsland(root,x,y,z,r,seed,mat,o={}){
  const g=new THREE.IcosahedronGeometry(r,2);const p=g.attributes.position,col=[];
  for(let i=0;i<p.count;i++){const vx=p.getX(i),vy=p.getY(i),vz=p.getZ(i);
    const n=.75+.5*vn(vx*.4+seed,vz*.4+vy*.3);
    const down=vy<0?1+Math.pow(-vy/r,1.2)*1.9:.45;
    p.setXYZ(i,vx*n*(vy<0?1-(-vy/r)*.55:1),vy*down*n,vz*n*(vy<0?1-(-vy/r)*.55:1))}
  g.computeVertexNormals();
  const pp=g.attributes.position,ci=new THREE.Color(),top=new THREE.Color(o.top??0x78c0ff),mid=new THREE.Color(o.mid??PALETTE.iceShadow),und=new THREE.Color(o.under??0x3a1f8a);
  for(let i=0;i<pp.count;i++){const yy=pp.getY(i)/r;ci.copy(top).lerp(mid,sstep(.1,-.5,yy)*.8).lerp(und,sstep(-.55,-1.2,yy)*.9);col.push(ci.r,ci.g,ci.b)}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);
  const ol=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:PALETTE.ink,side:THREE.BackSide}));ol.scale.setScalar(1.035);m.add(ol);
  const gl=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:o.glow??0x6a5cff,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide}));gl.scale.setScalar(1.28);m.add(gl);
  root.add(m);return {m,y,ph:seed};
}
export function islandMat(o={}){return hatch(toon(0xffffff,{vertexColors:true,emissive:o.emissive??0x3a5cff,emissiveIntensity:.22}),{strength:.65,scale:5,tint:o.tint??0x3a1fa0})}

// Pulsing data/energy tether between points. cols: [base,pulse] as 0..1 rgb arrays.
export function tetherMaterial(uT,base=[.2,.5,1],pulse=[.5,1,.7]){
  return new THREE.ShaderMaterial({uniforms:{uT},fog:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform float uT;varying vec2 vUv;void main(){float p=fract(vUv.x*14.-uT*.7);float pu=smoothstep(0.,.25,p)*(1.-smoothstep(.25,.8,p));vec3 c=mix(vec3(${base.join(',')}),vec3(${pulse.join(',')}),pu*.9);gl_FragColor=vec4(pow(c,vec3(2.2)),1.);
#include <colorspace_fragment>
}`});
}
export function tetherChain(root,points,tubeMat,haloColor=0x4a7cff){
  const haloMat=new THREE.MeshBasicMaterial({color:haloColor,transparent:true,opacity:.3,depthWrite:false,fog:false,blending:THREE.AdditiveBlending});
  const haloMat2=haloMat.clone();haloMat2.opacity=.1;
  const base=new THREE.CatmullRomCurve3(points);
  for(let k=0;k<2;k++){
    const pts=[];for(let i=0;i<=60;i++){const t=i/60,p=base.getPoint(t),tg=base.getTangent(t);const side=new THREE.Vector3(-tg.z,0,tg.x).normalize();
      const off=Math.sin(t*28+k*Math.PI)*(1.6*(1-t*.3));pts.push(p.clone().add(side.multiplyScalar(off)).add(new THREE.Vector3(0,Math.cos(t*28+k*Math.PI)*1.6,0)))}
    const cv=new THREE.CatmullRomCurve3(pts);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(cv,240,.8,6),tubeMat));
    root.add(new THREE.Mesh(new THREE.TubeGeometry(cv,120,2.6,8),haloMat));
    root.add(new THREE.Mesh(new THREE.TubeGeometry(cv,80,5.2,8),haloMat2));
  }
}
export function tetherLink(root,a,b,tubeMat,lift=14){
  const cv=new THREE.CatmullRomCurve3([new THREE.Vector3(a[0],a[1],a[2]),new THREE.Vector3((a[0]+b[0])/2,Math.max(a[1],b[1])+lift,(a[2]+b[2])/2),new THREE.Vector3(b[0],b[1],b[2])]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(cv,120,.4,6),tubeMat));
}

// Distant silhouette ring. rings: [[radius,color,height,seed]...]. spire: jaggedness of skyline.
export function peakRings(root,rings,o={}){
  const topC=o.top??0x7a8cff;
  rings.forEach(([R,color,H,sd])=>{
    const N=360,pos=[],idx=[],cl=[],top=new THREE.Color(topC),base=new THREE.Color(color),sh=new THREE.Color(color).multiplyScalar(.78),cc=new THREE.Color();
    for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
      const n=o.profile?o.profile(a,sd,i):ridge(Math.cos(a)*3+sd*9,Math.sin(a)*3+sd*4,5),spire=o.profile?0:Math.pow(vn(a*9+sd*20,sd),6)*1.3;
      const h=o.profile?H*n:H*(.25+.8*n+spire)*(.8+.4*vn(a*40,sd));
      pos.push(x*R,-8,z*R,x*R,h,z*R);
      const lit=.5+.5*Math.sin(a*7+sd*2);
      cc.copy(base);cl.push(cc.r,cc.g,cc.b);cc.copy(base).lerp(top,.55).lerp(sh,(1-lit)*.55);cl.push(cc.r,cc.g,cc.b)}
    for(let i=0;i<N;i++){const a=i*2,b=a+1,c2=a+2,d2=a+3;idx.push(a,c2,b,b,c2,d2)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.setIndex(idx);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));m.frustumCulled=false;root.add(m)});
}

// Camera-following falling particles (snow, data motes, confetti). o: color [r,g,b,a], count, fall speed, drift, size.
export function fallingParticles(root,uT,o={}){
  const NS=o.count??700,sp=new Float32Array(NS*3),sr=new Float32Array(NS),col=o.color??[.7,.88,1,.85];
  for(let i=0;i<NS;i++){sp[i*3]=Math.random()*90;sp[i*3+1]=Math.random()*45;sp[i*3+2]=Math.random()*90;sr[i]=Math.random()}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));sg.setAttribute('aR',new THREE.BufferAttribute(sr,1));
  const pts=new THREE.Points(sg,new THREE.ShaderMaterial({uniforms:{uT},transparent:true,depthWrite:false,fog:false,
    vertexShader:`uniform float uT;attribute float aR;varying float vR;void main(){vR=aR;vec3 box=vec3(90.,45.,90.);vec3 p=position;p.y-=uT*(${(o.fall??.9).toFixed(2)}+aR);p.x+=sin(uT*.3+aR*20.)*2.+uT*${(o.drift??.8).toFixed(2)};
      p=mod(p-cameraPosition+box*.5,box)-box*.5+cameraPosition;vec4 mv=viewMatrix*vec4(p,1.);gl_PointSize=clamp((1.+aR*2.)*${(o.size??70).toFixed(1)}/-mv.z,1.5,4.);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying float vR;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;vec3 c=vec3(${col[0]},${col[1]},${col[2]});${o.twoTone?'c=mix(c,vec3('+o.twoTone.join(',')+'),step(.5,vR));':''}gl_FragColor=vec4(c,${col[3]});}`}));
  pts.frustumCulled=false;root.add(pts);return pts;
}
