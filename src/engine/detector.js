import { PII_META, PII_TYPES } from './constants.js';
import {
  validateAadhaar,
  validateCreditCard,
  validateEmail,
  validateIPv4,
  validatePAN,
  validatePhone,
} from './validators.js';

const PATTERNS = [
  {
    type: PII_TYPES.EMAIL,
    regex: /(?<![A-Za-z0-9._%+-])[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}(?![A-Za-z0-9._%+-])/g,
    validate: (val) => validateEmail(val),
  },
  {
    type: PII_TYPES.CREDIT_CARD,
    regex: /(?<![0-9A-Za-z+]|\d[ -])(?:\d[ -]?){12,18}\d(?![0-9A-Za-z]|[ -]\d)/g,
    validate: (val) => validateCreditCard(val),
  },
  {
    type: PII_TYPES.AADHAAR,
    regex: /(?<![0-9A-Za-z+]|\d[ -])(?:\d{4}[ -]\d{4}[ -]\d{4}|\d{12})(?![0-9A-Za-z]|[ -]\d)/g,
    validate: (val, text, start) => validateAadhaar(val, text, start),
  },
  {
    type: PII_TYPES.IP_ADDRESS,
    regex: /(?<![0-9.A-Za-z])(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(?![0-9.A-Za-z])/g,
    validate: (val) => validateIPv4(val),
  },
  {
    type: PII_TYPES.PAN,
    regex: /(?<![A-Za-z0-9])[A-Z]{5}[0-9]{4}[A-Z](?![A-Za-z0-9])/g,
    validate: (val) => validatePAN(val),
  },
  {
    type: PII_TYPES.PHONE,
    regex: /(?<![0-9A-Za-z+])(?:\+\d{1,3}(?:[ -]?\(?\d{1,5}\)?){1,4}|(?:0[ -]?)?[6-9]\d{4}[ -]?\d{5}|(?:\(\d{3}\)[ -]?|\d{3}[ -])\d{3}[ -]\d{4})(?![0-9A-Za-z])/g,
    validate: (val) => validatePhone(val),
  },
];

/**
 * Produces a canonical key so equivalent repeated values receive identical pseudonyms.
 */
export function normalizeEntityValue(type, value) {
  switch (type) {
    case PII_TYPES.EMAIL:
      return value.trim().toLowerCase();
    case PII_TYPES.PAN:
      return value.trim().toUpperCase();
    case PII_TYPES.CREDIT_CARD:
    case PII_TYPES.AADHAAR:
      return value.replace(/[\s-]/g, '');
    case PII_TYPES.PHONE: {
      const cleaned = value.replace(/[\s().-]/g, '');
      return cleaned;
    }
    default:
      return value.trim();
  }
}

/**
 * Detects PII entities in plain text, validates candidates, and resolves any overlaps.
 * Guaranteed to return non-overlapping entities sorted by start position.
 */
export function detectPII(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const candidates = [];

  for (const { type, regex, validate } of PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    let match;

    while ((match = re.exec(text)) !== null) {
      const rawValue = match[0];
      const start = match.index;
      const end = start + rawValue.length;

      // Guard against IP/decimal dot boundaries around phone, card, or Aadhaar candidates
      const dotBeforeDigit = start >= 2 && text[start - 1] === '.' && /\d/.test(text[start - 2]);
      const dotAfterDigit = text[end] === '.' && /\d/.test(text[end + 1] || '');
      if (
        (type === PII_TYPES.PHONE || type === PII_TYPES.CREDIT_CARD || type === PII_TYPES.AADHAAR) &&
        (dotBeforeDigit || dotAfterDigit)
      ) {
        continue;
      }

      const result = validate(rawValue, text, start, end);
      if (!result.valid) {
        continue;
      }

      const meta = PII_META[type];
      candidates.push({
        type,
        category: meta.label,
        value: rawValue,
        normalizedValue: normalizeEntityValue(type, rawValue),
        start,
        end,
        length: rawValue.length,
        priority: meta.priority,
        confidence: result.confidence || 'High',
        status: 'Detected',
      });
    }
  }

  // Sort by priority (lower is stronger), then longer span, then earlier occurrence
  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.length !== b.length) return b.length - a.length;
    return a.start - b.start;
  });

  const accepted = [];
  for (const candidate of candidates) {
    const overlaps = accepted.some(
      (existing) => candidate.start < existing.end && candidate.end > existing.start
    );
    if (!overlaps) {
      accepted.push(candidate);
    }
  }

  accepted.sort((a, b) => a.start - b.start);

  return accepted.map((entity, index) => ({
    ...entity,
    id: `pii_${index + 1}`,
  }));
}
