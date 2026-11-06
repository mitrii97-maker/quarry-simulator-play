import {cabGlass,cabPane} from './cab-glazing.js?build=traffic-20261106-25';
import * as T from '../three.module.js?build=traffic-20261106-25';
import {V,add,block,pin,rod,hose} from './geometry.js?build=traffic-20261106-25';
import {roundedBlock,roundedPlate} from './sculpted.js?build=traffic-20261106-25';
import {lettering} from './volvo-style.js?build=traffic-20261106-25';
import {BUCKET} from './bucket-config.js?build=traffic-20261106-25';
import {BUCKET_INNER_WIDTH} from './material-volume.js?build=traffic-20261106-25';
import {batchMeshes} from '../batching.js?build=traffic-20261106-25';

export function miningHouse(house,M,machine){
 const shovel=machine.kind==='face-shovel',hitachi=machine.id==='hitachi';
 const width=shovel?3.62:3.24;
 roundedBlock(house,M.dark,[5.15,.35,width],[-.81,.04,0],.12);
 if(hitachi){
  // EX1200's deep orange counterweight and broad engine hood.
  roundedBlock(house,M.paint,[2.74,1.38,3.08],[-1.96,.78,0],.3);
  roundedBlock(house,M.paint,[1.6,.80,3.06],[-.05,.48,0],.09);
  roundedBlock(house,M.dark,[2.3,.20,2.9],[-1.98,1.49,0],.07);
 }else if(shovel){
  // R9200's tall rectangular power module and full-width service deck.
  roundedBlock(house,M.paint,[3.42,1.75,3.33],[-1.65,.94,0],.11);
  roundedBlock(house,M.dark,[3.68,.23,3.55],[-1.65,.25,0],.07);
  roundedBlock(house,M.paint,[1.58,.98,3.3],[.7,.66,0],.08);
  for(const z of [-1.12,1.12]){
   add(house,new T.CylinderGeometry(.19,.19,.48,16),M.dark,-2.43,2.08,z);
   add(house,new T.CylinderGeometry(.24,.24,.09,16),M.dark,-2.43,2.36,z);
  }
 }else{
  // PC1200-class profile: stepped rectangular radiator pack and raised cab.
  roundedBlock(house,M.paint,[3.05,1.25,3.13],[-1.77,.73,0],.13);
  roundedBlock(house,M.paint,[1.5,1.02,2.85],[.27,.63,0],.08);
  roundedBlock(house,M.dark,[1.75,.4,2.78],[-1.85,1.5,0],.06);
 }
 const brand=hitachi?'HITACHI':shovel?'LIEBHERR':'KOMATSU';
 for(const side of [-1,1]){
  const z=side*(width/2+.015);
  const radiatorX=shovel?-2.15:-1.95, radiatorY=shovel?1.12:.83;
  block(house,M.dark,[1.56,shovel?1.02:.70,.035],[radiatorX,radiatorY,z],.025);
  for(let i=0;i<13;i++)block(house,M.steel,[.035,shovel?.91:.6,.022],[radiatorX-.67+i*.112,radiatorY,z+side*.026],.003);
  const badge=lettering(house,brand,{x:-.34,y:shovel?1.38:1.16,z:z+side*.018,width:1.24,height:.24,font:'900 150px Arial',side,color:shovel?'#313637':hitachi?'#f8efe2':'#19364e'});
  lettering(house,hitachi?'EX1200':shovel?'R 9200':'PC1200',{x:-.18,y:shovel?.84:.68,z:z+side*.023,width:.95,height:.22,font:'900 150px Arial',side,color:shovel?'#343738':'#f4ecdb'});
  const deck=shovel?1.88:1.55;
  block(house,M.dark,[4.85,.09,.39],[-.75,deck,z+side*.07],.02);
  // The left cab occupies x=-.64..1.34: terminate its deck rail behind it.
  const end=side<0?-1.05:1.26;
  for(const x of [-2.9,-1.9,end])rod(house,M.warning,V(x,deck,z),V(x,deck+.67,z),.027);
  rod(house,M.warning,V(-2.9,deck+.67,z),V(end,deck+.67,z),.027);
  rod(house,M.warning,V(-2.9,deck+.32,z),V(end,deck+.32,z),.023);
 }
 const accessZ=-2.52;
 for(let i=0;i<6;i++)block(house,M.steel,[.54,.065,.27],[-1.03,-.22+i*.29,accessZ],.012);
 for(const x of [-1.34,-.72])rod(house,M.warning,V(x,-.17,accessZ-.05),V(x,1.65,accessZ-.05),.03);
 const exhaust=shovel?1.92:1.5;
 rod(house,M.dark,V(-1.2,exhaust,.62),V(-1.2,exhaust+.54,.62),.09);
 add(house,new T.CylinderGeometry(.14,.14,.08,16),M.dark,-1.2,exhaust+.58,.62);
}

export function miningCab(cab,M,machine){
 M={...M,glass:cabGlass(M.glass)};
 const shovel=machine.kind==='face-shovel',hitachi=machine.id==='hitachi';
 const roof=shovel?2.14:hitachi?1.84:2.0;
 cab.name=shovel?'Liebherr elevated panoramic cab':hitachi?'Hitachi sloped EX cab':'Komatsu wide protective cab';
 if(!hitachi&&!shovel){
 for(const z of [-.79,.79])for(const x of [-.87,.82])rod(cab,M.dark,V(x,.40,z),V(x,2.04,z),.06);
 for(let i=0;i<2;i++)rod(cab,M.dark,V(.87,.52+i*.14,-.77),V(.87,.52+i*.14,.77),.018);
 }
 if(shovel)for(const z of [-.78,.78])rod(cab,M.steel,V(-.8,1.88,z),V(.85,1.88,z),.025);
 roundedBlock(cab,M.dark,[1.85,.28,1.73],[0,.01,0],.06);
 for(const side of [-1,1]){
  const z=side*.77;
  roundedPlate(cab,M.paint,[[-.88,.11],[.89,.11],[.89,.48],[-.88,.48]],.08,z,{corner:.05,bevel:.01});
  cabPane(cab,M.glass,[[-.77,.5],[.72,.5],[hitachi?.57:.72,roof-.15],[-.77,roof-.15]],z);
  for(const x of [-.84,.04,.8])rod(cab,M.dark,V(x,.45,z),V(x,roof-.08,z),.035);
  rod(cab,M.dark,V(-.84,roof-.08,z),V(.8,roof-.08,z),.04);
  block(cab,M.dark,[.19,.035,.04],[-.45,.57,z+side*.035],.005);
 }
 const front=add(cab,new T.PlaneGeometry(1.39,roof-.56),M.glass,.81,(roof+.46)/2,0);
 front.rotation.y=Math.PI/2;front.castShadow=false;
 const back=add(cab,new T.PlaneGeometry(1.39,roof-.56),M.glass,-.85,(roof+.46)/2,0);
 back.rotation.y=-Math.PI/2;back.castShadow=false;
 roundedBlock(cab,M.paint,[1.98,.17,1.87],[-.02,roof,0],.06);
 block(cab,M.dark,[1.98,.06,.23],[.04,roof-.07,0],.02).rotation.y=Math.PI/2;
 for(const z of [-.61,.61]){
  block(cab,M.dark,[.2,.17,.27],[.87,roof-.1,z],.025);
  block(cab,M.lamp,[.025,.11,.20],[.985,roof-.1,z],.01);
 }
 rod(cab,M.dark,V(.65,1.55,-.8),V(1.0,1.6,-1.19),.025);
 block(cab,M.dark,[.19,.32,.09],[1.0,1.52,-1.19],.025);
 block(cab,M.chrome,[.15,.27,.015],[1.0,1.52,-1.24],.015);
 block(cab,M.snow,[1.85,.045,1.78],[-.02,roof+.11,0],.05);
}

export function miningArm(shoulder,stick,M,machine){
 const shovel=machine.kind==='face-shovel';
 const boomProfile=shovel?[[0,-.38],[2.1,-.19],[4.45,-.27],[5.88,-.30],[5.98,.23],[4.48,.52],[2.10,1.0],[.15,.55]]:
 [[0,-.42],[1.3,-.25],[2.55,.02],[4.5,-.13],[5.86,-.24],[5.94,.25],[4.43,.57],[2.43,1.17],[1.05,.93],[.13,.43]];
 if(shovel){
  for(const z of [-.35,.35])roundedPlate(shoulder,M.paint,boomProfile,.27,z,{corner:.13,bevel:.04});
  for(const x of [1,2.8,4.8])block(shoulder,M.paint,[.35,.36,.93],[x,.16,0],.04);
 }else roundedPlate(shoulder,M.paint,boomProfile,.86,0,{corner:.18,bevel:.05});
 roundedPlate(stick,M.paint,[[-1.12,-.28],[-1.2,.32],[-.83,.69],[0,.46],[1.45,.41],[4.42,.27],[4.45,-.25],[1.35,-.4],[0,-.43]],shovel?.76:.61,0,{corner:.12,bevel:.04});
 const brand=machine.id==='hitachi'?'HITACHI':shovel?'LIEBHERR':'KOMATSU';
 for(const side of [-1,1]){
  lettering(shoulder,brand,{x:3.15,y:.4,z:side*(shovel?.51:.46),width:1.72,height:.34,font:'900 170px Arial',side,color:machine.id==='hitachi'?'#f8f0e1':'#27333c'});
  for(let i=0;i<3;i++)hose(shoulder,M.black,[V(.5,.55,side*(.37+i*.05)),V(2.2,1.17,side*(.37+i*.05)),V(3.4,.92,side*(.37+i*.05)),V(5.3,.5,side*(.37+i*.05))],.018);
  for(const x of [1.8,3.0,4.3])block(shoulder,M.steel,[.08,.07,.22],[x,x<2?1.1:x<4?.95:.66,side*.43],.008);
 }
 pin(stick,M.steel,-.72,.27,0,.17,1.02);
}

export function makeFaceShovel(bucket,M){
 const body=new T.Group(),teeth=new T.Group(),mounts=new T.Group(),door=new T.Group();
 body.name='R9200 forward-loading shovel frame';door.name='Hydraulic bottom dumping door';
 bucket.add(body,mounts,door);door.add(teeth);
 const steel=M.bucket.clone();steel.color.set('#6b6d68');steel.roughness=.67;
 const edge=M.steel.clone();edge.color.set('#adb0a3');edge.roughness=.42;
 const drop=BUCKET.drop,width=BUCKET_INNER_WIDTH;
 const profile=[[-.48,.12],[-.86,-.3],[-.84,-1.20],[-.25,-1.32],[-.12,-1.15],[-.12,-.08]].map(([x,y])=>[x,y-drop]);
 for(const side of [-1,1]){
  roundedPlate(body,steel,profile,.13,side*(width/2+.05),{corner:.10,bevel:.016});
  roundedPlate(body,M.dark,[[-.73,-.32],[-.72,-1.0],[-.18,-1.15],[-.12,-1.0],[-.12,-.72],[-.12,-.25]].map(([x,y])=>[x,y-drop]),.025,side*(width/2+.128),{corner:.06,bevel:.004});
  rod(body,edge,V(-.40,.11-drop,side*(width/2+.13)),V(-.12,-.71-drop,side*(width/2+.13)),.035);
 }
 block(body,steel,[.14,1.20,width],[-.78,-.56-drop,0],.05);
 block(body,steel,[.85,.14,width],[-.31,.04-drop,0],.03);
 // The floor and lip rotate together, leaving a real aperture below the load.
 door.position.set(-.78,.02-drop,0);
 const jaw=new T.Group();door.add(jaw);jaw.position.y=-1.27;
 for(const side of [-1,1])roundedPlate(jaw,steel,[[.2,.05],[1.44,.3],[2.06,.53],[2.06,1.0],[1.45,1.48],[.52,1.36]],.13,side*(width/2+.05),{corner:.08,bevel:.015});
 roundedPlate(jaw,steel,[[0,0],[2.06,.53],[2.13,.43],[0,-.12]],width,0,{corner:.025,bevel:.01});
 teeth.position.y=-1.27;
 const tips=[];
 for(let i=0;i<5;i++){
  const z=-.7+i*.35;
  roundedPlate(teeth,edge,[[1.97,.5],[2.6,.5],[2.6,.46],[2.07,.35]],.19,z,{corner:.01,bevel:.008});
  const tip=new T.Object3D();tip.name='Forward cutting tooth '+(i+1);tip.userData.bucketTooth=true;tip.position.set(2.6,.5,z);teeth.add(tip);tips.push(V(1.82,-.75-drop,z));
  pin(teeth,M.dark,2.13,.48,z,.035,.24);
 }
 for(const z of [-.43,.43]){
  roundedPlate(mounts,M.paint,[[-.25,.28],[.22,.37],[.52,-.2],[.42,-.53],[-.3,-.51]],.15,z,{corner:.06,bevel:.015});
  pin(mounts,edge,0,0,z,.21,.20);
  pin(body,edge,-.78,.02-drop,z,.12,.2);
 }
 const actuators=[];
 // Twin visible door cylinders follow the door, outside both cheek plates.
 for(const side of [-1,1]){
  const anchor=V(-.43,-.25-drop,side*(width/2+.23));
  const cylinder=rod(body,M.paint,anchor,V(.18,-.61-drop,anchor.z),.095);
  const piston=rod(bucket,M.chrome,V(),V(1,0,0),.055);piston.userData.dynamic=true;
  actuators.push({anchor,cylinder,piston,side});
 }
 function update(open){
  door.rotation.z=T.MathUtils.clamp(open||0,0,1)*1.22;
  for(const {anchor,piston,side} of actuators){
   const end=V(1.45,-.91,side*(width/2+.23)).applyAxisAngle(V(0,0,1),door.rotation.z).add(door.position);
   const start=anchor.clone().lerp(end,.4),delta=end.sub(start);
   piston.position.copy(start).addScaledVector(delta,.5);piston.scale.y=delta.length();piston.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());
  }
 }
 update(0);
 for(const group of [body,mounts,door,teeth])batchMeshes(group);
 return {body,teeth,mounts,door,profile,tipCenters:tips,mainPin:V(),linkPin:V(.32,.3,0),update};
}
