import {createHeightFines} from './dry-fines.js?build=traffic-20261106-25';
import {chunkBatch,stoneKey,stoneRandom} from './chunk-packing.js?build=traffic-20261106-25';
import {createChargeProfile,chargeSurfacePoint,CHARGE_GRID,RIM_CENTER,RIM_UP,RIM_ALONG} from './heaped-charge.js?build=traffic-20261106-25';
import * as T from '../three.module.js?build=traffic-20261106-25';
import {bucketUp} from './charge-shape.js?build=traffic-20261106-25';
import {DryChargeSurface} from './dry-material.js?build=traffic-20261106-25';
import {BUCKET_CONTAINER,BUCKET_INNER_WIDTH,BUCKET_SHELL_DROP} from './material-volume.js?build=traffic-20261106-25';
// A fixed dry packing is built once. Filling only exposes occupied cells;
// changing the fill must never inflate a stone or shuffle the previous layer.
const PACKING=(()=>{
 const columns=[],cell=.16;
 for(let iz=0;iz<9;iz++)for(let ix=0;ix<14;ix++){
  const along=(ix-6.5)*cell,z=(iz-4)*cell,stones=[];
  // The old thirteen layers truncated high crowns independently of payload.
  for(let iy=0;iy<20;iy++){
   const key=stoneKey(ix,iy,iz),rise=-1.28+(iy+.5)*cell+(stoneRandom(key,12)-.5)*.018;
   const u=along+(((iy+iz)%2)?.018:-.018)+(stoneRandom(key,13)-.5)*.04,zz=z+(((iy+ix)%2)?.012:-.012)+(stoneRandom(key,14)-.5)*.035;
   function add(key,height,u,zz,size){
    const point=RIM_CENTER.map((v,i)=>v+RIM_ALONG[i]*u+RIM_UP[i]*height+(i===2?zz:0));let margin=Math.min(BUCKET_INNER_WIDTH/2-Math.abs(zz),CHARGE_GRID.width/2-Math.abs(u));
    if(height<0)for(let side=0;side<BUCKET_CONTAINER.length-1;side++){
     const a=BUCKET_CONTAINER[side],b=BUCKET_CONTAINER[side+1],dx=b[0]-a[0],dy=b[1]-a[1];
     margin=Math.min(margin,-(dx*(point[1]+BUCKET_SHELL_DROP-a[1])-dy*(point[0]-a[0]))/Math.hypot(dx,dy));
    }
    if(margin<.025)return;
    stones.push({key,rise:height,x:point[0],y:point[1],z:point[2],size:Math.min(size,margin*1.65)});
   }
   const coarse=ix%4===1&&iy%3===1&&iz%3===1;
   add(key,rise,u,zz,cell*(coarse?1.45:.94+stoneRandom(key,15)*.34));
   const fine=stoneKey(ix+2189,iy,iz+937),small=stoneKey(ix+4131,iy,iz+1859);
   add(fine,rise+.065,u+.055,zz+.055,cell*(.50+stoneRandom(fine,15)*.16));
   add(small,rise+.095,u-.045,zz-.055,cell*(.36+stoneRandom(small,15)*.14));
  }
  stones.sort((a,b)=>a.rise-b.rise);
  if(stones.length)columns.push({along,z,stones});
 }
 return columns;
})();
export function makeBucketLoad(material){
 const group=new T.Group();group.name='Gravity-settled bucket material';group.userData.dynamic=true;
 const bulk=new T.Mesh(new T.BufferGeometry(),material);bulk.geometry.setAttribute('position',new T.Float32BufferAttribute([],3));bulk.visible=false;bulk.name='Hidden nominal-capacity envelope';group.add(bulk);
 const {nx,nz,width,depth}=CHARGE_GRID,fines=createHeightFines(group,material,{nx,nz,x:-width/2,z:-depth/2,dx:width/(nx-1),dz:depth/(nz-1),signed:true,depth:.002});
 const basis=new T.Matrix4().makeBasis(new T.Vector3(...RIM_ALONG),new T.Vector3(...RIM_UP),new T.Vector3(0,0,1));fines.mesh.quaternion.setFromRotationMatrix(basis);fines.mesh.position.set(...RIM_CENTER);
 const profile=createChargeProfile();
 const pieces=chunkBatch(group,material,2048,'Individual fixed bucket rocks',{detail:1}),stones=pieces.mesh;
 const packed=new DryChargeSurface();let clock=1,shape=null,lastPayload=-1,needsDraw=true;
 function update(s,dt=1/30){
  const fill=Math.max(0,Math.min(1,(s.visualPayload??s.payload)));group.visible=fill>.00001;if(!group.visible){lastPayload=0;packed.reset();pieces.begin();pieces.finish();shape=null;fines.clear();needsDraw=true;return}
  clock+=dt;needsDraw=packed.update(bucketUp(s),fill,dt)||needsDraw||Math.abs(fill-lastPayload)>.0001;
  if(!needsDraw||clock<1/30&&Math.abs(fill-lastPayload)<.02)return;clock=0;lastPayload=fill;needsDraw=false;shape=profile.update(fill,packed.normal);
  fines.update(shape.heights,shape.occupied);
  pieces.begin();
  for(const column of PACKING){
   const top=chargeSurfacePoint(shape,column.along,column.z);if(!top)continue;
   const ceiling=top.point.reduce((sum,v,i)=>sum+(v-RIM_CENTER[i])*RIM_UP[i],0);
   for(const p of column.stones){if(p.rise>ceiling+.015)break;if(p.rise<ceiling-.16)continue;pieces.add(p.key,p.x,p.y,p.z,p.size);}
  }
  if(!pieces.keys.length&&fill>0){const p=chargeSurfacePoint(shape,0,0);if(p)pieces.add(0,...p.point,.04)}pieces.finish();

 }
 group.visible=false;return {group,bulk,stones,pieces,fines,update,entryPoint(z=0,out=new T.Vector3()){const surface=shape&&chargeSurfacePoint(shape,-.18,Math.max(-.6,Math.min(.6,z)));return surface?out.set(...surface.point).addScaledVector(new T.Vector3(...surface.normal),.035):out.set(-.35,-1.75,z*.8)},get shape(){return shape}};
}
