import {makeDozer} from './dozer-model.js';
import {ground} from './world.js';
import {DUMP} from './dump-layout.js';
const HOME={x:23.3,z:-46},LANE_X=29.9,START_Z=-42,END_Z=-29,GRADE_START={x:LANE_X,z:START_Z},GRADE_END={x:LANE_X,z:END_Z},WEST_START={x:35.3,z:0},WEST_END={x:13.2,z:0};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Dedicated dump attendant: straight blade passes connect fresh tipping heaps.
// It yields west of the receiving area before a reserved hauler can arrive.
export function createDumpGrader(scene,M,dump,onWork=null){
 const model=makeDozer(scene,M);model.root.name='Dump dozer: straight shared-stockpile grading';let x=HOME.x,z=HOME.z,yaw=-Math.PI/2,speed=0,mode='parked',path=[],passes=0,worked=0,serviced=0,clock=0,idle=0,previous={x,z,yaw},trackDistance=0,westward=false,resume=false,lane=0,serviceTarget=0;
 const surface=(xx,zz)=>Math.max(ground(xx,zz),dump.height(xx,zz));
 function returning(interrupted=false){resume=interrupted;mode='returning';path=[{x:HOME.x,z},{...HOME}];speed=0;}
 function approach(){mode='approaching';speed=0;path=westward?[{x:35.3,z:HOME.z},{x:35.3,z:DUMP.bays[lane]}]:[{x:HOME.x,z:START_Z},{x:LANE_X,z:START_Z}];}
 function update(dt,trucks=[]){previous.x=x;previous.z=z;previous.yaw=yaw;idle+=dt;
  const occupied=dump.busy||trucks.some(t=>t.state!=='parked'&&Math.abs(t.x-33)<11&&Math.abs(t.z+33)<13);
  if(occupied&&mode!=='parked'&&mode!=='returning')returning(true);
  if(mode==='parked'){speed=0;if(!occupied&&idle>3&&(resume||dump.field.mass-serviced>25)){if(!resume){westward=dump.field.mass>600;lane=passes=0;serviceTarget=dump.field.mass;}resume=false;approach();}return false;}
  WEST_START.z=WEST_END.z=DUMP.bays[Math.min(lane,DUMP.bays.length-1)];const reverse=mode==='reversing',start=westward?WEST_START:GRADE_START,end=westward?WEST_END:GRADE_END,goal=mode==='grading'?end:reverse?start:path[0];let moved=0;
  if(goal){const distance=Math.hypot(goal.x-x,goal.z-z),heading=mode==='grading'||reverse?(westward?Math.PI:-Math.PI/2):Math.atan2(-(goal.z-z),goal.x-x),turn=wrap(heading-yaw);yaw+=clamp(turn,-dt*.75,dt*.75);const target=Math.abs(turn)>.25?0:mode==='grading'?(westward?.85:.42):reverse?(westward?1.3:1.1):1.4;speed+=clamp(target-speed,-dt*2,dt*1.2);const travel=Math.min(distance,speed*dt)*Math.max(0,Math.cos(turn));x+=Math.cos(yaw)*travel*(reverse?-1:1);z-=Math.sin(yaw)*travel*(reverse?-1:1);trackDistance+=travel*(reverse?-1:1);
   if(mode==='grading'&&travel>1e-5&&Math.abs(turn)<.12){clock+=dt;if(clock>=.05){const bx=x+Math.cos(yaw)*3.15,bz=z-Math.sin(yaw)*3.15;moved=dump.gradeStrip(bx,bz,yaw,Math.min(.1,clock)*(westward?7:4));worked+=moved;if(moved>.04)onWork?.({x:bx,y:surface(bx,bz)+.1,z:bz});clock=0;}}
   if(distance<.08){speed=0;if(mode==='grading')mode='reversing';else if(reverse){passes++;if(westward){lane++;if(lane<DUMP.bays.length){mode='approaching';path=[{x:35.3,z:DUMP.bays[lane]}];}else{serviced=serviceTarget;returning();}}else if(passes<3)mode='grading';else{serviced=serviceTarget;returning();}}else path.shift();}
  }else if(mode==='approaching'){mode='grading';speed=0;}else if(mode==='returning'){mode='parked';idle=0;speed=0;}
  return moved>0;
 }
 function render(dt,alpha=1){const xx=previous.x+(x-previous.x)*alpha,zz=previous.z+(z-previous.z)*alpha,a=previous.yaw+wrap(yaw-previous.yaw)*alpha,c=Math.cos(a),s=Math.sin(a),height=(f,l)=>surface(xx+c*f+s*l,zz-s*f+c*l),front=(height(1.6,-1.05)+height(1.6,1.05))/2,rear=(height(-1.6,-1.05)+height(-1.6,1.05))/2,pitch=clamp(Math.atan2(front-rear,3.2),-.38,.38),roll=clamp(Math.atan2(height(0,-1.05)-height(0,1.05),2.1),-.28,.28);model.root.position.set(xx,(front+rear)/2+.03,zz);model.root.rotation.set(roll,a,pitch,'YXZ');model.setBladeLift(mode==='grading'?-.1:.5);model.advanceTracks(trackDistance);trackDistance=0;}
 function reset(){x=HOME.x;z=HOME.z;yaw=-Math.PI/2;previous.x=x;previous.z=z;previous.yaw=yaw;speed=passes=worked=serviced=clock=idle=trackDistance=lane=serviceTarget=0;westward=resume=false;path=[];mode='parked';render(1,1);}
 reset();return {model,update,render,reset,snapshot(){return {x,z,yaw,mode,passes,worked,speed,westward,resume,lane}},get busy(){return mode!=='parked'}};
}
