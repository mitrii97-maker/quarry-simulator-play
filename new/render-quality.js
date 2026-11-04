// Presentation quality only: simulation cadence, reserves and contacts never change.
export const QUALITY=[
 {name:'economy',dpr:1,samples:0,ao:0,shadow:1024,snow:480},
 {name:'balanced',dpr:1.35,samples:2,ao:.5,shadow:2048,snow:800},
 {name:'high',dpr:1.65,samples:4,ao:.7,shadow:2048,snow:1100}
];
export class QualityGovernor {
 constructor(onChange,{level=1}={}){this.level=level;this.onChange=onChange;this.elapsed=0;this.slow=0;this.fast=0;this.average=16.67;this.cooldown=6;}
 sample(ms,dt){if(!Number.isFinite(ms)||ms<=0||dt<=0||dt>1)return;this.elapsed+=dt;this.average+=(ms-this.average)*(1-Math.exp(-dt*2));this.cooldown=Math.max(0,this.cooldown-dt);if(this.cooldown)return;
 this.slow=this.average>23?this.slow+dt:Math.max(0,this.slow-dt*2);this.fast=this.average<18?this.fast+dt:0;
 if(this.slow>3&&this.level>0)this.set(this.level-1);else if(this.fast>18&&this.level<2)this.set(this.level+1);}
 set(level){level=Math.max(0,Math.min(2,level));if(level===this.level)return;this.level=level;this.slow=this.fast=0;this.cooldown=10;this.onChange(QUALITY[level]);}
}
export class FrameMetrics {
 constructor(size=240){this.frames=new Float32Array(size);this.cpu=new Float32Array(size);this.index=0;this.count=0;}
 record(frame,cpu){this.frames[this.index]=frame;this.cpu[this.index]=cpu;this.index=(this.index+1)%this.frames.length;this.count=Math.min(this.count+1,this.frames.length);}
 snapshot(){const summarize=a=>{const values=Array.from(a.subarray(0,this.count)).sort((a,b)=>a-b);return {meanMs:values.reduce((s,x)=>s+x,0)/(values.length||1),p95Ms:values[Math.min(values.length-1,Math.floor(values.length*.95))]||0}};return {samples:this.count,frame:summarize(this.frames),cpu:summarize(this.cpu)};}
}
