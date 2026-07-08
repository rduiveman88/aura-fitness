/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';

const AuraPermissions = registerPlugin<any>('AuraPermissions');
import { FatigueInfo, MuscleGroup, UserModel, WorkoutSession, ScheduleInfo, BaselineData, ExercisePrefs } from '../types';
import BodyDiagram from './BodyDiagram';
import { 
  Activity, RefreshCw, Sun, Moon, CloudSun, Brain, Award, Info, Flame, Zap, 
  ShieldAlert, Sparkles, TrendingUp, ArrowRight, ChevronDown, ChevronUp, 
  Play, Pause, RotateCcw, Check, CheckCircle2, Heart, Compass, Timer, X,
  Cloud, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, Trophy
} from 'lucide-react';

export interface YogaExercise {
  name: string;
  sanskrit: string;
  description: string;
  restSeconds?: number;
  executionCue?: string;
}

export interface YogaCategory {
  title: string;
  description: string;
  exercises: YogaExercise[];
}

export const yogaCategories: YogaCategory[] = [
  {
    title: "Volledige Achterste Keten (Rug, Hamstrings & Kuiten)",
    description: "Gericht op decompressie en diepe verlenging van de gehele achterkant van je lichaam.",
    exercises: [
      {
        name: "Downward-Facing Dog",
        sanskrit: "Adho Mukha Svanasana",
        description: "Omgekeerde V-vorm die de gehele achterkant van het lichaam stretcht, met name de hamstrings, kuiten en de brede rugspier (lats).",
        restSeconds: 20,
        executionCue: "Duw je hielen zachtjes richting de grond en spreid je vingers breed om de druk te verdelen."
      },
      {
        name: "Seated Forward Fold",
        sanskrit: "Paschimottanasana",
        description: "Zittende vooroverbuiging gericht op een diepe stretch van de hamstrings en de lagere wervelkolom."
      },
      {
        name: "Standing Forward Fold",
        sanskrit: "Uttanasana",
        description: "Staande vooroverbuiging waarbij de zwaartekracht helpt om tension in de nek, rug en hamstrings los te laten."
      }
    ]
  },
  {
    title: "Heupen & Liezen (Hip Openers)",
    description: "Zorgt voor mobiliteit in het bekkengebied en ontgrendelt stijve heupspieren na zware trainingen.",
    exercises: [
      {
        name: "Pigeon Pose",
        sanskrit: "Eka Pada Rajakapotasana",
        description: "Diepe stretch voor de heupbuigers (psoas), glutes en piriformis; uiterst effectief na zware been- of rugtrainingen.",
        restSeconds: 15,
        executionCue: "Houd je heupen recht ten opzichte van de mat en leun langzaam voorover voor een diepere stretch."
      },
      {
        name: "Bound Angle Pose / Butterfly",
        sanskrit: "Baddha Konasana",
        description: "Zittende houding met de voetzolen tegen elkaar om de binnenkant van de bovenbenen (adductoren) en de liezen te openen."
      },
      {
        name: "Lizard Pose",
        sanskrit: "Utthan Pristhasana",
        description: "Diepe uitvalspas die zowel de heupflexoren van het achterste been als de hamstrings/heup van het voorste been rekt."
      }
    ]
  },
  {
    title: "Borst, Schouders & Bovenrug (Thoracale Mobiliteit)",
    description: "Opent de borst en verbetert de rotatie en extensie van je bovenrug.",
    exercises: [
      {
        name: "Puppy Pose",
        sanskrit: "Uttana Shishosana",
        description: "Modificatie van de Child's Pose die specifiek de borst, schouders en de bovenrug (thoracale extensie) opent."
      },
      {
        name: "Thread the Needle",
        sanskrit: "Parsva Balasana",
        description: "Dynamische of statische rotatie vanuit kruiphouding, gericht op mobiliteit van de bovenrug en stretch van de achterkant schouders."
      },
      {
        name: "Cow Face Pose Arms",
        sanskrit: "Gomukhasana Arms",
        description: "Schouderstretch waarbij de handen achter de rug naar elkaar toe reiken; ideaal voor de flexibiliteit van triceps en rotatorenmanchet."
      }
    ]
  },
  {
    title: "Wervelkolom & Core (Mobilisatie)",
    description: "Zachte rotaties en extensies om je ruggengraat soepel en pijnvrij te houden.",
    exercises: [
      {
        name: "Cat-Cow Pose",
        sanskrit: "Marjaryasana-Bitilasana",
        description: "Dynamische opeenvolging van het bollen en hollen van de rug ter verbetering van de segmentale mobiliteit van de wervelkolom."
      },
      {
        name: "Supine Spinal Twist",
        sanskrit: "Supta Matsyendrasana",
        description: "Liggende rotatie van de ruggengraat om spanning in de onderrug te verlichten en de mobiliteit van de romp te ondersteunen."
      },
      {
        name: "Sphinx Pose",
        sanskrit: "Salamba Bhujangasana",
        description: "Lichte achteroverbuiging op de onderarmen ter milde stretch van de buikwand en mobilisatie van de onderrug."
      }
    ]
  },
  {
    title: "Actief Herstel & Decompressie",
    description: "Maximale ontspanning om je zenuwstelsel terug te brengen in een parasympathische herstelmodus.",
    exercises: [
      {
        name: "Child's Pose",
        sanskrit: "Balasana",
        description: "Rusthouding die zorgt voor decompressie van de lagere wervelkolom en milde stretch van de heupen en enkels."
      },
      {
        name: "Legs-Up-The-Wall Pose",
        sanskrit: "Viparita Karani",
        description: "Inversiehouding waarbij de benen verticaal tegen een muur rusten. Dit bevordert de veneuze terugstroom, vermindert vochtophoping in de benen en kalmeert het zenuwstelsel.",
        restSeconds: 30,
        executionCue: "Laat je armen ontspannen naast je liggen met je handpalmen omhoog. Sluit je ogen en focus op een rustige ademhaling."
      },
      {
        name: "Corpse Pose",
        sanskrit: "Savasana",
        description: "Volledig vlakke, liggende rusthouding gericht op mentale ontspanning en het verlagen van de spiertonus na fysieke inspanning."
      }
    ]
  }
];

const recoveryTips = [
  {
    title: "Diepe Diaphragmatische Ademhaling",
    desc: "Doe 5-10 minuten rustige buikademhaling (4s in, 4s vasthouden, 6s uit) om je parasympathische zenuwstelsel te activeren voor optimaal herstel.",
    time: "5-10 min",
    type: "Ademhaling"
  },
  {
    title: "Hydratatie & Elektrolyten",
    desc: "Herstel de vochtbalans. Drink water met een snufje Keltisch zeezout of een elektrolytenmix om spierkrampen te voorkomen.",
    time: "Dagelijks",
    type: "Voeding"
  },
  {
    title: "Eiwit- en Koolhydraatsynthese",
    desc: "Zorg voor voldoende macronutriënten. Spieren herstellen en groeien tijdens rust, mits er voldoende bouwstoffen (eiwitten) en brandstof (glycogeen) aanwezig zijn.",
    time: "Maaltijden",
    type: "Voeding"
  },
  {
    title: "Slaaphygiëne & Lichtblootstelling",
    desc: "Vermijd blauw licht/schermen 1-2 uur voor het slapengaan. Slaap is het ultieme anabole herstelvenster van je lichaam waarin groeihormoon (GH) piekt.",
    time: "Avond",
    type: "Slaap"
  }
];

interface DashboardProps {
  userModel: UserModel;
  history: WorkoutSession[];
  fatigue: Record<MuscleGroup, FatigueInfo>;
  onStartWorkout: () => void;
  nextSession: string;
  schedule: ScheduleInfo;
  baselineData: BaselineData | null;
}

const auraFacts = [
  "Spiergroei vindt primair plaats tijdens je rust. Slaap is je beste supplement.",
  "Water is cruciaal voor een spierpomp. Een spiercel bestaat voor 75% uit water.",
  "Consistentie verslaat intensiteit. 4 dagen per week gecontroleerd trainen levert meer op dan 1 maand extreem.",
  "Progressive overload betekent niet altijd meer gewicht. Een extra rep is óók progressie.",
  "Mind-muscle connection is echt. Door bewust te focussen op de spier activeer je meer vezels."
];

const getMuscleGroupsForSplit = (sessionName: string): MuscleGroup[] => {
  const name = (sessionName || '').toLowerCase();
  if (name.includes('upper') || name.includes('bovenlichaam') || name.includes('boven')) {
    return ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'];
  }
  if (name.includes('lower') || name.includes('onderlichaam') || name.includes('onder') || name.includes('leg') || name.includes('benen')) {
    return ['quadriceps', 'hamstrings', 'glutes', 'calves', 'lowerback'];
  }
  if (name.includes('push')) {
    return ['chest', 'shoulders', 'triceps'];
  }
  if (name.includes('pull')) {
    return ['back', 'biceps', 'lowerback', 'forearms'];
  }
  if (name.includes('borst') || name.includes('chest')) {
    return ['chest'];
  }
  if (name.includes('rug') || name.includes('back')) {
    return ['back', 'lowerback'];
  }
  if (name.includes('schouder') || name.includes('shoulder')) {
    return ['shoulders'];
  }
  if (name.includes('arm') || name.includes('biceps') || name.includes('triceps') || name.includes('forearm')) {
    return ['biceps', 'triceps', 'forearms'];
  }
  return ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'core', 'lowerback', 'forearms'];
};

const muscleGroupTranslations: Record<MuscleGroup, string> = {
  chest: 'Borst',
  back: 'Rug',
  shoulders: 'Schouders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quadriceps: 'Bovenbenen (Quads)',
  hamstrings: 'Hamstrings',
  glutes: 'Billen (Glutes)',
  calves: 'Kuiten',
  core: 'Buikspieren (Core)',
  lowerback: 'Onderrug',
  forearms: 'Onderarmen'
};

function getWeatherDetails(code: number, isDay: boolean = true): { text: string; iconType: string } {
  if (code === 0) {
    return { text: isDay ? "Onbewolkt / Zonnig" : "Heldere nacht / Onbewolkt", iconType: "sunny" };
  } else if (code === 1) {
    return { text: isDay ? "Voornamelijk onbewolkt" : "Licht bewolkte nacht", iconType: "partly-cloudy" };
  } else if (code === 2) {
    return { text: isDay ? "Half bewolkt" : "Half bewolkte nacht", iconType: "partly-cloudy" };
  } else if (code === 3) {
    return { text: "Geheel bewolkt", iconType: "cloudy" };
  } else if (code === 45 || code === 48) {
    return { text: "Mist", iconType: "cloudy" };
  } else if (code >= 51 && code <= 55) {
    return { text: "Motregen", iconType: "drizzle" };
  } else if (code >= 56 && code <= 57) {
    return { text: "Sneeuw / IJzel", iconType: "snowy" };
  } else if (code >= 61 && code <= 65) {
    return { text: "Regenachtig", iconType: "rainy" };
  } else if (code >= 66 && code <= 67) {
    return { text: "IJzel", iconType: "rainy" };
  } else if (code >= 71 && code <= 77) {
    return { text: "Sneeuw", iconType: "snowy" };
  } else if (code >= 80 && code <= 82) {
    return { text: "Regenbuien", iconType: "rainy" };
  } else if (code >= 85 && code <= 86) {
    return { text: "Sneeuwbuien", iconType: "snowy" };
  } else if (code >= 95 && code <= 99) {
    return { text: "Onweer", iconType: "thunderstorm" };
  }
  return { text: "Wisselvallig", iconType: "partly-cloudy" };
}

function renderWeatherIcon(code: number, isDay: boolean = true) {
  const details = getWeatherDetails(code, isDay);
  switch (details.iconType) {
    case 'sunny':
      return isDay ? <Sun className="w-5 h-5 animate-spin-slow" /> : <Moon className="w-5 h-5 animate-pulse" />;
    case 'partly-cloudy':
      return isDay ? <CloudSun className="w-5 h-5" /> : <Moon className="w-5 h-5 opacity-80" />;
    case 'cloudy':
      return <Cloud className="w-5 h-5" />;
    case 'drizzle':
      return <CloudDrizzle className="w-5 h-5" />;
    case 'rainy':
      return <CloudRain className="w-5 h-5" />;
    case 'snowy':
      return <CloudSnow className="w-5 h-5" />;
    case 'thunderstorm':
      return <CloudLightning className="w-5 h-5" />;
    default:
      return isDay ? <CloudSun className="w-5 h-5" /> : <Moon className="w-5 h-5" />;
  }
}

export default function Dashboard({
  userModel,
  history,
  fatigue,
  onStartWorkout,
  nextSession,
  schedule,
  baselineData
}: DashboardProps) {
  const [greeting, setGreeting] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [weather, setWeather] = useState<{
    temp: number;
    loc: string;
    icon: string;
    conditionCode: number;
    conditionText: string;
    isDay: boolean;
  } | null>(null);
  const [weatherTip, setWeatherTip] = useState('');
  const [aiInsight, setAiInsight] = useState('Systeem herstart... Je biometrische AI inzichten worden geladen.');
  const [insightLoading, setAiInsightLoading] = useState(false);
  const [fact, setFact] = useState('');

  // Yoga & Rest Day state hooks
  const [showYoga, setShowYoga] = useState<boolean>(() => {
    return localStorage.getItem('aura_show_yoga') === 'true';
  });
  const [completedPoses, setCompletedPoses] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('aura_completed_poses');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedYogaTips, setExpandedYogaTips] = useState<Record<string, boolean>>({});
  const [activeTimerExercise, setActiveTimerExercise] = useState<any | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(60); // default 60s
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  // Toggle handlers for Yoga
  const handleToggleShowYoga = () => {
    const nextVal = !showYoga;
    setShowYoga(nextVal);
    localStorage.setItem('aura_show_yoga', String(nextVal));
  };

  const handleTogglePoseComplete = (poseName: string) => {
    setCompletedPoses(prev => {
      const updated = { ...prev, [poseName]: !prev[poseName] };
      localStorage.setItem('aura_completed_poses', JSON.stringify(updated));
      return updated;
    });
  };

  const handleStartTimer = (exercise: any) => {
    setActiveTimerExercise(exercise);
    setTimerSecondsLeft(timerDuration);
    setTimerIsRunning(true);
  };

  const handleResetSessionalYoga = () => {
    setCompletedPoses({});
    localStorage.removeItem('aura_completed_poses');
  };

  // Yoga countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (timerIsRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && timerIsRunning) {
      setTimerIsRunning(false);
      if (activeTimerExercise) {
        handleTogglePoseComplete(activeTimerExercise.name);
      }
    }
    return () => clearInterval(interval);
  }, [timerIsRunning, timerSecondsLeft, activeTimerExercise]);

  // 1. Calculate overall system readiness score
  const getSystemReadinessScore = () => {
    let total = 0;
    let count = 0;
    for (const key in fatigue) {
      total += 1 - fatigue[key as MuscleGroup].ratio;
      count++;
    }
    let avg = count > 0 ? (total / count) * 100 : 100;
    return Math.min(100, Math.max(10, Math.round(avg)));
  };

  // 1b. Calculate readiness score specifically for the upcoming focus split
  const getFocusReadinessScore = () => {
    const focusMuscles = getMuscleGroupsForSplit(nextSession);
    let total = 0;
    let count = 0;
    focusMuscles.forEach(m => {
      if (fatigue[m]) {
        total += 1 - fatigue[m].ratio;
        count++;
      }
    });
    let avg = count > 0 ? (total / count) * 100 : 100;
    
    return Math.min(100, Math.max(10, Math.round(avg)));
  };

  const readiness = getFocusReadinessScore();
  const systemReadiness = getSystemReadinessScore();
  const isRestDay = !!(schedule.usedDaySpecific && !schedule.isNow);
  const sessionsTodayOuter = history.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString());
  const isRestOrRecovery = isRestDay || sessionsTodayOuter.length > 0;

  // 2. Localized Greeting and Title Tips based on time and split-specific readiness score
  useEffect(() => {
    const hours = new Date().getHours();
    const userName = userModel.name || 'Atleet';

    // Find if a session was completed today
    const sessionsToday = history.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString());
    const trainedSameSplitToday = sessionsToday.some(s => s.name.toLowerCase() === nextSession.toLowerCase());

    if (sessionsToday.length > 0) {
      if (trainedSameSplitToday) {
        setGreeting(`Sessie voltooid voor ${nextSession}, ${userName}. Focus nu op optimaal herstel. 🧘‍♂️`);
        setSubtitle("AURA HERSTELMODUS ACTIEF");
      } else {
        // Trained a different split today, but the next planned split is still fresh or ready!
        setGreeting(`Workout voltooid vandaag, ${userName}! Je ${nextSession} is nog hersteld (${readiness}%) en klaar voor actie! 💪`);
        setSubtitle("AURA SPLIT ACCESSIBLE");
      }
    } else if (isRestDay) {
      setGreeting(`Vandaag is een geplande rustdag, ${userName}. Focus volledig op herstel om je spieren te laten groeien. 🛌`);
      setSubtitle("AURA GEPLANDE RUSTDAG");
    } else {
      if (hours >= 5 && hours < 12) {
        if (readiness >= 80) {
          setGreeting(`Klaar voor de start, ${userName}? Herstelscore voor je ${nextSession} is optimaal: ${readiness}%! ⚡`);
        } else if (readiness >= 50) {
          setGreeting(`Goedemorgen ${userName}. Herstel van je ${nextSession} is ${readiness}%, prima start! 📈`);
        } else {
          setGreeting(`Morgen ${userName}. Je ${nextSession} spieren herstellen nog (${readiness}%). Train met verlaagd volume of wissel van split. 🛌`);
        }
        setSubtitle("AURA SPLIT-SPECIFIC DIRECTIVE");
      } else if (hours >= 12 && hours < 18) {
        if (readiness >= 80) {
          setGreeting(`Middag-focus geactiveerd! Je ${nextSession} herstel is optimaal (${readiness}%). Tijd voor actie! 🔥`);
        } else if (readiness >= 50) {
          setGreeting(`Fijne middag, ${userName}. Focus-herstel is stabiel (${readiness}%). Klaar voor ${nextSession}? 💪`);
        } else {
          setGreeting(`Middag, ${userName}. Je ${nextSession} herstel is ${readiness}%. Doseer je intensiteit of wissel van split vandaag. ⚡`);
        }
        setSubtitle("AURA ACTIVE INTERCEPT");
      } else {
        if (readiness >= 80) {
          setGreeting(`Avondsessie of herstel, ${userName}? Je herstelscore voor ${nextSession} is hoog: ${readiness}%! 🌙`);
        } else if (readiness >= 50) {
          setGreeting(`Fijne avond. Herstelscore voor ${nextSession} is ${readiness}%. Sluit de dag sterk af. ✨`);
        } else {
          setGreeting(`Avond, ${userName}. Je ${nextSession} herstel is ${readiness}%. Tijd om op te laden of rust te nemen. 🛌`);
        }
        setSubtitle("AURA EVENING DIRECTIVE");
      }
    }

    // Set daily fact based on day of year
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = Number(new Date()) - Number(start);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    setFact(auraFacts[dayOfYear % auraFacts.length]);
  }, [history.length, userModel.name, readiness, nextSession, isRestDay]);

  // 3. Load weather info
  useEffect(() => {
    async function fetchWeather() {
      try {
        const cached = localStorage.getItem('aura_weather_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 7200000) {
            setWeather({
              temp: parsed.temp,
              loc: parsed.loc,
              icon: parsed.icon,
              conditionCode: parsed.conditionCode !== undefined ? parsed.conditionCode : 0,
              conditionText: parsed.conditionText !== undefined ? parsed.conditionText : (parsed.icon === 'sunny' ? 'Zonnig' : 'Licht bewolkt'),
              isDay: parsed.isDay !== undefined ? parsed.isDay : (new Date().getHours() >= 6 && new Date().getHours() < 21)
            });
            return;
          }
        }

        // Request GPS permission on native platform first
        if (Capacitor.isNativePlatform()) {
          try {
            await AuraPermissions.requestLocationPermission();
          } catch (e) {
            console.warn("Could not request location permission:", e);
          }
        }

        let lat = 52.2275;
        let lon = 4.5208;
        let locName = "Sassenheim";

        if (navigator.geolocation) {
          const getPos = () => new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, enableHighAccuracy: true });
          });
          try {
            const position = await getPos();
            lat = position.coords.latitude;
            lon = position.coords.longitude;
            try {
              const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=nl`);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                locName = geoData.city || geoData.locality || geoData.village || "Huidige Locatie";
              }
            } catch (geoErr) {
              console.warn("Reverse geocode failed:", geoErr);
              locName = "Huidige Locatie";
            }
          } catch (e) {
            console.log("Could not obtain GPS coordinates, using fallback:", e);
          }
        }

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const temp = data.current_weather.temperature;
        const code = data.current_weather.weathercode !== undefined ? data.current_weather.weathercode : (data.current_weather.weather_code !== undefined ? data.current_weather.weather_code : 0);
        
        // Retrieve is_day from API (1 for day, 0 for night) or fallback to current hour
        const isDayApi = data.current_weather.is_day;
        const isDayVal = isDayApi !== undefined ? isDayApi === 1 : (new Date().getHours() >= 6 && new Date().getHours() < 21);

        const details = getWeatherDetails(code, isDayVal);

        const weatherData = {
          temp,
          loc: locName,
          icon: temp >= 18 ? 'sunny' : temp <= 10 ? 'cold' : 'mild',
          conditionCode: code,
          conditionText: details.text,
          isDay: isDayVal,
          timestamp: Date.now()
        };

        localStorage.setItem('aura_weather_cache', JSON.stringify(weatherData));
        setWeather({
          temp,
          loc: locName,
          icon: weatherData.icon,
          conditionCode: code,
          conditionText: details.text,
          isDay: isDayVal
        });
      } catch (err) {
        console.error("Fout bij ophalen van weer:", err);
      }
    }

    fetchWeather();
  }, []);

  // Update weather tip reactively based on temperature and rest day status
  useEffect(() => {
    if (!weather) return;
    const temp = weather.temp;
    const hours = new Date().getHours();
    const isNight = hours >= 21 || hours <= 5;

    if (isRestDay) {
      if (isNight) {
        setWeatherTip("Heerlijk rustige avond. Een perfect moment voor een kop kamillenthee of warme melk om je slaapkwaliteit te verbeteren! ☕🌙");
      } else if (temp >= 24) {
        setWeatherTip("Het is behoorlijk warm vandaag. Zorg dat je ook op deze rustdag extra water drinkt om je herstel te bevorderen! 💦");
      } else if (temp <= 10) {
        setWeatherTip("Fris buiten! Ideaal weer om lekker warm binnen te blijven met een herstellende yoga-sessie. ❄️🧘‍♂️");
      } else {
        setWeatherTip("Aangenaam weer vandaag. Ideaal voor een lichte, herstellende wandeling in de buitenlucht om de doorbloeding te stimuleren! 🚶‍♂️🌳");
      }
    } else {
      if (isNight) {
        setWeatherTip("Avond sessie? Neem geen pre-workout met cafeïne meer! 🌙");
      } else if (temp >= 24) {
        setWeatherTip("Het is behoorlijk warm vandaag. Zorg dat je extra water drinkt tijdens je training! 💦");
      } else if (temp <= 10) {
        setWeatherTip("Fris buiten! Zorg voor een extra uitgebreide warming-up om blessures te voorkomen. ❄️");
      } else {
        setWeatherTip("Perfect weer om te trainen. Focus op je doelen en geef alles! 💪");
      }
    }
  }, [weather?.temp, isRestDay]);

  // 4. Generate daily scientific insight using server-side Gemini API
  useEffect(() => {
    let active = true;
    const todayStr = new Date().toDateString();
    const sessionsToday = history.filter(s => new Date(s.timestamp).toDateString() === todayStr);
    const isRestDayForAi = isRestDay;
    const sessionCompletedToday = sessionsToday.length > 0;

    async function fetchInsight() {
      // Check if we already loaded it today
      const cachedInsight = localStorage.getItem('aura_cached_insight');
      const cachedDate = localStorage.getItem('aura_last_insight_date');
      const cachedIsRestDay = localStorage.getItem('aura_last_insight_is_rest_day') === 'true';
      const cachedSessionCompleted = localStorage.getItem('aura_last_insight_session_completed') === 'true';

      if (
        cachedInsight && 
        cachedInsight.trim().length > 0 &&
        cachedInsight !== "undefined" &&
        cachedInsight !== "null" &&
        cachedDate === todayStr && 
        cachedIsRestDay === isRestDayForAi &&
        cachedSessionCompleted === sessionCompletedToday
      ) {
        if (active) {
          setAiInsight(cachedInsight);
        }
        return;
      }

      if (active) {
        setAiInsightLoading(true);
      }

      try {
        const rawPrefs = localStorage.getItem('aura_exercise_prefs') || '{"likes":[],"dislikes":[]}';
        let parsedPrefs: any = { likes: [], dislikes: [] };
        try {
          parsedPrefs = JSON.parse(rawPrefs);
        } catch (e) {
          console.error("Fout bij laden van voorkeuren", e);
        }
        const prefs: ExercisePrefs = {
          likes: parsedPrefs.likes || [],
          dislikes: parsedPrefs.dislikes || [],
          painNotes: parsedPrefs.painNotes || []
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout to prevent cold-start aborting

        const response = await fetch("/api/gemini/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userModel,
            metrics: fatigue,
            history: (Array.isArray(history) ? history : []).slice(0, 5),
            userApiKey: undefined,
            isRestDay: isRestDayForAi,
            sessionCompletedToday,
            nextSession,
            prefs
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error("API-fout");
        }

        const data = await response.json();
        const insightText = data.text;

        if (active) {
          if (insightText && insightText.trim().length > 0) {
            setAiInsight(insightText);
            localStorage.setItem('aura_cached_insight', insightText);
            localStorage.setItem('aura_last_insight_date', todayStr);
            localStorage.setItem('aura_last_insight_is_rest_day', String(isRestDayForAi));
            localStorage.setItem('aura_last_insight_session_completed', String(sessionCompletedToday));
          } else {
            fallbackInsight();
          }
        }
      } catch (error) {
        console.log("Aura AI-inzicht herstel actief.");
        if (active) {
          fallbackInsight();
        }
      } finally {
        if (active) {
          setAiInsightLoading(false);
        }
      }
    }

    function fallbackInsight() {
      let text = "";
      if (sessionCompletedToday) {
        text = `Geweldige training vandaag! Je spieren hebben nu rust en herstelstoffen nodig om sterker te worden en te herstellen. Focus op eiwitrijke voeding, voldoende hydratatie en een uitstekende nachtrust vanavond.`;
      } else if (isRestDayForAi) {
        text = `Vandaag is een geplande rustdag. Je spieren hebben rust nodig om sterker te worden en de eiwitsynthese te optimaliseren. Focus op goede voeding, voldoende hydratatie en minimaal 7-8 uur diepe slaap vanavond.`;
      } else if (steps > 12000) {
        text = `Je bent vandaag extreem actief geweest met ${steps} stappen! Dit bevordert actief herstel. Als je vandaag benen traint, overweeg dan om het aantal sets met 10% te verlagen om vermoeidheid van je zenuwstelsel te ontzien.`;
      } else if (steps > 5000) {
        text = `Mooi aantal stappen vandaag (${steps}). Dit verhoogt de doorbloeding, wat het herstel van vermoeide spieren versnelt. Klaar voor je volgende overload op ${nextSession}?`;
      } else {
        text = `Combineer krachttraining met wat extra beweging vandaag. Probeer na je training of vanavond nog een korte wandeling te maken voor optimaal bloedtransport en herstel.`;
      }
      setAiInsight(text);
      
      localStorage.setItem('aura_cached_insight', text);
      localStorage.setItem('aura_last_insight_date', todayStr);
      localStorage.setItem('aura_last_insight_is_rest_day', String(isRestDayForAi));
      localStorage.setItem('aura_last_insight_session_completed', String(sessionCompletedToday));
    }

    fetchInsight();

    return () => {
      active = false;
    };
  }, [nextSession, userModel.apiKey, userModel.name, isRestDay, history.length]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn pb-2">
      {/* 1. Header greeting */}
      <div className="flex flex-col gap-1 px-1">
        <span className={`text-[10px] ${isRestDay ? 'text-sky-400' : 'text-emerald-400'} uppercase tracking-[0.3em] font-bold`}>
          {subtitle || "Welkom bij Aura"}
        </span>
        <h2 className="text-xl font-light text-white leading-tight">
          {greeting || `Hoi ${userModel.name || "Sporter"}, welkom bij Aura.`}
        </h2>
      </div>

      <>
          {/* 2. Readiness Ring Indicator Card */}
          {!isRestDay && (
            <div className="relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between shadow-xl backdrop-blur-md animate-fadeIn">
              <div className="absolute -left-4 -top-4 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />
              <div>
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold block mb-1">
                  Aura Readiness: {nextSession}
                </span>
                <h3 className="text-xl font-light text-white">
                  {readiness >= 80 ? 'Optimaal' : readiness >= 50 ? 'Gematigd' : 'Herstellen'}
                </h3>
                <p className="text-[11px] text-white/50 mt-1 font-light max-w-[175px]">
                  {readiness >= 80 
                    ? `Je spieren voor ${nextSession} zijn volledig klaar voor progressive overload.` 
                    : readiness >= 50 
                    ? `Focus op gecontroleerd volume voor je ${nextSession} training.` 
                    : `Je ${nextSession} spieren herstellen nog. Train een andere split of neem rust.`}
                </p>
              </div>

              {/* Circular progress bar */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-white/10"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <path
                      className="text-emerald-400 transition-all duration-1000 ease-out"
                      strokeDasharray={`${readiness}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-white tracking-tighter">
                      {readiness}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold mt-1.5">
                  SCORE
                </span>
              </div>
            </div>
          )}

          {/* 3. Next Workout Hero Card */}
          {!(isRestDay && userModel.restDayYogaEnabled === false) && (
            <div 
              onClick={onStartWorkout}
              className="group relative w-full h-48 rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl border border-white/10 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] animate-fadeIn"
            >
              <img 
                src={isRestDay 
                  ? "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop"
                  : "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop"
                } 
                alt="Workout of Herstel"
                className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* Glowing badge */}
              <div className={`absolute top-4 left-4 border px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5 shadow-lg ${
                isRestDay 
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isRestDay ? 'bg-sky-400' : 'bg-emerald-400'}`} />
                <span className="text-[9px] uppercase tracking-widest font-bold">
                  {isRestDay ? 'Rustdag Actief' : 'Coach Aanbeveling'}
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-white/50 uppercase tracking-widest block mb-1">
                    {isRestDay ? 'Spiergroei & Herstel' : 'Volgende Cyclus'}
                  </span>
                  <h4 className="text-2xl font-light tracking-wide text-white drop-shadow-md">
                    {isRestDay ? 'Actieve Rust & Wellness' : nextSession}
                  </h4>
                </div>
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                  isRestDay 
                    ? 'bg-white/10 border-white/20 group-hover:bg-sky-500/20 group-hover:border-sky-500/30 text-sky-300' 
                    : 'bg-white/10 border-white/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 text-emerald-400 ml-0.5'
                }`}>
                  {isRestDay ? (
                    <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
                  ) : (
                    <Zap className="w-5 h-5 text-emerald-400 ml-0.5" />
                  )}
                </div>
              </div>
            </div>
          )}



          {/* 5. Open-Meteo Weather widget */}
          {weather && (
            <div className={`bg-white/5 border ${isRestDay ? 'border-sky-500/20' : 'border-emerald-500/20'} rounded-3xl p-5 relative overflow-hidden shadow-xl backdrop-blur-md transition-all duration-300`}>
              <div className={`absolute -right-4 -top-4 w-20 h-20 ${isRestDay ? 'bg-sky-500/10' : 'bg-emerald-500/10'} blur-2xl rounded-full`} />
              <div className="flex items-center gap-4 mb-2 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-md transition-all ${
                  isRestDay 
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.1)]' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                }`}>
                  {renderWeatherIcon(weather.conditionCode, weather.isDay)}
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold block">
                    {weather.loc} Weer • {weather.conditionText}
                  </span>
                  <span className="text-lg font-light text-white font-mono">
                    {Math.round(weather.temp)}°C
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-white/70 font-light leading-relaxed relative z-10">
                {weatherTip}
              </p>
            </div>
          )}

          {/* 5b. Rest Day Oasis (Scientific Rest Tips & Yoga Exercises) */}
          {isRestDay && (
            <div className="flex flex-col gap-5 bg-gradient-to-br from-sky-950/40 to-blue-950/20 border border-sky-500/20 rounded-[2rem] p-6 shadow-2xl backdrop-blur-md animate-fadeIn">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-500/15 border border-sky-400/20 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                    <Heart className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-sky-400 font-bold">Actief Herstel</span>
                    <h3 className="text-lg font-light text-white leading-tight">Rustdag Oase</h3>
                  </div>
                </div>
              </div>

              {/* Scientific Recovery Tips */}
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 text-sky-300">
                  <Brain className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Wetenschappelijke Rust Tips</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {recoveryTips.map((tip, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex gap-3 transition-all hover:bg-white/[0.04]">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 border border-sky-500/20 text-sky-400 font-mono text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h4 className="text-xs font-semibold text-white/90">{tip.title}</h4>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300/80 border border-sky-500/10 shrink-0 uppercase tracking-widest">
                            {tip.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/60 font-light leading-relaxed">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. Dynamic AI Coach Insights Card */}
          <div className={`relative overflow-hidden bg-white/5 border ${isRestDay ? 'border-sky-500/20' : 'border-emerald-500/20'} rounded-3xl p-6 shadow-xl backdrop-blur-md animate-fadeIn`}>
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${isRestDay ? 'bg-sky-500/10' : 'bg-emerald-500/10'} blur-2xl rounded-full`} />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRestDay ? 'bg-sky-400' : 'bg-emerald-400'} animate-pulse`} />
                <span className={`text-[10px] uppercase tracking-widest ${isRestDay ? 'text-sky-300' : 'text-emerald-300'} font-semibold`}>
                  {isRestDay ? 'Aura Intelligentie (Herstel & Rust)' : 'Aura Intelligentie (Coach Advies)'}
                </span>
              </div>
              <span className="text-[8px] uppercase tracking-widest text-white/30">
                {insightLoading ? 'Analyseren...' : 'Vandaag'}
              </span>
            </div>
            
            {insightLoading ? (
              <div className="space-y-2 animate-pulse py-2">
                <div className="h-3 bg-white/10 rounded-full w-full" />
                <div className="h-3 bg-white/10 rounded-full w-5/6" />
                <div className="h-3 bg-white/10 rounded-full w-2/3" />
              </div>
            ) : (
              <p className="text-xs text-white/80 font-light leading-relaxed relative z-10">
                {aiInsight}
              </p>
            )}
          </div>

          {/* Kracht Benchmarks & 1RM Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl backdrop-blur-md animate-fadeIn space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Kracht Benchmarks & 1RM</h3>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block">Progressieve Overload Kalibratie</span>
                </div>
              </div>
              <span className="text-[8px] bg-amber-500/10 text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase">Kracht</span>
            </div>

            <p className="text-xs text-white/70 font-light leading-relaxed">
              Aura kalibreert aanbevolen gewichten automatisch met je **1-Rep Max (1RM)**. Wanneer een lift aan een test toe is, stelt Aura een <span className="text-amber-400 font-semibold">Aura Kalibratie 🔥</span> (AMRAP set) voor bij de hoofdoefening om je baseline te optimaliseren.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {[
                {
                  name: "Borst (Bankdrukken)",
                  weight: baselineData?.benchPressWeight || 40,
                  reps: baselineData?.benchPressReps || 10,
                  oneRM: baselineData?.benchPress1RM || 53,
                  tested: !!baselineData?.benchPress1RM
                },
                {
                  name: "Benen (Squats)",
                  weight: baselineData?.squatWeight || 50,
                  reps: baselineData?.squatReps || 10,
                  oneRM: baselineData?.squat1RM || 67,
                  tested: !!baselineData?.squat1RM
                },
                {
                  name: "Rug (Lat Pulldown)",
                  weight: baselineData?.latPulldownWeight || 40,
                  reps: baselineData?.latPulldownReps || 10,
                  oneRM: baselineData?.latPulldown1RM || 53,
                  tested: !!baselineData?.latPulldown1RM
                },
                {
                  name: "Schouders (Press)",
                  weight: baselineData?.overheadPressWeight || 25,
                  reps: baselineData?.overheadPressReps || 10,
                  oneRM: baselineData?.overheadPress1RM || 33,
                  tested: !!baselineData?.overheadPress1RM
                }
              ].map((lift, index) => (
                <div key={index} className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-3 flex flex-col justify-between transition-all group relative overflow-hidden">
                  {lift.tested && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" title="Getest via Aura Kalibratie!" />
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/50 font-bold truncate block">{lift.name}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-mono font-black text-white">{lift.oneRM}</span>
                      <span className="text-[9px] text-white/50">kg 1RM</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-white/30 font-mono mt-2 pt-1 border-t border-white/5 flex items-center justify-between">
                    <span>Set: {lift.weight}kg × {lift.reps}</span>
                    {lift.tested ? (
                      <span className="text-amber-400 text-[8px] font-bold">✓ GETEST</span>
                    ) : (
                      <span className="text-white/20 text-[8px]">SCHATTING</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Forecast banner / schedule info if any */}
          {(schedule.confidence !== 'none' || schedule.usedDaySpecific) && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden shadow-xl backdrop-blur-md animate-fadeIn">
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${isRestDay ? 'bg-sky-500/5' : 'bg-emerald-500/5'} blur-2xl rounded-full pointer-events-none`} />
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] uppercase tracking-widest ${isRestDay ? 'text-sky-400' : 'text-emerald-400'} font-bold`}>Aura Forecast</span>
                <span className="text-[8px] uppercase tracking-widest text-white/30">Voorspelling</span>
              </div>
              <h4 className="text-xs font-semibold text-white mb-1">
                {schedule.usedDaySpecific && schedule.isNow ? 'Trainingsdag Vandaag' : 'Volgende PR Doelwit'}
              </h4>
              <p className="text-[11px] text-white/60 font-light leading-relaxed">
                {schedule.usedDaySpecific ? (
                  schedule.isNow ? (
                    <span>Vandaag is een van je geselecteerde trainingsdagen (<strong>{schedule.dayName}</strong>)! Aura voorspelt dat je spierherstel optimaal is voor de <strong>{nextSession}</strong> en raadt progressieve overload aan (+2.5kg).</span>
                  ) : (
                    <span>Je volgende geselecteerde trainingsdag is op <strong>{schedule.dayName}</strong> rond <strong>{schedule.predictedLabel}</strong>. Blijf herstellen om dan optimaal aan de start te staan voor je <strong>{nextSession}</strong>!</span>
                  )
                ) : (
                  <span>Je traint meestal op <strong className={`${isRestDay ? 'text-sky-300' : 'text-emerald-300'} font-normal`}>{schedule.dayName}</strong> rond <strong className={`${isRestDay ? 'text-sky-300' : 'text-emerald-300'} font-normal`}>{schedule.predictedLabel}</strong>. Blijf herstellen; Aura voorspelt dat je krachtoverload op de {nextSession} met +2.5kg verhoogd kan worden in je eerstvolgende training!</span>
                )}
              </p>
            </div>
          )}

          {/* 8. Fact of the Day */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2 text-amber-300">
              <Info className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                Wist je dat?
              </span>
            </div>
            <p className="text-xs text-white/70 font-light leading-relaxed">
              {fact}
            </p>
          </div>

          {/* 9. Anatomy recovery body diagram */}
          <div className="flex flex-col gap-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isRestDay ? 'text-sky-400' : 'text-white/40'} px-1`}>
              Systeemherstel
            </span>
            <BodyDiagram fatigue={fatigue} isRestDay={isRestDay} userModel={userModel} />
          </div>
        </>
    </div>
  );
}
