
import { SimulationNodeDatum } from 'd3-force';

export type Language = 'zh' | 'en';

export enum ThoughtStatus {
  UNSORTED = 'UNSORTED',
  LET_THEM = 'LET_THEM', // Finding Peace (Smoke)
  LET_ME = 'LET_ME',     // I've Got This (Solid)
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
  suggestedSlot?: string;
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
  suggestedSlot?: string;
}
