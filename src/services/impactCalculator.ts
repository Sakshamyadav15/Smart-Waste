

interface ImpactMetrics {
  co2SavedKg: number;
  waterSavedLiters: number;
  energySavedKwh: number;
  treesEquivalent: number;
}

const IMPACT_DATA: Record<string, ImpactMetrics> = {
  Plastic: {
    co2SavedKg: 2.0,      
    waterSavedLiters: 50,  
    energySavedKwh: 5.5,   
    treesEquivalent: 0.02, 
  },
  Paper: {
    co2SavedKg: 1.5,
    waterSavedLiters: 35,
    energySavedKwh: 4.0,
    treesEquivalent: 0.05, 
  },
  Glass: {
    co2SavedKg: 0.5,
    waterSavedLiters: 20,
    energySavedKwh: 2.5,
    treesEquivalent: 0.01,
  },
  Metal: {
    co2SavedKg: 3.0,      
    waterSavedLiters: 100,
    energySavedKwh: 8.0,
    treesEquivalent: 0.03,
  },
  Cardboard: {
    co2SavedKg: 1.2,
    waterSavedLiters: 30,
    energySavedKwh: 3.5,
    treesEquivalent: 0.04,
  },
  Organic: {
    co2SavedKg: 0.8,      
    waterSavedLiters: 15,
    energySavedKwh: 1.0,
    treesEquivalent: 0.02,
  },
  'E-waste': {
    co2SavedKg: 4.0,      
    waterSavedLiters: 150,
    energySavedKwh: 12.0,
    treesEquivalent: 0.05,
  },
  'General Waste': {
    co2SavedKg: 0.3,
    waterSavedLiters: 10,
    energySavedKwh: 0.5,
    treesEquivalent: 0.01,
  },
};

export interface UserImpact {
  totalItems: number;
  co2Saved: number;
  waterSaved: number;
  energySaved: number;
  treesSaved: number;
  itemsByType: Record<string, number>;
}

export const calculateImpact = (wasteType: string): ImpactMetrics => {
  
  const avgWeightKg = 0.5;
  const impact = IMPACT_DATA[wasteType] || IMPACT_DATA['General Waste'];
  
  return {
    co2SavedKg: impact.co2SavedKg * avgWeightKg,
    waterSavedLiters: impact.waterSavedLiters * avgWeightKg,
    energySavedKwh: impact.energySavedKwh * avgWeightKg,
    treesEquivalent: impact.treesEquivalent * avgWeightKg,
  };
};

export const getUserImpact = (): UserImpact => {
  const history = JSON.parse(localStorage.getItem('classificationHistory') || '[]');
  
  let totalCO2 = 0;
  let totalWater = 0;
  let totalEnergy = 0;
  let totalTrees = 0;
  const itemsByType: Record<string, number> = {};
  
  history.forEach((item: { label: string }) => {
    const impact = calculateImpact(item.label);
    totalCO2 += impact.co2SavedKg;
    totalWater += impact.waterSavedLiters;
    totalEnergy += impact.energySavedKwh;
    totalTrees += impact.treesEquivalent;
    
    itemsByType[item.label] = (itemsByType[item.label] || 0) + 1;
  });
  
  return {
    totalItems: history.length,
    co2Saved: totalCO2,
    waterSaved: totalWater,
    energySaved: totalEnergy,
    treesSaved: totalTrees,
    itemsByType,
  };
};

export const calculatePoints = (wasteType: string): number => {
  const basePoints = {
    'E-waste': 100,
    Metal: 80,
    Plastic: 70,
    Paper: 60,
    Cardboard: 55,
    Glass: 50,
    Organic: 40,
    'General Waste': 20,
  };
  
  return basePoints[wasteType as keyof typeof basePoints] || 20;
};

export const getUserPoints = (): number => {
  const history = JSON.parse(localStorage.getItem('classificationHistory') || '[]');
  return history.reduce((total: number, item: { label: string }) => {
    return total + calculatePoints(item.label);
  }, 0);
};

export const getBadge = (totalItems: number): { name: string; emoji: string; color: string } => {
  if (totalItems >= 100) return { name: 'ecoChampion', emoji: '', color: 'gold' };
  if (totalItems >= 50) return { name: 'greenHero', emoji: '', color: 'green' };
  if (totalItems >= 25) return { name: 'ecoWarrior', emoji: '', color: 'blue' };
  if (totalItems >= 10) return { name: 'earthFriend', emoji: '', color: 'teal' };
  if (totalItems >= 5) return { name: 'beginner', emoji: '', color: 'lime' };
  return { name: 'newcomer', emoji: '', color: 'gray' };
};
