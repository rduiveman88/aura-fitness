/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SetLog {
  w: number; // weight in kg
  r: number; // reps count or reps string
}

export interface HistoryExercise {
  name: string;
  muscle: string;
  intensity: 'Makkelijk' | 'Perfect' | 'Maximaal';
  sets: SetLog[];
  exerciseVolume: number;
  topWeight: number;
}

export interface WorkoutSession {
  date: string;
  timestamp: number;
  startTimestamp?: number;
  name: string;
  exercises: HistoryExercise[];
  totalSessionVolume: number;
  durationMinutes?: number;
}

export interface Exercise {
  name: string;
  muscle: string;
  equip: string;
  sets: number;
  reps: string;
  targetWeight?: number;
  restSeconds?: number;
  executionCue?: string;
  formGuide?: string[];
  safetyTip?: string;
  images?: string[];
  imageUrl?: string;
  isTipsLoading?: boolean;
  maxEffortTestDue?: boolean;
}

export interface UserModel {
  name: string;
  age: number;
  weight: number;
  height?: number; // lengte in cm
  goal: string;
  daysPerWeek: number;
  duration: number;
  equipment: string[];
  apiKey: string;
  fixedDays?: number[]; // 1 = Monday, ..., 7 = Sunday
  restDayYogaEnabled?: boolean;
  painPoints?: string[]; // blessures of pijnpunten
  splitPreference?: 'auto' | 'fullbody' | 'upperlower' | 'ppl' | 'bro';
}

export interface ExercisePrefs {
  likes: string[];
  dislikes: string[];
  painNotes: string[];
}

export interface BaselineData {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  benchPressWeight?: number;
  benchPressReps?: number;
  benchPress1RM?: number;
  squatWeight?: number;
  squatReps?: number;
  squat1RM?: number;
  latPulldownWeight?: number;
  latPulldownReps?: number;
  latPulldown1RM?: number;
  overheadPressWeight?: number;
  overheadPressReps?: number;
  overheadPress1RM?: number;
  completedAt: string;
}

export interface FatigueInfo {
  ratio: number;
  hoursSince: number | null;
  rawSets: number;
  recoveryWindow: number;
}

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'lowerback' | 'forearms';

export interface ScheduleInfo {
  confidence: 'none' | 'low' | 'medium' | 'high';
  sessionsLogged: number;
  predictedMinutes?: number;
  predictedLabel?: string;
  windowMin?: number;
  usedDaySpecific?: boolean;
  dayName?: string;
  isNow?: boolean;
}
