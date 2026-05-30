export const kgToLb = (kg: number) => Math.round(kg * 2.20462);
export const lbToKg = (lb: number) => Math.round(lb / 2.20462);

export const formatWeight = (weightInKg: number, unit: 'kg' | 'lb') => {
  if (unit === 'lb') {
    return `${kgToLb(weightInKg)} lb`;
  }
  return `${weightInKg} kg`;
};
