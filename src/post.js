import * as THREE from 'three';
import {PALETTE} from './style.js';

// Installs ink-outline post-processing by wrapping renderer.render (no main.js change needed).
// onBefore(camera) is called right before each main render (used by the debug fly camera).
export function installPost(renderer,{onBefore}={}){
  if(renderer.__inkPost)return renderer.__inkPost;
  const orig=renderer.render.bind(renderer);
  const size=new THREE.Vector2();
  let rt=null;
  const mk=(w,h)=>{
    const r=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,samples:4,depthTexture:new THREE.DepthTexture(w,h)});
    return r;
  };
  const mat=new THREE.ShaderMaterial({
    uniforms:{tC:{value:null},tD:{value:null},res:{value:new THREE.Vector2()},near:{value:.1},far:{value:1500},ink:{value:new THREE.Color(PALETTE.ink)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      uniform sampler2D tC,tD;uniform vec2 res;uniform float near,far;uniform vec3 ink;varying vec2 vUv;
      float lz(vec2 uv){float d=texture2D(tD,uv).x;float z=near*far/((far-near)*d-far);return -z;}
      void main(){
        vec3 c=texture2D(tC,vUv).rgb;
        vec2 px=1./res;float zc=lz(vUv);
        float e=0.;
        vec2 o[4]=vec2[4](vec2(1,0),vec2(-1,0),vec2(0,1),vec2(0,-1));
        for(int i=0;i<4;i++){float zn=lz(vUv+o[i]*px*1.1);e=max(e,smoothstep(.05,.12,(zn-zc)/zc));}
        float fade=mix(.95,.4,smoothstep(120.,500.,zc))*smoothstep(10.,35.,zc);
        c=mix(c,ink,e*fade);
        vec2 q=vUv-.5;c*=1.-dot(q,q)*.45;
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`,
    depthTest:false,depthWrite:false
  });
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);quad.frustumCulled=false;
  const qs=new THREE.Scene();qs.add(quad);
  const qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const api={enabled:true};
  renderer.render=(scene,camera)=>{
    if(!api.enabled||renderer.getRenderTarget()!==null||scene===qs)return orig(scene,camera);
    if(onBefore)onBefore(camera);
    renderer.getDrawingBufferSize(size);
    if(!rt||rt.width!==size.x||rt.height!==size.y){if(rt)rt.dispose();rt=mk(size.x,size.y)}
    mat.uniforms.tC.value=rt.texture;mat.uniforms.tD.value=rt.depthTexture;
    mat.uniforms.res.value.copy(size);mat.uniforms.near.value=camera.near;mat.uniforms.far.value=camera.far;
    renderer.setRenderTarget(rt);orig(scene,camera);
    renderer.setRenderTarget(null);orig(qs,qc);
  };
  renderer.__inkPost=api;
  return api;
}
