import * as T from '../three.module.js?build=boom-20261107-30';

// A constant light-space grid keeps stationary shadow edges fixed while driving.
export const SUN_OFFSET=new T.Vector3(-38,52,-22);
const direction=SUN_OFFSET.clone().normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right);
export function shadowAnchor(x,y,z,span,resolution,out=new T.Vector3()){
 const texel=span/resolution,p=out.set(x,y,z),r=p.dot(right),u=p.dot(up);
 return p.addScaledVector(right,Math.round(r/texel)*texel-r).addScaledVector(up,Math.round(u/texel)*texel-u);
}
export function placeSun(sun,state,profile){
 const span=profile.shadowSpan,cam=sun.shadow.camera;
 if(cam.right!==span/2){Object.assign(cam,{left:-span/2,right:span/2,top:span/2,bottom:-span/2,near:1,far:160});cam.updateProjectionMatrix();}
 shadowAnchor(state.baseX,state.baseY+3,state.baseZ,span,profile.shadow,sun.target.position);
 sun.position.copy(sun.target.position).add(SUN_OFFSET);
 sun.shadow.normalBias=.018;sun.shadow.bias=-.00006;
}

// Terrain-conforming ambient contact, including outside the sun's local map.
// One reusable draw for all tyres, tracks and the bucket; no extra shadow pass.
export function createContactShadows(scene,height,rig,trucks){
 const count=3+trucks.length*4,side=5,vertices=count*side*side,pos=new Float32Array(vertices*3),uv=new Float32Array(vertices*2),alpha=new Float32Array(vertices),indices=[];
 for(let n=0;n<count;n++)for(let j=0;j<side;j++)for(let i=0;i<side;i++){const k=n*side*side+j*side+i;uv[k*2]=i/(side-1);uv[k*2+1]=j/(side-1);if(i<side-1&&j<side-1)indices.push(k,k+side,k+1,k+1,k+side,k+side+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setAttribute('contactAlpha',new T.BufferAttribute(alpha,1).setUsage(T.DynamicDrawUsage));geo.setIndex(indices);
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,uniforms:{strength:{value:1}},vertexShader:`attribute float contactAlpha;varying vec2 vUv;varying float a;void main(){vUv=uv;a=contactAlpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float strength;varying vec2 vUv;varying float a;void main(){vec2 p=abs(vUv-.5)*2.;float f=pow(max(0.,1.-dot(p,p)),2.);gl_FragColor=vec4(.018,.023,.027,f*a*strength);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`});
 const mesh=new T.Mesh(geo,mat);mesh.name='Terrain conforming tyre track and bucket contact';mesh.frustumCulled=false;mesh.renderOrder=2;scene.add(mesh);const p=new T.Vector3();let cursor=0,clock=1;
 function patch(x,z,yaw,length,width,opacity){const c=Math.cos(yaw),s=Math.sin(yaw),n=cursor++;for(let j=0;j<side;j++)for(let i=0;i<side;i++){const k=n*side*side+j*side+i,a=(i/(side-1)-.5)*length,b=(j/(side-1)-.5)*width,xx=x+c*a+s*b,zz=z-s*a+c*b;pos[k*3]=xx;pos[k*3+1]=height(xx,zz)+.035;pos[k*3+2]=zz;alpha[k]=opacity;}}
 return {mesh,update(dt,state,night=0){clock+=dt;if(clock<1/20)return;clock=0;cursor=0;mat.uniforms.strength.value=1-night*.72;
 for(const z of [-1.38,1.38])patch(state.baseX,state.baseZ+z,0,5.4,1.65,.27);
 rig.bucket.getWorldPosition(p);const gap=Math.max(0,p.y-height(p.x,p.z)-1.2);patch(p.x,p.z,state.yaw,2.2,2,.22*Math.exp(-gap*1.5));
 for(const t of trucks)for(const x of [-2.15,2.1])for(const z of [-1.82,1.82]){const c=Math.cos(t.yaw),s=Math.sin(t.yaw);patch(t.x+c*x+s*z,t.z-s*x+c*z,t.yaw,2.2,1.6,.30);}
 geo.attributes.position.needsUpdate=true;geo.attributes.contactAlpha.needsUpdate=true;
 }};
}
