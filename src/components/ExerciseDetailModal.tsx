import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Timer, Sparkles, CheckCircle2, Play, Activity, ShieldAlert, TrendingUp, Plus, Trash, Check, ArrowLeft, Flame, Trophy, Loader2 } from 'lucide-react';
import { Exercise, SetLog } from '../types';
import { exerciseImageMap, classicsImageMap } from './Workout';

interface ExerciseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise;
  exIdx: number;
  sessionSets: Record<number, SetLog[]>;
  completedSets: Record<string, boolean>;
  onSetWeightChange: (exIdx: number, setIdx: number, valStr: string) => void;
  onSetRepsChange: (exIdx: number, setIdx: number, valStr: string) => void;
  onFinishSet: (exIdx: number, setIdx: number) => void;
  onAddSet: (exIdx: number) => void;
  onDeleteSet: (exIdx: number, setIdx: number) => void;
  intensities: Record<number, 'Makkelijk' | 'Perfect' | 'Maximaal'>;
  onSetIntensity: (exIdx: number, val: 'Makkelijk' | 'Perfect' | 'Maximaal') => void;
  isRestDay?: boolean;
  accentText?: string;
  accentBg?: string;
  accentBorderActive?: string;
  history?: any[];
  timerActive?: boolean;
  timerSeconds?: number;
  timerExerciseIdx?: number | null;
  onSkipTimer?: () => void;
  maxEffortSets?: Record<string, boolean>;
  onToggleMaxEffort?: (exIdx: number, setIdx: number) => void;
  baselineData?: any;
  onUpdateBaseline?: (updatedBaseline: any) => void;
}

export default function ExerciseDetailModal({
  isOpen,
  onClose,
  exercise,
  exIdx,
  sessionSets,
  completedSets,
  onSetWeightChange,
  onSetRepsChange,
  onFinishSet,
  onAddSet,
  onDeleteSet,
  intensities,
  onSetIntensity,
  isRestDay = false,
  accentText = 'text-emerald-400',
  accentBg = 'bg-emerald-500/10',
  accentBorderActive = 'border-emerald-500/30',
  history = [],
  timerActive = false,
  timerSeconds = 0,
  timerExerciseIdx = null,
  onSkipTimer = () => {},
  maxEffortSets = {},
  onToggleMaxEffort = () => {},
  baselineData = null,
  onUpdateBaseline = () => {}
}: ExerciseDetailModalProps) {
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [errorUrls, setErrorUrls] = useState<Set<string>>(() => new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [repWarning, setRepWarning] = useState<boolean>(false);
  const [celebrationData, setCelebrationData] = useState<{
    oneRM: number;
    weight: number;
    reps: number;
    category: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorUrls(new Set());
    setActiveImageIdx(0);
    setIsPlayingAnimation(true);
    setShowHistory(false);
    setCelebrationData(null);
  }, [isOpen, exercise]);

  // Resolve exercise images dynamically with reliable fallbacks
  const allExerciseImages = [
    ...(exercise.images || []),
    exercise.imageUrl,
    exerciseImageMap[exercise.name],
    ...(classicsImageMap[exercise.name] || [])
  ].filter(Boolean) as string[];
  const exerciseImages = allExerciseImages.filter(url => !errorUrls.has(url));
  const imageError = exerciseImages.length === 0;

  // Real-life image looping effect (How-To loop)
  useEffect(() => {
    if (!isPlayingAnimation || imageError || !isOpen) return;
    const interval = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % exerciseImages.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlayingAnimation, imageError, isOpen, exercise, exerciseImages.length]);

  if (!isOpen) return null;

  // Dutch muscle names mapping
  const getMuscleDetails = (muscleName: string) => {
    const m = (muscleName || '').toLowerCase();
    if (m.includes('borst')) {
      return {
        eng: 'chest',
        desc: 'Grote borstspier (Pectoralis Major) & kleine borstspier. Belangrijk voor alle duwbewegingen.',
        tips: ['Hou de schouderbladen naar achteren getrokken op het bankje.', 'Duw niet vanuit je schouders, focus op het samenknijpen van de borst.'],
        setup: 'Zorg voor een stabiele basis met beide voeten stevig op de grond en een lichte boog in de onderrug.'
      };
    }
    if (m.includes('rug') || m.includes('lats') || m.includes('bovenrug')) {
      return {
        eng: 'back',
        desc: 'Brede rugspier (Latissimus Dorsi), rhomboideus & trapezius. Geeft de felbegeerde V-shape.',
        tips: ['Focus op het trekken met de ellebogen, niet met je handen.', 'Knijp je schouderbladen bewust samen aan het einde van de beweging.'],
        setup: 'Stel de kniekussens zo in dat je stevig vastzit en niet omhoog getrokken wordt tijdens de lift.'
      };
    }
    if (m.includes('schouder')) {
      return {
        eng: 'shoulders',
        desc: 'Deltaspieren (voorzijde, zijkant & achterzijde) & rotator cuff. Essentieel voor een breed fysiek.',
        tips: ['Voorkom dat je ellebogen te ver naar achteren wijzen bij presses.', 'Blijf rechtop zitten en voorkom dat je overmatig achterover leunt.'],
        setup: 'Zet de rugleuning op ongeveer 85 graden (net van verticaal af) om de gewrichten te ontlasten.'
      };
    }
    if (m.includes('bicep')) {
      return {
        eng: 'biceps',
        desc: 'Tweehoofdige armspier (Biceps Brachii) & brachialis. Verantwoordelijk voor de buiging van de arm.',
        tips: ['Hou je ellebogen strak in je zij en voorkom dat ze naar voren bewegen.', 'Draai je pinken omhoog aan het einde van de curl voor maximale contractie.'],
        setup: 'Kies een gewicht waarbij je de romp volledig stil kunt houden (geen swing).'
      };
    }
    if (m.includes('tricep')) {
      return {
        eng: 'triceps',
        desc: 'Driehoofdige armspier (Triceps Brachii). Beslaat 60% van je bovenarm-volume.',
        tips: ['Hou de bovenarmen volledig stil, alleen de onderarm mag bewegen.', 'Strek je armen gecontroleerd volledig uit en span de triceps kort aan.'],
        setup: 'Zorg bij kabels dat de katrol hoog hangt en je een stabiele, licht voorovergebogen stand hebt.'
      };
    }
    if (m.includes('quadricep') || m.includes('bovenbeen') || m.includes('squat')) {
      return {
        eng: 'quadriceps',
        desc: 'Vierhoofdige dijspier. De grootste spiergroep aan de voorkant van je bovenbenen.',
        tips: ['Duw de knieën actief naar buiten, laat ze niet naar binnen vallen.', 'Duw de kracht door het midden en de hak van je voet, niet je tenen.'],
        setup: 'Stel het apparaat zo in dat het draaipunt exact op de hoogte van je kniegewricht zit.'
      };
    }
    if (m.includes('hamstring')) {
      return {
        eng: 'hamstrings',
        desc: 'Achterkant van het bovenbeen. Cruciaal voor kniebuiging en heupstrekking.',
        tips: ['Hou de heupen plat op het bankje gedrukt tijdens curls.', 'Beweeg langzaam terug (excentrische fase) om spiervezels optimaal te prikkelen.'],
        setup: 'Plaats het enkelkussen net boven de achillespees (niet op de kuit of hak).'
      };
    }
    if (m.includes('glute') || m.includes('glut')) {
      return {
        eng: 'glutes',
        desc: 'Grote bilspier (Gluteus Maximus). De krachtigste spier in het menselijk lichaam.',
        tips: ['Span de billen bovenaan de beweging 1-2 seconden extreem hard aan.', 'Voorkom dat je je onderrug hol trekt bij het strekken van de heup.'],
        setup: 'Plaats de halter of kabelbevestiging exact in de heupplooi, eventueel met een dik kussen.'
      };
    }
    if (m.includes('kuit')) {
      return {
        eng: 'calves',
        desc: 'Kuitspieren (Gastrocnemius & Soleus). Verantwoordelijk voor het strekken van de enkel.',
        tips: ['Zak zo diep mogelijk voor een volledige stretch onderin.', 'Duw explosief omhoog op de bal van je voet en houd 1 seconde vast.'],
        setup: 'Stel het voetplatform zo in dat je hakken volledig vrij naar beneden kunnen bewegen.'
      };
    }
    if (m.includes('core') || m.includes('buik')) {
      return {
        eng: 'core',
        desc: 'Buikspieren & diepe core-stabilisatoren. Essentieel voor stabiliteit en krachtoverdracht.',
        tips: ['Focus op het krullen van je ruggengraat, niet alleen het buigen bij de heupen.', 'Houd constante spanning op je buikspieren en adem krachtig uit tijdens de contractie.'],
        setup: 'Gebruik een comfortabele mat of stel het kabelstation in op borsthoogte.'
      };
    }
    if (m.includes('onderrug')) {
      return {
        eng: 'lowerback',
        desc: 'Ruggengraatstrekkers. Onmisbaar voor een sterke onderrug en een gezonde zithouding.',
        tips: ['Beweeg vanuit je heupen en houd je rug perfect recht, overstrek niet bovenaan.', 'Houd de beweging langzaam en gecontroleerd, vermijd schokken.'],
        setup: 'Stel het heupkussen zo in dat je heupen vrij kunnen buigen zonder dat je rug bolt.'
      };
    }
    if (m.includes('onderarm')) {
      return {
        eng: 'forearms',
        desc: 'Polsbuigers, polsstrekkers en grijpspierkracht. Cruciaal voor een ijzersterke grip.',
        tips: ['Gebruik een volledige bewegingsuitslag van je polsen.', 'Houd je ellebogen en bovenarmen stil tijdens de beweging.'],
        setup: 'Laat je onderarmen rusten op een bankje of je knieën voor maximale stabiliteit.'
      };
    }
    if (m.includes('cardio') || m.includes('warming')) {
      return {
        eng: 'cardio',
        desc: 'Cardiovasculair systeem & opwarming. Bereidt het lichaam voor op de training.',
        tips: ['Houd een rustig tempo aan om je hartslag en lichaamstemperatuur geleidelijk te verhogen.', 'Focus op een vloeiende ademhaling en soepele gewrichtsbewegingen.'],
        setup: 'Zorg voor voldoende vrije ruimte of stel cardiotoestellen erg licht in.'
      };
    }
    return {
      eng: 'fullbody',
      desc: 'Multicompound beweging. Meerdere spiergroepen werken samen voor maximale kracht.',
      tips: ['Houd de rug neutraal en activeer de core vóórdat je de lift start.', 'Blijf ademen en verdeel de druk gelijkmatig over je voeten.'],
      setup: 'Stel veiligheidssteunen of ligging van de halter altijd vooraf nauwkeurig in.'
    };
  };

  const getExerciseTips = (exName: string, mName: string) => {
    const n = (exName || '').toLowerCase();
    
    if (n.includes('dip')) {
      return {
        tips: [
          'Leun licht voorover om de nadruk van je triceps naar je borst te verplaatsen.',
          'Laat je gecontroleerd zakken tot je schouders net onder je ellebogen zijn.',
          'Houd je schouders laag en vermijd dat ze naar je oren trekken.'
        ],
        setup: 'Pak de stangen stevig vast en spring of stap omhoog tot je armen gestrekt zijn.'
      };
    }
    if (n.includes('pushup') || n.includes('push-up') || n.includes('opdrukken')) {
      return {
        tips: [
          'Houd je lichaam in een rechte lijn (plank-positie), span je billen en core aan.',
          'Plaats je ellebogen in een hoek van 45 graden ten opzichte van je lichaam.',
          'Duw de grond actief van je af en span je borst bovenin aan.'
        ],
        setup: 'Begin in een hoge plankpositie met je handen recht onder je schouders.'
      };
    }
    if (n.includes('plank')) {
      return {
        tips: [
          'Houd je lichaam in een kaarsrechte lijn, zak niet door je heupen en houd ze ook niet te hoog.',
          'Duw actief vanuit je ellebogen om je schouderbladen niet te laten doorzakken.',
          'Span je buikspieren, gluten en quadriceps constant hard aan.'
        ],
        setup: 'Plaats je onderarmen plat op de grond, ellebogen recht onder je schouders.'
      };
    }
    if (n.includes('crossover') || n.includes('cable fly') || n.includes('machine fly') || n.includes('dumbbell fly') || n.includes('pec deck') || n.includes('flyes')) {
      return {
        tips: [
          'Houd een lichte, constante buiging in je ellebogen om je gewrichten te ontlasten.',
          'Focus op het naar elkaar toe brengen van je bovenarmen (knijp de borst samen).',
          'Voorkom dat je de armen te ver naar achteren brengt om je schouders te beschermen.'
        ],
        setup: 'Stel de katrollen of machine-armen in op borsthoogte en neem een stabiele actieve stand aan.'
      };
    }
    if (n.includes('pullup') || n.includes('chin-up') || n.includes('pull-up')) {
      return {
        tips: [
          'Trek je schouderbladen omlaag en naar elkaar toe voordat je omhoog trekt.',
          'Trek je borst richting de stang, niet alleen je kin.',
          'Laat je gecontroleerd zakken tot een volledige stretch onderin.'
        ],
        setup: 'Pak de stang bovenhands (pull-up) of onderhands (chin-up) vast, iets breder dan schouderbreedte.'
      };
    }
    if (n.includes('pulldown')) {
      return {
        tips: [
          'Trek de stang naar de bovenkant van je borst en leun heel licht achterover.',
          'Focus op het naar beneden trekken van je ellebogen, knijp je rugspieren samen.',
          'Laat het gewicht gecontroleerd terug omhoog gaan voor een actieve stretch.'
        ],
        setup: 'Stel het kniekussen zo in dat je bovenbenen stevig vastgeklemd zitten.'
      };
    }
    if (n.includes('deadlift') || n.includes('rdl') || n.includes('romanian')) {
      return {
        tips: [
          'Houd de stang gedurende de hele beweging zo dicht mogelijk bij je benen.',
          'Houd je rug perfect recht (neutraal) en span je core maximaal aan.',
          'Duw je heupen ver naar achteren (hip hinge) om spanning op je hamstrings en billen te zetten.'
        ],
        setup: 'Stel je voeten op heupbreedte op onder de stang, met de stang boven het midden van je voet.'
      };
    }
    if (n.includes('squat')) {
      return {
        tips: [
          'Zak zo diep als je mobiliteit toelaat met een rechte rug.',
          'Duw je knieën actief naar buiten in de richting van je tenen.',
          'Verdeel het gewicht gelijkmatig over je hele voet (hak en bal).'
        ],
        setup: 'Plaats je voeten iets breder dan schouderbreedte met de tenen licht naar buiten gedraaid.'
      };
    }
    if (n.includes('leg press')) {
      return {
        tips: [
          'Plaats je voeten plat op het platform en laat je knieën niet naar binnen vallen.',
          'Laat het platform zakken tot een hoek van 90 graden, zorg dat je onderrug plat tegen de leuning blijft.',
          'Strek je benen uit maar zet je knieën NOOIT op slot (lockout) bovenin.'
        ],
        setup: 'Ga stevig in de zitting zitten en druk je billen en onderrug plat tegen de rugleuning.'
      };
    }
    if (n.includes('extension')) {
      return {
        tips: [
          'Strek je benen volledig uit en span je quadriceps bovenin 1 seconde hard aan.',
          'Beweeg het gewicht langzaam en gecontroleerd terug naar beneden.',
          'Houd je billen stevig in het zitje gedrukt met behulp van de handvatten.'
        ],
        setup: 'Stel de rugleuning en het scheenbeenkussen zo in dat het draaipunt in lijn ligt met je knieën.'
      };
    }
    if (n.includes('leg curl')) {
      return {
        tips: [
          'Krul het gewicht krachtig omhoog en probeer je heupen plat op het kussen te houden.',
          'Laat het gewicht langzaam en beheerst terugzakken om de hamstrings te prikkelen.',
          'Voorkom dat je je onderrug hol trekt tijdens de contractie.'
        ],
        setup: 'Lijn je knieën uit met het draaipunt en plaats het kussen net boven je achillespees.'
      };
    }
    if (n.includes('bicep') || n.includes('curl')) {
      return {
        tips: [
          'Houd je ellebogen strak tegen je zij gedrukt en voorkom dat ze naar voren bewegen.',
          'Draai je pinken omhoog aan het einde van de beweging voor maximale piekcontractie.',
          'Houd je lichaam volledig stil, swing het gewicht niet omhoog met je rug.'
        ],
        setup: 'Neem een actieve stand aan met licht gebogen knieën en ingetrokken schouders.'
      };
    }
    if (n.includes('pushdown') || n.includes('triceps press') || n.includes('tricep extension')) {
      return {
        tips: [
          'Houd je bovenarmen volledig stil langs je lichaam; alleen je onderarmen bewegen.',
          'Strek je armen onderin volledig uit en duw de uiteinden van het touw/stang naar beneden.',
          'Laat het gewicht gecontroleerd terugkomen tot je onderarmen parallel zijn aan de grond.'
        ],
        setup: 'Stel de kabel katrol hoog in, neem een stand aan met gebogen knieën en leun licht voorover.'
      };
    }
    if (n.includes('skullcrusher') || n.includes('skull crusher') || n.includes('triceps press') || n.includes('lying triceps')) {
      return {
        tips: [
          'Houd je ellebogen recht omhoog gericht en voorkom dat ze naar buiten wijzen.',
          'Laat het gewicht gecontroleerd zakken tot vlak bij je voorhoofd of net erachter.',
          'Strek je armen weer volledig uit door je triceps aan te spannen.'
        ],
        setup: 'Lig plat op het bankje met je voeten stevig op de grond en breng het gewicht boven je borst.'
      };
    }
    if (n.includes('lateral raise')) {
      return {
        tips: [
          'Leid de beweging met je ellebogen omhoog en houd je armen licht gebogen.',
          'Breng de gewichten tot schouderhoogte, niet hoger, om schouderklemmen te voorkomen.',
          'Voorkom dat je gaat schommelen met je bovenlichaam.'
        ],
        setup: 'Sta rechtop met een actieve core en houd de dumbbells aan de zijkant van je benen.'
      };
    }
    if (n.includes('raise') && (mName.toLowerCase().includes('kuit') || n.includes('calf'))) {
      return {
        tips: [
          'Zak zo diep mogelijk voor een volledige stretch van de kuitspier onderin.',
          'Duw explosief omhoog op de bal van je voet en houd de contractie bovenin 1 seconde vast.',
          'Voorkom dat je stuitert onderin de beweging.'
        ],
        setup: 'Stel het voetplatform zo in dat je hakken volledig vrij naar beneden kunnen bewegen.'
      };
    }

    // Default to the muscle group details
    const mDetails = getMuscleDetails(mName);
    return {
      tips: mDetails.tips,
      setup: mDetails.setup
    };
  };

  const muscleInfo = getMuscleDetails(exercise.muscle);
  const exerciseSpecificInfo = getExerciseTips(exercise.name, exercise.muscle);

  const displayImage = !imageError && exerciseImages.length > 0
    ? exerciseImages[activeImageIdx % exerciseImages.length]
    : null;

  // Active workout set state passing from Workout component
  const activeSets = sessionSets[exIdx] || [];

  const handleFinishSetLocal = (idx: number) => {
    const isAlreadyDone = completedSets[`${exIdx}-${idx}`];
    onFinishSet(exIdx, idx);

    if (!isAlreadyDone) {
      // Set is being completed! Check if marked as Max Effort
      const isMaxEffort = maxEffortSets[`${exIdx}-${idx}`];
      if (isMaxEffort) {
        // Calculate estimated 1RM
        const set = activeSets[idx];
        const w = Number(set.w) || 0;
        const r = Number(set.r) || 0;
        
        if (r > 15) {
          alert("Deze set had te veel herhalingen (meer dan 15) voor een betrouwbare krachtmeting. Kies een zwaarder gewicht — idealiter 3 tot 8 herhalingen — voor een accurate Aura Kalibratie.");
          return;
        }
        
        if (w > 0 && r > 0) {
          const estimated1RM = Math.round(w * (1 + r / 30));
          
          let fieldPrefix = '';
          let exerciseCategoryName = '';
          const m = (exercise.muscle || "").toLowerCase();
          const name = (exercise.name || "").toLowerCase();

          if (m.includes('borst') || m.includes('chest') || name.includes('bench press') || name.includes('pec deck')) {
            fieldPrefix = 'benchPress';
            exerciseCategoryName = 'Bankdrukken (Borst)';
          } else if (m.includes('quadriceps') || m.includes('benen') || m.includes('glute') || m.includes('hamstring') || name.includes('squat') || name.includes('leg press')) {
            fieldPrefix = 'squat';
            exerciseCategoryName = 'Squats (Benen)';
          } else if (m.includes('rug') || m.includes('back') || name.includes('pulldown') || name.includes('row')) {
            fieldPrefix = 'latPulldown';
            exerciseCategoryName = 'Lat Pulldown (Rug)';
          } else if (m.includes('schouder') || m.includes('shoulder') || name.includes('press') || name.includes('raise')) {
            fieldPrefix = 'overheadPress';
            exerciseCategoryName = 'Overhead Press (Schouders)';
          }

          if (fieldPrefix) {
            const updatedBaseline = {
              ...baselineData,
              [`${fieldPrefix}Weight`]: w,
              [`${fieldPrefix}Reps`]: r,
              [`${fieldPrefix}1RM`]: estimated1RM,
              completedAt: new Date().toISOString()
            };
            onUpdateBaseline(updatedBaseline);
            setCelebrationData({
              oneRM: estimated1RM,
              weight: w,
              reps: r,
              category: exerciseCategoryName
            });
          }
        }
      }
    }
  };
  const allSetsCompleted = activeSets.length > 0 && activeSets.every((_, sIdx) => completedSets[`${exIdx}-${sIdx}`]);
  const intensityVal = intensities[exIdx] || 'Perfect';

  // Extract exercise log history from provided history sessions
  const exerciseHistory = history.map(session => {
    const match = session.exercises?.find((he: any) => he.name.toLowerCase() === exercise.name.toLowerCase());
    if (match) {
      return {
        date: session.date,
        timestamp: session.timestamp,
        sessionName: session.name,
        sets: match.sets || [],
        intensity: match.intensity || 'Perfect',
        topWeight: match.topWeight || 0,
        exerciseVolume: match.exerciseVolume || 0,
      };
    }
    return null;
  }).filter(Boolean) as Array<{
    date: string;
    timestamp: number;
    sessionName: string;
    sets: SetLog[];
    intensity: string;
    topWeight?: number;
    exerciseVolume?: number;
  }>;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 select-none bg-black/85 backdrop-blur-md animate-fadeIn overflow-hidden">
      {/* Container (styled like Aura mobile view) */}
      <div className="relative w-full max-w-md bg-[#0c0d14] border-0 sm:border border-white/10 rounded-none sm:rounded-[36px] shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        
        {celebrationData && (
          <div className="absolute inset-0 bg-[#07080e]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>
            
            <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-[0.3em] mb-2 animate-pulse">
              🏆 NIEUWE KRACHT MIJLPAAL!
            </span>
            
            <h3 className="text-xl font-black text-white leading-tight mb-2">
              Aura Kalibratie Voltooid!
            </h3>
            
            <p className="text-xs text-white/70 max-w-xs mb-6 font-light leading-relaxed">
              Je hebt zojuist een succesvolle krachttest voltooid voor <span className="text-white font-semibold">{celebrationData.category}</span>.
            </p>

            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 w-full max-w-xs space-y-3 mb-6">
              <div className="flex justify-between items-center text-[11px] text-white/50 border-b border-white/5 pb-2">
                <span>Test Set</span>
                <span className="font-mono text-white font-bold">{celebrationData.weight} kg × {celebrationData.reps} reps</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/50">Geschat 1RM</span>
                <span className="text-2xl font-mono font-black text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  {celebrationData.oneRM} kg
                </span>
              </div>
            </div>

            {celebrationData.reps > 12 && (
              <p className="text-[10px] text-amber-400/80 max-w-xs mb-6 font-semibold italic leading-relaxed px-4">
                💡 Tip: Omdat je meer dan 12 herhalingen hebt gedaan, is dit een schatting van je uithoudingsvermogen. Test volgende keer een set van 6-12 herhalingen voor de meest nauwkeurige krachtkalibratie.
              </p>
            )}

            <button
              onClick={() => setCelebrationData(null)}
              className="py-3 px-8 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              Doorgaan met Workout
            </button>
          </div>
        )}
        
        {/* Subtle background glow */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none blur-3xl" />

        {/* 1. Header Image Area */}
        <div className="relative w-full aspect-[4/3] bg-black/90 shrink-0">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={exercise.name} 
              onError={() => {
                if (displayImage) {
                  setErrorUrls(prev => {
                    const next = new Set(prev);
                    next.add(displayImage);
                    return next;
                  });
                }
              }}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
              <Dumbbell className="w-12 h-12 stroke-[1.5]" />
              <span className="text-xs font-medium">Geen afbeelding beschikbaar</span>
            </div>
          )}

          {/* Dark bottom & top gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d14] via-[#0c0d14]/40 to-black/30 z-10" />

          {/* Close button (top-left, authentic to the screenshot) */}
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2.5 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white hover:scale-105 active:scale-95 transition-all cursor-pointer z-20"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Overlay text & Play/How-To button */}
          <div className="absolute bottom-5 inset-x-5 flex items-end justify-between z-20">
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold mb-1 block">
                {exercise.muscle}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight leading-none uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {exercise.name}
              </h3>
            </div>

            {/* How-To Button (Authentic to the screenshot) */}
            {!imageError && (
              <button
                onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-xs font-bold text-white shadow-lg backdrop-blur-md transition-all shrink-0 cursor-pointer"
              >
                {isPlayingAnimation ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span>Pauzeer Loop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white stroke-none shrink-0" />
                    <span>How-To Loop</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 relative z-10">

          {/* 3. Stats Row (Pills exactly like the screenshot) */}
          <div className="flex items-center justify-start gap-2.5 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-[#181924] border border-white/5 rounded-full text-xs font-bold text-white/90 shrink-0">
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              <span>{(() => {
                const defaultRest = (() => {
                  try {
                    const saved = localStorage.getItem('aura_default_rest_seconds');
                    return saved ? parseInt(saved, 10) : 90;
                  } catch {
                    return 90;
                  }
                })();
                const restSecs = exercise.restSeconds !== undefined ? exercise.restSeconds : defaultRest;
                const mins = Math.floor(restSecs / 60);
                const secs = restSecs % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
              })()} rust</span>
            </div>
            
            {/* History Toggle Pill */}
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                showHistory 
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' 
                  : 'bg-[#181924] border-white/5 text-white/90 hover:bg-white/5'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${showHistory ? 'text-purple-300 animate-pulse' : 'text-purple-400'}`} />
              <span>Geschiedenis</span>
            </button>

            <div className="flex items-center gap-1.5 px-4 py-2 bg-[#181924] border border-white/5 rounded-full text-xs font-bold text-white/90 max-w-[160px] truncate shrink-0">
              <Dumbbell className="w-3.5 h-3.5 text-sky-400" />
              <span className="truncate">{exercise.equip || 'Lichaamsgewicht'}</span>
            </div>
          </div>

          {showHistory ? (
            /* HISTORY TAB VIEW */
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Eerdere Logs
                </h4>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Terug naar logs
                </button>
              </div>

              {exerciseHistory.length === 0 ? (
                <div className="p-8 text-center bg-[#11121d] border border-white/5 rounded-3xl text-white/40 space-y-2">
                  <Activity className="w-8 h-8 text-white/20 mx-auto animate-pulse" />
                  <p className="text-xs font-medium leading-relaxed">
                    Nog geen eerdere geschiedenis gelogd voor deze oefening. Sluit deze gids, voltooi je sets en beëindig je training om geschiedenis op te bouwen!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {exerciseHistory.map((hist, hIdx) => (
                    <div key={hIdx} className="p-4 bg-[#11121d]/80 border border-white/5 rounded-2xl space-y-2.5 transition-all hover:border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white">{hist.date}</span>
                          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{hist.sessionName}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hist.intensity === 'Makkelijk' 
                            ? 'bg-emerald-500/10 text-emerald-300' 
                            : hist.intensity === 'Maximaal' 
                              ? 'bg-red-500/10 text-red-300' 
                              : 'bg-sky-500/10 text-sky-300'
                        }`}>
                          {hist.intensity === 'Maximaal' ? 'Moeilijk' : hist.intensity}
                        </span>
                      </div>
                      <div className="border-t border-white/5 pt-2.5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        {hist.sets.map((s, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/[0.02]">
                            <span className="text-white/30 font-bold">S{sIdx + 1}</span>
                            <span className="text-white/80 font-black">{s.r} × {s.w}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE WORKOUT LOGS VIEW */
            <>
              {/* 4. Coaching Tip Card */}
              <div className="bg-[#151622] border border-white/5 rounded-3xl p-4.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                  <Sparkles className="w-16 h-16 text-emerald-400" />
                </div>

                <div className="flex items-center gap-2 mb-2.5 text-amber-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest font-extrabold">AURA'S VORM TIP</span>
                </div>

                <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-sans font-medium">
                  {exercise.isTipsLoading ? (
                    <span className="flex items-center gap-2 text-white/50">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Aura is specifieke tips aan het schrijven...
                    </span>
                  ) : (
                    `"${exercise.executionCue || (exerciseSpecificInfo.tips[0] || 'Voer de oefening beheerst uit en span de spier bovenaan maximaal aan.')}"`
                  )}
                </p>

                {/* Richtreps & Weight highlights */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Doelreps:</span>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-md">
                      {exercise.reps || '8-12'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Doelgewicht:</span>
                    <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded-md">
                      {exercise.targetWeight && exercise.targetWeight > 0 ? `${exercise.targetWeight} kg` : 'Lichaamsgewicht'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4.5. Progressive Overload Target Card (Groei is #1) */}
              {exerciseHistory.length > 0 ? (() => {
                const lastSession = exerciseHistory[0];
                const lastTopWeight = lastSession.topWeight || Math.max(...lastSession.sets.map(s => s.w || 0), 0);
                const lastReps = lastSession.sets[0]?.r || 10;
                const overloadWeight = lastTopWeight > 0 ? lastTopWeight + 2.5 : 0;
                
                return (
                  <div className="bg-[#101b15] border border-emerald-500/20 rounded-3xl p-4.5 relative overflow-hidden animate-fadeIn">
                    <div className="absolute top-0 right-0 p-3 opacity-[0.05] text-emerald-400 pointer-events-none">
                      <TrendingUp className="w-16 h-16" />
                    </div>

                    <div className="flex items-center gap-2 mb-2.5 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest font-extrabold">Progressieve Overload (Groei #1)</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="text-white/80 leading-relaxed">
                        Vorige keer ({lastSession.date}): <span className="font-mono text-white font-bold">{lastSession.sets.map(s => `${s.r}x${s.w}kg`).join(', ')}</span>
                      </p>
                      <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-1 text-[11px]">
                        <p className="text-emerald-300 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Overload Doel van Vandaag:
                        </p>
                        <p className="text-white/70 leading-relaxed">
                          Richt op <span className="text-white font-bold font-mono">{overloadWeight > 0 ? `${overloadWeight} kg` : 'Lichaamsgewicht'}</span> voor {lastReps} reps, OF probeer <span className="text-white font-bold font-mono">{lastReps + 1} reps</span> te halen met <span className="font-mono text-white font-bold">{lastTopWeight} kg</span> op je eerste set!
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-[#12121c] border border-white/5 rounded-3xl p-4.5 text-xs text-white/50 leading-relaxed relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-[0.03] text-purple-400 pointer-events-none">
                    <TrendingUp className="w-16 h-16" />
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-purple-400">
                    <TrendingUp className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest font-extrabold">Progressieve Overload</span>
                  </div>
                  Dit is je eerste keer dat je deze oefening doet. Aura slaat je prestaties op om bij de volgende training een overload-doel te berekenen!
                </div>
              )}

              {/* 5. Interactive Set Log Rows */}
              {timerActive && timerExerciseIdx === exIdx && (
                <div className={`p-4 rounded-3xl border animate-fadeIn flex flex-col gap-2.5 text-center relative overflow-hidden ${
                  isRestDay
                    ? 'bg-sky-500/10 border-sky-500/20 text-sky-200'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent pointer-events-none" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <Timer className={`w-5 h-5 ${isRestDay ? 'text-sky-400' : 'text-emerald-400'} animate-pulse`} />
                      <div className="text-left">
                        <span className={`text-[10px] font-extrabold uppercase tracking-[0.15em] ${isRestDay ? 'text-sky-400' : 'text-emerald-400'}`}>
                          RUSTTIJD ACTIEF
                        </span>
                        <p className="text-[10px] text-white/50">Rust even uit voor je volgende set</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="font-mono text-xl font-black text-white">
                        {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                      </div>
                      <button
                        onClick={onSkipTimer}
                        className={`px-3 py-1.5 rounded-xl border text-[9px] font-extrabold uppercase tracking-wider active:scale-95 transition-all cursor-pointer ${
                          isRestDay
                            ? 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/30 text-sky-200'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-200'
                        }`}
                      >
                        Overslaan
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden relative z-10">
                    <div 
                      className={`h-full transition-all duration-1000 ${isRestDay ? 'bg-sky-500' : 'bg-emerald-500'}`}
                      style={{ 
                        width: `${Math.min(100, (timerSeconds / (exercise.restSeconds || 120)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-widest text-white/40 font-extrabold">Log Sets & Reps</span>
                  <span className={`text-xs font-bold ${allSetsCompleted ? 'text-emerald-400' : 'text-white/60'}`}>
                    {activeSets.filter((_, idx) => completedSets[`${exIdx}-${idx}`]).length}/{activeSets.length} sets gelogd
                  </span>
                </div>

                <div className="relative pl-1 space-y-4">
                  {activeSets.map((set, idx) => {
                    const isSetDone = completedSets[`${exIdx}-${idx}`];
                    const isRestingThisExercise = timerActive && timerExerciseIdx === exIdx;
                    return (
                      <div key={idx} className="flex items-center gap-3 relative animate-fadeIn">
                        
                        {/* Checkbox Badge */}
                        <div
                          className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-xs font-black transition-all shrink-0 shadow-lg ${
                            isSetDone
                              ? isRestDay
                                ? 'bg-sky-500 border-sky-400 text-black scale-105 shadow-sky-500/10'
                                : 'bg-emerald-500 border-emerald-400 text-black scale-105 shadow-emerald-500/10'
                              : 'bg-[#181924] border-white/10 text-white/50'
                          } ${
                            isRestingThisExercise
                              ? isSetDone
                                ? 'opacity-70'
                                : 'opacity-25 bg-white/5 border-white/5 text-white/10'
                              : ''
                          }`}
                        >
                          {isSetDone ? (
                            <Check className="w-5 h-5 stroke-[3px]" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        {/* Input boxes mirroring the screenshot layout */}
                        <div className="flex-1 grid grid-cols-2 gap-2.5">
                          
                          {/* Reps input */}
                          <div className={`relative rounded-2xl border transition-all bg-[#0e1017] p-3 pt-4.5 flex flex-col justify-center min-h-[3.5rem] ${
                            isSetDone 
                              ? 'border-emerald-500/20 bg-emerald-950/5 opacity-60' 
                              : isRestingThisExercise
                                ? 'border-white/5 bg-white/[0.01] opacity-25'
                                : 'border-white/5 focus-within:border-white/20'
                          }`}>
                            <span className="absolute top-1.5 left-3 text-[8px] font-bold uppercase tracking-wider text-white/40">
                              Reps
                            </span>
                            <input
                              type="number"
                              disabled={isRestingThisExercise}
                              value={(set.r as any) === '' || set.r === undefined ? '' : set.r}
                              onChange={e => onSetRepsChange(exIdx, idx, e.target.value)}
                              className="bg-transparent border-0 text-white font-mono text-base font-extrabold p-0 focus:outline-none focus:ring-0 w-full outline-none"
                              placeholder="10"
                            />
                          </div>

                          {/* Weight input */}
                          <div className={`relative rounded-2xl border transition-all bg-[#0e1017] p-3 pt-4.5 flex flex-col justify-center min-h-[3.5rem] ${
                            isSetDone 
                              ? 'border-emerald-500/20 bg-emerald-950/5 opacity-60' 
                              : isRestingThisExercise
                                ? 'border-white/5 bg-white/[0.01] opacity-25'
                                : 'border-white/5 focus-within:border-white/20'
                          }`}>
                            <span className="absolute top-1.5 left-3 text-[8px] font-bold uppercase tracking-wider text-white/40">
                              Gewicht (kg)
                            </span>
                            <input
                              type="number"
                              disabled={isRestingThisExercise}
                              value={(set.w as any) === '' || set.w === undefined ? '' : set.w}
                              onChange={e => onSetWeightChange(exIdx, idx, e.target.value)}
                              className="bg-transparent border-0 text-white font-mono text-base font-extrabold p-0 focus:outline-none focus:ring-0 w-full outline-none"
                              placeholder="20"
                            />
                          </div>

                        </div>

                        {/* Max Effort Button */}
                        {exercise.maxEffortTestDue === true && (
                          <button
                            disabled={isSetDone || isRestingThisExercise}
                            onClick={() => onToggleMaxEffort(exIdx, idx)}
                            className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                              maxEffortSets[`${exIdx}-${idx}`]
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)] animate-pulse'
                                : 'bg-[#181924]/40 hover:bg-white/5 border-white/5 text-white/30 hover:text-white/60 hover:border-white/10'
                            } ${isSetDone || isRestingThisExercise ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={maxEffortSets[`${exIdx}-${idx}`] ? "Geselecteerd voor Aura Kalibratie! (AMRAP)" : "Markeer set voor Aura Kalibratie"}
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete single set button */}
                        <button
                          disabled={isRestingThisExercise}
                          onClick={() => onDeleteSet(exIdx, idx)}
                          className={`p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all ${
                            isRestingThisExercise
                              ? 'opacity-20 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                          title="Verwijder deze set"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Set log tools (Add Set & Log Set) */}
                <div className="flex justify-between items-center gap-4 pt-1">
                  <button
                    disabled={timerActive && timerExerciseIdx === exIdx}
                    onClick={() => onAddSet(exIdx)}
                    className={`py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] uppercase tracking-widest font-extrabold text-white/70 active:scale-95 transition-all flex items-center gap-1.5 ${
                      timerActive && timerExerciseIdx === exIdx
                        ? 'opacity-40 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Set Toevoegen
                  </button>

                  <button
                    disabled={timerActive && timerExerciseIdx === exIdx || allSetsCompleted}
                    onClick={() => {
                      const nextUncompletedIdx = activeSets.findIndex((_, idx) => !completedSets[`${exIdx}-${idx}`]);
                      if (nextUncompletedIdx !== -1) {
                        onFinishSet(exIdx, nextUncompletedIdx);
                      }
                    }}
                    className={`py-2.5 px-6 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-1.5 shadow-lg active:scale-95 ${
                      timerActive && timerExerciseIdx === exIdx || allSetsCompleted
                        ? 'opacity-40 cursor-not-allowed bg-white/5 border border-white/5 text-white/40'
                        : isRestDay
                          ? 'bg-sky-500 border border-sky-400 text-black shadow-sky-500/20 hover:bg-sky-400 cursor-pointer'
                          : 'bg-emerald-500 border border-emerald-400 text-black shadow-emerald-500/20 hover:bg-emerald-400 cursor-pointer'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3px]" /> Log Set
                  </button>
                </div>
              </div>

              {/* 6. Gevoel / Intensity Selector when exercise completed */}
              {allSetsCompleted && (
                <div className="p-4 bg-[#151622] border border-emerald-500/20 rounded-3xl animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Hoe voelde deze oefening?</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded-full uppercase">Voltooid!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Makkelijk', 'Perfect', 'Maximaal'] as const).map((mode) => {
                      const isSelected = intensityVal === mode;
                      const label = mode === 'Maximaal' ? 'Moeilijk' : mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => onSetIntensity(exIdx, mode)}
                          className={`py-2.5 rounded-2xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            isSelected
                              ? isRestDay
                                ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20 font-black'
                                : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black'
                              : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/5'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7. Safety instructions / Vormgids details */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="p-4 bg-[#11121d] border border-white/5 rounded-3xl space-y-2">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Vormgids Richtlijnen
                  </h4>
                  <ul className="space-y-1">
                    {exercise.isTipsLoading ? (
                      <li className="text-xs text-white/40 flex items-center gap-2 py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        Richtlijnen laden via AI...
                      </li>
                    ) : (
                      (exercise.formGuide || [
                        `Neem een stabiele startpositie aan voor de ${exercise.name}.`,
                        exercise.executionCue ? exercise.executionCue.split('.')[0] + '.' : exerciseSpecificInfo.tips[0],
                        exerciseSpecificInfo.tips[1] || "Voer de beweging gecontroleerd uit met volledige focus.",
                        "Adem uit bij de kracht-inspanning, adem in bij de terugweg."
                      ]).map((tip, tIdx) => (
                        <li key={tIdx} className="text-xs text-white/70 flex items-start gap-2 leading-relaxed">
                          <span className="text-emerald-400 font-bold shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="p-4 bg-[#11121d] border border-white/5 rounded-3xl space-y-2">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    Veiligheidstip
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {exercise.isTipsLoading ? (
                      <span className="flex items-center gap-2 text-white/40">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        Veiligheidstip laden via AI...
                      </span>
                    ) : (
                      exercise.safetyTip || `Let bij de ${exercise.name} extra goed op je houding. ${exerciseSpecificInfo.setup} Stop direct bij steken in de gewrichten.`
                    )}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Low-profile outline close button at the absolute bottom of scrollable content */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all active:scale-98"
            >
              Terug naar schema
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
