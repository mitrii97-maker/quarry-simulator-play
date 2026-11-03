import {aggregateMaterial} from './dry-fines.js';
import {industrialFinish} from './industrial-finish.js';
import {oreGeometry} from './ore-geometry.js';
import {cutToothSweep} from './tooth-sweep.js';
import {FrontBank} from './front-bank.js';
import {createFrontBankRenderer} from './front-bank-renderer.js';
import {createRockBank,maskExposedBank} from './rock-bank.js';
import {chunkBatch,packHeightField} from './chunk-packing.js';
import {quarryOutcrops} from './landscape-detail.js';
import {updateHeightPatch,heightMeshSample} from './height-patch.js';
import {GranularGrid} from './granular.js';
import {terrainWinter,snowOnRock} from './winter-materials.js';
import {levelState,setLevelReserve} from './levels.js';
import {ORE,BUCKET_CUT_HALF_WIDTH} from './material-volume.js';
import {dumpGround} from './dump-layout.js';
import * as T from '../three.module.js';
import {V,add,block} from './geometry.js';
import {terrainMaps} from '../materials.js';
import {batchMeshes} from '../batching.js';
const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const field=new GranularGrid(35,13.6,140,68,{density:ORE.bankDensity,slope:1.06,staticSlope:1.38,cohesion:.09,mobility:2.0});
field.toothResolution=8;
const initialHeights=new Float64Array(140*68);
field.base=new Float64Array(field.heights.length);
const frontBank=new FrontBank(field,{offsetX:-7.5});
const initialSampler={width:field.width,depth:field.depth,nx:field.nx,nz:field.nz,heights:initialHeights,heightAt:GranularGrid.prototype.heightAt};
const floorSampler={...initialSampler,heights:field.base};
export const LOOSE_AREA={width:104,depth:80,x:4,z:-12,nx:260,nz:200};
const loose=new GranularGrid(LOOSE_AREA.width,LOOSE_AREA.depth,LOOSE_AREA.nx,LOOSE_AREA.nz,{density:ORE.looseDensity,slope:.84,staticSlope:1.16,cohesion:.075,mobility:2.5});
loose.base=new Float64Array(loose.heights.length);
// Provenance is a passive height tag: ore already tucked by the blade must not
// be selected as a new spill on the next pass. It follows real cell transfers.
const tucked=new Float64Array(loose.heights.length);let tuckedVolume=0;
function clampTucked(x,z,radius){if(tuckedVolume<=1e-12)return;const b=loose.bounds({x:x-LOOSE_AREA.x,z:z-LOOSE_AREA.z,radius});for(let row=b.z0;row<=b.z1;row++)for(let col=b.x0;col<=b.x1;col++){const i=row*loose.nx+col,excess=Math.max(0,tucked[i]-loose.heights[i]);if(excess){tucked[i]-=excess;tuckedVolume-=excess*loose.area;}}}
function moveTucked(from,to,volume){const h=volume/loose.area,old=loose.heights[from]+h,part=Math.min(tucked[from],h*tucked[from]/Math.max(1e-12,old));tucked[from]-=part;tucked[to]+=part;}
const tuckedSampler={width:loose.width,depth:loose.depth,nx:loose.nx,nz:loose.nz,heights:tucked,heightAt:GranularGrid.prototype.heightAt};
export function ungradedHeight(x,z){return Math.max(0,looseHeight(x,z)-tuckedSampler.heightAt(x-LOOSE_AREA.x,z-LOOSE_AREA.z));}
export function ungradedMass(){return Math.max(0,loose.mass-tuckedVolume*loose.density);}

const activeMaterial=new Map();let materialClock=0,materialDirty=false,bankBounds=null,looseBounds=null;
function markMesh(kind,x,z,radius){const old=kind==='bank'?bankBounds:looseBounds;if(old){old.minX=Math.min(old.minX,x-radius);old.maxX=Math.max(old.maxX,x+radius);old.minZ=Math.min(old.minZ,z-radius);old.maxZ=Math.max(old.maxZ,z+radius);}else{const next={minX:x-radius,maxX:x+radius,minZ:z-radius,maxZ:z+radius};if(kind==='bank')bankBounds=next;else looseBounds=next;}}

function wakeMaterial(x,z,kind){if(kind==='loose')clampTucked(x,z,4.4);const cx=Math.floor(x/4)*4+2,cz=Math.floor(z/4)*4+2,key=kind+cx+','+cz,old=activeMaterial.get(key);if(old)old.time=kind==='bank'?1.1:1.6;else activeMaterial.set(key,{x:cx,z:cz,radius:4.2,kind,time:kind==='bank'?1.1:1.6});materialDirty=true;markMesh(kind,x,z,4.3);}
export function digZone(x,z){return x> -25&&x<10&&Math.abs(z)<6.8}
// Two continuous working terraces, in metres. Their dimensions determine the
// reserve, rather than scaling a fixed 1000 tonnes into a small isolated heap.
function benchUnit(x,z){return smooth(-25,-23.4,x)*(1-smooth(6.2,9.5,x))*(1-smooth(4.8,6.8,Math.abs(z)));}
export const BENCH_HEIGHT=2.0604548638391544;
function baseGround(x,z){let h=benchUnit(x,z)*BENCH_HEIGHT;const r=Math.hypot(x,z);if(r>38){const angle=Math.atan2(z,x),ridge=20+Math.sin(angle*5)*9+Math.sin(angle*11+.5)*5+Math.sin(angle*21)*2;h+=smooth(38,73,r)*ridge*(1-smooth(120,180,r));}if(r>28)h+=(Math.sin(x*.3)*Math.cos(z*.27)+Math.sin(x*.73+z*.33)*.35)*smooth(28,45,r);return dumpGround(x,z,h);}
// Only a thin firm floor is protected; the extended lower platform and entire
// upper terrace are mineable, including the material underneath the machine.
function bedrockUnitFloor(x,z){return digZone(x,z)?benchUnit(x,z)*.16:baseGround(x,z);}
export function benchFloor(x,z){return digZone(x,z)?floorSampler.heightAt(x+7.5,z):bedrockUnitFloor(x,z);}
function upperUnit(x,z){const edge=.24*Math.sin(z*.72)+.13*Math.sin(z*2.7)+.07*Math.sin(z*6.3),front=1-smooth(-11.0+edge,-7.9+edge,x),back=smooth(-25,-22.8,x),side=1-smooth(4.4,6.8,Math.abs(z));return front*back*side*(1+.030*Math.sin(z*1.7+x*.4)+.022*Math.sin(x*2.3)+.024*Math.sin(x*4.1+z*.8)*Math.cos(z*3.8-x*.7));}
const upperHeight=6;let upperTonnes=0,lowerTonnes=0;for(let row=0;row<field.nz;row++)for(let col=0;col<field.nx;col++){const x=(col+.5)*field.dx-field.width/2-7.5,z=(row+.5)*field.dz-field.depth/2;lowerTonnes+=benchUnit(x,z)*(BENCH_HEIGHT-.16)*field.area*ORE.bankDensity;upperTonnes+=upperUnit(x,z)*upperHeight*field.area*ORE.bankDensity;}
export const DOUBLE_BENCH={lowerTonnes,upperTonnes,upperX:-16,faceX:-9.5,upperHeight,platformHeight:BENCH_HEIGHT};
function initialBankGround(x,z){return benchFloor(x,z)+initialSampler.heightAt(x+7.5,z);}
function initializeShelf(){field.initialize((x,z)=>benchUnit(x-7.5,z)*(BENCH_HEIGHT-.16)+upperUnit(x-7.5,z)*upperHeight);for(let row=0;row<field.nz;row++)for(let col=0;col<field.nx;col++)field.base[row*field.nx+col]=bedrockUnitFloor((col+.5)*field.dx-field.width/2-7.5,(row+.5)*field.dz-field.depth/2);initialHeights.set(field.heights);setLevelReserve(field.mass);bankBounds={minX:-25.5,maxX:10.5,minZ:-7.5,maxZ:7.5};}initializeShelf();
function bankGround(x,z){return digZone(x,z)?frontBank.pages.size?frontBank.heightAt(x,z):benchFloor(x,z)+field.heightAt(x+7.5,z):baseGround(x,z)}
// Front loading is identified from the remaining upper bank, relative to the
// tracks. A cleared face, loose windrow or the floor under a raised machine
// must not turn ordinary downward bench digging into free penetration.
export function isUpperFace(x,z,workingY){return digZone(x,z)&&initialBankGround(x,z)>BENCH_HEIGHT+1.35&&(frontBank.pages.size?frontBank.surfaceAt(x,z):bankGround(x,z))>workingY+1.35;}
// A partly excavated high face still uses its real 3D cavities. Switching it
// back to a height-only floor as the local average drops pushes the bowl up
// into the remaining roof and makes the last part of a scoop impossible.
export function isFrontRegion(x,z,workingY){return digZone(x,z)&&initialBankGround(x,z)>Math.max(BENCH_HEIGHT+1.35,workingY+.6);}
export function bankSolidAt(x,y,z,skin=.015){if(!digZone(x,z))return y<ground(x,z)-skin;if(y<benchFloor(x,z)-skin)return true;if(frontBank.pages.size?frontBank.solidAt(x,y,z,skin):y<bankGround(x,z)-skin)return true;return looseHeight(x,z)>.02&&y>bankGround(x,z)-skin&&y<ground(x,z)-skin;}
export function frontState(){return frontBank.snapshot();}
export function bankPenetration(x,y,z){return digZone(x,z)?frontBank.depthAt(x,y,z):0;}
export function supportFrontWithBucket(bounds){frontBank.setTool(bounds);}
export function looseHeight(x,z){if(loose.mass<1e-10)return 0;if(Math.abs(x-LOOSE_AREA.x)>LOOSE_AREA.width/2||Math.abs(z-LOOSE_AREA.z)>LOOSE_AREA.depth/2)return 0;return loose.heightAt(x-LOOSE_AREA.x,z-LOOSE_AREA.z)}
export function ground(x,z){return bankGround(x,z)+looseHeight(x,z)}
ground.supportAt=(x,z)=>frontBank.supportAt(x,z);
export function canDig(x,z){return digZone(x,z)||looseHeight(x,z)>.018}
export function soilDensity(x,z){return looseHeight(x,z)>.018?ORE.looseDensity:ORE.bankDensity}
function depth(x,z){return digZone(x,z)?Math.max(0,initialBankGround(x,z)-ground(x,z)):0}
export function shelfMass(){return field.mass}
export function shelfVolume(){return field.volume()}
export function looseMass(){return loose.mass}
export function depositLoose(x,z,tonnes){if(!(tonnes>0))return 0;const amount=loose.deposit(x-LOOSE_AREA.x,z-LOOSE_AREA.z,tonnes,{rx:.36,rz:.36});wakeMaterial(x,z,'loose');return amount;}
export function cut(x,z,tonnes,yaw=0,previous=null,floorY=null){if(!(tonnes>0)||!digZone(x,z))return 0;const distance=previous?Math.hypot(x-previous.x,z-previous.z):0,steps=Math.max(1,Math.min(8,Math.ceil(distance/.2)));let removed=0;for(let i=0;i<steps;i++){const t=(i+1)/steps,xx=previous?previous.x+(x-previous.x)*t:x,zz=previous?previous.z+(z-previous.z)*t:z;removed+=field.remove(xx+7.5,zz,tonnes/steps,{rx:.36,rz:BUCKET_CUT_HALF_WIDTH,yaw,minHeight:floorY===null?null:(xx,zz)=>Math.max(0,floorY-benchFloor(xx-7.5,zz))})}if(removed>0)wakeMaterial(x,z,'bank');return removed}
export function excavate(x,z,tonnes,yaw=0,previous=null,floorY=null){
 const recovered=loose.remove(x-LOOSE_AREA.x,z-LOOSE_AREA.z,tonnes,{rx:.36,rz:BUCKET_CUT_HALF_WIDTH,yaw,minHeight:floorY===null?null:(xx,zz)=>floorY-bankGround(xx+LOOSE_AREA.x,zz+LOOSE_AREA.z)});if(recovered>0)wakeMaterial(x,z,'loose');
 const bankMass=cut(x,z,Math.min(tonnes-recovered,levelState().remaining),yaw,previous,floorY);return {mass:recovered+bankMass,bankMass,recovered};
}
// Remove the same swept strip from recovered loose ore and the finite bank.
export function excavateSweep(from,to,yaw,width,budget,deflect=0){
 const recovered=cutToothSweep(loose,from,to,yaw,width,budget,{offsetX:LOOSE_AREA.x,offsetZ:LOOSE_AREA.z,base:bankGround});
 if(recovered>0)wakeMaterial(to.x,to.z,'loose');
 const bankMass=cutToothSweep(field,from,to,yaw,width,Math.min(budget-recovered,levelState().remaining),{offsetX:-7.5,base:benchFloor});
 if(bankMass>0)wakeMaterial(to.x,to.z,'bank');
 // A bounded part of freshly fractured bank rolls towards the operator's
 // cutting apron. It is actual displaced mass, never extra decorative soil.
 const windrow=bankMass*Math.max(0,Math.min(.28,deflect));
 if(windrow>0){const c=Math.cos(yaw),s=Math.sin(yaw);let distance=.55;for(;distance<2.2;distance+=.45)if(ground(to.x-c*distance,to.z+s*distance)<=to.y+.15)break;const x=to.x-c*distance,z=to.z+s*distance;for(let i=-2;i<=2;i++){const lateral=i*width*.20;depositLoose(x+s*lateral,z+c*lateral,windrow/5);}if(windrow>.001&&caveCount<32){const n=caveCount++*7;cavePackets[n]=to.x;cavePackets[n+1]=to.y+.12;cavePackets[n+2]=to.z;cavePackets[n+3]=x;cavePackets[n+4]=ground(x,z)+.03;cavePackets[n+5]=z;cavePackets[n+6]=windrow/ORE.looseDensity;}}
 return {mass:recovered+bankMass-windrow,bankMass,recovered,windrow};
}
function frontWindrow(point,yaw,width,mass,workingY=BENCH_HEIGHT){
 if(!(mass>0))return;const c=Math.cos(yaw),s=Math.sin(yaw);let distance=.8;
 // Find the low working apron, then roll the fragments clear of the foot.
 // Depositing a fixed .6 m behind high teeth left the entire "windrow" on top
 // of the upper bank, out of view and out of reach of the grading shell.
 for(;distance<8;distance+=.3)if(bankGround(point.x-c*distance,point.z+s*distance)<workingY+.18)break;
 distance+=1;const x=point.x-c*distance,z=point.z+s*distance,bounds=loose.bounds({x:x-LOOSE_AREA.x,z:z-LOOSE_AREA.z,radius:2.1});
 for(let row=bounds.z0;row<=bounds.z1;row++)for(let col=bounds.x0;col<=bounds.x1;col++)loose.base[row*loose.nx+col]=bankGround((col+.5)*loose.dx-loose.width/2+LOOSE_AREA.x,(row+.5)*loose.dz-loose.depth/2+LOOSE_AREA.z);
 const accepted=loose.depositDry(x-LOOSE_AREA.x,z-LOOSE_AREA.z,mass,{repose:.64,aspect:1.2,radius:1.7});wakeMaterial(x,z,'loose');
 if(accepted>0&&caveCount<32){const n=caveCount++*7;cavePackets[n]=point.x;cavePackets[n+1]=point.y;cavePackets[n+2]=point.z;cavePackets[n+3]=x;cavePackets[n+4]=ground(x,z)+.04;cavePackets[n+5]=z;cavePackets[n+6]=accepted/ORE.looseDensity;}
}
export function excavateFront(from,to,yaw,width,biteHeight,budget,deflect=.1,workingY=BENCH_HEIGHT,captureBudget=Infinity){
 const recovered=cutToothSweep(loose,from,to,yaw,width,budget,{offsetX:LOOSE_AREA.x,offsetZ:LOOSE_AREA.z,base:bankGround});if(recovered>0)wakeMaterial(to.x,to.z,'loose');
 const result=frontBank.cutSweep(from,to,yaw,width,biteHeight,Math.min(budget-recovered,levelState().remaining)),bankMass=result.mass,available=result.available,natural=bankMass*Math.max(0,Math.min(.28,deflect)),captured=Math.min(captureBudget,recovered+bankMass-natural),windrow=recovered+bankMass-captured;
 if(bankMass>0||result.changed)wakeMaterial(to.x,to.z,'bank');
 frontWindrow(to,yaw,width,windrow,workingY);
 return {mass:captured,bankMass,recovered,windrow,available};
}
// A rising loaded shell can fracture a small contacting roof lip. This does
// not fill the bucket: the actual displaced bank mass becomes loose foot rock.
export function relieveFrontContact(point,yaw,budget,workingY=BENCH_HEIGHT){const revision=frontBank.revision,mass=frontBank.chipAt(point.x,point.y,point.z,Math.min(budget,levelState().remaining));if(mass>0||revision!==frontBank.revision)wakeMaterial(point.x,point.z,'bank');frontWindrow(point,yaw,1.64,mass,workingY);return mass;}
// The back of a closed bucket planes a shallow windrow. This transfers actual
// volume to the leading wedge; it never adds bucket payload or creates ore.
export function gradeBucketSweep(from,to,yaw,width,budget){
 const c=Math.cos(yaw),s=Math.sin(yaw),advance=(to.x-from.x)*c-(to.z-from.z)*s,penetration=ground(to.x,to.z)-to.y;
 if(Math.abs(advance)<1e-6||penetration<.012||penetration>.38||!(budget>0))return {mass:0,bankMass:0};
 const a={x:from.x,y:Math.max(from.y,ground(from.x,from.z)-.16),z:from.z},b={x:to.x,y:Math.max(to.y,ground(to.x,to.z)-.16),z:to.z};
 const recovered=cutToothSweep(loose,a,b,yaw,width,budget,{offsetX:LOOSE_AREA.x,offsetZ:LOOSE_AREA.z,base:bankGround});
 const bankMass=cutToothSweep(field,a,b,yaw,width,Math.min(budget-recovered,levelState().remaining),{offsetX:-7.5,base:benchFloor}),mass=recovered+bankMass;
 if(mass>0){if(bankMass>0)wakeMaterial(to.x,to.z,'bank');if(recovered>0)wakeMaterial(to.x,to.z,'loose');const direction=Math.sign(advance),x=to.x+c*.65*direction,z=to.z-s*.65*direction,plane=Math.min(from.y,to.y)+.025,cells=loose.weights(x-LOOSE_AREA.x,z-LOOSE_AREA.z,.65,width*.55,yaw);let left=mass;
  // Fill real low cells first. Excess remains a dry windrow in front of the
  // moving shell, so pulling gathers material and pushing spreads it out.
  for(const cell of cells){const xx=(cell.i%loose.nx+.5)*loose.dx-loose.width/2+LOOSE_AREA.x,zz=(Math.floor(cell.i/loose.nx)+.5)*loose.dz-loose.depth/2+LOOSE_AREA.z,room=Math.max(0,plane-bankGround(xx,zz)-loose.heights[cell.i])*loose.area*loose.density,part=Math.min(left,room);if(part>0){loose.heights[cell.i]+=part/(loose.area*loose.density);loose.mass+=part;left-=part;}}
  if(left>1e-10)loose.depositDry(x-LOOSE_AREA.x,z-LOOSE_AREA.z,left,{repose:.84,aspect:1.15});loose.dirty=true;loose.revision++;wakeMaterial(x,z,'loose');
  if(mass>.003&&caveCount<32){const n=caveCount++*7;cavePackets[n]=to.x;cavePackets[n+1]=to.y+.03;cavePackets[n+2]=to.z;cavePackets[n+3]=x;cavePackets[n+4]=ground(x,z)+.03;cavePackets[n+5]=z;cavePackets[n+6]=mass/ORE.looseDensity;}
 }
 return {mass,bankMass};
}
// A blade cuts a broad shallow strip. Reclaimed loose rock is never counted as
// a second excavation, and the grading plane cannot erase the stock underneath.
function tuckedCellFloor(xx,zz){const col=Math.max(0,Math.min(loose.nx-1,Math.floor((xx/loose.width+.5)*loose.nx))),row=Math.max(0,Math.min(loose.nz-1,Math.floor((zz/loose.depth+.5)*loose.nz)));return Math.min(tucked[row*loose.nx+col],loose.heights[row*loose.nx+col]);}
export function bladeCollect(x,z,yaw,requested,grade,allowBank=true){
 const recovered=loose.remove(x-LOOSE_AREA.x,z-LOOSE_AREA.z,requested,{rx:.36,rz:1.72,yaw,minHeight:(xx,zz)=>grade===null?tuckedCellFloor(xx,zz):grade-bankGround(xx+LOOSE_AREA.x,zz+LOOSE_AREA.z)});
 if(recovered>0)wakeMaterial(x,z,'loose');
 let bankMass=0;if(allowBank&&digZone(x,z)&&requested>recovered)bankMass=field.remove(x+7.5,z,Math.min(requested-recovered,levelState().remaining),{rx:.36,rz:1.72,yaw,minHeight:(xx,zz)=>Math.max(0,Math.max(grade??-Infinity,bankGround(xx-7.5,zz)-.16)-benchFloor(xx-7.5,zz))});
 if(bankMass>0)wakeMaterial(x,z,'bank');return {mass:recovered+bankMass,bankMass,recovered};
}
export function bladeSpread(x,z,yaw,requested,grade){
 const c=Math.cos(yaw),s=Math.sin(yaw);let accepted=0;
 // Only low points receive rock. Five lateral tracks leave a broad graded
 // surface instead of adding a tall cone at the bulldozer's destination.
 for(let i=-3;i<=3&&accepted<requested;i++)for(const offset of [-.3,0,.3]){
  const xx=x+c*offset+s*i*.45,zz=z-s*offset+c*i*.45,room=Math.max(0,grade-ground(xx,zz));
  const amount=Math.min(requested-accepted,room*.20*ORE.looseDensity);if(amount>1e-9)accepted+=depositLoose(xx,zz,amount);
 }return accepted;
}
// Deposit only real blade cargo into a broad supported wedge. Fill low cells
// first; the destination can accept a full blade without dumping a point cone.
export function tuckBlade(x,z,yaw,requested){
 if(!(requested>0))return 0;const cells=loose.weights(x-LOOSE_AREA.x,z-LOOSE_AREA.z,.78,1.72,yaw);if(!cells.length)return 0;
 let low=Infinity;for(const p of cells){const xx=(p.i%loose.nx+.5)*loose.dx-loose.width/2+LOOSE_AREA.x,zz=(Math.floor(p.i/loose.nx)+.5)*loose.dz-loose.depth/2+LOOSE_AREA.z;p.base=bankGround(xx,zz);p.offset=(1-Math.sqrt(p.w))*.18;low=Math.min(low,p.base+loose.heights[p.i]+p.offset);}
 let high=low+requested/(loose.area*loose.density);for(let n=0;n<22;n++){const grade=(low+high)/2;let amount=0;for(const p of cells)amount+=Math.max(0,grade-p.base-p.offset-loose.heights[p.i])*loose.area*loose.density;if(amount<requested)low=grade;else high=grade;}
 const grade=(low+high)/2;let total=0,last=null;for(const p of cells){p.add=Math.max(0,grade-p.base-p.offset-loose.heights[p.i]);total+=p.add;if(p.add>0)last=p;}if(!last||total===0)return 0;let left=requested;
 for(const p of cells)if(p.add>0){const mass=p===last?left:requested*p.add/total,h=mass/(loose.area*loose.density);loose.heights[p.i]+=h;tucked[p.i]+=h;tuckedVolume+=h*loose.area;left-=mass;}
 loose.mass+=requested;loose.dirty=true;loose.revision++;wakeMaterial(x,z,'loose');return requested;
}
let edgeRevision=-1,receiverEdges=[];
function recoveryEdges(machine){
 if(edgeRevision!==field.revision){edgeRevision=field.revision;receiverEdges=[];for(let row=1;row<field.nz-1;row++)for(let col=1;col<field.nx-1;col++){const i=row*field.nx+col;if(field.heights[i]<.10)continue;for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]])if(field.heights[i+dc+dr*field.nx]<.10){receiverEdges.push({x:(col+.5)*field.dx-field.width/2-7.5+dc*.55,z:(row+.5)*field.dz-field.depth/2+dr*.55});}}}
 return receiverEdges.length?receiverEdges:[{x:(machine.baseX||0)+6,z:4},{x:(machine.baseX||0)+6,z:-4}];
}
export function gradingTargets(machine,position=machine){
 if(ungradedMass()<.002)return [];const clusters=new Map(),mx=machine.baseX||0,mz=machine.baseZ||0;
 // Visit actual occupied cells across the ENTIRE loose-material field.
 for(let row=0;row<loose.nz;row++)for(let col=0;col<loose.nx;col++){
  const i=row*loose.nx+col,h=Math.max(0,loose.heights[i]-Math.min(tucked[i],loose.heights[i]));if(h<.0015)continue;
  const x=(col+.5)*loose.dx-loose.width/2+LOOSE_AREA.x,z=(row+.5)*loose.dz-loose.depth/2+LOOSE_AREA.z,key=Math.floor(x/1.6)+','+Math.floor(z/1.6),mass=h*loose.area*loose.density;let group=clusters.get(key);
  if(!group){group={key,x,z,mass:0,peak:0};clusters.set(key,group);}group.mass+=mass;if(h>group.peak){group.peak=h;group.x=x;group.z=z;}
 }
 const result=[];for(const group of clusters.values()){
  if(group.mass<.004)continue;
group.score=Math.sqrt(group.mass)*3-Math.hypot(group.x-(position.x??mx),group.z-(position.z??mz))*.035;result.push(group);
 }return result.sort((a,b)=>b.score-a.score);
}
export function recoveryReceivers(source,machine){
 const near=recoveryEdges(machine).map(p=>({...p,distance:Math.hypot(p.x-source.x,p.z-source.z)})).sort((a,b)=>a.distance-b.distance),receivers=[];
 for(const p of near){if(receivers.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>.9))receivers.push(p);if(receivers.length===16)break;}return receivers;
}
// Fixed-size visual event buffer. Its packets describe actual conservative
// cell transfers, not extra mass removed from or added to the reserve.
const cavePackets=new Float64Array(32*7),caveMove={volume:0,from:0,to:0};let caveCount=0;
function trackCaveTransfer(from,to,volume){if(volume>caveMove.volume){caveMove.volume=volume;caveMove.from=from;caveMove.to=to;}}
export function drainCaveIns(visit){for(let i=0;i<caveCount;i++)visit(cavePackets,i*7);caveCount=0;}
function cavePoint(index,out){out.x=(index%field.nx+.5)*field.dx-field.width/2-7.5;out.z=(Math.floor(index/field.nx)+.5)*field.dz-field.depth/2;out.y=field.heights[index]+field.base[index];}
const caveFrom={},caveTo={};
export function stepMaterial(dt){
 materialClock+=dt;let changed=materialDirty;materialDirty=false;if(materialClock<1/30)return changed;const elapsed=Math.min(.1,materialClock);materialClock=0;
 const frontRevision=frontBank.revision,fell=frontBank.settle(elapsed,(x,y,z,drop,volume)=>{if(caveCount<32&&volume>.00001){const n=caveCount++*7;cavePackets[n]=x;cavePackets[n+1]=y;cavePackets[n+2]=z;cavePackets[n+3]=x;cavePackets[n+4]=y-drop;cavePackets[n+5]=z;cavePackets[n+6]=volume;}},(x,z)=>markMesh('bank',x,z,.6));if(frontBank.revision!==frontRevision)changed=true;if(fell>1e-9){for(const p of frontBank.pages.values()){const x=(p.i%field.nx+.5)*field.dx-field.width/2-7.5,z=(Math.floor(p.i/field.nx)+.5)*field.dz-field.depth/2;wakeMaterial(x,z,'bank');}}
 for(const [key,patch] of activeMaterial){patch.time-=elapsed;if(patch.time<=0){activeMaterial.delete(key);continue}
  if(patch.kind==='bank'){caveMove.volume=0;const moved=field.settle(1,{x:patch.x+7.5,z:patch.z,radius:patch.radius},{dt:elapsed,onTransfer:trackCaveTransfer});if(caveMove.volume>.00004&&caveCount<32){cavePoint(caveMove.from,caveFrom);cavePoint(caveMove.to,caveTo);const n=caveCount++*7;cavePackets[n]=caveFrom.x;cavePackets[n+1]=caveFrom.y+.1;cavePackets[n+2]=caveFrom.z;cavePackets[n+3]=caveTo.x;cavePackets[n+4]=caveTo.y+.06;cavePackets[n+5]=caveTo.z;cavePackets[n+6]=caveMove.volume;}if(moved>1e-8){changed=true;markMesh('bank',patch.x,patch.z,patch.radius+.3);}}
  else{const region={x:patch.x-LOOSE_AREA.x,z:patch.z-LOOSE_AREA.z,radius:patch.radius},b=loose.bounds(region);for(let z=b.z0;z<=b.z1;z++)for(let x=b.x0;x<=b.x1;x++)loose.base[z*loose.nx+x]=bankGround((x+.5)*loose.dx-loose.width/2+LOOSE_AREA.x,(z+.5)*loose.dz-loose.depth/2+LOOSE_AREA.z);const moved=loose.settle(1,region,{dt:elapsed,onTransfer:moveTucked});if(moved>1e-8){changed=true;markMesh('loose',patch.x,patch.z,patch.radius+.5);}}
 }
 return changed;
}
let exposure=null;function exposureTexture(){if(!exposure){exposure=new T.DataTexture(new Uint8Array(140*68*4),140,68,T.RGBAFormat);exposure.minFilter=exposure.magFilter=T.LinearFilter;exposure.wrapS=exposure.wrapT=T.ClampToEdgeWrapping;exposure.needsUpdate=true}return exposure}
function updateExposure(){if(!exposure)return;const bytes=exposure.image.data;for(let i=0;i<field.heights.length;i++){const removed=Math.abs(initialHeights[i]-field.heights[i]);bytes[i*4]=Math.min(255,Math.round(removed/.3*255));bytes[i*4+1]=bytes[i*4+2]=0;bytes[i*4+3]=255}exposure.needsUpdate=true}
export function makeMaterials(renderer,assets=null){
 const metal=(color,roughness=.6,metalness=.1)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const earth=assets?.gravel||terrainMaps('earth'),rock=assets?.rock||terrainMaps('wall');const groundMat=metal('#ffffff',.98,0);groundMat.map=earth.color;groundMat.map.repeat.set(55,55);groundMat.normalMap=earth.normal;groundMat.normalMap.repeat.set(55,55);groundMat.normalScale= new T.Vector2(.75,.75);
 const M={paint:metal('#e6ac39',.38,.28),dark:metal('#293139',.5,.32),black:metal('#11191c',.8,.05),track:metal('#4b4e4b',.77,.5),steel:metal('#89949a',.3,.8),chrome:metal('#d6e0e3',.19,.95),rubber:metal('#202728',.95,0),seat:metal('#343d40',.95,0),rock:metal('#a39884',1,0),bucket:metal('#545954',.68,.58),ground:groundMat};
 M.bucket.normalMap=earth.normal;M.bucket.normalScale=new T.Vector2(.14,.14);M.bucket.roughness=.59;M.rock.map=rock.color;M.rock.normalMap=rock.normal;M.rock.normalScale=new T.Vector2(.8,.8);M.glass=new T.MeshPhysicalMaterial({color:'#91b1be',metalness:.05,roughness:.08,transparent:true,opacity:.19,depthWrite:false,side:T.DoubleSide,envMapIntensity:1.2});M.display=metal('#204942',.25,.1);M.display.emissive=new T.Color('#458e79');M.display.emissiveIntensity=.45;M.lamp=metal('#fff5d4',.2,0);M.lamp.emissive=new T.Color('#ffdc96');M.lamp.emissiveIntensity=2;
 const paintCanvas=document.createElement('canvas');paintCanvas.width=paintCanvas.height=512;const paintContext=paintCanvas.getContext('2d');paintContext.fillStyle='#ecece7';paintContext.fillRect(0,0,512,512);for(let i=0;i<3200;i++){const a=Math.random()*.12;paintContext.fillStyle='rgba(65,51,35,'+a+')';paintContext.fillRect(Math.random()*512,Math.random()*512,Math.random()*9+1,Math.random()*2+.5)}const grime=paintContext.createLinearGradient(0,0,0,512);grime.addColorStop(0,'rgba(25,20,15,.2)');grime.addColorStop(.12,'rgba(25,20,15,0)');grime.addColorStop(.85,'rgba(25,20,15,0)');grime.addColorStop(1,'rgba(25,20,15,.3)');paintContext.fillStyle=grime;paintContext.fillRect(0,0,512,512);const paintMap=new T.CanvasTexture(paintCanvas);paintMap.colorSpace=T.SRGBColorSpace;M.paint.map=paintMap;M.paint.color.set('#e0a82e');M.paint.roughness=.47;
 M.snow=new T.MeshStandardMaterial({color:'#f0f6ff',roughness:.89,normalMap:assets?.snow.normal||null,normalScale:new T.Vector2(.12,.12),map:assets?.snow.color||null});M.snow.polygonOffset=true;M.snow.polygonOffsetFactor=-1;
 M.freshRock=new T.MeshStandardMaterial({color:'#a39c8d',roughness:1,metalness:0,vertexColors:true,normalMap:rock.normal,normalScale:new T.Vector2(.28,.28),map:assets?.rock.color||null,roughnessMap:null,flatShading:true,envMapIntensity:.25});M.freshRock.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 fracturePosition;varying vec3 fractureNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfracturePosition=position;fractureNormal=normal;');
  shader.fragmentShader='varying vec3 fracturePosition;varying vec3 fractureNormal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec3 weight=pow(abs(normalize(fractureNormal)),vec3(5.));weight/=max(.0001,weight.x+weight.y+weight.z);vec3 q=fracturePosition*.82;
 vec3 fracture=texture2D(map,q.zy).rgb*weight.x+texture2D(map,q.xz).rgb*weight.y+texture2D(map,q.xy).rgb*weight.z;
 float shade=dot(fracture,vec3(.2126,.7152,.0722));float vein=smoothstep(.48,.75,fracture.r)*.12;
 diffuseColor.rgb*=vec3(.56+shade*1.45+vein);
 #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat mineral=sin(dot(fracturePosition,vec3(1.9,4.2,2.5)))*.5+.5;roughnessFactor=clamp(roughnessFactor*(.80+.18*mineral),.72,1.);');
 };M.freshRock.customProgramCacheKey=()=> 'overburden-fracture-triplanar-3';if(assets){snowOnRock(M.rock);M.terrainMaterial=material=>terrainWinter(material,assets,()=>levelState().progress,exposureTexture());}else M.terrainMaterial=()=>{};
 for(const tex of [earth.color,earth.normal,rock.color,rock.normal])tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 return industrialFinish(M,assets);
}
function terrainGeometry(size,segments,offsetX=0,offsetZ=0){const g=new T.PlaneGeometry(size,size,segments,segments);g.rotateX(-Math.PI/2);const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i)+offsetX,z=p.getZ(i)+offsetZ,y=ground(x,z);p.setXYZ(i,x,y,z);const shade=T.MathUtils.clamp(.9+Math.sin(x*.37+z*.23)*.08-y*.003,.65,1);c.push(shade,shade*.98,shade*.94)}g.setAttribute('color',new T.Float32BufferAttribute(c,3));const indices=[];for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((v,k)=>v+p.getX(k),0)/3,z=ids.reduce((v,k)=>v+p.getZ(k),0)/3;if(!(x> -25.5&&x<10.5&&z> -7.5&&z<7.5)&&!(x> -66&&x<66&&z>27&&z<72))indices.push(...ids)}g.setIndex(indices);g.computeVertexNormals();return g}
export function resetTerrain(){caveCount=0;frontBank.reset();initializeShelf();loose.clear();tucked.fill(0);tuckedVolume=0;edgeRevision=-1;activeMaterial.clear();materialClock=0;materialDirty=true;looseBounds={minX:-48,maxX:56,minZ:-52,maxZ:28};updateExposure()}
export function makeWorld(scene,M){
 const g=terrainGeometry(360,240),mat=M.ground.clone();mat.vertexColors=true;M.terrainMaterial(mat);const terrain=add(scene,g,mat);terrain.receiveShadow=true;terrain.castShadow=false;
 const coarseGround=(x,z)=>heightMeshSample(g,{width:360,depth:360,nx:240,nz:240},x,z),outcrops=quarryOutcrops(scene,M,coarseGround);
 const visualGround=(x,z)=>digZone(x,z)?bankGround(x,z):outcrops.height(x,z)??coarseGround(x,z);
 // High resolution working face, replacing the coarse triangles locally.
 const fine=new T.PlaneGeometry(36,15,180,76);fine.rotateX(-Math.PI/2);const face=new T.Mesh(fine,M.ground.clone());face.position.set(-7.5,.025,0);face.receiveShadow=true;face.material.map=M.ground.map.clone();face.material.map.repeat.set(8,4);face.material.normalMap=M.ground.normalMap.clone();face.material.normalMap.repeat.set(8,4);face.material.normalScale.set(.32,.32);M.terrainMaterial(face.material);scene.add(face);
 const removedExposure=(x,z)=>digZone(x,z)?Math.max(Math.abs(initialBankGround(x,z)-bankGround(x,z)),x< -8&&initialSampler.heightAt(x+7.5,z)>.02?.08:0):0;
 const bankExposure=(x,z)=>{if(!digZone(x,z))return 0;const removed=removedExposure(x,z),slope=Math.hypot(bankGround(x+.25,z)-bankGround(x-.25,z),bankGround(x,z+.25)-bankGround(x,z-.25))/.5;return Math.max(removed,Math.max(0,slope-.7)*.16);},rockBank=createRockBank(scene,M.freshRock,bankGround,bankExposure,(x,z)=>frontBank.maskAt(x,z),(x,y,z)=>bankSolidAt(x,y,z)),frontSurface=createFrontBankRenderer(scene,M.freshRock,frontBank);
 const stones=new T.InstancedMesh(oreGeometry(1),M.rock,140),distantStones=new T.InstancedMesh(oreGeometry(),M.rock,660),data=[],dummy=new T.Object3D();for(const mesh of [stones,distantStones]){mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh)}
 for(let i=0;i<800;i++){let x,z;if(i<140){x=3.6+Math.random()*5.4;z=(Math.random()-.5)*6.5}else{x=(Math.random()-.5)*140;z=(Math.random()-.5)*140;if(x> -28&&x<13&&Math.abs(z)<2.3)z=(z<0?-1:1)*(2.7+Math.random()*1.2)}const r=.08+Math.random()*(i<140?.4:.65);data.push({x,z,r,rot:Math.random()*6});}
 const spoilGeometry=new T.PlaneGeometry(LOOSE_AREA.width,LOOSE_AREA.depth,LOOSE_AREA.nx,LOOSE_AREA.nz);spoilGeometry.rotateX(-Math.PI/2);const spoilMaterial=aggregateMaterial(M.freshRock);spoilMaterial.color.multiplyScalar(.62);spoilMaterial.transparent=true;spoilMaterial.alphaTest=.025;spoilMaterial.polygonOffset=true;spoilMaterial.polygonOffsetFactor=-1;const compileAggregate=spoilMaterial.onBeforeCompile;spoilMaterial.customProgramCacheKey=()=> 'dense-spill-aggregate-cover-v3';spoilMaterial.onBeforeCompile=shader=>{compileAggregate(shader);shader.vertexShader='attribute float cover;varying float spoilCover;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nspoilCover=cover;');shader.fragmentShader='varying float spoilCover;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=spoilCover;');};spoilGeometry.setAttribute('cover',new T.BufferAttribute(new Float32Array(spoilGeometry.attributes.position.count),1));const spoil=new T.Mesh(spoilGeometry,spoilMaterial);spoil.position.set(LOOSE_AREA.x,0,LOOSE_AREA.z);spoil.castShadow=spoil.receiveShadow=true;spoil.frustumCulled=false;scene.add(spoil);
 // The height plane has no vertex-colour attribute. Enabling it inherits a
 // zero GPU attribute and paints every freshly spilled fine fraction black.
 spoilMaterial.vertexColors=false;
 const loosePieces=chunkBatch(scene,M.freshRock,8192,'Individual spilled rocks'),spoilGrains=loosePieces.mesh;spoilMaterial.visible=true;spoil.castShadow=false;spoil.receiveShadow=true;stones.visible=false;let spoilRevision=-1;const spoilHeights=new Float32Array(spoilGeometry.attributes.position.count),spoilIndices=new Uint32Array(LOOSE_AREA.nx*LOOSE_AREA.nz*6);spoilGeometry.setIndex(new T.BufferAttribute(spoilIndices,1));spoilGeometry.setDrawRange(0,0);const metrics={updates:0,bankVertices:0,spoilVertices:0,lastUpdateMs:0};let initial=true;
 function updateSpoil(){
  spoil.visible=spoilGrains.visible=loose.mass>1e-7;if(!spoil.visible||spoilRevision===loose.revision&&!bankBounds)return;spoilRevision=loose.revision;
  const p=spoilGeometry.attributes.position,spoilBounds=bankBounds&&looseBounds?{minX:Math.min(bankBounds.minX,looseBounds.minX),maxX:Math.max(bankBounds.maxX,looseBounds.maxX),minZ:Math.min(bankBounds.minZ,looseBounds.minZ),maxZ:Math.max(bankBounds.maxZ,looseBounds.maxZ)}:looseBounds||bankBounds;
  metrics.spoilVertices=updateHeightPatch(spoilGeometry,LOOSE_AREA,(x,z)=>bankGround(x,z)+looseHeight(x,z)+.005,spoilBounds,(x,z)=>{const h=looseHeight(x,z);return Math.max(0,Math.min(1,(h-.001)/.045));});
  let index=0;for(let i=0;i<p.count;i++){const x=p.getX(i)+LOOSE_AREA.x,z=p.getZ(i)+LOOSE_AREA.z;spoilHeights[i]=looseHeight(x,z);}

  for(let z=0;z<LOOSE_AREA.nz;z++)for(let x=0;x<LOOSE_AREA.nx;x++){const a=z*(LOOSE_AREA.nx+1)+x,b=a+1,c=a+LOOSE_AREA.nx+1,d=c+1;if(Math.max(spoilHeights[a],spoilHeights[b],spoilHeights[c],spoilHeights[d])>.001){spoilIndices.set([a,c,b,b,c,d],index);index+=6;}}
  packHeightField(loosePieces,{nx:260,nz:200,cell:.4,x:LOOSE_AREA.x-LOOSE_AREA.width/2,z:LOOSE_AREA.z-LOOSE_AREA.depth/2,floor:bankGround,height:looseHeight,seed:400});spoilGeometry.setDrawRange(0,index);spoilGeometry.index.clearUpdateRanges();spoilGeometry.index.addUpdateRange(0,index);spoilGeometry.index.needsUpdate=true;
 }
 function update(){
  const start=performance.now();updateExposure();updateSpoil();for(const material of [terrain.material,face.material]){const shader=material.userData.winterShader;if(shader)shader.uniforms.quarryProgress.value=levelState().progress;}
  metrics.bankVertices=initial||bankBounds?updateHeightPatch(fine,{width:36,depth:15,nx:180,nz:76,x:-7.5,z:0},bankGround,initial?null:bankBounds):0;
  if(initial||bankBounds){maskExposedBank(fine,removedExposure);rockBank.update();frontSurface.update();}metrics.front=frontSurface.metrics();metrics.bankChunks=rockBank.pieces.mesh.count;metrics.looseChunks=loosePieces.mesh.count;
  for(let i=0;i<data.length;i++){const r=data[i];if(!initial&&(!bankBounds||r.x<bankBounds.minX||r.x>bankBounds.maxX||r.z<bankBounds.minZ||r.z>bankBounds.maxZ))continue;const grade=Math.hypot((visualGround(r.x+.4,r.z)-visualGround(r.x-.4,r.z))/.8,(visualGround(r.x,r.z+.4)-visualGround(r.x,r.z-.4))/.8),size=digZone(r.x,r.z)||grade>1.0||(Math.hypot(r.x,r.z)>32&&visualGround(r.x,r.z)>5)?0:r.r;dummy.position.set(r.x,visualGround(r.x,r.z)+size*.22,r.z);dummy.scale.set(size,size*.65,size);dummy.rotation.set(r.rot,r.rot*.7,r.rot*.3);dummy.updateMatrix();const mesh=i<140?stones:distantStones,slot=i<140?i:i-140;mesh.setMatrixAt(slot,dummy.matrix);mesh.instanceMatrix.needsUpdate=true;}
  if(initial){stones.computeBoundingSphere();distantStones.computeBoundingSphere();}initial=false;bankBounds=looseBounds=null;metrics.updates++;metrics.lastUpdateMs=performance.now()-start;
 }update();
 // Layered benches in the far quarry, irregular rather than straight boxes.
 // The continuous far-wall patch is created with the terrain above.

 return {update,height:visualGround,terrain,stones,distantStones,spoil,loosePieces,rockBank,frontSurface,face,metrics};
}
