/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import cors from "cors";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Geverifieerde oefeningen-database (publiek domein, free-exercise-db), één keer geladen
// bij serverstart. Wordt gebruikt om de AI te laten kiezen uit bestaande, betrouwbare
// oefeningnamen i.p.v. elke keer vrij te verzinnen — consistenter en minder kans op
// vreemde of onlogische oefeningnamen.
interface DbExercise {
  name: string;
  equipment: string | null;
  level: string;
  category: string;
  primaryMuscles: string[];
  images: string[];
}
let exerciseDatabase: DbExercise[] = [];
const exerciseImageIndex = new Map<string, string[]>();

// Normaliseert een oefeningnaam zodat kleine verschillen (hoofdletters, streepjes,
// "Barbell" vóór de naam, leestekens) de match niet meer breken.
function normalizeExerciseName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[-_/]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

try {
  const raw = fs.readFileSync(path.join(__dirname, "data", "exercises-min.json"), "utf-8");
  exerciseDatabase = JSON.parse(raw);
  exerciseDatabase.forEach((ex) => {
    if (ex.name && ex.images?.length) {
      exerciseImageIndex.set(normalizeExerciseName(ex.name), ex.images);
    }
  });
} catch (err) {
  console.warn("Kon exercises-min.json niet laden, AI valt terug op vrij genereren:", err);
}

const EXERCISE_IMAGE_BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// Zoekt een afbeelding voor een door de AI gegenereerde oefeningnaam, ook als die niet
// exact overeenkomt met de database. Volgorde: (1) exacte match na normaliseren,
// (2) de ene naam bevat de andere volledig (bijv. AI zegt 'Bench Press', database heeft
// 'Barbell Bench Press - Medium Grip'), (3) woord-overlap als laatste redmiddel. Dit is
// nodig omdat de AI niet altijd letterlijk de database-naam overneemt, ondanks de
// kandidatenlijst-instructie — fuzzy matching maakt dat geen probleem i.p.v. een hopeloze
// strengere prompt-regel te blijven proberen.
function findExerciseImages(exerciseName: string): string[] | undefined {
  const normalized = normalizeExerciseName(exerciseName);
  if (!normalized) return undefined;

  const exact = exerciseImageIndex.get(normalized);
  if (exact) return exact;

  let bestMatch: { images: string[]; score: number } | null = null;
  for (const [dbNameNorm, images] of exerciseImageIndex.entries()) {
    let score = 0;
    if (dbNameNorm.includes(normalized) || normalized.includes(dbNameNorm)) {
      score = Math.min(normalized.length, dbNameNorm.length);
    } else {
      const stem = (w: string): string => (w.endsWith("es") ? w.slice(0, -2) : w.endsWith("s") && w.length > 3 ? w.slice(0, -1) : w);
      const aiWords = new Set(normalized.split(" ").map(stem));
      const dbWords = dbNameNorm.split(" ").filter((w) => w.length > 2).map(stem);
      const overlap = dbWords.filter((w) => aiWords.has(w)).length;
      if (dbWords.length > 0 && overlap >= 2 && overlap / dbWords.length >= 0.5) {
        score = overlap;
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { images, score };
    }
  }
  return bestMatch?.images;
}

// Voegt een afbeeldings-URL toe aan elke gegenereerde oefening waarvoor een (fuzzy)
// match wordt gevonden — puur achteraf, de AI weet niets van afbeeldingen, dus dit kan
// nooit een compleet verzonnen afbeelding opleveren, alleen een net iets minder exacte.
// Dwingt server-side berekende gewichten af op de AI-respons, in plaats van erop te
// vertrouwen dat de AI de "gebruik EXACT Xkg"-instructie letterlijk overneemt. Matcht op
// genormaliseerde naam (hoofdletter/spatie-ongevoelig) zodat kleine AI-afwijkingen in
// naamgeving de afdwinging niet breken. Exercises zonder match blijven ongewijzigd.
function enforcePrescribedWeights(exercises: any[], prescribedWeights: Record<string, number>): any[] {
  if (!Array.isArray(exercises) || Object.keys(prescribedWeights).length === 0) return exercises;
  return exercises.map((ex) => {
    const key = (ex?.name || "").toLowerCase().trim();
    if (key && prescribedWeights[key] !== undefined) {
      return { ...ex, targetWeight: prescribedWeights[key] };
    }
    return ex;
  });
}

// Markeert alleen de getrackte hoofdoefening(en) als geschikt voor een max-effort-test,
// puur server-side bepaald (zie computeMaxEffortTestDue) — nooit door de gebruiker vrij
// te kiezen. Gebruikt dezelfde genormaliseerde namen als prescribedWeights, zodat alleen
// oefeningen met een continue progressie-geschiedenis getest worden, niet accessoires of
// een net-gewisselde variant (nieuw blok) waarvoor geen eerlijke vergelijking bestaat.
function enforceMaxEffortFlag(exercises: any[], trackedLiftNames: Set<string>, testDue: boolean): any[] {
  if (!Array.isArray(exercises)) return exercises;
  return exercises.map((ex) => {
    const key = (ex?.name || "").toLowerCase().trim();
    if (key && trackedLiftNames.has(key)) {
      return { ...ex, maxEffortTestDue: testDue };
    }
    return { ...ex, maxEffortTestDue: false };
  });
}

function enrichExercisesWithImages(exercises: any[]): any[] {
  if (!Array.isArray(exercises)) return exercises;
  return exercises.map((ex) => {
    const images = ex?.name ? findExerciseImages(ex.name) : undefined;
    if (images && images.length > 0) {
      const fullUrls = images.map((img) => EXERCISE_IMAGE_BASE_URL + img);
      return { ...ex, imageUrl: fullUrls[0], images: fullUrls };
    }
    return ex;
  });
}

// Normaliseert een sessienaam zodat kleine variaties (extra spaties, hoofdletters,
// leestekens) de geschiedenis-matching niet breken — dezelfde aanpak als bij
// oefeningnamen, want blok-rotatie en progressie hangen hier volledig van af.
function normalizeSessionName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sessionNamesMatch(a: string, b: string): boolean {
  const na = normalizeSessionName(a);
  const nb = normalizeSessionName(b);
  return !!na && !!nb && na === nb;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // --- PERSISTENT USER ACCOUNTS & PROFILES DATA STORE ---
  const PROFILES_FILE = path.join(__dirname, "data", "profiles.json");

  function readProfiles(): any[] {
    try {
      if (fs.existsSync(PROFILES_FILE)) {
        const raw = fs.readFileSync(PROFILES_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error("Error reading profiles file:", err);
    }
    return [];
  }

  function writeProfiles(profiles: any[]) {
    try {
      const dir = path.dirname(PROFILES_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing profiles file:", err);
    }
  }

  // GET: Saved profiles switcher list (id and username only, never password)
  app.get("/api/auth/profiles", (req, res) => {
    try {
      const profiles = readProfiles();
      const list = profiles.map(p => ({ id: p.id, username: p.username }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Register new account
  app.post("/api/auth/register", (req, res) => {
    try {
      const { username, password, name, goal } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ message: "Vul alle velden in." });
      }

      const profiles = readProfiles();
      if (profiles.some(p => p.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({ message: "Gebruikersnaam bestaat al." });
      }

      const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
      const id = "server_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

      const newProfile = {
        id,
        username,
        password: hashedPassword,
        userModel: {
          name,
          goal: goal || "Hypertrofie",
          daysPerWeek: 3,
          experience: "beginner",
          duration: 60,
          equipment: ["Bodyweight Alleen"],
          painPoints: [],
          language: "nl",
          age: 30
        },
        baselineData: null,
        history: [],
        exercisePrefs: { likes: [], dislikes: [], painNotes: [] },
        steps: 0,
        lastSync: null,
        nextSession: "",
        activeWorkoutData: null,
        createdAt: new Date().toISOString()
      };

      profiles.push(newProfile);
      writeProfiles(profiles);

      // Return profile without password
      const { password: _, ...profileWithoutPassword } = newProfile;
      res.json(profileWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Login to existing account
  app.post("/api/auth/login", (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Vul alle velden in." });
      }

      const profiles = readProfiles();
      const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

      const match = profiles.find(p => 
        p.username.toLowerCase() === username.toLowerCase() && 
        (p.password === hashedPassword || p.password === password)
      );

      if (!match) {
        return res.status(401).json({ message: "Ongeldige gebruikersnaam of wachtwoord." });
      }

      // Return match without password
      const { password: _, ...profileWithoutPassword } = match;
      res.json(profileWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Sync/Save profile details
  app.post("/api/auth/save", (req, res) => {
    try {
      const updatedProfile = req.body;
      if (!updatedProfile || !updatedProfile.id) {
        return res.status(400).json({ message: "Ongeldige profielgegevens." });
      }

      const profiles = readProfiles();
      const idx = profiles.findIndex(p => p.id === updatedProfile.id);

      if (idx !== -1) {
        // Keep the password field if it isn't provided or match it
        const existingPassword = profiles[idx].password;
        profiles[idx] = {
          ...updatedProfile,
          password: existingPassword
        };
        writeProfiles(profiles);
        res.json({ success: true });
      } else {
        profiles.push(updatedProfile);
        writeProfiles(profiles);
        res.json({ success: true });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Get profile details by id
  app.post("/api/auth/get", (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ message: "Gebruikers-ID ontbreekt." });
      }

      const profiles = readProfiles();
      const match = profiles.find(p => p.id === id);

      if (!match) {
        return res.status(404).json({ message: "Profiel niet gevonden." });
      }

      // Return profile without password
      const { password: _, ...profileWithoutPassword } = match;
      res.json(profileWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Helper for Lazy Gemini SDK initialization
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(userApiKey?: string): GoogleGenAI {
    const key = userApiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is niet ingesteld. Voeg deze toe in Settings > Secrets of in je profiel.");
    }
    if (!aiClient || userApiKey) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Helper to check if an error is due to a rate limit or quota exhaustion (429)
  function isQuotaError(err: any): boolean {
    if (!err) return false;
    const errString = typeof err === "string" ? err : (err.message || "") + " " + (err.status || "") + " " + JSON.stringify(err);
    return (
      errString.includes("429") ||
      errString.includes("quota") ||
      errString.includes("QUOTA") ||
      errString.includes("limit") ||
      errString.includes("exhausted") ||
      errString.includes("RESOURCE_EXHAUSTED") ||
      err.status === "RESOURCE_EXHAUSTED" ||
      err.code === 429
    );
  }

  // Vat de gerapporteerde intensiteit van recente trainingen samen (Makkelijk/Perfect/Maximaal),
  // zodat de AI-coach hier expliciet op kan reageren in plaats van generieke tekst te geven.
  function summarizeRecentIntensity(history: any[]): { text: string; dominant: string } {
    const counts: Record<string, number> = { Makkelijk: 0, Perfect: 0, Maximaal: 0 };
    (Array.isArray(history) ? history : []).forEach((session: any) => {
      (session?.exercises || []).forEach((ex: any) => {
        if (ex?.intensity && counts[ex.intensity] !== undefined) {
          counts[ex.intensity]++;
        }
      });
    });
    const total = counts.Makkelijk + counts.Perfect + counts.Maximaal;
    if (total === 0) {
      return { text: "Nog geen intensiteit-data beschikbaar.", dominant: "onbekend" };
    }
    let dominant = "Perfect";
    if (counts.Maximaal / total > 0.5) dominant = "Maximaal";
    else if (counts.Makkelijk / total > 0.5) dominant = "Makkelijk";
    return {
      text: `Laatste sessies gerapporteerd: ${counts.Maximaal}x Maximaal, ${counts.Perfect}x Perfect, ${counts.Makkelijk}x Makkelijk.`,
      dominant,
    };
  }

  // Bepaalt of de huidige week een deload-week moet zijn: elke 6 weken, geteld vanaf de nulmeting.
  function computeDeloadWeek(baseline: any): boolean {
    if (!baseline?.completedAt) return false;
    const weeksSince = Math.floor(
      (Date.now() - new Date(baseline.completedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return weeksSince > 0 && weeksSince % 6 === 0;
  }

  // Bepaalt of dit een geplande max-effort-test-week is: elke 8 weken (2 blokken), geteld
  // vanaf de nulmeting. Dit is BEWUST server-bepaald, niet iets wat de gebruiker vrij kan
  // kiezen — een echte max-poging hoort te gebeuren als je fris bent, met opbouw ervoor, en
  // te vaak "Maximaal" aanklikken zou de plateau-detectie en progressie-logica vervuilen met
  // oneerlijke data (die functies gaan ervan uit dat 'Maximaal' een spontaan, eerlijk signaal
  // is, geen bewust getriggerde test).
  function computeMaxEffortTestDue(baseline: any): boolean {
    if (!baseline?.completedAt) return false;
    const weeksSince = Math.floor(
      (Date.now() - new Date(baseline.completedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return weeksSince > 0 && weeksSince % 8 === 0;
  }

  // Bepaalt het huidige periodiseringsblok (4 weken per blok), geteld vanaf de nulmeting.
  // Wordt gebruikt om hoofdoefeningen periodiek te laten rouleren — zelfde spiergroep/functie,
  // andere stimulus — zodat gewrichten/pezen niet eindeloos dezelfde bewegingsbaan krijgen en
  // het lichaam een nieuwe prikkel krijgt, terwijl progressie binnen een blok trackbaar blijft.
  function computeBlockNumber(baseline: any, referenceTimestamp?: number): number {
    if (!baseline?.completedAt) return 1;
    const reference = referenceTimestamp || Date.now();
    const weeksSince = Math.floor(
      (reference - new Date(baseline.completedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return Math.floor(Math.max(0, weeksSince) / 4) + 1;
  }

  // Deterministische double-progression: het nieuwe gewicht volgt uit een vaste regel,
  // niet uit een vrije AI-inschatting. Gebaseerd op de zelf-gerapporteerde intensiteit.
  // Snellere correctie: als de laatste 2 matchende sessies BEIDE 'Makkelijk' waren,
  // is een enkele +5%-stap te traag — dan een grotere stap om sneller bij te trekken.
  function computeProgressedWeight(previousWeight: number, previousIntensity?: string, recentIntensities?: string[]): number {
    if (!previousWeight || previousWeight <= 0) return previousWeight;
    if (recentIntensities && recentIntensities.length >= 2 && recentIntensities.slice(0, 2).every((i) => i === "Makkelijk")) {
      return Math.round(previousWeight * 1.1 * 2) / 2; // +10%, dubbele snelheid bij herhaaldelijk te makkelijk
    }
    if (previousIntensity === "Makkelijk") return Math.round(previousWeight * 1.05 * 2) / 2; // +5%
    if (previousIntensity === "Maximaal") return previousWeight; // geen extra belasting na maximale inspanning
    return Math.round(previousWeight * 1.025 * 2) / 2; // 'Perfect' of onbekend: +2,5%
  }

  // Vertaalt het gekozen doel naar concrete, wetenschappelijk onderbouwde reps/rust-regels.
  // Berekent het aantal hoofdoefeningen op basis van de beschikbare tijd (userModel.duration)
  // en het doel — i.p.v. een vast aantal te gebruiken ongeacht of iemand 30 of 90 minuten heeft.
  // Model: (duration - opwarmtijd) / tijd-per-oefening, waarbij tijd-per-oefening volgt uit de
  // doel-specifieke sets/rust die we al elders bepalen (buildGoalRule), plus een transitiebuffer.
  function computeNumberOfExercises(duration: number, goal: string): number {
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
  }

  function buildGoalRule(goal: string, numberOfExercises: number, equipment: string[]): string {
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
        - Dit is GEEN lichtere hypertrofie-training — het doel is gewrichtsmobiliteit, houding en doorbloeding, niet spiergroei.
        - Prioriteer mobiliteit- en stabiliteitsoefeningen met een groot bewegingsbereik (bijv. rotator cuff work, hip mobility drills, lichte kabeloefeningen door de volledige range) boven zware compound-bewegingen.
        - Reps MOETEN tussen 12-20 liggen, met duidelijk lager gewicht dan gebruikelijk.
        - Rusttijd tussen sets: 30-45 seconden (geef dit door als 'restSeconds').
        - Houd het volume licht: 2-3 sets per oefening.`;
    }
    if (g.includes("vetverlies") || g.includes("conditie")) {
      return `\nSTRENGE VERPLICHTING VOOR DOEL 'VETVERLIES & CONDITIE':
        - Dit is GEEN krachttraining met kortere rust — minimaal 2 van de ${numberOfExercises} hoofdoefeningen MOETEN echte cardio/conditie-blokken zijn (bijv. 'HIIT op Loopband', 'Fietsergometer Intervallen', 'Rij-ergometer', 'Jumping Jacks Circuit'), gekozen uit de beschikbare apparatuur: ${equipList || "lichaamsgewicht-opties"}.
        - Voor deze cardio-blokken: 'reps' uitgedrukt als duur/intervallen (bijv. '10x 30s sprint / 30s rust', '15 minuten gematigd tempo'), targetWeight altijd 0, muscle 'Cardio'.
        - De OVERIGE oefeningen zijn krachtoefeningen met hoge reps (12-15), korte rust (20-40s, geef dit door als 'restSeconds'), als circuit-achtige aanvulling — geen zware compound-lifts.
        - 3 sets per oefening voor de krachtoefeningen is voldoende; prioriteer bewegingen die meerdere spiergroepen tegelijk belasten.`;
    }
    return `\nSTRENGE VERPLICHTING VOOR DOEL 'HYPERTROFIE':
        - Reps MOETEN tussen 8-12 liggen.
        - Rusttijd tussen sets: 60-90 seconden (geef dit door als 'restSeconds').
        - 3-4 sets per oefening is gebruikelijk.`;
  }

  // Wekelijks volumebudget: gebruikt de bestaande fatigue-ratio per spiergroep om te voorkomen
  // dat er nog meer volume bovenop een al verzadigde spiergroep wordt gestapeld.
  function buildVolumeBudgetRule(metrics: any): string {
    if (!metrics || typeof metrics !== "object") return "";
    const constrained: string[] = [];
    Object.entries(metrics).forEach(([muscle, info]: [string, any]) => {
      if (info && typeof info.ratio === "number" && info.ratio > 0.6) {
        const recoveryPct = Math.round((1 - info.ratio) * 100);
        constrained.push(`${muscle} (${recoveryPct}% herstel, ${info.rawSets || 0} recente sets)`);
      }
    });
    if (constrained.length === 0) return "";
    return `\nSTRENGE VERPLICHTING VOOR WEKELIJKS VOLUMEBUDGET:
        - Deze spiergroepen zitten al dicht bij hun volumegrens: ${constrained.join(", ")}.
        - Verlaag voor deze spiergroepen het aantal sets met minimaal 1 t.o.v. wat je anders zou voorstellen, of kies een lagere-belasting variant.
        - Geef binnen de toegestane spiergroep-selectie voorrang aan spieren met een hoger herstelpercentage.`;
  }

  // Plateau-detectie: als een oefening de laatste 3 sessies met dezelfde sessienaam
  // steeds als 'Maximaal' werd gerapporteerd, is er geen progressie meer — een stagnatie,
  // geen normale zware training. Vereist minimaal 3 eerdere matchende sessies in de geschiedenis.
  function detectPlateaus(history: any[], sessionName: string): string[] {
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

  // Schat 1RM via de Brzycki-formule, met een conservatieve veiligheidsmarge van 10%.
  // Reden: dit is een eenmalige schatting op basis van een populatie-gemiddelde formule,
  // zonder bewezen trainingshistorie — een te lichte inschatting is veilig en wordt
  // snel gecorrigeerd door de progressie-logica; een te zware inschatting is dat niet.
  // Als de gebruiker zijn werkelijke 1RM al kent, gebruik die direct (geen schatting nodig).
  function estimateOneRM(weight: number, reps: number, knownOneRM?: number): number {
    if (knownOneRM && knownOneRM > 0) return Math.round(knownOneRM);
    const rawEstimate = weight / (1.0278 - 0.0278 * reps);
    return Math.round(rawEstimate * 0.9);
  }

  // Schat een veilig startgewicht voor een EERSTE sessie zonder enige eerdere meting,
  // geschaald op lichaamsgewicht (dat al verzameld wordt bij profiel-aanmaak). Bewust
  // conservatieve ratio's — onderschatten is veilig, de progressie-logica trekt dit
  // binnen 1-2 sessies vanzelf bij zodra de gebruiker 'Makkelijk' rapporteert.
  function estimateFirstSessionWeight(bodyWeight: number, liftType: "push" | "pull" | "legs" | "overhead", experienceLevel?: string): number {
    const safeBodyWeight = bodyWeight && bodyWeight > 0 ? bodyWeight : 75;
    // Bewust conservatief als BASIS: dit is voor iemand zonder eerdere gewicht/reps-data.
    // Te licht corrigeert zichzelf snel via de progressie-logica na 'Makkelijk'; te zwaar bij
    // de allereerste keer is een reëel veiligheids- en motivatierisico — vooral voor beginners.
    const ratios: Record<string, number> = { push: 0.25, pull: 0.2, legs: 0.35, overhead: 0.15 };
    // Ervaringsniveau schaalt de basis: iemand die al een jaar+ traint heeft een reëel hogere
    // capaciteit, ook al zijn er geen exacte cijfers bekend. Dit voorkomt dat een gevorderde
    // gebruiker onnodig weken moet 'opbouwen' vanaf een beginners-startpunt.
    const experienceMultiplier: Record<string, number> = {
      beginner: 1,
      intermediate: 1.6,
      advanced: 2.2,
    };
    const multiplier = experienceMultiplier[(experienceLevel || "beginner").toLowerCase()] ?? 1;
    const raw = safeBodyWeight * ratios[liftType] * multiplier;
    return Math.max(5, Math.round(raw / 2.5) * 2.5);
  }

  // Vertaalt AURA's sessie-focus (Nederlands, dezelfde keywords als de muscleSplitRule)
  // naar de Engelse primaryMuscles-waarden uit de database.
  function getMuscleCategoriesForFocus(sessionName: string): string[] {
    const focus = (sessionName || "").toLowerCase();
    if (focus.includes("full body") || focus.includes("combinatie")) {
      return ["chest", "lats", "middle back", "shoulders", "quadriceps", "hamstrings", "biceps", "triceps", "abdominals"];
    }
    if (focus.includes("upper") || focus.includes("bovenlichaam")) {
      return ["chest", "lats", "middle back", "shoulders", "biceps", "triceps"];
    }
    if (focus.includes("lower") || focus.includes("benen") || focus.includes("legs")) {
      return ["quadriceps", "hamstrings", "calves", "glutes", "abductors", "adductors"];
    }
    if (focus.includes("push")) {
      return ["chest", "shoulders", "triceps"];
    }
    if (focus.includes("pull")) {
      return ["lats", "middle back", "lower back", "traps", "biceps", "forearms"];
    }
    if (focus.includes("borst") || focus.includes("chest")) {
      return ["chest"];
    }
    if (focus.includes("rug") || focus.includes("back")) {
      return ["lats", "middle back", "lower back", "traps"];
    }
    if (focus.includes("schouders") || focus.includes("shoulder")) {
      return ["shoulders"];
    }
    if (focus.includes("arm")) {
      return ["biceps", "triceps", "forearms"];
    }
    return ["chest", "lats", "shoulders", "quadriceps", "hamstrings", "biceps", "triceps", "abdominals"];
  }

  // Filtert de database op spiergroep + beschikbare apparatuur (met soepele matching,
  // zodat we geen exacte vertaaltabel voor elk apparatuur-label nodig hebben) en geeft
  // een beperkte kandidatenlijst terug om de prompt niet te overladen.
  function getCandidateExercises(
    muscleCategories: string[],
    userEquipment: string[],
    category: "strength" | "cardio" | "stretching",
    limit: number = 20,
    requireMuscleMatch: boolean = true
  ): string[] {
    if (exerciseDatabase.length === 0) return [];
    const normalizedEquip = (Array.isArray(userEquipment) ? userEquipment : []).map((e) => e.toLowerCase());
    const equipmentMatches = (dbEquip: string | null): boolean => {
      if (!dbEquip || dbEquip === "body only" || dbEquip === "other") return true;
      return normalizedEquip.some((e) => e.includes(dbEquip.toLowerCase()) || dbEquip.toLowerCase().includes(e));
    };

    if (!requireMuscleMatch || muscleCategories.length === 0) {
      const matches = exerciseDatabase.filter((ex) => ex.category === category && equipmentMatches(ex.equipment));
      return matches.slice(0, limit).map((ex) => ex.name);
    }

    // Verdeel het quotum gelijk over elke spiercategorie, zodat bij brede focussen
    // (Full Body, Upper, Lower) geen enkele spiergroep wordt overgeslagen doordat een
    // andere spiergroep toevallig meer matches in de database heeft.
    const perCategoryLimit = Math.max(2, Math.ceil(limit / muscleCategories.length));
    const seen = new Set<string>();
    const result: string[] = [];
    for (const cat of muscleCategories) {
      const matches = exerciseDatabase.filter(
        (ex) => ex.category === category && ex.primaryMuscles.includes(cat) && equipmentMatches(ex.equipment) && !seen.has(ex.name)
      );
      matches.slice(0, perCategoryLimit).forEach((ex) => {
        seen.add(ex.name);
        result.push(ex.name);
      });
    }
    return result;
  }

  // Helper to generate content with fallback and retry logic to avoid 503/429 errors
  async function generateContentWithFallback(
    ai: GoogleGenAI,
    options: {
      contents: string;
      config?: any;
      primaryModel?: string;
    }
  ) {
    const models = [
      options.primaryModel || "gemini-3.5-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite"
    ];
    // Filter out any duplicates while preserving order
    const uniqueModels = models.filter((item, pos) => models.indexOf(item) === pos);
    let lastError: any = null;

    for (const model of uniqueModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[AURA AI] Calling generateContent with model: ${model} (attempt ${attempt})`);
          const response = await ai.models.generateContent({
            model: model,
            contents: options.contents,
            config: options.config,
          });
          return response;
        } catch (err: any) {
          lastError = err;
          
          if (isQuotaError(err)) {
            console.log(`[AURA AI] Note: Quota limit reached for model ${model}. Attempting fallback to next available model...`);
            break; // Break the inner loop to instantly move to the next model in the fallback list!
          }

          console.log(`[AURA AI] Note: Model ${model} is currently busy or offline. Attempt ${attempt} completed.`);
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
    }
    throw lastError || new Error("Alle model-pogingen en fallbacks zijn mislukt.");
  }

  // 1. API Route for daily insights
  app.post("/api/gemini/insight", async (req, res) => {
    try {
      const { userModel, metrics, steps, history, userApiKey, isRestDay, sessionCompletedToday, nextSession, prefs, baseline } = req.body;
      const ai = getGeminiClient(userApiKey);
      const intensitySummary = summarizeRecentIntensity(history);
      const painNotes: string[] = Array.isArray(prefs?.painNotes) ? prefs.painNotes : [];
      const isDeloadWeekInsight = computeDeloadWeek(baseline);
      const weeksSinceBaseline = baseline?.completedAt
        ? Math.floor((Date.now() - new Date(baseline.completedAt).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : null;

      let prompt = `Je bent Aura, de persoonlijke AI fitness coach van ${userModel.name || "Gebruiker"} (doel: ${userModel.goal || "Hypertrofie"}).
      WETENSCHAPPELIJKE REGEL: Lopen (stappen) is LISS cardio. Raad NOOIT af om benen te trainen vanwege wandelen! Wandelen = actief herstel. Alleen bij >12000 stappen mag je eventueel adviseren om het *volume* (aantal sets) licht te verlagen, maar kracht/intensiteit blijft nodig.`;

      if (sessionCompletedToday) {
        prompt += `\nDE GEBRUIKER HEEFT VANDAAG EEN TRAINING SUCCESVOL VOLTOOID.
        - Feliciteer ze kort en enthousiast met de prestatie.
        - Geef wetenschappelijk onderbouwd advies voor herstel direct na de training (zoals eiwitsynthese, rehydratatie, herstelvoeding, spierpijn preventie of lichte stretching).
        - Benadruk dat de herstelfase nu is begonnen. Richten op rust voor spieropbouw.`;
      } else if (isRestDay) {
        prompt += `\nVANDAAG IS EEN GEPLANDE RUSTDAG. Er staat geen workout gepland vandaag.
        - Geef de gebruiker uitsluitend wetenschappelijk onderbouwde tips voor optimaal herstel (zoals slaapkwaliteit, actieve mobiliteit, voeding of hydratatie).
        - Moedig ze NIET aan om vandaag naar de sportschool te gaan of te trainen. Benadruk dat rust essentieel is voor spiergroei en herstel.`;
      } else {
        prompt += `\nVANDAAG IS EEN TRAININGSDAG voor de ${nextSession || "geplande split"}.
        - Geef een motiverend of voorbereidend inzicht om naar de sportschool te gaan en progressive overload te bereiken.`;
      }

      prompt += `\nLogboek: ${JSON.stringify(history || [])}. Spierherstel percentages (0=kapot, 100=optimaal): ${JSON.stringify(metrics || {})}. Vandaag gezette stappen: ${steps || 0}.
      ${intensitySummary.text}`;

      if (intensitySummary.dominant === "Maximaal") {
        prompt += `\nDe gebruiker rapporteert overwegend MAXIMALE inspanning de laatste tijd. Erken dit kort en expliciet, en benoem dat extra rust/herstel deze week belangrijk is.`;
      } else if (intensitySummary.dominant === "Makkelijk") {
        prompt += `\nDe gebruiker rapporteert overwegend MAKKELIJKE sessies. Moedig vriendelijk aan om de volgende sessie iets uitdagender aan te pakken (zwaarder gewicht of meer herhalingen).`;
      }

      if (painNotes.length > 0) {
        prompt += `\nGEMELDE PIJNPUNTEN/BLESSURES: ${painNotes.join(", ")}. Houd hier rekening mee in je advies en moedig NOOIT aan om door pijn heen te trainen.`;
      }

      if (isDeloadWeekInsight && weeksSinceBaseline !== null) {
        prompt += `\nDit is een deload-week (week ${weeksSinceBaseline} sinds de nulmeting) — een goed natuurlijk moment voor een eerlijke realiteitscheck. Geef naast je normale advies een kort, realistisch beeld van wat na ${weeksSinceBaseline} weken qua spieropbouw/kracht haalbaar is: natuurlijke hypertrofie is langzaam (circa 0,25-1% lichaamsgewicht per maand voor ervaren lifters, iets sneller in het eerste trainingsjaar). Vermijd overdreven enthousiasme of valse beloftes — wees eerlijk en geruststellend dat langzame, gestage progressie normaal en gezond is.`;
      }

      prompt += `\nGeef in maximaal 3 zinnen een wetenschappelijk onderbouwd inzicht voor vandaag. Spreek de gebruiker rechtstreeks aan met 'je'. Geen markdown, geen opsommingen.`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        primaryModel: "gemini-3.5-flash",
        config: {
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.log("[AURA AI] Notice: Biometric offline generator engaged. Delivering premium local biometrics guidance.");
      
      // Calculate high-quality localized biometrics-based fallback
      const { steps, isRestDay, sessionCompletedToday, nextSession } = req.body;
      const stepsCount = steps || 0;
      let fallbackText = "";

      if (sessionCompletedToday) {
        fallbackText = "Geweldige training vandaag! Je spieren hebben nu rust en herstelstoffen nodig om sterker te worden. Focus op eiwitrijke voeding, rehydratatie en minimaal 7-8 uur diepe slaap vanavond voor een optimale eiwitsynthese.";
      } else if (isRestDay) {
        fallbackText = "Vandaag is een geplande rustdag. Je spieren herstellen en groeien tijdens rust, niet tijdens de training. Focus op kwalitatieve voeding, actieve mobiliteit en voldoende slaap vanavond om je zenuwstelsel te ontlasten.";
      } else if (stepsCount > 12000) {
        fallbackText = `Je bent vandaag zeer actief met ${stepsCount} stappen (actief herstel). Als je vandaag krachttraning doet (zoals benen), overweeg dan om je trainingsvolume met 10% te verminderen om centrale vermoeidheid te beperken.`;
      } else if (stepsCount > 5000) {
        fallbackText = `Met ${stepsCount} stappen ben je vandaag goed in beweging! Dit stimuleert de doorbloeding, wat helpt bij het afvoeren van afvalstoffen en het herstellen van vermoeide spiervezels. Klaar voor je overload op ${nextSession || "je geplande split"}?`;
      } else {
        fallbackText = "Probeer vandaag nog wat actieve beweging te pakken om de bloedsomloop te stimuleren. Een korte wandeling van 15-20 minuten verhoogt de doorbloeding en versnelt het herstel van spierpijn van eerdere trainingen.";
      }

      res.json({ text: fallbackText, isFallback: true });
    }
  });

  // 2. API Route for workout generation
  app.post("/api/gemini/workout", async (req, res) => {
    try {
      const { userModel, metrics, history, prefs, sessionName, numberOfExercises: requestedExerciseCount, userApiKey, baseline, isRestDay } = req.body;
      // Negeer het binnenkomende aantal voor trainingsdagen — bereken het zelf op basis van
      // de werkelijke sessieduur (userModel.duration) en het doel, want een vast aantal
      // ongeacht beschikbare tijd is precies het probleem dat dit oplost.
      const numberOfExercises = isRestDay
        ? requestedExerciseCount || 5
        : computeNumberOfExercises(userModel.duration, userModel.goal);
      const ai = getGeminiClient(userApiKey);
      const isDeloadWeek = !isRestDay && computeDeloadWeek(baseline);
      // Basis-conditie voor een geplande max-effort-testweek (elke 8 weken). De uitsluiting
      // voor 'nieuw blok' (isNewBlock) wordt verderop toegepast, zodra dat bekend is — een
      // net-gewisselde oefeningvariant heeft geen progressiegeschiedenis om eerlijk te testen.
      const isMaxEffortTestWeekBase = !isRestDay && computeMaxEffortTestDue(baseline) && !isDeloadWeek;
      const painNotes: string[] = Array.isArray(prefs?.painNotes) ? prefs.painNotes : [];

      const hasBaselineNumbers = !!(
        baseline &&
        (baseline.benchPressWeight || baseline.squatWeight || baseline.latPulldownWeight || baseline.overheadPressWeight)
      );

      let baselinePrompt = "";
      if (baseline && !isRestDay && hasBaselineNumbers) {
        baselinePrompt = `\nGEBRUIKER NULMETING (BASELINE KRACHevaluatie):
        - Ervaringsniveau: ${baseline.experienceLevel || "Gematigd"}
        - Bench Press: werkset ${baseline.benchPressWeight || 50}kg voor ${baseline.benchPressReps || 8} reps (1RM: ${estimateOneRM(baseline.benchPressWeight || 50, baseline.benchPressReps || 8, baseline.benchPress1RM)}kg${baseline.benchPress1RM ? ", door gebruiker zelf opgegeven" : ", schatting met veiligheidsmarge"})
        - Back Squat: werkset ${baseline.squatWeight || 60}kg voor ${baseline.squatReps || 8} reps (1RM: ${estimateOneRM(baseline.squatWeight || 60, baseline.squatReps || 8, baseline.squat1RM)}kg${baseline.squat1RM ? ", door gebruiker zelf opgegeven" : ", schatting met veiligheidsmarge"})
        - Lat Pulldown / Row: werkset ${baseline.latPulldownWeight || 45}kg voor ${baseline.latPulldownReps || 8} reps (1RM: ${estimateOneRM(baseline.latPulldownWeight || 45, baseline.latPulldownReps || 8, baseline.latPulldown1RM)}kg${baseline.latPulldown1RM ? ", door gebruiker zelf opgegeven" : ", schatting met veiligheidsmarge"})
        - Overhead / Shoulder Press: werkset ${baseline.overheadPressWeight || 30}kg voor ${baseline.overheadPressReps || 8} reps (1RM: ${estimateOneRM(baseline.overheadPressWeight || 30, baseline.overheadPressReps || 8, baseline.overheadPress1RM)}kg${baseline.overheadPress1RM ? ", door gebruiker zelf opgegeven" : ", schatting met veiligheidsmarge"})
        
        STRENGE VERPLICHTING: Gebruik deze nulmeting als absolute schaalreferentie om startgewichten ('targetWeight') te bepalen voor alle gerelateerde spieren en oefeningen (bijv. bench press gewicht vertalen naar dumbbell press of pec-deck, squat gewicht vertalen naar leg press of extensions, enz.). Prescribeer nooit onrealistisch hoge of lage gewichten ten opzichte van deze baseline. Bij een "schatting met veiligheidsmarge" mag je de eerste paar sessies bewust iets aan de lichte kant blijven — de progressie-logica trekt dit snel bij zodra de gebruiker 'Makkelijk' rapporteert.`;
      } else if (!isRestDay && !hasBaselineNumbers) {
        const pushW = estimateFirstSessionWeight(userModel.weight, "push", baseline?.experienceLevel);
        const pullW = estimateFirstSessionWeight(userModel.weight, "pull", baseline?.experienceLevel);
        const legsW = estimateFirstSessionWeight(userModel.weight, "legs", baseline?.experienceLevel);
        const overheadW = estimateFirstSessionWeight(userModel.weight, "overhead", baseline?.experienceLevel);
        baselinePrompt = `\nGEBRUIKER NULMETING: GEEN CIJFERS BESCHIKBAAR (DIT IS DE ECHTE EERSTE SESSIE).
        - Ervaringsniveau (zelf opgegeven bij profiel): ${baseline?.experienceLevel || "beginner"}.
        - Er is GEEN eerdere gewicht/reps-data, want zelfs een ervaren lifter kan zonder eerdere sessies in DEZE app niet exact inschatten wat het juiste startgewicht hier is. Dat is geen ontbrekende data, dat is bewust zo.
        - Onderstaande referentiegewichten zijn AL GESCHAALD op het opgegeven ervaringsniveau (beginners lager, gevorderden hoger) — gebruik ze zoals ze zijn, schaal ze niet zelf nog verder. TOTAALGEWICHTEN voor een BARBELL-oefening (incl. de stang van ~20kg), geschaald op het lichaamsgewicht van de gebruiker (${userModel.weight || 75}kg): duwbewegingen ~${pushW}kg, trekbewegingen ~${pullW}kg, beenoefeningen ~${legsW}kg, overhead press ~${overheadW}kg.
        - KRITIEKE REKENREGEL VOOR ANDERE APPARATUUR (voorkom een veelgemaakte fout): 'targetWeight' bij DUMBBELL-oefeningen is het gewicht PER HAND, niet totaal — dus reken de barbell-referentie eerst om naar totaal-equivalent en deel dan door 2 (bijv. referentie 25kg totaal → dumbbells van ~10-12,5kg PER HAND, niet 25kg per hand). Bij MACHINES: kies bewust een lage, conservatieve stand, los van de referentiegetallen hierboven (machine-schalen verschillen te veel per merk om op dit lichaamsgewicht-getal te baseren).
        - KRITIEKE REGEL VOOR ISOLATIE-OEFENINGEN: bovenstaande referenties gelden alleen voor zware, samengestelde bewegingen (squat, bench press, deadlift, rij, overhead press). Voor isolatie-oefeningen (bijv. lateral raise, leg extension, bicep curl, triceps pushdown) gebruik je maximaal 30-40% van de relevante referentie — deze bewegen maar één gewricht en vragen dus veel minder gewicht, ook voor gevorderden.
        - Vermeld in de 'executionCue' van elke oefening dat dit startgewicht wordt aangepast zodra je hebt getraind, niet een vast gewicht. Formuleer dit PASSEND BIJ HET ERVARINGSNIVEAU: voor beginners bijv. "We beginnen licht zodat je de beweging leert; volgende keer passen we het gewicht aan op basis van hoe dit voelde." Voor gevorderden bijv. "We starten iets voorzichtig omdat dit je eerste sessie in deze app is; na vandaag kalibreren we snel naar je echte niveau." — geen kinderachtige uitleg voor iemand die al jaren traint.
        - Deze EERSTE sessie IS de eigenlijke nulmeting: vanaf de volgende sessie bepaalt de progressie-logica (op basis van gerapporteerde intensiteit) het juiste gewicht, niet een schattingsformule.`;
      }

      let muscleSplitRule = "";
      if (isRestDay) {
        const stretchCandidates = getCandidateExercises([], [], "stretching", 15, false);
        muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR RUSTDAG (YOGA & ACTIEF HERSTEL):
        - VANDAAG IS EEN GEPLANDE RUSTDAG. De gebruiker moet YOGA en STRETCHING doen ter bevordering van spierherstel en flexibiliteit.
        - Je MOET uitsluitend YOGA, STRETCHING en MOBILITEITS-oefeningen aanbevelen.${stretchCandidates.length > 0 ? ` Kies bij voorkeur namen uit deze geverifieerde lijst: ${stretchCandidates.join(", ")}.` : " (bijv. Child's Pose, Downward-Facing Dog, Cobra Pose, Pigeon Pose, Cat-Cow Stretch, Savasana, Sphinx Pose, Happy Baby Pose, enz.)"}
        - Het startgewicht ('targetWeight') MOET voor alle oefeningen exact 0 zijn (lichaamsgewicht / yoga mat).
        - De apparatuur ('equip') MOET 'Lichaamsgewicht' of 'Yoga mat' zijn.
        - De 'reps' MOETEN worden uitgedrukt als duur of ademhalingen (bijv. '60s', '45s', '5 min').
        - De primaire spiergroep ('muscle') moet de gestretchte regio zijn (bijv. 'Onderrug', 'Hamstrings', 'Gluten', 'Rug', 'Core', 'Heupen').`;
      } else {
        const focus = (sessionName || "").toLowerCase();
        if (focus.includes('full body') || focus.includes('combinatie')) {
          muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR FULL BODY:
          - Genereer een gevarieerde full body workout waarbij alle grote spiergroepen getraind worden.
          - Verdeel de ${numberOfExercises} hoofdoefeningen zo gelijk mogelijk over deze 5 categorieën: Borst, Rug (of Onderrug), Schouders, Benen (Quadriceps/Hamstrings/Gluten), Arm of Core (Biceps/Triceps/Kuiten/Core).
          - Doorloop ALLE 5 categorieën minstens één keer voordat je een categorie een TWEEDE keer kiest — pas bij meer dan 5 oefeningen mag een categorie dus opnieuw voorkomen. Bij minder dan 5 oefeningen: sla de categorie 'Arm of Core' als laatste over, niet Borst/Rug/Schouders/Benen.
          - Dit garandeert dat alle spiergroepen evenredig aan bod komen. Geen dubbele spiergroepen ten koste van anderen.`;
        } else if (focus.includes('upper') || focus.includes('bovenlichaam')) {
          muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR UPPER BODY:
          - Gebruik UITSLUITEND oefeningen voor het bovenlichaam (Borst, Rug, Schouders, Biceps, Triceps).
          - Absoluut GEEN oefeningen voor onderlichaam of benen (zoals Quadriceps, Hamstrings, Gluten, Kuiten). Dit is een harde limiet!
          - Verdeel de ${numberOfExercises} oefeningen zo gelijk mogelijk over Borst, Rug, Schouders, Biceps en Triceps — doorloop ALLE 5 categorieën minstens één keer voordat een categorie een tweede keer voorkomt (mits ${numberOfExercises} ≥ 5; anders prioriteer Borst, Rug en Schouders boven Biceps/Triceps).`;
        } else if (focus.includes('lower') || focus.includes('benen') || focus.includes('legs')) {
          muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR LOWER BODY / LEGS / BENEN:
          - Gebruik UITSLUITEND oefeningen voor het onderlichaam (Quadriceps, Hamstrings, Gluten, Kuiten).
          - Absoluut GEEN oefeningen voor het bovenlichaam (zoals Borst, Rug, Schouders, Biceps, Triceps). Dit is een harde limiet!
          - Verdeel de ${numberOfExercises} oefeningen zo gelijk mogelijk over Quadriceps, Hamstrings, Gluten en Kuiten — doorloop ALLE 4 categorieën minstens één keer voordat een categorie een tweede keer voorkomt (mits ${numberOfExercises} ≥ 4; anders prioriteer Quadriceps en Hamstrings boven Gluten/Kuiten).`;
        } else if (focus.includes('push')) {
          muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR PUSH DAY:
          - Gebruik UITSLUITEND duwbewegingen van het bovenlichaam (Borst, Schouders, Triceps).
          - Absoluut GEEN trekbewegingen (Rug, Biceps) of benen (Quadriceps, Hamstrings, Gluten, Kuiten) in deze training!`;
        } else if (focus.includes('pull')) {
          muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR PULL DAY:
          - Gebruik UITSLUITEND trekbewegingen van het bovenlichaam (Rug, Biceps, Onderrug).
          - Absoluut GEEN duwbewegingen (Borst, Schouders, Triceps) of pure quadriceps benen (Quadriceps, Kuiten) in deze training!`;
        } else if (focus.includes('borst') || focus.includes('chest')) {
          muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR BORST DAG:
          - Gebruik UITSLUITEND borstoefeningen (spier: 'Borst').
          - Absoluut geen andere grote spiergroepen (Rug, Schouders, Biceps, Triceps, Benen).`;
        } else if (focus.includes('rug') || focus.includes('back')) {
          muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR RUG DAG:
          - Gebruik UITSLUITEND rugoefeningen (spier: 'Rug' of 'Onderrug').
          - Absoluut geen borst, schouders, biceps, triceps of benen.`;
        } else if (focus.includes('schouders') || focus.includes('shoulder')) {
          muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR SCHOUDERS DAG:
          - Gebruik UITSLUITEND schouderoefeningen (spier: 'Schouders').
          - Absoluut geen borst, rug, biceps, triceps of benen.`;
        } else if (focus.includes('arm')) {
          muscleSplitRule = `\nSTRENGE VERPLICHTING VOOR ARMEN DAG:
          - Gebruik UITSLUITEND armoefeningen (spier: 'Biceps' of 'Triceps').
          - Absoluut geen borst, rug, schouders of benen.`;
        }
      }

      // Geverifieerde kandidaten-lijst uit de open exercise-database (free-exercise-db),
      // gefilterd op sessie-focus en beschikbare apparatuur. Voorkomt dat de AI vrij
      // oefeningnamen verzint die inconsistent of onlogisch kunnen zijn.
      let candidateExercisesRule = "";
      if (!isRestDay) {
        const muscleCategories = getMuscleCategoriesForFocus(sessionName);
        const isConditieGoal = (userModel.goal || "").toLowerCase().includes("conditie") || (userModel.goal || "").toLowerCase().includes("vetverlies");
        const strengthCandidates = getCandidateExercises(muscleCategories, userModel.equipment, "strength", 20);
        const cardioCandidates = isConditieGoal ? getCandidateExercises([], userModel.equipment, "cardio", 8, false) : [];
        if (strengthCandidates.length > 0) {
          candidateExercisesRule = `\nGEVERIFIEERDE OEFENINGEN-LIJST (gebruik bij voorkeur namen uit deze lijst, gefilterd op jouw spiergroep-focus en apparatuur):
          ${strengthCandidates.join(", ")}
          - Wijk hier alleen van af als geen enkele optie logisch past bij de exacte spiergroep-eis of apparatuur-beperking hierboven.${cardioCandidates.length > 0 ? `\n          - Voor de verplichte cardio-blokken, kies bij voorkeur uit: ${cardioCandidates.join(", ")}.` : ""}`;
        }
      }

      // Absolute veiligheidsregel: gemelde pijn/blessures overschrijven alle andere regels
      let painRule = "";
      if (painNotes.length > 0) {
        painRule = `\nABSOLUTE VEILIGHEIDSREGEL (OVERSCHRIJFT ALLE ANDERE REGELS):
        - De gebruiker heeft de volgende pijnpunten/blessures gemeld: ${painNotes.join(", ")}.
        - Vermijd VOLLEDIG elke oefening die deze regio belast of kan verergeren, ook als dat betekent dat je afwijkt van de normale spiergroep-verdeling voor deze sessie.
        - Kies een veilig alternatief binnen een vergelijkbare spiergroep-categorie. Voeg geen oefening toe waarbij je twijfelt over de veiligheid.
        - Dit is geen suggestie maar een harde grens.`;
      }

      // Doel-specifieke reps/rust + wekelijks volumebudget op basis van bestaande fatigue-data
      const goalRule = !isRestDay ? buildGoalRule(userModel.goal, numberOfExercises, userModel.equipment) : "";
      const volumeRule = !isRestDay ? buildVolumeBudgetRule(metrics) : "";

      // Ervaringsniveau-aanpassing: niet alleen beginners afremmen, ook gevorderden iets geven
      // dat aansluit bij hun niveau, in plaats van iedereen boven 'beginner' hetzelfde te behandelen.
      let beginnerRule = "";
      const expLevel = baseline?.experienceLevel;
      if (!isRestDay && expLevel === "beginner") {
        beginnerRule = `\nSTRENGE VERPLICHTING VOOR BEGINNERS:
        - Kies bewezen, stabiele basisoefeningen (machines of begeleide compound-bewegingen) boven complexe vrije-gewicht- of unilaterale varianten.
        - Wees conservatief met 'targetWeight': onderschatten is veiliger dan overschatten terwijl iemand de vorm nog leert.
        - Vermijd geavanceerde technieken (drop sets, rest-pause, super sets) volledig.`;
      } else if (!isRestDay && expLevel === "intermediate") {
        beginnerRule = `\nSTRENGE VERPLICHTING VOOR GEMIDDELD NIVEAU:
        - Vrije gewichten EN machines zijn beide toegestaan, normale oefening-complexiteit.
        - Geen geavanceerde intensiteitstechnieken nodig — focus op consistente, gestage progressieve overload.`;
      } else if (!isRestDay && expLevel === "advanced") {
        beginnerRule = `\nSTRENGE VERPLICHTING VOOR GEVORDERDEN:
        - Complexere, technische vrije-gewicht-bewegingen (bijv. unilaterale varianten, geavanceerde compound-lifts) zijn toegestaan en aanbevolen boven machines, mits de apparatuur het toelaat.
        - Eén enkele drop set of rest-pause set op de LAATSTE oefening van de sessie is toegestaan voor extra intensiteit (niet op de hoofdoefening die onder progressieve overload staat).
        - Kies het hogere eind van de sets-richtlijn voor het gekozen doel — deze gebruiker heeft een hogere volumetolerantie.`;
      }

      // Progressieve overload: hergebruik dezelfde hoofdoefeningen als de vorige keer voor deze sessie,
      // en bereken het nieuwe gewicht deterministisch i.p.v. dit aan de AI over te laten.
      // Plateau-detectie: 3x op rij 'Maximaal' op dezelfde lift = stagnatie, geen normale progressie.
      // Blok-rotatie: elke 4 weken (net als Fitbod) bewust een andere hoofdoefening-variant kiezen
      // voor dezelfde spiergroep/functie — voorkomt eindeloze belasting van dezelfde bewegingsbaan
      // en geeft een nieuwe prikkel, terwijl progressie BINNEN een blok gewoon trackbaar blijft.
      let stabilityRule = "";
      let progressionRule = "";
      const plateauedLifts = !isRestDay ? detectPlateaus(history, sessionName) : [];
      const currentBlock = computeBlockNumber(baseline);
      // Voorgeschreven gewichten die na de AI-respons server-side worden AFGEDWONGEN, niet
      // alleen als prompt-instructie meegegeven. Dit voorkomt dat een AI die de instructie
      // niet perfect volgt (bijv. een net iets ander getal teruggeeft) onopgemerkt blijft —
      // zelfde principe als bij de afbeeldingen: de server garandeert het, niet de AI.
      const prescribedWeights: Record<string, number> = {};
      let isNewBlock = false;
      if (!isRestDay && Array.isArray(history)) {
        const previousSession = history.find(
          (s: any) => sessionNamesMatch(s?.name, sessionName)
        );
        const previousSessionBlock = computeBlockNumber(baseline, previousSession?.timestamp);
        isNewBlock = !!baseline?.completedAt && !!previousSession?.timestamp && previousSessionBlock !== currentBlock;

        let previousMainLifts = (previousSession?.exercises || [])
          .slice(0, 2)
          .map((e: any) => e.name)
          .filter(Boolean);

        const userEquipList = (Array.isArray(userModel.equipment) ? userModel.equipment : []).map((e: string) => e.toLowerCase());
        previousMainLifts = previousMainLifts.filter((liftName: string) => {
          const dbEx = exerciseDatabase.find((ex) => ex.name === liftName);
          if (!dbEx) return true;
          const dbEquip = dbEx.equipment;
          if (!dbEquip || dbEquip === "body only" || dbEquip === "other") return true;
          return userEquipList.some((e: string) => e.includes(dbEquip.toLowerCase()) || dbEquip.toLowerCase().includes(e));
        });

        if (previousMainLifts.length > 0 && isNewBlock) {
          stabilityRule = `\nSTRENGE VERPLICHTING VOOR BLOK-ROTATIE (nieuw periodiseringsblok, elke 4 weken):
          - Er is een nieuw trainingsblok begonnen (blok ${currentBlock}). De hoofdoefeningen van het vorige blok waren: ${previousMainLifts.join(", ")}.
          - Kies voor de hoofdoefeningen bewust EEN ANDERE, vergelijkbare variant voor dezelfde spiergroep en beweegfunctie (bijv. Barbell Bench Press → Dumbbell Bench Press, of Back Squat → Front Squat / Hack Squat) — niet exact dezelfde naam.
          - Leg in de 'executionCue' van deze oefening kort uit dat dit een bewuste wisseling is voor een nieuwe prikkel na 4 weken, bijv. "Nieuw blok: we wisselen naar deze variant om je gewrichten te ontlasten en een nieuwe groeiprikkel te geven."
          - De progressie-teller begint voor deze nieuwe oefening opnieuw (geen 'vorig gewicht' beschikbaar, schat een realistisch startgewicht op basis van de nulmeting).`;
        } else if (previousMainLifts.length > 0) {
          stabilityRule = `\nSTRENGE VERPLICHTING VOOR PROGRESSIEVE OVERLOAD (blok ${currentBlock}, geen wisseling):
          - Vorige keer dat je een '${sessionName}' sessie genereerde, koos je als hoofdoefeningen: ${previousMainLifts.join(", ")}.
          - Je MOET deze exacte oefeningen herhalen (zelfde naam), zodat gewichtsprogressie trackbaar blijft, BEHALVE als ze op de dislikes-lijst staan.
          - Alleen de overige (accessoire) oefeningen mogen wisselen voor afwisseling.`;
        }

      if (previousMainLifts.length > 0 && !isNewBlock) {
        const matchingSessionsForWeights = history.filter(
          (s: any) => sessionNamesMatch(s?.name, sessionName)
        );
        const weightLines = (previousSession?.exercises || [])
          .slice(0, 2)
          .filter((e: any) => e?.name && typeof e?.topWeight === "number" && e.topWeight > 0)
          .map((e: any) => {
            if (plateauedLifts.includes(e.name)) {
              const reducedWeight = Math.round(e.topWeight * 0.9 * 2) / 2;
              prescribedWeights[e.name.toLowerCase().trim()] = reducedWeight;
              return `- '${e.name}': PLATEAU GEDETECTEERD (3x op rij 'Maximaal' zonder progressie). Gebruik EXACT ${reducedWeight}kg als targetWeight (10% lichter dan de vorige ${e.topWeight}kg) om het plateau te doorbreken. Vermeld dit kort en eerlijk in de 'executionCue' van deze oefening (bijv. "We doorbreken het plateau: iets lichter vandaag om je lichaam een nieuwe prikkel te geven.").`;
            }
            const recentIntensities = matchingSessionsForWeights
              .slice(0, 2)
              .map((s: any) => (s?.exercises || []).find((ex: any) => ex?.name === e.name)?.intensity)
              .filter(Boolean);
            const nextWeight = computeProgressedWeight(e.topWeight, e.intensity, recentIntensities);
            prescribedWeights[e.name.toLowerCase().trim()] = nextWeight;
            const fastTrack = recentIntensities.length >= 2 && recentIntensities.slice(0, 2).every((i: string) => i === "Makkelijk");
            return `- '${e.name}': vorige topWeight ${e.topWeight}kg, intensiteit '${e.intensity || "onbekend"}' → gebruik EXACT ${nextWeight}kg als targetWeight.${fastTrack ? " (versnelde correctie: 2x op rij Makkelijk gerapporteerd)" : ""}`;
          });
        if (weightLines.length > 0) {
          progressionRule = `\nSTRENGE VERPLICHTING VOOR GEWICHTSPROGRESSIE (deterministisch, niet zelf inschatten):
          ${weightLines.join("\n          ")}
          - Voor alle ANDERE oefeningen (zonder voorgeschreven gewicht hierboven) mag je nog steeds een realistisch gewicht inschatten op basis van de nulmeting en geschiedenis.`;
        }
      }
      }

      // Definitieve test-conditie: basisconditie MINUS de uitzondering voor een nieuw blok
      // (geen continue geschiedenis om eerlijk tegen te testen bij een net-gewisselde variant).
      const isMaxEffortTestWeek = isMaxEffortTestWeekBase && !isNewBlock;
      const trackedLiftNames = new Set(Object.keys(prescribedWeights));

      let maxEffortRule = "";
      if (isMaxEffortTestWeek && trackedLiftNames.size > 0) {
        maxEffortRule = `\nMAX-EFFORT-TESTWEEK (elke 8 weken, server-bepaald):
        - Dit is een geplande test-week voor je hoofdoefening(en). Vermeld dit kort en motiverend in de 'executionCue' van de betreffende hoofdoefening(en), bijv. "Test-week: als je je sterk voelt, mag je vandaag voor een nieuw record gaan op deze oefening."
        - Dit verandert NIETS aan het voorgeschreven 'targetWeight' hierboven — dat gewicht blijft het uitgangspunt, de test is een vrijwillige extra poging bovenop de normale set, geen vervanging van de normale progressie.`;
      }

      // Deload-week: minder volume, gelijke intensiteit
      let deloadRule = "";
      if (isDeloadWeek) {
        deloadRule = `\nSTRENGE VERPLICHTING VOOR DELOAD-WEEK:
        - Dit is een geplande deload-week (elke 6 weken). Verlaag het aantal sets per oefening met ongeveer 40-50% t.o.v. een normale week (bijv. 4 sets wordt 2, 3 sets wordt 2).
        - Houd het gewicht ('targetWeight') wel op het normale niveau — alleen het volume gaat omlaag, niet de intensiteit.${isNewBlock ? " UITZONDERING: dit is ook toevallig de start van een nieuw periodiseringsblok, dus er is geen 'normaal niveau' voor de nieuwe hoofdoefening-variant — schat voor die specifieke oefening een conservatief startgewicht, in lijn met de blok-rotatie-instructie hierboven." : ""}
        - Het AANTAL oefeningen blijft exact ${numberOfExercises}.`;
      }

      const systemPrompt = isRestDay
        ? `Jij bent Aura, de AI fitness coach van ${userModel.name || "Gebruiker"}.
        Sessie focus: Yoga & Actief Herstel (Rustdag).${muscleSplitRule}${painRule}
        STRENGE REGELS:
        1. De gebruiker is herstellende van eerdere zware workouts. Genereer absoluut GEEN gewichtheffen, fitness of krachttraining.
        2. Voorkeuren: Likes = ${JSON.stringify(prefs?.likes || [])}, Dislikes = ${JSON.stringify(prefs?.dislikes || [])}. Geef vaker likes en NOOIT dislikes.
        3. Genereer exact ${numberOfExercises} yoga poses of stretch oefeningen.
        4. Omdat dit yoga is, MOET het startgewicht ('targetWeight') voor elke oefening 0 kg zijn.
        5. De apparatuur ('equip') moet altijd 'Yoga mat' of 'Lichaamsgewicht' zijn.
        6. Geef voor elke pose een 'executionCue' (max 2 zinnen): waar in het lichaam de stretch/spanning gevoeld moet worden, en hoe te ademen tijdens de houding. Voorbeeld: "Laat je heupen zakken richting de mat en adem diep in je onderrug — voel de rek in je hamstrings, niet in je onderrug." Geen vage taal zoals 'voel je goed'.
        7. Geef voor elke pose een 'formGuide' (array van 3-4 strings): stap-voor-stap instructies in het Nederlands voor de specifieke yoga of stretch houding.
        8. Geef voor elke pose een 'safetyTip' (string): een concrete veiligheidswaarschuwing in het Nederlands om blessures of overstrekken bij deze houding te voorkomen.

        Genereer een lijst met yoga/stretch oefeningen in JSON-formaat.`
        : `Jij bent Aura, de AI fitness coach van ${userModel.name || "Gebruiker"}. Doel: ${userModel.goal || "Hypertrofie"}.
        Sessie focus: ${sessionName}.${painRule}${baselinePrompt}${muscleSplitRule}${candidateExercisesRule}${beginnerRule}${goalRule}${volumeRule}${stabilityRule}${progressionRule}${maxEffortRule}${deloadRule}
        STRENGE REGELS:
        1. Apparatuurlijst van gebruiker: ${JSON.stringify(userModel.equipment || [])}. Gebruik UITSLUITEND oefeningen die EXACT met deze materialen kunnen worden uitgevoerd. Geef in het 'equip' veld aan welke apparatuur gebruikt wordt.
        2. Voorkeuren: Likes = ${JSON.stringify(prefs?.likes || [])}, Dislikes = ${JSON.stringify(prefs?.dislikes || [])}. Geef vaker likes en NOOIT dislikes.
        3. Herstel biometrie: ${JSON.stringify(metrics || {})}. Ontzie spieren die uitgeput zijn.
        4. Genereer exact ${numberOfExercises} hoofdoefeningen, PLUS verplicht één extra warming-up oefening als EERSTE item in de lijst (dus in totaal ${numberOfExercises + 1} items). De warming-up: naam 'Warming-up', muscle de hoofdspiergroep van de sessie of 'Cardio', equip passend bij beschikbare apparatuur, sets 1, reps '5-10 minuten', targetWeight 0, restSeconds 30, en een executionCue met een korte, specifieke opwarmroutine die aansluit op de eerste hoofdoefening (bijv. lichte cardio plus 1-2 losse herhalingen met laag gewicht).
        5. Geef voor elke oefening een reëel startgewicht ('targetWeight') in kg op basis van de eerdere geschiedenis: ${JSON.stringify(history || [])} en bovenstaande nulmeting. Als een oefening nieuw is, schat dan een veilig startgewicht in dat perfect aansluit bij de nulmeting.
        6. Sorteer de oefeningen van meest samengesteld/multi-joint (bijv. squat, bench press, rij) naar meest geïsoleerd/single-joint (bijv. bicep curl, calf raise) — de zwaarste, meest technische oefening MOET eerst komen terwijl de gebruiker fris is (de warming-up uit regel 4 blijft uiteraard altijd als allereerste).
        7. Geef voor elke oefening een 'restSeconds' op volgens de doel-specifieke rusttijd hierboven.
        8. Geef voor elke oefening een 'executionCue' (max 2 zinnen): HOE de beweging technisch correct wordt uitgevoerd (tempo, gewrichtspositie, ademhaling) én WAAR de gebruiker mentaal op moet letten (welke spier moet je voelen, welke fout vermijden). Voorbeeld: "Houd je ellebogen dicht bij je lichaam en voel de spanning in je triceps bij het neerlaten — vermijd dat je schouders mee omhoog komen." Geen vage taal zoals 'let op je vorm'.
        9. Geef voor elke oefening een 'formGuide' (array van 3-4 strings): stap-voor-stap instructies in het Nederlands voor de specifieke uitvoering van deze specifieke oefening (bijv. ["Pak de stang op schouderbreedte vast", "Laat de stang gecontroleerd naar je borst zakken", "Duw krachtig uit en adem uit bij de inspanning"]).
        10. Geef voor elke oefening een 'safetyTip' (string): een concrete, specifieke veiligheidswaarschuwing in het Nederlands om blessures bij deze specifieke oefening te voorkomen (bijv. "Houd de polsen recht en druk je schouders in het bankje").
        
        STRENGE CONTROLE: Controleer of ELKE gegenereerde HOOFDoefening (dus exclusief de warming-up) voldoet aan de hierboven gedefinieerde spiergroep-beperkingen voor de huidige trainingsfocus. De warming-up (muscle 'Cardio' of de sessie-hoofdspiergroep) telt niet als overtreding van deze regel. Leg day mag GEEN borst, armen of schouders bevatten! Full Body MOET exact één oefening per hoofdcategorie hebben!

        Genereer een lijst met oefeningen in JSON-formaat.`;

      const response = await generateContentWithFallback(ai, {
        contents: systemPrompt,
        primaryModel: "gemini-3.5-flash",
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Naam van de oefening in het Nederlands of gangbare fitness term",
                },
                muscle: {
                  type: Type.STRING,
                  description: "Primaire spiergroep: Borst, Bovenrug, Onderrug, Schouders, Biceps, Triceps, Quadriceps, Hamstrings, Gluten, Kuiten of Core",
                },
                equip: {
                  type: Type.STRING,
                  description: "De benodigde apparatuur of spullen, specifiek en compleet (bijv. 'Barbell + bankje', 'Yoga mat + blok', niet alleen 'Machine')",
                },
                sets: {
                  type: Type.INTEGER,
                  description: "Aantal sets (meestal 3 of 4)",
                },
                reps: {
                  type: Type.STRING,
                  description: "Rep range of reps richtlijn (bijv. '8-10', '10-12', '12-15')",
                },
                targetWeight: {
                  type: Type.NUMBER,
                  description: "Veilig startgewicht of verhoogd overload gewicht in kg",
                },
                restSeconds: {
                  type: Type.INTEGER,
                  description: "Aanbevolen rusttijd tussen sets in seconden, volgens de doel-specifieke regel (bijv. 60-90 voor hypertrofie, 120-180 voor kracht)",
                },
                executionCue: {
                  type: Type.STRING,
                  description: "Concrete uitvoerings- en focus-tip in maximaal 2 zinnen: HOE de beweging/pose technisch correct wordt uitgevoerd (tempo, houding, ademhaling) én WAAR mentaal op gelet moet worden (welke spier of lichaamsdeel je moet voelen, welke fout te vermijden). Geen vage algemeenheden zoals 'let op je vorm' — altijd specifiek en lichaamsdeel-gericht.",
                },
                formGuide: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Stap-voor-stap instructies voor de juiste uitvoering van deze oefening, specifiek voor deze variant.",
                },
                safetyTip: {
                  type: Type.STRING,
                  description: "Een specifieke veiligheidswaarschuwing of focuspunt om blessures te voorkomen bij deze oefening.",
                },
              },
              required: ["name", "muscle", "equip", "sets", "reps", "targetWeight", "restSeconds", "executionCue", "formGuide", "safetyTip"],
            },
          },
        },
      });

      let text = response.text;
      if (!text) {
        throw new Error("Leeg antwoord ontvangen van AI.");
      }
      // Clean up markdown block if present
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsedExercises = JSON.parse(text);
      const weightEnforced = enforcePrescribedWeights(parsedExercises, prescribedWeights);
      const flagEnforced = enforceMaxEffortFlag(weightEnforced, trackedLiftNames, isMaxEffortTestWeek);
      // Debug-logging: zichtbaar in de terminal/dev-server-logs, NIET in de app-respons zelf
      // (de client verwacht een kale array, dus dit hoort hier los van te blijven). Geeft
      // inzicht in wat de periodiseringslogica deze aanvraag heeft besloten, zonder dat
      // daarvoor de code gelezen hoeft te worden.
      console.log("[AURA DEBUG]", JSON.stringify({
        sessionName,
        currentBlock,
        isNewBlock,
        isDeloadWeek,
        blockAndDeloadOverlap: isDeloadWeek && isNewBlock,
        isMaxEffortTestWeek,
        plateauedLifts,
        prescribedWeightsApplied: prescribedWeights,
      }));
      res.json(enrichExercisesWithImages(flagEnforced));
    } catch (error: any) {
      console.log("[AURA AI] Notice: Offline schedule generator engaged. Activating personalized offline database...");
      // Return a structured error response with status 200 to bypass browser-side 500 error display,
      // which will trigger the client-side local offline fallback cleanly.
      res.json({ error: "QUOTA_EXHAUSTED", message: error.message || "Quota limiet bereikt", data: [] });
    }
  });

  // 3. API Route for fetching specific exercise tips (for swapped exercises)
  app.post("/api/gemini/exercise-tips", async (req, res) => {
    try {
      const { exerciseName, muscle, userApiKey } = req.body;
      const ai = getGeminiClient(userApiKey);

      const systemPrompt = `Jij bent Aura, de AI fitness coach.
      Schrijf specifieke instructies voor de oefening: "${exerciseName}" (spiergroep/spier: ${muscle}).
      Geef:
      1. Een 'executionCue' (max 2 zinnen): HOE de beweging technisch correct wordt uitgevoerd én WAAR de gebruiker mentaal op moet letten.
      2. Een 'formGuide' (array van 3-4 strings): stap-voor-stap instructies in het Nederlands.
      3. Een 'safetyTip' (string): een concrete veiligheidswaarschuwing in het Nederlands om blessures te voorkomen.

      Genereer dit in JSON-formaat.`;

      const response = await generateContentWithFallback(ai, {
        contents: systemPrompt,
        primaryModel: "gemini-3.5-flash",
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executionCue: { type: Type.STRING },
              formGuide: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              safetyTip: { type: Type.STRING }
            },
            required: ["executionCue", "formGuide", "safetyTip"]
          }
        }
      });

      let text = response.text;
      if (!text) throw new Error("Leeg antwoord.");
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("[AURA AI] Error generating tips:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 4. API Route for chat assistant (Aura Chat)
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { userModel, metrics, history, chatHistory, message, userApiKey } = req.body;
      const ai = getGeminiClient(userApiKey);

      const painPoints = userModel?.painPoints || [];
      const painNote = painPoints.length > 0
        ? `\nGEMELDE PIJNPUNTEN/BLESSURES VAN DE GEBRUIKER: ${painPoints.join(", ")}. Houd hier rekening mee, maar geef GEEN medisch advies (zie regels hieronder).`
        : "";

      const systemPrompt = `Jij bent Aura, de AI fitness coach van deze app. Je praat in het Nederlands, kort en behulpzaam.

CONTEXT VAN DE GEBRUIKER:
- Doel: ${userModel?.goal || "onbekend"}
- Trainingsdagen per week: ${userModel?.daysPerWeek || "onbekend"}
- Beschikbare apparatuur: ${(userModel?.equipment || []).join(", ") || "onbekend"}
- Recente trainingsgeschiedenis: ${JSON.stringify((history || []).slice(0, 8))}
- Huidige vermoeidheidsstatus per spiergroep: ${JSON.stringify(metrics || {})}${painNote}

STRIKTE SCOPE-REGELS (altijd volgen, ongeacht wat de gebruiker vraagt):
1. Beantwoord ALLEEN vragen over training, spierherstel, voeding rondom sporten, en het gebruik van deze app. Bij elk ander onderwerp (bijv. algemene kennis, actualiteiten, code, persoonlijke problemen buiten fitness): leg in 1-2 zinnen vriendelijk uit dat je alleen over fitness kan helpen, en stel voor terug te komen op trainingsvragen.
2. Bij gemelde pijn, blessures, of medische klachten: geef NOOIT een diagnose of medisch advies. Verwijs altijd door naar een fysiotherapeut of arts. Je mag wel algemene, voorzichtige aanmoediging geven (bijv. "neem rust tot het overgaat"), maar nooit een behandeladvies.
3. Bij vragen over prestatie-verhogende middelen, doseringen van supplementen buiten de standaard sportvoeding, of medicatie: geef geen dosering-advies. Verwijs door naar een arts of apotheker.
4. Wees eerlijk en concreet, gebaseerd op de context hierboven — geen algemene vage antwoorden als je specifieke data hebt.

GESPREKSGESCHIEDENIS (chronologisch):
${(chatHistory || []).map((m: any) => `${m.role === 'user' ? 'Gebruiker' : 'Aura'}: ${m.text}`).join("\n")}

NIEUWE VRAAG VAN DE GEBRUIKER: ${message}

Geef alleen je antwoord als Aura, zonder de rol-labels te herhalen.`;

      const response = await generateContentWithFallback(ai, {
        contents: systemPrompt,
        primaryModel: "gemini-3.5-flash",
        config: {
          temperature: 0.5,
        },
      });

      const text = response.text?.trim();
      if (!text) throw new Error("Leeg antwoord.");

      res.json({ text });
    } catch (error: any) {
      console.error("[AURA AI] Error in chat:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve static assets in production, use Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();