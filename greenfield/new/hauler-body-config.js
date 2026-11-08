import {GREENFIELD_ACTIVE} from './development-config.js';

// One envelope for the steel body, visible ore, receivers and tipping hinge.
// +X faces the cab. Rated payload/settling calibration remains 100 tonnes.
export const HAULER_BODY=Object.freeze(GREENFIELD_ACTIVE?{
 width:3.25,depth:2.02,centerX:-.82,floor:1.92,floorThickness:.12,
 rim:2.78,frontRim:3.02,topDepth:2.34,rearStretch:.48,frontStretch:.08,
 wallThickness:.09,hingeX:-2.38,hingeY:1.73,
 canopyFront:2.62,canopyY:3.20,canopyDepth:2.40,
 settlingRim:1.20,heapHeight:.92
}:{
 width:5.2,depth:3.3,centerX:-1.55,floor:2.98,floorThickness:.18,
 rim:4.08,frontRim:4.40,topDepth:4.16,rearStretch:1.18,frontStretch:.10,
 wallThickness:.13,hingeX:-3.96,hingeY:2.78,
 canopyFront:3.07,canopyY:4.64,canopyDepth:4.62,
 settlingRim:1.73,heapHeight:1.50
});
export const HAULER_WHEELS=Object.freeze(GREENFIELD_ACTIVE?{frontX:1.56,rearX:-1.52,z:1.02,y:.68,radius:.67,rearDual:false}:{frontX:2.10,rearX:-2.15,z:1.82,y:1.14,radius:1.16,rearDual:true});
export const bodyRear=HAULER_BODY.centerX-HAULER_BODY.width/2;
export const bodyFront=HAULER_BODY.centerX+HAULER_BODY.width/2;
export const bodyTopRear=bodyRear-HAULER_BODY.rearStretch;
export const bodyTopFront=bodyFront+HAULER_BODY.frontStretch;
export const bodyRimAt=x=>HAULER_BODY.rim+(HAULER_BODY.frontRim-HAULER_BODY.rim)*Math.max(0,Math.min(1,(x-bodyTopRear)/(bodyTopFront-bodyTopRear)));
export function bodyFillFraction(x,height){return Math.max(0,Math.min(1,height/(bodyRimAt(x)-HAULER_BODY.floor)));}
export function bodyContains(x,z){return x>bodyTopRear&&x<bodyTopFront&&Math.abs(z)<HAULER_BODY.topDepth/2;}
