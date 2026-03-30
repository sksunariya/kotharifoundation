const { google } = require('googleapis');

const getCalendarClient = () => {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};

/**
 * Creates a Google Meet link via Google Calendar API.
 * Returns the hangout link or null if Google API is not configured.
 */
const createMeetLink = async ({ title, startTime, endTime, attendeeEmails = [], description = '' }) => {
  const calendar = getCalendarClient();

  if (!calendar) {
    console.warn('Google Calendar API not configured. Skipping Meet link creation.');
    return null;
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const requestId = `kothari-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const event = {
    summary: title,
    description,
    start: { dateTime: new Date(startTime).toISOString(), timeZone: 'Asia/Kolkata' },
    end: { dateTime: new Date(endTime).toISOString(), timeZone: 'Asia/Kolkata' },
    attendees: attendeeEmails.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    guestsCanSeeOtherGuests: false,
  };

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: event,
  });

  return response.data.hangoutLink || null;
};

module.exports = { createMeetLink };
