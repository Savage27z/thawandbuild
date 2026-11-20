// Map 1: Glacier Valley. Config consumed by createWorld(scene,'glacier') and game.js.
import * as THREE from 'three';
import {PALETTE} from '../style.js';
import {sstep,fbm,ridge,vn} from '../mapkit.js';

const riverX=z=>28*Math.sin(z*.035)+10*Math.sin(z*.09+1);
const riverW=z=>8+2.5*Math.sin(z*.07+2);
const BED=-1.8;
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
const cIce=new THREE.Color(0x2a80f0),cLil=new THREE.Color(0x8a5cff),cSlope=new THREE.Color(0x4a2fc8),cWet=new THREE.Color(0x2a6aea),cDeep=new THREE.Color(0x1a2a8a),cHigh=new THREE.Color(0xbfe2ff);

export default {
  id:'glacier',name:'GLACIER VALLEY',short:'GLACIER',blurb:'FROZEN ARCHES / SLUDGE STREAMS / THE GRIME TITAN',accent:'#4da2ff',
  bounds:120,heightAt,
  fog:{color:0x1a1250,near:90,far:460},background:0x0b0a2e,
  lights:[{type:'hemi',sky:0x6a7cff,ground:0x4a1a90,i:.6},{type:'dir',color:0xd0daff,i:1.5,pos:[-60,80,-40]},{type:'dir',color:0xb06bff,i:.9,pos:[50,30,70]}],
  sky:{aurora:1},
  water:{},
  river:{x:riverX,w:riverW,zb:[-100,-50,0,50,100],radius:22,waterY:-.45},
  terrain:{size:560,seg:420,hatchTint:0x3a1fa0,
    rock:{c1:PALETTE.rock,c2:0x3a2f8a,c3:0x6a3a9a,vein:0x8ff2ff},
    colorAt(x,y,z,slope,c){
      c.copy(cIce).lerp(cLil,sstep(.5,.7,vn(x*.05,z*.05)));
      c.lerp(cHigh,sstep(18,45,y)*.7);c.lerp(cSlope,sstep(.12,.45,slope)*.8);
      c.lerp(cWet,(1-sstep(-1.4,1.4,y))*.8);c.lerp(cDeep,(1-sstep(-2,-1.2,y)));
    }},
  thumb:'<svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0a2e"/><stop offset="1" stop-color="#6a3cc8"/></linearGradient></defs><rect width="240" height="120" fill="url(#gs)"/><circle cx="185" cy="26" r="13" fill="#c8b8ff" stroke="#07061c" stroke-width="2"/><path d="M0 84L34 40 58 66 84 28 122 78 150 48 190 80 240 52V120H0Z" fill="#3a3fb0" stroke="#07061c" stroke-width="3" stroke-linejoin="round"/><path d="M34 40l-8 14 10-4 6 8 4-8z M84 28l-10 18 12-4 8 10 4-14z" fill="#dfe8ff"/><path d="M40 96Q80 20 130 52Q150 64 168 96" fill="none" stroke="#7ab4ff" stroke-width="9" stroke-linecap="round"/><path d="M40 96Q80 20 130 52Q150 64 168 96" fill="none" stroke="#07061c" stroke-width="2" transform="translate(0,-5)"/><path d="M0 96Q60 88 110 100T240 92V120H0Z" fill="#2a80f0" stroke="#07061c" stroke-width="3"/><path d="M96 120Q110 104 100 98Q120 96 140 98Q150 108 156 120Z" fill="#39ff88" stroke="#07061c" stroke-width="2.5"/><ellipse cx="204" cy="40" rx="14" ry="4" fill="#78c0ff" stroke="#07061c" stroke-width="2"/><ellipse cx="30" cy="22" rx="9" ry="3" fill="#78c0ff" stroke="#07061c" stroke-width="2"/></svg>',
  enemy:{impHp:1,golemHp:1,dmg:1,speed:1,impBase:4,golemExtra:0,bossHp:650,bossDmg:1},
  boss:{name:'GRIME TITAN',tint:null,glow:0xff2d8a,variant:'titan',rise:'THE GRIME TITAN RISES',fall:'GRIME TITAN FALLS'},
  intro:['THE ICE CRACKS','FIND THE SLUDGE STREAMS (FOLLOW THE GREEN BEACON)'],
  props(ctx){
    const {THREE,root,uT,heightAt,colliders,crystals,streams,kit}=ctx,{toon,hatch,sstep}=kit;
    const archMat=hatch(toon(0xffffff,{vertexColors:true,emissive:0x3a5cff,emissiveIntensity:.22}),{strength:.7,scale:5,tint:0x3a1fa0});
    const A1=kit.makeArch(root,heightAt,-22,-58,58,44,.35,5,archMat);
    kit.makeArch(root,heightAt,46,-92,44,28,-.6,3.8,archMat);
    kit.makeArch(root,heightAt,-95,-130,70,52,1.0,6,archMat);
    kit.makeArch(root,heightAt,100,-30,40,22,-1.1,3.4,archMat);

    const ck=kit.crystalKit(root,heightAt,colliders,crystals);
    const riverW=ctx.cfg.river.w;
    streams.forEach((s,i)=>{const dx=(i%2?1:-1)*(riverW(s.z)+9);ck.cluster(s.x+dx,s.z+6,3.4+i*.4,i%2==0);ck.cluster(s.x-dx*.7,s.z-9,2.2,false)});
    for(let i=0;i<14;i++){const x=(kit.hash(i,77)-.5)*220,z=(kit.hash(i,78)-.5)*220-30;if(heightAt(x,z)<0)continue;ck.cluster(x,z,1.8+kit.hash(i,3)*2.5,i%4==0)}
    kit.scatterRocks(root,heightAt,colliders);

    const islands=[],iceMat=kit.islandMat();
    const IS=[[40,54,-62,9],[26,42,-76,5],[11,34,-88,3.5],[-5,29,-96,2.6],[-19,25,-102,1.9],[-70,70,-165,16],[78,78,-150,13],[-40,48,-120,6]];
    IS.forEach((q,i)=>islands.push(kit.makeIsland(root,q[0],q[1],q[2],q[3],i*3.7,iceMat,{top:0x78c0ff,mid:PALETTE.iceShadow,under:0x3a1f8a})));
    const tube=kit.tetherMaterial(uT);
    kit.tetherChain(root,[A1.crown,...IS.slice(0,5).map(q=>new THREE.Vector3(q[0],q[1],q[2]))],tube);
    kit.tetherLink(root,IS[7],IS[5],tube);kit.tetherLink(root,IS[6],IS[0],tube);
    kit.peakRings(root,[[330,0x2a2a8a,70,1],[430,0x241c70,95,2],[540,0x1c1858,120,3]]);
    kit.fallingParticles(root,uT);
    ctx.onUpdate((t)=>{
      islands.forEach(o=>{o.m.position.y=o.y+Math.sin(t*.5+o.ph)*.7;o.m.rotation.y=Math.sin(t*.1+o.ph)*.05});
      ck.pulse(t);
    });
  },
};
