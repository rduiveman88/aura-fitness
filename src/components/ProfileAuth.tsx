/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, User, Lock, ArrowRight, Activity, Award, Calendar, Dumbbell, ShieldCheck } from 'lucide-react';
import { UserModel, BaselineData, WorkoutSession } from '../types';
import { AuraLogo } from './AuraLogo';

export interface UserProfile {
  id: string;
  username: string;
  password?: string;
  userModel: UserModel;
  baselineData: BaselineData | null;
  history: WorkoutSession[];
  exercisePrefs: { likes: string[]; dislikes: string[]; painNotes: string[] };
  steps: number;
  lastSync: string | null;
  nextSession: string;
  activeWorkoutData: any[] | null;
  createdAt: string;
}

interface ProfileAuthProps {
  onLoginSuccess: (profile: UserProfile) => void;
  isRestDay?: boolean;
}

// Hash a password using SHA-256 via Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const isSecureContext = typeof window !== 'undefined' && 
                          typeof window.crypto !== 'undefined' && 
                          typeof window.crypto.subtle !== 'undefined';
  
  if (isSecureContext) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn("Crypto API failed, falling back to simple hash:", e);
    }
  }

  // Fallback hash for non-secure contexts (like HTTP on local IP via phone)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'local_' + Math.abs(hash).toString(16) + '_' + password.length;
}

export default function ProfileAuth({ onLoginSuccess, isRestDay }: ProfileAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Hypertrofie');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedUsernames, setSavedUsernames] = useState<{ id: string; username: string }[]>([]);

  const accentColor = isRestDay ? 'text-sky-400' : 'text-emerald-400';
  const accentBorder = isRestDay ? 'border-sky-500/20' : 'border-emerald-500/20';
  const accentBg = isRestDay ? 'bg-sky-500/10' : 'bg-emerald-500/10';
  const accentBtn = isRestDay 
    ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-black shadow-[0_0_20px_rgba(56,189,248,0.3)]' 
    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)]';

  // Load registered profiles from backend or local storage for quick switcher list
  useEffect(() => {
    async function loadSavedProfiles() {
      try {
        const response = await fetch('/api/auth/profiles');
        if (response.ok) {
          const profiles = await response.json();
          setSavedUsernames(profiles);
        } else {
          // Fallback to local storage profiles list
          const local = localStorage.getItem('aura_local_profiles');
          if (local) {
            const parsed = JSON.parse(local) as UserProfile[];
            setSavedUsernames(parsed.map(p => ({ id: p.id, username: p.username })));
          }
        }
      } catch (err) {
        console.log("Offline mode profiles read:", err);
        const local = localStorage.getItem('aura_local_profiles');
        if (local) {
          const parsed = JSON.parse(local) as UserProfile[];
          setSavedUsernames(parsed.map(p => ({ id: p.id, username: p.username })));
        }
      }
    }
    loadSavedProfiles();
  }, []);

  const handleQuickSelect = (u: string) => {
    setUsername(u);
    setErrorMsg(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Vul alle velden in!");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (activeTab === 'login') {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword })
        });

        if (response.ok) {
          const profile: UserProfile = await response.json();
          onLoginSuccess(profile);
        } else {
          const errData = await response.json();
          // Fallback to client-side login if API returns 404 or fails
          await handleLocalLogin(trimmedUsername, trimmedPassword, errData.message || "Inloggen mislukt.");
        }
      } catch (err) {
        console.log("Authentication server connection error, attempting local authentication:", err);
        await handleLocalLogin(trimmedUsername, trimmedPassword, "Kan geen verbinding maken met de server.");
      }
    } else {
      // Register
      if (!name.trim()) {
        setErrorMsg("Vul je naam in!");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: trimmedUsername,
            password: trimmedPassword,
            name: name.trim(),
            goal: goal
          })
        });

        if (response.ok) {
          const profile: UserProfile = await response.json();
          // Add to local list of usernames
          if (!savedUsernames.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
            setSavedUsernames(prev => [...prev, { id: profile.id, username: profile.username }]);
          }
          onLoginSuccess(profile);
        } else {
          const errData = await response.json();
          // Fallback to client-side registration if API returns error
          await handleLocalRegister(trimmedUsername, trimmedPassword, name.trim(), goal, errData.message || "Registratie mislukt.");
        }
      } catch (err) {
        console.log("Authentication server connection error, attempting local registration:", err);
        await handleLocalRegister(trimmedUsername, trimmedPassword, name.trim(), goal, "Kan geen verbinding maken met de server.");
      }
    }
  };

  // Client-side authentication logic fallback for fully resilient offline operation
  const handleLocalLogin = async (u: string, p: string, serverError: string) => {
    try {
      const local = localStorage.getItem('aura_local_profiles');
      if (local) {
        const profiles = JSON.parse(local) as UserProfile[];
        const hashedInput = await hashPassword(p);
        const match = profiles.find(prof => prof.username.toLowerCase() === u.toLowerCase() && (prof.password === hashedInput || prof.password === p));
        if (match) {
          console.log("Local authentication successful for:", u);
          onLoginSuccess(match);
          return;
        }
      }
      setErrorMsg(serverError || "Onjuiste gebruikersnaam of wachtwoord.");
    } catch {
      setErrorMsg("Systeemfout bij lokaal inloggen.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocalRegister = async (u: string, p: string, fullName: string, trainingGoal: string, serverError: string) => {
    try {
      const local = localStorage.getItem('aura_local_profiles');
      let profiles: UserProfile[] = local ? JSON.parse(local) : [];

      if (profiles.some(prof => prof.username.toLowerCase() === u.toLowerCase())) {
        setErrorMsg("Deze gebruikersnaam is lokaal al in gebruik.");
        setLoading(false);
        return;
      }

      const hashedPassword = await hashPassword(p);

      // Create local profile record
      const newProfile: UserProfile = {
        id: "local_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        username: u,
        password: hashedPassword,
        userModel: {
          name: fullName,
          age: 30,
          weight: 75.0,
          goal: trainingGoal,
          daysPerWeek: 4,
          duration: 60,
          equipment: ["Barbell", "Dumbbells", "Flat Bench", "Squat Rack", "Cable Station"],
          apiKey: ""
        },
        baselineData: null,
        history: [],
        exercisePrefs: { likes: [], dislikes: [], painNotes: [] },
        steps: 0,
        lastSync: null,
        nextSession: "Upper Body Focus",
        activeWorkoutData: null,
        createdAt: new Date().toISOString()
      };

      profiles.push(newProfile);
      localStorage.setItem('aura_local_profiles', JSON.stringify(profiles));
      console.log("Local registration successful for:", u);
      onLoginSuccess(newProfile);
    } catch {
      setErrorMsg("Systeemfout bij lokale registratie.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      // Premium mock profile for Google Sign-In simulation
      const mockGoogleProfile: UserProfile = {
        id: "google_mock_user_102938",
        username: "richard.google",
        userModel: {
          name: "Richard",
          age: 30,
          weight: 75,
          height: 180,
          goal: "Spieropbouw & Hypertrofie",
          daysPerWeek: 3,
          duration: 60,
          equipment: ["Barbell", "Dumbbells", "Flat Bench", "Incline Bench", "Squat Rack", "Smith Machine", "Cable Station", "Leg Press Machine", "Lat Pulldown Machine", "Pec Deck / Fly Machine", "Pullup Bar", "Dip Station", "EZ-Bar", "Bands", "Exercise Ball", "Medicine Ball", "Preacher Curl Bench", "Chest Press Machine", "Shoulder Press Machine", "Row Machine", "Assisted Pullup / Dip Machine", "Hack Squat Machine", "Leg Extension Machine", "Leg Curl Machine", "Calf Machine"],
          apiKey: "",
          restDayYogaEnabled: true,
          splitPreference: 'auto'
        },
        baselineData: null,
        history: [],
        exercisePrefs: { likes: [], dislikes: [], painNotes: [] },
        steps: 0,
        lastSync: null,
        nextSession: new Date().toISOString(),
        activeWorkoutData: null,
        createdAt: new Date().toISOString()
      };

      try {
        const local = localStorage.getItem('aura_local_profiles');
        let parsed: UserProfile[] = [];
        if (local) {
          parsed = JSON.parse(local);
        }
        if (!parsed.some(p => p.username === mockGoogleProfile.username)) {
          parsed.push(mockGoogleProfile);
          localStorage.setItem('aura_local_profiles', JSON.stringify(parsed));
        }
      } catch (e) {
        console.warn("Error saving mock Google profile:", e);
      }

      setLoading(false);
      onLoginSuccess(mockGoogleProfile);
    }, 1000);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 sm:pt-[calc(1.5rem+env(safe-area-inset-top))] flex flex-col items-center justify-between relative select-none overflow-hidden z-50">
      {/* Background ambient glowing lights */}
      <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 ${isRestDay ? 'bg-sky-600/10' : 'bg-emerald-600/10'} rounded-full filter blur-[120px] pointer-events-none z-0`} />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full filter blur-[120px] pointer-events-none z-0" />

      <div className="my-auto w-full max-w-md flex flex-col items-center py-2 sm:py-6 z-10 overflow-hidden">
        {/* Main branding */}
        <div className="text-center mb-4 sm:mb-8 shrink-0 animate-fadeIn">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <AuraLogo className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" isRestDay={isRestDay} /> AURA Fitness
          </h1>
          <p className={`text-[10px] ${accentColor} font-bold uppercase tracking-[0.3em] mt-1.5`}>
            MULTIPLE USER PROFILE GATEWAY
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-lg shadow-2xl relative animate-scaleUp overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 mb-3 sm:mb-6">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            className={`flex-1 pb-2.5 text-sm font-semibold tracking-wide border-b-2 transition-all ${
              activeTab === 'login' 
                ? isRestDay ? 'border-sky-400 text-sky-400' : 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            Inloggen
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            className={`flex-1 pb-2.5 text-sm font-semibold tracking-wide border-b-2 transition-all ${
              activeTab === 'register' 
                ? isRestDay ? 'border-sky-400 text-sky-400' : 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            Registreren
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-3 sm:mb-5 p-3 bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-xl flex items-center gap-2 animate-shake">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <p className="font-light">{errorMsg}</p>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs text-white/50 uppercase tracking-widest font-semibold ml-1 block">Gebruikersnaam</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Type je gebruikersnaam..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 sm:py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-all font-light"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs text-white/50 uppercase tracking-widest font-semibold ml-1 block">Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-white/30" />
              <input
                type="password"
                placeholder="Voer je wachtwoord in..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 sm:py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-all font-light"
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs text-white/50 uppercase tracking-widest font-semibold ml-1 block">Voornaam</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Hoe mogen we je noemen?"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 sm:py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-all font-light"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 sm:py-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 mt-4 sm:mt-6 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer ${accentBtn}`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{activeTab === 'login' ? 'Meld je aan' : 'Profiel aanmaken'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="px-3 text-[9px] text-white/30 uppercase tracking-widest font-bold">of</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="w-full py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Doorgaan met Google</span>
        </button>

        {/* Quick profiles selector */}
        {savedUsernames.length > 0 && activeTab === 'login' && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/5 space-y-2">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block text-center">Geregistreerde profielen</span>
            <div className="flex flex-wrap gap-2 justify-center">
              {savedUsernames.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickSelect(u.username)}
                  className={`px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 text-xs text-white/80 transition-all flex items-center gap-1.5 ${
                    username === u.username ? isRestDay ? 'border-sky-500/40 text-sky-300 bg-sky-500/5' : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/5' : ''
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 opacity-50" />
                  <span>{u.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 sm:mt-8 text-center shrink-0 text-white/30 font-light flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span className="text-[9px] tracking-wide uppercase">Beveiligde lokale & cloud profielen</span>
      </div>
      </div>
    </div>
  );
}
