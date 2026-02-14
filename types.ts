
import { SimulationNodeDatum } from 'd3-force';

export type Language = 'zh' | 'en' | 'es' | 'ja' | 'fr';
export type CalendarProvider = 'GOOGLE' | 'APPLE' | null;

export enum ThoughtStatus {
  UNSORTED = 'UNSORTED',
  LET_THEM = 'LET_THEM', // Stillness/Acceptance (Smoke)
  LET_ME = 'LET_ME',     // Actionable (Solid)
  COMPLETED = 'COMPLETED',
  RELEASED = 'RELEASED'  
}

export enum Weight {
  URGENT = 'URGENT',     
  IMPORTANT = 'IMPORTANT', 
  CASUAL = 'CASUAL'      
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Thought extends SimulationNodeDatum {
  id: string;
  content: string;
  createdAt: number;
  completedAt?: number; 
  dueDate?: number; 
  status: ThoughtStatus;
  weight?: Weight;
  aiReasoning?: string;
  reframedContent?: string; 
  stoicQuote?: string;
  visualState?: 'solid' | 'smoke';
  subTasks?: SubTask[];
  timeEstimate?: string;
  r?: number; 
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface AnalysisResult {
  category: 'LET_THEM' | 'LET_ME';
  weight?: Weight;
  reasoning: string;
  reframing?: string; 
  stoicQuote?: string;
  subTasks?: string[];
  timeEstimate?: string;
}
