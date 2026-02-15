
/**
 * Real Google Calendar Integration
 * Uses GAPI to fetch actual user events.
 */

export interface CalendarSummary {
  events: string[];
  busyLevel: 'low' | 'medium' | 'high';
  summary: string;
}

// Internal state for the token
let accessToken: string | null = null;

export const setGoogleAccessToken = (token: string | null) => {
  accessToken = token;
};

export const fetchCalendarContext = async (lang: 'zh' | 'en' = 'en'): Promise<CalendarSummary | null> => {
  if (!accessToken) return null;

  try {
    // Initialize GAPI client if not already
    await new Promise((resolve) => {
      (window as any).gapi.load('client', resolve);
    });

    await (window as any).gapi.client.init({
      // The discovery document for the Calendar API
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    });

    // Set the token for GAPI
    (window as any).gapi.client.setToken({ access_token: accessToken });

    // Fetch events from now until the end of the day
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const response = await (window as any).gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.result.items || [];
    const events = items.map((item: any) => {
      const start = item.start.dateTime || item.start.date;
      const startTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${startTime} - ${item.summary}`;
    });

    const busyLevel = events.length > 5 ? 'high' : events.length > 2 ? 'medium' : 'low';
    
    let summary = '';
    if (lang === 'zh') {
      summary = `你今天有 ${events.length} 个日程。忙碌程度：${busyLevel === 'high' ? '高' : busyLevel === 'medium' ? '中' : '低'}。`;
    } else {
      summary = `You have ${events.length} events today. Busy level: ${busyLevel}.`;
    }

    return { events, busyLevel, summary };
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return null;
  }
};
