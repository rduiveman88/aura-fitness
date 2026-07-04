// Utility for client-side direct Google Gemini API integration

export async function callGeminiDirectly(
  apiKey: string,
  systemInstruction: string,
  contents: any[],
  responseSchema?: any
): Promise<string> {
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: any = {
    contents,
    generationConfig: {}
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (responseSchema) {
    body.generationConfig = {
      ...body.generationConfig,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Direct Gemini API error response:", errText);
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const result = await response.json();
  
  if (
    result.candidates &&
    result.candidates[0] &&
    result.candidates[0].content &&
    result.candidates[0].content.parts &&
    result.candidates[0].content.parts[0]
  ) {
    return result.candidates[0].content.parts[0].text;
  }

  throw new Error("Ongeldig antwoord van Gemini API.");
}

// Prompt builders & calculation helpers (mirrors server.ts logic for perfect symmetry)

export function estimateOneRM(weight: number, reps: number, knownOneRM?: number): number {
  if (knownOneRM && knownOneRM > 0) return Math.round(knownOneRM);
  const rawEstimate = weight / (1.0278 - 0.0278 * reps);
  return Math.round(rawEstimate * 0.9);
}

export function estimateFirstSessionWeight(bodyWeight: number, liftType: "push" | "pull" | "legs" | "overhead", experienceLevel?: string): number {
  const safeBodyWeight = bodyWeight && bodyWeight > 0 ? bodyWeight : 75;
  const ratios: Record<string, number> = { push: 0.25, pull: 0.2, legs: 0.35, overhead: 0.15 };
  const experienceMultiplier: Record<string, number> = {
    beginner: 1,
    intermediate: 1.6,
    advanced: 2.2,
  };
  const multiplier = experienceMultiplier[(experienceLevel || "beginner").toLowerCase()] ?? 1;
  const raw = safeBodyWeight * ratios[liftType] * multiplier;
  return Math.max(5, Math.round(raw / 2.5) * 2.5);
}

export function computeNumberOfExercises(duration: number, goal: string): number {
  const safeDuration = duration && duration > 0 ? duration : 60;
  const g = (goal || "").toLowerCase();
  let setsPerExercise = 3.5;
  let avgRestSeconds = 75;
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
}

export function normalizeSessionName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sessionNamesMatch(a: string, b: string): boolean {
  return normalizeSessionName(a) === normalizeSessionName(b);
}

export function detectPlateaus(history: any[], sessionName: string): string[] {
  if (!Array.isArray(history)) return [];
  const matchingSessions = history
    .filter((s: any) => sessionNamesMatch(s?.name, sessionName))
    .slice(0, 3);
  if (matchingSessions.length < 3) return [];
  const plateaued: string[] = [];
  const candidateExercises = matchingSessions[0]?.exercises || [];
  candidateExercises.forEach((ex: any) => {
    if (!ex?.name) return;
    const allMaximaal = matchingSessions.every((s: any) =>
      (s?.exercises || []).some((e: any) => e?.name === ex.name && e?.intensity === "Maximaal")
    );
    if (allMaximaal) plateaued.push(ex.name);
  });
  return plateaued;
}

export function computeDeloadWeek(baseline: any): boolean {
  if (!baseline?.completedAt) return false;
  const weeksSince = Math.floor(
    (Date.now() - new Date(baseline.completedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return weeksSince > 0 && weeksSince % 6 === 0;
}

export function computeMaxEffortTestDue(baseline: any): boolean {
  if (!baseline?.completedAt) return false;
  const weeksSince = Math.floor(
    (Date.now() - new Date(baseline.completedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return weeksSince > 0 && weeksSince % 8 === 0;
}

export function computeBlockNumber(baseline: any, referenceTimestamp?: number): number {
  if (!baseline?.completedAt) return 1;
  const reference = referenceTimestamp || Date.now();
  const weeksSince = Math.floor(
    (reference - new Date(baseline.completedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return Math.floor(Math.max(0, weeksSince) / 4) + 1;
}

export function computeProgressedWeight(previousWeight: number, previousIntensity?: string, recentIntensities?: string[]): number {
  if (!previousWeight || previousWeight <= 0) return previousWeight;
  if (recentIntensities && recentIntensities.length >= 2 && recentIntensities.slice(0, 2).every((i) => i === "Makkelijk")) {
    return Math.round(previousWeight * 1.1 * 2) / 2;
  }
  if (previousIntensity === "Makkelijk") return Math.round(previousWeight * 1.05 * 2) / 2;
  if (previousIntensity === "Maximaal") return previousWeight;
  return Math.round(previousWeight * 1.025 * 2) / 2;
}

export function buildGoalRule(goal: string, numberOfExercises: number, equipment: string[]): string {
  const g = (goal || "").toLowerCase();
  const equipList = Array.isArray(equipment) ? equipment.join(", ") : "";
  if (g.includes("kracht") || g.includes("power")) {
    return `\nSTRENGE VERPLICHTING VOOR DOEL 'MAXIMALE KRACHT':
      - Reps MOETEN tussen 3-5 liggen voor hoofdoefeningen.
      - Rusttijd tussen sets: 120-180 seconden (geef dit door als 'restSeconds').
      - Kies hogere intensiteit/gewicht boven hoog volume; 3-4 sets per oefening is voldoende.`;
  }
  if (g.includes("herstel") || g.includes("vitaliteit")) {
    return `\nSTRENGE VERPLICHTING VOOR DOEL 'HERSTEL & VITALITEIT':
      - Dit is GEEN hypertrofie-training. Doel is mobiliteit, houding en doorbloeding.
      - Prioriteer mobiliteit- en stabiliteitsoefeningen met een groot bewegingsbereik boven zware compound-bewegingen.
      - Reps MOETEN tussen 12-20 liggen, met duidelijk lager gewicht dan gebruikelijk.
      - Rusttijd tussen sets: 30-45 seconden (geef dit door als 'restSeconds').
      - Volume: 2-3 sets per oefening.`;
  }
  if (g.includes("vetverlies") || g.includes("conditie")) {
    return `\nSTRENGE VERPLICHTING VOOR DOEL 'VETVERLIES & CONDITIE':
      - Minimaal 2 van de ${numberOfExercises} hoofdoefeningen MOETEN echte cardio/conditie-blokken zijn (bijv. 'HIIT op Loopband', 'Fietsergometer Intervallen', 'Rij-ergometer', 'Jumping Jacks Circuit'), gekozen uit beschikbare apparatuur: ${equipList || "lichaamsgewicht-opties"}.
      - Voor deze cardio-blokken: 'reps' uitgedrukt als duur/intervallen (bijv. '10x 30s sprint', '15 min tempo'), targetWeight altijd 0, muscle 'Cardio'.
      - De OVERIGE oefeningen zijn krachtoefeningen met hoge reps (12-15), korte rust (20-40s), als circuit-achtige aanvulling.`;
  }
  return `\nSTRENGE VERPLICHTING VOOR DOEL 'HYPERTROFIE':
      - Reps MOETEN tussen 8-12 liggen.
      - Rusttijd tussen sets: 60-90 seconden (geef dit door als 'restSeconds').
      - 3-4 sets per oefening.`;
}

export function buildVolumeBudgetRule(metrics: any): string {
  if (!metrics || typeof metrics !== "object") return "";
  const constrained: string[] = [];
  Object.entries(metrics).forEach(([muscle, info]: [string, any]) => {
    if (info && typeof info.ratio === "number" && info.ratio > 0.6) {
      const recoveryPct = Math.round((1 - info.ratio) * 100);
      constrained.push(`${muscle} (${recoveryPct}% herstel, ${info.rawSets || 0} recente sets)`);
    }
  });
  if (constrained.length === 0) return "";
  return `\nSTRENGE VERPLICHTING VOOR VOLUMEBUDGET:
      - Deze spiergroepen zitten al dicht bij hun volumegrens: ${constrained.join(", ")}.
      - Verlaag voor deze spiergroepen het aantal sets met minimaal 1, of kies een lagere-belasting variant.`;
}

export function buildWorkoutPrompt(
  userModel: any,
  metrics: any,
  history: any[],
  prefs: any,
  sessionName: string,
  baselineData: any,
  isRestDay: boolean,
  localExerciseLibrary: any[] // passed from component
): { systemPrompt: string; prescribedWeights: Record<string, number>; isMaxEffortTestWeek: boolean } {
  const numberOfExercises = isRestDay
    ? 5
    : computeNumberOfExercises(userModel.duration, userModel.goal);
    
  const isDeloadWeek = !isRestDay && computeDeloadWeek(baselineData);
  const isMaxEffortTestWeekBase = !isRestDay && computeMaxEffortTestDue(baselineData) && !isDeloadWeek;
  const painNotes: string[] = Array.isArray(prefs?.painNotes) ? prefs.painNotes : [];

  let baselinePrompt = "";
  const hasBaselineNumbers = !!(
    baselineData &&
    (baselineData.benchPressWeight || baselineData.squatWeight || baselineData.latPulldownWeight || baselineData.overheadPressWeight)
  );

  if (baselineData && !isRestDay && hasBaselineNumbers) {
    baselinePrompt = `\nGEBRUIKER NULMETING:
    - Ervaringsniveau: ${baselineData.experienceLevel || "Gematigd"}
    - Bench Press: werkset ${baselineData.benchPressWeight || 50}kg voor ${baselineData.benchPressReps || 8} reps (1RM: ${estimateOneRM(baselineData.benchPressWeight || 50, baselineData.benchPressReps || 8, baselineData.benchPress1RM)}kg)
    - Back Squat: werkset ${baselineData.squatWeight || 60}kg voor ${baselineData.squatReps || 8} reps (1RM: ${estimateOneRM(baselineData.squatWeight || 60, baselineData.squatReps || 8, baselineData.squat1RM)}kg)
    - Lat Pulldown / Row: werkset ${baselineData.latPulldownWeight || 45}kg voor ${baselineData.latPulldownReps || 8} reps (1RM: ${estimateOneRM(baselineData.latPulldownWeight || 45, baselineData.latPulldownReps || 8, baselineData.latPulldown1RM)}kg)
    - Overhead Press: werkset ${baselineData.overheadPressWeight || 30}kg voor ${baselineData.overheadPressReps || 8} reps (1RM: ${estimateOneRM(baselineData.overheadPressWeight || 30, baselineData.overheadPressReps || 8, baselineData.overheadPress1RM)}kg)
    STRENGE VERPLICHTING: Gebruik deze nulmeting als absolute schaalreferentie om startgewichten te bepalen.`;
  } else if (!isRestDay) {
    const pushW = estimateFirstSessionWeight(userModel.weight, "push", baselineData?.experienceLevel);
    const pullW = estimateFirstSessionWeight(userModel.weight, "pull", baselineData?.experienceLevel);
    const legsW = estimateFirstSessionWeight(userModel.weight, "legs", baselineData?.experienceLevel);
    const overheadW = estimateFirstSessionWeight(userModel.weight, "overhead", baselineData?.experienceLevel);
    baselinePrompt = `\nGEBRUIKER NULMETING: GEEN CIJFERS BESCHIKBAAR.
    Referentiegewichten (incl. stang): duw ~${pushW}kg, trek ~${pullW}kg, benen ~${legsW}kg, overhead ~${overheadW}kg. Dumbbells is gewicht PER HAND (deel barbell ref door 2).`;
  }

  let painRule = "";
  if (painNotes.length > 0) {
    painRule = `\nABSOLUTE VEILIGHEIDSREGEL:
    - Vermijd VOLLEDIG elke oefening die deze pijnpunten belast: ${painNotes.join(", ")}.`;
  }

  const goalRule = !isRestDay ? buildGoalRule(userModel.goal, numberOfExercises, userModel.equipment) : "";
  const volumeRule = !isRestDay ? buildVolumeBudgetRule(metrics) : "";

  let beginnerRule = "";
  const expLevel = baselineData?.experienceLevel;
  if (!isRestDay && expLevel === "beginner") {
    beginnerRule = `\nSTRENGE VERPLICHTING VOOR BEGINNERS:
    - Kies bewezen, stabiele machines boven complexe vrije gewichten. Geen drop sets/rest-pause.`;
  }

  let stabilityRule = "";
  let progressionRule = "";
  const plateauedLifts = !isRestDay ? detectPlateaus(history, sessionName) : [];
  const currentBlock = computeBlockNumber(baselineData);
  const prescribedWeights: Record<string, number> = {};
  let isNewBlock = false;

  if (!isRestDay && Array.isArray(history)) {
    const previousSession = history.find(s => sessionNamesMatch(s?.name, sessionName));
    const previousSessionBlock = computeBlockNumber(baselineData, previousSession?.timestamp);
    isNewBlock = !!baselineData?.completedAt && !!previousSession?.timestamp && previousSessionBlock !== currentBlock;

    let previousMainLifts = (previousSession?.exercises || [])
      .slice(0, 2)
      .map((e: any) => e.name)
      .filter(Boolean);

    if (previousMainLifts.length > 0 && isNewBlock) {
      stabilityRule = `\nSTRENGE VERPLICHTING VOOR BLOK-ROTATIE (blok ${currentBlock}):
      - De hoofdoefeningen van het vorige blok waren: ${previousMainLifts.join(", ")}.
      - Kies bewust EEN ANDERE, vergelijkbare variant voor dezelfde spiergroep (bijv. Barbell Bench Press → Dumbbell Bench Press) — niet exact dezelfde naam.`;
    } else if (previousMainLifts.length > 0) {
      stabilityRule = `\nSTRENGE VERPLICHTING VOOR PROGRESSIEVE OVERLOAD (blok ${currentBlock}):
      - Je MOET deze exacte hoofdoefeningen herhalen: ${previousMainLifts.join(", ")}.`;
    }

    if (previousMainLifts.length > 0 && !isNewBlock) {
      const matchingSessionsForWeights = history.filter(s => sessionNamesMatch(s?.name, sessionName));
      const weightLines = (previousSession?.exercises || [])
        .slice(0, 2)
        .filter((e: any) => e?.name && typeof e?.topWeight === "number" && e.topWeight > 0)
        .map((e: any) => {
          if (plateauedLifts.includes(e.name)) {
            const reducedWeight = Math.round(e.topWeight * 0.9 * 2) / 2;
            prescribedWeights[e.name.toLowerCase().trim()] = reducedWeight;
            return `- '${e.name}': PLATEAU GEDETECTEERD. Gebruik EXACT ${reducedWeight}kg.`;
          }
          const recentIntensities = matchingSessionsForWeights
            .slice(0, 2)
            .map(s => (s?.exercises || []).find((ex: any) => ex?.name === e.name)?.intensity)
            .filter(Boolean);
          const nextWeight = computeProgressedWeight(e.topWeight, e.intensity, recentIntensities);
          prescribedWeights[e.name.toLowerCase().trim()] = nextWeight;
          return `- '${e.name}': vorige topWeight ${e.topWeight}kg → gebruik EXACT ${nextWeight}kg.`;
        });
      if (weightLines.length > 0) {
        progressionRule = `\nSTRENGE VERPLICHTING VOOR GEWICHTSPROGRESSIE:
        ${weightLines.join("\n        ")}`;
      }
    }
  }

  const isMaxEffortTestWeek = isMaxEffortTestWeekBase && !isNewBlock;

  let deloadRule = "";
  if (!isRestDay && isDeloadWeek) {
    deloadRule = `\nSTRENGE VERPLICHTING VOOR DELOAD-WEEK:
    - Verlaag het aantal sets per oefening met 40-50%. Gewicht blijft gelijk.`;
  }

  // Filter local database to send candidate exercises
  const focus = sessionName.toLowerCase();
  const muscleKeywords = getMuscleCategoriesForFocus(sessionName);
  const candidates = localExerciseLibrary
    .filter(ex => {
      const m = (ex.muscle || "").toLowerCase();
      return muscleKeywords.some(keyword => m.includes(keyword) || keyword.includes(m));
    })
    .map(ex => ex.name)
    .slice(0, 25);

  const candidateRule = candidates.length > 0
    ? `\nKANDIDATEN LIJST OEFENINGEN: Kies bij voorkeur uit deze geverifieerde lijst: ${candidates.join(", ")}.`
    : "";

  let muscleSplitRule = "";
  if (isRestDay) {
    muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR RUSTDAG (YOGA/STRETCH):
    - Apparatuur: 'Lichaamsgewicht' of 'Yoga mat'. TargetWeight: 0. Reps: bijv. '60s', '5 min'.`;
  } else {
    if (focus.includes('full body') || focus.includes('combinatie')) {
      muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR FULL BODY:
      - Verdeel de ${numberOfExercises} hoofdoefeningen over Borst, Rug, Schouders, Benen en Arm/Core.`;
    } else if (focus.includes('upper') || focus.includes('bovenlichaam')) {
      muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR UPPER BODY:
      - Gebruik UITSLUITEND Borst, Rug, Schouders, Biceps en Triceps. Geen benen.`;
    } else if (focus.includes('lower') || focus.includes('benen') || focus.includes('legs')) {
      muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR LOWER BODY:
      - Gebruik UITSLUITEND Quadriceps, Hamstrings, Gluten en Kuiten. Geen bovenlichaam.`;
    } else if (focus.includes('push')) {
      muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR PUSH:
      - Gebruik UITSLUITEND Borst, Schouders en Triceps.`;
    } else if (focus.includes('pull')) {
      muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR PULL:
      - Gebruik UITSLUITEND Rug, Biceps en Onderrug.`;
    }
  }

  const systemPrompt = isRestDay
    ? `Jij bent Aura, de AI fitness coach van ${userModel.name || "Gebruiker"}. Focus: Yoga & Stretchen.${painRule}${muscleSplitRule}
    1. Genereer exact ${numberOfExercises} yoga/stretch oefeningen.
    2. Startgewicht 'targetWeight' moet 0 zijn. Apparatuur 'equip' 'Yoga mat' of 'Lichaamsgewicht'.
    3. Geef een 'executionCue' (max 2 zinnen), een 'formGuide' (array van 3-4 strings), en een 'safetyTip' (string) in het Nederlands.`
    : `Jij bent Aura, de AI fitness coach van ${userModel.name || "Gebruiker"}. Focus: ${sessionName}.${painRule}${baselinePrompt}${muscleSplitRule}${candidateRule}${beginnerRule}${goalRule}${volumeRule}${stabilityRule}${progressionRule}${deloadRule}
    1. Apparatuur van gebruiker: ${JSON.stringify(userModel.equipment || [])}. Gebruik UITSLUITEND deze.
    2. Genereer exact ${numberOfExercises} hoofdoefeningen, PLUS verplicht één extra warming-up oefening als EERSTE item (sets 1, reps '5-10 minuten', targetWeight 0, restSeconds 30).
    3. Sorteer van heavy compound (squat, bench) naar isolation (bicep curl, calves).
    4. Geef reële 'targetWeight' in kg.
    5. Geef 'executionCue' (max 2 zinnen), 'formGuide' (3-4 stappen), en 'safetyTip' in het Nederlands.`;

  return { systemPrompt, prescribedWeights, isMaxEffortTestWeek };
}

function getMuscleCategoriesForFocus(sessionName: string): string[] {
  const focus = (sessionName || "").toLowerCase();
  if (focus.includes("full body") || focus.includes("combinatie")) {
    return ["borst", "rug", "schouders", "benen", "biceps", "triceps", "core"];
  }
  if (focus.includes("upper") || focus.includes("bovenlichaam")) {
    return ["borst", "rug", "schouders", "biceps", "triceps"];
  }
  if (focus.includes("lower") || focus.includes("benen") || focus.includes("legs")) {
    return ["benen", "quadriceps", "hamstrings", "glute", "kuit"];
  }
  if (focus.includes("push")) {
    return ["borst", "schouder", "triceps"];
  }
  if (focus.includes("pull")) {
    return ["rug", "biceps", "onderrug"];
  }
  return [];
}

export function buildInsightPrompt(
  userModel: any,
  metrics: any,
  steps: number,
  history: any[],
  isRestDay: boolean,
  sessionCompletedToday: boolean,
  nextSession: string,
  prefs: any
): string {
  const counts: Record<string, number> = { Makkelijk: 0, Perfect: 0, Maximaal: 0 };
  (Array.isArray(history) ? history : []).forEach((session: any) => {
    (session?.exercises || []).forEach((ex: any) => {
      if (ex?.intensity && counts[ex.intensity] !== undefined) {
        counts[ex.intensity]++;
      }
    });
  });
  const total = counts.Makkelijk + counts.Perfect + counts.Maximaal;
  let dominant = "Perfect";
  if (total > 0) {
    if (counts.Maximaal / total > 0.5) dominant = "Maximaal";
    else if (counts.Makkelijk / total > 0.5) dominant = "Makkelijk";
  }

  let prompt = `Je bent Aura, de persoonlijke AI fitness coach van ${userModel.name || "Gebruiker"} (doel: ${userModel.goal || "Hypertrofie"}).
  WETENSCHAPPELIJKE REGEL: Lopen (stappen) is LISS cardio. Raad NOOIT af om benen te trainen vanwege wandelen! Wandelen = actief herstel. Alleen bij >12000 stappen mag je eventueel adviseren om het *volume* (aantal sets) licht te verlagen, maar kracht/intensiteit blijft nodig.`;

  if (sessionCompletedToday) {
    prompt += `\nDE GEBRUIKER HEEFT VANDAAG EEN TRAINING SUCCESVOL VOLTOOID.
    - Feliciteer ze kort en enthousiast met de prestatie.
    - Geef wetenschappelijk onderbouwd advies voor herstel direct na de training.`;
  } else if (isRestDay) {
    prompt += `\nVANDAAG IS EEN GEPLANDE RUSTDAG. Er staat geen workout gepland vandaag.
    - Geef tips voor herstel (voeding, mobiliteit, slaap). Moedig ze NIET aan om te trainen.`;
  } else {
    prompt += `\nVANDAAG IS EEN TRAININGSDAG voor de ${nextSession || "geplande split"}.
    - Geef een motiverend inzicht om progressive overload te bereiken.`;
  }

  prompt += `\nLogboek: ${JSON.stringify(history || [])}. Spierherstel percentages (0=kapot, 100=optimaal): ${JSON.stringify(metrics || {})}. Vandaag gezette stappen: ${steps || 0}.`;

  if (dominant === "Maximaal") {
    prompt += `\nDe gebruiker rapporteert overwegend MAXIMALE inspanning. Benoem dat extra herstel belangrijk is.`;
  } else if (dominant === "Makkelijk") {
    prompt += `\nDe gebruiker rapporteert overwegend MAKKELIJKE sessies. Moedig aan zwaarder te gaan.`;
  }

  const painNotes: string[] = Array.isArray(prefs?.painNotes) ? prefs.painNotes : [];
  if (painNotes.length > 0) {
    prompt += `\nPIJNPUNTEN: ${painNotes.join(", ")}. Houd hier rekening mee, train niet door pijn.`;
  }

  prompt += `\nGeef in maximaal 3 zinnen een wetenschappelijk onderbouwd inzicht voor vandaag. Spreek de gebruiker rechtstreeks aan met 'je'. Geen markdown, geen opsommingen.`;
  return prompt;
}

export function buildChatPrompt(
  userModel: any,
  metrics: any,
  history: any[],
  chatHistory: any[],
  message: string
): string {
  const painPoints = userModel?.painPoints || [];
  const painNote = painPoints.length > 0
    ? `\nGEMELDE PIJNPUNTEN: ${painPoints.join(", ")}. Houd hier rekening mee, maar geef GEEN medisch advies.`
    : "";

  return `Jij bent Aura, de AI fitness coach. Je praat in het Nederlands, kort en behulpzaam.

CONTEXT VAN DE GEBRUIKER:
- Doel: ${userModel?.goal || "onbekend"}
- Beschikbare apparatuur: ${(userModel?.equipment || []).join(", ")}
- Huidige vermoeidheidsstatus per spiergroep: ${JSON.stringify(metrics || {})}${painNote}

STRIKTE SCOPE-REGELS:
1. Beantwoord ALLEEN vragen over training, spierherstel, voeding rondom sporten, en het gebruik van deze app. Bij andere onderwerpen: leg in 1-2 zinnen uit dat je alleen over fitness kan helpen.
2. Bij pijn/blessures: geef NOOIT een diagnose of medisch advies. Verwijs door naar arts/fysio.
3. Wees eerlijk en concreet.

GESPREKSGESCHIEDENIS:
${(chatHistory || []).map((m: any) => `${m.role === 'user' ? 'Gebruiker' : 'Aura'}: ${m.text}`).join("\n")}

NIEUWE VRAAG: ${message}

Geef alleen je antwoord als Aura.`;
}

export function buildTipsPrompt(exerciseName: string, muscle: string): string {
  return `Jij bent Aura, de AI fitness coach.
  Schrijf specifieke instructies voor de oefening: "${exerciseName}" (spiergroep/spier: ${muscle}).
  Geef:
  1. Een 'executionCue' (max 2 zinnen): HOE de beweging technisch correct wordt uitgevoerd én WAAR de gebruiker mentaal op moet letten.
  2. Een 'formGuide' (array van 3-4 strings): stap-voor-stap instructies in het Nederlands.
  3. Een 'safetyTip' (string): een concrete veiligheidswaarschuwing in het Nederlands om blessures te voorkomen.

  Genereer dit in JSON-formaat.`;
}

// Schemas (OpenAPI 3.0 compatible format for direct REST API calls)

export function getWorkoutSchema(): any {
  return {
    type: "ARRAY",
    description: "Lijst met gegenereerde oefeningen",
    items: {
      type: "OBJECT",
      properties: {
        name: {
          type: "STRING",
          description: "Naam van de oefening in het Nederlands"
        },
        muscle: {
          type: "STRING",
          description: "Primaire spiergroep: Borst, Bovenrug, Onderrug, Schouders, Biceps, Triceps, Quadriceps, Hamstrings, Gluten, Kuiten of Core"
        },
        equip: {
          type: "STRING",
          description: "De benodigde apparatuur (bijv. 'Barbell', 'Dumbbells', 'Lichaamsgewicht')"
        },
        sets: {
          type: "INTEGER",
          description: "Aantal sets (meestal 3 of 4)"
        },
        reps: {
          type: "STRING",
          description: "Reps richtlijn (bijv. '8-10', '10-12', '12-15')"
        },
        targetWeight: {
          type: "NUMBER",
          description: "Startgewicht of overload gewicht in kg"
        },
        restSeconds: {
          type: "INTEGER",
          description: "Rusttijd tussen sets in seconden"
        },
        executionCue: {
          type: "STRING",
          description: "Uitvoerings- en focus-tip in maximaal 2 zinnen"
        },
        formGuide: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Stap-voor-stap instructies voor de uitvoering"
        },
        safetyTip: {
          type: "STRING",
          description: "Veiligheidswaarschuwing om blessures te voorkomen"
        }
      },
      required: [
        "name",
        "muscle",
        "equip",
        "sets",
        "reps",
        "targetWeight",
        "restSeconds",
        "executionCue",
        "formGuide",
        "safetyTip"
      ]
    }
  };
}

export function getTipsSchema(): any {
  return {
    type: "OBJECT",
    properties: {
      executionCue: { type: "STRING" },
      formGuide: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      safetyTip: { type: "STRING" }
    },
    required: ["executionCue", "formGuide", "safetyTip"]
  };
}
