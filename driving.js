import * as T from './three.module.js?build=volvo-review-v2';
export function routeFor(kind,home,start){
 const x=home.x;
 const points=kind==='coming'?[[x,-8],[x+3,-8],[x+6,-14],[40,-19],[49,-9],[44,12],[27,20],[9,20],[3,14],[4,8],[5,4],[7,4]]:kind==='leaving'?[[7,4],[17,4],[35,4],[49,8],[58,3]]:[[start.x,start.z],[65,-8],[57,-25],[x-8,-25],[x-6,-16],[x-4,-8],[x,-8]];
 const curve=new T.CatmullRomCurve3(points.map(([a,b])=>new T.Vector3(a,0,b)),false,'centripetal');curve.arcLengthDivisions=600;return {curve,length:curve.getLength(),distance:0,speed:0};
}
export function advanceDrive(route,dt){
 const remaining=route.length-route.distance;
 const wanted=Math.min(6,Math.sqrt(Math.max(0,2*1.6*remaining)));
 route.speed=T.MathUtils.clamp(wanted,Math.max(0,route.speed-1.6*dt),route.speed+1.3*dt);
 const travel=Math.min(remaining,Math.max(.02,route.speed)*dt);route.distance+=travel;
 const u=Math.min(1,route.distance/route.length),position=route.curve.getPointAt(u),tangent=route.curve.getTangentAt(u);
 return {position,yaw:Math.atan2(-tangent.z,tangent.x),travel,done:route.length-route.distance<.005};
}
