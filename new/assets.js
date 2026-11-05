import * as T from '../three.module.js?build=fix-20261106-22';
import {terrainMaps} from '../materials.js?build=fix-20261106-22';
// AO and displacement are not sampled by our materials: don't download six unused maps.
export async function loadVisualAssets(renderer,onProgress=()=>{}){
 const loader=new T.TextureLoader(),all={};let done=0;
 await Promise.all(['gravel','rock','snow'].map(async name=>{const fallback=()=>terrainMaps(name==='rock'?'wall':'earth');let backup;
  const maps=await Promise.all(['color','normalgl','roughness'].map(async key=>{let tex;try{tex=await loader.loadAsync(new URL('../assets/'+name+'/'+key+'.jpg',import.meta.url).href)}catch{backup??=fallback();tex=key==='normalgl'?backup.normal:key==='color'?backup.color:new T.DataTexture(new Uint8Array([240,240,240,255]),1,1);if(name==='snow'&&key==='color')tex=new T.DataTexture(new Uint8Array([235,242,248,255]),1,1);tex.needsUpdate=true;}
   tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(key==='color')tex.colorSpace=T.SRGBColorSpace;onProgress(++done/9);return tex}));all[name]={color:maps[0],normal:maps[1],roughness:maps[2]};}));return all;
}
