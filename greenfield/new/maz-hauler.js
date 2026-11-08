import * as T from '../three.module.js';
import {add,block,pin,rod,V} from './geometry.js';
import {roundedBlock,roundedPlate} from './sculpted.js';
import {HAULER_BODY as B,HAULER_WHEELS as W,bodyRear,bodyFront,bodyTopRear,bodyTopFront} from './hauler-body-config.js';
import {makeTruckHoist} from './truck-hoist.js';

function panel(root,material,points,name){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const mesh=add(root,g,material);mesh.name=name;return mesh;}
function wheel(root,M,x,z,rear){const steer=new T.Group(),roll=new T.Group();steer.position.set(x,W.y,z);steer.add(roll);root.add(steer);const tyre=add(roll,new T.CylinderGeometry(W.radius,W.radius,.36,26),M.tire);tyre.rotation.x=Math.PI/2;pin(roll,M.paint,0,0,Math.sign(z)*.20,.28,.05);for(let i=0;i<18;i++){const a=i*Math.PI/9,t=block(roll,M.tread,[.13,.07,.40],[Math.sin(a)*W.radius,Math.cos(a)*W.radius,0],.015);t.rotation.z=-a;}return {steer,roll,front:!rear,radius:W.radius,baseY:W.y};}
function makeBed(root,M){
 const half=B.depth/2,wide=B.topDepth/2;
 block(root,M.paint,[B.width,B.floorThickness,B.depth],[B.centerX,B.floor,0],.02);
 for(const side of [-1,1]){
  const q=[[bodyRear,B.floor,side*half],[bodyFront,B.floor,side*half],[bodyTopFront,B.frontRim,side*wide],[bodyTopRear,B.rim,side*wide]];panel(root,M.paint,side>0?[...q].reverse():q,'MAZ steel dump side');
  for(const u of [.18,.43,.68,.90]){const x=bodyRear+B.width*u,y=B.floor+(B.rim-B.floor)*(.42+.25*u);rod(root,M.paint,V(x,B.floor,side*(half+.04)),V(x,y,side*(wide+.04)),.055);}
  rod(root,M.paint,V(bodyTopRear,B.rim,side*wide),V(bodyTopFront,B.frontRim,side*wide),.075);
 }
 const front=[[bodyFront,B.floor,-half],[bodyFront,B.floor,half],[bodyTopFront,B.frontRim,wide],[bodyTopFront,B.frontRim,-wide]];panel(root,M.paint,front,'MAZ reinforced headboard');
 rod(root,M.dark,V(bodyRear,B.floor,-half),V(bodyRear,B.floor,half),.07);
 return new T.Group();
}

export function makeMazHauler(root,source,index){
 const M={...source};M.paint=source.paint.clone();M.paint.color.set(index%2?'#4d8550':'#587c48');M.paint.roughness=.62;M.bodyDark=source.dark;M.tire=source.rubber;M.tread=source.track;
 root.name=`МАЗ-5516 № ${index+1}`;
 roundedBlock(root,M.bodyDark,[4.55,.35,1.75],[.03,.78,0],.13);
 for(const x of [W.rearX,W.frontX])pin(root,M.dark,x,W.y,0,.14,2.12);
 // Forward cab with separate glazing, grille, bumper, mirrors and access steps.
 const cab=new T.Group();cab.position.set(1.72,1.08,0);root.add(cab);
 roundedBlock(cab,M.paint,[1.45,1.65,1.95],[0,.52,0],.18);
 roundedPlate(cab,M.dark,[[-.62,.42],[.62,.42],[.54,1.27],[-.51,1.27]],1.60,0,{corner:.06,bevel:.015});
 roundedPlate(cab,M.glass,[[-.52,.50],[-.04,.50],[-.04,1.18],[-.46,1.18]],.014,-.99,{corner:.035,bevel:.002});
 roundedPlate(cab,M.glass,[[.04,.50],[.52,.50],[.46,1.18],[.04,1.18]],.014,-.99,{corner:.035,bevel:.002});
 for(const z of [-1.0,1.0])roundedPlate(cab,M.glass,[[-.48,.48],[.44,.48],[.40,1.18],[-.43,1.18]],.014,z,{corner:.035,bevel:.002});
 roundedBlock(cab,M.bodyDark,[.22,.64,1.66],[.68,.17,0],.04);for(let i=0;i<7;i++)block(cab,M.steel,[.03,.05,1.25],[.80,-.02+i*.08,0],.003);
 roundedBlock(cab,M.dark,[.20,.25,2.08],[.77,-.40,0],.05);
 for(const z of [-.70,.70]){roundedBlock(cab,M.lamp,[.04,.18,.25],[.89,-.31,z],.03);rod(cab,M.dark,V(.28,.94,z),V(.67,1.04,z*1.25),.025);roundedBlock(cab,M.dark,[.12,.22,.30],[.69,1.04,z*1.25],.04);}
 for(const z of [-1.02,1.02]){rod(root,M.dark,V(.85,.72,z),V(.85,.30,z),.05);block(root,M.steel,[.46,.08,.34],[.85,.26,z],.015);}
 const bedPivot=new T.Group();bedPivot.position.set(B.hingeX,B.hingeY,0);root.add(bedPivot);const bed=new T.Group();bed.position.set(-B.hingeX,-B.hingeY,0);bedPivot.add(bed);makeBed(bed,M);
 const wheels=[];for(const x of [W.rearX,W.frontX])for(const z of [-W.z,W.z])wheels.push(wheel(root,M,x,z,x===W.rearX));
 roundedBlock(root,M.dark,[.13,.22,1.72],[-2.22,.85,0],.04);for(const z of [-.62,.62])roundedBlock(root,M.lamp,[.025,.12,.18],[-2.30,.87,z],.02);
 const hoist=makeTruckHoist(root,M);return {wheels,bed,bedPivot,tailgate:null,hoist,signals:{brake:M.lamp,reverse:M.lamp}};
}
