
import { Thought, Weight } from '../types';

export const generateGoogleCalendarUrl = (thought: Thought): string => {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const action = "TEMPLATE";
  
  // Basic Details
  const text = encodeURIComponent(thought.content);
  
  let priorityText = 'Casual';
  if (thought.weight === 'URGENT') priorityText = 'Urgent';
  if (thought.weight === 'IMPORTANT') priorityText = 'Important';

  // Include Stoic insights and subtasks in the description
  const subTasksText = thought.subTasks && thought.subTasks.length > 0
    ? `\n\nSub-tasks:\n${thought.subTasks.map(st => `- ${st.text}`).join('\n')}`
    : '';

  const details = encodeURIComponent(
    `Flux Stoic Strategy: ${thought.reframedContent || 'Direct Action'}\n\nPriority: ${priorityText}\nInsight: ${thought.stoicQuote || 'N/A'}${subTasksText}`
  );

  // Dates
  // Use thought.dueDate if available, otherwise default to now
  const startTime = thought.dueDate ? new Date(thought.dueDate) : new Date();
  
  // If no specific dueDate was set (only unscheduled), round to next hour
  if (!thought.dueDate) {
    startTime.setHours(startTime.getHours() + 1, 0, 0, 0);
  }

  // Set end time 30 mins to 1 hour after start
  const endTime = new Date(startTime.getTime() + (thought.timeEstimate?.includes('h') ? 60 : 30) * 60 * 1000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const dates = `${formatDate(startTime)}/${formatDate(endTime)}`;

  // Construct URL
  let url = `${baseUrl}?action=${action}&text=${text}&details=${details}&dates=${dates}`;

  return url;
};
