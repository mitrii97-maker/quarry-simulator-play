const distance=(x,z,ax,az,bx,bz)=>{const dx=bx-ax,dz=bz-az,u=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-ax-u*dx,z-az-u*dz);};
// Protect both the actual vehicle and the next stretch of its road. Ready
// trucks reserve their departure corridor before the driver sounds the horn.
export function haulClearance(x,z,trucks){
 let best=Infinity;
 for(const t of trucks){
  if(t.state==='parked')continue;
  best=Math.min(best,Math.hypot(x-t.x,z-t.z));
  if(t.route){const r=t.route;let a={x:t.x,z:t.z};for(let d=3;d<=36;d+=3){const b=r.curve.getPointAt(Math.min(1,(r.distance+d)/r.length));best=Math.min(best,distance(x,z,a.x,a.z,b.x,b.z));a=b;}}
  else if(t.state==='ready'){
   const c=Math.cos(t.yaw),s=-Math.sin(t.yaw),bx=t.x+c*14,bz=t.z+s*14;
   best=Math.min(best,distance(x,z,t.x,t.z,bx,bz),distance(x,z,bx,bz,bx+22,bz-9));
  }
 }
 return best;
}
