// Utilidad para formatear números grandes
export const formatLargeNumber = (num: number): string => {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    
    if (remainder === 0) {
      return `${thousands}K`;
    } else {
      const decimal = Math.floor(remainder / 100);
      return decimal > 0 ? `${thousands}.${decimal}K` : `${thousands}K`;
    }
  }
  
  if (num < 1000000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    
    if (remainder === 0) {
      return `${millions}M`;
    } else {
      const decimal = Math.floor(remainder / 100000);
      return decimal > 0 ? `${millions}.${decimal}M` : `${millions}M`;
    }
  }
  
  // Para números mayores a mil millones
  const billions = Math.floor(num / 1000000000);
  const remainder = num % 1000000000;
  
  if (remainder === 0) {
    return `${billions}B`;
  } else {
    const decimal = Math.floor(remainder / 100000000);
    return decimal > 0 ? `${billions}.${decimal}B` : `${billions}B`;
  }
};

// Ejemplos de uso:
// formatLargeNumber(500) → "500"
// formatLargeNumber(1000) → "1K"
// formatLargeNumber(1500) → "1.5K"
// formatLargeNumber(10000) → "10K"
// formatLargeNumber(100000) → "100K"
// formatLargeNumber(1000000) → "1M"
// formatLargeNumber(1500000) → "1.5M"
// formatLargeNumber(100000000) → "100M"
// formatLargeNumber(1000000000) → "1B"