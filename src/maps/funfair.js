// Map 3: Funfair Frostpark. Config consumed by createWorld(scene,'funfair') and game.js.
import * as THREE from 'three';
import {PALETTE} from '../style.js';
import {sstep,fbm,ridge,vn} from '../mapkit.js';

const riverX=z=>24*Math.sin(z*.034+.8)+9*Math.sin(z*.085+2);
const riverW=z=>7.5+2.2*Math.sin(z*.07+2);
const BED=-1.7;
const terr=(h,s)=>{const t=h/s,f=t-Math.floor(t);return (Math.floor(t)+sstep(.62,1,f))*s};
function heightAt(x,z){
  const d=Math.abs(x-riverX(z)),w=riverW(z);
  const endF=1-sstep(90,106,Math.abs(z));
  const base=2.6+fbm(x*.018+3,z*.018)*4.5+fbm(x*.07,z*.07)*.4;
  const far=Math.max(sstep(58,108,d),sstep(80,122,Math.abs(z)))*sstep(30,70,Math.hypot(x,z));
  const M=terr(far*(8+62*ridge(x*.012+7,z*.012+2)),6.5);
  const spawn=sstep(22,55,Math.hypot(x,z));
  const bluff=sstep(w+6,w+34,d)*(2.2+2.2*vn(x*.1,z*.1))*(.3+.7*spawn);
  const bed=sstep(w,w+9,d);
  const land=base+M+bluff;
  const bm=(1-bed)*endF;
  return land*(1-bm)+BED*bm;
}
const cSnow=new THREE.Color(0xf6faff),cLav=new THREE.Color(0xc9c4f4),cPink=new THREE.Color(0xf0c6e8),cGrass=new THREE.Color(0x6fd05c),cSlope=new THREE.Color(0xb078c8),cWet=new THREE.Color(0x58c8d8),cDeep=new THREE.Color(0x6a3a9a),cHigh=new THREE.Color(0xffffff);

const SKY_EXTRA=`
vec3 skyExtra(vec3 d,vec3 c){
  vec3 S=normalize(vec3(-.55,.26,-1.));float sd=max(dot(d,S),0.);
  c+=vec3(1.,.6,.5)*pow(sd,6.)*.5+vec3(1.,.92,.7)*pow(sd,120.)*1.1;
  float h=d.y;vec2 uv=d.xz/(h+.38)*1.1+vec2(uT*.01,0.);
  float n=fbmz(uv*1.5),n2=fbmz(uv*1.5+vec2(.1,.16));
  float cl=smoothstep(.5,.55,n),sh=cl*(1.-smoothstep(.5,.55,n2));
  float vis=smoothstep(-.02,.12,h)*(1.-.45*smoothstep(.6,1.,h));
  vec3 cc=mix(vec3(1.,.97,.98),vec3(.78,.7,.95),sh);
  cc=mix(cc,vec3(.1,.07,.25),(cl-smoothstep(.5,.51,n+.012))*.0);
  c=mix(c,cc,cl*vis*.95);
  float ed=smoothstep(.5,.512,n)-smoothstep(.512,.524,n);
  c=mix(c,vec3(.12,.09,.3),ed*vis*.5);
  vec2 g=vec2(atan(d.z,d.x)*14.,h*14.);vec2 gi=floor(g);float hs=h21(gi);
  float fw=step(.93,hs)*smoothstep(.45,0.,length(fract(g)-.5))*(.5+.5*sin(uT*3.+hs*30.))*smoothstep(.1,.5,h)*(1.-cl*vis);
  c+=mix(vec3(1.,.3,.5),vec3(1.,.9,.3),step(.5,fract(hs*7.)))*fw*.6;
  return c;
}`;

const WATER_EXTRA=`
vec3 waterExtra(vec3 c,vec2 p,vec3 w,float m){
  float sl=1.-m;
  vec2 q=p*2.2;float a=fbmz(q+uT*.12);
  float s=sin(q.x*1.5+q.y*.9+a*9.-uT*1.1)*.5+.5;
  c=mix(c,vec3(1.,.2,.72),smoothstep(.62,.7,s)*.5*sl);
  c=mix(c,vec3(1.,.92,.2),smoothstep(.7,.78,vnz(q*1.6-uT*.1))*.4*sl);
  vec2 cp=w.xz*.5;vec2 ci=floor(cp);vec2 o=.5+.3*sin(uT*.5+6.28*h22(ci));
  float r=length(fract(cp)-o);float k=step(.5,h21(ci+3.));
  float chunk=(1.-smoothstep(.2,.24,r))*k;
  c=mix(c,vec3(.55,.95,.6),(1.-smoothstep(.15,.2,r))*k*.0);
  c=mix(c,vec3(.95,1.,.98),chunk*.8*sl);
  c=mix(c,vec3(.15,.1,.2),(smoothstep(.2,.225,r)-smoothstep(.225,.25,r))*k*.55*sl);
  vec2 bp=w.xz*1.7;vec2 bi=floor(bp);float bb=h21(bi+9.);float br=length(fract(bp)-.5);
  float ph=fract(uT*.35+bb);float ring=smoothstep(.06,.0,abs(br-(.08+.25*ph)))*step(.7,bb);
  c=mix(c,vec3(1.,.95,.5),ring*(1.-ph)*.9*sl);
  c+=vec3(.8,1.,1.)*pow(vnz(w.xz*2.5+uT*.6),16.)*.5*m;
  return c;
}`;

export default {
  id:'funfair',name:'FUNFAIR FROSTPARK',short:'FUNFAIR',blurb:'FERRIS WHEEL / BIG TOP / RANCID SLUSHIE RIVERS',accent:'#ff4d4d',
  bounds:120,heightAt,
  fog:{color:0xc4b0ec,near:110,far:520},background:0xc4b0ec,
  lights:[{type:'hemi',sky:0xbfe4ff,ground:0xb080d8,i:.95},{type:'dir',color:0xfff0dc,i:1.6,pos:[-60,80,-40]},{type:'dir',color:0xff7ad0,i:.55,pos:[50,30,70]}],
  sky:{top:[.16,.36,.82],mid:[.46,.7,.98],hor:[1,.78,.78],gnd:[.62,.5,.82],moon:0,aurora:0,stars:.15,extra:SKY_EXTRA},
  water:{sl0:[.52,.82,.05],sl1:[.95,.9,.15],slMax:[1,1,.7],crack:[1,.1,.65],ring:[1,.5,.9],edge:[1,.2,.55],
    cl0:[.05,.78,.88],cl1:[.25,.95,.95],streak:[.85,1,1],foam:[1,1,1],fz0:[.75,.97,1],fz1:[.55,.85,1],far:[.55,.5,.2],farCl:[.3,.75,.9],extra:WATER_EXTRA},
  river:{x:riverX,w:riverW,zb:[-100,-50,0,50,100],radius:[16,20,24,30],waterY:-.45},
  terrain:{size:560,seg:420,hatchTint:0x7a4ab8,
    rock:{c1:0xc482c0,c2:0xe8a0b8,c3:0x8a5ac8,vein:0xffe6f8,veinAmt:.25,thr:.3,hi:.5},
    colorAt(x,y,z,slope,c){
      c.copy(cSnow).lerp(cLav,sstep(.45,.7,vn(x*.05,z*.05))*.7).lerp(cPink,sstep(.6,.8,vn(x*.09+9,z*.09))*.35);
      c.lerp(cGrass,sstep(.55,.72,vn(x*.04+30,z*.04))*(1-sstep(1.5,4,y))*.9);
      c.lerp(cHigh,sstep(30,55,y)*.5);c.lerp(cSlope,sstep(.1,.4,slope)*.8);
      c.lerp(cWet,(1-sstep(-1.4,1.2,y))*.85);c.lerp(cDeep,1-sstep(-2,-1.1,y));
    }},
  enemy:{impHp:1.6,golemHp:1.7,dmg:1.4,speed:1.15,impBase:6,golemExtra:1,bossHp:1300,bossDmg:1.4},
  boss:{name:'GRIME RINGMASTER',tint:0xffa040,glow:0xffd23a,variant:'carnival',rise:'THE GRIME RINGMASTER TAKES THE STAGE',fall:'THE BIG TOP COLLAPSES'},
  intro:['WELCOME TO THE FROSTPARK','FOLLOW THE BEACON TO THE SLUSHIE RIVERS'],
  thumb:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120"><defs><linearGradient id="fs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb4ef"/><stop offset="1" stop-color="#ffd2c0"/></linearGradient></defs><rect width="240" height="120" fill="url(#fs)"/><g fill="#fff" stroke="#14123a" stroke-width="1.5"><ellipse cx="30" cy="22" rx="20" ry="8"/><ellipse cx="205" cy="18" rx="22" ry="8"/><ellipse cx="120" cy="12" rx="14" ry="5"/></g><path d="M0 96 Q60 84 120 94 T240 90 V120 H0Z" fill="#5fcf4a" stroke="#14123a" stroke-width="2"/><g fill="#d88ab8" stroke="#14123a" stroke-width="2"><rect x="104" y="62" width="40" height="30"/><rect x="150" y="70" width="46" height="26" fill="#9a62d0"/></g><rect x="104" y="58" width="40" height="8" fill="#6fd05c" stroke="#14123a" stroke-width="2"/><rect x="198" y="52" width="30" height="44" fill="#a870d8" stroke="#14123a" stroke-width="2"/><rect x="198" y="48" width="30" height="8" fill="#6fd05c" stroke="#14123a" stroke-width="2"/><g stroke="#14123a" stroke-width="2"><circle cx="212" cy="76" r="12" fill="#fff"/><circle cx="212" cy="76" r="8" fill="#2a6aea"/><circle cx="212" cy="76" r="4" fill="#e83a3a"/></g><path d="M218 48V30" stroke="#14123a" stroke-width="2"/><path d="M218 30l14 4-14 4z" fill="#e83a3a" stroke="#14123a" stroke-width="1.5"/><g stroke="#14123a" stroke-width="2" fill="none"><circle cx="56" cy="52" r="30" stroke="#e8923a" stroke-width="4"/><path d="M56 22V82M26 52H86M35 31L77 73M77 31L35 73" stroke-width="1.5"/></g><g fill="#e83a3a" stroke="#14123a" stroke-width="1.5"><rect x="24" y="48" width="8" height="7"/><rect x="80" y="48" width="8" height="7"/><rect x="52" y="20" width="8" height="7"/><rect x="52" y="78" width="8" height="7"/></g><path d="M22 96 V84 L56 64 L90 84 V96Z" fill="#fff" stroke="#14123a" stroke-width="2.5"/><path d="M34 80 L56 64 L48 80Z M60 76 L56 64 L78 80Z M44 90H56L52 96H40Z" fill="#e83a3a"/><path d="M22 96 V84 L56 64 L90 84 V96Z M56 64 V50" fill="none" stroke="#14123a" stroke-width="2.5"/><rect x="48" y="88" width="16" height="8" fill="#1c1040"/></svg>`,
  props(ctx){
    const {THREE,root,uT,heightAt,colliders,crystals,streams,kit}=ctx,{toon,hatch}=kit;
    const INK=PALETTE.ink,ink=new THREE.MeshBasicMaterial({color:INK,side:THREE.BackSide});
    const mat=(c,o)=>hatch(toon(c,o),{strength:.55,scale:5,tint:0x6a3aa8});
    const M={red:mat(0xe83a3a),white:mat(0xfff4ea),blue:mat(0x2a6aea),yellow:mat(0xffd23a,{emissive:0x664400,emissiveIntensity:.25}),pink:mat(0xe89ab8),purple:mat(0x8a5ac8),dpurple:mat(0x5a3a9a),green:mat(0x5fcf4a),bush:mat(0x3fb04a),dark:new THREE.MeshBasicMaterial({color:0x1c1040}),wood:mat(0x8a5a4a),vc:mat(0xffffff,{vertexColors:true,side:THREE.DoubleSide})};
    const add=(parent,geo,m,x,y,z,inkS)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);if(inkS){const k=new THREE.Mesh(geo,ink);k.scale.set(...inkS);o.add(k)}return o};
    const ik=(w,h,d,t=.5)=>[1+t/w,1+t/h,1+t/d];
    const vRay=new THREE.Vector3();
    const strut=(parent,a,b,r,m)=>{const d=vRay.subVectors(b,a),L=d.length();const g=new THREE.CylinderGeometry(r,r,L,6);const o=new THREE.Mesh(g,m);o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());parent.add(o);const k=new THREE.Mesh(g,ink);k.scale.set(1.5,1,1.5);o.add(k);return o};
    const striped=(geo,segs,c1,c2)=>{const g=geo.toNonIndexed(),p=g.attributes.position,col=new Float32Array(p.count*3),a=new THREE.Color(c1),b=new THREE.Color(c2);
      for(let i=0;i<p.count;i+=3){const cx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,cz=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;const k=Math.floor((Math.atan2(cx,cz)+Math.PI)/(Math.PI*2)*segs+1e-4);const c=k%2?a:b;for(let j=0;j<3;j++){col[(i+j)*3]=c.r;col[(i+j)*3+1]=c.g;col[(i+j)*3+2]=c.b}}
      g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();return g};
    const flags=[];
    const flag=(parent,x,y,z,s=1,c=M.red)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,.9,0,0,-.9,0,2.6,0,0],3));g.setIndex([0,1,2,0,2,1]);g.computeVertexNormals();
      const pivot=new THREE.Group();pivot.position.set(x,y,z);pivot.scale.setScalar(s);parent.add(pivot);const f=new THREE.Mesh(g,c);pivot.add(f);const k=new THREE.Mesh(g,ink);k.scale.setScalar(1.18);k.position.x=-.15;pivot.add(k);flags.push(pivot);return pivot};

    // ---- big top tents
    const RINGW=new THREE.TorusGeometry(1,.06,6,28);
    function tent(x,z,sc,yaw){
      const y=heightAt(x,z),g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=yaw;root.add(g);
      const S=16,R=6*sc,wh=3.4*sc,rh=4.6*sc;
      const wallG=new THREE.CylinderGeometry(R,R,wh,S,1,true),roofG=new THREE.CylinderGeometry(R*.12,R*1.1,rh,S,1,true);
      const wall=add(g,striped(wallG,S,0xe83a3a,0xfff4ea),M.vc,0,wh/2,0);
      const wi=new THREE.Mesh(wallG,ink);wi.scale.set(1.025,1.01,1.025);wall.add(wi);
      const roof=add(g,striped(roofG,S,0xe83a3a,0xfff4ea),M.vc,0,wh+rh/2,0);
      const ri=new THREE.Mesh(roofG,ink);ri.scale.set(1.03,1.03,1.03);roof.add(ri);
      const rg=new THREE.Mesh(RINGW,M.red);rg.scale.setScalar(R*1.1);rg.rotation.x=Math.PI/2;rg.position.y=wh;g.add(rg);
      const top=add(g,new THREE.SphereGeometry(.5*sc,8,6),M.yellow,0,wh+rh+.2*sc,0,[1.3,1.3,1.3]);
      add(g,new THREE.CylinderGeometry(.1*sc,.1*sc,3*sc,6),M.white,0,wh+rh+1.5*sc,0,[2,1,2]);
      flag(g,0,wh+rh+2.6*sc,0,1.1*sc,M.red);
      const door=add(g,new THREE.PlaneGeometry(R*.45,wh*.9),M.dark,0,wh*.45,R*1.005);
      const dl=add(g,new THREE.PlaneGeometry(R*.35,wh*.8),new THREE.MeshBasicMaterial({color:0xff9a4a}),0,wh*.4,R*.99);
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2;if(Math.abs(Math.sin(a/2))<.3)continue;flag(g,Math.sin(a)*R*1.06,wh-.3*sc,Math.cos(a)*R*1.06,.55*sc,i%2?M.blue:M.yellow)}
      colliders.push({x,y:y+wh,z,r:R*.95,solid:true});
      return {g,x,z,top:new THREE.Vector3(x,y+wh+rh+3*sc,z),R,y};
    }

    // ---- ferris wheel
    function ferris(x,z,R,yaw){
      const gy=Math.max(heightAt(x,z),heightAt(x+R*.6,z),heightAt(x-R*.6,z)),wy=gy+R+3.5;
      const G=new THREE.Group();G.position.set(x,wy,z);G.rotation.y=yaw;root.add(G);
      const W=new THREE.Group();G.add(W);
      for(const zz of [-1.7,1.7]){
        const tg=new THREE.TorusGeometry(R,.6,8,64);add(W,tg,M.red,0,0,zz).rotation.z=0;
        const to=new THREE.Mesh(new THREE.TorusGeometry(R,.82,8,64),ink);to.position.z=zz;W.add(to);
        const ti=new THREE.TorusGeometry(R*.62,.36,8,48);add(W,ti,M.white,0,0,zz);
        const tj=new THREE.Mesh(new THREE.TorusGeometry(R*.62,.55,8,48),ink);tj.position.z=zz;W.add(tj);
      }
      const NS=16,spk=new THREE.BoxGeometry(R*2,.34,.34),spokes=new THREE.InstancedMesh(spk,M.white,NS*2),dm=new THREE.Object3D();
      for(let i=0;i<NS;i++)for(let s=0;s<2;s++){dm.position.set(0,0,s?1.7:-1.7);dm.rotation.set(0,0,i/NS*Math.PI);dm.updateMatrix();spokes.setMatrixAt(i*NS/NS*2+s,dm.matrix)}
      spokes.count=NS*2;W.add(spokes);
      const hub=add(W,new THREE.CylinderGeometry(2.4,2.4,5,14).rotateX(Math.PI/2),M.yellow,0,0,0,[1.1,1.1,1.1]);
      const hub2=add(W,new THREE.CylinderGeometry(1.2,1.2,7.2,12).rotateX(Math.PI/2),M.red,0,0,0,[1.15,1.15,1.1]);
      const gond=[],gc=[M.red,M.white,M.blue,M.yellow],gb=new THREE.BoxGeometry(3,2.3,3),gr=new THREE.ConeGeometry(2.5,1.4,4);
      for(let i=0;i<16;i++){const a=i/16*Math.PI*2,piv=new THREE.Group();piv.position.set(Math.cos(a)*R,Math.sin(a)*R,0);W.add(piv);
        add(piv,new THREE.CylinderGeometry(.14,.14,1.2,5),M.dpurple,0,-.5,0);
        const b=add(piv,gb,gc[i%4],0,-2.2,0,ik(3,2.3,3,.4));add(piv,gr,M.red,0,-.35-.15,0).position.y=-.65-.15;
        piv.children[2].rotation.y=Math.PI/4;piv.children[2].scale.set(1.2,.9,1.2);piv.children[2].position.y=-.75;
        const win=add(piv,new THREE.BoxGeometry(2.1,.8,3.08),M.dark,0,-2,0);
        gond.push(piv)}
      const nb=64,bg=new THREE.SphereGeometry(.4,6,5),bulbs=[0,1,2].map(k=>{const m=new THREE.InstancedMesh(bg,new THREE.MeshBasicMaterial({color:[0xffd23a,0xff3d6a,0x4af0ff][k]}),24);m.count=0;W.add(m);return m});
      for(let i=0;i<nb;i++){const a=i/nb*Math.PI*2,m=bulbs[i%3];dm.position.set(Math.cos(a)*(R+.9),Math.sin(a)*(R+.9),i%2?1.7:-1.7);dm.rotation.set(0,0,0);dm.updateMatrix();m.setMatrixAt(m.count++,dm.matrix)}
      const fl=[new THREE.Vector3(-R*.62,-(wy-gy),-5.5),new THREE.Vector3(R*.62,-(wy-gy),-5.5),new THREE.Vector3(-R*.62,-(wy-gy),5.5),new THREE.Vector3(R*.62,-(wy-gy),5.5)];
      fl.forEach((f,i)=>{strut(G,new THREE.Vector3(0,0,i<2?-3.4:3.4),f,.75,i%2?M.white:M.red);
        const fp=add(G,new THREE.CylinderGeometry(2,2.4,1,8),M.dpurple,f.x,f.y,f.z,[1.1,1.3,1.1]);
        const wx=x+Math.cos(yaw)*f.x+Math.sin(yaw)*f.z,wz=z-Math.sin(yaw)*f.x+Math.cos(yaw)*f.z;colliders.push({x:wx,y:gy+3,z:wz,r:2.4,solid:true})});
      strut(G,new THREE.Vector3(-R*.62,-(wy-gy)+1,-5.5),new THREE.Vector3(-R*.62,-(wy-gy)+1,5.5),.4,M.white);
      strut(G,new THREE.Vector3(R*.62,-(wy-gy)+1,-5.5),new THREE.Vector3(R*.62,-(wy-gy)+1,5.5),.4,M.white);
      colliders.push({x,y:gy+R,z,r:R*.5,fade:true});
      ctx.onUpdate((t,dt)=>{W.rotation.z-=dt*.11;for(const p of gond)p.rotation.z=-W.rotation.z;bulbs.forEach((b,k)=>{b.visible=((Math.floor(t*2.5)+k)%3)!==0})});
      return {G,gy,wy,R,x,z};
    }

    // ---- archery target
    const tgeo=[1,.8,.6,.4,.2].map(r=>new THREE.CylinderGeometry(r,r,.28,20).rotateX(Math.PI/2)),tcols=[M.white,M.blue,M.white,M.red,M.yellow];
    function target(parent,x,y,z,sc,yaw){
      const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=yaw;g.scale.setScalar(sc);parent.add(g);
      tgeo.forEach((geo,i)=>add(g,geo,tcols[i],0,2.6,i*.05,i==0?[1.1,1.1,1.5]:null));
      strut(g,new THREE.Vector3(0,2.6,-.2),new THREE.Vector3(-1.1,0,-1),.12,M.wood);strut(g,new THREE.Vector3(0,2.6,-.2),new THREE.Vector3(1.1,0,-1),.12,M.wood);strut(g,new THREE.Vector3(0,2.6,-.2),new THREE.Vector3(0,0,.9),.12,M.wood);
      return g;
    }

    // ---- floating stepped slabs
    const bobbers=[],cone6=new THREE.ConeGeometry(1,1,6,1);
    function slab(x,y,z,w,d,o={}){
      const g=new THREE.Group();g.position.set(x,y,z);root.add(g);
      const hs=[3,2.6,2.2];let yy=0;
      for(let k=0;k<(o.tiers??2);k++){const ww=w*(1-.16*k),dd=d*(1-.16*k);const bw=add(g,new THREE.BoxGeometry(ww,hs[k],dd),k%2?M.purple:M.pink,k*.6,yy+hs[k]/2,0,ik(ww,hs[k],dd,.7));yy+=hs[k]}
      const ww=w*(1-.16*((o.tiers??2)-1)),dd=d*(1-.16*((o.tiers??2)-1)),ox=((o.tiers??2)-1)*.6;
      add(g,new THREE.BoxGeometry(ww+.5,.9,dd+.5),M.green,ox,yy+.45,0,ik(ww+.5,.9,dd+.5,.6));
      const und=add(g,cone6,M.dpurple,0,-w*.28,0);und.rotation.x=Math.PI;und.scale.set(w*.5,w*.56,d*.5);
      const ul=new THREE.Mesh(cone6,ink);ul.scale.setScalar(1.06);und.add(ul);
      const nb=o.bushes??3;for(let i=0;i<nb;i++){const a=i*2.4+x,r=.25+.55*Math.abs(Math.sin(i*1.7));const b=add(g,new THREE.IcosahedronGeometry(1+.5*Math.sin(i),1),M.bush,Math.cos(a)*ww*.35+ox,yy+1.3,Math.sin(a)*dd*.3,[1.1,1.1,1.1]);b.scale.set(1,.8,1)}
      if(o.flag)flag(g,ww*.3+ox,yy+8,dd*.1,1.6);
      if(o.flag)add(g,new THREE.CylinderGeometry(.15,.15,8,6),M.white,ww*.3+ox,yy+4.5,dd*.1,[2,1,2]);
      if(o.target)target(g,-ww*.2+ox,yy+.9,dd*.15,o.ts??1.5,o.tyaw??0);
      if(o.tent){const tt=tent(0,0,o.tent,0);root.remove(tt.g);tt.g.position.set(ox,yy+.9,-dd*.1);g.add(tt.g);colliders.pop()}
      bobbers.push({g,y,ph:x*.1+z*.07,a:o.amp??.6});
      return g;
    }

    // ---- strings of lights / bunting
    const pen=[],beads=[[],[],[]],lineV=[];
    function string(a,b,sag,kind){
      const n=Math.ceil(a.distanceTo(b)/(kind?1.6:2.4)),pr=new THREE.Vector3(),pv=new THREE.Vector3();
      const P=t=>pr.lerpVectors(a,b,t).setY(THREE.MathUtils.lerp(a.y,b.y,t)-sag*4*t*(1-t)).clone();
      let prev=P(0);
      for(let i=1;i<=n;i++){const p=P(i/n);lineV.push(prev.x,prev.y,prev.z,p.x,p.y,p.z);
        if(kind)beads[i%3].push(p.x,p.y-.15,p.z);else if(i<n){const yaw=Math.atan2(b.x-a.x,b.z-a.z);pen.push([p.x,p.y,p.z,yaw,i])}
        prev=p}
    }
    const V=(x,y,z)=>new THREE.Vector3(x,y,z);

    // ---- layout
    const rW=ctx.cfg.river.w,S=streams,big=S[3];
    const wf=ferris(big.x+32,big.z+14,28,-.45);
    const tBig=tent(big.x+6,big.z+30,1.7,3.14);
    const t1=tent(S[1].x-rW(S[1].z)-20,S[1].z+6,1.15,.5),t2=tent(S[0].x+rW(S[0].z)+22,S[0].z-4,1.3,-.6),t3=tent(S[2].x-rW(S[2].z)-18,S[2].z-12,1,.9),t4=tent(big.x-rW(big.z)-26,big.z-8,1.2,.2);
    // carousel near stream 2
    {const cx=S[2].x+rW(S[2].z)+17,cz=S[2].z+10,cy=heightAt(cx,cz),g=new THREE.Group();g.position.set(cx,cy,cz);root.add(g);
      add(g,new THREE.CylinderGeometry(6,6.4,.8,20),M.white,0,.4,0,[1.05,1.3,1.05]);
      const roofG=new THREE.CylinderGeometry(.3,7.3,3.6,16,1,true);const ro=add(g,striped(roofG,16,0xe83a3a,0xfff4ea),M.vc,0,8.4,0);const rk=new THREE.Mesh(roofG,ink);rk.scale.setScalar(1.03);ro.add(rk);
      add(g,new THREE.CylinderGeometry(.35,.35,7,8),M.yellow,0,4,0,[1.5,1,1.5]);flag(g,0,10.7,0,1);
      const rot=new THREE.Group();g.add(rot);const hg=new THREE.BoxGeometry(.7,.6,1.5),hh=new THREE.SphereGeometry(.4,8,6),hs=[];
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2,p=new THREE.Group();p.position.set(Math.cos(a)*4.4,2.4,Math.sin(a)*4.4);p.rotation.y=-a;rot.add(p);
        add(p,new THREE.CylinderGeometry(.08,.08,5.6,5),M.white,0,1.8,0);const hb=new THREE.Group();p.add(hb);add(hb,hg,[M.white,M.pink,M.blue,M.yellow][i%4],0,0,0,ik(.7,.6,1.5,.3));add(hb,hh,[M.white,M.pink,M.blue,M.yellow][i%4],0,.5,.7,[1.2,1.2,1.2]);hs.push(hb)}
      colliders.push({x:cx,y:cy+3,z:cz,r:6.2,solid:true});
      ctx.onUpdate((t)=>{rot.rotation.y=t*.5;hs.forEach((h,i)=>{h.position.y=Math.sin(t*2.2+i*.8)*.5})})}
    // ground targets
    [[S[0],-1,16],[S[1],1,12],[S[2],-1,-14],[S[3],-1,-20]].forEach(([s,sd,dz],i)=>{const x=s.x+sd*(rW(s.z)+9),z=s.z+dz,y=heightAt(x,z);target(root,x,y,z,1.7,sd*.6+i);colliders.push({x,y:y+2,z,r:1.6,solid:true})});

    // floating cliffs chain
    slab(-48,20,-84,30,22,{flag:1,target:1,tyaw:.5,tiers:3});
    slab(-8,30,-120,26,20,{tiers:2,target:1,ts:2,bushes:5});
    slab(40,24,-100,34,24,{flag:1,tiers:3,tent:.9});
    slab(84,34,-60,24,18,{target:1,tyaw:-.5,tiers:2});
    slab(-92,26,-20,22,18,{flag:1,tiers:2,target:1});
    slab(-82,40,40,28,22,{tiers:3,flag:1});
    slab(78,30,10,22,18,{tiers:2,target:1,tyaw:-.8});
    slab(-60,36,120,34,24,{flag:1,tiers:3,target:1});
    slab(18,58,-165,40,28,{tiers:3,flag:1,bushes:6,amp:1.2});
    slab(-110,60,-120,34,24,{tiers:3,target:1,ts:2.4});
    slab(120,56,-130,36,26,{tiers:3,flag:1});
    slab(-30,70,-215,44,30,{tiers:3,flag:1,target:1,ts:2.6,amp:1.5});

    // arches
    const archMat=hatch(toon(0xffffff,{vertexColors:true,emissive:0xff6aa8,emissiveIntensity:.18}),{strength:.6,scale:5,tint:0x7a3aa8});
    const A=[[-18,-50,60,46,.4,5],[56,-96,46,30,-.5,4],[-100,-140,72,54,.9,6],[110,-20,44,24,-1.1,3.6],[-10,150,64,44,.2,5]];
    A.forEach(a=>kit.makeArch(root,heightAt,a[0],a[1],a[2],a[3],a[4],a[5],archMat,{colA:0xffc0e0,colB:0xa87aff,lineColor:0xffd23a}));

    // crystals (red / gold slushie crystals)
    const ck=kit.crystalKit(root,heightAt,colliders,crystals,{colA:0xff6a8a,emA:0xff2050,colB:0xffd23a,emB:0xffa010,haloA:0xff3a6a,haloB:0xffc030});
    S.forEach((s,i)=>{const dx=(i%2?1:-1)*(rW(s.z)+9);ck.cluster(s.x+dx,s.z+6,3.2+i*.4,i%2==0);ck.cluster(s.x-dx*.7,s.z-9,2.2,false)});
    for(let i=0;i<12;i++){const x=(kit.hash(i,77)-.5)*220,z=(kit.hash(i,78)-.5)*220-20;if(heightAt(x,z)<0)continue;ck.cluster(x,z,1.6+kit.hash(i,3)*2.2,i%4==0)}
    kit.scatterRocks(root,heightAt,colliders,{colors:[0xc482c0,0xe8a0b8,0x8a5ac8],count:70});

    // snowy pines (instanced)
    {const NP=90,pg=new THREE.ConeGeometry(1.5,4.2,7),cap=new THREE.ConeGeometry(1.1,2.4,7),pi=new THREE.InstancedMesh(pg,M.bush,NP*2),pc=new THREE.InstancedMesh(cap,M.white,NP*2),dm=new THREE.Object3D();let n=0;
      for(let i=0;i<NP*3&&n<NP;i++){const x=(kit.hash(i,41)-.5)*230,z=(kit.hash(i,42)-.5)*230,y=heightAt(x,z);if(y<1.2||y>12)continue;if(Math.hypot(x,z)<14)continue;if(Math.abs(x-ctx.cfg.river.x(z))<rW(z)+6)continue;
        const sc=.8+kit.hash(i,43)*1.1;for(let k=0;k<2;k++){dm.position.set(x,y+(1.6+k*2.1)*sc,z);dm.scale.setScalar(sc*(1-k*.4));dm.rotation.y=i;dm.updateMatrix();pi.setMatrixAt(n*2+k,dm.matrix);dm.position.y+=.35*sc*(1-k*.4);dm.updateMatrix();pc.setMatrixAt(n*2+k,dm.matrix)}
        if(Math.hypot(x,z)<100)colliders.push({x,y:y+2,z,r:.7*sc,solid:true});n++}
      pi.count=n*2;pc.count=n*2;root.add(pi,pc)}

    // light strings / bunting
    const wtop=(f)=>V(f.x,f.y,f.z);
    string(V(tBig.top.x,tBig.top.y,tBig.top.z),V(wf.x-12,wf.gy+22,wf.z-6),5,1);
    string(tBig.top.clone(),V(t4.top.x,t4.top.y,t4.top.z),6,0);
    string(V(t4.top.x,t4.top.y,t4.top.z),V(t3.top.x,t3.top.y,t3.top.z),12,0);
    string(V(t3.top.x,t3.top.y,t3.top.z),V(t1.top.x,t1.top.y,t1.top.z),10,1);
    string(V(t1.top.x,t1.top.y,t1.top.z),V(t2.top.x,t2.top.y,t2.top.z),14,0);
    string(V(t2.top.x,t2.top.y,t2.top.z),V(S[0].x+30,28,S[0].z-30),8,1);
    string(V(t3.top.x,t3.top.y,t3.top.z),V(t1.top.x,t1.top.y+4,t1.top.z+10),8,0);
    {const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(lineV,3));const ln=new THREE.LineSegments(sg,new THREE.LineBasicMaterial({color:INK}));ln.frustumCulled=false;root.add(ln)}
    {const pgeo=new THREE.BufferGeometry();pgeo.setAttribute('position',new THREE.Float32BufferAttribute([-.7,0,0,.7,0,0,0,-1.5,0],3));pgeo.setIndex([0,1,2,0,2,1]);pgeo.computeVertexNormals();
      const im=new THREE.InstancedMesh(pgeo,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),pen.length),dm=new THREE.Object3D(),cc=[0xe83a3a,0xfff4ea,0x2a6aea,0xffd23a];
      pen.forEach((q,i)=>{dm.position.set(q[0],q[1],q[2]);dm.rotation.set(0,q[3],0);dm.scale.setScalar(1);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);im.setColorAt(i,new THREE.Color(cc[q[4]%4]))});root.add(im)}
    const bm=[0xffd23a,0xff3d6a,0x4af0ff].map(c=>new THREE.MeshBasicMaterial({color:c})),bgeo=new THREE.SphereGeometry(.35,6,5),bis=beads.map((b,k)=>{const m=new THREE.InstancedMesh(bgeo,bm[k],Math.max(1,b.length/3)),dm=new THREE.Object3D();for(let i=0;i<b.length/3;i++){dm.position.set(b[i*3],b[i*3+1],b[i*3+2]);dm.updateMatrix();m.setMatrixAt(i,dm.matrix)}root.add(m);return m});

    // clouds (instanced, drifting)
    {const NC=18,PU=7,cm=new THREE.MeshBasicMaterial({color:0xffffff}),cg=new THREE.SphereGeometry(1,10,8),ci=new THREE.InstancedMesh(cg,cm,NC*PU),co=new THREE.InstancedMesh(cg,new THREE.MeshBasicMaterial({color:0x3a2a7a,side:THREE.BackSide}),NC*PU),dm=new THREE.Object3D(),grp=new THREE.Group();let n=0;
      for(let c=0;c<NC;c++){const a=c/NC*Math.PI*2+kit.hash(c,5),r=(c%3?190:130)+kit.hash(c,6)*180,cx=Math.cos(a)*r,cz=Math.sin(a)*r,cy=(c%3?70:55)+kit.hash(c,7)*70,s=10+kit.hash(c,8)*14;
        for(let p=0;p<PU;p++){const u=(p-3)/3,rr=s*(.75+.5*Math.sin(p*2.3+c)*Math.sin(p*1.1)),x=cx+u*s*2.1,y=cy+(1-Math.abs(u))*s*.5*Math.abs(Math.sin(p+c))-s*.2,z=cz+Math.sin(p*3.1+c)*s*.4;
          dm.position.set(x,y,z);dm.scale.set(rr,rr*.8,rr);dm.updateMatrix();ci.setMatrixAt(n,dm.matrix);dm.scale.multiplyScalar(1.07);dm.updateMatrix();co.setMatrixAt(n,dm.matrix);n++}}
      grp.add(co,ci);root.add(grp);ctx.onUpdate(t=>{grp.rotation.y=t*.004})}

    // distant silhouettes
    kit.peakRings(root,[[330,0xb88ad0,60,1],[430,0xa478c8,85,2],[540,0x9468c0,110,3]],{top:0xffd8e8});
    kit.fallingParticles(root,uT,{color:[1,1,1,.9],twoTone:[1,.45,.7],count:800,fall:1.1});

    ctx.onUpdate((t)=>{
      bobbers.forEach(o=>{o.g.position.y=o.y+Math.sin(t*.5+o.ph)*o.a;o.g.rotation.y=Math.sin(t*.1+o.ph)*.03});
      flags.forEach((f,i)=>{f.rotation.y=Math.sin(t*2.2+i)*.3});
      ck.pulse(t);bis.forEach((b,k)=>{b.visible=((Math.floor(t*2)+k)%3)!==0});
    });
  },
};
