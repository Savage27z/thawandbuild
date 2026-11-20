import * as THREE from 'three';
export const PALETTE={sky:0x0b0a2e,skyWarm:0x6a3cc8,ice:0x6ab8ff,iceShadow:0x5a45d8,rock:0x4a3a9a,rockShadow:0x1c1450,water:0x2fc8ff,sludge:0x1d7a1a,sludgeGlow:0x39ff88,boss:0xff2d8a,ink:0x07061c,fur:0xf6f8ff,furShadow:0xb4b4e0,scarf:0x3f7fd6,face:0x6a96c8,amber:0x39ff88,sui:0x4da2ff,lilac:0xb06bff,neon:0x39ff88,magenta:0xff2dd0,navy:0x0d1240};
const g=(n=4)=>{const d=new Uint8Array(n);for(let i=0;i<n;i++)d[i]=Math.round(90+165*i/(n-1));const t=new THREE.DataTexture(d,n,1,THREE.RedFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t};
export const gradient=g(4);
const RIM=new THREE.Color(0x9fe4ff);
export function toon(color,opts={}){
  const {rim=1.0,...o}=opts;
  const m=new THREE.MeshToonMaterial({color,gradientMap:gradient,...o});
  if(!rim)return m;
  m.onBeforeCompile=s=>{
    s.uniforms.uRim={value:RIM};
    s.fragmentShader=s.fragmentShader.replace('void main() {','uniform vec3 uRim;\nvoid main() {').replace('#include <opaque_fragment>',`{float f=1.-clamp(dot(normalize(vNormal),normalize(vViewPosition)),0.,1.);outgoingLight+=uRim*smoothstep(.55,.95,f)*${rim.toFixed(2)};}
    #include <opaque_fragment>`);
  };
  m.customProgramCacheKey=()=>'toonrim'+rim;
  return m;
}
export function outline(mesh,thickness=0.03,color=PALETTE.ink){const m=new THREE.Mesh(mesh.geometry,new THREE.MeshBasicMaterial({color,side:THREE.BackSide}));m.material.customProgramCacheKey=()=>'outline'+thickness;m.material.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','vec3 transformed=position+normal*'+thickness.toFixed(4)+';')};m.scale.copy(mesh.scale);mesh.add(m);m.scale.set(1,1,1);return m}

export function hatch(mat,{strength=.55,scale=6,tint=0x3a3f78,t1=.5,t2=.75}={}){
  const c=new THREE.Color(tint);
  const prev=mat.onBeforeCompile;
  mat.onBeforeCompile=(s,r)=>{
    if(prev)prev(s,r);
    s.uniforms.uHatchTint={value:c};
    s.fragmentShader=s.fragmentShader.replace('void main() {','uniform vec3 uHatchTint;\nvoid main() {').replace('#include <opaque_fragment>',`
      {float lo=dot(outgoingLight,vec3(.333)),ld=dot(diffuseColor.rgb,vec3(.333))+1e-3;
      float sh=clamp(1.-lo/ld,0.,1.);
      float a=gl_FragCoord.x*.8+gl_FragCoord.y,b=gl_FragCoord.x*.8-gl_FragCoord.y;
      float l1=step(fract(a/${scale.toFixed(1)}),.2)*step(${t1.toFixed(2)},sh);
      float l2=step(fract(b/${(scale*1.1).toFixed(1)}),.18)*step(${t2.toFixed(2)},sh);
      outgoingLight=mix(outgoingLight,uHatchTint*ld*1.7,smoothstep(.2,.6,sh)*.55);
      outgoingLight=mix(outgoingLight,uHatchTint*lo*1.2,max(l1,l2)*${strength.toFixed(2)});}
      #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey=()=>'hatch'+strength+scale+tint;
  return mat;
}
