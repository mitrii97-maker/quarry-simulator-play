import {bodyContains} from './hauler-body-config.js';
import {createSuspension,stepSuspension} from './truck-suspension.js';
import {makeTruckLoad} from './truck-load.js';
import {makeHauler} from './haul-model.js';
import * as T from '../three.module.js';
import {V} from './geometry.js';
import {batchMeshes} from '../batching.js';
import {ground} from './world.js';
import {DUMP} from './dump-layout.js';
import {BED,bedWorldPoint} from './truck-load.js';
export function createTruck(scene,M,x,z,index){const root=new T.Group();scene.add(root);root.position.set(x,0,z);root.rotation.y=Math.PI/2;
 const {wheels,bed,bedPivot,tailgate,hoist,signals}=makeHauler(root,M,index);
 const load=makeTruckLoad(M.freshRock),cargo=load.mesh;bed.add(cargo);root.position.y=ground(x,z);
 batchMeshes(root);
 return {root,wheels,cargo,bed,bedPivot,tailgate,hoist,signals,tipAngle:0,suspension:createSuspension(),load,home:V(x,0,z),homeYaw:Math.PI/2,x,z,yaw:Math.PI/2,tonnes:0,state:'parked',route:null,index,travel:0};}
export function makeRoute(t,kind){let coords;const x=t.home.x,z=t.home.z,bay=t.bayX??1,bayZ=t.bayZ??-9.4,stage=bayZ-13.6;
 if(kind==='coming')coords=t.homeYaw!==undefined?[[t.x,t.z],[x,z-6],[x-2,-20],[14,-20],[bay-8,-24],[bay-5,stage+9],[bay,stage+9],[bay,stage+4],[bay,stage]]:[[x,z],[x+4,z],[x+7,-22],[17,-28],[bay+3,-28],[bay-6,-22],[bay-5,stage+9],[bay,stage+9],[bay,stage+4],[bay,stage]];
 else if(kind==='backing'){const run=bayZ-t.z;coords=[[t.x,t.z],[t.x,t.z+Math.min(2,run*.25)],[bay,bayZ-3],[bay,bayZ]];}
 else if(kind==='repositioning'){const alignZ=Math.min(t.z-Math.max(10,Math.abs(bay-t.x)*1.2),stage);coords=[[t.x,t.z],[t.x,t.z-3.5],[bay,alignZ+4],[bay,alignZ]];}
 else if(kind==='leaving'){const dz=t.dumpSlot?.z??DUMP.bays[t.index??0];coords=[[t.x,t.z],[t.x,-16],[6,-16],[14,-13],[26,-13],[34,-13],[36,dz+6],[36,dz],[DUMP.stageX,dz]];}
 else if(kind==='parkingBacking')coords=[[t.x,t.z],[x,z-4],[x,z]];
 else if(kind==='dumpBacking'){const dz=t.dumpSlot?.z??DUMP.bays[t.index??0];coords=[[t.x,t.z],[t.x-2,t.z],[DUMP.truckX+2,dz],[DUMP.truckX,dz]];}
 else coords=t.homeYaw!==undefined?[[t.x,t.z],[45,t.z],[47,-23],[43,-20],[x+4,-20],[x,z-2],[x,z-6]]:[[t.x,t.z],[42,t.z],[47,-26],[43,-17],[x+4,-20],[x+2,z],[x,z]];
 const curve=new T.CatmullRomCurve3(coords.map(([xx,zz])=>V(xx,0,zz)),false,'centripetal');curve.arcLengthDivisions=2048;const length=curve.getLength(),curvature=new Float32Array(129);for(let i=0;i<=128;i++){const u=i/128,a=curve.getTangentAt(Math.max(0,u-.003)),b=curve.getTangentAt(Math.min(1,u+.003));curvature[i]=Math.acos(T.MathUtils.clamp(a.dot(b),-1,1))/Math.max(.01,(Math.min(1,u+.003)-Math.max(0,u-.003))*length);}const speeds=Float32Array.from(curvature,k=>Math.min(9,Math.sqrt(2/Math.max(.01,k))));for(let i=127;i>=0;i--)speeds[i]=Math.min(speeds[i],Math.sqrt(speeds[i+1]**2+2*1.7*length/128));t.route={curve,length,curvature,speeds,distance:0,speed:0,reverse:kind==='backing'||kind==='dumpBacking'||kind==='parkingBacking'};t.state=kind;
}
export function driveTruck(t,dt,time,{dumpSite,transport}={}){
 const previousX=t.x,previousZ=t.z,previousVelocity=t.worldVelocity||V();
 if(t.route){const r=t.route,remain=r.length-r.distance,acceleration=r.reverse?1.05:t.tonnes>5?1.15:1.8,braking=r.reverse?1.8:t.tonnes>5?1.65:2.0,index=Math.min(128,Math.floor(r.distance/r.length*128)),bend=Math.max(r.curvature?.[index]||0,r.curvature?.[Math.min(128,index+2)]||0),safeSpeed=r.speeds?.[index]??Math.sqrt(2/Math.max(.01,bend)),goal=Math.min(t.trafficLimit??Infinity,r.reverse?3.5:9,safeSpeed,Math.sqrt(Math.max(0,remain*2*braking)));r.speed=T.MathUtils.clamp(goal,Math.max(0,r.speed-braking*dt),r.speed+acceleration*dt);const d=Math.min(remain,r.speed*dt);r.distance+=d;const u=Math.min(1,r.distance/r.length),p=r.curve.getPointAt(u),v=r.curve.getTangentAt(u),yaw=Math.atan2(-v.z,v.x)+(r.reverse?Math.PI:0),delta=Math.atan2(Math.sin(yaw-t.yaw),Math.cos(yaw-t.yaw));
 t.travel=(t.travel||0)+d;t.braking=goal<r.speed-.1;t.reversing=r.reverse;t.x=p.x;t.z=p.z;t.yaw=yaw;t.root.position.set(p.x,ground(p.x,p.z)+Math.sin(time*9)*r.speed*.002,p.z);t.root.rotation.y=yaw;
 for(const w of t.wheels){w.roll.rotation.z-=d/(w.radius??1)*(r.reverse?-1:1);w.steer.rotation.y=T.MathUtils.lerp(w.steer.rotation.y,w.front?T.MathUtils.clamp(delta/Math.max(d,.03)*2*(r.reverse?-1:1),-.5,.5):0,1-Math.exp(-dt*8))}
 if(remain<.015){t.route=null;for(const w of t.wheels)w.steer.rotation.y=0;if(t.state==='coming'||t.state==='repositioning'){t.state='staging';t.wait=.45}else if(t.state==='backing'){if(Math.hypot(t.x-(t.bayX??t.x),t.z-(t.bayZ??t.z))>.6){t.state='staging';t.wait=.45}else t.state='ready'}else if(t.state==='leaving'){if(t.tonnes<=.001){dumpSite?.release(t);t.dumpSlot=null;makeRoute(t,'returning');}else{t.state='dumpStaging';t.wait=.5}}else if(t.state==='dumpBacking'){t.state='unloading';t.wait=.4}else if(t.state==='returning'&&t.homeYaw!==undefined){t.state='parkingStaging';t.wait=.45}else t.state='parked'}
 }else if(t.state==='parkingStaging'){t.wait-=dt;if(t.wait<=0)makeRoute(t,'parkingBacking');}
 else if(t.state==='staging'){if(!t.machineMoving&&(t.machineSettled??1)>.55){t.wait-=dt;if(t.wait<=0){if(Math.abs(t.x-(t.bayX??t.x))>.15||t.z>(t.bayZ??-9.4)-4)makeRoute(t,'repositioning');else makeRoute(t,'backing')}}}
 else if(t.state==='ready'&&!t.machineMoving&&(t.machineSettled??1)>.55&&Math.hypot(t.x-(t.bayX??t.x),t.z-(t.bayZ??t.z))>.6)makeRoute(t,'repositioning');
 else if(t.state==='dumpStaging'){t.wait-=dt;if(t.wait<=0)makeRoute(t,'dumpBacking');}
 else if(t.state==='unloading'&&transport){t.wait-=dt;if(t.wait<=0){t.tipAngle=Math.min(.78,(t.tipAngle||0)+dt*.22);if(t.tipAngle>.45){const mass=t.load.discharge(dt*17*Math.min(1,(t.tipAngle-.45)/.17));if(mass>0){const p=bedWorldPoint(t,-2.85,BED.floor+.14,(Math.random()-.5)*1.85),a=t.yaw;transport(mass,V(p.x,p.y,p.z),V(-Math.cos(a)*.7,-.3,Math.sin(a)*.7));}}if(t.load.field.mass<1e-7){t.state='lowering';t.wait=.5;}}}
 else if(t.state==='lowering'){t.wait-=dt;if(t.wait<=0){t.tipAngle=Math.max(0,t.tipAngle-dt*.32);if(t.tipAngle===0){dumpSite?.release(t);t.dumpSlot=null;makeRoute(t,'returning');}}}
 if(!t.route){t.braking=false;t.reversing=false;}t.worldVelocity=V((t.x-previousX)/dt,0,(t.z-previousZ)/dt);
 if(t.load){const a=t.yaw,acc=t.worldVelocity.clone().sub(previousVelocity).multiplyScalar(1/dt),clamp=v=>T.MathUtils.clamp(v/9.81,-.35,.35),force={x:clamp(Math.cos(a)*acc.x-Math.sin(a)*acc.z),z:clamp(Math.sin(a)*acc.x+Math.cos(a)*acc.z)},smooth=t.loadForce??={x:0,z:0},blend=1-Math.exp(-dt/.25);smooth.x+=(force.x-smooth.x)*blend;smooth.z+=(force.z-smooth.z)*blend;t.load.update(dt,t.tipAngle>.01?{x:0,z:0}:smooth);t.tonnes=t.load.field.mass;}else t.cargo.visible=t.tonnes>.1;
 if(t.bedPivot)t.bedPivot.rotation.z=t.tipAngle||0;if(t.tailgate)t.tailgate.rotation.z=-Math.min(1.15,(t.tipAngle||0)*2.5);t.hoist?.update(t.tipAngle||0);
 if(t.signals){t.signals.brake.emissiveIntensity=t.braking?3.5:.35;t.signals.reverse.emissiveIntensity=t.reversing?2.7:0;}placeOnRoad(t,dt,time);
}
// The new dump apron has ramps. All four tyre contact patches support the
// chassis, rather than a horizontal body hovering above its centre sample.
function placeOnRoad(t,dt,time){
 const c=Math.cos(t.yaw),s=Math.sin(t.yaw),h=(x,z)=>ground(t.x+c*x+s*z,t.z-s*x+c*z),front=(h(2.1,-1.82)+h(2.1,1.82))/2,rear=(h(-2.15,-1.82)+h(-2.15,1.82))/2,left=(h(2.1,-1.82)+h(-2.15,-1.82))/2,right=(h(2.1,1.82)+h(-2.15,1.82))/2,blend=1-Math.exp(-dt*8);
 t.roadPitch=(t.roadPitch||0)+(T.MathUtils.clamp(Math.atan2(front-rear,4.25),-.38,.38)-(t.roadPitch||0))*blend;
 t.roadRoll=(t.roadRoll||0)+(T.MathUtils.clamp(Math.atan2(left-right,3.64),-.28,.28)-(t.roadRoll||0))*blend;
 let floor=-Infinity;for(const x of [-2.15,2.1])for(const z of [-1.82,1.82])floor=Math.max(floor,h(x,z)-(x*Math.sin(t.roadPitch)*Math.cos(t.roadRoll)-z*Math.sin(t.roadRoll)));
 const suspension=stepSuspension(t,dt);t.pitch=t.roadPitch+suspension.pitch;t.roll=t.roadRoll+suspension.roll;
 t.root.position.y=floor+suspension.heave+(Math.sin((t.travel||0)*.9)+.3*Math.sin((t.travel||0)*2.1))*(t.route?.speed||0)*.0015;t.root.rotation.set(t.roll,t.yaw,t.pitch,'YXZ');
 // Compensate axle attachment height while the heavy sprung body settles.
 const cp=Math.cos(t.pitch),sp=Math.sin(t.pitch),cr=Math.cos(t.roll),sr=Math.sin(t.roll);
 for(const w of t.wheels){const p=w.steer.position,baseY=1.14-suspension.heave-p.x*Math.sin(suspension.pitch)+p.z*Math.sin(suspension.roll);p.y=baseY;
  // A sprung body is a plane; four tyre patches on a curved ramp are not.
  // Small independent axle corrections keep each tyre on its real surface.
  for(let pass=0;pass<3;pass++){const yy=p.y-1.14,px=p.x*cp-yy*sp,py=p.x*sp+yy*cp,zz=py*sr+p.z*cr,wx=t.x+c*px+s*zz,wz=t.z-s*px+c*zz,error=ground(wx,wz)-(t.root.position.y+py*cr-p.z*sr);p.y=T.MathUtils.clamp(p.y+error/Math.max(.5,cp*cr),baseY-.20,Math.min(baseY+.20,BED.floor-BED.floorThickness-1.26));}
 }
}
export function catches(truck,x,z){if(!truck||truck.tipAngle>.01)return false;const dx=x-truck.x,dz=z-truck.z,a=truck.yaw,lx=Math.cos(a)*dx-Math.sin(a)*dz,lz=Math.sin(a)*dx+Math.cos(a)*dz;return bodyContains(lx,lz)}
