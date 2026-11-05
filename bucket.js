import * as T from './three.module.js?build=fix-20261106-22';
// Local +X points back toward the machine: this is a backhoe bucket.
export function makeBackhoeBucket({shell,cutting,soil}){
 const group=new T.Group();
 const mesh=(geometry,material,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m};
 const profile=[[-.65,.55],[-1,.15],[-.95,-.45],[-.5,-.8],[.2,-.8],[.85,-.5]];
 const shape=new T.Shape();shape.moveTo(...profile[0]);for(const p of profile.slice(1))shape.lineTo(...p);shape.closePath();
 const plate=new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:1,steps:1});
 for(const z of [-.8,.68])mesh(plate,shell,0,0,z);
 for(let i=0;i<profile.length-1;i++){const a=new T.Vector3(...profile[i],0),b=new T.Vector3(...profile[i+1],0),d=b.clone().sub(a);const panel=mesh(new T.BoxGeometry(d.length()+.08,.13,1.5),shell);panel.position.copy(a).add(b).multiplyScalar(.5);panel.rotation.z=Math.atan2(d.y,d.x)}
 mesh(new T.BoxGeometry(.24,.17,1.67),cutting,.82,-.5,0);
 const tooth=new T.Shape();tooth.moveTo(0,-.11);tooth.lineTo(.53,-.05);tooth.lineTo(.58,.03);tooth.lineTo(0,.12);tooth.closePath();const toothGeo=new T.ExtrudeGeometry(tooth,{depth:.16,bevelEnabled:false});
 for(let i=0;i<5;i++)mesh(toothGeo,cutting,.85,-.51,-.69+i*.3);
 for(const z of [-.4,.4])mesh(new T.BoxGeometry(.3,.5,.14),shell,-.5,.66,z);{const pin=mesh(new T.CylinderGeometry(.13,.13,1.1,16),cutting,-.5,.75,0);pin.rotation.x=Math.PI/2}
 const cargo=mesh(new T.DodecahedronGeometry(.68,1),soil,-.18,-.2,0);cargo.scale.set(1,.6,1);cargo.visible=false;
 return {group,cargo,mouth:new T.Vector3(.95,-.5,0)};
}
