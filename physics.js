import {BENCH_HEIGHT} from './layout.js?build=hotfix-20261106-20';
export function surfaceHeight(x,z){
 if(x< -24||x>0||z< -13||z>10)return 0;
 if(x> -5&&x< -.5&&z> -5.5&&z< -.5)return 2.7-cutDepth(x,z);
 return BENCH_HEIGHT+.06;
}
export function bucketPoint(position,yaw,curl,x,y,z=0){
 const angle=-.9+curl*1.65,c=Math.cos(angle),s=Math.sin(angle),rx=x*c-y*s,ry=x*s+y*c;
 return {x:position.x+Math.cos(yaw)*rx+Math.sin(yaw)*z,y:position.y+ry,z:position.z-Math.sin(yaw)*rx+Math.cos(yaw)*z};
}
export function bucketCollision(position,yaw,curl,truck=null){
 let penetration=0;for(const [x,y] of [[-.95,-.45],[-.5,-.8],[.2,-.8],[1.3,-.5]])for(const z of [-.7,.7]){const p=bucketPoint(position,yaw,curl,x,y,z);penetration=Math.max(penetration,Math.max(surfaceHeight(p.x,p.z),truckSurface(p.x,p.z,truck))+.04-p.y)}return Math.max(0,penetration);
}
export function cuttingContact(position,yaw,curl){for(const [x,y] of [[1.15,-.5],[.2,-.7],[-.4,-.7]]){const p=bucketPoint(position,yaw,curl,x,y);if(p.x> -5&&p.x< -.5&&p.z> -5.5&&p.z< -.5&&p.y>=surfaceHeight(p.x,p.z)-.06&&p.y<=surfaceHeight(p.x,p.z)+1.25)return true}return false}
export function scoopWork(before,after){return Math.max(0,after.curl-before.curl)*4.8+Math.max(0,before.reach-after.reach)*.85*Math.max(.2,after.curl)}
const cutCells=new Float32Array(20*24);
export function cutDepth(x,z){const ix=Math.max(0,Math.min(19,Math.floor((x+5)/4.5*20))),iz=Math.max(0,Math.min(23,Math.floor((z+5.5)/5*24)));return cutCells[iz*20+ix]}
export function excavate(x,z,work){if(work<=0)return;for(let iz=0;iz<24;iz++)for(let ix=0;ix<20;ix++){const px=-5+(ix+.5)*4.5/20,pz=-5.5+(iz+.5)*5/24,d=Math.hypot(px-x,pz-z);if(d<1.25)cutCells[iz*20+ix]=Math.min(.55,cutCells[iz*20+ix]+work*.14*(1-d/1.25))}}
export function truckSurface(x,z,truck){
 if(!truck)return -Infinity;const a=truck.yaw||0,dx=x-truck.x,dz=z-truck.z,lx=Math.cos(a)*dx-Math.sin(a)*dz,lz=Math.sin(a)*dx+Math.cos(a)*dz;
 if(lx>1.4&&lx<3.2&&Math.abs(lz)<1.6)return 4.05;
 if(lx< -3.5||lx>1.4||Math.abs(lz)>1.85)return -Infinity;
 if(Math.abs(lz)>1.48||lx< -3.13||lx>1.15)return 3.48;
 return 2.3+(truck.loads||0)*.14;
}
