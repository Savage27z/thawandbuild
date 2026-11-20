// Shared math/noise helpers for map terrain functions and props.
export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export const mix=(a,b,t)=>a+(b-a)*t;
export const hash=(x,y)=>{const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h)};
export function vn(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return mix(mix(hash(ix,iy),hash(ix+1,iy),u),mix(hash(ix,iy+1),hash(ix+1,iy+1),u),v)}
export function fbm(x,y,o=4){let a=.5,s=0;for(let i=0;i<o;i++){s+=a*vn(x,y);x*=2.03;y*=2.03;a*=.5}return s/(1-Math.pow(.5,o))}
export function ridge(x,y,o=4){let a=.5,s=0;for(let i=0;i<o;i++){const n=1-Math.abs(2*vn(x,y)-1);s+=a*n*n;x*=2.07;y*=2.07;a*=.5}return s/(1-Math.pow(.5,o))}
