import {batchMeshes} from '../batching.js?build=volvo-review-v2';
import * as T from '../three.module.js?build=volvo-review-v2';
import {V,add,rod,pin} from './geometry.js?build=volvo-review-v2';
import {roundedBlock,roundedPlate} from './sculpted.js?build=volvo-review-v2';

// EC700CL reference silhouette. Attachment/pin coordinates retain the game's
// established FK; this module owns presentation, never digging or capacity.
export const VOLVO_REFERENCE=Object.freeze({model:'EC700CL',cabBase:.04,trackCentre:1.73,trackWidth:.75,upperWidth:3.42,rear:-4.42});
const rearPlan=[[-4.40,-1.18],[-4.27,-1.53],[-3.95,-1.70],[-3.04,-1.70],[-3.04,1.70],[-3.95,1.70],[-4.27,1.53],[-4.40,1.18]];
function deck(parent,material,points,height,y){const o=roundedPlate(parent,material,points,height,0,{corner:.14,bevel:.025});o.rotation.x=Math.PI/2;o.position.y=y;return o;}
export function referenceVolvoBody(house,M,letter){
 const group=new T.Group();group.name='EC700CL yellow engine and service enclosure';house.add(group);
 const outline=[[-3.08,-1.67],[.98,-1.67],[1.42,-1.27],[1.42,1.27],[.98,1.67],[-3.08,1.67]];
 deck(group,M.boom,outline,.22,.04);
 roundedBlock(group,M.paint,[2.40,1.27,3.34],[-1.88,.75,0],.09);
 roundedBlock(group,M.paint,[1.85,1.02,1.45],[.23,.64,.87],.07);
 roundedBlock(group,M.paint,[2.00,.34,2.76],[-2.12,1.43,.08],.08);
 roundedBlock(group,M.boom,[2.45,.065,1.57],[-1.13,1.40,.15],.02);
 for(const side of [-1,1]){
  const z=side*1.705;
  roundedPlate(group,M.boom,[[-4.20,.13],[-4.20,1.20],[-3.88,1.27],[-3.38,1.10],[-2.95,.89],[-2.43,.70],[-1.72,.57],[-1.72,.13]],.024,z,{corner:.065,bevel:.004});
  letter(group,'EC700CL',{x:-3.64,y:.37,z:z+side*.021,width:.67,height:.18,font:'700 160px Arial',side,name:'EC700CL side model badge'});
  // Separate doors and narrow ventilation slots follow the drawing's long hood.
  for(const x of [-2.84,-1.43])rod(group,M.boom,V(x,.68,z+side*.012),V(x,1.45,z+side*.012),.008);
  for(let bank=0;bank<2;bank++)for(let i=0;i<5;i++)roundedBlock(group,M.black,[.030,.16,.014],[-2.71+bank*.78+i*.085,1.30,z+side*.013],.004);
  rod(group,M.steel,V(-1.51,.85,z+side*.027),V(-1.39,.85,z+side*.027),.012);
  for(const x of [-2.88,-1.47])for(const y of [.76,1.38])pin(group,M.steel,x,y,z+side*.027,.018,.015);
 }
 // Access steps behind the cab, not across its glazing.
 for(let i=0;i<4;i++){const y=.20+i*.28;roundedBlock(group,M.boom,[.43,.055,.18],[-.91,y,-1.76],.012);for(let j=0;j<5;j++)roundedBlock(group,M.steel,[.035,.008,.12],[-1.07+j*.075,y+.031,-1.76],.002);}
 for(const x of [-1.18,-.66])rod(group,M.paint,V(x,.17,-1.79),V(x,1.70,-1.79),.022);
 rod(group,M.paint,V(-1.18,1.70,-1.79),V(-1.18,2.06,-1.79),.022);rod(group,M.paint,V(-1.18,2.06,-1.79),V(-.79,2.06,-1.79),.022);rod(group,M.paint,V(-.79,2.06,-1.79),V(-.79,1.68,-1.79),.022);
 for(const x of [-2.35,-1.35]){rod(group,M.paint,V(x,1.55,1.20),V(x,2.07,1.20),.025);rod(group,M.paint,V(x,2.07,1.20),V(x+.40,2.07,1.20),.025);rod(group,M.paint,V(x+.40,2.07,1.20),V(x+.40,1.55,1.20),.025);}
 add(group,new T.CylinderGeometry(.070,.070,.48,12),M.boom,-2.10,1.83,.47);const cap=add(group,new T.CylinderGeometry(.10,.10,.045,12),M.boom,-2.10,2.075,.47);cap.rotation.z=.08;
 add(group,new T.CylinderGeometry(.054,.054,.48,12),M.boom,-1.43,1.83,-.12);add(group,new T.CylinderGeometry(.105,.105,.05,12),M.steel,-1.43,2.08,-.12);
 letter(group,'VOLVO',{x:-1.02,y:.66,z:-1.726,width:.63,height:.16,font:'900 170px Georgia',side:-1,name:'Service panel Volvo badge'});
 batchMeshes(group);return group;
}
export function referenceVolvoCounterweight(house,M,letter){
 const group=new T.Group();group.name='EC700CL continuous curved graphite counterweight';house.add(group);
 deck(group,M.boom,rearPlan,1.27,.72);deck(group,M.paint,rearPlan,.13,1.39);
 deck(group,M.dark,rearPlan.map(([x,z])=>[x-.025,z*1.012]),.18,.11);
 const name=letter(group,'VOLVO',{x:-4.445,y:.76,z:0,width:1.60,height:.33,font:'900 180px Georgia',name:'Rear Volvo name'});name.rotation.y=-Math.PI/2;
 const red=new T.MeshStandardMaterial({color:'#a82728',roughness:.42,metalness:.08,emissive:'#591213',emissiveIntensity:.28});
 for(const side of [-1,1]){const lens=roundedPlate(group,red,[[-.08,-.22],[.07,-.20],[.11,.20],[-.07,.23]],.025,0,{corner:.025,bevel:.005});lens.rotation.y=-Math.PI/2;lens.position.set(-4.43,.78,side*1.19);}
 rod(group,M.boom,V(-4.44,.23,-.8),V(-4.44,.23,.8),.023);batchMeshes(group);return group;
}
export function referenceVolvoArm(shoulder,stick,M){
 const boom=roundedPlate(shoulder,M.boom,[[0,-.29],[.65,.02],[1.63,.62],[2.31,.82],[3.77,.32],[5.78,-.24],[5.97,-.09],[5.91,.19],[4.16,.77],[2.48,1.48],[1.83,1.55],[.77,.91],[.12,.43]],.76,0,{corner:.14,bevel:.036});boom.name='EC700CL arched tapered fabricated boom';
 const arm=roundedPlate(stick,M.boom,[[-1.15,-.08],[-1.22,.22],[-.99,.58],[-.61,.69],[.18,.51],[1.70,.40],[3.93,.22],[4.48,.12],[4.49,-.15],[2.15,-.26],[.13,-.46],[-.68,-.34]],.48,0,{corner:.10,bevel:.025});arm.name='EC700CL tapered dipper with rear cylinder clevis';
 pin(stick,M.steel,-.72,.27,0,.14,.85);
 for(const side of [-1,1]){const z=side*.397;rod(shoulder,M.boom,V(.38,.04,z),V(1.78,1.02,z),.012);rod(shoulder,M.boom,V(2.65,1.26,z),V(5.46,.22,z),.012);}
 return {boom,arm};
}
