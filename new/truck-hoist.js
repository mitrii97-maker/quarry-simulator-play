import * as T from '../three.module.js';
import {HAULER_BODY as B} from './hauler-body-config.js';
export const HOIST={baseX:-2.2,baseY:1.65,anchorX:.30,anchorY:B.floor-.28,side:.88,sleeve:2.25};
export function hoistAnchor(angle,out={}){const x=HOIST.anchorX-B.hingeX,y=HOIST.anchorY-B.hingeY,c=Math.cos(angle),s=Math.sin(angle);out.x=B.hingeX+x*c-y*s;out.y=B.hingeY+x*s+y*c;return out;}
export function makeTruckHoist(root,M){
 const unit=new T.CylinderGeometry(1,1,1,12),sleeves=new T.InstancedMesh(unit,M.bodyDark,2),rods=new T.InstancedMesh(unit,M.chrome,2),glands=new T.InstancedMesh(unit,M.steel,2),dummy=new T.Object3D(),up=new T.Vector3(0,1,0),direction=new T.Vector3(),anchor={};
 for(const [mesh,name]of[[sleeves,'Paired anchored dump-hoist sleeves'],[rods,'Exposed chrome dump-hoist rods'],[glands,'Dump-hoist gland collars']]){mesh.name=name;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=mesh.receiveShadow=true;mesh.boundingSphere=new T.Sphere(new T.Vector3(-.4,3.1,0),4.8);root.add(mesh);}
 let previous=NaN,length=0;
 function update(angle){if(angle===previous)return;previous=angle;hoistAnchor(angle,anchor);direction.set(anchor.x-HOIST.baseX,anchor.y-HOIST.baseY,0);length=direction.length();direction.multiplyScalar(1/length);dummy.quaternion.setFromUnitVectors(up,direction);
  for(let i=0;i<2;i++){
   const z=i?HOIST.side:-HOIST.side;
   const part=(mesh,start,size,radius)=>{dummy.position.set(HOIST.baseX+direction.x*(start+size/2),HOIST.baseY+direction.y*(start+size/2),z);dummy.scale.set(radius,size,radius);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);};
   part(sleeves,0,HOIST.sleeve,.17);part(rods,HOIST.sleeve,length-HOIST.sleeve,.09);part(glands,HOIST.sleeve-.07,.14,.195);
  }
  for(const mesh of [sleeves,rods,glands])mesh.instanceMatrix.needsUpdate=true;
 }
 update(0);return {update,sleeves,rods,glands,get length(){return length}};
}
