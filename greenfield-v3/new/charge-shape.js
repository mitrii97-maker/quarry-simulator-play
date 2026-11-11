import {BUCKET_CONTAINER,BUCKET_INNER_WIDTH,BUCKET_SHELL_DROP,BUCKET_VOLUME,BUCKET_VISUAL_VOLUME,MACHINE} from './material-volume.js?build=greenfield-bucket-3m-1';
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n)};
const points=BUCKET_CONTAINER.map(([x,y])=>[x,y-BUCKET_SHELL_DROP]);
const front=points.map(([x,y])=>[x,y,-BUCKET_INNER_WIDTH/2]),back=points.map(([x,y])=>[x,y,BUCKET_INNER_WIDTH/2]);
const center=[points.reduce((s,p)=>s+p[0],0)/points.length,points.reduce((s,p)=>s+p[1],0)/points.length,0];
export const SHELL_FACES=[front,back,...points.map((_,i)=>{const j=(i+1)%points.length;return [front[i],front[j],back[j],back[i]]})].map(face=>dot(cross(sub(face[1],face[0]),sub(face[2],face[0])),sub(face[0],center))<0?[...face].reverse():face);
export function polyVolume(faces){let volume=0;for(const face of faces)for(let i=1;i<face.length-1;i++)volume+=dot(face[0],cross(face[i],face[i+1]))/6;return Math.abs(volume)}
export function clipCharge(normal,height){
 const faces=[],intersections=[];
 for(const face of SHELL_FACES){const clipped=[];for(let i=0;i<face.length;i++){const a=face[i],b=face[(i+1)%face.length],da=dot(a,normal)-height,db=dot(b,normal)-height;if(da<=1e-10)clipped.push(a);if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db),p=a.map((v,j)=>v+(b[j]-v)*t);clipped.push(p);if(!intersections.some(q=>Math.hypot(...sub(p,q))<1e-7))intersections.push(p)}}if(clipped.length>=3)faces.push(clipped)}
 let surface=[];
 if(intersections.length>=3){const c=[0,0,0];for(const p of intersections)for(let i=0;i<3;i++)c[i]+=p[i]/intersections.length;const u=unit(cross(normal,Math.abs(normal[2])<.8?[0,0,1]:[0,1,0])),v=cross(normal,u);surface=intersections.sort((a,b)=>Math.atan2(dot(sub(a,c),v),dot(sub(a,c),u))-Math.atan2(dot(sub(b,c),v),dot(sub(b,c),u)));faces.push(surface)}
 return {faces,surface,normal,height,volume:polyVolume(faces)};
}
export function chargeShape(fill,normal=[0,1,0]){
 normal=unit(normal);const all=SHELL_FACES.flat().map(p=>dot(p,normal));let lo=Math.min(...all)-1e-6,hi=Math.max(...all)+1e-6;const target=Math.max(0,Math.min(1,fill))*BUCKET_VISUAL_VOLUME;
 if(target<1e-10)return {faces:[],surface:[],normal,height:lo,volume:0,payloadVolume:0};
 for(let i=0;i<22;i++){const mid=(lo+hi)/2;if(clipCharge(normal,mid).volume<target)lo=mid;else hi=mid}
 const shape=clipCharge(normal,(lo+hi)/2);return {...shape,payloadVolume:shape.volume/BUCKET_VISUAL_VOLUME*BUCKET_VOLUME};
}
export function bucketUp(s){
 const a=s.boom+s.stick+s.curl,r=s.roll||0,p=s.pitch||0,y=s.yaw||0,k=Math.cos(y)*Math.sin(p)+Math.sin(y)*Math.sin(r)*Math.cos(p),j=Math.cos(r)*Math.cos(p);
 const mirror=MACHINE.kind==='face-shovel'?-1:1;
 return [mirror*(Math.cos(a)*k+Math.sin(a)*j),-Math.sin(a)*k+Math.cos(a)*j,mirror*(Math.sin(y)*Math.sin(p)-Math.cos(y)*Math.sin(r)*Math.cos(p))];
}
export function retainedVolume(s){const normal=bucketUp({...s,curl:s.curl-32*Math.PI/180}),lip=points[points.length-1],height=normal[0]*lip[0]+normal[1]*lip[1]-Math.abs(normal[2])*BUCKET_INNER_WIDTH/2;return Math.min(BUCKET_VOLUME,clipCharge(normal,height+.04).volume/BUCKET_VISUAL_VOLUME*BUCKET_VOLUME)}
