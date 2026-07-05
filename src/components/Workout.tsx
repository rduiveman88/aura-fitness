/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, TouchEvent as ReactTouchEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Exercise, HistoryExercise, SetLog, UserModel, ExercisePrefs } from '../types';
import { Play, Plus, Check, RefreshCw, X, ThumbsUp, ThumbsDown, ArrowRight, Loader2, Sparkles, AlertCircle, Trash, Heart, Timer, ChevronDown, ChevronUp, CheckCircle2, Pause, RotateCcw, Compass, Info, Search, Filter, Dumbbell } from 'lucide-react';
import { yogaCategories, YogaExercise, YogaCategory } from './Dashboard';
import ExerciseDetailModal from './ExerciseDetailModal';
import { getExerciseImages } from './exerciseImages';


interface WorkoutProps {
  userModel: UserModel;
  sessionName: string;
  activeWorkoutData: Exercise[] | null;
  onStartSession: (sessionName: string, exercises?: Exercise[]) => void;
  onFinishSession: (results: { name: string; exercises: any[]; totalSessionVolume: number; durationMinutes?: number }) => void;
  onCancelSession: () => void;
  isRestDay?: boolean;
  history?: any[];
  onUpdateBaseline?: (updatedBaseline: any) => void;
  baselineData?: any;
}

export const exerciseImageMap: Record<string, string> = {
  "Warming-up": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80",
  "Warming-up (Fietsen)": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80",
  "Warming-up (Loopband)": "https://images.unsplash.com/photo-1578762560072-46cf122c974d?auto=format&fit=crop&w=400&q=80",
  "Warming-up (Roeien)": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80",
  "Warming-up (Lichte Cardio)": "https://images.unsplash.com/photo-1607962837359-5e7eaf562642?auto=format&fit=crop&w=400&q=80",
  "Barbell Bench Press": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
  "Incline Dumbbell Press": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg",
  "Dumbbell Incline Bench Press": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
  "Chest Press Machine": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_Press_On_The_Leg_Press_Machine/0.jpg",
  "Machine Fly": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Machine_Flyes/0.jpg",
  "Cable Flyes": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flat_Bench_Cable_Flyes/0.jpg",
  "Cable Crossover Fly": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg",
  "Dips (Chest-focused)": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Chest_Version/0.jpg",
  "Barbell Deadlift": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg",
  "Lat Pulldown": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Front_Lat_Pulldown/0.jpg",
  "Bent-Over Barbell Row": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg",
  "Seated Cable Row": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg",
  "Single-Arm Dumbbell Row": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_One-Arm_Upright_Row/0.jpg",
  "Face Pulls": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg",
  "Overhead Press": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/0.jpg",
  "Dumbbell Shoulder Press": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/0.jpg",
  "Dumbbell Lateral Raise": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lying_Rear_Lateral_Raise/0.jpg",
  "Cable Lateral Raise": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Seated_Lateral_Raise/0.jpg",
  "Reverse Pec Deck Fly": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Flyes/0.jpg",
  "Barbell / EZ-Bar Curl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Curl/0.jpg",
  "Dumbbell Bicep Curl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/0.jpg",
  "Dumbbell Incline Curl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Alternate_Incline_Dumbbell_Curl/0.jpg",
  "Hammer Curls": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg",
  "Preacher Curl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/0.jpg",
  "Triceps Pushdown": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg",
  "Cable Rope Tricep Extension": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rope_Overhead_Triceps_Extension/0.jpg",
  "Overhead Cable Triceps Extension": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rope_Overhead_Triceps_Extension/0.jpg",
  "Close-Grip Bench Press": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Smith_Machine_Close-Grip_Bench_Press/0.jpg",
  "Skull Crushers": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Band_Skull_Crusher/0.jpg",
  "Dumbbell Skullcrusher": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Skullcrusher/0.jpg",
  "Barbell Back Squat": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Full_Squat/0.jpg",
  "Leg Press": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg",
  "Hack Squat": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hack_Squat/0.jpg",
  "Leg Extensions": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg",
  "Romanian Deadlift (RDL)": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg",
  "Seated / Lying Leg Curl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg",
  "Bulgarian Split Squat": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Side_Split_Squat/0.jpg",
  "Hip Thrust": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg",
  "Standing Calf Raise": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rocking_Standing_Calf_Raise/0.jpg",
  "Seated Calf Raise": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Calf_Raise/0.jpg",
  "Hanging Leg Raise": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/0.jpg",
  "Ab Wheel Rollout": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Ab_Rollout/0.jpg",
  "Cable Crunch": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crunch/0.jpg",
  "Plank": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg",
  "Dumbbell Wrist Curl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Wrist_Curl/0.jpg",
  "Reverse Barbell Curl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Barbell_Curl/0.jpg",
  "Farmer's Walk": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80",
};

// Naam -> afbeeldingen-array voor de 36 'klassiekers' (tweede batch, los van de oorspronkelijke 44)
// Elke URL hieronder is individueel met een live HTTP-aanvraag gecontroleerd (allemaal 200 OK).
export const classicsImageMap: Record<string, string[]> = {
  "Decline Barbell Bench Press": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/1.jpg"],
  "Dumbbell Bench Press": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/1.jpg"],
  "Dumbbell Flyes": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Flyes/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Flyes/1.jpg"],
  "Cable Crossover": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/1.jpg"],
  "Pushups": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/1.jpg"],
  "Pullups": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/1.jpg"],
  "T-Bar Row with Handle": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/T-Bar_Row_with_Handle/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/T-Bar_Row_with_Handle/1.jpg"],
  "Hyperextensions (Back Extensions)": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hyperextensions_Back_Extensions/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hyperextensions_Back_Extensions/1.jpg"],
  "Wide-Grip Lat Pulldown": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/1.jpg"],
  "Chin-Up": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin-Up/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin-Up/1.jpg"],
  "Arnold Dumbbell Press": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arnold_Dumbbell_Press/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arnold_Dumbbell_Press/1.jpg"],
  "Front Dumbbell Raise": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Dumbbell_Raise/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Dumbbell_Raise/1.jpg"],
  "Reverse Flyes": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Flyes/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Flyes/1.jpg"],
  "Upright Barbell Row": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Upright_Barbell_Row/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Upright_Barbell_Row/1.jpg"],
  "Standing Military Press": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/1.jpg"],
  "Barbell Curl": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/1.jpg"],
  "Hammer Curls": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/1.jpg"],
  "Preacher Curl": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/1.jpg"],
  "Standing Biceps Cable Curl": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Biceps_Cable_Curl/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Biceps_Cable_Curl/1.jpg"],
  "Concentration Curls": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Concentration_Curls/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Concentration_Curls/1.jpg"],
  "EZ-Bar Curl": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Curl/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Curl/1.jpg"],
  "Triceps Pushdown": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/1.jpg"],
  "Close-Grip Barbell Bench Press": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Barbell_Bench_Press/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Barbell_Bench_Press/1.jpg"],
  "Lying Triceps Press": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/1.jpg"],
  "Standing Overhead Barbell Triceps Extension": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Overhead_Barbell_Triceps_Extension/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Overhead_Barbell_Triceps_Extension/1.jpg"],
  "Barbell Squat": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/1.jpg"],
  "Front Squat (Clean Grip)": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Squat_Clean_Grip/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Squat_Clean_Grip/1.jpg"],
  "Leg Extensions": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/1.jpg"],
  "Barbell Walking Lunge": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Walking_Lunge/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Walking_Lunge/1.jpg"],
  "Hack Squat": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hack_Squat/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hack_Squat/1.jpg"],
  "Goblet Squat": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/1.jpg"],
  "Romanian Deadlift": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/1.jpg"],
  "Lying Leg Curls": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/1.jpg"],
  "Stiff-Legged Barbell Deadlift": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff-Legged_Barbell_Deadlift/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff-Legged_Barbell_Deadlift/1.jpg"],
  "Seated Leg Curl": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Leg_Curl/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Leg_Curl/1.jpg"],
  "Standing Calf Raises": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/1.jpg"],
  "Donkey Calf Raises": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Donkey_Calf_Raises/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Donkey_Calf_Raises/1.jpg"],
  "Single Leg Glute Bridge": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Single_Leg_Glute_Bridge/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Single_Leg_Glute_Bridge/1.jpg"],
  "Cable Hip Adduction": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Hip_Adduction/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Hip_Adduction/1.jpg"],
  "Russian Twist": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Russian_Twist/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Russian_Twist/1.jpg"],
  "3/4 Sit-Up": ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/3_4_Sit-Up/0.jpg", "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/3_4_Sit-Up/1.jpg"],
};

const baseFallbackLibrary = [
  // Borst (Chest)
  { name: "Barbell Bench Press", muscle: "Borst", equip: "Barbell", sets: 4, reps: "6-8", restSeconds: 90, executionCue: "Laat de stang gecontroleerd zakken tot je borst en druk explosief uit. Houd je schouderbladen ingetrokken." },
  { name: "Incline Dumbbell Press", muscle: "Borst", equip: "Dumbbells", sets: 3, reps: "8-12", restSeconds: 75, executionCue: "Houd de dumbbells in een hoek van 45 graden ten opzichte van je bovenlichaam om je schouders te beschermen." },
  { name: "Dumbbell Incline Bench Press", muscle: "Borst", equip: "Dumbbells", sets: 3, reps: "13" },
  { name: "Chest Press Machine", muscle: "Borst", equip: "Chest Press Machine", sets: 3, reps: "10-12" },
  { name: "Machine Fly", muscle: "Borst", equip: "Chest Press Machine", sets: 3, reps: "10" },
  { name: "Cable Flyes", muscle: "Borst", equip: "Cable Station", sets: 3, reps: "12-15" },
  { name: "Cable Crossover Fly", muscle: "Borst", equip: "Cable Station", sets: 4, reps: "10" },
  { name: "Dips (Chest-focused)", muscle: "Borst", equip: "Dip Station", sets: 3, reps: "8-10" },
  
  // Rug (Back)
  { name: "Barbell Deadlift", muscle: "Rug", equip: "Barbell", sets: 4, reps: "5", restSeconds: 120, executionCue: "Houd je rug perfect neutraal en trek de stang dicht langs je schenen omhoog." },
  { name: "Lat Pulldown", muscle: "Rug", equip: "Lat Pulldown Machine", sets: 3, reps: "8-12", restSeconds: 60, executionCue: "Trek de stang naar de bovenkant van je borst en knijp je schouderbladen samen onderin." },
  { name: "Bent-Over Barbell Row", muscle: "Rug", equip: "Barbell", sets: 4, reps: "8-10" },
  { name: "Seated Cable Row", muscle: "Rug", equip: "Cable Station", sets: 3, reps: "10-12" },
  { name: "Single-Arm Dumbbell Row", muscle: "Rug", equip: "Dumbbells", sets: 3, reps: "10-12" },
  { name: "Face Pulls", muscle: "Rug", equip: "Cable Station", sets: 3, reps: "12-15" },
  
  // Schouders (Shoulders)
  { name: "Overhead Press", muscle: "Schouders", equip: "Barbell", sets: 4, reps: "8-10", restSeconds: 90, executionCue: "Span je billen en buikspieren hard aan om je onderrug te stabiliseren tijdens het uitstoten." },
  { name: "Dumbbell Shoulder Press", muscle: "Schouders", equip: "Dumbbells", sets: 3, reps: "8-12" },
  { name: "Dumbbell Lateral Raise", muscle: "Schouders", equip: "Dumbbells", sets: 4, reps: "12-15", restSeconds: 60, executionCue: "Leid met je ellebogen omhoog en houd een lichte buiging in je armen om de zijkant van de schouders te isoleren." },
  { name: "Cable Lateral Raise", muscle: "Schouders", equip: "Cable Station", sets: 3, reps: "12-15" },
  { name: "Reverse Pec Deck Fly", muscle: "Schouders", equip: "Pec Deck / Fly Machine", sets: 3, reps: "12-15" },
  
  // Biceps (Biceps Brachii)
  { name: "Barbell / EZ-Bar Curl", muscle: "Biceps", equip: "Barbell", sets: 3, reps: "10-12" },
  { name: "Dumbbell Bicep Curl", muscle: "Biceps", equip: "Dumbbells", sets: 3, reps: "10" },
  { name: "Dumbbell Incline Curl", muscle: "Biceps", equip: "Dumbbells", sets: 3, reps: "10-12" },
  { name: "Hammer Curls", muscle: "Biceps", equip: "Dumbbells", sets: 4, reps: "8" },
  { name: "Preacher Curl", muscle: "Biceps", equip: "Preacher Bench", sets: 3, reps: "10-12" },
  
  // Triceps (Triceps Brachii)
  { name: "Triceps Pushdown", muscle: "Triceps", equip: "Cable Station", sets: 3, reps: "12-15" },
  { name: "Cable Rope Tricep Extension", muscle: "Triceps", equip: "Cable Station", sets: 3, reps: "10" },
  { name: "Overhead Cable Triceps Extension", muscle: "Triceps", equip: "Cable Station", sets: 3, reps: "10-12" },
  { name: "Close-Grip Bench Press", muscle: "Triceps", equip: "Barbell", sets: 3, reps: "8-10" },
  { name: "Skull Crushers", muscle: "Triceps", equip: "EZ-Bar", sets: 3, reps: "10-12" },
  { name: "Dumbbell Skullcrusher", muscle: "Triceps", equip: "Dumbbells", sets: 4, reps: "12" },
  
  // Quadriceps (Bovenbenen voorzijde)
  { name: "Barbell Back Squat", muscle: "Quadriceps", equip: "Barbell", sets: 4, reps: "6-8", restSeconds: 120, executionCue: "Zak diep door de heupen, alsof je op een stoel gaat zitten. Houd je borst op en knieën in lijn met je tenen." },
  { name: "Leg Press", muscle: "Quadriceps", equip: "Leg Press Machine", sets: 4, reps: "10-12" },
  { name: "Hack Squat", muscle: "Quadriceps", equip: "Hack Squat Machine", sets: 3, reps: "8-12" },
  { name: "Leg Extensions", muscle: "Quadriceps", equip: "Leg Extension Machine", sets: 3, reps: "12-15" },
  
  // Hamstrings & Glutes (Bovenbenen achterzijde & Billen)
  { name: "Romanian Deadlift (RDL)", muscle: "Hamstrings", equip: "Barbell", sets: 4, reps: "8-10", restSeconds: 90, executionCue: "Duw je heupen ver naar achteren en houd de stang dicht bij je benen. Focus op de rek in de hamstrings." },
  { name: "Seated / Lying Leg Curl", muscle: "Hamstrings", equip: "Leg Curl Machine", sets: 3, reps: "10-12" },
  { name: "Bulgarian Split Squat", muscle: "Gluten", equip: "Dumbbells", sets: 3, reps: "8-10" },
  { name: "Hip Thrust", muscle: "Gluten", equip: "Barbell", sets: 3, reps: "10-12" },
  
  // Kuiten (Calves)
  { name: "Standing Calf Raise", muscle: "Kuiten", equip: "Calf Machine", sets: 4, reps: "12-15" },
  { name: "Seated Calf Raise", muscle: "Kuiten", equip: "Calf Machine", sets: 4, reps: "12-15" },
  
  // Core
  { name: "Hanging Leg Raise", muscle: "Core", equip: "Pullup Bar", sets: 3, reps: "Tot falen" },
  { name: "Ab Wheel Rollout", muscle: "Core", equip: "Ab Wheel", sets: 3, reps: "8-12" },
  { name: "Cable Crunch", muscle: "Core", equip: "Cable Station", sets: 3, reps: "15-20" },
  { name: "Plank", muscle: "Core", equip: "Bodyweight Alleen", sets: 3, reps: "Max tijd" },

  // Borst (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Decline Barbell Bench Press", muscle: "Borst", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Dumbbell Bench Press", muscle: "Borst", equip: "Dumbbells", sets: 3, reps: "8-12" },
  { name: "Dumbbell Flyes", muscle: "Borst", equip: "Dumbbells", sets: 3, reps: "8-12" },
  { name: "Cable Crossover", muscle: "Borst", equip: "Cable Station", sets: 3, reps: "8-12" },
  { name: "Pushups", muscle: "Borst", equip: "Bodyweight Alleen", sets: 3, reps: "8-12" },

  // Rug (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Pullups", muscle: "Rug", equip: "Bodyweight Alleen", sets: 3, reps: "8-12" },
  { name: "T-Bar Row with Handle", muscle: "Rug", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Hyperextensions (Back Extensions)", muscle: "Rug", equip: "Overig", sets: 3, reps: "8-12" },
  { name: "Wide-Grip Lat Pulldown", muscle: "Rug", equip: "Cable Station", sets: 3, reps: "8-12" },
  { name: "Chin-Up", muscle: "Rug", equip: "Bodyweight Alleen", sets: 3, reps: "8-12" },

  // Schouders (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Arnold Dumbbell Press", muscle: "Schouders", equip: "Dumbbells", sets: 3, reps: "8-12" },
  { name: "Front Dumbbell Raise", muscle: "Schouders", equip: "Dumbbells", sets: 3, reps: "8-12" },
  { name: "Reverse Flyes", muscle: "Schouders", equip: "Dumbbells", sets: 3, reps: "8-12" },
  { name: "Upright Barbell Row", muscle: "Schouders", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Standing Military Press", muscle: "Schouders", equip: "Barbell", sets: 3, reps: "8-12" },

  // Biceps (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Barbell Curl", muscle: "Biceps", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Standing Biceps Cable Curl", muscle: "Biceps", equip: "Cable Station", sets: 3, reps: "8-12" },
  { name: "Concentration Curls", muscle: "Biceps", equip: "Dumbbells", sets: 3, reps: "8-12" },
  { name: "EZ-Bar Curl", muscle: "Biceps", equip: "EZ-Bar", sets: 3, reps: "8-12" },

  // Triceps (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Close-Grip Barbell Bench Press", muscle: "Triceps", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Lying Triceps Press", muscle: "Triceps", equip: "EZ-Bar", sets: 3, reps: "8-12" },
  { name: "Standing Overhead Barbell Triceps Extension", muscle: "Triceps", equip: "Barbell", sets: 3, reps: "8-12" },

  // Quadriceps (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Barbell Squat", muscle: "Quadriceps", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Front Squat (Clean Grip)", muscle: "Quadriceps", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Barbell Walking Lunge", muscle: "Quadriceps", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Goblet Squat", muscle: "Quadriceps", equip: "Kettlebells", sets: 3, reps: "8-12" },

  // Hamstrings (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Romanian Deadlift", muscle: "Hamstrings", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Lying Leg Curls", muscle: "Hamstrings", equip: "Machine", sets: 3, reps: "8-12" },
  { name: "Stiff-Legged Barbell Deadlift", muscle: "Hamstrings", equip: "Barbell", sets: 3, reps: "8-12" },
  { name: "Seated Leg Curl", muscle: "Hamstrings", equip: "Machine", sets: 3, reps: "8-12" },

  // Kuiten (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Standing Calf Raises", muscle: "Kuiten", equip: "Machine", sets: 3, reps: "8-12" },
  { name: "Donkey Calf Raises", muscle: "Kuiten", equip: "Overig", sets: 3, reps: "8-12" },

  // Gluten (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Single Leg Glute Bridge", muscle: "Gluten", equip: "Bodyweight Alleen", sets: 3, reps: "8-12" },
  { name: "Cable Hip Adduction", muscle: "Gluten", equip: "Cable Station", sets: 3, reps: "8-12" },

  // Core (klassiekers, geverifieerd tegen free-exercise-db)
  { name: "Russian Twist", muscle: "Core", equip: "Bodyweight Alleen", sets: 3, reps: "8-12" },
  { name: "3/4 Sit-Up", muscle: "Core", equip: "Bodyweight Alleen", sets: 3, reps: "8-12" },

  // Onderarmen (Forearms)
  { name: "Dumbbell Wrist Curl", muscle: "Onderarmen", equip: "Dumbbells", sets: 3, reps: "12-15", restSeconds: 60, executionCue: "Leg je onderarmen op een bankje of je knieën met je handpalmen omhoog. Krul je polsen gecontroleerd omhoog." },
  { name: "Reverse Barbell Curl", muscle: "Onderarmen", equip: "Barbell", sets: 3, reps: "10-12", restSeconds: 60, executionCue: "Pak de stang bovenhands vast (handpalmen naar beneden). Krul het gewicht omhoog en voel de spanning bovenop je onderarmen." },
  { name: "Farmer's Walk", muscle: "Onderarmen", equip: "Dumbbells", sets: 3, reps: "45s", restSeconds: 60, executionCue: "Pak zware dumbbells en loop met een rechte rug, ingetrokken schouders en actieve grip rustig heen en weer." }
];

const fallbackLibrary = baseFallbackLibrary.map(ex => ({
  ...ex,
  imageUrl: exerciseImageMap[ex.name] || (classicsImageMap[ex.name] ? classicsImageMap[ex.name][0] : undefined)
}));

const yogaLibrary = [
  { name: "Child's Pose (Balasana)", muscle: "Onderrug", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "60s", restSeconds: 15, executionCue: "Strek je armen ver naar voren en laat je heupen zwaar op je hielen rusten. Adem diep in en uit door je neus." },
  { name: "Downward-Facing Dog (Adho Mukha Svanasana)", muscle: "Hamstrings", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "45s", restSeconds: 20, executionCue: "Spreid je vingers breed, duw je stuitje omhoog en probeer je hielen richting de mat te brengen." },
  { name: "Cobra Pose (Bhujangasana)", muscle: "Onderrug", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "45s" },
  { name: "Cat-Cow Stretch (Marjaryasana)", muscle: "Rug", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "60s", restSeconds: 10, executionCue: "Beweeg vloeiend tussen het hollen en bollen van de rug op het ritme van je in- en uitademing." },
  { name: "Pigeon Pose (Kapotasana)", muscle: "Gluten", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "45s" },
  { name: "Warrior II (Virabhadrasana II)", muscle: "Quadriceps", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "45s" },
  { name: "Tree Pose (Vrikshasana)", muscle: "Core", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "45s" },
  { name: "Sphinx Pose (Salamba Bhujangasana)", muscle: "Onderrug", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "60s" },
  { name: "Bridge Pose (Setu Bandhasana)", muscle: "Gluten", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "45s" },
  { name: "Happy Baby Pose (Ananda Balasana)", muscle: "Heupen", equip: "Yoga mat / Lichaamsgewicht", sets: 3, reps: "60s" },
  { name: "Corpse Pose (Savasana)", muscle: "Core", equip: "Yoga mat / Lichaamsgewicht", sets: 1, reps: "5 min" }
];

const muscleFallbacks: Record<string, string> = {
  "Borst": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=300&q=80",
  "Rug": "https://images.unsplash.com/photo-1605296867304-46d5465a25f1?auto=format&fit=crop&w=300&q=80",
  "Schouders": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=300&q=80",
  "Biceps": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=300&q=80",
  "Triceps": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=300&q=80",
  "Quadriceps": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=300&q=80",
  "Hamstrings": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80",
  "Gluten": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=300&q=80",
  "Kuiten": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=300&q=80",
  "Core": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80",
  "Onderrug": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=300&q=80",
  "Heupen": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80",
};

const isEquipmentAvailable = (exEquip: string, availableEquipment: string[]): boolean => {
  if (!exEquip) return true;
  const normalizedExEquip = exEquip.toLowerCase();
  if (
    normalizedExEquip === "bodyweight alleen" ||
    normalizedExEquip === "overig" ||
    normalizedExEquip === "lichaamsgewicht" ||
    normalizedExEquip === "yoga mat / lichaamsgewicht" ||
    normalizedExEquip === "ab wheel"
  ) {
    return true;
  }
  if (normalizedExEquip === "machine") {
    return true;
  }
  const normalizedEquipList = (availableEquipment || []).map(e => e.toLowerCase());
  return normalizedEquipList.some(item => {
    return normalizedExEquip.includes(item) || item.includes(normalizedExEquip);
  });
};

interface ExerciseSelectorCardProps {
  ex: any;
  onSelect: (ex: any) => void;
  accentText: string;
  isRestDay: boolean;
}

const ExerciseSelectorCard: React.FC<ExerciseSelectorCardProps> = ({
  ex,
  onSelect,
  accentText,
  isRestDay
}) => {
  const [errorUrls, setErrorUrls] = useState<Set<string>>(() => new Set());

  // Resolve exercise images dynamically with reliable fallbacks
  const allImages = [
    ...(ex.images || []),
    ex.imageUrl,
    exerciseImageMap[ex.name],
    ...(classicsImageMap[ex.name] || [])
  ].filter(Boolean) as string[];
  const exerciseImages = allImages.filter(url => !errorUrls.has(url));
  const displayImage = exerciseImages[0] || null;

  return (
    <button
      onClick={() => onSelect(ex)}
      className="w-full bg-white/[0.03] hover:bg-white/[0.08] active:scale-[0.98] transition-all border border-white/5 hover:border-white/10 rounded-2xl p-3 flex items-center gap-4 group text-left relative overflow-hidden cursor-pointer"
    >
      {/* Exercise Image Thumbnail */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/5 shrink-0 relative flex items-center justify-center">
        {displayImage ? (
          <img
            src={displayImage}
            alt={ex.name}
            onError={() => {
              setErrorUrls(prev => {
                const next = new Set(prev);
                next.add(displayImage);
                return next;
              });
            }}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <Dumbbell className="w-6 h-6 text-white/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="text-white text-sm font-semibold truncate group-hover:text-white transition-colors">
          {ex.name}
        </div>
        
        {/* Badges for muscle and equipment */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            isRestDay 
              ? 'bg-sky-500/10 text-sky-400' 
              : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {ex.muscle}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/50">
            {ex.equip}
          </span>
          {ex.reps && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/40 font-mono">
              {ex.reps} {ex.reps.includes('s') || ex.reps.includes('min') ? '' : 'reps'}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 group-hover:scale-105 active:scale-95 transition-all shrink-0 border border-white/5 group-hover:border-white/10">
        <Plus className={`w-4 h-4 text-white/40 group-hover:text-white transition-colors`} />
      </div>
    </button>
  );
};

interface ExerciseThumbnailProps {
  name: string;
  muscle: string;
  className?: string;
  imageUrl?: string;
  images?: string[];
}

const ExerciseThumbnail: React.FC<ExerciseThumbnailProps> = ({
  name,
  muscle,
  className = "w-12 h-12 rounded-xl",
  imageUrl,
  images
}) => {
  const [errorUrls, setErrorUrls] = useState<Set<string>>(() => new Set());
  const allImages = [
    ...(images || []),
    imageUrl,
    exerciseImageMap[name],
    ...(classicsImageMap[name] || []),
    muscleFallbacks[muscle]
  ].filter(Boolean) as string[];
  const exerciseImages = allImages.filter(url => !errorUrls.has(url));
  const displayImage = exerciseImages[0] || null;

  return (
    <div className={`${className} overflow-hidden border border-white/10 shrink-0 bg-black/40 flex items-center justify-center relative`}>
      {displayImage ? (
        <img 
          src={displayImage} 
          alt={name} 
          className="w-full h-full object-cover animate-fadeIn"
          referrerPolicy="no-referrer"
          onError={() => {
            setErrorUrls(prev => {
              const next = new Set(prev);
              next.add(displayImage);
              return next;
            });
          }}
        />
      ) : (
        <Dumbbell className="w-5 h-5 text-white/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
};

interface SetRowProps {
  set: SetLog;
  sIdx: number;
  exIdx: number;
  isSetDone: boolean;
  isRestDay: boolean;
  accentText: string;
  isResting?: boolean;
  handleSetWeightChange: (exIdx: number, sIdx: number, val: string) => void;
  handleSetRepsChange: (exIdx: number, sIdx: number, val: string) => void;
  handleFinishSet: (exIdx: number, sIdx: number) => void;
  onDelete: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SetRow: React.FC<SetRowProps> = ({
  set,
  sIdx,
  exIdx,
  isSetDone,
  isRestDay,
  accentText,
  isResting = false,
  handleSetWeightChange,
  handleSetRepsChange,
  handleFinishSet,
  onDelete,
  onFocus,
  onBlur,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
    };
  }, []);

  const handleStart = (clientX: number, clientY: number, isInput: boolean) => {
    if (showConfirm || isInput) return;
    startPos.current = { x: clientX, y: clientY };
    setIsPressing(true);

    pressTimeoutRef.current = setTimeout(() => {
      setShowConfirm(true);
      setIsPressing(false);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 700);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isPressing) return;
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 10) {
      cancelPress();
    }
  };

  const cancelPress = () => {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
    setIsPressing(false);
  };

  const onTouchStart = (e: ReactTouchEvent) => {
    const isInput = (e.target as HTMLElement).tagName === 'INPUT';
    handleStart(e.touches[0].clientX, e.touches[0].clientY, isInput);
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onMouseDown = (e: ReactMouseEvent) => {
    const isInput = (e.target as HTMLElement).tagName === 'INPUT';
    handleStart(e.clientX, e.clientY, isInput);
  };

  const onMouseMove = (e: ReactMouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  return (
    <div className="relative overflow-hidden rounded-xl select-none">
      {showConfirm ? (
        /* Inline delete confirmation */
        <div className="flex items-center justify-between w-full p-2.5 bg-red-950/40 border border-red-500/20 rounded-xl transition-all duration-300">
          <div className="flex items-center gap-2 text-red-400 font-medium text-xs pl-1">
            <Trash className="w-4 h-4 text-red-500 shrink-0 animate-bounce" />
            <span>Set {sIdx + 1} verwijderen?</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              Annuleer
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                onDelete();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95 cursor-pointer"
            >
              Verwijder
            </button>
          </div>
        </div>
      ) : (
        /* Normal set row with long press overlay progress */
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={cancelPress}
          onTouchCancel={cancelPress}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          className={`relative flex items-center justify-between gap-3 p-1 rounded-xl bg-[#0d0d0d]/80 border border-white/5 transition-all duration-300 overflow-hidden ${
            isResting ? 'opacity-20 grayscale pointer-events-none select-none' : isSetDone ? 'opacity-50' : ''
          } ${isPressing ? 'scale-[0.98] bg-white/5' : 'hover:bg-white/[0.02]'}`}
        >
          {/* Subtle long-press progress bar at the bottom */}
          {isPressing && (
            <div className="absolute bottom-0 left-0 h-[2px] bg-red-500/80 animate-[progress_0.7s_linear_forwards]" style={{ width: '0%' }} />
          )}

          {/* Inline styles for custom progress keyframe if needed */}
          <style>{`
            @keyframes progress {
              to { width: 100%; }
            }
          `}</style>

          <span className="text-[10px] font-mono text-white/30 w-4 font-bold text-center">
            {sIdx + 1}
          </span>
          <div className="flex-1 bg-black/30 border border-white/5 rounded-2xl flex items-center px-4 py-2.5">
            <input
              type="number"
              placeholder="kg"
              value={(set.w as any) === '' || set.w === undefined ? '' : set.w}
              disabled={isSetDone || isResting}
              onChange={e => handleSetWeightChange(exIdx, sIdx, e.target.value)}
              onFocus={(e) => {
                onFocus?.();
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 180);
              }}
              onBlur={onBlur}
              className={`w-1/2 bg-transparent text-center font-mono text-xs font-semibold text-white outline-none focus:${accentText}`}
            />
            <span className="text-white/20 px-1 font-light">×</span>
            <input
              type="number"
              placeholder="reps"
              value={(set.r as any) === '' || set.r === undefined ? '' : set.r}
              disabled={isSetDone || isResting}
              onChange={e => handleSetRepsChange(exIdx, sIdx, e.target.value)}
              onFocus={(e) => {
                onFocus?.();
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 180);
              }}
              onBlur={onBlur}
              className={`w-1/2 bg-transparent text-center font-mono text-xs font-semibold text-white outline-none focus:${accentText}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function Workout({
  userModel,
  sessionName,
  activeWorkoutData,
  onStartSession,
  onFinishSession,
  onCancelSession,
  isRestDay,
  history = [],
  onUpdateBaseline,
  baselineData
}: WorkoutProps) {
  const accentText = isRestDay ? 'text-sky-400' : 'text-emerald-400';
  const accentTextMuted = isRestDay ? 'text-sky-400/60' : 'text-emerald-400/60';
  const accentBg = isRestDay ? 'bg-sky-500/10' : 'bg-emerald-500/10';
  const accentBgActive = isRestDay ? 'bg-sky-500/20' : 'bg-emerald-500/20';
  const accentBorder = isRestDay ? 'border-sky-500/20' : 'border-emerald-500/20';
  const accentBorderActive = isRestDay ? 'border-sky-500/40' : 'border-emerald-500/40';
  const accentBtn = isRestDay ? 'bg-sky-500 text-black' : 'bg-emerald-500 text-black';
  const accentPulse = isRestDay ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [expandedInfo, setExpandedInfo] = useState<Record<number, boolean>>({});
  const [sessionSets, setSessionSets] = useState<Record<number, SetLog[]>>(() => {
    try {
      const saved = localStorage.getItem('aura_active_session_sets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [completedSets, setSessionCompletedSets] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('aura_active_completed_sets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }); // key = `${exIdx}-${setIdx}`
  const [intensities, setIntensities] = useState<Record<number, 'Makkelijk' | 'Perfect' | 'Maximaal'>>(() => {
    try {
      const saved = localStorage.getItem('aura_active_intensities');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [maxEffortSets, setMaxEffortSets] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('aura_active_max_effort_sets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineReason, setOfflineReason] = useState<'network' | 'server' | null>(null);
  const [preparedExercises, setPreparedExercises] = useState<Exercise[] | null>(null);
  const [isUpgradingWithAI, setIsUpgradingWithAI] = useState(false);

  // Background AI generation trigger
  const triggerBackgroundAIGeneration = async (currentLocal: Exercise[]) => {
    if (isUpgradingWithAI) return;
    setIsUpgradingWithAI(true);
    try {
      const prefs = getPrefs();
      const fatigueData = JSON.parse(localStorage.getItem('aura_fatigue') || '{}');
      const histData = JSON.parse(localStorage.getItem('aura_history') || '[]');
      const baselineData = JSON.parse(localStorage.getItem('aura_baseline_data') || 'null');

      const response = await fetch("/api/gemini/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userModel,
          metrics: fatigueData,
          history: histData.slice(0, 8),
          prefs,
          sessionName,
          numberOfExercises: 5,
          userApiKey: userModel.apiKey || undefined,
          baseline: baselineData,
          isRestDay: !!isRestDay
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      if (data && !data.error && Array.isArray(data) && data.length > 0) {
        const verified = data.map((ex: any) => {
          if (isRestDay) {
            const isYoga = (ex.equip || "").toLowerCase().includes("mat") || (ex.equip || "").toLowerCase().includes("lichaam") || (ex.equip || "").toLowerCase().includes("bodyweight") || ex.targetWeight === 0;
            if (isYoga) return ex;
            const allowedLocalPool = yogaLibrary.filter(yogaEx => !prefs.dislikes.includes(yogaEx.name));
            return allowedLocalPool.length > 0 ? allowedLocalPool[Math.floor(Math.random() * allowedLocalPool.length)] : ex;
          }
          // Bypass validation for warming-up and cardio exercises
          if (ex.name.toLowerCase().includes('warming-up') || ex.muscle === 'Cardio') {
            return ex;
          }
          if (isExerciseAllowedForSession(ex.muscle, sessionName)) return ex;
          const availableEquip = userModel.equipment || ["Bodyweight Alleen"];
          let allowedLocalPool = fallbackLibrary.filter(fallbackEx => 
            isExerciseAllowedForSession(fallbackEx.muscle, sessionName) &&
            !prefs.dislikes.includes(fallbackEx.name) &&
            isEquipmentAvailable(fallbackEx.equip || "", availableEquip)
          );
          if (allowedLocalPool.length === 0) {
            allowedLocalPool = fallbackLibrary.filter(fallbackEx => 
              isExerciseAllowedForSession(fallbackEx.muscle, sessionName) &&
              !prefs.dislikes.includes(fallbackEx.name)
            );
          }
          if (allowedLocalPool.length > 0) {
            const chosenLocal = allowedLocalPool[Math.floor(Math.random() * allowedLocalPool.length)];
            return { ...chosenLocal, targetWeight: ex.targetWeight || 20 };
          }
          return ex;
        });

        const prepared = shuffledExercises(verified, baselineData);
        setPreparedExercises(prepared);
        localStorage.setItem('aura_pregenerated_workout', JSON.stringify({
          sessionName,
          isRestDay: !!isRestDay,
          exercises: prepared,
          type: 'ai',
          timestamp: Date.now()
        }));
      }
    } catch (e) {
      console.warn("[AURA] Background AI upgrade failed, staying on premium offline workout.");
    } finally {
      setIsUpgradingWithAI(false);
    }
  };

  const generateLocalWorkout = (sName: string, isRest: boolean): Exercise[] => {
    const prefs = getPrefs();
    const baselineData = JSON.parse(localStorage.getItem('aura_baseline_data') || 'null');
    const splitFocus = sName.toLowerCase();
    
    let chosen: any[] = [];

    // Helper to calculate target exercise count based on duration and goal
    const getTargetCount = (duration: number, goal: string): number => {
      const safeDuration = duration && duration > 0 ? duration : 60;
      const g = (goal || "").toLowerCase();
      let setsPerExercise = 3.5;
      let avgRestSeconds = 75; // hypertrofie default
      if (g.includes("kracht") || g.includes("power")) {
        setsPerExercise = 3.5;
        avgRestSeconds = 150;
      } else if (g.includes("herstel") || g.includes("vitaliteit")) {
        setsPerExercise = 2.5;
        avgRestSeconds = 37.5;
      } else if (g.includes("vetverlies") || g.includes("conditie")) {
        setsPerExercise = 3;
        avgRestSeconds = 30;
      }
      const timePerSetSeconds = 45;
      const transitionBufferSeconds = 60;
      const timePerExerciseSeconds = setsPerExercise * (timePerSetSeconds + avgRestSeconds) + transitionBufferSeconds;
      const warmupMinutes = 8;
      const availableMinutes = Math.max(10, safeDuration - warmupMinutes);
      const raw = Math.round((availableMinutes * 60) / timePerExerciseSeconds);
      return Math.min(12, Math.max(2, raw));
    };

    const targetCount = isRest ? 5 : getTargetCount(userModel.duration, userModel.goal);

    if (isRest) {
      const pool = yogaLibrary.filter(ex => !prefs.dislikes.includes(ex.name));
      chosen = pool.sort(() => 0.5 - Math.random()).slice(0, targetCount);
      if (chosen.length < targetCount) {
        chosen = yogaLibrary.slice(0, targetCount);
      }
    } else {
      // Define target muscles in priority order (compounds first, isolation last)
      let muscleOrder: string[] = [];
      if (splitFocus.includes('full body') || splitFocus.includes('combinatie')) {
        muscleOrder = ['Borst', 'Rug', 'Schouders', 'Quadriceps', 'Hamstrings', 'Gluten', 'Biceps', 'Triceps', 'Core', 'Kuiten', 'Onderrug', 'Onderarmen'];
      } else if (splitFocus.includes('upper') || splitFocus.includes('bovenlichaam')) {
        muscleOrder = ['Borst', 'Rug', 'Schouders', 'Biceps', 'Triceps', 'Onderarmen'];
      } else if (splitFocus.includes('lower') || splitFocus.includes('benen') || splitFocus.includes('legs')) {
        muscleOrder = ['Quadriceps', 'Hamstrings', 'Gluten', 'Kuiten', 'Onderrug'];
      } else if (splitFocus.includes('push')) {
        muscleOrder = ['Borst', 'Schouders', 'Triceps'];
      } else if (splitFocus.includes('pull')) {
        muscleOrder = ['Rug', 'Biceps', 'Onderrug', 'Onderarmen'];
      } else if (splitFocus.includes('borst') || splitFocus.includes('chest')) {
        muscleOrder = ['Borst'];
      } else if (splitFocus.includes('rug') || splitFocus.includes('back')) {
        muscleOrder = ['Rug', 'Onderrug'];
      } else if (splitFocus.includes('schouder') || splitFocus.includes('shoulder')) {
        muscleOrder = ['Schouders'];
      } else if (splitFocus.includes('arm')) {
        muscleOrder = ['Biceps', 'Triceps', 'Onderarmen'];
      }

      if (muscleOrder.length === 0) {
        muscleOrder = ['Borst', 'Rug', 'Schouders', 'Quadriceps', 'Hamstrings', 'Gluten', 'Biceps', 'Triceps', 'Core', 'Kuiten', 'Onderrug', 'Onderarmen'];
      }

      // Group allowed exercises into sub-pools based on muscle group and randomize each pool
      const pools: Record<string, any[]> = {};
      const availableEquip = userModel.equipment || ["Bodyweight Alleen"];
      muscleOrder.forEach(m => {
        let pool = fallbackLibrary.filter(ex => 
          ex.muscle.toLowerCase() === m.toLowerCase() && 
          !prefs.dislikes.includes(ex.name) &&
          isEquipmentAvailable(ex.equip || "", availableEquip)
        );
        if (pool.length === 0) {
          pool = fallbackLibrary.filter(ex => 
            ex.muscle.toLowerCase() === m.toLowerCase() && 
            !prefs.dislikes.includes(ex.name)
          );
        }
        pools[m] = pool.sort(() => 0.5 - Math.random());
      });

      // Round-robin selection loop: visit each muscle pool in priority order to guarantee balanced distribution
      let loopCount = 0;
      
      const getMuscleCap = (m: string) => {
        const lowerM = m.toLowerCase();
        if (lowerM === 'onderarmen' || lowerM === 'kuiten' || lowerM === 'core') return 1;
        if (lowerM === 'biceps' || lowerM === 'triceps' || lowerM === 'onderrug') return 2;
        if (lowerM === 'schouders' || lowerM === 'gluten' || lowerM === 'hamstrings') return 3;
        return 4; // Borst, Rug, Quadriceps
      };

      while (chosen.length < targetCount && loopCount < 100) {
        let progress = false;
        for (const m of muscleOrder) {
          if (chosen.length >= targetCount) break;
          
          // Count how many exercises we already have for this muscle
          const currentCount = chosen.filter(c => c.muscle.toLowerCase() === m.toLowerCase()).length;
          const cap = getMuscleCap(m);
          
          if (currentCount < cap) {
            const pool = pools[m];
            if (pool && pool.length > 0) {
              const exercise = pool.find(ex => !chosen.some(c => c.name === ex.name));
              if (exercise) {
                chosen.push(exercise);
                progress = true;
              }
            }
          }
        }
        if (!progress) break;
        loopCount++;
      }

      // If we are still short of targetCount (e.g. pools ran dry), fill up from allowed pool
      if (chosen.length < targetCount) {
        const allowedPool = fallbackLibrary.filter(ex => 
          isExerciseAllowedForSession(ex.muscle, sName) && 
          !chosen.some(c => c.name === ex.name) &&
          isEquipmentAvailable(ex.equip || "", availableEquip)
        );
        let extra = allowedPool.sort(() => 0.5 - Math.random()).slice(0, targetCount - chosen.length);
        if (chosen.length + extra.length < targetCount) {
          const relaxedPool = fallbackLibrary.filter(ex => 
            isExerciseAllowedForSession(ex.muscle, sName) && 
            !chosen.some(c => c.name === ex.name)
          );
          const relaxedExtra = relaxedPool.sort(() => 0.5 - Math.random()).slice(0, targetCount - chosen.length - extra.length);
          extra = [...extra, ...relaxedExtra];
        }
        chosen = [...chosen, ...extra];
      }
    }

    if (chosen.length === 0) {
      chosen = isRest ? yogaLibrary.slice(0, 5) : baseFallbackLibrary.slice(0, 5);
    }

    const result = shuffledExercises(chosen, baselineData);

    if (!isRest) {
      const equipList = userModel.equipment || [];
      let warmupName = "Warming-up (Lichte Cardio)";
      let warmupEquip = "Lichaamsgewicht";
      let warmupCue = "Roteer rustig je armen en schouders, doe lichte jumping jacks of knieheffen om je hartslag te verhogen.";

      if (equipList.includes("Leg Press Machine") || equipList.includes("Leg Extension Machine")) {
        warmupName = "Warming-up (Fietsen)";
        warmupEquip = "Hometrainer";
        warmupCue = "Fiets op een rustig tempo (lage weerstand) om je benen en hartslag op te warmen.";
      } else if (equipList.includes("Row Machine")) {
        warmupName = "Warming-up (Roeien)";
        warmupEquip = "Roeitrainer";
        warmupCue = "Start met rustige slagen en focus op een volledige bewegingsbaan om je hele lichaam op te warmen.";
      }

      const localWarmup: Exercise = {
        name: warmupName,
        muscle: "Cardio",
        equip: warmupEquip,
        sets: 1,
        reps: "5-10 minuten",
        targetWeight: 0,
        restSeconds: 30,
        executionCue: warmupCue,
        imageUrl: "",
        images: []
      };

      return [localWarmup, ...result];
    }

    return result;
  };

  // Sync preparedExercises effect
  useEffect(() => {
    if (activeWorkoutData) return;

    const cachedStr = localStorage.getItem('aura_pregenerated_workout');
    let loadedFromCache = false;
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        if (cached.sessionName === sessionName && cached.isRestDay === !!isRestDay && Array.isArray(cached.exercises) && cached.exercises.length > 0) {
          setPreparedExercises(cached.exercises);
          loadedFromCache = true;
          // Keep the existing pregenerated workout and avoid automatic background regeneration
          return;
        }
      } catch (e) {
        console.warn("Error reading cached workout:", e);
      }
    }

    let currentEx = preparedExercises;
    if (!loadedFromCache) {
      const fallback = generateLocalWorkout(sessionName, !!isRestDay);
      setPreparedExercises(fallback);
      currentEx = fallback;
      localStorage.setItem('aura_pregenerated_workout', JSON.stringify({
        sessionName,
        isRestDay: !!isRestDay,
        exercises: fallback,
        type: 'local',
        timestamp: Date.now()
      }));
    }

    if (typeof window !== 'undefined' && navigator.onLine) {
      triggerBackgroundAIGeneration(currentEx || []);
    }
  }, [sessionName, isRestDay, activeWorkoutData]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Reset cancel confirmation state when active session changes or starts
  useEffect(() => {
    setShowCancelConfirm(false);
  }, [activeWorkoutData]);

  // Yoga & Rest Day state hooks for Training Tab
  const [completedPoses, setCompletedPoses] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('aura_completed_poses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [expandedYogaTips, setExpandedYogaTips] = useState<Record<string, boolean>>({});
  const [activeYogaTimerExercise, setActiveYogaTimerExercise] = useState<any | null>(null);
  const [yogaTimerSecondsLeft, setYogaTimerSecondsLeft] = useState<number>(0);
  const [yogaTimerIsRunning, setYogaTimerIsRunning] = useState<boolean>(false);
  const [yogaTimerDuration, setYogaTimerDuration] = useState<number>(60); // default 60s
  const [activeYogaCategoryIndex, setActiveYogaCategoryIndex] = useState<number | null>(null);

  const handleTogglePoseComplete = (poseName: string) => {
    setCompletedPoses(prev => {
      const updated = { ...prev, [poseName]: !prev[poseName] };
      localStorage.setItem('aura_completed_poses', JSON.stringify(updated));
      return updated;
    });
  };

  const handleStartYogaTimer = (exercise: any) => {
    setActiveYogaTimerExercise(exercise);
    setYogaTimerSecondsLeft(yogaTimerDuration);
    setYogaTimerIsRunning(true);
  };

  const handleResetSessionalYoga = () => {
    setCompletedPoses({});
    localStorage.removeItem('aura_completed_poses');
  };

  // Yoga countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (yogaTimerIsRunning && yogaTimerSecondsLeft > 0) {
      interval = setInterval(() => {
        setYogaTimerSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (yogaTimerSecondsLeft === 0 && yogaTimerIsRunning) {
      setYogaTimerIsRunning(false);
      if (activeYogaTimerExercise) {
        handleTogglePoseComplete(activeYogaTimerExercise.name);
      }
    }
    return () => clearInterval(interval);
  }, [yogaTimerIsRunning, yogaTimerSecondsLeft, activeYogaTimerExercise]);

  // Selector UI State
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'swap' | 'add'>('add');
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapMuscleFilter, setSwapMuscleFilter] = useState<string | null>(null);
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<Exercise | null>(null);
  const [selectedDetailExerciseIdx, setSelectedDetailExerciseIdx] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorMuscleFilter, setSelectorMuscleFilter] = useState<string | null>(null);


  const getPrefs = (): ExercisePrefs => {
    try {
      const saved = localStorage.getItem('aura_exercise_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          likes: parsed.likes || [],
          dislikes: parsed.dislikes || [],
          painNotes: parsed.painNotes || []
        };
      }
      return { likes: [], dislikes: [], painNotes: [] };
    } catch {
      return { likes: [], dislikes: [], painNotes: [] };
    }
  };

  const savePrefs = (prefs: ExercisePrefs) => {
    localStorage.setItem('aura_exercise_prefs', JSON.stringify(prefs));
  };
  
  // Floating Rest Timer
  const [defaultRestSeconds, setDefaultRestSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('aura_default_rest_seconds');
    return saved ? parseInt(saved, 10) : 90;
  });
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerExerciseIdx, setTimerExerciseIdx] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('aura_timer_exercise_idx');
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerExerciseIdx !== null) {
      localStorage.setItem('aura_timer_exercise_idx', timerExerciseIdx.toString());
    } else {
      localStorage.removeItem('aura_timer_exercise_idx');
    }
  }, [timerExerciseIdx]);

  // Live workout duration in seconds
  const [workoutDurationSeconds, setWorkoutDurationSeconds] = useState(0);

  // Live session progress calculations
  const totalSetsInSession = exercises.reduce((acc, ex, exIdx) => acc + (sessionSets[exIdx]?.length ?? ex.sets ?? 3), 0);
  const completedSetsCount = Object.keys(completedSets).filter(k => completedSets[k]).length;
  const pctCompletedSets = totalSetsInSession > 0 ? (completedSetsCount / totalSetsInSession) * 100 : 0;

  // Track total elapsed time of the active workout session
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeWorkoutData) {
      const savedStart = localStorage.getItem('aura_active_workout_start_time');
      let startTs = Date.now();
      if (savedStart) {
        startTs = parseInt(savedStart, 10);
      } else {
        localStorage.setItem('aura_active_workout_start_time', startTs.toString());
        localStorage.setItem('aura_active_workout_date', new Date().toDateString());
      }

      const updateElapsed = () => {
        const elapsed = Math.max(0, Math.floor((Date.now() - startTs) / 1000));
        setWorkoutDurationSeconds(elapsed);
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setWorkoutDurationSeconds(0);
      localStorage.removeItem('aura_active_workout_start_time');
      localStorage.removeItem('aura_active_workout_date');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeWorkoutData]);

  // Sync sessionSets, completedSets, and intensities to localStorage
  useEffect(() => {
    if (Object.keys(sessionSets).length > 0) {
      localStorage.setItem('aura_active_session_sets', JSON.stringify(sessionSets));
    }
  }, [sessionSets]);

  useEffect(() => {
    localStorage.setItem('aura_active_completed_sets', JSON.stringify(completedSets));
  }, [completedSets]);

  useEffect(() => {
    localStorage.setItem('aura_active_intensities', JSON.stringify(intensities));
  }, [intensities]);

  useEffect(() => {
    localStorage.setItem('aura_active_max_effort_sets', JSON.stringify(maxEffortSets));
  }, [maxEffortSets]);

  // Sync state if activeWorkoutData loaded
  useEffect(() => {
    if (activeWorkoutData) {
      setExercises(activeWorkoutData);
      
      // Check if we already have saved sets in localStorage
      const hasSavedSets = localStorage.getItem('aura_active_session_sets');
      if (hasSavedSets) {
        try {
          const parsedSets = JSON.parse(hasSavedSets);
          if (Object.keys(parsedSets).length > 0) {
            // Already loaded from localStorage via initializers, so don't overwrite
            return;
          }
        } catch (e) {
          console.error("Error parsing saved sets:", e);
        }
      }

      // Seed sets inputs
      const initialSets: Record<number, SetLog[]> = {};
      activeWorkoutData.forEach((ex, exIdx) => {
        const setLogs: SetLog[] = [];
        const setLength = ex.sets || 3;
        for (let i = 0; i < setLength; i++) {
          setLogs.push({
            w: ex.targetWeight || 0,
            r: isNaN(parseInt(ex.reps)) ? 10 : parseInt(ex.reps)
          });
        }
        initialSets[exIdx] = setLogs;
      });
      setSessionSets(initialSets);
      setSessionCompletedSets({});
      setIntensities({});
    } else {
      setExercises([]);
    }
  }, [activeWorkoutData]);

  // Handle rest timer tick
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            playBeep();
            clearInterval(timerIntervalRef.current!);
            setTimerActive(false);
            setTimerExerciseIdx(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive, timerSeconds]);

  // Synthesize beep audio
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  };

  // Rest timer triggers
  const startTimer = (exIdx: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const ex = exercises[exIdx];
    const duration = ex?.restSeconds !== undefined ? ex.restSeconds : defaultRestSeconds;
    setTimerSeconds(duration);
    setTimerExerciseIdx(exIdx);
    setTimerActive(true);
    setExpandedInfo(prev => ({ ...prev, [exIdx]: true }));
  };

  const skipTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerSeconds(0);
    setTimerActive(false);
    setTimerExerciseIdx(null);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isExerciseAllowedForSession = (muscleGroup: string, sName: string): boolean => {
    const focus = (sName || "").toLowerCase();
    const muscle = (muscleGroup || "").toLowerCase();

    // Bro Splits
    if (focus.includes('borst') || focus.includes('chest')) {
      return muscle === 'borst';
    }
    if (focus.includes('rug') || focus.includes('back')) {
      return muscle === 'rug' || muscle === 'onderrug';
    }
    if (focus.includes('benen') || focus.includes('lower') || focus.includes('legs')) {
      return muscle === 'quadriceps' || muscle === 'hamstrings' || muscle === 'gluten' || muscle === 'kuiten' || muscle === 'onderrug';
    }
    if (focus.includes('schouders') || focus.includes('shoulder')) {
      return muscle === 'schouders';
    }
    if (focus.includes('arm')) {
      return muscle === 'biceps' || muscle === 'triceps' || muscle === 'onderarmen';
    }

    // Push / Pull / Legs
    if (focus.includes('push')) {
      return muscle === 'borst' || muscle === 'schouders' || muscle === 'triceps';
    }
    if (focus.includes('pull')) {
      return muscle === 'rug' || muscle === 'biceps' || muscle === 'onderrug' || muscle === 'onderarmen';
    }

    // Upper / Lower
    if (focus.includes('upper')) {
      return muscle === 'borst' || muscle === 'rug' || muscle === 'schouders' || muscle === 'biceps' || muscle === 'triceps' || muscle === 'onderarmen';
    }

    // Full body focus allows everything
    return true;
  };

  // Generate Workout from server-side AI
  const handleGenerateWorkout = async () => {
    setLoading(true);
    setErrorMsg('');
    setIsOfflineMode(false);
    setOfflineReason(null);

    // If browser is explicitly offline, skip network fetch entirely for instant fallback
    if (typeof window !== 'undefined' && !navigator.onLine) {
      console.warn("[AURA] Device is offline. Directing to personalized local fallback generator.");
      setOfflineReason('network');
      triggerOfflineFallback();
      setLoading(false);
      return;
    }

    try {
      const prefs = getPrefs();
      const fatigueData = JSON.parse(localStorage.getItem('aura_fatigue') || '{}');
      const histData = JSON.parse(localStorage.getItem('aura_history') || '[]');
      const baselineData = JSON.parse(localStorage.getItem('aura_baseline_data') || 'null');

      const response = await fetch("/api/gemini/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userModel,
          metrics: fatigueData,
          history: histData.slice(0, 8),
          prefs,
          sessionName,
          numberOfExercises: 5,
          userApiKey: undefined,
          baseline: baselineData,
          isRestDay: !!isRestDay
        }),
      });

      if (!response.ok) {
        throw new Error("Er kon geen AI-workout worden gegenereerd. Offline fallback geactiveerd.");
      }

      const data = await response.json();

      if (data && data.error) {
        setOfflineReason('server');
        throw new Error(data.message || "Er kon geen AI-workout worden gegenereerd. Offline fallback geactiveerd.");
      }
      if (data && (!Array.isArray(data) || data.length === 0)) {
        throw new Error("Ongeldig AI-antwoord.");
      }
      if (Array.isArray(data) && data.length > 0) {
        // Post-validation: filter out anything that doesn't belong in this session split,
        // and replace it with a valid local exercise! This is extremely robust.
        const verified = data.map((ex: any) => {
          if (isRestDay) {
            const isYoga = (ex.equip || "").toLowerCase().includes("mat") || (ex.equip || "").toLowerCase().includes("lichaam") || (ex.equip || "").toLowerCase().includes("bodyweight") || ex.targetWeight === 0;
            if (isYoga) {
              return ex;
            }
            const allowedLocalPool = yogaLibrary.filter(yogaEx => !prefs.dislikes.includes(yogaEx.name));
            if (allowedLocalPool.length > 0) {
              return allowedLocalPool[Math.floor(Math.random() * allowedLocalPool.length)];
            }
            return ex;
          }

          // Bypass validation for warming-up and cardio exercises
          if (ex.name.toLowerCase().includes('warming-up') || ex.muscle === 'Cardio') {
            return ex;
          }
          if (isExerciseAllowedForSession(ex.muscle, sessionName)) {
            return ex;
          }
          // Swap with a compatible local exercise for this focus
          const availableEquip = userModel.equipment || ["Bodyweight Alleen"];
          let allowedLocalPool = fallbackLibrary.filter(fallbackEx => 
            isExerciseAllowedForSession(fallbackEx.muscle, sessionName) &&
            !prefs.dislikes.includes(fallbackEx.name) &&
            isEquipmentAvailable(fallbackEx.equip || "", availableEquip)
          );
          if (allowedLocalPool.length === 0) {
            allowedLocalPool = fallbackLibrary.filter(fallbackEx => 
              isExerciseAllowedForSession(fallbackEx.muscle, sessionName) &&
              !prefs.dislikes.includes(fallbackEx.name)
            );
          }
          if (allowedLocalPool.length > 0) {
            const chosenLocal = allowedLocalPool[Math.floor(Math.random() * allowedLocalPool.length)];
            return {
              ...chosenLocal,
              targetWeight: ex.targetWeight || 20
            };
          }
          return ex; // ultimate fallback
        });

        const prepared = shuffledExercises(verified, baselineData);
        onStartSession(sessionName, prepared);
        setExercises(prepared);
      } else {
        throw new Error("Ongeldig AI-antwoord.");
      }
    } catch (err: any) {
      console.warn("[AURA] Loading local fallback due to error:", err.message);
      setIsOfflineMode(true);
      if (!offlineReason) {
        // Check if error is due to a network connection failure
        const isNetworkErr = err.name === 'TypeError' || err.message?.toLowerCase().includes('fetch') || !navigator.onLine;
        setOfflineReason(isNetworkErr ? 'network' : 'server');
      }
      triggerOfflineFallback();
    } finally {
      setLoading(false);
    }
  };

  const triggerOfflineFallback = () => {
    setIsOfflineMode(true);
    if (!offlineReason) {
      const isNetworkErr = typeof window !== 'undefined' && (!navigator.onLine);
      setOfflineReason(isNetworkErr ? 'network' : 'server');
    }
    // Pick 5 appropriate exercises based on split focus
    const prefs = getPrefs();
    const baselineData = JSON.parse(localStorage.getItem('aura_baseline_data') || 'null');
    const splitFocus = sessionName.toLowerCase();
    
    let chosen: any[] = [];

    if (isRestDay) {
      // Pick 5 yoga/stretch exercises
      const pool = yogaLibrary.filter(ex => !prefs.dislikes.includes(ex.name));
      chosen = pool.sort(() => 0.5 - Math.random()).slice(0, 5);
      if (chosen.length < 5) {
        chosen = yogaLibrary.slice(0, 5);
      }
    } else if (splitFocus.includes('full body') || splitFocus.includes('combinatie')) {
      // Choose 1 chest, 1 back, 1 legs, 1 shoulders, 1 biceps/triceps/core
      const availableEquip = userModel.equipment || ["Bodyweight Alleen"];
      const getFilteredPool = (muscleFilter: (ex: any) => boolean) => {
        let pool = fallbackLibrary.filter(ex => muscleFilter(ex) && !prefs.dislikes.includes(ex.name) && isEquipmentAvailable(ex.equip || "", availableEquip));
        if (pool.length === 0) {
          pool = fallbackLibrary.filter(ex => muscleFilter(ex) && !prefs.dislikes.includes(ex.name));
        }
        return pool;
      };

      const chestPool = getFilteredPool(ex => ex.muscle === 'Borst');
      const backPool = getFilteredPool(ex => ex.muscle === 'Rug');
      const legPool = getFilteredPool(ex => ['Quadriceps', 'Hamstrings', 'Gluten'].includes(ex.muscle));
      const shoulderPool = getFilteredPool(ex => ex.muscle === 'Schouders');
      const otherPool = getFilteredPool(ex => ['Biceps', 'Triceps', 'Core', 'Kuiten'].includes(ex.muscle));

      const pickRandom = (arr: any[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
      
      const p1 = pickRandom(chestPool);
      const p2 = pickRandom(backPool);
      const p3 = pickRandom(legPool);
      const p4 = pickRandom(shoulderPool);
      const p5 = pickRandom(otherPool);

      if (p1) chosen.push(p1);
      if (p2) chosen.push(p2);
      if (p3) chosen.push(p3);
      if (p4) chosen.push(p4);
      if (p5) chosen.push(p5);

      // fallback just in case we need to pad to 5
      while (chosen.length < 5) {
        const extra = fallbackLibrary.filter(ex => !chosen.includes(ex) && !prefs.dislikes.includes(ex.name) && isEquipmentAvailable(ex.equip || "", availableEquip));
        if (extra.length === 0) break;
        const picked = pickRandom(extra);
        if (picked) chosen.push(picked);
      }
    } else {
      // Pick 5 exercises belonging to the allowed muscle groups for this focus day
      const availableEquip = userModel.equipment || ["Bodyweight Alleen"];
      let allowedPool = fallbackLibrary.filter(ex => 
        isExerciseAllowedForSession(ex.muscle, sessionName) && 
        !prefs.dislikes.includes(ex.name) &&
        isEquipmentAvailable(ex.equip || "", availableEquip)
      );
      
      if (allowedPool.length < 5) {
        allowedPool = fallbackLibrary.filter(ex => 
          isExerciseAllowedForSession(ex.muscle, sessionName) && 
          !prefs.dislikes.includes(ex.name)
        );
      }
      
      chosen = allowedPool.sort(() => 0.5 - Math.random()).slice(0, 5);
      
      // If pool is too small, relax dislike filter
      if (chosen.length < 5) {
        const relaxPool = fallbackLibrary.filter(ex => isExerciseAllowedForSession(ex.muscle, sessionName));
        chosen = relaxPool.sort(() => 0.5 - Math.random()).slice(0, 5);
      }
    }

    if (chosen.length === 0) {
      chosen = isRestDay ? yogaLibrary.slice(0, 5) : universalLibrary.slice(0, 5);
    }

    const prepared = shuffledExercises(chosen, baselineData);
    setExercises(prepared);
    onStartSession(sessionName, prepared);
  };

  function shuffle(array: any[]) {
    return array.sort(() => Math.random() - 0.5);
  }

  // Toggle Likes / Dislikes
  const toggleExercisePref = (type: 'like' | 'dislike', exIdx: number, ex: Exercise) => {
    const prefs = getPrefs();
    const exName = ex.name;
    if (type === 'like') {
      if (prefs.likes.includes(exName)) {
        prefs.likes = prefs.likes.filter((e: string) => e !== exName);
      } else {
        prefs.likes.push(exName);
        prefs.dislikes = prefs.dislikes.filter((e: string) => e !== exName);
      }
    } else {
      if (prefs.dislikes.includes(exName)) {
        prefs.dislikes = prefs.dislikes.filter((e: string) => e !== exName);
      } else {
        prefs.dislikes.push(exName);
        prefs.likes = prefs.likes.filter((e: string) => e !== exName);
      }
    }
    savePrefs(prefs);

    if (type === 'dislike' && prefs.dislikes.includes(exName)) {
      // If disliked, immediately ask user to replace it with an exercise of the same muscle group
      openExerciseSelector('swap', exIdx, ex);
    } else {
      setExercises([...exercises]); // Trigger component refresh
    }
  };

  const openExerciseSelector = (mode: 'swap' | 'add', exIdx: number | null = null, ex: Exercise | null = null) => {
    setSelectorMode(mode);
    setSwapIndex(exIdx);
    setSwapMuscleFilter(ex ? ex.muscle : null);
    setSelectorSearch('');
    setSelectorMuscleFilter(null);
    setSelectorOpen(true);
  };

  const fetchExerciseTips = async (name: string, muscle: string): Promise<any> => {
    const response = await fetch("/api/gemini/exercise-tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseName: name,
        muscle: muscle,
        userApiKey: undefined
      })
    });
    if (!response.ok) throw new Error("API error");
    return await response.json();
  };

  const handleSelectExercise = (newEx: any) => {
    if (selectorMode === 'swap' && swapIndex !== null) {
      const currentEx = exercises[swapIndex];
      const updated = [...exercises];
      const baseNewEx = {
        ...newEx,
        targetWeight: currentEx.targetWeight || 20,
        isTipsLoading: true
      };
      updated[swapIndex] = baseNewEx;

      // Replace sets
      const updatedSets = { ...sessionSets };
      const setLogs: SetLog[] = [];
      for (let i = 0; i < (newEx.sets || 3); i++) {
        setLogs.push({ w: currentEx.targetWeight || 20, r: 10 });
      }
      updatedSets[swapIndex] = setLogs;

      // Reset completed
      const updatedCompleted = { ...completedSets };
      for (let i = 0; i < (currentEx.sets || 5); i++) {
        delete updatedCompleted[`${swapIndex}-${i}`];
      }

      setExercises(updated);
      setSessionSets(updatedSets);
      setSessionCompletedSets(updatedCompleted);
      localStorage.setItem('aura_active_workout_data', JSON.stringify(updated));

      // Async fetch AI tips for the swapped exercise
      fetchExerciseTips(newEx.name, newEx.muscle)
      .then(data => {
        if (data && !data.error) {
          setExercises(prev => {
            const copy = [...prev];
            if (copy[swapIndex] && copy[swapIndex].name === newEx.name) {
              copy[swapIndex] = {
                ...copy[swapIndex],
                executionCue: data.executionCue,
                formGuide: data.formGuide,
                safetyTip: data.safetyTip,
                isTipsLoading: false
              };
              localStorage.setItem('aura_active_workout_data', JSON.stringify(copy));
            }
            return copy;
          });
        } else {
          setExercises(prev => {
            const copy = [...prev];
            if (copy[swapIndex]) copy[swapIndex].isTipsLoading = false;
            return copy;
          });
        }
      })
      .catch(err => {
        console.warn("Failed to fetch AI tips for swapped exercise:", err);
        setExercises(prev => {
          const copy = [...prev];
          if (copy[swapIndex]) copy[swapIndex].isTipsLoading = false;
          return copy;
        });
      });
    } else if (selectorMode === 'add') {
      const nextIdx = exercises.length;
      const baseNewEx = {
        ...newEx,
        isTipsLoading: true
      };
      const updated = [...exercises, baseNewEx];
      setExercises(updated);

      const updatedSets = { ...sessionSets };
      const logs: SetLog[] = [];
      for (let i = 0; i < (newEx.sets || 3); i++) {
        logs.push({ w: 0, r: 10 });
      }
      updatedSets[nextIdx] = logs;
      setSessionSets(updatedSets);
      localStorage.setItem('aura_active_workout_data', JSON.stringify(updated));

      // Async fetch AI tips for the added exercise
      fetchExerciseTips(newEx.name, newEx.muscle)
      .then(data => {
        if (data && !data.error) {
          setExercises(prev => {
            const copy = [...prev];
            if (copy[nextIdx] && copy[nextIdx].name === newEx.name) {
              copy[nextIdx] = {
                ...copy[nextIdx],
                executionCue: data.executionCue,
                formGuide: data.formGuide,
                safetyTip: data.safetyTip,
                isTipsLoading: false
              };
              localStorage.setItem('aura_active_workout_data', JSON.stringify(copy));
            }
            return copy;
          });
        } else {
          setExercises(prev => {
            const copy = [...prev];
            if (copy[nextIdx]) copy[nextIdx].isTipsLoading = false;
            return copy;
          });
        }
      })
      .catch(err => {
        console.warn("Failed to fetch AI tips for added exercise:", err);
        setExercises(prev => {
          const copy = [...prev];
          if (copy[nextIdx]) copy[nextIdx].isTipsLoading = false;
          return copy;
        });
      });
    }
    setSelectorOpen(false);
  };

  const onStartConfirm = () => {
    onStartSession(sessionName);
  };

  const handleFinishSet = (exIdx: number, setIdx: number) => {
    const key = `${exIdx}-${setIdx}`;
    const nextVal = !completedSets[key];
    setSessionCompletedSets(prev => ({
      ...prev,
      [key]: nextVal
    }));
    if (nextVal) {
      const activeSets = sessionSets[exIdx] || [];
      const isLastSet = activeSets.every((_, sIdx) => {
        if (sIdx === setIdx) return true;
        return completedSets[`${exIdx}-${sIdx}`];
      });
      if (!isLastSet) {
        startTimer(exIdx);
      }
    }
  };

  const handleSetWeightChange = (exIdx: number, setIdx: number, valStr: string) => {
    const updatedSets = { ...sessionSets };
    if (updatedSets[exIdx] && updatedSets[exIdx][setIdx]) {
      const parsedVal = valStr === '' ? '' as any : Number(valStr);
      const prevVal = updatedSets[exIdx][setIdx].w;
      updatedSets[exIdx][setIdx].w = parsedVal;

      const isCurrentSetDone = completedSets[`${exIdx}-${setIdx}`];

      // Propagate to subsequent uncompleted sets that are either unfilled, zero or matched previous value,
      // BUT ONLY IF the set we are currently editing hasn't been completed yet.
      if (!isCurrentSetDone) {
        for (let i = setIdx + 1; i < updatedSets[exIdx].length; i++) {
          const currentVal = updatedSets[exIdx][i].w;
          const isDone = completedSets[`${exIdx}-${i}`];
          if (!isDone) {
            if (currentVal === '' || currentVal === undefined || currentVal === 0 || currentVal === prevVal) {
              updatedSets[exIdx][i].w = parsedVal;
            }
          }
        }
      }
      setSessionSets(updatedSets);
    }
  };

  const handleSetRepsChange = (exIdx: number, setIdx: number, valStr: string) => {
    const updatedSets = { ...sessionSets };
    if (updatedSets[exIdx] && updatedSets[exIdx][setIdx]) {
      const parsedVal = valStr === '' ? '' as any : Number(valStr);
      const prevVal = updatedSets[exIdx][setIdx].r;
      updatedSets[exIdx][setIdx].r = parsedVal;

      const isCurrentSetDone = completedSets[`${exIdx}-${setIdx}`];

      // Propagate to subsequent uncompleted sets that are either unfilled, zero or matched previous value,
      // BUT ONLY IF the set we are currently editing hasn't been completed yet.
      if (!isCurrentSetDone) {
        for (let i = setIdx + 1; i < updatedSets[exIdx].length; i++) {
          const currentVal = updatedSets[exIdx][i].r;
          const isDone = completedSets[`${exIdx}-${i}`];
          if (!isDone) {
            if (currentVal === '' || currentVal === undefined || currentVal === 0 || currentVal === prevVal) {
              updatedSets[exIdx][i].r = parsedVal;
            }
          }
        }
      }
      setSessionSets(updatedSets);
    }
  };

  const handleAddSet = (exIdx: number) => {
    const updatedSets = { ...sessionSets };
    if (updatedSets[exIdx]) {
      const lastSet = updatedSets[exIdx][updatedSets[exIdx].length - 1] || { w: 0, r: 10 };
      updatedSets[exIdx].push({ ...lastSet });
      setSessionSets(updatedSets);
    }
  };

  const handleDeleteSet = (exIdx: number, setIdx: number) => {
    const updatedSets = { ...sessionSets };
    if (updatedSets[exIdx]) {
      updatedSets[exIdx] = updatedSets[exIdx].filter((_, idx) => idx !== setIdx);
      setSessionSets(updatedSets);

      // Clean up completed sets map
      const updatedCompleted = { ...completedSets };
      const newCompleted: Record<string, boolean> = {};
      Object.keys(updatedCompleted).forEach(key => {
        const parts = key.split('-');
        const currentExIdx = Number(parts[0]);
        const currentSetIdx = Number(parts[1]);
        if (currentExIdx === exIdx) {
          if (currentSetIdx < setIdx) {
            newCompleted[key] = updatedCompleted[key];
          } else if (currentSetIdx > setIdx) {
            newCompleted[`${exIdx}-${currentSetIdx - 1}`] = updatedCompleted[key];
          }
          // The deleted set index is skipped
        } else {
          newCompleted[key] = updatedCompleted[key];
        }
      });
      setSessionCompletedSets(newCompleted);

      // Clean up max effort sets map
      const updatedMaxEffort = { ...maxEffortSets };
      const newMaxEffort: Record<string, boolean> = {};
      Object.keys(updatedMaxEffort).forEach(key => {
        const parts = key.split('-');
        const currentExIdx = Number(parts[0]);
        const currentSetIdx = Number(parts[1]);
        if (currentExIdx === exIdx) {
          if (currentSetIdx < setIdx) {
            newMaxEffort[key] = updatedMaxEffort[key];
          } else if (currentSetIdx > setIdx) {
            newMaxEffort[`${exIdx}-${currentSetIdx - 1}`] = updatedMaxEffort[key];
          }
        } else {
          newMaxEffort[key] = updatedMaxEffort[key];
        }
      });
      setMaxEffortSets(newMaxEffort);
    }
  };

  const handleToggleMaxEffort = (exIdx: number, setIdx: number) => {
    const key = `${exIdx}-${setIdx}`;
    setMaxEffortSets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSetIntensity = (exIdx: number, rating: 'Makkelijk' | 'Perfect' | 'Maximaal') => {
    setIntensities(prev => ({
      ...prev,
      [exIdx]: rating
    }));
  };

  const handleCompleteWorkout = () => {
    // Formulate final workout logging objects
    const finishedExercises: HistoryExercise[] = [];
    let totalVolume = 0;

    exercises.forEach((ex, exIdx) => {
      // Skip yoga exercises from being logged in the history logbook
      const isYoga = yogaLibrary.some(y => y.name.toLowerCase() === ex.name.toLowerCase()) || 
                     (ex.equip || "").toLowerCase().includes("mat") || 
                     (ex.equip || "").toLowerCase().includes("lichaam") || 
                     (ex.equip || "").toLowerCase().includes("bodyweight") || 
                     ex.targetWeight === 0;

      if (isYoga) {
        return;
      }

      const activeSets = sessionSets[exIdx] || [];
      const loggedSets: SetLog[] = [];
      let exVol = 0;
      let topWeight = 0;

      activeSets.forEach((set, sIdx) => {
        if (completedSets[`${exIdx}-${sIdx}`]) {
          const wNum = Number(set.w) || 0;
          const rNum = Number(set.r) || 0;
          loggedSets.push({ w: wNum, r: rNum });
          exVol += wNum * rNum;
          if (wNum > topWeight) topWeight = wNum;
        }
      });

      if (loggedSets.length > 0) {
        finishedExercises.push({
          name: ex.name,
          muscle: ex.muscle,
          intensity: activeGroupIntensity(exIdx),
          sets: loggedSets,
          exerciseVolume: exVol,
          topWeight
        });
        totalVolume += exVol;
      }
    });

    if (finishedExercises.length === 0 && !isRestDay) {
      alert("Log minimaal 1 afgeronde set om de workout te bewaren!");
      return;
    }

    onFinishSession({
      name: sessionName,
      exercises: finishedExercises,
      totalSessionVolume: totalVolume,
      durationMinutes: Math.max(1, Math.round(workoutDurationSeconds / 60))
    });
  };

  const activeGroupIntensity = (exIdx: number): 'Makkelijk' | 'Perfect' | 'Maximaal' => {
    return (document.querySelector(`[data-intensity-for="${exID(exIdx)}"]`) as HTMLInputElement)?.value as any || 'Perfect';
  };

  const isExerciseDone = (exIndex: number) => {
    const setsRows = document.querySelectorAll(`[data-ex-idx="${exIndex}"] .set-row`);
    const logged = document.querySelectorAll(`[data-ex-idx="${exIndex}"].set-done`).length;
    return logged > 0 && logged === setsCount(exIndex);
  };

  // Minimal standard generators
  const pLikes = getPrefs().likes;
  const pDislikes = getPrefs().dislikes;

  return (
    <div className="w-full relative">
      {/* Loading Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-[#050505]/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${isRestDay ? 'bg-sky-500 shadow-[0_0_15px_#0284c7]' : 'bg-emerald-500 shadow-[0_0_15px_#34d399]'} animate-[scan_1.5s_infinite_ease-in-out_alternate]`} />
          <Loader2 className={`w-16 h-16 ${accentText} animate-spin mb-4`} />
          <h3 className="text-lg font-light text-gradient mb-1 text-center">
            Aura Coach Engine is actief...
          </h3>
          <p className={`text-[10px] uppercase tracking-widest ${accentTextMuted} text-center max-w-[240px] leading-relaxed`}>
            Biometrische factoren, hersteltijden en overload parameters worden berekend.
          </p>
        </div>
      )}

      {/* Empty State / Trigger Landing */}
      {isRestDay ? (
        userModel.restDayYogaEnabled === false ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center shadow-xl animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center mb-4 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <Heart className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              Lekker uitrusten vandaag!
            </h3>
            <p className="text-xs text-white/50 mb-4 max-w-[260px] leading-relaxed mx-auto">
              Je hebt yoga op rustdagen uitgeschakeld in je instellingen. Vandaag is een volledige rustdag voor optimaal spierherstel en supercompensatie.
            </p>
            <p className="text-[10px] text-white/40 italic">
              Bekijk je dagelijkse inzichten en biometrie op het dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header section with active recovery info */}
            <div className="bg-gradient-to-br from-sky-950/20 to-black/40 border border-sky-500/10 rounded-3xl p-6 shadow-xl animate-fadeIn relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 text-sky-400 mb-2">
                <Compass className="w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Actieve Hersteldag</h3>
              </div>
              <p className="text-xs text-white/70 leading-relaxed max-w-xl">
                Vandaag is gefocust op actief herstel, flexibiliteit en ontspanning. Gebruik onderstaande poses en mobiliteitsoefeningen om je spieren soepel te houden en je herstel te versnellen.
              </p>
            </div>

            {/* The beautiful Active Yoga & Mobility card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-300">
                  <Sparkles className="w-4.5 h-4.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Actieve Yoga & Mobiliteit</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                    {Object.keys(completedPoses).filter(k => completedPoses[k]).length} / 15 Poses
                  </span>
                  {Object.keys(completedPoses).filter(k => completedPoses[k]).length > 0 && (
                    <button 
                      onClick={handleResetSessionalYoga}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Categories Accordion */}
              <div className="space-y-3">
                {yogaCategories.map((cat, catIdx) => {
                  const isExpanded = activeYogaCategoryIndex === catIdx;
                  const completedInCat = cat.exercises.filter(ex => completedPoses[ex.name]).length;
                  const totalInCat = cat.exercises.length;
                  
                  return (
                    <div key={catIdx} className="border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden transition-all">
                      {/* Accordion Trigger Header */}
                      <button
                        onClick={() => setActiveYogaCategoryIndex(isExpanded ? null : catIdx)}
                        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.03] cursor-pointer"
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white/90">{cat.title}</span>
                            {completedInCat === totalInCat && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-white/40 font-light block">{cat.description}</span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[10px] bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full text-white/60 font-mono font-medium">
                            {completedInCat}/{totalInCat}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-white/40" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/40" />
                          )}
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-3 bg-black/40 border-t border-white/5 space-y-3 animate-fadeIn">
                          {cat.exercises.map((ex, exIdx) => {
                            const isDone = !!completedPoses[ex.name];
                            const isTimerActive = activeYogaTimerExercise?.name === ex.name;
                            
                            return (
                              <div key={exIdx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 space-y-3 relative overflow-hidden">
                                {isDone && <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-500/5 rotate-45 translate-x-8 -translate-y-8" />}
                                
                                <div className="flex items-start justify-between gap-4 relative z-10">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-xs font-bold text-white/90">{ex.name}</h4>
                                      <span className="text-[10px] text-sky-300 italic font-light">
                                        ({ex.sanskrit})
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-white/60 font-light leading-relaxed">
                                      {ex.description}
                                    </p>
                                  </div>
                                  
                                  {/* Completion Checkbox */}
                                  <button
                                    onClick={() => handleTogglePoseComplete(ex.name)}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                      isDone 
                                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' 
                                        : 'bg-white/5 border-white/10 text-transparent hover:border-white/30'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Optional Yoga Pose rest seconds and execution cue */}
                                {expandedYogaTips[ex.name] && (ex.restSeconds !== undefined || ex.executionCue) && (
                                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 space-y-1.5 text-[10px] text-white/70 relative z-10 animate-fadeIn">
                                    {ex.restSeconds !== undefined && (
                                      <div className="flex items-center gap-1.5">
                                        <Timer className="w-3 h-3 text-sky-400" />
                                        <span><strong>Rusttijd:</strong> {ex.restSeconds}s</span>
                                      </div>
                                    )}
                                    {ex.executionCue && (
                                      <div className="flex items-start gap-1.5 leading-relaxed">
                                        <Sparkles className="w-3 h-3 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
                                        <span><strong>Tip:</strong> {ex.executionCue}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Timer trigger & layout */}
                                <div className="flex items-center justify-between border-t border-white/5 pt-2.5 relative z-10">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                      <Timer className="w-3 h-3 text-sky-400" /> Duur: {yogaTimerDuration}s
                                    </span>
                                    {(ex.restSeconds !== undefined || ex.executionCue) && (
                                      <button
                                        onClick={() => setExpandedYogaTips(prev => ({ ...prev, [ex.name]: !prev[ex.name] }))}
                                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                                          expandedYogaTips[ex.name]
                                            ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                                            : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                        }`}
                                      >
                                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                        <span>Tip & Rust</span>
                                      </button>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => handleStartYogaTimer(ex)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isTimerActive
                                        ? 'bg-sky-500/20 border border-sky-400/30 text-sky-300 animate-pulse'
                                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                                    }`}
                                  >
                                    {isTimerActive ? (
                                      <>
                                        <Sparkles className="w-3 h-3 animate-spin" />
                                        Actief ({yogaTimerSecondsLeft}s)
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3 h-3 text-sky-300" />
                                        Start Timer
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Yoga Timer Panel */}
            {activeYogaTimerExercise && (
              <div className="bg-sky-950/50 border border-sky-400/30 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className="w-14 h-14 rounded-full border border-sky-400/30 flex items-center justify-center bg-sky-500/20 text-sky-300 shrink-0">
                    <span className="text-lg font-bold font-mono">{yogaTimerSecondsLeft}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-sky-400 font-bold block mb-0.5">Yoga Timer Actief</span>
                    <p className="text-xs font-bold text-white">{activeYogaTimerExercise.name}</p>
                    <span className="text-[9px] text-white/40 italic block">{activeYogaTimerExercise.sanskrit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                  {/* Pause / Play */}
                  <button
                    onClick={() => setYogaTimerIsRunning(!yogaTimerIsRunning)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
                  >
                    {yogaTimerIsRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-sky-300" />}
                  </button>
                  
                  {/* Reset */}
                  <button
                    onClick={() => {
                      setYogaTimerSecondsLeft(yogaTimerDuration);
                      setYogaTimerIsRunning(false);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Close / Cancel */}
                  <button
                    onClick={() => {
                      setActiveYogaTimerExercise(null);
                      setYogaTimerIsRunning(false);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        !activeWorkoutData ? (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Header section with status */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${accentBg} flex items-center justify-center border ${accentBorder}`}>
                    <Dumbbell className={`w-4 h-4 ${accentText}`} />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest block font-semibold">Focus van Vandaag</span>
                    <h3 className="text-lg font-light tracking-wide text-white">{isRestDay ? 'Actieve Rust & Stretch' : sessionName}</h3>
                  </div>
                </div>
                
                {isUpgradingWithAI ? (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] text-emerald-400 font-semibold animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>Aura AI optimaliseert...</span>
                  </div>
                ) : (
                  <div className={`flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[10px] text-white/60 font-semibold`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isRestDay ? 'text-sky-400' : 'text-emerald-400'}`} />
                    <span>Gepersonaliseerd</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-white/60 font-light leading-relaxed mb-4">
                {isRestDay 
                  ? "Een rustdag is essentieel voor spiergroei! Aura heeft een herstellende routine samengesteld om je mobiliteit, doorbloeding en herstel te versnellen."
                  : "Aura heeft je biometrie, herstelscores en eerdere prestaties geanalyseerd om dit schema op te bouwen. Focus ligt op maximale spierprikkeling (Groei #1)."}
              </p>

              {/* Instant Start button */}
              {(() => {
                const warmupExercise = preparedExercises ? preparedExercises.find(ex => ex.name.toLowerCase().includes('warming-up')) : null;
                const strengthExercises = preparedExercises ? preparedExercises.filter(ex => ex !== warmupExercise) : [];
                
                return (
                  <button
                    onClick={() => {
                      if (preparedExercises && preparedExercises.length > 0) {
                        onStartSession(sessionName, strengthExercises);
                      }
                    }}
                    disabled={loading || !preparedExercises || preparedExercises.length === 0}
                    className={`w-full py-3.5 ${accentBtn} text-xs font-bold uppercase tracking-[0.2em] rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg hover:brightness-110 cursor-pointer`}
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Start Direct ({strengthExercises.length} oefeningen)</span>
                  </button>
                );
              })()}
            </div>

            {/* Exercises List Preview */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">Inbegrepen in deze sessie</span>
                <button
                  onClick={handleGenerateWorkout}
                  disabled={loading}
                  className="text-[11px] text-white/40 hover:text-white/80 transition-all flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/5 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span>{loading ? 'Herschrijven...' : 'Nu Regenereren'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {preparedExercises && preparedExercises.length > 0 ? (() => {
                  const warmupExercise = preparedExercises ? preparedExercises.find(ex => ex.name.toLowerCase().includes('warming-up')) : null;
                  const strengthExercises = preparedExercises ? preparedExercises.filter(ex => ex !== warmupExercise) : [];

                  return (
                    <>
                      {/* Premium Coach Warming-up Tip Card */}
                      {warmupExercise && (
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-3xl p-5 relative overflow-hidden mb-4 shadow-xl animate-fadeIn">
                          {/* Glow overlay */}
                          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                          
                          <div className="flex gap-4">
                            {/* Visual Thumbnail */}
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative flex items-center justify-center">
                              <ExerciseThumbnail 
                                name={warmupExercise.name} 
                                muscle={warmupExercise.muscle} 
                                imageUrl={warmupExercise.imageUrl || (warmupExercise as any).image} 
                                images={warmupExercise.images} 
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Coach Warming-up Tip</span>
                              </div>
                              
                              <h3 className="text-sm font-semibold text-white leading-tight">
                                {warmupExercise.name}
                              </h3>
                              
                              <p className="text-xs text-white/70 font-light mt-1.5 leading-relaxed">
                                {warmupExercise.executionCue || "Doe 5-10 minuten lichte cardio om je spieren en gewrichten voor te bereiden."}
                              </p>

                              <div className="flex items-center gap-3 mt-3.5 text-[9px] text-white/50 font-mono">
                                <span className="bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 flex items-center gap-1">
                                  ⏱️ {warmupExercise.reps || "5-10 min"}
                                </span>
                                <span className="bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 flex items-center gap-1">
                                  ⚡ {warmupExercise.equip || "Cardio"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Main Strength Lifts List */}
                      {strengthExercises.map((ex, idx) => (
                        <div 
                          key={idx}
                          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all hover:bg-white/[0.07]"
                        >
                          <div className="flex items-center gap-3">
                            <ExerciseThumbnail 
                              name={ex.name} 
                              muscle={ex.muscle} 
                              imageUrl={ex.imageUrl || (ex as any).image} 
                              images={ex.images} 
                              className="w-11 h-11 rounded-xl"
                            />
                            <div>
                              <h4 className="text-sm font-medium text-white leading-snug">{ex.name}</h4>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-white/40 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                  {ex.muscle}
                                </span>
                                <span className="text-[10px] text-white/40 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                  {ex.equip}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-semibold text-white/90">
                              {ex.sets} sets x {ex.reps}
                            </p>
                            {ex.targetWeight > 0 && (
                              <p className={`text-[10px] font-mono mt-0.5 ${isRestDay ? 'text-sky-300' : 'text-emerald-400'}`}>
                                {ex.targetWeight} kg
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })() : (
                  <div className="py-8 text-center text-white/30 text-xs font-light">
                    Sessie wordt klaargezet...
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
        /* Active session dashboard */
        <div className="flex flex-col gap-6">
          {/* Offline Mode Banner */}
          {isOfflineMode && !isInputFocused && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl p-4 text-xs flex items-start gap-3 shadow-md animate-fadeIn">
              <Sparkles className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-0.5">
                  {offlineReason === 'network' ? 'Slechte Verbinding / Offline' : 'Aura Offline Mode'}
                </p>
                <p className="text-white/70 leading-relaxed text-[11px]">
                  {offlineReason === 'network' 
                    ? 'Je hebt momenteel een zwakke internetverbinding (bijv. in de sportschool). Aura heeft je training direct geladen vanuit je lokale, gepersonaliseerde database zodat je zonder onderbreking kunt doortrainen!'
                    : 'Vanwege tijdelijke serverdrukte of quota-limieten draaien we momenteel op de geoptimaliseerde lokale database. Je schema is volledig gepersonaliseerd op basis van je split en biometrie!'}
                </p>
              </div>
            </div>
          )}

          {/* Sessievoortgang Banner */}
          <div className={`sticky top-0 z-40 bg-[#0c0d0e]/95 backdrop-blur-md p-4 -mx-1 rounded-3xl border border-white/5 flex flex-col gap-2.5 shadow-2xl transition-all ${isInputFocused ? 'hidden' : 'flex'}`}>
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-white/50 font-bold">
                  Sessievoortgang
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-white/80`}>
                  {completedSetsCount}/{totalSetsInSession} sets ({Math.round(pctCompletedSets)}%)
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 text-right font-mono text-xs text-white/70">
                <span className="text-white/45 text-[11px]">🕒</span>
                <span>{Math.floor(workoutDurationSeconds / 60)}m {workoutDurationSeconds % 60 < 10 ? '0' : ''}{workoutDurationSeconds % 60}s</span>
              </div>
            </div>

            {/* Training Overall Progress Line */}
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${isRestDay ? 'from-sky-500 to-sky-400' : 'from-emerald-500 to-emerald-400'} rounded-full transition-all duration-500`}
                style={{ width: `${pctCompletedSets}%` }}
              />
            </div>
          </div>

          {/* Exercises Cards */}
          <div className="flex flex-col gap-6">
            {exercises.map((ex, exIdx) => {
              const activeSets = sessionSets[exIdx] || [];
              const isLiked = pLikes.includes(ex.name);
              const isDisliked = pDislikes.includes(ex.name);
              const intensityVal = intensities[exIdx] || 'Perfect';
              const exerciseCompletedSetsCount = activeSets.filter((_, sIdx) => completedSets[`${exIdx}-${sIdx}`]).length;
              const allSetsCompleted = activeSets.length > 0 && activeSets.every((_, sIdx) => completedSets[`${exIdx}-${sIdx}`]);
              const isGrayedOut = timerActive && timerExerciseIdx !== null && timerExerciseIdx !== exIdx;

              return (
                <div
                  key={exIdx}
                  className={`border rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${
                    isGrayedOut
                      ? 'opacity-20 grayscale pointer-events-none select-none border-white/5 bg-[#08090a]'
                      : allSetsCompleted 
                        ? isRestDay
                          ? 'bg-sky-950/15 border-sky-500/35 shadow-[0_0_25px_rgba(14,165,233,0.06)]'
                          : 'bg-emerald-950/15 border-emerald-500/35 shadow-[0_0_25px_rgba(16,185,129,0.06)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/[0.07] transition-all'
                  }`}
                >
                  {/* Banner aspect ratio photo */}
                  <div 
                    onClick={() => {
                      setSelectedDetailExercise(ex);
                      setSelectedDetailExerciseIdx(exIdx);
                      setIsDetailModalOpen(true);
                    }}
                    className={`relative min-h-[5.5rem] py-4 px-5 bg-gradient-to-r ${isRestDay ? 'from-sky-900/30' : 'from-emerald-900/30'} to-black/80 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none`}
                  >
                    <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${isRestDay ? 'from-sky-500/10' : 'from-emerald-500/10'} via-transparent to-transparent pointer-events-none`} />
                    
                    {/* Left: Exercise Info & Metadata */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <ExerciseThumbnail name={ex.name} muscle={ex.muscle} imageUrl={ex.imageUrl || (ex as any).image} images={ex.images} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                            <span>{ex.name}</span>
                            <Info className="w-3.5 h-3.5 text-white/30 shrink-0" />
                            {allSetsCompleted ? (
                              <span className={`inline-flex items-center gap-1 ${isRestDay ? 'bg-sky-500/20 border-sky-500/30 text-sky-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'} text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full animate-pulse shrink-0`}>
                                <Check className="w-2.5 h-2.5 stroke-[3px]" /> Voltooid
                              </span>
                            ) : exerciseCompletedSetsCount > 0 ? (
                              <span className={`inline-flex items-center gap-1 bg-white/10 border border-white/10 text-white/80 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shrink-0`}>
                                {exerciseCompletedSetsCount}/{activeSets.length} Sets
                              </span>
                            ) : null}
                          </h4>
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest ${accentText} font-bold block mt-1`}>
                          {ex.muscle} • {ex.equip} • {ex.sets} sets • Rust: {ex.restSeconds !== undefined ? ex.restSeconds : defaultRestSeconds}s
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions (Likes, Dislikes, Swap, Chevron) */}
                    <div className="flex items-center gap-1.5 shrink-0 z-10 self-end md:self-auto flex-wrap" onClick={e => e.stopPropagation()}>
                      {timerActive && timerExerciseIdx === exIdx && (
                        <button
                          onClick={skipTimer}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-mono text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                            isRestDay 
                              ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20' 
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title="Klik om rust over te slaan"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isRestDay ? 'bg-sky-400' : 'bg-emerald-400'} animate-ping`} />
                          <span>Rust: {timerSeconds}s</span>
                        </button>
                      )}

                      <button
                        onClick={() => openExerciseSelector('swap', exIdx, ex)}
                        className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-wider text-white/70 hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Wissel</span>
                      </button>

                      <button
                        onClick={() => toggleExercisePref('like', exIdx, ex)}
                        className={`p-2 rounded-xl transition-colors border ${
                          isLiked ? `${accentText} ${accentBg} ${accentBorderActive}` : 'text-white/35 hover:text-white/60 border-transparent hover:bg-white/5'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleExercisePref('dislike', exIdx, ex)}
                        className={`p-2 rounded-xl transition-colors border ${
                          isDisliked ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-white/35 hover:text-white/60 border-transparent hover:bg-white/5'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDetailExercise(ex);
                          setSelectedDetailExerciseIdx(exIdx);
                          setIsDetailModalOpen(true);
                        }}
                        className={`p-2 px-3 rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                          isRestDay
                            ? 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/25'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Loggen & Info
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add custom random extra exercises */}
          <button
            onClick={() => openExerciseSelector('add')}
            className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-3xl text-xs font-bold uppercase tracking-[0.1em] text-white/60 hover:text-white transition-all text-center border border-dashed border-white/20 mt-1"
          >
            + Oefening Toevoegen
          </button>

          {/* Finish & Cancel CTAs */}
          <div className="flex flex-col gap-3 mt-6 pb-16">
            <button
              onClick={handleCompleteWorkout}
              className={`w-full py-4.5 bg-gradient-to-r ${isRestDay ? 'from-sky-950/40 to-sky-600/40 border border-sky-500/30 text-sky-100 shadow-[0_0_25px_rgba(14,165,233,0.1)]' : 'from-emerald-950/40 to-emerald-600/40 border border-emerald-500/30 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.1)]'} text-xs font-bold uppercase tracking-[0.2em] rounded-3xl active:scale-[0.99] transition-all`}
            >
              Workout Afronden
            </button>
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full py-2.5 text-xs text-red-400/50 hover:text-red-400 uppercase tracking-widest transition-colors text-center"
              >
                Sessie Annuleren
              </button>
            ) : (
              <div className="flex flex-col gap-2.5 bg-red-500/5 border border-red-500/25 rounded-3xl p-5 mt-2 text-center">
                <span className="text-[11px] text-red-400 uppercase tracking-wider font-bold">
                  ⚠️ Weet je zeker dat je wilt afbreken? Al je gelogde sets gaan verloren.
                </span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <button
                    onClick={onCancelSession}
                    className="bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold uppercase tracking-widest px-4.5 py-2.5 rounded-xl hover:bg-red-500/30 transition-all active:scale-95"
                  >
                    Ja, breek af
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest px-4.5 py-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all active:scale-95"
                  >
                    Nee, ga door
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Exercise Selector Modal */}
      {selectorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
          <div className="bg-zinc-950 sm:border border-white/5 w-full max-w-lg h-[85vh] sm:h-[80vh] sm:rounded-3xl flex flex-col animate-slideUp">
            
            <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-white text-base font-bold font-sans">
                  {selectorMode === 'swap' ? 'Oefening Wisselen' : 'Oefening Toevoegen'}
                </h3>
                <p className="text-white/40 text-[11px] uppercase tracking-widest mt-1">
                  Kies een nieuwe oefening uit de bibliotheek
                </p>
              </div>
              <button 
                onClick={() => setSelectorOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filters deck */}
            <div className="p-4 border-b border-white/5 flex flex-col gap-3 shrink-0 bg-zinc-950">
              {/* Search input bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Zoek op naam of spiergroep..."
                  value={selectorSearch}
                  onChange={(e) => setSelectorSearch(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/[0.08] focus:bg-white/[0.08] border border-white/5 focus:border-white/10 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
                />
                {selectorSearch && (
                  <button
                    onClick={() => setSelectorSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-white/40 hover:text-white px-1.5 py-1 rounded bg-white/5 transition-colors cursor-pointer"
                  >
                    wis
                  </button>
                )}
              </div>

              {/* Muscle category filter tags - hide if in swap mode with strict filter */}
              {!(selectorMode === 'swap' && swapMuscleFilter) && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                  <button
                    onClick={() => setSelectorMuscleFilter(null)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      !selectorMuscleFilter
                        ? isRestDay
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Alle spieren
                  </button>
                  {(() => {
                    const libraryToUse = isRestDay ? yogaLibrary : fallbackLibrary;
                    const prefs = getPrefs();
                    const availableEquip = userModel.equipment || ["Bodyweight Alleen"];
                    let basePool = libraryToUse.filter(ex => 
                      !prefs.dislikes.includes(ex.name) &&
                      (isRestDay ? true : isEquipmentAvailable(ex.equip || "", availableEquip))
                    );
                    
                    if (selectorMode === 'add') {
                      basePool = isRestDay ? basePool : basePool.filter(ex => isExerciseAllowedForSession(ex.muscle, sessionName));
                    }
                    
                    const uniqueMuscles = Array.from(new Set(basePool.map(e => e.muscle)));
                    return uniqueMuscles.map(muscle => {
                      const isActive = selectorMuscleFilter === muscle;
                      return (
                        <button
                          key={muscle}
                          onClick={() => setSelectorMuscleFilter(isActive ? null : muscle)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                            isActive
                              ? isRestDay
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {muscle}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-5">
              {(() => {
                const prefs = getPrefs();
                const libraryToUse = isRestDay ? yogaLibrary : fallbackLibrary;
                const availableEquip = userModel.equipment || ["Bodyweight Alleen"];
                let pool = libraryToUse.filter(ex => 
                  !prefs.dislikes.includes(ex.name) &&
                  (isRestDay ? true : isEquipmentAvailable(ex.equip || "", availableEquip))
                );
                
                if (selectorMode === 'swap' && swapMuscleFilter) {
                  pool = pool.filter(ex => (ex.muscle || "").toLowerCase() === swapMuscleFilter.toLowerCase());
                } else if (selectorMode === 'add') {
                  pool = isRestDay ? pool : pool.filter(ex => isExerciseAllowedForSession(ex.muscle, sessionName));
                }

                // If pool is empty due to strict filters, relax them slightly
                if (pool.length === 0 && selectorMode === 'swap') {
                  pool = libraryToUse.filter(ex => (ex.muscle || "").toLowerCase() === (swapMuscleFilter || "").toLowerCase());
                }

                // Filter by interactive muscle chip
                if (selectorMuscleFilter) {
                  pool = pool.filter(ex => ex.muscle === selectorMuscleFilter);
                }
                // Filter by search text
                if (selectorSearch.trim()) {
                  const searchLower = selectorSearch.toLowerCase();
                  pool = pool.filter(ex => 
                    ex.name.toLowerCase().includes(searchLower) ||
                    ex.muscle.toLowerCase().includes(searchLower) ||
                    (ex.equip || '').toLowerCase().includes(searchLower)
                  );
                }

                if (pool.length === 0) {
                  return (
                    <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-3 animate-fadeIn">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">Geen oefeningen gevonden</p>
                        <p className="text-white/40 text-xs mt-1 max-w-xs mx-auto">Probeer een andere zoekterm of spiergroep filter.</p>
                      </div>
                    </div>
                  );
                }

                // Only group by muscle if we are not filtering by a single muscle
                const shouldGroup = !selectorMuscleFilter && !selectorSearch.trim();

                if (shouldGroup) {
                  const grouped: Record<string, typeof pool> = {};
                  pool.forEach(ex => {
                    if (!grouped[ex.muscle]) grouped[ex.muscle] = [];
                    grouped[ex.muscle].push(ex);
                  });

                  return Object.entries(grouped).map(([muscle, exercises]) => (
                    <div key={muscle} className="space-y-2.5">
                      <h4 className={`text-[10px] uppercase tracking-[0.2em] font-extrabold ${isRestDay ? 'text-sky-500' : 'text-emerald-500'} mb-2 ml-1`}>
                        {muscle}
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {exercises.map((ex, i) => (
                          <ExerciseSelectorCard
                            key={i}
                            ex={ex}
                            onSelect={handleSelectExercise}
                            accentText={accentText}
                            isRestDay={!!isRestDay}
                          />
                        ))}
                      </div>
                    </div>
                  ));
                } else {
                  return (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 gap-2">
                        {pool.map((ex, i) => (
                          <ExerciseSelectorCard
                            key={i}
                            ex={ex}
                            onSelect={handleSelectExercise}
                            accentText={accentText}
                            isRestDay={!!isRestDay}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
            
          </div>
        </div>
      )}

       {selectedDetailExercise && selectedDetailExerciseIdx !== null && (
        <ExerciseDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDetailExercise(null);
            setSelectedDetailExerciseIdx(null);
          }}
          exercise={selectedDetailExercise}
          exIdx={selectedDetailExerciseIdx}
          sessionSets={sessionSets}
          completedSets={completedSets}
          onSetWeightChange={handleSetWeightChange}
          onSetRepsChange={handleSetRepsChange}
          onFinishSet={handleFinishSet}
          onAddSet={handleAddSet}
          onDeleteSet={handleDeleteSet}
          intensities={intensities}
          onSetIntensity={handleSetIntensity}
          isRestDay={isRestDay}
          accentText={accentText}
          accentBg={accentBg}
          accentBorderActive={accentBorderActive}
          history={history}
          timerActive={timerActive}
          timerSeconds={timerSeconds}
          timerExerciseIdx={timerExerciseIdx}
          onSkipTimer={skipTimer}
          maxEffortSets={maxEffortSets}
          onToggleMaxEffort={handleToggleMaxEffort}
          baselineData={baselineData}
          onUpdateBaseline={onUpdateBaseline}
        />
      )}
    </div>
  );
}

function exID(idx: number) {
  return `ex-int-${idx}`;
}

function setsCount(idx: number) {
  const container = document.querySelector(`[data-ex-idx="${idx}"] .sets-container`);
  return container ? container.children.length : 3;
}

function shuffledExercises(chosen: any[], baseline?: any): Exercise[] {
  return chosen.map(c => {
    let weight = c.targetWeight || 0;
    if (weight === 0 && baseline) {
      const m = (c.muscle || "").toLowerCase();
      const name = (c.name || "").toLowerCase();
      if (m.includes('borst') || m.includes('chest') || name.includes('bench press') || name.includes('pec deck')) {
        weight = baseline.benchPressWeight || 40;
      } else if (m.includes('quadriceps') || m.includes('benen') || m.includes('glute') || m.includes('hamstring') || name.includes('squat') || name.includes('leg press')) {
        weight = baseline.squatWeight || 50;
      } else if (m.includes('rug') || m.includes('back') || name.includes('pulldown') || name.includes('row')) {
        weight = baseline.latPulldownWeight || 40;
      } else if (m.includes('schouder') || m.includes('shoulder') || name.includes('press') || name.includes('raise')) {
        weight = baseline.overheadPressWeight || 25;
      } else if (m.includes('biceps') || m.includes('triceps') || name.includes('curl') || name.includes('pushdown')) {
        weight = Math.round((baseline.benchPressWeight || 40) * 0.25);
      } else {
        weight = 15;
      }
    }
    return {
      name: c.name,
      muscle: c.muscle,
      equip: c.equip,
      sets: c.sets,
      reps: c.reps,
      targetWeight: weight > 0 ? weight : (c.targetWeight || 20),
      restSeconds: c.restSeconds,
      executionCue: c.executionCue,
      formGuide: c.formGuide,
      safetyTip: c.safetyTip,
      imageUrl: c.imageUrl,
      images: c.images,
      maxEffortTestDue: c.maxEffortTestDue
    };
  });
}

const universalLibrary = [
  { name: "Barbell Bench Press", muscle: "Borst", equip: "Barbell", sets: 3, reps: "10" },
  { name: "Overhead Dumbbell Press", muscle: "Schouders", equip: "Dumbbells", sets: 3, reps: "12" }
];
