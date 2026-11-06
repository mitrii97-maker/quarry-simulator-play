import * as T from '../three.module.js?build=volvo-review-v2';
import {V,add,block,pin,rod} from './geometry.js?build=volvo-review-v2';
import {roundedOutline,roundedPlate,curvedShell} from './sculpted.js?build=volvo-review-v2';
import {batchMeshes} from '../batching.js?build=volvo-review-v2';
import {BUCKET} from './bucket-config.js?build=volvo-review-v2';
import {BUCKET_INNER_WIDTH,MACHINE} from './material-volume.js?build=volvo-review-v2';

// A heavy, open-mouth excavator bucket in the existing metre-scale envelope.
// Its local -X cutting edge, pin and interior remain aligned with the simulation.
export function makeBucketShell(bucket,materials){
 const steel=materials.bucket.clone();steel.color.set(MACHINE.id==='hitachi'?'#4b504d':MACHINE.id==='komatsu'?'#555b57':'#424745');steel.normalMap=null;steel.roughness=.68;steel.metalness=.57;
 const edge=materials.steel.clone();edge.color.set('#a2a6a2');edge.roughness=.44;edge.metalness=.78;
 const dark=materials.bucket.clone();dark.color.set('#3c4240');dark.normalMap=null;dark.roughness=.80;dark.metalness=.36;
 const sideWear=steel.clone();sideWear.color.set('#616660');sideWear.roughness=.78;
 // Shell dimensions are local: root.scale applies the machine size once.
 const mining=MACHINE.id==='hitachi'||MACHINE.id==='komatsu';
 const drop=BUCKET.drop,width=BUCKET_INNER_WIDTH,outer=width/2+.08;
 const body=new T.Group(),teeth=new T.Group(),mounts=new T.Group();
 body.name='Rounded reference bucket bowl';teeth.name='Five tapered cutting teeth';mounts.name='Paired bored bucket mounting ears';
 teeth.userData.toothCount=5;mounts.userData.mainBoreRadius=.158;mounts.userData.linkBoreRadius=.105;
 bucket.add(body,teeth,mounts);
 const raw=[[.46,.15],[.72,-.06],[.85,-.27],[.85,-.59],[.78,-.94],[.55,-1.17],[.22,-1.32],[-.23,-1.32],[-.65,-1.26],[-1.02,-1.05],[-1.28,-.72]];
 const profile=raw.map(([x,y])=>[x,y-drop]);
 // The section is deliberately open from its top rim to its cutting lip.
 // Only the curved back and sole are swept across the width.
 curvedShell(body,steel,profile,width+.17,mining?.21:.18).name='Open curved bucket back and sole';
 for(const side of [-1,1]){
  const z=side*outer;
  const cheek=roundedPlate(body,steel,profile,mining?.16:.12,z,{corner:.12,bevel:.018});cheek.name=side<0?'Left thick rounded cheek':'Right thick rounded cheek';
  const inset=[[.43,.02],[.72,-.29],[.72,-.84],[.43,-1.13],[.08,-1.22],[-.42,-1.19],[-.88,-.98],[-1.02,-.76]].map(([x,y])=>[x,y-drop]);
  roundedPlate(body,sideWear,inset,.014,z+side*(mining?.095:.069),{corner:.17,bevel:.002}).name='Recessed outer cheek wear plate';
  // Rolled mouth edge and the side cutter weld. Nothing bridges the opening.
  rod(body,edge,V(.45,.13-drop,z+side*(mining?.092:.064)),V(-1.22,-.71-drop,z+side*(mining?.092:.064)),.023);
  roundedPlate(body,edge,[[-1.31,-.79],[-1.04,-1.05],[-.99,-1.10],[-1.28,-.83]].map(([x,y])=>[x,y-drop]),.028,z+side*(mining?.105:.075),{corner:.025,bevel:.004});
  for(const [x,y]of [[.51,-.20],[-.82,-1.03]])pin(body,dark,x,y-drop,z+side*.081,.026,.015);
 }
 // Broad bevelled cutting bar, independent bolted tooth adapters and pointed
 // teeth replace the old five constant-width flat plates.
 block(body,edge,[.23,.13,width+.35],[-1.235,-.73-drop,0],.015).name='Bevelled cutting edge';
 const tipCenters=[];
 for(let i=0;i<5;i++){
  const z=-.7+i*.35,marker=new T.Object3D();marker.name=`Cutting tooth ${i+1} tip`;marker.position.set(-1.82,-.75-drop,z);marker.userData.bucketTooth=true;teeth.add(marker);tipCenters.push(marker.position.clone());
  roundedPlate(teeth,steel,[[-1.05,-.58],[-1.48,-.61],[-1.59,-.72],[-1.44,-.84],[-1.12,-.83]].map(([x,y])=>[x,y-drop]),.24,z,{corner:.027,bevel:.010});
  const sections=[{x:-1.25,top:-.61,bottom:-.82,w:.19},{x:-1.53,top:-.60,bottom:-.81,w:.165},{x:-1.82,top:-.732,bottom:-.768,w:.082}],points=[],indices=[];
  for(const s of sections)points.push(s.x,s.top-drop,z-s.w/2,s.x,s.top-drop,z+s.w/2,s.x,s.bottom-drop,z+s.w/2,s.x,s.bottom-drop,z-s.w/2);
  for(let n=0;n<2;n++)for(let side=0;side<4;side++){const a=n*4+side,b=n*4+(side+1)%4,c=b+4,d=a+4;indices.push(a,b,d,b,c,d);}
  indices.push(0,3,1,1,3,2,8,9,11,9,10,11);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();add(teeth,geometry,edge).name=`Tapered tooth ${i+1}`;
  const washer=add(teeth,new T.CylinderGeometry(.056,.056,.012,18),dark,-1.20,-.567-drop,z);washer.name='Tooth adapter washer';
  add(teeth,new T.CylinderGeometry(.036,.036,.034,6),edge,-1.20,-.546-drop,z).name='Hex tooth adapter bolt';
 }
 // Four abrasion runners conform to the outside sole rather than crossing
 // the bucket cavity. Their sweep stays immediately below the shell.
 for(const z of [-.58,-.19,.19,.58]){
  const path=[[-.62,-1.285],[-.18,-1.345],[.23,-1.345],[.55,-1.20],[.77,-.98]];
  for(let i=1;i<path.length;i++)rod(body,dark,V(path[i-1][0],path[i-1][1]-drop,z),V(path[i][0],path[i][1]-drop,z),.026);
 }
 // Actual holes, not black disks painted onto solid lugs. The stick passes
 // between the two plates; the pin shaft is added by the existing rig.
 // Welded saddle gussets carry both ears into the curved back. These stay
 // outside the retained interior, so the pin assembly cannot look detached.
 for(const z of [-.43,.43])roundedPlate(mounts,steel,[[.34,-.55],[.50,-.57],[.89,-.94],[.86,-1.10],[.69,-.85],[.44,-.65]],.12,z,{corner:.035,bevel:.008}).name='Mount-to-shell welded saddle';
 const lugPoints=[[-.22,-.02],[-.22,-.44],[.06,-.63],[.40,-.61],[.53,-.20],[.53,.26],[.42,.44],[.22,.44],[.04,.24],[-.14,.24]];
 for(const side of [-1,1]){
  const z=side*.43,shape=roundedOutline(lugPoints,.065);
  for(const [x,y,r]of [[0,0,.158],[.32,.30,.105]]){const hole=new T.Path();hole.absarc(x,y,r,0,Math.PI*2,true);shape.holes.push(hole);}
  const geometry=new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:24});geometry.translate(0,0,-.06);
  add(mounts,geometry,steel,0,0,z).name=side<0?'Left bored mounting ear':'Right bored mounting ear';
  for(const [x,y,r]of [[0,0,.158],[.32,.30,.105]]){
   const ring=add(mounts,new T.TorusGeometry(r+.017,.018,8,28),edge,x,y,z+side*.075);ring.name='Machined mounting bore collar';
   const inner=add(mounts,new T.TorusGeometry(r-.004,.006,6,24),dark,x,y,z-side*.061);inner.name='Dark inside bore edge';
  }
 }
 if(mining){
  // A compact reinforced top saddle ties the pin ears into the bucket back.
  for(const z of [-.43,.43])roundedPlate(mounts,steel,[[.10,-.48],[.43,-.40],[.78,-.72-drop],[.69,-.91-drop],[.34,-.75]],.14,z,{corner:.055,bevel:.012});
  block(body,dark,[.24,.12,width+.16],[.65,-.38-drop,0],.025);
 }
 body.userData.profile=profile.map(p=>[...p]);teeth.userData.tipCenters=tipCenters.map(p=>p.toArray());mounts.userData.earCenters=[-.43,.43];
 for(const group of [body,teeth,mounts])batchMeshes(group);
 return {body,teeth,mounts,profile,tipCenters,mainPin:V(0,0,0),linkPin:V(.32,.30,0)};
}
