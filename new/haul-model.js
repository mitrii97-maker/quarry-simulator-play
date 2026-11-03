import * as T from '../three.module.js';
import {V,add,block,pin,rod} from './geometry.js';
import {roundedPlate,roundedBlock} from './sculpted.js';
import {lettering} from './volvo-style.js';
import {batchMeshes} from '../batching.js';
import {HAULER_BODY as B,bodyRear,bodyFront,bodyTopRear,bodyTopFront,bodyRimAt} from './hauler-body-config.js';
import {makeTruckHoist} from './truck-hoist.js';

const cache=new WeakMap();
function haulerMaterials(source){
 if(cache.has(source))return cache.get(source);
 const M={...source};M.paint=source.paint.clone();M.paint.color.set('#f0b926');M.paint.roughness=.52;M.paint.metalness=.12;
 M.bodyDark=source.dark.clone();M.bodyDark.color.set('#24292b');M.bodyDark.roughness=.48;
 M.rail=new T.MeshStandardMaterial({color:'#ce602e',metalness:.42,roughness:.43});
 M.tire=source.rubber.clone();M.tire.color.set('#141719');M.tire.roughness=.87;
 M.tread=M.tire.clone();M.tread.color.set('#202324');
 M.bodyPlate=M.paint.clone();M.bodyPlate.vertexColors=true;M.bodyPlate.roughness=.69;M.bodyPlate.metalness=.21;
 M.cabGlass=source.glass.clone();M.cabGlass.color.set('#607d87');M.cabGlass.opacity=.58;M.cabGlass.roughness=.12;
 M.red=new T.MeshStandardMaterial({color:'#a93624',emissive:'#63170f',emissiveIntensity:.35});
 cache.set(source,M);return M;
}
function rail(root,M,points){for(let i=1;i<points.length;i++)rod(root,M.rail,V(...points[i-1]),V(...points[i]),.025)}
function panel(root,material,points,name){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const mesh=add(root,g,material);mesh.name=name;return mesh;
}
function wheel(root,M,x,z,rear){
 const steer=new T.Group();steer.name=rear?'Rear dual wheel':'Front steering wheel';steer.position.set(x,1.14,z);root.add(steer);
 const roll=new T.Group();steer.add(roll);const side=Math.sign(z);
 const section=[[.48,-.35],[.74,-.42],[.98,-.39],[1.08,-.29],[1.115,-.15],[1.115,.15],[1.08,.29],[.98,.39],[.74,.42],[.48,.35],[.48,-.35]];
 const tireGeometry=new T.LatheGeometry(section.map(p=>new T.Vector2(...p)),56,0,Math.PI*2);
 for(const offset of rear?[-.27,.27]:[0]){
  const tire=add(roll,tireGeometry,M.tire,0,0,offset);tire.rotation.x=Math.PI/2;
  // Separate staggered tread shoulders leave a visible channel down the tire.
  for(let i=0;i<44;i++)for(const s of [-1,1]){const a=(i+(s>0?.22:0))*Math.PI/22,t=block(roll,M.tread,[.135,.085,.31],[Math.sin(a)*1.12,Math.cos(a)*1.12,offset+s*.17],.018);t.rotation.z=-a;t.rotation.y=s*.19;}
 }
 const outside=side*(rear?.66:.40);
 pin(roll,M.paint,0,0,outside,.60,.09);pin(roll,M.bodyDark,0,0,outside+side*.055,.41,.018);pin(roll,M.paint,0,0,outside+side*.075,.32,.065);
 add(roll,new T.TorusGeometry(.565,.046,10,48),M.paint,0,0,outside+side*.065);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;pin(roll,M.steel,Math.cos(a)*.395,Math.sin(a)*.395,outside+side*.075,.032,.045)}
 pin(roll,M.paint,0,0,outside+side*.12,.19,.14);
 // Embossed sidewall rings make the bulging tire readable without a glossy rim.
 add(roll,new T.TorusGeometry(.82,.012,6,48),M.tread,0,0,outside+side*.015);
 batchMeshes(roll);return {steer,roll,front:!rear,radius:1.16};
}
function makeCab(root,M){
 const cab=new T.Group();cab.name='Offset high glazed cab';cab.position.set(1.95,2.34,-.92);root.add(cab);
 roundedBlock(cab,M.bodyDark,[1.5,.3,1.38],[0,0,0],.12);
 const sideOutline=[[-.72,.1],[.76,.1],[.63,1.32],[-.53,1.38],[-.72,1.18]];
 for(const z of [-.64,.64]){
  roundedPlate(cab,M.bodyDark,sideOutline,.065,z,{corner:.08,bevel:.014});
  roundedPlate(cab,M.cabGlass,[[-.61,.25],[.05,.25],[.05,1.22],[-.46,1.25],[-.61,1.08]],.012,z+Math.sign(z)*.04,{corner:.045,bevel:.002});
  roundedPlate(cab,M.cabGlass,[[.13,.25],[.65,.25],[.55,1.17],[.13,1.21]],.012,z+Math.sign(z)*.04,{corner:.045,bevel:.002});
  block(cab,M.rail,[1.28,.025,.03],[.01,.42,z+Math.sign(z)*.055],.005);
  block(cab,M.steel,[.16,.025,.035],[-.35,.36,z+Math.sign(z)*.06],.01);
 }
 panel(cab,M.cabGlass,[[.77,.24,-.57],[.77,.24,.57],[.63,1.23,.57],[.63,1.23,-.57]],'Panoramic truck windshield');
 rod(cab,M.bodyDark,V(.78,.2,-.61),V(.63,1.28,-.61),.045);rod(cab,M.bodyDark,V(.78,.2,.61),V(.63,1.28,.61),.045);
 rod(cab,M.bodyDark,V(.7,.24,0),V(.66,1.24,0),.027);rod(cab,M.black,V(.78,.3,-.41),V(.68,.92,-.08),.012);
 roundedBlock(cab,M.bodyDark,[1.55,.13,1.48],[-.02,1.39,0],.06);
 roundedBlock(cab,M.seat,[.44,.18,.48],[-.23,.36,0],.05);roundedBlock(cab,M.seat,[.13,.55,.49],[-.44,.65,0],.05);
 roundedBlock(cab,M.bodyDark,[.38,.23,1.1],[.39,.35,0],.04);
 for(const z of [-.89,.84]){rod(cab,M.bodyDark,V(.57,1.03,Math.sign(z)*.6),V(.95,1.06,z),.024);roundedBlock(cab,M.bodyDark,[.12,.29,.21],[.95,1.06,z],.045)}
}
// Closed, finite steel plates: inner faces are real geometry, never holes
// hidden by cargo. Per-face colour gives worn interiors without extra draws.
function bodyPlate(root,M,inside,outside,name,interior=[.69,.68,.59]){
 const vertices=[],colors=[],uvs=[];
 function quad(points,shade){for(const index of [0,1,2,0,2,3]){const p=points[index];vertices.push(...p);colors.push(...shade);uvs.push(p[0]*.32+p[2]*.17,p[1]*.4+p[2]*.31);}}
 quad(inside,interior);quad([...outside].reverse(),[1,1,1]);for(let i=0;i<4;i++){const j=(i+1)%4;quad([inside[i],outside[i],outside[j],inside[j]],[.84,.83,.77]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeVertexNormals();const mesh=add(root,g,M.bodyPlate);mesh.name=name;return mesh;
}
function bodyBeam(root,material,a,b,width=.12,depth=.14){const d=b.clone().sub(a),mesh=add(root,new T.BoxGeometry(width,d.length(),depth),material);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return mesh;}
function bodyRib(root,M,side,u){
 const lowX=bodyRear+B.width*u,topX=bodyTopRear+(bodyTopFront-bodyTopRear)*u,topY=bodyRimAt(topX),profile=[[lowX,B.floor-B.floorThickness,side*1.78],[lowX-.02,B.floor+.19,side*2.11],[topX,topY-.10,side*(B.topDepth/2+.15)]],positions=[];
 const corners=[];for(const d of [-.055,.055])for(const p of profile)corners.push([p[0]+d,p[1],p[2]]);
 for(const face of [[0,2,1],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]])for(let i=1;i<face.length-1;i++)for(const k of [face[0],face[i],face[i+1]])positions.push(...corners[k]);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();const rib=add(root,g,M.paint);rib.name='Triangular external rock-body stiffener';
}
function makeBed(root,M){
 const half=B.depth/2,wide=B.topDepth/2,wall=B.wallThickness;
 const floor=[[bodyRear,B.floor,-half],[bodyRear,B.floor,half],[bodyFront,B.floor,half],[bodyFront,B.floor,-half]];
 bodyPlate(root,M,floor,floor.map(([x,y,z])=>[x,y-B.floorThickness,z]),'Continuous raised load floor above all tyres');
 // Longitudinal bearers remain inboard of the rear twin tyres.
 for(const z of [-.88,.88])roundedBlock(root,M.bodyDark,[5.13,.23,.19],[-1,B.floor-.28,z],.025);
 for(const side of [-1,1]){
  let inside=[[bodyRear,B.floor,side*half],[bodyFront,B.floor,side*half],[bodyTopFront,B.frontRim,side*wide],[bodyTopRear,B.rim,side*wide]];
  if(side>0)inside.reverse();
  bodyPlate(root,M,inside,inside.map(([x,y,z])=>[x,y,z+side*wall]),'Reference splayed rock-body side');
  bodyBeam(root,M.paint,V(bodyTopRear,B.rim,side*(wide+.07)),V(bodyTopFront,B.frontRim,side*(wide+.07)),.14,.18);
  bodyBeam(root,M.paint,V(bodyRear,B.floor-.06,side*(half+.08)),V(bodyFront,B.floor-.06,side*(half+.08)),.12,.15);
  for(let i=0;i<7;i++)bodyRib(root,M,side,.065+i*.145);
  bodyBeam(root,M.paint,V(bodyRear,B.floor,side*(half+.08)),V(bodyTopRear,B.rim,side*(wide+.07)),.14,.18);
  // A restrained badge follows the sloped steel rather than floating off it.
  const badge=lettering(root,'VOLVO',{x:.53,y:3.87,z:side*(half+(wide-half)*(.89/(bodyRimAt(.53)-B.floor))+wall+.014),width:1.12,height:.24,font:'900 175px Georgia',side,name:'Volvo quarry body badge'});badge.rotation.x=side*Math.atan((wide-half)/(bodyRimAt(.53)-B.floor));
  const model=lettering(root,'R100E',{x:-1.65,y:3.49,z:side*(half+(wide-half)*(.51/(bodyRimAt(-1.65)-B.floor))+wall+.014),width:.66,height:.20,color:'#3d3930',font:'900 170px Arial',side});model.rotation.x=side*Math.atan((wide-half)/(bodyRimAt(-1.65)-B.floor));
 }
 const front=[[bodyFront,B.floor,-half],[bodyFront,B.floor,half],[bodyTopFront,B.frontRim,wide],[bodyTopFront,B.frontRim,-wide]];
 bodyPlate(root,M,front,front.map(([x,y,z])=>[x+wall,y,z]),'Slanted front headboard');
 const canopy=[[bodyTopFront,B.frontRim,-B.canopyDepth/2],[bodyTopFront,B.frontRim,B.canopyDepth/2],[B.canopyFront,B.canopyY,B.canopyDepth/2],[B.canopyFront,B.canopyY,-B.canopyDepth/2]];
 // Roof's exterior is yellow; its underside is darkened worn steel.
 bodyPlate(root,M,canopy,canopy.map(([x,y,z])=>[x,y-.13,z]),'Wide ribbed over-cab rock canopy',[1,1,1]);
 for(let i=0;i<9;i++){const u=(i+.4)/9,x=bodyTopFront+(B.canopyFront-bodyTopFront)*u,y=B.frontRim+(B.canopyY-B.frontRim)*u+.025;bodyBeam(root,M.paint,V(x,y,-B.canopyDepth/2+.08),V(x,y,B.canopyDepth/2-.08),.045,.08);}
 bodyBeam(root,M.paint,V(B.canopyFront,B.canopyY,-B.canopyDepth/2),V(B.canopyFront,B.canopyY,B.canopyDepth/2),.13,.16);
 // Broad open discharge lip, without a hanging wall or gate.
 bodyBeam(root,M.paint,V(bodyRear-.08,B.floor-.025,-half-.10),V(bodyRear-.08,B.floor-.025,half+.10),.13,.18);
 const worn=M.bucket.clone();worn.color.set('#a49a77');worn.roughness=.91;worn.metalness=.12;
 for(let i=0;i<10;i++)roundedBlock(root,worn,[4.97,.007,.018+(.5+.5*Math.sin(i*7))*.018],[-1.01,B.floor+.005,-1.45+i*.32],.001);
 for(const z of [-1.12,1.12]){pin(root,M.steel,B.hingeX,B.hingeY,z,.17,.24);rod(root,M.bodyDark,V(B.hingeX,B.hingeY,z),V(B.hingeX+.5,B.floor-.13,z),.11);}
 const tailgate=new T.Group();tailgate.name='Open rear body (no tailgate)';root.add(tailgate);return tailgate;
}

export function makeHauler(root,materials,index){
 const M={...haulerMaterials(materials)};M.red=M.red.clone();const reverse=M.lamp.clone();reverse.color.set('#6d7880');reverse.emissive.set('#fff1cf');reverse.emissiveIntensity=0;root.name=`Volvo style quarry hauler ${index+1}`;
 roundedBlock(root,M.bodyDark,[6.25,.44,2.7],[-.03,1.18,0],.18);
 // The raised tray rests on real inboard frame rails and saddle pads. These
 // stay on the chassis when tipping, clear of the rear twin-tyre envelopes.
 for(const z of [-.90,.90]){
  add(root,new T.BoxGeometry(5.2,.44,.22),M.bodyDark,-.90,2.32,z);
  for(const x of [-2.6,-.7,1.0])add(root,new T.BoxGeometry(.25,.96,.22),M.bodyDark,x,1.73,z);
  for(const x of [-3.2,-.8,1.2])add(root,new T.BoxGeometry(.40,.23,.34),M.bodyDark,x,2.56,z);
  roundedPlate(root,M.bodyDark,[[B.hingeX-.21,2.17],[B.hingeX+.21,2.17],[B.hingeX+.22,2.82],[B.hingeX,2.96],[B.hingeX-.22,2.82]],.18,z,{corner:.06,bevel:.015});
 }
 for(const x of [-2.18,2.08]){pin(root,M.dark,x,1.1,0,.23,3.5);for(const z of [-1.04,1.04]){rod(root,M.chrome,V(x-.25,1.16,z),V(x-.11,1.96,z),.095);rod(root,M.bodyDark,V(x-.17,1.3,z),V(x,2.05,z),.15)}}
 roundedBlock(root,M.bodyDark,[1.76,1.02,2.75],[2.4,1.95,0],.19);
 // Slanted radiator face and a broad catwalk ahead of the engine.
 roundedPlate(root,M.bodyDark,[[2.96,1.21],[3.63,1.21],[3.42,1.86],[2.91,2.62]],2.93,0,{corner:.09,bevel:.05});
 for(const z of [-1.53,1.53])roundedPlate(root,M.paint,[[1.1,1.62],[2.22,1.57],[3.28,2.44],[2.95,2.59],[1.37,2.59]],.14,z,{corner:.12,bevel:.035});
 roundedBlock(root,M.bodyDark,[1.46,.15,3.78],[2.81,2.53,0],.065);
 roundedBlock(root,M.bodyDark,[.3,.23,3.85],[3.6,1.11,0],.1);
 for(let i=0;i<12;i++){const y=1.4+i*.075,x=(y<1.86?3.63-(y-1.21)*.323:3.42-(y-1.86)*.671)+.045;rod(root,M.track,V(x,y,-.9),V(x,y,.9),.023)}
 for(const z of [-1.28,1.28]){roundedBlock(root,M.dark,[.16,.28,.52],[3.46,1.43,z],.06);roundedBlock(root,M.lamp,[.025,.17,.17],[3.55,1.46,z-.11],.02);roundedBlock(root,M.lamp,[.025,.17,.17],[3.55,1.46,z+.11],.02)}
 makeCab(root,M);
 // Keeping the authored body coordinates under an inverse offset preserves
 // every closed-bed vertex while providing a real rear tipping hinge.
 const bedPivot=new T.Group();bedPivot.name='Rear dump-body hinge';bedPivot.position.set(B.hingeX,B.hingeY,0);root.add(bedPivot);
 const bed=new T.Group();bed.position.set(-B.hingeX,-B.hingeY,0);bedPivot.add(bed);const tailgate=makeBed(bed,M);batchMeshes(bed);
 // Orange fall protection and a diagonal access ladder are defining features.
 for(const side of [-1,1]){
  const z=side*1.82;rail(root,M,[[3.49,2.57,z],[3.49,3.22,z],[1.22,3.22,z],[1.22,2.57,z]]);
  rod(root,M.rail,V(2.56,2.57,z),V(2.56,3.22,z),.024);rod(root,M.rail,V(1.22,2.88,z),V(3.49,2.88,z),.021);
  for(const x of [3.2,3.52])rail(root,M,[[x,.75,side*2.1],[x,1.07,side*2.08],[x,2.52,side*1.84],[x,3.18,side*1.84]]);
  for(let i=0;i<7;i++){const y=.82+i*.25,zStep=side*(2.1-(y-.82)*.16);roundedBlock(root,M.steel,[.42,.045,.22],[3.36,y,zStep],.018)}
  roundedBlock(root,M.dark,[.68,.09,.35],[3.36,.64,side*2.13],.03);
  roundedBlock(root,M.dark,[.12,.22,.42],[-3.57,1.65,side*1.18],.04);roundedBlock(root,M.red,[.025,.13,.28],[-3.64,1.67,side*1.18],.02);
  roundedBlock(root,M.black,[.14,.52,.76],[-2.87,.98,side*1.78],.04);
 }
 for(const z of [-.73,.6]){rod(root,M.dark,V(.96,2.01,z),V(.96,3.71,z),.085);add(root,new T.CylinderGeometry(.12,.12,.12,16),M.dark,.96,3.77,z)}
 for(const side of [-1,1])roundedBlock(root,reverse,[.025,.10,.18],[-3.66,1.65,side*.90],.015);
 const wheels=[];for(const x of [-2.15,2.1])for(const z of [-1.82,1.82])wheels.push(wheel(root,M,x,z,x<0));
 const hoist=makeTruckHoist(root,M);
 return {wheels,bed,bedPivot,tailgate,hoist,signals:{brake:M.red,reverse}};
}
