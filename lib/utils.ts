import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats an amount using French grouping and a narrow no-break space (U+202F)
 * as thousands separator (e.g., "1 234 567").
 *
 * Accepts strings or numbers. For string inputs, we try to preserve decimal
 * precision (up to 6 decimals) unless overridden via options.
 */
export function formatAmount(
  amount: string | number,
  options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
): string {
  if (amount === null || amount === undefined) return "0"

  const raw = typeof amount === "number" ? String(amount) : String(amount)

  // Keep digits, sign, dot/comma (we normalize comma to dot for parsing).
  const cleaned = raw
    .trim()
    .replace(/\u202F/g, "") // narrow no-break spaces
    .replace(/\u00A0/g, "") // no-break spaces
    .replace(/ /g, "") // regular spaces
    .replace(",", ".")
    .replace(/[^\d.+-]/g, "")

  const num = Number.parseFloat(cleaned)
  if (!Number.isFinite(num)) return "0"

  // Default: keep integer amounts for money; for string with decimals, preserve
  // up to 6 digits unless overridden.
  const inferredFractionDigits =
    options?.maximumFractionDigits !== undefined || options?.minimumFractionDigits !== undefined
      ? undefined
      : (() => {
          const dot = cleaned.indexOf(".")
          if (dot === -1) return 0
          const decimals = cleaned.slice(dot + 1).replace(/[^\d]/g, "")
          return Math.min(decimals.length, 6)
        })()

  const minimumFractionDigits =
    options?.minimumFractionDigits ?? (inferredFractionDigits ?? 0)
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? (inferredFractionDigits ?? 0)

  const formatted = new Intl.NumberFormat("fr-FR", {
    useGrouping: true,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num)

  // Ensure grouping uses narrow no-break spaces everywhere.
  return formatted.replace(/\u00A0/g, "\u202F").replace(/ /g, "\u202F")
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