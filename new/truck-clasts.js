import {HAULER_BODY as B} from './hauler-body-config.js?build=cabins-20261106-23';
import {stoneKey,stoneRandom} from './chunk-packing.js?build=cabins-20261106-23';
// Shared deterministic packing. No lattice rows or height-contour terraces.
// Larger clasts occupy space first; fines occupy the intervals between them.
const points=[];
for(let i=0;i<6500&&points.length<1050;i++){
 const key=stoneKey(i+9417,31,714),grade=stoneRandom(key,1),size=i<55?.40+grade*.40:grade<.34?.055+stoneRandom(key,2)*.09:grade<.94?.14+stoneRandom(key,2)*.21:.35+stoneRandom(key,2)*.22;
 const x=-B.width/2-B.rearStretch+stoneRandom(key,3)*(B.width+B.rearStretch+B.frontStretch),z=(stoneRandom(key,4)-.5)*B.topDepth;
 let clear=true;for(const q of points){const r=(size+q.size)*.29;if((x-q.x)**2+(z-q.z)**2<r*r){clear=false;break;}}
 if(clear)points.push({key,x,z,size,phase:stoneRandom(key,5)});
}
export function packTruckClasts(batch,height){
 batch.begin();
 for(const p of points){const h=height(p.x,p.z,p.size*.46);if(h<.012)continue;const step=Math.min(.08,p.size*.34),phase=p.phase*step,top=Math.floor((h-phase)/step);
  for(let layer=top;layer>=Math.max(0,top-1);layer--){const y=phase+layer*step-p.size*.035;if(y+p.size*.42<h||y<0)continue;batch.add(stoneKey(p.key,layer,731),p.x,y,p.z,p.size);}
 }
 // Exposed open-tail section: fragments remain partly buried in the solid
 // fine fraction all the way down to the floor, without an orderly rock wall.
 for(let i=0;i<230;i++){const key=stoneKey(i+7021,38,91),z0=(stoneRandom(key,1)-.5)*B.depth,h=height(-B.width/2-B.rearStretch+.10,z0),y=stoneRandom(key,2)*h;if(y<.02)continue;const f=Math.min(1,y/(B.rim-B.floor)),x=-B.width/2-B.rearStretch*f-.015,z=z0*(1+(B.topDepth-B.depth)/B.depth*f),size=.055+stoneRandom(key,3)*.19;batch.add(key,x,y,z,size);}
 return batch.finish();
}
