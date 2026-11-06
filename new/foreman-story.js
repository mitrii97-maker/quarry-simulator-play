export const FOREMAN_NAME='Савельев Антон Владимирович — начальник участка';
export const INTRO_LINES=[
 'Ну, здорово, машинист. Добрался, значит? Я Савельев Антон Владимирович, начальник участка. Добро пожаловать на разрез. Располагайся, теперь здесь работать будешь',
 'Сразу объясню, как у нас всё устроено. На хорошую технику с первого дня никого не сажаем. Для начала получишь небольшой экскаватор. Освоишься, покажешь, на что способен',
 'Работа у нас простая на словах: копай породу, грузи БелАЗы, выполняй сменное задание. Но за техникой следи. Перегрузы, простои и поломки нам здесь не нужны. За хорошую работу получишь деньги, за косяки — штраф',
 'Покажешь хорошие результаты — пересадим на машину посерьёзнее. Там и ковш больше, и объёмы другие. Соответственно, и заработок выше. А если действительно толковый машинист, со временем доберёшься и до самой крупной техники на участке',
 'Ну что, машинист? Разговоры разговорами, а план сам себя не выполнит. Готов выходить в первую смену?'
];
// Content is independent of the dialog renderer so future shift reports can reuse it.
export const CONTROL_LESSONS=[
 {title:'Два рычага — четыре движения',text:'Левый джойстик: влево и вправо — поворот платформы, вверх и вниз — рукоять. Правый: вверх и вниз — стрела, влево и вправо — закрыть и открыть ковш. На клавиатуре: WASD и стрелки.'},
 {title:'Первый ковш',text:'Подведи открытый ковш зубьями к забою. Подтягивай рукоять, закрывай ковш и немного поднимай стрелу. Перенеси закрытый ковш над кузовом и открой его. Масса и заполнение видны на бортовом планшете.'},
 {title:'БелАЗы и ход гусениц',text:'Одно нажатие «Сигнал» отправляет загруженную машину. Два быстрых нажатия вызывают следующую. «Вперёд» и «Назад» нужно удерживать; на клавиатуре — E и Q. Пробел — сигнал, C — камера, Tab — планшет. Задание первой смены — погрузить 500 тонн.'}
];
export const INTRO_KEY='quarry-onboarding-v1';
export const NEW_GAME_KEYS=['quarry-shift-v2','quarry-career-v1','quarry-fleet-v1','quarry-machine-v1','quarry-rebuild-view',INTRO_KEY];
export function readIntro(storage,legacySave=false){
 let data;try{data=JSON.parse(storage.getItem(INTRO_KEY)||'null')}catch{}
 if(data?.status==='pending')return {version:1,status:'pending',line:Math.max(0,Math.min(INTRO_LINES.length-1,Number.isInteger(data.line)?data.line:0)),tutorial:!!data.tutorial,lesson:Math.max(0,Math.min(CONTROL_LESSONS.length-1,Number.isInteger(data.lesson)?data.lesson:0))};
 return {version:1,status:data?.status==='complete'||legacySave?'complete':'unseen',line:0,tutorial:false,lesson:0};
}
export function writeIntro(storage,state){try{storage.setItem(INTRO_KEY,JSON.stringify(state));return true}catch{return false}}
export function prepareNewGame(storage){
 // Backup must succeed before any progress is replaced. Preferences are retained.
 const previous=Object.fromEntries(NEW_GAME_KEYS.map(key=>[key,storage.getItem(key)]));
 storage.setItem('quarry-newgame-backup-v1',JSON.stringify({version:1,previous}));
 try{
  for(const key of NEW_GAME_KEYS)storage.removeItem(key);
  storage.setItem('quarry-machine-v1','volvo');storage.setItem('quarry-rebuild-view','0');
  storage.setItem(INTRO_KEY,JSON.stringify({version:1,status:'pending',line:0,tutorial:false,lesson:0}));
 }catch(error){for(const [key,value]of Object.entries(previous)){try{value===null?storage.removeItem(key):storage.setItem(key,value)}catch{}}throw error;}
}
