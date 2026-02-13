
/**
 * In a production environment, this would use the Google Calendar API (GAPI).
 * For Project Flux, we simulate the 'Schedule Summary' that provides 
 * context to the Gemini Oracle.
 */

export interface CalendarSummary {
  events: string[];
  busyLevel: 'low' | 'medium' | 'high';
  summary: string;
}

export const fetchCalendarContext = async (): Promise<CalendarSummary> => {
  // Simulating an API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Mocked schedule data that a real GAPI integration would return
  const mockEvents = [
    "Meeting with Design Team @ 2:00 PM",
    "Dentist Appointment @ 4:30 PM",
    "Project Deadline: EOD Today",
    "Dinner with family @ 7:00 PM"
  ];

  return {
    events: mockEvents,
    busyLevel: 'high',
    summary: "Today is packed with a mix of professional meetings and personal appointments. The late afternoon is especially tight due to back-to-back commitments."
  };
};
