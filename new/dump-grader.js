import * as T from '../three.module.js?build=career-20261106-19';
import {makeDozer} from './dozer-model.js?build=career-20261106-19';
import {ground} from './world.js?build=career-20261106-19';
import {DUMP} from './dump-layout.js?build=career-20261106-19';
import {chunkBatch,packHeightField} from './chunk-packing.js?build=career-20261106-19';
import {ORE} from './material-volume.js?build=career-20261106-19';
const HOME={x:40,z:-112},STAGE=35.8,SAFE_EDGE=30.8,CAPACITY=16;
const clamp=T.MathUtils.clamp,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function createDumpGrader(scene,M,dump,onWork=null){
 const model=makeDozer(scene,M),owner={kind:'dump-dozer'},pile=new T.Group();pile.position.set(3.35,0,0);model.root.add(pile);
 const pieces=chunkBatch(pile,M.freshRock,1400,'Conserved moving rock windrow at dump blade');
 let x=HOME.x,z=HOME.z,yaw=-Math.PI/2,speed=0,mode='parked',task=null,path=[],carry=0,worked=0,passes=0,idle=0,clock=0,trackDistance=0,blocked=0,previous={x,z,yaw},lastPile=-1,blade=.5;
 const surface=(xx,zz)=>Math.max(ground(xx,zz),dump.height(xx,zz));
 const clear=(xx,zz,trucks)=>!trucks.some(t=>t.state!=='parked'&&Math.hypot(xx-t.x,zz-t.z)<7);
 function choose(trucks){for(const heap of dump.heapTargets()){
  if(!dump.sectors.claimDozer(owner,heap.index))continue;
  if(!clear(STAGE,heap.z,trucks)){dump.sectors.release(owner);continue;}
  task=heap;path=[{x:40,z:HOME.z},{x:40,z:heap.z},{x:STAGE,z:heap.z}];mode='approaching';return true;
 }return false;}
 function retreat(){mode='returning';path=[{x:40,z},{...HOME}];speed=0;}
 function update(dt,trucks=[]){previous.x=x;previous.z=z;previous.yaw=yaw;idle+=dt;clock+=dt;
  if(mode==='parked'){speed=0;if(idle>.6){idle=0;choose(trucks);}return false;}
  let dirty=false;
  if(mode==='aligning'){const turn=wrap(Math.PI-yaw);yaw+=clamp(turn,-dt*.65,dt*.65);speed=0;if(Math.abs(turn)<.025)mode='grading';return false;}
  if(mode==='spreading'){
   const bx=x-3.15,amount=Math.min(carry,dt*11);carry-=dump.spreadBlade(bx-.55,z,Math.PI,amount);dirty=amount>0;
   if(carry<1e-8){carry=0;mode='reversing';passes++;}return dirty;
  }
  const reverse=mode==='reversing',working=mode==='grading';
  const goal=working?{x:SAFE_EDGE,z:task.z}:reverse?{x:STAGE,z:task.z}:path[0];
  if(!goal){if(mode==='approaching')mode='aligning';else if(mode==='returning'){dump.sectors.release(owner);mode='parked';task=null;idle=0;}return false;}
  const distance=Math.hypot(goal.x-x,goal.z-z),heading=working||reverse?Math.PI:Math.atan2(-(goal.z-z),goal.x-x),turn=wrap(heading-yaw);
  yaw+=clamp(turn,-dt*.65,dt*.65);
  const direction=reverse?-1:1,nx=x+Math.cos(yaw)*.75*direction,nz=z-Math.sin(yaw)*.75*direction;
  const rise=Math.abs(surface(nx,nz)-surface(x,z));
  const obstructed=!clear(nx,nz,trucks)||rise>.65||working&&nx<SAFE_EDGE-.05;
  blocked=obstructed?blocked+dt:0;
  const bite=working?Math.max(0,surface(x-3.15,z)-DUMP.height-.12):0;
  const target=obstructed||Math.abs(turn)>.32?0:working?(bite>.15?.20:.72)*(1-.25*carry/CAPACITY):reverse?1.3:1.65;
  speed+=clamp(target-speed,-dt*2.5,dt*1.1);
  const travel=Math.min(distance,speed*dt)*Math.max(0,Math.cos(turn));
  if(!obstructed){x+=Math.cos(yaw)*travel*direction;z-=Math.sin(yaw)*travel*direction;trackDistance+=travel*direction;}
  if(working&&Math.abs(turn)<.10){
   const bx=x-3.15,got=dump.collectBlade(bx,z,Math.PI,Math.min(CAPACITY-carry,dt*20));carry+=got;worked+=got;dirty=got>0;
   if(carry>CAPACITY*.55||x<31.9&&carry>0){const amount=Math.min(carry,dt*16);carry-=dump.spreadBlade(bx-1.05,z,Math.PI,amount);dirty=true;}
   if(got>.02)onWork?.({x:bx,y:surface(bx,z)+.1,z});
  }
  if(mode==='aligning'){const t=wrap(Math.PI-yaw);yaw+=clamp(t,-dt*.65,dt*.65);speed=0;if(Math.abs(t)<.025)mode='grading';return dirty;}
  if(working&&blocked>2){mode='spreading';blocked=0;speed=0;}
  if(distance<.1){speed=0;if(working)mode='spreading';else if(reverse)retreat();else path.shift();}
  // A blocked route keeps its sector and waits; it never drops mass or drives off the face.
  return dirty;
 }
 function render(dt,alpha=1){
  const xx=previous.x+(x-previous.x)*alpha,zz=previous.z+(z-previous.z)*alpha,a=previous.yaw+wrap(yaw-previous.yaw)*alpha,c=Math.cos(a),s=Math.sin(a);
  const h=(f,l)=>surface(xx+c*f+s*l,zz-s*f+c*l),front=(h(1.6,-1.05)+h(1.6,1.05))/2,rear=(h(-1.6,-1.05)+h(-1.6,1.05))/2;
  model.root.position.set(xx,(front+rear)/2+.025,zz);model.root.rotation.set(clamp(Math.atan2(h(0,-1.05)-h(0,1.05),2.1),-.28,.28),a,clamp(Math.atan2(front-rear,3.2),-.28,.28),'YXZ');
  const target=['grading','spreading'].includes(mode)?-.08:.52;blade+=(target-blade)*(1-Math.exp(-dt*6));model.setBladeLift(blade);model.advanceTracks(trackDistance);trackDistance=0;pile.position.y=.05+blade;
  if(Math.abs(carry-lastPile)>.06||carry===0&&lastPile!==0){lastPile=carry;const volume=carry/ORE.looseDensity;packHeightField(pieces,{nx:7,nz:19,cell:.2,x:-.4,z:-1.9,height:(px,pz)=>Math.max(0,1-Math.abs(px-.3)/.7)*Math.max(0,1-(pz/1.9)**2)*volume/(.7*2.53),seed:889});}
 }
 function reset(){dump.sectors.release(owner);x=HOME.x;z=HOME.z;yaw=-Math.PI/2;previous={x,z,yaw};speed=carry=worked=passes=idle=clock=trackDistance=blocked=0;mode='parked';task=null;path=[];lastPile=-1;render(1,1);}
 reset();return {model,pieces,update,render,reset,get mass(){return carry},get busy(){return mode!=='parked'},snapshot(){return {x,z,yaw,mode,speed,carry,worked,passes,blocked,sector:task?.index??null,safeEdge:SAFE_EDGE}}};
}
