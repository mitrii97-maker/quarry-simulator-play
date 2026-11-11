// Mass-conserving granular height field. All motion uses a fixed physical time
// step; diagonal neighbours keep a dry pile round rather than diamond-shaped.
const NEIGHBOURS=[[1,0],[0,1],[1,1],[1,-1]];
export class GranularGrid {
 constructor(width,depth,nx,nz,{density=5.2,slope=.78,staticSlope=slope*1.22,cohesion=.035,mobility=5,rim=Infinity}={}){
  Object.assign(this,{width,depth,nx,nz,density,slope,staticSlope,cohesion,mobility,rim});this.dx=width/nx;this.dz=depth/nz;this.area=this.dx*this.dz;this.diagonal=Math.hypot(this.dx,this.dz);
  this.heights=new Float64Array(nx*nz);this.flowX=new Float32Array(nx*nz);this.flowZ=new Float32Array(nx*nz);this.sliding=new Int8Array(nx*nz*4);this.mass=0;this.turn=0;this.dirty=true;this.revision=0;this.clock=0;this.outflow=new Map();
 }
 clear(){if(this.toothMicro)this.toothMicro.valid.fill(0);this.turn=0;this.heights.fill(0);this.flowX.fill(0);this.flowZ.fill(0);this.sliding.fill(0);this.mass=0;this.clock=0;this.outflow.clear();this.dirty=true;this.revision++;}
 initialize(fn,totalMass=null){if(this.toothMicro)this.toothMicro.valid.fill(0);this.turn=0;this.sliding.fill(0);this.flowX.fill(0);this.flowZ.fill(0);this.clock=0;this.outflow.clear();let volume=0;for(let z=0;z<this.nz;z++)for(let x=0;x<this.nx;x++){const h=Math.max(0,fn((x+.5)*this.dx-this.width/2,(z+.5)*this.dz-this.depth/2));this.heights[z*this.nx+x]=h;volume+=h*this.area}if(totalMass!==null)this.density=totalMass/volume;this.mass=volume*this.density;this.dirty=true;this.revision++;}
 heightAt(x,z){const fx=Math.max(0,Math.min(this.nx-1,(x/this.width+.5)*this.nx-.5)),fz=Math.max(0,Math.min(this.nz-1,(z/this.depth+.5)*this.nz-.5)),ix=Math.floor(fx),iz=Math.floor(fz),tx=fx-ix,tz=fz-iz;const sample=(a,b)=>this.heights[Math.min(this.nz-1,b)*this.nx+Math.min(this.nx-1,a)];return (sample(ix,iz)*(1-tx)+sample(ix+1,iz)*tx)*(1-tz)+(sample(ix,iz+1)*(1-tx)+sample(ix+1,iz+1)*tx)*tz;}
 bounds(region){if(!region)return {x0:0,x1:this.nx-1,z0:0,z1:this.nz-1};const r=region.radius;return {x0:Math.max(0,Math.floor((region.x-r+this.width/2)/this.dx)),x1:Math.min(this.nx-1,Math.ceil((region.x+r+this.width/2)/this.dx)),z0:Math.max(0,Math.floor((region.z-r+this.depth/2)/this.dz)),z1:Math.min(this.nz-1,Math.ceil((region.z+r+this.depth/2)/this.dz))};}
 weights(x,z,rx,rz,yaw=0){const list=[],c=Math.cos(yaw),s=Math.sin(yaw),r=Math.max(rx,rz),b=this.bounds({x,z,radius:r});for(let iz=b.z0;iz<=b.z1;iz++)for(let ix=b.x0;ix<=b.x1;ix++){const dx=(ix+.5)*this.dx-this.width/2-x,dz=(iz+.5)*this.dz-this.depth/2-z,u=(dx*c-dz*s)/rx,v=(dx*s+dz*c)/rz,d=u*u+v*v;if(d<1)list.push({i:iz*this.nx+ix,w:(1-d)*(1-d)})}return list;}
 remove(x,z,requested,{rx=.7,rz=1,yaw=0,minHeight=null}={}){
  if(!(requested>0)||this.mass<=0)return 0;const list=this.weights(x,z,rx,rz,yaw);for(const p of list){const xx=(p.i%this.nx+.5)*this.dx-this.width/2,zz=(Math.floor(p.i/this.nx)+.5)*this.dz-this.depth/2;p.floor=Math.max(0,typeof minHeight==='function'?minHeight(xx,zz):minHeight??0);}
  const available=list.reduce((m,p)=>m+Math.max(0,this.heights[p.i]-p.floor)*this.area*this.density,0),target=Math.min(requested,available);let left=target;
  for(let pass=0;pass<list.length+1&&left>1e-10;pass++){const candidates=list.filter(p=>this.heights[p.i]>p.floor+1e-12),sum=candidates.reduce((v,p)=>v+p.w,0);if(!sum)break;let removed=0;for(const p of candidates){const part=Math.min((this.heights[p.i]-p.floor)*this.area*this.density,left*p.w/sum);this.heights[p.i]=Math.max(p.floor,this.heights[p.i]-part/(this.area*this.density));removed+=part}left=Math.max(0,left-removed);}
  const removed=Math.min(requested,Math.max(0,target-left));this.mass=Math.max(0,this.mass-removed);if(removed>0){this.dirty=true;this.revision++;}return removed;
 }
 deposit(x,z,mass,{rx=.34,rz=.34}={}){if(!(mass>0))return 0;let list=this.weights(x,z,rx,rz);if(!list.length){const ix=Math.max(0,Math.min(this.nx-1,Math.floor((x/this.width+.5)*this.nx))),iz=Math.max(0,Math.min(this.nz-1,Math.floor((z/this.depth+.5)*this.nz)));list=[{i:iz*this.nx+ix,w:1}]}const total=list.reduce((m,p)=>m+p.w,0);for(const p of list)this.heights[p.i]+=mass*p.w/total/(this.area*this.density);this.mass+=mass;this.dirty=true;this.revision++;return mass;}
 // A dry impact grows a small cone against the existing packed surface. It
 // cannot inject a tall one-cell spike that launches the neighbouring grains.
 depositDry(x,z,mass,{repose=.92,aspect=1,radius=null}={}){
  if(!(mass>0))return 0;const volume=mass/this.density,r=radius??Math.max(.32,Math.min(4,Math.max(Math.cbrt(3*volume/(Math.PI*repose))*1.35+.15,this.heightAt(x,z)/repose+.45))),bounds=this.bounds({x,z,radius:r*Math.max(1,aspect)});
  const scratch=this.depositScratch??={indices:new Int32Array(this.nx*this.nz),offsets:new Float64Array(this.nx*this.nz),deltas:new Float64Array(this.nx*this.nz)},ids=scratch.indices,offsets=scratch.offsets,deltas=scratch.deltas;let count=0,low=Infinity;
  for(let row=bounds.z0;row<=bounds.z1;row++)for(let col=bounds.x0;col<=bounds.x1;col++){const dx=((col+.5)*this.dx-this.width/2-x)/aspect,dz=(row+.5)*this.dz-this.depth/2-z,d=Math.hypot(dx,dz);if(d>r)continue;const i=row*this.nx+col,offset=repose*d;ids[count]=i;offsets[count++]=offset;low=Math.min(low,this.heights[i]+offset);}
  if(!count)return this.deposit(x,z,mass);let high=low+volume/this.area;
  for(let n=0;n<18;n++){const peak=(low+high)/2;let added=0;for(let j=0;j<count;j++)added+=Math.max(0,peak-offsets[j]-this.heights[ids[j]])*this.area;if(added<volume)low=peak;else high=peak;}
  const peak=(low+high)/2;let total=0,last=-1;for(let j=0;j<count;j++){deltas[j]=Math.max(0,peak-offsets[j]-this.heights[ids[j]]);total+=deltas[j];if(deltas[j]>0)last=j;}let remaining=mass;
  if(last<0){this.heights[ids[0]]+=mass/(this.area*this.density);}else for(let j=0;j<count;j++)if(deltas[j]>0){const part=j===last?remaining:mass*deltas[j]/total;this.heights[ids[j]]+=part/(this.area*this.density);remaining-=part;}
  this.mass+=mass;this.dirty=true;this.revision++;return mass;
 }
 settle(passes=4,region=null,{dt=1/60,force={x:0,z:0},spill=false,onTransfer=null}={}){
  const b=this.bounds(region),k=Math.min(.14,dt*this.mobility),decay=Math.exp(-dt*15);let movement=0;
  for(let pass=0;pass<passes;pass++){
   const reverse=(this.turn++%2)!==0;
   for(let zz=b.z0;zz<=b.z1;zz++)for(let xx=b.x0;xx<=b.x1;xx++){
    const x=reverse?b.x1+b.x0-xx:xx,z=reverse?b.z1+b.z0-zz:zz,i=z*this.nx+x;
    this.flowX[i]*=decay;this.flowZ[i]*=decay;
    for(let edge=0;edge<NEIGHBOURS.length;edge++){
     const [sx,sz]=NEIGHBOURS[edge],jx=x+sx,jz=z+sz;if(jx<0||jx>=this.nx||jz<0||jz>=this.nz)continue;const j=jz*this.nx+jx;if(this.fixedCells&&(this.fixedCells[i]||this.fixedCells[j]))continue;const dx=sx*this.dx,dz=sz*this.dz,d=edge===0?this.dx:edge===1?this.dz:this.diagonal,base=(this.base?.[i]||0)-(this.base?.[j]||0),diff=this.heights[i]-this.heights[j]+base-(force.x*dx+force.z*dz),sign=Math.sign(diff),key=i*4+edge;
     if(this.sliding[key]!==sign)this.sliding[key]=0;
     if(!this.sliding[key]&&Math.abs(diff)>this.staticSlope*d+this.cohesion)this.sliding[key]=sign;
     const excess=Math.abs(diff)-this.slope*d-this.cohesion*.35;
     if(this.sliding[key]&&excess>.0015){const donor=sign>0?i:j,transfer=Math.min(excess*k,this.heights[donor]*.22);if(transfer<1e-10){this.sliding[key]=0;continue}this.heights[i]-=sign*transfer;this.heights[j]+=sign*transfer;const vx=sign*dx/d*transfer/Math.max(dt,.001)*.12,vz=sign*dz/d*transfer/Math.max(dt,.001)*.12;this.flowX[i]+=vx;this.flowX[j]+=vx;this.flowZ[i]+=vz;this.flowZ[j]+=vz;movement+=transfer*this.area;if(onTransfer)onTransfer(donor,sign>0?j:i,transfer*this.area);}
     else this.sliding[key]=0;
    }
    // The wall is at the outer cell edge, not its centre. A sloping dry
    // pile may stand half a cell higher inside without crossing that wall.
    let edgeAllowance=Infinity;if(x===0)edgeAllowance=Math.min(edgeAllowance,Math.max(0,(this.heights[i+1]-this.heights[i])*.5),this.slope*this.dx*.5);if(x===this.nx-1)edgeAllowance=Math.min(edgeAllowance,Math.max(0,(this.heights[i-1]-this.heights[i])*.5),this.slope*this.dx*.5);if(z===0)edgeAllowance=Math.min(edgeAllowance,Math.max(0,(this.heights[i+this.nx]-this.heights[i])*.5),this.slope*this.dz*.5);if(z===this.nz-1)edgeAllowance=Math.min(edgeAllowance,Math.max(0,(this.heights[i-this.nx]-this.heights[i])*.5),this.slope*this.dz*.5);
    const wallLimit=this.rim+(Number.isFinite(edgeAllowance)?edgeAllowance:0);
    if(Number.isFinite(this.rim)&&(x===0||x===this.nx-1||z===0||z===this.nz-1)&&this.heights[i]>wallLimit+(spill?this.cohesion:0)){
     const excess=this.heights[i]-wallLimit;
     if(spill){const amount=Math.min(excess,Math.max(this.cohesion*.3,excess*Math.min(.2,dt*2.8))),mass=amount*this.area*this.density;this.heights[i]-=amount;this.mass-=mass;const old=this.outflow.get(i),nx=x===0?-1:x===this.nx-1?1:0,nz=nx?0:z===0?-1:1;this.outflow.set(i,{x:(x+.5)*this.dx-this.width/2,z:(z+.5)*this.dz-this.depth/2,nx,nz,height:this.heights[i],mass:mass+(old?.mass||0)});movement+=amount*this.area;}
     else{const to=Math.max(1,Math.min(this.nz-2,z))*this.nx+Math.max(1,Math.min(this.nx-2,x));this.heights[i]=wallLimit;this.heights[to]+=excess;movement+=excess*this.area;}
    }
   }
  }
  if(movement>1e-8){this.dirty=true;this.revision++;}return movement;
 }
 step(dt,region=null,options={}){this.clock+=Math.min(.1,Math.max(0,dt));let movement=0;while(this.clock>=1/60){this.clock-=1/60;movement+=this.settle(1,region,{...options,dt:1/60});}return movement;}
 drainSpills(){const result=[...this.outflow.values()];this.outflow.clear();return result;}
 velocityAt(x,z){const ix=Math.max(0,Math.min(this.nx-1,Math.floor((x/this.width+.5)*this.nx))),iz=Math.max(0,Math.min(this.nz-1,Math.floor((z/this.depth+.5)*this.nz))),i=iz*this.nx+ix;return {x:this.flowX[i],z:this.flowZ[i]};}
 volume(){return this.heights.reduce((s,h)=>s+h*this.area,0)}
}
