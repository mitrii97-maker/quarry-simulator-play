import * as T from '../three.module.js?build=intro-20261106-27';

export function makeRollerFaces(root,material){
 const seed=new T.CylinderGeometry(.026,.026,.025,6).toNonIndexed();seed.rotateX(Math.PI/2);const input=seed.attributes.position,vertices=[];
 for(let b=0;b<6;b++){const angle=b*Math.PI/3;for(let i=0;i<input.count;i++)vertices.push(input.getX(i)+Math.cos(angle)*.125,input.getY(i)+Math.sin(angle)*.125,input.getZ(i));}
 seed.dispose();const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
 const mesh=new T.InstancedMesh(geometry,material,20),dummy=new T.Object3D(),wheels=[];mesh.name='Distance-driven track roller bolt faces';mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=mesh.receiveShadow=true;mesh.boundingSphere=new T.Sphere(new T.Vector3(0,.6,0),4);root.add(mesh);
 for(const z of [-1.35,1.35]){for(let i=0;i<8;i++)wheels.push({x:-2.35+i*.67,y:.55,z:z+Math.sign(z)*.57,radius:.34,phase:0,scale:1});for(const x of [-2.8,2.8])wheels.push({x,y:.59,z:z+Math.sign(z)*.585,radius:.48,phase:0,scale:1.25});}
 function write(){for(let i=0;i<wheels.length;i++){const w=wheels[i];dummy.position.set(w.x,w.y,w.z);dummy.rotation.set(0,0,w.phase);dummy.scale.setScalar(w.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;}
 function advance(distance){if(Math.abs(distance)<1e-9)return;for(const w of wheels)w.phase=(w.phase-distance/w.radius)%(Math.PI*2);write();}
 write();return {mesh,advance,wheels};
}
