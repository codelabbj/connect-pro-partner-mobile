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
