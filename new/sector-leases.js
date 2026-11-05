// Adjacent bays share a swept safety envelope; opposite bays may work together.
export class SectorLeases {
 constructor(zs){this.zs=zs;this.trucks=new Map();this.dozers=new Map();this.cursor=0;}
 allowed(index,owner){const z=this.zs[index];return [...this.trucks,...this.dozers].every(([i,other])=>other===owner||Math.abs(z-this.zs[i])>=8);}
 reserveTruck(owner,preferred=null){for(const [i,t]of this.trucks)if(t===owner)return i;
 const order=preferred===null?this.zs.map((_,i)=>(i+this.cursor)%this.zs.length):[preferred,...this.zs.map((_,i)=>i).filter(i=>i!==preferred)];
 for(const i of order)if(this.allowed(i,owner)){this.trucks.set(i,owner);this.cursor=(i+1)%this.zs.length;return i;}return -1;}
 claimDozer(owner,index){if(!this.allowed(index,owner))return false;this.dozers.set(index,owner);return true;}
 release(owner){for(const map of [this.trucks,this.dozers])for(const [i,t]of map)if(t===owner)map.delete(i);}
 clear(){this.trucks.clear();this.dozers.clear();this.cursor=0;}
}
