import {makeCabTablet} from './cab-tablet.js?build=lighting-20261106-26';
import {addCounterweight} from './counterweight.js?build=lighting-20261106-26';
import {MACHINE,BUCKET_TONNES} from './material-volume.js?build=lighting-20261106-26';
import {miningHouse,miningCab,miningArm,makeFaceShovel} from './mining-models.js?build=lighting-20261106-26';
import {applyMachineWear} from './machine-patina.js?build=lighting-20261106-26';
import {makeBucketShell} from './bucket-model.js?build=lighting-20261106-26';
import {volvoBody,volvoCab,volvoArmMarkings,volvoTrackFrames} from './volvo-style.js?build=lighting-20261106-26';
import {chassisPoint} from './chassis.js?build=lighting-20261106-26';
import {trackBelt} from './track-belt.js?build=lighting-20261106-26';
import {makeRollerFaces} from './track-rollers.js?build=lighting-20261106-26';
import {makeCabinInterior} from './cabin-interior.js?build=lighting-20261106-26';
import {CABIN_VIEW} from './camera-layout.js?build=lighting-20261106-26';
import {detailExcavator} from './detailing.js?build=lighting-20261106-26';
import {BUCKET} from './bucket-config.js?build=lighting-20261106-26';
import * as T from '../three.module.js?build=lighting-20261106-26';
import {V,add,block,plate,pin,rod,cylinderRig,hose} from './geometry.js?build=lighting-20261106-26';
import {batchMeshes} from '../batching.js?build=lighting-20261106-26';
import {roundedPlate} from './sculpted.js?build=lighting-20261106-26';
import {makeBucketLoad} from './bucket-load.js?build=lighting-20261106-26';
export const ARM={boom:5.8,stick:4.4,base:2.05};
export function bucketWorldPoint(state,x=0,y=0,z=0){const a=state.boom,b=a+state.stick,angle=b+state.curl,reach=.55+5.8*Math.cos(a)+4.4*Math.cos(b),height=ARM.base+5.8*Math.sin(a)+4.4*Math.sin(b),xx=reach+x*Math.cos(angle)-y*Math.sin(angle),yy=height+x*Math.sin(angle)+y*Math.cos(angle);return chassisPoint(state,Math.cos(state.yaw)*xx+Math.sin(state.yaw)*z,yy,-Math.sin(state.yaw)*xx+Math.cos(state.yaw)*z)}
export function forward(state){return {...bucketWorldPoint(state),angle:state.boom+state.stick+state.curl}}
export function bucketFrame(s,out={}){
 const yaw=s.yaw,a=s.boom,b=a+s.stick,q=b+s.curl,cy=Math.cos(yaw),sy=Math.sin(yaw),cr=Math.cos(s.roll||0),sr=Math.sin(s.roll||0),cp=Math.cos(s.pitch||0),sp=Math.sin(s.pitch||0),c=Math.cos(q),sn=Math.sin(q),reach=.55+5.8*Math.cos(a)+4.4*Math.cos(b),height=ARM.base+5.8*Math.sin(a)+4.4*Math.sin(b);
 const set=(prefix,x,y,z,origin=false)=>{const yy=y*cr-z*sr;out[prefix+'x']=x*cp-yy*sp+(origin?(s.baseX||0):0);out[prefix+'y']=x*sp+yy*cp+(origin?(s.baseY??4):0);out[prefix+'z']=y*sr+z*cr+(origin?(s.baseZ||0):0)};
 out.scale=MACHINE.scale;set('o',cy*reach*MACHINE.scale,height*MACHINE.scale,-sy*reach*MACHINE.scale,true);set('a',cy*c,sn,-sy*c);set('b',-cy*sn,c,sy*sn);set('c',sy,0,cy);return out;
}
export function framePoint(f,x=0,y=0,z=0,out={}){const k=f.scale||1;out.x=f.ox+(f.ax*x+f.bx*y+f.cx*z)*k;out.y=f.oy+(f.ay*x+f.by*y+f.cy*z)*k;out.z=f.oz+(f.az*x+f.bz*y+f.cz*z)*k;return out;}

export function solveBucketLink(q){const B={x:3.65,y:.2},C={x:4.4+.32*Math.cos(q)-.3*Math.sin(q),y:.32*Math.sin(q)+.3*Math.cos(q)},dx=C.x-B.x,dy=C.y-B.y,d=Math.hypot(dx,dy),r=.56,l=.8;const a=Math.atan2(dy,dx)+Math.acos(Math.max(-1,Math.min(1,(r*r+d*d-l*l)/(2*r*d))));return {x:B.x+r*Math.cos(a),y:B.y+r*Math.sin(a),angle:a-Math.atan2(.32,.46),anchor:C}};
export function makeExcavator(scene,materials){
 const M={...materials};M.paint=materials.paint.clone();M.paint.color.set(MACHINE.color);M.paint.roughness=.54;M.paint.metalness=.10;M.boom=new T.MeshStandardMaterial({color:'#303234',roughness:.66,metalness:.22,map:materials.paint.map,envMapIntensity:.65});M.warning=new T.MeshStandardMaterial({color:'#ebc13d',roughness:.8});
 for(const key of ['track','rubber','bucket'])M[key]=materials[key].clone();
 applyMachineWear(M.paint,'paint');applyMachineWear(M.boom,'paint');applyMachineWear(M.track,'bucket');applyMachineWear(M.bucket,'bucket');applyMachineWear(M.rubber,'rubber');
 const root=new T.Group();root.scale.setScalar(MACHINE.scale);root.position.set(0,4,0);root.rotation.order='ZXY';scene.add(root);const belts=[];
 for(const z of [-1.35,1.35]){
  block(root,M.track,[5.9,.85,1.02],[0,.61,z],.3);
  for(let i=0;i<8;i++){const x=-2.35+i*.67;pin(root,M.rubber,x,.55,z,.34,1.05);pin(root,M.steel,x,.55,z,.18,1.09)}
  belts.push(trackBelt(root,M,z));
  for(const x of [-2.8,2.8]){pin(root,M.track,x,.59,z,.48,1.08);pin(root,M.steel,x,.59,z,.23,1.12)}
 }
 const rollers=makeRollerFaces(root,M.steel);
 block(root,M.dark,[3.8,.4,2.1],[0,1.04,0]);const race=add(root,new T.CylinderGeometry(1.22,1.3,.36,48),M.steel,0,1.38,0);
 const house=new T.Group();house.position.y=1.58;root.add(house);
 if(MACHINE.id==='volvo')volvoBody(house,M);else miningHouse(house,M,MACHINE);addCounterweight(house,M,MACHINE);
 // Full cabin frame, thin glass panes and a clear front windscreen.
 const cab=new T.Group();cab.position.set(.35,MACHINE.kind==='face-shovel'?1.9:MACHINE.id==='volvo'?1.08:1.35,MACHINE.id==='volvo'?-1.05:-1.36);house.add(cab);
 if(MACHINE.id==='volvo')volvoCab(cab,M);else miningCab(cab,M,MACHINE);
 // Clear glazing must not cast a solid black shadow across the cockpit.
 cab.traverse(o=>{if(o.isMesh&&o.material===M.glass)o.castShadow=false;});
 const cockpit=makeCabinInterior(cab,M);
 // Safety rails, perforated access steps and work lights.
 for(let i=0;i<4;i++)block(house,M.steel,[.56,.08,.28],[.4,-.4+i*.32,-1.62-i*.05],.01);
 for(const z of [-.38,.38]){block(house,M.dark,[.25,.23,.32],[1.38,1.08,z]);block(house,M.lamp,[.02,.17,.25],[1.52,1.08,z],.01)}
 // Every joint is a real transform; bucket hangs from the end of the stick.
 const shoulder=new T.Group();shoulder.position.set(.55,ARM.base-1.58,0);house.add(shoulder);
 const stick=new T.Group();stick.position.x=ARM.boom;shoulder.add(stick);
 if(MACHINE.id==='volvo'){
  const boom=roundedPlate(shoulder,M.boom,[[0,-.38],[.9,-.18],[2.4,.12],[4.6,-.06],[5.8,-.23],[5.95,0],[5.8,.27],[4.4,.46],[2.45,1.08],[1.05,.89],[.2,.4]],.76,0,{corner:.23,bevel:.055});
 roundedPlate(stick,M.boom,[[-1.03,-.15],[-1.17,.23],[-1.03,.52],[-.72,.65],[0,.37],[1.4,.35],[4.4,.17],[4.4,-.17],[1.3,-.32],[0,-.35]],.48,0,{corner:.16,bevel:.035});pin(stick,M.steel,-.72,.27,0,.14,.85);

 }else miningArm(shoulder,stick,M,MACHINE);
 const bucket=new T.Group();bucket.position.x=ARM.stick;stick.add(bucket);
 const bucketModel=MACHINE.kind==='face-shovel'?makeFaceShovel(bucket,M):makeBucketShell(bucket,M);
 // All shell parts share one rigid frame. Merge their repeated materials with
 // the pin hardware; semantic groups retain tip/ear metadata for validation.
 if(MACHINE.kind!=='face-shovel')for(const group of [bucketModel.body,bucketModel.teeth,bucketModel.mounts])for(const mesh of [...group.children])if(mesh.isMesh)bucket.add(mesh);
 pin(bucket,M.steel,0,0,0,.15,1.1);pin(shoulder,M.steel,0,0,0,.24,1.05);pin(stick,M.steel,0,0,0,.21,.95);
 // Correctly anchored boom, stick and bucket actuators.
 const lifts=[-.46,.46].map(z=>({z,c:cylinderRig(house,M.boom,M.chrome,{radius:.19,rodRadius:.105})}));
 const stickRam=cylinderRig(shoulder,M.boom,M.chrome,{radius:.17,rodRadius:.095}),bucketRam=cylinderRig(stick,M.boom,M.chrome,{radius:.16,rodRadius:.09});
 bucketRam.bodyLength=2.05;
 const bellcrank=new T.Group();bellcrank.position.set(3.65,.2,0);stick.add(bellcrank);for(const z of [-.33,.33])plate(bellcrank,M.boom,[[0,-.08],[.38,.4],[.58,.29],[.15,-.1]],.09,z);
 const linkA=rod(stick,M.steel,V(),V(1,0,0),.06),linkB=rod(stick,M.steel,V(),V(1,0,0),.06);
 linkA.userData.dynamic=true;linkB.userData.dynamic=true;
 for(const z of [-.31,.31])hose(shoulder,M.black,[V(.2,.31,z),V(1.2,.97,z),V(2.5,1.18,z),V(3.4,.87,z),V(4.6,.52,z),V(5.4,.38,z)]);
 hose(stick,M.black,[V(.1,.46,.28),V(1.2,.49,.28),V(2.8,.3,.28),V(3.5,.31,.28)]);
 const charge=makeBucketLoad(M.freshRock),cargo=charge.group;bucket.add(cargo);if(MACHINE.kind==='face-shovel'){cargo.rotation.y=Math.PI;const entry=charge.entryPoint;charge.entryPoint=(z,out)=>{const point=entry(-z,out);point.x*=-1;point.z*=-1;return point;};}
 let lastPose=[],digRock=0,digVelocity=0,lastPressure=0,lastBoomSpeed=0;
 function update(s,dt=1/30){const h=Math.min(.04,dt),pressure=s.digPressure||0,target=-pressure*MACHINE.vibration-(s.payload||0)*.008;digVelocity+=(target-digRock)*48*h-digVelocity*5.5*h+(pressure-lastPressure)*.17;digRock+=digVelocity*h;digVelocity+=((s.velocity?.boom||0)-lastBoomSpeed)*(s.payload||0)*.045;lastBoomSpeed=s.velocity?.boom||0;lastPressure=pressure;digRock=T.MathUtils.clamp(digRock,-.035,.035);const pose=[s.baseX,s.baseY,s.baseZ,s.roll,s.pitch,s.yaw,s.boom,s.stick,s.curl,digRock];if(pose.some((value,i)=>value!==lastPose[i])){lastPose=pose;root.position.set(s.baseX||0,s.baseY??4,s.baseZ||0);root.rotation.set((s.roll||0)+digRock*Math.sin(s.yaw)*.6,0,(s.pitch||0)+digRock*Math.cos(s.yaw),'ZXY');house.rotation.y=s.yaw;shoulder.rotation.z=s.boom;stick.rotation.z=s.stick;bucket.rotation.z=s.curl;
  const rot=(x,y,a)=>V(x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),0);
  for(const {z,c} of lifts){const a=V(.1,-.05,z),b=rot(2.15,.15,s.boom).add(shoulder.position);b.z=z;c.update(a,b)}
  stickRam.update(V(2.55,1.18,.12),rot(-.72,.27,s.stick).add(V(5.8,0,.12)));
  const linkage=solveBucketLink(s.curl);bellcrank.rotation.z=linkage.angle;const crank=V(linkage.x,linkage.y,0);bucketRam.update(V(-.65,.28,0),crank);
  const bucketAnchor=rot(.32,.3,s.curl).add(V(4.4,0,0));for(const [i,l] of [linkA,linkB].entries()){const a=crank.clone(),b=bucketAnchor.clone();a.z=b.z=i?.35:-.35;const d=b.sub(a);l.position.copy(a).addScaledVector(d,.5);l.scale.y=d.length();l.quaternion.setFromUnitVectors(V(0,1,0),d.normalize())}
  }bucketModel.update?.(s.shovelDoor||0);charge.update(s,dt);
 }
 // Small in-cab instrument is driven by real payload and cutting load.
 const tablet=makeCabTablet(cab,M,MACHINE);
 function telemetry(pressure,payload,data){tablet.update(data||{fill:payload,bucketMass:payload*BUCKET_TONNES,systems:{load:pressure},level:{}});}
 telemetry(0,0);

 for(let i=0;i<24;i++){const a=i*Math.PI/12,bolt=add(root,new T.CylinderGeometry(.045,.045,.065,6),M.steel,Math.cos(a)*1.17,1.585,Math.sin(a)*1.17);}
 detailExcavator({root,house,cab,shoulder,stick,bucket},M);if(MACHINE.id==='volvo'){volvoArmMarkings(shoulder,M);volvoTrackFrames(root,M);}
 // Merge static parts inside each independently moving frame.
 for(const group of [root,house,cab,shoulder,stick,bucket,cargo])batchMeshes(group);
 return {root,house,cab,cockpit,shoulder,stick,bucket,bucketModel,cargo,charge,rollers,tablet,update,telemetry,advanceTracks(distance){for(const b of belts)b.advance(distance);rollers.advance(distance)},mouth:V(BUCKET.mouth.x,BUCKET.mouth.y,0),seat:V(cab.position.x+CABIN_VIEW.eye.x,house.position.y+cab.position.y+CABIN_VIEW.eye.y,cab.position.z+CABIN_VIEW.eye.z)};
}
