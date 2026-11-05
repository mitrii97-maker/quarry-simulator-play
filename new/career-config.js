export const CAREER_LEVELS=Object.freeze([
 {number:1,title:'Первый угольный уступ',targetTonnes:500,rewardMachine:'hitachi',faceHeight:5.0,faceOffset:0,hardness:.85,payPerTonne:120},
 {number:2,title:'Расширение рабочей площадки',targetTonnes:1000,rewardMachine:'komatsu',faceHeight:6.4,faceOffset:-1.0,hardness:1.0,payPerTonne:145},
 {number:3,title:'Плотный угольный пласт',targetTonnes:1500,rewardMachine:'liebherr',faceHeight:7.5,faceOffset:.7,hardness:1.18,payPerTonne:175},
 {number:4,title:'Глубокий фронтальный забой',targetTonnes:2000,rewardMachine:null,faceHeight:8.5,faceOffset:-.5,hardness:1.28,payPerTonne:200}
].map(Object.freeze));
export function levelConfig(number){return CAREER_LEVELS[number-1]||{...CAREER_LEVELS.at(-1),number,targetTonnes:2000+(number-4)*500,title:'Производственный участок '+number};}
