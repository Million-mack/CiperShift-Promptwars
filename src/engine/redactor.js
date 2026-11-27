import { PII_META, PII_TYPES, REDACTION_MODES } from './constants.js';

/**
 * Creates a fresh in-memory pseudonym registry (never stored in browser storage).
 */
export function createPseudonymStore() {
  return {
    valueToAlias: new Map(),
    counters: new Map(),
  };
}

function getPseudonym(type, normalizedValue, store) {
  const mapKey = `${type}::${normalizedValue}`;
  if (store.valueToAlias.has(mapKey)) {
    return store.valueToAlias.get(mapKey);
  }

  const nextCount = (store.counters.get(type) || 0) + 1;
  store.counters.set(type, nextCount);

  const prefix = PII_META[type]?.prefix || 'PII';
  const padded = String(nextCount).padStart(2, '0');
  const alias = `${prefix}_${padded}`;
  store.valueToAlias.set(mapKey, alias);
  return alias;
}

function partialMaskEmail(value) {
  const atIdx = value.indexOf('@');
  if (atIdx <= 0) return '[REDACTED]';
  const local = value.slice(0, atIdx);
  const domain = value.slice(atIdx + 1);
  if (local.length === 1) {
    return `*@${domain}`;
  }
  return `${local[0]}***@${domain}`;
}

function partialMaskPhone(value) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length <= 4) return 'X'.repeat(digits.length);

  // Preserve explicit country code prefix like "+91 " when separated
  const ccMatch = trimmed.match(/^(\+\d{1,3}[\s-]+)(.+)$/);
  if (ccMatch) {
    const prefix = ccMatch[1];
    const restDigits = ccMatch[2].replace(/\D/g, '');
    if (restDigits.length > 4) {
      return `${prefix}${'X'.repeat(restDigits.length - 4)}${restDigits.slice(-4)}`;
    }
  }

  return `${'X'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

function partialMaskPAN(value) {
  if (value.length !== 10) return '[REDACTED]';
  return `XXXXX${value.slice(5)}`;
}

function partialMaskAadhaar(value) {
  let digitSeen = 0;
  const totalDigits = value.replace(/\D/g, '').length;
  const maskLimit = Math.max(0, totalDigits - 4);
  let out = '';

  for (const ch of value) {
    if (/\d/.test(ch)) {
      out += digitSeen < maskLimit ? 'X' : ch;
      digitSeen += 1;
    } else {
      out += ch;
    }
  }
  return out;
}

function partialMaskCreditCard(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8) return '[REDACTED]';
  const lastFour = digits.slice(-4);
  const maskedLen = digits.length - 4;
  const groups = [];
  for (let i = 0; i < maskedLen; i += 4) {
    groups.push('X'.repeat(Math.min(4, maskedLen - i)));
  }
  groups.push(lastFour);
  return groups.join('-');
}

function partialMaskIPv4(value) {
  const parts = value.split('.');
  if (parts.length !== 4) return '[REDACTED]';
  return `${parts[0]}.${parts[1]}.X.X`;
}

export function formatPartialMask(type, value) {
  switch (type) {
    case PII_TYPES.EMAIL:
      return partialMaskEmail(value);
    case PII_TYPES.PHONE:
      return partialMaskPhone(value);
    case PII_TYPES.PAN:
      return partialMaskPAN(value);
    case PII_TYPES.AADHAAR:
      return partialMaskAadhaar(value);
    case PII_TYPES.CREDIT_CARD:
      return partialMaskCreditCard(value);
    case PII_TYPES.IP_ADDRESS:
      return partialMaskIPv4(value);
    default:
      return '[REDACTED]';
  }
}

/**
 * Applies the selected redaction mode to detected entities and returns:
 * - sanitizedText
 * - redactedEntities (with redactedValue & original/sanitized spans for side-by-side highlights)
 * - pseudonymStore
 */
export function redactText(text, entities, mode, existingStore = null) {
  const store = existingStore || createPseudonymStore();
  if (!text || !entities || entities.length === 0) {
    return {
      sanitizedText: text || '',
      redactedEntities: [],
      pseudonymStore: store,
    };
  }

  const sorted = [...entities].sort((a, b) => a.start - b.start);
  let cursor = 0;
  let sanitizedText = '';
  const redactedEntities = [];

  for (const entity of sorted) {
    if (entity.start < cursor) {
      continue;
    }

    sanitizedText += text.slice(cursor, entity.start);

    let replacement;
    if (mode === REDACTION_MODES.FULL) {
      replacement = '[REDACTED]';
    } else if (mode === REDACTION_MODES.PARTIAL) {
      replacement = formatPartialMask(entity.type, entity.value);
    } else {
      replacement = getPseudonym(entity.type, entity.normalizedValue, store);
    }

    const sanitizedStart = sanitizedText.length;
    sanitizedText += replacement;
    const sanitizedEnd = sanitizedText.length;

    redactedEntities.push({
      ...entity,
      redactedValue: replacement,
      sanitizedStart,
      sanitizedEnd,
      status: 'Redacted',
    });

    cursor = entity.end;
  }

  sanitizedText += text.slice(cursor);

  return {
    sanitizedText,
    redactedEntities,
    pseudonymStore: store,
  };
}

/**
 * Masks an original value for privacy-safe display in the Audit Report table.
 */
export function maskForAuditPreview(type, value) {
  return formatPartialMask(type, value);
}
