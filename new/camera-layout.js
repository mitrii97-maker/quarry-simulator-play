// Eye position is relative to the actual cab, centred over the operator seat.
export const CABIN_VIEW=Object.freeze({eye:Object.freeze({x:-.24,y:1.38,z:0}),forward:Object.freeze({x:10,y:-4,z:0}),horizontalFov:120});
// Limit horizontal field of view on wide screens instead of stretching the
// portrait cabin lens across the entire windscreen.
export function cameraFov(view,aspect){
 const safe=Math.max(.5,aspect);
 if(safe<1.2)return view===1?94:50;
 const horizontal=view===1?CABIN_VIEW.horizontalFov:view===2?94:90;
 return Math.min(view===1?94:58,Math.max(view===1?64:26,2*Math.atan(Math.tan(horizontal*Math.PI/360)/safe)*180/Math.PI));
}
