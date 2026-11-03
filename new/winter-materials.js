import * as T from '../three.module.js';
export function terrainWinter(material,maps,progress,exposure){
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{quarryRock:{value:maps.rock.color},quarrySnow:{value:maps.snow.color},quarryEarthRoughness:{value:maps.gravel.roughness},quarryRockRoughness:{value:maps.rock.roughness},quarrySnowRoughness:{value:maps.snow.roughness},quarryEarthNormal:{value:maps.gravel.normal},quarryRockNormal:{value:maps.rock.normal},quarrySnowNormal:{value:maps.snow.normal},quarryProgress:{value:progress()},quarryDigMap:{value:exposure}});
  material.userData.winterShader=shader;
  shader.vertexShader='varying vec3 quarryPosition;varying vec3 quarryNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nquarryPosition=(modelMatrix*vec4(transformed,1.)).xyz;quarryNormal=normalize(mat3(modelMatrix)*objectNormal);');
  shader.fragmentShader=`uniform sampler2D quarryRock;uniform sampler2D quarrySnow;uniform sampler2D quarryEarthRoughness;uniform sampler2D quarryRockRoughness;uniform sampler2D quarrySnowRoughness;uniform sampler2D quarryEarthNormal;uniform sampler2D quarryRockNormal;uniform sampler2D quarrySnowNormal;uniform float quarryProgress;uniform sampler2D quarryDigMap;varying vec3 quarryPosition;varying vec3 quarryNormal;
  vec3 triWeights(vec3 n){vec3 w=pow(abs(n),vec3(5.));return w/max(.00001,w.x+w.y+w.z);}
  vec4 triColor(sampler2D tex,vec3 p,vec3 n,float scale){vec3 w=triWeights(n);if(w.y>.995)return texture2D(tex,p.xz*scale);if(w.x>.995)return texture2D(tex,p.zy*scale);if(w.z>.995)return texture2D(tex,p.xy*scale);return texture2D(tex,p.zy*scale)*w.x+texture2D(tex,p.xz*scale)*w.y+texture2D(tex,p.xy*scale)*w.z;}
  float winterCover(vec3 p,vec3 n){float facing=smoothstep(.38,.86,n.y);float powderVariation=sin(p.x*.63+sin(p.z*.34))*sin(p.z*.49)*.12;float face=step(-25.,p.x)*(1.-step(10.,p.x))*(1.-step(6.8,abs(p.z)));return clamp(facing*(.94+powderVariation)*(1.-face*smoothstep(.02,.22,texture2D(quarryDigMap,vec2((p.x+25.)/35.,(p.z+6.8)/13.6)).r)),0.,1.);}
  vec3 triNormal(sampler2D tex,vec3 p,vec3 n,float scale){vec3 w=triWeights(n);vec3 b=texture2D(tex,p.xz*scale).xyz*2.-1.;if(w.y>.995)return normalize(vec3(b.x,b.z*sign(n.y),b.y));vec3 a=texture2D(tex,p.zy*scale).xyz*2.-1.;vec3 c=texture2D(tex,p.xy*scale).xyz*2.-1.;return normalize(vec3(a.z*sign(n.x),a.y,a.x)*w.x+vec3(b.x,b.z*sign(n.y),b.y)*w.y+vec3(c.x,c.y,c.z*sign(n.z))*w.z);}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec3 geometric=normalize(quarryNormal);float steep=1.-smoothstep(.55,.92,geometric.y);float snowAmount=winterCover(quarryPosition,geometric);vec4 base=vec4(1.);if(snowAmount<.995){if(steep<.005)base=triColor(map,quarryPosition,geometric,.52);else if(steep>.995)base=triColor(quarryRock,quarryPosition,geometric,.17);else base=mix(triColor(map,quarryPosition,geometric,.52),triColor(quarryRock,quarryPosition,geometric,.17),steep);}vec4 snowColor=snowAmount>.005?triColor(quarrySnow,quarryPosition,geometric,.28):vec4(1.);float strata=.94+.06*sin(quarryPosition.y*5.2+sin(quarryPosition.x*.3)*.7);base.rgb*=mix(1.,strata,steep);diffuseColor*=mix(base,snowColor,snowAmount);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 vec3 qrNormal=normalize(quarryNormal);float qrSnow=winterCover(quarryPosition,qrNormal),qrRock=1.-smoothstep(.55,.92,qrNormal.y);float qrBase=1.;if(qrSnow<.995){if(qrRock<.005)qrBase=triColor(quarryEarthRoughness,quarryPosition,qrNormal,.52).g;else if(qrRock>.995)qrBase=triColor(quarryRockRoughness,quarryPosition,qrNormal,.17).g;else qrBase=mix(triColor(quarryEarthRoughness,quarryPosition,qrNormal,.52).g,triColor(quarryRockRoughness,quarryPosition,qrNormal,.17).g,qrRock);}float qrPowder=qrSnow>.005?triColor(quarrySnowRoughness,quarryPosition,qrNormal,.28).g:1.;roughnessFactor=clamp(mix(.65+.32*qrBase,.82+.16*qrPowder,qrSnow),.58,1.);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`vec3 qGeo=normalize(quarryNormal);float qSnow=winterCover(quarryPosition,qGeo);float qSteep=1.-smoothstep(.55,.92,qGeo.y);vec3 qNormal=qGeo;if(qSnow<.995){if(qSteep<.005)qNormal=triNormal(quarryEarthNormal,quarryPosition,qGeo,.52);else if(qSteep>.995)qNormal=triNormal(quarryRockNormal,quarryPosition,qGeo,.17);else qNormal=normalize(mix(triNormal(quarryEarthNormal,quarryPosition,qGeo,.52),triNormal(quarryRockNormal,quarryPosition,qGeo,.17),qSteep));}if(qSnow>.005)qNormal=normalize(mix(qNormal,triNormal(quarrySnowNormal,quarryPosition,qGeo,.28),qSnow));normal=normalize(mat3(viewMatrix)*normalize(mix(qGeo,qNormal,qSnow>.5?.24:.42)));`);
 };
 material.customProgramCacheKey=()=> 'winter-terrain-real-tracks-5';
}
export function snowOnRock(material){
 material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 winterUp;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
 vec3 objectUp=objectNormal;
 #ifdef USE_INSTANCING
 objectUp=mat3(instanceMatrix)*objectUp;
 #endif
 winterUp=normalize(mat3(modelMatrix)*objectUp);`);shader.fragmentShader='varying vec3 winterUp;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float cap=smoothstep(.48,.88,normalize(winterUp).y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.83,.89,.95),cap*.92);`)};
 material.customProgramCacheKey=()=> 'rock-snow-caps-v1';
}
