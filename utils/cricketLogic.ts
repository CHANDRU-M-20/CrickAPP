
export const calculateOvers = (balls: number): string => {
  const overs = Math.floor(balls / 6);
  const remainder = balls % 6;
  return `${overs}.${remainder}`;
};

export const formatOverCount = (overs: number, balls: number): string => {
  return `${overs}.${balls}`;
};

export const getRunRate = (runs: number, totalBalls: number): string => {
  if (totalBalls === 0) return '0.00';
  const overs = totalBalls / 6;
  return (runs / overs).toFixed(2);
};

export const getStrikeRate = (runs: number, balls: number): string => {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
};

export const getEconomy = (runs: number, balls: number): string => {
  if (balls === 0) return '0.00';
  const overs = balls / 6;
  return (runs / overs).toFixed(2);
};
