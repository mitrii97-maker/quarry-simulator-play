import {GREENFIELD_ACTIVE} from './development-config.js';

const GREENFIELD_LEVELS=[
 {number:1,title:'Снятие плодородного слоя',targetTonnes:120,rewardMachine:'volvo',faceHeight:.55,faceOffset:2.0,faceSkew:.08,workingWidth:5.6,sideShift:-.5,floorElevation:0,hardness:.32,payPerTonne:120,material:'topsoil'},
 {number:2,title:'Разрезная траншея',targetTonnes:500,rewardMachine:'hitachi',faceHeight:2.8,faceOffset:.3,faceSkew:-.16,workingWidth:6.0,sideShift:.45,floorElevation:-.38,hardness:.66,payPerTonne:145,material:'subsoil'},
 {number:3,title:'Транспортный съезд',targetTonnes:1000,rewardMachine:'komatsu',faceHeight:4.4,faceOffset:-1.1,faceSkew:.22,workingWidth:5.2,sideShift:-.75,floorElevation:-1.05,hardness:.86,payPerTonne:175,material:'overburden'},
 {number:4,title:'Первый угольный горизонт',targetTonnes:1500,rewardMachine:'liebherr',faceHeight:5.8,faceOffset:.6,faceSkew:-.10,workingWidth:6.35,sideShift:.2,floorElevation:-1.90,hardness:1.02,payPerTonne:200,material:'coal'}
];
const RETAINED_LEVELS=[
 {number:1,title:'Первый угольный уступ',targetTonnes:500,rewardMachine:'hitachi',faceHeight:5.0,faceOffset:0,hardness:.85,payPerTonne:120},
 {number:2,title:'Расширение рабочей площадки',targetTonnes:1000,rewardMachine:'komatsu',faceHeight:6.4,faceOffset:-1.0,hardness:1.0,payPerTonne:145},
 {number:3,title:'Плотный угольный пласт',targetTonnes:1500,rewardMachine:'liebherr',faceHeight:7.5,faceOffset:.7,hardness:1.18,payPerTonne:175},
 {number:4,title:'Глубокий фронтальный забой',targetTonnes:2000,rewardMachine:null,faceHeight:8.5,faceOffset:-.5,hardness:1.28,payPerTonne:200}
];
export const CAREER_LEVELS=Object.freeze((GREENFIELD_ACTIVE?GREENFIELD_LEVELS:RETAINED_LEVELS).map(Object.freeze));
export function levelConfig(number){const last=CAREER_LEVELS.at(-1);return CAREER_LEVELS[number-1]||{...last,number,targetTonnes:1500+(number-4)*500,title:'Горизонт −'+Math.round(2+(number-4)*1.5)+' м',floorElevation:(last.floorElevation||0)-(number-4)*1.5,faceOffset:(number%2?.8:-.8),faceSkew:number%2?.14:-.14,sideShift:number%2?.45:-.45};}
