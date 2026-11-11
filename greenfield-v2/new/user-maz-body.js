import * as T from '../three.module.js';
import {bodyTopFront,bodyTopRear} from './hauler-body-config.js';

const COMPONENTS={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
const ITEMS={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};

function readAccessor(json,bin,index){
 const accessor=json.accessors[index],view=json.bufferViews[accessor.bufferView],Type=COMPONENTS[accessor.componentType],items=ITEMS[accessor.type];
 if(!Type||!items)throw new Error('Unsupported MAZ GLB accessor');
 const start=(view.byteOffset||0)+(accessor.byteOffset||0),stride=view.byteStride||Type.BYTES_PER_ELEMENT*items;
 if(stride===Type.BYTES_PER_ELEMENT*items)return new Type(bin.buffer,bin.byteOffset+start,accessor.count*items).slice();
 const out=new Type(accessor.count*items),source=new DataView(bin.buffer,bin.byteOffset+start);
 for(let i=0;i<accessor.count;i++)for(let j=0;j<items;j++){
  const offset=i*stride+j*Type.BYTES_PER_ELEMENT;
  out[i*items+j]=accessor.componentType===5126?source.getFloat32(offset,true):accessor.componentType===5125?source.getUint32(offset,true):accessor.componentType===5123?source.getUint16(offset,true):source.getUint8(offset);
 }
 return out;
}

export function parseMazBodyGlb(buffer,material){
 const data=new DataView(buffer);if(data.getUint32(0,true)!==0x46546c67)throw new Error('Not a GLB file');
 let offset=12,json=null,bin=null;
 while(offset<data.byteLength){const length=data.getUint32(offset,true),type=data.getUint32(offset+4,true);offset+=8;const chunk=new Uint8Array(buffer,offset,length);if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(chunk));if(type===0x004e4942)bin=chunk;offset+=length;}
 if(!json||!bin)throw new Error('Incomplete MAZ GLB');
 const group=new T.Group();group.name='User supplied MAZ dump body';
 for(const [nodeIndex,node] of json.nodes.entries()){
  if(node.mesh===undefined)continue;const primitive=json.meshes[node.mesh].primitives[0],g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(readAccessor(json,bin,primitive.attributes.POSITION),3));
  if(primitive.attributes.NORMAL!==undefined)g.setAttribute('normal',new T.BufferAttribute(readAccessor(json,bin,primitive.attributes.NORMAL),3));
  if(primitive.attributes.TEXCOORD_0!==undefined)g.setAttribute('uv',new T.BufferAttribute(readAccessor(json,bin,primitive.attributes.TEXCOORD_0),2));
  if(primitive.indices!==undefined)g.setIndex(new T.BufferAttribute(readAccessor(json,bin,primitive.indices),1));
  if(!g.attributes.normal)g.computeVertexNormals();
  const mesh=new T.Mesh(g,material);mesh.name=node.name||'MAZ body part';mesh.userData.mazNodeIndex=nodeIndex;mesh.castShadow=mesh.receiveShadow=true;
  mesh.position.fromArray(node.translation||[0,0,0]);mesh.quaternion.fromArray(node.rotation||[0,0,0,1]);mesh.scale.fromArray(node.scale||[1,1,1]);group.add(mesh);
 }
 return group;
}

export async function attachUserMazBody(root,tailgate,material,B){
 const response=await fetch(new URL('../assets/models/maz/upKuzov.glb?v=greenfield-full-body-2',import.meta.url));if(!response.ok)throw new Error('MAZ body '+response.status);
 const source=parseMazBodyGlb(await response.arrayBuffer(),material),box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
 if(size.x<.01||size.y<.01||size.z<.001)throw new Error('Empty MAZ body');
 // Blender source axes: Z is body length, X is body width and Y is height.
 // Preserve the complete supplied shape, only fitting its overall dimensions
 // to the physical MAZ envelope used by loading and collision calculations.
 const targetLength=bodyTopFront-bodyTopRear,targetHeight=B.frontRim-B.floor,scale=new T.Vector3(B.topDepth/size.x,targetHeight/size.y,targetLength/size.z),rotation=Math.PI/2;
 const mappedCenter=center.clone().multiply(scale).applyAxisAngle(new T.Vector3(0,1,0),rotation),desiredCenter=new T.Vector3(bodyTopRear+targetLength/2,B.floor+targetHeight/2,0),fitPosition=desiredCenter.sub(mappedCenter);
 const mainSource=new T.Group(),gateSource=new T.Group();mainSource.name='Exact upKuzov.glb body';gateSource.name='Exact upKuzov.glb rear gate';
 for(const child of [...source.children])(child.userData.mazNodeIndex===5?mainSource:gateSource).add(child);
 const mainFit=new T.Group();mainFit.name='Fitted complete upKuzov.glb';mainFit.position.copy(fitPosition);mainFit.rotation.y=rotation;mainFit.scale.copy(scale);mainFit.add(mainSource);root.add(mainFit);
 const gateFit=new T.Group();gateFit.name='Rigged supplied rear body parts';gateFit.position.copy(fitPosition).sub(tailgate.position);gateFit.rotation.y=rotation;gateFit.scale.copy(scale);gateFit.add(gateSource);tailgate.add(gateFit);
 return {main:mainFit,gate:gateFit};
}
