
import { SimulationNodeDatum } from 'd3-force';

export type Language = 'zh' | 'en' | 'es' | 'ja' | 'fr';
export type CalendarProvider = 'GOOGLE' | 'APPLE' | null;

export enum ThoughtStatus {
  UNSORTED = 'UNSORTED',
  LET_THEM = 'LET_THEM', // Stillness/Acceptance
  LET_ME = 'LET_ME',     // Actionable
  COMPLETED = 'COMPLETED',
  RELEASED = 'RELEASED'  // New: Completely purged from mind
}

export enum Weight {
  URGENT = 'URGENT',     
  IMPORTANT = 'IMPORTANT', 
  CASUAL = 'CASUAL'      
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
}
