import * as THREE from 'three';
export const PALETTE={sky:0xa9d6e5,skyWarm:0xf2b8a2,ice:0xdff2f7,iceShadow:0x8fb8cf,rock:0xc98a5e,rockShadow:0x6c4a5e,water:0x38c2c0,sludge:0x2a1638,sludgeGlow:0xb34bff,boss:0xff3355,ink:0x1b1f33,fur:0xf4f8ff,furShadow:0xa9c4e6,scarf:0x3f7fd6,face:0xa8cfee,amber:0xffc36b};
const g=(n=4)=>{const d=new Uint8Array(n);for(let i=0;i<n;i++)d[i]=Math.round(80+175*i/(n-1));const t=new THREE.DataTexture(d,n,1,THREE.RedFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t};
export const gradient=g(4);
export function toon(color,opts={}){return new THREE.MeshToonMaterial({color,gradientMap:gradient,...opts})}
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
