import * as T from '../three.module.js?build=cabins-20261106-24';

// One seamless linear-data tile carries dirt, rain streaks and fine abrasion.
// Sampling in machine coordinates keeps the coating attached to the moving part.
let tile;
function wearTexture(){
 if(tile)return tile;
 const size=256,data=new Uint8Array(size*size*4);
 function hash(x,y){
  let n=Math.imul(x+734,1597334677)^Math.imul(y+19,3812015801);
  n=Math.imul(n^(n>>>16),2246822519);
  return ((n^(n>>>13))>>>0)/4294967296;
 }
 function noise(x,y,nx,ny){
  const xx=x*nx/size,yy=y*ny/size,ix=Math.floor(xx),iy=Math.floor(yy);
  const fx=xx-ix,fy=yy-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const a=hash(ix%nx,iy%ny),b=hash((ix+1)%nx,iy%ny);
  const c=hash(ix%nx,(iy+1)%ny),d=hash((ix+1)%nx,(iy+1)%ny);
  return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4;
  data[i]=255*(.62*noise(x,y,5,5)+.26*noise(x,y,19,19)+.12*noise(x,y,71,71));
  data[i+1]=255*(.73*noise(x,y,61,4)+.27*noise(x,y,106,9));
  data[i+2]=255*(.68*noise(x,y,5,111)+.32*hash(x,y));
  data[i+3]=255;
 }
 tile=new T.DataTexture(data,size,size,T.RGBAFormat);
 tile.wrapS=tile.wrapT=T.RepeatWrapping;
 tile.magFilter=T.LinearFilter;tile.minFilter=T.LinearMipmapLinearFilter;
 tile.generateMipmaps=true;tile.needsUpdate=true;
 return tile;
}

const coatings={
 paint:`float deposit=smoothstep(.46,.80,wear.r+.12*wear.g);
        float runoff=smoothstep(.48,.87,wear.g)*deposit;
        float bare=smoothstep(.74,.89,wear.b)*smoothstep(.43,.68,wear.r);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.046,.052,.058),deposit*.32+runoff*.22);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.28,.27,.24),bare*.90);`,
 bucket:`float deposit=smoothstep(.38,.73,wear.r+.12*wear.g);
         float bare=smoothstep(.51,.87,wear.b)*(1.0-deposit*.63);
         diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.042,.048,.054),deposit*.74);
         diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.38,.36,.31),bare*.82);`,
 rubber:`float deposit=smoothstep(.34,.82,wear.r+.10*wear.g);
         float bare=0.0;
         diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.052,.057,.062),deposit*.61);`
};

export function applyMachineWear(material,kind){
 const map=wearTexture();
 material.customProgramCacheKey=()=>'machine-surface-'+kind;
 material.onBeforeCompile=shader=>{
  shader.uniforms.machineWearMap={value:map};
  shader.vertexShader='varying vec2 wearCoord;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>',
   '#include <begin_vertex>\nwearCoord=vec2(position.x+.64*position.z,position.y+.29*position.z)*.71;'
  );
  shader.fragmentShader='uniform sampler2D machineWearMap;\nvarying vec2 wearCoord;\n'+shader.fragmentShader
   .replace('#include <color_fragment>','#include <color_fragment>\nvec3 wear=texture2D(machineWearMap,wearCoord).rgb;\n'+coatings[kind])
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(mix(roughnessFactor,.92,deposit*.62),.37,bare*.82);')
   .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor*(1.0-.55*deposit),.70,bare);');
 };
 return material;
}
