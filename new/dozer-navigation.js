import {ground,LOOSE_AREA} from './world.js?build=hotfix-20261106-20';
import {DUMP} from './dump-layout.js?build=hotfix-20261106-20';
const STEP=.8,MIN_X=LOOSE_AREA.x-LOOSE_AREA.width/2-4,MIN_Z=LOOSE_AREA.z-LOOSE_AREA.depth/2-4,NX=Math.ceil((LOOSE_AREA.width+8)/STEP)+1,NZ=Math.ceil((LOOSE_AREA.depth+8)/STEP)+1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function dozerClear(x,z,machine,trucks=[],margin=0){
 if(x> -26-margin&&x<15+margin&&Math.abs(z)<8.0+margin)return false;
 if(Math.abs(x-(machine.baseX||0))<5.3+margin&&Math.abs(z-(machine.baseZ||0))<4+margin)return false;
 if(x>DUMP.x-DUMP.width/2-2-margin&&x<DUMP.x+DUMP.width/2+1+margin&&Math.abs(z-DUMP.z)<DUMP.depth/2+2+margin)return false;
 return !trucks.some(t=>Math.hypot(x-t.x,z-t.z)<5.2+margin);
}
export function dozerLine(start,goal,machine,trucks=[],limit=.76,height=ground){const distance=Math.hypot(goal.x-start.x,goal.z-start.z),steps=Math.max(1,Math.ceil(distance/.35));let prior=height(start.x,start.z);for(let k=1;k<=steps;k++){const x=start.x+(goal.x-start.x)*k/steps,z=start.z+(goal.z-start.z)*k/steps,h=height(x,z);if(!dozerClear(x,z,machine,trucks,Math.min(.75,Math.hypot(x-start.x,z-start.z)*.55))||Math.abs(h-prior)>distance/steps*limit+.015)return false;prior=h;}return true;}
// Full working-yard A*. A binary heap and sampled-height cache keep a distant
// spill cheap to reach; neither start nor goal is clamped to the old small grid.
export function dozerPath(start,goal,machine,trucks=[]){
 if(!dozerClear(goal.x,goal.z,machine,trucks))return null;
 if(dozerLine(start,goal,machine,trucks))return [{...goal}];
 const cell=p=>({x:clamp(Math.round((p.x-MIN_X)/STEP),0,NX-1),z:clamp(Math.round((p.z-MIN_Z)/STEP),0,NZ-1)}),a=cell(start),b=cell(goal),origin=a.z*NX+a.x,target=b.z*NX+b.x;
 const cost=new Float64Array(NX*NZ).fill(Infinity),parent=new Int32Array(NX*NZ).fill(-1),closed=new Uint8Array(NX*NZ),cached=new Uint8Array(NX*NZ),heights=new Float32Array(NX*NZ),clear=new Uint8Array(NX*NZ),heap=[];
 const px=i=>MIN_X+i%NX*STEP,pz=i=>MIN_Z+Math.floor(i/NX)*STEP,estimate=i=>Math.hypot(i%NX-b.x,Math.floor(i/NX)-b.z)*STEP;
 function sample(i){if(!cached[i]){heights[i]=ground(px(i),pz(i));clear[i]=dozerClear(px(i),pz(i),machine,trucks,Math.min(.75,Math.hypot(px(i)-start.x,pz(i)-start.z)*.55))?1:0;cached[i]=1;}}
 function push(i,priority){let k=heap.length;heap.push({i,priority});while(k){const p=(k-1)>>1;if(heap[p].priority<=priority)break;heap[k]=heap[p];k=p;}heap[k]={i,priority};}
 function pop(){const first=heap[0],last=heap.pop();if(heap.length){let k=0;while(k*2+1<heap.length){let child=k*2+1;if(child+1<heap.length&&heap[child+1].priority<heap[child].priority)child++;if(heap[child].priority>=last.priority)break;heap[k]=heap[child];k=child;}heap[k]=last;}return first.i;}
 cost[origin]=0;push(origin,estimate(origin));let visits=0;
 while(heap.length&&visits++<NX*NZ*3){const i=pop();if(closed[i])continue;closed[i]=1;if(i===target){const path=[{...goal}];for(let k=i;k!==origin;k=parent[k])path.push({x:px(k),z:pz(k)});path.reverse();const smooth=[],chain=[start,...path];let anchor=0;while(anchor<chain.length-1){let next=anchor+1;for(let j=anchor+2;j<chain.length;j++){if(!dozerLine(chain[anchor],chain[j],machine,trucks))break;next=j;}smooth.push(chain[next]);anchor=next;}return smooth;}
  sample(i);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const x=i%NX+dx,z=Math.floor(i/NX)+dz;if(x<0||x>=NX||z<0||z>=NZ)continue;const j=z*NX+x;if(closed[j])continue;sample(j);const distance=STEP*Math.hypot(dx,dz),rise=Math.abs(heights[j]-heights[i]);if(!clear[j]||rise>distance*.82)continue;
   if(dx&&dz){const q=i+dx,r=i+dz*NX;sample(q);sample(r);if(!clear[q]||!clear[r])continue;}
   const value=cost[i]+distance*(1+3*(rise/distance)**2);if(value<cost[j]){cost[j]=value;parent[j]=i;push(j,value+estimate(j));}
  }
 }return null;
}
