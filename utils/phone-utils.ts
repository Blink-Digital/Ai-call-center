/**
 * Formats a phone number to E.164 format (+19787836427)
 * Removes all non-digit characters and ensures it starts with +
 */
export function toE164Format(phoneNumber: string): string {
  if (!phoneNumber) return ""

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "")

  // If the number starts with a country code (e.g., 1 for US)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`
  }

  // If the number is 10 digits (US without country code)
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // If it already has a plus sign
  if (phoneNumber.startsWith("+")) {
    return `+${digits}`
  }

  // Default case - just add a plus
  return `+${digits}`
}

/**
 * Formats a phone number for display: +1 (978) 783-6427
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return ""

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "")

  // Handle different lengths
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    // US number with country code: 19787836427 -> +1 (978) 783-6427
    const areaCode = cleaned.slice(1, 4)
    const exchange = cleaned.slice(4, 7)
    const number = cleaned.slice(7)
    return `+1 (${areaCode}) ${exchange}-${number}`
  } else if (cleaned.length === 10) {
    // US number without country code: 9787836427 -> (978) 783-6427
    const areaCode = cleaned.slice(0, 3)
    const exchange = cleaned.slice(3, 6)
    const number = cleaned.slice(6)
    return `(${areaCode}) ${exchange}-${number}`
  }

  // Return as-is if we can't format it
  return phoneNumber
}

/**
 * Normalizes phone number to digits only for database queries and URL encoding
 * Example: "+1 (978) 783-6427" → "19787836427"
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return ""

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "")

  // Add country code if missing (assume US)
  if (cleaned.length === 10) {
    return `1${cleaned}`
  }

  return cleaned
}

export function encodePhoneForUrl(phoneNumber: string): string {
  // Normalize to digits only, then encode
  const normalized = normalizePhoneNumber(phoneNumber)
  return encodeURIComponent(normalized)
}

export function decodePhoneFromUrl(encodedPhone: string): string {
  // Decode and return normalized phone number
  return decodeURIComponent(encodedPhone)
}
