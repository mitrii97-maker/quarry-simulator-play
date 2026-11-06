import {HAULER_BODY as B,bodyFront,bodyTopFront,bodyTopRear,bodyRimAt} from './hauler-body-config.js?build=volvo-review-v2';
// Surfaces shared by bucket/fragment contacts. Local +X points toward the cab.
export function truckLocal(truck,x,z){const dx=x-truck.x,dz=z-truck.z,c=Math.cos(truck.yaw),s=Math.sin(truck.yaw);return {x:c*dx-s*dz,z:s*dx+c*dz};}
export function truckSurfaceY(truck,x,y,z){const pitch=truck.pitch||0,roll=truck.roll||0;return (truck.root?.position.y||0)+(x*Math.sin(pitch)+y*Math.cos(pitch))*Math.cos(roll)-z*Math.sin(roll);}
export function hardTruckSurface(truck,x,z){
 const p=truckLocal(truck,x,z),w=Math.abs(p.z);let height=-Infinity,slideX=0,slideZ=0;
 if(p.x>bodyTopFront&&p.x<B.canopyFront&&w<B.canopyDepth/2){height=B.frontRim+(B.canopyY-B.frontRim)*(p.x-bodyTopFront)/(B.canopyFront-bodyTopFront);slideX=-.45;}
 else if(p.x>bodyFront&&p.x<bodyTopFront&&w<B.topDepth/2){height=B.floor+(B.frontRim-B.floor)*(p.x-bodyFront)/(bodyTopFront-bodyFront);slideX=-.65;}
 else if(p.x>bodyTopRear-.07&&p.x<bodyTopFront&&w<B.topDepth/2+.14&&w>B.depth/2){const t=Math.min(1,(w-B.depth/2)/((B.topDepth-B.depth)/2));height=B.floor+(bodyRimAt(p.x)-B.floor)*t;slideZ=-Math.sign(p.z)*.65;if(p.x<bodyTopRear+.5)slideX=-.6;}
 else if(w>1.86){for(const wheel of [-2.15,2.1]){const radius=1.16,dx=p.x-wheel,half=wheel<0?.7:.44;if(Math.abs(dx)<radius&&Math.abs(w-1.82)<half){const top=1.14+Math.sqrt(radius*radius-dx*dx);if(top>height){height=top;slideX=dx*.8;slideZ=Math.sign(p.z)*.9;}}}}
 // Collision tops follow the same sprung chassis pose as the visible body.
 if(Number.isFinite(height)&&w>1.86&&height<3){const s=truck.suspension;if(s)height-=s.heave+p.x*Math.sin(s.pitch)-p.z*Math.sin(s.roll);}
 return {height:Number.isFinite(height)?truckSurfaceY(truck,p.x,height,p.z):height,slideX,slideZ};
}
