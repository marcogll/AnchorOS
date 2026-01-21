import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * @description Utility function that merges and deduplicates CSS class names using clsx and tailwind-merge
 * @param {ClassValue[]} inputs - Array of class name values (strings, objects, arrays, or falsy values)
 * @returns {string} - Merged CSS class string with Tailwind class conflicts resolved
 * @example cn('px-4 py-2', { 'bg-blue-500': true }, ['text-white', 'font-bold'])
 * @audit BUSINESS RULE: Resolves Tailwind CSS class conflicts by letting later classes override earlier ones
 * @audit PERFORMANCE: Optimized for frequent use in component className props
 * @audit Validate: Handles all clsx input types (strings, objects, arrays, nested objects)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
