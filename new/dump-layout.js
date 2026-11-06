// Metres, independent of vehicle models. The elevated tipping apron keeps the
// rear wheels supported while the open tail overhangs the receiving stockpile.
// Extend storage to the west for the larger real reserve. Keep its eastern
// edge, tipping apron, bays and all haul-road trajectories in their old places.
export const DUMP={x:12.2,z:-73,width:40,depth:18,truckX:35.4,stageX:43,height:5,bays:[-67.2,-73,-78.8]};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export function dumpGround(x,z,original=0){
 const globalZ=z;z+=40;
 const area=smooth(12,15,x)*(1-smooth(64,70,x))*smooth(-56,-51,z)*(1-smooth(4,9,z));
 // Keep the receiving face steep below the rear overhang, but build long
 // approach ramps north/east of it. Haulers never drive across that face.
 const north=smooth(-25,-21,z),westA=23+(10-23)*north,westB=30+(38-30)*north;
 const pad=DUMP.height*smooth(westA,westB,x)*(1-smooth(44,62,x))*smooth(-52,-43,z)*(1-smooth(-24,4,z));
 return haulRoadGround(x,globalZ,original*(1-area)+pad*area)+dumpBermHeight(x,globalZ);
}

// A low rock safety windrow replaces fabricated wheel stops and marker posts.
export function dumpBermHeight(x,z){
 z+=40;
 const ends=smooth(-42.5,-41,z)*(1-smooth(-25,-23.5,z));
 const centre=32.70+.08*Math.sin(z*1.37)+.04*Math.sin(z*3.1);
 const section=Math.max(0,1-Math.abs(x-centre)/.95);
 return ends*section*(.52+.075*Math.sin(z*.93)+.035*Math.sin(z*2.43));
}

// Surveyed haul roads cut through the natural terrain; long ramps join the
// tipping apron to the lower loading yard instead of climbing distant ridges.
const ROAD_LINES=[[[1,-16,0],[1,-32,0],[12,-38,0],[40,-42,1],[64,-52,3],[70,-95,5],[46,-96,5],[35,-85,5],[43,-73,5],[63,-73,5]],[[55,-79,5],[70,-79,5],[83,-64,4],[83,18,0],[60,25,0],[42,10,0],[42,-8,0]],[[55,-67,5],[70,-67,5],[83,-52,4]],[[83,18,0],[51,25,0],[33,10,0],[33,-8,0]],[[83,18,0],[42,25,0],[24,10,0],[24,-8,0]]];
export function haulRoadGround(x,z,original){
 let best=Infinity,height=original;
 for(const road of ROAD_LINES)for(let i=1;i<road.length;i++){
  const a=road[i-1],b=road[i];if(x<Math.min(a[0],b[0])-10||x>Math.max(a[0],b[0])+10||z<Math.min(a[1],b[1])-10||z>Math.max(a[1],b[1])+10)continue;const dx=b[0]-a[0],dz=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),distance=Math.hypot(x-a[0]-u*dx,z-a[1]-u*dz);
  if(distance<best){best=distance;height=a[2]+(b[2]-a[2])*u;}
 }
 const apron=smooth(33,37,x)*(1-smooth(64,69,x))*smooth(-96,-90,z)*(1-smooth(-59,-54,z));
 const road=1-smooth(5.5,10,best),blend=Math.max(road,apron);
 const yard=Math.max(smooth(-24,-19,x)*(1-smooth(65,85,x))*smooth(-72,-40,z)*(1-smooth(-10,-5,z)),smooth(-42,-35,x)*(1-smooth(18,28,x))*smooth(-60,-52,z)*(1-smooth(-12,-8,z)));
 const result=original*(1-blend)+(apron>road?5:height)*blend;const industrial=smooth(24,32,x)*(1-smooth(90,100,x))*smooth(-132,-121,z)*(1-smooth(24,34,z));const floor=5*(1-smooth(-45,-14,z));return (result*(1-industrial)+floor*industrial)*(1-yard);
}
