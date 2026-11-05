import {HAULER_BODY} from './hauler-body-config.js?build=hotfix-20261106-20';
import {createTruckFillProfile} from './truck-fill-profile.js?build=hotfix-20261106-20';
import {createHeightFines} from './dry-fines.js?build=hotfix-20261106-20';
import {truckSurfaceY} from './truck-contact.js?build=hotfix-20261106-20';
import {chunkBatch} from './chunk-packing.js?build=hotfix-20261106-20';
import {packTruckClasts} from './truck-clasts.js?build=hotfix-20261106-20';
import * as T from '../three.module.js?build=hotfix-20261106-20';
import {GranularGrid} from './granular.js?build=hotfix-20261106-20';
import {ORE} from './material-volume.js?build=hotfix-20261106-20';
export const BED=HAULER_BODY;
// Payload remains 100t; this is the retained model's visual capacity calibration,
// analogous to the compact bucket. Receivers and settled packets use this SAME
// envelope, so stones land on the visible heap rather than disappearing into it.
export const TRUCK_DISPLAY_SCALE=1.5;
export function bedCoordinates(truck,x,z){const dx=x-truck.x,dz=z-truck.z,a=truck.yaw;return {x:Math.cos(a)*dx-Math.sin(a)*dz-BED.centerX,z:Math.sin(a)*dx+Math.cos(a)*dz};}
export function bedWorldPoint(truck,x,y,z){let xx=x+BED.centerX;const tip=truck.tipAngle||0;if(tip){const dx=xx-BED.hingeX,dy=y-BED.hingeY;xx=BED.hingeX+Math.cos(tip)*dx-Math.sin(tip)*dy;y=BED.hingeY+Math.sin(tip)*dx+Math.cos(tip)*dy;}const pitch=truck.pitch||0,roll=truck.roll||0,px=xx*Math.cos(pitch)-y*Math.sin(pitch),py=xx*Math.sin(pitch)+y*Math.cos(pitch),yy=py*Math.cos(roll)-z*Math.sin(roll),zz=py*Math.sin(roll)+z*Math.cos(roll),a=truck.yaw;return {x:truck.x+Math.cos(a)*px+Math.sin(a)*zz,y:(truck.root?.position.y||0)+yy,z:truck.z-Math.sin(a)*px+Math.cos(a)*zz};}
export function makeTruckLoad(material){
 const field=new GranularGrid(BED.width,BED.depth,36,24,{density:ORE.looseDensity,slope:.92,staticSlope:1.2,cohesion:.065,mobility:3.6,rim:BED.settlingRim});
 const geometry=new T.PlaneGeometry(BED.width,BED.depth,48,32);geometry.rotateX(-Math.PI/2);
 const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({visible:false}));mesh.position.set(BED.centerX,BED.floor,0);mesh.castShadow=mesh.receiveShadow=false;mesh.userData.dynamic=true;mesh.visible=false;
 const profile=createTruckFillProfile(BED.width,BED.depth,field.nx,field.nz,BED.rim-BED.floor);
 const fines=createHeightFines(mesh,material,{nx:field.nx,nz:field.nz,x:-BED.width/2,z:-BED.depth/2,dx:BED.width/(field.nx-1),dz:BED.depth/(field.nz-1),depth:.002,closeSides:true,flare:(BED.topDepth-BED.depth)/BED.depth,flareHeight:BED.rim-BED.floor,rimSlope:BED.frontRim-BED.rim,frontStretch:BED.frontStretch,rearStretch:BED.rearStretch});
 // Invert the very same flared surface used by the renderer. Particle
 // contacts and deposition cannot use the old narrow rectangular envelope.
 const displayHeight=(x,z)=>{let xx=(x-(BED.frontStretch-BED.rearStretch)*.5)/(1+(BED.frontStretch+BED.rearStretch)/BED.width),h=profile.height(xx,z*BED.depth/BED.topDepth);const fullU=Math.max(0,Math.min(1,xx/BED.width+.5));if(h>=BED.rim-BED.floor+(BED.frontRim-BED.rim)*fullU)return h;for(let i=0;i<12;i++){const last=h,u=Math.max(0,Math.min(1,xx/BED.width+.5)),f=Math.min(1,Math.max(0,h/(BED.rim-BED.floor+(BED.frontRim-BED.rim)*u)));xx=(x-(BED.frontStretch-BED.rearStretch)*.5*f)/(1+(BED.frontStretch+BED.rearStretch)*f/BED.width);h=profile.height(xx,z/(1+(BED.topDepth-BED.depth)/BED.depth*f));if(Math.abs(h-last)<.0002)break;}return h;};
 const exposedHeight=(x,z,margin=.09)=>{const h=displayHeight(x,z),u=Math.max(0,Math.min(1,x/BED.width+.5)),f=Math.min(1,h/(BED.rim-BED.floor+(BED.frontRim-BED.rim)*u)),half=BED.depth/2+(BED.topDepth-BED.depth)/2*f;if(x< -BED.width/2-BED.rearStretch*f+margin||x>BED.width/2+BED.frontStretch*f-margin||Math.abs(z)>half-margin)return 0;return h;};
 const pieces=chunkBatch(mesh,material,3072,'Packed individual truck rocks',{detail:1});const grains=pieces.mesh;let clock=1,quiet=0,lastForce={x:0,z:0},activity=0;
 function clear(){field.clear();profile.clear();const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,0);p.needsUpdate=true;geometry.computeVertexNormals();mesh.visible=false;pieces.begin();pieces.finish();fines.clear();clock=1;quiet=0;}
 function draw(dt){
  packTruckClasts(pieces,exposedHeight);
  fines.update(profile.heights);
 }
 function update(dt,force={x:0,z:0}){
  if(field.mass<=1e-8){if(mesh.visible)clear();return 0}mesh.visible=true;clock+=dt;
  if(Math.abs(force.x-lastForce.x)+Math.abs(force.z-lastForce.z)>.01)quiet=0;
  lastForce={...force};if(quiet>1.3&&Math.hypot(force.x,force.z)<.01)return 0;
  const movement=field.step(dt,null,{force,spill:true});profile.update(field);activity=movement/Math.max(dt,.001);quiet=movement>1e-7?0:quiet+dt;
  if(clock>=1/30){draw(clock);clock=0;}return activity;
 }
 // Rear-to-front discharge removes actual cells, rather than fading an intact
 // full heap. The tipping bed drives the exposed face towards its open tail.
 function discharge(requested){if(requested>0&&field.mass>0)profile.beginDischarge(field);let left=Math.min(requested,field.mass),removed=0;for(let col=0;col<field.nx&&left>1e-10;col++){
  let available=0;for(let row=0;row<field.nz;row++)available+=field.heights[row*field.nx+col]*field.area*field.density;
  if(available<=0)continue;const amount=Math.min(left,available),fraction=amount/available;for(let row=0;row<field.nz;row++){const i=row*field.nx+col;field.heights[i]*=1-fraction;}left-=amount;removed+=amount;
 }if(removed>0){field.mass=Math.max(0,field.mass-removed);field.revision++;quiet=0;clock=1;}return removed;}
 return {field,mesh,grains,pieces,fines,profile,displayHeight,clear,update,discharge,get activity(){return activity},drainSpills:()=>field.drainSpills(),deposit(truck,x,z,mass){const p=bedCoordinates(truck,x,z);quiet=0;return field.depositDry(p.x,p.z,mass,{repose:.92,aspect:1.5})},surface(truck,x,z){const p=bedCoordinates(truck,x,z);return truckSurfaceY(truck,p.x+BED.centerX,BED.floor+displayHeight(p.x,p.z),p.z)-(truck.root?.position.y||0)},gradient(truck,x,z){const e=.08;return {x:(this.surface(truck,x+e,z)-this.surface(truck,x-e,z))/(2*e),z:(this.surface(truck,x,z+e)-this.surface(truck,x,z-e))/(2*e)}}};
}
