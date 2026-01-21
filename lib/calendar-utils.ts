/**
 * Calendar utilities for drag & drop operations
 * Handles staff service validation, conflict checking, and booking rescheduling
 */

export const checkStaffCanPerformService = async (staffId: string, serviceId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/aperture/staff/${staffId}/services`);
    const data = await response.json();
    return data.success && data.services.some((s: any) => s.services?.id === serviceId);
  } catch (error) {
    console.error('Error checking staff services:', error);
    return false;
  }
};

export const checkForConflicts = async (bookingId: string, staffId: string, startTime: string, duration: number): Promise<boolean> => {
  try {
    const endTime = new Date(new Date(startTime).getTime() + duration * 60 * 1000).toISOString();

    // Check staff availability
    const response = await fetch('/api/aperture/staff-unavailable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_id: staffId, start_time: startTime, end_time: endTime, exclude_booking_id: bookingId })
    });

    const data = await response.json();
    return !data.available; // If not available, there's a conflict
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return true; // Assume conflict on error
  }
};

export const rescheduleBooking = async (bookingId: string, updates: any) => {
  try {
    const response = await fetch(`/api/aperture/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    return await response.json();
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    return { success: false, error: 'Network error' };
  }
};