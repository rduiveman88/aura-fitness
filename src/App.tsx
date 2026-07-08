/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';

const AuraPermissions = registerPlugin<any>('AuraPermissions');
import { UserModel, WorkoutSession, FatigueInfo, MuscleGroup, ScheduleInfo, BaselineData } from './types';
import Dashboard from './components/Dashboard';
import Workout from './components/Workout';
import Logbook from './components/Logbook';
import SettingsPage from './components/Settings';
import Onboarding from './components/Onboarding';
import ProfileAuth, { UserProfile } from './components/ProfileAuth';
import Chat from './components/Chat';
import { AuraLogo } from './components/AuraLogo';
import { Home, Dumbbell, BookOpen, Settings, AlertCircle, Sparkles, LogOut, User as UserIcon, MessageSquare } from 'lucide-react';

const initialUserModel: UserModel = {
  name: "Gebruiker",
  age: 38,
  weight: 82.5,
  height: 180,
  goal: "Hypertrofie",
  daysPerWeek: 4,
  duration: 60,
  equipment: ["Barbell", "Dumbbells", "Flat Bench", "Squat Rack", "Cable Station"],
  apiKey: "",
  painPoints: [],
  splitPreference: 'auto'
};

const splits: Record<string, string[]> = {
  "Full Body": ["Full Body Focus"],
  "Upper / Lower": ["Upper Body Focus", "Lower Body Focus"],
  "Push / Pull / Legs": ["Push Focus", "Pull Focus", "Legs Focus"],
  "De Bro Split": ["Borst Focus", "Rug Focus", "Benen Focus", "Schouders Focus", "Armen Focus"]
};

export default function App() {
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workout' | 'chat' | 'logbook' | 'settings'>(() => {
    try {
      const saved = localStorage.getItem('aura_active_workout_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return 'workout';
      }
    } catch {}
    return 'dashboard';
  });
  const [userModel, setUserModel] = useState<UserModel>(initialUserModel);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [nextSession, setNextSession] = useState<string>('Upper Body Focus');
  const [activeWorkoutData, setActiveWorkoutData] = useState<any[] | null>(() => {
    try {
      const saved = localStorage.getItem('aura_active_workout_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading initial activeWorkoutData:", e);
    }
    return null;
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Overriding native alert to avoid DOMException crash inside sandboxed developer iframes
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      console.log("Aura Alert Intercepted:", message);
      let type: 'success' | 'error' | 'info' = 'info';
      const msg = (message || "").toLowerCase();
      if (msg.includes('succes') || msg.includes('opgeslagen') || msg.includes('gelukt') || msg.includes('✅') || msg.includes('🎉') || msg.includes('bewaren')) {
        type = 'success';
      } else if (msg.includes('fout') || msg.includes('mislukt') || msg.includes('minimaal') || msg.includes('geldig') || msg.includes('vul') || msg.includes('voer')) {
        type = 'error';
      }
      setToast({ message, type });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Auto dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- USER PROFILE STARTUP, AUTO-LOGIN & SYNCHRONIZATION ENGINES ---
  const handleLoginSuccess = (profile: UserProfile) => {
    setCurrentProfile(profile);
    setProfileLoading(false);
    setIsOnboarded(profile.baselineData !== null);
    localStorage.setItem('aura_logged_in_user_id', profile.id);

    // Populate state from profile
    setUserModel(profile.userModel);
    setBaselineData(profile.baselineData);
    setHistory(profile.history || []);
    setNextSession(profile.nextSession || 'Upper Body Focus');
    // Prefer local active workout data if it exists (handles app resume/crashes seamlessly)
    const localActiveWorkout = localStorage.getItem('aura_active_workout_data');
    let resolvedActiveWorkout = profile.activeWorkoutData;
    if (localActiveWorkout) {
      try {
        const parsed = JSON.parse(localActiveWorkout);
        if (Array.isArray(parsed) && parsed.length > 0) {
          resolvedActiveWorkout = parsed;
        }
      } catch (e) {
        console.error("Error parsing local active workout:", e);
      }
    }

    setActiveWorkoutData(resolvedActiveWorkout);

    // Write to standard localStorage keys so existing components can read/write instantly
    localStorage.setItem('aura_user_model', JSON.stringify(profile.userModel));
    if (profile.baselineData) {
      localStorage.setItem('aura_baseline_data', JSON.stringify(profile.baselineData));
    } else {
      localStorage.removeItem('aura_baseline_data');
    }
    localStorage.setItem('aura_history', JSON.stringify(profile.history || []));
    localStorage.setItem('aura_next_session', profile.nextSession || 'Upper Body Focus');
    localStorage.setItem('aura_onboarded', 'true');
    localStorage.setItem('aura_exercise_prefs', JSON.stringify(profile.exercisePrefs || { likes: [], dislikes: [], painNotes: [] }));

    if (resolvedActiveWorkout) {
      localStorage.setItem('aura_active_workout_data', JSON.stringify(resolvedActiveWorkout));
    } else {
      localStorage.removeItem('aura_active_workout_data');
    }

    // Force clear daily insight cache so it regenerates for this user specifically
    localStorage.removeItem('aura_cached_insight');
  };

  const handleLogOut = () => {
    setCurrentProfile(null);
    localStorage.removeItem('aura_logged_in_user_id');

    // Reset local states to default values
    setUserModel(initialUserModel);
    setBaselineData(null);
    setHistory([]);
    setSteps(0);
    setLastSync(null);
    setNextSession('Upper Body Focus');
    setActiveWorkoutData(null);
    setIsOnboarded(false);

    // Clear individual local storage keys
    localStorage.removeItem('aura_user_model');
    localStorage.removeItem('aura_baseline_data');
    localStorage.removeItem('aura_history');
    localStorage.removeItem('aura_steps');
    localStorage.removeItem('aura_last_sync');
    localStorage.removeItem('aura_next_session');
    localStorage.removeItem('aura_exercise_prefs');
    localStorage.removeItem('aura_onboarded');
    localStorage.removeItem('aura_active_workout_data');
    localStorage.removeItem('aura_active_workout_start_time');
    localStorage.removeItem('aura_active_workout_date');
    localStorage.removeItem('aura_active_session_sets');
    localStorage.removeItem('aura_active_completed_sets');
    localStorage.removeItem('aura_active_intensities');
    localStorage.removeItem('aura_cached_insight');

    setActiveTab('dashboard');
  };

  const syncProfile = async (updatedFields: Partial<UserProfile>) => {
    const savedId = localStorage.getItem('aura_logged_in_user_id');
    if (!savedId) return;

    // Capture latest states with optionals prefilled
    const updatedUserModel = updatedFields.userModel !== undefined ? updatedFields.userModel : userModel;
    const updatedBaselineData = updatedFields.baselineData !== undefined ? updatedFields.baselineData : baselineData;
    const updatedHistory = updatedFields.history !== undefined ? updatedFields.history : history;
    const updatedSteps = 0;
    const updatedLastSync = null;
    const updatedNextSession = updatedFields.nextSession !== undefined ? updatedFields.nextSession : nextSession;
    const updatedActiveWorkoutData = updatedFields.activeWorkoutData !== undefined ? updatedFields.activeWorkoutData : activeWorkoutData;
    const updatedExercisePrefs = updatedFields.exercisePrefs !== undefined ? updatedFields.exercisePrefs : JSON.parse(localStorage.getItem('aura_exercise_prefs') || '{"likes":[],"dislikes":[],"painNotes":[]}');

    const payload = {
      id: savedId,
      userModel: updatedUserModel,
      baselineData: updatedBaselineData,
      history: updatedHistory,
      steps: updatedSteps,
      lastSync: updatedLastSync,
      nextSession: updatedNextSession,
      activeWorkoutData: updatedActiveWorkoutData,
      exercisePrefs: updatedExercisePrefs
    };

    // Keep memory state in sync
    setCurrentProfile(prev => prev ? { ...prev, ...payload } : null);

    // Sync to Express API
    try {
      await fetch('/api/auth/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.log("Offline mode: profiles saved lokaal");
    }

    // Sync to Local Backup array (for offline capabilities)
    try {
      const local = localStorage.getItem('aura_local_profiles');
      let profiles: UserProfile[] = local ? JSON.parse(local) : [];
      const idx = profiles.findIndex(p => p.id === savedId);
      if (idx !== -1) {
        profiles[idx] = {
          ...profiles[idx],
          ...payload
        };
        localStorage.setItem('aura_local_profiles', JSON.stringify(profiles));
      }
    } catch (err) {
      console.error("Local profiles backup sync error:", err);
    }
  };

  // Auto-login check on mount
  useEffect(() => {
    async function checkAutoLogin() {
      const savedId = localStorage.getItem('aura_logged_in_user_id');
      if (!savedId) {
        setProfileLoading(false);
        return;
      }

      // Try secure server load
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout to prevent cold-start hanging

        const response = await fetch('/api/auth/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: savedId }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const profile: UserProfile = await response.json();
          handleLoginSuccess(profile);
          return;
        }
      } catch (err) {
        console.log("Server API offline or connection error during auto-login check, fetching offline profile", err);
      }

      // Offline fallback: load from local profiles backup list
      try {
        const local = localStorage.getItem('aura_local_profiles');
        if (local) {
          const profiles = JSON.parse(local) as UserProfile[];
          const match = profiles.find(p => p.id === savedId);
          if (match) {
            handleLoginSuccess(match);
            return;
          }
        }
      } catch (e) {
        console.error("Offline profile load error:", e);
      }

      setProfileLoading(false);
    }

    checkAutoLogin();
  }, []);

  // Native Android location permission request on load (if needed for weather or location features)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      async function requestAppPermissions() {
        try {
          const checkStatus = await AuraPermissions.checkPermissions();
          if (checkStatus.location !== 'granted') {
            await AuraPermissions.requestLocationPermission();
          }
        } catch (err) {
          console.error("Failed to request location permission on load:", err);
        }
      }
      requestAppPermissions();
    }
  }, []);

  // Compute recommended split name based on days per week
  const getSplitType = (days: number) => {
    if (userModel.splitPreference && userModel.splitPreference !== 'auto') {
      if (userModel.splitPreference === 'fullbody') return "Full Body";
      if (userModel.splitPreference === 'upperlower') return "Upper / Lower";
      if (userModel.splitPreference === 'ppl') return "Push / Pull / Legs";
      if (userModel.splitPreference === 'bro') return "De Bro Split";
    }
    if (days <= 3) return "Full Body";
    if (days === 4) return "Upper / Lower";
    if (days === 5) return "De Bro Split";
    return "Push / Pull / Legs";
  };

  // Monitor next session validation based on split focus
  useEffect(() => {
    const splitType = getSplitType(userModel.daysPerWeek);
    const cycle = splits[splitType] || ["Full Body Focus"];
    if (!cycle.includes(nextSession)) {
      setNextSession(cycle[0]);
      localStorage.setItem('aura_next_session', cycle[0]);
    }
  }, [userModel.daysPerWeek, nextSession]);

  // Compute schedule pattern prediction
  const computeSchedule = (): ScheduleInfo => {
    const daysNameMap = ['', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
    
    if (userModel.fixedDays && Array.isArray(userModel.fixedDays) && userModel.fixedDays.length > 0) {
      const todayJS = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const todayISO = todayJS === 0 ? 7 : todayJS; // 1 = Mon, ..., 7 = Sun
      
      const parsedDays = userModel.fixedDays.map(d => Number(d)).filter(d => !isNaN(d) && d >= 1 && d <= 7);
      if (parsedDays.length > 0) {
        const sortedDays = [...parsedDays].sort((a, b) => a - b);
        const isTodayTraining = sortedDays.includes(todayISO);
        
        let nextDayISO = sortedDays.find(d => d > todayISO);
        if (!nextDayISO) {
          nextDayISO = sortedDays[0];
        }
        
        const nextDayName = daysNameMap[nextDayISO];
        const todayName = daysNameMap[todayISO];
        
        let label = "19:00";
        if (Array.isArray(history) && history.length > 0) {
          const totalMinutes = history.reduce((sum, s) => {
            const d = new Date(s.timestamp);
            return sum + (d.getHours() * 60 + d.getMinutes());
          }, 0);
          const avgMinutes = totalMinutes / history.length;
          const hh = Math.floor(avgMinutes / 60);
          const mm = Math.round(avgMinutes % 60);
          label = `${hh < 10 ? '0' : ''}${hh}:${mm < 10 ? '0' : ''}${mm}`;
        }
        
        return {
          confidence: 'high',
          sessionsLogged: history?.length || 0,
          predictedLabel: label,
          dayName: isTodayTraining ? todayName : nextDayName,
          isNow: isTodayTraining,
          usedDaySpecific: true
        };
      }
    }

    if (!Array.isArray(history) || history.length < 3) return { confidence: 'none', sessionsLogged: history?.length || 0 };
    
    // Recent logs schedule calculation
    const totalMinutes = history.reduce((sum, s) => {
      const d = new Date(s.timestamp);
      return sum + (d.getHours() * 60 + d.getMinutes());
    }, 0);
    const avgMinutes = totalMinutes / history.length;
    const hh = Math.floor(avgMinutes / 60);
    const mm = Math.round(avgMinutes % 60);
    const label = `${hh < 10 ? '0' : ''}${hh}:${mm < 10 ? '0' : ''}${mm}`;

    const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
    const currentDay = days[new Date().getDay()];

    return {
      confidence: history.length >= 10 ? 'high' : history.length >= 6 ? 'medium' : 'low',
      sessionsLogged: history.length,
      predictedLabel: label,
      dayName: currentDay,
      isNow: true // display overlay banner
    };
  };

  // Calculate fatigue ratios for each muscle group dynamically based on history & steps
  const computeFatigue = (): Record<MuscleGroup, FatigueInfo> => {
    const groups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'core', 'lowerback', 'forearms'];
    const now = Date.now();
    const map: Record<MuscleGroup, FatigueInfo> = {
      chest: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 60 },
      back: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 72 },
      shoulders: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 48 },
      biceps: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 36 },
      triceps: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 36 },
      quadriceps: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 72 },
      hamstrings: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 72 },
      glutes: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 72 },
      calves: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 48 },
      core: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 36 },
      lowerback: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 72 },
      forearms: { ratio: 0, hoursSince: null, rawSets: 0, recoveryWindow: 36 }
    };

    const mapMuscleToGroup = (mStr?: string): MuscleGroup | null => {
      if (!mStr) return null;
      const m = mStr.toLowerCase();
      if (m.includes('onderrug') || m.includes('lower back') || m.includes('lowerback') || m.includes('deadlift')) return 'lowerback';
      if (m.includes('borst') || m.includes('chest') || m.includes('bench press') || m.includes('fly') || m.includes('pec deck') || m.includes('pushup')) return 'chest';
      if (m.includes('rug') || m.includes('back') || m.includes('lats') || m.includes('row') || m.includes('pulldown') || m.includes('pull up')) return 'back';
      if (m.includes('schouder') || m.includes('shoulder') || m.includes('lateral raise') || m.includes('overhead press') || m.includes('military press') || m.includes('face pull')) return 'shoulders';
      if (m.includes('triceps')) return 'triceps';
      if (m.includes('biceps')) return 'biceps';
      if (m.includes('forearm') || m.includes('onderarm') || m.includes('pols') || m.includes('wrist')) return 'forearms';
      if (m.includes('arm')) {
        const n = mStr.toLowerCase();
        if (n.includes('tricep') || n.includes('rope pushdown')) return 'triceps';
        if (n.includes('forearm') || n.includes('onderarm')) return 'forearms';
        return 'biceps';
      }
      if (m.includes('glute') || m.includes('billen') || m.includes('hip thrust') || m.includes('butt') || m.includes('gluteus')) return 'glutes';
      if (m.includes('hamstring') || m.includes('romanian deadlift') || m.includes('leg curl')) return 'hamstrings';
      if (m.includes('kuit') || m.includes('calf') || m.includes('calves') || m.includes('calf raise')) return 'calves';
      if (m.includes('quad') || m.includes('quadriceps') || m.includes('bovenbeen voor') || m.includes('squat') || m.includes('leg press') || m.includes('leg extension') || m.includes('lunge')) return 'quadriceps';
      if (m.includes('benen') || m.includes('leg')) {
        const n = mStr.toLowerCase();
        if (n.includes('squat') || n.includes('press') || n.includes('extension') || n.includes('lunge')) return 'quadriceps';
        if (n.includes('deadlift') || n.includes('curl') || n.includes('hamstring')) return 'hamstrings';
        if (n.includes('calf') || n.includes('kuit') || n.includes('heel')) return 'calves';
        return 'quadriceps';
      }
      if (m.includes('core') || m.includes('abs') || m.includes('buik') || m.includes('plank') || m.includes('crunch') || m.includes('situp')) return 'core';
      return null;
    };

    groups.forEach(g => {
      let cumulativeFatigue = 0;
      let hoursSinceLastWorkout: number | null = null;
      let totalSetsInHistory = 0;

      // Determine Recovery Window dynamically based on Muscle and User Profile criteria
      let recoveryWindow = map[g].recoveryWindow;

      // 1. Age Factor (Slower recovery with age)
      if (userModel.age > 45) {
        recoveryWindow = Math.round(recoveryWindow * 1.25);
      } else if (userModel.age < 24) {
        recoveryWindow = Math.round(recoveryWindow * 0.85);
      }

      // 2. Goal Factor (Athletes adapt and recover slightly faster)
      const userGoal = (userModel.goal || "").toLowerCase();
      if (userGoal.includes('herstel') || userGoal.includes('gezondheid')) {
        recoveryWindow = Math.round(recoveryWindow * 1.15);
      } else if (userGoal.includes('kracht') || userGoal.includes('hypertrofie') || userGoal.includes('spieropbouw') || userGoal.includes('atletisch')) {
        recoveryWindow = Math.round(recoveryWindow * 0.9);
      }

      // Accumulate fatigue contributions from ALL historical sessions
      (Array.isArray(history) ? history : []).forEach(session => {
        const hoursPassed = (now - session.timestamp) / (1000 * 60 * 60);
        if (hoursPassed > recoveryWindow) return; // fully recovered from this session

        let setsCount = 0;
        let exerciseNames = new Set<string>();
        let maxIntensity: 'Makkelijk' | 'Perfect' | 'Maximaal' = 'Makkelijk';
        let topWeight = 0;

        session.exercises.forEach(ex => {
          const muscleGroup = mapMuscleToGroup(ex.name) || mapMuscleToGroup(ex.muscle);
          if (muscleGroup === g) {
            setsCount += ex.sets.length;
            exerciseNames.add(ex.name);
            if (ex.intensity === 'Maximaal') {
              maxIntensity = 'Maximaal';
            } else if (ex.intensity === 'Perfect' && maxIntensity !== 'Maximaal') {
              maxIntensity = 'Perfect';
            }
            if (ex.topWeight > topWeight) {
              topWeight = ex.topWeight;
            }
          }
        });

        if (setsCount > 0) {
          totalSetsInHistory += setsCount;
          if (hoursSinceLastWorkout === null || hoursPassed < hoursSinceLastWorkout) {
            hoursSinceLastWorkout = hoursPassed;
          }

          // A. Define realistic saturation sets based on experience level & muscle group size
          const experience = baselineData?.experienceLevel || 'intermediate';
          const isLargeMuscle = ['chest', 'back', 'quadriceps', 'hamstrings', 'glutes'].includes(g);
          const baseSaturation = isLargeMuscle ? 12 : 8;
          const experienceScale = experience === 'beginner' ? 0.7 : experience === 'advanced' ? 1.4 : 1.0;
          const saturationSets = Math.max(3, Math.round(baseSaturation * experienceScale));

          let sessionFatigueContribution = setsCount / saturationSets;

          // B. Exercise Variety/Frequency Factor within session (e.g. training arms 1x vs 3x!)
          // If only 1 exercise, it limits muscle saturation. If 3+ separate exercises, it causes deep exhaustion.
          const exerciseCount = exerciseNames.size;
          let varietyMultiplier = 1.0;
          if (exerciseCount === 1) {
            varietyMultiplier = 0.55; // only 1 exercise doesn't cause total exhaustion
          } else if (exerciseCount === 2) {
            varietyMultiplier = 0.9;
          } else if (exerciseCount >= 3) {
            varietyMultiplier = 1.25; // high variety / volume density
          }

          // C. Training Duration Factor (hoe lang duurt de training)
          // Systemic fatigue scales up muscle exhaustion for longer workouts
          const duration = session.durationMinutes || 45;
          const durationMultiplier = Math.min(1.4, Math.max(0.6, duration / 45));

          // D. Subjective Intensity Multiplier
          let intensityMultiplier = 1.0;
          if (maxIntensity === 'Makkelijk') {
            intensityMultiplier = 0.65;
          } else if (maxIntensity === 'Maximaal') {
            intensityMultiplier = 1.25;
          }

          // E. Lift-to-Baseline Ratio Multiplier
          let weightMultiplier = 1.0;
          if (baselineData) {
            let baselineWeight = 0;
            if (g === 'chest') baselineWeight = baselineData.benchPressWeight || 0;
            else if (g === 'quadriceps' || g === 'hamstrings' || g === 'glutes') baselineWeight = baselineData.squatWeight || 0;
            else if (g === 'back') baselineWeight = baselineData.latPulldownWeight || 0;
            else if (g === 'shoulders') baselineWeight = baselineData.overheadPressWeight || 0;

            if (baselineWeight > 0 && topWeight > 0) {
              const weightRatio = topWeight / baselineWeight;
              if (weightRatio < 0.6) {
                weightMultiplier = 0.7;
              } else if (weightRatio > 1.1) {
                weightMultiplier = 1.15;
              }
            }
          }

          // Frequency penalty check: search for other sessions in the history that trained muscle group 'g'
          // and occurred within 36 hours of the current session.
          const hasConsecutive = (Array.isArray(history) ? history : []).some(otherSession => {
            if (otherSession.timestamp === session.timestamp) return false; // skip same session
            const diffHours = Math.abs(otherSession.timestamp - session.timestamp) / (1000 * 60 * 60);
            if (diffHours > 36) return false;
            return otherSession.exercises.some((ex: any) => {
              const otherGroup = mapMuscleToGroup(ex.name) || mapMuscleToGroup(ex.muscle);
              return otherGroup === g;
            });
          });
          const frequencyMultiplier = hasConsecutive ? 1.5 : 1.0;

          const addedFatigue = sessionFatigueContribution * varietyMultiplier * durationMultiplier * intensityMultiplier * weightMultiplier * frequencyMultiplier;
          const residualFatigue = Math.max(0, addedFatigue * (1 - (hoursPassed / recoveryWindow)));
          cumulativeFatigue += residualFatigue;
        }
      });

      let finalRatio = Math.min(1.0, cumulativeFatigue);

      map[g] = {
        ratio: finalRatio,
        hoursSince: hoursSinceLastWorkout,
        rawSets: totalSetsInHistory,
        recoveryWindow
      };
    });

    return map;
  };

  const handleSaveUserModel = (updated: UserModel) => {
    setUserModel(updated);
    localStorage.setItem('aura_user_model', JSON.stringify(updated));
    localStorage.removeItem('aura_cached_insight'); // force new insights next load
    localStorage.removeItem('aura_pregenerated_workout'); // force new workout generation on next view

    syncProfile({ userModel: updated });
  };

  const handleStartWorkout = () => {
    setActiveTab('workout');
  };

  const handleStartSessionConfirm = (session: string, exercises?: any[]) => {
    setNextSession(session);
    localStorage.setItem('aura_next_session', session);
    if (exercises) {
      // Filter out warming-up exercises from active tracking log sheets
      const filtered = exercises.filter(ex => !ex.name.toLowerCase().startsWith('warming-up'));
      setActiveWorkoutData(filtered);
      localStorage.setItem('aura_active_workout_data', JSON.stringify(filtered));
      localStorage.setItem('aura_active_workout_start_time', Date.now().toString());
      localStorage.setItem('aura_active_workout_date', new Date().toDateString());
      syncProfile({ nextSession: session, activeWorkoutData: filtered });
    } else {
      syncProfile({ nextSession: session });
    }
  };

  const handleUpdateBaseline = (updatedBaseline: BaselineData) => {
    setBaselineData(updatedBaseline);
    localStorage.setItem('aura_baseline_data', JSON.stringify(updatedBaseline));
    syncProfile({ baselineData: updatedBaseline });
    setToast({ message: "🏆 Kracht-baseline geoptimaliseerd! Toekomstige gewichten zijn gekalibreerd.", type: 'success' });
  };

  const handleCancelSession = () => {
    localStorage.removeItem('aura_active_workout_data');
    localStorage.removeItem('aura_active_workout_start_time');
    localStorage.removeItem('aura_active_workout_date');
    localStorage.removeItem('aura_active_session_sets');
    localStorage.removeItem('aura_active_completed_sets');
    localStorage.removeItem('aura_active_intensities');
    localStorage.removeItem('aura_active_max_effort_sets');
    setActiveWorkoutData(null);
    setActiveTab('dashboard');

    syncProfile({ activeWorkoutData: null });
  };

  const handleFinishSession = (results: { name: string; exercises: any[]; totalSessionVolume: number; durationMinutes?: number }) => {
    const sessionLog: WorkoutSession = {
      date: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      timestamp: Date.now(),
      name: results.name,
      exercises: results.exercises,
      totalSessionVolume: results.totalSessionVolume,
      durationMinutes: results.durationMinutes
    };

    const updatedHistory = [sessionLog, ...(Array.isArray(history) ? history : [])];
    setHistory(updatedHistory);
    localStorage.setItem('aura_history', JSON.stringify(updatedHistory));

    // Shift next cycle session focus
    const splitType = getSplitType(userModel.daysPerWeek);
    const cycle = splits[splitType] || ["Full Body Focus"];
    const currentIndex = cycle.indexOf(nextSession);
    const nextIndex = (currentIndex + 1) % cycle.length;
    const nextSessionName = cycle[nextIndex];
    setNextSession(nextSessionName);
    localStorage.setItem('aura_next_session', nextSessionName);

    localStorage.removeItem('aura_active_workout_data');
    localStorage.removeItem('aura_active_workout_start_time');
    localStorage.removeItem('aura_active_workout_date');
    localStorage.removeItem('aura_active_session_sets');
    localStorage.removeItem('aura_active_completed_sets');
    localStorage.removeItem('aura_active_intensities');
    localStorage.removeItem('aura_active_max_effort_sets');
    setActiveWorkoutData(null);
    localStorage.removeItem('aura_cached_insight'); // refresh insights
    
    alert("🎉 Workout succesvol opgeslagen! Fantastisch gedaan.");
    setActiveTab('dashboard');

    syncProfile({ 
      history: updatedHistory, 
      nextSession: nextSessionName, 
      activeWorkoutData: null 
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('aura_history');
    localStorage.removeItem('aura_cached_insight');
    localStorage.removeItem('aura_onboarded');
    localStorage.removeItem('aura_user_model');
    setIsOnboarded(false);
    setUserModel(initialUserModel);
    
    // Reset baseline assessment to start from absolute 0 onboarding state
    setBaselineData(null);
    localStorage.removeItem('aura_baseline_data');

    // Clear active workout session if any
    setActiveWorkoutData(null);
    localStorage.removeItem('aura_active_workout_data');
    localStorage.removeItem('aura_active_workout_start_time');
    localStorage.removeItem('aura_active_workout_date');
    localStorage.removeItem('aura_active_session_sets');
    localStorage.removeItem('aura_active_completed_sets');
    localStorage.removeItem('aura_active_intensities');

    setNextSession('Upper Body Focus');
    localStorage.setItem('aura_next_session', 'Upper Body Focus');

    syncProfile({
      history: [],
      userModel: initialUserModel,
      baselineData: null,
      activeWorkoutData: null,
      nextSession: 'Upper Body Focus'
    });
  };

  const fatigue = useMemo(() => computeFatigue(), [history, userModel.age, userModel.goal, userModel.daysPerWeek, baselineData]);
  const schedule = useMemo(() => computeSchedule(), [history, userModel]);
  const isRestDay = useMemo(() => !!(schedule.usedDaySpecific && !schedule.isNow), [schedule]);

  // Keep track of rest day transitions without auto-canceling active sessions
  const prevIsRestDayRef = useRef<boolean | null>(null);
  useEffect(() => {
    // We no longer auto-cancel active workouts when day type changes.
    // This allows active sessions to keep counting minutes and running without being abruptly reset.
    prevIsRestDayRef.current = isRestDay;
  }, [isRestDay]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center select-none font-sans">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-white/40 uppercase tracking-widest font-mono">AURA laden...</span>
      </div>
    );
  }

  if (!currentProfile) {
    return <ProfileAuth onLoginSuccess={handleLoginSuccess} isRestDay={isRestDay} />;
  }

  if (!isOnboarded) {
    return (
      <Onboarding
        onComplete={(profile, expLevel) => {
          setUserModel(profile);
          localStorage.setItem('aura_user_model', JSON.stringify(profile));
          localStorage.setItem('aura_onboarded', 'true');
          const initialBaseline = {
            experienceLevel: expLevel,
            completedAt: new Date().toISOString()
          };
          setBaselineData(initialBaseline);
          localStorage.setItem('aura_baseline_data', JSON.stringify(initialBaseline));
          setIsOnboarded(true);
          setActiveTab('dashboard');
          syncProfile({
            userModel: profile,
            baselineData: initialBaseline
          });
        }}
      />
    );
  }

  return (
    <div className="bg-[#050505] text-white font-sans antialiased h-[100dvh] w-full flex flex-col overflow-x-hidden overflow-y-hidden relative">
      {/* Background ambient glowing lights */}
      <div className={`fixed top-[-10%] left-[-10%] w-96 h-96 ${isRestDay ? 'bg-sky-600/10' : 'bg-emerald-600/10'} rounded-full filter blur-[120px] pointer-events-none animate-[pulse_10s_infinite_ease-in-out] z-0`} />
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full filter blur-[120px] pointer-events-none animate-[pulse_8s_infinite_ease-in-out_2s] z-0" />

      {/* Main Global Header */}
      <header className="p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex justify-between items-center border-b border-white/5 relative z-10 shrink-0 bg-[#050505]/75 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent flex items-center gap-1.5">
            <AuraLogo className="w-5 h-5" isRestDay={isRestDay} /> AURA Fitness
          </h1>
          <p className={`text-[9px] ${isRestDay ? 'text-sky-400' : 'text-emerald-400'} font-bold uppercase tracking-[0.25em] mt-0.5`}>
            PRO COACHING PLATFORM
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all active:scale-95 ${
              activeTab === 'settings'
                ? isRestDay
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main tab view content wrapper */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative p-6 pb-32">
        {activeTab === 'dashboard' && (
          <Dashboard
            userModel={userModel}
            history={history}
            fatigue={fatigue}
            onStartWorkout={handleStartWorkout}
            nextSession={nextSession}
            schedule={schedule}
            baselineData={baselineData}
          />
        )}

        <div className={activeTab === 'workout' ? 'contents' : 'hidden'}>
          <Workout
            userModel={userModel}
            sessionName={nextSession}
            activeWorkoutData={activeWorkoutData}
            onStartSession={handleStartSessionConfirm}
            onFinishSession={handleFinishSession}
            onCancelSession={handleCancelSession}
            isRestDay={isRestDay}
            history={history}
            onUpdateBaseline={handleUpdateBaseline}
            baselineData={baselineData}
          />
        </div>

        {activeTab === 'logbook' && (
          <Logbook
            history={history}
            onClearHistory={handleClearHistory}
            hasBaselineData={baselineData !== null}
            isRestDay={isRestDay}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            userModel={userModel}
            onSave={handleSaveUserModel}
            onClose={() => {
              setActiveTab('dashboard');
              syncProfile({
                exercisePrefs: JSON.parse(localStorage.getItem('aura_exercise_prefs') || '{"likes":[],"dislikes":[],"painNotes":[]}')
              });
            }}
            isRestDay={isRestDay}
            currentProfile={currentProfile}
            onLogOut={handleLogOut}
            history={history}
          />
        )}

        {activeTab === 'chat' && (
          <Chat
            userModel={userModel}
            history={history}
            fatigue={fatigue}
            isRestDay={isRestDay}
            onClose={() => setActiveTab('dashboard')}
          />
        )}
      </main>

      {/* Floating Bottom Glassy Navigation bar */}
      <div className="absolute bottom-6 left-6 right-6 z-40">
        {/* Ambient glow behind navigation bar to ensure glass backdrop-blur is always visible and beautiful */}
        <div className={`absolute -inset-1 rounded-full filter blur-lg opacity-25 pointer-events-none transition-all duration-500 ${
          isRestDay ? 'bg-sky-500/30' : 'bg-emerald-500/30'
        }`} />
        <nav className="bg-white/5 border border-white/10 rounded-full p-2 flex justify-between shadow-2xl backdrop-blur-lg relative z-10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 rounded-full flex flex-col items-center gap-1 transition-all mx-1 ${
              activeTab === 'dashboard'
                ? isRestDay
                  ? 'bg-sky-500/15 border border-sky-500/25 text-sky-400 shadow-lg'
                  : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 shadow-lg'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[8px] uppercase tracking-widest font-bold">For You</span>
          </button>

          <button
            onClick={() => setActiveTab('workout')}
            className={`flex-1 py-3 rounded-full flex flex-col items-center gap-1 transition-all mx-1 ${
              activeTab === 'workout'
                ? isRestDay
                  ? 'bg-sky-500/15 border border-sky-500/25 text-sky-400 shadow-lg'
                  : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 shadow-lg'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="text-[8px] uppercase tracking-widest font-bold">Training</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 rounded-full flex flex-col items-center gap-1 transition-all mx-1 ${
              activeTab === 'chat'
                ? isRestDay
                  ? 'bg-sky-500/15 border border-sky-500/25 text-sky-400 shadow-lg'
                  : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 shadow-lg'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[8px] uppercase tracking-widest font-bold">Aura Coach</span>
          </button>

          <button
            onClick={() => setActiveTab('logbook')}
            className={`flex-1 py-3 rounded-full flex flex-col items-center gap-1 transition-all mx-1 ${
              activeTab === 'logbook'
                ? isRestDay
                  ? 'bg-sky-500/15 border border-sky-500/25 text-sky-400 shadow-lg'
                  : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 shadow-lg'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[8px] uppercase tracking-widest font-bold">Logboek</span>
          </button>
        </nav>
      </div>

      {/* Safe Beautiful Custom Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
          <div className={`w-full max-w-md p-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-3 pointer-events-auto animate-slideDown ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100 shadow-emerald-950/20' 
              : toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/30 text-red-100 shadow-red-950/20'
              : 'bg-zinc-950/90 border-zinc-800 text-zinc-100 shadow-black/40'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : toast.type === 'error'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-zinc-800 text-zinc-400'
            }`}>
              {toast.type === 'success' ? (
                <Sparkles className="w-4 h-4 animate-pulse" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-zinc-400" />
              )}
            </div>
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.message}
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-white/40 hover:text-white/70 text-xs font-bold uppercase tracking-wider px-2 py-1 hover:bg-white/5 rounded-lg shrink-0 transition-colors"
            >
              Sluit
            </button>
          </div>
        </div>
      )}

      {/* Safe Beautiful Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-[#0b0b0b] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-black/80 animate-[scaleIn_0.2s_ease-out]">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4 border border-red-500/20">
                <LogOut className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Weet je zeker dat je wilt uitloggen?</h3>
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                Jouw profielgegevens en geschiedenis blijven veilig in de database bewaard. Je kunt de volgende keer gewoon weer inloggen.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all text-xs font-bold uppercase tracking-wider active:scale-95 cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    handleLogOut();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.25)] active:scale-95 cursor-pointer"
                >
                  Ja, Log Uit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
