import * as T from '../three.module.js?build=boom-20261107-30';
import {ground} from './world.js?build=boom-20261107-30';
// All winter effects are visual. They never change the dig reserve, controls or contact geometry.
export function createSnowfall(scene){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d'),g=c.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,32,32);
 const count=1100,positions=new Float32Array(count*3),seeds=new Float32Array(count),geo=new T.BufferGeometry();for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*85;positions[i*3+1]=Math.random()*34+1;positions[i*3+2]=(Math.random()-.5)*85;seeds[i]=Math.random()}
 geo.setAttribute('position',new T.BufferAttribute(positions,3));const flakes=new T.Points(geo,new T.PointsMaterial({color:'#f5faff',map:new T.CanvasTexture(canvas),size:.045,transparent:true,opacity:.18,depthWrite:false}));flakes.frustumCulled=false;scene.add(flakes);
 let activeCount=count;
 function update(dt,time,camera){for(let i=0;i<activeCount;i++){const j=i*3;positions[j]+=dt*(.48+Math.sin(time*.3+seeds[i]*30)*.35);positions[j+1]-=dt*(.65+seeds[i]*.9);positions[j+2]+=dt*Math.sin(time*.22+seeds[i]*40)*.15;if(positions[j+1]<ground(positions[j],positions[j+2])+.12){positions[j]=camera.position.x+(Math.random()-.5)*75;positions[j+2]=camera.position.z+(Math.random()-.5)*75;positions[j+1]=camera.position.y+12+Math.random()*13}if(positions[j]-camera.position.x>48)positions[j]-=90;else if(positions[j]-camera.position.x< -48)positions[j]+=90;if(positions[j+2]-camera.position.z>48)positions[j+2]-=90;else if(positions[j+2]-camera.position.z< -48)positions[j+2]+=90;}geo.attributes.position.needsUpdate=true;}
 return {flakes,update,setCount(n){activeCount=Math.min(count,n);geo.setDrawRange(0,activeCount)}};
}
