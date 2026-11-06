import * as T from '../three.module.js?build=lighting-20261106-26';

// A packet remains one pooled mass parcel. Its silhouette consists of chipped,
// interlocking grains, never a smooth liquid blob or extra physical bodies.
export function aggregateClusterGeometry(){
 const seed=new T.IcosahedronGeometry(1,0),source=seed.attributes.position,positions=[],colors=[];
 const grains=[[0,0,0,.68],[.55,.05,.12,.46],[-.51,-.08,.19,.43],[.10,.08,-.56,.44],[-.16,.17,.57,.39],[.19,-.36,.10,.40]];
 for(let g=0;g<grains.length;g++){
  const [ox,oy,oz,size]=grains[g],angle=g*2.399,c=Math.cos(angle),s=Math.sin(angle);
  for(let i=0;i<source.count;i++){
   const x=source.getX(i),y=source.getY(i),z=source.getZ(i),chip=.89+.12*Math.sin(x*13+y*7+z*19+g*3);
   positions.push(ox+(x*c-z*s)*size*chip,oy+y*size*.86*chip,oz+(x*s+z*c)*size*chip);
   const shade=.89+(g%3)*.055;colors.push(shade,shade*.985,shade*.96);
  }
 }
 seed.dispose();const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.name='Six chipped grains per conservative aggregate parcel';return geometry;
}
