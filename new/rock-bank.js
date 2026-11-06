import * as T from '../three.module.js?build=intro-20261106-27';
import {chunkBatch,stoneKey,stoneRandom} from './chunk-packing.js?build=intro-20261106-27';
import {createHeightFines} from './dry-fines.js?build=intro-20261106-27';
// Replace exposed snow/terrain triangles with the deformed dry fine fraction
// and embedded fracture clasts, in both colour and depth passes.
export function maskExposedBank(geometry,exposure,offsetX=-7.5,bounds=null){
 let cache=geometry.userData.rockMask;if(!cache){const source=geometry.index.array.slice();cache=geometry.userData.rockMask={source,indices:new source.constructor(source.length),flags:new Uint8Array(geometry.attributes.position.count)};geometry.setIndex(new T.BufferAttribute(cache.indices,1));}
 const p=geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)+offsetX,z=p.getZ(i);if(!bounds||x>=bounds.minX-.5&&x<=bounds.maxX+.5&&z>=bounds.minZ-.5&&z<=bounds.maxZ+.5)cache.flags[i]=exposure(x,z)>.045?1:0;}
 let count=0;for(let i=0;i<cache.source.length;i+=3){const a=cache.source[i],b=cache.source[i+1],c=cache.source[i+2];if(cache.flags[a]||cache.flags[b]||cache.flags[c])continue;cache.indices[count++]=a;cache.indices[count++]=b;cache.indices[count++]=c;}
 geometry.setDrawRange(0,count);geometry.index.clearUpdateRanges();geometry.index.addUpdateRange(0,count);geometry.index.needsUpdate=true;return count;
}
export function createRockBank(scene,material,height,exposure,volumeMask=null,solid=null){
 const pieces=chunkBatch(scene,material,12288,'Fractured stone in the working bank'),cell=.25,nx=140,nz=55,heights=new Float32Array(nx*nz),cut=new Uint8Array(nx*nz),holes=new Uint8Array(nx*nz);
 const fines=createHeightFines(scene,material,{nx,nz,x:-25+cell/2,z:-6.8+cell/2,dx:cell});
 const floorMaterial=material.clone();floorMaterial.vertexColors=false;floorMaterial.onBeforeCompile=material.onBeforeCompile;floorMaterial.customProgramCacheKey=material.customProgramCacheKey;const floor=new T.Mesh(new T.PlaneGeometry(36,15),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.set(-7.5,.004,0);floor.receiveShadow=true;floor.name='Solid quarry floor below the bank';scene.add(floor);
 // Variable fracture blocks occupy the same height field. A large clast that
 // intersects a new cut is represented by its smaller fragments; no collision
 // or reserve is inferred from these visual instances.
 const metrics={coarse:0,medium:0,fines:0};
 const addStone=(key,x,y,z,size)=>{if(volumeMask?.(x,z)&&solid&&!solid(x,y,z))return;pieces.add(key,x,y,z,size);};
 function update(bounds=null){pieces.begin();metrics.coarse=metrics.medium=metrics.fines=0;
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=-25+(i+.5)*cell,z=-6.8+(j+.5)*cell,k=j*nx+i;if(bounds&&(x<bounds.minX-.6||x>bounds.maxX+.6||z<bounds.minZ-.6||z>bounds.maxZ+.6))continue;heights[k]=Math.max(0,height(x,z));cut[k]=exposure(x,z)>.035?1:0;holes[k]=volumeMask?.(x,z)?1:0;}
  for(let j=0;j<nz;j+=3)for(let i=0;i<nx;i+=3){
   let exposed=false,maximum=0,minimum=Infinity,neighbor=Infinity;
   for(let dz=-1;dz<=3;dz++)for(let dx=-1;dx<=3;dx++){
    const xx=i+dx,zz=j+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const k=zz*nx+xx;exposed||=!!cut[k];neighbor=Math.min(neighbor,heights[k]);
    if(dx>=0&&dx<3&&dz>=0&&dz<3){maximum=Math.max(maximum,heights[k]);minimum=Math.min(minimum,heights[k]);}
   }
   if(!exposed||maximum<.035)continue;
   for(let layer=0;layer*cell<maximum;layer+=3){
    if((layer+3)*cell<neighbor-.25)continue;
    const parent=stoneKey(i+2400,layer,j),whole=(layer+2.2)*cell<=minimum+.025;
    if(whole&&stoneRandom(parent,30)<.20){
     const size=.75*(1.02+stoneRandom(parent,31)*.2),x=-25+(i+1.5)*cell+(stoneRandom(parent,32)-.5)*.17,z=-6.8+(j+1.5)*cell+(stoneRandom(parent,33)-.5)*.17,y=(layer+1.2)*cell+(stoneRandom(parent,34)-.5)*.10;
     addStone(parent,x,y,z,size);metrics.coarse++;continue;
    }
    for(let dz=0;dz<3&&j+dz<nz;dz++)for(let dx=0;dx<3&&i+dx<nx;dx++)for(let dy=0;dy<3;dy++){
     const xx=i+dx,zz=j+dz,h=heights[zz*nx+xx],level=layer+dy,key=stoneKey(xx+2400,level,zz),base=level*cell;if(base>h-.025)continue;
     const size=cell*(.58+stoneRandom(key,31)*.78),x=-25+(xx+.5)*cell+(stoneRandom(key,9)-.5)*.20,z=-6.8+(zz+.5)*cell+(stoneRandom(key,10)-.5)*.20,y=base+cell*(.32+stoneRandom(key,11)*.26);
     // The continuous fine mass already fills the interior. Submit clasts only
     // near the top or a newly exposed side; buried stones cannot be seen.
     const skin=Math.min(h,heights[zz*nx+Math.max(0,xx-1)],heights[zz*nx+Math.min(nx-1,xx+1)],heights[Math.max(0,zz-1)*nx+xx],heights[Math.min(nz-1,zz+1)*nx+xx]);if(y+size*.6<skin-.025)continue;
     if(y>h+.03||stoneRandom(key,21)>.48)continue;addStone(key,x,y,z,size);metrics.medium++;
     if(stoneRandom(key,35)<.24){const tiny=stoneKey(xx+4517,level,zz+139);addStone(tiny,x+(stoneRandom(tiny,1)-.5)*.19,Math.min(h-.012,base+.035),z+(stoneRandom(tiny,2)-.5)*.19,.055+stoneRandom(tiny,3)*.06);metrics.fines++;}
    }
   }
  }
  // A sparse, irregular surface layer provides larger embedded fracture faces.
  // Its centres are inset along the surface normal, so it never floats over a
  // smooth skin. The bulk beneath remains the same finite scalar volume.
  for(let j=1;j<nz-1;j+=2)for(let i=1;i<nx-1;i+=2){
   const key=stoneKey(i+8250,0,j+1304);if(stoneRandom(key,0)>.70)continue;
   const x=-25+(i+.5)*cell+(stoneRandom(key,1)-.5)*.44,z=-6.8+(j+.5)*cell+(stoneRandom(key,2)-.5)*.44,h=height(x,z);if(h<.05||exposure(x,z)<.035)continue;
   const size=stoneRandom(key,3)<.12?.95+stoneRandom(key,4)*.50:.34+stoneRandom(key,4)*.49,sx=(heights[j*nx+i+1]-heights[j*nx+i-1])/(cell*2),sz=(heights[(j+1)*nx+i]-heights[(j-1)*nx+i])/(cell*2),inv=1/Math.hypot(sx,1,sz),inset=size*(.14+stoneRandom(key,5)*.06);
   addStone(key,x+sx*inv*inset,h-inv*inset,z+sz*inv*inset,size);if(size>.75)metrics.coarse++;else metrics.medium++;
  }
  // Reuse the sampled, already-deformed bank. The small dry fraction fills
  // voids under exposed clasts and follows every cut; it cannot refill a void.
  fines.update(heights,cut,1,holes);return pieces.finish();
 }return {pieces,fines,floor,update,metrics};
}
