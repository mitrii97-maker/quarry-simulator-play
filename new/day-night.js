// Manual shift lighting. It never advances game time or changes simulation state.
export class ShiftTime {
 constructor(night=false){this.night=!!night;this.blend=this.night?1:0;}
 toggle(){this.night=!this.night;return this.night;}
 update(dt){const target=this.night?1:0;this.blend+=(target-this.blend)*(1-Math.exp(-Math.max(0,Math.min(.1,dt))*3));if(Math.abs(this.blend-target)<.0001)this.blend=target;return this.blend;}
}
