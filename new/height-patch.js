// Update only the changed portion of a regular height mesh and its one-cell
// normal halo. Buffer ranges are reused instead of replacing GPU attributes.
export function updateHeightPatch(geometry,grid,height,bounds=null,cover=null){
 const {width,depth,nx,nz,x=0,z=0}=grid,dx=width/nx,dz=depth/nz,p=geometry.attributes.position,n=geometry.attributes.normal,a=geometry.attributes.cover;
 if(bounds&&(bounds.maxX<x-width/2||bounds.minX>x+width/2||bounds.maxZ<z-depth/2||bounds.minZ>z+depth/2))return 0;
 const clamp=(v,max)=>Math.max(0,Math.min(max,v)),x0=bounds?clamp(Math.floor((bounds.minX-x+width/2)/dx)-1,nx):0,x1=bounds?clamp(Math.ceil((bounds.maxX-x+width/2)/dx)+1,nx):nx,z0=bounds?clamp(Math.floor((bounds.minZ-z+depth/2)/dz)-1,nz):0,z1=bounds?clamp(Math.ceil((bounds.maxZ-z+depth/2)/dz)+1,nz):nz;
 for(const attr of [p,n,a])attr?.clearUpdateRanges();
 for(let row=z0;row<=z1;row++){
  for(let col=x0;col<=x1;col++){const i=row*(nx+1)+col,xx=p.getX(i)+x,zz=p.getZ(i)+z;p.setY(i,height(xx,zz));const gx=(height(xx+dx,zz)-height(xx-dx,zz))/(2*dx),gz=(height(xx,zz+dz)-height(xx,zz-dz))/(2*dz),length=Math.hypot(gx,1,gz);n.setXYZ(i,-gx/length,1/length,-gz/length);if(a&&cover)a.setX(i,cover(xx,zz));}
  const start=(row*(nx+1)+x0),count=x1-x0+1;p.addUpdateRange(start*3,count*3);n.addUpdateRange(start*3,count*3);if(a)a.addUpdateRange(start,count);
 }
 p.needsUpdate=n.needsUpdate=true;if(a)a.needsUpdate=true;return (x1-x0+1)*(z1-z0+1);
}
// Match decorative objects to the actual two rendered triangles of a height cell.
export function heightMeshSample(geometry,{width,depth,nx,nz,x=0,z=0},wx,wz){
 const gx=Math.max(0,Math.min(nx-1e-7,(wx-x+width/2)/width*nx)),gz=Math.max(0,Math.min(nz-1e-7,(wz-z+depth/2)/depth*nz)),ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,a=iz*(nx+1)+ix,b=a+nx+1,d=a+1,c=b+1,p=geometry.attributes.position;
 return u+v<=1?p.getY(a)*(1-u-v)+p.getY(d)*u+p.getY(b)*v:p.getY(c)*(u+v-1)+p.getY(b)*(1-u)+p.getY(d)*(1-v);
}
