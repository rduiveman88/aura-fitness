// Comprehensive high-quality exercise image mapping database and resolver
// This resolver combines the yuhonas/free-exercise-db with high-quality hand-curated Unsplash backups
// to ensure that EVERY exercise (including yoga and custom user exercises) has gorgeous, relevant visuals.

export const muscleGroupImages: Record<string, string> = {
  "Borst": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=500&q=80", // Chest press / bench
  "Rug": "https://images.unsplash.com/photo-1605296867304-46d5465a25f1?auto=format&fit=crop&w=500&q=80", // Pullup / Back
  "Schouders": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=500&q=80", // Shoulder press / DB
  "Biceps": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=500&q=80", // DB Bicep curl
  "Triceps": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=500&q=80", // Triceps pressdown
  "Quadriceps": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=500&q=80", // Leg workout / Squat
  "Hamstrings": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=500&q=80", // Leg curl
  "Gluten": "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?auto=format&fit=crop&w=500&q=80", // Bulgarian split squat / glutes
  "Kuiten": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=500&q=80", // Calf raises
  "Core": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=500&q=80", // Plank / Abs
  "Onderrug": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=500&q=80", // Yoga stretching back
  "Heupen": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=500&q=80", // Hip mobility
};

// Hand-picked Unsplash specific images ONLY for Yoga exercises and special moves
// that are not part of the standard free-exercise-db, ensuring zero mismatched images for fitness workouts.
const specificExerciseImages: Record<string, string[]> = {
  // Yoga / Rest Day - Clean, beautiful, precise poses
  "child's pose (balasana)": [
    "https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?auto=format&fit=crop&w=500&q=80"
  ],
  "downward-facing dog (adho mukha svanasana)": [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=500&q=80"
  ],
  "cobra pose (bhujangasana)": [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=500&q=80"
  ],
  "cat-cow stretch (marjaryasana)": [
    "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&w=500&q=80"
  ],
  "pigeon pose (kapotasana)": [
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80"
  ],
  "warrior ii (virabhadrasana ii)": [
    "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=500&q=80"
  ],
  "tree pose (vrikshasana)": [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=500&q=80"
  ],
  "sphinx pose (salamba bhujangasana)": [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=500&q=80"
  ],
  "bridge pose (setu bandhasana)": [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=500&q=80"
  ],
  "happy baby pose (ananda balasana)": [
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80"
  ],
  "corpse pose (savasana)": [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=500&q=80"
  ]
};

// Map known variations in naming to free-exercise-db compatible English folder names
const dbFolderMap: Record<string, string> = {
  // Chest / Borst
  "barbell bench press": "Barbell_Bench_Press",
  "decline barbell bench press": "Decline_Barbell_Bench_Press",
  "dumbbell bench press": "Dumbbell_Bench_Press",
  "incline dumbbell press": "Incline_Dumbbell_Press",
  "dumbbell incline bench press": "Incline_Dumbbell_Press",
  "chest press machine": "Chest_Press_Machine",
  "machine fly": "Machine_Fly",
  "cable flyes": "Cable_Flyes",
  "cable crossover fly": "Cable_Crossover",
  "dips (chest-focused)": "Chest_Dips",
  "pushups": "Pushups",
  "cable crossover": "Cable_Crossover",
  "dumbbell flyes": "Dumbbell_Flyes",

  // Back / Rug
  "barbell deadlift": "Barbell_Deadlift",
  "bent-over barbell row": "Bent_Over_Barbell_Row",
  "lat pulldown": "Lat_Pulldown",
  "wide-grip lat pulldown": "Wide-Grip_Lat_Pulldown",
  "seated cable row": "Seated_Cable_Row",
  "single-arm dumbbell row": "One_Arm_Dumbbell_Row",
  "pullups": "Pullups",
  "chin-up": "Chin-Up",
  "t-bar row with handle": "T-Bar_Row",
  "hyperextensions (back extensions)": "Back_Extensions",
  "face pulls": "Face_Pulls",

  // Legs / Benen & Gluten & Kuiten
  "barbell back squat": "Barbell_Squat",
  "barbell squat": "Barbell_Squat",
  "leg press": "Leg_Press",
  "leg extensions": "Leg_Extensions",
  "romanian deadlift (rdl)": "Romanian_Deadlift",
  "romanian deadlift": "Romanian_Deadlift",
  "seated / lying leg curl": "Lying_Leg_Curls",
  "lying leg curls": "Lying_Leg_Curls",
  "seated leg curl": "Seated_Leg_Curl",
  "bulgarian split squat": "Dumbbell_Bulgarian_Split_Squat",
  "hip thrust": "Barbell_Hip_Thrust",
  "standing calf raise": "Standing_Calf_Raises",
  "standing calf raises": "Standing_Calf_Raises",
  "seated calf raise": "Seated_Calf_Raise",
  "donkey calf raises": "Donkey_Calf_Raises",
  "single leg glute bridge": "Single_Leg_Glute_Bridge",
  "cable hip adduction": "Cable_Hip_Adduction",
  "hack squat": "Hack_Squat",
  "front squat (clean grip)": "Front_Squat",
  "barbell walking lunge": "Barbell_Lunge",
  "goblet squat": "Goblet_Squat",

  // Shoulders / Schouders
  "overhead press": "Overhead_Press",
  "dumbbell shoulder press": "Dumbbell_Shoulder_Press",
  "dumbbell lateral raise": "Dumbbell_Lateral_Raise",
  "cable lateral raise": "Cable_Lateral_Raise",
  "standing military press": "Military_Press",
  "reverse pec deck fly": "Pec_Deck_Fly",
  "arnold dumbbell press": "Arnold_Dumbbell_Press",
  "front dumbbell raise": "Front_Dumbbell_Raise",
  "reverse flyes": "Reverse_Dumbbell_Flyes",
  "upright barbell row": "Upright_Barbell_Row",

  // Biceps
  "barbell / ez-bar curl": "Barbell_Curl",
  "barbell curl": "Barbell_Curl",
  "ez-bar curl": "EZ-Bar_Curl",
  "dumbbell bicep curl": "Dumbbell_Bicep_Curl",
  "dumbbell incline curl": "Incline_Dumbbell_Curl",
  "hammer curls": "Dumbbell_Hammer_Curls",
  "preacher curl": "Preacher_Curl",
  "concentration curls": "Concentration_Curls",

  // Triceps
  "triceps pushdown": "Cable_Triceps_Pushdown",
  "cable rope tricep extension": "Cable_Rope_Triceps_Pushdown",
  "overhead cable triceps extension": "Overhead_Cable_Triceps_Extension",
  "close-grip bench press": "Close-Grip_Barbell_Bench_Press",
  "close-grip barbell bench press": "Close-Grip_Barbell_Bench_Press",
  "skull crushers": "EZ-Bar_Skullcrusher",
  "dumbbell skullcrusher": "Dumbbell_Skullcrusher",
  "lying triceps press": "Lying_Triceps_Press",
  "standing overhead barbell triceps extension": "Overhead_Barbell_Triceps_Extension",

  // Core
  "hanging leg raise": "Hanging_Leg_Raise",
  "ab wheel rollout": "Ab_Wheel_Rollout",
  "cable crunch": "Cable_Crunch",
  "plank": "Plank",
  "russian twist": "Russian_Twist",
  "3/4 sit-up": "3_4_Sit-Up"
};

/**
 * Returns an array of image URLs to try in sequence for a given exercise.
 * Leverages the free-exercise-db as the primary source, with hand-picked Unsplash
 * specific alternatives, and falls back to Unsplash muscle group photos.
 */
export function getExerciseImages(exName: string, muscle: string): string[] {
  const normalized = exName.trim().toLowerCase();
  const urls: string[] = [];

  // 1. Check if we have hand-picked specific Unsplash images (mostly for Yoga poses)
  if (specificExerciseImages[normalized]) {
    urls.push(...specificExerciseImages[normalized]);
  }

  // 2. Add free-exercise-db primary images (both 0.jpg and 1.jpg)
  const dbFolder = dbFolderMap[normalized];
  if (dbFolder) {
    urls.push(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${dbFolder}/0.jpg`);
    urls.push(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${dbFolder}/1.jpg`);
  }

  // 3. Fallback to generalized free-exercise-db name folder parsing
  const parsedFolder = exName.replace(/['"()]/g, '').replace(/[\s\/]+/g, '_');
  if (parsedFolder && parsedFolder !== dbFolder) {
    urls.push(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${parsedFolder}/0.jpg`);
    urls.push(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${parsedFolder}/1.jpg`);
  }

  // 4. Ultimate high-quality muscle group Unsplash photo to guarantee no empty image
  const muscleImg = muscleGroupImages[muscle] || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=500&q=80";
  urls.push(muscleImg);

  // Return a unique array
  return Array.from(new Set(urls)).filter(Boolean);
}
