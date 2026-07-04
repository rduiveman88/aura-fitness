/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { UserModel } from '../types';
import { Sparkles, User, ArrowRight, ArrowLeft, Check, Target, Heart, Award, Calendar, Dumbbell, Clock, ChevronDown } from 'lucide-react';
import { AuraLogo } from './AuraLogo';

interface OnboardingProps {
  onComplete: (userModel: UserModel, experienceLevel: 'beginner' | 'intermediate' | 'advanced') => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Profile fields
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [goal, setGoal] = useState('Spieropbouw & Hypertrofie');
  
  // New Schedule & Experience fields
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [frequencyType, setFrequencyType] = useState<'flexible' | 'fixed'>('flexible');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  const [fixedDays, setFixedDays] = useState<number[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [restDayYogaEnabled, setRestDayYogaEnabled] = useState(true);

  // Pain points / injuries
  const [selectedPains, setSelectedPains] = useState<string[]>([]);
  const [customPain, setCustomPain] = useState('');

  // Scroll detection
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isScrollable = el.scrollHeight > el.clientHeight + 10;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 25;
    setShowScrollIndicator(isScrollable && !isAtBottom);
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [step, frequencyType]);

  useEffect(() => {
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handlePainToggle = (pain: string) => {
    if (selectedPains.includes(pain)) {
      setSelectedPains(selectedPains.filter(p => p !== pain));
    } else {
      setSelectedPains([...selectedPains, pain]);
    }
  };

  const handleFixedDayToggle = (dayId: number) => {
    if (fixedDays.includes(dayId)) {
      setFixedDays(fixedDays.filter(d => d !== dayId));
    } else {
      setFixedDays([...fixedDays, dayId]);
    }
  };

  const nextStep = () => {
    if (step === 2) {
      if (!name.trim()) {
        alert("Voer alsjeblieft je naam in.");
        return;
      }
      if (age === '' || isNaN(Number(age)) || Number(age) <= 0) {
        alert("Voer alsjeblieft een geldige leeftijd in.");
        return;
      }
      if (weight === '' || isNaN(Number(weight)) || Number(weight) <= 0) {
        alert("Voer alsjeblieft een geldig gewicht in.");
        return;
      }
      if (height === '' || isNaN(Number(height)) || Number(height) <= 0) {
        alert("Voer alsjeblieft een geldige lengte in.");
        return;
      }
    }
    if (step === 3) {
      if (frequencyType === 'fixed' && fixedDays.length === 0) {
        alert("Kies alsjeblieft minimaal één vaste trainingsdag.");
        return;
      }
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    const allPains = [...selectedPains];
    if (customPain.trim()) {
      allPains.push(customPain.trim());
    }

    // Save pain notes to exercise preferences in localStorage
    const prefs = {
      likes: [],
      dislikes: [],
      painNotes: allPains
    };
    localStorage.setItem('aura_exercise_prefs', JSON.stringify(prefs));

    const finalProfile: UserModel = {
      name: name.trim(),
      age: age === '' ? 30 : Number(age),
      weight: weight === '' ? 75 : Number(weight),
      height: height === '' ? 180 : Number(height),
      goal,
      daysPerWeek: frequencyType === 'fixed' ? fixedDays.length : daysPerWeek,
      fixedDays: frequencyType === 'fixed' ? fixedDays : undefined,
      duration,   // Chosen duration
      equipment: ["Barbell", "Dumbbells", "Flat Bench", "Incline Bench", "Squat Rack", "Smith Machine", "Cable Station", "Leg Press Machine", "Lat Pulldown Machine", "Pec Deck / Fly Machine", "Pullup Bar", "Dip Station", "EZ-Bar", "Bands", "Exercise Ball", "Medicine Ball", "Preacher Curl Bench", "Chest Press Machine", "Shoulder Press Machine", "Row Machine", "Assisted Pullup / Dip Machine", "Hack Squat Machine", "Leg Extension Machine", "Leg Curl Machine", "Calf Machine", "Abductor / Adductor Machine", "Ab Crunch Machine"], // Full gym default
      apiKey: "",
      restDayYogaEnabled,
      painPoints: allPains,
      splitPreference: 'auto'
    };
    onComplete(finalProfile, experienceLevel);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-14 sm:p-6 sm:pt-[calc(1.5rem+env(safe-area-inset-top))] flex flex-col justify-between relative z-50 overflow-hidden select-none no-scrollbar">
      {/* Background ambient glowing lights */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full filter blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full filter blur-[120px] pointer-events-none z-0" />

      {/* Progress header */}
      <div className="flex items-center justify-between gap-4 w-full max-w-md mx-auto mb-3 sm:mb-6 z-10 shrink-0">
        <div className="flex items-center gap-1.5">
          <AuraLogo className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" isRestDay={false} />
          <span className="text-[10px] text-emerald-400 uppercase tracking-[0.3em] font-bold">Aura Fitness</span>
        </div>
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          Stap {step} van {totalSteps}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mx-auto h-1 bg-white/5 rounded-full overflow-hidden mb-4 sm:mb-8 z-10 shrink-0">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-300" 
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Content wrapper */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 flex flex-col w-full max-w-md mx-auto z-10 py-2 sm:py-4 overflow-y-auto no-scrollbar"
      >
        {step === 1 && (
          <div className="flex flex-col gap-5 sm:gap-6 text-center animate-fadeIn w-full mt-4 sm:mt-8 mb-auto py-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto animate-[pulse_3s_infinite_ease-in-out] shrink-0">
              <AuraLogo className="w-8 h-8 sm:w-10 sm:h-10" isRestDay={false} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-2 leading-tight">
                Welkom bij <span className="font-bold text-gradient">Aura Fitness</span>
              </h1>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-light px-4">
                Aura is een zelflerend pro-coachtraject dat leert van je trainingsgeschiedenis en biometrie.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-left flex flex-col gap-3.5 sm:gap-4 shadow-xl">
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white leading-tight">Biometrisch Profiel</span>
                  <span className="text-xs text-white/50 font-light mt-0.5 leading-snug">Je biologische basis voor startbelastingen.</span>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white leading-tight">Gerichte Focus & Schema</span>
                  <span className="text-xs text-white/50 font-light mt-0.5 leading-snug">Stel je trainingsdoel en gewenste frequentie in.</span>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white leading-tight">Dynamische Nulmeting</span>
                  <span className="text-xs text-white/50 font-light mt-0.5 leading-snug">Je allereerste training is direct de nulmeting.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={`flex flex-col gap-5 sm:gap-6 w-full text-left animate-fadeIn py-2 transition-all duration-300 ${isInputFocused ? 'mt-2 mb-auto' : 'my-auto'}`}>
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Stap 2</span>
              <h2 className="text-xl sm:text-2xl font-light text-white leading-tight">Wie ben je?</h2>
              <p className="text-xs sm:text-sm text-white/40 font-light leading-relaxed">Dit helpt de AI om je herstelbehoefte nauwkeurig te bepalen.</p>
            </div>

            <div className="flex flex-col gap-4 sm:gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1">Voornaam</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="bijv. Sander"
                    className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 text-sm text-white placeholder-white/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1 text-ellipsis overflow-hidden whitespace-nowrap">Leeftijd</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-2xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-sm text-white font-mono outline-none transition-all"
                    placeholder="jaar"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1 text-ellipsis overflow-hidden whitespace-nowrap">Gewicht</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-2xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-sm text-white font-mono outline-none transition-all"
                    placeholder="kg"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1 text-ellipsis overflow-hidden whitespace-nowrap">Lengte</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-2xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-sm text-white font-mono outline-none transition-all"
                    placeholder="cm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 sm:gap-6 w-full text-left animate-fadeIn my-auto py-2">
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Stap 3</span>
              <h2 className="text-xl sm:text-2xl font-light text-white leading-tight">Training & Ritme</h2>
              <p className="text-xs sm:text-sm text-white/40 font-light leading-relaxed">Stel je ervaring, trainingsfrequentie en fitnessdoel in.</p>
            </div>

            {/* Experience Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Trainingservaring
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
                  const label = level === 'beginner' ? 'Beginner' : level === 'intermediate' ? 'Gematigd' : 'Ervaren';
                  const desc = level === 'beginner' ? '0-1 jaar' : level === 'intermediate' ? '1-3 jaar' : '3+ jaar';
                  const isSelected = experienceLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperienceLevel(level)}
                      className={`p-4.5 sm:p-6 rounded-2xl border text-center transition-all flex flex-col justify-center items-center cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-white shadow-[0_0_10px_rgba(16,185,129,0.08)]'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold leading-tight">{label}</span>
                      <span className={`text-[9px] sm:text-[10px] ${isSelected ? 'text-emerald-400/80 font-medium' : 'opacity-60'} block mt-0.5 leading-none`}>{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-white/5 w-full shrink-0" />

            {/* Schedule Preference */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> Trainingsritme
              </label>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setFrequencyType('flexible')}
                  className={`p-4.5 sm:p-6 rounded-2xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                    frequencyType === 'flexible'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-white shadow-[0_0_10px_rgba(16,185,129,0.08)]'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold leading-tight">Flexibel</span>
                  <span className={`text-[9px] sm:text-[10px] ${frequencyType === 'flexible' ? 'text-emerald-400/80 font-medium' : 'opacity-60'} mt-0.5 leading-none`}>Aantal dagen per week</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFrequencyType('fixed')}
                  className={`p-4.5 sm:p-6 rounded-2xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                    frequencyType === 'fixed'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-white shadow-[0_0_10px_rgba(16,185,129,0.08)]'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold leading-tight">Vaste Dagen</span>
                  <span className={`text-[9px] sm:text-[10px] ${frequencyType === 'fixed' ? 'text-emerald-400/80 font-medium' : 'opacity-60'} mt-0.5 leading-none`}>Kies specifieke dagen</span>
                </button>
              </div>

              {frequencyType === 'flexible' ? (
                <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl flex flex-col gap-2 animate-fadeIn shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white/70">Hoeveel dagen per week train je?</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">{daysPerWeek} {daysPerWeek === 1 ? 'dag' : 'dagen'}</span>
                  </div>
                  <div className="px-1 mt-1 flex flex-col">
                    <input
                      type="range"
                      min="1"
                      max="7"
                      value={daysPerWeek}
                      onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[9px] text-white/30 px-1 mt-1 font-mono">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                      <span>6</span>
                      <span>7</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 p-2.5 sm:p-4 rounded-2xl flex flex-col gap-1.5 animate-fadeIn shadow-inner">
                  <span className="text-[10px] sm:text-xs text-white/60 font-semibold uppercase tracking-wider block">Kies je vaste dagen:</span>
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {[
                      { id: 1, label: 'Ma' },
                      { id: 2, label: 'Di' },
                      { id: 3, label: 'Wo' },
                      { id: 4, label: 'Do' },
                      { id: 5, label: 'Vr' },
                      { id: 6, label: 'Za' },
                      { id: 7, label: 'Zo' }
                    ].map(day => {
                      const isSelected = fixedDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => handleFixedDayToggle(day.id)}
                          className={`py-3.5 sm:py-5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500/55 text-white shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                              : 'bg-black/30 border-white/10 text-white/50 hover:border-white/20'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-white/5 w-full shrink-0" />

            {/* Session Duration Selection */}
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> Trainingsduur (Sessielengte)
              </label>
              
              <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl flex flex-col gap-2 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white/70">Hoe lang wil je per sessie trainen?</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">{duration} min.</span>
                </div>
                <div className="px-1 mt-1 flex flex-col">
                  <input
                    type="range"
                    min="30"
                    max="120"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[9px] text-white/30 px-1 mt-1 font-mono">
                    <span>30m</span>
                    <span>45m</span>
                    <span>60m</span>
                    <span>75m</span>
                    <span>90m</span>
                    <span>105m</span>
                    <span>120m</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full shrink-0" />

            {/* Goal Preference */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" /> Trainingsdoel (Focus)
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {[
                  { name: 'Spieropbouw & Hypertrofie', label: 'Spieropbouw', desc: '8-12 reps' },
                  { name: 'Maximale Kracht (Power)', label: 'Pure Kracht', desc: '3-5 reps' },
                  { name: 'Herstel & Vitaliteit', label: 'Herstel & Vital', desc: 'Licht volume' },
                  { name: 'Vetverlies & Conditie', label: 'Vetverlies/Cond.', desc: 'Hoge intensiteit' }
                ].map((g) => {
                  const isSelected = goal === g.name;
                  return (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => setGoal(g.name)}
                      className={`p-4.5 sm:p-6 rounded-2xl border text-left transition-all flex flex-col justify-center cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-white shadow-[0_0_10px_rgba(16,185,129,0.08)]'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold leading-tight">{g.label}</span>
                      <span className={`text-[9px] sm:text-[10px] ${isSelected ? 'text-emerald-400/80 font-medium' : 'opacity-60'} mt-0.5 leading-none block`}>{g.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-white/5 w-full shrink-0" />

            {/* Yoga Recovery Toggle */}
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-400" /> Rustdag Herstel (Yoga)
              </label>
              <button
                type="button"
                onClick={() => setRestDayYogaEnabled(!restDayYogaEnabled)}
                className={`p-4.5 sm:p-6 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                  restDayYogaEnabled
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-white shadow-[0_0_10px_rgba(16,185,129,0.08)]'
                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-bold leading-tight">Yoga op Rustdagen activeren</span>
                  <span className={`text-[9px] sm:text-[10px] ${restDayYogaEnabled ? 'text-emerald-400/80 font-medium' : 'opacity-60'} mt-0.5 leading-tight block`}>
                    Ontvang rekoefeningen & milde yoga sessies op je geplande rustdagen.
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                  restDayYogaEnabled ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-white/20'
                }`}>
                  {restDayYogaEnabled && <Check className="w-3 h-3" />}
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={`flex flex-col gap-4 sm:gap-5 w-full text-left animate-fadeIn py-2 transition-all duration-300 ${isInputFocused ? 'mt-2 mb-auto' : 'my-auto'}`}>
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Stap 4 van 4</span>
              <h2 className="text-xl sm:text-2xl font-light text-white leading-tight">Gevoelige plekken?</h2>
              <p className="text-xs sm:text-sm text-white/40 font-light leading-relaxed">De AI ontlast deze zones direct in je trainingsschema.</p>
            </div>

            {/* Pain point grid selection */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {[
                  { value: 'Knieën', label: '🩹 Knieën' },
                  { value: 'Onderrug', label: '🩹 Onderrug' },
                  { value: 'Schouders', label: '🩹 Schouders' },
                  { value: 'Nek', label: '🩹 Nek' },
                  { value: 'Polsen', label: '🩹 Polsen' },
                  { value: 'Ellebogen', label: '🩹 Ellebogen' }
                ].map(p => {
                  const isSelected = selectedPains.includes(p.value);
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handlePainToggle(p.value)}
                      className={`p-5.5 sm:p-7 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-500/10 border-red-500/30 text-white shadow-[0_0_8px_rgba(239,68,68,0.05)]'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-medium">{p.label}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        isSelected ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-white/20'
                       }`}>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom pain note input */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 px-1">Andere blessure (optioneel)</label>
                <input
                  type="text"
                  value={customPain}
                  onChange={(e) => setCustomPain(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder="Bijv. Tennisarm, peesontsteking links..."
                  className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-2xl px-4 py-3.5 sm:py-4.5 text-xs sm:text-sm text-white placeholder-white/20 outline-none transition-all font-light"
                />
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 sm:p-4 flex gap-3 items-start shrink-0">
                <Heart className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-white/60 leading-relaxed font-light">
                  Aura gebruikt dit om zwaar belastende oefeningen automatisch te vervangen voor veilige alternatieven.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <div className="absolute bottom-[108px] sm:bottom-[124px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-0.5 text-emerald-400/80 animate-bounce pointer-events-none bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-white/70">Scroll voor meer</span>
          <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      )}

      {/* Navigation Footer */}
      <div className="w-full max-w-md mx-auto flex gap-3 mt-auto pt-4 sm:pt-6 z-10 shrink-0">
        {step > 1 && (
          <button
            onClick={prevStep}
            className="flex-1 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Vorige
          </button>
        )}

        <button
          onClick={nextStep}
          className="flex-[2] py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border border-emerald-500/30 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
        >
          {step === totalSteps ? 'Aura Activeren' : 'Volgende'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
