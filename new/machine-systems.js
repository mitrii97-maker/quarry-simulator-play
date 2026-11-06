const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class MachineSystems{
 constructor(config){this.config=config;this.reset();}
 reset(){this.fuel=this.config.tank;this.temperature=54;this.hydraulicTemperature=42;this.condition=1;this.rpm=900;this.load=0;this.litresUsed=0;this.hours=0;}
 update(dt,{pressure=0,motion=0,payload=0,impact=0}={}){
  const demand=clamp(pressure*.85+motion*.20+payload*motion*.09,0,1);this.load+=(demand-this.load)*(1-Math.exp(-dt*4));
  const running=this.fuel>0,target=running?900+this.load*900+Math.min(180,motion*130):0;
  this.rpm+=(target-this.rpm)*(1-Math.exp(-dt*2.4));
  const burn=running?(this.config.idleFuel+(this.config.fullFuel-this.config.idleFuel)*this.load)*dt/3600:0;
  const used=Math.min(this.fuel,burn);this.fuel-=used;this.litresUsed+=used;this.hours+=running?dt/3600:0;
  this.temperature+=((-8+(running?65+this.load*34:0))-this.temperature)*(1-Math.exp(-dt/90));
  this.hydraulicTemperature+=((-8+(running?48+this.load*42:0))-this.hydraulicTemperature)*(1-Math.exp(-dt/110));
  this.condition=clamp(this.condition-dt*Math.max(0,this.temperature-96)*.000002-Math.max(0,impact-.08)*.000015,0,1);
 }
 snapshot(){return {rpm:Math.round(this.rpm/10)*10,temperature:Math.round(this.temperature),hydraulicTemperature:Math.round(this.hydraulicTemperature),fuel:this.fuel,tank:this.config.tank,condition:this.condition,load:this.load,litresUsed:this.litresUsed,hours:this.hours};}
 save(){return {fuel:this.fuel,temperature:this.temperature,hydraulicTemperature:this.hydraulicTemperature,condition:this.condition,rpm:this.rpm,load:this.load,litresUsed:this.litresUsed,hours:this.hours};}
 restore(data){if(!data)return;for(const k of Object.keys(this.save()))if(Number.isFinite(data[k]))this[k]=data[k];this.fuel=clamp(this.fuel,0,this.config.tank);this.condition=clamp(this.condition,0,1);}
}
