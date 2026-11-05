import {unit} from './charge-shape.js?build=career-20261106-18';
import {BUCKET_CONTAINER,BUCKET_INNER_WIDTH,BUCKET_SHELL_DROP,BUCKET_VOLUME} from './material-volume.js?build=career-20261106-18';
import {gridVolumeWeights,solveFilledSurface,sampleGrid} from './fill-profile.js?build=career-20261106-18';
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const a=BUCKET_CONTAINER[0],b=BUCKET_CONTAINER.at(-1),length=Math.hypot(a[0]-b[0],a[1]-b[1]);
export const RIM_UP=[-(a[1]-b[1])/length,(a[0]-b[0])/length,0],RIM_ALONG=[RIM_UP[1],-RIM_UP[0],0],RIM_CENTER=[(a[0]+b[0])/2,(a[1]+b[1])/2-BUCKET_SHELL_DROP,0];
export const CHARGE_GRID={nx:25,nz:17,width:length,depth:BUCKET_INNER_WIDTH};
const {nx,nz,width,depth}=CHARGE_GRID,weights=gridVolumeWeights(nx,nz,width,depth),floors=new Float64Array(nx*nz),ceilings=new Float64Array(nx*nz);
export function chargePoint(along,rise,z){return RIM_CENTER.map((v,i)=>v+RIM_ALONG[i]*along+RIM_UP[i]*rise+(i===2?z:0));}
function floorAt(u){const p=chargePoint(u,0,0);let low=-Infinity;for(let i=0;i<BUCKET_CONTAINER.length-1;i++){const a=BUCKET_CONTAINER[i],b=BUCKET_CONTAINER[i+1],dx=b[0]-a[0],dy=b[1]-a[1],distance=dx*(p[1]+BUCKET_SHELL_DROP-a[1])-dy*(p[0]-a[0]),den=dx*RIM_UP[1]-dy*RIM_UP[0];if(den< -1e-8)low=Math.max(low,-distance/den);}return Math.min(0,Number.isFinite(low)?low:0);}
let capacity=0;for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,u=(i/(nx-1)-.5)*width,z=(j/(nz-1)-.5)*depth,t=i/(nx-1),side=z/(depth/2);floors[k]=floorAt(u);const crown=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72)*Math.pow(Math.max(0,1-side*side),.78);ceilings[k]=crown*(1+.045*Math.sin(u*9+z*6)+.025*Math.sin(u*17-z*11));capacity+=(ceilings[k]-floors[k])*weights[k];}
// Nominal capacity is independent of this compact retained model's calibrated
// display volume; FULL means its ENTIRE clear bowl plus the crown, never a tall
// crown obtained by subtracting ore from the bottom of the bowl.
export const BUCKET_RENDER_VOLUME=capacity;
export function createChargeProfile(){
 const heights=new Float64Array(nx*nz),guide=new Float64Array(nx*nz),occupied=new Uint8Array(nx*nz);let shape=null;
 function update(fill,normal=[0,1,0]){
  fill=Math.max(0,Math.min(1,fill));normal=unit(normal);const vertical=Math.max(.24,dot(normal,RIM_UP)),tilt=dot(normal,RIM_ALONG);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,u=(i/(nx-1)-.5)*width,z=(j/(nz-1)-.5)*depth;guide[k]=-(tilt*u+normal[2]*z)/vertical;}
  const volume=solveFilledSurface(guide,floors,ceilings,weights,fill*capacity,heights);let heapVolume=0;for(let i=0;i<heights.length;i++){occupied[i]=heights[i]-floors[i]>.00005?1:0;heapVolume+=Math.max(0,heights[i])*weights[i];}
  let triangles=null,faces=null;
  const point=(i,j,h=heights[j*nx+i])=>chargePoint((i/(nx-1)-.5)*width,h,(j/(nz-1)-.5)*depth);
  shape={fill,normal,heights,floors,ceilings,occupied,weights,volume,heapVolume,payloadVolume:volume/capacity*BUCKET_VOLUME,
   get surfaceTriangles(){if(!triangles){triangles=[];if(fill>0)for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=point(i,j),b=point(i+1,j),c=point(i,j+1),d=point(i+1,j+1);triangles.push([a,c,b],[b,c,d]);}}return triangles;},
   get faces(){if(!faces){faces=[...this.surfaceTriangles];if(fill>0){for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=point(i,j,floors[j*nx+i]),b=point(i+1,j,floors[j*nx+i+1]),c=point(i,j+1,floors[(j+1)*nx+i]),d=point(i+1,j+1,floors[(j+1)*nx+i+1]);faces.push([a,b,c],[b,d,c]);}const ring=[];for(let i=0;i<nx;i++)ring.push([i,0]);for(let j=1;j<nz;j++)ring.push([nx-1,j]);for(let i=nx-2;i>=0;i--)ring.push([i,nz-1]);for(let j=nz-2;j>0;j--)ring.push([0,j]);for(let n=0;n<ring.length;n++){const[i,j]=ring[n],[ii,jj]=ring[(n+1)%ring.length];faces.push([point(i,j),point(ii,jj),point(ii,jj,floors[jj*nx+ii]),point(i,j,floors[j*nx+i])]);}}}return faces;},
   get surface(){return this.surfaceTriangles.flat();}
  };return shape;
 }return {update,get shape(){return shape}};
}
export function heapedChargeShape(fill,normal=[0,1,0]){return createChargeProfile().update(fill,normal);}
export function chargeSurfacePoint(shape,along,z){if(!shape||Math.abs(along)>width/2||Math.abs(z)>depth/2)return null;const h=sampleGrid(shape.heights,nx,nz,width,depth,along,z),e=.025,du=(sampleGrid(shape.heights,nx,nz,width,depth,along+e,z)-sampleGrid(shape.heights,nx,nz,width,depth,along-e,z))/(2*e),dz=(sampleGrid(shape.heights,nx,nz,width,depth,along,z+e)-sampleGrid(shape.heights,nx,nz,width,depth,along,z-e))/(2*e);return {point:chargePoint(along,h,z),normal:unit(RIM_UP.map((v,i)=>v-RIM_ALONG[i]*du-(i===2?dz:0)))};}
