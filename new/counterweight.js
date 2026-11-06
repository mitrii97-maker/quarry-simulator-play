import {referenceVolvoCounterweight} from './volvo-reference.js?build=boom-20261107-30';
import * as T from '../three.module.js?build=boom-20261107-30';
import {roundedBlock} from './sculpted.js?build=boom-20261107-30';
import {lettering} from './volvo-style.js?build=boom-20261107-30';
export function addCounterweight(house,M,machine){
 if(machine.id==='volvo')return referenceVolvoCounterweight(house,M,lettering);
 const width=machine.id==='liebherr'?3.65:machine.id==='volvo'?3.02:3.30;
 const height=machine.id==='liebherr'?1.56:1.34;
 const radius=machine.id==='hitachi'?.30:machine.id==='volvo'?.26:.13;
 const centre=-3.46,depth=1.06,rear=centre-depth/2;
 const weight=new T.Group();weight.name=machine.name+' solid rear counterweight';house.add(weight);
 roundedBlock(weight,M.paint,[depth,height,width],[centre,height/2+.08,0],radius);
 roundedBlock(weight,M.dark,[depth+.06,.24,width+.06],[centre,.14,0],.08);
 roundedBlock(weight,M.paint,[.18,height*.74,width*.84],[rear-.035,height*.52+.10,0],.07);
 const label=lettering(weight,machine.name.toUpperCase(),{x:rear-.14,y:height*.57+.10,z:0,width:width*.81,height:.30,color:machine.id==='liebherr'?'#24292c':'#f4efe3',font:'900 150px Arial',name:'Rear counterweight model name'});
 label.rotation.y=-Math.PI/2;
 for(const side of [-1,1])lettering(weight,machine.name.toUpperCase(),{x:centre,y:height*.68,z:side*(width/2+.012),width:.83,height:.18,side,color:machine.id==='liebherr'?'#24292c':'#f4efe3',font:'900 150px Arial',name:'Side counterweight model name'});
 return weight;
}
