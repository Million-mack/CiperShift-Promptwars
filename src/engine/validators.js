// Verhoeff dihedral tables used for Indian Aadhaar checksum validation
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Verifies a numeric string against the Verhoeff checksum.
 */
export function verhoeffCheck(digitString) {
  if (!/^\d+$/.test(digitString)) return false;
  let c = 0;
  const reversed = digitString.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversed[i]]];
  }
  return c === 0;
}

/**
 * Verifies a credit card digit string using the Luhn algorithm.
 */
export function luhnCheck(digitString) {
  if (!/^\d{13,19}$/.test(digitString)) return false;
  if (/^(\d)\1+$/.test(digitString)) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digitString.length - 1; i >= 0; i--) {
    let digit = digitString.charCodeAt(i) - 48;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function validateEmail(value) {
  if (!value || value.length > 254) return { valid: false };
  const [local, domain] = value.split('@');
  if (!local || !domain) return { valid: false };
  if (local.includes('..') || domain.includes('..')) return { valid: false };
  if (local.startsWith('.') || local.endsWith('.')) return { valid: false };
  if (domain.startsWith('.') || domain.endsWith('.')) return { valid: false };
  return { valid: true, confidence: 'High' };
}

const PAN_ENTITY_CODES = new Set(['A', 'B', 'C', 'F', 'G', 'H', 'J', 'L', 'P', 'T']);

export function validatePAN(value) {
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)) {
    return { valid: false };
  }
  const numericPart = value.slice(5, 9);
  if (numericPart === '0000') {
    return { valid: false };
  }
  const fourthChar = value[3];
  const confidence = PAN_ENTITY_CODES.has(fourthChar) ? 'Verified (Structure)' : 'High';
  return { valid: true, confidence };
}

export function validateIPv4(value) {
  const parts = value.split('.');
  if (parts.length !== 4) return { valid: false };
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return { valid: false };
    if (part.length > 1 && part.startsWith('0')) return { valid: false };
    const num = Number(part);
    if (num < 0 || num > 255) return { valid: false };
  }
  return { valid: true, confidence: 'High' };
}

const AADHAAR_CONTEXT_RE = /\b(?:aadhaar|aadhar|uidai|uid|vid)\b/i;

export function validateAadhaar(rawValue, fullText, startIndex) {
  const digits = rawValue.replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(digits)) return { valid: false };
  if (/^(\d)\1{11}$/.test(digits)) return { valid: false };

  const isGrouped = /^\d{4}[\s-]\d{4}[\s-]\d{4}$/.test(rawValue);
  const startsValid = /^[2-9]/.test(digits);
  const passesVerhoeff = verhoeffCheck(digits);

  const contextStart = Math.max(0, startIndex - 45);
  const precedingText = fullText.slice(contextStart, startIndex);
  const hasContext = AADHAAR_CONTEXT_RE.test(precedingText);

  if (startsValid && passesVerhoeff) {
    return { valid: true, confidence: 'Verified (Verhoeff)' };
  }

  if (isGrouped) {
    if (startsValid || hasContext) {
      return { valid: true, confidence: 'High' };
    }
    // Accept non-zero-leading 4-4-4 grouped Aadhaar formats (e.g. 1234 5678 9012)
    if (!digits.startsWith('0')) {
      return { valid: true, confidence: 'Medium' };
    }
    return { valid: false };
  }

  // Unformatted 12-digit numbers must either pass Verhoeff or have explicit Aadhaar context
  if (hasContext) {
    return { valid: true, confidence: 'High' };
  }

  return { valid: false };
}

export function validateCreditCard(rawValue) {
  const digits = rawValue.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) return { valid: false };
  if (/^(\d)\1+$/.test(digits)) return { valid: false };
  if (!luhnCheck(digits)) return { valid: false };
  return { valid: true, confidence: 'Verified (Luhn)' };
}

export function validatePhone(rawValue) {
  const trimmed = rawValue.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (/^(\d)\1+$/.test(digits)) return { valid: false };

  if (trimmed.startsWith('+')) {
    if (digits.length < 8 || digits.length > 15) return { valid: false };
    // Indian +91 numbers must have 12 digits total and start mobile series 6-9
    if (digits.startsWith('91')) {
      if (digits.length !== 12 || !/^[6-9]/.test(digits.slice(2))) {
        return { valid: false };
      }
    }
    return { valid: true, confidence: 'High' };
  }

  // Indian mobile with leading 0 (11 digits) or 10 digits starting with 6-9
  if (/^0?[6-9]\d{9}$/.test(digits)) {
    return { valid: true, confidence: 'High' };
  }

  // Formatted North American / international local pattern e.g. (415) 890-2345 or 415-890-2345
  if (digits.length === 10 && /^(?:\(\d{3}\)[ -]?|\d{3}[ -])\d{3}[ -]\d{4}$/.test(trimmed)) {
    return { valid: true, confidence: 'Medium' };
  }

  return { valid: false };
}
