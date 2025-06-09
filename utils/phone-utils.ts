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

  // First convert to E.164 to normalize
  const e164 = toE164Format(phoneNumber)

  // Remove the plus
  const digits = e164.substring(1)

  // Format for US numbers
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`
  }

  // Default formatting for other numbers
  return e164
}
