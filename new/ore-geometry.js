import * as T from '../three.module.js?build=volvo-review-v2';
// A fractured, asymmetrical clast rather than a regular round polyhedron.
// Identical source vertices receive identical displacement, so facets remain
// joined. Flat normals preserve broad broken faces at the original triangle
// budgets (20/80). Instance transforms supply the different clast families.
export function oreGeometry(detail=0){
 const g=new T.IcosahedronGeometry(1,detail),p=g.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=.91+Math.sin(x*13.7+y*9.1+z*6.3)*.115+Math.sin(x*7.3-y*17.1+z*11.2)*.07;
  let xx=x*r+.10*y*z,yy=y*r+.07*x-.055*z,zz=z*r-.095*x*y;
  // Three old fracture planes and a broken nose remove the spherical outline.
  xx=Math.min(.83,xx);yy=Math.max(-.73,yy);zz=Math.max(-.87,zz);
  const length=Math.hypot(xx,yy,zz),fit=length>1.08?1.08/length:1;
  p.setXYZ(i,xx*fit,yy*fit,zz*fit);
  const face=Math.floor(i/3),random=(Math.sin(face*37.17+2.7)*.5+.5),chip=random>.83,tone=chip?.97:.72+random*.23,warm=Math.sin(face*11.91)>.38;
  colors.push(tone*(warm?1:.955),tone*(warm?.945:.98),tone*(warm?.865:1));
 }
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
