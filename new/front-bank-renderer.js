import * as T from '../three.module.js?build=career-20261106-18';
import {aggregateMaterial} from './dry-fines.js?build=career-20261106-18';
import {chunkBatch,stoneKey,stoneRandom} from './chunk-packing.js?build=career-20261106-18';
// One reused surface buffer for all current undercuts. Ordinary settled terrain
// returns to the existing height mesh; interior walls/ceilings are real faces.
export function createFrontBankRenderer(scene,source,bank){
 const capacity=196608,geometry=new T.BufferGeometry(),positions=new Float32Array(capacity*3),normals=new Float32Array(capacity*3),colors=new Float32Array(capacity*3);
 for(const [name,array]of[['position',positions],['normal',normals],['color',colors]])geometry.setAttribute(name,new T.BufferAttribute(array,3).setUsage(T.DynamicDrawUsage));
 const material=aggregateMaterial(source);material.side=T.DoubleSide;material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
 const mesh=new T.Mesh(geometry,material);mesh.name='Volumetric working cut: walls, floor and unsupported roof';mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.visible=false;mesh.userData.dynamic=true;scene.add(mesh);
 const clasts=chunkBatch(scene,source,2048,'Embedded fragments in new volumetric fracture faces'),neighbours=new Float64Array(12);let used=0,last=-1,overflow=0;
 function vertex(x,y,z,nx,ny,nz){if(used>=capacity){overflow++;return;}const k=used++*3,shade=.59+Math.sin(x*37.2+z*31.7+y*11.3)*.035;positions[k]=x;positions[k+1]=y;positions[k+2]=z;normals[k]=nx;normals[k+1]=ny;normals[k+2]=nz;colors[k]=shade;colors[k+1]=shade*.97;colors[k+2]=shade*.9;}
 function quad(ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz,nx,ny,nz){vertex(ax,ay,az,nx,ny,nz);vertex(bx,by,bz,nx,ny,nz);vertex(cx,cy,cz,nx,ny,nz);vertex(ax,ay,az,nx,ny,nz);vertex(cx,cy,cz,nx,ny,nz);vertex(dx,dy,dz,nx,ny,nz);}
 function face(x,z,dx,dz,lo,hi,side){if(hi-lo<1e-7)return;
  if(side===0)quad(x,lo,z,x,lo,z+dz,x,hi,z+dz,x,hi,z,-1,0,0);
  if(side===1)quad(x+dx,lo,z+dz,x+dx,lo,z,x+dx,hi,z,x+dx,hi,z+dz,1,0,0);
  if(side===2)quad(x+dx,lo,z,x,lo,z,x,hi,z,x+dx,hi,z,0,0,-1);
  if(side===3)quad(x,lo,z+dz,x+dx,lo,z+dz,x+dx,hi,z+dz,x,hi,z+dz,0,0,1);
  const key=stoneKey(Math.round(x/bank.dx),Math.round(lo*13)+side*81,Math.round(z/bank.dz));if(hi-lo>.18&&stoneRandom(key,0)<.13){const size=.12+stoneRandom(key,1)*.15,xx=x+dx*.5+(side===0?-dx*.5:side===1?dx*.5:0),zz=z+dz*.5+(side===2?-dz*.5:side===3?dz*.5:0);clasts.add(key,xx,(lo+hi)/2,zz,size);}
 }
 function box(x,z,dx,dz,lo,hi,top){
  const smooth=top&&!bank.detailedAt(x+dx*.5,z+dz*.5),a=smooth?bank.heightAt(x,z):hi,b=smooth?bank.heightAt(x+dx,z):hi,c=smooth?bank.heightAt(x+dx,z+dz):hi,d=smooth?bank.heightAt(x,z+dz):hi;
  quad(x,a,z,x,d,z+dz,x+dx,c,z+dz,x+dx,b,z,0,1,0);
  if(lo>(bank.field.base?.[bank.index(x+dx*.5,z+dz*.5)]||0)+.001)quad(x,lo,z,x+dx,lo,z,x+dx,lo,z+dz,x,lo,z+dz,0,-1,0);
  for(let side=0;side<4;side++){const xx=x+dx*.5+(side===0?-dx:side===1?dx:0),zz=z+dz*.5+(side===2?-dz:side===3?dz:0),n=bank.segmentsAt(xx,zz,neighbours);let cursor=lo;for(let j=0;j<n&&cursor<hi;j++){const l=neighbours[j*2],h=neighbours[j*2+1];if(l>cursor)face(x,z,dx,dz,cursor,Math.min(hi,l),side);cursor=Math.max(cursor,h);}if(cursor<hi)face(x,z,dx,dz,cursor,hi,side);}
 }
 function update(){if(last===bank.revision)return;last=bank.revision;used=overflow=0;clasts.begin();bank.visitBoxes(box);clasts.finish();geometry.setDrawRange(0,Math.min(used,capacity));mesh.visible=used>0;for(const attr of Object.values(geometry.attributes)){attr.clearUpdateRanges();attr.addUpdateRange(0,Math.min(used,capacity)*3);attr.needsUpdate=true;}return used;}
 return {mesh,clasts,update,metrics:()=>({vertices:used,overflow,clasts:clasts.mesh.count})};
}
