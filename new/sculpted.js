import * as T from '../three.module.js';
import {add} from './geometry.js';

// Fillet the silhouette, then round its depth edges. Keep broad steel faces flat.
export function roundedOutline(points,radius=.15,closed=true){
 const path=closed?new T.Shape():new T.Path(),n=points.length;
 for(let i=0;i<n;i++){
  const p=new T.Vector2(...points[i]);
  if(!closed&&(i===0||i===n-1)){if(i===0)path.moveTo(p.x,p.y);else path.lineTo(p.x,p.y);continue}
  const prev=new T.Vector2(...points[(i+n-1)%n]),next=new T.Vector2(...points[(i+1)%n]);
  const a=prev.sub(p),b=next.sub(p),cut=Math.min(radius,a.length()*.42,b.length()*.42);
  a.normalize().multiplyScalar(cut).add(p);b.normalize().multiplyScalar(cut).add(p);
  if(i===0)path.moveTo(a.x,a.y);else path.lineTo(a.x,a.y);
  path.quadraticCurveTo(p.x,p.y,b.x,b.y);
 }
 if(closed)path.closePath();return path;
}
function polishBevel(geometry){
 // ExtrudeGeometry emits isolated triangles. Share side/bevel normals at a
 // vertex, while retaining the perfectly planar normals of the end caps.
 const p=geometry.attributes.position,n=geometry.attributes.normal,start=geometry.groups.find(g=>g.materialIndex===1)?.start??0,groups=new Map();
 for(let i=start;i<p.count;i++){const key=`${Math.round(p.getX(i)*1e5)},${Math.round(p.getY(i)*1e5)},${Math.round(p.getZ(i)*1e5)}`;let a=groups.get(key);if(!a)groups.set(key,a=[]);a.push(i)}
 const v=new T.Vector3();
 for(const indices of groups.values()){v.set(0,0,0);for(const i of indices)v.add(new T.Vector3(n.getX(i),n.getY(i),n.getZ(i)));v.normalize();for(const i of indices)n.setXYZ(i,v.x,v.y,v.z)}
 n.needsUpdate=true;return geometry;
}
export function roundedPlate(parent,material,points,width,z=0,{corner=.15,bevel=.04}={}){
 const b=Math.min(bevel,width*.3),g=new T.ExtrudeGeometry(roundedOutline(points,corner),{depth:Math.max(.001,width-2*b),bevelEnabled:b>0,bevelSize:b,bevelThickness:b,bevelSegments:5,curveSegments:8});
 g.translate(0,0,-(width-2*b)/2);polishBevel(g);return add(parent,g,material,0,0,z);
}
export function roundedBlock(parent,material,[w,h,d],position,radius=.12){
 const r=Math.min(radius,w*.47,h*.47,d*.47),b=r*.65;
 const points=[[-w/2+b,-h/2+b],[w/2-b,-h/2+b],[w/2-b,h/2-b],[-w/2+b,h/2-b]];
 const mesh=roundedPlate(parent,material,points,d,0,{corner:r-b,bevel:b});mesh.position.set(...position);return mesh;
}
export function curvedShell(parent,material,points,width,corner=.2){
 const curve=roundedOutline(points,corner,false).getPoints(64),positions=[],indices=[];
 for(const p of curve)positions.push(p.x,p.y,-width/2,p.x,p.y,width/2);
 for(let i=0;i<curve.length-1;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const m=material.clone();m.side=T.DoubleSide;return add(parent,g,m);
}
