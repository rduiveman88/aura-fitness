/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserModel } from '../types';
import { User, Dumbbell, Shield, Save, Settings, Info, ThumbsDown, ThumbsUp, X, Award, ShieldAlert, Check, LogOut, Calendar, TrendingUp, Hash } from 'lucide-react';

interface SettingsProps {
  userModel: UserModel;
  onSave: (updated: UserModel) => void;
  onClose: () => void;
  isRestDay?: boolean;
  currentProfile?: any;
  onLogOut?: () => void;
  history?: any[];
}

const equipmentOptions = [
  // Vrije gewichten & Basics
  { value: "Barbell", label: "Barbell & Plates", image: "/equipment/barbell.jpg" },
  { value: "Dumbbells", label: "Dumbbells", image: "/equipment/dumbbells.jpg" },
  { value: "Kettlebells", label: "Kettlebells", image: "/equipment/kettlebells.jpg" },
  { value: "EZ-Bar", label: "EZ-Curl Bar", image: "/equipment/ez_bar.jpg" },
  { value: "Bands", label: "Weerstandsbanden (Bands)", image: "/equipment/bands.jpg" },

  // Benches & Racks
  { value: "Flat Bench", label: "Flat Bench", image: "/equipment/flat_bench.jpg" },
  { value: "Incline Bench", label: "Incline Bench", image: "/equipment/incline_bench.jpg" },
  { value: "Squat Rack", label: "Squat Rack", image: "/equipment/squat_rack.jpg" },
  { value: "Smith Machine", label: "Smith Machine", image: "/equipment/smith_machine.jpg" },
  { value: "Preacher Curl Bench", label: "Preacher Bench", image: "/equipment/preacher_bench.jpg" },

  // Kabels & Bovenlichaam Machines
  { value: "Cable Station", label: "Cable Station (Pulleys)", image: "/equipment/cable_station.jpg" },
  { value: "Lat Pulldown Machine", label: "Lat Pulldown Machine", image: "/equipment/lat_pulldown.jpg" },
  { value: "Pec Deck / Fly Machine", label: "Pec Deck / Fly Machine", image: "/equipment/pec_deck.jpg" },
  { value: "Chest Press Machine", label: "Chest Press Machine", image: "/equipment/chest_press.jpg" },
  { value: "Shoulder Press Machine", label: "Shoulder Press Machine", image: "/equipment/shoulder_press_machine.jpg" },
  { value: "Row Machine", label: "Row Machine (Seated)", image: "/equipment/row_machine.jpg" },
  { value: "Assisted Pullup / Dip Machine", label: "Assisted Pull-up & Dip", image: "/equipment/assisted_machine.jpg" },
  { value: "Pullup Bar", label: "Pullup Bar", image: "/equipment/pullup_bar.jpg" },
  { value: "Dip Station", label: "Dip Station", image: "/equipment/dip_station.jpg" },

  // Leg Machines
  { value: "Leg Press Machine", label: "Leg Press Machine", image: "/equipment/leg_press.jpg" },
  { value: "Hack Squat Machine", label: "Hack Squat Machine", image: "/equipment/hack_squat.jpg" },
  { value: "Leg Extension Machine", label: "Leg Extension Machine", image: "/equipment/leg_extension.jpg" },
  { value: "Leg Curl Machine", label: "Leg Curl Machine", image: "/equipment/leg_curl.jpg" },
  { value: "Calf Machine", label: "Calf Machine", image: "/equipment/calf_machine.jpg" },
  { value: "Abductor / Adductor Machine", label: "Hip Abductor / Adductor", image: "/equipment/hip_machine.jpg" },

  // Stabiliteit & Core
  { value: "Exercise Ball", label: "Fitnessbal (Swiss Ball)", image: "/equipment/exercise_ball.jpg" },
  { value: "Medicine Ball", label: "Medicijnbal (Slam Ball)", image: "/equipment/medicine_ball.jpg" },
  { value: "Ab Crunch Machine", label: "Ab Crunch Machine", image: "/equipment/ab_crunch.jpg" },
  { value: "Bodyweight Alleen", label: "Bodyweight (Matje)", image: "/equipment/yoga_mat.jpg" }
];

export default function SettingsPage({ userModel, onSave, onClose, isRestDay, currentProfile, onLogOut, history = [] }: SettingsProps) {
  const accentText = isRestDay ? 'text-sky-400' : 'text-emerald-400';
  const accentTextMuted = isRestDay ? 'text-sky-400/60' : 'text-emerald-400/60';
  const accentBg = isRestDay ? 'bg-sky-500/10' : 'bg-emerald-500/10';
  const accentBgActive = isRestDay ? 'bg-sky-500/20' : 'bg-emerald-500/20';
  const accentBorder = isRestDay ? 'border-sky-500/20' : 'border-emerald-500/20';
  const accentBorderActive = isRestDay ? 'border-sky-500/40' : 'border-emerald-500/40';
  const accentBtn = isRestDay ? 'bg-sky-500 text-black' : 'bg-emerald-500 text-black';

  const [name, setName] = useState(userModel.name);
  const [age, setAge] = useState<number | ''>(userModel.age);
  const [weight, setWeight] = useState<number | ''>(userModel.weight);
  const [goal, setGoal] = useState(userModel.goal);
  const [daysPerWeek, setDaysPerWeek] = useState(userModel.daysPerWeek);
  const [duration, setDuration] = useState(userModel.duration);
  const [equipment, setEquipment] = useState<string[]>(userModel.equipment);
  const [restDayYogaEnabled, setRestDayYogaEnabled] = useState<boolean>(userModel.restDayYogaEnabled !== false);
  const [splitPreference, setSplitPreference] = useState<'auto' | 'fullbody' | 'upperlower' | 'ppl' | 'bro'>(userModel.splitPreference || 'auto');
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('aura_backend_url') || '');
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  useEffect(() => {
    if (showEquipmentModal) {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.style.overflow = 'hidden';
      }
      document.body.style.overflow = 'hidden';
    } else {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.style.overflow = '';
      }
      document.body.style.overflow = '';
    }
    return () => {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.style.overflow = '';
      }
      document.body.style.overflow = '';
    };
  }, [showEquipmentModal]);

  const [frequencyType, setFrequencyType] = useState<'flexible' | 'fixed'>(
    Array.isArray(userModel.fixedDays) && userModel.fixedDays.length > 0 ? 'fixed' : 'flexible'
  );
  const [fixedDays, setFixedDays] = useState<number[]>(
    Array.isArray(userModel.fixedDays) ? userModel.fixedDays.map(Number) : []
  );

  const handleFixedDayToggle = (dayId: number) => {
    let updated: number[];
    if (fixedDays.includes(dayId)) {
      updated = fixedDays.filter(d => d !== dayId);
    } else {
      updated = [...fixedDays, dayId];
    }
    setFixedDays(updated);
    if (updated.length > 0) {
      setDaysPerWeek(updated.length);
    } else {
      setDaysPerWeek(1);
    }
  };

  const [newPainNote, setNewPainNote] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [prefs, setPrefs] = useState<{ likes: string[]; dislikes: string[]; painNotes: string[] }>(() => {
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
  });

  const handleRemoveDislike = (exName: string) => {
    const updated = {
      ...prefs,
      dislikes: prefs.dislikes.filter(name => name !== exName)
    };
    setPrefs(updated);
    localStorage.setItem('aura_exercise_prefs', JSON.stringify(updated));
  };

  const handleRemoveLike = (exName: string) => {
    const updated = {
      ...prefs,
      likes: prefs.likes.filter(name => name !== exName)
    };
    setPrefs(updated);
    localStorage.setItem('aura_exercise_prefs', JSON.stringify(updated));
  };

  const handleRemovePainNote = (noteToRemove: string) => {
    const updated = {
      ...prefs,
      painNotes: (prefs.painNotes || []).filter(note => note !== noteToRemove)
    };
    setPrefs(updated);
    localStorage.setItem('aura_exercise_prefs', JSON.stringify(updated));
  };

  const handleAddPainNote = () => {
    if (!newPainNote.trim()) return;
    const note = newPainNote.trim();
    if ((prefs.painNotes || []).includes(note)) {
      setNewPainNote('');
      return;
    }
    const updated = {
      ...prefs,
      painNotes: [...(prefs.painNotes || []), note]
    };
    setPrefs(updated);
    localStorage.setItem('aura_exercise_prefs', JSON.stringify(updated));
    setNewPainNote('');
  };

  const handlePainNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPainNote();
    }
  };

  const handleClearAllPrefs = () => {
    const updated = { likes: [], dislikes: [], painNotes: [] };
    setPrefs(updated);
    localStorage.setItem('aura_exercise_prefs', JSON.stringify(updated));
  };

  const getRecommendedSplit = (days: number) => {
    if (days <= 3) return "Full Body";
    if (days === 4) return "Upper / Lower";
    if (days === 5) return "De Bro Split";
    return "Push / Pull / Legs";
  };

  const handleEquipmentToggle = (value: string) => {
    if (equipment.includes(value)) {
      setEquipment(equipment.filter(e => e !== value));
    } else {
      setEquipment([...equipment, value]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Voer een geldige naam in!");
      return;
    }
    if (age === '' || isNaN(Number(age)) || Number(age) <= 0) {
      alert("Voer een geldige leeftijd in!");
      return;
    }
    if (weight === '' || isNaN(Number(weight)) || Number(weight) <= 0) {
      alert("Voer een geldig gewicht in!");
      return;
    }

    onSave({
      name,
      age: Number(age),
      weight: Number(weight),
      goal,
      daysPerWeek,
      duration,
      equipment: equipment.length > 0 ? equipment : ["Bodyweight Alleen"],
      apiKey: "",
      fixedDays: frequencyType === 'fixed' ? fixedDays : undefined,
      restDayYogaEnabled,
      splitPreference
    });

    localStorage.setItem('aura_backend_url', backendUrl);
    alert("✅ Instellingen en biometrische gegevens opgeslagen!");
    onClose();
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn pb-2">
      {/* Page Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] ${accentText} uppercase tracking-[0.3em] font-bold`}>
            Instellingen
          </span>
          <h2 className="text-xl font-light text-gradient leading-tight">
            Jouw Profiel.
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] uppercase tracking-widest px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all active:scale-95"
        >
          Sluiten
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {currentProfile && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-white/40" /> Jouw Profiel & Statistieken
            </span>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
              
              <div className="flex flex-col gap-1.5 z-10">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${accentText} bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full font-bold tracking-widest uppercase`}>
                    {currentProfile.username}
                  </span>
                  <span className="text-[10px] font-mono text-white/30 tracking-wider">
                    ID: {currentProfile.id}
                  </span>
                </div>
                
                <p className="text-xs font-light text-white/55 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 opacity-60" /> Geregistreerd op: {new Date(currentProfile.createdAt || Date.now()).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                <div className="flex gap-4 mt-1">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-white/40 block font-semibold">Workouts</span>
                    <span className="text-base font-extrabold text-white font-mono">{history?.length || 0}</span>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 block font-semibold">Totaal Volume</span>
                    <span className="text-base font-extrabold text-white font-mono">
                      {(Array.isArray(history) ? history.reduce((sum, s) => sum + (s.totalSessionVolume || 0), 0) : 0).toLocaleString('nl-NL')} kg
                    </span>
                  </div>
                </div>
              </div>

              {onLogOut && (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  {!showLogoutConfirm ? (
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 cursor-pointer z-10 shrink-0"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Uitloggen</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-1.5 rounded-xl">
                      <span className="text-[10px] text-red-200 uppercase tracking-wider font-bold px-2">Zeker weten?</span>
                      <button
                        onClick={() => {
                          setShowLogoutConfirm(false);
                          onLogOut();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                      >
                        Ja, Log Uit
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                      >
                        Annuleer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1. Biometrics Section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Jouw Biometrie
          </span>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[9px] uppercase tracking-widest text-white/50 mb-1 block font-bold">
                  Naam
                </label>
                <input
                  type="text"
                  placeholder="Je naam"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`w-full bg-black/35 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none ${isRestDay ? 'focus:border-sky-500/50' : 'focus:border-emerald-500/50'}`}
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] uppercase tracking-widest text-white/50 mb-1 block font-bold">
                  Leeftijd
                </label>
                <input
                  type="number"
                  placeholder="Jaren"
                  value={age}
                  onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full bg-black/35 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none ${isRestDay ? 'focus:border-sky-500/50' : 'focus:border-emerald-500/50'}`}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[9px] uppercase tracking-widest text-white/50 mb-1 block font-bold">
                  Gewicht (kg)
                </label>
                <input
                  type="number"
                  placeholder="kg"
                  value={weight}
                  onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full bg-black/35 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none ${isRestDay ? 'focus:border-sky-500/50' : 'focus:border-emerald-500/50'} animate-none`}
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] uppercase tracking-widest text-white/50 mb-1 block font-bold">
                  Primaire Doel
                </label>
                <select
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  className={`w-full bg-black/35 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${isRestDay ? 'focus:border-sky-500/50' : 'focus:border-emerald-500/50'} cursor-pointer`}
                >
                  <option value="Hypertrofie">Spieropbouw (Hypertrofie)</option>
                  <option value="Kracht">Pure Kracht (Powerlifting)</option>
                  <option value="Vetverlies">Vetverlies (Cutten)</option>
                  <option value="Conditie">Conditie / Uithouding</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Coach Parameters Section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> Coach Parameters
          </span>

          <div className={`bg-white/5 border ${isRestDay ? 'border-sky-500/20' : 'border-emerald-500/20'} rounded-3xl p-5 flex flex-col gap-5 shadow-xl backdrop-blur-md relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${isRestDay ? 'bg-sky-500/5' : 'bg-emerald-500/5'} rounded-full filter blur-2xl pointer-events-none`} />
            
            {/* Planning Type Choice */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/80 mb-2 block font-semibold">
                Type Planning
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  id="btn-settings-freq-flexible"
                  type="button"
                  onClick={() => {
                    setFrequencyType('flexible');
                    setFixedDays([]);
                  }}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-0.5 ${
                    frequencyType === 'flexible'
                      ? `${accentBg} ${accentBorderActive} ${accentText}`
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  <span>Flexibel</span>
                  <span className="text-[9px] font-normal text-white/40 font-sans">Aantal dagen p/w</span>
                </button>
                <button
                  id="btn-settings-freq-fixed"
                  type="button"
                  onClick={() => {
                    setFrequencyType('fixed');
                    if (fixedDays.length === 0) {
                      setFixedDays([1, 3, 5]); // Default Mon, Wed, Fri
                      setDaysPerWeek(3);
                    }
                  }}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-0.5 ${
                    frequencyType === 'fixed'
                      ? `${accentBg} ${accentBorderActive} ${accentText}`
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  <span>Vaste Dagen</span>
                  <span className="text-[9px] font-normal text-white/40 font-sans">Specifieke weekdagen</span>
                </button>
              </div>
            </div>

            {frequencyType === 'flexible' ? (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/80 mb-2 block font-semibold">
                  Dagen per week trainen
                </label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={daysPerWeek}
                  onChange={e => setDaysPerWeek(Number(e.target.value))}
                  className={`w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer ${isRestDay ? 'accent-sky-400' : 'accent-emerald-400'}`}
                />
                <div className="flex justify-between text-[9px] text-white/40 mt-1 px-0.5">
                  <span>2 dagen</span>
                  <span className={`${accentText} font-bold text-xs`}>
                    {daysPerWeek} dagen
                  </span>
                  <span>6 dagen</span>
                </div>
                <div className={`mt-2 text-center ${isRestDay ? 'bg-sky-500/5 border-sky-500/10' : 'bg-emerald-500/5 border-emerald-500/10'} py-1 px-3 rounded-xl border`}>
                  <span className="text-[9px] uppercase tracking-widest text-white/50">Aura Split advies: </span>
                  <span className={`text-xs font-semibold ${isRestDay ? 'text-sky-300' : 'text-emerald-300'}`}>
                    {getRecommendedSplit(daysPerWeek)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 animate-fadeIn">
                <label className="text-[10px] uppercase tracking-widest text-white/80 mb-1 block font-semibold">
                  Kies je trainingsdagen
                </label>
                <div className="grid grid-cols-7 gap-1">
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
                        id={`btn-settings-fixed-${day.id}`}
                        key={day.id}
                        type="button"
                        onClick={() => handleFixedDayToggle(day.id)}
                        className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                          isSelected
                            ? `${accentBg} ${accentBorderActive} ${accentText}`
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[9px] text-white/30 italic mt-1 text-center">
                  Geselecteerd: {daysPerWeek} dagen per week. Advies: {getRecommendedSplit(daysPerWeek)}
                </span>
              </div>
            )}

            {/* Preferred workout split override */}
            <div className="pt-4 border-t border-white/5">
              <label className="text-[10px] uppercase tracking-widest text-white/80 mb-2 block font-semibold">
                Geprefereerde Trainingssplit
              </label>
              <select
                value={splitPreference}
                onChange={e => setSplitPreference(e.target.value as any)}
                className={`w-full bg-black/35 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${isRestDay ? 'focus:border-sky-500/50' : 'focus:border-emerald-500/50'} cursor-pointer`}
              >
                <option value="auto">Automatisch (Aura aanbeveling: {getRecommendedSplit(daysPerWeek)})</option>
                <option value="fullbody">Full Body Focus</option>
                <option value="upperlower">Upper / Lower Focus</option>
                <option value="ppl">Push / Pull / Legs Focus</option>
                <option value="bro">De Bro Split Focus</option>
              </select>
            </div>

            {/* Target workout duration range */}
            <div className="pt-4 border-t border-white/5">
              <label className="text-[10px] uppercase tracking-widest text-white/80 mb-2 block font-semibold">
                Beschikbare Tijd in Gym
              </label>
              <input
                type="range"
                min="30"
                max="120"
                step="15"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className={`w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer ${isRestDay ? 'accent-sky-400' : 'accent-emerald-400'}`}
              />
              <div className="flex justify-between text-[9px] text-white/40 mt-1 px-0.5">
                <span>30m</span>
                <span className={`${accentText} font-bold text-xs`}>
                  {duration} minuten
                </span>
                <span>120m</span>
              </div>
            </div>

            {/* Rest Day Yoga Setting */}
            <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-white/80 mb-1 block font-semibold">
                Rustdag Activiteit
              </label>
              <button
                type="button"
                onClick={() => setRestDayYogaEnabled(!restDayYogaEnabled)}
                className={`py-3 px-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                  restDayYogaEnabled
                    ? `${accentBg} ${accentBorderActive} text-white`
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col pr-4">
                  <span className="text-xs font-bold">Actief herstel met Yoga</span>
                  <span className="text-[9px] text-white/40 leading-relaxed font-light mt-0.5">
                    Laat Aura yoga/stretching genereren op rustdagen. Schakel dit uit om op rustdagen alleen de inzicht-tekst te tonen.
                  </span>
                </div>
                <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                  restDayYogaEnabled ? `${isRestDay ? 'bg-sky-400/20 border-sky-400 text-sky-400' : 'bg-emerald-400/20 border-emerald-400 text-emerald-400'}` : 'border-white/20'
                }`}>
                  {restDayYogaEnabled && <Check className="w-2.5 h-2.5" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Available Gym Equipment checklists */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> Beschikbare Apparatuur
          </span>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className={`text-[9px] uppercase tracking-widest ${accentText} font-bold`}>
                  Jouw Fitnessmateriaal:
                </span>
                <p className="text-sm font-bold text-white truncate">
                  {equipment.length === 0
                    ? "Geen (Alleen Bodyweight)"
                    : equipment.length === equipmentOptions.length
                    ? "Volledige Gym (Alle apparatuur)"
                    : `${equipment.length} ${equipment.length === 1 ? 'apparaat' : 'apparaten'} geselecteerd`}
                </p>
                <p className="text-[10px] text-white/50 truncate font-light leading-relaxed">
                  {equipment.length === 0
                    ? "Workouts worden afgestemd op trainen met je eigen lichaamsgewicht."
                    : equipmentOptions
                        .filter(opt => equipment.includes(opt.value))
                        .map(opt => opt.label)
                        .join(", ")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEquipmentModal(true)}
                className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] shrink-0 ${
                  isRestDay
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                }`}
              >
                Aanpassen
              </button>
            </div>
          </div>
        </div>
        {/* 4. API Key integration & Server Connection */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Verbinding & Beveiliging
          </span>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col gap-4">
            <div>
              <div className="flex gap-2 items-center text-blue-300 mb-2">
                <Settings className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  AURA Server Connectie (Voor Mobiel)
                </span>
              </div>
              <p className="text-[11px] text-white/50 mb-3 leading-relaxed font-light">
                Als je de app op een fysieke telefoon test, vul hier dan het IP-adres van je computer in (bijv. <code>http://192.168.1.50:3000</code>) om verbinding te maken met de Express-server.
              </p>
              <input
                type="text"
                placeholder="http://192.168.x.x:3000..."
                value={backendUrl}
                onChange={e => setBackendUrl(e.target.value)}
                className={`w-full bg-black/35 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none ${isRestDay ? 'focus:border-sky-500/50' : 'focus:border-emerald-500/50'} font-mono`}
              />
            </div>
          </div>
        </div>        {/* 5. Likes and Dislikes Management Section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1 flex items-center gap-1.5">
            <ThumbsDown className="w-3.5 h-3.5" /> Voorkeuren & Feedback
          </span>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col gap-4">
            <div>
              <span className={`text-[10px] uppercase tracking-widest ${accentText} font-bold block mb-1`}>
                Wat gebeurt er met dislikes?
              </span>
              <p className="text-[11px] text-white/50 leading-relaxed font-light">
                Als je een oefening een duim omlaag geeft, wordt deze direct vervangen door een andere oefening voor dezelfde spiergroep. De oefening wordt opgeslagen in je dislikes zodat de AI of offline generator deze in de toekomst niet meer selecteert voor je trainingen.
              </p>
            </div>

            {/* Disliked list */}
            <div className="border-t border-white/5 pt-3">
              <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold block mb-2">
                Uitgesloten Oefeningen ({prefs.dislikes.length})
              </span>
              {prefs.dislikes.length === 0 ? (
                <p className="text-[11px] text-white/30 italic">
                  Geen uitgesloten oefeningen. Geef oefeningen een duim omlaag in de workout om ze hier te tonen.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {prefs.dislikes.map(exName => (
                    <div
                      key={exName}
                      className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-2.5 py-1.5 rounded-xl"
                    >
                      <span>{exName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDislike(exName)}
                        className="text-red-400 hover:text-red-200 transition-colors p-0.5"
                        title="Herstellen (ongedaan maken)"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Liked list */}
            <div className="border-t border-white/5 pt-3">
              <span className={`text-[10px] uppercase tracking-widest ${accentText} font-bold block mb-2`}>
                Favoriete Oefeningen ({prefs.likes.length})
              </span>
              {prefs.likes.length === 0 ? (
                <p className="text-[11px] text-white/30 italic">
                  Geen favoriete oefeningen. Geef oefeningen een duim omhoog in de workout om ze hier te tonen.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {prefs.likes.map(exName => (
                    <div
                      key={exName}
                      className={`inline-flex items-center gap-1.5 ${isRestDay ? 'bg-sky-500/10 border-sky-500/20 text-sky-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'} text-xs px-2.5 py-1.5 rounded-xl`}
                    >
                      <span>{exName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLike(exName)}
                        className={`${isRestDay ? 'text-sky-400 hover:text-sky-200' : 'text-emerald-400 hover:text-emerald-200'} transition-colors p-0.5`}
                        title="Verwijderen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(prefs.dislikes.length > 0 || prefs.likes.length > 0) && (
              <button
                type="button"
                onClick={handleClearAllPrefs}
                className="text-center text-[10px] uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors mt-2 self-start border-b border-dashed border-white/10 hover:border-red-400/30 pb-0.5"
              >
                Reset alle voorkeuren
              </button>
            )}
          </div>
        </div>

        {/* 5b. Pijnpunten & Blessures Section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Pijnpunten & Blessures
          </span>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col gap-4">
            <div>
              <span className={`text-[10px] uppercase tracking-widest ${accentText} font-bold block mb-1`}>
                Blessures & Gevoelige Zones
              </span>
              <p className="text-[11px] text-white/50 leading-relaxed font-light">
                Voeg specifieke gewrichten, spieren of pijnpunten toe waar we rekening mee moeten houden. De AI-coach past je workouts aan om deze gebieden te beschermen.
              </p>
            </div>

            {/* Input to add pain notes */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Bijv. Onderrug, Linkerknie..."
                value={newPainNote}
                onChange={e => setNewPainNote(e.target.value)}
                onKeyDown={handlePainNoteKeyDown}
                className={`flex-1 bg-black/35 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none ${isRestDay ? 'focus:border-sky-500/50' : 'focus:border-emerald-500/50'}`}
              />
              <button
                type="button"
                onClick={handleAddPainNote}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${isRestDay ? 'bg-sky-500/10 border-sky-500/20 text-sky-300 hover:bg-sky-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20'}`}
              >
                Voeg toe
              </button>
            </div>

            {/* Pain notes list */}
            <div className="border-t border-white/5 pt-3">
              <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold block mb-2">
                Gemelde Pijnpunten ({prefs.painNotes.length})
              </span>
              {prefs.painNotes.length === 0 ? (
                <p className="text-[11px] text-white/30 italic">
                  Geen actieve pijnpunten of blessures gemeld. Typ een pijnpunt hierboven en klik op toevoegen om deze hier te tonen.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {prefs.painNotes.map(note => (
                    <div
                      key={note}
                      className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-2.5 py-1.5 rounded-xl"
                    >
                      <span>{note}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePainNote(note)}
                        className="text-red-400 hover:text-red-200 transition-colors p-0.5"
                        title="Verwijderen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Save Button CTA */}
        <button
          onClick={handleSave}
          className={`w-full py-4.5 bg-gradient-to-r ${isRestDay ? 'from-sky-950/30 to-sky-600/30 border border-sky-500/30 text-sky-100 shadow-[0_0_20px_rgba(14,165,233,0.1)]' : 'from-emerald-950/30 to-emerald-600/30 border border-emerald-500/30 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]'} text-xs font-bold uppercase tracking-[0.2em] rounded-3xl active:scale-[0.99] transition-all flex items-center justify-center gap-2`}
        >
          <Save className={`w-4 h-4 ${isRestDay ? 'text-sky-400' : 'text-emerald-400'}`} /> Opslaan & Toepassen
        </button>
      </div>

      {/* Available Gym Equipment Selector Modal */}
      {showEquipmentModal && createPortal(
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#0c0d12] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="border-b border-white/5 p-5 flex items-center justify-between bg-black/25 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isRestDay ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Selecteer Beschikbare Apparatuur</h3>
                  <p className="text-[10px] sm:text-[11px] text-white/50">Vink aan wat je kunt gebruiken zodat we je schema perfect kunnen opbouwen.</p>
                </div>
              </div>
              <button
                onClick={() => setShowEquipmentModal(false)}
                className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick selectors: Select All / Clear All */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-white/5 bg-white/[0.01] shrink-0">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                {equipment.length} van de {equipmentOptions.length} geselecteerd
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEquipment(equipmentOptions.map(opt => opt.value))}
                  className="text-[11px] text-white/60 hover:text-white font-medium transition-colors"
                >
                  Alles Selecteren
                </button>
                <span className="text-white/20 text-xs">|</span>
                <button
                  type="button"
                  onClick={() => setEquipment([])}
                  className="text-[11px] text-white/60 hover:text-white font-medium transition-colors"
                >
                  Alles Deselecteren
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable List) */}
            <div className="p-6 flex-1 overflow-y-auto min-h-0 no-scrollbar flex flex-col gap-2.5 bg-black/15">
              {equipmentOptions.map(opt => {
                const isSelected = equipment.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleEquipmentToggle(opt.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleEquipmentToggle(opt.value);
                      }
                    }}
                    className={`group flex items-center gap-4 p-3.5 rounded-2xl border transition-all active:scale-[0.99] duration-300 cursor-pointer ${
                      isSelected
                        ? isRestDay
                          ? 'border-sky-500/50 bg-sky-500/[0.03] shadow-[0_0_15px_rgba(56,189,248,0.05)]'
                          : 'border-emerald-500/50 bg-emerald-500/[0.03] shadow-[0_0_15px_rgba(52,211,153,0.05)]'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Left Thumbnail Image */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative bg-black/40 border border-white/5">
                      <img 
                        src={opt.image} 
                        alt={opt.label}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </div>

                    {/* Middle Title / Label */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs sm:text-sm font-bold leading-snug transition-colors ${
                        isSelected 
                          ? isRestDay 
                            ? 'text-sky-300' 
                            : 'text-emerald-300'
                          : 'text-white/80 group-hover:text-white'
                      }`}>
                        {opt.label}
                      </span>
                    </div>

                    {/* Right Checkbox Badge */}
                    <div className="shrink-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isSelected
                          ? isRestDay
                            ? 'bg-sky-500 border-sky-400 text-black scale-105'
                            : 'bg-emerald-500 border-emerald-400 text-black scale-105'
                          : 'border-white/20 bg-white/5 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/5 p-4 flex justify-end bg-black/25 shrink-0">
              <button
                type="button"
                onClick={() => setShowEquipmentModal(false)}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.99] ${
                  isRestDay
                    ? 'bg-sky-500 text-black hover:bg-sky-400'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400'
                }`}
              >
                Selectie Bevestigen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
