// Conservative subcell cutter. Sparse pages retain the exact space crossed by
// the teeth, including budget-limited cuts. The bank uses finer samples without
// allocating a high-resolution volume for the entire untouched worksite.
const PAGE_CELLS=64;
export function cutToothSweep(field,from,to,yaw,width,budget,{offsetX=0,offsetZ=0,base=null}={}){
 if(!(budget>0)||field.mass<=0)return 0;
 const fx=Math.cos(yaw),fz=-Math.sin(yaw),cx=-fz,cz=fx,dx=to.x-from.x,dz=to.z-from.z,along=dx*fx+dz*fz;
 if(Math.abs(along)<1e-9)return 0;
 const half=width/2,x0=Math.max(0,Math.floor((Math.min(from.x,to.x)-half-.1-offsetX+field.width/2)/field.dx)),x1=Math.min(field.nx-1,Math.floor((Math.max(from.x,to.x)+half+.1-offsetX+field.width/2)/field.dx)),z0=Math.max(0,Math.floor((Math.min(from.z,to.z)-half-.1-offsetZ+field.depth/2)/field.dz)),z1=Math.min(field.nz-1,Math.floor((Math.max(from.z,to.z)+half+.1-offsetZ+field.depth/2)/field.dz));
 const SUB=field.toothResolution===8?8:4,COUNT=SUB*SUB,PAGE_VALUES=PAGE_CELLS*COUNT;
 let micro=field.toothMicro;if(!micro||micro.sub!==SUB)micro=field.toothMicro={sub:SUB,pages:new Array(Math.ceil(field.heights.length/PAGE_CELLS)),mean:new Float64Array(field.heights.length),valid:new Uint8Array(field.heights.length),allocatedBytes:0};
 const needed=Math.max(1,(x1-x0+1)*(z1-z0+1)*COUNT);let scratch=field.toothScratch;if(!scratch||scratch.ids.length<needed)scratch=field.toothScratch={ids:new Int32Array(Math.max(1024,needed)),deltas:new Float64Array(Math.max(1024,needed))};let count=0,available=0;
 for(let row=z0;row<=z1;row++)for(let col=x0;col<=x1;col++){
  const i=row*field.nx+col,current=field.heights[i];if(current<=0&&!micro.valid[i])continue;
  const pageIndex=Math.floor(i/PAGE_CELLS),first=(i%PAGE_CELLS)*COUNT;let values=micro.pages[pageIndex];if(!values){values=micro.pages[pageIndex]=new Float64Array(PAGE_VALUES);micro.allocatedBytes+=values.byteLength;}
  if(!micro.valid[i]){values.fill(current,first,first+COUNT);micro.mean[i]=current;micro.valid[i]=1;}
  else if(Math.abs(current-micro.mean[i])>1e-10){const shift=current-micro.mean[i];let sum=0;for(let sub=0;sub<COUNT;sub++){const k=first+sub;values[k]=Math.max(0,values[k]+shift);sum+=values[k];}const scale=sum>0?current*COUNT/sum:0;for(let sub=0;sub<COUNT;sub++)values[first+sub]*=scale;micro.mean[i]=current;}
  for(let sz=0;sz<SUB;sz++)for(let sx=0;sx<SUB;sx++){
   const x=(col+(sx+.5)/SUB)*field.dx-field.width/2+offsetX,z=(row+(sz+.5)/SUB)*field.dz-field.depth/2+offsetZ,px=x-from.x,pz=z-from.z,u=px*fx+pz*fz,v=px*cx+pz*cz;
   if(u<Math.min(0,along)-1e-9||u>Math.max(0,along)+1e-9||Math.abs(v)>half)continue;
   const t=Math.max(0,Math.min(1,u/along)),floor=Math.max(0,from.y+(to.y-from.y)*t-(base?base(x,z):0)),sub=sz*SUB+sx,delta=Math.max(0,values[first+sub]-floor);if(delta<=1e-12)continue;scratch.ids[count]=i*COUNT+sub;scratch.deltas[count++]=delta;available+=delta*field.area/COUNT*field.density;
  }
 }
 if(available<=0)return 0;const scale=Math.min(1,budget/available);let removed=0;for(let n=0;n<count;n++){const k=scratch.ids[n],i=Math.floor(k/COUNT),delta=scratch.deltas[n]*scale;micro.pages[Math.floor(k/PAGE_VALUES)][k%PAGE_VALUES]-=delta;field.heights[i]=Math.max(0,field.heights[i]-delta/COUNT);micro.mean[i]=field.heights[i];removed+=delta*field.area/COUNT*field.density;}
 field.mass=Math.max(0,field.mass-removed);field.revision++;field.dirty=true;return removed;
}
