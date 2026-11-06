import {haulClearance} from './haul-corridor.js?build=lighting-20261106-26';
import {createTrackImprints} from './track-imprints.js?build=lighting-20261106-26';
import * as T from '../three.module.js?build=lighting-20261106-26';
import {makeDozer} from './dozer-model.js?build=lighting-20261106-26';
import {ground,ungradedHeight,gradingTargets,recoveryReceivers,bladeCollect,tuckBlade,depositLoose,ungradedMass} from './world.js?build=lighting-20261106-26';
import {dozerClear,dozerPath,dozerLine} from './dozer-navigation.js?build=lighting-20261106-26';
export {dozerClear,dozerPath} from './dozer-navigation.js?build=lighting-20261106-26';
import {chunkBatch,packHeightField} from './chunk-packing.js?build=lighting-20261106-26';
import {ORE} from './material-volume.js?build=lighting-20261106-26';
const HOME={x:12,z:8},CAPACITY=12;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),clamp=T.MathUtils.clamp;
export function createDozer(scene,M,onBladeWork=null){
 const trail=createTrackImprints(scene),model=makeDozer(scene,M),pileRoot=new T.Group();pileRoot.position.set(3.37,.05,0);model.root.add(pileRoot);const pieces=chunkBatch(pileRoot,M.freshRock,1600,'Rock pushed in front of the grading blade');
 pieces.mesh.boundingSphere=new T.Sphere(new T.Vector3(.4,.9,0),2.8);pieces.mesh.frustumCulled=true;
 let x=HOME.x,z=HOME.z,yaw=Math.PI,speed=0,path=[],task=null,mode='parked',carry=0,worked=0,passes=0,clock=0,blocked=0,pileMass=-1,lastY=ground(x,z),pitch=0,roll=0,bladeLift=.5,dustMass=0,retry=0,replans=0,previous={x,z,yaw},trackDistance=0;
 function plan(machine,trucks){
  for(const source of gradingTargets(machine,{x,z}).slice(0,6))for(const receiver of recoveryReceivers(source,machine)){
   let dx=receiver.x-source.x,dz=receiver.z-source.z,length=Math.hypot(dx,dz);if(length<.05)continue;dx/=length;dz/=length;
   const yaw=Math.atan2(-dz,dx),approach={x:source.x-dx*3.35,z:source.z-dz*3.35},end={x:receiver.x-dx*3.15,z:receiver.z-dz*3.15};
   if(haulClearance(approach.x,approach.z,trucks)<10.5||haulClearance(end.x,end.z,trucks)<10.5)continue;
   if(!dozerClear(approach.x,approach.z,machine,trucks)||!dozerLine(approach,end,machine,trucks,.78,(x,z)=>ground(x,z)-ungradedHeight(x,z)))continue;
   const route=dozerPath({x,z},approach,machine,trucks);if(!route)continue;
   task={...source,receiver,yaw,approach,end,initialMass:ungradedMass(),spreadTime:0};path=route;mode='driving';replans=0;return true;
  }return false;
 }
 function returnHome(machine,trucks){task=null;path=dozerPath({x,z},HOME,machine,trucks)||[];mode=path.length?'returning':'parked';speed=0;}
 function call(machine,trucks){if(mode!=='parked')return false;worked=0;passes=0;blocked=0;retry=0;replans=0;if(!plan(machine,trucks))mode='parked';return true;}
 function releaseRemainder(tucked=false){if(carry<=1e-10)return;const c=Math.cos(yaw),s=Math.sin(yaw),bx=x+c*3.15,bz=z-s*3.15;if(tucked)carry-=tuckBlade(bx,bz,yaw,carry);else{for(let i=-3;i<=3;i++)depositLoose(bx+s*i*.36,bz+c*i*.36,carry/7);carry=0;}}
 function bladeDust(mass,bx,bz){if(!onBladeWork||mass<=0)return;dustMass+=mass;if(dustMass>=.35){dustMass%=.35;onBladeWork({x:bx,y:ground(bx,bz)+.12,z:bz});}}
 function yieldRoad(machine,trucks){
  const candidates=[];
  for(const radius of [5,9,14,20])for(let i=0;i<20;i++){
   const a=i*Math.PI/10,p={x:x+Math.cos(a)*radius,z:z+Math.sin(a)*radius};
   if(haulClearance(p.x,p.z,trucks)<13||!dozerClear(p.x,p.z,machine,trucks,.8))continue;
   candidates.push({...p,score:radius+Math.hypot(p.x-HOME.x,p.z-HOME.z)*.05});
  }
  candidates.sort((a,b)=>a.score-b.score);
  for(const p of candidates){const route=dozerPath({x,z},p,machine,trucks);if(route){path=route;task=null;mode='yielding';speed=0;blocked=0;return true;}}
  return false;
 }
 function update(dt,machine,trucks){previous={x,z,yaw};clock+=dt;let dirty=false;
  if(mode!=='yielding'&&haulClearance(x,z,trucks)<11){retry+=dt;if(retry>.35){retry=0;yieldRoad(machine,trucks);}}
  if(mode==='parked'){speed=0;retry+=dt;if(retry>2){retry=0;if(ungradedMass()>.8)plan(machine,trucks);}return false;}
  const reversing=mode==='reversing',goal=mode==='grading'?task.end:reversing?task.approach:path[0];
  if(goal){const distance=Math.hypot(goal.x-x,goal.z-z),heading=mode==='grading'||reversing?task.yaw:Math.atan2(-(goal.z-z),goal.x-x),turn=wrap(heading-yaw);yaw+=clamp(turn,-dt*.85,dt*.85);
   const obstructed=!dozerClear(x+Math.cos(yaw)*.6*(reversing?-1:1),z-Math.sin(yaw)*.6*(reversing?-1:1),machine,trucks);blocked=obstructed?blocked+dt:0;
   const bx=x+Math.cos(yaw)*3.15,bz=z-Math.sin(yaw)*3.15,feeding=mode==='grading'&&carry<CAPACITY-.001&&ungradedHeight(bx,bz)>.001;
   const target=obstructed?0:Math.abs(turn)>.45?0:mode==='grading'?(feeding?.42:.92):reversing?1.4:3.0;speed+=clamp(target-speed,-dt*3,dt*1.7);const travel=Math.min(distance,Math.min(speed,Math.sqrt(1.6*distance))*dt)*Math.max(0,Math.cos(turn));
   if(!obstructed){x+=Math.cos(yaw)*travel*(reversing?-1:1);z-=Math.sin(yaw)*travel*(reversing?-1:1);trackDistance+=travel*(reversing?-1:1);if(travel>.0001)trail.add(x,z,yaw);}
   if(mode==='grading'){
    const bx=x+Math.cos(yaw)*3.15,bz=z-Math.sin(yaw)*3.15;
    if(carry<CAPACITY-.001){const got=bladeCollect(bx,bz,yaw,Math.min(CAPACITY-carry,dt*5),null,false);carry+=got.mass;worked+=got.mass;bladeDust(got.mass,bx,bz);dirty=got.mass>0;}
   }
   if(distance<.10&&(mode!=='grading'||carry>=CAPACITY-.001||!feeding)){speed=0;if(mode==='grading'){mode='spreading';task.spreadTime=0;}else if(reversing){passes++;if(!plan(machine,trucks))returnHome(machine,trucks);}else path.shift();}
   if(mode==='yielding'&&blocked>1){speed=0;yieldRoad(machine,trucks);}
   if(blocked>6){releaseRemainder(false);dirty=true;mode='waiting';path=[];speed=0;retry=0;blocked=0;}
  }else if(mode==='yielding'){releaseRemainder(true);dirty=true;mode='parked';retry=0;speed=0;}
  else if(mode==='driving'){mode='aligning';speed=0;}
  else if(mode==='aligning'){const turn=wrap(task.yaw-yaw);yaw+=clamp(turn,-dt*.75,dt*.75);if(Math.abs(turn)<.02)mode='grading';}
  else if(mode==='spreading'){
   task.spreadTime+=dt;const bx=x+Math.cos(yaw)*3.15,bz=z-Math.sin(yaw)*3.15,amount=tuckBlade(bx,bz,yaw,Math.min(carry,dt*5));carry=Math.max(0,carry-amount);bladeDust(amount,bx,bz);dirty=amount>0;
   if(carry<1e-8){carry=0;mode='reversing';task.approach={x:x-Math.cos(yaw)*2.2,z:z+Math.sin(yaw)*2.2};speed=0;}
  }else if(mode==='waiting'){
   retry+=dt;if(retry>1.2){retry=0;replans++;if(!plan(machine,trucks)&&replans>4)returnHome(machine,trucks);}
  }else if(mode==='returning'){mode='parked';speed=0;}
  return dirty;
 }
 function render(dt,alpha=1){const a=previous.yaw+wrap(yaw-previous.yaw)*alpha,xx=previous.x+(x-previous.x)*alpha,zz=previous.z+(z-previous.z)*alpha,c=Math.cos(a),s=Math.sin(a),sample=(f,l)=>ground(xx+c*f+s*l,zz-s*f+c*l),front=(sample(1.6,-1.05)+sample(1.6,1.05))/2,rear=(sample(-1.6,-1.05)+sample(-1.6,1.05))/2,desiredY=(front+rear)/2;
  lastY+=(desiredY-lastY)*(1-Math.exp(-dt*9));pitch+=(clamp(Math.atan2(front-rear,3.2),-.45,.45)-pitch)*(1-Math.exp(-dt*7));roll+=(clamp(Math.atan2(sample(0,-1.05)-sample(0,1.05),2.1),-.32,.32)-roll)*(1-Math.exp(-dt*7));model.root.position.set(xx,lastY+.025,zz);model.root.rotation.set(roll,a,pitch,'YXZ');model.advanceTracks(trackDistance);trackDistance=0;
  const lift=['grading','spreading'].includes(mode)?-.10:.5;bladeLift+=(lift-bladeLift)*(1-Math.exp(-dt*7));model.setBladeLift(bladeLift);pileRoot.position.y=.05+bladeLift;
  if(Math.abs(pileMass-carry)>.035||carry===0&&pileMass!==0){pileMass=carry;const volume=carry/ORE.looseDensity;
   packHeightField(pieces,{nx:7,nz:19,cell:.2,x:-.4,z:-1.9,height:(px,pz)=>Math.max(0,1-Math.abs(px-.3)/.7)*Math.max(0,1-(pz/1.9)**2)*volume/(.7*2.53),seed:980});}
 }
 function reset(){x=HOME.x;z=HOME.z;yaw=Math.PI;previous={x,z,yaw};speed=carry=worked=passes=blocked=clock=trackDistance=dustMass=retry=replans=0;path=[];task=null;mode='parked';trail.clear();lastY=ground(x,z);pileMass=-1;render(1,1);}
 reset();return {model,pieces,trail,call,update,render,reset,get mass(){return carry},get busy(){return mode!=='parked'},snapshot(){return {x,z,yaw,mode,speed,carry,worked,passes,blocked,task:task?{x:task.x,z:task.z,receiver:task.receiver,grade:task.grade}:null}}};
}
