import * as T from '../three.module.js';
import {GranularGrid} from './granular.js';
import {chunkBatch,packHeightField} from './chunk-packing.js';
import {createHeightFines} from './dry-fines.js';
import {DUMP} from './dump-layout.js';
import {ORE} from './material-volume.js';
import {recordDump} from './levels.js';
import {ground} from './world.js';
import {block,rod,V} from './geometry.js';
import {batchMeshes} from '../batching.js';
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
 // Wheel stops leave the centre and tail opening clear. No floating labels.
 for(const z of DUMP.bays)for(const side of [-1,1]){
  const zz=z+side*2.15;block(dress,M.track,[1.5,.3,.27],[33.65,ground(33.65,zz)+.15,zz],.07);
  rod(dress,M.steel,V(32.75,ground(32.75,zz),zz),V(32.75,ground(32.75,zz)+1.05,zz),.045);
  block(dress,M.paint,[.12,.33,.2],[32.75,ground(32.75,zz)+.92,zz],.03);
 }
 batchMeshes(dress);let revision=-1,clock=0,quiet=0,cursor=0;const slots=new Map();
 const contains=(x,z)=>Math.abs(x-DUMP.x)<DUMP.width/2&&Math.abs(z-DUMP.z)<DUMP.depth/2;
 function height(x,z){return contains(x,z)?floorAt(x,z)+field.heightAt(x-DUMP.x,z-DUMP.z):-Infinity}
 function deposit(x,z,mass){if(!contains(x,z)||!(mass>0))return 0;field.depositDry(x-DUMP.x,z-DUMP.z,mass,{repose:.9,aspect:1.08});quiet=0;recordDump(mass);return mass;}
 // A physical blade transfers only the excess above the common working grade
 // into low cells immediately ahead. Dump credit is never awarded twice.
 function gradeStrip(x,z,yaw,budget){
  if(!(budget>0)||field.mass<=0)return 0;const c=Math.cos(yaw),s=Math.sin(yaw),grade=Math.max(.35,field.mass/(ORE.looseDensity*DUMP.width*DUMP.depth*.72)),dx=x+c*1.05,dz=z-s*1.05,list=field.weights(dx-DUMP.x,dz-DUMP.z,.8,2.05,yaw);let room=0;
  for(const p of list){p.room=Math.max(0,grade-field.base[p.i]-field.heights[p.i])*field.area*field.density;room+=p.room;}if(room<1e-9)return 0;
  const moved=field.remove(x-DUMP.x,z-DUMP.z,Math.min(budget,room),{rx:.35,rz:2.05,yaw,minHeight:(xx,zz)=>Math.max(0,grade-ground(xx+DUMP.x,zz+DUMP.z))});if(moved<=0)return 0;
  let remaining=moved,last=null;for(const p of list)if(p.room>0)last=p;for(const p of list)if(p.room>0){const mass=p===last?remaining:moved*p.room/room;field.heights[p.i]+=mass/(field.area*field.density);remaining-=mass;}field.mass+=moved;field.revision++;field.dirty=true;quiet=0;return moved;
 }
 function update(dt){clock+=dt;if(quiet<2&&field.mass>0){const moved=field.step(dt);quiet=moved>1e-8?0:quiet+dt;}if(clock<.1||revision===field.revision)return;clock=0;revision=field.revision;
  for(let row=0;row<91;row++)for(let col=0;col<61;col++){const k=row*61+col,h=field.heightAt(-DUMP.width/2+col*field.dx,-DUMP.depth/2+row*field.dz);heights[k]=floors[k]+h;cover[k]=h>.002?1:0;}fines.update(heights,cover);
  packHeightField(pieces,{nx:100,nz:45,cell:.4,x:DUMP.x-DUMP.width/2,z:DUMP.z-DUMP.depth/2,floor:floorAt,height:(x,z)=>Math.max(0,field.heightAt(x-DUMP.x,z-DUMP.z)-.06),seed:760});
 }
 function reserve(truck){for(let i=0;i<3;i++){const slot=(cursor+i)%3;if(!slots.has(slot)||slots.get(slot)===truck){slots.set(slot,truck);cursor=(slot+1)%3;return {index:slot,x:DUMP.truckX,z:DUMP.bays[slot]};}}return null;}
 function release(truck){for(const [slot,owner] of slots)if(owner===truck)slots.delete(slot);}
 function reset(){field.clear();pieces.begin();pieces.finish();fines.clear();slots.clear();cursor=0;quiet=0;revision=-1;clock=0;}
 return {field,pieces,fines,contains,height,deposit,gradeStrip,update,reserve,release,reset,get busy(){return slots.size>0},gradient(x,z){const e=.12,h=(xx,zz)=>floorAt(xx,zz)+field.heightAt(xx-DUMP.x,zz-DUMP.z);return {x:(h(x+e,z)-h(x-e,z))/(2*e),z:(h(x,z+e)-h(x,z-e))/(2*e)}}};
}
