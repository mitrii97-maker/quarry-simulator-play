const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
// Pure control-rate mix: sampled sounds follow actual joint velocity and ore
// flow, never pointer state. Hydraulics remain opt-in and low in the mix.
export function machineryMix(motion,digging,dumping,telemetry={}){
 const moving=clamp(motion),cut=clamp((telemetry.cutRate||0)/8.2),flow=clamp((telemetry.flowRate||0)/8);
 const work=digging?Math.max(.25,cut):0,load=clamp(Math.max(work,moving*.58,Math.abs(telemetry.drive||0)*.9));
 return {load,idle:.70*Math.cos(load*Math.PI*.43),working:.95*Math.sin(load*Math.PI/2),hydraulic:telemetry.hydraulics?.036*clamp(Math.abs(telemetry.boom||0)+Math.abs(telemetry.stick||0)+Math.abs(telemetry.curl||0))*(.65+.35*work):0,air:.012,contact:.55*work,scrape:Math.max(.24*work,.10*clamp(Math.abs(telemetry.drive||0))),dump:dumping?.55*Math.max(.2,flow):0,yard:.12*clamp(telemetry.yard),cutoff:telemetry.cabin?2100:5600};
}
