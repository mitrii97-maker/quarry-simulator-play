export function createHaulLod(root,M){
 // Static details are already batched. Preserve the reference silhouette,
 // articulated body and real payload instead of substituting box proxies.
 return {update(){},detail:root,distant:null};
}
