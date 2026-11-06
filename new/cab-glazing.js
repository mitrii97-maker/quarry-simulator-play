import * as T from '../three.module.js?build=cabins-20261106-24';
const cache=new WeakMap();
export function cabGlass(base){if(cache.has(base))return cache.get(base);const m=base.clone();m.name='Flat clear safety glazing';m.color.set('#b4cad0');m.opacity=.105;m.roughness=.035;m.metalness=0;m.envMapIntensity=.35;m.depthWrite=false;m.side=T.DoubleSide;m.normalMap=null;m.bumpMap=null;cache.set(base,m);return m;}
export function cabPane(parent,material,points,z){
 const shape=new T.Shape(points.map(([x,y])=>new T.Vector2(x,y))),g=new T.ShapeGeometry(shape,1),mesh=new T.Mesh(g,material);mesh.position.z=z;mesh.castShadow=false;mesh.name='Single planar laminated window';parent.add(mesh);return mesh;
}
