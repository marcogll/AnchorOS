/**
 * @description Business hours utilities for managing location operating schedules
 * @audit BUSINESS RULE: Business hours stored in JSONB format with day keys (sunday-saturday)
 * @audit PERFORMANCE: All functions use O(1) lookups and O(n) iteration (max 7 days)
 */

import type { BusinessHours, DayHours } from '@/lib/db/types'

/** Array of day names in lowercase for consistent key access */
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
/** Type representing valid day of week values */
type DayOfWeek = typeof DAYS[number]

/**
 * @description Converts a Date object to its corresponding day of week string
 * @param {Date} date - The date to extract day of week from
 * @returns {DayOfWeek} - Lowercase day name (e.g., 'monday', 'tuesday')
 * @example getDayOfWeek(new Date('2026-01-21')) // returns 'wednesday'
 * @audit PERFORMANCE: Uses native getDay() method for O(1) conversion
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  return DAYS[date.getDay()]
}

export function isOpenNow(businessHours: BusinessHours, date = new Date): boolean {
  /**
   * @description Checks if the business is currently open based on business hours configuration
   * @param {BusinessHours} businessHours - JSON object with day-by-day operating hours
   * @param {Date} date - Optional date to check (defaults to current time)
   * @returns {boolean} - True if business is open, false if closed
   * @example isOpenNow({ monday: { open: '10:00', close: '19:00', is_closed: false } }, new Date())
   * @audit BUSINESS RULE: Compares current time against open/close times in HH:MM format
   * @audit Validate: Returns false immediately if day is marked as is_closed
   */
  const day = getDayOfWeek(date)
  const hours = businessHours[day]

  if (!hours || hours.is_closed) {
    return false
  }

  const now = date
  const [openHour, openMinute] = hours.open.split(':').map(Number)
  const [closeHour, closeMinute] = hours.close.split(':').map(Number)

  const openTime = new Date(now)
  openTime.setHours(openHour, openMinute, 0, 0)

  const closeTime = new Date(now)
  closeTime.setHours(closeHour, closeMinute, 0, 0)

  return now >= openTime && now < closeTime
}

export function getNextOpenTime(businessHours: BusinessHours, from = new Date): Date | null {
  /**
   * @description Finds the next opening time within the next 7 days
   * @param {BusinessHours} businessHours - JSON object with day-by-day operating hours
   * @param {Date} from - Reference date to search from (defaults to current time)
   * @returns {Date | null} - Next opening DateTime or null if no opening found within 7 days
   * @example getNextOpenTime({ monday: { open: '10:00', close: '19:00' }, sunday: { is_closed: true } })
   * @audit BUSINESS RULE: Scans up to 7 days ahead to find next available opening
   * @audit PERFORMANCE: O(7) iteration worst case, exits early when found
   */
  const checkDate = new Date(from)

  for (let i = 0; i < 7; i++) {
    const day = getDayOfWeek(checkDate)
    const hours = businessHours[day]

    if (hours && !hours.is_closed) {
      const [openHour, openMinute] = hours.open.split(':').map(Number)

      const openTime = new Date(checkDate)
      openTime.setHours(openHour, openMinute, 0, 0)

      if (openTime > from) {
        return openTime
      }

      openTime.setDate(openTime.getDate() + 1)
      return openTime
    }

    checkDate.setDate(checkDate.getDate() + 1)
  }

  return null
}

export function isTimeWithinHours(time: string, dayHours: DayHours): boolean {
  /**
   * @description Validates if a given time falls within operating hours for a specific day
   * @param {string} time - Time in HH:MM format (e.g., '14:30')
   * @param {DayHours} dayHours - Operating hours for a single day with open, close, and is_closed
   * @returns {boolean} - True if time is within operating hours, false otherwise
   * @example isTimeWithinHours('14:30', { open: '10:00', close: '19:00', is_closed: false }) // true
   * @audit BUSINESS RULE: Converts times to minutes for accurate comparison
   * @audit Validate: Returns false immediately if dayHours.is_closed is true
   */
  if (dayHours.is_closed) {
    return false
  }

  const [hour, minute] = time.split(':').map(Number)
  const checkMinutes = hour * 60 + minute

  const [openHour, openMinute] = dayHours.open.split(':').map(Number)
  const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)
  const openMinutes = openHour * 60 + openMinute
  const closeMinutes = closeHour * 60 + closeMinute

  return checkMinutes >= openMinutes && checkMinutes < closeMinutes
}

export function getBusinessHoursString(dayHours: DayHours): string {
  /**
   * @description Formats day hours for display in UI
   * @param {DayHours} dayHours - Operating hours for a single day
   * @returns {string} - Formatted string (e.g., '10:00 - 19:00' or 'Cerrado')
   * @example getBusinessHoursString({ open: '10:00', close: '19:00', is_closed: false }) // '10:00 - 19:00'
   * @audit BUSINESS RULE: Returns 'Cerrado' (Spanish for closed) when is_closed is true
   */
  if (dayHours.is_closed) {
    return 'Cerrado'
  }
  return `${dayHours.open} - ${dayHours.close}`
}

export function getTodayHours(businessHours: BusinessHours): string {
  /**
   * @description Gets formatted operating hours for the current day
   * @param {BusinessHours} businessHours - JSON object with day-by-day operating hours
   * @returns {string} - Formatted hours string for today (e.g., '10:00 - 19:00' or 'Cerrado')
   * @example getTodayHours(businessHoursConfig) // Returns hours for current day of week
   * @audit PERFORMANCE: Single lookup using getDayOfWeek on current date
   */
  const day = getDayOfWeek(new Date())
  return getBusinessHoursString(businessHours[day])
}
