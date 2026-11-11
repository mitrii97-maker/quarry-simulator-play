import * as T from '../three.module.js?build=boom-20261107-30';
import {V,add,block,pin,rod,cylinderRig,hose} from './geometry.js?build=boom-20261107-30';
import {roundedPlate,roundedBlock} from './sculpted.js?build=boom-20261107-30';
import {trackBelt} from './track-belt.js?build=boom-20261107-30';
import {batchMeshes} from '../batching.js?build=boom-20261107-30';

// The grader uses the same metre scale, steel and work-light materials as the
// excavator. +X is forward; the chassis origin is the ground contact plane.
export function makeDozer(scene,M){
 const root=new T.Group();root.name='Tracked quarry bulldozer';scene.add(root);
 const body=new T.Group();root.add(body);
 const tracks=new T.Group();tracks.scale.set(.68,.92,.8);root.add(tracks);
 const belts=[trackBelt(tracks,M,-1.35),trackBelt(tracks,M,1.35)];
 const rollers=[];
 for(const side of [-1,1]){
  const z=side*1.12;
  roundedPlate(body,M.dark,[[-1.96,.46],[-1.72,.93],[1.68,.93],[1.98,.53],[1.73,.36],[-1.72,.36]],.54,z,{corner:.15,bevel:.035});
  for(const x of [-1.78,1.78]){
   const wheel=new T.Group();wheel.position.set(x,.56,z+side*.19);body.add(wheel);
   pin(wheel,M.dark,0,0,0,.38,.21);pin(wheel,M.steel,0,0,side*.12,.275,.035);pin(wheel,M.dark,0,0,side*.15,.15,.05);
   for(let i=0;i<10;i++){const a=i*Math.PI/5;pin(wheel,M.steel,.21*Math.cos(a),.21*Math.sin(a),side*.15,.025,.03)}
   batchMeshes(wheel);rollers.push({wheel,radius:.38});
  }
  for(let i=0;i<6;i++){const x=-1.35+i*.54;pin(body,M.black,x,.37,z+side*.22,.19,.12);pin(body,M.track,x,.37,z+side*.29,.11,.025)}
  for(const x of [-1.05,.5])pin(body,M.track,x,.96,z,.13,.32);
  roundedBlock(body,M.paint,[3.65,.13,.74],[-.05,1.16,z],.06);
  roundedBlock(body,M.snow,[2.92,.025,.57],[-.31,1.24,z],.01);
 }
 roundedBlock(body,M.dark,[3.6,.4,1.67],[-.15,.94,0],.14);
 roundedPlate(body,M.paint,[[-1.88,1.08],[-1.9,1.66],[-1.65,1.86],[-.86,1.86],[-.72,1.1]],1.86,0,{corner:.19,bevel:.065});
 roundedPlate(body,M.paint,[[.1,1.12],[1.99,1.12],[1.9,1.71],[1.46,1.94],[.11,1.93]],1.7,0,{corner:.15,bevel:.045});
 roundedBlock(body,M.snow,[1.48,.025,1.53],[.94,1.94,0],.012);
 // Recessed side grilles and a rounded nose distinguish the engine from the cab.
 for(const side of [-1,1]){
  roundedPlate(body,M.dark,[[.45,1.3],[1.72,1.3],[1.68,1.65],[.45,1.76]],.018,side*.872,{corner:.04,bevel:.003});
  for(let i=0;i<11;i++)rod(body,M.track,V(.52+i*.102,1.36,side*.892),V(.52+i*.102,1.65,side*.892),.016);
  roundedBlock(body,M.dark,[.46,.22,.028],[-1.44,1.55,side*.952],.035);
  for(const x of [-1.64,-1.23])pin(body,M.steel,x,1.55,side*.974,.022,.026);
  rod(body,M.paint,V(-1.73,1.25,side*.87),V(-1.73,2.03,side*.87),.029);
  rod(body,M.paint,V(-1.73,2.03,side*.87),V(-1.1,2.03,side*.87),.029);
  rod(body,M.paint,V(-1.1,2.03,side*.87),V(-1.1,1.4,side*.87),.029);
  for(let i=0;i<3;i++)roundedBlock(body,M.steel,[.53,.055,.22],[-.96,1.18+i*.24,side*(1.46-i*.14)],.018);
 }
 roundedBlock(body,M.dark,[.17,.72,1.46],[1.98,1.48,0],.06);
 for(let i=0;i<10;i++)rod(body,M.track,V(2.08,1.22+i*.052,-.62),V(2.08,1.22+i*.052,.62),.021);
 // Glazed ROPS cabin, with actual seat, dashboard and operator silhouette.
 const cab=new T.Group();cab.position.set(-.55,1.2,0);body.add(cab);
 roundedBlock(cab,M.dark,[1.53,.2,1.56],[0,.08,0],.075);
 for(const side of [-1,1]){
  const z=side*.745;
  roundedPlate(cab,M.glass,[[-.68,.34],[.67,.34],[.57,1.77],[-.56,1.77]],.014,z,{corner:.06,bevel:.002});
  for(const x of [-1,1])rod(cab,M.dark,V(x*.72,.22,z),V(x*.59,1.84,z),.046);
  rod(cab,M.dark,V(-.69,.35,z),V(.69,.35,z),.04);
  rod(cab,M.dark,V(-.18,.32,z),V(-.15,1.81,z),.027);
  roundedBlock(cab,M.paint,[.27,.045,.04],[.37,.65,z+side*.025],.013);
 }
 for(const side of [-1,1]){
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute([side*.68,.35,-.67,side*.68,.35,.67,side*.56,1.77,.67,side*.56,1.77,-.67],3));
  geometry.setIndex(side>0?[0,2,1,0,3,2]:[0,1,2,0,2,3]);geometry.computeVertexNormals();add(cab,geometry,M.glass);
 }
 roundedBlock(cab,M.paint,[1.62,.18,1.76],[0,1.91,0],.075);
 roundedBlock(cab,M.snow,[1.48,.035,1.61],[0,2.015,0],.014);
 rod(cab,M.black,V(.68,.4,-.31),V(.58,1.4,.14),.015);
 roundedBlock(cab,M.seat,[.45,.17,.51],[-.17,.48,0],.05);
 roundedBlock(cab,M.seat,[.14,.59,.53],[-.38,.78,0],.045);
 roundedBlock(cab,M.dark,[.26,.23,1.19],[.46,.59,0],.04);
 roundedBlock(cab,M.dark,[.24,.51,.32],[-.12,.9,0],.08);
 add(cab,new T.SphereGeometry(.145,12,8),M.black,-.09,1.28,0);
 for(const z of [-.4,.4]){rod(cab,M.black,V(.13,.55,z),V(.2,.83,z),.023);add(cab,new T.SphereGeometry(.047,8,6),M.dark,.2,.84,z)}
 // Lamps share the scene's day/night emissive update, no costly extra lights.
 for(const z of [-.65,.65]){
  roundedBlock(cab,M.dark,[.18,.18,.19],[.69,1.81,z],.035);
  roundedBlock(cab,M.lamp,[.035,.105,.12],[.79,1.81,z],.018);
 }
 add(body,new T.CylinderGeometry(.075,.095,.71,14),M.dark,.99,2.25,.53);
 add(body,new T.CylinderGeometry(.105,.105,.07,14),M.black,.99,2.64,.53);
 const beaconMat=new T.MeshStandardMaterial({color:'#f7a324',emissive:'#b85b10',emissiveIntensity:.45,roughness:.33,metalness:.12});
 add(cab,new T.CylinderGeometry(.11,.12,.06,16),M.dark,-.4,2.07,.5);
 add(cab,new T.CylinderGeometry(.085,.095,.145,16),beaconMat,-.4,2.17,.5);
 for(const group of [cab,body])batchMeshes(group);

 // A rolled concave moldboard, with a proper steel cutting edge and end plates.
 // Its front is open towards +X: carried rocks sit ahead of the curved steel.
 const blade=new T.Group();blade.name='Hydraulic concave bulldozer blade';root.add(blade);
 const profile=[[3.14,.13],[2.98,.28],[2.79,.52],[2.70,.78],[2.73,1.04],[2.87,1.28]],positions=[],indices=[];
 const nz=18;
 for(let y=0;y<profile.length;y++)for(let z=0;z<=nz;z++){
  const zz=(z/nz-.5)*3.7,bow=.10*(zz/1.85)**2;
  positions.push(profile[y][0]+bow,profile[y][1],zz);
 }
 for(let y=0;y<profile.length-1;y++)for(let z=0;z<nz;z++){const a=y*(nz+1)+z,b=a+nz+1;indices.push(a,b,a+1,b,b+1,a+1)}
 const faceGeometry=new T.BufferGeometry();faceGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));faceGeometry.setIndex(indices);faceGeometry.computeVertexNormals();
 const faceMaterial=M.bucket.clone();faceMaterial.side=T.DoubleSide;faceMaterial.roughness=.56;
 const face=add(blade,faceGeometry,faceMaterial);face.name='Curved steel moldboard';
 roundedBlock(blade,M.steel,[.23,.12,3.89],[3.17,.12,0],.023);
 rod(blade,M.paint,V(2.85,1.29,-1.86),V(2.85,1.29,1.86),.09);
 for(const side of [-1,1]){
  roundedPlate(blade,M.paint,[[2.71,.29],[3.2,.14],[3.06,.56],[2.98,1.25],[2.81,1.27],[2.62,.72]],.11,side*1.87,{corner:.065,bevel:.025});
  roundedPlate(blade,M.paint,[[2.51,.3],[2.66,.3],[2.65,1.05],[2.72,1.21],[2.58,1.22],[2.46,.67]],.10,side*1.10,{corner:.05,bevel:.02});
  for(let i=0;i<4;i++)pin(blade,M.steel,3.2,.16,side*(.62+i*.33),.027,.026);
 }
 batchMeshes(blade);
 const armRig=[];
 for(const side of [-1,1]){
  const z=side*1.33,push=new T.Group();root.add(push);
  const arm=add(push,new T.CylinderGeometry(.125,.125,1,12),M.dark);
  const hydraulic=cylinderRig(root,M.dark,M.chrome);
  pin(body,M.steel,-.75,.62,z,.15,.22);
  pin(blade,M.steel,2.63,.4,side*1.43,.12,.22);
  hose(body,M.black,[V(.76,1.13,side*.94),V(1.35,1.06,side*.97),V(1.9,.91,side*1.12)],.018);
  armRig.push({side,z,push,arm,hydraulic});
 }
 batchMeshes(body);
 let currentLift=-1;
 function setBladeLift(lift=0){
  const value=T.MathUtils.clamp(Number.isFinite(lift)?lift:0,-.12,.6);if(Math.abs(value-currentLift)<1e-6)return;
  currentLift=value;blade.position.y=value;
  for(const r of armRig){
   const start=V(-.75,.62,r.z),end=V(2.63,.4+value,r.side*1.43),delta=end.clone().sub(start);
   r.push.position.copy(start).add(end).multiplyScalar(.5);r.push.quaternion.setFromUnitVectors(V(0,1,0),delta.clone().normalize());r.arm.scale.y=delta.length();
   r.hydraulic.update(V(1.10,1.14,r.side*1.03),V(2.62,.87+value,r.side*1.19));
  }
 }
 setBladeLift(.45);
 return {root,blade,setBladeLift,advanceTracks(distance=0){
  if(!Number.isFinite(distance)||Math.abs(distance)<1e-9)return;
  for(const b of belts)b.advance(distance/.68);
  for(const {wheel,radius} of rollers)wheel.rotation.z-=distance/radius;
 }};
}
