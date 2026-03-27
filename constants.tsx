
import { GameArchetype } from './types';
import { URBAN_NORMAL_ARCHETYPE } from './constants/urbanNormal';
import { URBAN_SUPER_ARCHETYPE } from './constants/urbanSuper';
import { FANTASY_HUMAN_ARCHETYPE } from './constants/fantasyHuman';
import { FANTASY_MULTI_ARCHETYPE } from './constants/fantasyMulti';
import { CULTIVATION_ARCHETYPE } from './constants/cultivation';
import { WUXIA_ARCHETYPE } from './constants/wuxia';
import { SCI_FI_ARCHETYPE } from './constants/sciFi';
import { HISTORY_ARCHETYPE } from './constants/history';
import { WHOLESOME_ARCHETYPE } from './constants/wholesome';

export const GAME_ARCHETYPES: GameArchetype[] = [
  URBAN_NORMAL_ARCHETYPE,
  URBAN_SUPER_ARCHETYPE,
  FANTASY_HUMAN_ARCHETYPE,
  FANTASY_MULTI_ARCHETYPE,
  CULTIVATION_ARCHETYPE,
  WUXIA_ARCHETYPE,
  SCI_FI_ARCHETYPE,
  HISTORY_ARCHETYPE,
  WHOLESOME_ARCHETYPE
];

export const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
