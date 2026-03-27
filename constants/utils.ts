
import { SubScenario } from '../types';

export const createSubScenarios = (worldId: string, worldData: any): SubScenario[] => {
  if (worldData.RAW_DATA) {
    return Object.entries(worldData.RAW_DATA).map(([context, scenarios], index) => ({
      id: `${worldId}-${index}`,
      title: `Bối cảnh: ${context}`,
      description: `Khám phá những câu chuyện khởi đầu tại ${context}.`,
      scenarios: scenarios as string[]
    }));
  }

  // Fallback cho các dữ liệu cũ chỉ có IDENTITIES phẳng
  return worldData.IDENTITIES.map((name: string, index: number) => ({
    id: `${worldId}-${index}`,
    title: name,
    description: `Khởi đầu câu chuyện trong bối cảnh: ${name.replace("Bối cảnh: ", "")}.`,
    scenarios: [name]
  }));
};
