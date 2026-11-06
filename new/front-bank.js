// Sparse vertical interval columns for real, temporary undercuts. The existing
// height field remains the mass ledger and the settled-terrain representation.
// Only a working patch is subdivided; no global voxel world or rigid stones.
const SX=4,SZ=2,SUB=SX*SZ,LAYERS=6,STRIDE=LAYERS*2,EPS=1e-8;
export class FrontBank {
 constructor(field,{offsetX=0,offsetZ=0,maxPages=384}={}){
  Object.assign(this,{field,offsetX,offsetZ,maxPages});this.pages=new Map();this.pool=[];this.revision=0;this.elapsed=0;
  this.dx=field.dx/SX;this.dz=field.dz/SZ;this.area=this.dx*this.dz;
  this.fixed=new Uint8Array(field.heights.length);field.fixedCells=this.fixed;
  this.ids=new Int32Array(8192);this.subs=new Uint8Array(8192);this.lows=new Float64Array(8192);this.highs=new Float64Array(8192);
  this.result={mass:0,available:0,cells:0};this.renderMask=new Uint8Array(field.heights.length);this.renderIds=new Int32Array(field.heights.length);this.maskCache=new Uint8Array(field.heights.length);this.maskRevision=-1;this.neighbour=new Float64Array(STRIDE);this.supportOffsets=[[this.dx,0],[-this.dx,0],[0,this.dz],[0,-this.dz]];
  this.tool=null;this.toolMask=new Uint8Array(field.heights.length);this.toolCells=new Int32Array(256);this.toolCount=0;
 }
 index(x,z){const f=this.field,ix=Math.floor((x-this.offsetX+f.width/2)/f.dx),iz=Math.floor((z-this.offsetZ+f.depth/2)/f.dz);return ix<0||iz<0||ix>=f.nx||iz>=f.nz?-1:iz*f.nx+ix;}
 subIndex(x,z,i){const f=this.field,xx=this.offsetX-f.width/2+i%f.nx*f.dx,zz=this.offsetZ-f.depth/2+Math.floor(i/f.nx)*f.dz;return Math.max(0,Math.min(SZ-1,Math.floor((z-zz)/this.dz)))*SX+Math.max(0,Math.min(SX-1,Math.floor((x-xx)/this.dx)));}
 ensure(i){
  let p=this.pages.get(i);if(p){this.sync(p);return p;}if(this.pages.size>=this.maxPages)return null;
  p=this.pool.pop()||{ranges:new Float64Array(SUB*STRIDE),counts:new Uint8Array(SUB),delay:new Float64Array(SUB),speed:new Float64Array(SUB)};
  p.i=i;p.expected=this.field.heights[i];p.edited=false;p.detail=false;p.counts.fill(p.expected>EPS?1:0);p.delay.fill(-1);p.speed.fill(0);p.ranges.fill(0);p.top=(this.field.base?.[i]||0)+p.expected;
  const f=this.field,base=f.base?.[i]||0;let mean=0;for(let s=0;s<SUB;s++){const x=-f.width/2+(i%f.nx+(s%SX+.5)/SX)*f.dx,z=-f.depth/2+(Math.floor(i/f.nx)+(Math.floor(s/SX)+.5)/SZ)*f.dz,h=f.heightAt(x,z);p.ranges[s*STRIDE+1]=h;mean+=h/SUB;}const scale=mean>EPS?p.expected/mean:0;for(let s=0;s<SUB;s++){p.ranges[s*STRIDE]=base;p.ranges[s*STRIDE+1]=base+p.ranges[s*STRIDE+1]*scale;}
  this.pages.set(i,p);return p;
 }
 heightOf(p,s){let h=0;for(let j=0;j<p.counts[s];j++)h+=p.ranges[s*STRIDE+j*2+1]-p.ranges[s*STRIDE+j*2];return h;}
 sync(p){
  const target=Math.max(0,this.field.heights[p.i]);if(Math.abs(target-p.expected)<1e-9)return;
  // Compatibility with old top cuts, bulldozer work and height-field slides.
  let delta=(target-p.expected)*SUB;
  if(delta<0){for(let pass=0;pass<SUB+1&&delta< -EPS;pass++){let count=0;for(let s=0;s<SUB;s++)if(p.counts[s])count++;if(!count)break;const share=-delta/count;for(let s=0;s<SUB;s++){let left=share;while(left>EPS&&p.counts[s]){const k=s*STRIDE+(p.counts[s]-1)*2,h=p.ranges[k+1]-p.ranges[k],take=Math.min(h,left);p.ranges[k+1]-=take;left-=take;delta+=take;if(p.ranges[k+1]-p.ranges[k]<EPS)p.counts[s]--;}}}}
  else if(delta>EPS){const add=delta/SUB;for(let s=0;s<SUB;s++){if(!p.counts[s]){p.counts[s]=1;p.ranges[s*STRIDE]=this.field.base?.[p.i]||0;p.ranges[s*STRIDE+1]=p.ranges[s*STRIDE];}p.ranges[s*STRIDE+(p.counts[s]-1)*2+1]+=add;}}
  p.expected=target;this.updateFixed(p);this.revision++;
 }
 nearTool(p){const t=this.tool;if(!t)return false;const f=this.field,x=this.offsetX-f.width/2+p.i%f.nx*f.dx,z=this.offsetZ-f.depth/2+Math.floor(p.i/f.nx)*f.dz;return x<t.maxX&&x+f.dx>t.minX&&z<t.maxZ&&z+f.dz>t.minZ;}
 updateFixed(p){let gaps=false,top=0,min=Infinity,max=-Infinity;for(let s=0;s<SUB;s++){gaps||=p.counts[s]>1;const h=p.counts[s]?p.ranges[s*STRIDE+(p.counts[s]-1)*2+1]:(this.field.base?.[p.i]||0);top+=h;min=Math.min(min,h);max=Math.max(max,h);}p.top=top/SUB;p.detail=p.edited&&(gaps||max-min>.008);this.fixed[p.i]=gaps||this.toolMask[p.i]||p.detail&&this.nearTool(p)?1:0;}
 setTool(bounds){
  const f=this.field;this.tool=bounds;for(let k=0;k<this.toolCount;k++){const i=this.toolCells[k];this.toolMask[i]=0;const p=this.pages.get(i);if(p)this.updateFixed(p);else this.fixed[i]=0;}this.toolCount=0;if(!bounds)return;
  const x0=Math.max(0,Math.floor((bounds.minX-this.offsetX+f.width/2)/f.dx)),x1=Math.min(f.nx-1,Math.floor((bounds.maxX-this.offsetX+f.width/2)/f.dx)),z0=Math.max(0,Math.floor((bounds.minZ-this.offsetZ+f.depth/2)/f.dz)),z1=Math.min(f.nz-1,Math.floor((bounds.maxZ-this.offsetZ+f.depth/2)/f.dz));
  const needed=Math.max(0,x1-x0+1)*Math.max(0,z1-z0+1);if(needed>this.toolCells.length)this.toolCells=new Int32Array(needed);
  for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const i=z*f.nx+x;this.toolMask[i]=this.fixed[i]=1;this.toolCells[this.toolCount++]=i;}
 }
 top(i){const p=this.pages.get(i);if(!p)return (this.field.base?.[i]||0)+this.field.heights[i];this.sync(p);return p.top;}
 heightAt(x,z){
  const f=this.field,gx=Math.max(0,Math.min(f.nx-1,(x-this.offsetX+f.width/2)/f.dx-.5)),gz=Math.max(0,Math.min(f.nz-1,(z-this.offsetZ+f.depth/2)/f.dz-.5)),ix=Math.floor(gx),iz=Math.floor(gz),tx=gx-ix,tz=gz-iz,a=iz*f.nx+ix,b=iz*f.nx+Math.min(f.nx-1,ix+1),c=Math.min(f.nz-1,iz+1)*f.nx+ix,d=Math.min(f.nz-1,iz+1)*f.nx+Math.min(f.nx-1,ix+1);
  return (this.top(a)*(1-tx)+this.top(b)*tx)*(1-tz)+(this.top(c)*(1-tx)+this.top(d)*tx)*tz;
 }
 segmentsAt(x,z,out){const i=this.index(x,z);if(i<0)return 0;const p=this.pages.get(i);if(!p){out[0]=this.field.base?.[i]||0;out[1]=out[0]+this.field.heights[i];return out[1]-out[0]>EPS?1:0;}this.sync(p);const s=this.subIndex(x,z,i),n=p.counts[s];for(let j=0;j<n*2;j++)out[j]=p.ranges[s*STRIDE+j];return n;}
 surfaceAt(x,z){const i=this.index(x,z),p=this.pages.get(i);if(!p)return this.heightAt(x,z);this.sync(p);const s=this.subIndex(x,z,i),n=p.counts[s];return n?p.ranges[s*STRIDE+(n-1)*2+1]:(this.field.base?.[i]||0);}
 solidAt(x,y,z,skin=0){const i=this.index(x,z);if(i<0)return false;if(!this.pages.has(i))return y>(this.field.base?.[i]||0)+skin&&y<this.heightAt(x,z)-skin;const n=this.segmentsAt(x,z,this.neighbour);for(let j=0;j<n;j++)if(y>this.neighbour[j*2]+skin&&y<this.neighbour[j*2+1]-skin)return true;return false;}
 depthAt(x,y,z){const i=this.index(x,z);if(i<0)return 0;let depth=0;if(!this.pages.has(i)){const lo=this.field.base?.[i]||0,hi=this.heightAt(x,z);depth=y>lo&&y<hi?Math.min(y-lo,hi-y):0;}else{const n=this.segmentsAt(x,z,this.neighbour);for(let j=0;j<n;j++){const lo=this.neighbour[j*2],hi=this.neighbour[j*2+1];if(y>lo&&y<hi){depth=Math.min(y-lo,hi-y);break;}}}if(depth<.015)return depth;
  // Horizontal void boundaries matter just as much as floor/roof height.
  // A point a millimetre inside a sidewall is not metres deep in rock.
  const ox=this.offsetX-this.field.width/2,oz=this.offsetZ-this.field.depth/2,lx=ox+Math.floor((x-ox)/this.dx)*this.dx,lz=oz+Math.floor((z-oz)/this.dz)*this.dz;
  for(let n=1;n<=4;n++){const left=x-lx+(n-1)*this.dx,right=lx+this.dx-x+(n-1)*this.dx,back=z-lz+(n-1)*this.dz,front=lz+this.dz-z+(n-1)*this.dz;if(left<depth&&!this.solidAt(lx-(n-.5)*this.dx,y,z))depth=left;if(right<depth&&!this.solidAt(lx+(n+.5)*this.dx,y,z))depth=right;if(back<depth&&!this.solidAt(x,y,lz-(n-.5)*this.dz))depth=back;if(front<depth&&!this.solidAt(x,y,lz+(n+.5)*this.dz))depth=front;}
  return depth;
 }
 supportAt(x,z){const p=this.pages.get(this.index(x,z));if(!p)return true;for(let s=0;s<SUB;s++)if(p.counts[s]>1)return false;return true;}
 compact(p,s){
  // Hydraulic abrasion can leave millimetre-separated chips in one column.
  // Let those unstable seams close conservatively before the interval budget
  // can turn into an artificial rock wall that no longer accepts any cut.
  if(p.counts[s]<LAYERS)return false;const off=s*STRIDE;let at=-1,cost=Infinity;
  for(let j=1;j<p.counts[s]-1;j++){const d=p.ranges[off+j*2]-p.ranges[off+j*2-1],h=p.ranges[off+j*2+1]-p.ranges[off+j*2];if(h<.14&&h*d<cost){cost=h*d;at=j;}}
  if(at<0)return false;const height=p.ranges[off+at*2+1]-p.ranges[off+at*2];
  // Settle just this small chip onto the solid below it. Moving every higher
  // interval would slowly lower the whole supported roof through the bowl.
  p.ranges[off+(at-1)*2+1]+=height;for(let j=at;j<p.counts[s]-1;j++){p.ranges[off+j*2]=p.ranges[off+j*2+2];p.ranges[off+j*2+1]=p.ranges[off+j*2+3];}p.counts[s]--;this.updateFixed(p);this.field.revision++;this.revision++;return true;
 }
 erase(p,s,lo,hi){
  const off=s*STRIDE;let total=0;
  for(let j=0;j<p.counts[s];j++){let a=p.ranges[off+j*2],b=p.ranges[off+j*2+1],l=Math.max(a,lo),h=Math.min(b,hi);if(h-l<=EPS)continue;
   if(l>a+EPS&&h<b-EPS&&p.counts[s]>=LAYERS)continue;
   total+=h-l;
   if(l<=a+EPS&&h>=b-EPS){for(let k=j;k<p.counts[s]-1;k++){p.ranges[off+k*2]=p.ranges[off+k*2+2];p.ranges[off+k*2+1]=p.ranges[off+k*2+3];}p.counts[s]--;j--;}
   else if(l<=a+EPS)p.ranges[off+j*2]=h;
   else if(h>=b-EPS)p.ranges[off+j*2+1]=l;
   else{for(let k=p.counts[s];k>j+1;k--){p.ranges[off+k*2]=p.ranges[off+k*2-2];p.ranges[off+k*2+1]=p.ranges[off+k*2-1];}p.ranges[off+j*2+1]=l;p.ranges[off+(j+1)*2]=h;p.ranges[off+(j+1)*2+1]=b;p.counts[s]++;j++;}
  }
  if(total>0){p.edited=true;if(p.counts[s]>1&&p.delay[s]<0)p.delay[s]=.15+this.field.cohesion*1.5+Math.min(.35,this.heightOf(p,s)*.035);p.expected-=total/SUB;this.field.heights[p.i]=Math.max(0,this.field.heights[p.i]-total/SUB);this.updateFixed(p);}
  return total;
 }
 chipAt(x,y,z,budget){
  // Shell pressure fractures the exact occupied subcolumn, independently of
  // the tooth strip. It must remain possible to close/withdraw a FULL bowl.
  const i=this.index(x,z);if(i<0||!(budget>0))return 0;const p=this.ensure(i);if(!p)return 0;const s=this.subIndex(x,z,i);this.compact(p,s);const off=s*STRIDE;
  for(let j=0;j<p.counts[s];j++){const a=p.ranges[off+j*2],b=p.ranges[off+j*2+1];if(y<a||y>b)continue;let lo=Math.max(a,y-.06),hi=Math.min(b,y+.16),top=false;
   if(p.counts[s]>=LAYERS&&lo>a+EPS&&hi<b-EPS){if(lo-a<b-hi)lo=a;else{hi=b;top=true;}}
   const length=Math.min(hi-lo,budget/(this.area*this.field.density));if(top)lo=hi-length;else hi=lo+length;
   const mass=this.erase(p,s,lo,hi)*this.area*this.field.density;if(mass>0){this.field.mass=Math.max(0,this.field.mass-mass);this.field.revision++;this.field.dirty=true;this.revision++;}return mass;
  }return 0;
 }
 cutSweep(from,to,yaw,width,biteHeight,budget,{skin=.075}={}){
  const r=this.result;r.mass=r.available=r.cells=0;r.changed=false;if(!(budget>0))return r;
  const f=this.field,c=Math.cos(yaw),s=Math.sin(yaw),along=(to.x-from.x)*c-(to.z-from.z)*s,half=width/2;
  const x0=Math.max(0,Math.floor((Math.min(from.x,to.x)-half-skin-this.offsetX+f.width/2)/this.dx)),x1=Math.min(f.nx*SX-1,Math.floor((Math.max(from.x,to.x)+half+skin-this.offsetX+f.width/2)/this.dx)),z0=Math.max(0,Math.floor((Math.min(from.z,to.z)-half-skin-this.offsetZ+f.depth/2)/this.dz)),z1=Math.min(f.nz*SZ-1,Math.floor((Math.max(from.z,to.z)+half+skin-this.offsetZ+f.depth/2)/this.dz));let count=0;
  for(let iz=z0;iz<=z1;iz++)for(let ix=x0;ix<=x1;ix++){
   const x=this.offsetX-f.width/2+(ix+.5)*this.dx,z=this.offsetZ-f.depth/2+(iz+.5)*this.dz,u=(x-from.x)*c-(z-from.z)*s,v=(x-from.x)*s+(z-from.z)*c;
   if(u<Math.min(0,along)-skin||u>Math.max(0,along)+skin||Math.abs(v)>half)continue;
   const i=Math.floor(iz/SZ)*f.nx+Math.floor(ix/SX),sub=iz%SZ*SX+ix%SX,t=Math.abs(along)>.00001?Math.max(0,Math.min(1,u/along)):.5,low=from.y+(to.y-from.y)*t-.025,high=Math.max(from.y,to.y)+biteHeight;
   if(high<(f.base?.[i]||0))continue;const p=this.ensure(i);if(!p)continue;const n=p.counts[sub],subTop=n?p.ranges[sub*STRIDE+(n-1)*2+1]:(f.base?.[i]||0);if(low>subTop)continue;r.changed=this.compact(p,sub)||r.changed;
   for(let j=0;j<p.counts[sub];j++){const a=p.ranges[sub*STRIDE+j*2],b=p.ranges[sub*STRIDE+j*2+1],lo=Math.max(a,low),hi=Math.min(b,high);if(hi-lo<=EPS||count===this.ids.length)continue;if(lo>a+EPS&&hi<b-EPS&&p.counts[sub]>=LAYERS)continue;this.ids[count]=i;this.subs[count]=sub;this.lows[count]=lo;this.highs[count]=hi;r.available+=(hi-lo)*this.area*f.density;count++;}
  }
  const factor=Math.min(1,budget/Math.max(EPS,r.available));
  for(let k=0;k<count;k++){const p=this.pages.get(this.ids[k]),lo=this.lows[k],hi=lo+(this.highs[k]-lo)*factor,removed=this.erase(p,this.subs[k],lo,hi);r.mass+=removed*this.area*f.density;if(removed>0)r.cells++;}
  if(r.mass>0)f.mass=Math.max(0,f.mass-r.mass);if(r.mass>EPS){f.revision++;f.dirty=true;this.revision++;}return r;
 }
 settle(dt,onFall=null,onChange=null){
  let moved=0;
  for(const [i,p]of this.pages){this.sync(p);let changed=false;
   for(let s=0;s<SUB;s++){if(p.counts[s]<2)continue;if(p.delay[s]>0){p.delay[s]-=dt;continue;}const off=s*STRIDE;
    for(let j=1;j<p.counts[s];j++){const gap=p.ranges[off+j*2]-p.ranges[off+j*2-1];if(gap<EPS)continue;
     const x=this.offsetX-this.field.width/2+(i%this.field.nx+(s%SX+.5)/SX)*this.field.dx,z=this.offsetZ-this.field.depth/2+(Math.floor(i/this.field.nx)+(Math.floor(s/SX)+.5)/SZ)*this.field.dz,y=p.ranges[off+j*2];let support=0;
     for(const [dx,dz]of this.supportOffsets)support+=this.solidAt(x+dx,y+.03,z+dz)?1:0;
     p.speed[s]=Math.min(1.8,p.speed[s]+dt*(3.5+(4-support))/(1+this.field.cohesion*2));let drop=Math.min(gap,p.speed[s]*dt);const tool=this.tool;
     if(tool&&x>tool.minX&&x<tool.maxX&&z>tool.minZ&&z<tool.maxZ&&p.ranges[off+j*2+1]>tool.minY&&y-drop<tool.maxY+.025)drop=Math.min(drop,Math.max(0,y-tool.maxY-.025));
     if(drop<=EPS){p.speed[s]=0;continue;}
     for(let k=j;k<p.counts[s];k++){p.ranges[off+k*2]-=drop;p.ranges[off+k*2+1]-=drop;}moved+=drop*this.area;changed=true;onFall?.(x,y,z,drop,drop*this.area);
     if(gap-drop<EPS){p.ranges[off+(j-1)*2+1]=p.ranges[off+j*2+1];for(let k=j;k<p.counts[s]-1;k++){p.ranges[off+k*2]=p.ranges[off+k*2+2];p.ranges[off+k*2+1]=p.ranges[off+k*2+3];}p.counts[s]--;j--;}
    }
   }
   let gaps=false;for(let s=0;s<SUB;s++)gaps||=p.counts[s]>1;
   // Preserve the fine cut while the bowl occupies it. Once released, loose
   // micro-relief levels gradually, conserving its exact mean solid volume.
   if(!gaps&&p.detail&&!this.nearTool(p)){const base=this.field.base?.[i]||0,rate=1-Math.exp(-dt*4);for(let s=0;s<SUB;s++){const h=this.heightOf(p,s),next=h+(p.expected-h)*rate;p.counts[s]=next>EPS?1:0;p.ranges[s*STRIDE]=base;p.ranges[s*STRIDE+1]=base+next;}changed=true;}
   this.updateFixed(p);if(changed){this.revision++;this.field.revision++;onChange?.(this.offsetX-this.field.width/2+(i%this.field.nx+.5)*this.field.dx,this.offsetZ-this.field.depth/2+(Math.floor(i/this.field.nx)+.5)*this.field.dz);}
   if(!p.detail&&!this.fixed[i]){this.pages.delete(i);if(this.pool.length<128)this.pool.push(p);}
  }
  return moved;
 }
 detailedAt(x,z){return this.pages.get(this.index(x,z))?.detail===true;}
 maskAt(x,z,halo=1){if(!this.pages.size)return false;const i=this.index(x,z);if(i<0)return false;const f=this.field;if(halo===1){if(this.maskRevision!==this.revision){this.maskCache.fill(0);for(const [id,p]of this.pages)if(p.detail)for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const x=id%f.nx+dx,z=Math.floor(id/f.nx)+dz;if(x>=0&&z>=0&&x<f.nx&&z<f.nz)this.maskCache[z*f.nx+x]=1;}this.maskRevision=this.revision;}return this.maskCache[i]===1;}const c=i%f.nx,r=Math.floor(i/f.nx);for(let dz=-halo;dz<=halo;dz++)for(let dx=-halo;dx<=halo;dx++){const x=c+dx,z=r+dz;if(x>=0&&z>=0&&x<f.nx&&z<f.nz&&this.pages.get(z*f.nx+x)?.detail)return true;}return false;}
 visitBoxes(visit){
  const f=this.field;this.renderMask.fill(0);let used=0;for(const [i,p]of this.pages)if(p.detail)for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const c=i%f.nx+dx,r=Math.floor(i/f.nx)+dz;if(c>=0&&r>=0&&c<f.nx&&r<f.nz){const id=r*f.nx+c;if(!this.renderMask[id]){this.renderMask[id]=1;this.renderIds[used++]=id;}}}
  for(let k=0;k<used;k++){const i=this.renderIds[k];for(let s=0;s<SUB;s++){const x=this.offsetX-f.width/2+(i%f.nx+s%SX/SX)*f.dx,z=this.offsetZ-f.depth/2+(Math.floor(i/f.nx)+Math.floor(s/SX)/SZ)*f.dz,n=this.segmentsAt(x+this.dx*.5,z+this.dz*.5,this.neighbour);for(let j=0;j<n;j++)visit(x,z,this.dx,this.dz,this.neighbour[j*2],this.neighbour[j*2+1],j===n-1);}}
 }
 reset(){for(const p of this.pages.values())if(this.pool.length<128)this.pool.push(p);this.pages.clear();this.fixed.fill(0);this.toolMask.fill(0);this.toolCount=0;this.tool=null;this.revision++;}
 snapshot(){let voidVolume=0;for(const p of this.pages.values())for(let s=0;s<SUB;s++)for(let j=1;j<p.counts[s];j++)voidVolume+=(p.ranges[s*STRIDE+j*2]-p.ranges[s*STRIDE+j*2-1])*this.area;const bytes=(this.pages.size+this.pool.length)*(SUB*STRIDE*8+SUB*17)+this.fixed.byteLength+this.toolMask.byteLength+this.toolCells.byteLength+this.ids.byteLength+this.subs.byteLength+this.lows.byteLength+this.highs.byteLength+this.neighbour.byteLength+this.renderMask.byteLength+this.renderIds.byteLength+this.maskCache.byteLength;return {pages:this.pages.size,pooled:this.pool.length,voidVolume,revision:this.revision,bytes};}
}
