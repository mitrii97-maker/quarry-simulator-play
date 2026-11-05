// Two rigid links, with a raised elbow. Dimensions never change during operation.
export const BOOM_LENGTH=7,STICK_LENGTH=6;
export function solveArm(reach,height){
 const dx=reach-.5,dy=height-3,d=Math.hypot(dx,dy),safe=Math.max(1.001,Math.min(12.999,d));
 const angle=Math.atan2(dy,dx)+Math.acos(Math.max(-1,Math.min(1,(49+safe*safe-36)/(14*safe))));
 return {shoulder:{x:-.5,y:3},elbow:{x:-.5-7*Math.cos(angle),y:3+7*Math.sin(angle)},tip:{x:-.5-dx*safe/d,y:3+dy*safe/d}};
}
