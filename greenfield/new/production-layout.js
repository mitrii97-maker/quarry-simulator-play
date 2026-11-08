import {GREENFIELD_ACTIVE} from './development-config.js';

// Traffic lanes remain north of the dump stockpile; the raised apron is
// entered from its broad approach, never across the steep receiving edge.
export const PARKING=GREENFIELD_ACTIVE?{xs:[22,28,34],z:-2}:{xs:[24,33,42],z:-2};
export const HAUL_ROADS=[
 {points:[[-30,-10],[-15,-10],[0,-10],[12,-13]],width:8.5},
 {points:[[-4,-16],[6,-16],[14,-13],[25,-13],[33,-17],[36,-25]],width:7.4,endWidth:5.8},
 {points:[[48,-23],[43,-20],[30,-20],[15,-20],[1,-22],[-8,-24]],width:7.0},
 {points:[[22,-2],[33,-2],[45,-2]],width:8.0}
];
