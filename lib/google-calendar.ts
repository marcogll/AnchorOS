import { google, calendar_v3 } from 'googleapis';

interface ServiceAccountConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * @description Google Calendar service for bidirectional sync with staff calendars
 * @class GoogleCalendarService
 * 
 * This service manages:
 * - Authentication via Google Service Account
 * - Booking synchronization to Google Calendar
 * - Google Calendar event import
 * - Conflict detection and resolution
 */
class GoogleCalendarService {
  private calendarClient: calendar_v3.Calendar | null = null;
  private serviceAccountConfig: ServiceAccountConfig | null = null;
  private calendarId: string;

  constructor() {
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    this.initializeService();
  }

  /**
   * @description Initialize Google Calendar service with service account authentication
   * @throws {Error} If service account configuration is missing or invalid
   */
  private initializeService(): void {
    try {
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      
      if (!serviceAccountJson) {
        console.warn('GoogleCalendar: Service account not configured. Calendar sync disabled.');
        return;
      }

      const credentials = JSON.parse(serviceAccountJson) as ServiceAccountConfig;

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
      });

      this.serviceAccountConfig = credentials;

      this.calendarClient = google.calendar({ version: 'v3', auth });
      
      console.log('GoogleCalendar: Service initialized successfully');
    } catch (error) {
      console.error('GoogleCalendar: Initialization failed', error);
      throw error;
    }
  }

  /**
   * @description Check if Google Calendar service is properly configured and ready
   * @returns {boolean} - true if service is ready, false otherwise
   */
  isReady(): boolean {
    return this.calendarClient !== null && this.serviceAccountConfig !== null;
  }

  /**
   * @description Create a Google Calendar event from a booking
   * @param {Object} bookingData - Booking information
   * @param {string} bookingData.id - Booking UUID
   * @param {string} bookingData.shortId - Booking short ID (6 chars)
   * @param {string} bookingData.customerName - Customer name
   * @param {string} bookingData.staffName - Staff name
   * @param {string} bookingData.serviceName - Service name
   * @param {Date} bookingData.startTime - Booking start time (UTC)
   * @param {Date} bookingData.endTime - Booking end time (UTC)
   * @param {string} bookingData.locationName - Location name
   * @returns {Promise<string|null>} - Google Calendar event ID or null if failed
   */
  async createBookingEvent(bookingData: {
    id: string;
    shortId: string;
    customerName: string;
    staffName: string;
    serviceName: string;
    startTime: Date;
    endTime: Date;
    locationName: string;
  }): Promise<string | null> {
    if (!this.isReady()) {
      console.warn('GoogleCalendar: Service not ready, skipping event creation');
      return null;
    }

    try {
      const event: calendar_v3.Schema$Event = {
        summary: `[${bookingData.shortId}] ${bookingData.serviceName} - ${bookingData.customerName}`,
        description: this.buildEventDescription(bookingData),
        start: {
          dateTime: bookingData.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: bookingData.endTime.toISOString(),
          timeZone: 'UTC',
        },
        location: bookingData.locationName,
        extendedProperties: {
          private: {
            booking_id: bookingData.id,
            short_id: bookingData.shortId,
            is_anchoros_booking: 'true',
          },
        },
        colorId: '1', // Blue color for standard bookings
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 }, // 24 hours before
            { method: 'popup', minutes: 60 },  // 1 hour before
          ],
        },
      };

      const response = await this.calendarClient!.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
      });

      console.log(`GoogleCalendar: Created event ${response.data.id} for booking ${bookingData.shortId}`);
      return response.data.id || null;
    } catch (error: any) {
      console.error(`GoogleCalendar: Failed to create event for booking ${bookingData.shortId}`, error);
      return null;
    }
  }

  /**
   * @description Update an existing Google Calendar event
   * @param {string} googleEventId - Google Calendar event ID
   * @param {Object} bookingData - Updated booking information
   * @returns {Promise<boolean>} - true if update successful, false otherwise
   */
  async updateBookingEvent(
    googleEventId: string,
    bookingData: {
      shortId: string;
      customerName: string;
      staffName: string;
      serviceName: string;
      startTime: Date;
      endTime: Date;
      locationName: string;
    }
  ): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('GoogleCalendar: Service not ready, skipping event update');
      return false;
    }

    try {
      const event: calendar_v3.Schema$Event = {
        summary: `[${bookingData.shortId}] ${bookingData.serviceName} - ${bookingData.customerName}`,
        description: this.buildEventDescription(bookingData),
        start: {
          dateTime: bookingData.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: bookingData.endTime.toISOString(),
          timeZone: 'UTC',
        },
        location: bookingData.locationName,
      };

      await this.calendarClient!.events.update({
        calendarId: this.calendarId,
        eventId: googleEventId,
        requestBody: event,
      });

      console.log(`GoogleCalendar: Updated event ${googleEventId} for booking ${bookingData.shortId}`);
      return true;
    } catch (error: any) {
      console.error(`GoogleCalendar: Failed to update event ${googleEventId}`, error);
      return false;
    }
  }

  /**
   * @description Delete a Google Calendar event
   * @param {string} googleEventId - Google Calendar event ID
   * @param {string} shortId - Booking short ID for logging
   * @returns {Promise<boolean>} - true if deletion successful, false otherwise
   */
  async deleteBookingEvent(googleEventId: string, shortId: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('GoogleCalendar: Service not ready, skipping event deletion');
      return false;
    }

    try {
      await this.calendarClient!.events.delete({
        calendarId: this.calendarId,
        eventId: googleEventId,
      });

      console.log(`GoogleCalendar: Deleted event ${googleEventId} for booking ${shortId}`);
      return true;
    } catch (error: any) {
      if (error.code === 404) {
        console.warn(`GoogleCalendar: Event ${googleEventId} not found, already deleted`);
        return true;
      }
      console.error(`GoogleCalendar: Failed to delete event ${googleEventId}`, error);
      return false;
    }
  }

  /**
   * @description Fetch all blocking events from Google Calendar for a time range
   * @param {Date} startTime - Start of time range (UTC)
   * @param {Date} endTime - End of time range (UTC)
   * @returns {Promise<Array<{id: string, start: Date, end: Date, summary: string}>>} - Array of blocking events
   */
  async getBlockingEvents(startTime: Date, endTime: Date): Promise<Array<{
    id: string;
    start: Date;
    end: Date;
    summary: string;
    isAnchorOsBooking: boolean;
    bookingId?: string;
  }>> {
    if (!this.isReady()) {
      console.warn('GoogleCalendar: Service not ready, returning empty events list');
      return [];
    }

    try {
      const response = await this.calendarClient!.events.list({
        calendarId: this.calendarId,
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      return events.map(event => ({
        id: event.id || '',
        start: new Date(event.start?.dateTime || event.start?.date || ''),
        end: new Date(event.end?.dateTime || event.end?.date || ''),
        summary: event.summary || '',
        isAnchorOsBooking: event.extendedProperties?.private?.is_anchoros_booking === 'true',
        bookingId: event.extendedProperties?.private?.booking_id,
      }));
    } catch (error: any) {
      console.error('GoogleCalendar: Failed to fetch blocking events', error);
      return [];
    }
  }

  /**
   * @description Sync a booking from AnchorOS to Google Calendar
   * @param {Object} booking - Full booking object
   * @param {string} action - Action type: 'create', 'update', 'delete'
   * @returns {Promise<string|null>} - Google Calendar event ID or null
   */
  async syncBooking(
    booking: {
      id: string;
      short_id: string;
      google_calendar_event_id?: string;
      customer: { first_name: string; last_name: string };
      staff: { display_name: string };
      service: { name: string };
      start_time_utc: Date;
      end_time_utc: Date;
      location: { name: string };
    },
    action: 'create' | 'update' | 'delete'
  ): Promise<string | null> {
    if (!this.isReady()) {
      console.warn('GoogleCalendar: Service not ready, skipping booking sync');
      return null;
    }

    try {
      const bookingData = {
        id: booking.id,
        shortId: booking.short_id,
        customerName: `${booking.customer.first_name} ${booking.customer.last_name}`,
        staffName: booking.staff.display_name,
        serviceName: booking.service.name,
        startTime: booking.start_time_utc,
        endTime: booking.end_time_utc,
        locationName: booking.location.name,
      };

      switch (action) {
        case 'create':
          return await this.createBookingEvent(bookingData);

        case 'update':
          if (booking.google_calendar_event_id) {
            await this.updateBookingEvent(booking.google_calendar_event_id, bookingData);
            return booking.google_calendar_event_id;
          }
          return await this.createBookingEvent(bookingData);

        case 'delete':
          if (booking.google_calendar_event_id) {
            await this.deleteBookingEvent(booking.google_calendar_event_id, booking.short_id);
          }
          return null;

        default:
          console.warn(`GoogleCalendar: Unknown action ${action}`);
          return null;
      }
    } catch (error: any) {
      console.error(`GoogleCalendar: Failed to sync booking ${booking.short_id}`, error);
      return null;
    }
  }

  /**
   * @description Build detailed event description for Google Calendar
   * @param {Object} bookingData - Booking information
   * @returns {string} - Formatted event description
   */
  private buildEventDescription(bookingData: {
    shortId: string;
    customerName: string;
    staffName: string;
    serviceName: string;
  }): string {
    return `📋 AnchorOS Booking Details

🎯 Booking ID: ${bookingData.shortId}
👤 Customer: ${bookingData.customerName}
👨‍🎨 Artist: ${bookingData.staffName}
💅 Service: ${bookingData.serviceName}

⏰ Times shown in UTC

Manage this booking in AnchorOS Dashboard.`;
  }

  /**
   * @description Test connection to Google Calendar API
   * @returns {Promise<{success: boolean, message: string}>} - Test result
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isReady()) {
      return {
        success: false,
        message: 'Google Calendar service not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_CALENDAR_ID.',
      };
    }

    try {
      const response = await this.calendarClient!.calendarList.list();
      return {
        success: true,
        message: `Connected successfully. Found ${response.data.items?.length || 0} calendars.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }
}

/**
 * @description Singleton instance of Google Calendar service
 */
export const googleCalendar = new GoogleCalendarService();

/**
 * @description Export types for use in other modules
 */
export type { ServiceAccountConfig };
