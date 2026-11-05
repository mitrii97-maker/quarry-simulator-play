import * as T from '../three.module.js?build=career-20261106-18';
import {HAULER_BODY as B} from './hauler-body-config.js?build=career-20261106-18';
export function createHaulLod(root,M){
 const detail=new T.Group();for(const child of [...root.children])detail.add(child);root.add(detail);
 const distant=new T.Group();root.add(distant);const box=(w,h,d,mat,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);distant.add(m);return m;};
 box(6.4,.5,3.2,M.dark,0,1.25,0);box(B.width,1.15,B.topDepth,M.paint,B.centerX,3.4,0);box(1.7,1.8,1.5,M.dark,2.3,3.4,-.9);
 for(const x of [-2.15,2.1])for(const z of [-1.9,1.9]){const m=new T.Mesh(new T.CylinderGeometry(1.14,1.14,.85,12),M.rubber);m.rotation.x=Math.PI/2;m.position.set(x,1.14,z);distant.add(m);}
 distant.visible=false;return {update(camera){const d=root.position.distanceTo(camera.position);const low=detail.visible?d>90:d>80;detail.visible=!low;distant.visible=low;},detail,distant};
}
