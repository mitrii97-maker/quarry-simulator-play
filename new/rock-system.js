import {aggregateMaterial} from './dry-fines.js?build=hotfix-20261106-20';
import {aggregateClusterGeometry} from './aggregate-cluster.js?build=hotfix-20261106-20';
import {loadImpact} from './truck-suspension.js?build=hotfix-20261106-20';
import {oreGeometry} from './ore-geometry.js?build=hotfix-20261106-20';
import * as T from '../three.module.js?build=hotfix-20261106-20';
import {V} from './geometry.js?build=hotfix-20261106-20';
import {ground,depositLoose} from './world.js?build=hotfix-20261106-20';
import {BED,bedCoordinates,bedWorldPoint} from './truck-load.js?build=hotfix-20261106-20';
import {catches} from './haul.js?build=hotfix-20261106-20';
import {ORE,BUCKET_STREAM_WIDTH,BUCKET_TONNES,MACHINE} from './material-volume.js?build=hotfix-20261106-20';
import {TRUCK_CAPACITY,recordLoaded} from './levels.js?build=hotfix-20261106-20';
import {hardTruckSurface} from './truck-contact.js?build=hotfix-20261106-20';
import {dryGrainVelocity} from './dry-material.js?build=hotfix-20261106-20';

export function makeRockSystem(scene,material,onImpact=()=>{},dumpSite=null,onDelivery=()=>{}){
 const count=720,particles=Array.from({length:count},()=>({life:0,mass:0,p:V(),v:V(),rotation:V(),r:.1,kind:'fall',captureMass:0,landed:false,start:V(),target:V()})),mesh=new T.InstancedMesh(oreGeometry(),material,count*2),dummy=new T.Object3D(),up=V(0,1,0);
 mesh.count=0;mesh.visible=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.name='Mixed rock stream and rolling fragments';mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);let cursor=0,pending=0,nextMass=.16,lastEmitter=null,delivered=0,spilled=0;
 const packetGeometry=aggregateClusterGeometry();
 const fine=new T.InstancedMesh(packetGeometry,aggregateMaterial(material),count);fine.material.color.multiplyScalar(.63);fine.name='Dense fine aggregate in the actual intake and discharge';fine.count=0;fine.visible=false;fine.frustumCulled=false;fine.instanceMatrix.setUsage(T.DynamicDrawUsage);fine.castShadow=false;fine.receiveShadow=true;scene.add(fine);const lipPoint=V(),goalPoint=V();
 const queued=[],color=new T.Color();for(let i=0;i<count*2;i++){color.set('#ffffff').multiplyScalar(.74+Math.random()*.36);mesh.setColorAt(i,color);dummy.scale.setScalar(0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
 const dustCount=120,puffs=Array.from({length:dustCount},()=>({life:0,total:1,p:V(),v:V(),size:0})),dustPos=new Float32Array(dustCount*3),dustSize=new Float32Array(dustCount),dustAlpha=new Float32Array(dustCount),dustGeometry=new T.BufferGeometry();let puffCursor=0;
 dustGeometry.setAttribute('position',new T.BufferAttribute(dustPos,3));dustGeometry.setAttribute('size',new T.BufferAttribute(dustSize,1));dustGeometry.setAttribute('alpha',new T.BufferAttribute(dustAlpha,1));
 const dustMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{tint:{value:new T.Color('#bbb0a0')}},vertexShader:'attribute float size;attribute float alpha;varying float a;void main(){a=alpha;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(size*280./max(1.,-p.z),0.,85.);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 tint;varying float a;void main(){float r=length(gl_PointCoord-.5)*2.;float opacity=pow(max(0.,1.-r*r),2.)*a;if(opacity<.003)discard;gl_FragColor=vec4(tint,opacity);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}),dust=new T.Points(dustGeometry,dustMaterial);dust.frustumCulled=false;dust.name='Local impact dust';dust.visible=false;scene.add(dust);
 function puff(point,energy=.2){const n=Math.min(7,1+Math.floor(energy*6));for(let i=0;i<n;i++){const d=puffs[puffCursor++%dustCount];d.p.copy(point);d.v.set((Math.random()-.5)*.45,.12+Math.random()*.35,(Math.random()-.5)*.45);d.total=d.life=.45+Math.random()*.65;d.size=.18+Math.random()*.24+Math.min(.45,energy*.25)}}
 function slot(){for(let n=0;n<count;n++){const p=particles[cursor++%count];if(p.life<=0||p.mass<=1e-10&&p.life<.35&&!(p.kind==='scoop'&&p.captureMass>0))return p}return null}
 function emit(point,velocity,mass,kind='fall',deliveryId=null){
  const p=slot();if(!p)return false;p.life=7;p.deliveryId=deliveryId;p.captureMass=0;p.mass=mass;p.p.copy(point);p.v.copy(velocity);const scatter=.08+.10/(1+mass*12);p.v.x+=(Math.random()-.5)*scatter;p.v.z+=(Math.random()-.5)*scatter;if(kind==='fall')p.v.y-=.12+Math.random()*.12;p.r=mass>0?Math.max(.025,Math.min(.24,Math.cbrt(mass/ORE.looseDensity/3.5))):.03+Math.random()*.045;p.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);p.kind=kind;p.landed=false;p.owner=null;return true;
 }
 function drainEmitter(flush=false){
  if(!lastEmitter)return;
  let safety=0;while(pending>1e-10&&(pending>=nextMass||flush)&&safety++<count){const amount=Math.min(nextMass,pending),e=lastEmitter,p=e.point.clone().add(V(0,0,(Math.random()+Math.random()-1)*BUCKET_STREAM_WIDTH*.43).applyQuaternion(e.rotation));if(!emit(p,e.velocity,amount))break;pending-=amount;nextMass=.035+Math.random()**3*.27;}
 }
 function pour(mass,point,rotation,velocity){pending+=mass;lastEmitter={point:point.clone(),rotation:rotation.clone(),velocity:velocity.clone()};drainEmitter(false)}
 function finishPour(){drainEmitter(true)}
 // Haulers have independent emitters: concurrent tipping cannot redirect the
 // excavator's pending stream or lose mass when the bounded pool is full.
 function transport(mass,point,velocity,deliveryId=null){let left=mass;while(left>1e-10){const amount=Math.min(.36,left),p=point.clone();p.z+=(Math.random()-.5)*.17;if(!emit(p,velocity,amount,'fall',deliveryId))queued.push({point:p,velocity:velocity.clone(),mass:amount,deliveryId});left-=amount;}}
 function scoop(start,localTarget,mass=.09){const p=slot();if(!p)return false;p.total=p.life=.24+Math.random()*.16;p.mass=0;p.captureMass=mass;p.kind='scoop';p.captureZ=localTarget.z;p.start.copy(start);p.target.copy(localTarget);p.p.copy(start);p.r=Math.max(.035,Math.min(.17,Math.cbrt(mass/ORE.looseDensity/3.8)));p.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);p.landed=false;if(Math.random()<.28)puff(start,.06);return true;}
 function ravel(data,offset){const p=slot();if(!p)return;p.kind='ravel';p.mass=0;p.captureMass=0;p.total=p.life=.30;p.start.set(data[offset],data[offset+1],data[offset+2]);p.target.set(data[offset+3],data[offset+4],data[offset+5]);p.p.copy(p.start);p.r=Math.min(.13,Math.max(.04,Math.cbrt(data[offset+6])*.55));p.rotation.set(0,offset*.7,offset*.3);p.v.set(0,0,0);p.landed=false;}
 function spill(truck,s){const p=bedWorldPoint(truck,s.x+s.nx*.27,BED.floor+Math.max(truck.load.displayHeight(s.x,s.z),BED.rim-BED.floor)+.05,s.z+s.nz*.27),a=truck.yaw,v=V(Math.cos(a)*s.nx+Math.sin(a)*s.nz,0,-Math.sin(a)*s.nx+Math.cos(a)*s.nz).multiplyScalar(.5).add(truck.worldVelocity||V());if(!emit(V(p.x,p.y,p.z),v,s.mass))queued.push({point:V(p.x,p.y,p.z),velocity:v,mass:s.mass});}
 function surface(point,trucks){let receiver=null,solid=null,height=ground(point.x,point.z);if(dumpSite?.contains(point.x,point.z)){height=Math.max(height,dumpSite.height(point.x,point.z));receiver=dumpSite;}for(const t of trucks){if(catches(t,point.x,point.z)){const h=(t.root?.position.y||0)+t.load.surface(t,point.x,point.z);if(h>height){height=h;receiver=t;solid=null}}if(t.tipAngle>.01)continue;const hard=hardTruckSurface(t,point.x,point.z);if(hard.height>height){height=hard.height;receiver=null;solid={truck:t,...hard}}}return {receiver,solid,height}}
 function gradient(point,receiver){if(receiver===dumpSite&&dumpSite)return dumpSite.gradient(point.x,point.z);if(receiver)return receiver.load.gradient(receiver,point.x,point.z);const e=.1;return {x:(ground(point.x+e,point.z)-ground(point.x-e,point.z))/(2*e),z:(ground(point.x,point.z+e)-ground(point.x,point.z-e))/(2*e)}}
 function update(dt,rig,trucks){
  if(queued.length){for(let i=queued.length-1;i>=0;i--){const q=queued[i];if(emit(q.point,q.velocity,q.mass,'fall',q.deliveryId))queued.splice(i,1);else break}}
  let impactEnergy=0,impactSurface='ground',visible=0,visibleDust=0,visibleFine=0;
  for(let i=0;i<count;i++){
   const p=particles[i];if(p.life>0){
    p.life-=dt;
    if(p.kind==='settled'){const t=p.owner,c=p.local,world=bedWorldPoint(t,c.x,BED.floor+t.load.displayHeight(c.x,c.z)+p.r*.2,c.z);p.p.set(world.x,world.y+(p.bounce||0)*Math.sin(Math.PI*Math.max(0,p.life)/(p.settleTime||1)),world.z);}
    else if(p.kind==='ravel'){const u=Math.max(0,Math.min(1,1-p.life/p.total));p.p.lerpVectors(p.start,p.target,u*u);p.rotation.z+=dt*3;}
    else if(p.kind==='scoop'){const u=Math.max(0,Math.min(1,1-p.life/p.total));rig.bucket.localToWorld(lipPoint.set(MACHINE.kind==='face-shovel'?1.26:-1.26,-1.40,p.captureZ));rig.bucket.localToWorld(rig.charge?.entryPoint(p.captureZ,goalPoint)||goalPoint.copy(p.target));if(u<.48){const t=u/.48;p.p.lerpVectors(p.start,lipPoint,t);p.p.y+=Math.sin(Math.PI*t)*.035;}else{const t=(u-.48)/.52;p.p.lerpVectors(lipPoint,goalPoint,t);p.p.y+=Math.sin(Math.PI*t)*.05;}p.rotation.z-=dt*(3+u*5);}

    else{
     p.v.y-=9.81*dt;p.p.addScaledVector(p.v,dt);const {receiver,solid,height}=surface(p.p,trucks);
     if(p.p.y<height+p.r*.3){
      p.p.y=height+p.r*.3;const slope=solid?{x:0,z:0}:gradient(p.p,receiver),normal=V(-slope.x,1,-slope.z).normalize(),speed=Math.max(0,-p.v.dot(normal));
      if(p.mass>1e-10){
       if(receiver===dumpSite&&dumpSite){const accepted=dumpSite.deposit(p.p.x,p.p.z,p.mass);p.mass-=accepted;if(accepted>0&&p.deliveryId)onDelivery(p.deliveryId,accepted);}
       else if(receiver){const accepted=Math.min(p.mass,Math.max(0,TRUCK_CAPACITY-receiver.load.field.mass));if(accepted>0){receiver.load.deposit(receiver,p.p.x,p.p.z,accepted);receiver.tonnes=receiver.load.field.mass;loadImpact(receiver,p.p.x,p.p.z,accepted,speed);p.mass-=accepted;delivered+=accepted;recordLoaded(accepted)}}
       else if(!solid){depositLoose(p.p.x,p.p.z,p.mass);spilled+=p.mass;p.mass=0;}
       if(speed>1){const energy=Math.min(1.3,speed*.045+p.r*.5);puff(p.p,energy);if(energy>impactEnergy){impactEnergy=energy;impactSurface=solid?'metal':receiver&&receiver!==dumpSite?'bed':'ground';}}
      }
      if(receiver===dumpSite&&dumpSite&&p.mass<1e-10){p.v.set(0,0,0);p.landed=true;p.life=Math.min(p.life,.18);}
      else if(receiver&&p.mass<1e-10){const c=bedCoordinates(receiver,p.p.x,p.p.z),margin=Math.max(.04,p.r*1.25);p.local={x:T.MathUtils.clamp(c.x,-BED.width/2+margin,BED.width/2-margin),z:T.MathUtils.clamp(c.z,-BED.depth/2+margin,BED.depth/2-margin)};p.owner=receiver;p.kind='settled';p.life=.28+Math.random()*.22;p.settleTime=p.life;p.bounce=Math.min(.18,speed*speed/180);p.v.set(0,0,0);p.landed=true;}
      else if(!p.landed){p.v.addScaledVector(normal,speed*1.17);p.v.multiplyScalar(.44);p.landed=true;p.owner=receiver;p.life=p.mass>1e-10?4:Math.min(p.life,.8+Math.random()*.35);}
      else{
       if(!solid&&!(receiver&&p.mass>1e-10)){const dry=dryGrainVelocity(p.v.x,p.v.z,slope,dt);p.v.x=dry.x;p.v.z=dry.z;if(dry.sleep)p.life=Math.min(p.life,.25);}
       else{const denom=1+slope.x*slope.x+slope.z*slope.z;p.v.x-=9.81*slope.x/denom*dt;p.v.z-=9.81*slope.z/denom*dt;const friction=Math.exp(-dt*(solid?1.6:1.2));p.v.x*=friction;p.v.z*=friction;}p.v.y=0;
       if(solid){const a=solid.truck.yaw;p.v.x+=(Math.cos(a)*solid.slideX+Math.sin(a)*solid.slideZ)*dt;p.v.z+=(-Math.sin(a)*solid.slideX+Math.cos(a)*solid.slideZ)*dt;p.life=Math.max(p.life,.6);}
       else if(receiver&&p.mass>1e-10){const c=bedCoordinates(receiver,p.p.x,p.p.z),nx=c.x<0?-1:1,nz=c.z<0?-1:1,useX=BED.width/2-Math.abs(c.x)<BED.depth/2-Math.abs(c.z),a=receiver.yaw,dx=useX?nx:0,dz=useX?0:nz;p.v.x+=(Math.cos(a)*dx+Math.sin(a)*dz)*dt*1.1;p.v.z+=(-Math.sin(a)*dx+Math.cos(a)*dz)*dt*1.1;p.life=Math.max(p.life,.6);}
       else if(p.v.length()<.025)p.life=Math.min(p.life,.25);
      }
     }
     p.rotation.x+=p.v.z*dt/Math.max(.035,p.r);p.rotation.z-=p.v.x*dt/Math.max(.035,p.r);
     if(p.life<=0&&p.mass>1e-10){if(receiver||solid){p.life=1;}else{depositLoose(p.p.x,p.p.z,p.mass);spilled+=p.mass;p.mass=0;}}
    }
    if((p.kind==='scoop'||p.kind==='fall')&&p.life>0&&!p.landed){dummy.position.copy(p.p);dummy.rotation.set(p.rotation.x*.25,p.rotation.y*.25,p.rotation.z*.25);dummy.scale.set(p.r*1.17,p.r*.68,p.r*1.24);dummy.updateMatrix();fine.setMatrixAt(visibleFine++,dummy.matrix);}
    for(let part=0;part<2;part++){const sign=part?1:-1;dummy.rotation.set(p.rotation.x+part*.72,p.rotation.y+part*.45,p.rotation.z);dummy.position.copy(p.p);dummy.position.x+=sign*p.r*.40;dummy.position.z+=sign*p.r*.28;dummy.position.y+=p.r*.20;const fade=p.life>0?1:0,r=p.r*(part?.33:.49);dummy.scale.set(r*1.14*fade,r*.84*fade,r*fade);dummy.updateMatrix();mesh.setMatrixAt(visible++,dummy.matrix);}
   }
  }
  fine.count=visibleFine;fine.visible=visibleFine>0;if(visibleFine){fine.instanceMatrix.clearUpdateRanges();fine.instanceMatrix.addUpdateRange(0,visibleFine*16);fine.instanceMatrix.needsUpdate=true;}
  mesh.count=visible;mesh.visible=visible>0;if(visible){mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,visible*16);mesh.instanceMatrix.needsUpdate=true;}
  for(let i=0;i<dustCount;i++){const d=puffs[i];if(d.life>0){d.life-=dt;d.v.multiplyScalar(Math.exp(-dt*1.5));d.p.addScaledVector(d.v,dt);const u=1-d.life/d.total;const j=visibleDust++;dustPos[j*3]=d.p.x;dustPos[j*3+1]=d.p.y;dustPos[j*3+2]=d.p.z;dustSize[j]=d.size*(.4+u*2);dustAlpha[j]=Math.sin(Math.PI*Math.max(0,Math.min(1,u)))*.14;}else{dustSize[i]=dustAlpha[i]=0}}
  dust.visible=visibleDust>0;dustGeometry.setDrawRange(0,visibleDust);if(visibleDust)for(const attribute of Object.values(dustGeometry.attributes)){attribute.clearUpdateRanges();attribute.addUpdateRange(0,visibleDust*attribute.itemSize);attribute.needsUpdate=true;}
  if(impactEnergy>0)onImpact(impactEnergy,impactSurface);return impactEnergy;
 }
 function reset(){for(const p of particles){p.life=0;p.mass=0;p.captureMass=0}for(const p of puffs)p.life=0;pending=0;queued.length=0;lastEmitter=null;delivered=spilled=0;mesh.count=0;mesh.visible=fine.visible=dust.visible=false;fine.count=0;}
 return {mesh,fine,dust,particles,pour,finishPour,transport,scoop,puff,ravel,spill,update,reset,get intakeMass(){let mass=0;for(const p of particles)if(p.kind==='scoop'&&p.life>0)mass+=p.captureMass;return mass;},get pendingMass(){return pending},get inFlightMass(){return pending+queued.reduce((m,q)=>m+q.mass,0)+particles.reduce((m,p)=>m+p.mass,0)},get deposited(){return delivered},get groundDeposited(){return spilled}};
}
