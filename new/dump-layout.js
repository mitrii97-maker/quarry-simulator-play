// Metres, independent of vehicle models. The elevated tipping apron keeps the
// rear wheels supported while the open tail overhangs the receiving stockpile.
// Extend storage to the west for the larger real reserve. Keep its eastern
// edge, tipping apron, bays and all haul-road trajectories in their old places.
export const DUMP={x:12.2,z:-33,width:40,depth:18,truckX:35.4,stageX:43,height:5,bays:[-27.2,-33,-38.8]};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export function dumpGround(x,z,original=0){
 const area=smooth(12,15,x)*(1-smooth(64,70,x))*smooth(-56,-51,z)*(1-smooth(4,9,z));
 // Keep the receiving face steep below the rear overhang, but build long
 // approach ramps north/east of it. Haulers never drive across that face.
 const north=smooth(-25,-21,z),westA=23+(10-23)*north,westB=30+(38-30)*north;
 const pad=DUMP.height*smooth(westA,westB,x)*(1-smooth(44,62,x))*smooth(-52,-43,z)*(1-smooth(-24,4,z));
 return original*(1-area)+pad*area;
}
