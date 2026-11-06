import {createForemanIntro} from './foreman-intro.js?build=intro-20261106-27';
import {prepareNewGame} from './foreman-story.js?build=intro-20261106-27';
import {placeSun,createContactShadows} from './quarry-shadows.js?build=intro-20261106-27';
import {createQuarryHorizons} from './quarry-horizons.js?build=intro-20261106-27';
import {MachineSystems} from './machine-systems.js?build=intro-20261106-27';
import {createTabletPanel} from './cab-tablet.js?build=intro-20261106-27';
import {saveTerrain,restoreTerrain} from './world.js?build=intro-20261106-27';
import {restoreLevel} from './levels.js?build=intro-20261106-27';
import {FREE_MACHINE_TRIAL} from './machine-config.js?build=intro-20261106-27';
import {createFleetShop} from './fleet-shop.js?build=intro-20261106-27';
import {recordDelivery} from './fleet-store.js?build=intro-20261106-27';
import {MACHINE} from './material-volume.js?build=intro-20261106-27';
import {addMountainBackdrop} from './mountain-backdrop.js?build=intro-20261106-27';
import {CarryAssist} from './carry-assist.js?build=intro-20261106-27';
import {CameraResponse} from './camera-response.js?build=intro-20261106-27';
import {PARKING} from './production-layout.js?build=intro-20261106-27';
import {createTraffic} from './traffic.js?build=intro-20261106-27';
import {OperatorShift,loadOptions,saveOptions,loadCareer,completeCareer} from './operator.js?build=intro-20261106-27';
import {createOperatorPanel} from './operator-panel.js?build=intro-20261106-27';
import {createProductionYard} from './production-yard.js?build=intro-20261106-27';
import {makeQuarrySky} from './quarry-sky.js?build=intro-20261106-27';
import {ShaderPass} from '../effects/postprocessing/ShaderPass.js?build=intro-20261106-27';
import {FXAAShader} from '../effects/shaders/FXAAShader.js?build=intro-20261106-27';
import {cameraFov,CABIN_VIEW} from './camera-layout.js?build=intro-20261106-27';
import {makeDumpSite} from './dump-site.js?build=intro-20261106-27';
import {createDozer} from './dozer.js?build=intro-20261106-27';
import {createDumpGrader} from './dump-grader.js?build=intro-20261106-27';
import {createShiftLighting} from './shift-lighting.js?build=intro-20261106-27';
import {stepChassis} from './chassis.js?build=intro-20261106-27';
import {loadVisualAssets} from './assets.js?build=intro-20261106-27';
import {createSnowfall} from './winter.js?build=intro-20261106-27';
import {levelState,recordDispatch,recordTransportSpill,finishIfReady,nextLevel as advanceLevel,LEVEL_TONNES,TRUCK_CAPACITY,TRUCKS_PER_LEVEL} from './levels.js?build=intro-20261106-27';
import {BUCKET_TONNES,BUCKET_VOLUME,BUCKET_INNER_WIDTH} from './material-volume.js?build=intro-20261106-27';
import {loadingBay,updateLoadingBay} from './loading-bay.js?build=intro-20261106-27';
import {BUCKET,releaseRate,dischargeMouth,FACE_SHOVEL} from './bucket-config.js?build=intro-20261106-27';
import * as T from '../three.module.js?build=intro-20261106-27';

import {EffectComposer} from '../effects/postprocessing/EffectComposer.js?build=intro-20261106-27';
import {RenderPass} from '../effects/postprocessing/RenderPass.js?build=intro-20261106-27';
import {SSAOPass} from '../effects/postprocessing/SSAOPass.js?build=intro-20261106-27';
import {OutputPass} from '../effects/postprocessing/OutputPass.js?build=intro-20261106-27';
import {makeMaterials,makeWorld,frontState,ground,resetTerrain,stepMaterial,drainCaveIns,shelfMass,looseMass} from './world.js?build=intro-20261106-27';
import {makeExcavator,forward,bucketFrame,framePoint} from './rig.js?build=intro-20261106-27';
import {bucketContact,createSuspension} from './truck-suspension.js?build=intro-20261106-27';
import {START,stepRig,bucketSamples,truckHeight,soilContact} from './physics.js?build=intro-20261106-27';
import {createTruck,makeRoute,driveTruck,catches,recoverEmptyFleet} from './haul.js?build=intro-20261106-27';
import {V,add} from './geometry.js?build=intro-20261106-27';
import {QuarryAudio} from '../audio.js?build=intro-20261106-27';
import {makeRockSystem} from './rock-system.js?build=intro-20261106-27';
import {QUALITY,QualityGovernor,FrameMetrics} from './render-quality.js?build=intro-20261106-27';
import {FixedClock} from './frame-clock.js?build=intro-20261106-27';
import {bindInputs,HornGesture} from './input.js?build=intro-20261106-27';
let onboarding=null,suppressSave=false,introFrameDirty=true,restoredShift=false,storyView=null;
const options=loadOptions();options.autoSupply=true;const shift=new OperatorShift(),traffic=createTraffic(),carryAssist=new CarryAssist(),cameraResponse=new CameraResponse();let queueRequested=false,manualRequest=false,operatorPanel=null,fleetShop=null,tabletPanel=null;const systems=new MachineSystems(MACHINE);
const deliveryMass=new Map();
function landedDelivery(id,tonnes){const previous=deliveryMass.get(id)||0,amount=previous+tonnes;deliveryMass.set(id,amount);if(previous<98&&amount>=98){const progress=recordDelivery(id,amount);if(progress.awarded)fleetShop?.refresh();}}
const $=id=>document.getElementById(id),scene=new T.Scene(),renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,QUALITY[1].dpr));renderer.setSize(innerWidth,innerHeight);renderer.info.autoReset=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;document.body.prepend(renderer.domElement);
scene.background=new T.Color('#a5becf');scene.fog=new T.FogExp2('#c0d1df',.0075);
const sky=await makeQuarrySky(scene);
let environmentTarget;
function refreshEnvironment(){
 const pmrem=new T.PMREMGenerator(renderer);
 const next=pmrem.fromEquirectangular(sky.userData.environment);
 scene.environment=next.texture;
 environmentTarget?.dispose();
 environmentTarget=next;
 pmrem.dispose();
}
refreshEnvironment();
const hemisphere=new T.HemisphereLight('#d5e9ff','#69717b',1.05);scene.add(hemisphere);const sun=new T.DirectionalLight('#fff2d8',3.05);sun.position.set(-25,34,-31);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-21,right:21,top:21,bottom:-21,near:.5,far:110});sun.shadow.normalBias=.012;sun.shadow.bias=-.0002;scene.add(sun,sun.target);

addMountainBackdrop(scene);
const visualAssets=await loadVisualAssets(renderer,value=>window.quarryBoot?.progress(value*.8));window.quarryBoot?.progress(.85);
const M=makeMaterials(renderer,visualAssets),world=makeWorld(scene,M),weather=createSnowfall(scene),rig=makeExcavator(scene,M),trucks=PARKING.xs.map((x,index)=>createTruck(scene,M,x,PARKING.z,index));
createQuarryHorizons(scene,M);
const dumpSite=makeDumpSite(scene,M),dozer=createDozer(scene,M,p=>rocks.puff(V(p.x,p.y,p.z),.13)),dumpGrader=createDumpGrader(scene,M,dumpSite,p=>rocks.puff(V(p.x,p.y,p.z),.09));
const contacts=createContactShadows(scene,world.height,rig,trucks);
const lighting=createShiftLighting({scene,renderer,sun,hemisphere,sky,rig,materials:M});
function lightingButton(){const night=lighting.snapshot().night;$('dayNight').textContent=night?'☾':'☀';$('dayNight').setAttribute('aria-pressed',String(night));$('dayNight').setAttribute('aria-label',night?'Включить день':'Включить ночь')}
$('dayNight').onclick=()=>{lighting.toggle();lightingButton()};lightingButton();
const signCanvas=document.createElement('canvas');signCanvas.width=signCanvas.height=128;const signCtx=signCanvas.getContext('2d');signCtx.fillStyle='#245b9a';signCtx.fillRect(0,0,128,128);signCtx.strokeStyle='white';signCtx.lineWidth=5;signCtx.strokeRect(6,6,116,116);signCtx.fillStyle='white';signCtx.font='bold 92px Arial';signCtx.fillText('P',32,98);const sign=add(scene,new T.BoxGeometry(1.5,1.5,.1),new T.MeshStandardMaterial({map:new T.CanvasTexture(signCanvas),roughness:.5}),4,3,-30);const post=add(scene,new T.CylinderGeometry(.055,.055,2.5,12),M.steel,4,1.25,-30);
let waitingTruck=-1;
let state={...START,velocity:{...START.velocity}},active=-1,delivered=0,view=0,time=0,impact=0,completed=0,terrainDirty=false,lastTerrainUpdate=0,paused=false,lastBlocked=false;
try{view=Number(localStorage.getItem('quarry-rebuild-view'))||0;if(view<0||view>2)view=0}catch{}
const camera=new T.PerspectiveCamera(50,innerWidth/innerHeight,.1,650),look=V(4,5,0);let cameraReady=false;
const composer=new EffectComposer(renderer);composer.renderTarget1.samples=2;composer.renderTarget2.samples=2;composer.addPass(new RenderPass(scene,camera));class ScaledSSAO extends SSAOPass{setSize(w,h){super.setSize(Math.max(1,Math.round(w*(this.scale??.5))),Math.max(1,Math.round(h*(this.scale??.5))))}}const ao=new ScaledSSAO(scene,camera,innerWidth,innerHeight,12);ao.kernelRadius=.65;ao.minDistance=.001;ao.maxDistance=.018;composer.addPass(ao);composer.addPass(new OutputPass());const fxaa=new ShaderPass(FXAAShader);fxaa.enabled=false;composer.addPass(fxaa);
let quality=QUALITY[1],contextLost=false,pendingQuality=null;const metrics=new FrameMetrics(),governor=new QualityGovernor(profile=>{pendingQuality=profile});
function resizeRendering(){const width=Math.round(window.visualViewport?.width||innerWidth),height=Math.round(window.visualViewport?.height||innerHeight);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,quality.dpr));renderer.setSize(width,height);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(width,height);fxaa.uniforms.resolution.value.set(1/(width*renderer.getPixelRatio()),1/(height*renderer.getPixelRatio()));}
function applyQuality(profile){quality=profile;fxaa.enabled=profile.samples===0;ao.enabled=profile.ao>0;ao.scale=profile.ao||.5;for(const target of [composer.renderTarget1,composer.renderTarget2]){target.samples=profile.samples;target.dispose()}if(sun.shadow.mapSize.x!==profile.shadow){sun.shadow.mapSize.set(profile.shadow,profile.shadow);sun.shadow.map?.dispose();sun.shadow.map=null;}placeSun(sun,{baseX:0,baseY:0,baseZ:0},profile);weather.setCount(profile.snow);resizeRendering();renderer.shadowMap.needsUpdate=true;}
applyQuality(quality);
const audio=new QuarryAudio();audio.muted=options.muted;$('sound').textContent=options.muted?'♪̸':'♫';$('sound').setAttribute('aria-pressed',String(!options.muted));addEventListener('pointerdown',()=>audio.start(),{once:true});
$('sound').onclick=()=>{audio.start();const muted=audio.mute();$('sound').textContent=muted?'♪̸':'♫';$('sound').setAttribute('aria-pressed',String(!muted));$('sound').setAttribute('aria-label',muted?'Включить звук':'Отключить звук');options.muted=muted;saveOptions(options)};
$('view').onclick=()=>{view=(view+1)%3;try{localStorage.setItem('quarry-rebuild-view',String(view))}catch{}};
function setPaused(value){paused=value||onboarding?.isOpen||operatorPanel?.isOpen||fleetShop?.isOpen||tabletPanel?.isOpen||document.hidden||contextLost||matchMedia('(pointer:coarse) and (orientation:portrait)').matches;if(paused){state={...state,velocity:{yaw:0,boom:0,stick:0,curl:0},driveSpeed:0};previousState=state;hasLastMouth=false;}clock.reset();lastPresented=null;inputController.reset();hornGesture.reset();audio.setActive(!paused);if(audio.ctx){if(paused)audio.ctx.suspend().catch(()=>{});else audio.ctx.resume().catch(()=>{})}}
const inputController=bindInputs({enabled:()=>levelState().status==='playing'&&!paused,onHorn:()=>horn(),onPause:setPaused});
const inputs=inputController.inputs,keys=inputController.keys;
function resetInputs(){inputController.reset()}
function effectiveInputs(){return inputController.read()}
const hornGesture=new HornGesture({onCall(){queueRequested=true;manualRequest=true;},onDispatch(){const t=trucks[active];if(t&&t.state==='ready'){t.awaitDump=false;delivered+=t.tonnes;recordDispatch(t.tonnes);shift.dispatch(t.tonnes);t.dumpSlot=null;t.dispatched=t.tonnes>0;t.deliveryId=crypto.randomUUID();if(t.tonnes>0)completed++;makeRoute(t,'leaving');active=-1;if(options.autoSupply)queueRequested=true;}}});
function serviceDispatch(){
 if(active>=0){
  if(options.autoSupply&&levelState().goalRemaining>0&&waitingTruck<0&&trucks[active].state==='ready'){
   const next=trucks.findIndex((t,i)=>i!==active&&t.state==='parked');
   if(next>=0){waitingTruck=next;updateLoadingBay(trucks[next],state);makeRoute(trucks[next],'queueing');}
  }return;
 }
 if(waitingTruck>=0){const t=trucks[waitingTruck];if(t.state!=='queued')return;
  if(!traffic.apronClear(trucks.filter(other=>other!==t),loadingBay(state)))return;
  active=waitingTruck;waitingTruck=-1;queueRequested=false;manualRequest=false;updateLoadingBay(t,state);makeRoute(t,'backing');return;
 }
 if(!queueRequested||levelState().goalRemaining<=0)return;
 if(options.autoSupply&&!manualRequest&&levelState().remaining<.0001&&looseMass()<.0001&&state.payload<.0001){queueRequested=false;return;}
 const i=trucks.findIndex(t=>t.state==='parked');if(i<0||!traffic.apronClear(trucks,loadingBay(state)))return;
 active=i;queueRequested=false;manualRequest=false;trucks[i].dispatched=false;updateLoadingBay(trucks[i],state);makeRoute(trucks[i],'coming');
}

function horn(){if(levelState().status!=='playing'||paused)return;audio.horn();hornGesture.press();$('horn').classList.remove('sounding');void $('horn').offsetWidth;$('horn').classList.add('sounding');}
$('horn').onclick=horn;
const physicsFrame={},emitterRig={charge:rig.charge,bucket:{localToWorld(point){return framePoint(physicsFrame,point.x,point.y,point.z,point)}}},mouth=V(),mouthVelocity=V(),lastMouthPoint=V(),rotation=new T.Quaternion(),rotationMatrix=new T.Matrix4();
let hasLastMouth=false,previousState=state,trackTravel=0;
// Mixed grains carry real mass until they become part of a bed or ground pile.
const rocks=makeRockSystem(scene,M.freshRock,(energy,surface)=>audio.impact(energy,surface),dumpSite,landedDelivery);let scoopEmission=0,lastScoopEntry=null;const productionYard=createProductionYard(scene,M,world.height);
function onCaveMovement(packet,index){rocks.ravel(packet,index);audio.collapse(packet[index+6]);}
function spawnScoopChip(entry,mass){const z=-.62+Math.floor(Math.random()*5)*.31+(Math.random()-.5)*.10,u=Math.random(),start=entry?V(T.MathUtils.lerp(entry.from.x,entry.to.x,u)+physicsFrame.cx*z*MACHINE.scale,T.MathUtils.lerp(entry.from.y,entry.to.y,u)+physicsFrame.cy*z*MACHINE.scale,T.MathUtils.lerp(entry.from.z,entry.to.z,u)+physicsFrame.cz*z*MACHINE.scale):emitterRig.bucket.localToWorld(V(BUCKET.teeth.x,-1.46,z));if(entry)start.y=Math.max(start.y+.05,Math.min(entry.surfaceBefore-.06,start.y+.38));return rocks.scoop(start,rig.charge.entryPoint(z),mass);}
$('callDozer').onclick=()=>{if(!paused&&levelState().status==='playing'){audio.start();dozer.call(state,trucks);updateDozerButton();}};
function updateDozerButton(){$('callDozer').disabled=dozer.busy;$('callDozer').setAttribute('aria-pressed',String(dozer.busy));$('callDozer').setAttribute('aria-label',dozer.busy?'Бульдозер убирает просыпи':'Вызвать бульдозер: убрать просыпи на подъездах');}
const levelCache={};function levelText(id,value){if(levelCache[id]!==value){$(id).textContent=value;levelCache[id]=value}}
function updateLevelHUD(){const l=levelState();levelText('levelNumber','УЧАСТОК '+l.number+' · '+l.target+' т');levelText('shelfRemaining',Math.ceil(l.goalRemaining)+' т осталось');levelText('shelfTrips','Погружено '+Math.round(l.loaded)+' т · Доставлено '+Math.round(l.dumped)+' т');$('shelfProgress').style.width=(l.progress*100)+'%';}

function showLevelFinish(){resetInputs();keys.clear();state.velocity={yaw:0,boom:0,stick:0,curl:0};state.driveSpeed=0;state=stepChassis(state,0,1/120,ground).state;rig.update(state);rig.root.updateWorldMatrix(true,true);audio.update(0,false,false);hornGesture.reset();const l=levelState();$('finishLevel').textContent='УРОВЕНЬ '+l.number+' ПРОЙДЕН';$('finishDetails').textContent='Погружено '+Math.round(l.loaded)+' т. Доставлено на отвал '+Math.round(l.dumped)+' т. Следующий участок и новая машина открыты.';$('levelFinish').hidden=false;const rating=shift.snapshot();completeCareer(levelState().number,rating);let summary=document.getElementById('finishOperator');if(!summary){summary=document.createElement('p');summary.id='finishOperator';summary.className='shift-summary';$('finishDetails').after(summary);}summary.textContent='★'.repeat(rating.stars)+' · Точность '+Math.round(rating.accuracy)+'% · '+Math.round(rating.rate)+' т/ч';$('nextLevel').focus();}
$('nextLevel').onclick=()=>{if(!advanceLevel())return;resetTerrain();traffic.reset();shift.reset();systems.reset();carryAssist.reset();cameraResponse.reset();productionYard.reset();queueRequested=options.autoSupply;manualRequest=false;state={...START,velocity:{...START.velocity}};active=-1;waitingTruck=-1;completed=0;impact=0;resetInputs();keys.clear();for(const side of ['left','right'])$(side+'Stick').querySelector('i').style.transform='translate(0px,0px)';for(const t of trucks){t.route=null;t.suspension=createSuspension();t.roadPitch=t.roadRoll=0;t.pitch=0;t.roll=0;t.tipAngle=0;t.dumpSlot=null;t.loadForce={x:0,z:0};if(t.bedPivot)t.bedPivot.rotation.z=0;if(t.tailgate)t.tailgate.rotation.z=0;t.hoist?.update(0);t.state='parked';t.tonnes=0;t.dispatched=false;t.worldVelocity=V();t.wait=0;t.x=t.home.x;t.z=t.home.z;t.yaw=t.homeYaw??0;t.previousX=t.x;t.previousZ=t.z;t.previousYaw=t.yaw;t.root.position.copy(t.home);t.root.position.y=ground(t.x,t.z);t.root.rotation.set(0,t.yaw,0);t.cargo.visible=false;t.load?.clear();for(const w of t.wheels){w.steer.position.y=1.14;w.steer.rotation.y=0;w.roll.rotation.z=0}}rocks.reset();dumpSite.reset();dozer.reset();dumpGrader.reset();updateDozerButton();scoopEmission=0;lastScoopEntry=null;hasLastMouth=false;previousState=state;trackTravel=0;world.update();terrainDirty=false;cameraReady=false;rig.update(state);$('levelFinish').hidden=true;updateLevelHUD();};
updateLevelHUD();$('bucketCapacity').textContent='КОВШ · '+BUCKET_VOLUME.toLocaleString('ru-RU',{maximumFractionDigits:1})+' м³';
function tick(dt){if(levelState().status!=='playing'){time+=dt;traffic.update(trucks,dt,state,dozer,dumpGrader);for(const truck of trucks){truck.previousX=truck.x;truck.previousZ=truck.z;truck.previousYaw=truck.yaw;driveTruck(truck,dt,time,{dumpSite,transport:(mass,point,velocity)=>rocks.transport(mass,point,velocity,truck.deliveryId)});}rocks.update(dt,emitterRig,trucks);dumpGrader.update(dt,trucks);dumpSite.update(dt);return;}previousState=state;time+=dt;if(trucks[active]?.awaitDump)hornGesture.onDispatch();if(stepMaterial(dt))terrainDirty=true;drainCaveIns(onCaveMovement);const t=trucks[active],raw=effectiveInputs(),command=shift.inputs(raw,options.precision);!FACE_SHOVEL&&carryAssist.command(state,command,{enabled:options.carryAssist,precision:options.precision,manualCurl:raw.right.x,contact:soilContact(state)});const travel=stepChassis(state,command.drive,dt,ground);state=travel.state;trackTravel+=travel.distance;lastBlocked=travel.blocked;const result=stepRig(state,command.left,command.right,dt,t);state=result.state;carryAssist.validate(state,result.contact);bucketContact(t,result.truckHit,dt);impact=Math.max(impact*Math.exp(-dt*8),Math.min(.07,result.impact*.15));if(result.work>0||result.graded>0||result.relief>0)terrainDirty=true;bucketFrame(state,physicsFrame);if(result.graded>.004)rocks.puff(V(result.gradePoint.x,result.gradePoint.y,result.gradePoint.z),.07);if(result.work>0){scoopEmission+=result.work*BUCKET_TONNES;lastScoopEntry=result.entry;}while(scoopEmission>=.09||result.work===0&&scoopEmission>1e-9){const mass=Math.min(.09,scoopEmission);if(!spawnScoopChip(lastScoopEntry,mass))break;scoopEmission=Math.max(0,scoopEmission-mass);}

if(t&&['coming','staging','backing','ready','repositioning'].includes(t.state))updateLoadingBay(t,state,dt);
traffic.update(trucks,dt,state,dozer,dumpGrader);
for(const truck of trucks){truck.previousX=truck.x;truck.previousZ=truck.z;truck.previousYaw=truck.yaw;driveTruck(truck,dt,time,{dumpSite,transport:(mass,point,velocity)=>rocks.transport(mass,point,velocity,truck.deliveryId)});for(const spill of truck.load.drainSpills()){rocks.spill(truck,spill);if(truck.dispatched){delivered=Math.max(0,delivered-spill.mass);recordTransportSpill(spill.mass);}}}
framePoint(physicsFrame,dischargeMouth().x,dischargeMouth().y,0,mouth);mouthVelocity.copy(mouth).sub(lastMouthPoint).multiplyScalar(hasLastMouth?1/dt:0);lastMouthPoint.copy(mouth);hasLastMouth=true;
rotationMatrix.set(physicsFrame.ax,physicsFrame.bx,physicsFrame.cx,0,physicsFrame.ay,physicsFrame.by,physicsFrame.cy,0,physicsFrame.az,physicsFrame.bz,physicsFrame.cz,0,0,0,0,1);rotation.setFromRotationMatrix(rotationMatrix);let dumping=false;
// Gravity and the amount above the cutting lip determine the granular flow.
const flow=releaseRate(state,time);if(state.payload>0&&flow>0&&!result.contact){dumping=true;const amount=Math.min(state.payload,dt*flow);state.payload-=amount;rocks.pour(amount*BUCKET_TONNES,mouth,rotation,mouthVelocity);}else rocks.finishPour();
rocks.update(dt,emitterRig,trucks);dumpGrader.update(dt,trucks);dumpSite.update(dt);shift.update(dt,{loadPressure:result.pressure||0,work:(result.work*BUCKET_TONNES+result.graded*.55)/dt,payload:state.payload,beds:trucks.reduce((m,t)=>m+t.load.field.mass,0),loose:rocks.groundDeposited,motion:Math.abs(state.velocity.boom)+Math.abs(state.velocity.stick)+Math.abs(state.velocity.curl),contact:result.contact,ready:t?.state==='ready',currentLoad:t?.load.field.mass||0});systems.update(dt,{pressure:result.pressure||0,motion:Math.abs(state.velocity.boom)+Math.abs(state.velocity.stick)+Math.abs(state.velocity.yaw)+Math.abs(state.driveSpeed||0),payload:state.payload,impact:result.impact});serviceDispatch();const gradingWasBusy=dozer.busy;if(dozer.update(dt,state,trucks))terrainDirty=true;if(gradingWasBusy!==dozer.busy)updateDozerButton();
presentDigging=result.digging||result.graded>0;presentDumping=dumping;presentCutRate=(result.work*BUCKET_TONNES+result.graded*.55)/dt;presentFlowRate=dumping?flow*BUCKET_TONNES:0;
const airborne=rocks.inFlightMass;if(finishIfReady(state.payload,airborne+dozer.mass+dumpGrader.mass+trucks.reduce((sum,t)=>sum+t.tonnes,0))){world.update();showLevelFinish();}}
let presentDigging=false,presentDumping=false,presentCutRate=0,presentFlowRate=0,uiClock=1,audioClock=1,lastView=-1,shadowClock=1;let shadowRevision=-1,shadowLoadRevision=-1,shadowCharge=null;const shadowPose=new Float64Array(10).fill(NaN);const cameraBase=V(),renderState={...state};
const audioRight=V();const uiCache=new Map();function textChanged(id,value){if(uiCache.get(id)!==value){$(id).textContent=value;uiCache.set(id,value)}}
function renderFrame(dt=1/60,alpha=1){
 if(viewportResizePending){viewportResizePending=false;resizeRendering();}
 if(pendingQuality){const profile=pendingQuality;pendingQuality=null;applyQuality(profile);}
 renderer.info.reset();document.body.classList.toggle('cabin-view',view===1);
 for(const key of ['baseX','baseY','baseZ','yaw','boom','stick','curl','shovelDoor','pitch','roll','payload'])renderState[key]=(previousState[key]??state[key])+(state[key]-(previousState[key]??state[key]))*alpha;
 renderState.visualPayload=Math.max(0,renderState.payload-(rocks.intakeMass+scoopEmission)/BUCKET_TONNES);
 renderState.velocity=state.velocity;renderState.driveSpeed=state.driveSpeed;
 if(terrainDirty&&time-lastTerrainUpdate>.04){world.update();lastTerrainUpdate=time;terrainDirty=false;}
 dozer.render(dt,alpha);dumpGrader.render(dt,alpha);rig.update(renderState,dt);rig.telemetry(shift.pressure,renderState.payload,tabletData());rig.advanceTracks(trackTravel);trackTravel=0;rig.root.updateWorldMatrix(true,true);
 for(const truck of trucks){truck.root.position.x=T.MathUtils.lerp(truck.previousX??truck.x,truck.x,alpha);truck.root.position.z=T.MathUtils.lerp(truck.previousZ??truck.z,truck.z,alpha);const before=truck.previousYaw??truck.yaw,delta=Math.atan2(Math.sin(truck.yaw-before),Math.cos(truck.yaw-before));truck.root.rotation.y=before+delta*alpha;}
 const end=forward(renderState);
const turn=new T.Quaternion().setFromAxisAngle(V(0,1,0),renderState.yaw);let pos,target;
if(view===0){const framing=camera.aspect<.8?1.65:1;pos=rig.root.localToWorld(V(-11.5,6.5,-7).multiplyScalar(framing).applyQuaternion(turn));const weight=framing>1?.2:.36;target=V((renderState.baseX||0)+(end.x-(renderState.baseX||0))*weight,(renderState.baseY??4)+2,(renderState.baseZ||0)+(end.z-(renderState.baseZ||0))*weight)}else if(view===1){pos=rig.root.localToWorld(rig.seat.clone().applyQuaternion(turn));target=rig.root.localToWorld(rig.seat.clone().add(V(CABIN_VIEW.forward.x,CABIN_VIEW.forward.y,CABIN_VIEW.forward.z)).applyQuaternion(turn));target.lerp(V(end.x,end.y,end.z),.05)}else{pos=V((renderState.baseX||0)+11,10,12);target=V((renderState.baseX||0)+3,2,-4)}
const targetFov=cameraFov(view,camera.aspect);if(!cameraReady){cameraBase.copy(pos);look.copy(target);camera.fov=targetFov;cameraReady=true;lastView=view}else{const rate=lastView!==view?7:view===1?14:4;cameraBase.lerp(pos,1-Math.exp(-dt*rate));look.lerp(target,1-Math.exp(-dt*6));camera.fov=T.MathUtils.lerp(camera.fov,targetFov,1-Math.exp(-dt*8));if(cameraBase.distanceToSquared(pos)<.04)lastView=view;}camera.updateProjectionMatrix();camera.position.copy(cameraBase);const motion=Math.abs(renderState.velocity.boom)+Math.abs(renderState.velocity.stick)+Math.abs(renderState.velocity.yaw)+Math.abs(renderState.velocity.curl);cameraResponse.update(dt,{impact,work:presentDigging?1:0,motion,slew:renderState.velocity.yaw});const responseScale=view===2?0:view===1?.5:1;camera.position.y+=cameraResponse.y*responseScale;camera.lookAt(look);camera.rotateZ(cameraResponse.roll*responseScale);weather.update(dt,time,camera);for(const truck of trucks)truck.lod?.update(camera);

 const t=trucks[active];uiClock+=dt;audioClock+=dt;
 if(uiClock>=.1){uiClock=0;for(const id of ['driveForward','driveBack'])$(id).style.borderColor=lastBlocked?'#d69b70':'#ffffff40';textChanged('tons',Math.round(levelState().dumped)+' т');updateDozerButton();textChanged('loads',Math.round(t?.tonnes||0)+' / '+TRUCK_CAPACITY);textChanged('bucketFill',Math.round(state.payload*100)+'%');$('horn').dataset.status=queueRequested?'Следующий в очереди':t?.trafficWaiting?'Ожидает проезда':t?.state==='ready'?'Под погрузкой':['coming','backing','staging'].includes(t?.state)?'Подъезжает':'';$('rightStick').style.borderColor=state.payload>.94?'#a8d2a2':presentDigging?'#e9bc70':'#ffffff35';$('horn').style.borderColor=t?.state==='ready'?'#a8d2a2':['coming','staging','backing','repositioning'].includes(t?.state)?'#8ac4d9':'#ffffff35';$('view').textContent=['◉','▣','↗'][view];updateLevelHUD();}
 if(audioClock>=1/30){audioClock=0;let yard=dozer.busy?.4:0,yardPan=0,yardSpeed=0;audioRight.set(1,0,0).applyQuaternion(camera.quaternion);for(const truck of trucks){const dx=truck.x-camera.position.x,dz=truck.z-camera.position.z,distance=Math.hypot(dx,dz),weight=(truck.route?.speed?Math.min(1,truck.route.speed/4):truck.state==='unloading'?.65:.12)*12/(12+distance);if(weight>yard){yard=weight;yardPan=(dx*audioRight.x+dz*audioRight.z)/Math.max(1,distance);yardSpeed=(truck.route?.speed||0)/9;}}audio.update(motion+Math.abs(state.driveSpeed||0)*.9,presentDigging,presentDumping,{boom:state.velocity.boom,stick:state.velocity.stick,curl:state.velocity.curl,slew:state.velocity.yaw,drive:state.driveSpeed,cutRate:presentCutRate,flowRate:presentFlowRate,cabin:view===1,yard,yardPan,yardSpeed});}
 shadowClock+=dt;const pose=[renderState.baseX,renderState.baseY,renderState.baseZ,renderState.yaw,renderState.boom,renderState.stick,renderState.curl,renderState.pitch,renderState.roll,renderState.payload],loadRevision=trucks.reduce((sum,t)=>sum+t.load.field.revision,0),truckMotion=trucks.some(t=>!['parked','ready'].includes(t.state)||t.suspension&&Math.abs(t.suspension.v)+Math.abs(t.suspension.vp)+Math.abs(t.suspension.vr)>.001),moving=pose.some((v,i)=>Math.abs(v-shadowPose[i])>.0005),revision=world.metrics.updates;
 if(shadowClock>=1/quality.shadowHz&&(moving||truckMotion||dozer.busy||dumpGrader.busy||rocks.mesh.visible||shadowCharge!==rig.charge.shape||shadowRevision!==revision||shadowLoadRevision!==loadRevision||Number.isNaN(shadowPose[0]))){shadowClock=0;shadowPose.set(pose);shadowRevision=revision;shadowLoadRevision=loadRevision;shadowCharge=rig.charge.shape;placeSun(sun,renderState,quality);renderer.shadowMap.needsUpdate=true;}
 productionYard.update(dt,trucks,renderState,rocks,rig,shift.pressure);const nightBlend=lighting.update(dt);contacts.update(dt,renderState,nightBlend);composer.render(dt);
}
const shaderWarmup={ready:false,milliseconds:0};const clock=new FixedClock({maxSteps:12});let lastPresented=null;function animate(now){requestAnimationFrame(animate);if(paused||document.hidden){if(onboarding?.isOpen&&!document.hidden&&!contextLost&&(introFrameDirty||viewportResizePending||pendingQuality)){introFrameDirty=false;renderFrame(0,1);if(!window.quarryBoot?.isReady)window.quarryBoot?.ready();}clock.reset();lastPresented=null;return}const start=performance.now(),elapsed=lastPresented===null?0:now-lastPresented;lastPresented=now;const frame=clock.advance(now,tick);renderFrame(frame.dt||1/60,frame.alpha);const cpu=performance.now()-start;if(elapsed>0&&elapsed<60000){metrics.record(elapsed,cpu);options.quality==='auto'&&governor.sample(Math.min(100,elapsed),Math.min(.5,elapsed/1000))}if(!window.quarryBoot?.isReady)window.quarryBoot?.ready();}
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;setPaused(true);window.quarryBoot?.waiting('Восстанавливаем изображение…')});
renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;introFrameDirty=true;refreshEnvironment();renderer.shadowMap.needsUpdate=true;clock.reset();setPaused(false);window.quarryBoot?.ready()});
addEventListener('pagehide',event=>{setPaused(true);if(!event.persisted){inputController.dispose();hornGesture.reset();audio.dispose()}});addEventListener('pageshow',()=>setPaused(false));
export function diagnostics(){return {...metrics.snapshot(),traffic:traffic.snapshot(),operator:shift.snapshot(),shaderWarmup:{...shaderWarmup},quality:quality.name,droppedSteps:clock.dropped,world:{...world.metrics},audio:audio.diagnostics(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,resources:{...renderer.info.memory}};}
operatorPanel=createOperatorPanel({options,onPause:setPaused,readStats:()=>({shift:shift.snapshot(),career:loadCareer()}),onOptions(value,key){saveOptions(value);if(key==='quality'&&value.quality!=='auto')governor.set(['economy','balanced','high'].indexOf(value.quality));if(key==='hydraulics')audio.setHydraulics?.(value.hydraulics);if(key==='autoSupply')queueRequested=value.autoSupply||manualRequest;}});
fleetShop=createFleetShop({
 onPause:setPaused,
 canSelect(){if(FREE_MACHINE_TRIAL)return true;if(levelState().status==='playing'&&(levelState().loaded>.001||levelState().excavated>.001))return 'Завершите текущий участок: смена машины доступна перед началом следующего задания.';return state.payload<.00001&&rocks.inFlightMass<.00001&&trucks.every(t=>t.tonnes<.00001)&&dozer.mass<.00001&&dumpGrader.mass<.00001||'Опустошите ковш и дождитесь доставки всех загруженных БелАЗов.';},
 onSelect(){try{localStorage.removeItem('quarry-shift-v2')}catch{}location.reload();}
});
if(options.quality!=='auto')governor.set(['economy','balanced','high'].indexOf(options.quality));if(options.hydraulics)audio.setHydraulics?.(true);queueRequested=options.autoSupply;
function tabletData(){const truck=trucks[active];return {machine:MACHINE.name,bucketMass:state.payload*BUCKET_TONNES,fill:state.payload,truckMass:truck?.load.field.mass||0,truckPresent:!!truck,truckCapacity:TRUCK_CAPACITY,queue:waitingTruck>=0?(trucks[waitingTruck].state==='queued'?'Следующий готов':'Следующий подходит'):truck?.awaitDump?'Ожидание сектора отвала':'Свободна',systems:systems.snapshot(),level:levelState(),trips:shift.trips};}
tabletPanel=createTabletPanel({readData:tabletData,onPause:setPaused,onFleet:()=>fleetShop.open(),onOptions:()=>operatorPanel.open(),onCamera:()=>{$('view').click()},physical:rig.tablet});
const tabletButton=document.createElement('button');tabletButton.id='tabletOpen';tabletButton.setAttribute('aria-label','Открыть бортовой планшет');tabletButton.title='Бортовой планшет · Tab';tabletButton.textContent='▤';tabletButton.onclick=()=>tabletPanel.open();document.querySelector('.tool-bank').append(tabletButton);
const tabletRay=new T.Raycaster(),tabletPointer=new T.Vector2();renderer.domElement.addEventListener('pointerdown',event=>{if(view!==1||paused)return;const rect=renderer.domElement.getBoundingClientRect();tabletPointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);tabletRay.setFromCamera(tabletPointer,camera);const hit=tabletRay.intersectObject(rig.tablet.screen,false)[0];if(hit&&rig.tablet.pick(hit.uv)==='expand')tabletPanel.open();});
addEventListener('keydown',event=>{if(onboarding?.isOpen)return;if(event.target?.tagName==='INPUT'||event.target?.tagName==='SELECT')return;if(event.code==='KeyC'&&!tabletPanel.isOpen){event.preventDefault();$('view').click();}if(event.code==='Tab'&&!operatorPanel.isOpen&&!fleetShop.isOpen){event.preventDefault();if(tabletPanel.isOpen)tabletPanel.close();else tabletPanel.open();}});
// Save only a settled mass ledger: no packet or blade payload may disappear at reload.
let lastSaveSignature='';
const saveBadge=document.createElement('small');saveBadge.style.cssText='display:block;padding:5px 12px;color:#b9c9c2;font-size:10px';document.querySelector('.telemetry').append(saveBadge);
function saveShift(){
 if(suppressSave||onboarding?.isOpen)return false;
 if(rocks.inFlightMass>1e-7||dozer.mass>1e-7||dumpGrader.mass>1e-7){saveBadge.textContent='Автосохранение после осыпания породы…';return false;}
 try{
 const signature=JSON.stringify([MACHINE.id,state.baseX,state.baseZ,state.boom,state.stick,state.curl,state.payload,levelState().loaded,world.metrics.updates,Math.floor(time/30),trucks.map(t=>[t.state,t.x,t.z,t.tonnes]),dumpSite.field.revision]);if(signature===lastSaveSignature)return true;
 const grid=f=>({heights:Array.from(f.heights),mass:f.mass});
 const saved={version:4,onboarding:onboarding?.progress||{version:1,status:'complete'},trafficRevision:2,layout:'southern-dump-v1',machine:MACHINE.id,terrain:saveTerrain(),level:levelState(),state,active,waitingTruck,delivered,completed,time,view,deliveryMass:[...deliveryMass],systems:systems.save(),shift:{...shift,command:undefined},dump:grid(dumpSite.field),trucks:trucks.map(t=>({state:t.state,x:t.x,z:t.z,yaw:t.yaw,wait:t.wait||0,tipAngle:t.tipAngle||0,awaitDump:!!t.awaitDump,deliveryId:t.deliveryId,dispatched:t.dispatched,bayX:t.bayX,bayZ:t.bayZ,dumpSlot:t.dumpSlot,load:grid(t.load.field),route:t.route?{points:t.route.curve.points.map(p=>[p.x,p.z]),distance:t.route.distance,speed:t.route.speed,reverse:t.route.reverse,curvature:Array.from(t.route.curvature),speeds:Array.from(t.route.speeds)}:null}))};
 localStorage.setItem('quarry-shift-v2',JSON.stringify(saved));lastSaveSignature=signature;saveBadge.textContent='Смена сохранена · '+new Date().toLocaleTimeString('ru-RU');return true;
 }catch{saveBadge.textContent='Не удалось сохранить смену в браузере';return false;}
}
function restoreShift(){
 let saved;try{saved=JSON.parse(localStorage.getItem('quarry-shift-v2')||'null')}catch{return;}
 if(!saved||![2,3,4].includes(saved.version)||saved.machine!==MACHINE.id||saved.trucks?.length!==trucks.length)return;
 try{
 if(saved.version<4&&!localStorage.getItem('quarry-shift-v2-backup'))localStorage.setItem('quarry-shift-v2-backup',JSON.stringify(saved));
 restoreTerrain(saved.terrain);restoreLevel(saved.level);
 const restoreGrid=(f,data)=>{if(data.heights?.length!==f.heights.length||data.heights.some(v=>!Number.isFinite(v)||v<0||v>100))throw Error('Invalid load');f.heights.set(data.heights);f.mass=f.heights.reduce((a,b)=>a+b,0)*f.area*f.density;f.revision++;f.dirty=true;};
 restoreGrid(dumpSite.field,saved.dump);
 for(let i=0;i<trucks.length;i++){const t=trucks[i],v=saved.trucks[i];for(const k of ['state','x','z','yaw','wait','tipAngle','awaitDump','deliveryId','dispatched','bayX','bayZ'])if(v[k]!==undefined)t[k]=v[k];restoreGrid(t.load.field,v.load);t.tonnes=t.load.field.mass;t.load.update(.04);t.root.position.set(t.x,ground(t.x,t.z),t.z);t.root.rotation.y=t.yaw;t.previousX=t.x;t.previousZ=t.z;t.previousYaw=t.yaw;
 if(v.route){makeRoute(t,v.state);t.route.curve=new T.CatmullRomCurve3(v.route.points.map(([x,z])=>V(x,0,z)),false,'centripetal');t.route.curve.arcLengthDivisions=2048;t.route.length=t.route.curve.getLength();Object.assign(t.route,{distance:Math.min(v.route.distance,t.route.length),speed:0,reverse:v.route.reverse,curvature:Float32Array.from(v.route.curvature),speeds:Float32Array.from(v.route.speeds)});}else t.route=null;
 if(v.dumpSlot)t.dumpSlot=dumpSite.reserve(t,v.dumpSlot.index);
 if(saved.version<4){if(['dumpStaging','dumpBacking','unloading','lowering'].includes(t.state)){t.z-=40;t.root.position.z=t.z;t.previousZ=t.z;if(t.route)for(const p of t.route.curve.points)p.z-=40;}if(t.state==='leaving')makeRoute(t,'leaving');}

 }
 if(saved.trafficRevision!==2){recoverEmptyFleet(trucks,dumpSite);if(trucks[saved.active]?.state==='parked')saved.active=-1;saved.waitingTruck=-1;}
  systems.restore(saved.systems);state={...START,...saved.state,velocity:{yaw:0,boom:0,stick:0,curl:0},driveSpeed:0};previousState=state;active=saved.active;waitingTruck=saved.waitingTruck??-1;delivered=saved.delivered;completed=saved.completed;time=saved.time;view=saved.view;Object.assign(shift,saved.shift);for(const [id,mass]of saved.deliveryMass||[])deliveryMass.set(id,mass);rig.update(state);world.update();dumpSite.update(.2);updateLevelHUD();restoredShift=true;saveBadge.textContent='Сохранённая смена восстановлена';if(levelState().status==='complete')showLevelFinish();
 }catch{localStorage.removeItem('quarry-shift-v2');location.reload();}
}
restoreShift();setInterval(()=>{if(globalThis.requestIdleCallback)requestIdleCallback(saveShift,{timeout:2000});else saveShift();},8000);addEventListener('pagehide',saveShift);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveShift()});$('nextLevel').addEventListener('click',()=>setTimeout(saveShift,0));
setPaused(false);
let viewportResizePending=false;function viewportChanged(){viewportResizePending=true;setPaused(false)}addEventListener('resize',viewportChanged);window.visualViewport?.addEventListener('resize',viewportChanged);
onboarding=createForemanIntro({hasSave:restoredShift,legacyProgress:loadCareer().completed>0,storage:localStorage,
 onFrame(){introFrameDirty=true;},
 onPause(value){if(value){if(storyView===null)storyView=view;view=2;}else if(storyView!==null){view=storyView;storyView=null;}cameraReady=false;setPaused(value);},
 onNewGame(){suppressSave=true;try{prepareNewGame(localStorage);location.reload();}catch(error){suppressSave=false;throw error;}},
 onStart(){setPaused(false);saveShift();}
});setPaused(false);
export function snapshot(){return {machine:MACHINE.id,systems:systems.snapshot(),state:{...state,velocity:{...state.velocity}},bucket:forward(state),trucks:trucks.map(t=>({state:t.state,tonnes:t.tonnes,x:t.x,z:t.z})),active,waitingTruck,delivered,view,completed,queueRequested,precision:options.precision,operator:shift.snapshot(),traffic:traffic.snapshot(),lighting:lighting.snapshot(),dozer:dozer.snapshot(),dumpGrader:dumpGrader.snapshot(),level:levelState(),front:frontState(),materials:{bank:shelfMass(),loose:looseMass(),inFlight:rocks.inFlightMass,bucket:state.payload*BUCKET_TONNES,dozer:dozer.mass,dump:dumpSite.field.mass,dumpBlade:dumpGrader.mass,beds:trucks.reduce((mass,t)=>mass+t.load.field.mass,0)}}};

// Warm visible and hidden cargo/particle material variants before play. Compile
// against the composer's linear target, matching the real RenderPass; compiling
// for the screen would warm a different tone-mapping shader and still stutter.
window.quarryBoot?.progress(.92);
const warmupStart=performance.now(),previousTarget=renderer.getRenderTarget();let compiling;
try{renderer.setRenderTarget(composer.renderTarget1);compiling=renderer.compileAsync(scene,camera).then(()=>true);}finally{renderer.setRenderTarget(previousTarget);}
let warmupTimer;shaderWarmup.ready=await Promise.race([compiling,new Promise(resolve=>{warmupTimer=setTimeout(()=>resolve(false),12000)})]);clearTimeout(warmupTimer);shaderWarmup.milliseconds=performance.now()-warmupStart;
window.quarryBoot?.progress(.98);requestAnimationFrame(animate);

if(new URLSearchParams(location.search).has('profile')){const report=document.createElement('pre');report.id='runtimeProfile';report.style.cssText='position:fixed;right:8px;top:165px;z-index:90;background:#102127e8;color:#bfe3c9;font:11px monospace;padding:12px;max-height:50vh;overflow:auto;pointer-events:none';document.body.append(report);setInterval(()=>{report.textContent=JSON.stringify(diagnostics(),null,2)},1000);}
