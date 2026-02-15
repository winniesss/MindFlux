
/**
 * In a production environment, this would use the Google Calendar API (GAPI).
 * For Project Flux Demo, we simulate the 'Schedule Summary' to show how 
 * AI reasoning integrates with your daily context.
 */

export interface CalendarSummary {
  events: string[];
  busyLevel: 'low' | 'medium' | 'high';
  summary: string;
}

export const fetchCalendarContext = async (lang: 'zh' | 'en' = 'en'): Promise<CalendarSummary> => {
  // Simulating an API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (lang === 'zh') {
    return {
      events: [
        "下午 2:00 与设计团队开会",
        "下午 4:30 牙医预约",
        "今日截止：Project Flux PRD 交付",
        "晚上 7:00 家庭晚餐"
      ],
      busyLevel: 'high',
      summary: "（演示数据）你今天下午非常繁忙，特别是 2 点到 5 点之间有背靠背的安排。建议将重要任务安排在晚上或明天上午。"
    };
  }

  return {
    events: [
      "Meeting with Design Team @ 2:00 PM",
      "Dentist Appointment @ 4:30 PM",
      "Project Deadline: EOD Today",
      "Dinner with family @ 7:00 PM"
    ],
    busyLevel: 'high',
    summary: "(Demo Data) Your afternoon is packed with back-to-back commitments between 2 PM and 5 PM. Better schedule high-focus work for tonight or tomorrow morning."
  };
};
