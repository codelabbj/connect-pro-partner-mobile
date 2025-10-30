import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number string with spaces as thousands separators
 * @param amount - The amount as a string (e.g., "10000", "100000")
 * @returns Formatted amount with spaces (e.g., "10 000", "100 000")
 */
export function formatAmount(amount: string): string {
  // Remove any existing spaces and non-numeric characters except decimal point
  const cleanAmount = amount.replace(/[^\d.]/g, '')
  
  // Split by decimal point if exists
  const parts = cleanAmount.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  
  // Add spaces every 3 digits from the right
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  
  // Combine integer and decimal parts
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger
}

/**
 * Convert a typical API error response body into a readable message.
 * Handles shapes like:
 * - { detail: "..." }
 * - { password: ["Mot de passe incorrect."] }
 * - { non_field_errors: ["..."] }
 * - arrays of strings
 */
export function formatApiErrorMessage(errorBody: unknown): string {
  try {
    if (typeof errorBody === 'string') {
      // It could be a JSON-stringified object or a plain message
      try {
        const parsed = JSON.parse(errorBody)
        return formatApiErrorMessage(parsed)
      } catch {
        return errorBody
      }
    }

    if (errorBody && typeof errorBody === 'object') {
      const body = errorBody as Record<string, any>

      if (typeof body.detail === 'string') {
        return body.detail
      }

      // If any field contains array of strings, flatten first messages
      const messages: string[] = []
      for (const [key, value] of Object.entries(body)) {
        if (Array.isArray(value)) {
          // pick first non-empty string
          const first = value.find(v => typeof v === 'string' && v.trim().length > 0)
          if (first) {
            // Hide technical keys like non_field_errors
            if (key === 'non_field_errors' || key === 'detail') {
              messages.push(first)
            } else {
              messages.push(`${key}: ${first}`)
            }
          }
        } else if (typeof value === 'string') {
          messages.push(key === 'non_field_errors' ? value : `${key}: ${value}`)
        }
      }

      if (messages.length > 0) {
        return messages.join('\n')
      }
    }
  } catch {
    // fallthrough to default
  }

  return 'An unexpected error occurred.'
}