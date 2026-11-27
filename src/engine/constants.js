export const PII_TYPES = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  IP_ADDRESS: 'IP_ADDRESS',
  PAN: 'PAN',
  AADHAAR: 'AADHAAR',
  CREDIT_CARD: 'CREDIT_CARD',
};

export const PII_META = {
  [PII_TYPES.EMAIL]: {
    type: PII_TYPES.EMAIL,
    label: 'Email Address',
    shortLabel: 'Email',
    prefix: 'USER',
    priority: 1,
    colorName: 'Blue',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
    highlightClass: 'bg-blue-100 text-blue-950 border-b-2 border-blue-600',
    dotClass: 'bg-blue-600',
    statAccent: 'bg-white border-blue-200 border-l-4 border-l-blue-600 text-blue-700',
  },
  [PII_TYPES.PHONE]: {
    type: PII_TYPES.PHONE,
    label: 'Phone Number',
    shortLabel: 'Phone',
    prefix: 'PHONE',
    priority: 6,
    colorName: 'Purple',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    highlightClass: 'bg-purple-100 text-purple-950 border-b-2 border-purple-600',
    dotClass: 'bg-purple-600',
    statAccent: 'bg-white border-purple-200 border-l-4 border-l-purple-600 text-purple-700',
  },
  [PII_TYPES.IP_ADDRESS]: {
    type: PII_TYPES.IP_ADDRESS,
    label: 'IP Address',
    shortLabel: 'IP Address',
    prefix: 'IP',
    priority: 4,
    colorName: 'Orange',
    badgeClass: 'bg-orange-50 text-orange-900 border-orange-300',
    highlightClass: 'bg-orange-100 text-orange-950 border-b-2 border-orange-600',
    dotClass: 'bg-orange-600',
    statAccent: 'bg-white border-orange-200 border-l-4 border-l-orange-600 text-orange-700',
  },
  [PII_TYPES.PAN]: {
    type: PII_TYPES.PAN,
    label: 'Indian PAN',
    shortLabel: 'PAN',
    prefix: 'PAN',
    priority: 5,
    colorName: 'Red',
    badgeClass: 'bg-red-50 text-red-800 border-red-300',
    highlightClass: 'bg-red-100 text-red-950 border-b-2 border-red-600',
    dotClass: 'bg-red-600',
    statAccent: 'bg-white border-red-200 border-l-4 border-l-red-600 text-red-700',
  },
  [PII_TYPES.AADHAAR]: {
    type: PII_TYPES.AADHAAR,
    label: 'Aadhaar Number',
    shortLabel: 'Aadhaar',
    prefix: 'AADHAAR',
    priority: 3,
    colorName: 'Yellow',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-400',
    highlightClass: 'bg-amber-100 text-amber-950 border-b-2 border-amber-500',
    dotClass: 'bg-amber-500',
    statAccent: 'bg-white border-amber-200 border-l-4 border-l-amber-500 text-amber-700',
  },
  [PII_TYPES.CREDIT_CARD]: {
    type: PII_TYPES.CREDIT_CARD,
    label: 'Credit Card',
    shortLabel: 'Credit Card',
    prefix: 'CARD',
    priority: 2,
    colorName: 'Pink',
    badgeClass: 'bg-pink-50 text-pink-800 border-pink-300',
    highlightClass: 'bg-pink-100 text-pink-950 border-b-2 border-pink-600',
    dotClass: 'bg-pink-600',
    statAccent: 'bg-white border-pink-200 border-l-4 border-l-pink-600 text-pink-700',
  },
};

export const REDACTION_MODES = {
  FULL: 'full',
  PARTIAL: 'partial',
  PSEUDONYM: 'pseudonym',
};

export const REDACTION_MODE_OPTIONS = [
  {
    id: REDACTION_MODES.FULL,
    title: 'Full Mask',
    subtitle: 'Maximum Privacy',
    description: 'Replaces the entire sensitive value with a uniform [REDACTED] token.',
    example: 'vedant@gmail.com → [REDACTED]',
  },
  {
    id: REDACTION_MODES.PARTIAL,
    title: 'Partial Mask',
    subtitle: 'Verification Friendly',
    description: 'Masks sensitive characters while keeping minimal non-critical hints.',
    example: 'vedant@gmail.com → v***@gmail.com',
  },
  {
    id: REDACTION_MODES.PSEUDONYM,
    title: 'Consistent Pseudonymization',
    subtitle: 'Referential Integrity',
    description: 'Assigns deterministic, category-prefixed IDs using an in-memory map.',
    example: 'vedant@gmail.com → USER_01',
  },
];

export const SAMPLE_NOISY_TEXT = `=== CUSTOMER SUPPORT & KYC EXPORT (INTERNAL) ===
Ticket ID: INC-2026-88412 | Timestamp: 2026-11-27T09:42:15Z
Order Ref: 847291038472 (Internal Non-PII 12-Digit Batch ID)
Test Card Rejected (Non-Luhn): 1234-5678-9012-3456

Customer Name: Rahul Sharma
Email: rahul.sharma@gmail.com
Backup Contact Email: rahul.sharma@gmail.com
Phone: +91 9876543210
Alternate Mobile: 9876543210
PAN: ABCDE1234F
Aadhaar: 1234 5678 9012
Client IP Address: 192.168.1.100
Credit Card: 4532015112830366

--- Secondary Escalation Record ---
Agent Lead: Priya Nair (priya.nair@company.in)
International Contact: +1 (415) 890-2345
Secondary Phone Repeated: +91 9876543210
Gateway Node IP: 10.24.188.42
Verified PAN: BNZPM2501F
Aadhaar (Hyphenated): 9876-5432-1098
Corporate Card (Spaced): 5425 2334 3010 9903

Notes: Customer rahul.sharma@gmail.com requested callback on +91 9876543210 from IP 192.168.1.100.`;
