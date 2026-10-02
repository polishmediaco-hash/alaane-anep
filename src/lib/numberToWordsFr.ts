/**
 * Algerian Financial Engine: French Number-to-Words Converter
 * Specially formatted for Algerian Dinars (DZD) and Centimes per Décret 05-468.
 */

const UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'
];

const TENS = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'
];

function convertBelowThousand(n: number): string {
  if (n === 0) return '';
  
  if (n < 20) {
    return UNITS[n];
  }

  if (n < 70) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    if (unit === 0) return TENS[ten];
    if (unit === 1) return `${TENS[ten]} et un`;
    return `${TENS[ten]}-${UNITS[unit]}`;
  }

  if (n < 80) {
    // 70 - 79: soixante-dix ... soixante-dix-neuf
    const unit = n - 60;
    if (unit === 11) return 'soixante et onze';
    return `soixante-${UNITS[unit]}`;
  }

  if (n < 100) {
    // 80 - 99: quatre-vingt ... quatre-vingt-dix-neuf
    const unit = n - 80;
    if (unit === 0) return 'quatre-vingts';
    return `quatre-vingt-${UNITS[unit]}`;
  }

  const hundred = Math.floor(n / 100);
  const remainder = n % 100;

  let hundredStr = '';
  if (hundred === 1) {
    hundredStr = 'cent';
  } else {
    hundredStr = `${UNITS[hundred]} cent${remainder === 0 ? 's' : ''}`;
  }

  if (remainder === 0) return hundredStr;
  return `${hundredStr} ${convertBelowThousand(remainder)}`;
}

export function numberToWords(n: number): string {
  if (n === 0) return 'zéro';
  if (n < 0) return `moins ${numberToWords(Math.abs(n))}`;

  const integerPart = Math.floor(n);
  if (integerPart === 0) return 'zéro';

  const chunks: { value: number; labelSingle: string; labelPlural: string }[] = [];

  const billions = Math.floor(integerPart / 1_000_000_000);
  const millions = Math.floor((integerPart % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((integerPart % 1_000_000) / 1_000);
  const remainder = integerPart % 1_000;

  if (billions > 0) {
    chunks.push({ value: billions, labelSingle: 'milliard', labelPlural: 'milliards' });
  }
  if (millions > 0) {
    chunks.push({ value: millions, labelSingle: 'million', labelPlural: 'millions' });
  }
  if (thousands > 0) {
    chunks.push({ value: thousands, labelSingle: 'mille', labelPlural: 'mille' }); // mille is invariable
  }
  if (remainder > 0) {
    chunks.push({ value: remainder, labelSingle: '', labelPlural: '' });
  }

  const wordsParts: string[] = [];

  for (const chunk of chunks) {
    if (chunk.labelSingle === 'mille') {
      if (chunk.value === 1) {
        wordsParts.push('mille');
      } else {
        wordsParts.push(`${convertBelowThousand(chunk.value)} mille`);
      }
    } else if (chunk.labelSingle === '') {
      wordsParts.push(convertBelowThousand(chunk.value));
    } else {
      const label = chunk.value > 1 ? chunk.labelPlural : chunk.labelSingle;
      wordsParts.push(`${convertBelowThousand(chunk.value)} ${label}`);
    }
  }

  return wordsParts.join(' ').trim();
}

/**
 * Format total amount in Dinars Algériens (DZD) and Centimes.
 * Example: 178500 -> "Cent soixante-dix-huit mille cinq cents Dinars Algériens"
 */
export function amountToFrenchWordsDZD(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(rounded);
  const centimes = Math.round((rounded - integerPart) * 100);

  const integerWords = numberToWords(integerPart);
  const capitalized = integerWords.charAt(0).toUpperCase() + integerWords.slice(1);
  const dinarsLabel = integerPart <= 1 ? 'Dinar Algérien' : 'Dinars Algériens';

  let result = `${capitalized} ${dinarsLabel}`;

  if (centimes > 0) {
    const centimesWords = numberToWords(centimes);
    const centimesLabel = centimes <= 1 ? 'Centime' : 'Centimes';
    result += ` et ${centimesWords} ${centimesLabel}`;
  }

  return result;
}

/**
 * Generates the official legal French invoice closure clause for Algerian public administrations & ANEP.
 */
export function formatLegalClause(amountTTC: number): string {
  const words = amountToFrenchWordsDZD(amountTTC);
  return `Arrêtée la présente facture à la somme de : ${words} TTC.`;
}
