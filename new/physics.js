import {levelConfig} from './career-config.js?build=hotfix-20261106-21';
import {levelState} from './levels.js?build=hotfix-20261106-21';
import {bodyContains} from './hauler-body-config.js?build=hotfix-20261106-21';
import {BED} from './truck-load.js?build=hotfix-20261106-21';
import {takeRock} from './levels.js?build=hotfix-20261106-21';
import {BUCKET,opening,FACE_SHOVEL} from './bucket-config.js?build=hotfix-20261106-21';
import {forward,bucketWorldPoint,bucketFrame,framePoint} from './rig.js?build=hotfix-20261106-21';
import {ground,canDig,excavateSweep,excavateFront,relieveFrontContact,gradeBucketSweep,benchFloor,isUpperFace,isFrontRegion,bankSolidAt,bankPenetration,supportFrontWithBucket,BENCH_HEIGHT} from './world.js?build=hotfix-20261106-21';
import {BUCKET_TONNES,BUCKET_INNER_WIDTH,BUCKET_CUT_HALF_WIDTH,BUCKET_WORKING_WIDTH,MACHINE} from './material-volume.js?build=hotfix-20261106-21';
import {hardTruckSurface,truckLocal} from './truck-contact.js?build=hotfix-20261106-21';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const START={yaw:FACE_SHOVEL?Math.PI:0,boom:FACE_SHOVEL?.8:.76,stick:FACE_SHOVEL?-1.65:-1.95,curl:FACE_SHOVEL?1:BUCKET.workOpen,shovelDoor:0,payload:0,baseX:FACE_SHOVEL?3:0,baseZ:0,baseY:FACE_SHOVEL?-.11:BENCH_HEIGHT-.11,pitch:0,roll:0,driveSpeed:0,velocity:{yaw:0,boom:0,stick:0,curl:0}};
export function bucketSamples(s){const edge=BUCKET_INNER_WIDTH*.49;return offsets.flatMap(([x,y])=>[-edge,0,edge].map(z=>bucketWorldPoint(s,x,y-BUCKET.drop,z)))}
const offsets=[[-1.72,-.73],[-.65,-1.26],[.22,-1.32],[.78,-.94]].map(([x,y])=>[FACE_SHOVEL?-x:x,y]),initialFrame={},nextFrame={},sampleFrame={},point={},previousEdge={},currentEdge={},oldPoint={};
function contact(frame,workingY=BENCH_HEIGHT){const edge=BUCKET_INNER_WIDTH*.49;for(const [x,y] of offsets)for(const z of [-edge,0,edge]){framePoint(frame,x,y-BUCKET.drop,z,point);if(canDig(point.x,point.z)){if(isFrontRegion(point.x,point.z,workingY)){if(bankSolidAt(point.x,point.y,point.z,.015))return true;continue;}const h=ground(point.x,point.z);if(point.y<h+.3&&point.y>h-.9)return true}}return false;}
function frontalContact(frame,workingY){const edge=BUCKET_INNER_WIDTH*.49;for(const [x,y] of offsets)for(const z of [-edge,0,edge]){framePoint(frame,x,y-BUCKET.drop,z,point);if(isFrontRegion(point.x,point.z,workingY)&&bankSolidAt(point.x,point.y,point.z,.015))return true;}return false;}
const oldScore={count:0,depth:0},newScore={count:0,depth:0},floorScore={count:0,depth:0},fitFrame={},fitState={},heel={};
const toolBounds={minX:0,maxX:0,minY:0,maxY:0,minZ:0,maxZ:0};
function frontScore(frame,workingY,out){out.count=out.depth=0;const edge=BUCKET_INNER_WIDTH*.49;for(const [x,y]of offsets)for(const z of [-edge,0,edge]){framePoint(frame,x,y-BUCKET.drop,z,point);if(!isFrontRegion(point.x,point.z,workingY))continue;const depth=bankPenetration(point.x,point.y,point.z);if(depth>.02){out.count++;out.depth+=depth;}}return out;}
export function soilContact(s){const frame=bucketFrame(s,sampleFrame);return contact(frame,(s.baseY??START.baseY)+.11)}
export function truckHeight(x,z,truck){if(!truck)return -Infinity;const hard=hardTruckSurface(truck,x,z).height,p=truckLocal(truck,x,z),root=truck.root?.position.y||0;if(bodyContains(p.x,p.z))return Math.max(hard,root+(truck.load?truck.load.surface(truck,x,z):BED.floor+(truck.tonnes||0)/100*.7));return hard;}
export function stepRig(s,left,right,dt,truck){bucketFrame(s,initialFrame);const workingY=(s.baseY??START.baseY)+.11,front=frontalContact(initialFrame,workingY),engaged=(contact(initialFrame,workingY)||(s.cutContact||0)>0)&&!front,load=s.payload,pressure=clamp(s.digPressure||0,0,1),resistance=front?clamp(1/(1+.35+pressure*.35*levelConfig(levelState().number).hardness/MACHINE.digForce+load*.10),.35,.87):1;const v={...s.velocity},factor=engaged?.82:(1-load*.2)*resistance;const targets={yaw:-left.x*.55*(1-load*.18),boom:right.y*.42*(engaged?.7:resistance),stick:-left.y*.58*factor,curl:(FACE_SHOVEL?0:right.x)*(right.x<0?1.14:.95)*(engaged&&load<.95?.65:(1-load*.2)*resistance)};const demand=Math.abs(left.x)+Math.abs(left.y)+Math.abs(right.y)+(FACE_SHOVEL?0:Math.abs(right.x));const hydraulicFlow=1/Math.max(1,1+(demand-1)*.24);for(const k of Object.keys(v)){const desire=targets[k]*(MACHINE.hydraulics[k]/({yaw:.55,boom:.42,stick:.58,curl:1.02}[k]))*hydraulicFlow;v[k]+=(desire-v[k])*(1-Math.exp(-dt/(k==='yaw'?MACHINE.slewInertia*(1+load*.35):Math.abs(desire)>.01?MACHINE.response:.10)));if(Math.abs(v[k])<.0001)v[k]=0}
 const next={...s,shovelDoor:FACE_SHOVEL?clamp((s.shovelDoor||0)+right.x*dt*1.15,0,1):0,velocity:v,yaw:s.yaw+v.yaw*dt,cutContact:Math.max(0,(s.cutContact||0)-dt),boom:clamp(s.boom+v.boom*dt,-.13,1.23),stick:clamp(s.stick+v.stick*dt,-2.68,FACE_SHOVEL?.15:-.32),curl:clamp(s.curl+v.curl*dt,BUCKET.closed,BUCKET.open)};
 if(FACE_SHOVEL){next.curl=.15-next.boom-next.stick;v.curl=-v.boom-v.stick;}
 for(const [key,min,max] of [['boom',-.13,1.23],['stick',-2.68,FACE_SHOVEL?.15:-.32],['curl',FACE_SHOVEL?-3:BUCKET.closed,FACE_SHOVEL?3:BUCKET.open]])if(next[key]===min&&v[key]<0||next[key]===max&&v[key]>0)v[key]=0;
 // Slewing is a lateral sweep, never a cutting stroke. Stop it at the face
 // even when stick/curl are commanded simultaneously, keeping those axes live.
 bucketFrame(next,nextFrame);let swingBlocked=false,entryBlocked=false;
 if(Math.abs(next.yaw-s.yaw)>1e-9&&(front||frontalContact(nextFrame,workingY))){next.yaw=s.yaw;v.yaw=0;swingBlocked=true;bucketFrame(next,nextFrame);}
 const previous=framePoint(initialFrame,BUCKET.teeth.x,BUCKET.teeth.y,0,previousEdge),current=framePoint(nextFrame,BUCKET.teeth.x,BUCKET.teeth.y,0,currentEdge);
 let rake=(previous.x-current.x)*Math.cos(next.yaw)-(previous.z-current.z)*Math.sin(next.yaw),stroke=Math.hypot(current.x-previous.x,current.z-previous.z,current.y-previous.y);
 if(FACE_SHOVEL)rake=-rake;
 const aperture=FACE_SHOVEL?1-(next.shovelDoor||0):opening(next.curl),upper=front||frontalContact(nextFrame,workingY)||isFrontRegion(current.x,current.z,workingY)||isFrontRegion(previous.x,previous.z,workingY);
 framePoint(nextFrame,FACE_SHOVEL?-.78:.78,-.94-BUCKET.drop,0,heel);const leading=(current.x-heel.x)*(current.x-previous.x)+(current.y-heel.y)*(current.y-previous.y)+(current.z-heel.z)*(current.z-previous.z);
 const commanded=Math.abs(left.y)+Math.abs(right.x)+Math.abs(right.y)>.03,draw=(FACE_SHOVEL?v.stick>.001||v.boom>.001:v.curl<-.001||v.stick<-.001)&&rake>1e-7,entryStroke=upper&&leading>0&&aperture>.4;
 const full=upper&&next.payload>.995,cutting=(next.payload<1||upper)&&aperture>.08&&(upper?commanded&&(draw||entryStroke||stroke>1e-5&&aperture>.25)&&stroke>1e-7:(FACE_SHOVEL?v.stick>.001||v.boom>.001:v.curl<-.001||v.stick<-.001));
 let work=0,entry=null,impact=swingBlocked||entryBlocked?.04:0,truckHit=null,graded=0,gradePoint=null,clearance=0;
 if(cutting){
  const surfaceBefore=ground(current.x,current.z);
  if(stroke>1e-7&&(upper||rake>1e-6)&&current.y<surfaceBefore+.12){
   const angle=next.boom+next.stick+next.curl,attack=upper?clamp((Math.sin(angle)+.35)/1.35,.12,1):1,budget=full?dt*2:Math.min((1-next.payload)*BUCKET_TONNES,BUCKET_TONNES*dt*.58*MACHINE.digForce/levelConfig(levelState().number).hardness*Math.max(.45,attack)),deflect=upper?clamp((surfaceBefore-current.y)*.25,.12,.20):clamp((surfaceBefore-current.y-.025)*.30,.05,.18);
   let high=current.y+.3;for(const [x,y]of offsets){framePoint(nextFrame,x,y-BUCKET.drop,0,point);high=Math.max(high,point.y+.08);}const bite=clamp(high-current.y,.28,1.7);
   const removed=upper?excavateFront(previous,current,next.yaw,BUCKET_CUT_HALF_WIDTH*2,bite,budget,deflect,workingY,(1-next.payload)*BUCKET_TONNES):excavateSweep(previous,current,next.yaw,BUCKET_WORKING_WIDTH,budget,deflect);takeRock(removed.bankMass);
   if(full)clearance=removed.windrow||0;
   if(removed.mass>0){work=removed.mass/BUCKET_TONNES;next.payload=Math.min(1,next.payload+work);next.cutContact=upper?0:.25;entry={from:{...previous},to:{...current},surface:ground(current.x,current.z),surfaceBefore};}
  }
 }
 // Fit the equipment to the void actually cut this step. A contact-limited
 // hydraulic stroke keeps abrading only its tooth band; it cannot noclip the
 // bowl through intact rock just because the operator is holding "draw".
 let relief=0;if(commanded&&(right.y>.05||draw)){let budget=Math.max(0,dt*3.5-clearance);for(const [x,y]of offsets)for(const z of [-BUCKET_INNER_WIDTH*.49,0,BUCKET_INNER_WIDTH*.49]){if(budget<=1e-8)continue;framePoint(nextFrame,x,y-BUCKET.drop,z,point);if(!isFrontRegion(point.x,point.z,workingY))continue;const depth=bankPenetration(point.x,point.y,point.z);if(depth>.015){const displaced=relieveFrontContact(point,next.yaw,budget,workingY);relief+=displaced;budget-=displaced;}}if(relief>0)takeRock(relief);}relief+=clearance;
 frontScore(initialFrame,workingY,oldScore);frontScore(nextFrame,workingY,newScore);let accepted=1;
 const fits=score=>score.count===0||oldScore.count>0&&score.depth<=oldScore.depth+1e-7&&score.count<=oldScore.count;
 if(!fits(newScore)){
  Object.assign(fitState,next);for(const k of ['boom','stick','curl'])fitState[k]=s[k];let requested=0,travelled=0;entryBlocked=true;
  // Resolve actuators separately: lowering against the heel must not also
  // freeze a safe curl/draw. Full coupled strokes are accepted above first.
  for(const k of ['curl','stick','boom']){const delta=next[k]-s[k];requested+=Math.abs(delta);let lo=0,hi=1;fitState[k]=next[k];bucketFrame(fitState,fitFrame);if(fits(frontScore(fitFrame,workingY,newScore)))lo=1;else for(let i=0;i<7;i++){const t=(lo+hi)/2;fitState[k]=s[k]+delta*t;bucketFrame(fitState,fitFrame);if(fits(frontScore(fitFrame,workingY,newScore)))lo=t;else hi=t;}fitState[k]=s[k]+delta*lo;next[k]=fitState[k];v[k]*=lo;travelled+=Math.abs(delta)*lo;}
  accepted=requested>1e-10?travelled/requested:1;bucketFrame(next,nextFrame);impact=Math.max(impact,.04*(1-accepted));
 }
 const contactLoad=clamp(oldScore.depth/(Math.max(1,oldScore.count)*.08),0,1),effort=commanded&&upper?Math.max(front?.25:0,contactLoad*.65,entryBlocked?1-accepted:work>0?.55:0):0;next.digPressure=pressure+(effort-pressure)*(1-Math.exp(-dt/.14));
 // Fully curled shell, stick initially tucked: an outward shallow pass grades
 // the surface. Ordinary opening/curling/slewing and air movement cannot grade.
 if(!FACE_SHOVEL&&next.curl<BUCKET.closed+.14&&next.stick< -.70&&(Math.abs(v.stick)+Math.abs(v.boom))>.001&&Math.abs(v.yaw)<.025){
  let gx=0,gy=0,lowest=Infinity;for(const [x,y] of offsets){framePoint(nextFrame,x,y-BUCKET.drop,0,point);if(point.y<lowest){lowest=point.y;gx=x;gy=y-BUCKET.drop;}}
  const a=framePoint(initialFrame,gx,gy,0,previousEdge),b=framePoint(nextFrame,gx,gy,0,currentEdge),moved=gradeBucketSweep(a,b,next.yaw,BUCKET_WORKING_WIDTH,dt*3.5*MACHINE.digForce);graded=moved.mass;if(graded>0)gradePoint={...b};if(moved.bankMass>0)takeRock(moved.bankMass);
 }
 // The directional guard above governs the upper bank. The bowl may stay in
 // its cut; lower-bench, bedrock and truck collision response remain solid.
 for(let pass=0;pass<3;pass++){
  bucketFrame(next,nextFrame);let penetration=0;const edge=BUCKET_INNER_WIDTH*.49;
  for(const [x,y] of offsets)for(const z of [-edge,0,edge]){framePoint(nextFrame,x,y-BUCKET.drop,z,point);const allowance=canDig(point.x,point.z)?(cutting?(x< -1.3?.55:.32):.32):0,terrain=isFrontRegion(point.x,point.z,workingY)?benchFloor(point.x,point.z):ground(point.x,point.z)-allowance;const truckSurface=truckHeight(point.x,point.z,truck);
   if(pass===0&&truckSurface>terrain&&point.y<truckSurface+.025){framePoint(initialFrame,x,y-BUCKET.drop,z,oldPoint);const speed=Math.max(0,(oldPoint.y-point.y)/dt)+Math.hypot(point.x-oldPoint.x,point.z-oldPoint.z)/dt*.18;if(!truckHit||speed>truckHit.speed)truckHit={x:point.x,z:point.z,speed};}
   penetration=Math.max(penetration,Math.max(terrain,truckSurface)+.025-point.y);}
  if(penetration<=.015)break;impact=Math.max(impact,penetration);const reach=Math.abs((nextFrame.ox-(next.baseX||0))*Math.cos(next.yaw)-(nextFrame.oz-(next.baseZ||0))*Math.sin(next.yaw)),beforeBoom=next.boom;frontScore(nextFrame,workingY,floorScore);const desiredBoom=clamp(beforeBoom+penetration/Math.max(3,reach),-.13,1.23);next.boom=desiredBoom;bucketFrame(next,nextFrame);frontScore(nextFrame,workingY,newScore);
  // A lower loose windrow cannot kick the bowl through the upper roof after
  // the volumetric collision solver already accepted a safe stroke.
  if(newScore.count>floorScore.count||newScore.depth>floorScore.depth+1e-7){let lo=0,hi=1;for(let i=0;i<8;i++){const t=(lo+hi)/2;next.boom=beforeBoom+(desiredBoom-beforeBoom)*t;bucketFrame(next,nextFrame);frontScore(nextFrame,workingY,newScore);if(newScore.count<=floorScore.count&&newScore.depth<=floorScore.depth+1e-7)lo=t;else hi=t;}next.boom=beforeBoom+(desiredBoom-beforeBoom)*lo;v.boom=0;break;}
  v.boom=Math.max(0,v.boom);if(penetration>.15){next.yaw=s.yaw;v.yaw=0;}
 }
 const inside=soilContact(next)||work>0;
 bucketFrame(next,nextFrame);toolBounds.minX=toolBounds.minY=toolBounds.minZ=Infinity;toolBounds.maxX=toolBounds.maxY=toolBounds.maxZ=-Infinity;for(const [x,y]of offsets)for(const z of [-BUCKET_INNER_WIDTH*.51,BUCKET_INNER_WIDTH*.51]){framePoint(nextFrame,x,y-BUCKET.drop,z,point);toolBounds.minX=Math.min(toolBounds.minX,point.x);toolBounds.maxX=Math.max(toolBounds.maxX,point.x);toolBounds.minY=Math.min(toolBounds.minY,point.y);toolBounds.maxY=Math.max(toolBounds.maxY,point.y);toolBounds.minZ=Math.min(toolBounds.minZ,point.z);toolBounds.maxZ=Math.max(toolBounds.maxZ,point.z);}toolBounds.minX-=.14;toolBounds.maxX+=.14;toolBounds.minZ-=.14;toolBounds.maxZ+=.14;toolBounds.minY-=.025;toolBounds.maxY+=.025;supportFrontWithBucket(toolBounds);

 return {state:next,contact:inside,digging:inside&&(work>1e-5||relief>0),work,impact,entry,truckHit,graded,gradePoint,swingBlocked,entryBlocked,pressure:next.digPressure,accepted,relief};
}
