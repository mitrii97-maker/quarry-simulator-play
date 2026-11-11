import * as T from '../three.module.js';
import {add,block,pin,rod,V} from './geometry.js';
import {roundedBlock,roundedPlate} from './sculpted.js';
import {HAULER_BODY as B,HAULER_WHEELS as W,bodyRear,bodyFront,bodyTopRear,bodyTopFront} from './hauler-body-config.js';
import {makeTruckHoist} from './truck-hoist.js';
import {attachUserMazBody} from './user-maz-body.js';

function panel(root,material,points,name){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const mesh=add(root,g,material);mesh.name=name;return mesh;}
function wheel(root,M,x,z,rear){const steer=new T.Group(),roll=new T.Group();steer.position.set(x,W.y,z);steer.add(roll);root.add(steer);const tyre=add(roll,new T.CylinderGeometry(W.radius,W.radius,.36,26),M.tire);tyre.rotation.x=Math.PI/2;pin(roll,M.paint,0,0,Math.sign(z)*.20,.28,.05);for(let i=0;i<18;i++){const a=i*Math.PI/9,t=block(roll,M.tread,[.13,.07,.40],[Math.sin(a)*W.radius,Math.cos(a)*W.radius,0],.015);t.rotation.z=-a;}return {steer,roll,front:!rear,radius:W.radius,baseY:W.y};}
function makeBed(root,M){
 const half=B.depth/2,wide=B.topDepth/2;
 block(root,M.paint,[B.width,B.floorThickness,B.depth],[B.centerX,B.floor,0],.02);
 const proceduralSides=new T.Group();proceduralSides.name='Fallback MAZ dump-body sides';root.add(proceduralSides);
 for(const side of [-1,1]){
  const q=[[bodyRear,B.floor,side*half],[bodyFront,B.floor,side*half],[bodyTopFront,B.frontRim,side*wide],[bodyTopRear,B.rim,side*wide]];panel(proceduralSides,M.paint,side>0?[...q].reverse():q,'MAZ steel dump side');
  for(const u of [.18,.43,.68,.90]){const x=bodyRear+B.width*u,y=B.floor+(B.rim-B.floor)*(.42+.25*u);rod(proceduralSides,M.paint,V(x,B.floor,side*(half+.04)),V(x,y,side*(wide+.04)),.055);}
  rod(proceduralSides,M.paint,V(bodyTopRear,B.rim,side*wide),V(bodyTopFront,B.frontRim,side*wide),.075);
 }
 const front=[[bodyFront,B.floor,-half],[bodyFront,B.floor,half],[bodyTopFront,B.frontRim,wide],[bodyTopFront,B.frontRim,-wide]];panel(root,M.paint,front,'MAZ reinforced headboard');
 const tailgate=new T.Group();tailgate.name='Rigged MAZ rear tailgate';tailgate.position.set(bodyTopRear,B.rim,0);root.add(tailgate);
 const gateHeight=B.rim-B.floor,gate=block(tailgate,M.paint,[B.wallThickness,gateHeight,B.topDepth],[0,-gateHeight/2,0],.025);gate.name='MAZ opening rear body panel';
 for(const z of [-wide*.68,0,wide*.68])rod(tailgate,M.dark,V(.045,-gateHeight+.08,z),V(.045,-.08,z),.035);
 attachUserMazBody(root,M.paint,B).then(()=>{proceduralSides.visible=false;}).catch(()=>{});
 return tailgate;
}

function signMaterial(text,color='#e7e1d5'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.clearRect(0,0,512,128);c.fillStyle=color;c.font='900 72px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,68);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:T.DoubleSide});
}

export function makeMazHauler(root,source,index){
 const M={...source};M.paint=source.paint.clone();M.paint.color.set(index%2?'#a44a27':'#b95729');M.paint.roughness=.72;M.bodyDark=source.dark;M.tire=source.rubber;M.tread=source.track;const cabPaint=source.paint.clone();cabPaint.color.set(index%2?'#ece8da':'#e4e7e1');cabPaint.roughness=.58;
 root.name=`МАЗ-5516 № ${index+1}`;
 roundedBlock(root,M.bodyDark,[5.05,.30,1.72],[-.12,.78,0],.10);roundedBlock(root,M.dark,[1.18,.28,1.78],[-1.52,.97,0],.06);
 for(const x of [W.rearX,W.midX,W.frontX])pin(root,M.dark,x,W.y,0,.13,2.08);
 // Cab-over-engine silhouette of the 5516: near-vertical split windscreen,
 // short nose, broad grille, external mirrors, steps and raised roof hatch.
 const cab=new T.Group();cab.position.set(1.63,1.02,0);root.add(cab);
 roundedBlock(cab,cabPaint,[1.55,1.73,1.98],[0,.57,0],.14);roundedBlock(cab,cabPaint,[1.34,.17,1.90],[-.05,1.49,0],.07);roundedBlock(cab,M.dark,[.42,.05,.54],[-.05,1.59,0],.025);
 roundedPlate(cab,M.dark,[[-.66,.45],[.67,.45],[.58,1.30],[-.57,1.30]],1.64,0,{corner:.05,bevel:.014});
 roundedPlate(cab,M.glass,[[-.56,.52],[-.05,.52],[-.05,1.22],[-.50,1.22]],.016,-1.006,{corner:.03,bevel:.002});
 roundedPlate(cab,M.glass,[[.05,.52],[.56,.52],[.50,1.22],[.05,1.22]],.016,-1.006,{corner:.03,bevel:.002});
 for(const z of [-1.006,1.006]){roundedPlate(cab,M.glass,[[-.48,.54],[.44,.54],[.39,1.20],[-.43,1.20]],.016,z,{corner:.03,bevel:.002});roundedPlate(cab,M.bodyDark,[[-.52,.26],[.51,.26],[.48,.48],[-.50,.48]],.025,z*1.004,{corner:.025,bevel:.003});}
 roundedBlock(cab,M.bodyDark,[.20,.67,1.70],[.72,.12,0],.035);for(let i=0;i<8;i++)block(cab,M.steel,[.028,.045,1.30],[.825,-.10+i*.075,0],.002);
 const badge=add(cab,new T.PlaneGeometry(.64,.16),signMaterial('МАЗ'),.837,.18,0);badge.rotation.y=Math.PI/2;
 roundedBlock(cab,M.dark,[.22,.25,2.08],[.78,-.42,0],.045);for(const z of [-.69,.69])roundedBlock(cab,M.lamp,[.035,.18,.25],[.90,-.33,z],.025);
 for(const z of [-.76,.76]){rod(cab,M.dark,V(.22,1.02,z),V(.66,1.16,z*1.30),.023);roundedBlock(cab,M.dark,[.11,.24,.32],[.68,1.17,z*1.30],.035);}
 for(const z of [-1.04,1.04]){rod(root,M.dark,V(.82,.80,z),V(.82,.27,z),.042);block(root,M.steel,[.52,.07,.30],[.82,.23,z],.012);block(root,M.steel,[.42,.07,.27],[1.10,.39,z],.012);}
 // Tanks, battery box, vertical exhaust and the characteristic spare wheel.
 roundedBlock(root,M.steel,[.94,.46,.42],[.18,.76,-1.02],.08);roundedBlock(root,M.dark,[.72,.52,.42],[.10,.77,1.02],.06);rod(root,M.dark,V(.22,1.02,.78),V(.22,2.28,.78),.055);roundedBlock(root,M.dark,[.15,.20,.15],[.22,2.32,.78],.04);
 const spare=add(root,new T.TorusGeometry(.48,.16,10,22),M.tire,.28,1.48,0);spare.rotation.x=Math.PI/2;
 const bedPivot=new T.Group();bedPivot.position.set(B.hingeX,B.hingeY,0);root.add(bedPivot);const bed=new T.Group();bed.position.set(-B.hingeX,-B.hingeY,0);bedPivot.add(bed);const tailgate=makeBed(bed,M);
 const wheels=[];for(const z of [-W.z,W.z])wheels.push(wheel(root,M,W.frontX,z,false));for(const x of [W.midX,W.rearX])for(const z of [-W.z,-W.dualZ,W.dualZ,W.z])wheels.push(wheel(root,M,x,z,true));
 for(const x of [W.midX,W.rearX])for(const z of [-1,1]){const guard=add(root,new T.TorusGeometry(W.radius+.08,.055,8,28,Math.PI),M.bodyDark,x,W.y+.03,z*W.z);guard.rotation.x=Math.PI/2;guard.rotation.z=z<0?Math.PI:0;}
 roundedBlock(root,M.dark,[.13,.22,1.72],[-2.22,.85,0],.04);for(const z of [-.62,.62])roundedBlock(root,M.lamp,[.025,.12,.18],[-2.30,.87,z],.02);
 const hoist=makeTruckHoist(root,M);return {wheels,bed,bedPivot,tailgate,hoist,signals:{brake:M.lamp,reverse:M.lamp}};
}
