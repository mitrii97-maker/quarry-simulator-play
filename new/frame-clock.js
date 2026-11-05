// Fixed simulation cadence, bounded catch-up and an explicit pause boundary.
export class FixedClock {
 constructor({step=1/120,maxSteps=8,maxFrame=.1}={}){Object.assign(this,{step,maxSteps,maxFrame});this.accumulator=0;this.last=null;this.dropped=0;}
 reset(now=null){this.accumulator=0;this.last=now;}
 advance(now,simulate){if(this.last===null){this.last=now;return {steps:0,alpha:0,dt:0}}const elapsed=Math.max(0,(now-this.last)/1000);this.last=now;const dt=Math.min(this.maxFrame,elapsed);this.dropped+=Math.floor(Math.max(0,elapsed-dt)/this.step);this.accumulator+=dt;let steps=0;while(this.accumulator+1e-10>=this.step&&steps<this.maxSteps){simulate(this.step);this.accumulator-=this.step;steps++;}if(this.accumulator>=this.step){const extra=Math.floor(this.accumulator/this.step);this.dropped+=extra;this.accumulator-=extra*this.step}return {steps,alpha:Math.max(0,Math.min(1,this.accumulator/this.step)),dt};}
}
