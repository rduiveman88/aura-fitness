/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { WorkoutSession } from '../types';
import { TrendingUp, BarChart2, Calendar, FileText, ChevronDown, ChevronUp, Trash2, Award } from 'lucide-react';

interface LogbookProps {
  history: WorkoutSession[];
  onClearHistory: () => void;
  hasBaselineData: boolean;
  isRestDay?: boolean;
}

export default function Logbook({ history, onClearHistory, hasBaselineData, isRestDay }: LogbookProps) {
  const accentText = isRestDay ? 'text-sky-400' : 'text-emerald-400';
  const accentTextMuted = isRestDay ? 'text-sky-400/60' : 'text-emerald-400/60';
  const accentBg = isRestDay ? 'bg-sky-500/10' : 'bg-emerald-500/10';
  const accentBgActive = isRestDay ? 'bg-sky-500/20' : 'bg-emerald-500/20';
  const accentBorder = isRestDay ? 'border-sky-500/20' : 'border-emerald-500/20';
  const accentBorderActive = isRestDay ? 'border-sky-500/40' : 'border-emerald-500/40';
  const accentBtn = isRestDay ? 'bg-sky-500 text-black' : 'bg-emerald-500 text-black';

  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const toggleExpandSession = (idx: number) => {
    setExpandedSession(expandedSession === idx ? null : idx);
  };

  // Extract unique cycles and exercises to populate the chart dropdown filters
  const getFilterOptions = () => {
    const cycles = new Set<string>();
    const exercises = new Set<string>();

    history.forEach(s => {
      cycles.add(s.name);
      s.exercises.forEach(ex => exercises.add(ex.name));
    });

    return {
      cycles: Array.from(cycles),
      exercises: Array.from(exercises)
    };
  };

  const { cycles, exercises } = getFilterOptions();

  // Calculate total volume per muscle group across all history
  const getMuscleVolumeData = () => {
    const muscleVolume: Record<string, number> = {};
    const muscleSets: Record<string, number> = {};

    history.forEach(session => {
      session.exercises?.forEach(ex => {
        const muscle = ex.muscle || 'Overig';
        const volume = ex.exerciseVolume || 0;
        const setsCount = ex.sets?.length || 0;

        muscleVolume[muscle] = (muscleVolume[muscle] || 0) + volume;
        muscleSets[muscle] = (muscleSets[muscle] || 0) + setsCount;
      });
    });

    return Object.entries(muscleVolume).map(([name, volume]) => ({
      name,
      volume,
      sets: muscleSets[name] || 0
    })).sort((a, b) => b.volume - a.volume);
  };

  // Custom SVG line chart plotting logic
  const renderLineChart = () => {
    if (!Array.isArray(history) || history.length === 0) return null;

    // 1. Prepare chronologically ordered history points (oldest to newest)
    const chronHistory = [...history].reverse();
    const dataPoints: { date: string; val: number }[] = [];

    if (filterType === 'ALL') {
      chronHistory.forEach(s => {
        dataPoints.push({ date: s.date, val: s.totalSessionVolume || 0 });
      });
    } else if (filterType.startsWith('CYCLE|')) {
      const targetCycle = filterType.substring(6);
      chronHistory.forEach(s => {
        if (s.name === targetCycle) {
          dataPoints.push({ date: s.date, val: s.totalSessionVolume || 0 });
        }
      });
    } else if (filterType.startsWith('EX|')) {
      const targetEx = filterType.substring(3);
      chronHistory.forEach(s => {
        s.exercises.forEach(ex => {
          if (ex.name === targetEx) {
            dataPoints.push({ date: s.date, val: ex.topWeight || 0 });
          }
        });
      });
    }

    if (dataPoints.length === 0) {
      return (
        <div className="h-40 flex items-center justify-center text-xs text-white/30 italic">
          Geen datapunten gevonden voor dit filter.
        </div>
      );
    }

    // Chart dimensions
    const width = 500;
    const height = 150;
    const padding = 20;

    // Find max value for Y scaling
    const vals = dataPoints.map(d => d.val);
    const maxVal = Math.max(...vals, 100);
    const minVal = Math.min(...vals, 0);
    const valRange = maxVal - minVal;

    // Calculate coordinates for SVG paths
    const points = dataPoints.map((dp, idx) => {
      const x = padding + (idx / Math.max(1, dataPoints.length - 1)) * (width - padding * 2);
      const y = height - padding - ((dp.val - minVal) / Math.max(1, valRange)) * (height - padding * 2);
      return { x, y, date: dp.date, val: dp.val };
    });

    // Create line path string (cubic bezier smoothing)
    let pathD = '';
    if (points.length === 1) {
      pathD = `M ${points[0].x} ${points[0].y} L ${points[0].x + 1} ${points[0].y}`;
    } else if (points.length > 1) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const cpX1 = points[i].x + (points[i + 1].x - points[i].x) / 3;
        const cpY1 = points[i].y;
        const cpX2 = points[i].x + 2 * (points[i + 1].x - points[i].x) / 3;
        const cpY2 = points[i + 1].y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
      }
    }

    // Create area path under line (for gradient fill)
    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div className="w-full flex flex-col gap-2">
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-auto ${isRestDay ? 'text-sky-400' : 'text-emerald-400'} overflow-visible`}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isRestDay ? '#38bdf8' : '#34d399'} stopOpacity="0.4" />
              <stop offset="100%" stopColor={isRestDay ? '#38bdf8' : '#34d399'} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

          {/* Area under the line */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* Smooth bezier line */}
          {pathD && <path d={pathD} fill="none" stroke={isRestDay ? '#0ea5e9' : '#10b981'} strokeWidth="2.5" strokeLinecap="round" />}

          {/* Interactive node circles with text labels */}
          {points.map((p, idx) => (
            <g key={idx} className="group/node cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                className={`fill-white ${isRestDay ? 'stroke-sky-400' : 'stroke-emerald-400'} stroke-2 hover:r-6 hover:stroke-white transition-all`}
              />
              {/* Value Tooltip Overlay (displays on group hover) */}
              <g className="opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none">
                <rect
                  x={p.x - 25}
                  y={p.y - 28}
                  width="50"
                  height="18"
                  rx="4"
                  fill="rgba(5,5,5,0.95)"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                />
                <text
                  x={p.x}
                  y={p.y - 16}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="8"
                  fontWeight="bold"
                  className="font-mono"
                >
                  {Math.round(p.val)}
                </text>
              </g>
              {/* Date label at bottom of chart */}
              {(idx === 0 || idx === points.length - 1 || points.length <= 5) && (
                <text
                  x={p.x}
                  y={height - 4}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.3)"
                  fontSize="7.5"
                  fontWeight="bold"
                >
                  {p.date}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // 3. Global wipe reset data
  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn pb-6">
      {/* Page Title */}
      <div className="flex flex-col gap-1 px-1">
        <span className={`text-[10px] ${accentText} uppercase tracking-[0.3em] font-bold`}>
          Historie
        </span>
        <h2 className="text-xl font-light text-gradient leading-tight">
          Jouw Logboek.
        </h2>
      </div>

      {/* 1. Dynamic SVG Line Chart Card */}
      {Array.isArray(history) && history.length > 0 && (
        <div className={`bg-white/5 border ${isRestDay ? 'border-sky-500/10' : 'border-white/10'} rounded-3xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden`}>
          <div className={`absolute top-0 left-0 w-32 h-32 ${isRestDay ? 'bg-sky-500/5' : 'bg-emerald-500/5'} rounded-full filter blur-3xl pointer-events-none`} />
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-1.5">
              <TrendingUp className={`w-4 h-4 ${accentText}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Progressie
              </span>
            </div>
            
            {/* Filter Dropdown */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-black/60 border border-white/10 text-[10px] font-bold text-white rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Alles (Totale Volume)</option>
              {cycles.length > 0 && (
                <optgroup label="Per Cyclus (Volume)">
                  {cycles.map((cyc, idx) => (
                    <option key={`cyc-${idx}`} value={`CYCLE|${cyc}`}>
                      {cyc}
                    </option>
                  ))}
                </optgroup>
              )}
              {exercises.length > 0 && (
                <optgroup label="Per Oefening (Max PR)">
                  {exercises.map((ex, idx) => (
                    <option key={`ex-${idx}`} value={`EX|${ex}`}>
                      {ex}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* SVG Canvas stage */}
          <div className="relative z-10 w-full min-h-[150px]">
            {renderLineChart()}
          </div>
        </div>
      )}

      {/* 1.5. Muscle Group Volume Distribution (Groei #1) */}
      {Array.isArray(history) && history.length > 0 && (() => {
        const data = getMuscleVolumeData();
        if (data.length === 0) return null;
        
        const maxVol = Math.max(...data.map(d => d.volume), 1);
        
        return (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart2 className={`w-4 h-4 ${accentText}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Volume per Spiergroep (Groei #1)
              </span>
            </div>
            
            <p className="text-xs text-white/50 mb-4 font-light leading-relaxed">
              Het totale opgebouwde volume (sets × reps × gewicht) per spiergroep. Richt op een gebalanceerde verdeling voor optimale spiergroei!
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.map((m, idx) => {
                const pct = (m.volume / maxVol) * 100;
                return (
                  <div key={idx} className="bg-black/20 rounded-2xl p-3.5 border border-white/[0.03] flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white/90">{m.name}</span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
                        <span>{m.sets} sets</span>
                        <span>•</span>
                        <span className={`font-bold ${accentText}`}>{Math.round(m.volume).toLocaleString()} kg</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${isRestDay ? 'from-sky-500 to-sky-400' : 'from-emerald-500 to-emerald-400'} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 2. Historic List Logbook */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Trainingsgeschiedenis
        </span>

        {!Array.isArray(history) || history.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center flex flex-col items-center justify-center shadow-xl">
            <FileText className="w-12 h-12 text-white/20 mb-3" />
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
              Nog geen logs gevonden. 🏋️‍♂️
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((session, idx) => {
              const isExpanded = expandedSession === idx;
              return (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/[0.07] transition-all cursor-pointer shadow-md"
                  onClick={() => toggleExpandSession(idx)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-gradient tracking-tight">
                        {session.name}
                      </h4>
                      <span className="text-[9px] text-white/30 tracking-widest uppercase font-mono block mt-1">
                        {session.date}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-xs font-mono font-bold ${accentText}`}>
                          {(session.totalSessionVolume || 0).toLocaleString()} kg
                        </p>
                        <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-0.5 block">
                          VOLUME
                        </span>
                      </div>
                      
                      <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-white/10 transition-colors border border-white/5">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandable exercises list details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3 animate-fadeIn">
                      {session.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="bg-black/20 rounded-2xl p-3 border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-white/90">
                              {ex.name}
                            </span>
                            <div className="flex gap-1.5">
                              <span className={`text-[8px] uppercase tracking-widest ${isRestDay ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} px-2 py-0.5 rounded-full border font-bold`}>
                                {ex.intensity || 'Perfect'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Sets results */}
                          <div className="flex flex-wrap gap-2">
                            {ex.sets.map((set, sIdx) => (
                              <div
                                key={sIdx}
                                className="bg-white/5 border border-white/5 rounded-xl px-2 py-1 flex items-center gap-1 text-[10px] font-mono font-medium text-white/60"
                              >
                                <span className={accentText}>{sIdx + 1}:</span>
                                <span>{set.w}kg × {set.r}</span>
                              </div>
                            ))}
                            <div className={`ml-auto flex items-center gap-1 text-[9px] uppercase tracking-wider ${isRestDay ? 'text-sky-300 bg-sky-500/5 border-sky-500/10' : 'text-emerald-300 bg-emerald-500/5 border-emerald-500/10'} px-2 py-1 rounded-xl border`}>
                              <Award className="w-3.5 h-3.5" /> Top: {ex.topWeight}kg
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Global wipe reset data */}
      {(history.length > 0 || hasBaselineData) && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center flex items-center justify-center shadow-md mt-4">
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-1.5 mx-auto text-xs text-red-400/60 hover:text-red-400 uppercase tracking-widest font-semibold transition-colors active:scale-95"
            >
              <Trash2 className="w-4 h-4" /> Reset Trainingsgeschiedenis
            </button>
          ) : (
            <div className="flex flex-col gap-3 w-full items-center">
              <span className="text-[11px] text-red-400 uppercase tracking-wider font-bold">
                ⚠️ Weet je dit heel zeker? Al je geschiedenis, nulmeting en grafieken worden gewist. Je start weer vanaf 0.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClearHistory();
                    setShowConfirmReset(false);
                  }}
                  className="bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold uppercase tracking-widest px-4.5 py-2.5 rounded-xl hover:bg-red-500/30 transition-all active:scale-95"
                >
                  Ja, wis alles
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest px-4.5 py-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
