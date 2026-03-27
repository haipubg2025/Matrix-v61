
import { Identity } from '../types';

export interface FanficCharacter {
  id?: string;
  name: string;
  gender?: string;
  role: string;
  age?: string;
  description: string;
  identities?: Identity[];
}

export type FanficCountry = 'Trung' | 'Nhật' | 'Hàn' | 'Việt Nam' | 'Khác';

export interface FanficWork {
  id: string;
  title: string;
  description: string;
  country?: FanficCountry;
  plot?: string;
  worldSetting?: string;
  characters: FanficCharacter[];
}
