// Map progression persisted in localStorage: number of unlocked maps (maps unlock in order).
const KEY='lofi-thaw.maps-unlocked';
export const getUnlocked=()=>{try{return Math.max(1,parseInt(localStorage.getItem(KEY)||'1',10)||1)}catch(e){return 1}};
export const unlockUpTo=n=>{try{if(n>getUnlocked())localStorage.setItem(KEY,String(n))}catch(e){}};
