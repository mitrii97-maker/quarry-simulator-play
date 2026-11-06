import * as T from './three.module.js?build=cabins-20261106-24';
export function mountainRing(){
 const sectors=144,radii=[78,100,135,180,240,300],positions=[],colors=[],indices=[];
 for(let row=0;row<radii.length;row++)for(let i=0;i<=sectors;i++){const a=(i%sectors)/sectors*Math.PI*2;const ridge=25+Math.sin(a*5+.3)*9+Math.sin(a*11)*5+Math.sin(a*23+1)*3;const heights=[0,ridge*.35,ridge*1.35,ridge*1.8,ridge*.75,0];const h=heights[row];const r=radii[row]+(row===0||row===5?0:Math.sin(a*13)*4);positions.push(Math.cos(a)*r,h,Math.sin(a)*r);const c=new T.Color().setRGB(.42+h*.0015,.40+h*.0017,.36+h*.0022);colors.push(c.r,c.g,c.b);if(row<radii.length-1&&i<sectors){const n=row*(sectors+1)+i;indices.push(n,n+sectors+1,n+1,n+1,n+sectors+1,n+sectors+2)}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function addLandscape(scene){
 const mountains=new T.Mesh(mountainRing(),new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}));mountains.receiveShadow=true;scene.add(mountains);
 const sky=new T.Mesh(new T.SphereGeometry(410,40,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{low:{value:new T.Color('#b7b5ad')},high:{value:new T.Color('#6d95b6')}},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 direction;uniform vec3 low;uniform vec3 high;void main(){float h=normalize(direction).y;vec3 color=mix(low,high,smoothstep(0.0,0.8,h));gl_FragColor=vec4(color,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
 scene.add(sky);return {mountains,sky};
}
