/**
 * Normalize a Ugandan phone number to international format
 * Converts formats like:
 * - 0700000000 -> +256700000000
 * - 700000000 -> +256700000000
 * - +256700000000 -> +256700000000 (already formatted)
 * - 256700000000 -> +256700000000
 */
export const normalizeUgandanPhone = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '';
  }

  // Remove all spaces, dashes, and parentheses
  let cleaned = phoneNumber.trim().replace(/[\s\-()]/g, '');

  // If already starts with +256, return as is
  if (cleaned.startsWith('+256')) {
    return cleaned;
  }

  // If starts with 256, add the +
  if (cleaned.startsWith('256')) {
    return '+' + cleaned;
  }

  // If starts with 0 and looks like Ugandan mobile (0XXXXXXXXX - 10 digits total)
  if (/^0[7][0-9]{8}$/.test(cleaned)) {
    return '+256' + cleaned.slice(1);
  }

  // If it's 9 digits starting with 7 (missing the leading 0)
  if (/^[7][0-9]{8}$/.test(cleaned)) {
    return '+256' + cleaned;
  }

  // Return original if no pattern matches
  return phoneNumber;
};

/**
 * Validate if a phone number is a valid Ugandan mobile number
 */
export const isValidUgandanPhone = (phoneNumber) => {
  const normalized = normalizeUgandanPhone(phoneNumber);
  
  // Should be +256 followed by 9 digits starting with 7
  return /^\+256[7][0-9]{8}$/.test(normalized);
};

/**
 * Format phone number for display (with spaces for readability)
 */
export const formatPhoneForDisplay = (phoneNumber) => {
  const normalized = normalizeUgandanPhone(phoneNumber);
  
  if (normalized.startsWith('+256')) {
    const digits = normalized.slice(4); // Remove +256
    return `+256 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  
  return phoneNumber;
};
