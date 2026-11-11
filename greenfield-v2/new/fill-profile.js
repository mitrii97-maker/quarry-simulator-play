// Integrate the actual two-triangle grid, not a count of decorative stones.
// Reused typed arrays make the volume solve allocation-free at control rate.
export function gridVolumeWeights(nx,nz,width,depth){const w=new Float64Array(nx*nz),area=width/(nx-1)*depth/(nz-1)/6;for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;w[a]+=area;w[b]+=area*2;w[c]+=area*2;w[d]+=area;}return w;}
export function solveFilledSurface(guide,floor,ceiling,weights,requested,out){
 let capacity=0,low=Infinity,high=-Infinity;for(let i=0;i<out.length;i++){capacity+=(ceiling[i]-floor[i])*weights[i];low=Math.min(low,floor[i]-guide[i]);high=Math.max(high,ceiling[i]-guide[i]);}
 const target=Math.max(0,Math.min(capacity,requested));if(target<=1e-12){out.set(floor);return 0;}if(capacity-target<=1e-10){out.set(ceiling);return capacity;}
 for(let step=0;step<24;step++){const level=(low+high)/2;let volume=0;for(let i=0;i<out.length;i++)volume+=(Math.max(floor[i],Math.min(ceiling[i],guide[i]+level))-floor[i])*weights[i];if(volume<target)low=level;else high=level;}
 const level=(low+high)/2;let volume=0;for(let i=0;i<out.length;i++){out[i]=Math.max(floor[i],Math.min(ceiling[i],guide[i]+level));volume+=(out[i]-floor[i])*weights[i];}return volume;
}
export function sampleGrid(array,nx,nz,width,depth,x,z){const fx=Math.max(0,Math.min(nx-1,(x/width+.5)*(nx-1))),fz=Math.max(0,Math.min(nz-1,(z/depth+.5)*(nz-1))),i=Math.min(nx-2,Math.floor(fx)),j=Math.min(nz-2,Math.floor(fz)),u=fx-i,v=fz-j,a=j*nx+i;return array[a]*(1-u)*(1-v)+array[a+1]*u*(1-v)+array[a+nx]*(1-u)*v+array[a+nx+1]*u*v;}
