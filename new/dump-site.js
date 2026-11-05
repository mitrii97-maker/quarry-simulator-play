import {SectorLeases} from './sector-leases.js?build=hotfix-20261106-20';
import * as T from '../three.module.js?build=hotfix-20261106-20';
import {GranularGrid} from './granular.js?build=hotfix-20261106-20';
import {chunkBatch,packHeightField} from './chunk-packing.js?build=hotfix-20261106-20';
import {createHeightFines} from './dry-fines.js?build=hotfix-20261106-20';
import {DUMP,dumpBermHeight} from './dump-layout.js?build=hotfix-20261106-20';
import {ORE} from './material-volume.js?build=hotfix-20261106-20';
import {recordDump} from './levels.js?build=hotfix-20261106-20';
import {ground} from './world.js?build=hotfix-20261106-20';
import {block,rod,V} from './geometry.js?build=hotfix-20261106-20';
import {batchMeshes} from '../batching.js?build=hotfix-20261106-20';
export function makeDumpSite(scene,M){
 const field=new GranularGrid(DUMP.width,DUMP.depth,60,90,{density:ORE.looseDensity,slope:.9,staticSlope:1.2,cohesion:.08,mobility:2.8});
 // Immutable receiving terrain: reuse its vertex samples for the cover,
 // clast packing and contact queries instead of recalculating distant ridges.
 const floors=new Float64Array(61*91);for(let row=0;row<91;row++)for(let col=0;col<61;col++)floors[row*61+col]=ground(DUMP.x-DUMP.width/2+col*field.dx,DUMP.z-DUMP.depth/2+row*field.dz);
 const floorSampler={width:DUMP.width+field.dx,depth:DUMP.depth+field.dz,nx:61,nz:91,heights:floors,heightAt:GranularGrid.prototype.heightAt},floorAt=(x,z)=>floorSampler.heightAt(x-DUMP.x,z-DUMP.z);
 field.base=new Float64Array(field.heights.length);for(let row=0;row<field.nz;row++)for(let col=0;col<field.nx;col++)field.base[row*field.nx+col]=ground(DUMP.x-DUMP.width/2+(col+.5)*field.dx,DUMP.z-DUMP.depth/2+(row+.5)*field.dz);
 const fines=createHeightFines(scene,M.freshRock,{nx:61,nz:91,x:DUMP.x-DUMP.width/2,z:DUMP.z-DUMP.depth/2,dx:DUMP.width/60,dz:DUMP.depth/90,signed:true,depth:0}),heights=new Float32Array(61*91),cover=new Uint8Array(61*91),radius=Math.hypot(DUMP.width/2,DUMP.depth/2,12);fines.mesh.name='Continuous dry dump mass shared by every truck';fines.mesh.castShadow=false;fines.mesh.frustumCulled=true;fines.mesh.geometry.boundingSphere=new T.Sphere(V(DUMP.x,3,DUMP.z),radius);
 const pieces=chunkBatch(scene,M.freshRock,10000,'Haul-road dump: retained angular rock'),dress=new T.Group();dress.name='Tipping apron and edge markers';scene.add(dress);
 pieces.mesh.boundingSphere=new T.Sphere(V(DUMP.x,3,DUMP.z),radius);pieces.mesh.frustumCulled=true;
 // Dense fine aggregate and embedded angular clasts share the real berm surface.
 const berm=createHeightFines(dress,M.freshRock,{nx:19,nz:77,x:31.2,z:-82.5,dx:3/18,dz:19/76,signed:true,depth:0});
 const bermY=new Float32Array(19*77),bermCover=new Float32Array(19*77);
 for(let j=0;j<77;j++)for(let i=0;i<19;i++){const x=31.2+i*3/18,z=-82.5+j*19/76,k=j*19+i,h=dumpBermHeight(x,z);bermY[k]=ground(x,z)+.008;bermCover[k]=Math.min(1,h/.035);}
 berm.update(bermY,bermCover);berm.mesh.name='Continuous irregular safety berm made of rock';
 const bermStones=chunkBatch(dress,M.freshRock,2400,'Angular clasts embedded in safety berm');
 packHeightField(bermStones,{nx:12,nz:76,cell:.25,x:31.2,z:-82.5,floor:(x,z)=>ground(x,z)-dumpBermHeight(x,z),height:dumpBermHeight,seed:981,layers:2});
 batchMeshes(dress);let revision=-1,clock=0,quiet=0,cursor=0;const sectors=new SectorLeases(DUMP.bays),slots=sectors.trucks;let heapClock=1,heapCache=[];
 const contains=(x,z)=>Math.abs(x-DUMP.x)<DUMP.width/2&&Math.abs(z-DUMP.z)<DUMP.depth/2;
 function height(x,z){return contains(x,z)?floorAt(x,z)+field.heightAt(x-DUMP.x,z-DUMP.z):-Infinity}
 function deposit(x,z,mass){if(!contains(x,z)||!(mass>0))return 0;field.depositDry(x-DUMP.x,z-DUMP.z,mass,{repose:.9,aspect:1.08});quiet=0;recordDump(mass);return mass;}
 // A physical blade transfers only the excess above the common working grade
 // into low cells immediately ahead. Dump credit is never awarded twice.
 function gradeStrip(x,z,yaw,budget){
  if(!(budget>0)||field.mass<=0)return 0;
  const c=Math.cos(yaw),sn=Math.sin(yaw);
  const localX=x-DUMP.x,localZ=z-DUMP.z;
  const keep=Math.max(0,DUMP.height-floorAt(x,z));
  const moved=field.remove(localX,localZ,budget,{rx:.75,rz:2.05,yaw,minHeight:keep});
  if(moved<=0)return 0;
  // The blade advances the actual mass; gravity carries it over the crest.
  const tx=Math.max(-DUMP.width/2+.8,Math.min(DUMP.width/2-.8,localX+c*1.65));
  field.deposit(tx,localZ-sn*1.65,moved,{rx:.65,rz:1.9});
  quiet=0;return moved;
 }
 function update(dt){heapClock+=dt;clock+=dt;if(quiet<2&&field.mass>0){const moved=field.step(dt);quiet=moved>1e-8?0:quiet+dt;}if(clock<.16||revision===field.revision)return;clock=0;revision=field.revision;
  for(let row=0;row<91;row++)for(let col=0;col<61;col++){const k=row*61+col,h=field.heightAt(-DUMP.width/2+col*field.dx,-DUMP.depth/2+row*field.dz);heights[k]=floors[k]+h;cover[k]=h>.002?1:0;}fines.update(heights,cover);
  packHeightField(pieces,{nx:100,nz:45,cell:.4,x:DUMP.x-DUMP.width/2,z:DUMP.z-DUMP.depth/2,floor:floorAt,height:(x,z)=>Math.max(0,field.heightAt(x-DUMP.x,z-DUMP.z)-.06),seed:760});
 }
 function reserve(truck,preferred=null){if(sectors.dozers.size&&!Array.from(sectors.trucks.values()).includes(truck))return null;const index=sectors.reserveTruck(truck,preferred);return index<0?null:{index,x:DUMP.truckX,z:DUMP.bays[index]};}
 function release(truck){sectors.release(truck);}
 function heapTargets(){
  if(heapClock<.8)return heapCache;heapClock=0;heapCache=[];
  for(let index=0;index<DUMP.bays.length;index++){
   let mass=0,peak=0,cx=0,cz=0;const bay=DUMP.bays[index];
   for(let row=0;row<field.nz;row++)for(let col=0;col<field.nx;col++){
    const x=DUMP.x-DUMP.width/2+(col+.5)*field.dx,z=DUMP.z-DUMP.depth/2+(row+.5)*field.dz;
    if(x<28.5||x>32.1||Math.abs(z-bay)>2.55)continue;
    const top=field.base[row*field.nx+col]+field.heights[row*field.nx+col],excess=Math.max(0,top-DUMP.height-.10);
    const m=excess*field.area*field.density;mass+=m;cx+=x*m;cz+=z*m;peak=Math.max(peak,excess);
   }
   if(mass>.4)heapCache.push({index,z:bay,x:mass?cx/mass:30.5,mass,peak,score:mass+peak*30});
  }return heapCache.sort((a,b)=>b.score-a.score);
 }
 function collectBlade(x,z,yaw,budget){
  const mass=field.remove(x-DUMP.x,z-DUMP.z,budget,{rx:.72,rz:2.0,yaw,minHeight:(xx,zz)=>Math.max(0,DUMP.height-floorAt(xx+DUMP.x,zz+DUMP.z))});if(mass>0){quiet=0;heapClock=1;}return mass;
 }
 function spreadBlade(x,z,yaw,mass){if(!(mass>0))return 0;const xx=Math.max(DUMP.x-DUMP.width/2+1,Math.min(DUMP.x+DUMP.width/2-1,x));field.deposit(xx-DUMP.x,z-DUMP.z,mass,{rx:.70,rz:1.9});quiet=0;heapClock=1;return mass;}

 function reset(){field.clear();pieces.begin();pieces.finish();fines.clear();sectors.clear();heapCache=[];heapClock=1;cursor=0;quiet=0;revision=-1;clock=0;}
 return {field,pieces,fines,contains,height,deposit,gradeStrip,update,reserve,release,reset,heapTargets,collectBlade,spreadBlade,sectors,get busy(){return slots.size>0},gradient(x,z){const e=.12,h=(xx,zz)=>floorAt(xx,zz)+field.heightAt(xx-DUMP.x,zz-DUMP.z);return {x:(h(x+e,z)-h(x-e,z))/(2*e),z:(h(x,z+e)-h(x,z-e))/(2*e)}}};
}
