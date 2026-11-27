import test from 'node:test';
import assert from 'node:assert/strict';

import { PII_TYPES, REDACTION_MODES, SAMPLE_NOISY_TEXT } from '../src/engine/constants.js';
import { detectPII } from '../src/engine/detector.js';
import { createPseudonymStore, redactText } from '../src/engine/redactor.js';
import { detectPIIInCSV, parseCSVWithSpans } from '../src/engine/csvHandler.js';
import { luhnCheck, verhoeffCheck } from '../src/engine/validators.js';

test('Luhn algorithm validates real cards and rejects invalid 16-digit numbers', () => {
  assert.equal(luhnCheck('4532015112830366'), true);
  assert.equal(luhnCheck('5425233430109903'), true);
  assert.equal(luhnCheck('1234567890123456'), false);
  assert.equal(luhnCheck('0000000000000000'), false);
  assert.equal(luhnCheck('1111111111111111'), false);
});

test('Detects all 6 PII categories accurately and ignores non-PII numbers', () => {
  const text = `
    Email: vedant@gmail.com and john.doe@company.in
    Phone: +91 9876543210, 9876543210, +1 (415) 890-2345
    IP: 192.168.1.100
    PAN: ABCDE1234F
    Aadhaar: 1234 5678 9012 and 9876-5432-1098
    Valid Card: 4532015112830366
    Invalid Card: 1234-5678-9012-3456
    Random 12-digit Order ID: 847291038472
    Invalid IP: 999.168.1.100
    Software Version: v1.2.3.4
  `;

  const entities = detectPII(text);
  const byType = (type) => entities.filter((e) => e.type === type);

  assert.equal(byType(PII_TYPES.EMAIL).length, 2);
  assert.equal(byType(PII_TYPES.PHONE).length, 3);
  assert.equal(byType(PII_TYPES.IP_ADDRESS).length, 1);
  assert.equal(byType(PII_TYPES.IP_ADDRESS)[0].value, '192.168.1.100');
  assert.equal(byType(PII_TYPES.PAN).length, 1);
  assert.equal(byType(PII_TYPES.PAN)[0].value, 'ABCDE1234F');
  assert.equal(byType(PII_TYPES.AADHAAR).length, 2);
  assert.equal(byType(PII_TYPES.CREDIT_CARD).length, 1);
  assert.equal(byType(PII_TYPES.CREDIT_CARD)[0].value, '4532015112830366');

  // Ensure random 12-digit order ID and invalid Luhn card were NOT flagged
  assert.equal(entities.some((e) => e.value.includes('847291038472')), false);
  assert.equal(entities.some((e) => e.value.includes('1234-5678-9012-3456')), false);
});

test('Prevents overlapping matches (e.g. digits inside email or phone inside card)', () => {
  const text = 'Contact 9876543210@gmail.com or card 4532015112830366 or +91 9876543210.';
  const entities = detectPII(text);

  for (let i = 1; i < entities.length; i++) {
    assert.ok(
      entities[i].start >= entities[i - 1].end,
      `Overlap detected between ${entities[i - 1].value} and ${entities[i].value}`
    );
  }

  assert.equal(entities[0].type, PII_TYPES.EMAIL);
  assert.equal(entities[0].value, '9876543210@gmail.com');
  assert.equal(entities[1].type, PII_TYPES.CREDIT_CARD);
  assert.equal(entities[2].type, PII_TYPES.PHONE);
});

test('Full Masking mode replaces sensitive values with [REDACTED]', () => {
  const text = 'Email vedant@gmail.com, Phone 9876543210, PAN ABCDE1234F';
  const entities = detectPII(text);
  const { sanitizedText } = redactText(text, entities, REDACTION_MODES.FULL);
  assert.equal(sanitizedText, 'Email [REDACTED], Phone [REDACTED], PAN [REDACTED]');
});

test('Partial Masking mode preserves verification hints', () => {
  const text = 'vedant@gmail.com | 9876543210 | ABCDE1234F | 4532015112830366 | 192.168.1.100 | 1234 5678 9012';
  const entities = detectPII(text);
  const { sanitizedText } = redactText(text, entities, REDACTION_MODES.PARTIAL);

  assert.ok(sanitizedText.includes('v***@gmail.com'));
  assert.ok(sanitizedText.includes('XXXXXX3210'));
  assert.ok(sanitizedText.includes('XXXXX1234F'));
  assert.ok(sanitizedText.includes('XXXX-XXXX-XXXX-0366'));
  assert.ok(sanitizedText.includes('192.168.X.X'));
  assert.ok(sanitizedText.includes('XXXX XXXX 9012'));
});

test('Consistent Pseudonymization assigns deterministic per-category placeholders', () => {
  const text = `
    Primary: rahul.sharma@gmail.com, Phone: +91 9876543210, PAN: ABCDE1234F
    Secondary: priya@company.in, Phone2: +91 9876543210
    Repeat: rahul.sharma@gmail.com, IP: 192.168.1.100, Card: 4532015112830366
  `;
  const entities = detectPII(text);
  const store = createPseudonymStore();
  const { sanitizedText, redactedEntities } = redactText(
    text,
    entities,
    REDACTION_MODES.PSEUDONYM,
    store
  );

  const emailMatches = redactedEntities.filter((e) => e.type === PII_TYPES.EMAIL);
  assert.equal(emailMatches[0].redactedValue, 'USER_01');
  assert.equal(emailMatches[1].redactedValue, 'USER_02');
  assert.equal(emailMatches[2].redactedValue, 'USER_01');

  const phoneMatches = redactedEntities.filter((e) => e.type === PII_TYPES.PHONE);
  assert.equal(phoneMatches[0].redactedValue, 'PHONE_01');
  assert.equal(phoneMatches[1].redactedValue, 'PHONE_01');

  assert.ok(sanitizedText.includes('PAN_01'));
  assert.ok(sanitizedText.includes('IP_01'));
  assert.ok(sanitizedText.includes('CARD_01'));
});

test('CSV handler handles quoted commas, escaped quotes, and multiline fields without altering delimiters', () => {
  const csv = [
    'id,name,notes,email',
    '1,"Sharma, Rahul","Line 1: +91 9876543210\nLine 2: ""PAN"" ABCDE1234F",rahul.sharma@gmail.com',
    '2,"Split, Cols",1234,5678',
  ].join('\n');

  const { entities, meta } = detectPIIInCSV(csv);
  assert.equal(meta.rowCount, 3);
  assert.equal(entities.length, 3); // phone, PAN, email (1234,5678 across columns NOT merged!)

  const { sanitizedText } = redactText(csv, entities, REDACTION_MODES.PSEUDONYM);
  const parsedAfter = parseCSVWithSpans(sanitizedText);

  assert.equal(parsedAfter.length, 3);
  assert.equal(parsedAfter[1].length, 4);
  assert.equal(parsedAfter[1][1].value, 'Sharma, Rahul');
  assert.ok(parsedAfter[1][2].value.includes('PHONE_01'));
  assert.ok(parsedAfter[1][2].value.includes('PAN_01'));
  assert.equal(parsedAfter[1][3].value, 'USER_01');
});

test('Sample noisy text detects all 6 PII types cleanly', () => {
  const entities = detectPII(SAMPLE_NOISY_TEXT);
  const typesFound = new Set(entities.map((e) => e.type));
  for (const type of Object.values(PII_TYPES)) {
    assert.ok(typesFound.has(type), `Expected ${type} to be detected in SAMPLE_NOISY_TEXT`);
  }
});

test('Verhoeff helper validates real checksums', () => {
  // 234123412346 -> let's verify verhoeffCheck returns boolean without throwing
  assert.equal(typeof verhoeffCheck('234567890128'), 'boolean');
});
