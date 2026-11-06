import * as T from '../three.module.js?build=lighting-20261106-26';
import {oreGeometry} from './ore-geometry.js?build=lighting-20261106-26';
export function stoneKey(x,y,z){return (Math.imul(x+1024,73856093)^Math.imul(y+1024,19349663)^Math.imul(z+1024,83492791))>>>0;}
export function stoneRandom(key,salt=0){let n=(key+Math.imul(salt+1,2654435761))>>>0;n=Math.imul(n^n>>>16,2246822507);n=Math.imul(n^n>>>13,3266489909);return ((n^n>>>16)>>>0)/4294967296;}
// Stable lithology/shape choices, shared by every batch. These are all bounded
// by the size envelope supplied by the bucket/bed packers; large chunks cannot
// silently grow through the steel walls when the view or fill changes.
const CLASTS=[[1.04,.91,.99],[1.11,.52,.94],[.60,.78,1.12],[1.08,.72,.68],[.81,1.08,.90],[1.10,.84,.54]];
const TONES=[[.73,.75,.77],[.50,.52,.54],[.73,.68,.59],[.77,.75,.69],[.83,.84,.82],[.60,.60,.57]];
// Bounded immutable fracture transforms: reuse rotations/colours instead of
// rebuilding Object3D matrices and Color objects for every stone every update.
// 1024 variants (six lithologies and clast families) occupy less than 80 KiB.
const variants=(()=>{const matrices=new Float32Array(1024*16),colors=new Float32Array(1024*3),dummy=new T.Object3D();for(let key=0;key<1024;key++){const shape=CLASTS[Math.floor(stoneRandom(key,16)*CLASTS.length)],r=.43+stoneRandom(key,1)*.065;dummy.rotation.set(stoneRandom(key,2)*6.283,stoneRandom(key,3)*6.283,stoneRandom(key,4)*6.283);dummy.scale.set(r*shape[0]*(.95+stoneRandom(key,5)*.08),r*shape[1]*(.95+stoneRandom(key,6)*.08),r*shape[2]*(.95+stoneRandom(key,7)*.08));dummy.updateMatrix();matrices.set(dummy.matrix.elements,key*16);const tone=TONES[Math.floor(stoneRandom(key,17)*TONES.length)],shade=.91+stoneRandom(key,8)*.15;for(let i=0;i<3;i++)colors[key*3+i]=tone[i]*shade;}return {matrices,colors};})();
// Fixed-shape, fixed-size pieces. Fill changes occupancy, never squeezes a skin.
export function chunkBatch(parent,material,capacity,name,{detail=0}={}){
 const mesh=new T.InstancedMesh(oreGeometry(detail),material,capacity),keys=[];mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.instanceColor=new T.InstancedBufferAttribute(new Float32Array(capacity*3),3).setUsage(T.DynamicDrawUsage);mesh.count=0;mesh.visible=false;parent.add(mesh);let count=0,omitted=0;
 function begin(){count=omitted=0;keys.length=0;}
 function add(key,x,y,z,size){if(count>=capacity){omitted++;return}const variant=(key^(key>>>10))&1023,from=variant*16,to=count*16,matrix=mesh.instanceMatrix.array;for(let i=0;i<12;i++)matrix[to+i]=variants.matrices[from+i]*size;matrix[to+12]=x;matrix[to+13]=y;matrix[to+14]=z;matrix[to+15]=1;for(let i=0;i<3;i++)mesh.instanceColor.array[count*3+i]=variants.colors[variant*3+i];keys.push(key);count++;}
 function finish(){mesh.count=count;mesh.visible=count>0;if(count){mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,count*16);mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.clearUpdateRanges();mesh.instanceColor.addUpdateRange(0,count*3);mesh.instanceColor.needsUpdate=true;}return count;}
 return {mesh,keys,begin,add,finish,get omitted(){return omitted}};
}
// Exposed clasts are embedded in the separate dense fine-fraction surface.
// Buried layers can be skipped; an open rear keeps its exposed cross-section.
export function packHeightField(batch,{nx,nz,cell,x=0,z=0,floor=()=>0,height,seed=0,packing=1,layers=Infinity,openRear=false,indexX=0,indexZ=0}){
 batch.begin();const heights=batch.heightCache?.length===nx*nz?batch.heightCache:(batch.heightCache=new Float32Array(nx*nz)),bottoms=batch.floorCache?.length===nx*nz?batch.floorCache:(batch.floorCache=new Float32Array(nx*nz));
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const wx=x+(i+.5)*cell,wz=z+(j+.5)*cell,k=j*nx+i;heights[k]=Math.max(0,height(wx,wz));bottoms[k]=heights[k]>.002?floor(wx,wz):0;}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,h=heights[k];if(h<.002)continue;const wx=x+(i+.5)*cell,wz=z+(j+.5)*cell,base=bottoms[k],neighbor=Math.min(i?heights[k-1]:0,i<nx-1?heights[k+1]:0,j?heights[k-nx]:0,j<nz-1?heights[k+nx]:0),top=Math.max(0,Math.ceil(h/cell)-1),low=Math.max(0,Math.min(top-1,Math.floor(neighbor/cell)-1));
  for(let layer=openRear&&i===0?low:Math.max(low,top-layers+1);layer<=top;layer++){
   const thin=h<cell*.45,key=stoneKey(i+indexX+seed,thin?-1:layer,j+indexZ),grade=stoneRandom(key,18),size=thin?cell*.34:cell*packing*(grade<.12?.61:grade>.91?1.34:.86+stoneRandom(key,19)*.27),px=wx+(stoneRandom(key,9)-.5)*cell*.64-(openRear&&i===0?cell*.25:0),pz=wz+(stoneRandom(key,10)-.5)*cell*.64,py=thin?base+size*.41:base+(layer+.82)*cell+(stoneRandom(key,20)-.5)*cell*.12;
   batch.add(key,px,py,pz,size);
   if(packing>1&&layer===top&&!thin){const topKey=stoneKey(i+indexX+seed+5551,layer,j+indexZ+332);batch.add(topKey,wx+cell*.30+(stoneRandom(topKey,9)-.5)*cell*.20,base+(layer+.81)*cell,wz-cell*.30+(stoneRandom(topKey,10)-.5)*cell*.20,cell*(.50+stoneRandom(topKey,1)*.15));}
   // Interstitial small fragments interrupt the column rhythm. Their keys and
   // coordinates depend only on the cell/layer, never the changing surface.
   if(!thin&&grade<.85){const fineKey=stoneKey(i+indexX+seed+1973,layer,j+indexZ+719),fine=cell*(.32+stoneRandom(fineKey,1)*.20);batch.add(fineKey,wx+(stoneRandom(fineKey,9)-.5)*cell*.86,base+(layer+.88)*cell,pz+(stoneRandom(fineKey,10)-.5)*cell*.24,fine);}
  }
 }
 return batch.finish();
}
